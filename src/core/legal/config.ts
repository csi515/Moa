/** 스토어 심사·법적 고지용 설정 (빌드 시 env로 교체) */
export const legalConfig = {
  serviceName: 'Moa',
  legalEntityName:
    (import.meta.env.VITE_LEGAL_ENTITY_NAME as string | undefined)?.trim() || 'Moa',
  contactEmail:
    (import.meta.env.VITE_SUPPORT_EMAIL as string | undefined)?.trim() || 'support@moa.kr',
  privacyEffectiveDate: '2026-09-01',
  termsEffectiveDate: '2026-09-01',
} as const;
