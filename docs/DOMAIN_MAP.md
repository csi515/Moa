# Moa Domain Map

업무 개념과 Entity 관계. 폴더 위치는 [PROJECT_MAP.md](./PROJECT_MAP.md), 데이터 이동은 [DATA_FLOW.md](./DATA_FLOW.md).

존재하지 않는 도메인은 적지 않는다. Consultation처럼 폴더 없이 테이블/UI만 있는 것은 그렇게 표시한다.

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

분류:

| 종류 | 의미 | 예 |
| --- | --- | --- |
| Core Domain | 여러 업종이 같은 의미 | Organization, Schedule, Sale |
| Module-specific Domain | 한 업종 의미/화면 | piano textbooks, daycare care, bath visits |
| Shared UI Concept | 레이아웃/피드백. 업무 Entity 아님 | Modal, Toast, PageHeader |

---

## Organization

Purpose: 사업장(테넌트). 모든 업무 데이터의 최상위 범위.

Main Entities: Organization, OrganizationMembership

Main Tables: `core.organizations`, `core.organization_members`

Main Services: `src/core/organizations/services/organizationService.ts`, `joinRequestService.ts`, `resolveOrganizationContext.ts`

Main UI: `OrganizationProvider.tsx`, `OrganizationSelector.tsx`, `CreateOrganizationWizard.tsx`, `RoleContextSwitcher.tsx`

Related Modules: 모든 업종 앱, parent 포털

Important Rules: 로그인 사용자 ≠ 사업장. 선택은 `moa_current_organization_id`. 전환 시 `StorageService.clearOrganization()`.

Dependencies: Auth session, Location catalog

---

## User / Account

Purpose: 로그인 주체와 프로필.

Main Entities: Session user, Profile, local active user (`piano_app_active_user`)

Main Tables: `core.profiles` (Auth는 Supabase Auth)

Main Services: `src/core/auth/AuthProvider.tsx`, `src/core/accounts/loginBootstrapService.ts`, `src/core/account/`

Main UI: `AuthPage.tsx`, 계정 탭

Related Modules: 전 모듈

Important Rules: Authentication과 Organization Role은 다르다. `AppContext.currentUser`는 Storage 미러이며 권한 SoT가 아니다.

Dependencies: Supabase Auth

---

## Membership / Role

Purpose: 한 사용자가 여러 사업장·역할을 가진다.

Main Entities: Membership, `MemberRole`

Main Tables: `core.organization_members`

Main Services: OrganizationProvider, `permissionsRole.ts`

Main UI: `RoleContextSwitcher.tsx`

Related Modules: 전 모듈

Important Rules: `MemberRole` = `owner | admin | manager | staff | parent | instructor | member | customer | guardian` (`database.types.ts`). 별도 Membership 폴더는 없다.

Dependencies: Organization, Auth

---

## Permission / Authorization

Purpose: Role 기본값 + extra grant + scope로 행위 허용을 계산.

Main Entities: Permission, AuthorizationGrant, AuthScope

Main Tables: `core.permission_catalog`, `core.authorization_grants`

Main Services: `src/core/authorization/` (`evaluatePermission`), `src/core/auth/usePermissions.ts`, RPC `core.has_permission`

Main UI: 탭 필터, 버튼 가드 (UX)

Related Modules: retail/staff sale 등

Important Rules: 키 집합이 좁다 (`customers.*`, `sales.*`, `rooms.*`, `staff.*`, `reports.read`, `finance.read`). RLS/RPC를 대체하지 않는다.

Dependencies: Role, Location scope

---

## Location

Purpose: 사업장 아래 영업 지점.

Main Entities: Location, TrustedLocationSelection

Main Tables: `core.locations`

Main Services: `locationService.ts`, `locationRepository.ts`, `useOrganizationLocationState.ts`

Main UI: `HeaderLocationControl.tsx`, RoleContextSwitcher 지점 전환

Related Modules: 헤더를 쓰는 전 업종 앱

Important Rules: 선택 키 `moa_current_location_id`. localStorage 값만으로 trusted location을 채택하지 않는다. 기본 TZ `Asia/Seoul`.

Dependencies: Organization, authorization grants

---

## Customer / Student

Purpose: 수강생·고객 마스터. 학원 화면에서는 Student로 부른다.

Main Entities: Customer, Student, contacts

Main Tables: `core.customers`, `core.customer_contacts`, `piano.customers`

Main Services: `src/core/students/services/studentService.ts`, `src/core/customer/`

Main UI: `src/core/academy/components/students/` (StudentFormModal 등), gym/daycare StudentListView, pilates members

Related Modules: piano, pilates, gym, daycare, skin, retail(customers)

Important Rules: organization-scoped. location_id 컬럼 없음 (`locationAwareRegistry`).

