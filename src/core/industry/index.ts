/** Industry 공개 API — 앱/모듈은 가능하면 이 barrel을 사용 */
export type {
  IndustryType,
  ModuleIndustryId,
  IndustryDefinition,
  IndustryCategory,
  IndustryCategoryOption,
  IndustryOption,
} from './types';

export {
  INDUSTRY_IDS,
  INDUSTRY_DEFINITIONS,
  INDUSTRY_ALIASES,
  INDUSTRY_OPTIONS,
  INDUSTRY_CATEGORY_OPTIONS,
  MODULE_INDUSTRY_IDS,
  PUBLIC_SELECTABLE_INDUSTRY_IDS,
  normalizeIndustryType,
  getIndustryLabel,
  getIndustryCategoryLabel,
  getIndustryCategoryForType,
  getIndustryDefinition,
  isIndustryType,
  isModuleIndustryId,
  listIndustryDefinitions,
  listIndustriesByCategory,
  hasIndustryModule,
  shouldUseGenericShell,
  assertCatalogIntegrity,
} from './types';

export {
  getIndustryPlugin,
  listIndustryOptions,
  listIndustryIds,
  hasModulePlugin,
  INDUSTRY_PLUGINS,
} from './registry';

export { IndustryPicker } from './IndustryPicker';
export { IndustryAppRouter } from './IndustryAppRouter';
export { GenericIndustryShell } from './GenericIndustryShell';
