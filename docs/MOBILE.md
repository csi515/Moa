# 모두의 아카데미 모아 — 모바일 배포 가이드

웹(PWA) · Google Play · Apple App Store를 **하나의 React 코드베이스**로 운영합니다.

## 아키텍처

| 채널 | 기술 | 산출물 |
|------|------|--------|
| 웹 / PWA | Vite `dist/` + HTTPS 배포 | `manifest.json`, `sw.js` |
| Google Play | Capacitor Android | `android/` → AAB |
| App Store | Capacitor iOS | `ios/` → IPA (Mac + Xcode) |

앱 ID: `com.moa.academy`  
스토어 표시 이름: **모두의 아카데미 모아** (런처 짧은 이름: **아카데미 모아**)

---

## 개발 워크플로

```bash
# 1. 웹 빌드
npm run build:web

# 2. 네이티브 프로젝트에 동기화
npm run build:mobile   # build:web + cap sync

# 3. IDE에서 열기
npm run cap:android    # Android Studio
npm run cap:ios        # Xcode (macOS 필요)
```

코드 수정 후에는 항상 `npm run build:mobile`을 실행한 뒤 네이티브에서 다시 실행하세요.

---

## 환경 변수

`.env` (웹 빌드 시 번들에 포함):

| 변수 | 용도 |
|------|------|
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_APP_URL` | 초대 링크·OAuth redirect 기준 URL |
| `VITE_SUPPORT_EMAIL` | 개인정보처리방침·문의 이메일 |
| `VITE_LEGAL_ENTITY_NAME` | 법적 주체 명칭 (약관·개인정보처리방침) |

> 네이티브 앱은 빌드 시점에 env가 고정됩니다. 스토어용은 **프로덕션 값**으로 빌드하세요.

### 스토어 등록용 공개 URL

프로덕션 배포 완료 — Play Console / App Store Connect에 등록:

```
https://moa-academy.vercel.app/privacy   # 개인정보처리방침
https://moa-academy.vercel.app/terms     # 이용약관
https://moa-academy.vercel.app/support   # 고객 지원 (Apple Support URL)
```

> **커스텀 도메인**: 조직 도메인 구매 시 위 URL을 `https://yourdomain.com`으로 교체 가능.

자세한 심사 설문·데모 계정 템플릿: **`docs/STORE_REVIEW.md`**

### Supabase Auth Redirect URLs

Dashboard → Authentication → URL Configuration:

```
https://YOUR_PRODUCTION_DOMAIN
com.moa.academy://login-callback
```

---

## 딥링크 (초대·학부모 연결)

| 파라미터 | 예시 | 용도 |
|----------|------|------|
| `staff_link` | `?staff_link=AB12CD34` | 강사 계정 초대 |
| `link` | `?link=XY98ZW76` | 학부모·자녀 연결 |

### 커스텀 URL 스킴 (설정 완료)

```
moa://open?staff_link=AB12CD34
moa://open?link=XY98ZW76
```

### HTTPS 유니버설 링크 (선택 — 커스텀 도메인 사용 시)

1. `android/app/src/main/AndroidManifest.xml`의 HTTPS intent-filter 주석 해제 + 도메인 교체
   - 현재 `moa-academy.vercel.app` 예시로 준비됨 (커스텀 도메인으로 교체 권장)
2. `https://yourdomain.com/.well-known/assetlinks.json` 배포 (Android — **SHA256 필요**)
3. `https://yourdomain.com/.well-known/apple-app-site-association` 배포 (iOS — **Team ID 필요**)
4. Xcode → Signing & Capabilities → Associated Domains: `applinks:yourdomain.com`

> **요구사항**: Android SHA256 서명 + Apple Team ID 필요 — Play Console/Apple Developer 계정 필수.

---

## Google Play 스토어 체크리스트

### 계정·빌드
- [ ] Google Play Console 개발자 등록 ($25 1회)
- [ ] 앱 서명 키(Upload key / Play App Signing)
- [ ] `npm run build:mobile` 후 Android Studio에서 **AAB** 빌드
- [ ] `targetSdkVersion` 최신 요구사항 충족 (Android Studio 권장값 적용)

### 스토어 등록 정보
- [ ] 앱 이름: 모두의 아카데미 모아 (짧은 이름: 아카데미 모아)
- [ ] 짧은 설명 / 전체 설명 (한국어)
- [ ] 스크린샷 (휴대폰 최소 2장, 7인치 태블릿 권장)
- [x] 고해상도 아이콘 **512×512 PNG** (`npm run icons:generate` + `npm run icons:capacitor`)
- [ ] Feature graphic 1024×500

