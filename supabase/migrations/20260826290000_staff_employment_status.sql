-- Staff employment status: sync staff.status with organization_members.is_active
-- Records are preserved; inactive/resigned staff lose login access only.

CREATE OR REPLACE FUNCTION core.update_staff_employment_status(
  p_org_id UUID,
  p_staff_id UUID,
  p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_staff RECORD;
  v_membership_active BOOLEAN;
BEGIN
  IF auth.uid() IS NULL OR NOT core.is_org_admin(p_org_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF p_status NOT IN ('active', 'inactive', 'resigned') THEN
    RAISE EXCEPTION 'Invalid status. Use active, inactive, or resigned.';
  END IF;

  SELECT * INTO v_staff
  FROM core.staff
  WHERE id = p_staff_id AND organization_id = p_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff not found';
  END IF;

  v_membership_active := (p_status = 'active');

  UPDATE core.staff
  SET status = p_status, updated_at = now()
  WHERE id = p_staff_id;

  IF v_staff.user_id IS NOT NULL THEN
    UPDATE core.organization_members
    SET is_active = v_membership_active, updated_at = now()
    WHERE organization_id = p_org_id
      AND user_id = v_staff.user_id
      AND staff_id = p_staff_id;
  END IF;

  IF p_status IN ('inactive', 'resigned') THEN
    UPDATE core.staff_invitations
    SET status = 'revoked'
    WHERE organization_id = p_org_id
      AND staff_id = p_staff_id
      AND status = 'pending';
  END IF;

  RETURN jsonb_build_object(
    'staff_id', p_staff_id,
    'status', p_status,
    'membership_active', v_membership_active
  );
END;
$$;

GRANT EXECUTE ON FUNCTION core.update_staff_employment_status(UUID, UUID, TEXT) TO authenticated;

-- Only connect active staff on login
CREATE OR REPLACE FUNCTION core.connect_staff_on_login()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_user_id UUID;
  v_email TEXT;
  v_inv RECORD;
  v_staff_status TEXT;
  v_connected INT := 0;
  v_results JSONB := '[]'::JSONB;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT email INTO v_email FROM core.profiles WHERE id = v_user_id;
  IF v_email IS NULL OR trim(v_email) = '' THEN
    RETURN jsonb_build_object('connected', 0, 'memberships', v_results);
  END IF;

  FOR v_inv IN
    SELECT si.*
    FROM core.staff_invitations si
    JOIN core.staff s ON s.id = si.staff_id AND s.organization_id = si.organization_id
    WHERE lower(si.email) = lower(v_email)
      AND si.status = 'pending'
      AND COALESCE(s.status, 'active') = 'active'
  LOOP
    SELECT status INTO v_staff_status
    FROM core.staff
    WHERE id = v_inv.staff_id AND organization_id = v_inv.organization_id;

    IF COALESCE(v_staff_status, 'active') <> 'active' THEN
      CONTINUE;
    END IF;

    UPDATE core.staff
    SET user_id = v_user_id, updated_at = now()
    WHERE id = v_inv.staff_id AND organization_id = v_inv.organization_id;

    INSERT INTO core.organization_members (organization_id, user_id, role, staff_id, is_active)
    VALUES (v_inv.organization_id, v_user_id, v_inv.role, v_inv.staff_id, true)
    ON CONFLICT (organization_id, user_id)
    DO UPDATE SET
      role = EXCLUDED.role,
      staff_id = EXCLUDED.staff_id,
      is_active = true,
      updated_at = now();

    UPDATE core.staff_invitations
    SET status = 'accepted', accepted_at = now()
    WHERE id = v_inv.id;

    v_connected := v_connected + 1;
    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'organization_id', v_inv.organization_id,
        'staff_id', v_inv.staff_id
      )
    );
  END LOOP;

  RETURN jsonb_build_object('connected', v_connected, 'memberships', v_results);
END;
$$;

-- Block invite for non-active staff
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
  v_profile_id UUID;
  v_member_id UUID;
  v_invitation_id UUID;
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

  SELECT * INTO v_staff
  FROM core.staff
  WHERE id = p_staff_id AND organization_id = p_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff not found';
  END IF;

  IF COALESCE(v_staff.status, 'active') <> 'active' THEN
    RAISE EXCEPTION 'Inactive or resigned staff cannot be invited. Set status to active first.';
  END IF;

  UPDATE core.staff
  SET email = v_email, updated_at = now()
  WHERE id = p_staff_id;

  IF v_staff.user_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status', 'connected',
      'staff_id', p_staff_id,
      'user_id', v_staff.user_id
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
      'member_id', v_member_id
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

  RETURN jsonb_build_object(
    'status', 'invited',
    'staff_id', p_staff_id,
    'invitation_id', v_invitation_id,
    'email', v_email
  );
END;
$$;
