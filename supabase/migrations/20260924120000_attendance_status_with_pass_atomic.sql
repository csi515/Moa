-- 피아노 출결 상태 + 이용권 차감/복구를 한 트랜잭션으로 처리.
-- 기존 lessonPassConsume 규칙: countable status, 같은 날짜 sibling 재사용, 1회 복구.
-- cancelled/missing refund 시 attendance를 바꾸지 않는다.

BEGIN;

CREATE OR REPLACE FUNCTION core.update_attendance_status_with_pass(
  p_organization_id UUID,
  p_attendance_id UUID,
  p_customer_id UUID,
  p_service_id TEXT,
  p_attendance_date DATE,
  p_new_status TEXT,
  p_apply_pass BOOLEAN DEFAULT true,
  p_student_name TEXT DEFAULT NULL,
  p_class_name TEXT DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL,
  p_memo TEXT DEFAULT NULL,
  p_absent_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, piano, public
AS $$
DECLARE
  v_row piano.attendance%ROWTYPE;
  v_pass core.session_passes%ROWTYPE;
  v_meta JSONB;
  v_pass_id UUID;
  v_pass_id_text TEXT;
  v_old_status TEXT;
  v_action TEXT := 'none';
  v_service_uuid UUID;
  v_class_id TEXT;
  v_sibling_pass TEXT;
  v_still_used BOOLEAN;
  v_next_counted BOOLEAN;
  v_prev_counted BOOLEAN;
  v_has_entitlement BOOLEAN;
  v_pass_consumable BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_organization_id IS NULL OR p_customer_id IS NULL OR p_attendance_date IS NULL OR p_new_status IS NULL THEN
    RAISE EXCEPTION 'Invalid arguments';
  END IF;
  IF NOT core.is_org_staff_actor(p_organization_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM core.customers c
    WHERE c.id = p_customer_id AND c.organization_id = p_organization_id
  ) THEN
    RAISE EXCEPTION 'Customer not found in organization';
  END IF;

  v_class_id := NULLIF(btrim(COALESCE(p_service_id, '')), '');
  BEGIN
    v_service_uuid := v_class_id::UUID;
  EXCEPTION
    WHEN invalid_text_representation THEN
      v_service_uuid := NULL;
  END;

  -- 같은 학생·날짜 출결을 잠가 sibling/이중 차감을 직렬화
  PERFORM 1
  FROM piano.attendance a
  WHERE a.organization_id = p_organization_id
    AND a.customer_id = p_customer_id
    AND a.attendance_date = p_attendance_date
  FOR UPDATE;

  IF p_attendance_id IS NOT NULL THEN
    SELECT * INTO v_row
    FROM piano.attendance a
    WHERE a.id = p_attendance_id
    FOR UPDATE;
    IF FOUND AND v_row.organization_id IS DISTINCT FROM p_organization_id THEN
      RAISE EXCEPTION 'Organization mismatch';
    END IF;
    IF FOUND AND v_row.customer_id IS DISTINCT FROM p_customer_id THEN
      RAISE EXCEPTION 'Customer mismatch';
    END IF;
  END IF;

  IF v_row.id IS NULL THEN
    SELECT * INTO v_row
    FROM piano.attendance a
    WHERE a.organization_id = p_organization_id
      AND a.customer_id = p_customer_id
      AND a.attendance_date = p_attendance_date
      AND (
        (v_service_uuid IS NOT NULL AND a.service_id = v_service_uuid)
        OR (v_service_uuid IS NULL AND COALESCE(a.metadata->>'classId', '') = COALESCE(v_class_id, ''))
      )
    FOR UPDATE
    LIMIT 1;
  END IF;

  v_old_status := CASE WHEN v_row.id IS NULL THEN NULL ELSE v_row.status::TEXT END;
  v_meta := COALESCE(v_row.metadata, '{}'::jsonb);
  v_pass_id_text := NULLIF(btrim(COALESCE(v_meta->>'sessionPassId', '')), '');
  IF v_pass_id_text IS NOT NULL THEN
    BEGIN
      v_pass_id := v_pass_id_text::UUID;
    EXCEPTION
      WHEN invalid_text_representation THEN
        v_pass_id := NULL;
    END;
  END IF;

  IF v_old_status IS NOT NULL AND v_old_status = p_new_status THEN
    RETURN jsonb_build_object(
      'action', 'idempotent',
      'attendance_id', v_row.id,
      'status', v_old_status,
      'session_pass_id', to_jsonb(v_pass_id)
    );
  END IF;

  v_next_counted := p_new_status IN ('present', 'late', 'early_leave', 'make_up');
  v_prev_counted := COALESCE(v_old_status, '') IN ('present', 'late', 'early_leave', 'make_up');

  IF p_apply_pass AND (NOT v_prev_counted) AND v_next_counted THEN
    SELECT NULLIF(btrim(COALESCE(s.metadata->>'sessionPassId', '')), '')
      INTO v_sibling_pass
    FROM piano.attendance s
    WHERE s.organization_id = p_organization_id
      AND s.customer_id = p_customer_id
      AND s.attendance_date = p_attendance_date
      AND (v_row.id IS NULL OR s.id <> v_row.id)
      AND s.status IN ('present', 'late', 'early_leave', 'make_up')
      AND NULLIF(btrim(COALESCE(s.metadata->>'sessionPassId', '')), '') IS NOT NULL
    LIMIT 1;

    IF v_sibling_pass IS NOT NULL THEN
      BEGIN
        v_pass_id := v_sibling_pass::UUID;
      EXCEPTION
        WHEN invalid_text_representation THEN
          v_pass_id := NULL;
      END;
      v_meta := jsonb_set(v_meta, '{sessionPassId}', to_jsonb(v_sibling_pass), true);
      v_action := 'reuse';
    ELSE
      SELECT EXISTS (
        SELECT 1 FROM core.session_passes sp
        WHERE sp.organization_id = p_organization_id
          AND sp.customer_id = p_customer_id
          AND sp.status <> 'cancelled'
      ) INTO v_has_entitlement;

      SELECT * INTO v_pass
      FROM core.session_passes sp
      WHERE sp.organization_id = p_organization_id
        AND sp.customer_id = p_customer_id
        AND sp.status = 'active'
        AND sp.used_sessions < sp.total_sessions
        AND (sp.expires_at IS NULL OR sp.expires_at >= now())
      ORDER BY sp.expires_at ASC NULLS LAST,
               (sp.total_sessions - sp.used_sessions) ASC,
               sp.purchased_at ASC
      LIMIT 1
      FOR UPDATE;

      v_pass_consumable :=
        FOUND
        AND v_pass.status = 'active'
        AND v_pass.used_sessions < v_pass.total_sessions
        AND (v_pass.expires_at IS NULL OR v_pass.expires_at >= now());

      IF NOT v_pass_consumable THEN
        IF v_has_entitlement THEN
          RAISE EXCEPTION 'Insufficient session pass';
        END IF;
        RAISE EXCEPTION 'Insufficient session pass';
      END IF;

      UPDATE core.session_passes
      SET
        used_sessions = v_pass.used_sessions + 1,
        status = CASE
          WHEN v_pass.used_sessions + 1 >= v_pass.total_sessions THEN 'exhausted'
          ELSE 'active'
        END,
        updated_at = now()
      WHERE id = v_pass.id
        AND organization_id = p_organization_id
        AND status = 'active'
        AND used_sessions < total_sessions
        AND (expires_at IS NULL OR expires_at >= now());

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Insufficient session pass';
      END IF;

      v_pass_id := v_pass.id;
      v_meta := jsonb_set(v_meta, '{sessionPassId}', to_jsonb(v_pass_id::text), true);
      v_action := 'consume';
    END IF;

  ELSIF p_apply_pass AND v_prev_counted AND NOT v_next_counted AND v_pass_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM piano.attendance s
      WHERE s.organization_id = p_organization_id
        AND s.customer_id = p_customer_id
        AND s.attendance_date = p_attendance_date
        AND (v_row.id IS NULL OR s.id <> v_row.id)
        AND s.status IN ('present', 'late', 'early_leave', 'make_up')
        AND COALESCE(s.metadata->>'sessionPassId', '') = v_pass_id::text
    ) INTO v_still_used;

    IF NOT v_still_used THEN
      SELECT * INTO v_pass
      FROM core.session_passes sp
      WHERE sp.id = v_pass_id
        AND sp.organization_id = p_organization_id
      FOR UPDATE;

      IF NOT FOUND OR v_pass.status = 'cancelled' THEN
        RAISE EXCEPTION 'Session pass refund failed';
      END IF;

      UPDATE core.session_passes
      SET
        used_sessions = GREATEST(0, v_pass.used_sessions - 1),
        status = CASE
          WHEN GREATEST(0, v_pass.used_sessions - 1) >= v_pass.total_sessions THEN 'exhausted'
          ELSE 'active'
        END,
        updated_at = now()
      WHERE id = v_pass.id
        AND organization_id = p_organization_id
        AND status <> 'cancelled';

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Session pass refund failed';
      END IF;

      v_meta := v_meta - 'sessionPassId';
      v_pass_id := NULL;
      v_action := 'refund';
    ELSE
      v_meta := v_meta - 'sessionPassId';
      v_pass_id := NULL;
      v_action := 'keep';
    END IF;
  ELSE
    v_action := 'none';
  END IF;

  IF v_class_id IS NOT NULL THEN
    v_meta := jsonb_set(v_meta, '{classId}', to_jsonb(v_class_id), true);
  END IF;
  IF p_student_name IS NOT NULL THEN
    v_meta := jsonb_set(v_meta, '{studentName}', to_jsonb(p_student_name), true);
  END IF;
  IF p_class_name IS NOT NULL THEN
    v_meta := jsonb_set(v_meta, '{className}', to_jsonb(p_class_name), true);
  END IF;

  IF v_row.id IS NULL THEN
    INSERT INTO piano.attendance (
      id,
      organization_id,
      customer_id,
      service_id,
      attendance_date,
      status,
      absent_reason,
      make_up_required,
      memo,
      created_by,
      metadata
    ) VALUES (
      COALESCE(p_attendance_id, gen_random_uuid()),
      p_organization_id,
      p_customer_id,
      v_service_uuid,
      p_attendance_date,
      p_new_status::piano.attendance_status,
      p_absent_reason,
      (p_new_status = 'absent'),
      p_memo,
      p_created_by,
      v_meta
    )
    RETURNING * INTO v_row;
  ELSE
    UPDATE piano.attendance
    SET
      status = p_new_status::piano.attendance_status,
      absent_reason = p_absent_reason,
      make_up_required = CASE WHEN p_new_status = 'absent' THEN true ELSE make_up_required END,
      memo = p_memo,
      metadata = v_meta,
      updated_at = now()
    WHERE id = v_row.id
      AND organization_id = p_organization_id
    RETURNING * INTO v_row;
  END IF;

  RETURN jsonb_build_object(
    'action', v_action,
    'attendance_id', v_row.id,
    'status', v_row.status,
    'session_pass_id', to_jsonb(v_pass_id),
    'metadata', v_meta
  );
END;
$$;

COMMENT ON FUNCTION core.update_attendance_status_with_pass(
  UUID, UUID, UUID, TEXT, DATE, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT
) IS
  '출결 상태 + 이용권 차감/복구 원자 RPC. sibling 재사용, cancelled refund는 출결 미변경.';

REVOKE ALL ON FUNCTION core.update_attendance_status_with_pass(
  UUID, UUID, UUID, TEXT, DATE, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM PUBLIC;
REVOKE ALL ON FUNCTION core.update_attendance_status_with_pass(
  UUID, UUID, UUID, TEXT, DATE, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT
) FROM anon;
GRANT EXECUTE ON FUNCTION core.update_attendance_status_with_pass(
  UUID, UUID, UUID, TEXT, DATE, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT
) TO authenticated;

COMMIT;
