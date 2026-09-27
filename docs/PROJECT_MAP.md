# Moa Project Map

Cursor가 파일 위치를 빠르게 찾기 위한 지도다. 업무 개념은 [DOMAIN_MAP.md](./DOMAIN_MAP.md), 데이터 이동은 [DATA_FLOW.md](./DATA_FLOW.md), 개발 규칙은 [MOA_DEVELOPMENT_STANDARD.md](./MOA_DEVELOPMENT_STANDARD.md), 계층은 [ARCHITECTURE.md](./ARCHITECTURE.md).

용어는 네 문서와 같다.

| 용어 | 의미 |
| --- | --- |
| **Core** | 업종 독립 공통 기반 |
| **Capability** | 여러 업종이 선택하는 업무 기능 |
| **Industry** | 특정 업종의 화면·규칙·조합 |
| **Composition** | definition / manifest / registry / router / loader 조립 |
| **Legacy aggregation layer** | 여러 책임이 한 폴더에 섞인 이행 중 묶음 |
| **Infrastructure** | persist, hydrate, sync, audit, idempotency, outbox |

현재 구현을 미래 구조처럼 적지 않는다. 각 영역에 **현재 역할**과 **장기 이동 방향**을 같이 적는다.

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
  core/                 Core + legacy aggregation + capability shim
  capabilities/         Capability (일부 구현, 일부 manifest)
  industries/           Industry 런타임 SoT
  app/industry/         Composition 런타임 SoT
  modules/              parent 포털 + 업종 폴더 잔여 복제
  shared/               Shared
  context/              AppContext
  hooks/                공용 React hooks
  services/             Infrastructure (StorageService · sync). 아직 mega-facade
  lib/supabase/         client · generated types
  types/                앱 도메인 타입
  utils/                formatters 등
  components/piano/     레거시 barrel (신규 사용 금지)
supabase/migrations/
e2e/
scripts/
docs/
```

### [현재] vs [장기 목표]

| 경로 | 현재 역할 | 장기 이동 방향 |
| --- | --- | --- |
| `src/core` | Core foundation. `academy`는 **legacy aggregation layer**. attendance/finance/commerce 등은 Capability 구현 또는 compat shim | 업종 독립 기반만 남김 |
| `src/core/industry` | 카탈로그·`definitions`(Core foundation) + pluginHost. Industry 구현 아님. Generic shell은 `src/app/industry` | 카탈로그는 Core. 조립은 `src/app` |
| `src/core/academy` | 학생/학부모/반/시간표/상담/수납 UI가 섞인 **legacy aggregation layer**. 신규 기본 위치 아님 | 화면은 Industry 또는 Capability UI로 분산 |
| `src/capabilities` | attendance, scheduling, booking, billing, commerce 등 구현 또는 manifest | `src/capabilities/<id>`가 선택 업무 SoT |
| `src/industries` | piano, pilates, gym, daycare, skin, retail, bath — 런타임 Industry | 유지 |
| `src/app/industry` | `IndustryAppRouter`, `industryModules`, loader — 런타임 Composition | `src/app` |
| `src/modules` | `parent`는 라이브 포털. 업종 폴더는 Industry 복제(레거시) | parent만 유지. 업종 복제 제거 |
| `src/shared` | UI / layout / utility | 유지 |
| `src/services` | StorageService + adapters. **제거되지 않음** | `services/infrastructure` + capability `*Storage` facade |

`src/modules/` 실제 디렉터리: `piano`, `pilates`, `gym`, `daycare`, `skin`, `retail`, `bath`, `parent`.  
런타임 조립은 `src/industries/` + `src/app/industry`다. modules 업종 폴더를 라이브 SoT로 쓰지 않는다.

---

## 3. Architecture Map

### [현재] 주류 CRUD

```text
UI (Industry *AppContent / academy views / parent)
  → StorageService (src/services/storage.ts)
  → SupabaseAdapter + hydrate/sync (src/services/adapters/)
  → getCoreClient() / industry client
  → PostgreSQL (RLS / RPC)
```

### [현재] 이행 중

```text
UI → StudentService | TuitionService | LessonService | ScheduleService
   → StorageService → adapters → PostgreSQL
```

### [권장 표준] 신규

```text
UI → Hook → domain Service
  → getCoreClient() / RPC
  → PostgreSQL
```

### [장기 목표] (전 경로가 아님)

```text
Industry UI
  → Capability Application/Service
  → Core / Repository / RPC
  → PostgreSQL
```

StorageService는 장기적으로 capability별 persistence facade로 나뉠 수 있다. **지금 제거한 상태가 아니다.**

### 파일럿 (프로덕션 write path 아님)

```text
executeCommand (src/core/application/commandExecutor.ts)
  → reservation.confirm 만 등록 (테스트에서만 호출)
