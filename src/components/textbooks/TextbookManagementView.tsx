import React, { useState, useEffect } from 'react';
import {
  Textbook,
  TextbookSale,
  TextbookPayment,
  TextbookInventoryTransaction
} from '../../types';
import { StorageService } from '../../services/storage';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  ShoppingBag,
  CreditCard,
  History,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  PackagePlus,
  RotateCcw,
  FileText,
  DollarSign,
  TrendingUp,
  Boxes,
  Check,
  ChevronDown
} from 'lucide-react';

import { TextbookFormModal } from './TextbookFormModal';
import { NewSaleModal } from './NewSaleModal';
import { TextbookPaymentModal } from './TextbookPaymentModal';
import { StockAdjustModal } from './StockAdjustModal';
import { TextbookReceiptModal } from './TextbookReceiptModal';

type SubTab = 'inventory' | 'sales' | 'payments' | 'history';

export const TextbookManagementView: React.FC = () => {
  const { showConfirm, showToast, refreshKey, triggerRefresh } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('inventory');

  // Data states
  const [textbooks, setTextbooks] = useState<Textbook[]>([]);
  const [sales, setSales] = useState<TextbookSale[]>([]);
  const [payments, setPayments] = useState<TextbookPayment[]>([]);
  const [transactions, setTransactions] = useState<TextbookInventoryTransaction[]>([]);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingTextbook, setEditingTextbook] = useState<Textbook | null>(null);

  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleStudentId, setSaleStudentId] = useState<string | undefined>();
  const [saleTextbookId, setSaleTextbookId] = useState<string | undefined>();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<TextbookSale | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedTextbookForStock, setSelectedTextbookForStock] = useState<Textbook | null>(null);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptSale, setReceiptSale] = useState<TextbookSale | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<TextbookPayment | undefined>();

  // Filter & Search states for 1. Textbook Inventory
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [publisherFilter, setPublisherFilter] = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [sortOption, setSortOption] = useState<'price_asc' | 'price_desc' | 'stock_asc' | 'stock_desc' | 'title'>('title');

  // Filter & Search states for 2. Sales
  const [salesSearch, setSalesSearch] = useState('');
  const [salesStatusFilter, setSalesStatusFilter] = useState<'all' | 'unpaid' | 'partial' | 'paid'>('all');

  // Filter for 4. History
  const [historyFilterType, setHistoryFilterType] = useState('all');

  // Load Data
  const loadData = () => {
    setTextbooks(StorageService.getTextbooks());
    setSales(StorageService.getTextbookSales());
    setPayments(StorageService.getTextbookPayments());
    setTransactions(StorageService.getTextbookInventoryTransactions());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = StorageService.subscribe(loadData);
    return () => unsubscribe();
  }, [refreshKey]);

  // Statistics
  const currentYM = new Date().toISOString().slice(0, 7);
  const stats = StorageService.getTextbookStats(currentYM);

  // Filtered Textbooks
  const publishers = Array.from(new Set(textbooks.map((t) => t.publisher).filter(Boolean)));
  const levels = Array.from(new Set(textbooks.map((t) => t.level).filter(Boolean)));

  const filteredTextbooks = textbooks
    .filter((t) => {
      const matchQuery =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.author && t.author.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.isbn && t.isbn.includes(searchQuery)) ||
        (t.publisher && t.publisher.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchLevel = levelFilter === 'all' || t.level === levelFilter;
      const matchPublisher = publisherFilter === 'all' || t.publisher === publisherFilter;
      const matchLowStock = !onlyLowStock || t.stock <= t.minStock;

      return matchQuery && matchLevel && matchPublisher && matchLowStock;
    })
    .sort((a, b) => {
      const priceA = a.salePrice || a.price || 0;
      const priceB = b.salePrice || b.price || 0;
      if (sortOption === 'price_asc') return priceA - priceB;
      if (sortOption === 'price_desc') return priceB - priceA;
      if (sortOption === 'stock_asc') return a.stock - b.stock;
      if (sortOption === 'stock_desc') return b.stock - a.stock;
      return a.title.localeCompare(b.title, 'ko');
    });

  // Filtered Sales
  const filteredSales = sales.filter((s) => {
    const matchSearch =
      s.studentName.toLowerCase().includes(salesSearch.toLowerCase()) ||
      s.textbookTitle.toLowerCase().includes(salesSearch.toLowerCase()) ||
      (s.parentName && s.parentName.toLowerCase().includes(salesSearch.toLowerCase())) ||
      (s.parentPhone && s.parentPhone.includes(salesSearch));

    const matchStatus = salesStatusFilter === 'all' || s.status === salesStatusFilter;
    return matchSearch && matchStatus;
  });

  // Handlers
  const handleDeleteTextbook = (id: string, title: string) => {
    showConfirm({
      title: '교재 삭제 확인',
      message: `정말로 "${title}" 교재를 삭제하시겠습니까? 관련 판매 내역 데이터는 유지됩니다.`,
      confirmLabel: '삭제하기',
      isDestructive: true,
      onConfirm: () => {
        const ok = StorageService.deleteTextbook(id);
        if (ok) {
          showToast('교재가 삭제되었습니다.', 'info');
          triggerRefresh();
        }
      }
    });
  };

  const handleCancelSale = (sale: TextbookSale) => {
    showConfirm({
      title: '교재 판매 취소 / 반품',
      message: `${sale.studentName} 원생의 "${sale.textbookTitle}" (${sale.quantity}권) 판매를 취소하시겠습니까?\n차감되었던 재고 ${sale.quantity}권이 자동으로 복구됩니다.`,
      confirmLabel: '판매 취소 (재고 원복)',
      isDestructive: true,
      onConfirm: () => {
        const ok = StorageService.cancelSale(sale.id, '사용자 판매 취소/반품');
        if (ok) {
          showToast(`판매가 취소되고 재고가 복구되었습니다.`, 'success');
          triggerRefresh();
        }
      }
    });
  };

  const openReceiptModal = (sale: TextbookSale, payment?: TextbookPayment) => {
    setReceiptSale(sale);
    setReceiptPayment(payment);
    setIsReceiptModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                교재 판매 및 교재비 관리
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                피아노 교재 등록, 재고 실시간 관리, 원생 판매 및 분할 납부 수납을 통합 관리합니다.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSaleStudentId(undefined);
              setSaleTextbookId(undefined);
              setIsSaleModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            <ShoppingBag className="w-4 h-4" />
            교재 판매 등록
          </button>
          <button
            onClick={() => {
              setEditingTextbook(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            새 교재 등록
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: 이번달 판매액 */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">이번달 교재 판매액</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900">
            ₩{stats.monthlySaleAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{currentYM}월 누적 총 판매</p>
        </div>

        {/* Card 2: 이번달 수납액 */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">이번달 교재비 수납액</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-emerald-600">
            ₩{stats.monthlyPaidAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600/80 mt-1 font-medium">
            수납률 {stats.monthlySaleAmount > 0 ? Math.round((stats.monthlyPaidAmount / stats.monthlySaleAmount) * 100) : 100}%
          </p>
        </div>

        {/* Card 3: 미납 잔액 */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">전체 교재비 미납액</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-rose-600">
            ₩{stats.totalUnpaidAmount.toLocaleString()}
          </p>
          <p className="text-[11px] text-rose-600/80 mt-1 font-medium">
            미납 원생 {stats.unpaidStudentsCount}명
          </p>
        </div>

        {/* Card 4: 판매 권수 */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">이번달 판매 권수</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-bold text-slate-900">
            {stats.monthlyBooksSold}권
          </p>
          <p className="text-[11px] text-slate-400 mt-1">원생 출고 완료</p>
        </div>

        {/* Card 5: 재고 부족 알림 */}
        <div
          onClick={() => {
            setActiveSubTab('inventory');
            setOnlyLowStock(true);
          }}
          className={`p-4 bg-white rounded-2xl border cursor-pointer transition-all ${
            stats.lowStockBooksCount > 0
              ? 'border-amber-300 bg-amber-50/20 hover:bg-amber-50/40'
              : 'border-slate-200 hover:bg-slate-50'
          } shadow-xs col-span-2 lg:col-span-1`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">재고 부족 교재</span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                stats.lowStockBooksCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-lg sm:text-xl font-bold ${stats.lowStockBooksCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
            {stats.lowStockBooksCount}종
          </p>
          <p className="text-[11px] text-amber-600 font-medium mt-1">
            {stats.lowStockBooksCount > 0 ? '클릭하여 발주 대상 확인' : '재고 상태 양호'}
          </p>
        </div>
      </div>

      {/* 3. Sub Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('inventory')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'inventory'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <Boxes className="w-4 h-4" />
          교재 목록 및 재고 관리 ({textbooks.length})
        </button>

        <button
          onClick={() => setActiveSubTab('sales')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'sales'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          교재 판매 내역 ({sales.length})
        </button>

        <button
          onClick={() => setActiveSubTab('payments')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'payments'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          교재비 수납 / 분할 납부
        </button>

        <button
          onClick={() => setActiveSubTab('history')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
            activeSubTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <History className="w-4 h-4" />
          입출고 및 재고 변동 이력 ({transactions.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. Tab 1: 교재 목록 및 재고 관리 */}
      {/* ========================================================================= */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="교재명, 저자, 출판사, ISBN 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Level Filter */}
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
              >
                <option value="all">전체 레벨</option>
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>

              {/* Publisher Filter */}
              <select
                value={publisherFilter}
                onChange={(e) => setPublisherFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
              >
                <option value="all">전체 출판사</option>
                {publishers.map((pub) => (
                  <option key={pub} value={pub}>
                    {pub}
                  </option>
                ))}
              </select>

              {/* Sort Filter */}
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium"
              >
                <option value="title">교재명순</option>
                <option value="price_desc">판매가격 높은순</option>
                <option value="price_asc">판매가격 낮은순</option>
                <option value="stock_asc">재고 적은순 (부족순)</option>
                <option value="stock_desc">재고 많은순</option>
              </select>

              {/* Low Stock Toggle Button */}
              <button
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`px-3 py-2 rounded-xl border font-semibold flex items-center gap-1.5 transition-all ${
                  onlyLowStock
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                재고 부족만 보기
              </button>
            </div>
          </div>

          {/* Textbook Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTextbooks.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-slate-200">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">조건에 맞는 교재가 없습니다.</p>
                <p className="text-xs text-slate-400 mt-1">검색어나 필터 조건을 변경해보세요.</p>
              </div>
            ) : (
              filteredTextbooks.map((tb) => {
                const isLow = tb.stock <= tb.minStock;
                const salePrice = tb.salePrice || tb.price || 0;
                const costPrice = tb.costPrice || Math.round(salePrice * 0.6);

                return (
                  <div
                    key={tb.id}
                    className={`bg-white rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                      isLow ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
                    } shadow-xs hover:shadow-md`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px]">
                            {tb.level}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px]">
                            {tb.publisher}
                          </span>
                        </div>

                        {/* Stock Alert Badge */}
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            재고 부족
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                            재고 양호
                          </span>
                        )}
                      </div>

                      {/* Title & Author */}
                      <h3 className="font-bold text-slate-900 text-sm leading-snug">{tb.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {tb.author ? `저자: ${tb.author}` : '저자 미상'}{' '}
                        {tb.isbn ? `| ISBN: ${tb.isbn}` : ''}
                      </p>

                      {tb.memo && (
                        <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg mt-2.5 line-clamp-2">
                          {tb.memo}
                        </p>
                      )}

                      {/* Price & Stock Info Box */}
                      <div className="grid grid-cols-2 gap-2 mt-3.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <span className="text-slate-400 text-[10px] block">판매단가</span>
                          <span className="font-bold text-slate-900 text-sm">
                            ₩{salePrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            원가 ₩{costPrice.toLocaleString()}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] block">현재 보유 재고</span>
                          <span className={`font-black text-base ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                            {tb.stock}권
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            최소 {tb.minStock}권 유지
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedTextbookForStock(tb);
                            setIsStockModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
                          title="입고/조정"
                        >
                          <PackagePlus className="w-3.5 h-3.5 text-indigo-600" />
                          입고/조정
                        </button>
                        <button
                          onClick={() => {
                            setEditingTextbook(tb);
                            setIsFormModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="교재 수정"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteTextbook(tb.id, tb.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="교재 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setSaleTextbookId(tb.id);
                          setSaleStudentId(undefined);
                          setIsSaleModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1 shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        판매하기
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Tab 2: 교재 판매 내역 */}
      {/* ========================================================================= */}
      {activeSubTab === 'sales' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="원생명, 학부모명, 교재명 검색..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">납부 상태:</span>
              <div className="flex gap-1">
                {(['all', 'unpaid', 'partial', 'paid'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSalesStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl border font-semibold transition-colors ${
                      salesStatusFilter === st
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {st === 'all' ? '전체' : st === 'unpaid' ? '미납' : st === 'partial' ? '일부납부' : '납부완료'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">판매일</th>
                    <th className="py-3 px-4">원생 (보호자)</th>
                    <th className="py-3 px-4">교재명</th>
                    <th className="py-3 px-3 text-center">수량</th>
                    <th className="py-3 px-3 text-right">판매단가</th>
                    <th className="py-3 px-3 text-right">최종금액</th>
                    <th className="py-3 px-3 text-right">수납액</th>
                    <th className="py-3 px-3 text-right">미납 잔액</th>
                    <th className="py-3 px-3 text-center">상태</th>
                    <th className="py-3 px-4 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400">
                        교재 판매 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const statusBadge =
                        sale.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            완납
                          </span>
                        ) : sale.status === 'partial' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold">
                            <Clock className="w-3 h-3" />
                            일부납부
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            미납
                          </span>
                        );

                      return (
                        <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 text-slate-500">{sale.saleDate}</td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{sale.studentName}</span>
                            <span className="text-[11px] text-slate-400">
                              {sale.parentName || '학부모'} ({sale.parentPhone || '-'})
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800 block">{sale.textbookTitle}</span>
                            {sale.memo && <span className="text-[11px] text-slate-400 block truncate max-w-xs">{sale.memo}</span>}
                          </td>
                          <td className="py-3 px-3 text-center font-medium text-slate-700">
                            {sale.quantity}권
                          </td>
                          <td className="py-3 px-3 text-right text-slate-600">
                            ₩{sale.unitPrice.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            ₩{sale.totalAmount.toLocaleString()}
                            {sale.discount > 0 && (
                              <span className="text-[10px] text-slate-400 block">(-₩{sale.discount.toLocaleString()})</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold text-emerald-600">
                            ₩{sale.paidAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right font-black text-rose-600">
                            ₩{sale.unpaidAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center">{statusBadge}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {sale.unpaidAmount > 0 ? (
                                <button
                                  onClick={() => {
                                    setSelectedSaleForPayment(sale);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                                >
                                  수납하기
                                </button>
                              ) : (
                                <button
                                  onClick={() => openReceiptModal(sale)}
                                  className="px-2 py-1 text-[11px] font-medium rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1"
                                  title="영수증 보기"
                                >
                                  <FileText className="w-3 h-3 text-indigo-600" />
                                  영수증
                                </button>
                              )}

                              <button
                                onClick={() => handleCancelSale(sale)}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                                title="판매 취소 및 재고 원복"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. Tab 3: 교재비 수납 / 분할 납부 관리 */}
      {/* ========================================================================= */}
      {activeSubTab === 'payments' && (
        <div className="space-y-6">
          {/* Section 1: 미납/일부납부 대상 집중 처리 목록 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">교재비 미납 및 분할 수납 대상</h3>
                  <p className="text-xs text-slate-500">현재 미납 잔액이 남아있는 교재 판매 건입니다.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                총 {sales.filter((s) => s.unpaidAmount > 0).length}건 미납
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {sales.filter((s) => s.unpaidAmount > 0).length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-400">
                  🎉 현재 미납된 교재비가 없습니다! 모든 교재비가 완납되었습니다.
                </div>
              ) : (
                sales
                  .filter((s) => s.unpaidAmount > 0)
                  .map((sale) => (
                    <div
                      key={sale.id}
                      className="p-4 rounded-xl border border-rose-100 bg-rose-50/20 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-slate-900 text-sm">{sale.studentName}</span>
                            <span className="text-xs text-slate-500 block">
                              보호자: {sale.parentName} ({sale.parentPhone})
                            </span>
                          </div>
                          <span className="text-xs font-bold text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-md">
                            {sale.status === 'partial' ? '일부납부' : '미납'}
                          </span>
                        </div>

                        <div className="mt-2 text-xs space-y-1">
                          <p className="text-slate-700 font-medium">교재: {sale.textbookTitle} ({sale.quantity}권)</p>
                          <p className="text-slate-500">판매일: {sale.saleDate} | 총액: ₩{sale.totalAmount.toLocaleString()}</p>
                          <p className="text-slate-500">기수납액: ₩{sale.paidAmount.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-rose-100/80 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 block">미납 잔액</span>
                          <span className="font-black text-rose-600 text-sm">
                            ₩{sale.unpaidAmount.toLocaleString()}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedSaleForPayment(sale);
                            setIsPaymentModalOpen(true);
                          }}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                        >
                          분할/완납 수납
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Section 2: 전체 교재비 납부 이력 (Payment Receipts Log) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">교재비 수납 이력 내역서</h3>
                <p className="text-xs text-slate-500">원생별 교재비 납부 일자 및 영수증 내역입니다.</p>
              </div>
              <span className="text-xs font-medium text-slate-500">총 {payments.length}건 수납 기록</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">납부일자</th>
                    <th className="py-2.5 px-3">영수증 번호</th>
                    <th className="py-2.5 px-3">원생명</th>
                    <th className="py-2.5 px-3">교재명</th>
                    <th className="py-2.5 px-3 text-right">수납 금액</th>
                    <th className="py-2.5 px-3 text-center">결제수단</th>
                    <th className="py-2.5 px-3">메모</th>
                    <th className="py-2.5 px-3 text-center">영수증</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        수납 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => {
                      const relatedSale = sales.find((s) => s.id === p.textbookSaleId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 text-slate-600 font-medium">{p.paymentDate}</td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">{p.receiptNumber}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{p.studentName}</td>
                          <td className="py-2.5 px-3 text-slate-700">{p.textbookTitle}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                            ₩{p.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-center text-slate-600">
                            {p.paymentMethod === 'card'
                              ? '카드'
                              : p.paymentMethod === 'transfer'
                              ? '계좌이체'
                              : p.paymentMethod === 'cash'
                              ? '현금'
                              : '기타'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">{p.memo || '-'}</td>
                          <td className="py-2.5 px-3 text-center">
                            {relatedSale && (
                              <button
                                onClick={() => openReceiptModal(relatedSale, p)}
                                className="px-2 py-0.5 text-[11px] rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                              >
                                인쇄
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. Tab 4: 입출고 및 재고 변동 이력 */}
      {/* ========================================================================= */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700">변동 유형 필터:</span>
              <div className="flex gap-1">
                {(['all', 'inbound', 'sale', 'adjust', 'return'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setHistoryFilterType(t)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                      historyFilterType === t
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t === 'all'
                      ? '전체'
                      : t === 'inbound'
                      ? '입고'
                      : t === 'sale'
                      ? '판매출고'
                      : t === 'adjust'
                      ? '수동조정'
                      : '반품/취소'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">일자</th>
                    <th className="py-3 px-4">교재명</th>
                    <th className="py-3 px-3 text-center">구분</th>
                    <th className="py-3 px-3 text-center">변동수량</th>
                    <th className="py-3 px-3 text-center">변동 전 재고</th>
                    <th className="py-3 px-3 text-center font-bold">변동 후 재고</th>
                    <th className="py-3 px-4">사유 및 상세 내역</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions
                    .filter((tx) => historyFilterType === 'all' || tx.transactionType === historyFilterType)
                    .map((tx) => {
                      const typeBadge =
                        tx.transactionType === 'inbound' ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold">
                            신규입고
                          </span>
                        ) : tx.transactionType === 'sale' ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold">
                            판매출고
                          </span>
                        ) : tx.transactionType === 'return' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold">
                            반품입고
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold">
                            재고조정
                          </span>
                        );

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-4 text-slate-500 font-medium">{tx.transactionDate}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{tx.textbookTitle}</td>
                          <td className="py-3 px-3 text-center">{typeBadge}</td>
                          <td className="py-3 px-3 text-center font-bold">
                            <span className={tx.quantity > 0 ? 'text-indigo-600' : 'text-rose-600'}>
                              {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}권
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-500">{tx.previousStock}권</td>
                          <td className="py-3 px-3 text-center font-black text-slate-900">{tx.currentStock}권</td>
                          <td className="py-3 px-4 text-slate-600">{tx.memo || '-'}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Modals Container */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <TextbookFormModal
          textbook={editingTextbook}
          onSave={(data) => {
            StorageService.saveTextbook(data);
            showToast(editingTextbook ? '교재가 수정되었습니다.' : '신규 교재가 등록되었습니다.', 'success');
            setIsFormModalOpen(false);
            triggerRefresh();
          }}
          onClose={() => setIsFormModalOpen(false)}
        />
      )}

      {isSaleModalOpen && (
        <NewSaleModal
          initialStudentId={saleStudentId}
          initialTextbookId={saleTextbookId}
          onSuccess={(saleId) => {
            setIsSaleModalOpen(false);
            triggerRefresh();
            const created = StorageService.getTextbookSaleById(saleId);
            if (created && created.paidAmount > 0) {
              const payment = StorageService.getPaymentsBySaleId(saleId)[0];
              openReceiptModal(created, payment);
            }
          }}
          onClose={() => setIsSaleModalOpen(false)}
        />
      )}

      {isPaymentModalOpen && selectedSaleForPayment && (
        <TextbookPaymentModal
          sale={selectedSaleForPayment}
          onSuccess={(paymentId) => {
            setIsPaymentModalOpen(false);
            triggerRefresh();
            const p = StorageService.getTextbookPayments().find((item) => item.id === paymentId);
            if (p && selectedSaleForPayment) {
              openReceiptModal(selectedSaleForPayment, p);
            }
          }}
          onClose={() => setIsPaymentModalOpen(false)}
        />
      )}

      {isStockModalOpen && selectedTextbookForStock && (
        <StockAdjustModal
          textbook={selectedTextbookForStock}
          onSuccess={() => {
            setIsStockModalOpen(false);
            triggerRefresh();
          }}
          onClose={() => setIsStockModalOpen(false)}
        />
      )}

      {isReceiptModalOpen && receiptSale && (
        <TextbookReceiptModal
          sale={receiptSale}
          payment={receiptPayment}
          onClose={() => setIsReceiptModalOpen(false)}
        />
      )}
    </div>
  );
};
