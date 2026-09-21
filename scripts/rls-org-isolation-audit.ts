/**
 * RLS org 격리 감사 러너
 *
 * 권한 우회·service role 사용자 테스트 없음.
 * anon key + 유저 JWT 로 PostgREST SELECT만 검증한다.
 *
 * 환경변수:
 *   SUPABASE_URL | VITE_SUPABASE_URL
 *   SUPABASE_ANON_KEY | VITE_SUPABASE_ANON_KEY
 *   RLS_AUDIT_ORG_A_ID, RLS_AUDIT_ORG_B_ID
 *   RLS_AUDIT_STAFF_A_JWT, RLS_AUDIT_OWNER_A_JWT, RLS_AUDIT_PARENT_JWT
 *   RLS_AUDIT_CUSTOMER_JWT (선택 — 일반 사용자 포인트 격리 R9)
 *   RLS_AUDIT_FOREIGN_CUSTOMER_ID (선택 — R9에서 연결되지 않은 customer id)
 *
 * 시드 ID가 없으면 dry-run으로 시나리오만 출력하고 exit 0.
 * 실행: npm run test:rls-audit
 *
 * Retail SELECT 정책 요약 (덮어쓰지 않음 — 감사만):
 *   products / inventory / stock_movements / sales
 *     → is_org_member(org) OR is_org_admin(org)
 *   product_variants / sale_items
 *     → 부모 행 org 멤버십
 *   point_accounts / point_transactions
 *     → is_my_customer OR has_any_org_role(owner|admin|manager|staff|instructor)
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface Scenario {
  id: string;
  title: string;
  run: () => Promise<{ ok: boolean; detail: string; skip?: boolean }>;
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

function core(client: SupabaseClient) {
  return client.schema('core');
}

/** OrgB 필터 SELECT → 0행이어야 PASS */
async function assertZeroByOrg(
  client: SupabaseClient,
  table: string,
  orgB: string
): Promise<{ ok: boolean; detail: string }> {
  const { data, error } = await core(client).from(table).select('id').eq('organization_id', orgB);
  if (error) return { ok: false, detail: error.message };
  const n = data?.length ?? 0;
  return { ok: n === 0, detail: `rows=${n}` };
}

