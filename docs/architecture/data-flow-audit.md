# Moa 데이터 흐름 아키텍처 감사

> 감사 기준일: 2026-09-22  
> 범위: 실제 파일·호출 관계 추적 (코드 변경 없음)  
> 근거 경로: `src/services/storage*`, `src/services/adapters/*`, `src/core/*`, `src/modules/*`, `src/context/*`, `src/StorageHydrator.tsx`, `src/SupabaseAppGate.tsx`, `src/SupabaseRoleSync.tsx`, `supabase/migrations/*`, `package.json`

---

## 1. 현재 전체 아키텍처

```
Browser
  └─ AuthProvider (src/core/auth/AuthProvider.tsx)
       └─ OrganizationProvider (src/core/organizations/OrganizationProvider.tsx ~415줄)
            └─ SupabaseAppGate (src/SupabaseAppGate.tsx)
                 ├─ AuthPage / OrganizationSelector / ParentShell / CustomerShell
                 └─ StorageHydrator (src/StorageHydrator.tsx)
                      └─ IndustryAppRouter (src/core/industry/IndustryAppRouter.tsx)
                           └─ {Piano|Pilates|Gym|Daycare|Skin|Retail}AppContent
                                └─ AppProvider (src/context/AppContext.tsx) — refreshKey / toast / nav
                                     └─ Views → StorageService | Core *Service | RPC

데이터 계층(병렬 3트랙):

A. Hybrid Storage (다수 Piano/Pilates/Finance)
   UI → StorageService / *Service facade
     → getItem/setItem (helpers)
     → SupabaseAdapter (in-memory cache + writeLocal mirror + debounced persist)
     → sync/* upsert / outbox retry
     → Supabase tables (RLS)

B. Domain Direct (Commerce / Org / Parent portal / Reservations)
   UI → core/{sales,inventory,product,loyalty,organizations,parent,schedules}/…
     → getCoreClient() / getPianoClient() / .rpc(...)
     → Supabase (원자 RPC 또는 테이블 CRUD)

C. Device-local only
   SESSION_PASSES, daycare CARE_* (저널·투약 제외 다수), ACTIVE_USER, ONBOARDING…
   → setItem → writeLocal only (adapter persist 없음)
```

**핵심 관찰:** Moa는 “단일 StorageService SoT”가 아니라 **(1) Adapter sync mirror**, **(2) DB direct/RPC**, **(3) device-local** 이 공존한다. 최근 Piano 교재 commerce/catalog는 (2) 우선 + local mirror로 정리 중이지만, 학생·예약·수납·이용권 등은 여전히 (1)/(3) 비중이 크다.

---

## 2. 실제 파일별 책임

### 2.1 부트스트랩 / 게이트

| 파일 | 책임 |
|------|------|
| `src/SupabaseAppGate.tsx` | 세션·조직·포털 모드에 따라 Auth / Org 선택 / Parent / Customer / StorageHydrator+Industry 분기 |
| `src/StorageHydrator.tsx` | `StorageService.hydrate(orgId, industry)` — 원격 실패 시 offline snapshot 배너 |
| `src/SupabaseRoleSync.tsx` | Auth+Org membership → `StorageService.setActiveUser` (device ACTIVE_USER) |
| `src/core/industry/IndustryAppRouter.tsx` | `industry_type` → 업종 AppContent |
| `src/context/AppContext.tsx` | nav / toast / confirm / **refreshKey** — `StorageService.subscribe`마다 `triggerRefresh` |

### 2.2 StorageService 조립

`src/services/storage.ts` — `Object.assign`로 합성:

- `createCustomerStorage` — 학생/학부모
- `createStaffClassStorage` — 강사/반
- `createRecordsStorage` / `createEventsStorage` / `createNotificationsStorage`
- `createDashboardStatsStorage`
- `createScheduleStorage` — Booking / ServiceOffering
- `createSessionPassStorage` — **LOCAL_ONLY 이용권**
- `createShuttleRideStorage`
- `createSettingsStorage`
- `createParentEducationStorage`
- `createAttendanceStorage`
- `createFinanceStorage` + `createInvoicePaymentService` (core finance)
- `createTextbookStorage` → catalog + sales
- `createPracticeRoomBookingStorage` — deprecated 로컬 키
- `createDaycareCareStorage` — daycare care CRUD

