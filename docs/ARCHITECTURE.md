# MOA Architecture 1.0

> 운영 개발 표준 (Core / Module / Shared / Data / Multi-tenant).  
> 다중 역할 전환 갭·로드맵은 [MOA_MULTI_ROLE_ARCHITECTURE.md](./MOA_MULTI_ROLE_ARCHITECTURE.md)를 본다.  
> 코딩 규칙 요약: [CODING_STANDARDS.md](./CODING_STANDARDS.md)

---

## 디렉터리 책임

```
src/
├─ core/       # 여러 업종에서 동일한 의미의 비즈니스
├─ modules/    # 업종별 의미·표현이 다른 비즈니스 (piano, pilates, gym, daycare, parent)
├─ shared/     # UI / layout / utility (업종 비즈니스 로직 금지)
├─ services/   # StorageService 등 레거시·공통 서비스
├─ hooks/      # 공용 React hooks
├─ context/    # AppContext 등
├─ lib/        # supabase client, 인프라
└─ utils/      # 순수 유틸
```

### Core

여러 업종에서 **동일한 의미와 동일한 책임**을 가지는 비즈니스 기능.

예: Auth, Organization, Membership, Customer(성인 포털 포함), Schedule, Availability, Reservation, Practice rooms(canonical), Consultation, Notification, Finance(수강료 청구·수기 정산 포함), Attendance(옵션), Transport 등.

### Module

업종에 따라 의미가 달라지는 비즈니스 로직.

| Module | 예 |
|---|---|
| Piano | 학생·정규 레슨·교재·진도·연습·발표회 |
| Pilates | 그룹 수업·이용권·잔여 횟수·대기 |
| Beauty (향후) | 서비스·패키지·이용권 차감·시술 기록 |
| Daycare | 보육 일지·투약 등 |
| Parent | 학부모 포털 UX (업종별 홈 표현) |

중요: “여러 업종에서 재사용할 수 있을 것 같다”는 이유만으로 Core로 이동하지 않는다. **동일한 의미·동일한 책임**인지 먼저 판단한다.

### Shared

재사용 가능한 UI / layout / utility. 업종 비즈니스 로직을 넣지 않는다.

대표: `ModuleAppShell`, `PageHeader`, `Modal`, `ConfirmDialog`, `FormField`, `density.ts`.

---

## 계층 다이어그램

```mermaid
flowchart TB
  subgraph sharedLayer [Shared]
    Shell[ModuleAppShell]
    UI[PageHeader Modal FormField]
  end
  subgraph coreLayer [Core]
    Org[organizations]
    Sched[schedules availability reservation]
    Fin[finance]
  end
  subgraph modulesLayer [Modules]
    Piano[piano]
    Pilates[pilates]
    Gym[gym]
    Daycare[daycare]
  end
  Shell --> coreLayer
  Shell --> modulesLayer
  coreLayer --> ServicePath[Service getCoreClient]
  modulesLayer --> ServicePath
  ServicePath --> SB[(Supabase RLS)]
  Legacy[StorageService sync] --> SB
```

---

## Data Flow

### 권장 (신규)

```
Component → Hook → Service → getCoreClient() → Supabase
```

예: Availability / Reservation — `availabilityService` / `reservationService`.  
성인 포털 — `studentPortalService` / `practiceRoomReservationService` / `customerJoinService`.

### 레거시 (현행 주류 CRUD)

```
Component → StorageService → sync adapters → Supabase
```

예: Income/Expense 일부, ConsultationRecords, Settings.

### 이행 중 (도메인 파사드)

```
Component → StudentService | TuitionService | LessonService | ScheduleService
         → StorageService → sync adapters → Supabase
```

- 신규 UI는 **파사드 Service**를 호출한다. `StorageService`를 컴포넌트에서 직접 쓰지 않는다.
- 파사드 내부는 당분간 Storage 동기화 경로를 유지한다 (일괄 제거 금지).
- 실시간·조직 스코프 신규 기능은 `getCoreClient()` / RPC Service 경로.
- UI에서 supabase 직접 호출은 하지 않는다.

---

## 도메인 표준 (2026-09 추가)

### 성인 수강생 (Adult / Customer portal)

| 항목 | 규칙 |
|---|---|
| Identity | `core.students.user_id` = auth user (self-link). CRM은 `core.customers` + `student_enrollments.customer_id` |
| 셸 | `CustomerShell` — 보호자 포털(`ParentShell`)과 분리. PIN 출석 대신 본인 출석·이용권·연습실 |
| 가입 | `customer_join_requests` → `approve_customer_join_request` (성인 승인 시 students.user_id 연결) |
| Service | `studentPortalService`, `customerJoinService` → `getCoreClient()` |

