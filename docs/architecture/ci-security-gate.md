# CI/CD security gate (2026-09-22)

## Dependency

```
quality (lint + unit + static security)
  ├─ build-e2e
  └─ security-db          # if ENABLE_SECURITY_AUDIT=true
deploy ← quality + build-e2e + security-db
         # main + ENABLE_VERCEL_DEPLOY + ENABLE_SECURITY_AUDIT
```

## Layers

| Layer | Job | Secrets | Fail → |
|-------|-----|---------|--------|
| Static | `quality` | 불필요 | CI FAIL (PR/main) |
| DB audit | `security-db` | RLS_AUDIT_* / AUTH_HIJACK_* | job FAIL → deploy 스킵 |
| Deploy gate | `deploy` | Vercel | security-db success 필수 |

`continue-on-error` 제거됨.

## PR without audit secrets

- Static security는 `quality`에서 강제
- `security-db`는 secrets 없으면 감사 스킵(성공) — dry-run으로 가짜 통과하지 않음
- main push + ENABLE_SECURITY_AUDIT: secrets 없으면 **FAIL** (배포 차단)

## Required Actions secrets (values never in YAML)

- Build: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_URL`
- DB audit: `RLS_AUDIT_ORG_A_ID`, `RLS_AUDIT_ORG_B_ID`, `RLS_AUDIT_STAFF_A_JWT`, `RLS_AUDIT_OWNER_A_JWT`, `RLS_AUDIT_PARENT_JWT`, `RLS_AUDIT_ATTACKER_JWT` (or staff JWT), `AUTH_HIJACK_USER_B_JWT`, `AUTH_HIJACK_PROVIDER_USER_ID`
- Deploy: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

Variables: `ENABLE_SECURITY_AUDIT`, `ENABLE_VERCEL_DEPLOY`
