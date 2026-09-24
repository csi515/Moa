# Moa 개발 표준 v1.0

새 기능·수정 시 규칙. 지도는 [PROJECT_MAP.md](./PROJECT_MAP.md), 도메인은 [DOMAIN_MAP.md](./DOMAIN_MAP.md), 흐름은 [DATA_FLOW.md](./DATA_FLOW.md).

기존: [ARCHITECTURE.md](./ARCHITECTURE.md) · [CODING_STANDARDS.md](./CODING_STANDARDS.md) · [UI_COMPONENT_GUIDE.md](./UI_COMPONENT_GUIDE.md) · [PAGE_PATTERNS.md](./PAGE_PATTERNS.md).

코드와 문서가 충돌하면 **코드를 우선**하고 문서를 고친다.

| 표기 | 의미 |
| --- | --- |
| **현재 표준** | 지금 실제로 쓰는 방식 |
| **권장 표준** | 신규·손대는 코드 |
| **향후 개선 필요** | 인프라만 있거나 혼재 |

---

## 1. 문서 목적

현재 구현을 기준으로 일관된 개발 규칙을 정한다. 이상 아키텍처를 새로 그리지 않는다. 이미 쓰이는 패턴을 표준으로 승격한다. 일괄 리팩터는 별도 작업이다.

---

## 2. 현재 아키텍처 요약

멀티테넌트 업종 SaaS. User / Organization / Membership / Location은 분리된다.

부트스트랩과 모듈 목록은 PROJECT_MAP §8, §5.

데이터 접근은 한 길이 아니다. DATA_FLOW §4–5.

1. **현재 표준(주류):** Component → `StorageService` → adapter → Supabase
2. **이행 중:** Component → 파사드 Service → StorageService
3. **권장 표준(신규):** Component → Hook/Service → `getCoreClient()` / RPC
4. **파일럿:** Command Executor (`reservation.confirm`만, 테스트 전용)

---

## 3. 개발 원칙

1. **구조 우선** — 위치를 정한 뒤 화면을 만든다. Core/Module/Shared 책임을 섞지 않는다.
2. **공통화 기준** — 같은 의미·같은 책임일 때만 Core. “나중에 쓰일 것 같다”만으로 올리지 않는다. Shared는 업종 규칙을 모른다.
3. **책임 분리** — AppContext는 UI. 조직은 OrganizationProvider. 도메인 데이터는 Service/Storage.
4. **재사용** — `src/shared/components`와 기존 Service를 먼저 찾는다. 두 화면에서 쓰인다고 바로 shared로 올리지 않는다.
5. **타입 안정성** — 신규 `any` 금지. DB 타입은 `database.types.ts` + `database.aliases.ts`.
6. **권한 검증** — 탭 숨김은 UX. 쓰기·돈·재고·이용권은 RPC/RLS.
7. **데이터 일관성** — 테넌트는 `organization_id`. 충돌 쓰기는 RPC 한 트랜잭션. 재시도되면 멱등.
8. **모바일 우선** — 터치 44px, 하단 네비와 overlay 겹침 금지, `density.ts`.
9. **테스트** — 규칙·원자 mutation·권한은 파일 옆 `*.test.ts`. 스타일만 고치면 테스트를 억지로 늘리지 않는다.
10. 주석 한글, 식별자 영어. 추측하지 말고 경로를 확인한다.

---

## 4. 프로젝트 구조

상세 트리는 PROJECT_MAP.

| 영역 | 책임 | 금지 |
| --- | --- | --- |
| `src/core` | 여러 업종이 같은 의미로 쓰는 비즈니스 | 신규 `@/modules/*` import, 업종 schema 직접 참조 |
| `src/modules` | 업종·포털별 의미/화면 | 다른 업종 테이블/키를 몰래 쓰기, 모듈 안 `if (industry===…)` 남발 |
| `src/shared` | UI·layout·순수 유틸·feedback | 수강료/출결 차감 등 업종 로직 |
| `src/context` | 탭·토스트·confirm·workStatus | students 등 엔티티 목록 |
| `src/hooks` | 공용 React hook | 업종 전용 훅 (그건 module/hooks) |
| `src/services` | StorageService, sync | 정책 없는 새 storage key |
| `supabase/` | migration, RLS, RPC | 앱에서 스키마를 우회 변경 |
| `e2e/` | Playwright 소수 시나리오 | 모든 화면 E2E |

