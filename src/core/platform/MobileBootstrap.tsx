import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import {
  parseGuardianLinkFromUrl,
  storePendingGuardianLink,
} from '@/core/parent/services/guardianLinkService';
import { parseStaffLinkFromUrl, storePendingStaffLink } from './pendingStaffLink';
import { parseDeepLinksFromUrl } from './deepLinkParser';
import { isNativeApp } from './capacitorPlatform';

function applyDeepLinkFromString(url: string): void {
  const { staffLink, guardianLink } = parseDeepLinksFromUrl(url);
  if (staffLink) storePendingStaffLink(staffLink);
  if (guardianLink) storePendingGuardianLink(guardianLink);
}

/** 네이티브 앱 초기화: 상태바, 스플래시, 딥링크 */
export function MobileBootstrap() {
  useEffect(() => {
    if (!isNativeApp()) return;

    const initNative = async () => {
      try {
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#4f46e5' });
      } catch {
        /* 웹 빌드 번들 포함 시 무시 */
      }
      try {
        await SplashScreen.hide();
      } catch {
        /* ignore */
      }
    };

    void initNative();

    // 앱 cold start 시 현재 URL (커스텀 스킴/유니버설 링크)
    applyDeepLinkFromString(window.location.href);

    const listener = CapApp.addListener('appUrlOpen', (event) => {
      applyDeepLinkFromString(event.url);
    });

    return () => {
      void listener.then((l) => l.remove());
    };
  }, []);

  // 웹/PWA: URL 쿼리 파라미터 → pending 저장 (SupabaseAppGate와 동일 키)
  useEffect(() => {
    if (isNativeApp()) return;

    const staff = parseStaffLinkFromUrl();
    if (staff) storePendingStaffLink(staff);

    const guardian = parseGuardianLinkFromUrl();
    if (guardian) storePendingGuardianLink(guardian);
  }, []);

  return null;
}
