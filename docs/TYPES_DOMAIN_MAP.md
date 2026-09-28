# Types Domain Map

P19-1: 소유권 조사. P19-2: 명확한 타입을 소유 계층으로 이동. P19-3: `src/types/index.ts`를 **legacy compatibility barrel로 동결**.

`Student` / `AcademySettings` 객체 분해와 `education.ts` 이동은 아직 하지 않는다.

관련: [PROJECT_MAP.md](./PROJECT_MAP.md), [DOMAIN_MAP.md](./DOMAIN_MAP.md), [DATA_FLOW.md](./DATA_FLOW.md), `.cursor/rules/architecture.mdc`.

용어:

| 용어 | 의미 |
| --- | --- |
| **Current** | 지금 정의가 있는 파일 |
| **Target** | 장기 소유 계층·경로. 아직 이동하지 않음 |
| **Migration** | P19-2 이후 권장 작업. `keep` = 이번 라운드에서 분해하지 않음 |
| **Legacy compatibility** | 전역 barrel에 남겨도 되지만 신규 정의·신규 import의 SoT가 아님 |

원칙:

- `src/types/index.ts`는 장기적으로 domain source of truth가 아니다.
- 새 domain type은 자기 소유 영역(Core / Capability / Industry / Shared)에 둔다.
- 전역 barrel은 compatibility re-export만 허용한다.
- 여러 Industry가 쓴다는 이유만으로 Shared/Core로 올리지 않는다.
- 새로운 `StudentLevel` 같은 cross-industry union을 추가하지 않는다.

---

## 0. 현재 구조

| 파일 | 역할 |
| --- | --- |
| `src/types/index.ts` | **동결된** compatibility barrel. 출결·청구·예약·행사·연습실 등은 소유 파일 re-export. Student/Teacher/ClassItem/Parent만 local snapshot |
| `src/types/education.ts` | 피아노 커리큘럼·과제·학부모 포털 탭. barrel에 re-export되지 않음 |
| `tsconfig.json` `paths` | `@/*` → `src/*`. 타입 전용 path 없음. `@/types` = 위 barrel |

`src/types/index.ts`는 Capability/Industry **구현**을 import하지 않는다.  
다만 Core를 끌어온다.

* `@/core/transport/types` (`PickupAddress`)
* `@/core/staff/staffGrants` (`Teacher.grants`)
* `@/core/types/schedule` (`AcademySettings.slotRecruitments`)

역방향도 있다. `src/core/schedules/types.ts`는 Schedule/Reservation을 **`@/types`에서 re-export**한다. Core가 전역 barrel의 소비자가 된 상태다.

barrel 안에 runtime이 있다: `STUDENT_BILLING_MODE_LABEL`, `normalizeBillingMode`. 동일 의미는 `src/core/academy/utils/billingMode.ts`가 이미 감싼다.

`@/types` import는 academy UI, capability billing/attendance, piano/skin/retail, parent 포털, services adapters에 넓게 퍼져 있다. **호출 수가 많다고 Shared가 아니다.**

---

## 1. StudentLevel

### 1.1 현재 union (세 Industry 값이 한 타입)

| 그룹 | 값 | 실제 옵션 소유 |
| --- | --- | --- |
| 피아노 교재 레벨 | `바이엘 상/하`, `체르니 100/30/40/50`, `소나티네/명곡`, `작품집/쇼팽`, `입시/콩쿠르`, `성인 취미` | `PIANO_LEVEL_OPTIONS` |
| 체육관 수업 레벨 | `어린이`, `초급`, `중급`, `고급`, `선수반`, `성인`, `시니어` | `GYM_LEVEL_OPTIONS` |
| 어린이집 연령반 | `0~5세반`, `혼합반`, `방과후` | `DAYCARE_LEVEL_OPTIONS` |

정의: `src/types/index.ts`.  
선택지: `src/core/students/levelOptions.ts` (`LEVELS_BY_INDUSTRY`).  
라벨: Industry plugin `levelLabel` (`레벨` / `연령반` / `수업 레벨` / `관리 단계` 등).  
색: `src/utils/formatters.ts` `getLevelColor(level?: string)` — 타입 검사가 아니라 문자열 포함 매칭.

pilates / skin / retail / bath는 `LEVELS_BY_INDUSTRY`에 없어 `getStudentLevelOptions`가 `[]`를 반환한다. plugin `levelLabel`만 있다.