### 연습실 대여 (Practice rooms)

| 항목 | 규칙 |
|---|---|
| Canonical DB | `core.practice_rooms` + `core.room_reservations` (+ EXCLUDE 충돌) |
| 고객 UI | `CustomerPracticeRoomView` → `practiceRoomReservationService` (신청 → pending → 원장 승인) |
| 스태프 UI | `PracticeRoomBookingView` → `create_staff_room_reservation` / `listByDate` (canonical만) |
| 금지 | 고객·스태프가 서로 다른 테이블에만 쓰고 충돌 검사를 건너뛰는 신규 플로우. 레거시 `schedules.metadata.kind=practice_room` **신규 쓰기 금지** (읽기 폴백만) |

### 수강료 청구·수기 정산 (Manual billing, No PG)

| 항목 | 규칙 |
|---|---|
| 청구서 | 앱 `TuitionInvoice` ↔ `core.payments` (`sent_at`, metadata.invoiceSent) |
| 수기 결제 | 앱 `TuitionPayment` ↔ `core.payment_transactions` (`local_currency` / `onsite_card` / cash / transfer, `cash_receipt_issued`) |
| 발송 | **수동만**. 초안 생성(`invoiceSent=false`) ≠ 발송. `TuitionService.sendInvoice` / 일괄 발송에서만 알림 |
| PG | **비도입**. Toss/Stripe 자동 카드 결제는 로드맵에서 보류. 학원 현장·상품권·이체 수기 완납이 기본 |
| 학부모 | 발송된 청구만 조회. 계좌 안내·현금영수증 요청(`request_payment_cash_receipt` + 로컬 캐시) |
| UI | `TuitionService` 파사드. 신규 모달은 shared `Modal` 우선 |

상세 로드맵·갭: [MOA_MULTI_ROLE_ARCHITECTURE.md](./MOA_MULTI_ROLE_ARCHITECTURE.md) Phase 3A.  
피아노 납품·파일럿 검수: [PIANO_DELIVERY_CHECKLIST.md](./PIANO_DELIVERY_CHECKLIST.md).
---

## 멀티테넌트 데이터 규칙

### 개념 분리

| 개념 | 의미 |
|---|---|
| User | 개인 identity (로그인) |
| Organization | 사업장 / 테넌트 |
| OrganizationMembership | 조직 내 역할·권한 |
| Customer | 특정 Organization과의 고객 관계 |

```
User → OrganizationMembership → Organization
User → Customer relationship → Organization
```

로그인 여부와 조직 권한을 동일한 개념으로 취급하지 않는다.

### 격리 규칙

1. 조직 데이터는 `organization_id` 기준으로 격리한다.
2. 모든 신규 DB 조회/저장/수정은 organization scope를 명확히 한다.
3. RLS가 있어도 애플리케이션에서 organization context를 유지한다 (`OrganizationProvider`, `useOrganization`).
4. 다른 organization 데이터가 노출될 수 있는 전역 조회를 신규로 만들지 않는다.
5. 활성 조직 전환은 membership/context API를 통한다 (직접 로컬 키만으로 권한을 가정하지 않음).
6. 지점 범위는 `location_id`로 확장한다. 테넌트 경계를 대체하지 않으며 기존 테이블에 일괄 추가하지 않는다. 상세: [location-aware-domains.md](./architecture/location-aware-domains.md).

다중 역할·Guardian/Student 글로벌 모델 전환 상세: [MOA_MULTI_ROLE_ARCHITECTURE.md](./MOA_MULTI_ROLE_ARCHITECTURE.md).

---

## UI 셸

업종 앱은 `ModuleAppShell`로 Header / Sidebar / main / BottomNav / Toast / Confirm을 표준화한다.

페이지 패턴: [PAGE_PATTERNS.md](./PAGE_PATTERNS.md).  
컴포넌트: [UI_COMPONENT_GUIDE.md](./UI_COMPONENT_GUIDE.md).

---

## 문서 역할

| 문서 | 역할 |
|---|---|
| ARCHITECTURE.md (본 문서) | 일상 아키텍처·멀티테넌트 표준 |
| location-aware-domains.md | organization vs location 도메인 분류 |
| MOA_MULTI_ROLE_ARCHITECTURE.md | 다중 역할 갭 분석·로드맵 |
| UI_ARCHITECTURE_AUDIT.md | 실측 감사·Gap·정리 후보 |
| CODING_STANDARDS.md | 일상 코딩 규칙 |
| UI_COMPONENT_GUIDE.md | Shared 컴포넌트 사용 |
| PAGE_PATTERNS.md | 화면·IA 패턴 |
| MOBILE.md / ENV_SETUP.md | 배포·환경 (본 표준과 별개) |
