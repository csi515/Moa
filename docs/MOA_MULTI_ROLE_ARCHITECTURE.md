# Moa 다중 역할 플랫폼 아키텍처 갭 분석

**작성일:** 2026-09-04  
**대상:** Moa 사업주·강사·고객·학부모 통합 플랫폼 전환  
**목적:** 현재 단일 역할 모델과 목표 다중 역할 아키텍처 간 격차 파악 및 단계별 전환 계획 수립

---

## 1. 요약 (Executive Summary)

### 현재 상태 vs 목표 아키텍처 (10대 핵심 차이)

| # | 현재 (As-Is) | 목표 (To-Be) | 영향도 |
|---|------------|------------|--------|
| 1 | **1인 1조직 1역할**: User → 1 Organization Member → 1 Role | **1인 N조직 N역할**: User → N OrganizationMemberships with context-specific roles | ⚠️ **HIGH** |
| 2 | 역할 전환 = 로그아웃 → 다른 계정 로그인 | **컨텍스트 스위처**: 로그아웃 없이 "사업장 관리" / "내가 다니는 곳" / "강사로 활동" 전환 | ⚠️ **HIGH** |
| 3 | 고객 = 사업주가 CRM에서 수동 등록 (customers 테이블) | **고객 회원가입**: 학원 검색/QR → 가입 신청 → 승인 → OrganizationMembership (role: customer/member) | ⚠️ **HIGH** |
| 4 | role enum: owner/admin/manager/staff/parent (5종) | **확장된 role**: owner/admin/staff/instructor/member/customer/guardian + 향후 receptionist 등 | 🔶 **MEDIUM** |
| 5 | 학부모 = organization_members.role='parent' (단일 조직 결합) | **Guardian = Global Parent**: core.parents (user_id 1:1) → N orgs via org_parent_profiles (CRM 투영) | 🔶 **MEDIUM** |
| 6 | 자녀 = customers (조직 종속) | **Student = Global**: core.students (조직 독립) → student_enrollments (org별 재학 상태: active/leave/withdrawn/alumni) | 🔶 MEDIUM |
| 7 | 학부모-자녀 = parent_student_links (org 내 1:1) | **Guardian-Child = Global M:N**: parent_student_guardians (relationship: father/mother/other, is_primary) | 🔶 MEDIUM |
| 8 | PIN 출입 = 출석 모듈 on/off 설정 (일부 업종 사용) | **Child PIN = 선택 모듈**: 어린이집/초등 학원 등 필요 시 활성화; 성인 PT/필라테스는 자가 예약/스케줄 중심 | ✅ **ALIGNED** |
| 9 | 조직 접근 = 초대 코드 없음; 사업주가 수동 추가 | **Public Org Code + QR**: `/c/{code}` 단일 웹앱, QR 스캔 → 상담 신청 또는 회원가입 요청 | 🔶 MEDIUM |
| 10 | 모든 기능 = 단일 앱 (회원권/패스/수강료 모두 core) | **Core vs Module 분리**: 멤버십/패스 → 모듈 선택 기능; 파일 업로드 → 필수 아님; 업종별 플러그인 확장 | ✅ **PARTIAL** |

**종합 평가:**  
- ✅ **이미 구현됨**: 업종별 모듈 구조 (piano/gym/daycare/pilates), 학부모 포털 (부분), PIN 체크인 옵션, multi-tenant RLS  
- 🔶 **부분 구현됨**: 역할 모델 기반 있음 (확장 필요), 학부모-자녀 글로벌 모델 (parent/student 테이블 존재, 통합 필요)  
- ⚠️ **재설계 필요**: 1인 N역할 컨텍스트 스위처, 고객 회원가입 플로우, 조직 공개 코드/QR, 다중 멤버십 UI  

---

## 2. 현재 아키텍처 맵

### 2.1 데이터베이스 스키마 (Core + Industry)

**Core Schema** (`core.*`)

```
[Auth/User Layer]
auth.users (Supabase Auth)
  └─ core.profiles (id=auth.uid, email, full_name, avatar_url)

[Organization Layer]
core.organizations
  ├─ id, name, industry_type (piano/gym/daycare/pilates), slug, settings, is_active
  └─ RLS: authenticated user가 organization_members에 존재하면 조회 가능

core.organization_members  ⚠️ 현재: 1 user → 1 org → 1 role
  ├─ id, organization_id, user_id, role (owner/admin/manager/staff/parent)
  ├─ staff_id (nullable FK → staff), parent_customer_id (nullable)
  ├─ is_active, joined_at
  └─ UNIQUE(organization_id, user_id)  ← 1인 1조직 제약

[CRM/Staff Layer]
core.customers  ⚠️ 현재: 조직별 고객 DB (자가 회원가입 불가)
  ├─ id, organization_id, name, phone, email, status, check_in_pin_hash
  └─ 사업주/강사가 수동 등록

core.staff
  ├─ id, organization_id, user_id (nullable), name, phone, email, status
  └─ 직원 데이터; user_id 연결 시 로그인 가능

core.customer_contacts
  └─ 1 customer → N contacts (보호자 연락처 등)

[Schedule/Finance/Consultation]
core.services, core.schedules, core.payments, core.consultations
core.income_entries, core.expenses
core.notifications

[Attendance Module] (optional)
core.attendance_sessions (check_in_at, check_in_method: pin/qr/nfc/kiosk/manual)

[Parent Portal — Global Model] ✅ 이미 구현 (부분)
core.parents (id, user_id UNIQUE, name, phone, email)
core.students (id, display_name, birth_date)  ← 조직 독립 자녀
core.parent_student_guardians (parent_id, student_id, relationship, is_primary)
core.student_enrollments (student_id, org_id, customer_id UNIQUE, status: active/leave/withdrawn/alumni)
core.org_parent_profiles (parent_id, org_id, customer_id)  ← 조직별 학부모 CRM 투영
core.guardian_link_tokens (invite_code/qr/deep_link)

[Legacy Parent-Student] ⚠️ 병행 존재
core.parent_student_links (org_id, parent_customer_id, student_customer_id, relationship)
  └─ 조직 내 부모-자녀 링크 (구 모델; 글로벌 모델과 동기화 중)
```

**Industry Schemas** (piano/gym/daycare/pilates)

```
piano.*
  ├─ customers (customer_id FK → core.customers, student_number, level, tuition_fee, teacher_id)
  ├─ class_members, attendances, makeup_records
  ├─ textbooks, textbook_sales, textbook_payments
  ├─ practice_records, lesson_records
  ├─ events, performance_videos
  └─ expenses (piano-specific)

gym.*, daycare.*, pilates.*  (구조 유사, 업종별 테이블 약간 상이)
  └─ customers, classes, schedules, payments 등 코어 확장
```

**RPC Functions**

```sql
-- Organization
create_organization(p_name, p_industry_type, p_slug, p_settings) → org_id
delete_organization(p_organization_id)

-- Role Check (SECURITY DEFINER)
is_org_member(org_id) → boolean
get_org_role(org_id) → member_role
is_org_admin(org_id), is_org_owner_or_admin(org_id)

-- Staff Account
invite_staff_member(p_org_id, p_staff_id, p_email) → {invite_url, ...}
connect_staff_on_login() → auto-link user_id to staff
get_staff_account_statuses(p_org_id)

-- Parent Portal
ensure_global_parent_profile() → parent_id
get_my_parent_portal_tree() → {parent, children[], enrollments[]}
create_guardian_link_token(p_org_id, p_customer_id, ...) → {token, link}
redeem_guardian_link_token(p_token, p_shared_fields) → {org_name, student_name, ...}
parent_register_child(p_display_name, p_birth_date, p_relationship) → {student_id, ...}
parent_set_child_check_in_pin(p_org_id, p_customer_id, p_pin)

-- Login Sync
connect_parent_on_login(), sync_auth_providers_on_login()
```

### 2.2 현재 역할 모델

```typescript
// src/lib/supabase/database.types.ts
export type MemberRole = 'owner' | 'admin' | 'manager' | 'staff' | 'parent';

// src/core/auth/permissions.ts
function isOrgAdmin(role): owner || admin || manager
function isStaffRole(role): staff
function isParentRole(role): parent

function getAllowedTabs(role, industry, settings): NavTab[]
  - owner/admin/manager → adminTabs + finance (owner만) + account
  - staff → staffTabs + account
  - parent → [] (별도 ParentShell)
```

**현재 플로우:**

