# Moa Domain Map

업무 개념과 Entity 관계. 폴더 위치는 [PROJECT_MAP.md](./PROJECT_MAP.md), 데이터 이동은 [DATA_FLOW.md](./DATA_FLOW.md), 계층은 [ARCHITECTURE.md](./ARCHITECTURE.md).

존재하지 않는 도메인은 적지 않는다. Consultation처럼 폴더 없이 테이블/UI만 있는 것은 그렇게 표시한다.

용어는 PROJECT_MAP / ARCHITECTURE / DATA_FLOW와 같다.

| 용어 | 의미 |
| --- | --- |
| **Core foundation** | 업종 독립 공통 기반 |
| **Capability** | 여러 업종이 선택하는 업무 기능 |
| **Industry-specific** | 특정 업종만의 의미·화면 |
| **Composition** | definition / manifest / registry / router / loader 조립 |
| **Infrastructure** | persist, hydrate, sync, audit, idempotency, outbox |
| **Legacy aggregation layer** | 여러 책임이 한 폴더에 섞인 이행 중 묶음 |

`src/core/academy`는 **하나의 domain이 아니다.** 학생/고객/부모/수업/시간표/상담/수납 화면이 한곳에 있는 **legacy aggregation layer**다. 아래 표의 Customer / Parent / Attendance / Finance / Consultation 등과 혼동하지 않는다.

---

## 테넌트 골격

```text
User (auth.users + core.profiles)
 └─ OrganizationMembership (core.organization_members.role)
     └─ Organization (core.organizations)
         ├─ Location (core.locations)     지점. 테넌트를 대체하지 않음
         ├─ Staff (core.staff)
         ├─ Customer / Student (core.customers, piano.customers)
         └─ Business data (schedule, sale, finance, …) 모두 organization_id
```

`organization_id` = 테넌트 경계. `location_id` = 지점 확장. 기존 Core 테이블에 `location_id`를 일괄 추가하지 않는다. 근거: `docs/architecture/location-aware-domains.md`, `src/core/locations/locationAware.ts`.

### 계층 분류 (현재 위치 / 장기)

| Domain | 계층 | 현재 위치 | 장기 |
| --- | --- | --- | --- |
| Organization | Core foundation | `src/core/organizations` | Core |
| User / Account | Core foundation | `src/core/auth`, `accounts` | Core |
| Membership / Role | Core foundation | OrganizationProvider | Core |
| Permission / Authorization | Core foundation | `src/core/authorization` | Core |
| Location | Core foundation | `src/core/locations` | Core |
| Customer / Student | Core foundation | `src/core/students`, `customer` | Core |
| Parent / Guardian | Core foundation + Capability 후보 | `src/core/parent`, `src/modules/parent`, `capabilities/parent` | Capability + 포털 모듈 |
| Staff | Core foundation | `src/core/staff` | Core |
| Schedule / Booking / Reservation | Capability | `src/core/schedules` + `capabilities/scheduling`, `booking` | Capability |
| Attendance | Capability | `src/capabilities/attendance` (Core는 shim) | Capability |
| Payment / Finance | Capability | `src/core/finance` + `capabilities/billing` | Capability (billing) |
| Product / Inventory / Sales / Loyalty | Capability | `src/core/commerce` 등 + `capabilities/commerce` | Capability |
| Consultation | Capability 후보 | academy/piano UI. `capabilities/consultation` manifest | Capability |
| Enrollment | Capability 후보 | academy enrollment UI. `capabilities/enrollment` manifest | Capability |
| Resources / Sessions / Capacity / Waitlist | Capability | `src/core/resources` 등 + `capabilities/resources` | Capability |
| Notices | Core foundation | `src/core/notices` | Core |
| Transport | Capability 후보 | `src/core/transport` + `capabilities/transport` | Capability |
| Platform Subscription | Core foundation | `src/core/platformSubscription` | Core |
| Audit / Idempotency / Outbox | Infrastructure | `src/core/audit` 등 | Infrastructure |
| Storage / Hydrate / Sync | Infrastructure | `src/services` StorageService | capability facade + `services/infrastructure` |
| Industry catalog | Core foundation | `src/core/industry/definitions.ts`, `catalog.ts` | Core |
| Industry router / loader | Composition | `src/app/industry` + `core/industry` pluginHost·Generic(**잔여**) | Composition (`src/app`) |
| academy UI 묶음 | Legacy aggregation layer | `src/core/academy` | 도메인 아님. 신규 위치 아님 |
| Daycare Care | Industry-specific | `src/industries/daycare/care` | Industry |
| Piano Education | Industry-specific | `src/industries/piano` | Industry |
| Bath Ops | Industry-specific | `src/industries/bath` | Industry |

