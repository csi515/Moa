# StorageService Migration Contract (P18)

> 조사 기준: `csi515/Moa` `main`.  
> API를 삭제하거나 persist/hydrate/sync 의미를 바꾸지 않는다.  
> `BaseStorageService` 같은 범용 추상화, mega-facade에 slice를 더 붙이는 방식은 금지한다.

## P18-3 동결 (현재)

`StorageService` = **legacy compatibility facade**. 신규 domain SoT가 아니다.

| 규칙 | 의미 |
| --- | --- |
| 신규 Capability | domain `*Storage` 싱글톤. `@/services/storage` import 즉시 실패 |
| 신규 Industry | 자체 storage 또는 Capability facade. StorageService 신규 import 즉시 실패 |
| `src/services/storage.ts` | `assembledStorage` 재export만. domain method 추가 즉시 실패 |
| `domainFacades.ts` | 동결된 slice만 Object.assign. 새 slice 즉시 실패 |
| 교차 업무 | application/service가 각 facade를 조합 |
| 기존 호출처 | 유지. allowlist에 있는 Industry 파일만. 고치면 목록에서 제거 |

검사: `scripts/check-architecture-dependencies.mjs`, `scripts/storage-facade-freeze.mjs`, `scripts/storage-service-industry-legacy.mjs`.

`useStorageRefresh`와 persistence policy는 기존 계약이다.

## P18-2 호출처 규칙 (신규 코드)

Capability는 `@/services/storage`(mega-facade)를 import하지 않는다. architecture checker가 신규 파일을 즉시 실패시킨다.

| 호출자 | 쓸 facade |
| --- | --- |
| `src/capabilities/attendance/**` | `attendanceStorage` |
| `src/capabilities/billing/**` | `billingStorage` (+ 교차 시 roster/settings/commerce/parent) |
| `src/capabilities/roster/**` | `rosterStorage` |
| 설정·온보딩 | `settingsStorage` |
| Piano 교재 | `commerceStorage` (Retail RPC와 분리) |

`StorageService.*` get/save/delete는 신규 Capability에서 금지. 호환층은 `@deprecated`로 남긴다.