1. **사업주 회원가입** → `AuthProvider.signUp(email, password, fullName, business?)` → auto-create org + owner membership
2. **강사 초대** → owner가 staff 레코드 생성 → `invite_staff_member(org_id, staff_id, email)` → 이메일 링크 → 강사 회원가입 시 `connect_staff_on_login()` → staff_id 연결
3. **학부모 초대** → owner가 customer(자녀) 생성 → `create_guardian_link_token(org_id, customer_id)` → 학부모가 토큰 redeem → parent 레코드 + enrollment + org_parent_profile
4. **역할 전환** → 없음; parent는 별도 ParentShell, 강사는 staff role로 고정

### 2.3 프론트엔드 구조

```
src/
├── App.tsx
│   └─ <AuthProvider>
│       └─ <OrganizationProvider>  ⚠️ 1 currentOrganization, 1 currentRole
│           └─ <AppProvider>
│               └─ <SupabaseAppGate>
│                   └─ <IndustryAppRouter>  ← currentRole이 'parent'이면 <ParentShell>
│                       ├─ piano → <PianoAppContent> (ModuleLabelsProvider + BottomNav/Sidebar)
│                       ├─ gym → <GymAppContent>
│                       ├─ daycare → <DaycareAppContent>
│                       └─ pilates → <PilatesAppContent>
│
├── core/
│   ├── auth/ (AuthProvider, signUp, signIn, permissions)
│   ├── organizations/ (OrganizationProvider, CreateOrganizationWizard, OrganizationSelector)
│   ├── industry/ (IndustryAppRouter, plugin registry, types)
│   ├── dashboard/, attendance/, finance/, help/, labels/, legal/, notices/, parent/, platform/, staff/
│
└── modules/
    ├── piano/ (plugin.ts, PianoAppContent, components/, config/, layout/, services/)
    ├── pilates/, gym/, daycare/  (동일 구조)
    └── parent/ (ParentShell, ParentAcademyPortal, ParentChildrenHome, ParentAccountSection)
```

**OrganizationProvider 핵심 상태:**

```typescript
// src/core/organizations/OrganizationProvider.tsx
const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
const [currentRole, setCurrentRole] = useState<MemberRole | null>(null);
const [currentStaffId, setCurrentStaffId] = useState<string | null>(null);
const [currentParentCustomerId, setCurrentParentCustomerId] = useState<string | null>(null);
const [isParentOnly, setIsParentOnly] = useState(false);  // 강사 멤버십 없음
const [canAccessParentPortal, setCanAccessParentPortal] = useState(false);

// ⚠️ 현재 제약: 1 user → 1 selected org → 1 role
// 전환 시 selectOrganization(orgId) 호출 → RoleSync → StorageService.setActiveUser({role, staffId})
```

**SupabaseRoleSync:**

```typescript
// src/SupabaseRoleSync.tsx
// OrganizationProvider의 currentRole, currentStaffId, currentParentCustomerId를 감시
// → StorageService.setActiveUser(user_id, role, staffId, parentCustomerId)
// → 로컬스토리지 + AppContext 동기화
```

### 2.4 주요 파일 인벤토리

**Core 아키텍처:**

- `/src/App.tsx` — 최상위 Provider 트리
- `/src/SupabaseAppGate.tsx` — 인증 후 라우팅 게이트 (OrganizationSelector / CreateOrganizationWizard / IndustryAppRouter)
- `/src/SupabaseRoleSync.tsx` — OrganizationProvider → StorageService 동기화
- `/src/context/AppContext.tsx` — activeTab, toast, confirm dialog, global refresh
- `/src/core/auth/AuthProvider.tsx` — signIn/signUp/signOut, session 관리
- `/src/core/organizations/OrganizationProvider.tsx` — ⚠️ 1 org, 1 role 상태 관리
- `/src/core/industry/IndustryAppRouter.tsx` — role='parent' ? ParentShell : APP_BY_INDUSTRY[industryType]

**업종 플러그인:**

- `/src/core/industry/registry.ts` — INDUSTRY_PLUGINS 배열
- `/src/core/industry/pluginTypes.ts` — IndustryPluginManifest interface
- `/src/modules/{piano,gym,daycare,pilates}/plugin.ts` — adminTabs, staffTabs, labels, 기본 설정
- `/src/modules/{piano,gym,daycare,pilates}/{X}AppContent.tsx` — 각 업종 셸 (BottomNav/Sidebar + 탭별 라우팅)

**학부모 포털:**

- `/src/modules/parent/ParentShell.tsx` — 학부모 전용 진입점 (ParentPortalProvider + RoleSync)
- `/src/modules/parent/ParentChildrenHome.tsx` — 자녀 카드 목록
- `/src/modules/parent/ParentAcademyPortal.tsx` — 조직별 자녀 탭 (출결, 알림, 수업, 수강료 등)
- `/src/core/parent/services/parentPortalService.ts` — get_my_parent_portal_tree RPC 호출

**온보딩:**

- `/src/shared/components/OnboardingWizard.tsx` — 구 피아노 학원 온보딩 (LocalStorage 기반; 지금은 사용 안 함)
- `/src/core/organizations/CreateOrganizationWizard.tsx` — 신규 조직 생성 마법사 (사업주)
- `/src/core/organizations/OrganizationSelector.tsx` — 기존 조직 선택 화면 (1개만 선택)

**Auth 플로우:**

- `/src/core/auth/components/AuthLayout.tsx`, `/src/core/auth/components/AuthFormCard.tsx`
- `/src/core/auth/services/authService.ts` — signUp 시 business 정보 있으면 create_organization 자동 호출

**직원 초대:**

- `/src/core/staff/services/staffAccountService.ts` — inviteStaffMember, getStaffAccountStatuses
- `/src/core/staff/components/StaffInviteLinkModal.tsx`

---

## 3. 갭 분석 (Gap Analysis)

### 3.1 요구사항별 격차 매트릭스