**Core → Module:** 원칙 금지. `scripts/check-architecture-dependencies.mjs`. 기존 위반은 allowlist.

**Module → Module:** 현재 존재 (piano→pilates Pass, skin→pilates hubs, parent→daycare/piano, pilates bookings→skin `bookingRooms`). **권장:** 신규 교차 import는 리뷰에서 이유를 남긴다. 의미가 같으면 Core로 올릴지 먼저 판단.

**Shared가 domain을 알아도 되나:** Header는 Organization/Role hook을 이미 쓴다. 레이아웃용 Core hook은 허용. 업종 계산은 금지.

공통 로직 위치:

| 질문 | 위치 |
| --- | --- |
| 여러 업종 같은 의미? | `src/core/<domain>` |
| 한 업종만? | `src/modules/<industry>` |
| UI만 재사용? | `src/shared/components` |
| 순수 날짜/포맷? | `src/shared/utils` 또는 `src/utils` |
| Storage 동기화? | `src/services` + persistence 정책 |
| org/role/location 맥락? | OrganizationProvider + `createRequestContext` |

---

## 5. 데이터 / 상태 관리

흐름 상세는 DATA_FLOW.

| 수단 | 현재 용도 | 쓰지 말 것 |
| --- | --- | --- |
| `useState` | 폼, 모달 open | 공유 도메인 데이터 |
| `AppContext` | 탭, 선택 학생, toast, confirm, workStatus, triggerRefresh | invoices 등 업무 엔티티 |
| `OrganizationProvider` | membership, org, role, portal, location | 출결·매출 |
| `AuthProvider` | session | org 권한을 session만으로 가정 |
| `StorageService` + localStorage | 캐시/미러, 설정, 일부 SoT | 정책 없는 새 키 |
| `useStorageRefresh(domain)` | 키 변경 시 재조회 | 인자 없이 전부 구독하는 신규 화면 |
| `refreshKey` | 명시적 교차 탭 갱신 | 매 write 전역 버스 |
| 서버/RPC | 돈·재고·이용권·예약 확정 | UI 성공만으로 확정 |

의사결정:

1. 이 화면만 → `useState`
2. 탭/토스트/확인 → 기존 AppContext API
3. 사업장·역할·지점·포털 → `useOrganization`
4. 기존 Storage 엔티티 → 파사드 + `useStorageRefresh('students'|…)`
5. 서버 SoT 신규 → Service + client/RPC. 캐시면 persistence 선언
6. 갱신 안 된다고 `triggerRefresh()`를 먼저 넣지 않는다

Persistence 정책 4종은 DATA_FLOW §7. **권장:** 새 키는 `persistencePolicy.ts`에 선언. **개선 필요:** 미선언 키, `core_shuttle_ride_requests` local-only.

---

## 6. 권한 및 멀티테넌시

| 개념 | 위치 | 의미 |
| --- | --- | --- |
| Authentication | `AuthProvider` | 로그인 세션 |
| Organization | Provider, `organization_id` | 테넌트 |
| Membership | `organization_members` | 사용자↔사업장 |
| Role | `MemberRole` | owner/admin/manager/staff/parent/… |
| Permission | `src/core/authorization` | `customers.read` 등 (집합이 좁음) |
| Location | `src/core/locations` | 지점 |
| Scope | `AuthScope` | org / location / resource / customer |
| Portal | `portalMode` | none / parent / customer |
| RLS | migrations | 테이블 직접 접근 |

층:

