# 주소 검색 (도로명주소 API) 설정

이 문서는 행정안전부 도로명주소 검색 API를 MOA에서 사용하기 위한 설정 방법을 설명합니다.

## 개요

MOA는 사업장 주소 입력 시 행정안전부의 도로명주소 API([juso.go.kr](https://www.juso.go.kr))를 사용하여 정확한 주소 검색 기능을 제공합니다.

- **Edge Function**: `supabase/functions/search-address`
- **API 키 위치**: Supabase Function Secrets (`JUSO_CONFM_KEY`)
- **클라이언트**: `src/services/address/addressSearchService.ts`

## 1. API 키 발급

1. [도로명주소 개발자센터](https://www.juso.go.kr/addrlink/devAddrLinkRequestWrite.do)에서 API 신청
2. 승인 후 발급받은 승인키(confmKey)를 확인

## 2. Supabase Secrets 설정

API 키는 **절대 코드에 하드코딩하지 말고** Supabase Function Secrets로 관리합니다.

### 로컬 개발 환경

```bash
# supabase CLI로 secret 설정
supabase secrets set JUSO_CONFM_KEY="YOUR_ACTUAL_API_KEY_HERE"

# 확인
supabase secrets list
```

### 프로덕션 환경

Supabase Dashboard에서 설정:

1. Supabase Dashboard → Project Settings → Edge Functions
2. **Function Secrets** 섹션에서 `JUSO_CONFM_KEY` 추가
3. Value에 발급받은 승인키 입력

또는 CLI로:

```bash
# 프로덕션 프로젝트에 연결 후
supabase secrets set JUSO_CONFM_KEY="YOUR_ACTUAL_API_KEY_HERE" --project-ref your-project-ref
```

## 3. Edge Function 배포

```bash
# 주소 검색 함수 배포
supabase functions deploy search-address

# 전체 함수 배포
supabase functions deploy
```

## 4. 사용 방법

### 클라이언트에서 호출

```typescript
import { searchKoreanAddress } from '@/services/address/addressSearchService';

const results = await searchKoreanAddress({
  keyword: '판교역로 235',
  currentPage: 1,
  countPerPage: 20,
});

// results.results: 주소 배열
// results.totalCount: 전체 결과 수
```

### UI 컴포넌트 사용

```tsx
import { AddressSearchModal } from '@/shared/components/AddressSearchModal';

<AddressSearchModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSelect={(address) => {
    console.log(address.fullAddress); // "서울특별시 강남구 판교역로 235"
    console.log(address.zipNo);       // "13494"
  }}
/>
```

## 5. 통합된 컴포넌트

주소 검색은 다음 화면에 통합되어 있습니다:

- `src/core/auth/components/SignupBusinessFields.tsx` - 회원가입 시 사업장 주소
- `src/core/organizations/CreateOrganizationWizard.tsx` - 학원 등록 시 주소

## 6. API 응답 예시

```json
{
  "results": [
    {
      "roadAddr": "경기도 성남시 분당구 판교역로 235",
      "jibunAddr": "경기도 성남시 분당구 삼평동 681",
      "zipNo": "13494",
      "fullAddress": "경기도 성남시 분당구 판교역로 235",
      "region": "경기도 성남시 분당구"
    }
  ],
  "totalCount": 1,
  "currentPage": 1,
  "countPerPage": 20
}
```

## 7. 에러 처리

- `401`: 인증 실패 (JWT 토큰 없음/만료)
- `400`: 잘못된 검색어 (2자 미만, 200자 초과)
- `503`: API 키 미설정 (`JUSO_CONFM_KEY` 없음)
- `502`: 도로명주소 API 서버 오류

## 8. 주의사항

- **절대 API 키를 Git에 커밋하지 마세요**
- API 키는 Supabase Secrets로만 관리
- Edge Function은 인증된 사용자만 호출 가능 (JWT 필수)
- 로컬 테스트 시 `supabase secrets set` 명령으로 키 설정 필요

## 9. 문제 해결

### "주소 검색 서비스가 설정되지 않았습니다" 에러

→ `JUSO_CONFM_KEY` secret이 설정되지 않았습니다. 위 2번 항목 참고

### "인증이 필요합니다" 에러

→ 사용자가 로그인되지 않았거나 JWT 토큰이 만료되었습니다.

### API 키 갱신

API 키가 만료되거나 변경된 경우:

```bash
supabase secrets set JUSO_CONFM_KEY="NEW_API_KEY"
```

변경 후 Edge Function 재배포는 필요하지 않습니다 (Secrets는 런타임에서 읽음).

## 참고 자료

- [도로명주소 API 가이드](https://www.juso.go.kr/addrlink/devAddrLinkRequestGuide.do)
- [Supabase Edge Functions 문서](https://supabase.com/docs/guides/functions)
- [Supabase Secrets 관리](https://supabase.com/docs/guides/functions/secrets)
