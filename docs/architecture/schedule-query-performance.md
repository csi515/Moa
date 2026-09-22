# Schedule 조회 성능 (2026-09-22)

핫패스: `getBookings().filter/sort` → 대시보드·슬롯 리스트 렌더.  
Domain Service는 **sync + local cache** 유지. Online도 hydrate snapshot 위에서 좁힌다.

## 1. getBookingsByDate / getUpcomingBookings

| | |
|---|---|
| **변경 전** | `getBookings()` 전체 → `.filter(date)` / `.filter(future).sort().slice(n)` |
| **변경 후** | `bookingQuery.filterBookingsByDate` / `selectUpcomingBookings` (top-N 삽입, 전체 sort 없음) |
| **왜** | 대시보드 limit 5~10에서 O(n log n) sort 제거 |
| **화면** | Pilates/Skin 대시보드, ScheduleService 호출부 |
| **Offline** | 동일 API · local SCHEDULES 스냅샷 |
| **Online DB?** | 보류. sync Domain Service + 전체 hydrate(과거 월·오프라인)와 충돌. 수만 건 시 hydrate 윈도우 재검토 |

## 2. 슬롯 정원 (occupancy index)

| | |
|---|---|
| **변경 전** | 슬롯마다 `bookings` 전체 스캔 → O(슬롯 × n) |
| **변경 후** | `buildSlotOccupancyIndex` 1회 + `getSlotCapacityInfo({ occupancyIndex })`; `getSlotCapacity`는 시각/서비스 윈도우만 전달 |
| **왜** | 캘린더·슬롯 리스트 렌더 비용 |
| **화면** | PilatesSlotList, BookingCalendarView(skin 리스트), PilatesDashboard |
| **Offline** | 인덱스도 캐시 배열 기준 — 동작 동일 |

## 3. listByCustomer / Skin 대시보드

| | |
|---|---|
| **변경 전** | UI/`getSessionPasses().filter(customer)`; Skin이 `getBookings()` 반복 호출 |
| **변경 후** | `sessionPassService.listByCustomer`; Skin은 `allBookingsRaw` 재사용 |
| **Offline** | 동일 |

## 테스트

```bash
npm run test:booking-query
npm run lint
```