| 층 | 하는 일 | 한계 |
| --- | --- | --- |
| Client `usePermissions` / 탭 | 메뉴·버튼 숨김 | 우회 가능 |
| Client `evaluatePermission` | role+grant+scope | UX/가드 |
| Service / RPC | actor·org 검증, 원자 쓰기 | 함수마다 다름 |
| RLS | `is_org_member(organization_id)` 등 | 테이블마다 다름 |

**권장:** 버튼을 숨겨도 결제·재고·이용권·예약 확정은 서버가 거부해야 한다.

**개선 필요:** 많은 화면은 아직 role/탭만 본다. Permission 키가 좁다.

Location: 기존 테이블에 location_id 없으면 조직 전체 데이터. 일괄 ALTER 금지.

---

## 7. DB 및 Persistence

- 스키마(타입 생성 기준): `core`, `piano`, `bath`, `platform`
- 테이블: snake_plural. 컬럼: snake_case. RPC: `동사_목적어` (`create_sale`, `confirm_reservation`)
- 테넌트: `organization_id` uuid FK. 지점: 신규 location 도메인만 `location_id`
- 시각: `created_at`/`updated_at` timestamptz. 영업일: `date` 또는 YYYY-MM-DD
- Soft delete / revision: 테이블마다 다름. 전 테이블 통일 아님
- Migration: `supabase/migrations/YYYYMMDDHHMMSS_snake.sql`
- 타입: `npm run supabase:types`, 검증 `check:db-types`. generated 파일에 헬퍼를 손으로 넣지 않음
- 두 줄 이상 써야 일관되는 쓰기 → RPC
- UI → 직접 DB: **현재** 일부 화면이 Storage/client에 가깝게 접근. **권장 신규** UI에서 `getCoreClient()`/`from` 금지

Audit / Outbox / Idempotency: 인프라 있음, 파일럿·일부 RPC만.

| 행위 | Audit | Outbox | Idempotency |
| --- | --- | --- | --- |
| 결제·판매·재고 | 권장 | 외부 알림이면 | 거의 필수 |
| 예약 확정/취소 | 권장 | 알림이면 | 권장 |
| 이용권 차감 | 권장 | 필요 시 | 거의 필수 |
| 출석 체크인 | 선택 | 알림이면 | 권장 |
| 역할 변경 | 권장 | 드묾 | 선택 |
| 토글·탭·모달 | 하지 않음 | 하지 않음 | 하지 않음 |

---

## 8. UI / UX

컴포넌트 표는 PROJECT_MAP §6, [UI_COMPONENT_GUIDE.md](./UI_COMPONENT_GUIDE.md).

- 셸: `ModuleAppShell` (Header + `ModuleSidebar` + `main[data-work-scroll-root]` + `ModuleBottomNav`)
- Desktop 사이드바와 모바일 하단을 억지로 동일하게 만들지 않는다
- Mobile 핵심 탭 권장 4, 상한 5 (`mobileNavPolicy.ts`). 5면 config에 `reason`
- More: `NavMenuItem.section` 있으면 업무/관리/설정, 없으면 3열 grid (`navUtils.ts`)
- 탭 전환 시 스크롤 리셋. 학생 상세 내부 탭은 `activeTab`을 바꾸지 않음
- 관리 페이지 `PageHeader`. 허브는 `density="compact"`. 대시보드/시간표 허브 예외 가능
- Header: 사업장 / 지점 / 역할을 라벨로 분리. 포털일 때만 배지
- 밀도: `src/shared/styles/density.ts`
- 터치 44px. toast/FAB는 하단 네비와 겹치지 않게 (`mobile-overlay-bottom`)

컴포넌트 승격:

| 상황 | 위치 |
| --- | --- |
| 한 화면 | 그 폴더 |
| 같은 업종 2화면 | `modules/<x>/components` |
| 여러 업종 같은 의미 | `core/<domain>/components` |
| 라벨 없는 primitive | `shared/components/ui` |
| 세 번째 generic 사용처 | shared 승격 검토 |

