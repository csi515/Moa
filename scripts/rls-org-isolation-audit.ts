/**
 * RLS org 격리 감사 러너
 *
 * 환경변수:
 *   VITE_SUPABASE_URL 또는 SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY (시드/검증용 — 로컬/CI 시크릿만)
 *   RLS_AUDIT_ORG_A_ID, RLS_AUDIT_ORG_B_ID
 *   RLS_AUDIT_STAFF_A_JWT, RLS_AUDIT_OWNER_A_JWT, RLS_AUDIT_PARENT_JWT
 *
 * 시드 ID가 없으면 dry-run으로 시나리오만 출력하고 exit 0.
 * 실행: npx tsx scripts/rls-org-isolation-audit.ts
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface Scenario {
  id: string;
  title: string;
  run: () => Promise<{ ok: boolean; detail: string }>;
}

function env(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function makeAuthedClient(jwt: string, url: string, anonKey: string): SupabaseClient {
  return createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function main(): Promise<void> {
  const url = env('SUPABASE_URL') || env('VITE_SUPABASE_URL');
  const anonKey = env('SUPABASE_ANON_KEY') || env('VITE_SUPABASE_ANON_KEY');
  const orgA = env('RLS_AUDIT_ORG_A_ID');
  const orgB = env('RLS_AUDIT_ORG_B_ID');
  const staffJwt = env('RLS_AUDIT_STAFF_A_JWT');
  const ownerJwt = env('RLS_AUDIT_OWNER_A_JWT');
  const parentJwt = env('RLS_AUDIT_PARENT_JWT');

  if (!url || !anonKey || !orgA || !orgB || !staffJwt || !ownerJwt || !parentJwt) {
    console.log('[rls-audit] dry-run — 시드/JWT 환경변수 미설정. 시나리오만 안내합니다.');
    console.log('  S1 OrgA staff → OrgB customers = 0');
    console.log('  S2 OrgA staff → OrgB invoices = 0');
    console.log('  S3 Parent → unrelated customer = 0');
    console.log('  S4 OrgA owner → other org customers = 0');
    console.log('상세 SQL: supabase/tests/rls_org_isolation.sql');
    console.log('필요 env: SUPABASE_URL, SUPABASE_ANON_KEY, RLS_AUDIT_ORG_A_ID, RLS_AUDIT_ORG_B_ID,');
    console.log('         RLS_AUDIT_STAFF_A_JWT, RLS_AUDIT_OWNER_A_JWT, RLS_AUDIT_PARENT_JWT');
    process.exit(0);
  }

  const staff = makeAuthedClient(staffJwt, url, anonKey);
  const owner = makeAuthedClient(ownerJwt, url, anonKey);
  const parent = makeAuthedClient(parentJwt, url, anonKey);

  const scenarios: Scenario[] = [
    {
      id: 'S1',
      title: 'OrgA staff cannot read OrgB customers',
      run: async () => {
        const { data, error } = await staff
          .schema('core')
          .from('customers')
          .select('id')
          .eq('organization_id', orgB);
        if (error) return { ok: false, detail: error.message };
        const n = data?.length ?? 0;
        return { ok: n === 0, detail: `rows=${n}` };
      },
    },
    {
      id: 'S2',
      title: 'OrgA staff cannot read OrgB invoices',
      run: async () => {
        const { data, error } = await staff
          .schema('core')
          .from('invoices')
          .select('id')
          .eq('organization_id', orgB);
        if (error) return { ok: false, detail: error.message };
        const n = data?.length ?? 0;
        return { ok: n === 0, detail: `rows=${n}` };
      },
    },
    {
      id: 'S3',
      title: 'Parent cannot read unrelated customers (cross-check via OrgB)',
      run: async () => {
        const { data, error } = await parent
          .schema('core')
          .from('customers')
          .select('id')
          .eq('organization_id', orgB);
        if (error) return { ok: false, detail: error.message };
        const n = data?.length ?? 0;
        return { ok: n === 0, detail: `rows=${n}` };
      },
    },
    {
      id: 'S4',
      title: 'OrgA owner only sees own org customers',
      run: async () => {
        const { data, error } = await owner.schema('core').from('customers').select('id, organization_id');
        if (error) return { ok: false, detail: error.message };
        const other = (data || []).filter((r) => r.organization_id !== orgA);
        return { ok: other.length === 0, detail: `other=${other.length} total=${data?.length ?? 0}` };
      },
    },
  ];

  let failed = 0;
  for (const s of scenarios) {
    const result = await s.run();
    const mark = result.ok ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${s.id} ${s.title} (${result.detail})`);
    if (!result.ok) failed++;
  }

  if (failed > 0) {
    console.error(`[rls-audit] ${failed} scenario(s) failed`);
    process.exit(1);
  }
  console.log('[rls-audit] all scenarios passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
