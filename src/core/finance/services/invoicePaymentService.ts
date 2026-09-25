import type {
  AcademyEvent,
  AcademySettings,
  PaymentMethod,
  Student,
  TextbookSale,
  TuitionInvoice,
} from '@/types';
import { STORAGE_KEYS } from '@/services/adapters';
import { generateEntityId, getItem, setItem, type StorageApi } from '@/services/storage/helpers';
import { notifyParentTuitionInvoiceSent } from '@/core/academy/services/academyAlertService';
import { isMonthlyBillingStudent } from '@/core/academy/utils/billingMode';
import { todayIsoLocal, yearMonthLocal } from '@/shared/utils/localDate';
import {
  buildInvoiceNotes,
  collectPendingRecitalFees,
  collectPendingTextbookSales,
  computeInvoiceTotal,
  resolveIncludeExtras,
} from '@/core/academy/utils/invoiceExtras';
import {
  backfillLinkedIncomeFromPayments,
  deleteLinkedIncome,
  getTuitionPayments as readTuitionPayments,
  saveTuitionPaymentDirect,
  upsertLinkedIncome,
} from '@/core/finance/billingIncomeLink';
import { defaultDueDateForMonth } from '@/core/academy/components/tuition/tuitionUtils';
import { listMonthlyTuitionMissingInvoices } from '@/core/finance/monthlyTuitionEnsure';
import { findMonthlyTuitionInvoice } from '@/core/finance/monthlyTuitionStatus';
import type { IncomeEntry } from '@/core/finance/types';
import {
  reverseLinkedTextbookPaymentsForTuition,
  settleLinkedTextbookSalesOnTuitionPaid,
} from '@/core/finance/linkedTextbookSettle';

/**
 * 수강료 납부·청구·수입 연동 orchestration.
 * localStorage CRUD는 financeStorage, 이 계층은 업무 흐름만 담당한다.
 */
