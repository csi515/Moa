/**
 * Retail E2E 전용 인메모리 스토어 + Supabase REST/Auth 목킹.
 * 운영 DB에 의존하지 않는다. (e2e/helpers/mockPublicOrgApi.ts 패턴 확장)
 */
import type { Page, Route } from '@playwright/test';
import { randomUUID } from 'node:crypto';

export const RETAIL_E2E = {
  orgId: 'a1000000-0000-4000-8000-000000000001',
  orgName: '모아 E2E 소매점',
  owner: {
    id: 'b1000000-0000-4000-8000-000000000001',
    email: 'owner@e2e.retail.test',
    password: 'e2e-owner-pass',
    membershipId: 'c1000000-0000-4000-8000-000000000001',
  },
  customerUser: {
    id: 'b1000000-0000-4000-8000-000000000002',
    email: 'customer@e2e.retail.test',
    password: 'e2e-customer-pass',
    membershipId: 'c1000000-0000-4000-8000-000000000002',
  },
} as const;

type Row = Record<string, unknown>;

type Store = {
  tables: Record<string, Row[]>;
  currentUserId: string | null;
};

function uuid(): string {
  return randomUUID();
}

function nowIso(): string {
  return new Date().toISOString();
}

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function fakeAccessToken(userId: string, email: string): string {
  return `${b64url({ alg: 'none', typ: 'JWT' })}.${b64url({
    sub: userId,
    email,
    role: 'authenticated',
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  })}.e2e`;
}

function decodeUserId(authHeader: string | null): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) as {
      sub?: string;
    };
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

function createStore(): Store {
  const org: Row = {
    id: RETAIL_E2E.orgId,
    name: RETAIL_E2E.orgName,
    industry_type: 'retail',
    slug: 'e2e-retail',
    settings: {
      features: {
        points: { enabled: true, earnEnabled: true, earnRatePercent: 1 },
      },
    },
    is_active: true,
    public_code: 'RETAILE2E',
    biz_status: '01',
    biz_checked_at: nowIso(),
    business_registration_number: '000-00-00000',
    postal: null,
    sido: null,
    sigungu: null,
    dong: null,
    jibun: null,
    road_address: null,
    address_detail: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };

  const ownerMember: Row = {
    id: RETAIL_E2E.owner.membershipId,
    user_id: RETAIL_E2E.owner.id,
    organization_id: RETAIL_E2E.orgId,
    role: 'owner',
    staff_id: null,
    parent_customer_id: null,
    is_active: true,
  };

  const customerMember: Row = {
    id: RETAIL_E2E.customerUser.membershipId,
    user_id: RETAIL_E2E.customerUser.id,
    organization_id: RETAIL_E2E.orgId,
    role: 'customer',
    staff_id: null,
    parent_customer_id: null,
    is_active: true,
  };

  return {
    currentUserId: null,
    tables: {
      organizations: [org],
      organization_members: [ownerMember, customerMember],
      products: [],
      product_variants: [],
      product_categories: [],
      inventory: [],
      stock_movements: [],
      customers: [],
      customer_contacts: [],
      sales: [],
      sale_items: [],
      sale_returns: [],
      sale_return_items: [],
      point_accounts: [],
      point_transactions: [],
      staff: [],
      services: [],
      schedules: [],
      payments: [],
      payment_transactions: [],
      expenses: [],
      income_entries: [],
      teacher_payroll_settlements: [],
      consultations: [],
      notifications: [],
      attendance_sessions: [],
      parent_student_links: [],
      profiles: [
        {
          id: RETAIL_E2E.owner.id,
          email: RETAIL_E2E.owner.email,
          full_name: 'E2E Owner',
        },
        {
          id: RETAIL_E2E.customerUser.id,
          email: RETAIL_E2E.customerUser.email,
          full_name: 'E2E Customer',
        },
      ],
    },
  };
}

async function fulfillJson(route: Route, status: number, body: unknown, extraHeaders?: Record<string, string>) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
      ...extraHeaders,
    },
    body: body === undefined ? '' : JSON.stringify(body),
  });
}

