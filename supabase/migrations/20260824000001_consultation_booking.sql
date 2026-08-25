-- 공개 상담 예약 (QR 랜딩) 코어 기능

CREATE TABLE core.consultation_booking_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  content         TEXT NOT NULL,
  preferred_date  DATE NOT NULL,
  preferred_time  TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending',
  admin_memo      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT consultation_booking_requests_status_check
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'))
);

CREATE INDEX idx_consultation_booking_requests_org
  ON core.consultation_booking_requests(organization_id);

CREATE INDEX idx_consultation_booking_requests_org_date
  ON core.consultation_booking_requests(organization_id, preferred_date);

CREATE TRIGGER set_consultation_booking_requests_updated_at
  BEFORE UPDATE ON core.consultation_booking_requests
  FOR EACH ROW EXECUTE FUNCTION core.set_updated_at();

ALTER TABLE core.consultation_booking_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY consultation_booking_requests_select ON core.consultation_booking_requests
  FOR SELECT TO authenticated
  USING (core.is_org_member(organization_id));

CREATE POLICY consultation_booking_requests_insert ON core.consultation_booking_requests
  FOR INSERT TO authenticated
  WITH CHECK (core.is_org_member(organization_id));

CREATE POLICY consultation_booking_requests_update ON core.consultation_booking_requests
  FOR UPDATE TO authenticated
  USING (core.is_org_member(organization_id))
  WITH CHECK (core.is_org_member(organization_id));

CREATE POLICY consultation_booking_requests_delete ON core.consultation_booking_requests
  FOR DELETE TO authenticated
  USING (core.is_org_admin(organization_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON core.consultation_booking_requests TO authenticated;

-- 공개 페이지: slug로 예약 컨텍스트 조회
CREATE OR REPLACE FUNCTION core.public_get_consultation_booking_context(p_slug TEXT)
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
BEGIN
  SELECT * INTO v_org
  FROM core.organizations
  WHERE slug = p_slug AND is_active = true;

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
    'settings', v_settings,
    'bookedSlots', v_booked
  );
END;
$$;

-- 공개 페이지: 상담 예약 제출
CREATE OR REPLACE FUNCTION core.public_submit_consultation_booking(
  p_slug TEXT,
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
BEGIN
  IF length(trim(p_name)) < 1 OR length(trim(p_phone)) < 8 OR length(trim(p_content)) < 1 THEN
    RETURN jsonb_build_object('error', 'invalid_input');
  END IF;

  IF p_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('error', 'past_date');
  END IF;

  SELECT * INTO v_org
  FROM core.organizations
  WHERE slug = p_slug AND is_active = true;

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
