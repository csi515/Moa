# MOA Coding Standards 1.0

> 신규 코드에 적용. 기존 코드는 수정·개선 시점에 점진 정렬.  
> 관련: [ARCHITECTURE.md](./ARCHITECTURE.md) · [UI_COMPONENT_GUIDE.md](./UI_COMPONENT_GUIDE.md) · [PAGE_PATTERNS.md](./PAGE_PATTERNS.md)

---

## 기본 원칙

1. 기존 기능을 임의로 변경하지 않는다.
2. 기존 UI를 전수 리팩터링하지 않는다.
3. 새로운 디자인 시스템을 발명하지 않는다.
4. 현재 코드에서 실제로 사용되는 패턴을 우선한다.
5. 신규 코드는 본 표준을 준수한다.
6. 기존 코드는 수정/개선하는 시점에 점진적으로 표준에 맞춘다.
7. 기존 코드와 표준이 다르다는 이유만으로 일괄 수정하지 않는다.
8. Core / Shared / Module의 책임을 명확하게 유지한다.
9. 멀티테넌트 데이터 격리를 최우선으로 한다.
10. 추측하지 말고 실제 코드와 사용처를 확인한다.

### 컴포넌트·로직

- 기존 Shared 컴포넌트를 먼저 확인한다 (`src/shared/components`).
- 동일한 목적의 컴포넌트를 신규 생성하지 않는다.
- 신규 공통 컴포넌트가 필요하면 기존 컴포넌트와의 차이를 먼저 검토한다.
- 신규 코드는 **Component → Hook → Service → getCoreClient() → Supabase** 흐름을 우선한다.
- 컴포넌트에서 Supabase를 직접 호출하지 않는다.
- 업종 전용 비즈니스 로직은 Module에 둔다.
- 여러 업종에서 **동일한 의미·동일한 책임**을 가지는 기능만 Core에 둔다.
- UI 재사용성과 비즈니스 로직 재사용성을 구분한다. Shared에는 업종 비즈니스 로직을 넣지 않는다.

상세 계층 규칙: [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Confirm

신규 Confirm UI는 반드시 `ConfirmDialog`를 사용한다 (`AppContext.openConfirmDialog`).

금지:

- 신규 `ConfirmModal` 사용·재도입
- 페이지 내부 custom confirm UI 신규 구현

`ConfirmModal`은 제거됨. Confirm은 shared `Modal` 위에 구성된 `ConfirmDialog`만 사용한다.

---

## Overlay

신규 일반 overlay/modal은 shared `Modal` (`src/shared/components/ui/Modal.tsx`)을 우선 사용한다.

금지:

- 동일 목적의 신규 custom `fixed inset-0` modal
- 페이지마다 독립적인 modal 시스템 구현

예외: Schedule/Calendar, Kiosk, full-screen 등 특수 UX — 기존 패턴과 충돌하지 않는 범위에서만 허용. 예외 시 코드 리뷰에서 shared Modal로 해결할 수 없는 이유를 설명할 수 있어야 한다.

---

## PageHeader

일반적인 관리 페이지에서는 `PageHeader`를 기본으로 사용한다. 허브는 `density="compact"`를 우선한다.

예외:

- Dashboard
- Schedule Hub
- 특수 full-screen 화면
- UX상 PageHeader가 부적절한 화면

---

## Responsive

MOA는 **Mobile-first**로 개발한다.

| 구간 | 원칙 |
|---|---|
| mobile | 단일 컬럼 / compact UI / bottom nav |
| `sm:` | 넓어진 mobile/tablet |
| `md:` | sidebar 사용 가능 (`md:flex`) |
| desktop | sidebar + content |

- 모바일에서 desktop 화면을 단순 축소하지 않는다.
- 터치 대상은 기본적으로 최소 **44px** (`min-h-[44px]`)를 고려한다.
- 밀도 토큰: `src/shared/styles/density.ts` (`pagePad`, `pageStack`, `cardPad`, `cardRadius`).

---

## Naming

신규 View는 의미에 따라 다음 패턴을 우선한다.

- `*HubView` — 업무 영역 허브 (SegmentedControl 등)
- `*ManagementView` — 목록·CRUD 관리
- `*DetailView` / Detail Modal
- `*FormView` / Form Modal
- `*SettingsView`

기존 코드의 이름을 강제로 변경하지 않는다.

---

## Data Flow

권장 신규 구조:

```
Component → Hook → Service → getCoreClient() → Supabase (RLS)
```

현행 레거시:

```
Component → StorageService → sync adapters → Supabase
```

이행 중 (도메인 파사드):

```
Component → StudentService | TuitionService | LessonService → StorageService → sync
```

- 신규/수정 UI는 파사드 Service를 호출한다.
- 레거시는 기능 수정 시 점진 정렬한다.
- 전체 StorageService를 한 번에 제거하지 않는다.
- 조직 스코프가 필요한 조회/저장은 Service에서 `organization_id`를 명시한다.

### 도메인별 Service (신규·수정 시)

| 도메인 | UI가 호출할 Service | 비고 |
|---|---|---|
| 수강료·청구·수기완납 | `TuitionService` | `sendInvoice`, `recordPayment`, `requestCashReceipt` |
| 성인 포털 컨텍스트 | `studentPortalService` | `getCoreClient` RPC |
| 고객 가입 승인 | `customerJoinService` | `getCoreClient` RPC |
| 연습실 예약(고객) | `practiceRoomReservationService` | canonical `room_reservations` |
| 학부모 포털 | parent services + `TuitionService` | 미발송 청구 미노출 |

수강료·성인·연습실 제품 규칙: [ARCHITECTURE.md](./ARCHITECTURE.md#도메인-표준-2026-09-추가).

---

## 멀티테넌트 (요약)

- 조직 데이터는 `organization_id` 기준으로 격리한다.
- 로그인 ≠ 조직 권한. User는 identity, Organization은 테넌트, OrganizationMembership은 역할/권한이다.
- Customer는 특정 Organization과의 고객 관계이다.
- RLS가 있어도 앱 코드에서 organization context(`OrganizationProvider`)를 유지한다.
- 다른 organization 데이터가 노출될 수 있는 전역 조회를 신규로 만들지 않는다.

상세: [ARCHITECTURE.md](./ARCHITECTURE.md#멀티테넌트-데이터-규칙).

---

## Design Language (준수 요약)

- Tailwind + Pretendard
- slate 기반면 / indigo primary
- `rounded-xl` 컨트롤, `rounded-2xl` 카드
- compact business UI, shadow 과다 사용 금지
- CSS 변수·Design Token 전면 도입은 이번 표준 범위 밖 (향후)

상세 UI: [UI_COMPONENT_GUIDE.md](./UI_COMPONENT_GUIDE.md).