Dependencies: Organization, Staff(담당), Parent links

---

## Parent / Guardian

Purpose: 보호자 계정과 자녀 연결, 학부모 포털.

Main Entities: Parent profile, ParentStudentLink, enrollment request

Main Tables: `core.parent_student_links` (parents 전용 테이블은 generated types에 없음)

Main Services: `src/core/parent/services/`, academy enrollment views

Main UI: `src/modules/parent/ParentShell.tsx`, `src/core/academy/components/parents/`

Related Modules: parent, daycare care, piano progress

Important Rules: portalMode(`parent`)는 선택 membership과 독립적으로 켜질 수 있다.

Dependencies: Organization, Customer/Student, Auth

---

## Staff

Purpose: 강사/직원 마스터와 계정 연결.

Main Entities: Staff, grants

Main Tables: `core.staff`

Main Services: `src/core/staff/`, `src/hooks/useStaffGrants.ts`, `useStaffScope.ts`

Main UI: academy/settings, pilates instructors, skin staffHours

Related Modules: piano, pilates, skin, gym

Important Rules: organization-scoped master. 탭 extra-filter는 Storage teachers.grants도 본다.

Dependencies: Organization, Membership

---

## Schedule / Booking / Reservation

Purpose: 수업·상담 일정과 예약 상태.

Main Entities: Schedule, Reservation, Booking (필라테스 UI 용어), SessionPass

Main Tables: `core.schedules`, `core.reservations`, `core.session_passes`, `core.availability_rules`, `core.availability_overrides`

Main Services: `src/core/schedules/services/`, `coreScheduleService`, `reservationService.ts`, `reservationMachine.ts`

Main UI: ReservationInbox, CreateConsultationScheduleModal, pilates bookings, piano timetable

Related Modules: piano, pilates, skin(허브가 pilates 재사용), gym timetable

Important Rules: Reservation 상태 `requested | confirmed | cancelled`. 확정 UI는 `reservationService.confirmReservation` → RPC `confirm_reservation`. Command Executor `reservation.confirm`은 파일럿.

Dependencies: Organization, Customer, Staff, Resources, Session

---

## Attendance

Purpose: 출석 기록과 이용권 차감.

Main Entities: Attendance, AttendanceSession

Main Tables: `core.attendance_sessions`, `piano.attendance`

Main Services: `src/core/attendance/services/attendanceService.ts`, `attendancePassAtomic.ts`

Main UI: academy/piano attendance, `AttendanceKioskPage`

Related Modules: piano, gym, daycare, pilates

Important Rules: 출결+이용권은 RPC 원자 쓰기. 출석일은 영업일(YYYY-MM-DD).

Dependencies: Schedule, SessionPass, Student

---

## Payment / Finance

Purpose: 수강료·청구·지출·강사 정산.

Main Entities: Payment, Invoice(스토리지), Expense, Income, Payroll

Main Tables: `core.payments`, `payment_transactions`, `expenses`, `income_entries`, `teacher_payroll_settlements`

Main Services: `src/core/finance/`, `tuitionPaymentAtomic.ts`

Main UI: academy tuition views, piano expenses, finance tabs

Related Modules: piano, gym, daycare, pilates, skin

Important Rules: 수납은 server-authoritative. 재시도 시 멱등 RPC (`record_tuition_payment_idempotent`).

Dependencies: Organization, Customer, Staff

---

## Product / Inventory / Sales / Loyalty

Purpose: 상품 마스터, 재고 이동, 판매/반품, 포인트.

Main Entities: Product, Variant, Inventory, Sale, SaleReturn, PointAccount

Main Tables: `core.product_categories`, `products`, `product_variants`, `inventory`, `stock_movements`, `sales`, `sale_items`, `sale_returns`, `sale_return_items`, `point_accounts`, `point_transactions`

Main Services: `src/core/commerce/`, `src/core/sales/`, `src/core/inventory/`, `src/core/loyalty/`, retail `services/`

Main UI: `src/modules/retail/components/`, skin retail, piano textbooks(교재 판매는 piano 테이블+core stock)

Related Modules: retail, skin, piano(textbooks)

Important Rules: 판매/재고/포인트는 RPC (`create_sale`, `create_sale_return`, point apply). UI 연속 write로 대체하지 않음.

Dependencies: Organization, Customer, Staff. location 컬럼은 아직 없음.

---

## Consultation

Purpose: 상담 예약/기록.

Main Entities: Consultation

Main Tables: `core.consultations`

Main Services: sync mappers `src/services/adapters/sync/mappers/consultationMappers.ts`. 전용 `src/core/consultation` 폴더 없음.

Main UI: `src/core/academy/components/consultations/`, `src/modules/piano/components/consultations/`, 공개 `/c/:code/consultation`

Related Modules: piano, public landing

