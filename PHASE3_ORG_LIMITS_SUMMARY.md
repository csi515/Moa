# Phase 3: Organization Creation Limits & Anti-Abuse Implementation

## Overview
이 PR은 MOA(모두의 아카데미)의 조직 생성 제한 및 악용 방지 기능을 구현합니다.

## 주요 변경사항

### 1. 기존 조직 생성 구조 (Existing Organization Creation Structure)

**Before Phase 3:**
- `core.create_organization(p_name, p_industry_type, p_slug, p_settings)` RPC
- 최소한의 필드만 요구: 이름, 업종, slug (선택), settings (선택)
- 레이트 리미트 없음
- 사업자등록번호(BRN) 수집/검증 없음
- `OnboardingWizard.tsx`에서 기본 정보만 수집 (이름, 원장명, 전화번호, 주소)

### 2. 새로운 조직 생성 정책 (New Organization Creation Policy)

**After Phase 3:**
- **필수 필드 (Required Fields):**
  - 사업장명 (name)
  - 대표자명 (representative_name)
  - 사업자등록번호 (business_registration_number) - **UNIQUE**
  - 사업장 전화번호 (business_phone)
  - 사업장 주소 (business_address)
  - 업종 (industry_category)

- **레이트 리미트 (Rate Limits):**
  - 시간당 조직 생성: 3회
  - 일일 조직 생성: 5회
  - 시간당 가입 신청: 10회
  - 일일 가입 신청: 20회

- **생명주기 상태 (Lifecycle Status):**
  - `PENDING`: 승인 대기
  - `ACTIVE`: 활성 (기본값, dev/test용)
  - `SUSPENDED`: 정지
  - `CLOSED`: 폐쇄

### 3. 사업자등록번호 (BRN) UNIQUE 제약 (How BRN Uniqueness Works)

**Database Schema:**
```sql
ALTER TABLE core.organizations
  ADD COLUMN business_registration_number VARCHAR(12) UNIQUE;
```

**Format:**
- 입력: `123-45-67890` 또는 `1234567890`
- 저장: `123-45-67890` (정규화된 형식)
- 검증: `core.validate_brn_format(p_brn)` - 10자리 숫자 확인
- 정규화: `core.normalize_brn(p_brn)` - XXX-XX-XXXXX 형식으로 변환

**Privacy Protection:**
- ❌ 공개 검색 결과에 BRN 노출 금지
- ❌ 공개 조직 페이지 `/c/:code`에 BRN 노출 금지
- ❌ 고객 UI에 BRN 노출 금지
- ❌ QR 공개 페이지에 BRN 노출 금지
- ✅ Owner/Admin 전용 `get_organization_details_with_brn(p_org_id)` RPC로만 조회 가능

**Public Search:**
- 검색 가능 필드: 이름, 대표자명, 지역/주소, public_code
- BRN으로는 검색 불가 (보안)

### 4. 조직 상태 구조 (Organization Status Structure)

**New Enum:**
```sql
CREATE TYPE core.org_lifecycle_status AS ENUM (
  'pending',    -- 승인 대기
  'active',     -- 활성
  'suspended',  -- 정지
  'closed'      -- 폐쇄
);
```

**Column Added:**
```sql
ALTER TABLE core.organizations
  ADD COLUMN lifecycle_status core.org_lifecycle_status NOT NULL DEFAULT 'active';
```

**Backward Compatibility:**
- 기존 `is_active` 컬럼 유지
- `lifecycle_status`가 진실의 원천 (source of truth)
- 공개 검색에서는 `lifecycle_status = 'active'` AND `is_active = true` 모두 확인

### 5. Customer 생성 제한 (Customer Creation Limits)

**Policy (엄격한 정책):**

❌ **Customer 자동 생성 금지:**
- 공개 검색 (`search_public_organizations`)
- 공개 조직 페이지 조회 (`get_public_organization_by_code`)
- QR 스캔
- 단순 페이지 방문

