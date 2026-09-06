# MOA Page Patterns 1.0

> 화면 유형별 구성. 모든 화면을 동일하게 만드는 규칙이 아니다.  
> 관련: [CODING_STANDARDS.md](./CODING_STANDARDS.md) · [UI_COMPONENT_GUIDE.md](./UI_COMPONENT_GUIDE.md)

---

## Settings

```
PageHeader
  → SettingsCard
    → ToggleSwitch / FormField
  → Save action
```

대표: `AcademySettingsView`, `SettingsHubView`.

---

## List

```
PageHeader (compact 권장)
  → SearchField / FilterBar
  → Desktop: table · Mobile: list cards
  → EmptyState
  → Pagination 또는 Load more (필요 시)
  → Form / Detail Modal
```

대표: `StudentListView`, `ParentManagementView`, `ClassManagementView`.

---

## Detail

```
PageHeader 또는 Detail Modal header
  → Summary
  → Tabs / Sections
  → Detail content
```

대표: `StudentDetailModal` (bottom-sheet + tabs).

---

## Form

```
PageHeader 또는 Modal title
  → Form sections
  → FormField
  → FormActions (하단 CTA, min-h-[44px])
```

대표: `StudentFormModal`, AcademySettings 내 폼.

---

## Dashboard

**PageHeader 필수 규칙의 예외.**

```
Summary / KPI (SummaryMetricCard 또는 StatCard)
  → Today / Important tasks
  → Quick Actions
  → Recent activity
```

대표: `DirectorTodayHome`, `PilatesDashboardView`, `IndustryDashboardShell`.

커스텀 gradient hero 허용.

---

## Finance

```
PageHeader
  → SegmentedControl
  → embedded views (overview / income / expenses / tuition / unpaid)
```

대표: `FinanceHubView`.

재무의 수입·지출·요약·미납을 **sidebar 별도 메뉴로 분리하지 않는다.** 하나의 업무 영역(허브) 내부에서 관리한다.

---

## Consultation

```
PageHeader
  → primary actions (일정 / QR / 가능시간 등)
  → SegmentedControl 또는 section navigation
  → embedded views
```

대표: `PianoConsultationHubView`.

---

## Calendar / Schedule

특수 UX 허용.

- 커스텀 sticky header
- calendar navigation / date selector
- mobile-specific layout

대표: `ClassScheduleHubView`, `PianoScheduleView`.

일반 UI(색·radius·터치·EmptyState 등)는 MOA 패턴을 최대한 따른다.

---

## Navigation / IA

사이드바는 **기능 목록**이 아니라 **업무 영역** 기준으로 구성한다.

기본 piano 구조 예:

- 홈
- 고객/학생
- 일정
- 상담
- 재무(수납)
- 설정

지양:

```
- 재무요약
- 수입관리
- 지출관리
- 미납관리   ← 각각을 sidebar 메뉴로 두지 않음
```

권장:

```
재무
  ├─ 요약
  ├─ 수입
  ├─ 지출
  └─ 미납     ← Hub 내부 SegmentedControl
```

원칙: **기능 하나 = 메뉴 하나 (X)** / **업무 영역 하나 = 메뉴 하나 (O)**.

---

## 예외 허용

표준은 모든 화면을 똑같이 만드는 규칙이 아니다. 예외가 필요한 경우:

1. Calendar / Schedule
2. Kiosk (예: PIN 체크인)
3. Full-screen mobile interaction
4. Dashboard
5. 특수한 business workflow

예외는 기존 패턴과 충돌하는 **이유가 있을 때만** 허용한다. 새 예외 패턴은 shared로 해결할 수 없는 이유를 설명할 수 있어야 한다.
