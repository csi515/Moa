import type { Page } from '@playwright/test';

/** src/shared/components/PwaInstallPrompt.tsx */
const PWA_INSTALLED_KEY = 'moa.pwa.installed';
const PWA_DISMISS_UNTIL_KEY = 'moa.pwa.dismissUntil';
/** src/core/organizations/services/organizationService.ts */
const ORG_ID_KEY = 'moa_current_organization_id';
/** src/services/adapters/storageKeys.ts */
const INITIALIZED_KEY = 'piano_app_initialized_v3';
const ONBOARDING_PROGRESS_KEY = 'piano_app_onboarding_progress_v1';

function seedBlockingUiDismissedInBrowser() {
  try {
    localStorage.setItem('moa.pwa.installed', '1');
    localStorage.setItem(
      'moa.pwa.dismissUntil',
      String(Date.now() + 365 * 24 * 60 * 60 * 1000)
    );
    const orgId = localStorage.getItem('moa_current_organization_id');
    const suffix = orgId ? `_${orgId}` : '';
    const progress = JSON.stringify({
      status: 'skipped',
      step: 0,
      updatedAt: new Date().toISOString(),
    });
    localStorage.setItem(`piano_app_initialized_v3${suffix}`, JSON.stringify(true));
    localStorage.setItem(`piano_app_onboarding_progress_v1${suffix}`, progress);
    localStorage.setItem('piano_app_initialized_v3', JSON.stringify(true));
    localStorage.setItem('piano_app_onboarding_progress_v1', progress);
  } catch {
    /* ignore */
  }
}

/**
 * 이후 모든 문서 로드에서 PWA 설치·온보딩 모달이 자동으로 뜨지 않게 한다.
 * localStorage.clear() 이후에도 다시 심으려면 이 스크립트를 clear 다음에 등록한다.
 */
export async function suppressE2eBlockingUi(page: Page) {
  await page.addInitScript(seedBlockingUiDismissedInBrowser);
}

/** 이미 열린 문서에 즉시 반영 (org 선택 직후 온보딩 키 포함) */
export async function seedE2eBlockingUiDismissed(page: Page) {
  await page.evaluate(seedBlockingUiDismissedInBrowser);
}

export const E2E_UI_STORAGE = {
  PWA_INSTALLED_KEY,
  PWA_DISMISS_UNTIL_KEY,
  ORG_ID_KEY,
  INITIALIZED_KEY,
  ONBOARDING_PROGRESS_KEY,
} as const;