| 요구사항 | 현재 상태 | 격차 (Gap) | 심각도 | 재사용 가능? |
|---------|----------|-----------|--------|------------|
| **R1. 1인 N조직 N역할 모델** | organization_members.UNIQUE(org_id, user_id) — 1인 1조직 1역할 | ⚠️ **UNIQUE 제약 제거** 필요; OrganizationProvider 리팩토링 (1 currentRole → memberships[], selectedMembership) | **HIGH** | 🔄 테이블 구조 재사용, RLS 정책 유지 가능 |
| **R2. 컨텍스트 스위처 (로그아웃 없이 역할 전환)** | 없음; parent만 별도 ParentShell; 강사/관리자 전환 시 OrganizationSelector 재선택 필요 | ⚠️ **새 UI 컴포넌트** 필요: \<RoleContextSwitcher> (헤더/사이드바에 통합) | **HIGH** | ✅ ParentShell 진입 로직 참고 가능 |
| **R3. 고객 회원가입 플로우** | customers = 사업주/강사 수동 등록 only | ⚠️ **신규 플로우 3단계**: (a) 학원 검색 API, (b) join_requests 테이블 + RPC, (c) 승인 → organization_members (role: customer/member) | **HIGH** | 🔄 PR #73의 강사 가입 플로우 참고 (organization_join_requests 재사용 또는 별도 customer_join_requests) |
| **R4. 역할 enum 확장** | MemberRole = 5종 (owner/admin/manager/staff/parent) | 🔶 **Enum 확장**: + instructor, member, customer, guardian; 기존 'staff' → 'instructor' 마이그레이션 필요? 'parent' → 'guardian' 용어 통일? | **MEDIUM** | ✅ 기존 role 유지하며 추가 (backward compatible) |
| **R5. 조직 공개 코드 + QR** | organizations.slug (UNIQUE, null 가능) — 내부 URL용 | 🔶 **신규 컬럼**: organizations.public_code (6자리 영숫자, UNIQUE), public_qr_enabled | **MEDIUM** | 🔄 slug 재사용 가능하나, public_code는 짧고 사용자 친화적 형식 필요 |
| **R6. `/c/{code}` 공개 랜딩 페이지** | 없음 | ⚠️ **신규 페이지**: PublicOrgLanding.tsx (로그인 불필요, public RLS 허용) | **MEDIUM** | ✅ 법적 고지 페이지 (src/core/legal) 참고 |
| **R7. 사업주/강사/학부모 회원가입 분기** | 현재 signUp 시 business 있으면 owner, 없으면 user만 생성 | 🔶 **신규 UI**: SignUpTypeSelector (사업주/강사/학부모/고객 선택) → 각 플로우로 분기 | **MEDIUM** | 🔄 PR #73 (강사/학부모 분기) 일부 구현됨 (DRAFT) |
| **R8. Guardian-Child 글로벌 M:N 모델** | ✅ **이미 구현**: parent_student_guardians + student_enrollments | ✅ **정리 필요**: legacy parent_student_links와 동기화 로직 정리; org_parent_profiles 투영 활용 | **LOW** | ✅ 재사용 100% |
| **R9. 학부모 사전 자녀 등록 후 조직 가입 신청** | 부분 구현: parent_register_child RPC 존재 | 🔶 **신규 플로우**: 학부모가 children 목록 → 조직 검색 → 특정 자녀 선택 → join_request with consent | **MEDIUM** | ✅ parent_register_child + guardian_link 재사용 |
| **R10. 자녀 PIN 체크인 (선택 모듈)** | ✅ **이미 구현**: attendance_sessions.check_in_method='pin', check_in_pin_hash, parent_set_child_check_in_pin RPC | ✅ **설정 확인**: settings.modules.attendance.enabled; 업종별 on/off | **LOW** | ✅ 재사용 100% |
| **R11. 성인 고객 자가 예약/스케줄** | ✅ **기존 schedules 테이블** 사용 가능 | 🔶 **신규 UI**: CustomerBookingView (고객 role로 로그인 시 본인 스케줄 조회/예약) | **MEDIUM** | ✅ core.schedules 재사용 |
| **R12. Core vs Module 경계 명확화** | 부분 구현: core/* vs modules/{piano,gym,daycare,pilates}/* | 🔶 **정리 작업**: 멤버십/패스 → 모듈 (현재 core.services 사용); 파일 업로드 → 별도 모듈 (현재 일부 embedded) | **MEDIUM** | ✅ 플러그인 구조 재사용 |
| **R13. 여러 조직 탈퇴 후 재가입 (soft-leave)** | customers.status='inactive'; student_enrollments.status='leave'/'withdrawn' | ✅ **이미 지원**: 탈퇴 시 leave 상태로 전환, 재가입 시 active 복원 | **LOW** | ✅ 재사용 100% |
| **R14. Multi-tenant RLS** | ✅ **이미 구현**: organization_id 기반 RLS 정책 전체 테이블 적용 | ✅ **강화 필요**: public 조회 (조직 검색/공개 정보) 정책 추가 | **LOW** | ✅ 기존 RLS 유지 |
| **R15. Email Auth 유지, Naver/Kakao OAuth 나중** | ✅ Email/Password 인증 사용 중 | ✅ **메모만**: OAuth는 Phase 5+ 연기 | **N/A** | ✅ — |

**범례:**

- ⚠️ **HIGH** — 핵심 아키텍처 변경 필요 (테이블/제약/Provider 리팩토링)
- 🔶 **MEDIUM** — 신규 기능/UI/RPC 추가, 기존 로직 수정
- ✅ **LOW** — 이미 구현됨 또는 소폭 정리만 필요

---

### 3.2 데이터베이스 변경 제안 (Additive Migrations)

#### 3.2.1 organization_members 테이블 (1인 N역할 지원)

**현재:**

```sql
CREATE TABLE core.organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
  role            core.member_role NOT NULL DEFAULT 'staff',
  staff_id        UUID REFERENCES core.staff(id) ON DELETE SET NULL,
  parent_customer_id UUID,  -- legacy parent link
  is_active       BOOLEAN NOT NULL DEFAULT true,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)  -- ⚠️ 제약
);
```

**변경 안 (Option A: 제약 제거, 복합키 + role 구분):**

```sql
-- 마이그레이션: 20260904100000_multi_role_memberships.sql

-- 1) UNIQUE 제약 제거
ALTER TABLE core.organization_members
  DROP CONSTRAINT IF EXISTS organization_members_organization_id_user_id_key;

-- 2) 새 UNIQUE 제약: 1인 1조직 내 동일 role 중복 불가
ALTER TABLE core.organization_members
  ADD CONSTRAINT organization_members_org_user_role_unique
  UNIQUE (organization_id, user_id, role);

-- 3) role enum 확장 (기존 유지하며 추가)
ALTER TYPE core.member_role ADD VALUE IF NOT EXISTS 'instructor';
ALTER TYPE core.member_role ADD VALUE IF NOT EXISTS 'member';
ALTER TYPE core.member_role ADD VALUE IF NOT EXISTS 'customer';
ALTER TYPE core.member_role ADD VALUE IF NOT EXISTS 'guardian';

-- 4) 새 컬럼 추가 (선택)
ALTER TABLE core.organization_members
  ADD COLUMN IF NOT EXISTS display_name TEXT;  -- 역할별 표시명 (예: "홍길동 강사", "김철수 회원")
```

**영향:**

- ✅ **후방 호환**: 기존 1인 1조직 1역할 데이터 그대로 유지
- ✅ **확장 가능**: 동일 user_id가 동일 org에 여러 role로 존재 가능 (예: owner + instructor)
- ⚠️ **앱 코드 변경 필요**: OrganizationProvider에서 `currentRole` → `selectedMembership: {orgId, role}` 또는 `memberships[]` 배열

#### 3.2.2 조직 공개 코드/QR

```sql
-- 20260904110000_public_org_codes.sql

ALTER TABLE core.organizations
  ADD COLUMN IF NOT EXISTS public_code VARCHAR(8) UNIQUE;  -- 예: "MOA12AB3"
  ADD COLUMN IF NOT EXISTS public_qr_enabled BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_organizations_public_code ON core.organizations(public_code);

-- RPC: 공개 조직 검색 (로그인 불필요)
CREATE OR REPLACE FUNCTION core.search_public_organizations(
  p_query TEXT,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  industry_type TEXT,
  public_code VARCHAR(8),
  slug TEXT,
  address TEXT  -- from settings->'address'
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = core, public
AS $$
  SELECT
    o.id,
    o.name,
    o.industry_type,
    o.public_code,
    o.slug,
    (o.settings->>'address')::TEXT AS address
  FROM core.organizations o
  WHERE o.is_active = true
    AND o.public_code IS NOT NULL
    AND (
      o.name ILIKE '%' || p_query || '%'
      OR o.public_code ILIKE p_query || '%'
    )
  ORDER BY
    CASE WHEN o.public_code ILIKE p_query || '%' THEN 0 ELSE 1 END,
    o.name
  LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION core.search_public_organizations TO anon, authenticated;

-- RPC: 공개 코드로 조직 정보 조회 (로그인 불필요)
CREATE OR REPLACE FUNCTION core.get_public_organization_by_code(p_code VARCHAR(8))
RETURNS TABLE (
  id UUID,
  name TEXT,
  industry_type TEXT,
  public_code VARCHAR(8),
  address TEXT,
  phone TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = core, public
AS $$
  SELECT
    o.id,
    o.name,
    o.industry_type,
    o.public_code,
    (o.settings->>'address')::TEXT AS address,
    (o.settings->>'phone')::TEXT AS phone
  FROM core.organizations o
  WHERE o.public_code = p_code
    AND o.is_active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION core.get_public_organization_by_code TO anon, authenticated;
```

#### 3.2.3 고객/강사 가입 신청 테이블

**Option A: PR #73 organization_join_requests 확장 (강사 + 고객 통합)**

```sql
-- PR #73 이미 구현 (DRAFT): organization_join_requests
-- 확장: applicant_type 컬럼 추가로 강사/고객 구분

ALTER TABLE core.organization_join_requests
  ADD COLUMN IF NOT EXISTS applicant_type TEXT NOT NULL DEFAULT 'instructor';  -- 'instructor' | 'customer' | 'member'

-- 고객 가입 시 추가 정보 (선택)
ALTER TABLE core.organization_join_requests
  ADD COLUMN IF NOT EXISTS customer_metadata JSONB;  -- {birth_date, interests, referral_source, ...}
```

**Option B: 별도 customer_join_requests 테이블 (강사와 분리)**

```sql
-- 20260904120000_customer_join_requests.sql

DO $$ BEGIN
  CREATE TYPE core.join_request_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS core.customer_join_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES core.organizations(id) ON DELETE CASCADE,
  applicant_user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
  applicant_name    TEXT NOT NULL,
  applicant_phone   TEXT,
  applicant_email   TEXT,
  request_type      TEXT NOT NULL DEFAULT 'membership',  -- 'membership' | 'trial' | 'consultation'
  message           TEXT,
  customer_metadata JSONB,  -- {birth_date, interests, referral_source, preferred_instructor, ...}
  status            core.join_request_status NOT NULL DEFAULT 'pending',
  reviewed_by       UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
  reviewed_at       TIMESTAMPTZ,
  reject_reason     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_join_requests_org ON core.customer_join_requests(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_customer_join_requests_user ON core.customer_join_requests(applicant_user_id);

-- RLS: 신청자 본인 조회 가능
CREATE POLICY customer_join_requests_select_own ON core.customer_join_requests
  FOR SELECT TO authenticated
  USING (applicant_user_id = auth.uid());

-- RLS: 조직 owner/admin 조회 가능
CREATE POLICY customer_join_requests_select_org ON core.customer_join_requests
  FOR SELECT TO authenticated
  USING (core.is_org_owner_or_admin(organization_id));

-- RPC: 고객 가입 신청
CREATE OR REPLACE FUNCTION core.submit_customer_join_request(
  p_org_id UUID,
  p_applicant_name TEXT,
  p_applicant_phone TEXT,
  p_applicant_email TEXT,
  p_request_type TEXT DEFAULT 'membership',
  p_message TEXT DEFAULT NULL,
  p_customer_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_request_id UUID;
BEGIN
  INSERT INTO core.customer_join_requests (
    organization_id,
    applicant_user_id,
    applicant_name,
    applicant_phone,
    applicant_email,
    request_type,
    message,
    customer_metadata
  ) VALUES (
    p_org_id,
    auth.uid(),
    p_applicant_name,
    p_applicant_phone,
    p_applicant_email,
    p_request_type,
    p_message,
    p_customer_metadata
  )
  RETURNING id INTO v_request_id;

  RETURN v_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION core.submit_customer_join_request TO authenticated;

-- RPC: 승인 (owner/admin만)
CREATE OR REPLACE FUNCTION core.approve_customer_join_request(
  p_request_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_req RECORD;
  v_customer_id UUID;
  v_membership_id UUID;
BEGIN
  -- 요청 정보 조회
  SELECT * INTO v_req
  FROM core.customer_join_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_req.status != 'pending' THEN
    RAISE EXCEPTION 'Request already processed';
  END IF;

  -- 권한 확인
  IF NOT core.is_org_owner_or_admin(v_req.organization_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- customer 레코드 생성
  INSERT INTO core.customers (
    organization_id,
    name,
    phone,
    email,
    status,
    metadata
  ) VALUES (
    v_req.organization_id,
    v_req.applicant_name,
    COALESCE(v_req.applicant_phone, ''),
    COALESCE(v_req.applicant_email, ''),
    'active',
    COALESCE(v_req.customer_metadata, '{}'::JSONB)
  )
  RETURNING id INTO v_customer_id;

  -- organization_members 생성 (role: customer 또는 member)
  INSERT INTO core.organization_members (
    organization_id,
    user_id,
    role
  ) VALUES (
    v_req.organization_id,
    v_req.applicant_user_id,
    'customer'  -- 또는 'member' (업종에 따라)
  )
  RETURNING id INTO v_membership_id;

  -- 요청 상태 업데이트
  UPDATE core.customer_join_requests
  SET status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = p_request_id;

  RETURN json_build_object(
    'customer_id', v_customer_id,
    'membership_id', v_membership_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION core.approve_customer_join_request TO authenticated;

-- RPC: 반려
CREATE OR REPLACE FUNCTION core.reject_customer_join_request(
  p_request_id UUID,
  p_reject_reason TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = core, public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM core.customer_join_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF NOT core.is_org_owner_or_admin(v_org_id) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  UPDATE core.customer_join_requests
  SET status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reject_reason = p_reject_reason
  WHERE id = p_request_id;
END;
$$;

GRANT EXECUTE ON FUNCTION core.reject_customer_join_request TO authenticated;
```

**권장:** Option B (별도 테이블) — 고객/강사 플로우가 달라 테이블 분리가 명확함.

#### 3.2.4 기타 마이그레이션 (선택)

```sql
-- 20260904130000_role_display_names.sql
-- 역할별 표시명 개선 (UI 표시용)

CREATE TABLE IF NOT EXISTS core.role_display_config (
  role          core.member_role PRIMARY KEY,
  label_ko      TEXT NOT NULL,
  badge_ko      TEXT NOT NULL,
  icon          TEXT,  -- lucide-react icon name
  sort_order    INT NOT NULL DEFAULT 0
);

INSERT INTO core.role_display_config (role, label_ko, badge_ko, icon, sort_order) VALUES
  ('owner', '원장', '원장', 'crown', 10),
  ('admin', '관리자', '관리', 'shield', 20),
  ('manager', '매니저', '매니저', 'briefcase', 30),
  ('staff', '직원', '직원', 'user', 40),
  ('instructor', '강사', '강사', 'graduation-cap', 50),
  ('member', '회원', '회원', 'user-check', 60),
  ('customer', '고객', '고객', 'user-circle', 70),
  ('guardian', '학부모', '학부', 'users', 80)
ON CONFLICT (role) DO NOTHING;
```

---

### 3.3 프론트엔드 변경 제안

#### 3.3.1 OrganizationProvider 리팩토링 (1인 N역할 지원)

**현재:**

```typescript
// src/core/organizations/OrganizationProvider.tsx
const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
const [currentRole, setCurrentRole] = useState<MemberRole | null>(null);
```

**제안:**

```typescript
// src/core/organizations/OrganizationProvider.tsx (refactored)

interface MembershipContext {
  membershipId: string;
  organizationId: string;
  role: MemberRole;
  staffId: string | null;
  parentCustomerId: string | null;
  organization: Organization;
}

const [memberships, setMemberships] = useState<MembershipContext[]>([]);
const [selectedMembership, setSelectedMembership] = useState<MembershipContext | null>(null);
const [globalParentId, setGlobalParentId] = useState<string | null>(null);
const [canAccessParentPortal, setCanAccessParentPortal] = useState(false);

// Helper getters
const currentOrganization = selectedMembership?.organization ?? null;
const currentRole = selectedMembership?.role ?? null;
const currentStaffId = selectedMembership?.staffId ?? null;

// 컨텍스트 전환
const switchMembership = (membershipId: string) => {
  const membership = memberships.find(m => m.membershipId === membershipId);
  if (membership) {
    setSelectedMembership(membership);
    orgService.storeSelectedMembershipId(membershipId);
  }
};

// 학부모 포털 진입 (조직 없음)
const enterParentPortal = () => {
  setSelectedMembership(null);
  setParentPortalModeActive(true);
};
```

#### 3.3.2 RoleContextSwitcher 컴포넌트

```tsx
// src/core/organizations/RoleContextSwitcher.tsx

export const RoleContextSwitcher: React.FC = () => {
  const { memberships, selectedMembership, switchMembership, canAccessParentPortal, enterParentPortal, parentPortalActive } = useOrganization();
  const [open, setOpen] = useState(false);

  // 섹션 분류
  const ownerMemberships = memberships.filter(m => ['owner', 'admin', 'manager'].includes(m.role));
  const instructorMemberships = memberships.filter(m => m.role === 'instructor' || m.role === 'staff');
  const customerMemberships = memberships.filter(m => ['customer', 'member'].includes(m.role));

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100">
        {parentPortalActive ? (
          <>
            <Users className="w-5 h-5" />
            <span>학부모 포털</span>
          </>
        ) : selectedMembership ? (
          <>
            <Building2 className="w-5 h-5" />
            <span>{selectedMembership.organization.name}</span>
            <span className="text-xs text-slate-500">{getUserRoleLabel(selectedMembership.role)}</span>
          </>
        ) : (
          <span>역할 선택</span>
        )}
        <ChevronDown className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
          {/* 사업장 관리 */}
          {ownerMemberships.length > 0 && (
            <Section title="사업장 관리">
              {ownerMemberships.map(m => (
                <MembershipItem key={m.membershipId} membership={m} onClick={switchMembership} />
              ))}
            </Section>
          )}

          {/* 강사로 활동 */}
          {instructorMemberships.length > 0 && (
            <Section title="강사로 활동">
              {instructorMemberships.map(m => (
                <MembershipItem key={m.membershipId} membership={m} onClick={switchMembership} />
              ))}
            </Section>
          )}

          {/* 내가 다니는 곳 */}
          {customerMemberships.length > 0 && (
            <Section title="내가 다니는 곳">
              {customerMemberships.map(m => (
                <MembershipItem key={m.membershipId} membership={m} onClick={switchMembership} />
              ))}
            </Section>
          )}

          {/* 학부모 포털 */}
          {canAccessParentPortal && (
            <button onClick={() => { enterParentPortal(); setOpen(false); }} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-indigo-50 border-t">
              <Users className="w-5 h-5 text-indigo-600" />
              <div className="flex-1 text-left">
                <div className="font-medium text-slate-900">학부모 포털</div>
                <div className="text-xs text-slate-500">자녀 정보 및 일정 확인</div>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
```

#### 3.3.3 회원가입 타입 선택

```tsx
// src/core/auth/components/SignUpTypeSelector.tsx

type SignUpType = 'business' | 'instructor' | 'customer' | 'guardian';

export const SignUpTypeSelector: React.FC<{ onSelect: (type: SignUpType) => void }> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <TypeCard
        icon={Building2}
        title="사업주"
        description="학원·체육관·시설 운영"
        onClick={() => onSelect('business')}
      />
      <TypeCard
        icon={GraduationCap}
        title="강사"
        description="학원에서 강의 활동"
        onClick={() => onSelect('instructor')}
      />
      <TypeCard
        icon={UserCheck}
        title="고객"
        description="학원·시설 이용"
        onClick={() => onSelect('customer')}
      />
      <TypeCard
        icon={Users}
        title="학부모"
        description="자녀 정보 관리"
        onClick={() => onSelect('guardian')}
      />
    </div>
  );
};

