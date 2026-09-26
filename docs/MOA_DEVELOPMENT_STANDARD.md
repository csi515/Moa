# Moa 개발 표준 v1.0

새 기능·수정 시 규칙. 지도는 [PROJECT_MAP.md](./PROJECT_MAP.md), 도메인은 [DOMAIN_MAP.md](./DOMAIN_MAP.md), 흐름은 [DATA_FLOW.md](./DATA_FLOW.md), 계층은 [ARCHITECTURE.md](./ARCHITECTURE.md).

기존: [CODING_STANDARDS.md](./CODING_STANDARDS.md) · [UI_COMPONENT_GUIDE.md](./UI_COMPONENT_GUIDE.md) · [PAGE_PATTERNS.md](./PAGE_PATTERNS.md).

코드와 문서가 충돌하면 **코드를 우선**하고 문서를 고친다.

| 표기 | 의미 |
| --- | --- |
| **현재 표준** | 지금 실제로 쓰는 방식 |
| **권장 표준** | 신규·손대는 코드 |
| **향후 개선** | 인프라만 있거나 혼재. 이미 끝난 것처럼 쓰지 않는다 |

용어는 ARCHITECTURE / PROJECT_MAP / DOMAIN_MAP / DATA_FLOW와 같다.

| 용어 | 의미 |
| --- | --- |
| **Core** | 업종 독립 공통 기반 |
| **Capability** | 여러 업종이 선택하는 업무 기능 |
| **Industry** | 특정 업종의 화면·규칙·조합 |
| **Composition** | definition / manifest / registry / router / loader 조립 |
| **Legacy aggregation layer** | 여러 책임이 한 폴더에 섞인 이행 중 묶음 (`core/academy`, `StorageService`, `src/modules` 업종 복제) |
| **Shared** | UI primitive / layout / 순수 유틸 |
| **Infrastructure** | persist, hydrate, sync, audit, idempotency, outbox |

---

## 1. 문서 목적

현재 구현을 기준으로 일관된 개발 규칙을 정한다. 이상 아키텍처를 현재인 것처럼 적지 않는다. 이미 쓰이는 패턴을 표준으로 승격한다. 일괄 리팩터는 별도 작업이다.

신규 기능은 아래 의사결정 트리로 **Core / Capability / Industry / Composition / Shared** 중 어디에 둘지 먼저 정한다.

---

## 2. 현재 아키텍처 요약

멀티테넌트 업종 SaaS. User / Organization / Membership / Location은 분리된다.

부트스트랩은 PROJECT_MAP §9, 업종 목록은 PROJECT_MAP §6.

### 현재 구현

| 경로 | 역할 |
| --- | --- |
| `src/core` | Core foundation + **legacy aggregation**(`academy`) + capability compat shim |
| `src/modules` | 학부모 포털(라이브) + 업종 폴더 잔여 복제 |
| `src/capabilities` | 선택 업무. 일부 구현, 일부 manifest |
| `src/industries` | 런타임 Industry SoT |
| `src/app/industry` | 런타임 Composition SoT |
| `src/shared` | UI / layout / utility |
| `src/services` | StorageService + hydrate/sync (**제거되지 않음**) |

`src/core/industry`는 카탈로그·`definitions`(Core foundation)와 pluginHost·Generic shell(**Composition 잔여**)이 한 폴더에 있다. **Industry 구현이 아니다.** 라이브 라우터·모듈 등록은 `src/app/industry` (**Composition SoT**).

`src/core/academy`는 학생/학부모/반/시간표/상담/수납이 섞인 **legacy aggregation layer**다. **신규 기능의 기본 위치로 쓰지 않는다.**

### 데이터 접근 (현재 / 권장 / 향후)

DATA_FLOW §4–5와 같다.

1. **현재 표준(주류):** Component → `StorageService` → adapter → Supabase
2. **이행 중:** Component → 파사드 Service → StorageService
3. **권장 표준(신규):** Component → Hook/Service → `getCoreClient()` / RPC
4. **장기 목표:** Industry UI → Capability Application/Service → Core / Repository / RPC  
   (전 경로가 이렇게 바뀐 상태가 아니다)
5. **파일럿:** Command Executor (`reservation.confirm`만, 테스트 전용)

---

## 3. 개발 원칙