Shared UI(Modal, Toast, PageHeader)는 업무 Entity가 아니다.

현재 주요 Capability 후보: attendance, scheduling, booking, billing/finance, commerce, resources, parent, transport, enrollment, consultation.

---

## Organization

계층: **Core foundation**

Purpose: 사업장(테넌트). 모든 업무 데이터의 최상위 범위.

Main Entities: Organization, OrganizationMembership

Main Tables: `core.organizations`, `core.organization_members`

Main Services: `src/core/organizations/services/organizationService.ts`, `joinRequestService.ts`, `resolveOrganizationContext.ts`

Main UI: `OrganizationProvider.tsx`, `OrganizationSelector.tsx`, `CreateOrganizationWizard.tsx`, `RoleContextSwitcher.tsx`

Related Industry: 모든 업종 앱, parent 포털

Important Rules: 로그인 사용자 ≠ 사업장. 선택은 `moa_current_organization_id`. 전환 시 `StorageService.clearOrganization()`.

Dependencies: Auth session, Location catalog

---

## User / Account

계층: **Core foundation**

Purpose: 로그인 주체와 프로필.

Main Entities: Session user, Profile, local active user (`piano_app_active_user`)

Main Tables: `core.profiles` (Auth는 Supabase Auth)

Main Services: `src/core/auth/AuthProvider.tsx`, `src/core/accounts/loginBootstrapService.ts`, `src/core/account/`

Main UI: `AuthPage.tsx`, 계정 탭

Related Industry: 전 업종

Important Rules: Authentication과 Organization Role은 다르다. `AppContext.currentUser`는 Storage 미러이며 권한 SoT가 아니다.

Dependencies: Supabase Auth

---

## Membership / Role

계층: **Core foundation**

Purpose: 한 사용자가 여러 사업장·역할을 가진다.

Main Entities: Membership, `MemberRole`

Main Tables: `core.organization_members`

Main Services: OrganizationProvider, `permissionsRole.ts`

Main UI: `RoleContextSwitcher.tsx`

Related Industry: 전 업종

Important Rules: `MemberRole` = `owner | admin | manager | staff | parent | instructor | member | customer | guardian` (`database.types.ts`). 별도 Membership 폴더는 없다.

Dependencies: Organization, Auth

---

## Permission / Authorization

계층: **Core foundation**

Purpose: Role 기본값 + extra grant + scope로 행위 허용을 계산.

Main Entities: Permission, AuthorizationGrant, AuthScope

Main Tables: `core.permission_catalog`, `core.authorization_grants`

Main Services: `src/core/authorization/` (`evaluatePermission`), `src/core/auth/usePermissions.ts`, RPC `core.has_permission`

Main UI: 탭 필터, 버튼 가드 (UX)

Related Industry: retail/staff sale 등

Important Rules: 키 집합이 좁다 (`customers.*`, `sales.*`, `rooms.*`, `staff.*`, `reports.read`, `finance.read`). RLS/RPC를 대체하지 않는다.

Dependencies: Role, Location scope

---

## Location

계층: **Core foundation**

Purpose: 사업장 아래 영업 지점.

Main Entities: Location, TrustedLocationSelection

Main Tables: `core.locations`

Main Services: `locationService.ts`, `locationRepository.ts`, `useOrganizationLocationState.ts`

Main UI: `HeaderLocationControl.tsx`, RoleContextSwitcher 지점 전환

