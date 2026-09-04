import type { CapacitorConfig } from '@capacitor/cli';
import brand from './brand.json';

/**
 * 모두의 아카데미 모아 — 웹/PWA + Android/iOS 네이티브 셸 공통 설정
 * webDir(dist)는 Vite 빌드 산출물과 동일합니다.
 */
const config: CapacitorConfig = {
  appId: 'com.moa.academy',
  appName: brand.fullName,
  webDir: 'dist',
  server: {
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
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