Important Rules: 공개 랜딩은 `PublicRouteErrorBoundary`.

Dependencies: Organization, Schedule/Reservation

---

## Resources / Sessions / Capacity / Waitlist

Purpose: 예약 가능한 방/자원, 고객 세션, 정원, 대기.

Main Entities: BookableResource, ResourceReservation, CustomerSession, WaitlistEntry

Main Tables: `core.bookable_resources`, `core.customer_sessions`, `core.waitlist_entries` (`resource_reservations`는 registry에 이름만. types Tables 키는 확인 후 사용)

Main Services: `src/core/resources/`, `sessions/`, `capacity/`, `waitlist/`

Main UI: piano practiceRooms/resources, bath rooms(별 schema)

Related Modules: piano, bath, pilates

Important Rules: overlap/capacity는 Core capability. bath rooms는 `bath.rooms`.

Dependencies: Organization, Schedule

---

## Notices / Transport

Purpose: 알림 발송 대상, 셔틀 탑승 요청.

Main Entities: Notification, Shuttle ride request

Main Tables: `core.notifications`. Transport 전용 테이블은 generated types에 없음.

Main Services: `src/core/notices/`, `src/core/transport/`

Main UI: parent notice views, `ShuttleRideRequestView.tsx`

Related Modules: parent, gym(shuttle 탭), piano

Important Rules: `core_shuttle_ride_requests` persistence는 현재 `local-only`로 선언됨.

Dependencies: Organization, Parent

---

## Platform Subscription

Purpose: 플랜·기능 엔타이틀먼트.

Main Entities: Plan, Subscription, FeatureEntitlement

Main Tables: `platform.plans`, `feature_entitlements`, `subscriptions`, `subscription_items`

Main Services: `src/core/platformSubscription/`

Main UI: (capability/서비스. 업종 화면 전용 폴더는 이 맵에서 단정하지 않음)

Related Modules: 플랫폼 게이트

Important Rules: RPC `platform.is_feature_enabled`.

Dependencies: Organization

---

## Audit / Idempotency / Outbox

Purpose: 상태 변경 이력, 재시도 키, TX 밖 후처리.

Main Entities: AuditLog, IdempotencyKey, OutboxEvent

Main Tables: `core.audit_logs`, `core.idempotency_keys`, `core.outbox_events`

Main Services: `src/core/audit/`, `idempotency/`, `outbox/`

Main UI: 없음 (인프라)

Related Modules: 원자 RPC (예약, 결제, 판매)

Important Rules: 파일럿 연결. 대부분 StorageService write에는 없음. 민감 필드(phone, pin) audit 금지.

Dependencies: Organization, RequestContext

---

## Daycare Care (module)

Purpose: 보육 운영 기록.

Main Entities: CareJournal, MedicationRequest, Incident, Pickup, Safety, Meal sample, CCTV request, Staff health cert

Main Tables: `core.care_journals`, `medication_requests`, `care_child_records`, `care_incidents`, `care_staff_health_certs`, `care_safety_logs`, `care_meal_samples`, `care_cctv_requests`, `care_pickup_logs`

Main Services: `src/modules/daycare/care/careStorage.ts`

Main UI: `src/modules/daycare/care/*`, parent care views

Related Modules: daycare, parent

Important Rules: schema는 core. daycare 전용 schema 없음.

Dependencies: Organization, Customer(원아)

---

## Piano Education (module)

Purpose: 레슨 기록, 교재, 곡 진도, 발표회.

Main Entities: LessonRecord, Textbook, TextbookSale, Song, Curriculum, Event

Main Tables: `piano.lesson_records`, `textbooks`, `textbook_sales`, `textbook_payments`, `songs`, `events`, curriculum/assignment/achievement 테이블

Main Services: `src/modules/piano/services/`

Main UI: `src/modules/piano/components/lessons|textbooks|songProgress|recitals`

Related Modules: piano, parent(progress)

Dependencies: Student, Staff, core sales/stock (교재 판매 연동)

---

## Bath Ops (module)

Purpose: 객실·방문 체크인·예약.

Main Entities: Room, Visit, BathBooking, OfferedService

Main Tables: `bath.rooms`, `visits`, `bookings`, `services`, `service_resources`, `service_staff`

Main Services: `src/modules/bath/services/`

Main UI: BathAppContent, placeholder view

Related Modules: bath

Dependencies: Organization, (bath schema)

---

## 범위 요약 (location-aware)

organization-scoped (컬럼 `organization_id`만): customers, products, offered_services/staff, price catalog.

location-scoped (개념. 기존 테이블 `hasLocationColumn: false`): visits, bookings, rooms/resources, sales, inventory, schedules, ops_tasks.

신규 location 테이블을 만들 때만 `organization_id` + `location_id` NOT NULL + `core.assert_location_in_organization`.