공통 I/O: `src/services/storage/helpers.ts` → `getStorageAdapter().getItem/setItem`.

### 2.3 Adapter / Sync

| 파일 | 책임 |
|------|------|
| `src/services/adapters/supabaseAdapter.ts` | 하이브리드: cache + local mirror + debounced persist + offline hydrate + outbox flush |
| `src/services/adapters/storageKeys.ts` | `SUPABASE_SYNC_KEYS` / `LOCAL_ONLY_KEYS` / `PIANO_TEXTBOOK_COMMERCE_HYDRATE_KEYS` 분류 |
| `src/services/adapters/localStorageEngine.ts` | org-scoped localStorage I/O (SoT 아님) |
| `src/services/adapters/syncOutbox.ts` | remote persist 실패 키 재시도 큐 |
| `src/services/adapters/sync/pianoEntitySync.ts` | Piano hydrate; 교재 판매/수납 DB+legacy merge |
| `src/services/adapters/sync/coreEntityPersist.ts` 등 | Core/Piano/Daycare/Education persist |
| `src/services/adapters/hydrateModules.ts` | industry별 hydrate 모듈 선택 |

### 2.4 Core 도메인 (DB direct 중심)

| 영역 | 주요 파일 |
|------|-----------|
| Org/Membership | `organizationService.ts`, `joinRequestService.ts`, `resolveOrganizationContext.ts`, `OrganizationProvider.tsx` |
| Auth/권한 UI | `AuthProvider.tsx`, `usePermissions.ts`, `permissions.ts` |
| Students facade | `src/core/students/services/studentService.ts` → StorageService만 위임 |
| Schedules facade | `src/core/services/scheduleService.ts` → StorageService + pass consume |
| Room reservations | `src/core/schedules/services/reservationService.ts` — RPC |
| Sales/Inventory/Product/Loyalty | `src/core/sales/*`, `inventory/*`, `product/*`, `loyalty/*` — RPC/테이블 |
| Parent portal | `src/core/parent/services/*` — RPC 다수 |
| Finance tuition | `tuitionService.ts` facade + `invoicePaymentService.ts` Storage |

### 2.5 Modules

| 모듈 | 데이터 접근 패턴 |
|------|------------------|
| piano | 대부분 StorageService; 교재 판매/재고는 `textbookSaleDb` / `textbookCoreStock` → Core/Piano DB |
| pilates | StorageService bookings + session passes (local-only) |
| retail | Core `productService`/`saleService`/`inventoryService` 직접 (Storage는 settings/points만) |
| skin | Storage students + settings.retailCatalog / Core product 이관 병행 |
| daycare | careStorage — 저널·투약 sync, 나머지 LOCAL_ONLY |
| parent | parentPortalService RPC + Storage 일부 읽기 |
| gym | Storage 중심 예약/회원 |

---

## 3. 주요 데이터 흐름 (12개)

형식: UI → Component → Service → StorageService → localStorage → Adapter → Supabase 직접 → RPC → DB → TX → RLS → 테스트

### 3.1 조직 (Organization)

| 단계 | 실제 |
|------|------|
| UI | `OrganizationSelector`, `CreateOrganizationWizard`, Header 사업장 전환 |
| Component | `OrganizationProvider.selectOrganization` / `createOrganization` |
| Service | `organizationService.createOrganization`, `listMemberships`, `storeOrganizationId` |
| StorageService | hydrate 트리거만 (`StorageService.hydrate` / `clearOrganization`) |
| localStorage | **예** — `moa_current_organization_id` (`organizationService.getStoredOrganizationId`) + sync 키 미러 |
| Adapter | hydrate 시 org 스코프 cache 적재 |
| Supabase 직접 | **예** — `getCoreClient()` in `organizationService` |
| RPC | 가입/초대 관련은 `joinRequestService` 등 |
| DB | `core.organizations`, `core.memberships` (및 staff 연결) |
| Transaction | 생성 시 클라이언트 다단계(org insert + membership) — 단일 비즈니스 TX 보장 여부는 서비스/트리거에 의존 |
| RLS | `20260822000003_create_core_rls.sql`, staff-scoped 후속 |
| 테스트 | `test:org-context-resolve`, `test:rls-membership-policy`, `test:rls-membership-escalation` |

