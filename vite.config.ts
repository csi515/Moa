import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    /**
     * 웹·Vercel·QR 딥링크(/c/:code/…)는 절대 경로(/)가 필요함.
     * base './' 이면 /c/.../consultation 진입 시 JS가 /c/.../assets/ 로 요청되어
     * 번들 로드 실패 → 흰 화면이 된다.
     * Capacitor(androidScheme: https)도 /assets 절대 경로를 사용한다.
     */
    base: '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
