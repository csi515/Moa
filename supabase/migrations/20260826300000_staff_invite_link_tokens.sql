-- Staff invite link tokens: shareable deep links (SNS / QR) for account connection
-- Complements email-based staff_invitations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS core.staff_link_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  staff_id        UUID NOT NULL REFERENCES core.staff(id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,
  expires_at      TIMESTAMPTZ,
  max_uses        INT NOT NULL DEFAULT 1,
  used_count      INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'revoked', 'exhausted')),
  created_by      UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_staff_link_tokens_org
  ON core.staff_link_tokens(organization_id, staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_link_tokens_hash
  ON core.staff_link_tokens(token_hash) WHERE status = 'active';

ALTER TABLE core.staff_link_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_link_tokens_admin ON core.staff_link_tokens
  FOR ALL TO authenticated
  USING (core.is_org_admin(organization_id))
  WITH CHECK (core.is_org_admin(organization_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON core.staff_link_tokens TO authenticated;

-- =============================================
-- Create invite link token for a staff member
-- =============================================
CREATE OR REPLACE FUNCTION core.create_staff_invite_link_token(
  p_org_id UUID,
  p_staff_id UUID,
  p_expires_days INT DEFAULT 14
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_staff RECORD;
  v_org_name TEXT;
  v_token TEXT;
  v_hash TEXT;
  v_id UUID;
  v_expires TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS NULL OR NOT core.is_org_admin(p_org_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  SELECT s.*, o.name AS org_name
  INTO v_staff
  FROM core.staff s
  JOIN core.organizations o ON o.id = s.organization_id
  WHERE s.id = p_staff_id AND s.organization_id = p_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff not found';
  END IF;

  IF COALESCE(v_staff.status, 'active') <> 'active' THEN
    RAISE EXCEPTION 'Inactive or resigned staff cannot receive invite links';
  END IF;

  IF v_staff.user_id IS NOT NULL THEN
    RAISE EXCEPTION 'Staff account is already connected';
  END IF;

  v_org_name := v_staff.org_name;
  v_token := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  v_hash := encode(digest(v_token, 'sha256'), 'hex');
  v_expires := now() + make_interval(days => GREATEST(p_expires_days, 1));

  UPDATE core.staff_link_tokens
  SET status = 'revoked'
  WHERE organization_id = p_org_id
    AND staff_id = p_staff_id
    AND status = 'active';

  INSERT INTO core.staff_link_tokens (
    organization_id, staff_id, token_hash, expires_at, max_uses, created_by, metadata
  )
  VALUES (
    p_org_id,
    p_staff_id,
    v_hash,
    v_expires,
    1,
    auth.uid(),
    jsonb_build_object(
      'staff_name', v_staff.name,
      'organization_name', v_org_name,
      'source', 'staff_invite'
    )
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'id', v_id,
    'token', v_token,
    'staff_id', p_staff_id,
    'staff_name', v_staff.name,
    'organization_id', p_org_id,
    'organization_name', v_org_name,
    'expires_at', v_expires
  );
END;
$$;

-- =============================================
-- Redeem invite link (authenticated user)
-- =============================================
CREATE OR REPLACE FUNCTION core.redeem_staff_invite_link_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_user_id UUID;
  v_hash TEXT;
  v_row RECORD;
  v_staff RECORD;
  v_member_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_token IS NULL OR trim(p_token) = '' THEN
    RAISE EXCEPTION 'Invalid token';
  END IF;

  v_hash := encode(digest(upper(trim(p_token)), 'sha256'), 'hex');

  SELECT *
  INTO v_row
  FROM core.staff_link_tokens
  WHERE token_hash = v_hash
    AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite link';
  END IF;

  IF v_row.expires_at IS NOT NULL AND v_row.expires_at < now() THEN
    UPDATE core.staff_link_tokens SET status = 'revoked' WHERE id = v_row.id;
    RAISE EXCEPTION 'Invite link has expired';
  END IF;

  IF v_row.used_count >= v_row.max_uses THEN
    UPDATE core.staff_link_tokens SET status = 'exhausted' WHERE id = v_row.id;
    RAISE EXCEPTION 'Invite link has already been used';
  END IF;

  SELECT * INTO v_staff
  FROM core.staff
  WHERE id = v_row.staff_id AND organization_id = v_row.organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff record not found';
  END IF;

  IF COALESCE(v_staff.status, 'active') <> 'active' THEN
    RAISE EXCEPTION 'This staff invitation is no longer active';
  END IF;

  IF v_staff.user_id IS NOT NULL AND v_staff.user_id <> v_user_id THEN
    RAISE EXCEPTION 'This staff account is already linked to another user';
  END IF;

  UPDATE core.staff
  SET user_id = v_user_id,
      updated_at = now()
  WHERE id = v_row.staff_id;

  INSERT INTO core.organization_members (organization_id, user_id, role, staff_id, is_active)
  VALUES (v_row.organization_id, v_user_id, 'staff', v_row.staff_id, true)
  ON CONFLICT (organization_id, user_id)
  DO UPDATE SET
    role = 'staff',
    staff_id = EXCLUDED.staff_id,
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_member_id;

  UPDATE core.staff_invitations
  SET status = 'accepted', accepted_at = now()
  WHERE organization_id = v_row.organization_id
    AND staff_id = v_row.staff_id
    AND status = 'pending';

  UPDATE core.staff_link_tokens
  SET used_count = used_count + 1,
      status = CASE WHEN used_count + 1 >= max_uses THEN 'exhausted' ELSE status END,
      accepted_at = now()
  WHERE id = v_row.id;

  RETURN jsonb_build_object(
    'success', true,
    'staff_id', v_row.staff_id,
    'staff_name', v_staff.name,
    'organization_id', v_row.organization_id,
    'organization_name', COALESCE(v_row.metadata->>'organization_name', ''),
    'member_id', v_member_id
  );
END;
$$;

-- =============================================
-- Revoke invite link token (admin)
-- =============================================
CREATE OR REPLACE FUNCTION core.revoke_staff_invite_link_token(
  p_org_id UUID,
  p_token_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT core.is_org_admin(p_org_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  UPDATE core.staff_link_tokens
  SET status = 'revoked'
  WHERE id = p_token_id
    AND organization_id = p_org_id
    AND status = 'active';

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION core.create_staff_invite_link_token(UUID, UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION core.redeem_staff_invite_link_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION core.revoke_staff_invite_link_token(UUID, UUID) TO authenticated;

-- Extend invite_staff_member: auto-create link token on pending invite
CREATE OR REPLACE FUNCTION core.invite_staff_member(
  p_org_id UUID,
  p_staff_id UUID,
  p_email TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_email TEXT;
  v_staff RECORD;
  v_org_name TEXT;
  v_profile_id UUID;
  v_member_id UUID;
  v_invitation_id UUID;
  v_link JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT core.is_org_admin(p_org_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  v_email := lower(trim(p_email));
  IF v_email = '' OR v_email NOT LIKE '%@%' THEN
    RAISE EXCEPTION 'Valid email is required';
  END IF;

  SELECT s.*, o.name AS org_name
  INTO v_staff
  FROM core.staff s
  JOIN core.organizations o ON o.id = s.organization_id
  WHERE s.id = p_staff_id AND s.organization_id = p_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff not found';
  END IF;

  IF COALESCE(v_staff.status, 'active') <> 'active' THEN
    RAISE EXCEPTION 'Inactive or resigned staff cannot be invited. Set status to active first.';
  END IF;

  v_org_name := v_staff.org_name;

  UPDATE core.staff
  SET email = v_email, updated_at = now()
  WHERE id = p_staff_id;

  IF v_staff.user_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'connected',
      'staff_id', p_staff_id,
      'user_id', v_staff.user_id,
      'organization_name', v_org_name,
      'link_code', NULL
    );
  END IF;

  SELECT id INTO v_profile_id
  FROM core.profiles
  WHERE lower(email) = v_email
  LIMIT 1;

  IF v_profile_id IS NOT NULL THEN
    UPDATE core.staff
    SET user_id = v_profile_id, updated_at = now()
    WHERE id = p_staff_id;

    INSERT INTO core.organization_members (organization_id, user_id, role, staff_id, is_active)
    VALUES (p_org_id, v_profile_id, 'staff', p_staff_id, true)
    ON CONFLICT (organization_id, user_id)
    DO UPDATE SET
      role = EXCLUDED.role,
      staff_id = EXCLUDED.staff_id,
      is_active = true,
      updated_at = now()
    RETURNING id INTO v_member_id;

    UPDATE core.staff_invitations
    SET status = 'accepted', accepted_at = now()
    WHERE organization_id = p_org_id AND staff_id = p_staff_id;

    RETURN jsonb_build_object(
      'status', 'connected',
      'staff_id', p_staff_id,
      'user_id', v_profile_id,
      'member_id', v_member_id,
      'organization_name', v_org_name,
      'link_code', NULL
    );
  END IF;

  INSERT INTO core.staff_invitations (
    organization_id, staff_id, email, role, invited_by, status
  )
  VALUES (p_org_id, p_staff_id, v_email, 'staff', auth.uid(), 'pending')
  ON CONFLICT (organization_id, staff_id)
  DO UPDATE SET
    email = EXCLUDED.email,
    status = 'pending',
    invited_by = EXCLUDED.invited_by,
    accepted_at = NULL
  RETURNING id INTO v_invitation_id;

  v_link := core.create_staff_invite_link_token(p_org_id, p_staff_id, 14);

  RETURN jsonb_build_object(
    'status', 'invited',
    'staff_id', p_staff_id,
    'invitation_id', v_invitation_id,
    'email', v_email,
    'organization_name', v_org_name,
    'link_code', v_link
  );
END;
$$;
