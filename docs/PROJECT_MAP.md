# Moa Project Map

Cursor가 파일 위치를 빠르게 찾기 위한 지도다. 업무 개념은 [DOMAIN_MAP.md](./DOMAIN_MAP.md), 데이터 이동은 [DATA_FLOW.md](./DATA_FLOW.md), 개발 규칙은 [MOA_DEVELOPMENT_STANDARD.md](./MOA_DEVELOPMENT_STANDARD.md).

---

## 1. 프로젝트 개요

| 항목 | 실제 값 |
| --- | --- |
| 앱 | 멀티테넌트 업종 SaaS (`package.json` name: `moa-academy`) |
| UI | React 19 + Vite 6 + Tailwind 4 + react-router-dom 6 |
| 백엔드 | Supabase (Postgres, Auth, RLS, RPC) |
| 모바일 | Capacitor 7 (Android/iOS) + PWA |
| 별칭 | `@` → `src/` (`vite.config.ts`) |
| 타입 검사 | `tsc --noEmit` + `scripts/check-architecture-dependencies.mjs` + `scripts/check-database-types.mjs` |
| 단위 테스트 | `tsx path/to/file.test.ts` (`package.json` `test:*`) |
| E2E | Playwright (`e2e/`, `playwright.config.ts`) |

업종 앱 7개 + 학부모 포털 1개. 전용 모듈이 없는 업종은 `GenericIndustryShell`.

---

## 2. Directory Tree

실제 존재하는 상위 경로만.

```text
src/
  main.tsx
  App.tsx
  SupabaseAppGate.tsx
  StorageHydrator.tsx
  SupabaseRoleSync.tsx
  core/                 공통 비즈니스
  modules/              업종·학부모 포털
  shared/               UI · layout · 순수 유틸
  context/              AppContext
  hooks/                공용 React hooks
  services/             StorageService · sync adapter
  lib/supabase/         client · generated types
  types/                앱 도메인 타입
  utils/                formatters 등
  components/piano/     레거시 barrel (신규 사용 금지)
supabase/migrations/
e2e/
scripts/
docs/
```

`src/modules/` 실제 디렉터리: `piano`, `pilates`, `gym`, `daycare`, `skin`, `retail`, `bath`, `parent`.

---

## 3. Architecture Map

**현재 구현 의존 (주류):**

```text
UI (Module *AppContent / Core views)
  → StorageService (src/services/storage.ts)
  → SupabaseAdapter + hydrate/sync (src/services/adapters/)
  → getCoreClient() / industry client
  → PostgreSQL (RLS / RPC)
```

**이행·신규 권장:**

```text
UI → Hook → domain Service (src/core/<domain> 또는 modules/<x>/services)
  → getCoreClient() / RPC
  → PostgreSQL
```

**파일럿 (프로덕션 write path 아님):**

```text
executeCommand (src/core/application/commandExecutor.ts)
  → reservation.confirm 만 등록 (테스트에서만 호출)
```

의존 방향:

| From | To | 허용 |
| --- | --- | --- |
| Module | Core, Shared, services, lib | 예 |
| Core | Shared, services, lib | 예 |
| Core | Module | 아니오. 검사: `scripts/check-architecture-dependencies.mjs` |
| Module | 다른 Module | 현재 존재. 신규는 억제 |
| Shared | Core/Context | 레이아웃(Header)은 이미 사용. 업종 비즈니스는 금지 |

Core → Module allowlist: `src/core/industry/registry.ts`, `IndustryAppRouter.tsx`, academy 학생/학부모 일부, `public/ReservationModal.tsx`, `schedules/domainRoles.ts`.

---

## 4. Core Map

`src/core/` 실제 디렉터리. 역할만.