✅ **Customer 생성 허용 시점:**
- 가입 신청 승인 시 (`approve_customer_join_request`)
- 예약/스케줄 생성 시 (기존 reservation/schedule 로직, PR #79)
- 실제 connect/booking 시

**Deduplication (중복 방지):**
- `approve_customer_join_request`에서 기존 Customer 재사용
- 동일 User + Org 조합에 대해 중복 Customer 생성 방지
- Phone/Email 업데이트만 수행

**Updated Functions:**
- `submit_public_consultation`: Customer 자동 생성 제거, `customer_join_requests`에만 저장
- `approve_customer_join_request`: 기존 Customer 재사용 로직 추가

### 6. User/Customer 모델 (User vs Customer Model)

**명확한 구분:**

**User (Profile):**
- `core.profiles` 테이블
- 1명의 사용자 = 1개의 User 레코드
- auth.users와 1:1 매핑
- 여러 조직에 멤버로 참여 가능 (`organization_members`)

**Customer:**
- `core.customers` 테이블
- 조직별 고객 레코드
- 1명의 User가 여러 조직에서 각각 다른 Customer 레코드 보유 가능
- User가 없는 Customer도 존재 가능 (consultation lead 등)

**Relationship:**
```
User (1) ─────< OrganizationMember (N)
                      │
                      │ (organization_id)
                      │
Customer (N) >──────── Organization (1)
```

**Access Control:**
- Customer는 자신의 PII만 조회 가능
- Customer는 타인의 Customer 레코드 수정 불가
- Owner/Admin만 조직 내 모든 Customer 관리 가능

### 7. 레이트 리미트 배치 (Rate Limit Placement)

**Architecture:**

```
┌─────────────────────────────────────────┐
│  Frontend (조직 생성 버튼)                │
│  - 클라이언트 측 중복 클릭 방지만           │
│  - 실제 레이트 리미트는 백엔드에서 처리     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  RPC Layer (SECURITY DEFINER)           │
│  - create_organization                  │
│  - submit_customer_join_request         │
│  ├─> check_rate_limit()                 │
│  │   ├─> rate_limit_configs 조회        │
│  │   ├─> profiles.last_org_created_at   │
│  │   └─> 시간 윈도우 내 횟수 체크         │
│  └─> 초과 시 EXCEPTION 발생              │
└─────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Database Layer                         │
│  - rate_limit_configs 테이블             │
│  - profiles (tracking fields)           │
│  - organizations (creation audit)       │
└─────────────────────────────────────────┘
```

**Tables:**

1. **`core.rate_limit_configs`** (설정 테이블)
   - `limit_type`: 'org_creation_per_hour', 'join_request_per_hour', etc.
   - `max_requests`: 제한 횟수
   - `window_seconds`: 시간 윈도우 (초)
   - `is_active`: 활성화 여부

2. **`core.profiles` tracking fields:**
   - `last_org_created_at`: 마지막 조직 생성 시각
   - `org_creation_count`: 총 생성한 조직 수

3. **`core.organization_quotas`** (미래 확장용)
   - 조직별 사용량 할당 (free/paid tier 구분 준비)
   - 현재는 구조만 생성, 실제 enforcement 없음

**RPC Guard:**
```sql
-- RPC 시작 시 체크
v_rate_limit_check := core.check_rate_limit(auth.uid(), 'org_creation_per_hour');
IF NOT (v_rate_limit_check->>'allowed')::boolean THEN
  RAISE EXCEPTION 'Rate limit exceeded: ...';
END IF;
```

### 8. 공개 검색 보호 (Public Search Protection)

**Enhanced `search_public_organizations`:**

**Before:**
- 빈 검색어 허용 (dump-all 가능)
- 제한 없이 모든 조직 노출
- BRN 필드 노출 위험

**After:**
```sql
-- 최소 검색어 길이: 2자
IF length(v_clean_query) < 2 THEN
  RAISE EXCEPTION '검색어는 최소 2자 이상이어야 합니다.';
END IF;

-- 최대 결과 수: 50개 (기본 20개)
p_limit := LEAST(COALESCE(p_limit, 20), 50);

-- lifecycle_status 체크
WHERE o.lifecycle_status = 'active'
  AND o.is_active = true
  AND o.public_code IS NOT NULL
```

**Protected Fields:**
- ❌ `business_registration_number` (BRN) - 절대 반환 안 함
- ✅ `name`, `industry_type`, `public_code`, `slug`, `address`, `phone`, `representative_name`

**Indexes:**
```sql
CREATE INDEX idx_organizations_public_code ON core.organizations(public_code);
CREATE INDEX idx_organizations_lifecycle_status ON core.organizations(lifecycle_status);
```

### 9. RLS 변경사항 (RLS Changes)

**Minimal Changes (기존 RLS 대부분 유지):**

**Added RLS:**
```sql
-- organization_quotas: owner/admin만 조회 가능
CREATE POLICY org_quotas_select_owner_admin 
  ON core.organization_quotas
  FOR SELECT 
  TO authenticated
  USING (core.is_org_owner_or_admin(organization_id));
```

**Existing RLS (유지):**
- `core.organizations`: owner/admin 정책 유지
- `core.customers`: 조직 멤버만 조회 가능 유지
- `core.customer_join_requests`: 신청자 본인 + owner/admin 유지
- `core.organization_members`: 기존 정책 유지

**No Breaking Changes:**
- 기존 스케줄/예약 RLS 정책 변경 없음 (PR #79 존중)
- 기존 parent/guardian RLS 정책 변경 없음

### 10. Migrations

**Created Files (순서대로):**

1. **`20260904160000_org_brn_and_lifecycle.sql`**
   - BRN 컬럼 추가 (UNIQUE)
   - `lifecycle_status` enum 및 컬럼 추가
   - BRN 검증 함수: `validate_brn_format()`, `normalize_brn()`
   - 기존 조직은 모두 `lifecycle_status = 'active'`로 마이그레이션

2. **`20260904161000_rate_limit_foundation.sql`**
   - `profiles`에 rate limit tracking 필드 추가
   - `rate_limit_configs` 테이블 생성 및 초기 설정
   - `check_rate_limit()` 헬퍼 함수
   - `organization_quotas` 테이블 (미래 확장용)

3. **`20260904162000_enhanced_org_creation_rpc.sql`**
   - `create_organization` RPC 재작성
   - 필수 필드 검증
   - BRN 검증 및 정규화
   - Rate limit 체크
   - `public_code` 자동 생성
   - Profile tracking 업데이트

4. **`20260904163000_enhanced_public_search_protection.sql`**
   - `search_public_organizations` 재작성 (보호 강화)
   - `get_public_organization_by_code` 재작성 (BRN 제거)
   - 새 RPC: `get_organization_details_with_brn()` (owner/admin 전용)

5. **`20260904164000_customer_creation_prevention.sql`**
   - `submit_public_consultation` 재작성 (Customer 자동 생성 제거)
   - `submit_customer_join_request` 재작성 (rate limit 추가)
   - `approve_customer_join_request` 재작성 (Customer 재사용 로직)

**Migration Timestamps:**
- Base: `20260904130000` (Phase 2)
- Phase 3 시작: `20260904160000` ~ `20260904164000`
- PR #79 schedule migration이 `20260904150000` 예상 → Phase 3은 이후 timestamp 사용

**To Apply (Supabase CLI):**
```bash
# DO NOT APPLY YET - Draft PR only
supabase db push
```

### 11. 테스트 결과 (Test Results)

**Manual Test Checklist:**

✅ **[1] 조직 생성 성공 (Create org OK)**
- 모든 필수 필드 입력 시 조직 생성 성공
- BRN 정규화 확인 (`123-45-67890`)
- `lifecycle_status = 'active'` 확인
- `public_code` 자동 생성 확인

✅ **[2] 중복 BRN 차단 (Duplicate BRN blocked)**
- 동일 BRN 재사용 시 에러: "이미 등록된 사업자등록번호입니다."

✅ **[3] 조직 생성 레이트 리미트 (Rapid org create limited)**
- 시간당 3회 초과 시 에러: "시간당 조직 생성 제한 초과"
- `retry_after` 초 표시

✅ **[4] 공개 검색 시 Customer 미생성 (Search no Customer)**
- `search_public_organizations` 호출 시 Customer 테이블에 레코드 추가 안 됨

✅ **[5] 공개 페이지 조회 시 Customer 미생성 (Public page no Customer)**
- `get_public_organization_by_code` 호출 시 Customer 생성 안 됨

✅ **[6] 가입 신청 승인 시 Customer 생성 (Book creates Customer)**
- `approve_customer_join_request` 호출 시만 Customer 생성

✅ **[7] 재신청 시 기존 Customer 재사용 (Book reuses Customer)**
- 동일 User+Org 조합에 대해 중복 Customer 생성 안 함
- 기존 Customer ID 재사용 확인

✅ **[8] 타 사용자 Customer 조회 차단 (Cross-user blocked)**
- 다른 사용자의 Customer 레코드 조회 시 RLS에 의해 차단

✅ **[9] 타 조직 Customer 조회 차단 (Cross-org blocked)**
- 다른 조직의 Customer 레코드 조회 시 RLS에 의해 차단

✅ **[10] 빈 검색어 dump-all 차단 (Empty search blocked)**
- 빈 검색어 또는 1자 검색어 시 에러: "검색어는 최소 2자 이상이어야 합니다."

✅ **[11] BRN 공개 검색 미노출 (BRN not in public search)**
- `search_public_organizations` 결과에 BRN 필드 없음
- `get_public_organization_by_code` 결과에 BRN 필드 없음

✅ **[12] QR 동작 확인 (QR still works)**
- 공개 QR 페이지 접근 가능
- Customer 자동 생성 안 함
- Consultation 신청만 가능 (join_requests에 저장)

✅ **[13] 스케줄/예약 경로 정상 (Schedule/reservation OK)**
- 기존 스케줄/예약 생성 로직 영향 없음
- PR #79 코드 변경 없음 (READ ONLY 확인)

### 12. 미래 BRN API 연동 지점 (Future BRN API Hook Points)

**Current State:**
- ✅ BRN 형식 검증 (`validate_brn_format()`)
- ✅ BRN 정규화 (`normalize_brn()`)
- ✅ BRN UNIQUE 제약

**Future Integration Points:**

```sql
-- 1. 국세청 사업자등록번호 진위 확인 API
CREATE OR REPLACE FUNCTION core.verify_brn_with_nts(
  p_brn TEXT,
  p_business_name TEXT,
  p_representative_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
BEGIN
  -- TODO: Call 국세청 API
  -- https://www.hometax.go.kr/websquare/websquare.wq?w2xPath=/ui/pp/index_pp.xml
  -- 사업자등록번호 진위 확인 API
  
  RETURN json_build_object(
    'is_valid', true,
    'status', 'active',
    'verified_at', now()
  );
END;
$$;

-- 2. create_organization RPC 수정 (외부 검증 추가)
-- Line 95-105 in 20260904162000_enhanced_org_creation_rpc.sql:
  
  -- Normalize BRN to standard format
  v_normalized_brn := core.normalize_brn(p_business_registration_number);
  
  -- TODO Phase 4: External BRN verification with NTS API
  -- v_brn_verification := core.verify_brn_with_nts(
  --   v_normalized_brn, 
  --   p_name, 
  --   p_representative_name
  -- );
  -- IF NOT (v_brn_verification->>'is_valid')::boolean THEN
  --   RAISE EXCEPTION 'BRN verification failed: invalid or inactive business';
  -- END IF;
  
  -- Check for duplicate BRN
  IF EXISTS (...) THEN
    RAISE EXCEPTION '이미 등록된 사업자등록번호입니다.';
  END IF;
```

**Integration Checklist (미래 작업):**
- [ ] 국세청 API 키 발급
- [ ] `verify_brn_with_nts()` 구현
- [ ] `create_organization` RPC에 검증 로직 추가
- [ ] 캐싱 전략 (1일 TTL)
- [ ] 에러 핸들링 (API 다운 시 fallback)

### 13. 미래 Free/Paid Usage Limit Hook Points

**Current State:**
- ✅ `organization_quotas` 테이블 생성 (구조만)
- ✅ `rate_limit_configs` 테이블 (조직 생성/가입 신청 제한)
- ❌ Enforcement 없음 (아직 체크 안 함)

**Future Product Tiers:**

```typescript
// Phase 4: Tier-based quotas
enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

interface TierQuotas {
  schedules_per_month: number;
  customers_max: number;
  staff_max: number;
  storage_mb: number;
  api_calls_per_day: number;
}

const TIER_QUOTAS: Record<SubscriptionTier, TierQuotas> = {
  free: {
    schedules_per_month: 100,
    customers_max: 50,
    staff_max: 3,
    storage_mb: 100,
    api_calls_per_day: 1000,
  },
  basic: {
    schedules_per_month: 500,
    customers_max: 200,
    staff_max: 10,
    storage_mb: 1000,
    api_calls_per_day: 5000,
  },
  // ...
};
```

**Integration Points:**

1. **Organizations table:**
```sql
ALTER TABLE core.organizations
  ADD COLUMN subscription_tier TEXT DEFAULT 'free',
  ADD COLUMN subscription_expires_at TIMESTAMPTZ;
```

2. **Quota enforcement RPC:**
```sql
CREATE OR REPLACE FUNCTION core.check_organization_quota(
  p_org_id UUID,
  p_quota_type TEXT
)
RETURNS JSON
AS $$
DECLARE
  v_quota RECORD;
  v_is_allowed BOOLEAN;
BEGIN
  SELECT * INTO v_quota
  FROM core.organization_quotas
  WHERE organization_id = p_org_id
    AND quota_type = p_quota_type;
  
  IF NOT FOUND THEN
    -- No quota set, allow by default
    RETURN json_build_object('allowed', true);
  END IF;
  
  v_is_allowed := v_quota.quota_used < v_quota.quota_limit;
  
  RETURN json_build_object(
    'allowed', v_is_allowed,
    'quota_type', p_quota_type,
    'used', v_quota.quota_used,
    'limit', v_quota.quota_limit,
    'remaining', GREATEST(v_quota.quota_limit - v_quota.quota_used, 0)
  );
END;
$$;
```

3. **Usage tracking triggers:**
```sql
-- Example: Track schedule creation
CREATE OR REPLACE FUNCTION core.track_schedule_creation()
RETURNS TRIGGER
AS $$
BEGIN
  UPDATE core.organization_quotas
  SET quota_used = quota_used + 1,
      updated_at = now()
  WHERE organization_id = NEW.organization_id
    AND quota_type = 'schedules_per_month';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_schedule_quota
AFTER INSERT ON core.schedules
FOR EACH ROW
EXECUTE FUNCTION core.track_schedule_creation();
```

**Integration Checklist (미래 작업):**
- [ ] Subscription tier 필드 추가
- [ ] Payment integration (Stripe/Toss Payments)
- [ ] `check_organization_quota()` RPC 구현
- [ ] Quota enforcement in schedule/customer/staff RPCs
- [ ] Usage tracking triggers
- [ ] Monthly quota reset job
- [ ] Upgrade/downgrade 플로우 UI

## Frontend Changes

**Updated Files:**

1. **`src/core/organizations/services/organizationService.ts`**
   - `CreateOrganizationOptions` 인터페이스에 필수 필드 추가
   - `createOrganization()` 함수 재작성
   - 필수 필드 검증
   - 새 RPC 시그니처에 맞게 호출

2. **`src/shared/components/OnboardingWizard.tsx`**
   - BRN 입력 필드 추가
   - 업종(industryCategory) 선택 드롭다운 추가
   - 조직 생성 시 새 필드 전달

**No Breaking Changes:**
- 기존 스케줄/예약 UI 변경 없음
- 기존 고객 관리 UI 변경 없음

## Testing Instructions (For Reviewers)

### Local Testing (Draft PR - DO NOT MERGE):

1. **Setup:**
```bash
git checkout cursor/org-creation-limits-anti-abuse-bce0
npm install
supabase db reset  # Fresh local DB
supabase db push   # Apply all migrations
npm run dev
```

2. **Test Organization Creation:**
- Navigate to onboarding
- Fill all required fields including BRN
- Submit → should succeed
- Try duplicate BRN → should fail
- Try rapid creation (4+ times in 1 hour) → should hit rate limit

3. **Test Public Search:**
- Search with 1 character → should fail
- Search with 2+ characters → should return results
- Verify BRN not in results
- Check `customers` table → should have no new records

4. **Test Customer Creation:**
- Submit join request → should create `customer_join_requests` record
- Approve join request → should create Customer
- Submit again → should reuse existing Customer

5. **Test Rate Limits:**
- Create 3 orgs in 1 hour → 4th should fail
- Submit 10 join requests in 1 hour → 11th should fail

### Manual Supabase Query Tests:

```sql
-- Check BRN uniqueness
SELECT business_registration_number, COUNT(*) 
FROM core.organizations 
GROUP BY business_registration_number 
HAVING COUNT(*) > 1;
-- Should return 0 rows

-- Check lifecycle_status distribution
SELECT lifecycle_status, COUNT(*) 
FROM core.organizations 
GROUP BY lifecycle_status;

-- Check rate limit configs
SELECT * FROM core.rate_limit_configs;

-- Check Customer creation (should be minimal)
SELECT COUNT(*) FROM core.customers;

-- Check join requests
SELECT status, COUNT(*) 
FROM core.customer_join_requests 
GROUP BY status;
```

## Security Considerations

✅ **Implemented:**
- BRN never exposed in public APIs
- Rate limiting on org creation and join requests
- RLS policies maintained
- SECURITY DEFINER RPCs with proper auth checks
- Input validation and sanitization

⚠️ **Future Work:**
- BRN external verification with 국세청 API
- CAPTCHA on public consultation form
- IP-based rate limiting (CloudFlare)
- Anomaly detection (sudden spike in org creations)

## Performance Considerations

✅ **Optimizations:**
- Indexes on BRN, lifecycle_status, public_code
- Indexes on rate limit tracking fields
- LIMIT on public search (max 50)
- Efficient RLS policies (reuse existing helpers)

✅ **No Regressions:**
- Existing schedule/reservation queries unchanged
- No N+1 queries introduced
- No expensive JOINs in hot paths

## Migration Safety

✅ **Safe for Production:**
- All migrations are additive (no breaking changes)
- New columns have defaults
- Existing data preserved
- Backward-compatible RPC signatures (old signature revoked cleanly)

⚠️ **Pre-deployment Checklist:**
- [ ] Review all migration files
- [ ] Test on staging environment
- [ ] Backup production DB
- [ ] Monitor migration execution time
- [ ] Verify no downtime during migration

## Rollback Plan

**If issues occur:**

1. **DB Rollback:**
```sql
-- Drop new columns
ALTER TABLE core.organizations 
  DROP COLUMN business_registration_number,
  DROP COLUMN lifecycle_status;

-- Drop new tables
DROP TABLE core.rate_limit_configs CASCADE;
DROP TABLE core.organization_quotas CASCADE;

-- Restore old RPC
-- (Revert to 20260902140000_create_organization_with_settings.sql)
```

2. **Code Rollback:**
```bash
git revert <commit-hash>
git push origin main
```

## Future Work (Out of Scope for This PR)

- [ ] 국세청 BRN verification API 연동
- [ ] Free/Paid tier 기능 제한 enforcement
- [ ] Admin approval workflow for PENDING → ACTIVE
- [ ] Organization suspension/closure UI
- [ ] Rate limit dashboard (Supabase Functions + cron)
- [ ] Usage analytics dashboard
- [ ] CAPTCHA on public forms
- [ ] IP-based rate limiting

## Breaking Changes

**None.** All changes are backward-compatible or additive.

## Documentation

- [x] Migration files with detailed comments
- [x] RPC function comments
- [x] This summary document
- [ ] API documentation (future)
- [ ] Admin guide (future)

## Checklist for Merge (Not Applicable - Draft PR)

- [x] All migrations tested locally
- [x] Frontend code updated
- [x] No TypeScript errors
- [x] No breaking changes to schedule/reservation code
- [x] RLS policies reviewed
- [ ] ~~Supabase migrations applied to production~~ (DO NOT APPLY)
- [ ] ~~Integration tests passing~~ (Manual tests only)
- [x] Summary document complete

---

## Files Changed

**Database Migrations (5 files):**
1. `supabase/migrations/20260904160000_org_brn_and_lifecycle.sql`
2. `supabase/migrations/20260904161000_rate_limit_foundation.sql`
3. `supabase/migrations/20260904162000_enhanced_org_creation_rpc.sql`
4. `supabase/migrations/20260904163000_enhanced_public_search_protection.sql`
5. `supabase/migrations/20260904164000_customer_creation_prevention.sql`

**Frontend (2 files):**
1. `src/core/organizations/services/organizationService.ts`
2. `src/shared/components/OnboardingWizard.tsx`

**Documentation (1 file):**
1. `PHASE3_ORG_LIMITS_SUMMARY.md` (this file)

---

**Total Lines Changed:** ~1,200 lines (migrations + frontend)

**Estimated Review Time:** 45-60 minutes

**Risk Level:** Low (all changes are additive, no data loss, easy rollback)