### 1.2 사용처

| 위치 | 하는 일 |
| --- | --- |
| `Student.level`, `Song.level`, `EventParticipantSummary.level` | 필드 타입 |
| `src/core/students/levelOptions.ts` | 업종별 옵션 배열 |
| `StudentFormModal` / `StudentAdvancedSection` | `getStudentLevelOptions(industry)` |
| `studentFormTypes.ts` `LEVEL_OPTIONS` | **피아노 목록만 하드코딩** (폼 기본은 위 함수를 씀) |
| `ClassManagementView` | `targetLevel: '바이엘' as StudentLevel` — **union에 없는 값** |
| `ResourceManagementView` (piano) | 곡 `level` select를 `StudentLevel`로 캐스팅 |
| `runStudentBulkImport.ts` | `level: 'beginner' as Student['level']` — **union에 없는 값** |
| `customerRowToStudent` | `meta.level`를 `StudentLevel`로 캐스팅. 없으면 **`'바이엘 상'` 기본값** |

### 1.3 질문에 대한 답

* **피아노 화면 값:** `PIANO_LEVEL_OPTIONS` 10개. 반 `targetLevel`은 `'바이엘'`처럼 union 밖 문자열도 쓴다.
* **어린이집 값:** `DAYCARE_LEVEL_OPTIONS` 9개 (0~5세반, 혼합반, 방과후). 의미는 교재 레벨이 아니라 **연령반**.
* **공통 Core에 `StudentLevel` union이 필요한가?** 아니다. Core에 필요한 것은 “원생에 붙는 업종별 분류 문자열”이다. 값 집합은 Industry 소유.
* **DB 저장값은 문자열인가?** 예. `piano.customers.level: string`. 그 외 업종은 `core.customers.metadata.level: string`. enum/check 없음.
* **validation/UI label:** 옵션 = `levelOptions.ts`. 필드 라벨 = plugin `levelLabel`. 배지 색 = `getLevelColor`. DB/앱 모두 문자열이라 **union은 저장을 강제하지 못한다.**

### 1.4 최종 분리안 (P19-2, Student 분해 없음)

1. `Student.level`은 `string` (또는 branded opaque)으로 완화. persist 계약 유지.
2. `PianoLevel`, `GymClassLevel`, `DaycareAgeGroup`을 각 Industry(또는 기존 `levelOptions.ts`를 Industry로 옮긴 파일)에 둔다.
3. `getStudentLevelOptions`는 Industry plugin이 옵션을 제공하게 하고, Core는 `string[]`만 받는다.
4. 전역 `StudentLevel` union은 더 이상 키우지 않고, 이동 후 barrel에서 deprecate.
5. `customerRowToStudent`의 `'바이엘 상'` 기본값은 피아노 전용으로 옮기거나 빈 문자열로 바꾼다. **P19-2에서 persist 의미를 바꾸지 말고 기본값 위치를 먼저 분리한다.**

이 union은 domain-neutral이 아니다.

---

## 2. Student 필드 분류

`Student`를 이번 단계에서 분해하지 않는다. 필드만 기록한다.

| 구분 | 필드 | 비고 |
| --- | --- | --- |
| **공통 identity/profile** | `id`, `studentNumber`, `name`, `gender`, `birthDate`, `phone`, `emergencyContact`, `address`, `joinDate`, `leaveDate`, `status`, `specialNotes`, `memo`, `avatarColor`, `userId`, `createdAt`, `updatedAt` | `core.customers` + metadata. `school`/`grade`는 plugin `showSchoolFields`로 숨김 |
| **보호자 (legacy)** | `parentId`, `parentName`, `parentPhone` | `@deprecated`. SoT는 `src/core/parent` `ParentStudentLink` |
| **교육/수강·로스터** | `teacherId`, `teacherName`, `classIds`, `level` | 반·강사 배정. `level`은 Industry 값 |
| **billing** | `billingMode`, `tuitionFee`, `paymentDay` | Capability/billing. `billingMode`는 piano metadata에도 복제 |
| **transport** | `usesShuttleService`, `pickupAddresses` | `PickupAddress`는 이미 `src/core/transport/types.ts` |
| **attendance** | `checkInPinSet` | PIN 해시가 아님. 플래그만. 쓰기는 attendance storage |
| **Industry 잔여** | `school`/`grade` 라벨, `level` 값 집합, `specialNotes` 용도(알레르기 vs 손가락) | 같은 필드, 업종별 의미 |

