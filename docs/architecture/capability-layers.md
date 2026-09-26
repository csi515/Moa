# Core / Capability / Industry / Composition

계층 계약. 현재와 목표를 혼동하지 않는다. 검사: `scripts/check-architecture-dependencies.mjs`.

## 계층

| 계층 | 의미 | 현재 위치 | 목표 위치 |
| --- | --- | --- | --- |
| **Core** | 업종 독립 공통 기반 (테넌트, 인증, 조직, 권한) | `src/core` | `src/core` |
| **Capability** | 여러 업종이 선택적으로 쓰는 업무 기능 | attendance/billing/commerce/scheduling/booking은 `src/capabilities/<id>`. 나머지 manifest + Core 잔여/shim | `src/capabilities/<id>` |
| **Industry** | 특정 업종의 조합과 전용 기능 | 런타임 `src/industries/<id>`. `src/modules/{piano,…}`는 잔여 복제 | `src/industries/<id>` |
| **Composition** | registry / router / loader 조립 | 라이브 `src/app/industry`. `src/core/industry`는 카탈로그(Core) + pluginHost/Generic(**잔여**) | `src/app` |

`src/core/academy`는 **legacy aggregation layer**다. 장기 Core domain이 아니다.

학부모 포털은 `src/modules/parent`에 남긴다. 옮긴 Capability의 `src/core/<domain>`은 호환 re-export다.

## 의존 방향

허용:

- core → core
- capability → core
- industry → capability, core
- composition → industry, capability, core

금지:

- core → industry / modules / composition / capability
- capability → industry / modules

기존 Core→modules 위반은 LEGACY allowlist. 신규 위반은 CI 실패.

## Capability 패키지 (장기)

```text
src/capabilities/<id>/
  manifest.ts
  domain/
  application/
  ui/
  infrastructure/
  index.ts
```

`CapabilityDefinition`: id, displayName, dependencies, configurable, defaultEnabled, requiredPermissions.

Industry는 `defineIndustry({ capabilities, defaults })`로 capability를 선언한다. 중복 목록(APP_BY_INDUSTRY / INDUSTRY_PLUGINS / PUBLIC_SELECTABLE)을 다시 만들지 않는다.

persistence는 `src/capabilities/<id>/infrastructure/*Storage` facade를 쓰고, 레거시 `StorageService` 신규 import는 architecture checker가 막는다. StorageService mega-facade는 아직 유지한다.