### 3.2 회원 / Membership

| 단계 | 실제 |
|------|------|
| UI | `RoleContextSwitcher`, 가입 승인 UI (`JoinRequestsPanel`) |
| Component | `OrganizationProvider` (`selectedMembership` SoT 주석) |
| Service | `organizationService`, `joinRequestService`, `staffAccountService.connect_staff_on_login` |
| StorageService | `SupabaseRoleSync` → `setActiveUser`만 |
| localStorage | ACTIVE_USER + org id 선택 |
| Adapter | 간접(설정/staff hydrate) |
| Supabase 직접 | **예** |
| RPC | `connect_staff_on_login`, customer/parent join RPC |
| DB | `core.memberships`, invitations |
| TX |  Escalation 방지 정책은 RLS/RPC 쪽 (`test:rls-membership-escalation`) |
| RLS | staff-scoped + membership policy 스크립트 |
| 테스트 | 상기 RLS 스크립트, `test:multi-role-helpers`, `test:auth-hijack-audit` |

### 3.3 학생 / 고객 (Student / Customer)

| 단계 | 실제 |
|------|------|
| UI | `StudentListView`, `StudentDetailModal`, Skin/Pilates members |
| Component | academy students / module dashboards |
| Service | `StudentService.*` → **순수 Storage 위임**; Retail/Customer portal은 `customerLinkService` RPC |
| StorageService | **예** — `customerStorage.saveStudent` / `getStudents` |
| localStorage | **예** — mirror (`piano_app_students`) |
| Adapter | **예** — CORE+PIANO sync (`persistCustomers` / piano customers) |
| Supabase 직접 | sync 경로; portal은 RPC |
| RPC | `ensure_guest_customer`, `link_customer_to_current_user`, parent_register_child 등 |
| DB | `core.customers` (+ piano 확장 merge in `hydratePianoEntities`) |
| TX | `saveStudent` 신규 시 `createInvoiceForStudent` 동기 연쇄 — 원격 원자 TX 아님 |
| RLS | core customers org scope |
| 테스트 | `test:bulk-import`; E2E 일부 |

**문제:** `StudentService.getStudentById` / `getActiveStudents`가 `getStudents()` 전체 배열 후 `find`/`filter` (`studentService.ts`).

### 3.4 예약 (Booking / Reservation) — **이중 모델**

#### A. 업종 Booking (필라테스 등) — Storage sync

| 단계 | 실제 |
|------|------|
| UI | `BookingCalendarView`, `PilatesDashboardView` |
| Service | `ScheduleService.saveBooking` / `updateBookingStatus` |
| StorageService | **예** — `scheduleStorage.saveBooking` |
| localStorage | mirror `core_schedules` |
| Adapter | CORE_SYNC `SCHEDULES` persist |
| Supabase 직접 | sync upsert |
| RPC | 없음(이 경로) |
| DB | `core.schedules` (persist 매퍼 기준) |
| TX | 예약 상태 + `consumeSessionPass` **로컬 2단계** (`ScheduleService.updateBookingStatus`) |
| RLS | core schedules |
| 테스트 | `test:pilates-booking-validate` |

#### B. 연습실/공용 Reservation — RPC

| 단계 | 실제 |
|------|------|
| UI | Customer/Parent reservation UI |
| Service | `reservationService.requestReservation` 등 |
| StorageService | 아님 (legacy `PRACTICE_ROOM_BOOKINGS`는 deprecated 읽기 폴백) |
| localStorage | legacy 키만 |
| Adapter | hydrate 시 legacy 비움 정책 |
| Supabase 직접 | **예** |
| RPC | `request_reservation`, `confirm_reservation`, `cancel_reservation`, `get_organization_reservations`, `get_my_reservations` |
| DB | `room_reservations` 계열 |
| TX | RPC 단위 |
| RLS | reservation RLS migrations |
| 테스트 | (단위 테스트 파일명상 약함 — RPC 통합 위주 추정) |

### 3.5 이용권 (Session Pass)

