# CI Workflow Map

P21-2 이후 **현재** GitHub Actions 구조다. 보안 게이트 표는 [ci-security-gate.md](./architecture/ci-security-gate.md). BI catalog는 `scripts/businessInvariantTests.mjs`.

---

## 1. Workflow 목록

파일은 **1개**.

| Workflow | 파일 | 목적 |
| --- | --- | --- |
| CI/CD | `.github/workflows/ci-cd.yml` | Quality → Build & E2E → Security DB → Deploy |

`.github/workflows/quality.yml`은 삭제했다. 같은 이벤트에 quality가 두 번 돌지 않는다.

| 항목 | CI/CD |
| --- | --- |
| trigger | `push` / `pull_request` → `main` |
| concurrency | `ci-cd-${{ github.workflow }}-${{ github.ref }}` |
| cancel-in-progress | true |
| permissions | `contents: read` |
| Node | `.nvmrc` (22) |

---

## 2. Job graph

```text
quality
  lint + test:business-invariants + BI 밖 extras
     │
     ├─ build-e2e          needs: quality
     └─ security-db        needs: quality
                           if ENABLE_SECURITY_AUDIT=true
                                │
                                └─ deploy
                                   needs: [quality, build-e2e, security-db]
                                   if main push
                                      && ENABLE_VERCEL_DEPLOY=true
                                      && ENABLE_SECURITY_AUDIT=true
```

Job 수: **4**. `continue-on-error` 없음.

| Job | timeout | 의존 | 조건 |
| --- | --- | --- | --- |
| `quality` | 25m | — | 항상 |
| `build-e2e` | 30m | quality | quality 실패 시 skip |
| `security-db` | 15m | quality | `vars.ENABLE_SECURITY_AUDIT == 'true'` |
| `deploy` | 20m | quality + build-e2e + security-db | main + 두 variable |

---

## 3. Quality job 명령

비밀값 없음. Vite `build` 없음.

1. `npm ci`
2. `node scripts/check-ci-workflow-structure.mjs --self-test` — 단일 workflow, job graph, 중복 quality/lint/BI/build, deploy↔security-db
3. `npm run lint` — tsc, architecture, db-types, persistence-policy, migration-syntax. 하위 checker를 다시 호출하지 않음
4. `npm run test:business-invariants` — catalog 57개, fail-fast, 시작 시 catalog integrity

### BI에 없어 Quality extras로 유지

| script | 이유 |
| --- | --- |
| `test:bulk-import` | students import. 이전 CI/CD quality |
| `test:deeplink` | platform. 이전 CI/CD quality |
| `test:timetable-placement` | piano UI |
| `test:today-lesson-teacher` | piano UI |
| `test:manual-attendance-class` | academy UI |
| `test:textbook-core-sale-link` | piano commerce 연결 |
| `test:skin-retail-migrate` | skin migrate |
| `test:local-date` | shared date util |
| `test:consultation-today` | piano UI |
| `test:piano-expected-attendance` | piano UI |
| `test:lesson-homework-sync` | piano UI |
| `test:sync-persist-helpers` | persist helper. BI candidate |
| `test:commerce-barrel` | commerce-unit 전용. BI는 atomic만 |
| `test:commerce-revenue` | 〃 |
| `test:commerce-store-capability` | 〃 |
| `test:retail-revenue` | 〃 |
| `test:rls-member-scope-harden` | static security. BI 아님 |
| `test:retail-staff-sale-perm` | static security. BI 아님 |

`test:commerce-unit`은 돌리지 않는다. 안에 BI commerce atomic 6개가 있어 중복이다. barrel/revenue/store/retail만 extras로 남겼다.

---

## 4. Build & E2E

`needs: quality`. 변경 없음.

