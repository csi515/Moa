import type {
  Expense,
  Student,
  TuitionInvoice,
  TuitionPayment,
  UnpaidInvoiceItem,
  StudentUnpaidSummary,
  PaymentMethod,
} from '../../types';
import type { IncomeEntry, FinanceSummary } from '../../core/finance/types';
import { STORAGE_KEYS } from '../adapters';
import { generateEntityId, getItem, setItem, type StorageApi } from './helpers';
import { notifyParentTuitionUnpaid } from '../../core/academy/services/academyAlertService';
import {
  backfillLinkedIncomeFromPayments,
  deleteLinkedIncome,
  getTuitionPayments as readTuitionPayments,
  saveTuitionPaymentDirect,
  upsertLinkedIncome,
} from '../../core/finance/billingIncomeLink';

/** 수강료·지출·수입·미납 도메인 */
export function createFinanceStorage(api: StorageApi) {
  return {
    normalizeInvoiceStatus(inv: TuitionInvoice): TuitionInvoice {
      if (inv.status === 'paid') return inv;
      const today = new Date().toISOString().slice(0, 10);
      if (inv.unpaidAmount > 0 && inv.dueDate < today) {
        return { ...inv, status: 'overdue' };
      }
      return inv;
    },

    getInvoices(): TuitionInvoice[] {
      return getItem<TuitionInvoice[]>(STORAGE_KEYS.INVOICES, []).map((inv) =>
        (api.normalizeInvoiceStatus as (i: TuitionInvoice) => TuitionInvoice)(inv)
      );
    },

    getTuitionPayments(): TuitionPayment[] {
      return readTuitionPayments();
    },

    getTuitionPaymentsByInvoiceId(invoiceId: string): TuitionPayment[] {
      return readTuitionPayments().filter((p) => p.invoiceId === invoiceId);
    },

    saveInvoice(inv: Omit<TuitionInvoice, 'id'> & { id?: string }): TuitionInvoice {
      const list = (api.getInvoices as () => TuitionInvoice[])();
      let saved: TuitionInvoice;
      if (inv.id) {
        const idx = list.findIndex((i) => i.id === inv.id);
        if (idx >= 0) {
          saved = { ...list[idx], ...inv, id: inv.id };
          list[idx] = saved;
        } else {
          saved = { ...inv, id: inv.id };
          list.unshift(saved);
        }
      } else {
        saved = {
          ...inv,
          id: generateEntityId('inv'),
        };
        list.unshift(saved);
      }
      setItem(STORAGE_KEYS.INVOICES, list);
      return saved;
    },

    deleteInvoice(id: string): boolean {
      const list = (api.getInvoices as () => TuitionInvoice[])();
      const filtered = list.filter((i) => i.id !== id);
      if (filtered.length !== list.length) {
        const payments = readTuitionPayments().filter((p) => p.invoiceId === id);
        for (const p of payments) {
          deleteLinkedIncome('tuition', p.id);
        }
        setItem(
          STORAGE_KEYS.TUITION_PAYMENTS,
          readTuitionPayments().filter((p) => p.invoiceId !== id)
        );
        setItem(STORAGE_KEYS.INVOICES, filtered);
        return true;
      }
      return false;
    },

    recordPayment(
      invoiceId: string,
      amount: number,
      method: PaymentMethod,
      notes?: string,
      paymentDate?: string
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
      const pDate = paymentDate || new Date().toISOString().slice(0, 10);
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
      });

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

      return updated;
    },

    /** 연동 납부 삭제 — charge 잔액·income 동시 복원 */
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

      setItem(
        STORAGE_KEYS.TUITION_PAYMENTS,
        payments.filter((p) => p.id !== paymentId)
      );
      deleteLinkedIncome('tuition', paymentId);
      return true;
    },

    createInvoiceForStudent(student: Student, yearMonth?: string): TuitionInvoice {
      const ym = yearMonth || new Date().toISOString().slice(0, 7);
      const dueDay = String(student.paymentDay || 10).padStart(2, '0');
      const dueDate = `${ym}-${dueDay}`;

      const newInv: TuitionInvoice = {
        id: generateEntityId('inv'),
        studentId: student.id,
        studentName: student.name,
        yearMonth: ym,
        baseFee: student.tuitionFee,
        discount: 0,
        textbookFee: 0,
        extraFee: 0,
        totalAmount: student.tuitionFee,
        paidAmount: 0,
        unpaidAmount: student.tuitionFee,
        dueDate,
        status: 'unpaid',
        notes: `${ym}월 정기 수강료`,
      };

      const saved = (api.saveInvoice as (i: Omit<TuitionInvoice, 'id'> & { id?: string }) => TuitionInvoice)(
        newInv
      );

      if (saved.unpaidAmount > 0) {
        notifyParentTuitionUnpaid({
          studentId: student.id,
          studentName: student.name,
          parentPhone: student.parentPhone,
          yearMonth: saved.yearMonth,
          amount: saved.unpaidAmount,
          dueDate: saved.dueDate,
        });
      }

      return saved;
    },

    generateMonthlyInvoicesForAllActive(yearMonth: string): number {
      const students = (api.getStudents as () => Student[])().filter((s) => s.status === 'active');
      const currentInvoices = (api.getInvoices as () => TuitionInvoice[])();
      let generatedCount = 0;

      students.forEach((student) => {
        const alreadyHas = currentInvoices.some(
          (i) => i.studentId === student.id && i.yearMonth === yearMonth
        );
        if (!alreadyHas) {
          (api.createInvoiceForStudent as (s: Student, ym?: string) => TuitionInvoice)(
            student,
            yearMonth
          );
          generatedCount++;
        }
      });

      return generatedCount;
    },

    getExpenses(): Expense[] {
      return getItem<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    },

    saveExpense(exp: Omit<Expense, 'id'> & { id?: string }): Expense {
      const list = (api.getExpenses as () => Expense[])();
      let saved: Expense;
      if (exp.id) {
        const idx = list.findIndex((e) => e.id === exp.id);
        if (idx >= 0) {
          saved = { ...list[idx], ...exp, id: exp.id };
          list[idx] = saved;
        } else {
          saved = { ...exp, id: exp.id };
          list.unshift(saved);
        }
      } else {
        saved = {
          ...exp,
          id: generateEntityId('exp'),
        };
        list.unshift(saved);
      }
      setItem(STORAGE_KEYS.EXPENSES, list);
      return saved;
    },

    deleteExpense(id: string): boolean {
      const list = (api.getExpenses as () => Expense[])();
      const filtered = list.filter((e) => e.id !== id);
      if (filtered.length !== list.length) {
        setItem(STORAGE_KEYS.EXPENSES, filtered);
        return true;
      }
      return false;
    },

    getIncomeEntries(): IncomeEntry[] {
      return getItem<IncomeEntry[]>(STORAGE_KEYS.INCOME_ENTRIES, []);
    },

    saveIncomeEntry(entry: Omit<IncomeEntry, 'id'> & { id?: string }): IncomeEntry {
      const list = (api.getIncomeEntries as () => IncomeEntry[])();
      let saved: IncomeEntry;
      if (entry.id) {
        const idx = list.findIndex((e) => e.id === entry.id);
        if (idx >= 0) {
          saved = { ...list[idx], ...entry, id: entry.id };
          list[idx] = saved;
        } else {
          saved = { ...entry, id: entry.id };
          list.unshift(saved);
        }
      } else {
        saved = {
          ...entry,
          id: generateEntityId('inc'),
          sourceType: entry.sourceType || 'manual',
        };
        list.unshift(saved);
      }
      setItem(STORAGE_KEYS.INCOME_ENTRIES, list);
      return saved;
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
        (api.reverseTextbookPayment as (paymentId: string) => boolean)(entry.sourceId);
        return true;
      }

      const filtered = list.filter((e) => e.id !== id);
      setItem(STORAGE_KEYS.INCOME_ENTRIES, filtered);
      return true;
    },

    backfillBillingLinkedIncome() {
      return backfillLinkedIncomeFromPayments();
    },

    getFinanceSummary(industry: string = 'piano'): FinanceSummary {
      const expenses = (api.getExpenses as () => Expense[])();
      const incomeEntries = (api.getIncomeEntries as () => IncomeEntry[])();
      const currentYearMonth = new Date().toISOString().slice(0, 7);

      const getIncomeForMonth = (ym: string, linkedOnly?: boolean): number =>
        incomeEntries
          .filter((e) => {
            if (!e.date.startsWith(ym)) return false;
            if (linkedOnly === true) return e.sourceType === 'tuition' || e.sourceType === 'textbook';
            if (linkedOnly === false) return !e.sourceType || e.sourceType === 'manual';
            return true;
          })
          .reduce((sum, e) => sum + e.amount, 0);

      const getExpenseForMonth = (ym: string): number =>
        expenses.filter((e) => e.date.startsWith(ym)).reduce((sum, e) => sum + e.amount, 0);

      const manualIncomeThisMonth = getIncomeForMonth(currentYearMonth, false);
      const linkedIncomeThisMonth =
        industry === 'piano' ? getIncomeForMonth(currentYearMonth, true) : 0;
      const totalIncomeThisMonth = getIncomeForMonth(currentYearMonth);
      const totalExpenseThisMonth = getExpenseForMonth(currentYearMonth);

      const months: string[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toISOString().slice(0, 7));
      }

      const monthlyTrend = months.map((ym) => {
        const income = getIncomeForMonth(ym);
        const expense = getExpenseForMonth(ym);
        return {
          yearMonth: ym,
          monthLabel: `${parseInt(ym.slice(5, 7), 10)}월`,
          income,
          expense,
          net: income - expense,
        };
      });

      return {
        currentYearMonth,
        totalIncomeThisMonth,
        totalExpenseThisMonth,
        netProfitThisMonth: totalIncomeThisMonth - totalExpenseThisMonth,
        linkedIncomeThisMonth,
        manualIncomeThisMonth,
        monthlyTrend,
      };
    },

    getUnpaidInvoices(): UnpaidInvoiceItem[] {
      const today = new Date().toISOString().slice(0, 10);
      return (api.getInvoices as () => TuitionInvoice[])()
        .filter((inv) => inv.unpaidAmount > 0)
        .map((inv) => {
          const due = inv.dueDate;
          const diffMs = new Date(today).getTime() - new Date(due).getTime();
          const daysOverdue = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;
          return { ...inv, daysOverdue };
        })
        .sort((a, b) => b.daysOverdue - a.daysOverdue);
    },

    getUnifiedUnpaidSummaries(): StudentUnpaidSummary[] {
      const students = (api.getStudents as () => Student[])().filter(
        (s) => s.status === 'active' || s.status === 'leave'
      );
      const unpaidInvoices = (api.getUnpaidInvoices as () => UnpaidInvoiceItem[])();
      const unpaidSales = (
        api.getUnpaidTextbookSales as () => (import('../../types').TextbookSale & {
          daysOverdue: number;
        })[]
      )();

      const map = new Map<string, StudentUnpaidSummary>();

      for (const st of students) {
        map.set(st.id, {
          studentId: st.id,
          studentName: st.name,
          parentName: st.parentName,
          parentPhone: st.parentPhone,
          tuitionUnpaid: 0,
          textbookUnpaid: 0,
          totalUnpaid: 0,
          overdueCount: 0,
          oldestOverdueDays: 0,
          tuitionItems: [],
          textbookItems: [],
        });
      }

      for (const inv of unpaidInvoices) {
        let entry = map.get(inv.studentId);
        if (!entry) {
          entry = {
            studentId: inv.studentId,
            studentName: inv.studentName,
            parentName: '',
            parentPhone: '',
            tuitionUnpaid: 0,
            textbookUnpaid: 0,
            totalUnpaid: 0,
            overdueCount: 0,
            oldestOverdueDays: 0,
            tuitionItems: [],
            textbookItems: [],
          };
          map.set(inv.studentId, entry);
        }
        entry.tuitionItems.push(inv);
        entry.tuitionUnpaid += inv.unpaidAmount;
        if (inv.daysOverdue > 0) entry.overdueCount += 1;
        entry.oldestOverdueDays = Math.max(entry.oldestOverdueDays, inv.daysOverdue);
      }

      for (const sale of unpaidSales) {
        let entry = map.get(sale.studentId);
        if (!entry) {
          entry = {
            studentId: sale.studentId,
            studentName: sale.studentName,
            parentName: sale.parentName,
            parentPhone: sale.parentPhone,
            tuitionUnpaid: 0,
            textbookUnpaid: 0,
            totalUnpaid: 0,
            overdueCount: 0,
            oldestOverdueDays: 0,
            tuitionItems: [],
            textbookItems: [],
          };
          map.set(sale.studentId, entry);
        }
        entry.textbookItems.push(sale);
        entry.textbookUnpaid += sale.unpaidAmount;
        if (sale.daysOverdue > 30) entry.overdueCount += 1;
        entry.oldestOverdueDays = Math.max(entry.oldestOverdueDays, sale.daysOverdue);
      }

      return Array.from(map.values())
        .map((e) => ({ ...e, totalUnpaid: e.tuitionUnpaid + e.textbookUnpaid }))
        .filter((e) => e.totalUnpaid > 0)
        .sort((a, b) => b.totalUnpaid - a.totalUnpaid);
    },

    getUnifiedUnpaidStats() {
      const summaries = (api.getUnifiedUnpaidSummaries as () => StudentUnpaidSummary[])();
      const tuitionTotal = summaries.reduce((s, e) => s + e.tuitionUnpaid, 0);
      const textbookTotal = summaries.reduce((s, e) => s + e.textbookUnpaid, 0);
      const overdueStudents = summaries.filter((e) => e.overdueCount > 0).length;
      return {
        studentCount: summaries.length,
        tuitionTotal,
        textbookTotal,
        grandTotal: tuitionTotal + textbookTotal,
        overdueStudents,
        overdueInvoices: (api.getUnpaidInvoices as () => UnpaidInvoiceItem[])().filter(
          (i) => i.daysOverdue > 0
        ).length,
      };
    },

    getRevenueBreakdown(yearMonth?: string): {
      tuitionRevenue: number;
      textbookRevenue: number;
      otherRevenue: number;
      totalRevenue: number;
    } {
      const ym = yearMonth || new Date().toISOString().slice(0, 7);
      const entries = (api.getIncomeEntries as () => IncomeEntry[])().filter((e) =>
        e.date.startsWith(ym)
      );

      const tuitionRevenue = entries
        .filter((e) => e.sourceType === 'tuition')
        .reduce((sum, e) => sum + e.amount, 0);
      const textbookRevenue = entries
        .filter((e) => e.sourceType === 'textbook')
        .reduce((sum, e) => sum + e.amount, 0);
      const otherRevenue = entries
        .filter((e) => !e.sourceType || e.sourceType === 'manual' || e.sourceType === 'booking')
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        tuitionRevenue,
        textbookRevenue,
        otherRevenue,
        totalRevenue: tuitionRevenue + textbookRevenue + otherRevenue,
      };
    },
  };
}