Related Industry: 헤더를 쓰는 전 업종 앱

Important Rules: 선택 키 `moa_current_location_id`. localStorage 값만으로 trusted location을 채택하지 않는다. 기본 TZ `Asia/Seoul`.

Dependencies: Organization, authorization grants

---

## Customer / Student

계층: **Core foundation**

Purpose: 수강생·고객 마스터. 학원 화면에서는 Student로 부른다. “학생”이라는 이름만으로 `core/academy` domain이 되지 않는다.

Main Entities: Customer, Student, contacts

Main Tables: `core.customers`, `core.customer_contacts`, `piano.customers`

Main Services: `src/core/students/services/studentService.ts`, `src/core/customer/`

Main UI: `src/core/academy/components/students/` (StudentFormModal 등 — **legacy aggregation**에 있는 화면), gym/daycare StudentListView, pilates members

Related Industry: piano, pilates, gym, daycare, skin, retail(customers)

Important Rules: organization-scoped. location_id 컬럼 없음 (`locationAwareRegistry`).

Dependencies: Organization, Staff(담당), Parent links

---

## Parent / Guardian

계층: **Core foundation** + **Capability** 후보 (`parent`)

Purpose: 보호자 계정과 자녀 연결, 학부모 포털.

Main Entities: Parent profile, ParentStudentLink, enrollment request

Main Tables: `core.parent_student_links` (parents 전용 테이블은 generated types에 없음)

Main Services: `src/core/parent/services/`, academy enrollment views

Main UI: `src/modules/parent/ParentShell.tsx`, `src/core/academy/components/parents/`

Related Industry: parent, daycare care, piano progress

Important Rules: portalMode(`parent`)는 선택 membership과 독립적으로 켜질 수 있다.

Dependencies: Organization, Customer/Student, Auth

---

## Staff

계층: **Core foundation**

Purpose: 강사/직원 마스터와 계정 연결.

Main Entities: Staff, grants

Main Tables: `core.staff`

Main Services: `src/core/staff/`, `src/hooks/useStaffGrants.ts`, `useStaffScope.ts`

Main UI: academy/settings, pilates instructors, skin staffHours

Related Industry: piano, pilates, skin, gym

Important Rules: organization-scoped master. 탭 extra-filter는 Storage teachers.grants도 본다.

Dependencies: Organization, Membership

---

## Schedule / Booking / Reservation

계층: **Capability** (scheduling, booking)

Purpose: 수업·상담 일정과 예약 상태. 고객 마스터와 한 domain으로 합치지 않는다.

Main Entities: Schedule, Reservation, Booking (필라테스 UI 용어), SessionPass

Main Tables: `core.schedules`, `core.reservations`, `core.session_passes`, `core.availability_rules`, `core.availability_overrides`

Main Services: `src/core/schedules/services/`, `coreScheduleService`, `reservationService.ts`, `reservationMachine.ts`, `src/capabilities/scheduling`, `src/capabilities/booking`

Main UI: ReservationInbox, CreateConsultationScheduleModal, pilates bookings, piano timetable

Related Industry: piano, pilates, skin(허브가 pilates 재사용), gym timetable

Important Rules: Reservation 상태 `requested | confirmed | cancelled`. 확정 UI는 `reservationService.confirmReservation` → RPC `confirm_reservation`. Command Executor `reservation.confirm`은 파일럿.

Dependencies: Organization, Customer, Staff, Resources, Session

---

## Attendance

계층: **Capability**

Purpose: 출석 기록과 이용권 차감.

Main Entities: Attendance, AttendanceSession

Main Tables: `core.attendance_sessions`, `piano.attendance`

Main Services: `src/capabilities/attendance` (`attendanceService`, pin). `src/core/attendance`는 compat shim. `attendancePassAtomic.ts`는 schedules 경로에 잔존할 수 있음.

Main UI: Capability `AttendanceManagementView`, academy/piano attendance, `AttendanceKioskPage`

Related Industry: piano, gym, daycare, pilates

Important Rules: 출결+이용권은 RPC 원자 쓰기. 출석일은 영업일(YYYY-MM-DD).