function parseFilters(searchParams: URLSearchParams): Array<{
  col: string;
  op: string;
  value: string;
}> {
  const filters: Array<{ col: string; op: string; value: string }> = [];
  for (const [key, raw] of searchParams.entries()) {
    if (['select', 'order', 'limit', 'offset', 'or'].includes(key)) continue;
    const idx = raw.indexOf('.');
    if (idx < 0) continue;
    filters.push({ col: key, op: raw.slice(0, idx), value: raw.slice(idx + 1) });
  }
  return filters;
}

function matchFilter(row: Row, col: string, op: string, value: string): boolean {
  const cell = row[col];
  if (op === 'eq') return String(cell) === value;
  if (op === 'neq') return String(cell) !== value;
  if (op === 'is') {
    if (value === 'null') return cell == null;
    if (value === 'true') return cell === true;
    if (value === 'false') return cell === false;
  }
  if (op === 'gte') return String(cell) >= value;
  if (op === 'lte') return String(cell) <= value;
  if (op === 'gt') return String(cell) > value;
  if (op === 'lt') return String(cell) < value;
  if (op === 'in') {
    const inner = value.replace(/^\(/, '').replace(/\)$/, '');
    const parts = inner.split(',').map((p) => p.replace(/^"|"$/g, '').trim());
    return parts.includes(String(cell));
  }
  if (op === 'ilike') {
    const pattern = value.replace(/%/g, '.*').replace(/_/g, '.');
    return new RegExp(`^${pattern}$`, 'i').test(String(cell ?? ''));
  }
  return true;
}

function applyOrFilter(rows: Row[], orExpr: string | null): Row[] {
  if (!orExpr) return rows;
  // name.ilike.%x%,phone.ilike.%x%
  const parts = orExpr.split(',');
  return rows.filter((row) =>
    parts.some((part) => {
      const m = part.match(/^([^.]+)\.([^.]+)\.(.+)$/);
      if (!m) return false;
      return matchFilter(row, m[1], m[2], m[3]);
    })
  );
}

function applyFilters(rows: Row[], searchParams: URLSearchParams): Row[] {
  let next = [...rows];
  for (const f of parseFilters(searchParams)) {
    next = next.filter((row) => matchFilter(row, f.col, f.op, f.value));
  }
  next = applyOrFilter(next, searchParams.get('or'));
  const order = searchParams.get('order');
  if (order) {
    const [col, dir] = order.split('.');
    next.sort((a, b) => {
      const av = String(a[col] ?? '');
      const bv = String(b[col] ?? '');
      const cmp = av.localeCompare(bv, 'ko');
      return dir === 'desc' ? -cmp : cmp;
    });
  }
  const limit = searchParams.get('limit');
  if (limit) next = next.slice(0, Number(limit));
  return next;
}

function wantsSingle(headers: Record<string, string>): boolean {
  const accept = headers.accept || '';
  return accept.includes('vnd.pgrst.object');
}

function withEmbeds(store: Store, table: string, rows: Row[], select: string | null): Row[] {
  if (!select || !select.includes('organizations')) return rows;
  return rows.map((row) => {
    const orgId = String(row.organization_id ?? '');
    const org = store.tables.organizations.find((o) => o.id === orgId) ?? null;
    if (select.includes('organizations!inner') && !org) return null;
    return { ...row, organizations: org };
  }).filter(Boolean) as Row[];
}

function sessionFor(userId: string, email: string) {
  const access_token = fakeAccessToken(userId, email);
  return {
    access_token,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: `refresh-${userId}`,
    user: {
      id: userId,
      email,
      role: 'authenticated',
      aud: 'authenticated',
      app_metadata: { provider: 'email' },
      user_metadata: {},
      created_at: nowIso(),
    },
  };
}

