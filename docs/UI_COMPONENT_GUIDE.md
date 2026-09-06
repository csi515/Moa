# MOA UI Component Guide 1.0

> 실제 Shared 컴포넌트 기준. 새 디자인 시스템·Primitive 신설은 하지 않는다.  
> 관련: [CODING_STANDARDS.md](./CODING_STANDARDS.md) · [PAGE_PATTERNS.md](./PAGE_PATTERNS.md)

---

## 목적 → 기본 컴포넌트

| 목적 | 기본 컴포넌트 | 경로 |
|---|---|---|
| 앱 셸 | `ModuleAppShell` | `src/shared/components/layout/ModuleAppShell.tsx` |
| 일반 페이지 제목 | `PageHeader` | `src/shared/components/ui/PageHeader.tsx` |
| 설정 영역 | `SettingsCard` | `src/shared/components/ui/SettingsCard.tsx` |
| 일반 Modal | `Modal` | `src/shared/components/ui/Modal.tsx` |
| 확인/삭제 | `ConfirmDialog` | `src/shared/components/ConfirmDialog.tsx` |
| KPI 요약 | `SummaryMetricCard` | `src/shared/components/ui/SummaryMetricCard.tsx` |
| Director 리치 KPI | `StatCard` | `src/shared/components/StatCard.tsx` |
| 검색 | `SearchField` | `src/shared/components/ui/SearchField.tsx` |
| 필터 | `FilterBar` | `src/shared/components/ui/FilterBar.tsx` |
| 탭/전환 | `SegmentedControl` | `src/shared/components/ui/SegmentedControl.tsx` |
| 빈 상태 | `EmptyState` | `src/shared/components/ui/EmptyState.tsx` |
| 폼 필드 | `FormField` (+ `FORM_CONTROL_CLASS`) | `src/shared/components/ui/FormField.tsx` |
| 토글 | `ToggleSwitch` | `src/shared/components/ui/ToggleSwitch.tsx` |
| 금액 입력 | `CurrencyInput` | `src/shared/components/CurrencyInput.tsx` |
| Toast | `ToastContainer` | `src/shared/components/ToastContainer.tsx` |

Import는 `@/shared/components` barrel을 우선한다.

---

## Layout

- **ModuleAppShell**: Header + Sidebar + main + BottomNav + overlays. Piano/Pilates/Gym/Daycare/Generic가 동일 패턴으로 마운트.
- **density.ts**: `pagePad`, `pageStack`, `cardPad`, `cardRadius` — 신규 화면은 이 값을 따른다.

---

## StatCard / SummaryMetricCard — KEEP_BOTH

둘을 통합하거나 한쪽을 제거하지 않는다.

### SummaryMetricCard

- 일반적인 요약 KPI / KPI strip
- 단순한 수치 비교
- `variant`: default | rose | amber | emerald | purple | indigo | teal
- 학부모 홈 등 요약 카드에도 사용

### StatCard (shared)

- Director 화면 등 **리치 KPI**
- 클릭·trend/highlight 등 추가 표현이 필요한 경우
- 현재 주 사용처: `DirectorDashboardStats`

---

## Confirm / Toast

- Confirm: `openConfirmDialog` → 마운트된 `ConfirmDialog`만 (Modal 기반).
- Toast: `showToast` → `ToastContainer`만. 중복 `Toast.tsx`는 사용하지 않는다.

---

## Form

- 신규 폼 필드는 `FormField` + `FORM_CONTROL_CLASS`를 우선한다.
- 기존 인라인 `label` + `input`은 터치 시점에 점진 정렬한다.
- 전수 Form 통합은 하지 않는다.

---

## Button / Input / Checkbox / Card

전용 Primitive가 **없다**. 이번 표준에서 신설하지 않는다.

신규 코드에서 **인라인 Tailwind 허용** (현행 관례):

```txt
Primary button: min-h-[44px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl ...
Card section:   bg-white rounded-2xl border border-slate-200 shadow-xs p-4
```

섹션 카드가 설정 UI면 `SettingsCard`를 우선한다. parent 포털의 `Section` (`modules/parent/views/shared.tsx`)은 시각적으로 유사하며, 강제 MERGE하지 않는다.

동일 패턴이 반복되면 **향후 Primitive 도입 후보**로만 기록한다 (P2).

---

## Modal 모바일 패턴

shared `Modal`:

- `items-end sm:items-center`
- `rounded-t-3xl sm:rounded-3xl`
- backdrop 클릭 닫기, `role="dialog"`

신규 overlay는 이 컴포넌트를 재사용한다.

---

## Design Language

| 항목 | 현행 |
|---|---|
| CSS | Tailwind |
| Font | Pretendard |
| 면/텍스트 | slate |
| Primary | indigo |
| Radius | rounded-xl (컨트롤), rounded-2xl (카드) |
| Density | compact / medium-high (`density.ts`) |
| Touch | min-h-[44px] |
| Shadow | shadow-xs 선호, lg/xl 지양 |
| Token CSS 변수화 | 하지 않음 (향후) |

---

## 사용하지 말 것

| 금지 | 이유 |
|---|---|
| ConfirmModal | 제거됨 / dead |
| Toast.tsx | ToastContainer와 중복 |
| parent local StatCard | SummaryMetricCard로 치환 완료 |
| 신규 범용 Card/Button Primitive | 표준 1.0에서 미도입 |