| 영역 | Path | 역할 |
| --- | --- | --- |
| Auth | `auth/` | `AuthProvider`, `AuthPage`, 탭 권한, nav |
| Organizations | `organizations/` | Provider, Selector, Role switch, membership |
| Locations | `locations/` | 지점 catalog, 선택, location-aware |
| Authorization | `authorization/` | Permission + Scope (`evaluatePermission`) |
| Application | `application/` | RequestContext, Command Executor (pilot) |
| Industry | `industry/` | plugin registry, `IndustryAppRouter` |
| Academy UI | `academy/` | 학생/학부모/수납 등 학원형 화면 |
| Students / Customer / Parent / Staff | `students/`, `customer/`, `parent/`, `staff/` | 사람 도메인 |
| Schedules | `schedules/` | 일정, 예약, 이용권 연동 |
| Attendance | `attendance/` | 출결, 키오스크 |
| Finance | `finance/` | 수납, 청구, 급여 |
| Commerce | `commerce/`, `sales/`, `product/`, `inventory/`, `loyalty/` | 판매·재고·포인트 |
| Resources / Sessions / Capacity / Waitlist | `resources/`, `sessions/`, `capacity/`, `waitlist/` | 예약 자원 |
| Availability / Operations | `availability/`, `operations/` | 가능 시간, 점검 업무 |
| Notices / Transport / Push | `notices/`, `transport/`, `push/` | 알림·셔틀·푸시 |
| Public / Legal / Platform | `public/`, `legal/`, `platform/`, `platformSubscription/` | 공개 랜딩, 구독 |
| Persistence infra | `storage/`, `audit/`, `idempotency/`, `outbox/`, `metadata/` | 정책·감사·멱등·아웃박스 |
| Domain machine | `domain/` | 범용 state machine |
| Dashboard | `dashboard/` | `IndustryDashboardShell` |
| Account(s) | `account/`, `accounts/` | 계정 네비·로그인 부트스트랩 |

클라이언트: `src/lib/supabase/client.ts` (`getCoreClient`), `pianoClient.ts`, `bathClient.ts`, `platformClient.ts`.

---

## 5. Module Map

업종 앱 공통 파일: `plugin.ts`, `*AppContent.tsx`, `config/nav.tsx`, `layout/*Sidebar.tsx`, `layout/*BottomNav.tsx`.

등록: `src/core/industry/registry.ts` `INDUSTRY_PLUGINS`, 화면: `IndustryAppRouter.tsx` `APP_BY_INDUSTRY`.

### piano — `src/modules/piano`

| | |
| --- | --- |
| Purpose | 피아노 학원 운영 (레슨·교재·진도·연습실·발표회) |
| Main Screens | `PianoAppContent.tsx`; `components/` attendance, consultations, dashboard, education, expenses, lessons, makeup, practice, practiceRooms, recitals, resources, schedule, songProgress, textbooks |
| Main Services | `services/` lesson/homework/pass, recital, textbook sale/payment/stock |
| Main Data | `piano.*` + core customers/schedules/finance. Storage keys `piano_app_*` |

### pilates — `src/modules/pilates`

| | |
| --- | --- |
| Purpose | 필라테스 예약·이용권·회원 |
| Main Screens | `PilatesAppContent.tsx`; bookings, dashboard, instructors, members, passes, services, hubs |
| Main Services | `services/merchandise/` |
| Main Data | core schedules / session_passes / customers. 전용 schema 없음 |

### gym — `src/modules/gym`

| | |
| --- | --- |
| Purpose | 헬스형 셸 (수업 일정·출결·수납·셔틀). 얇은 모듈 |
| Main Screens | `GymAppContent.tsx`; `components/dashboard/GymDashboardView.tsx`, `components/students/StudentListView.tsx` |
| Main Services | 모듈 전용 services 폴더 없음. Core academy/schedule 사용 |
| Main Data | core. plugin `usesClassBasedSchedule` |

### daycare — `src/modules/daycare`

| | |
| --- | --- |
| Purpose | 어린이집 운영 + 보육 일지/투약/하원 |
| Main Screens | `DaycareAppContent.tsx`; dashboard, students, `DaycareCareHubView`; `care/` 일지·투약·하원·안전 등 |
| Main Services | `care/careStorage.ts` (별도 services/ 없음) |
| Main Data | `core.care_*` |

### skin — `src/modules/skin` (plugin id `skin_clinic`)

| | |
| --- | --- |
| Purpose | 피부과/클리닉 셸 + 시술 차트·리테일 |
| Main Screens | `SkinAppContent.tsx`; dashboard, charts, retail, settings, `SkinHubs.tsx` |
| Main Services | `services/skinRetailService.ts` 등. 예약 허브는 pilates 화면을 import |
| Main Data | core. 전용 schema 없음 |

### retail — `src/modules/retail`

| | |
| --- | --- |
| Purpose | 유통 POS · 상품 · 재고 · 매출 |
| Main Screens | `RetailAppContent.tsx`; sales, products, inventory, customers, revenue, settings |
| Main Services | `services/` product, inventory, sale, saleReturn, revenue |
| Main Data | `core.products`, `inventory`, `sales`, `point_*` |

### bath — `src/modules/bath` (plugin id `sauna_jjimjilbang`)