function handleRpc(store: Store, name: string, body: Row | null): unknown {
  if (name === 'get_user_memberships') {
    const uid = store.currentUserId;
    if (!uid) return [];
    return store.tables.organization_members
      .filter((m) => m.user_id === uid && m.is_active !== false)
      .map((m) => {
        const org = store.tables.organizations.find((o) => o.id === m.organization_id);
        return {
          membership_id: m.id,
          organization_id: m.organization_id,
          role: m.role,
          staff_id: m.staff_id,
          parent_customer_id: m.parent_customer_id,
          is_current_context: false,
          organization_name: org?.name ?? '',
          organization_industry_type: org?.industry_type ?? 'retail',
          organization_slug: org?.slug ?? null,
          organization_settings: org?.settings ?? {},
          organization_is_active: org?.is_active ?? true,
          organization_public_code: org?.public_code ?? '',
        };
      });
  }
  if (name === 'set_active_membership' || name === 'clear_active_membership') {
    return null;
  }
  if (name === 'connect_staff_on_login') {
    return { connected: 0, memberships: [] };
  }
  if (name === 'connect_parent_on_login') {
    return { connected: 0, memberships: [] };
  }
  if (name === 'sync_auth_providers_on_login') {
    return { synced: 0 };
  }
  if (name === 'get_my_parent_portal_tree') {
    return { parent: null, children: [] };
  }
  if (name === 'ensure_global_parent_profile') {
    return null;
  }
  if (name === 'get_my_student_portal_context') {
    return { student: null, enrollments: [] };
  }
  if (name === 'ensure_guest_customer') {
    const orgId = String(body?.p_org_id ?? '');
    const nameVal = String(body?.p_name ?? '').trim();
    if (!nameVal) throw new Error('name is required');
    const phone = body?.p_phone ? String(body.p_phone) : null;
    const existing = store.tables.customers.find(
      (c) =>
        c.organization_id === orgId &&
        c.name === nameVal &&
        (phone == null || c.phone === phone)
    );
    if (existing) return existing.id;
    const id = uuid();
    store.tables.customers.push({
      id,
      organization_id: orgId,
      name: nameVal,
      phone,
      email: body?.p_email ? String(body.p_email) : null,
      status: 'active',
      user_id: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
    return id;
  }
  if (name === 'create_sale') {
    return handleCreateSaleRpc(store, body);
  }
  if (name === 'create_sale_return') {
    return handleCreateSaleReturnRpc(store, body);
  }
  return null;
}

/** core.create_sale 목 — 합산 검증 후 sales/items/movements/inventory를 원자적으로 반영 */
function handleCreateSaleRpc(store: Store, body: Row | null): unknown {
  const orgId = String(body?.p_organization_id ?? '');
  const customerId = body?.p_customer_id ? String(body.p_customer_id) : null;
  const paymentMethod = String(body?.p_payment_method ?? 'cash');
  const pointsUsed = Math.max(0, Math.floor(Number(body?.p_points_used) || 0));
  const items = Array.isArray(body?.p_items) ? (body!.p_items as Row[]) : [];
  if (!items.length) throw new Error('판매할 상품을 담아 주세요.');

  type Agg = { productId: string; variantId: string | null; required: number; label: string };
  const aggMap = new Map<string, Agg>();
  const normalized: Array<{
    product_id: string;
    variant_id: string | null;
    product_name_snapshot: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    line_amount: number;
  }> = [];

  let total = 0;
  for (const item of items) {
    const productId = String(item.product_id ?? '').trim();
    if (!productId) throw new Error('판매 상품이 없습니다.');
    const variantRaw = item.variant_id;
    const variantId =
      variantRaw == null || variantRaw === '' || variantRaw === 'null'
        ? null
        : String(variantRaw);
    const quantity = Number(item.quantity);
    const unitPrice = Number(item.unit_price);
    const discountAmount = Math.max(0, Number(item.discount_amount) || 0);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      throw new Error('수량은 1 이상의 정수여야 합니다.');
    }
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error('단가가 올바르지 않습니다.');
    }
    const product = store.tables.products.find(
      (p) => p.id === productId && p.organization_id === orgId
    );
    if (!product) throw new Error('product organization_id mismatch');
    if (variantId) {
      const variant = store.tables.product_variants.find((v) => v.id === variantId);
      if (!variant || String(variant.product_id) !== productId) {
        throw new Error('variant does not belong to product');
      }
    }
    const snapshot = String(item.product_name_snapshot ?? '').trim() || '상품';
    const lineAmount = Math.max(0, quantity * unitPrice - discountAmount);
    total += lineAmount;
    normalized.push({
      product_id: productId,
      variant_id: variantId,
      product_name_snapshot: snapshot,
      quantity,
      unit_price: unitPrice,
      discount_amount: discountAmount,
      line_amount: lineAmount,
    });
    const key = `${productId}::${variantId ?? '__none__'}`;
    const prev = aggMap.get(key);
    if (prev) prev.required += quantity;
    else {
      aggMap.set(key, {
        productId,
        variantId,
        required: quantity,
        label: snapshot,
      });
    }
  }

  if (pointsUsed > total) throw new Error('사용 포인트는 결제금액을 초과할 수 없습니다.');
  if (pointsUsed > 0 && !customerId) {
    throw new Error('포인트를 사용하려면 고객을 선택해 주세요.');
  }

  for (const agg of aggMap.values()) {
    const inv = store.tables.inventory.find(
      (r) =>
        r.organization_id === orgId &&
        r.product_id === agg.productId &&
        (agg.variantId
          ? r.variant_id === agg.variantId
          : r.variant_id == null || r.variant_id === '')
    );
    const available = Number(inv?.quantity ?? 0);
    if (available < agg.required) {
      throw new Error(
        `재고가 부족합니다: ${agg.label}(필요 ${agg.required}, 재고 ${available})`
      );
    }
  }

  const saleId = uuid();
  const createdAt = nowIso();
  store.tables.sales.push({
    id: saleId,
    organization_id: orgId,
    customer_id: customerId,
    total_amount: total,
    points_used: pointsUsed,
    payment_method: paymentMethod,
    status: 'completed',
    created_at: createdAt,
    updated_at: createdAt,
  });

  const itemRows = normalized.map((row) => {
    const id = uuid();
    const out = { id, sale_id: saleId, ...row };
    store.tables.sale_items.push(out);
    return out;
  });

  for (const row of normalized) {
    store.tables.stock_movements.push({
      id: uuid(),
      organization_id: orgId,
      product_id: row.product_id,
      variant_id: row.variant_id,
      movement_type: 'sale',
      quantity: -row.quantity,
      reference_type: 'sale',
      reference_id: saleId,
      reason: null,
      created_at: createdAt,
    });
  }

  for (const agg of aggMap.values()) {
    const inv = store.tables.inventory.find(
      (r) =>
        r.organization_id === orgId &&
        r.product_id === agg.productId &&
        (agg.variantId
          ? r.variant_id === agg.variantId
          : r.variant_id == null || r.variant_id === '')
    );
    if (!inv) throw new Error('재고가 부족합니다');
    inv.quantity = Number(inv.quantity) - agg.required;
    if (Number(inv.quantity) < 0) throw new Error('재고가 부족합니다');
    inv.updated_at = createdAt;
  }

  return {
    id: saleId,
    organization_id: orgId,
    customer_id: customerId,
    total_amount: total,
    points_used: pointsUsed,
    payment_method: paymentMethod,
    status: 'completed',
    created_at: createdAt,
    items: itemRows,
  };
}