hydrate: `customerMappers.studentToCustomerRow`가 billing·transport·roster를 `core.customers.metadata`에 넣는다. piano는 `piano.customers` 컬럼 + metadata `billingMode`.

---

## 3. 전역 barrel 분류표

Migration 값:

* `invert` — 정의는 이미 있을 자리에 두고 barrel은 re-export만 (P19-2 우선)
* `move` — 정의를 소유 계층으로 옮기고 barrel은 compatibility re-export
* `split` — union/가방을 나누고 필드는 유지
* `keep` — 호출이 많아 P19-2에서 분해하지 않음
* `alias` — DB/기존 타입과 맞추기

### Core / Auth

| Type | Current | Target | Reason | Migration |
| --- | --- | --- | --- | --- |
| `UserRole` | `src/types` | Core / Auth. `MemberRole` (`database.types.ts`)과 동일 집합 | 조직 멤버 역할. 앱 복제본 | `alias` → `MemberRole` |
| `User` | `src/types` | Core / Auth (`getActiveUser` 미러) | 권한 SoT 아님. UI session shape | `move` `src/core/auth` |

### Core / Organization · Public · Join

| Type | Current | Target | Reason | Migration |
| --- | --- | --- | --- | --- |
| `PublicOrgInfo` | `src/types` | Core / public (`publicOrgService`가 이미 사용) | 공개 조직 검색 DTO | `invert` |
| `JoinRequestStatus` / `JoinRequestType` / `CustomerJoinRequest` | `src/types` | Core / customer (`customerJoinService`) | 고객 가입. 직원 `JoinRequest`(`joinRequestService.ts`)와 **다른 엔티티** | `invert` |
| `ConsultationSubmission` | `src/types` | Core / public | 공개 상담 신청 폼 | `invert` |

직원 가입 `JoinRequest` / `OrganizationJoinRequest`는 이미 Core에 있다. 전역 barrel에 넣지 말 것.

### Core / Students · Parents · Staff · Classes

| Type | Current | Target | Reason | Migration |
| --- | --- | --- | --- | --- |
| `StudentStatus` | `src/types` | Core / Students | `core.customers.status`와 맞는 재원 상태 | `keep` (Student와 같이) |
| `Student` | `src/types` | Core / Students. 필드는 §2 | 여러 업종이 같은 로컬 원생 행을 씀. **값 의미는 업종별** | `keep` — 분해 금지 |
| `StudentLevel` | `src/types` | Industry unions. 필드는 `string` | cross-industry union | `split` |
| `Parent` | `src/types` | Core / Parent. 링크는 기존 `ParentStudentLink` | 보호자 마스터. `studentIds`는 파생에 가깝다 | `keep` |
| `Teacher` / `TeacherPayType` | `src/types` | Staff는 Core. `payType`은 Capability / Billing | 한 인터페이스에 급여 정산이 붙어 있음 | `keep` + payroll 필드는 billing이 읽기 |
| `ClassItem` | `src/types` | Core roster / academy class (Capability roster 후보) | 반 마스터. `textbook`/`room`은 piano 냄새 | `keep` |
| `DayOfWeek` | `src/types` | Shared 또는 Core calendar primitive (`'월'…'일'`) | 순수 요일. `weekdayKo.ts`와 쌍 | `move` 작은 primitive |
| `StaffWorkWindow` | `src/types` | Capability / Scheduling (availability) | 주석도 Availability Capability | `move` |

### Capability / Attendance

| Type | Current | Target | Reason | Migration |
| --- | --- | --- | --- | --- |
| `AttendanceStatus` / `AttendanceRecord` | `src/types` | Capability / Attendance | 수업 출석(`piano.attendance` 계열). **`AttendanceSession`(PIN 체크인)과 다른 엔티티** — 기존 `capabilities/attendance/domain/types.ts`를 덮어쓰지 말 것 | `move` (이름 유지, 파일만) |
| `MakeupStatus` / `MakeupItem` / `MakeupScheduleInput` | `src/types` | Capability / Attendance (+ scheduling 슬롯) | 결석 보강. piano UI가 주 사용 | `move` |

### Capability / Billing