| | |
| --- | --- |
| Purpose | 목욕탕 객실·방문·예약 |
| Main Screens | `BathAppContent.tsx`; `components/BathPlaceholderView.tsx` |
| Main Services | `services/` room, visit, booking, offeredService |
| Main Data | `bath.rooms`, `visits`, `bookings`, `services` |

### parent — `src/modules/parent`

| | |
| --- | --- |
| Purpose | 학부모 포털 (plugin 아님. Gate에서 분기) |
| Main Screens | `ParentShell.tsx`; `views/` home/bookings/tuition/care 등 |
| Main Services | 모듈 services 폴더 없음. `src/core/parent` 사용 |
| Main Data | membership + parent_student_links + 업종별 조회 |

고객 포털은 모듈이 아님: `src/core/customer/CustomerShell`.

---

## 6. Shared Map

`src/shared/`

| 파일 | 용도 |
| --- | --- |
| `components/layout/ModuleAppShell.tsx` | Header + Sidebar + main + BottomNav + overlay |
| `components/layout/Header.tsx` | 사업장/지점/역할 표시 |
| `components/layout/ModuleSidebar.tsx` | 데스크탑 사이드바 |
| `components/layout/ModuleBottomNav.tsx` | 모바일 하단 네비 + 더보기 |
| `components/layout/moduleTheme.ts` | 업종 테마 토큰 |
| `components/ui/Modal.tsx` | 공통 모달 (view/form, dirty confirm) |
| `components/ui/FormField.tsx` | 필드 + 인라인 오류 |
| `components/ui/PageHeader.tsx` | 관리 페이지 제목 |
| `components/ui/EmptyState.tsx` | 0건 |
| `components/ui/Skeleton.tsx` | `Skeleton`, `PageListSkeleton`, `InlineBusy` |
| `components/ConfirmDialog.tsx` | 확인. `AppContext.openConfirmDialog` |
| `components/ToastContainer.tsx` | 토스트 |
| `components/LoadingScreen.tsx` | 앱/포털 첫 로딩 |
| `components/AppErrorBoundary.tsx` | 업무 화면 crash |
| `components/WorkStatusBanner.tsx` | 결제/등록 등 persistent 결과 |
| `feedback/feedbackPolicy.ts` | toast / inline / status |
| `utils/localDate.ts` | 영업일·로컬 날짜 |
| `styles/density.ts` | 페이지 padding/stack |

공개 랜딩 오류: `src/core/public/PublicRouteErrorBoundary.tsx` (shared 아님).

Import: `@/shared/components` barrel 우선.

---

## 7. Context / State Map

| 위치 | 담당 |
| --- | --- |
| `src/core/auth/AuthProvider.tsx` | Supabase session |
| `src/core/organizations/OrganizationProvider.tsx` | membership, 선택 사업장, role, portalMode, location |
| `src/context/AppContext.tsx` | 탭, 선택 학생, toast, confirm, workStatus, refreshKey |
| `src/hooks/useStorageRefresh.ts` | Storage 키 구독 화면 갱신 |
| `src/hooks/usePermissions.ts` (`core/auth`) | 탭/permission UX |
| `src/hooks/useStaffScope.ts`, `useStaffGrants.ts` | 스태프 범위 |
| `src/hooks/useStudentNavigation.ts` | 학생 상세 이동 |
| `src/hooks/useMediaQuery.ts` | 뷰포트 |

도메인 목록(students/bookings)은 AppContext에 두지 않는다.

---

## 8. Entry Point Map

```text
src/main.tsx
  → App.tsx
      legal hash? → LegalPageView
      !isSupabaseConfigured → SupabaseRequiredScreen
      BrowserRouter
        AuthProvider
          OrganizationProvider
            AppProvider
              MobileBootstrap
              Routes
                /c/:code → PublicRouteErrorBoundary + PublicOrgLanding
                /signup/customer → CustomerSignUpFlow
                /attendance-kiosk → AttendanceKioskPage
                /* → AppErrorBoundary + SupabaseAppGate
```

`SupabaseAppGate.tsx` 분기:

1. auth/org 첫 로딩 → `LoadingScreen`
2. 비로그인 → `AuthPage`
3. 학부모 전용/포털 → `ParentShell`
4. 수강생 전용/포털 → `CustomerShell`
5. owner 차단 → `OwnerOperationStoppedView`
6. 사업장 없음 → `OrganizationSelector`
7. 그 외 → `StorageHydrator` + `IndustryAppRouter`

`IndustryAppRouter`: `currentRole === 'parent'` → ParentShell. 그 외 `APP_BY_INDUSTRY` 또는 `GenericIndustryShell`.
