# MOA UI/Architecture 사전 분석 결과

> 범위: `src/` 실측 기반. 신규 디자인 시스템 발명 금지 — 현행 패턴을 표준으로 문서화한다.  
> 작성 기준일: 2026-09-06 · **표준 이관일: 2026-09-06**

## 상태 (Standards 1.0)

사전 분석의 **규범적 내용**은 아래로 이관했다. 본 문서는 실측 감사·Gap 추적용으로 유지한다.

| 문서 | 역할 |
|---|---|
| [CODING_STANDARDS.md](./CODING_STANDARDS.md) | 일상 코딩 규칙 |
| [UI_COMPONENT_GUIDE.md](./UI_COMPONENT_GUIDE.md) | Shared 컴포넌트 사용 |
| [PAGE_PATTERNS.md](./PAGE_PATTERNS.md) | 화면·IA 패턴 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Core/Module/Shared · Data · Multi-tenant |

### P0 정리 상태

| 항목 | 상태 |
|---|---|
| ConfirmModal 제거 | Done (사용처 0, 파일 삭제) |
| Toast.tsx 제거 | Done (ToastContainer만 사용) |
| ConfirmDialog → Modal 기반 | Done |
| parent StatCard → SummaryMetricCard | Done |
| Button/Input/Card Primitive | 미도입 — 인라인 Tailwind 허용으로 문서화 |

---

## 1. 전체 평가

| 영역 | 평가 | 한줄 요약 |
|---|---|---|
| Architecture | Good | Shared 셸 + Core 업무 + Module 업종 분리가 실사용에서 작동 |
| Shared UI | Needs improvement | PageHeader/Modal/EmptyState 등은 잘 쓰이나 Button/Input/Card/Checkbox 부재로 인라인 Tailwind 폭증 |
| Core/Module | Good | 학원 공통은 Core, 피아노 전용은 Module — 대부분 준수 |
| UI consistency | Needs improvement | slate+indigo·44px·compact hub는 수렴, 카드/폼/커스텀 헤더는 산발 |
| Responsive | Good | ModuleAppShell + bottom-nav + safe-area + Modal bottom-sheet |
| Code organization | Improved | P0 dead code·이름 충돌 정리 완료 |
| Maintainability | Important | StorageService 중심 CRUD vs Service→Supabase 이원화, Modal 재발명 다수 |

---

## 2. Shared 사용처 실측 (2026-09-06 재검색, 파일 수 근사)

정의·barrel 제외한 consumer 중심.

| 컴포넌트 | 대략적 사용 파일 수 | 비고 |
|---|---|---|
| PageHeader | ~35 | 허브/리스트 표준 |
| ConfirmDialog / openConfirmDialog | ~30 | shells 마운트 + 호출부 |
| ToastContainer | 6 | 전 업종 AppContent/Shell |
| EmptyState | ~20 | |
| FilterBar | ~15 | |
| SearchField | ~12 | |
| SegmentedControl | ~12 | Hub IA |
| SummaryMetricCard | ~12 | KPI strip + parent homes |
| CurrencyInput | ~8 | |
| SettingsCard | ~3 | 설정 중심 |
| FormField | ~12 | 인라인 label과 공존 |
| ToggleSwitch | 1 | AttendanceFeatureToggle |
| StatCard (shared) | 1 | DirectorDashboardStats만 |
| Modal (shared import) | ~20+ | 다수 화면은 custom fixed overlay |

---

## 3. Gap 실측 (전수 치환 대상 아님)

| Gap | 실측 | 대응 |
|---|---|---|
| raw `bg-white rounded-2xl border` | ~40 files | P1 — 터치 시 SettingsCard/Section |
| `fixed inset-0` (Modal 정의 포함) | ~50 files | P1 — 신규는 shared Modal만 |
| `text-xs font-semibold text-slate-700` 인라인 label | ~25 files | P1 — FormField 확대 |
| ConfirmModal 사용처 | 0 | Done |
| parent local StatCard | 0 | Done |

---

## 4. KEEP / MERGE / DEPRECATE

| 대상 | 판정 |
|---|---|
| ModuleAppShell, PageHeader, EmptyState, FilterBar, SearchField, SegmentedControl | KEEP |
| Modal | KEEP (신규 overlay 기준) |
| ConfirmDialog | KEEP (Modal 기반) |
| ConfirmModal | DEPRECATE → **삭제됨** |
| ToastContainer | KEEP |
| Toast.tsx | DEPRECATE → **삭제됨** |
| StatCard (shared) | KEEP (Director KPI) |
| SummaryMetricCard | KEEP (요약 스트립) |
| parent local StatCard | REPLACE → **완료** |
| SettingsCard / FormField / density.ts | KEEP (+ 확대) |
| Button/Input/Card/Checkbox | 미도입 (인라인 허용) |

---

## 5. 향후 리팩터링 우선순위

### P0 — 완료

ConfirmModal, Toast.tsx, ConfirmDialog Modal화, parent StatCard.

### P1 (점진, 터치 시점만)

- raw card / raw form / raw modal
- PageHeader 미사용 관리 화면 (Dashboard·Schedule 예외는 허용)

### P2

- Button / Input / Checkbox / Card / Spinner Primitive
- Design Tokens CSS 변수화
- StorageService → Service 점진 이전

---

## 핵심

**이미 좋은 표준:** ModuleAppShell, density.ts, PageHeader(+compact), SegmentedControl hubs, Modal bottom-sheet, Toast/ConfirmDialog, slate+indigo+44px.

**금지:** 전수 치환, 새 디자인 시스템 발명. 규범은 Standards 1.0 문서군을 따른다.