```

의존 방향 (권장):

```text
Composition → Industry → Capability → Core
```

| From | To | 허용 |
| --- | --- | --- |
| Industry | Core, Capability, Shared, services, lib | 예 |
| Capability | Core, Shared, services, lib | 예 |
| Composition | Industry, Capability, Core | 예 |
| Core | Shared, services, lib | 예 |
| Core | Industry / modules / Composition / Capability | 아니오. 검사: `scripts/check-architecture-dependencies.mjs` (LEGACY allowlist) |
| Capability | Industry / modules / Composition | 아니오 |
| Industry | 다른 Industry | 현재 존재. 신규는 억제 |
| Shared | Core/Context | 레이아웃(Header)은 이미 사용. 업종 비즈니스는 금지 |

LEGACY allowlist는 `scripts/check-architecture-dependencies.mjs`의 `LEGACY_ALLOWLIST`가 SoT다. 문서에 파일 목록을 복제하지 않는다.

---

## 4. Core Map

`src/core/` 실제 디렉터리. **현재 역할**과 **장기 이동 방향**.

`core/academy`는 하나의 domain이 아니다. 여러 responsibility가 섞인 **legacy aggregation layer**다.

| 영역 | Path | 계층 | 현재 역할 | 장기 이동 방향 |
| --- | --- | --- | --- | --- |
| Auth | `auth/` | Core foundation | `AuthProvider`, 탭 권한, nav | Core |
| Organizations | `organizations/` | Core foundation | Provider, Selector, Role switch, membership | Core |
| Locations | `locations/` | Core foundation | 지점 catalog, 선택 | Core |
| Authorization | `authorization/` | Core foundation | Permission + Scope | Core |
| Application | `application/` | Core foundation | RequestContext, Command Executor (pilot) | Core |
| Industry catalog | `industry/` | Composition (일부) | definitions, catalog, pluginHost. Generic shell은 `src/app/industry` | 정의는 Core, 조립은 `src/app` |
| Academy UI | `academy/` | Legacy aggregation layer | 학생/학부모/수납/상담/시간표 화면이 한곳에 있음 | 신규 위치 아님. UI는 Industry 또는 Capability |
| Students / Customer / Parent / Staff | `students/`, `customer/`, `parent/`, `staff/` | Core foundation (+ parent Capability 후보) | 사람 도메인 | 마스터는 Core. parent 포털 업무는 Capability |
| Schedules | `schedules/` | Capability 후보 (scheduling) | 일정, 예약, 이용권 연동. 일부 shim | `capabilities/scheduling` |
| Attendance | `attendance/` | Capability (compat shim) | `@/capabilities/attendance` re-export | shim 축소 |
| Finance | `finance/` | Capability 후보 (billing) | 수납, 청구, 급여. 일부 shim | `capabilities/billing` |
| Commerce | `commerce/`, `sales/`, `product/`, `inventory/`, `loyalty/` | Capability 후보 (commerce) | 판매·재고·포인트. 일부 shim | `capabilities/commerce` |
| Resources / Sessions / Capacity / Waitlist | `resources/`, `sessions/`, `capacity/`, `waitlist/` | Capability 후보 | 예약 자원 | `capabilities/resources`, `booking` |
| Availability / Operations | `availability/`, `operations/` | Capability 후보 (scheduling) | 가능 시간, 점검 업무 | Capability |
| Notices / Transport / Push | `notices/`, `transport/`, `push/` | Core / Capability 후보 | 알림·셔틀·푸시 | transport → Capability |
| Public / Legal / Platform | `public/`, `legal/`, `platform/`, `platformSubscription/` | Core foundation | 공개 랜딩, 구독 | Core |
| Persistence infra | `storage/`, `audit/`, `idempotency/`, `outbox/`, `metadata/` | Infrastructure | 정책·감사·멱등·아웃박스 | Infrastructure |
| Domain machine | `domain/` | Core foundation | 범용 state machine | Core |
| Dashboard | `dashboard/` | Composition/Shared 경계 | `IndustryDashboardShell` | Composition 또는 Shared |
| Account(s) | `account/`, `accounts/` | Core foundation | 계정 네비·로그인 부트스트랩 | Core |

클라이언트: `src/lib/supabase/client.ts` (`getCoreClient`), `pianoClient.ts`, `bathClient.ts`, `platformClient.ts`.

---

## 5. Capability Map

`src/capabilities/` — 현재 패키지. 구현 깊이는 id마다 다르다.

| id | 현재 | 장기 |
| --- | --- | --- |
| `attendance` | domain / application / ui / infrastructure. Core는 shim | Capability |
| `scheduling` | manifest + 이전된 구현 | Capability |
| `booking` | manifest + 이전된 구현 | Capability |
| `billing` | finance 구현 + Core shim | Capability |
| `commerce` | 판매·재고·포인트 facade | Capability |
| `resources` | manifest 중심 | Capability |
| `parent` | manifest 중심. 포털 UI는 `src/modules/parent` | Capability + 포털 모듈 |
| `transport` | manifest 중심 | Capability |
| `roster` | manifest | Capability |
| `enrollment` | manifest | Capability |
| `consultation` | manifest. UI는 아직 academy/piano | Capability |

신규 코드는 `@/capabilities/<id>`를 쓴다. `@/core/attendance` 등 shim을 신규 SoT로 쓰지 않는다.

---

## 6. Industry Map

업종 앱 공통 파일: `plugin.ts`, `*AppContent.tsx`, `config/nav.tsx`, `layout/*Sidebar.tsx`, `layout/*BottomNav.tsx`.

**현재 등록 — 역할이 파일마다 다르다.**

| 파일 | 계층 | 역할 |
| --- | --- | --- |
| `src/core/industry/definitions.ts` | Core | Industry catalog/metadata |
| `src/core/industry/catalog.ts` | Core | 조회·alias·generic-shell |
| `src/industries/<id>/plugin.ts` | Industry | 선언(탭·테마·sync). 구현/UI |
| `src/app/industry/industryCapabilityMap.ts` | Composition | runtime capability 조합 **SoT** |
| `src/app/industry/capabilityNavigation.ts` | Composition | 탭 ↔ capability 규칙 |
| `src/app/industry/industryModules.tsx` | Composition | App/UI 등록. `APP_BY_INDUSTRY` 파생 |
| `src/app/industry/IndustryAppRouter.tsx` | Composition | 셸 선택 |
| `src/app/industry/loadIndustryModules.ts` | Composition | plugin 설치 |

`INDUSTRY_PLUGINS` 손글씨 맵을 다시 만들지 않는다. capability 조합 맵도 `industryCapabilityMap.ts` 하나다.

새 Industry: Core catalog → Capability 선택 → Industry plugin → Composition runtime map → App/UI 등록 → contract/regression.

### Industry sync (현재)

```text
industryModules.tsx  (plugin manifest eager import)
  → industries/<id>/plugin.ts  (./sync/register*Sync static import)
  → registerIndustrySyncCapability
  → industrySyncRegistry (계약·Map만)

hydrate:  supabaseAdapter → resolveIndustryHydrateCapabilities
          = plugin.syncCapabilities ∩ 등록된 Map
persist:  supabaseAdapter → persistRegisteredCapabilities
          = 등록된 capability 중 persistKeys에 key가 있는 것만
```

- Adapter는 업종 이름을 직접 분기하지 않는다.
- Registry는 concrete implementation을 소유하지 않는다. 업종별 import·register 호출 없음.
- Industry가 자기 sync capability를 등록한다.
- manifest가 사용 capability를 선언한다.
- `industryModules`는 plugin을 eager import하므로 register side-effect가 App 로드 때 실행된다. AppContent `loadApp`은 lazy이며 등록 경로가 아니다.
- 새 Industry 추가 시 중앙 sync registry(`industrySyncRegistry.ts`)를 수정하지 않는다. 필요한 것: `register*Sync.ts` + plugin `syncCapabilities`.

현재 등록: piano(`piano`, `education`), daycare(`daycare`). bath(`sauna_jjimjilbang`)는 sync 없음.

### piano — `src/industries/piano`

| | |
| --- | --- |
| Purpose | 피아노 학원 운영 (레슨·교재·진도·연습실·발표회) |
| Main Screens | `PianoAppContent.tsx`; `components/` attendance, consultations, dashboard, education, expenses, lessons, makeup, practice, practiceRooms, recitals, resources, schedule, songProgress, textbooks |
| Main Services | `services/` lesson/homework/pass, recital, textbook sale/payment/stock |
| Main Data | `piano.*` + core customers/schedules/finance. Storage keys `piano_app_*` |
| 장기 | Industry |

### pilates — `src/industries/pilates`

| | |
| --- | --- |
| Purpose | 필라테스 예약·이용권·회원 |
| Main Screens | `PilatesAppContent.tsx`; bookings, dashboard, instructors, members, passes, services, hubs |
| Main Services | `services/merchandise/` |
| Main Data | core schedules / session_passes / customers. 전용 schema 없음 |
| 장기 | Industry |

### gym — `src/industries/gym`

| | |
| --- | --- |
| Purpose | 헬스형 셸 (수업 일정·출결·수납·셔틀). 얇은 모듈 |
| Main Screens | `GymAppContent.tsx`; `components/dashboard/GymDashboardView.tsx`, `components/students/StudentListView.tsx` |
| Main Services | 모듈 전용 services 폴더 없음. Core academy/schedule 사용 |
| Main Data | core. plugin `usesClassBasedSchedule` |
| 장기 | Industry |

### daycare — `src/industries/daycare`

| | |
| --- | --- |
| Purpose | 어린이집 운영 + 보육 일지/투약/하원 |
| Main Screens | `DaycareAppContent.tsx`; dashboard, students, `DaycareCareHubView`; `care/` 일지·투약·하원·안전 등 |
| Main Services | `care/careStorage.ts` (별도 services/ 없음) |
| Main Data | `core.care_*` |
| 장기 | Industry |

### skin — `src/industries/skin` (plugin id `skin_clinic`)

| | |
| --- | --- |
| Purpose | 피부과/클리닉 셸 + 시술 차트·리테일 |
| Main Screens | `SkinAppContent.tsx`; dashboard, charts, retail, settings, `SkinHubs.tsx` |
| Main Services | `services/skinRetailService.ts` 등. 예약 허브는 pilates 화면을 import |
| Main Data | core. 전용 schema 없음 |
| 장기 | Industry |

### retail — `src/industries/retail`

| | |
| --- | --- |
| Purpose | 유통 POS · 상품 · 재고 · 매출 |
| Main Screens | `RetailAppContent.tsx`; sales, products, inventory, customers, revenue, settings |
| Main Services | `services/` product, inventory, sale, saleReturn, revenue |
| Main Data | `core.products`, `inventory`, `sales`, `point_*` |
| 장기 | Industry |

### bath — `src/industries/bath` (plugin id `sauna_jjimjilbang`)

| | |
| --- | --- |
| Purpose | 목욕탕 객실·방문·예약 |
| Main Screens | `BathAppContent.tsx`; `components/BathPlaceholderView.tsx` |
| Main Services | `services/` room, visit, booking, offeredService |
| Main Data | `bath.rooms`, `visits`, `bookings`, `services` |
| 장기 | Industry |

### parent — `src/modules/parent`

| | |
| --- | --- |
| Purpose | 학부모 포털 (plugin 아님. Gate에서 분기) |
| Main Screens | `ParentShell.tsx`; `views/` home/bookings/tuition/care 등 |
| Main Services | 모듈 services 폴더 없음. `src/core/parent` 사용 |
| Main Data | membership + parent_student_links + 업종별 조회 |
| 장기 | Capability(`parent`) + 포털 모듈. 업종 폴더를 `modules`에 다시 두지 않음 |

고객 포털은 모듈이 아님: `src/core/customer/CustomerShell`.

---

## 7. Shared Map

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

## 8. Context / State Map

| 위치 | 담당 |
| --- | --- |
| `src/core/auth/AuthProvider.tsx` | Supabase session |
| `src/core/organizations/OrganizationProvider.tsx` | membership, 선택 사업장, role, portalMode, location |
| `src/shared/navigation/navigationTypes.ts` | `NavTab` 계약. Core/Capability는 AppContext와 `appUi` adapter를 import하지 않는다 |
| `src/shared/navigation/navSession.ts` | 탭/선택 학생 SoT. AppContext와 Core UI가 같은 스냅샷을 읽는다 |
| `src/shared/session/useActiveUser.ts` | `StorageService.getActiveUser()` 미러. 권한 계산의 currentUser 공급원 |
| `src/context/AppContext.tsx` | toast, confirm, workStatus, refreshKey + nav session 바인딩. `NavTab`은 navigation contract를 re-export |
| `src/hooks/useStorageRefresh.ts` | Storage 키 구독 화면 갱신 |
| `src/hooks/usePermissions.ts` (`core/auth`) | 탭/permission UX |
| `src/hooks/useStaffScope.ts`, `useStaffGrants.ts` | 스태프 범위 |
| `src/hooks/useStudentNavigation.ts` | 학생 상세 이동 |
| `src/hooks/useMediaQuery.ts` | 뷰포트 |

도메인 목록(students/bookings)은 AppContext에 두지 않는다.

---

## 9. Entry Point Map

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
7. 그 외 → `StorageHydrator` + `IndustryAppRouter` (`src/app/industry`)

`IndustryAppRouter`: `currentRole === 'parent'` → ParentShell. 그 외 `APP_BY_INDUSTRY` 또는 `GenericIndustryShell`.
