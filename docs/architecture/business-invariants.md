# Business invariants ↔ tests

| Domain | Invariant | Test |
|--------|-----------|------|
| 예약/이용권 | 완료 1회 → 차감 1 | `test:booking-pass-atomic` |
| 예약/이용권 | 취소 1회 → 복구 1 | 〃 |
| 예약/이용권 | 완료 멱등 / 동시 2회 | 〃 (+ `test:session-pass-booking-rules`) |
| 예약/이용권 | 부족 → 완료 실패 | 〃 |
| 판매/재고 | 판매 전−수량=후 | `test:create-sale-atomic` |
| 판매/재고 | 반품 복구·중복 거부 | `test:create-sale-return-atomic` |
| 판매/재고 | 동시 판매 Isolation | `test:create-sale-atomic`, `test:stock-movement-atomic` |
| 포인트 | 적립·반품·멱등 잔액 | `test:point-balance-invariant` (+ `test:point-atomic`, `test:sale-return-points`) |
| 조직 | Org A≠B Isolation | `test:org-access-invariant` (+ `test:rls-audit`) |
| 권한 | unknown/customer fail-closed | `test:permissions-invariant` (+ `test:multi-role-helpers`) |
| 권한 | Role+Permission+Scope 호환 | `test:authorization` (+ `test:permissions-invariant`) |
| 권한 | membership 승격 불가 | `test:rls-membership-policy`, `test:rls-membership-escalation` |
| 지점 | LocationAware 분류·레거시 호환 | `test:location-aware` |
| 감사 | tenant audit allowlist·pilot | `test:audit` |
| 멱등 | org+key 재시도·payload mismatch | `test:idempotency` |
| Outbox | TX와 side effect 분리·중복 delivery | `test:outbox` |
| 데이터 | schedules 핵심필드 dual-read | `test:metadata-promotion` |

실행: `npm run test:business-invariants`
