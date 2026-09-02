import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Moa — 웹/PWA + Android/iOS 네이티브 셸 공통 설정
 * webDir(dist)는 Vite 빌드 산출물과 동일합니다.
 */
const config: CapacitorConfig = {
  appId: 'com.moa.academy',
  appName: 'Moa',
  webDir: 'dist',
  server: {
    // WebView에서 상대 경로·쿠키 동작 안정화
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#4f46e5',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#4f46e5',
    },
  },
};

export default config;