shared에 **Button primitive는 없다.** Tailwind + 기존 Form/Modal 패턴을 쓴다.

Naming (현재 스타일):

| 대상 | 규칙 | 예 |
| --- | --- | --- |
| 컴포넌트 파일 | PascalCase | `StudentFormModal.tsx` |
| 유틸 파일 | camelCase | `localDate.ts` |
| Hook | `use` + camelCase | `useStorageRefresh` |
| Service | `*Service` / `*Capability` | `locationService` |
| Type | PascalCase | `RequestContext` |
| 함수 | 동사 camelCase | `evaluatePermission` |
| 상수 | SCREAMING_SNAKE 또는 맵 | `STORAGE_KEYS` |
| 테스트 | `*.test.ts` 옆 또는 `scripts/` | |
| RPC | snake 동사_명사 | `create_sale` |

TypeScript: 신규 `any` 금지. Props는 `interface`가 흔함. union은 `type`. DB null은 `string | null` 유지. `as`는 Json/레거시 경계만.

---

## 9. Form / Modal / Error / Loading

### Form

대표: `StudentFormModal.tsx` + `studentFormValidation.ts` + `FormField`.

**권장 (신규·손대는 긴 폼):** 필드 오류, submit 시 첫 오류 focus, toast는 서버/전역 실패와 짧은 성공, 중요 결과는 `showWorkStatus` 또는 화면 persistent UI, 저장 중 disabled+스피너, 모바일 액션은 Modal `footer`.

**현재:** 많은 폼이 toast-only validation. 일괄 변경하지 않는다.

### Modal

공통 `Modal.tsx`: `intent="view"` 즉시 닫기. `form` + `dirty` + `confirmClose` → `ConfirmDialog`. focus trap, Escape, `aria-modal`, 모바일 bottom sheet / 데스크탑 센터. 중첩 시 맨 위만 Escape.

반드시 공통 Modal: 입력/수정, 확인, 상세 오버레이.

직접 overlay 가능: 키오스크, 풀스크린 캘린더/시간표, 기존 특수 제스처. 이유를 리뷰에 남긴다.

신규 `fixed inset-0` 확인창, 두 번째 Confirm 시스템 금지. (`ConfirmModal`은 제거됨)

### Loading / Empty / Error

| 수단 | 언제 |
| --- | --- |
| `LoadingScreen` | 앱/포털 **첫** 초기화만 |
| `PageListSkeleton` / `Skeleton` | 페이지 내부 데이터 |
| 버튼 스피너 | mutation |
| `InlineBusy` | 백그라운드 새로고침 |
| `EmptyState` | 0건 |
| Toast | 짧은 결과 |
| `FormField.error` | 지금 고칠 오류 |
| persistent | hydrate/포털 트리 실패 |
| `AppErrorBoundary` | 업무 render crash |
| `PublicRouteErrorBoundary` | `/c/:code` |

---

## 10. 날짜 / 시간

파일: `src/shared/utils/localDate.ts`

| 데이터 | 표준 | 하지 말 것 |
| --- | --- | --- |
| 출석일, date input 기본값, “오늘” | `todayIsoLocal` | `toISOString().slice(0, 10)` |
| 월 | `yearMonthLocal` | `slice(0, 7)` |
| 표시 | `formatKoreanDateLocal` | `new Date(iso)` UTC 파싱 |
| 저장 instant | timestamptz / `toISOString()` | 영업일로 오인 |
| 지점 벽시계 | `businessDateInTimezone`, `instantFromBusinessLocal` | 브라우저 TZ만으로 다른 지점 시각 |

한국 사용자도 UTC 자정에 날짜가 하루 밀린다. 날짜와 timestamp를 분리한다.

**현재:** Header/대시보드/학생 목록 등 일부만 helper. UTC slice가 다수 잔존.

**권장:** 신규·손대는 업무 UI의 오늘/이번달은 localDate.

`updatedAt: new Date().toISOString()` instant는 유지.

