# 로컬 테스트 가이드 (실제 API 키 없이)

이 가이드는 실제 juso.go.kr API 키 없이 주소 검색 기능을 로컬에서 테스트하는 방법을 설명합니다.

## 옵션 1: Mock API 응답으로 테스트

Edge Function에 임시 mock 응답을 추가하여 테스트할 수 있습니다.

### 1. Edge Function 수정 (임시)

`supabase/functions/search-address/index.ts`의 `Deno.serve` 함수 시작 부분에 다음 코드 추가:

```typescript
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // ⚠️ 임시 테스트용 Mock 응답 (실제 배포 시 제거)
  const USE_MOCK = Deno.env.get("USE_MOCK_JUSO") === "true";
  if (USE_MOCK) {
    const payload = await req.json() as SearchAddressRequest;
    return new Response(
      JSON.stringify({
        results: [
          {
            roadAddr: "경기도 성남시 분당구 판교역로 235",
            jibunAddr: "경기도 성남시 분당구 삼평동 681",
            zipNo: "13494",
            fullAddress: "경기도 성남시 분당구 판교역로 235",
            region: "경기도 성남시 분당구"
          },
          {
            roadAddr: "서울특별시 강남구 테헤란로 152",
            jibunAddr: "서울특별시 강남구 역삼동 737",
            zipNo: "06236",
            fullAddress: "서울특별시 강남구 테헤란로 152",
            region: "서울특별시 강남구"
          }
        ],
        totalCount: 2,
        currentPage: 1,
        countPerPage: 20,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  // 기존 코드 계속...
```

### 2. Secret 설정

```bash
supabase secrets set USE_MOCK_JUSO="true"
supabase secrets set JUSO_CONFM_KEY="dummy"  # 실제 키 없어도 OK
```

### 3. 테스트

- 앱에서 주소 검색 버튼 클릭
- 아무 검색어나 입력
- Mock 데이터가 표시되는지 확인

### 4. 배포 전 확인사항

⚠️ **중요**: 실제 배포 전에 Mock 코드를 완전히 제거하고 `USE_MOCK_JUSO` secret도 삭제하세요!

```bash
supabase secrets unset USE_MOCK_JUSO
```

## 옵션 2: 실제 API 키 발급

더 정확한 테스트를 위해 실제 API 키를 발급받는 것을 권장합니다:

1. [도로명주소 개발자센터](https://www.juso.go.kr/addrlink/devAddrLinkRequestWrite.do) 방문
2. 신청서 작성 (승인 보통 1-2일 소요)
3. 승인 후 발급받은 confmKey 사용:
   ```bash
   supabase secrets set JUSO_CONFM_KEY="실제_발급받은_키"
   ```

## 옵션 3: UI만 테스트

API 호출 없이 UI/UX만 확인하려면:

1. 주소 검색 버튼이 올바른 위치에 표시되는지
2. 모달이 정상적으로 열리고 닫히는지
3. 검색 입력 필드와 버튼이 작동하는지
4. 에러 메시지가 적절히 표시되는지

이 테스트는 API 키 없이도 가능합니다 (503 에러 확인).

## 주의사항

- Mock 코드는 **절대 프로덕션에 배포하지 마세요**
- 실제 배포 시에는 반드시 실제 API 키 사용
- Git commit 전에 임시 Mock 코드 제거 확인
