# Mobile cold start / lifecycle (2026-09-22)

## 흐름 (코드 기준)

```
App
├─ AuthProvider          getSession + onAuthStateChange
├─ OrganizationProvider  user → refreshOrganizations (membership / portal)
├─ AppProvider
│  └─ MobileBootstrap    네이티브 orchestration only
└─ SupabaseAppGate → StorageHydrator(org) → 셸
```

**Cold Start (native)**
1. Auth: `getSession`
2. Org: `refreshOrganizations`
3. MobileBootstrap: StatusBar/Splash → `getLaunchUrl` deep link → `startAutoRefresh`
4. StorageHydrate: org 선택 후
5. Push: `user` + `currentOrganization` 준비 시 `registerAppPush`
6. Deep link: launchUrl / `appUrlOpen` → pending staff/guardian

**Foreground**
`appStateChange(isActive)` → `startAutoRefresh` + 필요 시 `refreshSession` → `moa:mobile-foreground`
→ Org quiet refresh / offline quiet rehydrate / push re-register

**Background** → `stopAutoRefresh`

**Web** → `bootstrapWebDeepLinks`만 (변경 없음)

## 시나리오 점검

| # | 시나리오 | 결과 |
|---|----------|------|
| 1 | 최초 실행 | Auth loading → 로그인 UI; deep link pending 저장 |
| 2 | 로그인 상태로 실행 | session → org → hydrate → push |
| 3 | 로그아웃 후 재로그인 | clear org + push tokens; 재로그인 시 bootstrap |
| 4 | BG → FG | session refresh + quiet org + push; offline면 quiet hydrate |
| 5 | push token 변경 | `registration` listener → persist (lastUser/org) |
| 6 | deep link 재진입 | `appUrlOpen` → applyDeepLink |
| 7 | org 전환 | clearOrganization → hydrate remount; MobileBootstrap push org 갱신 |
| 8 | offline 실행 | hydrate offline snapshot; 배너 |
| 9 | network 복구 | native: `online` + foreground quiet rehydrate; outbox flush(기존) |
| 10 | 종료 후 deep link | `getLaunchUrl` + Auth/Org 재기동 |

## 책임 분리

| 모듈 | 책임 |
|------|------|
| MobileBootstrap | orchestration |
| mobileLifecycle | FG/BG, session, launchUrl, event |
| bootstrapDeepLinks | parse/store/notify |
| registerAppPush | token/permission |
| OrganizationProvider / StorageHydrator | foreground 반응 |

웹 경로·API는 유지. 새 라이브러리 없음.
