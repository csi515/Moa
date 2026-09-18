-- RLS org 격리 감사 시나리오 (수동/CI에서 service role + 테스트 유저 JWT로 검증)
-- 실행 전제: 두 개의 조직(OrgA, OrgB), 각각 owner/staff/parent 멤버십 시드
-- 정책 대량 재작성 없음 — 실패 시 해당 정책만 수정

-- =============================================================================
-- S1. OrgA staff는 OrgB customers를 SELECT 할 수 없다
-- =============================================================================
-- SET LOCAL ROLE authenticated;
-- SET LOCAL request.jwt.claim.sub = '<orgA_staff_user_id>';
-- SELECT count(*) FROM core.customers WHERE organization_id = '<orgB_id>';
-- 기대: 0

-- =============================================================================
-- S2. OrgA staff는 OrgB invoices를 SELECT 할 수 없다
-- =============================================================================
-- SELECT count(*) FROM core.invoices WHERE organization_id = '<orgB_id>';
-- 기대: 0

-- =============================================================================
-- S3. Parent는 연결되지 않은 타 자녀 customer를 SELECT 할 수 없다
-- =============================================================================
-- SET LOCAL request.jwt.claim.sub = '<parent_user_id>';
-- SELECT count(*) FROM core.customers c
-- WHERE c.id = '<unrelated_student_id>';
-- 기대: 0

-- =============================================================================
-- S4. OrgA owner는 자사 customers만 본다
-- =============================================================================
-- SET LOCAL request.jwt.claim.sub = '<orgA_owner_user_id>';
-- SELECT count(*) FILTER (WHERE organization_id = '<orgA_id>') AS own_count,
--        count(*) FILTER (WHERE organization_id <> '<orgA_id>') AS other_count
-- FROM core.customers;
-- 기대: other_count = 0, own_count > 0 (시드 시)

-- =============================================================================
-- 헬퍼 참조
-- =============================================================================
-- SELECT core.is_org_member('<orgA_id>');
-- SELECT core.is_org_admin('<orgA_id>');