관련: [DATA_FLOW.md](./DATA_FLOW.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [architecture/data-flow-audit.md](./architecture/data-flow-audit.md), `src/core/storage/persistencePolicy.ts`, `src/services/adapters/storageKeys.ts`.

---

## 1. StorageService 현재 역할

`src/services/storage.ts`는 **동결된 legacy compatibility facade**다. 자체 도메인 CRUD는 없고 `assembledStorage`를 재export한다. 구현 owner는 아래 싱글톤이다.

```text
storageCore (hydrate / org / sign-out / subscribe)
  + rosterStorage          (students, parents, teachers, classes)
  + schedulingStorage      (bookings, offerings + records)
  + bookingStorage         (session passes, slot recruitments)
  + resourcesStorage       (legacy practice-room local)
  + transportStorage       (shuttle ride requests)
  + settingsStorage        (settings, active user, onboarding, backup)
  + parentStorage          (guardian links + piano education + events + notices)
  + attendanceStorage
  + billingStorage         (finance + invoice persist + payment service)
  + commerceStorage        (piano textbook catalog/sales — retail commerce 아님)
  + dashboardStatsStorage
  + daycare careStorage    (plugin bind, Object.assign at load)
```

실제 persist는 `getStorageAdapter()` (`SupabaseAdapter`) → local mirror + pending/outbox + remote sync다.  
키 정책은 `src/core/storage/persistencePolicy.ts`. 화면 갱신은 `useStorageRefresh` / `StorageService.subscribe`.

**현재 사실**

- capability `infrastructure/*Storage`는 **이미 존재**하지만, 대부분은 `src/services/storage/*` factory를 재export한 뒤 `Object.assign`으로 mega-facade에 다시 붙인다.
- 호출처 대다수는 여전히 `import { StorageService } from '@/services/storage'`.
- Capability public `index.ts`는 storage facade를 아직 노출하지 않는다.
- Daycare care는 `bindDaycareCareStorage()`가 모듈 로드 시 `StorageService`에 메서드를 붙인다. `storage.ts`가 Industry를 import하지 않기 위한 composition 우회다.
- Piano 교재 판매 orchestration은 반대 방향이다. `services/storage/textbookStorage.ts`가 `@/industries/piano/services/textbookSaleService`를 import한다 (LEGACY allowlist).

`storage.ts`의 `storageCore`만 adapter 위임이다. 도메인 메서드의 구현은 factory에 있다.

---

## 2. Facade가 하는 일 (delegation vs logic)

| 유형 | 의미 | 예 |
| --- | --- | --- |
| **Adapter 위임** | `getStorageAdapter()`만 호출 | `hydrate`, `subscribe`, `clearOrganization` |
| **Thin domain 위임** | 이미 있는 Core/Capability service로 넘김 | `consumeSessionPass` → `sessionPassService` |
| **CRUD facade** | `getItem`/`setItem`/`upsertById` + 가벼운 정규화 | `saveStudent`, `saveClass`, `saveExpense` |
| **집계/파생** | 여러 키를 읽어 계산. persist는 없음 | `getDashboardStats`, `getFinanceSummary`, `getMakeupItems` |
| **업무 orchestration** | 상태 전이·원격·부수효과. storage에 두면 위험 | `recordPayment`, `createSale`, `toggleCheckInByPin`, `createOrLinkParent` |

이후 단계 규칙:

- Adapter 위임 → `services` hydrate/session 모듈에 남긴다. mega-facade에서 빼도 호환 alias는 유지.
- Thin 위임 → 호출처를 실제 service로 옮긴 뒤 Storage API는 deprecated 호환만.
- CRUD → 기존 capability `*Storage`가 SoT 후보다. 구현 파일을 복제하지 않는다.
- 집계 → Application/query로 옮긴다. persist facade에 남기지 않는다.
- Orchestration → 이미 있는 Service/RPC (`TuitionService`, `textbookSaleService`, `sessionPassService`, PIN application)가 SoT다. Storage 메서드는 호환 wrapper.

---

## 3. 이미 존재하는 domain-specific facade (새로 만들지 말 것)

이름을 따른다. 새 `BaseStorage` / 중복 factory 금지.

| 공개 이름 | 정의 | 실제 구현 | 다루는 키 |
| --- | --- | --- | --- |
| `createAttendanceCapabilityStorage` | `capabilities/attendance/infrastructure/attendanceStorage.ts` | `services/storage/attendanceStorage.ts` | `ATTENDANCE`, `ATTENDANCE_SESSIONS`, `CUSTOMER_PINS` (+ students 미러) |
| `createBillingCapabilityStorage` | `capabilities/billing/infrastructure/billingStorage.ts` | finance + invoice persist + `invoicePaymentService` | `INVOICES`, `TUITION_PAYMENTS`, `EXPENSES`, `INCOME_ENTRIES` |
| `createBookingCapabilityStorage` | `capabilities/booking/infrastructure/bookingStorage.ts` | `sessionPassStorage.ts` | `SESSION_PASSES`, `SLOT_RECRUITMENTS` (+ settings 일부) |
| `createSchedulingCapabilityStorage` | `capabilities/scheduling/infrastructure/schedulingStorage.ts` | `scheduleStorage` + `recordsStorage` | `SCHEDULES`, `SERVICE_OFFERINGS`, `CONSULTATIONS`, `PRACTICE_RECORDS`, `LESSON_RECORDS` |
| `createRosterCapabilityStorage` | `capabilities/roster/infrastructure/rosterStorage.ts` | `customerStorage` + `staffClassStorage` | `STUDENTS`, `PARENTS`, `TEACHERS`, `CLASSES` |
| `createParentCapabilityStorage` | `capabilities/parent/infrastructure/parentStorage.ts` | parentEducation + events + notifications | links, curriculum, songs/events, `NOTIFICATIONS` |
| `createCommerceCapabilityStorage` | `capabilities/commerce/infrastructure/commerceStorage.ts` | `textbookStorage` (catalog+sales+piano sale service) | `TEXTBOOKS`, sales/payments, inventory tx |
| `createResourcesCapabilityStorage` | `capabilities/resources/infrastructure/resourcesStorage.ts` | `practiceRoomBookingStorage` (**deprecated 로컬**) | `PRACTICE_ROOM_BOOKINGS` |
| `createTransportCapabilityStorage` | `capabilities/transport/infrastructure/transportStorage.ts` | `shuttleRideStorage.ts` | `SHUTTLE_RIDE_REQUESTS` |
| `createDaycareCareStorage` | `industries/daycare/care/careStorage.ts` | 동일. `bindCareStorage.ts`가 mega-facade에 붙임 | `CARE_*` / medication |
| `createSettingsStorage` | `services/storage/settingsStorage.ts` | 동일. capability 래퍼 없음 | `SETTINGS`, `ACTIVE_USER`, `INITIALIZED`, `ONBOARDING_PROGRESS` |
| `createDashboardStatsStorage` | `services/storage/dashboardStatsStorage.ts` | 동일 | 읽기 집계 + 청구 일괄 생성 |

이미 있는 **비-StorageService** persist (건드리지 말고 재사용):

- Retail/skin commerce: `capabilities/commerce` facade (`productService`, `saleService`, RPC). StorageService가 아니다.
- `sessionPassService` (`core/schedules`)
- `TuitionService`, `StudentService`, `ScheduleService`, `LessonService`
- Practice room 신규 쓰기: `practiceRoomReservationService` (`room_reservations`)
- Persistence policy / adapter hydrate·sync

**이름 주의:** `commerceStorage`는 Piano 교재 local/DB 미러다. Retail `capabilities/commerce`와 합치지 않는다.

---

## 4. 조립이 잘못된 묶음 (분류는 구현 기준)

이름만 보면 틀린다.

| 현재 묶음 | 실제 내용 | 이후 소유 |
| --- | --- | --- |
| `bookingStorage` | 이용권·슬롯만. **예약 CRUD 없음** | Booking (passes). 예약은 Scheduling/Booking 중 `scheduleStorage` |
| `schedulingStorage` | 예약+오퍼링 + 상담/연습/수업일지 | 예약·오퍼링 → scheduling. 상담 → consultation. 연습/수업 → Piano |
| `parentStorage` | 보호자 링크 + Piano 교육/행사 + 알림 | 링크 → parent. 교육/행사 → Piano. 알림 → Notification/Core notices |
| `rosterStorage.getParents` | 학부모 엔티티 CRUD | Parent (roster는 학생/강사/반) |
| `commerceStorage` | Piano 교재 | Piano + 청구 연동은 Billing. Retail commerce와 분리 |
| `resourcesStorage` | deprecated 로컬 연습실 | 읽기 호환만. 신규 쓰기 금지 |
| `dashboardStatsStorage` | 출결+수납+원생 집계, 월 청구 일괄 | Query는 Composition/Industry. 청구 생성은 Billing |
| `getFinanceSummary(industry)` | piano일 때만 교재 연동 수입 | Billing. industry 분기는 제거 대상 |

---

## 5. Public API 전수 분류

호출처는 `src/modules/<industry>`와 `src/industries/<industry>`가 같은 파일을 복제한 경우가 많다. 아래 **라이브 기준은 `src/industries` + `src/modules/parent` + Core/Capability**. modules 업종 복제는 같은 API의 잔여 호출이다.

유지 열: `compat` = mega-facade에 당분간 남김. `move` = 호출처를 facade/service로 옮긴 뒤 삭제 후보. `core-keep` = hydrate/session이라 인프라에 영구 유지(이름만 분리 가능).

### 5.1 Organization / Auth / Session — adapter 위임

정의: `src/services/storage.ts` `storageCore`. 키 없음. Adapter lifecycle.

| API | 로직 | 권장 소유 | 유지 | 주요 호출처 |
| --- | --- | --- | --- | --- |
| `hydrate` | 위임 | services/adapters | core-keep | `StorageHydrator.tsx` |
| `clearOrganization` | 위임 | services/adapters | core-keep | `OrganizationProvider`, `AuthProvider` |
| `clearBusinessCachesOnSignOut` | 위임 | services/adapters | core-keep | `AuthProvider` |
| `isHydrated` / `isHydrating` / `isOfflineHydrated` | 위임 | services/adapters | core-keep | `StorageHydrator` |
| `flushSyncOutbox` | 위임 | services/adapters | core-keep | `StorageHydrator` |
| `hasUnsyncedBusinessChanges` | 위임 | services/adapters | core-keep | (adapter `hasUncommittedWrites`) |
| `prepareSignOut` | 위임+기본 구현 | services/adapters | core-keep | `AuthProvider` |
| `subscribe` | 위임 | services/adapters | core-keep | `useStorageRefresh`, `useActiveUser`, Piano textbook/resources |

### 5.2 Settings + UI/device-only

정의: `services/storage/settingsStorage.ts`.  
키: `SETTINGS` (sync), `ACTIVE_USER` / `INITIALIZED` / `ONBOARDING_PROGRESS` (device-only).

| API | 분류 | 로직 | 권장 소유 | 유지 | 호출처 요약 |
| --- | --- | --- | --- | --- | --- |
| `getSettings` / `updateSettings` / `saveSettings` | Settings | CRUD | 기존 `settingsStorage` (Core settings, capability 신설 금지) | compat | academy settings, onboarding, PIN kiosk, retail points, 다수 화면 |
| `backfillAttendanceFeatureFlag` | Settings + Attendance | 업무 | Attendance feature + settings | compat | 온보딩/설정 |
| `getActiveUser` / `setActiveUser` | Organization/Auth/Session | CRUD (device) | session (`useActiveUser`, `SupabaseRoleSync`) | compat | RoleSync, Header, permissions, onboarding |
| `isOnboardingComplete` … `shouldShowOnboardingResume` | UI/device-only | 파생 | settingsStorage 유지 | compat | `OnboardingWizard`, `usePianoOnboardingUi` |
| `exportDatabaseJSON` / `importDatabaseJSON` / `exportAllData` / `importAllData` | Legacy/compat + Settings | 백업(여러 키) | settings. `exportAllData`는 alias | compat | academy settings |

### 5.3 Roster (Core customer/staff — academy 재사용)

정의: `customerStorage.ts`, `staffClassStorage.ts` → `rosterStorage`.  
키: `STUDENTS`, `PARENTS`, `TEACHERS`, `CLASSES` (`piano_app_*`, Core sync).

| API | 분류 | 로직 | 권장 소유 | 유지 | 호출처 요약 |
| --- | --- | --- | --- | --- | --- |
| `getStudents` / `getStudentsRaw` / `getStudentById` / `saveStudent` / `deleteStudent` | Core domain (roster) | CRUD + guardian 파생 | **rosterStorage** | compat | `StudentService`, academy 학생 UI, attendance, dashboards, notices, 거의 전 업종 |
| `deriveStudentGuardians` | Parent + Roster | 파생 | parent + roster | compat | student save 경로 |
| `getParents` / `saveParent` / `deleteParent` | Parent (이름은 roster에 있음) | CRUD | **parentStorage** (구현은 customerStorage 유지) | compat | `ParentManagementView`, guardian helpers, parent portal |
| `getTeachers` / `saveTeacher` / `deleteTeacher` | Core domain (staff/roster) | CRUD | rosterStorage | compat | 강사 UI, payroll, grants, timetable |
| `getClasses` / `saveClass` / `deleteClass` | Scheduling + Roster | CRUD | roster (반) / scheduling과 링크 | compat | `ClassManagementView`, attendance, timetable |

### 5.4 Scheduling / Booking

정의: `scheduleStorage.ts` (scheduling facade에 포함).  
키: `SCHEDULES` (`core_schedules`), `SERVICE_OFFERINGS`.

| API | 분류 | 로직 | 권장 소유 | 유지 | 호출처 요약 |
| --- | --- | --- | --- | --- | --- |
| `getBookings` / `saveBooking` / `updateBookingStatus` / `deleteBooking` | Booking + Scheduling | CRUD | **scheduleStorage**를 scheduling에 두고, booking application이 사용. 복제 금지 | compat | `ScheduleService`, pilates `BookingCalendarView`, academy calendar/timetable, parent booking cancel, deposit confirm |
| `getServiceOfferings` / `saveServiceOffering` / `deleteServiceOffering` | Scheduling | CRUD | schedulingStorage | compat | pilates/skin 예약 상품, calendar |

예약+이용권 원자는 `core/schedules/*Atomic`이 `StorageService`를 직접 부른다. **가장 위험한 이전 대상.**

### 5.5 Booking — session pass

정의: `sessionPassStorage.ts` → `bookingStorage`.  
키: `SESSION_PASSES` (server-authoritative), `SLOT_RECRUITMENTS` (local-only, settings에도 복제).

| API | 분류 | 로직 | 권장 소유 | 유지 | 호출처 요약 |
| --- | --- | --- | --- | --- | --- |
| `getSessionPasses` / `saveSessionPass` / `deleteSessionPass` | Booking | thin → `sessionPassService` | bookingStorage / sessionPassService | compat | pilates Pass UI, ScheduleService |
| `consumeSessionPass` / `refundSessionPass` | Booking | **deprecated thin** | `sessionPassService` only | compat → move | `ScheduleService`, `lessonPassConsume`, `*PassAtomic` |
| `getSlotRecruitments` / `setSlotRecruitmentClosed` / `setSlotRecruitmentCapacity` | Booking + Scheduling | CRUD + settings 이중 기록 | bookingStorage | compat | pilates booking calendar |

### 5.6 Attendance

정의: `attendanceStorage.ts` → `attendanceStorage` facade.  
키: `ATTENDANCE`, `ATTENDANCE_SESSIONS`, `CUSTOMER_PINS`. PIN은 students `hasPin`도 갱신.

| API | 분류 | 로직 | 권장 소유 | 유지 | 호출처 요약 |
| --- | --- | --- | --- | --- | --- |
| `getAttendance` / `saveAttendanceRecord` / `batchSaveAttendance` / `deleteAttendance` | Attendance | CRUD | **attendanceStorage** | compat | piano day maps, makeup, dashboards |
| `getAttendanceSessions` / `saveAttendanceSession(s)` | Attendance | CRUD | attendanceStorage | compat | kiosk, `AttendanceManagementView`, parent sessions |
| `getCustomerPins` / `hasCustomerPin` / `setCustomerPinHash` / `clearCustomerPin` | Attendance | CRUD | attendanceStorage | compat | PIN panel, kiosk |
| `setCustomerPin` / `generateCustomerPin` | Attendance | 업무 (hash) | attendance application/`pinService` | compat | `CustomerPinPanel` |
| `toggleCheckInByPin` | Attendance | **orchestration** (industry flag, flush, push) | attendance application | compat | `PinCheckInKioskView` |
| `getMakeupItems` | Attendance | 집계 | attendance query | compat | `MakeupManagementView` |
| `scheduleMakeup` / `completeMakeup` | Attendance + Scheduling | 상태 전이 | attendance + `makeupScheduleAtomic` | compat | makeup UI, atomic helpers |

Capability UI/domain이 아직도 `StorageService`를 import한다 (LEGACY allowlist 13파일 중 attendance 4).

### 5.7 Billing / Finance

정의: `financeStorage.ts`, `financeInvoicePersist.ts`, `invoicePaymentService.ts` → `billingStorage`.  
키: `INVOICES`, `TUITION_PAYMENTS`, `EXPENSES`, `INCOME_ENTRIES`. Payroll 키는 persist하지만 Storage 메서드는 없음 (`useTeacherPayroll`이 teachers/expenses 사용).

| API | 분류 | 로직 | 권장 소유 | 유지 | 호출처 요약 |
| --- | --- | --- | --- | --- | --- |
| `getInvoices` / `saveInvoice` / `normalizeInvoiceStatus` / `requestCashReceipt` | Billing | CRUD | **billingStorage** + `TuitionService` | compat | `TuitionService`, unpaid UI, student detail |
| `deleteInvoice` | Billing | 업무 (결제/수입 정리) | invoicePaymentService | compat | `TuitionService` |
| `deleteInvoiceRecord` | Billing | CRUD 내부 | persist only, public 축소 | compat → move | payment service 내부 |
| `getTuitionPayments` / `getTuitionPaymentsByInvoiceId` / `saveTuitionPayment` | Billing | CRUD | billingStorage | compat | linkage, combined payment |
| `recordPayment` / `reverseTuitionPayment` | Billing | **orchestration** | `TuitionService` / `tuitionPaymentAtomic` | compat | atomic + TuitionService |
| `removeTuitionPayment` / `removeTuitionPaymentsByInvoiceId` | Billing | CRUD | persist | compat | payment reverse 경로 |
| `createInvoiceForStudent` / `generateMonthlyInvoicesForAllActive` | Billing | 업무 | TuitionService | compat | TuitionService, dashboard batch |
| `batchGenerateMonthlyInvoices` | Billing | 업무 (dashboard 모듈에 위치) | billingStorage / TuitionService | compat | director dashboard |
| `getExpenses` / `saveExpense` / `deleteExpense` | Billing/Finance | CRUD | billingStorage | compat | Expense UI, payroll |
| `getIncomeEntries` / `saveIncomeEntry` / `deleteIncomeEntry` | Billing/Finance | CRUD | billingStorage | compat | Income UI, finance overview |
| `deleteIncomeEntryRecord` | Billing | CRUD 내부 | persist | compat → move | income delete 내부 |
| `upsertLinkedIncome` / `deleteLinkedIncome` / `backfillBillingLinkedIncome` | Billing | 위임 `core/finance` | billingIncomeLink | compat | overview backfill, sale/payment |
| `getFinanceSummary` / `getRevenueBreakdown` | Billing | 집계 | billing query | compat | `FinanceOverviewView` |
| `getUnpaidInvoices` / `getUnifiedUnpaidSummaries` / `getUnifiedUnpaidStats` | Billing + Commerce | 집계 (교재 미수 결합) | billing query | compat | `UnpaidManagementView` |

### 5.8 Commerce — Piano textbook (retail 아님)

정의: catalog + sales persist + `industries/piano/.../textbookSaleService`.  
키: `TEXTBOOKS`, `TEXTBOOK_SALES`, `TEXTBOOK_PAYMENTS`, `TEXTBOOK_INVENTORY_TRANSACTIONS`. 판매/수납 SoT는 DB direct.

| API | 분류 | 로직 | 권장 소유 | 유지 | 호출처 요약 |
| --- | --- | --- | --- | --- | --- |
| `getTextbooks` / `getTextbookById` / `getActiveTextbooks` / `saveTextbook` / `deleteTextbook` / `setTextbookForSale` | Piano-specific + Commerce | CRUD + DB | 기존 commerceStorage / piano catalog | compat | `TextbookManagementView` |
| `adjustStock` / `recordInventoryTransaction` / inventory getters / `getLowStockTextbooks` | Piano-specific | CRUD + Core stock | piano + commerceStorage | compat | stock modal |
| `getTextbookSales*` / `getTextbookPayments*` / `saveTextbookPaymentDirect` / billing invoice link helpers | Piano-specific + Billing | CRUD/미러 | textbookSalesStorage | compat | TuitionService, unpaid, student billing |
| `getStudentBillingSummary` / `getAllStudentsBillingSummary` / `getUnpaidTextbookSales` / `getTextbookStats` | Billing + Piano | 집계 | billing query (교재 입력은 piano) | compat | student detail, tuition |
| `createSale` / `cancelSale` / `recordTextbookPayment` / `reverseTextbookPayment` / `linkTextbookSalesToInvoice` | Piano-specific | **orchestration (DB/RPC/income)** | `textbookSaleService` (Industry). Storage는 호환 | compat | NewSaleModal, payment modal, combined payment |
| `enrichSaleGuardian` | Parent + Piano | 파생 | piano sales | compat | sales list |

### 5.9 Consultation (scheduling facade에 잘못 포함)

정의: `recordsStorage.ts`. 키: `CONSULTATIONS`.

| API | 분류 | 권장 소유 | 유지 | 호출처 |
| --- | --- | --- | --- | --- |
| `getConsultations` / `saveConsultation` / `deleteConsultation` | 기타 → Consultation | 기존 records 구현을 `consultation` infrastructure로 연결 (파일 복제 금지) | compat | `ConsultationRecordsView`, piano consultation hub |

`capabilities/consultation`은 현재 manifest만 있다.

### 5.10 Piano-specific — lessons / practice / education / events

| API | 정의 | 키 | 권장 소유 | 유지 | 호출처 요약 |
| --- | --- | --- | --- | --- | --- |
| `getLessonRecords` / `saveLessonRecord` / `deleteLessonRecord` | recordsStorage | `LESSON_RECORDS` | Piano (`LessonService`) | compat | TodayLesson, LessonRecords, LessonService |
| `getPracticeRecords` / `savePracticeRecord` / `deletePracticeRecord` | recordsStorage | `PRACTICE_RECORDS` | Piano | compat | PracticeRecordsView |
| curriculum / assignment / achievement / learning report `get*`/`save*`/`seed*`/`confirm*`/`publish*`/`generate*` | parentEducationStorage | `piano_curriculum_*` 등 | Piano education. parent facade에서 분리 | compat | `EducationManagementView`, lesson sync, parent progress/reports |
| `getSongs`/`saveSong`/`deleteSong` + event/video/participant APIs | eventsStorage | `SONGS`, `EVENTS`, `PERFORMANCE_VIDEOS` | Piano (`recitalService`) | compat | recitalService, parent events, calendar |
| `eventTypeToVideoType` | eventsStorage | — | Piano | compat | recital |

`parentEducationStorage`의 보호자 API는 Parent (5.11).

### 5.11 Parent (guardian) + Notification

| API | 정의 | 키 | 분류 | 권장 소유 | 유지 | 호출처 요약 |
| --- | --- | --- | --- | --- | --- | --- |
| `getParentStudentLinks` / `saveParentStudentLinks` / `linkParentToStudent` / `unlinkParentFromStudent` | parentEducationStorage | `PARENT_STUDENT_LINKS` | Parent | **parentStorage** | compat | guardianHelpers, ParentManagement, notices |
| `createOrLinkParent` / `ensureParentFromStudent` / `syncStudentGuardians` / `syncParentsFromStudents` / `rebuild*` / `migrateLegacyParentLinks` | parentEducationStorage | PARENTS + LINKS + STUDENTS | Parent | parent application | compat | student registration, bulk import |
| `getStudentsForParent` | parentEducationStorage | — | Parent | parentStorage | compat | parent portal homes |
| `getNotifications` / `saveNotification` / `sendNotification` / `deleteNotification` | notificationsStorage | `NOTIFICATIONS` | Notification | 기존 notificationsStorage. Core notices와 역할 정리 | compat | `useParentNoticeState`, flush publish, parent portal |

### 5.12 Resources (legacy) / Transport / Daycare / Dashboard

| API | 분류 | 키 | 권장 소유 | 유지 | 호출처 |
| --- | --- | --- | --- | --- | --- |
| `get/save/cancel/deletePracticeRoomBooking` | Legacy/compat | `PRACTICE_ROOM_BOOKINGS` | resourcesStorage 읽기 폴백. 신규 쓰기 금지 | compat → 삭제 후보 | PracticeRoomBookingView (폴백) |
| `get/save/deleteShuttleRideRequest` | Transport | `SHUTTLE_RIDE_REQUESTS` (local-only) | **transportStorage** | compat | `ShuttleRideRequestView`, Gym parent |
| Daycare `get/save/delete` journals, medication, legal, incidents, health certs, safety, meals, CCTV, pickup | Daycare-specific | `daycare_*` | **createDaycareCareStorage** (이미 Industry) | compat | `industries/daycare/care/*`, parent care views |
| `getDashboardStats` | 기타 (교차 집계) | 다수 키 읽기 | Industry dashboard hooks. Storage에 로직 유지 금지 방향 | compat | director/staff/industry dashboards |

---

## 6. 새 facade가 필요한 영역

기존 모듈을 먼저 쓴다. **새 파일이 필요해도 factory를 복제하지 않고 연결만 한다.**

| 영역 | 새 이름? | 이유 |
| --- | --- | --- |
| Settings / session / onboarding | 아니오. `createSettingsStorage` | capability로 승격하지 않음 |
| Hydrate / subscribe | 아니오. adapter + `storageCore` 분리만 | mega-facade에서 빼는 것이 목표 |
| Consultation | 예. `createConsultationCapabilityStorage` → 기존 `recordsStorage` 상담 슬라이스만 | scheduling에 섞여 있음 |
| Notification | 선택. 기존 `notificationsStorage`를 parent에서 분리 | Core notices와 중복 정리 |
| Piano education/events/lessons | 아니오. Industry `piano` persist 모듈로 이동 | 범용 capability facade 신설 금지 |
| Daycare | 아니오. `careStorage` | 이미 SoT |
| Enrollment | 아니오 (데이터 키 없음) | 학생/반 roster 재사용 |
| Retail commerce | 아니오 | 이미 RPC facade. StorageService에 넣지 말 것 |
| Dashboard stats | 아니오 | query hook으로 이전. facade 신설 불필요 |

금지: `BaseStorageService`, mega-facade에 slice 추가, Daycare/Piano 메서드를 `storage.ts`에 직접 추가.

---

## 7. 발견된 위험 패턴

### Capability가 mega-facade를 import

architecture checker LEGACY allowlist:

- attendance: `pinAttendanceValidation`, `AttendanceManagementView`, `CustomerPinPanel`, `PinCheckInKioskView`
- billing: `tuitionService`, `tuitionPaymentAtomic`, `combinedPayment*`, `billingLinkageValidation`, Finance/Income/Expense UI, `useTeacherPayroll`

목표: `@/capabilities/<id>/infrastructure/*Storage` 또는 기존 `TuitionService`. **신규 capability 파일에 `@/services/storage` 추가 금지.**

### Industry가 Core/Storage를 직접 사용

거의 모든 라이브 Industry 화면이 `StorageService.getStudents` / `getBookings` / care·textbook API를 직접 호출한다. Academy 재사용 UI(`core/academy`)도 동일.

### 새 Capability를 넣을 때 `storage.ts`를 수정하는 구조

지금도 `Object.assign(storageCore, createXCapabilityStorage(...))`다.  
Daycare는 더 나쁘다. `bindDaycareCareStorage`가 런타임에 메서드를 붙인다.

이후: capability는 자기 `*Storage`만 export. Composition/`storage.ts`에 slice를 추가하지 않는다. 호출처가 facade를 직접 import한다.

### Industry 데이터 때문에 StorageService에 메서드 추가

- Daycare: bind로 우회 (방향은 맞음, mega-facade 확장은 여전)
- Piano textbook: `services` → `industries/piano` import (계층 역전, LEGACY)

### 로직 중복

| 중복 | 위치 |
| --- | --- |
| 교재 판매 미러 write | `textbookSalesStorage` + `textbookSaleService` |
| 청구-교재 링크 | `setTextbookBillingInvoice` vs `linkTextbookSalesToInvoice` |
| 수입 링크 backfill | persist `backfillBillingLinkedIncome` vs payment service 동명 |
| invoice/income delete | `deleteInvoice` vs `deleteInvoiceRecord` |
| guardian | `deriveStudentGuardians` vs `syncStudentGuardians` |
| 월 청구 일괄 | `generateMonthlyInvoicesForAllActive` vs `batchGenerateMonthlyInvoices` |
| 출결 PIN | attendanceStorage vs `capabilities/attendance/application` |
| 이용권 차감 | Storage wrapper vs `sessionPassService` |
| industries vs modules 복제 | 동일 Storage 호출이 두 트리에 존재 |

---

## 8. Compatibility API (지금은 삭제 금지)

mega-facade에서 바로 빼면 hydrate/권한/수납/예약이 깨진다.

**영구(인프라):** `hydrate`, `clearOrganization`, `clearBusinessCachesOnSignOut`, `prepareSignOut`, `flushSyncOutbox`, `subscribe`, hydrated 플래그.

**장기 호환 (호출처 이전 전):**  
`get/save/delete` 전 엔티티, `getSettings`/`getActiveUser`, `recordPayment`, `createSale`, `toggleCheckInByPin`, `consumeSessionPass`, Daycare care getters/savers, `getDashboardStats`.

**deprecated이지만 호출 남음:** `consumeSessionPass`, `refundSessionPass`, practice-room local writes, `exportAllData` alias.

테스트·원자 경로가 `api: StorageService` 형태로 넘긴다 (`tuitionPaymentAtomic`, `combinedPaymentAtomic`). 시그니처를 일괄 변경하지 않는다.

---

## 9. Migration 대상 파일 (우선순위)

호출처를 facade로 옮기는 작업이다. **이번 단계에서는 수정하지 않는다.**

### P0 — 돈·재고·이용권·예약 확정 (가장 위험)

- `capabilities/billing/finance/services/tuitionService.ts` 및 `*PaymentAtomic*`
- `industries/piano/services/textbookSaleService.ts` + `services/storage/textbook*.ts`
- `core/schedules/bookingPassAtomic.ts`, `attendancePassAtomic.ts`, `makeupScheduleAtomic.ts`, `confirmBookingDeposit.ts`, `parentBookingCancel.ts`
- `core/services/scheduleService.ts`
- `industries/piano/services/lessonPassConsume.ts`

### P1 — Capability가 mega-facade를 쓰는 곳 (allowlist 제거 목표)

- `capabilities/attendance/ui/*`, `domain/pinAttendanceValidation.ts`
- `capabilities/billing/finance/components/*`

### P2 — Hydrate / org / session (동작 변경 금지)

- `StorageHydrator.tsx`, `AuthProvider`, `OrganizationProvider`, `SupabaseRoleSync`, `useStorageRefresh.ts`

### P3 — Roster / academy UI

- `core/students/services/*`, `core/academy/components/**`, `hooks/useStaffScope.ts`

### P4 — Industry UI 직접 호출

- `industries/piano/**`, `pilates/**`, `daycare/care/**`, `gym/**`, `skin/**`, `retail/settings`
- `modules/parent/**`

### P5 — 조립 정리 (마지막)

- `src/services/storage.ts`에서 domain `Object.assign` 제거
- `bindCareStorage.ts`의 mega-facade assign 제거 (careStorage 직접 import)
- `textbookStorage.ts`의 Industry import 제거 (piano이 자기 service를 소유)

Adapter hydrate/sync (`src/services/adapters/**`)는 **의미 변경 금지.** facade 이전과 별개다.

---

## 10. 이전 후 삭제 가능한 API (지금은 삭제하지 않음)

호출이 0이 된 뒤에만.

1. `consumeSessionPass` / `refundSessionPass` (sessionPassService로 이전 후)
2. `deleteInvoiceRecord` / `deleteIncomeEntryRecord` (내부 persist로 강등)
3. `exportAllData` / `importAllData` (JSON 백업 별칭)
4. `eventTypeToVideoType` (piano 유틸로 이동 후)
5. practice-room local `save`/`cancel`/`delete` (읽기 폴백만 남긴 뒤)
6. `batchGenerateMonthlyInvoices` (TuitionService와 병합 후 하나)
7. `setTextbookBillingInvoice` vs `linkTextbookSalesToInvoice` 중 중복
8. mega-facade 자체 — 모든 호출처가 domain facade를 쓰면 `storage.ts`는 `storageCore`(+구 이름 re-export)만 남김
9. Daycare 메서드의 `StorageService.*` 별칭 (`careStorage` 직접 사용 후)

삭제하지 않는 것: STORAGE_KEYS, adapter hydrate/sync, persistence policy, `useStorageRefresh` 계약, RPC 수납/재고 경로.

---

## 11. 권장 이전 순서 (이후 P18 단계)

1. **문서/계약 (본 단계)** — 완료. runtime 불변.
2. **호출처를 기존 facade로 교체** — attendance/billing부터 (allowlist 축소). 구현 이동 없음.
3. **orchestration을 Service로 고정** — payment/sale/pass. Storage는 wrapper.
4. **잘못 묶인 slice 분리** — consultation, piano education, parent links. factory 파일 이동은 호출 0 확인 후.
5. **`storage.ts` Object.assign 축소** — slice를 빼도 `export const StorageService = storageCore` 호환 유지.
6. **Daycare bind / piano textbook 계층 역전 해소**
7. **죽은 API 삭제** — 별도 PR, 테스트 그린 후.

각 단계마다 hydrate/org cache/sync semantics 금지. `test:persistence-policy`, `test:storage-refresh`, money atomics, `test:architecture`를 건다.

---

## 12. 호출처 규모 (P18-3)

| 층 | 상태 |
| --- | --- |
| Capability | mega-facade import **0**. 신규 파일은 checker 실패 |
| Industry | 기존 49파일만 `STORAGE_SERVICE_INDUSTRY_LEGACY_FILES`. 신규 파일 실패 |
| Core / parent / hooks / App | 아직 StorageService 사용. hydrate/session·academy 호환 |
| modules 업종 복제 | 잔여. 라이브 SoT 아님 |

`useStorageRefresh` domain 키: students, bookings, sessionPasses, classes, attendance, lessons, finance, settings, textbooks. 새 persist 키를 넣으면 여기와 `STORAGE_KEYS`와 persistence policy를 같이 선언한다.

---

## 13. 호환 API 삭제 조건

`StorageService` 자체는 호출이 0이 되기 전에 삭제하지 않는다. 메서드별:

| 묶음 | 구현 owner | 호환을 남기는 이유 | 삭제 가능 조건 |
| --- | --- | --- | --- |
| hydrate / subscribe / sign-out | `storageCore` / adapter | App·Auth·Org lifecycle | 인프라 모듈로 직접 이전 후 |
| settings / active user / onboarding | `settingsStorage` | academy·shared onboarding | 호출처가 settingsStorage만 쓸 때 |
| roster students/teachers/classes | `rosterStorage` | academy·Industry UI | 동일 |
| bookings / offerings | `schedulingStorage` | ScheduleService, pilates | 동일 |
| session pass | `bookingStorage` / `sessionPassService` | 예약 원자 경로 | consume/refund 호출 0 |
| attendance / PIN | `attendanceStorage` | Core shim, piano UI | 동일 |
| billing / payment | `billingStorage` | academy 미수, atomics | 동일 |
| textbook commerce | `commerceStorage` | piano 판매 UI | 동일 |
| parent / events / notices | `parentStorage` | parent 포털 | 동일 |
| dashboard stats | `dashboardStatsStorage` | director dashboard | query hook 이전 후 |
| daycare care | `careStorage` (bind) | care UI가 아직 mega-facade | careStorage 직접 사용 후 |
| practice-room local | `resourcesStorage` | 읽기 폴백 | 호출 0 |

신규 Capability를 추가할 때 `storage.ts`를 수정하지 않는다.  
신규 Industry를 추가할 때 `storage.ts`에 업종 메서드를 넣지 않는다.
