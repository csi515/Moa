import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { applyDeepLinkFromString, bootstrapWebDeepLinks } from './bootstrapDeepLinks';
import { isNativeApp } from './capacitorPlatform';
import { registerAppPush } from '@/core/push';
import { getSession } from '@/core/auth/services/authService';
import { getOrganizationId } from '@/services/adapters/storageContext';
import { isSupabaseConfigured } from '@/lib/supabase';

/** 네이티브 앱 초기화: 상태바, 스플래시, 딥링크, 앱 푸시 */
export function MobileBootstrap() {
  useEffect(() => {
    if (!isNativeApp()) {
      bootstrapWebDeepLinks();
      return;
    }

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

      if (isSupabaseConfigured()) {
        try {
          const session = await getSession();
          const userId = session?.user?.id;
          if (userId) {
            await registerAppPush({
              userId,
              organizationId: getOrganizationId() || undefined,
            });
          }
        } catch {
          /* 푸시 미등록 시에도 포털 알림은 동작 */
        }
      }
    };

    void initNative();
    applyDeepLinkFromString(window.location.href);

    const listener = CapApp.addListener('appUrlOpen', (event) => {
      applyDeepLinkFromString(event.url);
    });

    return () => {
      void listener.then((l) => l.remove());
    };
  }, []);

  return null;
}
