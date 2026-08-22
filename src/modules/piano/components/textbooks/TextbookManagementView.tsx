import React, { useState, useEffect } from 'react';
import {
  Textbook,
  TextbookSale,
  TextbookPayment,
  TextbookInventoryTransaction
} from '@/types';
import { StorageService } from '@/services/storage';
import { useApp } from '@/context/AppContext';
import { BookOpen, ShoppingBag, Plus } from 'lucide-react';

import { TextbookFormModal } from './TextbookFormModal';
import { NewSaleModal } from './NewSaleModal';
import { TextbookPaymentModal } from './TextbookPaymentModal';
import { StockAdjustModal } from './StockAdjustModal';
import { TextbookReceiptModal } from './TextbookReceiptModal';
import { SubTab } from './textbookViewTypes';
import { TextbookSummaryCards } from './tabs/TextbookSummaryCards';
import { TextbookSubTabNav } from './tabs/TextbookSubTabNav';
import { TextbookInventoryTab } from './tabs/TextbookInventoryTab';
import { TextbookSalesTab } from './tabs/TextbookSalesTab';
import { TextbookPaymentsTab } from './tabs/TextbookPaymentsTab';
import { TextbookHistoryTab } from './tabs/TextbookHistoryTab';

export const TextbookManagementView: React.FC = () => {
  const { showConfirm, showToast, refreshKey, triggerRefresh } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('inventory');
  const [focusLowStock, setFocusLowStock] = useState(false);

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

  const currentYM = new Date().toISOString().slice(0, 7);
  const stats = StorageService.getTextbookStats(currentYM);

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

  const openSaleModal = (textbookId?: string, studentId?: string) => {
    setSaleTextbookId(textbookId);
    setSaleStudentId(studentId);
    setIsSaleModalOpen(true);
  };

  const openPaymentModal = (sale: TextbookSale) => {
    setSelectedSaleForPayment(sale);
    setIsPaymentModalOpen(true);
  };

  const handleLowStockClick = () => {
    setActiveSubTab('inventory');
    setFocusLowStock(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Quick Actions */}
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
            onClick={() => openSaleModal()}
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

      <TextbookSummaryCards
        stats={stats}
        currentYM={currentYM}
        onLowStockClick={handleLowStockClick}
      />

      <TextbookSubTabNav
        activeSubTab={activeSubTab}
        onSubTabChange={setActiveSubTab}
        textbooksCount={textbooks.length}
        salesCount={sales.length}
        transactionsCount={transactions.length}
      />

      {activeSubTab === 'inventory' && (
        <TextbookInventoryTab
          textbooks={textbooks}
          focusLowStock={focusLowStock}
          onFocusLowStockHandled={() => setFocusLowStock(false)}
          onDeleteTextbook={handleDeleteTextbook}
          onOpenStockModal={(tb) => {
            setSelectedTextbookForStock(tb);
            setIsStockModalOpen(true);
          }}
          onEditTextbook={(tb) => {
            setEditingTextbook(tb);
            setIsFormModalOpen(true);
          }}
          onOpenSaleModal={(textbookId) => openSaleModal(textbookId)}
        />
      )}

      {activeSubTab === 'sales' && (
        <TextbookSalesTab
          sales={sales}
          onOpenPaymentModal={openPaymentModal}
          onOpenReceiptModal={(sale) => openReceiptModal(sale)}
          onCancelSale={handleCancelSale}
        />
      )}

      {activeSubTab === 'payments' && (
        <TextbookPaymentsTab
          sales={sales}
          payments={payments}
          onOpenPaymentModal={openPaymentModal}
          onOpenReceiptModal={openReceiptModal}
        />
      )}

      {activeSubTab === 'history' && (
        <TextbookHistoryTab transactions={transactions} />
      )}

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