// 각 타입별 플로우:
// - business → CreateOrganizationWizard (기존)
// - instructor → InstructorSignUpFlow (학원 검색 → 가입 신청)
// - customer → CustomerSignUpFlow (학원 검색/QR → 가입 신청 또는 상담 예약)
// - guardian → GuardianSignUpFlow (자녀 등록 → 학원 연결 나중에 또는 초대 코드)
```

#### 3.3.4 고객 가입 플로우 (3단계)

```tsx
// src/core/customer/components/CustomerSignUpFlow.tsx

// Step 1: 학원 검색
function SearchOrganizationStep() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicOrgInfo[]>([]);
  
  const handleSearch = async () => {
    const { data } = await supabase.rpc('search_public_organizations', { p_query: query });
    setResults(data ?? []);
  };

  return (
    <div>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="학원 이름 또는 코드 검색" />
      <button onClick={handleSearch}>검색</button>
      {results.map(org => (
        <OrgCard key={org.id} org={org} onSelect={() => goToStep2(org)} />
      ))}
    </div>
  );
}

// Step 2: 가입 신청서 작성
function JoinRequestFormStep({ org }: { org: PublicOrgInfo }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });

  const handleSubmit = async () => {
    const { data } = await supabase.rpc('submit_customer_join_request', {
      p_org_id: org.id,
      p_applicant_name: form.name,
      p_applicant_phone: form.phone,
      p_applicant_email: form.email,
      p_message: form.message
    });
    goToStep3();
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{org.name} 가입 신청</h2>
      <input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="이름" required />
      <input name="phone" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="연락처" required />
      <input name="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="이메일" required />
      <textarea name="message" value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="간단한 소개 (선택)" />
      <button type="submit">가입 신청</button>
    </form>
  );
}