| Type | Current | Target | Reason | Migration |
| --- | --- | --- | --- | --- |
| `StudentBillingMode` + `STUDENT_BILLING_MODE_LABEL` + `normalizeBillingMode` | `src/types` (runtime 포함) | Capability / Billing. 헬퍼는 이미 `academy/utils/billingMode.ts` | 월회비 vs 회차권 | `move` runtime 먼저 |
| `PaymentMethod` | `src/types` | Capability / Billing. DB `PaymentMethod`와 거의 같음(`online`은 DB만) | commerce `SalePaymentMethod`와 별개 | `alias` 후 한곳으로 |
| `InvoiceStatus` / `TuitionInvoice` / `InvoiceExtraItem` / `TuitionPayment` | `src/types` | Capability / Billing | 월 청구·수납. finance 구현이 이미 `@/types`를 수입 | `move` |
| `StudentMonthlyBillingSummary` / `CombinedPaymentRequest` / `UnpaidInvoiceItem` / `StudentUnpaidSummary` | `src/types` | Capability / Billing | 수납 UI DTO | `move` |
| `ExpenseCategory` / `ExpenseItem` / `Expense` | `src/types` | Capability / Billing. `CoreExpenseCategory`가 `capabilities/billing/finance/types.ts`에 이미 있음 | `piano_tuning`은 Industry 값. 전역 union에 넣지 말 것 | `split` + 기존 finance 타입 재사용 |
| `TeacherPayType` | `src/types` | Capability / Billing (`teacherPayroll/types.ts` 존재) | 급여 정산 | `move` (Teacher 필드는 keep) |

### Capability / Booking · Scheduling

| Type | Current | Target | Reason | Migration |
| --- | --- | --- | --- | --- |
| `ScheduleStatus` / `ReservationStatus` / `CoreSchedule` / `BookableSchedule` / `Reservation` / `ReservationDetail` / `MyReservation` / `ReservationRequest` / `ScheduleFormData` | `src/types` 정의, `core/schedules/types.ts`가 re-export | Core / Schedules (현 인프라) + Capability scheduling/booking | `database.types`에도 동일 status union | **`invert` 최우선** — 정의를 Core로, barrel은 re-export |
| `PracticeRoomBooking` / `PracticeRoomBookingStatus` | `src/types` | Industry / Piano (연습실). 자원 예약 일반화는 Capability / Resources | 피아노 연습실 UX | `move` piano 또는 resources |

`Booking` / `SessionPass` / `SlotRecruitment` / `ServiceOffering`은 **이미** `src/core/types/schedule.ts`. 전역 barrel에 중복 정의하지 말 것. `ServiceOffering.careIntervalDays`, `Booking.skinCondition` 등은 Skin/Pilates 필드가 Core 스케줄 타입에 들어간 별도 부채다.

### Capability / Commerce (피아노 교재 vs Retail vs Skin)

| Type | Current | Target | Reason | Migration |
| --- | --- | --- | --- | --- |
| `Textbook` / `TextbookSale` / `TextbookPayment` / `TextbookInventoryTransaction` / `TextbookPaymentStatus` / `InventoryTransactionType` | `src/types` | Industry / Piano. 재고 SoT는 Capability / Commerce (`Product`/`Inventory`) | 피아노 교재 판매. retail `Product`와 다름 | `move` piano. commerce 타입을 복제하지 말 것 |
| `RetailProduct` | `src/types` | Industry / Skin | 이름만 generic. `AcademySettings.retailCatalog` + skin migrate | `move` skin |
| `Song` | `src/types` | Industry / Piano | 장르·난이도가 피아노 교재실용 | `move` piano |

Retail 상품 SoT는 `src/industries/retail/types/product.ts` → `@/capabilities/commerce` `Product`. `RetailProduct`를 재사용하지 않는다.

### Capability / Enrollment · Consultation

| Type | Current | Target | Reason | Migration |
| --- | --- | --- | --- | --- |
| `ConsultationType` / `Consultation` | `src/types` | Capability / Consultation (현재 manifest만). 당분간 academy/piano UI | 상담 기록. 공개 `ConsultationSubmission`과 다름 | `keep` → capability 구현 시 `move` |
| Enrollment 전용 타입 | barrel에 없음 | Capability / Enrollment (manifest) | 가입은 `CustomerJoinRequest`가 가깝다 | 새 타입은 capability에 |

