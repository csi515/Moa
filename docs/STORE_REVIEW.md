# 스토어 심사 제출 가이드

Google Play · Apple App Store 심사 통과를 위한 체크리스트와 콘솔 입력 참고 자료입니다.

## 필수 공개 URL (프로덕션 배포 완료)

| 용도 | URL |
|------|-----|
| 개인정보처리방침 | `https://moa-academy.vercel.app/privacy` |
| 이용약관 | `https://moa-academy.vercel.app/terms` |
| 고객 지원 (Apple Support URL) | `https://moa-academy.vercel.app/support` |
| 마케팅 URL (선택) | `https://moa-academy.vercel.app` |

> **커스텀 도메인**: 조직 도메인 구매 시 위 URL을 `https://yourdomain.com`으로 교체 가능.

앱 내에서도 동일 경로로 접근 가능합니다.

---

## 심사용 데모 계정 (필수)

Play Console · App Store Connect **앱 검수 정보**에 아래 형식으로 제공하세요.

```
[원장/관리자 계정]
이메일: review-owner@YOUR_DOMAIN
비밀번호: (심사 전용 강력 비밀번호)
설명: 피아노학원 업종 데모 조직. 원생·출결·수납·강사 관리 가능.

[학부모 계정]
이메일: review-parent@YOUR_DOMAIN
비밀번호: (심사 전용 강력 비밀번호)
설명: 자녀 1명 연결됨. 출결 조회·출입 PIN 설정·계정 탈퇴 경로 확인 가능.

[강사 계정] (선택)
이메일: review-staff@YOUR_DOMAIN
비밀번호: (심사 전용 강력 비밀번호)
설명: 담당 반·출결 조회. 더보기 → 내 계정에서 탈퇴 가능.
```

### 심사 메모 (Review Notes) 예시

```
모두의 아카데미 모아는 학원·체육관·어린이집 운영자와 학부모를 위한 B2B SaaS입니다.

■ 계정 삭제 (Guideline 5.1.1)
- 원장/강사: 더보기 → 내 계정 → 계정 탈퇴
- 학부모: 포털 하단 계정 탈퇴
- 원장(owner)은 학원 데이터 보호를 위해 소유권 이전 후 탈퇴 필요

■ 카메라
- 학부모가 학원 QR 연결 코드 스캔 시에만 사용 (GuardianLinkQrScanner)

■ 로그인
- 이메일/비밀번호만 사용. 소셜 로그인 없음 → Sign in with Apple 불필요.

■ 오프라인
- 클라우드 기반. 오프라인 시 로그인·동기화 불가 (일부 로컬 캐시만).
```

---

## Apple App Privacy (설문 참고)

| 항목 | 답변 |
|------|------|
| 데이터 수집 | 예 |
| 추적(Tracking) | 아니오 |
| 제3자 광고 | 없음 |

### 수집 데이터 유형

| 데이터 | 수집 | 연결됨 | 추적 | 목적 |
|--------|------|--------|------|------|
| 이메일 | ✅ | ✅ | ❌ | 계정·인증 |
| 이름 | ✅ | ✅ | ❌ | 계정·프로필 |
| 전화번호 | ✅ | ✅ | ❌ | 원생·보호자 연락 (학원 입력) |
| 사용자 ID | ✅ | ✅ | ❌ | 계정 식별 |
| 사진/동영상 | 선택 | ✅ | ❌ | 연주 영상 등 (학원 기능 사용 시) |
| 사용 데이터 | ✅ | ✅ | ❌ | 출결·앱 활동 로그 |

`ios/App/App/PrivacyInfo.xcprivacy`에 기본 선언이 포함되어 있습니다.

### Export Compliance

`Info.plist`에 `ITSAppUsesNonExemptEncryption = false` 설정됨 (표준 HTTPS만 사용).

---

## Google Play Data Safety (설문 참고)

| 데이터 유형 | 수집/공유 | 목적 | 필수/선택 |
|-------------|-----------|------|-----------|
| 이메일 | 수집 | 계정 관리 | 필수 |
| 이름 | 수집 | 계정·학원 운영 | 필수 |
| 전화번호 | 수집 | 학원 CRM | 선택(학원 입력) |
| 앱 활동(출결 등) | 수집 | 앱 기능 | 필수 |
| 기기 ID | 수집 | 인증 세션 | 필수 |

| 항목 | 답변 |
|------|------|
| 데이터 암호화 전송 | 예 (HTTPS/TLS) |
| 데이터 삭제 요청 | 예 (앱 내 계정 탈퇴) |
| 계정 생성 필수 | 예 |

### 권한

| 권한 | 이유 |
|------|------|
| INTERNET | Supabase API·동기화 |
| CAMERA | 학부모 QR 연결 (선택 기능, `required=false`) |

---

## 출시 전 코드 체크리스트

- [ ] `VITE_APP_URL`, `VITE_SUPPORT_EMAIL`, `VITE_LEGAL_ENTITY_NAME` 프로덕션 값으로 빌드
- [ ] `npm run build:mobile` 성공
- [x] `/privacy`, `/terms`, `/support` 프로덕션 URL 200 응답 (Vercel 배포 확인됨)
- [ ] `.well-known` TEAMID·SHA256 실값 교체 (Apple Team ID 필요 — `docs/MOBILE.md` 참고)
- [x] Supabase Redirect URLs 등록 (로컬 + Vercel + 모바일 스킴)
- [ ] 심사용 데모 계정·조직 데이터 시드 (수동: owner + parent 계정 생성 및 시드 데이터 입력)
- [ ] 실기기: 로그인, QR, PIN, 계정 탈퇴, 법적 링크

---

## 앱 등록 정보 (카피 참고)

**짧은 설명 (80자)**  
학원·체육관·어린이집 원생·출결·수납·학부모 포털 통합 관리 (모두의 아카데미 모아)

**전체 설명**  
모두의 아카데미 모아는 교육 기관 운영자와 학부모를 위한 올인원 관리 앱입니다. 원생 등록, 출결·키패드 체크인, 수납, 강사 관리, 학부모 포털, 알림장 등을 하나의 앱에서 이용할 수 있습니다.

**카테고리**  
교육 (Education)

**콘텐츠 등급**  
전체 이용가 / Everyone (폭력·성적 콘텐츠 없음, 사용자 생성 콘텐츠: 학원 운영 데이터)

---

## 보안 강화 (Production 권장)

### Supabase 유출 비밀번호 보호

**요구사항**: Supabase Pro 플랜 ($25/월 이상)

HaveIBeenPwned 데이터베이스 연동으로 유출된 비밀번호 사용을 차단하는 [Leaked Password Protection](https://supabase.com/docs/guides/auth/passwords#leaked-password-protection) 기능.

**현재 상태**: Free 플랜이므로 비활성화됨. Pro 업그레이드 후 Dashboard → Authentication → Policies에서 활성화 가능.

자세한 내용: `docs/ENV_SETUP.md` 보안 강화 섹션 참고.

---

## 관련 문서

- `docs/MOBILE.md` — Capacitor 빌드·배포 절차
- `docs/ENV_SETUP.md` — 환경 변수 및 보안 설정
- `capacitor.config.ts` — `com.moa.academy`
