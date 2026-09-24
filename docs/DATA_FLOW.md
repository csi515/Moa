# Moa Data Flow

데이터가 앱을 통과하는 실제 경로. 폴더는 [PROJECT_MAP.md](./PROJECT_MAP.md), 개념은 [DOMAIN_MAP.md](./DOMAIN_MAP.md).

표기:

| 표기 | 의미 |
| --- | --- |
| 현재 구현 | 지금 실행되는 경로 |
| 권장 표준 | 신규 코드 |
| 파일럿 | 인프라는 있으나 프로덕션 write에 거의 안 붙음 |

---

## 1. Authentication

```text
User
  → AuthPage / Kakao / Naver / email
  → AuthProvider (src/core/auth/AuthProvider.tsx)
  → Supabase session (persist + onAuthStateChange)
  → OrganizationProvider.refreshOrganizations
  → SupabaseAppGate
  → Application
```

현재 구현:

- `AuthProvider`가 session/user/loading과 signIn/signOut을 제공한다.
- signOut은 `StorageService` 클리어 + 푸시 토큰 정리.
- 세션만으로 Organization Role을 가정하지 않는다.

권장: 신규 화면은 `useAuth()` + `useOrganization()`. 세션 user id를 org role처럼 쓰지 않는다.

---

## 2. Organization Selection

```text
User
  → fetchUserMembershipsWithContext
  → OrganizationProvider
  → selectedMembership (localStorage: moa_current_organization_id)
  → currentOrganization / currentRole / currentStaffId
  → StorageHydrator(organizationId, industryType)
  → IndustryAppRouter → Module *AppContent
```

현재 구현 (`OrganizationProvider.tsx`):

- 소스: memberships, selectedMembership, portalMode, blockedOwnerOrgIds.
- 커밋: `resolveOrganizationContext.ts` + `organizationService.storeOrganizationId`.
- 사업장 변경 시 `StorageService.clearOrganization()`.
- 학부모/고객 포털은 `portalMode`. 선택 membership과 따로 켜질 수 있다.
- Gate: parent-only → `ParentShell`, customer-only → `CustomerShell`, 미선택 → `OrganizationSelector`.

권한 전환 UI: `RoleContextSwitcher.tsx` (`switchMembership`, portal enter/exit, logout).

---

## 3. Location Selection

```text
Organization id
  → useOrganizationLocationState
  → locationService.list + listAccessGrants
  → filterAccessibleLocations / resolveLocationSelection
  → currentLocation (store: moa_current_location_id)
  → HeaderLocationControl / RoleContextSwitcher
```

현재 구현:

- 상태는 OrganizationProvider가 hook 결과를 context에 올린다.
- hook은 `useApp().currentUser.role`로 access context를 만든다 (`useOrganizationLocationState.ts`).
- `App.tsx` 트리: `OrganizationProvider` ⊃ `AppProvider`. location hook이 AppContext에 의존한다. (현재 구현. 권장: org role을 location access에 쓰기)
- trusted selection은 catalog+grant 검증 후. localStorage만으로 채택하지 않음 (`locationService`, `resolveTrustedLocationId` 계열).
- 지점 0~1개면 드롭다운 변경 불가. 제한 배정이면 clear 불가.

권장: 신규 조회/쓰기에 “실행 location”이 필요하면 Provider의 currentLocation을 쓰고, storage 문자열을 직접 읽지 않는다.

기존 테이블에 location_id가 없으면 조회를 지점 필터로 바꾸지 않는다.

---

## 4. Read Flow

**현재 주류:**

```text
Component
  → useStorageRefresh('students' | …)
  → StorageService.getX()          // 메모리 캐시
  → (미hydrate) offline snapshot 또는 default
  → StorageHydrator가 서버에서 hydrate
```

예: 많은 academy/module 화면, `Header.tsx`.

**이행 중:**

```text
Component → TuitionService / ScheduleService 파사드 → StorageService
```

**신규 권장:**

```text
Component → Hook → domain Service
  → getCoreClient() / pianoClient / bathClient
  → PostgreSQL (RLS)
```

예: `src/core/schedules/services/`, `src/core/locations/locationService.ts`, retail `productService.ts`.

React Query 등 서버 캐시 라이브러리는 **없다**. 서버 state는 Storage 캐시 또는 화면 `useState` + Service 호출이다.

권장: UI에서 `getCoreClient()` / `supabase.from` 직접 호출하지 않는다.

---

## 5. Mutation Flow

### 5.1 목표 파이프라인 (파일럿에만 조립)

`src/core/application/commandExecutor.ts` 주석:

```text
RequestContext → Authorization → Idempotency → Transaction
  → Domain Mutation → Audit → Outbox
```