| 단계 | 실제 |
|------|------|
| UI | `PassManagementView` |
| Service | `ScheduleService` → `StorageService.consumeSessionPass` |
| StorageService | **예** — `sessionPassStorage` |
| localStorage | **예 — LOCAL_ONLY SoT** (`SESSION_PASSES`) |
| Adapter | persist **없음** (`LOCAL_ONLY_KEYS`) |
| Supabase 직접 | 없음 |
| RPC | 없음 |
| DB | **원격 스키마 없음** (storageKeys 주석) |
| TX | 없음 — 예약과 분리된 로컬 차감 |
| RLS | N/A |
| 테스트 | 예약 validate 간접 |

**P0급:** 실제 사업 이용권이 device localStorage에만 존재 → 다기기/재설치 시 잔여 횟수 불일치.

### 3.6 출결 (Attendance)

| 단계 | 실제 |
|------|------|
| UI | `AttendanceManagementView`, `usePianoAttendanceView`, PIN check-in |
| Service | `attendanceStorage` + `core/attendance/services/attendanceService` (PIN 로컬) |
| StorageService | **예** |
| localStorage | ATTENDANCE + ATTENDANCE_SESSIONS + CUSTOMER_PINS mirror |
| Adapter | Piano attendance + Core attendance_sessions sync |
| Supabase 직접 | sync; parent PIN은 RPC (`parent_*_check_in_pin`) |
| RPC | parent PIN RPC |
| DB | `piano.attendance`, `core.attendance_sessions`, pins |
| TX | `batchSaveAttendance` 단일 setItem — 원격은 debounced |
| RLS | attendance module migrations |
| 테스트 | `test:manual-attendance-class`, `test:today-lesson-teacher` |

### 3.7 수납 (Tuition / Invoice Payment)

| 단계 | 실제 |
|------|------|
| UI | `TuitionManagementView`, `CombinedPaymentModal`, `UnpaidManagementView` |
| Service | `tuitionService` facade → `invoicePaymentService.recordPayment` / `recordCombinedPayment` |
| StorageService | **예** (합성) |
| localStorage | INVOICES / TUITION_PAYMENTS / INCOME_ENTRIES mirror |
| Adapter | Core finance persist |
| Supabase 직접 | sync; 현금영수증 `request_payment_cash_receipt` RPC |
| RPC | 선택적 cash receipt |
| DB | payments / payment_transactions / income_entries |
| TX | 청구 수납 + linked textbook settle는 `settleLinkedTextbookSalesOnTuitionPaid` **비동기 fire-and-forget** (`invoicePaymentService.recordPayment` 내 `.catch`) |
| RLS | finance migrations |
| 테스트 | `test:invoice-dedupe` |

### 3.8 판매 (Sales) — **이중 경로**

#### A. Retail / Core Sale

| 단계 | 실제 |
|------|------|
| UI | `SaleCheckoutModal`, `SalePosView` |
| Service | `industries/retail/services/saleService` → `core/sales/saleService.createSale` |
| StorageService | 포인트 설정만 (`RetailPointsSettingsView`) |
| localStorage | 설정 mirror |
| Adapter | 간접(settings) |
| Supabase 직접 | **예** |
| RPC | **`create_sale`** (재고+판매 원자) |
| DB | `core.sales`, `sale_items`, inventory movements |
| TX | **예** — RPC |
| RLS | commerce + `20260922180000_retail_staff_sale_permissions.sql` |
| 테스트 | `test:create-sale-atomic`, `test:commerce-db-it`, `test:retail-staff-sale-perm` |

#### B. Piano 교재 판매

| 단계 | 실제 |
|------|------|
| UI | `NewSaleModal`, `TextbookManagementView` |
| Service | `textbookSaleService` / `textbookCoreStock.createCoreLinkedSale` + `textbookSaleDb` |
| StorageService | textbook sales storage facade |
| localStorage | mirror + **legacy local-only rows** |
| Adapter | hydrate merge only (`PIANO_TEXTBOOK_COMMERCE_HYDRATE_KEYS`) — debounced persist 제외 |
| Supabase 직접 | **예** — piano textbooksales/payments + Core sale |
| RPC | Core `create_sale` / `create_sale_return` (재고 연동) |
| DB | `piano.textbook_sales`, `textbook_payments`, `core.sales` |
| TX | Core RPC + piano persist 보상(`compensateCoreSale`); 수납은 `recordPaymentOnDb` 롤백 |
| RLS | piano RLS |
| 테스트 | `test:textbook-sale-*`, `test:textbook-sale-db-it`, `test:textbook-core-sale-link` |