### 정책·법무
- [x] **개인정보처리방침 URL** — 앱 내 `/privacy` + 배포 URL 등록
- [x] **이용약관 URL** — 앱 내 `/terms`
- [x] **고객 지원 URL** — 앱 내 `/support` (Apple Support URL)
- [x] **비밀번호 찾기** — 로그인 화면
- [x] **회원가입 약관 동의** — 체크박스 필수
- [x] iOS Privacy Manifest — `PrivacyInfo.xcprivacy`
- [x] Export Compliance — `ITSAppUsesNonExemptEncryption = false`
- [ ] 데이터 안전성(Data safety) 설문 작성 → `docs/STORE_REVIEW.md` 참고
- [ ] 콘텐츠 등급 설문
- [ ] 계정 생성 앱 → **테스트 계정** 심사용 제공

### 기능 검증
- [ ] Supabase 로그인/회원가입
- [ ] 강사·학부모 초대 링크 (`staff_link`, `link`)
- [ ] QR 스캔 (카메라 권한)
- [ ] 오프라인 시 적절한 안내 (완전 오프라인 미지원)

---

## Apple App Store 체크리스트

### 계정·빌드
- [ ] Apple Developer Program ($99/년)
- [ ] **Mac + Xcode** (Linux CI만으로는 Archive 불가)
- [ ] `npm run build:mobile` → Xcode Archive → App Store Connect 업로드
- [ ] Bundle ID: `com.moa.academy`

### 스토어 등록 정보
- [ ] 앱 이름·부제·키워드·설명
- [ ] 스크린샷 (6.7", 6.5", 5.5" 등 필수 크기)
- [x] 앱 아이콘 1024×1024 PNG (`resources/icon.png` → `npm run icons:capacitor`)

### 정책·법무
- [x] **개인정보처리방침 URL** — 앱 내 `/privacy` + 배포 URL 등록
- [x] **고객 지원 URL** — `/support`
- [ ] App Privacy (데이터 수집 유형) 설문 → `docs/STORE_REVIEW.md` 참고
- [x] **계정 삭제** 경로 제공 — 더보기 > **내 계정** + 학부모 포털 하단 (`delete_my_account` RPC)
- [x] iOS Privacy Manifest (`PrivacyInfo.xcprivacy`)
- [ ] 심사용 **데모 계정** (원장 + 학부모 등) → `docs/STORE_REVIEW.md`

### iOS 특이사항
- [ ] Sign in with Apple (타사 소셜 로그인 추가 시 Apple 로그인도 필요할 수 있음)
- [ ] 카메라 사용 목적 문자열 (`NSCameraUsageDescription` — 설정됨)
- [ ] Safe area / 노치 대응 (`env(safe-area-inset-*)` — 적용됨)

---

## PWA (웹 설치) 체크리스트

- [ ] HTTPS 프로덕션 배포
- [ ] `VITE_APP_URL` = 실제 배포 URL
- [ ] Lighthouse PWA audit 통과 권장
- [x] PNG 아이콘 192/512 (`public/icons/`, `manifest.json` — `icons:capacitor` 후 `sync-pwa-manifest` 자동 복원)
- [x] `vercel.json` SPA rewrite + `.well-known` 템플릿 배포

---

## 앱 아이콘·스플래시 생성

```bash
npm run icons:generate    # public/icons + resources/icon.png
npm run icons:capacitor # android/ios 네이티브 에셋 동기화
```

`resources/splash.png` (2732×2732 권장) 수정 후 `icons:capacitor` 재실행.

---

## 플랫폼 분기 (코드)

```ts
import { isNativeApp, isWebApp, shareLink } from '@/core/platform';

if (isWebApp()) {
  // PWA 설치 버튼 등
}
```

- `PwaInstallPrompt` — 네이티브 앱에서 자동 숨김
- `MobileBootstrap` — 상태바·스플래시·딥링크 처리

---

## 출시 전 최종 확인

1. 프로덕션 Supabase + env로 `npm run build:mobile`
2. 실기기에서 로그인 → 조직 선택 → 출결/학생 CRUD
3. 초대 링크 실기기 테스트 (Android + iOS)
4. 개인정보처리방침·계정 삭제 페이지 URL 스토어에 등록
5. 내부 테스트(Play) / TestFlight(iOS) → 프로덕션 심사 제출

---

## 관련 파일

| 파일 | 설명 |
|------|------|
| `capacitor.config.ts` | Capacitor 앱 설정 |
| `android/` | Android Studio 프로젝트 |
| `ios/` | Xcode 프로젝트 |
| `src/core/platform/` | 네이티브/웹 분기·딥링크 |
| `src/core/legal/` | 개인정보처리방침·이용약관 페이지 |
| `src/core/account/` | 계정 탈퇴 UI |
| `public/manifest.json` | PWA 매니페스트 |
| `public/.well-known/` | Android App Links / iOS Universal Links 템플릿 |
| `vercel.json` | SPA 라우팅 + well-known 예외 |
