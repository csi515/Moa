import type { ReactNode } from 'react';
import { Music, ShieldCheck } from 'lucide-react';
import { AUTH_COPY } from '../authUi';

/** 로그인·비밀번호 찾기 공통 레이아웃 (모바일 풀스크린 / 데스크탑 2열) */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] xl:grid-cols-[minmax(0,1.1fr)_minmax(0,32rem)]">
      <aside className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 text-white p-10 xl:p-14">
        <div>
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 rounded-2xl mb-8">
            <Music className="w-7 h-7" />
          </div>
          <h2 className="text-3xl xl:text-4xl font-black leading-tight">{AUTH_COPY.title}</h2>
          <p className="mt-4 text-indigo-100 text-sm xl:text-base leading-relaxed max-w-md">
            원·학원·스튜디오 운영과 학부모 연결을 한곳에서 관리합니다.
          </p>
        </div>
        <ul className="space-y-3 text-sm text-indigo-100/90">
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
            <span>조직별 데이터 분리 · 안전한 계정 로그인</span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
            <span>모바일·데스크탑 모두 최적화된 화면</span>
          </li>
        </ul>
      </aside>

      <div className="auth-page-shell flex flex-col justify-center overflow-y-auto overscroll-y-contain bg-gradient-to-b from-indigo-50 via-white to-slate-50">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col justify-center py-4 sm:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