### 3.9 재고 (Inventory)

| 단계 | 실제 |
|------|------|
| UI | Retail `InventoryListView`; Piano `StockAdjustModal` |
| Service | `inventoryService.applyInbound/Adjustment` / `textbookCoreStock.applyDelta` |
| StorageService | Piano catalog mirror only |
| localStorage | textbooks stock mirror; Skin legacy catalog in settings |
| Adapter | textbooks sync; inventory 잔량은 Core |
| Supabase 직접 | **예** |
| RPC | **`apply_stock_movement`** |
| DB | `core.inventory` / `stock_movements` |
| TX | **예** — RPC FOR UPDATE |
| RLS | inventory migrations |
| 테스트 | `test:stock-movement-atomic`, commerce IT |

### 3.10 포인트 (Loyalty)

| 단계 | 실제 |
|------|------|
| UI | Retail checkout / points settings |
| Service | `pointEarnService`, `pointRedeemService`, sale create 연동 |
| StorageService | settings.retail points |
| localStorage | settings mirror |
| Adapter | settings persist |
| Supabase 직접 | **예** |
| RPC | `apply_point_redeem_for_sale`, sale RPC 내 redeem, return adjust |
| DB | loyalty / point ledgers (commerce migrations) |
| TX | **예** — atomic tests |
| RLS | point migrations |
| 테스트 | `test:point-atomic`, `test:sale-return-points`, `test:sale-redeem-consistency` |

### 3.11 Parent / Guardian

| 단계 | 실제 |
|------|------|
| UI | `ParentShell`, enrollment, care journals parent views |
| Service | `parentPortalService`, `guardianLinkService`, `enrollmentRequestService`, `parentChildService` |
| StorageService | 교육/일부 읽기; ACTIVE_USER parentCustomerId |
| localStorage | portal mode flags (`appModeService`), links mirror |
| Adapter | parent_student_links sync |
| Supabase 직접 | **예** |
| RPC | `parent_register_child`, guardian link tokens, enrollment |
| DB | parent profiles, links, enrollments |
| TX | RPC 단위 |
| RLS | `20260822150000_parent_portal_*`, `20260822180000_*` |
| 테스트 | deeplink / auth audits 간접 |

### 3.12 Retail / Daycare 데이터

#### Retail

- UI → module services → **Core product/sale/inventory** (StorageService 우회)
- 설정/포인트만 Storage
- Skin: `settings.retailCatalog` JSON + Core 이관 (`skinRetailCatalogMigrate.ts`) — **이중 카탈로그**

#### Daycare

| 데이터 | Sync? | 파일 |
|--------|-------|------|
| Care journals / medications | SUPABASE sync (`DAYCARE_SYNC_KEYS`) | `careStorage.saveCareJournal` |
| Child legal, incidents, CCTV, meal, safety, pickup, health certs | **LOCAL_ONLY** | 동일 `careStorage` |
| UI | `CareJournalView`, `InspectionBinderView` 등 — **refreshKey** 다수 |

---

## 4. Source of Truth 분석

| 구분 | 저장 | 실제 원본 | 비고 |
|------|------|-----------|------|
| Supabase sync entities (students, invoices, bookings, textbooks master…) | DB + local cache | **의도: DB** | 그러나 `setItem` 성공=UI 성공 → **사실상 local-first 체감** (`supabaseAdapter.setItem`) |
| Textbook commerce | DB + local mirror | **DB** (최근 fail-closed) | legacy rows는 local-only 호환 |
| Session passes | localStorage only | **localStorage = SoT** | 제품 주석상 원격 스키마 없음 |
| Daycare care extras | localStorage | **localStorage = SoT** | 테이블 없음 |
| Retail commerce | DB (RPC) | **DB** | 모범 사례에 가까움 |
| Skin retailCatalog | settings JSON + Core | **이중** | migrate 후 JSON 삭제 안 함 |
| Sync outbox | localStorage | retry state | 업무 데이터 아님 |
| Org selection / ACTIVE_USER | localStorage | device UI | OK |
| Offline hydrate | local snapshot | 임시 | `StorageHydrator` 배너 — durable SoT 아님 |

