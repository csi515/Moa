import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useStorageRefresh } from '@/hooks';
import { usePermissions } from '@/core/auth/usePermissions';
import { StorageService } from '@/services/storage';
import {
  ProductService,
  getProductModuleSettings,
  type Product,
  type ProductSale,
  type ProductTypeOption,
} from '@/core/products';
import {
  EmptyState,
  FilterTabs,
  Modal,
  PageHeader,
  SearchField,
  SummaryMetricCard,
  type FilterTabItem,
} from '@/shared/components';
import { formatCurrency } from '@/utils/formatters';
import {
  Package,
  Plus,
  Trash2,
  Pencil,
  ShoppingCart,
  BarChart3,
  Tags,
  AlertTriangle,
} from 'lucide-react';

type ProductTab = 'catalog' | 'sales' | 'report' | 'types';

export const ProductManagementView: React.FC = () => {
  const { showToast, openConfirmDialog } = useApp();
  const { industry } = usePermissions();
  const refreshKey = useStorageRefresh();
  const settings = StorageService.getSettings();
  const module = useMemo(
    () => getProductModuleSettings(settings, industry),
    [settings, industry, refreshKey]
  );
  const { labels, capabilities, productTypes } = module;

  const [tab, setTab] = useState<ProductTab>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  const [name, setName] = useState('');
  const [productType, setProductType] = useState(productTypes[0]?.id || 'other');
  const [sku, setSku] = useState('');
  const [salePrice, setSalePrice] = useState(30000);
  const [costPrice, setCostPrice] = useState(15000);
  const [stock, setStock] = useState(10);
  const [minStock, setMinStock] = useState(3);
  const [memo, setMemo] = useState('');

  const [saleProductId, setSaleProductId] = useState('');
  const [saleCustomerId, setSaleCustomerId] = useState('');
  const [saleQty, setSaleQty] = useState(1);
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [salePaid, setSalePaid] = useState(true);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));

  const [typeDraft, setTypeDraft] = useState<ProductTypeOption[]>(productTypes);
  const [newTypeLabel, setNewTypeLabel] = useState('');

  const products = useMemo(() => ProductService.getProducts(), [refreshKey]);
  const sales = useMemo(() => ProductService.getSales(), [refreshKey]);
  const stats = useMemo(() => ProductService.getStats(), [refreshKey]);
  const customers = StorageService.getStudents().filter((s) => s.status === 'active');

  const typeLabel = (id: string) =>
    productTypes.find((t) => t.id === id)?.label || id;

  const tabs: FilterTabItem<ProductTab>[] = [
    { id: 'catalog', label: labels.catalog },
    ...(capabilities.canSell ? [{ id: 'sales' as const, label: labels.sales }] : []),
    ...(capabilities.showReport ? [{ id: 'report' as const, label: labels.report }] : []),
    { id: 'types', label: '유형 설정' },
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (typeFilter !== 'ALL' && p.productType !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          (p.sku || '').toLowerCase().includes(q) ||
          typeLabel(p.productType).toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [products, typeFilter, searchQuery, productTypes]);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setProductType(productTypes[0]?.id || 'other');
    setSku('');
    setSalePrice(30000);
    setCostPrice(15000);
    setStock(10);
    setMinStock(3);
    setMemo('');
    setProductModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name);
    setProductType(p.productType);
    setSku(p.sku || '');
    setSalePrice(p.salePrice);
    setCostPrice(p.costPrice);
    setStock(p.stock);
    setMinStock(p.minStock);
    setMemo(p.memo || '');
    setProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!capabilities.canCreate && !editing) {
      showToast('이 매장에서는 상품 등록이 비활성화되어 있습니다.', 'warning');
      return;
    }
    if (editing && !capabilities.canEdit) {
      showToast('이 매장에서는 상품 수정이 비활성화되어 있습니다.', 'warning');
      return;
    }

    ProductService.saveProduct({
      id: editing?.id,
      name: name.trim(),
      productType,
      sku: sku.trim() || undefined,
      salePrice,
      costPrice,
      stock: capabilities.trackInventory ? stock : editing?.stock ?? 0,
      minStock: capabilities.trackInventory ? minStock : 0,
      isForSale: true,
      memo: memo.trim() || undefined,
    });
    showToast(editing ? `${labels.singular}이(가) 수정되었습니다.` : `${labels.singular}이(가) 등록되었습니다.`, 'success');
    setProductModalOpen(false);
  };

  const handleDeleteProduct = (p: Product) => {
    if (!capabilities.canDelete) {
      showToast('이 매장에서는 상품 삭제가 비활성화되어 있습니다.', 'warning');
      return;
    }
    openConfirmDialog({
      title: `${labels.singular} 삭제`,
      message: `'${p.name}'을(를) 삭제하시겠습니까?`,
      isDestructive: true,
      confirmText: '삭제',
      onConfirm: () => {
        ProductService.deleteProduct(p.id);
        showToast('삭제되었습니다.', 'info');
      },
    });
  };

  const openSale = (product?: Product) => {
    const target = product || ProductService.getForSaleProducts()[0];
    setSaleProductId(target?.id || '');
    setSaleCustomerId(customers[0]?.id || '');
    setSaleQty(1);
    setSaleDiscount(0);
    setSalePaid(true);
    setSaleDate(new Date().toISOString().slice(0, 10));
    setSaleModalOpen(true);
  };

  const handleSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capabilities.canSell) return;
    const product = products.find((p) => p.id === saleProductId);
    if (!product) {
      showToast(`${labels.singular}을(를) 선택해 주세요.`, 'warning');
      return;
    }
    if (capabilities.trackInventory && product.stock < saleQty) {
      showToast('재고가 부족합니다.', 'warning');
      return;
    }

    const customer = customers.find((c) => c.id === saleCustomerId);
    const unitPrice = product.salePrice;
    const totalAmount = Math.max(0, unitPrice * saleQty - saleDiscount);
    const paidAmount = salePaid ? totalAmount : 0;

    const sale = ProductService.saveSale(
      {
        productId: product.id,
        productName: product.name,
        customerId: customer?.id,
        customerName: customer?.name || '매장 판매',
        saleDate,
        quantity: saleQty,
        unitPrice,
        discount: saleDiscount,
        totalAmount,
        paidAmount,
        paymentMethod: salePaid ? 'card' : null,
      },
      { deductStock: capabilities.trackInventory }
    );

    if (salePaid && totalAmount > 0) {
      StorageService.saveIncomeEntry({
        date: saleDate,
        category: 'product',
        amount: totalAmount,
        description: `${product.name} × ${saleQty}`,
        payer: sale.customerName,
        paymentMethod: 'card',
        sourceType: 'manual',
        sourceId: sale.id,
      });
    }

    showToast('판매가 등록되었습니다.', 'success');
    setSaleModalOpen(false);
  };

  const handleDeleteSale = (sale: ProductSale) => {
    if (!capabilities.canDelete) {
      showToast('이 매장에서는 삭제가 비활성화되어 있습니다.', 'warning');
      return;
    }
    openConfirmDialog({
      title: '판매 기록 삭제',
      message: `${sale.productName} 판매 기록을 삭제하시겠습니까? 재고가 복구됩니다.`,
      isDestructive: true,
      confirmText: '삭제',
      onConfirm: () => {
        ProductService.deleteSale(sale.id);
        showToast('판매 기록이 삭제되었습니다.', 'info');
      },
    });
  };

  const persistTypes = (next: ProductTypeOption[]) => {
    const current = StorageService.getSettings();
    StorageService.saveSettings({
      ...current,
      features: {
        ...current.features,
        products: {
          ...current.features?.products,
          enabled: module.enabled,
          labels: module.labels,
          capabilities: module.capabilities,
          productTypes: next,
        },
      },
    });
    setTypeDraft(next);
    showToast('상품 유형이 저장되었습니다.', 'success');
  };

  const addType = () => {
    const label = newTypeLabel.trim();
    if (!label) return;
    const id = `custom_${Date.now()}`;
    persistTypes([...typeDraft, { id, label }]);
    setNewTypeLabel('');
  };

  const removeType = (id: string) => {
    if (typeDraft.length <= 1) {
      showToast('최소 1개의 유형이 필요합니다.', 'warning');
      return;
    }
    const used = products.some((p) => p.productType === id);
    if (used) {
      showToast('해당 유형을 사용하는 상품이 있어 삭제할 수 없습니다.', 'warning');
      return;
    }
    persistTypes(typeDraft.filter((t) => t.id !== id));
  };

  const renameType = (id: string, label: string) => {
    persistTypes(typeDraft.map((t) => (t.id === id ? { ...t, label } : t)));
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        icon={<Package className="w-6 h-6" />}
        iconClassName="text-amber-600"
        title={labels.catalog}
        description="매장별 상품 등록·판매·리포트 (유형과 권한은 설정에서 맞춤 가능)"
        actions={
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {capabilities.canSell && (
              <button
                type="button"
                onClick={() => openSale()}
                className="px-4 py-2.5 min-h-[44px] bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <ShoppingCart className="w-4 h-4" />
                판매 등록
              </button>
            )}
            {capabilities.canCreate && (
              <button
                type="button"
                onClick={openCreate}
                className="px-4 py-2.5 min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                {labels.singular} 등록
              </button>
            )}
          </div>
        }
      />

      {capabilities.showReport && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SummaryMetricCard
            label="등록 상품"
            value={`${stats.productCount}종`}
          />
          <SummaryMetricCard
            label="이번달 판매액"
            value={formatCurrency(stats.monthlySaleAmount)}
            variant="amber"
          />
          <SummaryMetricCard
            label="이번달 판매 수량"
            value={`${stats.monthlyUnitsSold}개`}
            variant="emerald"
          />
          <SummaryMetricCard
            label="재고 부족"
            value={`${stats.lowStockCount}종`}
            variant={stats.lowStockCount > 0 ? 'rose' : 'default'}
          />
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3">
        <FilterTabs tabs={tabs} active={tab} onChange={setTab} />
        {tab === 'catalog' && (
          <div className="flex flex-col sm:flex-row gap-2">
            <SearchField
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`${labels.singular}명, SKU 검색...`}
              className="w-full sm:flex-1"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 min-h-[44px] text-sm bg-slate-50 border border-slate-200 rounded-xl"
            >
              <option value="ALL">전체 유형</option>
              {productTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {tab === 'catalog' && (
        filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Package className="w-10 h-10" />}
            title={`등록된 ${labels.singular}이(가) 없습니다`}
            description="매장에서 판매할 상품을 등록해 주세요"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((p) => {
              const low = capabilities.trackInventory && p.stock <= p.minStock;
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                        {typeLabel(p.productType)}
                      </span>
                      <p className="font-bold text-slate-900 mt-2">{p.name}</p>
                      {p.sku && <p className="text-[11px] text-slate-400 font-mono">{p.sku}</p>}
                      <p className="text-sm text-slate-600 mt-1">
                        {formatCurrency(p.salePrice)}
                        {capabilities.trackInventory && (
                          <span className={`ml-2 text-xs font-bold ${low ? 'text-rose-600' : 'text-slate-500'}`}>
                            재고 {p.stock}
                            {low && ' · 부족'}
                          </span>
                        )}
                      </p>
                    </div>
                    {low && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                  </div>
                  <div className="flex gap-2">
                    {capabilities.canSell && (
                      <button
                        type="button"
                        onClick={() => openSale(p)}
                        className="flex-1 min-h-[44px] text-xs font-bold bg-amber-50 text-amber-800 rounded-xl"
                      >
                        판매
                      </button>
                    )}
                    {capabilities.canEdit && (
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-slate-200 rounded-xl text-slate-600"
                        aria-label="수정"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {capabilities.canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-slate-200 rounded-xl text-slate-400 hover:text-rose-600"
                        aria-label="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === 'sales' && (
        sales.filter((s) => s.status !== 'cancelled').length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="w-10 h-10" />}
            title="판매 기록이 없습니다"
            description="상품을 판매하면 여기에 표시됩니다"
          />
        ) : (
          <div className="space-y-2">
            {sales
              .filter((s) => s.status !== 'cancelled')
              .map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-bold text-sm text-slate-900">{s.productName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {s.saleDate} · {s.customerName} · {s.quantity}개 · {formatCurrency(s.totalAmount)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        s.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {s.status === 'paid' ? '완납' : s.status === 'partial' ? '일부' : '미납'}
                    </span>
                    {capabilities.canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSale(s)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600"
                        aria-label="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )
      )}

      {tab === 'report' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              {stats.yearMonth} 판매 TOP
            </h3>
            {stats.topProducts.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">이번 달 판매 데이터가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {stats.topProducts.map((item, i) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.quantity}개 판매</p>
                      </div>
                    </div>
                    <span className="font-black text-amber-800">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SummaryMetricCard
              label="수납액"
              value={formatCurrency(stats.monthlyPaidAmount)}
              variant="emerald"
            />
            <SummaryMetricCard
              label="미납액"
              value={formatCurrency(stats.totalUnpaidAmount)}
              variant="rose"
            />
          </div>
        </div>
      )}

      {tab === 'types' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Tags className="w-4 h-4 text-indigo-600" />
            이 매장의 상품 유형
          </h3>
          <p className="text-xs text-slate-500">
            업종·매장마다 다른 상품 분류를 직접 추가·이름 변경·삭제할 수 있습니다.
          </p>
          <div className="space-y-2">
            {typeDraft.map((t) => (
              <div key={t.id} className="flex items-center gap-2">
                <input
                  value={t.label}
                  onChange={(e) =>
                    setTypeDraft((prev) =>
                      prev.map((x) => (x.id === t.id ? { ...x, label: e.target.value } : x))
                    )
                  }
                  onBlur={(e) => {
                    if (e.target.value.trim() && e.target.value !== productTypes.find((p) => p.id === t.id)?.label) {
                      renameType(t.id, e.target.value.trim());
                    }
                  }}
                  className="flex-1 px-3 py-2 min-h-[44px] text-sm border border-slate-200 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => removeType(t.id)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:text-rose-600"
                  aria-label="유형 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newTypeLabel}
              onChange={(e) => setNewTypeLabel(e.target.value)}
              placeholder="새 유형 이름"
              className="flex-1 px-3 py-2 min-h-[44px] text-sm border border-slate-200 rounded-xl"
            />
            <button
              type="button"
              onClick={addType}
              className="px-4 min-h-[44px] bg-indigo-600 text-white text-sm font-bold rounded-xl"
            >
              추가
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editing ? `${labels.singular} 수정` : `${labels.singular} 등록`}
      >
        <form onSubmit={handleSaveProduct} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">이름 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">유형</label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              >
                {productTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">SKU</label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">판매가</label>
              <input
                type="number"
                min={0}
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">원가</label>
              <input
                type="number"
                min={0}
                value={costPrice}
                onChange={(e) => setCostPrice(Number(e.target.value))}
                className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              />
            </div>
          </div>
          {capabilities.trackInventory && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1">재고</label>
                <input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">최소 재고</label>
                <input
                  type="number"
                  min={0}
                  value={minStock}
                  onChange={(e) => setMinStock(Number(e.target.value))}
                  className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
                />
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1">메모</label>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 min-h-[44px] bg-amber-600 text-white font-bold rounded-xl text-sm"
          >
            저장
          </button>
        </form>
      </Modal>

      <Modal isOpen={saleModalOpen} onClose={() => setSaleModalOpen(false)} title={labels.sales}>
        <form onSubmit={handleSale} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1">{labels.singular} *</label>
            <select
              value={saleProductId}
              onChange={(e) => setSaleProductId(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              required
            >
              <option value="">선택</option>
              {ProductService.getForSaleProducts().map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({formatCurrency(p.salePrice)}
                  {capabilities.trackInventory ? ` · 재고 ${p.stock}` : ''})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">고객</label>
            <select
              value={saleCustomerId}
              onChange={(e) => setSaleCustomerId(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
            >
              <option value="">매장 판매(고객 미지정)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">수량</label>
              <input
                type="number"
                min={1}
                value={saleQty}
                onChange={(e) => setSaleQty(Number(e.target.value))}
                className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">할인</label>
              <input
                type="number"
                min={0}
                value={saleDiscount}
                onChange={(e) => setSaleDiscount(Number(e.target.value))}
                className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">판매일</label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 min-h-[44px] text-sm border rounded-xl"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 min-h-[44px]">
            <input
              type="checkbox"
              checked={salePaid}
              onChange={(e) => setSalePaid(e.target.checked)}
              className="rounded"
            />
            즉시 수납 완료
          </label>
          <button
            type="submit"
            className="w-full py-2.5 min-h-[44px] bg-amber-600 text-white font-bold rounded-xl text-sm"
          >
            판매 저장
          </button>
        </form>
      </Modal>
    </div>
  );
};
