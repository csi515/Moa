export { IndustryAppRouter } from './IndustryAppRouter';
export { GenericIndustryShell } from './GenericIndustryShell';
export { IndustryPicker } from './IndustryPicker';
export {
  defineIndustryModule,
  getIndustryModule,
  listIndustryModules,
  INDUSTRY_MODULES,
  APP_BY_INDUSTRY,
} from './industryRegistry';
export type { IndustryModuleDefinition, IndustryAppComponent } from './industryRegistry';
export {
  defineIndustry,
  getIndustryDefinition,
  listIndustryDefinitions,
  getIndustryPlugin,
} from './industryCatalog';