// Step 3: 신청 완료 / 대기 안내
function JoinRequestPendingStep() {
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);

  useEffect(() => {
    // 본인의 신청 목록 조회
    const fetchMyRequests = async () => {
      const { data } = await supabase
        .from('customer_join_requests')
        .select('*')
        .eq('applicant_user_id', user.id)
        .order('created_at', { ascending: false });
      setMyRequests(data ?? []);
    };
    fetchMyRequests();
  }, []);

  return (
    <div>
      <h2>가입 신청 완료</h2>
      <p>학원 담당자가 승인하면 알림을 보내드립니다.</p>
      <h3>내 신청 현황</h3>
      {myRequests.map(req => (
        <RequestStatusCard key={req.id} request={req} />
      ))}
    </div>
  );
}
```

#### 3.3.5 원장/관리자 승인 UI

```tsx
// src/core/customer/components/CustomerJoinRequestsPanel.tsx

export const CustomerJoinRequestsPanel: React.FC = () => {
  const { currentOrganization } = useOrganization();
  const [requests, setRequests] = useState<JoinRequest[]>([]);

  useEffect(() => {
    if (!currentOrganization) return;
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('customer_join_requests')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });
      setRequests(data ?? []);
    };
    fetchRequests();
  }, [currentOrganization]);

  const handleApprove = async (requestId: string) => {
    await supabase.rpc('approve_customer_join_request', { p_request_id: requestId });
    showToast('가입 승인 완료', 'success');
    // refresh
  };

  const handleReject = async (requestId: string, reason: string) => {
    await supabase.rpc('reject_customer_join_request', { p_request_id: requestId, p_reject_reason: reason });
    showToast('가입 반려', 'info');
    // refresh
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-4">고객 가입 신청 ({requests.length})</h2>
      {requests.length === 0 ? (
        <p className="text-slate-500">새로운 신청이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map(req => (
            <RequestCard key={req.id} request={req} onApprove={handleApprove} onReject={handleReject} />
          ))}
        </ul>
      )}
    </div>
  );
};

// 직원 관리 화면 (StaffManagementView.tsx)에 통합:
<Tabs>
  <Tab label="직원 목록" />
  <Tab label="강사 가입 신청" />  {/* PR #73 */}
  <Tab label="고객 가입 신청" />  {/* 신규 */}
</Tabs>
```

#### 3.3.6 공개 조직 랜딩 페이지 (`/c/{code}`)

```tsx
// src/core/public/PublicOrgLanding.tsx

export const PublicOrgLanding: React.FC<{ code: string }> = ({ code }) => {
  const [org, setOrg] = useState<PublicOrgInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrg = async () => {
      const { data } = await supabase.rpc('get_public_organization_by_code', { p_code: code });
      setOrg(data?.[0] ?? null);
      setLoading(false);
    };
    fetchOrg();
  }, [code]);

  if (loading) return <LoadingScreen />;
  if (!org) return <NotFoundScreen message="학원을 찾을 수 없습니다." />;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <header className="bg-white shadow-sm px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-900">{org.name}</h1>
        <p className="text-sm text-slate-600">{getIndustryLabel(org.industry_type)}</p>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-6">
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-2">학원 정보</h2>
          <dl className="space-y-2">
            <div><dt className="font-medium">주소:</dt><dd>{org.address}</dd></div>
            <div><dt className="font-medium">전화:</dt><dd>{org.phone}</dd></div>
            <div><dt className="font-medium">공개 코드:</dt><dd className="font-mono">{org.public_code}</dd></div>
          </dl>
        </section>

        <section className="space-y-3">
          <button onClick={() => goToSignUp('customer', org)} className="w-full btn-primary">
            회원 가입 신청
          </button>
          <button onClick={() => goToConsultation(org)} className="w-full btn-secondary">
            무료 상담 예약
          </button>
        </section>

        <section className="text-center">
          <QRCodeSVG value={`https://moa.app/c/${org.public_code}`} size={200} />
          <p className="text-sm text-slate-500 mt-2">QR 코드를 스캔하여 접속하세요</p>
        </section>
      </main>
    </div>
  );
};

