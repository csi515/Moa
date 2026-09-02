import { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { applyDeepLinkFromString, bootstrapWebDeepLinks } from './bootstrapDeepLinks';
import { isNativeApp } from './capacitorPlatform';

/** 네이티브 앱 초기화: 상태바, 스플래시, 딥링크 */
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
