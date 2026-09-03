# 환경 변수 설정 가이드

## 개요

모아(Moa) 프로젝트는 Supabase 백엔드와 Vercel 프론트엔드를 사용합니다.  
환경 변수는 **절대 Git에 커밋하지 않으며**, 로컬 개발용과 프로덕션용을 분리하여 관리합니다.

## 로컬 개발 환경 설정

### 1단계: `.env.local` 파일 생성

```bash
cp .env.example .env.local
```

### 2단계: 실제 값으로 치환

`.env.local` 파일을 열고 다음 값을 설정합니다:

```bash
# Supabase 프로젝트 설정
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbG...실제_anon_key"

# 앱 URL (로컬 개발)
VITE_APP_URL="http://localhost:5173"

# 브랜드 정보 (필요시)
VITE_APP_NAME="모두의 아카데미 모아"
VITE_APP_SHORT_NAME="아카데미 모아"
VITE_SUPPORT_EMAIL="support@moa.kr"
VITE_LEGAL_ENTITY_NAME="모두의 아카데미 모아"
```

**주의**: `.env.local` 파일은 `.gitignore`에 의해 자동으로 Git에서 제외됩니다.

### 3단계: 개발 서버 실행

```bash
npm run dev
```

## 프로덕션 환경 (Vercel)

프로덕션 환경 변수는 **Vercel 대시보드**에서 설정합니다.

### Vercel 환경 변수 설정 방법

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택 (`moa-academy`)
3. **Settings** → **Environment Variables**로 이동
4. 다음 변수 추가:

| 변수명 | 값 | 환경 |
|--------|-----|------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT_REF.supabase.co` | Production |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...실제_anon_key` | Production |
| `VITE_APP_URL` | `https://moa-academy.vercel.app` | Production |
| `VITE_APP_NAME` | `모두의 아카데미 모아` | Production |
| `VITE_APP_SHORT_NAME` | `아카데미 모아` | Production |
| `VITE_SUPPORT_EMAIL` | `support@moa.kr` | Production |
| `VITE_LEGAL_ENTITY_NAME` | `모두의 아카데미 모아` | Production |

### CLI로 설정하는 방법 (선택 사항)

```bash
vercel env add VITE_SUPABASE_URL production
# 프롬프트에서 값 입력

vercel env add VITE_SUPABASE_ANON_KEY production
# 프롬프트에서 값 입력
```

## Supabase 설정

### Anon Key는 공개 키입니다

- `VITE_SUPABASE_ANON_KEY`는 클라이언트 측에서 사용되는 **공개 키**입니다
- Row Level Security (RLS) 정책으로 데이터 접근이 보호됩니다
- 하지만 **Git 저장소**에는 커밋하지 않아야 합니다
  - 배포 환경(Vercel)이 환경 변수의 **단일 진실 공급원(Single Source of Truth)** 이어야 합니다
  - Git 히스토리에 남으면 키 회전이 어렵습니다

### Supabase Auth Redirect URLs 설정

Supabase 대시보드에서 다음 URL을 허용해야 합니다:

1. Supabase Dashboard에서 프로젝트 선택 (Dashboard → 프로젝트)
2. **Authentication** → **URL Configuration**으로 이동
3. **Redirect URLs**에 추가:
   ```
   http://localhost:5173
   https://moa-academy.vercel.app
   com.moa.academy://login-callback
   ```

## 보안 주의사항

### ⚠️ 절대 커밋하지 말아야 할 파일

- `.env`
- `.env.local`
- `.env.production`
- `.env.development`

이 파일들은 모두 `.gitignore`에 의해 제외되지만, 실수로 강제 추가(`git add -f`)하지 마세요.

### ⚠️ Git 히스토리에 대한 참고사항

이 저장소의 **과거 커밋**에는 `.env.production` 파일이 포함되어 있을 수 있습니다.  
Git 히스토리 재작성은 협업에 영향을 주므로 수행하지 않았습니다.

**권장 조치**:
- 현재 Supabase anon key는 **공개 키**이므로 RLS가 활성화되어 있다면 즉시 회전할 필요는 없습니다
- 조직 보안 정책에 따라 키 회전이 필요한 경우:
  1. Supabase 대시보드에서 새 프로젝트 anon key 생성
  2. Vercel 환경 변수 업데이트
  3. 재배포
  
  **주의**: 키를 회전하면 기존 세션이 무효화될 수 있습니다.

## Edge Functions (Supabase)

이메일 발송 등을 위한 Edge Function 환경 변수는 **Supabase Secrets**로 관리합니다:

```bash
supabase secrets set RESEND_API_KEY="re_..."
supabase secrets set INVITE_FROM_EMAIL="모두의 아카데미 모아 <noreply@yourdomain.com>"
```

자세한 내용은 [Supabase Secrets 문서](https://supabase.com/docs/guides/functions/secrets)를 참고하세요.

## 보안 강화 (Production 권장)

### Supabase 유출 비밀번호 보호 (Leaked Password Protection)

**요구사항**: Supabase Pro 플랜 이상

Supabase의 [Leaked Password Protection](https://supabase.com/docs/guides/auth/passwords#leaked-password-protection)은 HaveIBeenPwned 데이터베이스와 연동하여 유출된 비밀번호 사용을 차단합니다.

**활성화 방법**:
1. Supabase Dashboard → 프로젝트 선택
2. **Authentication** → **Policies** → **Password Policy**
3. **Leaked Password Protection** 활성화

> **현재 상태**: 조직이 Free 플랜이므로 이 기능은 비활성화 상태입니다.  
> Pro 플랜 업그레이드 후 활성화를 권장합니다.

**대시보드 링크**: [Supabase Dashboard](https://supabase.com/dashboard/project/_/settings/auth)

## 문제 해결

### Q: `VITE_SUPABASE_URL` is undefined 오류

**원인**: `.env.local` 파일이 없거나 값이 설정되지 않음

**해결**:
```bash
cp .env.example .env.local
# .env.local 파일에 실제 값 입력
npm run dev  # 개발 서버 재시작
```

### Q: Vercel 배포 후 Supabase 연결 오류

**원인**: Vercel 환경 변수가 설정되지 않음

**해결**:
1. Vercel Dashboard → Settings → Environment Variables 확인
2. `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`가 Production 환경에 설정되어 있는지 확인
3. 재배포 (환경 변수 추가 후 재배포 필요)

### Q: 모바일 앱 OAuth redirect 오류

**원인**: Supabase Redirect URLs에 앱 URL이 등록되지 않음

**해결**:
1. Supabase Dashboard → Authentication → URL Configuration
2. `com.moa.academy://login-callback` 추가
3. 자세한 내용은 [MOBILE.md](./MOBILE.md) 참고

## 관련 문서

- [MOBILE.md](./MOBILE.md) - 모바일 앱 빌드 및 배포
- [STORE_REVIEW.md](./STORE_REVIEW.md) - 앱 스토어 제출 가이드
- [Vite 환경 변수 문서](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel 환경 변수 문서](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase 클라이언트 라이브러리 문서](https://supabase.com/docs/reference/javascript/initializing)