---

## 11. 테스트

| 종류 | 언제 | 위치 |
| --- | --- | --- |
| Unit | 규칙, state machine, validation, 날짜, 권한 순수 함수 | 대상 옆 `*.test.ts` |
| Integration / RPC | 돈·재고·이용권·출결 원자 | `*Atomic.test.ts`, `scripts/*Db*.ts` |
| 권한/RLS | 새 테이블·멤버십 정책 | `scripts/rls-*`, `permissions.invariant.test.ts` |
| Architecture | Core→module, DB 타입 | `check:architecture`, `check:db-types` |
| E2E | 원장/카운터 한 줄이 깨지면 사업 정지 | `e2e/*.spec.ts` 4개 |

실행: `package.json` `test:*`. 묶음: `test:business-invariants`.

E2E 파일: `director-ops-flow`, `retail-ops-flow`, `public-consultation`, `deeplink-pwa`.

---

## 12. 금지 패턴

코드에서 확인된 것만.

1. 신규 UI에서 `getCoreClient()` / `supabase.from` 직접 호출
2. 신규 custom `fixed inset-0` 확인/입력 모달
3. `triggerRefresh()`로 모든 갱신 해결
4. persistence 정책 없는 localStorage 키
5. 영업일을 `toISOString().slice(0, 10)` (신규 UI)
6. 권한을 탭 숨김만으로 끝내고 돈·재고를 클라이언트에서 변경
7. Core → modules 신규 import (allowlist 외)
8. Module 간 새 직접 의존 (기존 piano/pilates/skin/parent 교차는 예외로 유지)
9. 같은 엔티티를 AppContext와 Storage와 서버에 각각 SoT로 둠
10. 동작 중인 RPC를 Command Executor로 재작성
11. 기존 테이블에 `location_id` 일괄 추가
12. 공개 랜딩에 업무 `AppErrorBoundary`를 씌움
13. 셸이 뜬 뒤 작은 조회에 `LoadingScreen`
14. 신규 긴 폼을 toast-only validation으로 만듦

---

## 13. 새로운 기능 개발 절차

```text
Requirement → Domain → Authorization → Persistence → Service
  → UI → Error/Loading/Empty → Audit/Outbox/Idempotency → Test
```

| 단계 | 현재 구현 | 권장 |
| --- | --- | --- |
| Requirement | 업종 화면부터 시작하는 경우가 많음 | 공통 의미인지 먼저 판단 |
| Domain | 로직이 화면에 있는 경우 있음 | `stateMachine` / 기존 domain 파일 |
| Authorization | 탭/role이 주류 | 쓰기는 RPC/RLS. 필요 시 `evaluatePermission` |
| Persistence | Storage 주류 | 정책 선언. 서버 SoT면 client/RPC |
| Service | 파사드와 Storage 혼재 | UI는 Service만 |
| UI | ModuleAppShell + 공통 컴포넌트 | 기존 primitive 우선 |
| Feedback | toast 과다 | feedbackPolicy 채널 분리 |
| Audit/Outbox/Idem | 파일럿 | 원자 RPC에 최소 가드. Executor로 이전 금지 |
| Test | invariants 두꺼움 | 규칙/RPC/권한에 맞는 것만 추가 |

기존 RPC를 Executor로 옮기는 단계는 하지 않는다.

---

## 14. 개발 체크리스트