### localStorage가 DB처럼 쓰이는 지점 (근거)

1. `sessionPassStorage.saveSessionPass` / `consumeSessionPass` — LOCAL_ONLY, 잔여 횟수 비즈니스 상태  
2. `daycare/care/careStorage.ts` — incidents 등 LOCAL_ONLY CRUD를 UI가 성공으로 표시  
3. `customerStorage.saveStudent` — `setItem` 즉시 반환; 원격 실패는 outbox (사용자에게 실패로 안 보임)  
4. `scheduleStorage.saveBooking` + pass consume — 로컬 커밋이 업무 완료  
5. `invoicePaymentService.recordPayment` — invoices setItem 후 linked textbook은 async catch  

### 이중 SoT

- Adapter sync 키: cache/local 즉시 + remote best-effort  
- Piano textbooks: Core Product 재고 SoT + local stock mirror + (과거) local fallback  
- Skin: `retailCatalog` vs `core.products`  
- Bookings vs room `reservationService`  

---

## 5. 중복 코드 분석

| 중복 | 위치 |
|------|------|
| Student CRUD facade vs Storage | `StudentService` ≡ `customerStorage` 래퍼 |
| Schedule facade vs Storage | `ScheduleService` vs `scheduleStorage`; status 로직은 Service에만 pass 연동 |
| Booking status 이중 | `scheduleStorage.updateBookingStatus` (pass 없음) vs `ScheduleService.updateBookingStatus` (pass 있음) |
| Sale services | `core/sales/saleService` vs `industries/retail/services/saleService` (earn 래핑) vs Piano `textbookSaleService` |
| Inventory | Core `inventoryService` vs Piano `textbookCoreStock` (위임+미러) vs Skin stock in catalog |
| Product catalog | Core products vs Skin `settings.retailCatalog` vs Piano `textbooks` |
| 예약 | `SCHEDULES` Booking vs `reservationService` RPC |
| 출결 | piano attendance records vs core attendance_sessions vs PIN local helpers |
| refresh 패턴 | `AppContext.refreshKey` + `useStorageRefresh` + 뷰별 `useEffect([refreshKey])` |
| upsertById | `helpers.upsertById` vs `careStorage` 내부 복제 |

---

## 6. 보안 위험

| 위험 | 근거 파일:함수 |
|------|----------------|
| UI 탭 권한만으로 민감 화면 가드 | `usePermissions.canAccess` / `getAllowedTabs` — RLS와 별개; Staff grants는 `StorageService.getTeachers()` 로컬 |
| Membership escalation | 서버 정책 존재 (`test:rls-membership-escalation`) — 프론트 `OrganizationProvider`만 믿으면 안 됨 |
| LOCAL_ONLY 사업 데이터 | Session pass / daycare incidents — RLS 보호 대상 아님 (디바이스 탈취=전체 유출·변조) |
| Invoice linked textbook settle soft-fail | `invoicePaymentService.recordPayment` → `settleLinkedTextbookSalesOnTuitionPaid(...).catch(console.error)` — 수납 성공·교재 미정산 가능 |
| Offline snapshot을 운영 데이터처럼 표시 | `StorageHydrator` offline 배너는 있으나 쓰기 경로는 동일 setItem |
| Retail staff sale | DB permission migration 있음 — UI만 막으면 부족; RPC/RLS 검증 테스트 존재 |

---

## 7. 성능 위험

| 위험 | 근거 |
|------|------|
| 전체 배열 로드 후 filter/find | `StudentService.getActiveStudents`, `ScheduleService.getBookingsByDate/getUpcomingBookings`, 대시보드 다수 `StorageService.getStudents().filter` |
| hydrate 시 Piano/Core/Education/Daycare 일괄 | `SupabaseAdapter.hydrate` — org 전환 비용 큼 |
| `StorageService.subscribe` → 전역 `triggerRefresh` | `AppContext` — 임의 setItem이 광범위 리렌더 |
| Textbook/finance list 전체 getItem | sales/payments/invoices 키 단위 통짜 JSON |
| Dashboard 중복 fetch | director/staff hooks가 refreshKey마다 다수 get* 재호출 |

---

