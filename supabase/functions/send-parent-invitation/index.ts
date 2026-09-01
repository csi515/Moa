import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface LinkCode {
  token: string;
  student_name: string;
  customer_id?: string;
  expires_at?: string;
}

interface InvitePayload {
  organizationName: string;
  parentName: string;
  email: string;
  linkCodes: LinkCode[];
  appUrl?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildInviteUrl(appUrl: string, token: string): string {
  const base = appUrl.replace(/\/$/, "");
  return `${base}/?link=${encodeURIComponent(token)}`;
}

function buildEmailHtml(payload: InvitePayload): string {
  const appUrl = payload.appUrl || "https://moa.app";
  const primary = payload.linkCodes[0];
  const inviteUrl = primary ? buildInviteUrl(appUrl, primary.token) : appUrl;

  const codeList = payload.linkCodes
    .map(
      (c) =>
        `<li><strong>${c.student_name}</strong>: <code style="font-size:16px;letter-spacing:2px">${c.token}</code></li>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1e293b">
      <h2 style="color:#4f46e5">${payload.organizationName} 학부모 포털 초대</h2>
      <p>안녕하세요, <strong>${payload.parentName}</strong>님.</p>
      <p>${payload.organizationName}에서 학부모 포털 이용을 초대했습니다. 아래 링크로 가입·로그인 후 자녀 정보를 확인할 수 있습니다.</p>
      <p style="text-align:center;margin:24px 0">
        <a href="${inviteUrl}" style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold">
          학부모 포털 연결하기
        </a>
      </p>
      ${payload.linkCodes.length > 0 ? `<p>연결 코드:</p><ul>${codeList}</ul>` : ""}
      <p style="font-size:12px;color:#64748b">같은 이메일(${payload.email})로 가입하시면 자동 연결됩니다.</p>
    </div>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as InvitePayload;

    if (!payload.email || !payload.organizationName || !payload.parentName) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("INVITE_FROM_EMAIL") || "onboarding@resend.dev";

    if (!resendKey) {
      return new Response(
        JSON.stringify({
          email_sent: false,
          message: "RESEND_API_KEY not configured — copy link codes manually",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const primaryToken = payload.linkCodes[0]?.token;
    const appUrl = payload.appUrl || "https://moa.app";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.email],
        subject: `[${payload.organizationName}] 학부모 포털 초대`,
        html: buildEmailHtml(payload),
        text: [
          `${payload.organizationName} 학부모 포털 초대`,
          `${payload.parentName}님, 아래 링크로 연결해 주세요.`,
          primaryToken ? buildInviteUrl(appUrl, primaryToken) : appUrl,
          ...payload.linkCodes.map((c) => `${c.student_name}: ${c.token}`),
        ].join("\n"),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response(
        JSON.stringify({ email_sent: false, message: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ email_sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