### Industry / Piano

| Type | Current | Target | Reason | Migration |
| --- | --- | --- | --- | --- |
| `PracticeRecord` / `LessonRecord` / `PerformanceVideo` / `PerformanceVideoType` | `src/types` | Industry / Piano | 레슨·연습·연주 영상 | `move` |
| `AcademyEvent` / `EventParticipantSummary` | `src/types` | Industry / Piano (연주회·콩쿠르·조율). `type: 'tuning'` | 학원 달력이지만 값이 피아노 | `split` — 공통 달력 이벤트 vs piano recital |
| `src/types/education.ts` (`Curriculum*`, `WeeklyAssignment`, `Achievement`, `LearningReport`) | `education.ts` | Industry / Piano. sync는 `educationEntitySync` | 피아노 교육 품질 | `move` piano. **파일 재사용, 새로 만들지 말 것** |

### Industry / Daycare

Daycare care 타입은 **이미** `src/industries/daycare/care/types.ts` (`CareJournal`, `MedicationRequest`, `ChildLegalRecord`, …). 전역 barrel에 없음. 유지.

`StudentLevel`의 연령반만 전역에 잘못 들어가 있다 → §1.

### Industry / Skin · Retail · Pilates (가방 필드)

| Type | Current | Target | Reason | Migration |
| --- | --- | --- | --- | --- |
| `AcademyRoom` / `AcademyRoomKind` | `src/types` | 강의실·연습실 = academy/resources. `treatment` = Skin | `'treatment'`가 피부관리실 | `split` kind |
| `AcademySettings` | `src/types` | Core 사업장 설정 코어 + Industry/Capability 확장 | 한 JSON에 학원·Skin 카탈로그·필라테스 슬롯·리테일 포인트 | `keep` 객체, `split` 필드 문서화 |
| `AcademySettings.retailCatalog` / `skinRetail*` | 위 | Industry / Skin | Skin 이관 플래그 | 설정 확장 타입 |
| `AcademySettings.slotRecruitments` | 위 (import `SlotRecruitment`) | Capability / Booking + Pilates | 이미 Core schedule 타입 | 설정에서 분리 가능 |
| `AcademySettings.features.points` | 위 | Industry / Retail 또는 Capability / Commerce loyalty | `pointsSettings.ts`가 `@/types`를 수입 | 설정 확장 |
| `AcademySettings.depositEnabled` | 위 | Industry / Skin | 예약금 | 설정 확장 |

`AcademySettings`는 persist 키 `SETTINGS`의 로컬 shape이다. P19-2에서 객체를 쪼개면 hydrate가 깨진다. **필드 소유만 표시하고 객체는 keep.**

### Shared / generic

해당 없음에 가깝다. `DayOfWeek` 정도만 primitive 후보.  
`NotificationType` / `NotificationItem`은 출결·수납·연습이 섞인 **도메인 알림**이지 UI utility가 아니다 → Core / Notices (`core/notices/types.ts`가 이미 `@/types`에 의존).

| Type | Current | Target | Reason | Migration |
| --- | --- | --- | --- | --- |
| `NotificationType` / `NotificationItem` / `AppNotification` | `src/types` | Core / Notices | `core/notices/types.ts`가 Extract로 좁힘 | `invert` |

### Legacy compatibility / parent portal

| Type | Current | Target | Reason | Migration |
| --- | --- | --- | --- | --- |
| `ParentPortalTab` | `education.ts` | `src/modules/parent` (또는 Capability / Parent) | 포털 탭. 피아노 교육 파일에 있는 것이 잘못 | `move` parent. daycare/pilates/gym 홈이 수입 |

---

## 4. 이름만 generic인 타입