// App.tsx 라우팅 추가:
function App() {
  const publicCode = window.location.pathname.match(/^\/c\/([A-Z0-9]+)$/)?.[1];
  if (publicCode) {
    return <PublicOrgLanding code={publicCode} />;
  }
  // 기존 AuthProvider → OrganizationProvider → ...
}
```

---

## 4. Core vs Module 경계 제안

### 4.1 현재 상태

**Core 기능** (`src/core/`, `core.*` schema):

- ✅ 조직/멤버십/역할 (organizations, organization_members, profiles)
- ✅ 고객/직원/연락처 (customers, staff, customer_contacts)
- ✅ 서비스/스케줄/결제 (services, schedules, payments)
- ✅ 상담/알림 (consultations, notifications)
- ✅ 수입/지출 (income_entries, expenses)
- ✅ 출석 모듈 (attendance_sessions — 설정으로 on/off)
- ✅ 학부모 포털 (parents, students, student_enrollments, parent_student_guardians)

**Industry Modules** (`src/modules/{piano,gym,daycare,pilates}/`, `{industry}.*` schema):

- ✅ 업종별 고객 확장 (piano.customers: student_number, level, tuition_fee, teacher_id)
- ✅ 업종별 이벤트 (piano.events, piano.performance_videos, piano.recitals)
- ✅ 업종별 교육 (piano.practice_records, piano.lesson_records, daycare.care_journals)
- ✅ 업종별 재고 (piano.textbooks, piano.textbook_sales)
- ⚠️ **중복**: piano.expenses vs core.expenses (현재 분리됨)

### 4.2 제안된 Core vs Module 경계

#### **Core (모든 업종 공통)**

| 기능 | 현재 | 제안 | 비고 |
|------|------|------|------|
| 조직/멤버십/역할 | ✅ core | ✅ core | — |
| 고객 CRM | ✅ core.customers | ✅ core.customers | — |
| 직원 관리 | ✅ core.staff | ✅ core.staff | — |
| 서비스/스케줄 | ✅ core.services, core.schedules | ✅ core.services, core.schedules | — |
| 결제 (단건) | ✅ core.payments | ✅ core.payments | — |
| 수입/지출 | ✅ core.income_entries, core.expenses | ✅ core.income_entries, core.expenses | piano.expenses 통합 고려 |
| 상담 | ✅ core.consultations | ✅ core.consultations | — |
| 알림 | ✅ core.notifications | ✅ core.notifications | — |
| 출석 (PIN/QR/NFC) | ✅ core.attendance_sessions | ✅ core (모듈) | 설정으로 on/off |
| 학부모-자녀 (글로벌) | ✅ core.parents, students, ... | ✅ core | — |
| **멤버십/패스** | ❌ 없음 | 🔶 **모듈로 이동** | 필라테스/PT 등 특정 업종만 사용 |
| **파일 업로드** | ⚠️ embedded (일부 UI) | 🔶 **모듈로 이동** | Supabase Storage 연동; 전체 필수 아님 |

#### **Module (업종별 선택 기능)**

| 기능 | 업종 | 현재 | 제안 |
|------|------|------|------|
| 학생 확장 정보 | piano | ✅ piano.customers (level, tuition_fee, teacher_id) | ✅ 유지 |
| 반 편성 | piano/gym | ✅ piano.class_members | ✅ 유지 |
| 연습 기록 | piano | ✅ piano.practice_records | ✅ 유지 |
| 레슨 기록 | piano | ✅ piano.lesson_records | ✅ 유지 |
| 교재 판매 | piano | ✅ piano.textbooks, textbook_sales | ✅ 유지 |
| 이벤트 (연주회/콩쿠르) | piano | ✅ piano.events, performance_videos | ✅ 유지 |
| 케어 일지 | daycare | ✅ core.care_journals | ✅ 유지 (모듈로 분류) |
| 투약 의뢰 | daycare | ✅ core.medication_requests | ✅ 유지 (모듈로 분류) |
| 교육 과정 | daycare | ✅ core.curriculums, assignments | ✅ 유지 (모듈로 분류) |
| **멤버십/패스** | pilates/gym | ❌ 없음 | 🔶 **신규 모듈**: `membership_plans`, `membership_passes` (pilates/gym schema) |
| **파일 첨부** | 공통 | ⚠️ embedded | 🔶 **신규 모듈**: `core.attachments` (file_url, file_type, target_type, target_id) + Supabase Storage |

### 4.3 모듈 플러그인 확장 (plugin.ts)

```typescript
// src/modules/pilates/plugin.ts