export function createInvoicePaymentService(api: StorageApi) {
  return {
    deleteInvoice(id: string): boolean {
      const list = (api.getInvoices as () => TuitionInvoice[])();
      const target = list.find((i) => i.id === id);
      if (!target) return false;

      const filtered = list.filter((i) => i.id !== id);
      const payments = readTuitionPayments().filter((p) => p.invoiceId === id);
      for (const p of payments) {
        deleteLinkedIncome('tuition', p.id);
      }
      setItem(
        STORAGE_KEYS.TUITION_PAYMENTS,
        readTuitionPayments().filter((p) => p.invoiceId !== id)
      );
      setItem(STORAGE_KEYS.INVOICES, filtered);

      const sales = getItem<TextbookSale[]>(STORAGE_KEYS.TEXTBOOK_SALES, []);
      let salesChanged = false;
      const nextSales = sales.map((s) => {
        if (s.billingInvoiceId !== id) return s;
        salesChanged = true;
        return { ...s, billingInvoiceId: undefined, updatedAt: new Date().toISOString() };
      });
      if (salesChanged) setItem(STORAGE_KEYS.TEXTBOOK_SALES, nextSales);

      return true;
    },

    recordPayment(
      invoiceId: string,
      amount: number,
      method: PaymentMethod,
      notes?: string,
      paymentDate?: string,
      options?: { cashReceiptIssued?: boolean }
    ): TuitionInvoice | null {
      const list = (api.getInvoices as () => TuitionInvoice[])();
      const idx = list.findIndex((i) => i.id === invoiceId);
      if (idx === -1) return null;

      const inv = list[idx];
      const payAmount = Math.min(amount, Math.max(0, inv.unpaidAmount));
      if (payAmount <= 0) return inv;

      const newPaidAmount = inv.paidAmount + payAmount;
      const newUnpaidAmount = Math.max(0, inv.totalAmount - newPaidAmount);
      const newStatus = newUnpaidAmount === 0 ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';
      const pDate = paymentDate || todayIsoLocal();
      const receiptNum = `REC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`;

      const updated: TuitionInvoice = {
        ...inv,
        paidAmount: newPaidAmount,
        unpaidAmount: newUnpaidAmount,
        status: newStatus,
        paymentMethod: method,
        paidAt: pDate,
        paidDate: pDate,
        notes: notes ? `${inv.notes || ''} [${pDate}] ${notes}`.trim() : inv.notes,
        receiptNumber: inv.receiptNumber || receiptNum,
      };

      list[idx] = updated;
      setItem(STORAGE_KEYS.INVOICES, list);

      const payment = saveTuitionPaymentDirect({
        invoiceId: inv.id,
        studentId: inv.studentId,
        studentName: inv.studentName,
        yearMonth: inv.yearMonth,
        paymentDate: pDate,
        amount: payAmount,
        paymentMethod: method,
        memo: notes,
        receiptNumber: receiptNum,
        cashReceiptIssued: options?.cashReceiptIssued === true,
      });

      // sourceId=payment.id upsert — 동일 payment 재호출 시 수입 중복 생성 없음
      upsertLinkedIncome({
        sourceType: 'tuition',
        paymentId: payment.id,
        date: pDate,
        amount: payAmount,
        paymentMethod: method,
        description: `${inv.yearMonth} 수강료 · ${inv.studentName}`,
        payer: inv.studentName,
        memo: notes,
      });

      // 월 청구 완납 시 합산 교재 미납분 정산 — 수입은 수강료 income에만 계상(이중 수입 방지)
      if (updated.status === 'paid' && (inv.linkedTextbookSaleIds || []).length > 0) {
        void settleLinkedTextbookSalesOnTuitionPaid({
          api,
          invoice: inv,
          paymentId: payment.id,
          method,
          paymentDate: pDate,
        }).catch((err) => console.error('[recordPayment] linked textbook settle', err));
      }

      return updated;
    },

    /** 청구서 수동 발송 — sentAt 기록 + 학부모 알림 (자동 발송 금지) */
    sendInvoice(invoiceId: string): TuitionInvoice | null {
      const list = (api.getInvoices as () => TuitionInvoice[])();
      const idx = list.findIndex((i) => i.id === invoiceId);
      if (idx === -1) return null;

      const inv = list[idx];
      if (inv.status === 'cancelled' || inv.status === 'paid') return inv;
      if (inv.invoiceSent === true && inv.sentAt) return inv;

      const sentAt = new Date().toISOString();
      const updated: TuitionInvoice = {
        ...inv,
        invoiceSent: true,
        sentAt,
      };
      list[idx] = updated;
      setItem(STORAGE_KEYS.INVOICES, list);

      const students = (api.getStudents as () => Student[])();
      const student = students.find((s) => s.id === inv.studentId);
      if (updated.unpaidAmount > 0) {
        notifyParentTuitionInvoiceSent({
          studentId: inv.studentId,
          studentName: inv.studentName,
          parentPhone: student?.parentPhone,
          yearMonth: inv.yearMonth,
          amount: updated.unpaidAmount,
          dueDate: inv.dueDate,
          title: inv.title,
        });
      }
      return updated;
    },

    sendInvoices(invoiceIds: string[]): number {
      let count = 0;
      for (const id of invoiceIds) {
        const sent = (api.sendInvoice as (invoiceId: string) => TuitionInvoice | null)(id);
        if (sent?.sentAt) count += 1;
      }
      return count;
    },

    /** 연동 납부 삭제 — charge 잔액·income·합산 교재 정산 동시 복원 */
    reverseTuitionPayment(paymentId: string): boolean {
      const payments = readTuitionPayments();
      const payment = payments.find((p) => p.id === paymentId);
      if (!payment) return false;

      const list = (api.getInvoices as () => TuitionInvoice[])();
      const idx = list.findIndex((i) => i.id === payment.invoiceId);
      if (idx >= 0) {
        const inv = list[idx];
        const newPaid = Math.max(0, inv.paidAmount - payment.amount);
        const newUnpaid = Math.max(0, inv.totalAmount - newPaid);
        list[idx] = {
          ...inv,
          paidAmount: newPaid,
          unpaidAmount: newUnpaid,
          status: newUnpaid === 0 ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid',
        };
        setItem(STORAGE_KEYS.INVOICES, list);
      }

      void reverseLinkedTextbookPaymentsForTuition(api, paymentId).catch((err) =>
        console.error('[reversePayment] linked textbook reverse', err)
      );

      setItem(
        STORAGE_KEYS.TUITION_PAYMENTS,
        payments.filter((p) => p.id !== paymentId)
      );
      deleteLinkedIncome('tuition', paymentId);
      return true;
    },

    createInvoiceForStudent(
      student: Student,
      yearMonth?: string,
      options?: { includeExtras?: boolean; extraFee?: number; extraFeeLabel?: string }
    ): TuitionInvoice | null {
      if (!isMonthlyBillingStudent(student)) {
        return null;
      }
      const ym = yearMonth || yearMonthLocal();

      const existing = findMonthlyTuitionInvoice(
        (api.getInvoices as () => TuitionInvoice[])(),
        student.id,
        ym
      );
      if (existing) return existing;

      const dueDate = defaultDueDateForMonth(ym, student.paymentDay || 10);
      const settings = getItem<AcademySettings>(STORAGE_KEYS.SETTINGS, {
        name: '',
        address: '',
        phone: '',
        defaultTuitionFee: 180000,
      });
      const includeExtras = resolveIncludeExtras(settings, options?.includeExtras);

      let textbookFee = 0;
      let linkedTextbookSaleIds: string[] = [];
      let linkedExtraItems: TuitionInvoice['linkedExtraItems'] = [];
      let extraFee = Math.max(0, Number(options?.extraFee) || 0);
      let extraFeeLabel = options?.extraFeeLabel;

      if (includeExtras) {
        const pendingSales = collectPendingTextbookSales(
          getItem<TextbookSale[]>(STORAGE_KEYS.TEXTBOOK_SALES, []),
          student.id
        );
        textbookFee = pendingSales.reduce((sum, s) => sum + s.unpaidAmount, 0);
        linkedTextbookSaleIds = pendingSales.map((s) => s.id);

        const existingInvoices = (api.getInvoices as () => TuitionInvoice[])();
        const events =
          typeof api.getEvents === 'function'
            ? (api.getEvents as () => AcademyEvent[])()
            : getItem<AcademyEvent[]>(STORAGE_KEYS.EVENTS, []);
        const recitalItems = collectPendingRecitalFees({
          events,
          studentId: student.id,
          yearMonth: ym,
          existingInvoices,
        });
        linkedExtraItems = recitalItems;
        const recitalTotal = recitalItems.reduce((sum, i) => sum + i.amount, 0);
        extraFee += recitalTotal;
        if (!extraFeeLabel && recitalItems.length > 0) {
          extraFeeLabel = recitalItems.map((i) => i.label).join(', ');
        }
      }

      const baseFee = student.tuitionFee || 0;
      const discount = 0;
      const totalAmount = computeInvoiceTotal({
        baseFee,
        discount,
        textbookFee,
        extraFee,
      });

      const newInv: TuitionInvoice = {
        id: generateEntityId('inv'),
        studentId: student.id,
        studentName: student.name,
        yearMonth: ym,
        title: `${ym} 수강료`,
        baseFee,
        baseTuition: baseFee,
        discount,
        textbookFee,
        extraFee,
        extraFeeLabel,
        totalAmount,
        paidAmount: 0,
        unpaidAmount: totalAmount,
        dueDate,
        status: totalAmount <= 0 ? 'paid' : 'unpaid',
        notes: buildInvoiceNotes({
          yearMonth: ym,
          textbookCount: linkedTextbookSaleIds.length,
          extraItems: linkedExtraItems || [],
        }),
        includeExtras,
        linkedTextbookSaleIds:
          linkedTextbookSaleIds.length > 0 ? linkedTextbookSaleIds : undefined,
        linkedExtraItems:
          linkedExtraItems && linkedExtraItems.length > 0 ? linkedExtraItems : undefined,
        invoiceSent: false,
        sentAt: null,
      };

      const saved = (
        api.saveInvoice as (i: Omit<TuitionInvoice, 'id'> & { id?: string }) => TuitionInvoice
      )(newInv);

      if (linkedTextbookSaleIds.length > 0) {
        const sales = getItem<TextbookSale[]>(STORAGE_KEYS.TEXTBOOK_SALES, []);
        const linked = new Set(linkedTextbookSaleIds);
        setItem(
          STORAGE_KEYS.TEXTBOOK_SALES,
          sales.map((s) =>
            linked.has(s.id)
              ? { ...s, billingInvoiceId: saved.id, updatedAt: new Date().toISOString() }
              : s
          )
        );
      }

      return saved;
    },

    generateMonthlyInvoicesForAllActive(yearMonth: string): number {
      const students = (api.getStudents as () => Student[])();
      const currentInvoices = (api.getInvoices as () => TuitionInvoice[])();
      const missing = listMonthlyTuitionMissingInvoices(students, currentInvoices, yearMonth);
      let generatedCount = 0;

      missing.forEach((student) => {
        const created = (
          api.createInvoiceForStudent as (s: Student, ym?: string) => TuitionInvoice | null
        )(student, yearMonth);
        if (created) generatedCount += 1;
      });

      return generatedCount;
    },

    deleteIncomeEntry(id: string): boolean {
      const list = (api.getIncomeEntries as () => IncomeEntry[])();
      const entry = list.find((e) => e.id === id);
      if (!entry) return false;

      if (entry.sourceType === 'tuition' && entry.sourceId) {
        (api.reverseTuitionPayment as (paymentId: string) => boolean)(entry.sourceId);
        return true;
      }
      if (entry.sourceType === 'textbook' && entry.sourceId) {
        void Promise.resolve(
          (api.reverseTextbookPayment as (paymentId: string) => boolean | Promise<boolean>)(
            entry.sourceId
          )
        ).catch((err) => console.error('[deleteIncomeEntry] reverse textbook', err));
        return true;
      }

      const filtered = list.filter((e) => e.id !== id);
      setItem(STORAGE_KEYS.INCOME_ENTRIES, filtered);
      return true;
    },

    backfillBillingLinkedIncome() {
      return backfillLinkedIncomeFromPayments();
    },
  };
}

export type InvoicePaymentServiceApi = ReturnType<typeof createInvoicePaymentService>;
