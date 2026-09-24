# CI/CD security gate

## Node runtime

로컬과 GitHub Actions는 **Node.js 22** 를 사용한다 (`@supabase/supabase-js` 등 패키지 `engines.node >= 22`).

| 위치 | 계약 |
|------|------|
| `.nvmrc` | `22` (nvm / fnm / setup-node) |
| `package.json` `engines.node` | `>=22` |
| `.github/workflows/ci-cd.yml` | `NODE_VERSION: '22'`, `node-version-file: '.nvmrc'` |

CI는 `.nvmrc`를 읽어 Node를 설치한다. 로컬도 같은 파일을 따른다.

## Dependency

```
quality (lint + unit + static security)
  ├─ build-e2e          # needs: quality  → quality 실패 시 skip
  └─ security-db        # needs: quality  → quality 실패 시 skip
                        # if ENABLE_SECURITY_AUDIT=true
deploy ← needs quality + build-e2e + security-db
         # main + ENABLE_VERCEL_DEPLOY + ENABLE_SECURITY_AUDIT
         # security-db 실패면 deploy 실행 안 됨
```

## Layers

| Layer | Job | Secrets | Fail → |
|-------|-----|---------|--------|
| Static | `quality` | 불필요 | CI FAIL (PR/main). 아래 static step이 실제로 실행됨 |
| DB audit | `security-db` | RLS_AUDIT_* / AUTH_HIJACK_* | job FAIL → deploy 스킵 |
| Deploy gate | `deploy` | Vercel | `security-db` success 필수 |

`continue-on-error` 없음.

## Secret 부족 시

| 이벤트 | `ENABLE_SECURITY_AUDIT` | secrets | 결과 |
|--------|-------------------------|---------|------|
| PR | true | 없음 | 감사 **미실행**. job 성공은 DB audit PASS가 아님. static은 quality에서 이미 강제 |
| main push | true | 없음 | `security-db` **FAIL** → deploy 차단 |
| 아무 이벤트 | false | — | `security-db` skip, `deploy`도 skip (`ENABLE_SECURITY_AUDIT` 조건) |

## Required Actions secrets (values never in YAML)

- Build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`
- DB audit: `RLS_AUDIT_ORG_A_ID`, `RLS_AUDIT_ORG_B_ID`, `RLS_AUDIT_STAFF_A_JWT`, `RLS_AUDIT_OWNER_A_JWT`, `RLS_AUDIT_PARENT_JWT`, `RLS_AUDIT_ATTACKER_JWT` (or staff JWT), `AUTH_HIJACK_USER_B_JWT`, `AUTH_HIJACK_PROVIDER_USER_ID`
- Deploy: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

Variables: `ENABLE_SECURITY_AUDIT`, `ENABLE_VERCEL_DEPLOY`