/** core.create_sale_return 목 — 누적 반품 검증 후 returns/items/movements/inventory 원자 반영 */
function handleCreateSaleReturnRpc(store: Store, body: Row | null): unknown {
  const orgId = String(body?.p_organization_id ?? '');
  const saleId = String(body?.p_sale_id ?? '');
  const reason = body?.p_reason ? String(body.p_reason).trim() : null;
  const items = Array.isArray(body?.p_items) ? (body!.p_items as Row[]) : [];
  if (!orgId || !saleId) throw new Error('사업장·판매 정보가 필요합니다.');
  if (!items.length) throw new Error('반품할 상품을 선택해 주세요.');

  const sale = store.tables.sales.find(
    (s) => s.id === saleId && s.organization_id === orgId
  );
  if (!sale) throw new Error('판매 내역을 찾을 수 없습니다.');

  const qtyByItem = new Map<string, number>();
  for (const item of items) {
    const saleItemId = String(item.sale_item_id ?? '').trim();
    if (!saleItemId) throw new Error('원본 판매 상품을 찾을 수 없습니다.');
    const quantity = Math.floor(Number(item.quantity) || 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('반품 수량은 1 이상의 정수여야 합니다.');
    }
    qtyByItem.set(saleItemId, (qtyByItem.get(saleItemId) ?? 0) + quantity);
  }

  const existingReturns = store.tables.sale_returns.filter((r) => r.sale_id === saleId);
  const existingReturnIds = new Set(existingReturns.map((r) => r.id));
  const alreadyByItem = new Map<string, number>();
  for (const ri of store.tables.sale_return_items) {
    if (!existingReturnIds.has(String(ri.sale_return_id))) continue;
    const sid = String(ri.sale_item_id);
    alreadyByItem.set(sid, (alreadyByItem.get(sid) ?? 0) + Number(ri.quantity));
  }

  const prepared: Array<{
    sale_item_id: string;
    product_id: string | null;
    variant_id: string | null;
    product_name_snapshot: string;
    quantity: number;
    unit_price: number;
    line_amount: number;
  }> = [];
  let total = 0;

  for (const [saleItemId, quantity] of [...qtyByItem.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    const src = store.tables.sale_items.find(
      (si) => si.id === saleItemId && si.sale_id === saleId
    );
    if (!src) throw new Error('원본 판매 상품을 찾을 수 없습니다.');
    const soldQty = Number(src.quantity);
    const already = alreadyByItem.get(saleItemId) ?? 0;
    const remaining = soldQty - already;
    if (quantity > remaining) {
      throw new Error(
        `"${String(src.product_name_snapshot)}" 반품 가능 수량은 ${Math.max(0, remaining)}개입니다.`
      );
    }
    const unitPrice = Number(src.unit_price);
    const discountAmount = Number(src.discount_amount ?? 0);
    const proportionalDiscount =
      soldQty > 0 ? (Math.max(0, discountAmount) * quantity) / soldQty : 0;
    const lineAmount = Math.max(0, quantity * unitPrice - proportionalDiscount);
    total += lineAmount;
    prepared.push({
      sale_item_id: saleItemId,
      product_id: src.product_id == null ? null : String(src.product_id),
      variant_id: src.variant_id == null || src.variant_id === '' ? null : String(src.variant_id),
      product_name_snapshot: String(src.product_name_snapshot),
      quantity,
      unit_price: unitPrice,
      line_amount: lineAmount,
    });
  }

  const returnId = uuid();
  const createdAt = nowIso();
  store.tables.sale_returns.push({
    id: returnId,
    organization_id: orgId,
    sale_id: saleId,
    total_amount: total,
    reason: reason || null,
    created_at: createdAt,
  });

  const itemRows = prepared.map((row) => {
    const id = uuid();
    const out = { id, sale_return_id: returnId, ...row };
    store.tables.sale_return_items.push(out);
    return out;
  });

  const stockAgg = new Map<string, { productId: string; variantId: string | null; qty: number }>();
  for (const row of prepared) {
    if (!row.product_id) continue;
    store.tables.stock_movements.push({
      id: uuid(),
      organization_id: orgId,
      product_id: row.product_id,
      variant_id: row.variant_id,
      movement_type: 'return',
      quantity: row.quantity,
      reference_type: 'sale_return',
      reference_id: returnId,
      reason: null,
      created_at: createdAt,
    });
    const key = `${row.product_id}::${row.variant_id ?? '__none__'}`;
    const prev = stockAgg.get(key);
    if (prev) prev.qty += row.quantity;
    else {
      stockAgg.set(key, {
        productId: row.product_id,
        variantId: row.variant_id,
        qty: row.quantity,
      });
    }
  }

  for (const agg of stockAgg.values()) {
    let inv = store.tables.inventory.find(
      (r) =>
        r.organization_id === orgId &&
        r.product_id === agg.productId &&
        (agg.variantId
          ? r.variant_id === agg.variantId
          : r.variant_id == null || r.variant_id === '')
    );
    if (!inv) {
      inv = {
        id: uuid(),
        organization_id: orgId,
        product_id: agg.productId,
        variant_id: agg.variantId,
        quantity: 0,
        created_at: createdAt,
        updated_at: createdAt,
      };
      store.tables.inventory.push(inv);
    }
    inv.quantity = Number(inv.quantity) + agg.qty;
    inv.updated_at = createdAt;
  }

  return {
    id: returnId,
    organization_id: orgId,
    sale_id: saleId,
    total_amount: total,
    reason: reason || null,
    created_at: createdAt,
    items: itemRows,
  };
}

function tableMutateDefaults(table: string, row: Row): Row {
  const id = (row.id as string) || uuid();
  const ts = nowIso();
  const base: Row = { ...row, id, updated_at: ts };
  if (base.created_at == null || base.created_at === '') {
    base.created_at = ts;
  }
  if (table === 'products') {
    return {
      is_active: true,
      category_id: null,
      product_code: null,
      cost: null,
      image_url: null,
      ...base,
    };
  }
  if (table === 'inventory') {
    return { quantity: 0, variant_id: null, ...base };
  }
  if (table === 'point_accounts') {
    return { balance: 0, ...base };
  }
  if (table === 'sales') {
    return { status: 'completed', points_used: 0, ...base };
  }
  return base;
}

export type MockRetailApi = {
  store: Store;
  /** 판매로 만든 비회원 Customer를 일반 사용자 계정에 연결 (가입 연동 시뮬레이션) */
  linkCustomerToEndUser: (customerId: string) => void;
  getInventoryQty: (productId: string) => number;
  getPointBalance: (customerId: string) => number;
};

/**
 * Auth + core/piano REST를 가로채 Retail 운영 흐름을 인메모리로 처리한다.
 */
export async function mockRetailBackend(page: Page): Promise<MockRetailApi> {
  const store = createStore();
  const errors: string[] = [];

  const api: MockRetailApi = {
    store,
    linkCustomerToEndUser(customerId: string) {
      const row = store.tables.customers.find((c) => c.id === customerId);
      if (!row) throw new Error(`customer not found: ${customerId}`);
      row.user_id = RETAIL_E2E.customerUser.id;
    },
    getInventoryQty(productId: string) {
      const row = store.tables.inventory.find(
        (r) => r.product_id === productId && (r.variant_id == null || r.variant_id === '')
      );
      return Number(row?.quantity ?? 0);
    },
    getPointBalance(customerId: string) {
      const row = store.tables.point_accounts.find((r) => r.customer_id === customerId);
      return Number(row?.balance ?? 0);
    },
  };

  const isAuthUrl = (url: URL) => url.pathname.includes('/auth/v1/');
  const isRestUrl = (url: URL) => url.pathname.includes('/rest/v1/');

  await page.route(isAuthUrl, async (route) => {
    try {
      const req = route.request();
      if (req.method() === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*',
          },
        });
        return;
      }
      const url = new URL(req.url());
      const path = url.pathname;

      if (path.includes('/token') && req.method() === 'POST') {
        let email = '';
        let password = '';
        const ct = req.headers()['content-type'] || '';
        if (ct.includes('application/json')) {
          const body = req.postDataJSON() as { email?: string; password?: string };
          email = body.email ?? '';
          password = body.password ?? '';
        } else {
          const params = new URLSearchParams(req.postData() || '');
          email = params.get('email') || '';
          password = params.get('password') || '';
        }
        const users = [RETAIL_E2E.owner, RETAIL_E2E.customerUser];
        const user = users.find((u) => u.email === email && u.password === password);
        if (!user) {
          await fulfillJson(route, 400, {
            error: 'invalid_grant',
            error_description: 'Invalid login',
          });
          return;
        }
        store.currentUserId = user.id;
        await fulfillJson(route, 200, sessionFor(user.id, user.email));
        return;
      }

      if (path.endsWith('/user') && req.method() === 'GET') {
        const uid = decodeUserId(req.headers().authorization || null) ?? store.currentUserId;
        const users = [RETAIL_E2E.owner, RETAIL_E2E.customerUser];
        const user = users.find((u) => u.id === uid);
        if (!user) {
          await fulfillJson(route, 401, { message: 'unauthorized' });
          return;
        }
        store.currentUserId = user.id;
        await fulfillJson(route, 200, sessionFor(user.id, user.email).user);
        return;
      }

      if (path.includes('/logout')) {
        store.currentUserId = null;
        await fulfillJson(route, 204, null);
        return;
      }

      const uid = store.currentUserId ?? RETAIL_E2E.owner.id;
      const users = [RETAIL_E2E.owner, RETAIL_E2E.customerUser];
      const user = users.find((u) => u.id === uid)!;
      await fulfillJson(route, 200, sessionFor(user.id, user.email));
    } catch (err) {
      errors.push(`auth: ${err instanceof Error ? err.message : String(err)}`);
      await fulfillJson(route, 500, { message: 'mock auth error' });
    }
  });

  await page.route(isRestUrl, async (route) => {
    try {
      const req = route.request();
      if (req.method() === 'OPTIONS') {
        await route.fulfill({
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': '*',
          },
        });
        return;
      }

      const headers = req.headers();
      const authUid = decodeUserId(headers.authorization || null);
      if (authUid) store.currentUserId = authUid;

      const url = new URL(req.url());
      const parts = url.pathname.split('/').filter(Boolean);
      const restIdx = parts.indexOf('v1');
      const resource = parts[restIdx + 1] || '';

      const profile = (
        headers['accept-profile'] ||
        headers['content-profile'] ||
        'core'
      ).toLowerCase();

      // piano 스키마 hydrate — 빈 목록으로 성공 처리
      if (profile === 'piano') {
        if (req.method() === 'GET') {
          const single = wantsSingle(headers);
          if (single) {
            await fulfillJson(route, 406, {
              code: 'PGRST116',
              message: 'JSON object requested, multiple (or no) rows returned',
            });
            return;
          }
          await fulfillJson(route, 200, [], { 'Content-Range': '*/0' });
          return;
        }
        await fulfillJson(route, 201, []);
        return;
      }

      if (resource === 'rpc') {
        const rpcName = parts[restIdx + 2] || '';
        let body: Row | null = null;
        try {
          body = req.postDataJSON() as Row;
        } catch {
          body = null;
        }
        try {
          const result = handleRpc(store, rpcName, body);
          await fulfillJson(route, 200, result);
        } catch (err) {
          await fulfillJson(route, 400, {
            message: err instanceof Error ? err.message : 'rpc error',
          });
        }
        return;
      }

      if (!store.tables[resource]) {
        store.tables[resource] = [];
      }

      const select = url.searchParams.get('select');
      const single = wantsSingle(headers);

      if (req.method() === 'GET') {
        let rows = applyFilters(store.tables[resource], url.searchParams);
        rows = withEmbeds(store, resource, rows, select);
        if (single) {
          if (rows.length === 0) {
            await fulfillJson(route, 406, {
              code: 'PGRST116',
              message: 'JSON object requested, multiple (or no) rows returned',
            });
            return;
          }
          await fulfillJson(route, 200, rows[0], {
            'Content-Range': '0-0/1',
          });
          return;
        }
        const end = Math.max(0, rows.length - 1);
        await fulfillJson(route, 200, rows, {
          'Content-Range': rows.length === 0 ? '*/0' : `0-${end}/${rows.length}`,
        });
        return;
      }

      if (req.method() === 'POST') {
        let payload: Row | Row[] = [];
        try {
          payload = req.postDataJSON() as Row | Row[];
        } catch {
          payload = {};
        }
        const items = Array.isArray(payload) ? payload : [payload];
        const inserted = items.map((item) => {
          const row = tableMutateDefaults(resource, item);
          store.tables[resource].push(row);
          return row;
        });
        if (single) {
          await fulfillJson(route, 201, inserted[0]);
          return;
        }
        await fulfillJson(route, 201, inserted);
        return;
      }

      if (req.method() === 'PATCH' || req.method() === 'PUT') {
        let patch: Row = {};
        try {
          patch = req.postDataJSON() as Row;
        } catch {
          patch = {};
        }
        const matched = applyFilters(store.tables[resource], url.searchParams);
        const ids = new Set(matched.map((r) => r.id));
        store.tables[resource] = store.tables[resource].map((row) => {
          if (!ids.has(row.id)) return row;
          return { ...row, ...patch, updated_at: nowIso() };
        });
        const updated = store.tables[resource].filter((r) => ids.has(r.id));
        if (single) {
          await fulfillJson(route, 200, updated[0] ?? null);
          return;
        }
        await fulfillJson(route, 200, updated);
        return;
      }

      if (req.method() === 'DELETE') {
        const matched = applyFilters(store.tables[resource], url.searchParams);
        const ids = new Set(matched.map((r) => r.id));
        store.tables[resource] = store.tables[resource].filter((r) => !ids.has(r.id));
        await fulfillJson(route, 200, matched);
        return;
      }

      await fulfillJson(route, 200, []);
    } catch (err) {
      errors.push(`rest: ${err instanceof Error ? err.message : String(err)}`);
      // 핸들러 예외 시 실제 운영 API로 넘어가지 않도록 빈 성공 응답
      await fulfillJson(route, 200, []);
    }
  });

  return api;
}

/** 공개 상담 목과 동일 — 세션 클리어 후 시작 */
export async function clearBrowserAuth(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
}