1. **구조 우선** — 위치를 정한 뒤 화면을 만든다. Core / Capability / Industry / Shared 책임을 섞지 않는다.
2. **공통화 기준** — 같은 의미·같은 책임일 때만 Core 또는 Capability. “나중에 쓰일 것 같다”만으로 올리지 않는다. Shared는 업종 규칙을 모른다.
3. **책임 분리** — AppContext는 UI. 조직은 OrganizationProvider. 도메인 데이터는 Service/Storage.
4. **재사용** — `src/shared/components`와 기존 Service를 먼저 찾는다. 두 화면에서 쓰인다고 바로 shared로 올리지 않는다.
5. **타입 안정성** — 신규 `any` 금지. DB 타입은 `database.types.ts` + `database.aliases.ts`.
6. **권한 검증** — 탭 숨김은 UX. 쓰기·돈·재고·이용권은 RPC/RLS.
7. **데이터 일관성** — 테넌트는 `organization_id`. 충돌 쓰기는 RPC 한 트랜잭션. 재시도되면 멱등.
8. **모바일 우선** — 터치 44px, 하단 네비와 overlay 겹침 금지, `density.ts`.
9. **테스트** — 규칙·원자 mutation·권한은 파일 옆 `*.test.ts`. 스타일만 고치면 테스트를 억지로 늘리지 않는다.
10. 주석 한글, 식별자 영어. 추측하지 말고 경로를 확인한다.
11. **`core/academy` 금지(신규)** — 기존 화면을 고치는 것은 허용. 새 기능·새 파일을 여기에 두지 않는다.

---

## 4. 어디에 둘 것인가 (의사결정 트리)

신규 기능·신규 파일에만 적용한다. 이미 있는 코드를 이 트리 때문에 옮기지 않는다.

```text
질문 1
  로그인 / 조직 / 권한 / 고객 마스터 / 직원 / 플랫폼처럼
  업종과 무관한 기반인가?
  → Core  (`src/core/<domain>`)

질문 2
  여러 업종이 같은 업무 의미와 같은 책임으로 사용하는 기능인가?
  → Capability  (`src/capabilities/<id>`)
     예: attendance, scheduling, booking, billing, commerce,
         parent, resources, transport, roster, enrollment, consultation

질문 3
  특정 업종에서만 의미가 있거나, 업종마다 의미가 달라지는가?
  → Industry  (`src/industries/<id>`)
     예: piano, pilates, gym, daycare, skin, retail, bath

질문 4
  여러 Industry를 조립하거나 registry / router / loader를 관리하는가?
  → Composition  (`src/app/industry`). 카탈로그 id 정의는 `src/core/industry/definitions.ts` (Core foundation)

질문 5
  UI primitive / layout / format만 재사용하는가?
  → Shared  (`src/shared`)
```

한 질문에 Yes면 그 계층에 두고 다음 질문으로 가지 않는다. 애매하면 **Industry에 두고**, 두 번째 업종이 **같은 의미·같은 책임**으로 쓸 때 Capability 승격을 검토한다.

### 금지하는 오판

| 오판 | 실제 |
| --- | --- |
| “여러 화면에서 쓰인다” = Core | 재사용만으로는 Core가 아니다. 의미가 같은지 본다. |
| “앞으로 다른 업종에서 쓸지도 모른다” = Core | 추측으로 Core에 올리지 않는다. |
| “파일이 커졌다” = Capability | 크기 ≠ 업무 계약. 책임을 쪼개거나 Industry에 남긴다. |
| “학생이라는 이름이 있다” = 반드시 academy | `core/academy`는 **legacy aggregation layer**다. 학생 마스터는 Core(`students`/`customer`), 학원형 화면은 Industry 또는 기존 academy 수정. |
| “고객과 예약을 같이 쓴다” = 하나의 giant Core domain | Customer와 Booking은 다른 책임이다. 합치지 않는다. |

### 새 Capability를 만들 최소 조건

아래를 **모두** 만족할 때만 `src/capabilities/<id>`를 새로 만든다.

1. **명확한 업무 책임** — 한 문장으로 무엇을 보장하는지 말할 수 있다.
2. **독립된 business invariant** — 다른 Capability/Industry와 섞이지 않는 규칙이 있다.
3. **여러 Industry에서 재사용 가능한 의미** — 실제로 두 업종 이상이 같은 의미로 쓰거나, 카탈로그에서 선택한다.
4. **Industry-specific branch가 없어야 함** — `if (industry === 'piano')` 같은 분기를 Capability에 두지 않는다.
5. **test boundary가 명확해야 함** — 규칙·원자 mutation을 Capability 경로에서 테스트할 수 있다.

조건이 안 되면 Industry에 두거나, 기존 Capability에 계약을 추가한다. Core로 올리지 않는다.