export const pilatesPluginManifest: IndustryPluginManifest = {
  id: 'pilates',
  option: { value: 'pilates', label: '필라테스학원', description: '...' },
  adminTabs: ['dashboard', 'members', 'instructors', 'services', 'bookings', 'notices', 'settings'],
  staffTabs: ['dashboard', 'bookings', 'members'],
  customerTabs: ['bookings', 'schedule', 'account'],  // 🔶 신규: 고객 role 탭
  modules: {
    membership: true,  // 🔶 멤버십/패스 모듈 활성화
    attendance: false,  // PIN 체크인 비활성화 (성인 자가 예약)
    fileUpload: true,  // 🔶 파일 첨부 모듈 활성화 (프로필 사진, 수업 자료 등)
  },
  defaultSettings: {
    ...
  },
};
```

---

## 5. 단계별 로드맵 (Phased Roadmap)

### Phase 0: 문서화 및 분석 (현재 PR) ✅

**목표:** 현재 vs 목표 아키텍처 격차 분석 및 단계별 계획 수립  
**산출물:**

- ✅ `docs/MOA_MULTI_ROLE_ARCHITECTURE.md` (이 문서)
- ✅ Draft PR #?? (문서만 추가, 코드 변경 없음)

**기간:** 1일 (2026-09-04)

---

### Phase 1: 1인 N역할 모델 + 컨텍스트 스위처 ⚠️ **핵심**

**목표:** 단일 사용자가 여러 조직에서 여러 역할로 활동 가능  
**변경사항:**

1. **DB 마이그레이션:**
   - `20260904100000_multi_role_memberships.sql`
     - organization_members.UNIQUE(org_id, user_id) 제거 → UNIQUE(org_id, user_id, role)
     - role enum 확장: + instructor, member, customer, guardian
2. **백엔드:**
   - RLS 정책 검토 (다중 멤버십 지원 확인)
   - RPC: `get_user_memberships(user_id)` → MembershipContext[]
3. **프론트엔드:**
   - `OrganizationProvider.tsx` 리팩토링
     - `currentOrganization, currentRole` → `memberships[], selectedMembership`
     - `switchMembership(membershipId)`
   - `RoleContextSwitcher.tsx` 신규 (헤더/사이드바 통합)
   - `SupabaseRoleSync.tsx` 수정 (selectedMembership 기반)
4. **테스트:**
   - 1 user → 2 orgs (owner + instructor) 시나리오
   - 컨텍스트 전환 시 탭/데이터 격리 확인
   - 기존 1인 1조직 사용자 후방 호환 확인

**기간:** 2-3주  
**우선순위:** P0 (다른 Phase 의존성)

---

### Phase 2: 고객 회원가입 플로우 (학원 검색 + 가입 신청 + 승인)

**목표:** 고객이 직접 학원 검색 → 가입 신청 → 원장 승인  
**변경사항:**

1. **DB 마이그레이션:**
   - `20260904110000_public_org_codes.sql`
     - organizations.public_code, public_qr_enabled
     - RPC: search_public_organizations, get_public_organization_by_code
   - `20260904120000_customer_join_requests.sql`
     - customer_join_requests 테이블 + RLS
     - RPC: submit_customer_join_request, approve_customer_join_request, reject_customer_join_request
2. **프론트엔드:**
   - `SignUpTypeSelector.tsx` (사업주/강사/고객/학부모 분기)
   - `CustomerSignUpFlow.tsx` (3단계: 검색 → 신청 → 대기)
   - `CustomerJoinRequestsPanel.tsx` (원장/관리자 승인 UI)
   - `PublicOrgLanding.tsx` (`/c/{code}` 공개 페이지)
3. **테스트:**
   - 공개 조직 검색 (로그인 전)
   - 고객 가입 신청 → 원장 승인 → organization_members (role: customer) 생성 확인
   - QR 코드 스캔 → 랜딩 페이지 → 가입 신청

**기간:** 2-3주  
**의존성:** Phase 1 완료 (다중 역할 지원)  
**우선순위:** P0

---

### Phase 3: 학부모-자녀 글로벌 모델 통합 + 사전 등록 플로우

**목표:** 학부모가 자녀 먼저 등록 → 학원 연결 신청 (동의 필수)  
**변경사항:**

1. **DB 정리:**
   - legacy `parent_student_links` 동기화 로직 정리 (또는 deprecate)
   - 글로벌 모델 (parents, students, parent_student_guardians, student_enrollments) 완전 전환
2. **프론트엔드:**
   - `GuardianSignUpFlow.tsx`
     - Step 1: 자녀 등록 (parent_register_child)
     - Step 2: 학원 검색 (선택)
     - Step 3: 자녀별 학원 가입 신청 (동의 체크)
   - `ParentChildrenHome.tsx` 개선
     - 자녀 카드 → "학원 추가" 버튼 (조직 검색 → join request)
3. **테스트:**
   - 학부모 회원가입 → 자녀 2명 등록 → 학원 A에 자녀1 가입 신청 → 승인 확인
   - 학부모 포털에서 자녀별 조직 분리 표시 확인

**기간:** 2주  
**의존성:** Phase 2 완료 (고객 가입 플로우 재사용)  
**우선순위:** P1

---

### Phase 4: Module 경계 정리 (멤버십/패스, 파일 업로드)

**목표:** Core vs Module 명확화; 업종별 선택 기능 모듈화  
**변경사항:**

1. **DB 마이그레이션:**
   - `20260904140000_membership_module.sql` (pilates/gym 전용)
     - membership_plans (name, duration_days, price, credits, ...)
     - membership_passes (customer_id, plan_id, start_date, expire_date, remaining_credits, ...)
   - `20260904150000_attachments_module.sql` (공통 선택 모듈)
     - core.attachments (target_type, target_id, file_url, file_type, uploaded_by)
2. **프론트엔드:**
   - `src/modules/pilates/components/memberships/` (멤버십 관리 UI)
   - `src/core/attachments/` (파일 업로드 공통 컴포넌트)
3. **플러그인 설정:**
   - plugin.ts에 `modules: { membership, fileUpload }` 설정 추가
4. **테스트:**
   - 필라테스 학원: 멤버십 생성 → 고객 패스 발급 → 크레딧 차감
   - 피아노 학원: 멤버십 기능 비활성화 확인

**기간:** 2-3주  
**의존성:** Phase 2 완료 (고객 role 존재)  
**우선순위:** P1

---

### Phase 5: PR #73 통합 (강사 가입 신청) + 기존 온보딩 정리

**목표:** PR #73 (강사 가입 신청 + 학부모 분기) 머지 및 Phase 1-3과 통합  
**변경사항:**

1. **PR #73 리베이스:**
   - organization_join_requests 테이블 유지 (강사 전용)
   - Phase 2의 customer_join_requests와 분리 또는 통합 (applicant_type 컬럼)
2. **온보딩 마법사 정리:**
   - 구 OnboardingWizard.tsx (LocalStorage 기반) → 제거 또는 archive
   - CreateOrganizationWizard.tsx → 사업주 전용 유지
3. **테스트:**
   - 강사 회원가입 → 학원 검색 → 가입 신청 → 원장 승인 → organization_members (role: instructor) 생성 확인
   - 사업주/강사/고객/학부모 4가지 회원가입 플로우 end-to-end

**기간:** 1-2주  
**의존성:** Phase 1, 2 완료; PR #73 DRAFT 상태 해제  
**우선순위:** P1

---

### Phase 6: 모바일 UX 최적화 + 컨텍스트 스위처 Capacitor 통합

**목표:** 모바일 앱(iOS/Android)에서 역할 전환 UX 개선  
**변경사항:**

1. **프론트엔드:**
   - RoleContextSwitcher → 모바일 BottomSheet 또는 Drawer
   - Capacitor Share Plugin으로 QR 코드 / 공개 링크 공유
2. **테스트:**
   - iOS/Android 빌드 → QR 스캔 → 공개 페이지 → 가입 신청
   - 푸시 알림 (가입 승인/반려)

**기간:** 1-2주  
**의존성:** Phase 1-5 완료  
**우선순위:** P2

---

### Phase 7+: 향후 확장 (OAuth, 결제 연동, AI 추천)

- **Phase 7:** Naver/Kakao OAuth 로그인 (auth_providers 테이블 + register_auth_provider RPC 활용)
- **Phase 8:** 결제 모듈 (Toss Payments, Stripe 연동 → core.payments 확장)
- **Phase 9:** AI 추천 (Google Gemini API 활용 → 학원 추천, 강사 매칭)

**우선순위:** P3 (MVP 이후)

---

## 6. 리스크 및 회귀 방지

### 6.1 주요 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|-----------|
| **R1. organization_members UNIQUE 제약 제거 시 기존 앱 코드 오류** | ⚠️ HIGH | - OrganizationProvider 리팩토링 전에 DB 마이그레이션 먼저 실행 (제약만 변경, 데이터 그대로)<br>- 기존 1인 1조직 사용자는 memberships.length=1로 동작 (후방 호환) |
| **R2. RLS 정책 미스매치 (다중 멤버십 시나리오)** | ⚠️ HIGH | - Phase 1 완료 후 RLS 정책 전수 검토<br>- 테스트 시나리오: 1 user → 2 orgs (owner + staff) → 각 조직 데이터 격리 확인 |
| **R3. SupabaseRoleSync 무한 루프 (상태 변경 감지)** | 🔶 MEDIUM | - useEffect 의존성 배열 최소화<br>- selectedMembership.id만 감시 (organization, role은 derived) |
| **R4. 공개 조직 검색 RPC 성능 (anon 남용)** | 🔶 MEDIUM | - Rate Limiting (Supabase Edge Functions 또는 Middleware)<br>- ILIKE 쿼리 인덱스 최적화 (idx_organizations_public_code, GIN index on name) |
| **R5. 고객 가입 신청 spam** | 🔶 MEDIUM | - Captcha (Cloudflare Turnstile 또는 reCAPTCHA) 추가<br>- 1인 1조직 24시간 1회 제한 (RPC 내 체크) |
| **R6. PR #73과 Phase 2 병합 충돌** | 🔶 MEDIUM | - organization_join_requests vs customer_join_requests 통합 여부 사전 결정<br>- 통합 시 applicant_type 컬럼 추가 (instructor/customer/member) |
| **R7. parent_student_links (legacy) vs 글로벌 모델 동기화 오류** | 🔶 MEDIUM | - Phase 3에서 동기화 RPC (sync_org_parent_student_links_reverse) 검증<br>- 마이그레이션 후 legacy 테이블 read-only 전환 |
| **R8. 모바일 앱 빌드 실패 (Capacitor 버전 충돌)** | ✅ LOW | - package.json 버전 고정 (capacitor@7.6.9)<br>- CI에서 iOS/Android 빌드 테스트 |

### 6.2 회귀 방지 체크리스트

**Phase 1 (다중 역할) 완료 시:**

- [ ] 기존 1인 1조직 사용자 로그인 → 조직 자동 선택 → 정상 동작 (기존 UX 유지)
- [ ] 새 사용자 → 2개 조직 (owner + staff) 생성 → RoleContextSwitcher로 전환 → 각 조직 데이터 격리 확인
- [ ] parent role 사용자 → ParentShell 진입 (기존 동작 유지)
- [ ] RLS 정책: 2개 조직 멤버가 서로 다른 조직 customers 조회 불가 확인

**Phase 2 (고객 가입) 완료 시:**

- [ ] 공개 조직 검색 (로그인 전) → 검색 결과 표시
- [ ] 고객 회원가입 → 가입 신청 → organization_members (role: customer) 생성 확인
- [ ] 원장 승인 UI → 승인 → customers 레코드 + organization_members 생성 확인
- [ ] QR 코드 스캔 (`/c/{code}`) → 공개 페이지 → 가입 신청 → 정상 동작

**Phase 3 (학부모-자녀) 완료 시:**

- [ ] 학부모 회원가입 → 자녀 등록 (parent_register_child) → parents, students, parent_student_guardians 생성 확인
- [ ] 학부모 포털 → 자녀 카드 → 학원 추가 → join request → 승인 → student_enrollments 생성 확인
- [ ] 기존 guardian_link_token 플로우 (원장 초대) 정상 동작 (후방 호환)

**Phase 4 (모듈 정리) 완료 시:**

- [ ] 필라테스 학원 → 멤버십 기능 활성화 → membership_plans, membership_passes 사용
- [ ] 피아노 학원 → 멤버십 기능 비활성화 → UI 숨김 확인
- [ ] 파일 업로드 → Supabase Storage 연동 → attachments 테이블 저장 확인

**Phase 5 (PR #73 통합) 완료 시:**

- [ ] 강사 회원가입 → 학원 검색 → 가입 신청 → 원장 승인 → organization_members (role: instructor) 생성 확인
- [ ] 사업주/강사/고객/학부모 4가지 플로우 end-to-end 테스트

---

## 7. 명시적 "재구축 금지" 목록

**다음 기능은 이미 잘 작동하고 있으므로 Phase 1-6에서 재구축하지 않음:**

1. ✅ **Auth (Email/Password)**: Supabase Auth 기반 signIn/signUp/signOut → 유지
2. ✅ **Multi-tenant RLS**: organization_id 기반 RLS 정책 전체 테이블 적용 → 유지 (공개 조회 정책만 추가)
3. ✅ **Industry Plugin 구조**: piano/gym/daycare/pilates 플러그인 + IndustryAppRouter → 유지
4. ✅ **학부모 포털 (부분)**: ParentShell, ParentAcademyPortal, parent_register_child RPC → 유지 (확장만)
5. ✅ **PIN 체크인**: attendance_sessions, check_in_pin_hash, parent_set_child_check_in_pin → 유지
6. ✅ **직원 초대**: invite_staff_member, connect_staff_on_login RPC → 유지
7. ✅ **Guardian Link (초대 코드)**: guardian_link_tokens, redeem_guardian_link_token → 유지
8. ✅ **Core 테이블 구조**: organizations, customers, staff, services, schedules, payments, consultations, notifications → 유지 (컬럼 추가만)
9. ✅ **Piano/Gym/Daycare/Pilates 모듈 테이블**: 기존 스키마 유지 (멤버십 모듈만 추가)
10. ✅ **모바일 앱 (Capacitor)**: iOS/Android 빌드 설정 → 유지 (RoleContextSwitcher만 추가)

---

## 8. 부록: 참고 파일 및 마이그레이션 목록

### 8.1 핵심 파일 경로

**프론트엔드:**

```
src/
├── App.tsx                                          # 최상위 Provider 트리
├── SupabaseAppGate.tsx                              # 인증 후 라우팅 게이트
├── SupabaseRoleSync.tsx                             # ⚠️ 수정 필요 (Phase 1)
├── core/
│   ├── auth/
│   │   ├── AuthProvider.tsx                         # 인증 상태 관리
│   │   ├── components/AuthLayout.tsx                # ⚠️ 수정 필요 (Phase 2: SignUpTypeSelector)
│   │   ├── permissions.ts                           # 역할별 권한 로직
│   │   └── services/authService.ts
│   ├── organizations/
│   │   ├── OrganizationProvider.tsx                 # ⚠️ 리팩토링 필요 (Phase 1)
│   │   ├── OrganizationSelector.tsx                 # ⚠️ 수정 필요 (RoleContextSwitcher 통합)
│   │   ├── CreateOrganizationWizard.tsx
│   │   └── services/organizationService.ts
│   ├── industry/
│   │   ├── IndustryAppRouter.tsx
│   │   ├── registry.ts
│   │   └── pluginTypes.ts
│   ├── parent/
│   │   └── services/parentPortalService.ts
│   └── staff/
│       └── services/staffAccountService.ts
├── modules/
│   ├── piano/plugin.ts
│   ├── pilates/plugin.ts
│   ├── gym/plugin.ts
│   ├── daycare/plugin.ts
│   └── parent/ParentShell.tsx
└── context/AppContext.tsx

