/**
 * Capacitor 패키징 (향후)
 *
 * 1. npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
 * 2. npm run build && npx cap init && npx cap add android && npx cap add ios
 * 3. npx cap sync
 *
 * Android: Device Owner / COSU 키오스크 — 앱이 홈/뒤로가기를 차단하지 않음
 * iOS/iPadOS: Guided Access 또는 MDM Single App Mode 권장
 *
 * 화면 유지: @capacitor-community/keep-awake → kioskPlatform.ts 연동
 */
const config = {
  appId: 'com.moa.attendance.kiosk',
  appName: 'Moa 출결',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'automatic',
    scrollEnabled: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {},
};

export default config;