이미 있는 Capability 후보가 Core 경로에 남아 있으면 **신규 코드는 `@/capabilities/<id>`**를 쓴다. `src/core/attendance` 등은 compat shim이다.

### 현재 구현 vs 권장 표준 (위치)

| 영역 | 현재 표준 | 권장 표준 (신규) | 향후 개선 |
| --- | --- | --- | --- |
| Core | `src/core` (shim·academy 포함) | 업종 독립 기반만 `src/core` | academy 분해, shim 축소 |
| Capability | `src/capabilities` + Core shim | `src/capabilities/<id>` | Core 잔여 구현 이전 |
| Industry | 런타임 `src/industries` | `src/industries/<id>` | `src/modules` 업종 복제 제거 |
| Composition | `src/app/industry` + `src/core/industry` | `src/app`이 조립, Core는 카탈로그만 | Generic shell 등 Core 잔여 이동 |
| Shared | `src/shared` | 동일 | — |
| Persistence | `src/services` StorageService | UI는 Service/facade | capability별 `*Storage`로 분해. **지금 제거한 상태 아님** |

상세 트리는 PROJECT_MAP.

**의존 (권장):**

```text
Composition → Industry → Capability → Core
```

- Core → Industry 금지
- Capability → Industry 금지
- Industry → Capability 허용
- Industry → Core 허용
- Composition → Industry 허용

검사: `scripts/check-architecture-dependencies.mjs`. LEGACY allowlist는 기존 부채. 신규 위반은 실패.

**Industry → Industry:** 현재 존재 (piano→pilates Pass, skin→pilates hubs, parent→daycare/piano). **권장:** 신규 교차 import는 리뷰에서 이유를 남긴다. 의미가 같으면 Capability로 올릴지 먼저 판단. 이유 없이 삭제하거나 복제하지 않는다.

**Shared가 domain을 알아도 되나:** Header는 Organization/Role hook을 이미 쓴다. 레이아웃용 Core hook은 허용. 업종 계산은 금지.

공통 로직 위치 (권장 표준):

| 질문 | 위치 |
| --- | --- |
| 업종 무관 기반? | `src/core/<domain>` |
| 여러 업종 같은 업무 의미? | `src/capabilities/<id>` |
| 한 업종만 / 업종마다 다름? | `src/industries/<industry>` |
| registry / router / manifest? | `src/app/industry` (+ `core/industry` 정의) |
| UI만 재사용? | `src/shared/components` |
| 순수 날짜/포맷? | `src/shared/utils` 또는 `src/utils` |
| Storage 동기화? | `src/services` + persistence 정책. 신규는 capability `infrastructure/*Storage` |
| org/role/location 맥락? | OrganizationProvider + `createRequestContext` |
| 학부모 포털? | `src/modules/parent` (업종 폴더를 modules에 다시 두지 않음) |

---

## 5. 데이터 / 상태 관리

흐름 상세는 DATA_FLOW.

| 수단 | 현재 용도 | 쓰지 말 것 |
| --- | --- | --- |
| `useState` | 폼, 모달 open | 공유 도메인 데이터 |
| `AppContext` | 탭, 선택 학생, toast, confirm, workStatus, triggerRefresh | invoices 등 업무 엔티티 |
| `OrganizationProvider` | membership, org, role, portal, location | 출결·매출 |
| `AuthProvider` | session | org 권한을 session만으로 가정 |
| `StorageService` + localStorage | 캐시/미러, 설정, 일부 SoT. **아직 살아 있음** | 정책 없는 새 키 |
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

Persistence 정책 4종은 DATA_FLOW §7. **권장:** 새 키는 `persistencePolicy.ts`에 선언. **향후 개선:** 미선언 키, `core_shuttle_ride_requests` local-only.

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

**향후 개선:** 많은 화면은 아직 role/탭만 본다. Permission 키가 좁다.

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

컴포넌트 표는 PROJECT_MAP §7, [UI_COMPONENT_GUIDE.md](./UI_COMPONENT_GUIDE.md).

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
| 같은 업종 2화면 | `industries/<x>/components` |
| 여러 업종 같은 업무 의미 | `capabilities/<id>/ui` (또는 기존 Core 화면 수정) |
| 라벨 없는 primitive | `shared/components/ui` |
| 세 번째 generic 사용처 | shared 승격 검토 |