async function main(): Promise<void> {
  const url = env('SUPABASE_URL') || env('VITE_SUPABASE_URL');
  const anonKey = env('SUPABASE_ANON_KEY') || env('VITE_SUPABASE_ANON_KEY');
  const orgA = env('RLS_AUDIT_ORG_A_ID');
  const orgB = env('RLS_AUDIT_ORG_B_ID');
  const staffJwt = env('RLS_AUDIT_STAFF_A_JWT');
  const ownerJwt = env('RLS_AUDIT_OWNER_A_JWT');
  const parentJwt = env('RLS_AUDIT_PARENT_JWT');
  const customerJwt = env('RLS_AUDIT_CUSTOMER_JWT');
  const foreignCustomerId = env('RLS_AUDIT_FOREIGN_CUSTOMER_ID');

  const scenarioTitles = [
    'S1 OrgA staff → OrgB customers = 0',
    'S2 OrgA staff → OrgB invoices = 0',
    'S3 Parent → unrelated OrgB customers = 0',
    'S4 OrgA owner → other org customers = 0',
    'R1 OrgA staff → OrgB products = 0',
    'R2 OrgA staff → OrgB product_variants (via products) = 0',
    'R3 OrgA staff → OrgB inventory = 0',
    'R4 OrgA staff → OrgB stock_movements = 0',
    'R5 OrgA staff → OrgB sales = 0',
    'R6 OrgA staff → OrgB sale_items (via sales) = 0',
    'R7 OrgA staff → OrgB point_accounts = 0',
    'R8 OrgA staff → OrgB point_transactions = 0',
    'R9 Customer → unlinked Customer points = 0',
  ];

  if (!url || !anonKey || !orgA || !orgB || !staffJwt || !ownerJwt || !parentJwt) {
    console.log('[rls-audit] dry-run — 시드/JWT 환경변수 미설정. 시나리오만 안내합니다.');
    for (const line of scenarioTitles) {
      console.log(`  ${line}`);
    }
    console.log('상세 SQL: supabase/tests/rls_org_isolation.sql');
    console.log('필요 env: SUPABASE_URL, SUPABASE_ANON_KEY, RLS_AUDIT_ORG_A_ID, RLS_AUDIT_ORG_B_ID,');
    console.log('         RLS_AUDIT_STAFF_A_JWT, RLS_AUDIT_OWNER_A_JWT, RLS_AUDIT_PARENT_JWT');
    console.log('선택 env: RLS_AUDIT_CUSTOMER_JWT, RLS_AUDIT_FOREIGN_CUSTOMER_ID (R9)');
    process.exit(0);
  }

  const staff = makeAuthedClient(staffJwt, url, anonKey);
  const owner = makeAuthedClient(ownerJwt, url, anonKey);
  const parent = makeAuthedClient(parentJwt, url, anonKey);

  const scenarios: Scenario[] = [
    {
      id: 'S1',
      title: 'OrgA staff cannot read OrgB customers',
      run: async () => assertZeroByOrg(staff, 'customers', orgB),
    },
    {
      id: 'S2',
      title: 'OrgA staff cannot read OrgB invoices',
      run: async () => assertZeroByOrg(staff, 'invoices', orgB),
    },
    {
      id: 'S3',
      title: 'Parent cannot read unrelated customers (cross-check via OrgB)',
      run: async () => assertZeroByOrg(parent, 'customers', orgB),
    },
    {
      id: 'S4',
      title: 'OrgA owner only sees own org customers',
      run: async () => {
        const { data, error } = await core(owner).from('customers').select('id, organization_id');
        if (error) return { ok: false, detail: error.message };
        const other = (data || []).filter((r) => r.organization_id !== orgA);
        return { ok: other.length === 0, detail: `other=${other.length} total=${data?.length ?? 0}` };
      },
    },

    // ----- Retail: Product / Inventory / Sale / Points -----
    {
      id: 'R1',
      title: 'OrgA staff cannot read OrgB products',
      run: async () => assertZeroByOrg(staff, 'products', orgB),
    },
    {
      id: 'R2',
      title: 'OrgA staff cannot read OrgB product_variants',
      run: async () => {
        const { data, error } = await core(staff)
          .from('product_variants')
          .select('id, products!inner(organization_id)')
          .eq('products.organization_id', orgB);
        if (error) return { ok: false, detail: error.message };
        const n = data?.length ?? 0;
        return { ok: n === 0, detail: `rows=${n}` };
      },
    },
    {
      id: 'R3',
      title: 'OrgA staff cannot read OrgB inventory',
      run: async () => assertZeroByOrg(staff, 'inventory', orgB),
    },
    {
      id: 'R4',
      title: 'OrgA staff cannot read OrgB stock_movements',
      run: async () => assertZeroByOrg(staff, 'stock_movements', orgB),
    },
    {
      id: 'R5',
      title: 'OrgA staff cannot read OrgB sales',
      run: async () => assertZeroByOrg(staff, 'sales', orgB),
    },
    {
      id: 'R6',
      title: 'OrgA staff cannot read OrgB sale_items',
      run: async () => {
        const { data, error } = await core(staff)
          .from('sale_items')
          .select('id, sales!inner(organization_id)')
          .eq('sales.organization_id', orgB);
        if (error) return { ok: false, detail: error.message };
        const n = data?.length ?? 0;
        return { ok: n === 0, detail: `rows=${n}` };
      },
    },
    {
      id: 'R7',
      title: 'OrgA staff cannot read OrgB point_accounts',
      run: async () => assertZeroByOrg(staff, 'point_accounts', orgB),
    },
    {
      id: 'R8',
      title: 'OrgA staff cannot read OrgB point_transactions',
      run: async () => assertZeroByOrg(staff, 'point_transactions', orgB),
    },
    {
      id: 'R9',
      title: 'End-user cannot read unlinked Customer retail points',
      run: async () => {
        if (!customerJwt) {
          return {
            ok: true,
            skip: true,
            detail: 'SKIP — set RLS_AUDIT_CUSTOMER_JWT (+ optional FOREIGN_CUSTOMER_ID)',
          };
        }
        const customer = makeAuthedClient(customerJwt, url, anonKey);

        // 연결되지 않은 customer_id가 주어지면 그 행만, 아니면 OrgB 전체 포인트
        if (foreignCustomerId) {
          const [accounts, txs] = await Promise.all([
            core(customer)
              .from('point_accounts')
              .select('id')
              .eq('customer_id', foreignCustomerId),
            core(customer)
              .from('point_transactions')
              .select('id')
              .eq('customer_id', foreignCustomerId),
          ]);
          if (accounts.error) return { ok: false, detail: accounts.error.message };
          if (txs.error) return { ok: false, detail: txs.error.message };
          const a = accounts.data?.length ?? 0;
          const t = txs.data?.length ?? 0;
          return {
            ok: a === 0 && t === 0,
            detail: `accounts=${a} txs=${t} customer=${foreignCustomerId}`,
          };
        }

        const [accounts, txs] = await Promise.all([
          assertZeroByOrg(customer, 'point_accounts', orgB),
          assertZeroByOrg(customer, 'point_transactions', orgB),
        ]);
        if (!accounts.ok) return accounts;
        if (!txs.ok) return txs;
        return {
          ok: true,
          detail: `OrgB accounts+txs isolated (${accounts.detail}, ${txs.detail})`,
        };
      },
    },
  ];

  let failed = 0;
  let skipped = 0;
  for (const s of scenarios) {
    const result = await s.run();
    if (result.skip) {
      console.log(`[SKIP] ${s.id} ${s.title} (${result.detail})`);
      skipped++;
      continue;
    }
    const mark = result.ok ? 'PASS' : 'FAIL';
    console.log(`[${mark}] ${s.id} ${s.title} (${result.detail})`);
    if (!result.ok) failed++;
  }

  if (failed > 0) {
    console.error(`[rls-audit] ${failed} scenario(s) failed`);
    process.exit(1);
  }
  console.log(
    `[rls-audit] all scenarios passed${skipped > 0 ? ` (${skipped} skipped)` : ''}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