Dependencies: Schedule, SessionPass, Student

---

## Payment / Finance

계층: **Capability** (billing)

Purpose: 수강료·청구·지출·강사 정산.

Main Entities: Payment, Invoice(스토리지), Expense, Income, Payroll

Main Tables: `core.payments`, `payment_transactions`, `expenses`, `income_entries`, `teacher_payroll_settlements`

Main Services: `src/capabilities/billing`, `src/core/finance/` (shim 또는 잔여), `tuitionPaymentAtomic.ts`

Main UI: academy tuition views, piano expenses, finance tabs

Related Industry: piano, gym, daycare, pilates, skin

Important Rules: 수납은 server-authoritative. 재시도 시 멱등 RPC (`record_tuition_payment_idempotent`).

Dependencies: Organization, Customer, Staff

---

## Product / Inventory / Sales / Loyalty

계층: **Capability** (commerce)

Purpose: 상품 마스터, 재고 이동, 판매/반품, 포인트.

Main Entities: Product, Variant, Inventory, Sale, SaleReturn, PointAccount

Main Tables: `core.product_categories`, `products`, `product_variants`, `inventory`, `stock_movements`, `sales`, `sale_items`, `sale_returns`, `sale_return_items`, `point_accounts`, `point_transactions`

Main Services: `src/capabilities/commerce`, `src/core/commerce/`, `src/core/sales/`, `src/core/inventory/`, `src/core/loyalty/`, retail `services/`

Main UI: `src/industries/retail/components/`, skin retail, piano textbooks(교재 판매는 piano 테이블+core stock)

Related Industry: retail, skin, piano(textbooks)

Important Rules: 판매/재고/포인트는 RPC (`create_sale`, `create_sale_return`, point apply). UI 연속 write로 대체하지 않음.

Dependencies: Organization, Customer, Staff. location 컬럼은 아직 없음.

---

## Consultation

계층: **Capability** 후보

Purpose: 상담 예약/기록.

Main Entities: Consultation

Main Tables: `core.consultations`

Main Services: sync mappers `src/services/adapters/sync/mappers/consultationMappers.ts`. `src/capabilities/consultation`은 manifest. 전용 `src/core/consultation` 폴더는 없다.

Main UI: `src/core/academy/components/consultations/` (**legacy aggregation**), `src/industries/piano/components/consultations/`, 공개 `/c/:code/consultation`

Related Industry: piano, public landing

Important Rules: 공개 랜딩은 `PublicRouteErrorBoundary`.

Dependencies: Organization, Schedule/Reservation

---

## Resources / Sessions / Capacity / Waitlist

계층: **Capability**

Purpose: 예약 가능한 방/자원, 고객 세션, 정원, 대기.

Main Entities: BookableResource, ResourceReservation, CustomerSession, WaitlistEntry

Main Tables: `core.bookable_resources`, `core.customer_sessions`, `core.waitlist_entries` (`resource_reservations`는 registry에 이름만. types Tables 키는 확인 후 사용)

Main Services: `src/core/resources/`, `sessions/`, `capacity/`, `waitlist/`, `src/capabilities/resources`

Main UI: piano practiceRooms/resources, bath rooms(별 schema)

Related Industry: piano, bath, pilates

Important Rules: overlap/capacity는 Capability 계약. bath rooms는 `bath.rooms`.

Dependencies: Organization, Schedule

---

## Notices / Transport

계층: Notices = **Core foundation**. Transport = **Capability** 후보

Purpose: 알림 발송 대상, 셔틀 탑승 요청.

Main Entities: Notification, Shuttle ride request

Main Tables: `core.notifications`. Transport 전용 테이블은 generated types에 없음.

Main Services: `src/core/notices/`, `src/core/transport/`, `src/capabilities/transport`

Main UI: parent notice views, `ShuttleRideRequestView.tsx`

Related Industry: parent, gym(shuttle 탭), piano

Important Rules: `core_shuttle_ride_requests` persistence는 현재 `local-only`로 선언됨.

