# Location-aware domain strategy

Organization(`organization_id`)은 테넌트 경계다. Location은 그 아래 영업 지점이다.
기존 Core 테이블에 `location_id`를 일괄 추가하지 않는다.

코드 출처: `src/core/locations/locationAware*.ts`  
DB helper: `core.assert_location_in_organization`, `core.location_aware_visible`

## 분류

| 범위 | entity | 현재 컬럼 | 의미 |
|------|--------|-----------|------|
| organization | customers | `organization_id`만 | 조직 공유 고객 |
| organization | products | `organization_id`만 | 상품 마스터 |
| organization | service_catalog | `organization_id`만 | 서비스 카탈로그 |
| organization | staff | `organization_id`만 | 직원 마스터 |
| organization | price_catalog | `organization_id`만 | 가격 마스터 일부 |
| location | visits | 없음 (개념만) | 지점 방문 |
| location | bookings | 없음 (개념만) | 지점 예약 |
| location | rooms / resources | 없음 (개념만) | 객실·자원 |
| location | sales | 없음 (개념만) | 지점 판매 |
| location | inventory | 없음 (개념만) | 지점 재고 |
| location | schedules | 없음 (개념만) | 지점 스케줄 |
| location | operational_tasks | 없음 (개념만) | 지점 운영 작업 |

분류는 설계 계약이다. `hasLocationColumn=false`인 기존 테이블은 스키마·조회·쓰기를 바꾸지 않는다.

## 신규 도메인 규칙

organization-scoped 신규 테이블:

* `organization_id NOT NULL` FK
* `location_id` 컬럼을 만들지 않는다

location-scoped 신규 테이블:

* `organization_id NOT NULL` FK (`core.organizations`)
* `location_id NOT NULL` FK (`core.locations`)
* 쓰기 전 `core.assert_location_in_organization(org, location, true)`
* `location_id`로 테넌트를 대체하지 않는다

## 기존 레코드 호환

1. `location_id` 컬럼이 없으면 조직 전체 데이터로 취급한다. 조회 동작을 바꾸지 않는다.
2. 나중에 특정 테이블만 마이그레이션할 때 `location_id`는 nullable로 시작한다.
3. `NULL` location은 “미배정/레거시”다. 지점 필터 시 `location_id = 선택값 OR location_id IS NULL`로 포함한다.
4. 선택 지점이 없으면 조직 전체(기존 화면과 동일).
5. 일괄 backfill·일괄 ALTER는 하지 않는다.

## 하지 않는 것

* 기존 Core 도메인 동작 변경
* customers/products/staff/sales/schedules 등에 `location_id` 일괄 추가
* 모든 RLS를 location 기준으로 재작성