## 8. 상태관리 위험

| 위험 | 근거 |
|------|------|
| refreshKey 만능 버스 | `AppContext.triggerRefresh`; 50+ 뷰가 `refreshKey` 의존 |
| Provider 과다 책임 | `OrganizationProvider` (~415줄): membership, portal modes, oauth signup, parent tree, blocked owners |
| AppProvider 전역 구독 | storage 변경 = user + refresh 동시 |
| 이중 구독 | `useStorageRefresh`와 AppContext refreshKey 병행 |
| activeUser vs Org role | `SupabaseRoleSync`가 Storage ACTIVE_USER에 복사 — 어긋나면 `usePermissions`가 잘못된 grants |

---

## 9. Transaction이 필요한 영역

| 영역 | 현재 | 필요성 |
|------|------|--------|
| Retail create_sale + stock + points | RPC 원자 (`saleService.createSale`) | 충족에 가까움 |
| Stock movement | `apply_stock_movement` | 충족 |
| Point redeem/earn/return | atomic RPC + 테스트 | 충족에 가까움 |
| Piano createSale = Core sale + piano.textbook_sales + payment | Core RPC + compensate + DB write helpers | 개선됨, 분산 보상 유지 |
| Booking completed + session pass consume | **로컬 2단계, TX 없음** | **원격 TX/스키마 필요** |
| Tuition payment + linked textbook payments | setItem + async settle | **원자 또는 명시적 outbox 업무 큐 필요** |
| saveStudent + auto invoice | 동기 로컬 연쇄 | 원격 실패 시 불일치 |
| cancelSale multi-step (payments delete + sale delete + stock) | 부분 롤백 best-effort | 운영 모니터링 필요 |
| Org create + owner membership | 클라이언트 다단계 | DB 트리거/RPC 권장 |

---

## 10. 리팩터링 우선순위

### P0: 즉시 개선

1. **Session Pass LOCAL_ONLY SoT** — `sessionPassStorage.ts` (`saveSessionPass`, `consumeSessionPass`) + `ScheduleService.updateBookingStatus`  
   → 다기기 잔여 횟수 사고. 원격 스키마/RPC 또는 명확한 “데모 전용” 게이트.
2. **수납 성공 후 linked textbook settle soft-fail** — `invoicePaymentService.recordPayment`  
   → 사용자에게 부분 실패 노출 또는 동기 await + 실패 시 롤백 정책.
3. **Adapter sync 엔티티의 local-first 성공 체감** (학생/예약/청구) — `supabaseAdapter.setItem` + `customerStorage.saveStudent` / `scheduleStorage.saveBooking`  
   → 운영 모드에서 persist 실패를 UI에 연결(교재 패턴 확산) 또는 flushPersist 대기를 업무별로 명시.

### P1: 우선 개선

4. Daycare LOCAL_ONLY 규제 데이터 (`careStorage` incidents/legal/CCTV…) — 테이블·RLS 또는 동기화 대상 승격.  
5. Skin `retailCatalog` vs Core products 이중 SoT — `skinRetailCatalogMigrate.ts` / `skinRetailService.ts`.  
6. Booking status API 단일화 — `scheduleStorage.updateBookingStatus` vs `ScheduleService.updateBookingStatus`.  
7. `OrganizationProvider` 책임 분할 — portal / membership / bootstrap.  
8. refreshKey 남용 축소 — domain subscribe 또는 query 무효화로 대체.

### P2: 나중에 개선

9. `StudentService`/`ScheduleService` thin facade 정리 또는 실제 도메인 규칙 이전.  
10. 전체 배열 get+filter → id/date 인덱스·서버 필터.  
11. Practice room legacy 키 완전 제거.  
12. Piano attendance vs core attendance_sessions 모델 통합 문서화/코드 정렬.

---

## 문제 체크리스트 (요청 항목 × 근거)

