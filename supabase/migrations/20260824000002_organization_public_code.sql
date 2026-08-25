-- Organization 공개 업체 코드 (상담 QR / 공개 URL 식별 전용, 인증 수단 아님)

ALTER TABLE core.organizations
  ADD COLUMN IF NOT EXISTS public_code TEXT;

-- 혼동 문자 제외: 0/O, 1/I/l
CREATE OR REPLACE FUNCTION core.generate_organization_public_code(p_length INT DEFAULT 10)
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = core, public
AS $$
DECLARE
  v_chars CONSTANT TEXT := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  v_result TEXT := '';
  v_i INT;
  v_idx INT;
BEGIN
  IF p_length < 8 OR p_length > 16 THEN
    RAISE EXCEPTION 'public code length must be between 8 and 16';
  END IF;

  FOR v_i IN 1..p_length LOOP
    v_idx := floor(random() * length(v_chars))::INT + 1;
    v_result := v_result || substr(v_chars, v_idx, 1);
  END LOOP;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION core.generate_unique_organization_public_code(p_length INT DEFAULT 10)
RETURNS TEXT
LANGUAGE plpgsql
VOLATILE
SET search_path = core, public
AS $$
DECLARE
  v_code TEXT;
  v_attempt INT := 0;
BEGIN
  LOOP
    v_code := core.generate_organization_public_code(p_length);
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM core.organizations WHERE public_code = v_code
    );
    v_attempt := v_attempt + 1;
    IF v_attempt >= 32 THEN
      RAISE EXCEPTION 'Unable to generate unique organization public code';
    END IF;
  END LOOP;
  RETURN v_code;
END;
$$;

-- 기존 Organization 백필
DO $$
DECLARE
  v_row RECORD;
  v_code TEXT;
BEGIN
  FOR v_row IN SELECT id FROM core.organizations WHERE public_code IS NULL LOOP
    v_code := core.generate_unique_organization_public_code(10);
    UPDATE core.organizations SET public_code = v_code WHERE id = v_row.id;
  END LOOP;
END;
$$;

ALTER TABLE core.organizations
  ALTER COLUMN public_code SET NOT NULL;

ALTER TABLE core.organizations
  DROP CONSTRAINT IF EXISTS organizations_public_code_format;

ALTER TABLE core.organizations
  ADD CONSTRAINT organizations_public_code_format
  CHECK (public_code ~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8,16}$');

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_public_code
  ON core.organizations (public_code);

-- 생성 시 public_code 자동 부여 (UUID primary key와 분리)
CREATE OR REPLACE FUNCTION core.create_organization(
  p_name TEXT,
  p_industry_type TEXT DEFAULT 'piano',
  p_slug TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_org_id UUID;
  v_public_code TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_public_code := core.generate_unique_organization_public_code(10);

  INSERT INTO core.organizations (name, industry_type, slug, public_code)
  VALUES (p_name, p_industry_type, p_slug, v_public_code)
  RETURNING id INTO v_org_id;

  INSERT INTO core.organization_members (organization_id, user_id, role)
  VALUES (v_org_id, auth.uid(), 'owner');

  RETURN v_org_id;
END;
$$;

-- 원장/관리자: 업체 코드 변경 (DB 유일성 검증)
CREATE OR REPLACE FUNCTION core.update_organization_public_code(
  p_organization_id UUID,
  p_public_code TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_normalized TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  IF NOT core.is_org_owner_or_admin(p_organization_id) THEN
    RETURN jsonb_build_object('error', 'forbidden');
  END IF;

  v_normalized := upper(trim(p_public_code));

  IF v_normalized !~ '^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8,16}$' THEN
    RETURN jsonb_build_object('error', 'invalid_format');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM core.organizations
    WHERE public_code = v_normalized
      AND id <> p_organization_id
  ) THEN
    RETURN jsonb_build_object('error', 'already_taken');
  END IF;

  UPDATE core.organizations
  SET public_code = v_normalized, updated_at = now()
  WHERE id = p_organization_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  RETURN jsonb_build_object('success', true, 'publicCode', v_normalized);
END;
$$;

GRANT EXECUTE ON FUNCTION core.generate_organization_public_code(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION core.generate_unique_organization_public_code(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION core.update_organization_public_code(UUID, TEXT) TO authenticated;

-- 상담 예약 RPC: slug → public_code
CREATE OR REPLACE FUNCTION core.public_get_consultation_booking_context(p_public_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = core, public
AS $$
DECLARE
  v_org core.organizations%ROWTYPE;
  v_settings JSONB;
  v_booked JSONB;
  v_code TEXT;
BEGIN
  v_code := upper(trim(p_public_code));

  SELECT * INTO v_org
  FROM core.organizations
  WHERE public_code = v_code AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  v_settings := COALESCE(v_org.settings->'consultationBooking', '{}'::jsonb);

  IF NOT COALESCE((v_settings->>'enabled')::boolean, false) THEN
    RETURN jsonb_build_object('error', 'disabled');
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object('date', preferred_date, 'time', preferred_time)
      ORDER BY preferred_date, preferred_time
    ),
    '[]'::jsonb
  )
  INTO v_booked
  FROM core.consultation_booking_requests
  WHERE organization_id = v_org.id
    AND status IN ('pending', 'confirmed')
    AND preferred_date >= CURRENT_DATE;

  RETURN jsonb_build_object(
    'organizationId', v_org.id,
    'organizationName', v_org.name,
    'publicCode', v_org.public_code,
    'settings', v_settings,
    'bookedSlots', v_booked
  );
END;
$$;

CREATE OR REPLACE FUNCTION core.public_submit_consultation_booking(
  p_public_code TEXT,
  p_name TEXT,
  p_phone TEXT,
  p_content TEXT,
  p_date DATE,
  p_time TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_org core.organizations%ROWTYPE;
  v_settings JSONB;
  v_id UUID;
  v_code TEXT;
BEGIN
  IF length(trim(p_name)) < 1 OR length(trim(p_phone)) < 8 OR length(trim(p_content)) < 1 THEN
    RETURN jsonb_build_object('error', 'invalid_input');
  END IF;

  IF p_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('error', 'past_date');
  END IF;

  v_code := upper(trim(p_public_code));

  SELECT * INTO v_org
  FROM core.organizations
  WHERE public_code = v_code AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  v_settings := COALESCE(v_org.settings->'consultationBooking', '{}'::jsonb);

  IF NOT COALESCE((v_settings->>'enabled')::boolean, false) THEN
    RETURN jsonb_build_object('error', 'disabled');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM core.consultation_booking_requests
    WHERE organization_id = v_org.id
      AND preferred_date = p_date
      AND preferred_time = p_time
      AND status IN ('pending', 'confirmed')
  ) THEN
    RETURN jsonb_build_object('error', 'slot_taken');
  END IF;

  INSERT INTO core.consultation_booking_requests (
    organization_id, name, phone, content, preferred_date, preferred_time
  )
  VALUES (
    v_org.id,
    trim(p_name),
    trim(p_phone),
    trim(p_content),
    p_date,
    p_time
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

GRANT EXECUTE ON FUNCTION core.public_get_consultation_booking_context(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION core.public_submit_consultation_booking(TEXT, TEXT, TEXT, TEXT, DATE, TEXT) TO anon, authenticated;