등록 커맨드: `reservation.confirm` (`command.ts`). 호출처는 `commandExecutor.test.ts`뿐.

프로덕션 예약 확정:

```text
ReservationInboxView
  → reservationService.confirmReservation
  → RPC confirm_reservation
```

기존 RPC의 TX/멱등/아웃박스를 Executor로 옮기지 않는다. (파일 주석)

### 5.2 현재 프로덕션 write

| 종류 | 경로 |
| --- | --- |
| 일반 엔티티 | `StorageService.setItem` → 로컬 미러 + pending + (가능하면) persist |
| 돈·재고·이용권·예약 확정 | domain `*Atomic.ts` → `rpc()` 한 트랜잭션 |
| 지점 CRUD | `locationService` → `upsert_location` 등 |
| 오프라인 큐 | `pendingMutations`, `syncOutbox` (`src/services/adapters/`) |

권장 신규 원자 쓰기:

```text
UI → Service
  → (RequestContext / org id 검증)
  → RPC (내부에서 actor·org·필요 시 begin_idempotency)
  → 성공 시 local mirror / useStorageRefresh
```

Audit/Outbox가 필요하면 RPC 안 또는 기존 capability. UI 토글에는 붙이지 않는다.

---

## 6. State Refresh

세 경로가 다르다. 섞지 않는다.

| 수단 | 파일 | 언제 |
| --- | --- | --- |
| `useStorageRefresh(domain)` | `src/hooks/useStorageRefresh.ts` | 해당 storage 키 notify |
| `refreshKey` / `triggerRefresh` | `AppContext` | 설정 저장 등 명시적 교차 탭. 매 write마다 올리지 않음 |
| 로컬 `useState` | 화면 | 폼/모달. 구독과 무관 |

`STORAGE_REFRESH_DOMAINS`: students, bookings, sessionPasses, classes, attendance, lessons, finance, settings, textbooks.

Hydrate 성공 시 adapter가 `notify('*')` → 구독 화면 전부 갱신.

권장: 새 화면은 domain을 지정해서 구독한다. “안 바뀐다”고 `triggerRefresh()`를 먼저 넣지 않는다.

---

## 7. Offline / Local Storage

정책: `src/core/storage/persistencePolicy.ts`  
키: `src/services/adapters/storageKeys.ts`

| 정책 | SoT | local write = 성공? | 현재 선언 예 |
| --- | --- | --- | --- |
| `server-authoritative` | server | 아니오 | 수납, invoices, schedules, session_passes, textbook sales |
| `server-with-local-cache` | server | 아니오 | students, teachers, settings, attendance, daycare care |
| `offline-command` | command-queue | 아니오 | pendingMutations, syncOutbox |
| `local-only` | local | 예 | active user, onboarding, `core_shuttle_ride_requests` |

미선언 키는 기존 SYNC / LOCAL_ONLY 분류로 fallback.

현재 구현: `setItem` 성공 ≠ 서버 커밋. 오프라인이면 큐. Hydrate 실패 + 로컬 스냅샷이면 offline mode (`StorageHydrator.tsx`).

권장: 새 storage key는 정책을 같이 선언한다.

개선 필요: 미선언 키 다수, 셔틀 요청이 local-only.

---

## 8. Error Flow

```text
DB / RPC / Adapter error
  → Service catch (또는 Storage persist fail)
  → UI
      필드 수정     → FormField.error
      짧은 실패     → showToast('error')
      중요 업무 결과 → showWorkStatus + WorkStatusBanner
      hydrate 실패  → StorageHydrator 에러 + 재시도
      render crash  → AppErrorBoundary (/*) 또는 PublicRouteErrorBoundary (/c/:code)
```

정책: `src/shared/feedback/feedbackPolicy.ts` (toast | inline | status). 동시 토스트 최대 2.

현재: `/attendance-kiosk`, `/signup/customer`는 업무 ErrorBoundary 밖 (`App.tsx`).

권장: 채널을 한 화면에 중복하지 않는다. 셸이 뜬 뒤 조회 실패에 `LoadingScreen`을 쓰지 않는다.

---

## 9. 대표 시퀀스 (요약)

로그인 후 업무 화면:

```text
session → memberships → select org → hydrate storage → IndustryAppRouter
  → ModuleAppShell → screen reads StorageService
```

판매(유통):

```text
SalePosView → retail saleService → RPC create_sale → 재고/포인트 RPC
  → storage mirror / refresh
```

출결+이용권:

```text
attendance UI → attendancePassAtomic / piano RPC update_attendance_status_with_pass
```

학부모 포털:

```text
portalMode=parent → ParentShell → core/parent + 업종별 views (일부 daycare/piano import)
```
