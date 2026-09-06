import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchAddressRequest {
  keyword: string;
  currentPage?: number;
  countPerPage?: number;
}

interface JusoApiResponse {
  results: {
    common: {
      errorCode: string;
      errorMessage: string;
      totalCount: string;
      currentPage: string;
      countPerPage: string;
    };
    juso?: Array<{
      roadAddr: string;
      jibunAddr: string;
      zipNo: string;
      admCd: string;
      bdNm: string;
      bdKdcd: string;
      siNm: string;
      sggNm: string;
      emdNm: string;
      liNm: string;
      rn: string;
      buldMnnm: string;
      buldSlno: string;
    }>;
  };
}

interface AddressSearchResult {
  roadAddr: string;
  jibunAddr: string;
  zipNo: string;
  fullAddress: string;
  region: string;
}

function validateKeyword(keyword: string): { valid: boolean; error?: string } {
  if (!keyword || !keyword.trim()) {
    return { valid: false, error: "검색어를 입력해 주세요." };
  }
  if (keyword.length < 2) {
    return { valid: false, error: "검색어는 2자 이상 입력해 주세요." };
  }
  if (keyword.length > 200) {
    return { valid: false, error: "검색어가 너무 깁니다." };
  }
  return { valid: true };
}

async function verifyAuth(req: Request): Promise<{ authorized: boolean; error?: string }> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return { authorized: false, error: "인증이 필요합니다." };
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return { authorized: false, error: "서버 설정 오류" };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return { authorized: false, error: "인증 확인 실패" };
    }

    return { authorized: true };
  } catch (e) {
    return { authorized: false, error: "인증 오류" };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authResult = await verifyAuth(req);
    if (!authResult.authorized) {
      return new Response(
        JSON.stringify({ error: authResult.error || "인증 실패" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = (await req.json()) as SearchAddressRequest;
    
    const validation = validateKeyword(payload.keyword);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const confmKey = Deno.env.get("JUSO_CONFM_KEY");
    if (!confmKey) {
      return new Response(
        JSON.stringify({ error: "주소 검색 서비스가 설정되지 않았습니다." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const currentPage = Math.max(1, Math.min(payload.currentPage || 1, 999));
    const countPerPage = Math.max(1, Math.min(payload.countPerPage || 20, 100));

    const apiUrl = new URL("https://business.juso.go.kr/addrlink/addrLinkApi.do");
    apiUrl.searchParams.set("confmKey", confmKey);
    apiUrl.searchParams.set("keyword", payload.keyword.trim());
    apiUrl.searchParams.set("currentPage", currentPage.toString());
    apiUrl.searchParams.set("countPerPage", countPerPage.toString());
    apiUrl.searchParams.set("resultType", "json");

    const jusoResponse = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!jusoResponse.ok) {
      return new Response(
        JSON.stringify({ error: "주소 검색 서비스 오류" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jusoData: JusoApiResponse = await jusoResponse.json();

    if (jusoData.results.common.errorCode !== "0") {
      return new Response(
        JSON.stringify({
          error: jusoData.results.common.errorMessage || "주소 검색 실패",
          errorCode: jusoData.results.common.errorCode,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: AddressSearchResult[] = (jusoData.results.juso || []).map((item) => {
      const region = [item.siNm, item.sggNm, item.emdNm].filter(Boolean).join(" ");
      return {
        roadAddr: item.roadAddr,
        jibunAddr: item.jibunAddr,
        zipNo: item.zipNo,
        fullAddress: item.roadAddr,
        region,
      };
    });

    return new Response(
      JSON.stringify({
        results,
        totalCount: parseInt(jusoData.results.common.totalCount) || 0,
        currentPage: parseInt(jusoData.results.common.currentPage) || 1,
        countPerPage: parseInt(jusoData.results.common.countPerPage) || 20,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Address search error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "알 수 없는 오류" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