```text
[ ] 위치가 core / modules / shared 중 맞는가?
[ ] Core가 modules를 import하지 않는가?
[ ] Organization scope가 필요한가? organization_id가 있는가?
[ ] Location scope가 필요한가? 기존 테이블을 일괄 변경하지 않았는가?
[ ] 실행 location을 localStorage만으로 믿지 않는가?
[ ] 탭 숨김 외에 서버/RLS/RPC 가드가 필요한가?
[ ] UI가 DB를 직접 호출하지 않는가?
[ ] 원자 쓰기면 기존 RPC 패턴인가? (Executor 억지 이전 금지)
[ ] Idempotency가 필요한 재시도 요청인가?
[ ] Audit allowlist 대상인가? 민감 필드를 넣지 않았는가?
[ ] Outbox로 뺄 알림인가?
[ ] storage key를 추가했다면 persistence 정책을 선언했는가?
[ ] 갱신은 useStorageRefresh(domain)인가?
[ ] 공통 Modal / ConfirmDialog를 쓸 수 있는가?
[ ] 긴 폼이면 필드 오류 + 첫 필드 focus + footer인가?
[ ] Toast를 validation 전용으로 쓰지 않았는가?
[ ] 날짜는 todayIsoLocal / formatKoreanDateLocal인가?
[ ] timestamp를 영업일로 바꾸지 않았는가?
[ ] LoadingScreen / skeleton / 버튼 로딩을 섞지 않았는가?
[ ] EmptyState와 에러를 구분했는가?
[ ] Header에서 사업장·지점·역할이 섞여 보이지 않는가?
[ ] 모바일 하단 탭 4~5 + reason인가?
[ ] 터치 44px, 하단 overlay 겹침 없는가?
[ ] database.types / check:db-types를 갱신했는가?
[ ] 규칙·원자 쓰기·권한 테스트를 추가했는가?
```

---

## 영역별 성숙도

| 영역 | 현재 상태 | 표준 수준 | 개선 필요 |
| --- | --- | --- | --- |
| Architecture | Core/Module/Shared + 의존 검사. allowlist·모듈 교차 import 존재 | 중 | 신규 위반 차단됨. 기존 교차 정리는 별도 |
| State | AppContext는 UI. 데이터는 Storage+refresh 주류 | 중 | 화면의 StorageService 직접 호출이 많음 |
| Authorization | Role/탭 + 좁은 Permission + RLS/RPC | 중 | Permission을 모든 쓰기에 연결하지 않음 |
| DB | migration/RLS/타입 검증. 타입 allowlist 누락 있음 | 중상 | 생성 타입과 앱 타입 완전 일치 아님 |
| UI | ModuleAppShell·PageHeader·가이드 | 중상 | 업종별 밀도/헤더 예외 |
| Form | 학생 폼이 필드 오류 표준. 타 폼은 toast | 하~중 | 긴 폼 점진 적용 |
| Modal | 공통 Modal+Confirm. 커스텀 overlay 잔존 | 중 | 남은 커스텀 오버레이 |
| Error | 업무/공개 Boundary 분리. 키오스크·가입 미적용 | 중 | 경계 밖 라우트 |
| Date/Time | helper+일부 화면. UTC slice 다수 | 하~중 | 업무 UI 날짜 정렬 |
| Offline | 정책+일부 키. pending/outbox 큐 | 중 | 미선언 키, local-only 업무 데이터 |
| Audit | 테이블+파일럿 | 하 | 대부분 mutation 미연결 |
| Testing | invariants 단위 테스트 두꺼움. E2E 소수 | 중 | 화면 E2E보다 규칙/RPC가 본류 |

---

## 현재 가장 먼저 표준화해야 할 영역 5개

우선순위 없음.

1. **날짜(영업일)** — `localDate.ts` vs 남은 UTC slice. 영향: 대시보드 메트릭, finance 월, daycare/parent 날짜, `attendanceService.ts`
2. **긴 폼 오류 표시** — `StudentFormModal` 패턴. 영향: 수납/상담/설정 toast-only 폼
3. **Persistence 정책 선언** — `persistencePolicy.ts`, 미분류 키. 영향: adapter `setItem`, offline 큐
4. **원자 mutation 멱등** — 기존 RPC에 재시도 가드. Executor로 이관하지 않음. 영향: `*atomic` migration/`*Atomic.ts`
5. **Core↔Module 경계** — allowlist 외 신규 import 금지. 영향: `check-architecture-dependencies.mjs`, academy→parent 모달, IndustryAppRouter