| Type | 보이는 이름 | 실제 종속 | 근거 |
| --- | --- | --- | --- |
| `RetailProduct` | 소매 상품 | **Skin** 카탈로그 | `retailCatalog`, `skinRetailCoreMigratedAt*`. Retail Industry는 `Product` |
| `AcademyRoom` + `treatment` | 학원 방 | Skin 관리실 + piano 연습실 | `academyRooms.ts`, skin 예약 |
| `AcademySettings` | 학원 설정 | 전 업종 JSON 가방 | 포인트·예약금·슬롯·Skin 이관 |
| `StudentLevel` | 원생 레벨 | Piano + Gym + Daycare | §1 |
| `Song` | 곡 | Piano 자료실 | 장르/난이도/교재 |
| `Textbook*` | 교재 | Piano commerce 레거시 | Core Product와 이중 |
| `AcademyEvent` | 학원 행사 | Piano 연주회/조율 | `concert`, `tuning` |
| `ExpenseCategory.piano_tuning` | 지출 분류 | Piano | finance `CoreExpenseCategory`와 불일치 |
| `ClassItem.textbook` / `room` | 반 | Piano 교실 가정 | 문자열 방 이름 |
| `ServiceOffering` / `Booking` (Core schedule) | 예약 | Pilates 카테고리 + Skin 차트 | barrel 밖이지만 같은 패턴 |

---

## 5. 이미 있는 domain type source (재사용)

새 파일을 만들기 전에 여기부터 쓴다.

| 영역 | 경로 | 비고 |
| --- | --- | --- |
| DB enum | `src/lib/supabase/database.types.ts` | `MemberRole`, `ScheduleStatus`, `ReservationStatus`, `PaymentMethod` |
| Parent / guardian | `src/core/parent/types.ts` | `ParentStudentLink`, `GuardianRelationship` |
| Transport | `src/core/transport/types.ts` | `PickupAddress`, shuttle |
| Schedule booking (행위) | `src/core/types/schedule.ts` | `Booking`, `SessionPass`, `SlotRecruitment` |
| Schedule/Reservation (잘못된 방향) | `src/core/schedules/types.ts` | `@/types` re-export → invert 대상 |
| Industry catalog | `src/core/industry/types.ts` | `IndustryType` |
| Notices | `src/core/notices/types.ts` | `@/types` `NotificationType`에 의존 |
| Staff join | `src/core/organizations/services/joinRequestService.ts` | `JoinRequest` ≠ `CustomerJoinRequest` |
| Attendance PIN/session | `src/capabilities/attendance/domain/types.ts` | `AttendanceRecord`와 다름 |
| Billing finance | `src/capabilities/billing/finance/types.ts` | `FinanceExpense`, `CoreExpenseCategory` |
| Teacher payroll | `src/capabilities/billing/finance/teacherPayroll/types.ts` | |
| Commerce | `src/capabilities/commerce/{catalog,stock,saleLedger,loyalty}/types.ts` | `Product`, `Sale`, `Inventory` |
| Daycare care | `src/industries/daycare/care/types.ts` | |
| Retail product | `src/industries/retail/types/product.ts` | commerce re-export |
| Bath | `src/industries/bath/types/*` | |
| Piano education | `src/types/education.ts` | 이동만, 복제 금지 |
| Auth signup | `src/core/auth/types/signup.ts` | |
| Student bulk import | `src/core/students/bulkImport/types.ts` | |

---

## 6. Anti-pattern (발견)

1. **전역 barrel이 사실상 domain SoT** — 새 feature가 `@/types`에 타입을 추가하는 습관.
2. **Core가 barrel을 재수출** — `core/schedules/types.ts` → `@/types`.
3. **하나의 union에 여러 Industry 값** — `StudentLevel`, `ExpenseCategory`의 `piano_tuning`.
4. **이름만 공통, 필드는 업종 가방** — `AcademySettings`, `RetailProduct`.
5. **같은 개념 이중 정의** — `UserRole`/`MemberRole`, `PaymentMethod`(app/DB/commerce), `JoinRequest` vs `CustomerJoinRequest`, `AttendanceRecord` vs `AttendanceSession`, `Textbook` vs `Product`.
6. **타입 파일의 runtime** — `normalizeBillingMode`.
7. **Core가 Industry 기본값을 가정** — `customerRowToStudent` → `'바이엘 상'`.
8. **union 밖 값 캐스팅** — `'바이엘'`, `'beginner'`.
9. **`education.ts`에 학부모 탭** — Daycare/Pilates/Gym 포털이 피아노 교육 파일을 수입.
10. **`src/types`가 Capability/Industry 구현을 import하지는 않음** — 계층 위반은 아직 없음. 반대로 Core/Capability가 barrel에 매여 있다.

`src/types/index.ts` → Capability/Industry implementation import: **없음** (P19-1 기준).

---

## 7. P19-2에서 옮길 구체 목록