Dependencies: Organization, Parent

---

## Platform Subscription

계층: **Core foundation**

Purpose: 플랜·기능 엔타이틀먼트.

Main Entities: Plan, Subscription, FeatureEntitlement

Main Tables: `platform.plans`, `feature_entitlements`, `subscriptions`, `subscription_items`

Main Services: `src/core/platformSubscription/`

Main UI: (capability/서비스. 업종 화면 전용 폴더는 이 맵에서 단정하지 않음)

Related Industry: 플랫폼 게이트

Important Rules: RPC `platform.is_feature_enabled`.

Dependencies: Organization

---

## Audit / Idempotency / Outbox

계층: **Infrastructure**

Purpose: 상태 변경 이력, 재시도 키, TX 밖 후처리.

Main Entities: AuditLog, IdempotencyKey, OutboxEvent

Main Tables: `core.audit_logs`, `core.idempotency_keys`, `core.outbox_events`

Main Services: `src/core/audit/`, `idempotency/`, `outbox/`

Main UI: 없음 (인프라)

Related: 원자 RPC (예약, 결제, 판매)

Important Rules: 파일럿 연결. 대부분 StorageService write에는 없음. 민감 필드(phone, pin) audit 금지.

Dependencies: Organization, RequestContext

---

## Daycare Care (Industry-specific)

계층: **Industry-specific**

Purpose: 보육 운영 기록.

Main Entities: CareJournal, MedicationRequest, Incident, Pickup, Safety, Meal sample, CCTV request, Staff health cert

Main Tables: `core.care_journals`, `medication_requests`, `care_child_records`, `care_incidents`, `care_staff_health_certs`, `care_safety_logs`, `care_meal_samples`, `care_cctv_requests`, `care_pickup_logs`

Main Services: `src/industries/daycare/care/careStorage.ts`

Main UI: `src/industries/daycare/care/*`, parent care views

Related Industry: daycare, parent

Important Rules: schema는 core. daycare 전용 schema 없음.

Dependencies: Organization, Customer(원아)

---

## Piano Education (Industry-specific)

계층: **Industry-specific**

Purpose: 레슨 기록, 교재, 곡 진도, 발표회.

Main Entities: LessonRecord, Textbook, TextbookSale, Song, Curriculum, Event

Main Tables: `piano.lesson_records`, `textbooks`, `textbook_sales`, `textbook_payments`, `songs`, `events`, curriculum/assignment/achievement 테이블

Main Services: `src/industries/piano/services/`

Main UI: `src/industries/piano/components/lessons|textbooks|songProgress|recitals`

Related Industry: piano, parent(progress)

Dependencies: Student, Staff, core sales/stock (교재 판매 연동)

---

## Bath Ops (Industry-specific)

계층: **Industry-specific**

Purpose: 객실·방문 체크인·예약.

Main Entities: Room, Visit, BathBooking, OfferedService

Main Tables: `bath.rooms`, `visits`, `bookings`, `services`, `service_resources`, `service_staff`

Main Services: `src/industries/bath/services/`

Main UI: BathAppContent, placeholder view

Related Industry: bath

Dependencies: Organization, (bath schema)

---

## Composition (Industry catalog)

계층: **Composition**

Purpose: 업종 정의·선택 capability·라우팅.

현재: `src/core/industry`의 `definitions`/catalog는 **Core foundation**. 같은 폴더의 pluginHost·Generic shell은 **Composition 잔여**. 라이브 라우터·모듈 등록은 `src/app/industry` (**Composition SoT**).

장기: 조립은 `src/app`. Core는 업종을 모르는 카탈로그 조회만. **Industry 구현이 아니다.**

---

## 범위 요약 (location-aware)

organization-scoped (컬럼 `organization_id`만): customers, products, offered_services/staff, price catalog.

location-scoped (개념. 기존 테이블 `hasLocationColumn: false`): visits, bookings, rooms/resources, sales, inventory, schedules, ops_tasks.

신규 location 테이블을 만들 때만 `organization_id` + `location_id` NOT NULL + `core.assert_location_in_organization`.
