import { useMemo, useState, type FormEvent } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh } from '@/hooks';
import { useOrganization } from '@/core/organizations/OrganizationProvider';
import { StorageService } from '@/services/storage';
import { EmptyState, Modal, PageHeader } from '@/shared/components';
import { formatCurrency } from '@/utils/formatters';
import type { PaymentMethod, RetailProduct } from '@/types';
import * as orgService from '@/core/organizations/services/organizationService';

function saveCatalog(catalog: RetailProduct[]) {
  const settings = StorageService.updateSettings({ retailCatalog: catalog });
  return settings.retailCatalog || [];
}

export function SkinRetailView() {
  const { showToast } = useApp();
  const refreshKey = useStorageRefresh();
  const org = useOrganization();
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isSaleOpen, setIsSaleOpen] = useState(false);
  const [editing, setEditing] = useState<RetailProduct | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState(30000);
  const [stock, setStock] = useState(0);
  const [saleProductId, setSaleProductId] = useState('');
  const [saleQty, setSaleQty] = useState(1);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');

  const catalog = useMemo(
    () => StorageService.getSettings().retailCatalog || [],
    [refreshKey]
  );
  const customers = useMemo(
    () => StorageService.getStudents().filter((s) => s.status === 'active'),
    [refreshKey]
  );

  const persistRemote = async (next: RetailProduct[]) => {
    const orgId = org.currentOrganization?.id;
    if (!orgId) return;
    await orgService.updateOrganization(orgId, { settings: { retailCatalog: next } });
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPrice(30000);
    setStock(0);
    setIsProductOpen(true);
  };

  const saveProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const nextItem: RetailProduct = {
      id: editing?.id || crypto.randomUUID(),
      name: name.trim(),
      price,
      stock: Math.max(0, stock),
    };
    const next = editing
      ? catalog.map((item) => (item.id === editing.id ? nextItem : item))
      : [nextItem, ...catalog];
    saveCatalog(next);
    await persistRemote(next);
    setIsProductOpen(false);
    showToast(editing ? '상품이 수정되었습니다.' : '상품이 등록되었습니다.', 'success');
  };

  const sell = async (e: FormEvent) => {
    e.preventDefault();
    const product = catalog.find((item) => item.id === saleProductId);
    if (!product) {
      showToast('상품을 선택해 주세요.', 'warning');
      return;
    }
    if (saleQty < 1 || saleQty > product.stock) {
      showToast('재고가 부족합니다.', 'warning');
      return;
    }
    const customer = customers.find((c) => c.id === customerId);
    const amount = product.price * saleQty;
    const next = catalog.map((item) =>
      item.id === product.id ? { ...item, stock: item.stock - saleQty } : item
    );
    saveCatalog(next);
    StorageService.saveIncomeEntry({
      date: new Date().toISOString().slice(0, 10),
      category: 'product',
      amount,
      paymentMethod,
      description: `${product.name} ${saleQty}개`,
      payer: customer?.name,
      sourceType: 'retail',
      sourceId: product.id,
    });
    await persistRemote(next);
    setIsSaleOpen(false);
    showToast('판매가 등록되었습니다.', 'success');
  };

  return (
    <div className="space-y-4 pb-4">
      <PageHeader
        icon={<ShoppingBag className="w-5 h-5" />}
        iconClassName="text-rose-600"
        title="상품"
        description="화장품 등 판매 상품과 재고를 관리합니다"
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setSaleProductId(catalog[0]?.id || '');
                setSaleQty(1);
                setCustomerId('');
                setIsSaleOpen(true);
              }}
              className="px-3 py-2.5 min-h-[44px] bg-white border border-rose-200 text-rose-700 text-sm font-bold rounded-xl"
            >
              판매
            </button>
            <button
              type="button"
              onClick={openCreate}
              className="px-3 py-2.5 min-h-[44px] bg-rose-600 text-white text-sm font-bold rounded-xl"
            >
              + 상품
            </button>
          </div>
        }
      />

      {catalog.length === 0 ? (
        <EmptyState title="등록된 상품이 없습니다" description="판매할 상품을 먼저 등록해 주세요" />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {catalog.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="font-bold text-slate-900">{item.name}</p>
              <p className="text-sm text-slate-500 mt-1">
                {formatCurrency(item.price)} · 재고 {item.stock}
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditing(item);
                  setName(item.name);
                  setPrice(item.price);
                  setStock(item.stock);
                  setIsProductOpen(true);
                }}
                className="mt-2 text-xs font-bold text-rose-600 min-h-[44px]"
              >
                수정
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isProductOpen} onClose={() => setIsProductOpen(false)} title={editing ? '상품 수정' : '상품 등록'}>
        <form onSubmit={saveProduct} className="p-6 space-y-4">
          <label className="block text-xs font-semibold">
            상품명 *
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border rounded-xl min-h-[44px]"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-semibold">
              판매가
              <input
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="mt-1 w-full px-3 py-2 text-sm border rounded-xl min-h-[44px]"
              />
            </label>
            <label className="block text-xs font-semibold">
              재고
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(Number(e.target.value) || 0)}
                className="mt-1 w-full px-3 py-2 text-sm border rounded-xl min-h-[44px]"
              />
            </label>
          </div>
          <button type="submit" className="w-full py-2.5 bg-rose-600 text-white font-bold rounded-xl min-h-[44px]">
            저장
          </button>
        </form>
      </Modal>

      <Modal isOpen={isSaleOpen} onClose={() => setIsSaleOpen(false)} title="상품 판매">
        <form onSubmit={sell} className="p-6 space-y-4">
          <label className="block text-xs font-semibold">
            상품 *
            <select
              required
              value={saleProductId}
              onChange={(e) => setSaleProductId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border rounded-xl min-h-[44px]"
            >
              <option value="">선택</option>
              {catalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · 재고 {item.stock}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold">
            수량
            <input
              type="number"
              min={1}
              value={saleQty}
              onChange={(e) => setSaleQty(Number(e.target.value) || 1)}
              className="mt-1 w-full px-3 py-2 text-sm border rounded-xl min-h-[44px]"
            />
          </label>
          <label className="block text-xs font-semibold">
            고객
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-sm border rounded-xl min-h-[44px]"
            >
              <option value="">선택 안 함</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold">
            결제
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="mt-1 w-full px-3 py-2 text-sm border rounded-xl min-h-[44px]"
            >
              <option value="card">카드</option>
              <option value="cash">현금</option>
              <option value="transfer">계좌이체</option>
            </select>
          </label>
          <button type="submit" className="w-full py-2.5 bg-rose-600 text-white font-bold rounded-xl min-h-[44px]">
            판매 등록
          </button>
        </form>
      </Modal>
    </div>
  );
}
