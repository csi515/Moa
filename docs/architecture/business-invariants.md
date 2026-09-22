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
| 권한 | membership 승격 불가 | `test:rls-membership-policy`, `test:rls-membership-escalation` |

실행: `npm run test:business-invariants`
