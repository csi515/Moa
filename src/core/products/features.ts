import type { IndustryType } from '@/core/industry/types';
import type { AcademySettings } from '@/types';
import type {
  ProductModuleCapabilities,
  ProductModuleLabels,
  ProductModuleSettings,
  ProductTypeOption,
} from './types';

const DEFAULT_CAPABILITIES: ProductModuleCapabilities = {
  canCreate: true,
  canEdit: true,
  canDelete: true,
  canSell: true,
  trackInventory: true,
  showReport: true,
};

const INDUSTRY_DEFAULTS: Record<
  IndustryType,
  { enabled: boolean; labels: ProductModuleLabels; productTypes: ProductTypeOption[] }
> = {
  piano: {
    enabled: false,
    labels: {
      catalog: '상품 관리',
      singular: '상품',
      sales: '상품 판매',
      report: '상품 리포트',
    },
    productTypes: [
      { id: 'accessory', label: '악세서리' },
      { id: 'gift', label: '선물/기념품' },
      { id: 'other', label: '기타' },
    ],
  },
  academy: {
    enabled: false,
    labels: {
      catalog: '학습 교재·문구',
      singular: '상품',
      sales: '상품 판매',
      report: '상품 리포트',
    },
    productTypes: [
      { id: 'workbook', label: '문제집/교재' },
      { id: 'stationery', label: '문구' },
      { id: 'other', label: '기타' },
    ],
  },
  pilates: {
    enabled: true,
    labels: {
      catalog: '상품 관리',
      singular: '상품',
      sales: '상품 판매',
      report: '상품 리포트',
    },
    productTypes: [
      { id: 'apparel', label: '의류' },
      { id: 'equipment', label: '소도구' },
      { id: 'supplement', label: '보충제/음료' },
      { id: 'other', label: '기타' },
    ],
  },
  skincare: {
    enabled: true,
    labels: {
      catalog: '홈케어 제품',
      singular: '제품',
      sales: '제품 판매',
      report: '제품 리포트',
    },
    productTypes: [
      { id: 'skincare', label: '스킨케어' },
      { id: 'device', label: '홈케어 기기' },
      { id: 'consumable', label: '소모품' },
      { id: 'other', label: '기타' },
    ],
  },
};

export function getDefaultProductSettings(industry: IndustryType): ProductModuleSettings {
  const defaults = INDUSTRY_DEFAULTS[industry] ?? INDUSTRY_DEFAULTS.piano;
  return {
    enabled: defaults.enabled,
    labels: { ...defaults.labels },
    productTypes: defaults.productTypes.map((t) => ({ ...t })),
    capabilities: { ...DEFAULT_CAPABILITIES },
  };
}

/** 설정 + 업종 기본값을 병합한 상품 모듈 설정 */
export function getProductModuleSettings(
  settings: AcademySettings | null | undefined,
  industry: IndustryType | string | null | undefined
): ProductModuleSettings {
  const industryType =
    industry === 'pilates' ||
    industry === 'skincare' ||
    industry === 'piano' ||
    industry === 'academy'
      ? industry
      : 'piano';
  const defaults = getDefaultProductSettings(industryType);
  const stored = settings?.features?.products;

  return {
    enabled: typeof stored?.enabled === 'boolean' ? stored.enabled : defaults.enabled,
    labels: {
      catalog: stored?.labels?.catalog || defaults.labels.catalog,
      singular: stored?.labels?.singular || defaults.labels.singular,
      sales: stored?.labels?.sales || defaults.labels.sales,
      report: stored?.labels?.report || defaults.labels.report,
    },
    productTypes:
      stored?.productTypes && stored.productTypes.length > 0
        ? stored.productTypes.map((t) => ({ id: t.id, label: t.label }))
        : defaults.productTypes,
    capabilities: {
      canCreate: stored?.capabilities?.canCreate ?? defaults.capabilities.canCreate,
      canEdit: stored?.capabilities?.canEdit ?? defaults.capabilities.canEdit,
      canDelete: stored?.capabilities?.canDelete ?? defaults.capabilities.canDelete,
      canSell: stored?.capabilities?.canSell ?? defaults.capabilities.canSell,
      trackInventory:
        stored?.capabilities?.trackInventory ?? defaults.capabilities.trackInventory,
      showReport: stored?.capabilities?.showReport ?? defaults.capabilities.showReport,
    },
  };
}

export function isProductModuleEnabled(
  settings: AcademySettings | null | undefined,
  industry: IndustryType | string | null | undefined
): boolean {
  return getProductModuleSettings(settings, industry).enabled;
}
