import brand from '../../../brand.json';

/** 앱 표시 이름 (스토어·런처·UI 공통) */
export const appBrand = {
  fullName:
    (import.meta.env.VITE_APP_NAME as string | undefined)?.trim() || brand.fullName,
  shortName:
    (import.meta.env.VITE_APP_SHORT_NAME as string | undefined)?.trim() || brand.shortName,
  tagline: brand.tagline,
  description: brand.description,
  legalEntityDefault: brand.legalEntityDefault,
} as const;

export function appManifestName(): string {
  return `${appBrand.fullName} — ${appBrand.tagline}`;
}

export function appPageTitle(suffix?: string): string {
  return suffix ? `${appBrand.fullName} — ${suffix}` : appBrand.fullName;
}