supabase/
└── migrations/
    ├── 20260822000001_create_core_schema.sql
    ├── 20260822000002_create_core_tables.sql
    ├── 20260822000003_create_core_rls.sql
    ├── 20260822000004_create_core_auth_triggers.sql
    ├── 20260822120000_staff_invitations_and_connect.sql
    ├── 20260822190000_global_parent_student_enrollments.sql  # 글로벌 모델
    ├── 20260822200000_guardian_link_tokens_rpcs.sql
    ├── 20260826320000_parent_child_check_in_pin.sql
    ├── 20260904100000_multi_role_memberships.sql             # ⚠️ Phase 1 신규
    ├── 20260904110000_public_org_codes.sql                   # ⚠️ Phase 2 신규
    ├── 20260904120000_customer_join_requests.sql             # ⚠️ Phase 2 신규
    ├── 20260904140000_membership_module.sql                  # ⚠️ Phase 4 신규
    └── 20260904150000_attachments_module.sql                 # ⚠️ Phase 4 신규
```

### 8.2 기존 마이그레이션 요약 (관련 항목)

| 마이그레이션 파일 | 내용 | Phase 연관 |
|------------------|------|-----------|
| 20260822000002_create_core_tables.sql | organizations, profiles, organization_members, customers, staff, services, schedules, payments | Phase 1 수정 대상 |
| 20260822000003_create_core_rls.sql | RLS 정책 + helper 함수 (is_org_member, get_org_role, ...) | Phase 1/2 검토 |
| 20260822120000_staff_invitations_and_connect.sql | invite_staff_member, connect_staff_on_login | Phase 5 참고 |
| 20260822190000_global_parent_student_enrollments.sql | parents, students, parent_student_guardians, student_enrollments, guardian_link_tokens | Phase 3 재사용 |
| 20260822200000_guardian_link_tokens_rpcs.sql | create_guardian_link_token, redeem_guardian_link_token, parent_register_child | Phase 3 재사용 |
| 20260826320000_parent_child_check_in_pin.sql | check_in_pin_hash, parent_set_child_check_in_pin | Phase 3 재사용 |

---

## 9. 결론 및 다음 단계

### 9.1 핵심 요약

1. **현재 아키텍처 강점:**
   - ✅ 업종별 플러그인 구조 (piano/gym/daycare/pilates) 잘 설계됨
   - ✅ Multi-tenant RLS 전체 적용
   - ✅ 학부모-자녀 글로벌 모델 (부분) 구현됨
   - ✅ PIN 체크인, 직원 초대, Guardian Link 기능 동작

2. **주요 격차:**
   - ⚠️ **HIGH**: 1인 1조직 1역할 → 1인 N조직 N역할 전환 필요 (organization_members UNIQUE 제약 + OrganizationProvider 리팩토링)
   - ⚠️ **HIGH**: 컨텍스트 스위처 없음 (로그아웃 없이 역할 전환 불가)
   - ⚠️ **HIGH**: 고객 자가 회원가입 플로우 없음 (학원 검색 + 가입 신청 + 승인)
   - 🔶 **MEDIUM**: 조직 공개 코드/QR, 학부모 사전 자녀 등록 플로우, Core vs Module 경계 명확화

3. **권장 우선순위:**
   - **P0 (필수):** Phase 1 (다중 역할) → Phase 2 (고객 가입) → Phase 3 (학부모-자녀)
   - **P1 (중요):** Phase 4 (모듈 정리) → Phase 5 (PR #73 통합)
   - **P2 (개선):** Phase 6 (모바일 UX)
   - **P3 (향후):** Phase 7+ (OAuth, 결제, AI)

### 9.2 다음 단계 (이 PR 이후)

1. **이 PR 머지:**
   - Draft PR (docs-only) 생성 → 리뷰 → 승인 → main 머지
2. **Phase 1 착수:**
   - 브랜치: `cursor/multi-role-memberships-{suffix}`
   - 마이그레이션: `20260904100000_multi_role_memberships.sql` 작성
   - OrganizationProvider 리팩토링
   - RoleContextSwitcher 컴포넌트 구현
   - 테스트 (1 user → 2 orgs, 컨텍스트 전환)
3. **Phase 2 착수:**
   - 브랜치: `cursor/customer-signup-flow-{suffix}`
   - 마이그레이션: `20260904110000_public_org_codes.sql`, `20260904120000_customer_join_requests.sql`
   - CustomerSignUpFlow, CustomerJoinRequestsPanel, PublicOrgLanding 구현
   - 테스트 (공개 조직 검색, 가입 신청, 승인)

---

## 10. FAQ

**Q1. 기존 사용자 데이터는 어떻게 되나요?**

A: 모든 마이그레이션은 **additive** (추가만)이거나 **backward compatible** (후방 호환)입니다. 기존 1인 1조직 1역할 데이터는 그대로 유지되며, 새 기능(다중 역할)은 선택적으로 사용 가능합니다.

**Q2. PR #73 (강사 가입 신청)은 언제 머지하나요?**

A: Phase 5에서 Phase 1-3 완료 후 리베이스 & 통합합니다. organization_join_requests 테이블을 Phase 2의 customer_join_requests와 통합할지 분리할지 결정 후 머지.

**Q3. 멤버십/패스 기능은 모든 업종에 필수인가요?**

A: 아니오. Phase 4에서 모듈로 분리하며, plugin.ts에서 `modules.membership: true/false`로 업종별 선택 활성화합니다. 필라테스/PT 등 특정 업종만 사용.

**Q4. 파일 업로드는 언제 구현하나요?**

A: Phase 4에서 선택 모듈로 추가합니다. Supabase Storage 연동 + core.attachments 테이블. 전체 필수 아님 (업종별 설정).

**Q5. OAuth (Naver/Kakao)는 언제 지원하나요?**

A: Phase 7+ (MVP 이후). 현재 auth_providers 테이블 + register_auth_provider RPC 기반은 이미 구현됨 (20260826240000_auth_providers_foundation.sql). 프론트엔드 OAuth 버튼 + 소셜 로그인 연동만 추가하면 됨.

**Q6. 모바일 앱은 어떻게 테스트하나요?**

A: Phase 6에서 iOS/Android 빌드 + QR 스캔 테스트. 현재 Capacitor@7.6.9 사용 중. CI에서 자동 빌드 검증 추가 예정.

**Q7. 이 문서는 언제 업데이트하나요?**

A: 각 Phase 완료 시마다 "완료 상태" 섹션 추가. Phase 1-6 완료 후 최종 아키텍처 다이어그램 추가 예정.

---

**문서 작성자:** Cursor Agent (bc-XXXX)  
**리뷰 요청:** @csi515 (Sungil Choi)  
**참고 자료:**

- PR #73: https://github.com/csi515/Moa/pull/73
- Supabase Migrations: `/workspace/supabase/migrations/`
- Database Types: `/workspace/src/lib/supabase/database.types.ts`

---

**변경 이력:**

- 2026-09-04: 초안 작성 (Phase 0)
