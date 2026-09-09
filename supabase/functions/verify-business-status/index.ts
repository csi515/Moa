import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * 국세청 사업자등록 상태조회 프록시.
 * Secret: NTS_BUSINESS_SERVICE_KEY (디코딩된 일반 인증키)
 * POST https://api.odcloud.kr/api/nts-businessman/v1/status
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STATUS_URL = "https://api.odcloud.kr/api/nts-businessman/v1/status";

interface StatusItem {
  b_no?: string;
  b_stt?: string;
  b_stt_cd?: string;
  tax_type?: string;
  tax_type_cd?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!authHeader || !supabaseUrl || !supabaseAnonKey) {
      return json({ error: "인증이 필요합니다." }, 401);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return json({ error: "인증 확인 실패" }, 401);
    }

    const serviceKey = Deno.env.get("NTS_BUSINESS_SERVICE_KEY");
    if (!serviceKey) {
      return json({ error: "사업자 상태 조회가 설정되지 않았습니다." }, 503);
    }

    const payload = (await req.json()) as { businessNumber?: string };
    const businessNumber = digitsOnly(String(payload.businessNumber ?? ""));
    if (businessNumber.length !== 10 || /^0+$/.test(businessNumber)) {
      return json({ error: "사업자등록번호는 10자리 숫자여야 합니다.", active: false }, 400);
    }

    const params = new URLSearchParams();
    params.set("serviceKey", serviceKey);
    params.set("returnType", "JSON");

    const apiRes = await fetch(`${STATUS_URL}?${params.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ b_no: [businessNumber] }),
    });
    const raw = await apiRes.json().catch(() => null);
    if (!apiRes.ok || !raw) {
      return json({ error: "사업자 상태 조회에 실패했습니다.", active: false }, 502);
    }

    const item = (Array.isArray(raw.data) ? raw.data[0] : null) as StatusItem | null;
    const statusCode = String(item?.b_stt_cd ?? "");
    const statusName = String(item?.b_stt ?? "");
    const active = statusCode === "01";

    return json({
      active,
      businessNumber,
      statusCode,
      statusName,
      taxType: item?.tax_type ?? "",
      message: active
        ? "계속사업자입니다."
        : statusName || "국세청에 등록된 계속사업자가 아닙니다.",
    });
  } catch (error) {
    console.error("verify-business-status", error);
    return json({ error: "사업자 상태 조회 중 오류가 발생했습니다.", active: false }, 500);
  }
});