1. `npm ci`
2. `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` / `VITE_APP_URL` 존재 검사
3. `npm run build`
4. `npx playwright install --with-deps chromium`
5. `npm run test:e2e` (`E2E_EMAIL` / `E2E_PASSWORD` / `E2E_ORG_NAME`)
6. 실패 시 Playwright report artifact 7일

---

## 5. Security DB

`if: vars.ENABLE_SECURITY_AUDIT == 'true'`. live DB만. Quality로 옮기지 않음.

- PR + secrets 없음 → 감사 스킵. job 성공 ≠ audit PASS
- main + secrets 없음 → FAIL → deploy 불가
- secrets 있을 때: `test:rls-audit`, `test:booking-pass-atomic-db`, `test:rls-membership-escalation`, `test:auth-hijack-audit`

---

## 6. Deploy

조건 변경 없음.

- `github.event_name == 'push'` && `refs/heads/main`
- `vars.ENABLE_VERCEL_DEPLOY == 'true'`
- `vars.ENABLE_SECURITY_AUDIT == 'true'`
- `needs: [quality, build-e2e, security-db]`
- `vercel pull` → `vercel build --prod` → `vercel deploy --prebuilt --prod`

---

## 7. 검증 분류

| 분류 | 위치 |
| --- | --- |
| A. Static | quality `lint` |
| B. Unit / contract | quality BI + extras |
| C. Business invariants | quality `test:business-invariants` |
| D. DB security | security-db |
| E. Build / E2E | build-e2e |
| F. Deploy | deploy |

---

## 8. P21-2에서 제거한 중복

같은 이벤트에 Quality workflow + CI/CD quality가 병렬이던 구조를 없앴다.

Quality / 구 CI/CD quality에서 **BI가 이미 실행하던** step을 제거했다.

| 제거한 개별 실행 | 이제 실행하는 곳 |
| --- | --- |
| `test:finance` | BI |
| `test:commerce-unit` | BI atomics + extras 4개 |
| commerce barrel/revenue 재실행 (unit suite 직후) | extras 1회만 |
| `test:sale-return-points` | BI |
| `test:rls-membership-policy` | BI |
| `test:session-pass-org-integrity` | BI |
| `test:booking-pass-atomic-contract` | BI |
| `test:persist-policy` / `test:persist-schedules` | BI |
| attendance 3종 / `absence-notify` / `makeup-schedule-atomic` | BI |
| `test:pending-mutations` | BI |
| `test:permissions-invariant` / `test:authorization` / `test:org-access-invariant` | BI |
| Quality workflow의 `npm run build` | build-e2e만 |

`lint` 안의 architecture / db-types와 BI의 `test:architecture` / `check:db-types`는 남긴다. lint는 전체 static 묶음, BI self-test는 catalog 계약이다. 별도 workflow가 아니라 한 quality job 안의 한 번씩이다.

---

## 9. 각 job 책임

| Job | 책임 | 하지 않는 것 |
| --- | --- | --- |
| quality | static + 전체 BI + catalog 밖 extras | live DB, Playwright, Vercel, Vite build |
| build-e2e | VITE_* 있는 production build, Playwright | lint/BI 재실행 |
| security-db | live RLS/auth/DB IT | static RLS 재실행 |
| deploy | Vercel prebuilt production | 테스트 재실행 |

---

## 10. 구조 검사

`npm run check:ci-structure` (`scripts/check-ci-workflow-structure.mjs`). Quality job에서 `--self-test`로 실행한다. `lint`에는 넣지 않는다.

새 workflow를 `.github/workflows/`에 추가하면 이 검사가 실패한다. 중복 Quality / `npm run lint` 다중 job / Quality의 `npm run build` / BI catalog script를 extras로 재실행 / deploy의 security-db 우회 / `continue-on-error`는 허용하지 않는다.

## 11. Branch protection

삭제된 Quality workflow job 이름(`Lint, build, business invariants`)을 required check로 걸어 두었다면, 단일 `CI/CD` / `Quality` job으로 바꿔야 한다.