| 문제 | 대표 근거 |
|------|-----------|
| localStorage가 DB처럼 사용 | `sessionPassStorage.consumeSessionPass`, daycare LOCAL_ONLY saves |
| Supabase+local 동시 SoT | `supabaseAdapter.setItem` (mirror 즉시 + persist 비동기); Skin catalog |
| 같은 데이터를 여러 Service | sales: core / retail / textbookSale; inventory: core / textbookCoreStock / skin |
| Supabase 직접 + StorageService 혼재 | Retail(직접) vs Piano students(Storage); Parent RPC vs Storage links |
| CRUD 중복 | StudentStorage vs StudentService; schedule dual status |
| business rule 중복 | pass consume rules in ScheduleService; stock rules in inventory vs textbookCoreStock |
| TX 필요하나 FE 다단계 | booking+pass; tuition+linked textbook |
| organization_id 불명확 | LOCAL_ONLY 키는 org 스코프 resolveStorageKey이나 서버 tenant 검증 없음; device 선택 id는 `moa_current_organization_id` |
| FE permission만 의존 | `usePermissions` + staff grants from local teachers |
| 전체 배열 filter/sort/find | `ScheduleService.getUpcomingBookings`, `StudentService.getActiveStudents` |
| refreshKey 의존 | `AppContext`, `TextbookManagementView`, daycare InspectionBinder 등 |
| Provider 과다 책임 | `OrganizationProvider` |
| 유사 파일 중복 | retail `productService.ts` re-export; multiple sale entrypoints |

---

## 다음 단계에서 수정할 파일 5개

운영 리스크·파급 대비 효과가 큰 순서:

1. `src/services/storage/sessionPassStorage.ts` — 이용권 SoT를 local-only에서 분리/게이트  
2. `src/core/services/scheduleService.ts` — 예약 완료↔이용권 차감을 단일·실패 가시 경로로  
3. `src/core/finance/services/invoicePaymentService.ts` — linked textbook settle soft-fail 제거  
4. `src/services/adapters/supabaseAdapter.ts` — (선택적) 운영 모드 persist 결과 피드백 훅/플래그 — **대규모 재설계 없이** 관측 가능하게  
5. `src/industries/daycare/care/careStorage.ts` — LOCAL_ONLY 규제 데이터 목록을 코드로 고정하고 sync 대상 승격 계획의 1차 적용점  

---

## 부록 A. StorageService 합성 맵 (요약)

```
storage.ts
  customerStorage          → STUDENTS, PARENTS, LINKS
  staffClassStorage        → TEACHERS, CLASSES
  scheduleStorage          → SCHEDULES, SERVICE_OFFERINGS
  sessionPassStorage       → SESSION_PASSES (LOCAL_ONLY), SLOT_RECRUITMENTS
  attendanceStorage        → ATTENDANCE, sessions, pins
  financeStorage           → expenses, income, …
  invoicePaymentService    → INVOICES, payments, combined
  textbookStorage          → textbooks + sales/payments
  daycare careStorage      → journals(sync) + LOCAL_ONLY extras
  settings / events / …
```

## 부록 B. 관련 package.json 테스트 스크립트

- RLS/Auth: `test:rls-*`, `test:auth-hijack-audit`, `test:multi-role-helpers`  
- Commerce: `test:commerce-unit`, `test:commerce-db-it`, `test:create-sale-*`, `test:point-atomic`, `test:stock-movement-atomic`  
- Textbook: `test:textbook-sale-*`, `test:textbook-catalog-persist`, `test:textbook-sale-db-it`  
- Sync: `test:sync-persist-helpers`, `test:hydrate-modules`  
- Org: `test:org-context-resolve`  
- Pilates: `test:pilates-booking-validate`

## 부록 C. 대표 migrations (Commerce / RLS)

- Core RLS: `20260822000003_create_core_rls.sql`, `20260822130000_staff_scoped_rls*.sql`  
- Parent: `20260822150000_*`, `20260822170000_*`, `20260822200000_guardian_link_tokens_rpcs.sql`  
- Daycare: `20260826200000_daycare_care_tables.sql`  
- Atomic commerce: `20260920193000_core_create_sale_atomic.sql`, `20260920194500_core_create_sale_return_atomic.sql`, `20260921130000_create_sale_include_point_redeem.sql`, `20260921140000_point_sale_return_adjust_atomic.sql`  
- Retail staff: `20260922180000_retail_staff_sale_permissions.sql`

---

*이 문서는 코드 변경 없이 저장소 스냅샷을 기준으로 작성되었다. 이후 리팩터링은 위 P0 파일 5개부터 착수하는 것을 권장한다.*