`core/academy/components`에 새 화면을 두지 않는다. 기존 academy 화면을 고치는 것은 허용.

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
| Architecture | Core→Industry/Module, DB 타입 | `check:architecture`, `check:db-types` |
| Industry contract | 카탈로그·모듈·capability 정합 | `test:industry-contract` |
| E2E | 원장/카운터 한 줄이 깨지면 사업 정지 | `e2e/*.spec.ts` 4개 |

실행: `package.json` `test:*`. 묶음: `test:business-invariants`.

E2E 파일: `director-ops-flow`, `retail-ops-flow`, `public-consultation`, `deeplink-pwa`.

새 Capability를 만들면 test boundary를 Capability 경로에 둔다. Core shim을 테스트 SoT로 쓰지 않는다.

---

## 12. 금지 패턴

코드에서 확인된 것만.

1. 신규 UI에서 `getCoreClient()` / `supabase.from` 직접 호출
2. 신규 custom `fixed inset-0` 확인/입력 모달
3. `triggerRefresh()`로 모든 갱신 해결
4. persistence 정책 없는 localStorage 키
5. 영업일을 `toISOString().slice(0, 10)` (신규 UI)
6. 권한을 탭 숨김만으로 끝내고 돈·재고를 클라이언트에서 변경
7. Core → Industry / modules / capability 신규 import (allowlist 외)
8. Capability → Industry 신규 import
9. Industry 간 새 직접 의존 (기존 piano/pilates/skin/parent 교차는 예외로 유지)
10. 같은 엔티티를 AppContext와 Storage와 서버에 각각 SoT로 둠
11. 동작 중인 RPC를 Command Executor로 재작성
12. 기존 테이블에 `location_id` 일괄 추가
13. 공개 랜딩에 업무 `AppErrorBoundary`를 씌움
14. 셸이 뜬 뒤 작은 조회에 `LoadingScreen`
15. 신규 긴 폼을 toast-only validation으로 만듦
16. 신규 기능을 `src/core/academy`에 둠
17. “나중에 쓸지도”만으로 Core 또는 새 Capability를 만듦

---

## 13. 새로운 기능 개발 절차

```text
Requirement
  → Domain classification
  → Core / Capability / Industry / Composition 결정
  → Authorization
  → Persistence
  → Service
  → UI
  → Test
```

새 Industry:

```text
Industry definition
  → Capability 조합
  → Industry-specific implementation   (src/industries/<id>)
  → Contract test                      (test:industry-contract)
  → Composition registration           (src/app/industry/industryModules.tsx)
  → Regression test
```

상세 단계표는 아래. Feedback / Audit는 Persistence·Service·Test에 포함한다.

| 단계 | 현재 구현 | 권장 |
| --- | --- | --- |
| Requirement | 업종 화면부터 시작하는 경우가 많음 | 공통 의미인지 트리로 먼저 판단 |
| 위치 | academy/modules에 붙는 경우가 많음 | Core / Capability / Industry / Composition / Shared |
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
[ ] 위치가 Core / Capability / Industry / Composition / Shared 중 맞는가?
[ ] core/academy에 신규 파일을 두지 않았는가?
[ ] “여러 화면에서 쓰임” 또는 “나중에 쓸지도”만으로 Core에 올리지 않았는가?
[ ] 새 Capability라면 최소 조건 5개를 만족하는가?
[ ] Core가 Industry / modules / capability를 import하지 않는가?
[ ] Capability가 Industry를 import하지 않는가?
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

| 영역 | 현재 상태 | 표준 수준 | 향후 개선 |
| --- | --- | --- | --- |
| Architecture | Core/Capability/Industry/Composition이 공존. academy·StorageService·modules 복제는 **legacy aggregation**. 의존 검사 + LEGACY allowlist | 중 | 신규 위반 차단됨. 기존 교차·shim 정리는 별도 |
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

1. **날짜(영업일)** — `localDate.ts` vs 남은 UTC slice. 영향: 대시보드 메트릭, finance 월, daycare/parent 날짜, attendance Service
2. **긴 폼 오류 표시** — `StudentFormModal` 패턴. 영향: 수납/상담/설정 toast-only 폼
3. **Persistence 정책 선언** — `persistencePolicy.ts`, 미분류 키. 영향: adapter `setItem`, offline 큐
4. **원자 mutation 멱등** — 기존 RPC에 재시도 가드. Executor로 이관하지 않음. 영향: `*atomic` migration/`*Atomic.ts`
5. **계층 경계** — Core→Industry/capability 신규 import 금지. academy에 신규 기능 금지. 영향: `check-architecture-dependencies.mjs`, academy 잔여 UI, `src/app/industry/IndustryAppRouter`
