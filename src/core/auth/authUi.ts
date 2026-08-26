/** 로그인 화면 모드 */
export type AuthMode = 'login' | 'signup' | 'forgot' | 'update';

export const AUTH_INPUT_CLASS =
  'w-full min-h-[48px] pl-10 pr-4 py-3 text-base sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-300 focus:bg-white transition-colors';

export const AUTH_PRIMARY_BUTTON_CLASS =
  'w-full min-h-[48px] py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 touch-manipulation';

export const AUTH_LINK_BUTTON_CLASS =
  'inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 text-sm font-semibold text-indigo-600 hover:text-indigo-800 active:text-indigo-900 touch-manipulation';

export const AUTH_COPY = {
  title: '학원 관리 시스템',
  footer: '로그인하면 해당 Organization의 데이터만 접근할 수 있습니다.',
  subtitle: {
    login: '계정으로 로그인하세요',
    signup: '새 계정을 만들어 시작하세요',
    forgot: '가입 이메일로 재설정 링크를 보냅니다',
    update: '새 비밀번호를 설정해 주세요',
  },
  heading: {
    forgot: '비밀번호 찾기',
    update: '새 비밀번호 설정',
  },
  description: {
    forgot: '가입 시 사용한 이메일을 입력하면 재설정 링크를 보내 드립니다.',
    update: '메일 링크로 확인되었습니다. 아래에서 새 비밀번호를 입력하세요.',
  },
  submit: {
    login: '로그인',
    signup: '회원가입',
    forgot: '재설정 메일 보내기',
    update: '비밀번호 변경',
  },
  info: {
    resetSent: '비밀번호 재설정 링크를 이메일로 보냈습니다. 메일함(스팸함 포함)을 확인해 주세요.',
    passwordUpdated: '비밀번호가 변경되었습니다. 서비스를 이용할 수 있습니다.',
  },
  forgotLink: '비밀번호를 잊으셨나요?',
  backToLogin: '로그인으로 돌아가기',
  switchAccount: '다른 계정으로 로그인',
} as const;

export const MIN_PASSWORD_LENGTH = 6;
