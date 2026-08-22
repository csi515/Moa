import type {
  Student,
  Textbook,
  TextbookSale,
  TextbookPayment,
  TextbookInventoryTransaction,
  StudentMonthlyBillingSummary,
  CombinedPaymentRequest,
  PaymentMethod,
  TuitionInvoice,
} from '../../types';
import { STORAGE_KEYS } from '../adapters';
import { generateEntityId, getItem, setItem, type StorageApi } from './helpers';

/** 교재 판매·수납·통합 청구 */
export function createTextbookSalesStorage(api: StorageApi) {
  return {
    getTextbookSales(): TextbookSale[] {
      return getItem<TextbookSale[]>(STORAGE_KEYS.TEXTBOOK_SALES, []).map((s) =>
        (api.enrichSaleGuardian as (sale: TextbookSale) => TextbookSale)(s)
      );
    },

    enrichSaleGuardian(sale: TextbookSale): TextbookSale {
      const student = (api.getStudents as () => Student[])().find((s) => s.id === sale.studentId);
      if (!student?.parentName && !student?.parentPhone) return sale;
      return {
        ...sale,
        parentId: student.parentId ?? sale.parentId,
        parentName: student.parentName || sale.parentName,
        parentPhone: student.parentPhone || sale.parentPhone,
      };
    },

    getTextbookSaleById(id: string): TextbookSale | undefined {
      return (api.getTextbookSales as () => TextbookSale[])().find((s) => s.id === id);
    },

    getSalesByStudentId(studentId: string): TextbookSale[] {
      return (api.getTextbookSales as () => TextbookSale[])().filter((s) => s.studentId === studentId);
    },

    createSale(data: {
      studentId: string;
      textbookId: string;
      quantity: number;
      unitPrice?: number;
      discount?: number;
      initialPaymentAmount?: number;
      paymentMethod?: PaymentMethod | null;
      saleDate?: string;
      memo?: string;
      teacherId?: string;
      teacherName?: string;
    }): {
      sale: TextbookSale;
      payment?: TextbookPayment;
      transaction: TextbookInventoryTransaction;
    } {
      const students = (api.getStudents as () => Student[])();
      const student = students.find((s) => s.id === data.studentId);
      const textbooks = (api.getTextbooks as () => Textbook[])();
      const tb = textbooks.find((t) => t.id === data.textbookId);

      if (!tb) throw new Error('선택한 교재 정보를 찾을 수 없습니다.');
      if (!student) throw new Error('선택한 원생 정보를 찾을 수 없습니다.');

      const qty = Math.max(1, Number(data.quantity) || 1);
      const unitPrice = Number(data.unitPrice ?? tb.salePrice ?? tb.price ?? 15000);
      const discount = Math.max(0, Number(data.discount) || 0);
      const totalAmount = Math.max(0, qty * unitPrice - discount);
      const initialPaid = Math.min(totalAmount, Math.max(0, Number(data.initialPaymentAmount) || 0));
      const unpaidAmount = Math.max(0, totalAmount - initialPaid);

      const status: 'unpaid' | 'partial' | 'paid' =
        unpaidAmount === 0 ? 'paid' : initialPaid > 0 ? 'partial' : 'unpaid';

      const now = new Date();
      const nowIso = now.toISOString();
      const saleDate = data.saleDate || nowIso.slice(0, 10);
      const saleId = `ts-${Date.now()}`;

      const newSale: TextbookSale = {
        id: saleId,
        studentId: student.id,
        studentName: student.name,
        parentId: student.parentId,
        parentName: student.parentName || '학부모',
        parentPhone: student.parentPhone || '',
        textbookId: tb.id,
        textbookTitle: tb.title,
        saleDate,
        quantity: qty,
        unitPrice,
        discount,
        totalAmount,
        paidAmount: initialPaid,
        unpaidAmount,
        status,
        paymentMethod: initialPaid > 0 ? data.paymentMethod || 'card' : null,
        memo: data.memo || '',
        teacherId: data.teacherId || student.teacherId,
        teacherName: data.teacherName || student.teacherName,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      const salesList = getItem<TextbookSale[]>(STORAGE_KEYS.TEXTBOOK_SALES, []);
      salesList.unshift(newSale);
      setItem(STORAGE_KEYS.TEXTBOOK_SALES, salesList);

      const prevStock = tb.stock;
      const currentStock = Math.max(0, prevStock - qty);
      const tbIdx = textbooks.findIndex((t) => t.id === tb.id);
      if (tbIdx >= 0) {
        textbooks[tbIdx] = { ...tb, stock: currentStock, updatedAt: nowIso };
        setItem(STORAGE_KEYS.TEXTBOOKS, textbooks);
      }

      const tx = (api.recordInventoryTransaction as (
        t: Omit<TextbookInventoryTransaction, 'id' | 'createdAt'>
      ) => TextbookInventoryTransaction)({
        textbookId: tb.id,
        textbookTitle: tb.title,
        transactionType: 'sale',
        quantity: -qty,
        previousStock: prevStock,
        currentStock,
        referenceId: saleId,
        transactionDate: saleDate,
        memo: `${student.name} 원생에게 ${qty}권 판매 출고`,
      });

      let payment: TextbookPayment | undefined;
      if (initialPaid > 0) {
        payment = (api.saveTextbookPaymentDirect as (
          d: Omit<TextbookPayment, 'id' | 'createdAt' | 'receiptNumber'>
        ) => TextbookPayment)({
          textbookSaleId: saleId,
          studentId: student.id,
          studentName: student.name,
          textbookTitle: tb.title,
          paymentDate: saleDate,
          amount: initialPaid,
          paymentMethod: data.paymentMethod || 'card',
          memo: '교재 판매 시 현장 수납',
        });
      }

      return { sale: newSale, payment, transaction: tx };
    },

    cancelSale(saleId: string, reason?: string): boolean {
      const sales = getItem<TextbookSale[]>(STORAGE_KEYS.TEXTBOOK_SALES, []);
      const idx = sales.findIndex((s) => s.id === saleId);
      if (idx === -1) return false;

      const sale = sales[idx];
      const textbooks = (api.getTextbooks as () => Textbook[])();
      const tbIdx = textbooks.findIndex((t) => t.id === sale.textbookId);

      if (tbIdx >= 0) {
        const tb = textbooks[tbIdx];
        const prevStock = tb.stock;
        const currentStock = prevStock + sale.quantity;
        textbooks[tbIdx] = { ...tb, stock: currentStock, updatedAt: new Date().toISOString() };
        setItem(STORAGE_KEYS.TEXTBOOKS, textbooks);

        (api.recordInventoryTransaction as (
          t: Omit<TextbookInventoryTransaction, 'id' | 'createdAt'>
        ) => TextbookInventoryTransaction)({
          textbookId: tb.id,
          textbookTitle: tb.title,
          transactionType: 'return',
          quantity: sale.quantity,
          previousStock: prevStock,
          currentStock,
          referenceId: sale.id,
          transactionDate: new Date().toISOString().slice(0, 10),
          memo: `판매 취소/반품 처리: ${sale.studentName} (${reason || '사유 미입력'})`,
        });
      }

      sales.splice(idx, 1);
      setItem(STORAGE_KEYS.TEXTBOOK_SALES, sales);

      const payments = (api.getTextbookPayments as () => TextbookPayment[])();
      const remainingPayments = payments.filter((p) => p.textbookSaleId !== saleId);
      setItem(STORAGE_KEYS.TEXTBOOK_PAYMENTS, remainingPayments);

      return true;
    },

    getTextbookPayments(): TextbookPayment[] {
      return getItem<TextbookPayment[]>(STORAGE_KEYS.TEXTBOOK_PAYMENTS, []);
    },

    getPaymentsBySaleId(saleId: string): TextbookPayment[] {
      return (api.getTextbookPayments as () => TextbookPayment[])().filter(
        (p) => p.textbookSaleId === saleId
      );
    },

    getPaymentsByStudentId(studentId: string): TextbookPayment[] {
      return (api.getTextbookPayments as () => TextbookPayment[])().filter(
        (p) => p.studentId === studentId
      );
    },

    saveTextbookPaymentDirect(
      data: Omit<TextbookPayment, 'id' | 'createdAt' | 'receiptNumber'>
    ): TextbookPayment {
      const payments = (api.getTextbookPayments as () => TextbookPayment[])();
      const now = new Date();
      const ymStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
      const randNum = String(Math.floor(Math.random() * 900) + 100);
      const receiptNumber = `RCP-TB-${ymStr}-${randNum}`;

      const newPayment: TextbookPayment = {
        ...data,
        id: generateEntityId('tp'),
        receiptNumber,
        createdAt: now.toISOString(),
      };

      payments.unshift(newPayment);
      setItem(STORAGE_KEYS.TEXTBOOK_PAYMENTS, payments);
      return newPayment;
    },

    recordTextbookPayment(
      saleId: string,
      amount: number,
      paymentMethod: PaymentMethod = 'card',
      paymentDate?: string,
      memo?: string
    ): { payment: TextbookPayment; updatedSale: TextbookSale } {
      const sales = getItem<TextbookSale[]>(STORAGE_KEYS.TEXTBOOK_SALES, []);
      const idx = sales.findIndex((s) => s.id === saleId);
      if (idx === -1) throw new Error('해당 교재 판매 내역을 찾을 수 없습니다.');

      const sale = sales[idx];
      if (sale.unpaidAmount <= 0) throw new Error('이미 전액 납부 완료된 교재입니다.');

      const payAmount = Math.min(amount, sale.unpaidAmount);
      if (payAmount <= 0) throw new Error('납부 금액은 0원보다 커야 합니다.');

      const newPaidAmount = sale.paidAmount + payAmount;
      const newUnpaidAmount = Math.max(0, sale.totalAmount - newPaidAmount);
      const newStatus: 'unpaid' | 'partial' | 'paid' = newUnpaidAmount === 0 ? 'paid' : 'partial';
      const pDate = paymentDate || new Date().toISOString().slice(0, 10);

      const updatedSale: TextbookSale = {
        ...sale,
        paidAmount: newPaidAmount,
        unpaidAmount: newUnpaidAmount,
        status: newStatus,
        paymentMethod,
        updatedAt: new Date().toISOString(),
      };
      sales[idx] = updatedSale;
      setItem(STORAGE_KEYS.TEXTBOOK_SALES, sales);

      const payment = (api.saveTextbookPaymentDirect as (
        d: Omit<TextbookPayment, 'id' | 'createdAt' | 'receiptNumber'>
      ) => TextbookPayment)({
        textbookSaleId: sale.id,
        studentId: sale.studentId,
        studentName: sale.studentName,
        textbookTitle: sale.textbookTitle,
        paymentDate: pDate,
        amount: payAmount,
        paymentMethod,
        memo:
          memo ||
          (newStatus === 'paid'
            ? '교재비 전액 완납'
            : `교재비 부분 납부 (잔액 ₩${newUnpaidAmount.toLocaleString()})`),
      });

      return { payment, updatedSale };
    },

    getStudentBillingSummary(studentId: string, yearMonth?: string): StudentMonthlyBillingSummary {
      const ym = yearMonth || new Date().toISOString().slice(0, 7);
      const students = (api.getStudents as () => Student[])();
      const student = students.find((s) => s.id === studentId);
      const studentName = student ? student.name : '미상 원생';

      const invoices = (api.getInvoices as () => TuitionInvoice[])().filter(
        (inv) => inv.studentId === studentId && (!yearMonth || inv.yearMonth === ym)
      );
      const tuitionBilled = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
      const tuitionPaid = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
      const tuitionUnpaid = Math.max(0, tuitionBilled - tuitionPaid);
      const tuitionStatus =
        invoices.length === 0
          ? 'unpaid'
          : tuitionUnpaid === 0
            ? 'paid'
            : tuitionPaid > 0
              ? 'partial'
              : 'unpaid';

      const sales = (api.getTextbookSales as () => TextbookSale[])().filter(
        (s) => s.studentId === studentId && (!yearMonth || s.saleDate.startsWith(ym))
      );
      const textbookBilled = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      const textbookPaid = sales.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
      const textbookUnpaid = Math.max(0, textbookBilled - textbookPaid);
      const textbookStatus: 'unpaid' | 'partial' | 'paid' =
        sales.length === 0
          ? 'paid'
          : textbookUnpaid === 0
            ? 'paid'
            : textbookPaid > 0
              ? 'partial'
              : 'unpaid';

      return {
        studentId,
        studentName,
        yearMonth: ym,
        tuitionBilled,
        tuitionPaid,
        tuitionUnpaid,
        tuitionStatus,
        tuitionTotal: tuitionBilled,
        textbookBilled,
        textbookPaid,
        textbookUnpaid,
        textbookStatus,
        textbookTotal: textbookBilled,
        totalBilled: tuitionBilled + textbookBilled,
        totalPaid: tuitionPaid + textbookPaid,
        totalUnpaid: tuitionUnpaid + textbookUnpaid,
        grandTotal: tuitionBilled + textbookBilled,
        grandPaid: tuitionPaid + textbookPaid,
        grandUnpaid: tuitionUnpaid + textbookUnpaid,
        invoices,
        textbookSales: sales,
      };
    },

    getTextbookSalesByStudentId(studentId: string): TextbookSale[] {
      return (api.getTextbookSales as () => TextbookSale[])().filter((s) => s.studentId === studentId);
    },

    getAllStudentsBillingSummary(yearMonth?: string): StudentMonthlyBillingSummary[] {
      const students = (api.getStudents as () => Student[])().filter((s) => s.status === 'active');
      return students.map((s) =>
        (api.getStudentBillingSummary as (id: string, ym?: string) => StudentMonthlyBillingSummary)(
          s.id,
          yearMonth
        )
      );
    },

    recordCombinedPayment(req: CombinedPaymentRequest): {
      tuitionInvoice?: TuitionInvoice;
      textbookPayments: TextbookPayment[];
      totalPaidAmount: number;
    } {
      let tuitionInvoice: TuitionInvoice | undefined;
      const textbookPayments: TextbookPayment[] = [];
      let totalPaid = 0;

      if (req.tuitionAmount > 0) {
        const invoices = (api.getInvoices as () => TuitionInvoice[])().filter(
          (i) => i.studentId === req.studentId && i.yearMonth === req.yearMonth
        );
        if (invoices.length > 0) {
          const inv = invoices[0];
          const res = (
            api.recordPayment as (
              id: string,
              amount: number,
              method: PaymentMethod,
              notes?: string
            ) => TuitionInvoice | null
          )(inv.id, req.tuitionAmount, req.paymentMethod, req.memo);
          if (res) {
            tuitionInvoice = res;
            totalPaid += req.tuitionAmount;
          }
        }
      }

      if (req.textbookPayments && req.textbookPayments.length > 0) {
        req.textbookPayments.forEach((item) => {
          if (item.amount > 0) {
            const res = (
              api.recordTextbookPayment as (
                saleId: string,
                amount: number,
                method?: PaymentMethod,
                date?: string,
                memo?: string
              ) => { payment: TextbookPayment; updatedSale: TextbookSale }
            )(item.saleId, item.amount, req.paymentMethod, req.paymentDate, req.memo);
            if (res) {
              textbookPayments.push(res.payment);
              totalPaid += item.amount;
            }
          }
        });
      }

      return { tuitionInvoice, textbookPayments, totalPaidAmount: totalPaid };
    },

    getUnpaidTextbookSales(): (TextbookSale & { daysOverdue: number })[] {
      const sales = (api.getTextbookSales as () => TextbookSale[])();
      const today = new Date();

      return sales
        .filter((s) => s.status === 'unpaid' || s.status === 'partial')
        .map((s) => {
          const saleD = new Date(s.saleDate);
          const diffTime = Math.max(0, today.getTime() - saleD.getTime());
          const daysOverdue = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          return { ...s, daysOverdue };
        })
        .sort((a, b) => b.daysOverdue - a.daysOverdue);
    },

    getTextbookStats(yearMonth?: string): {
      monthlySaleAmount: number;
      monthlyPaidAmount: number;
      totalSalesAmount: number;
      totalPaidAmount: number;
      totalUnpaidAmount: number;
      unpaidStudentsCount: number;
      monthlyBooksSold: number;
      lowStockBooksCount: number;
    } {
      const ym = yearMonth || new Date().toISOString().slice(0, 7);
      const allSales = (api.getTextbookSales as () => TextbookSale[])();
      const allPayments = (api.getTextbookPayments as () => TextbookPayment[])();
      const allTextbooks = (api.getTextbooks as () => Textbook[])();

      const monthlySales = allSales.filter((s) => s.saleDate.startsWith(ym));
      const monthlySaleAmount = monthlySales.reduce((sum, s) => sum + s.totalAmount, 0);
      const monthlyBooksSold = monthlySales.reduce((sum, s) => sum + s.quantity, 0);

      const monthlyPayments = allPayments.filter((p) => p.paymentDate.startsWith(ym));
      const monthlyPaidAmount = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

      const unpaidSales = allSales.filter((s) => s.status === 'unpaid' || s.status === 'partial');
      const totalUnpaidAmount = unpaidSales.reduce((sum, s) => sum + s.unpaidAmount, 0);

      const unpaidStudentIds = new Set(unpaidSales.map((s) => s.studentId));
      const unpaidStudentsCount = unpaidStudentIds.size;

      const lowStockBooksCount = allTextbooks.filter((t) => t.stock <= t.minStock).length;

      return {
        monthlySaleAmount,
        monthlyPaidAmount,
        totalSalesAmount: monthlySaleAmount,
        totalPaidAmount: monthlyPaidAmount,
        totalUnpaidAmount,
        unpaidStudentsCount,
        monthlyBooksSold,
        lowStockBooksCount,
      };
    },
  };
}