호출이 적고 소유가 분명한 것부터. **Student / Teacher / ClassItem / AcademySettings 객체는 옮기지 않는다.**

### 우선 (invert / 기존 파일 재사용)

1. `ScheduleStatus`, `ReservationStatus`, `CoreSchedule`, `BookableSchedule`, `Reservation`, `ReservationDetail`, `MyReservation`, `ReservationRequest`, `ScheduleFormData` — 정의를 `src/core/schedules`로, barrel은 re-export.
2. `PublicOrgInfo`, `ConsultationSubmission` — `src/core/public`.
3. `CustomerJoinRequest`, `JoinRequestStatus`, `JoinRequestType` — `src/core/customer`.
4. `UserRole` — `MemberRole` alias (`src/core/auth` 또는 `database.types`).
5. `NotificationType`, `NotificationItem`, `AppNotification` — 정의를 `src/core/notices/types.ts`로 invert.
6. `normalizeBillingMode` / `STUDENT_BILLING_MODE_LABEL` — billing 쪽으로 옮기고 barrel은 re-export.

### 다음 (split / Industry)

7. `StudentLevel` → Industry unions + `Student.level: string`. 옵션은 plugin/`levelOptions`.
8. `RetailProduct` → `src/industries/skin` (기존 migrate 파일이 이미 사용).
9. `src/types/education.ts` 피아노 타입 → `src/industries/piano`. `ParentPortalTab` → `src/modules/parent`.
10. `Song`, `PracticeRecord`, `LessonRecord`, `PerformanceVideo*` → piano.
11. `Textbook*` / `TextbookInventoryTransaction` → piano (commerce `Product`와 합치지 말 것).

### P19-3 동결 분류 (`src/types/index.ts`)

| 구분 | 타입 | 상태 |
| --- | --- | --- |
| **A. 계속 global compatibility** | `StudentLevel` (`string` alias), `Student`/`Parent`/`Teacher`/`ClassItem`/`StudentStatus` | local snapshot. 신규 값 union 금지 |
| **B. 향후 이동 legacy** | A와 동일 객체 + `src/types/education.ts` | 호출 면이 넓어 객체 분해 보류 |
| **C. 지금 삭제** | 없음 | persist 호출이 남아 있음 |
| **D. 소유 계층 re-export** | Billing, Attendance, Schedules, Notices, Join, Public, Lessons, Commerce textbook, Consultation, PracticeRoomBooking (`@/core/resources`), AcademyEvent (`@/core/events`) | 정의는 owner. barrel은 `export type` |

검사:

* `scripts/types-barrel-freeze.mjs` — 신규 local 정의 / Industry import / StudentLevel union
* `scripts/types-barrel-legacy-imports.mjs` — 기존 `@/types` caller inventory. 신규 계층 파일 import 금지
* `src/types/typesOwnership.test.ts` — Billing/Attendance가 barrel에 정의되지 않음

### 보류 (이후)

* `Student`, `Parent`, `Teacher`, `ClassItem`, `AcademySettings` 분해
* 기존 `@/types` inventory 점진 축소
* persist 기본값 `'바이엘 상'` 의미 변경

### P19-2에서 하지 말 것

* barrel 삭제
* Student 인터페이스 분해
* 새 전역 union 추가
* 이미 있는 `care/types`, commerce `Product`, `PickupAddress` 복제

---

## 8. 아키텍처 원칙 (이후 코드)

| 규칙 | 내용 |
| --- | --- |
| Barrel ≠ SoT | **새로운 business/domain type은 `src/types/index.ts`에 추가하지 않는다** |
| 소유 위치 | Core / Capability / Industry / Shared 중 실제 의미 있는 곳 |
| Compatibility | 기존 import를 깨지 않으려면 소유 파일에서 export하고 barrel은 `export type { X } from '…'` |
| Cross-industry union 금지 | 새 `StudentLevel` 패턴 금지. 저장은 `string`, 옵션은 Industry |
| Shared 승격 금지 | 여러 곳에서 import해도 Shared가 아님 |
| 기존 파일 재사용 | §5 |
| Capability import | `src/types`가 capability/industry **구현**을 import하면 안 됨 (지금은 없음, 유지) |

신규 Capability를 추가할 때 `src/types/index.ts`를 수정할 필요는 없다.  
신규 Industry를 추가할 때 전역 union에 업종 값을 더하지 않는다.
