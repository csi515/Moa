import type {
  CombinedPaymentRequest,
  PaymentMethod,
  Student,
  Textbook,
  TextbookInventoryTransaction,
  TextbookPayment,
  TextbookSale,
  TuitionInvoice,
} from '@/types';
import { STORAGE_KEYS } from '@/services/adapters';
import { generateEntityId, getItem, setItem, type StorageApi } from '@/services/storage/helpers';
import {
  deleteLinkedIncome,
  deleteLinkedIncomesForPaymentIds,
  upsertLinkedIncome,
} from '@/core/finance/billingIncomeLink';
import type { LinkedTextbookPaymentOptions } from '@/core/finance/linkedTextbookSettle';
import { textbookCoreStock } from '@/modules/piano/services/textbookCoreStock';
import {
  buildLinkedTextbookSaleIds,
  resolveTextbookCoreSaleId,
} from '@/modules/piano/services/textbookCoreSaleLink';
import {
  isTextbookSaleDbAvailable,
  requireTextbookOrgId,
  textbookSaleDb,
} from '@/modules/piano/services/textbookSaleDb';
import {
  persistSaleAfterCoreSuccess,
  type CreateSalePersistDeps,
} from '@/modules/piano/services/textbookSalePersist';

function paymentStatus(
  totalAmount: number,
  paidAmount: number
): 'unpaid' | 'partial' | 'paid' {
  const unpaid = Math.max(0, totalAmount - paidAmount);
  if (unpaid === 0) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'unpaid';
}

function buildReceiptNumber(): string {
  const now = new Date();
  const ymStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const randNum = String(Math.floor(Math.random() * 900) + 100);
  return `RCP-TB-${ymStr}-${randNum}`;
}

function mirrorSales(sales: TextbookSale[]): void {
  setItem(STORAGE_KEYS.TEXTBOOK_SALES, sales);
}

function mirrorPayments(payments: TextbookPayment[]): void {
  setItem(STORAGE_KEYS.TEXTBOOK_PAYMENTS, payments);
}

function getOrganizationIdSafe(): string | null {
  try {
    return requireTextbookOrgId();
  } catch {
    return null;
  }
}

const defaultCreateSalePersistDeps: CreateSalePersistDeps = {
  insertSale: (orgId, sale) => textbookSaleDb.insertSale(orgId, sale),
  insertPayment: (orgId, payment) => textbookSaleDb.insertPayment(orgId, payment),
  deleteSale: (orgId, saleId) => textbookSaleDb.deleteSale(orgId, saleId),
  compensateCoreSale: (coreSaleId) => textbookCoreStock.compensateCoreSale(coreSaleId),
  upsertLinkedIncome,
};

export {
  persistSaleAfterCoreSuccess,
  type CreateSalePersistDeps,
} from '@/modules/piano/services/textbookSalePersist';

/**
 * 교재 판매·수납·취소 orchestration (Core/DB/Finance).
 * local mirror CRUD는 textbookSalesStorage.
 */
export function createTextbookSaleService(api: StorageApi) {
  return {
    /** 월 청구 합산 시 교재 판매에 billingInvoiceId 연결 */
    linkTextbookSalesToInvoice(saleIds: string[], invoiceId: string): void {
      if (saleIds.length === 0) return;
      const sales = getItem<TextbookSale[]>(STORAGE_KEYS.TEXTBOOK_SALES, []);
      const linkSet = new Set(saleIds);
      const next = sales.map((s) =>
        linkSet.has(s.id)
          ? { ...s, billingInvoiceId: invoiceId, updatedAt: new Date().toISOString() }
          : s
      );
      mirrorSales(next);

      if (isTextbookSaleDbAvailable()) {
        const orgId = getOrganizationIdSafe();
        if (orgId) {
          void (async () => {
            for (const sale of next.filter((s) => linkSet.has(s.id))) {
              try {
                await textbookSaleDb.updateSale(orgId, sale.id, sale);
              } catch (err) {
                console.error('[linkTextbookSalesToInvoice] DB 갱신 실패', err);
              }
            }
          })();
        }
      }
    },

    async createSale(data: {
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
    }): Promise<{
      sale: TextbookSale;
      payment?: TextbookPayment;
      transaction: TextbookInventoryTransaction;
    }> {
      const students = (api.getStudents as () => Student[])();
      const student = students.find((s) => s.id === data.studentId);
      const textbooks = (api.getTextbooks as () => Textbook[])();
      const tb = textbooks.find((t) => t.id === data.textbookId);

      if (!tb) throw new Error('선택한 교재 정보를 찾을 수 없습니다.');
      if (tb.isForSale === false) {
        throw new Error('사용 중지된 교재입니다. 교재 관리에서 다시 사용 설정한 뒤 판매하세요.');
      }
      if (!student) throw new Error('선택한 원생 정보를 찾을 수 없습니다.');

      const qty = Math.max(1, Number(data.quantity) || 1);
      const unitPrice = Number(data.unitPrice ?? tb.salePrice ?? tb.price ?? 15000);
      const discount = Math.max(0, Number(data.discount) || 0);
      const totalAmount = Math.max(0, qty * unitPrice - discount);
      const initialPaid = Math.min(totalAmount, Math.max(0, Number(data.initialPaymentAmount) || 0));
      const unpaidAmount = Math.max(0, totalAmount - initialPaid);
      const status = paymentStatus(totalAmount, initialPaid);

      const now = new Date();
      const nowIso = now.toISOString();
      const saleDate = data.saleDate || nowIso.slice(0, 10);

      if (isTextbookSaleDbAvailable() && textbookCoreStock.isAvailable()) {
        const orgId = requireTextbookOrgId();
        await textbookSaleDb.assertCustomerExists(orgId, student.id);
        await textbookSaleDb.ensurePianoTextbook(orgId, tb);

        let saleId = generateEntityId('ts');
        let coreSaleId: string | null = null;
        let prevStock = tb.stock;
        let currentStock = Math.max(0, prevStock - qty);

        const linked = await textbookCoreStock.createCoreLinkedSale({
          textbook: tb,
          studentId: student.id,
          quantity: qty,
          unitPrice,
          discount,
          paymentMethod: data.paymentMethod,
          memo: data.memo,
        });
        const ids = buildLinkedTextbookSaleIds(linked.coreSale.id);
        saleId = ids.id;
        coreSaleId = ids.coreSaleId;
        prevStock = linked.previousStock;
        currentStock = linked.currentStock;

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
          coreSaleId,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        const { payment } = await persistSaleAfterCoreSuccess({
          orgId,
          newSale,
          coreSaleId: coreSaleId!,
          initialPaid,
          saleDate,
          paymentMethod: data.paymentMethod,
          textbookTitle: tb.title,
          studentName: student.name,
          nowIso,
          deps: defaultCreateSalePersistDeps,
        });

        const salesList = getItem<TextbookSale[]>(STORAGE_KEYS.TEXTBOOK_SALES, []);
        salesList.unshift(newSale);
        mirrorSales(salesList);
        if (payment) {
          const payments = getItem<TextbookPayment[]>(STORAGE_KEYS.TEXTBOOK_PAYMENTS, []);
          payments.unshift(payment);
          mirrorPayments(payments);
        }

        const tx: TextbookInventoryTransaction = {
          id: `core-sale-${saleId}`,
          textbookId: tb.id,
          textbookTitle: tb.title,
          transactionType: 'sale',
          quantity: -qty,
          previousStock: prevStock,
          currentStock,
          referenceId: saleId,
          transactionDate: saleDate,
          memo: `${student.name} 원생에게 ${qty}권 판매 출고`,
          createdAt: nowIso,
        };
        return { sale: newSale, payment, transaction: tx };
      }

      return createSaleLegacyLocal(api, {
        student,
        tb,
        qty,
        unitPrice,
        discount,
        totalAmount,
        initialPaid,
        unpaidAmount,
        status,
        saleDate,
        nowIso,
        data,
      });
    },

    async cancelSale(saleId: string, reason?: string): Promise<boolean> {
      const sales = getItem<TextbookSale[]>(STORAGE_KEYS.TEXTBOOK_SALES, []);
      const idx = sales.findIndex((s) => s.id === saleId);
      if (idx === -1) return false;

      const sale = sales[idx];
      const textbooks = (api.getTextbooks as () => Textbook[])();
      const tbIdx = textbooks.findIndex((t) => t.id === sale.textbookId);
      const coreSaleId = resolveTextbookCoreSaleId(sale);
      const dbMode = isTextbookSaleDbAvailable();

      if (tbIdx >= 0) {
        const tb = textbooks[tbIdx];
        if (textbookCoreStock.isAvailable() && coreSaleId) {
          const saleReturn = await textbookCoreStock.cancelCoreLinkedSale({
            coreSaleId,
            quantity: sale.quantity,
            reason: `판매 취소/반품 처리: ${sale.studentName} (${reason || '사유 미입력'})`,
          });
          if (saleReturn) {
            await textbookCoreStock.syncStockMirror(tb.id);
          } else {
            await textbookCoreStock.applySaleRestore({
              textbookId: tb.id,
              quantity: sale.quantity,
              saleId: sale.id,
              memo: `판매 취소/반품 처리: ${sale.studentName} (${reason || '사유 미입력'})`,
            });
          }
        } else if (textbookCoreStock.isAvailable()) {
          await textbookCoreStock.applySaleRestore({
            textbookId: tb.id,
            quantity: sale.quantity,
            saleId: sale.id,
            memo: `판매 취소/반품 처리: ${sale.studentName} (${reason || '사유 미입력'})`,
          });
        } else {
          const prevStock = tb.stock;
          const currentStock = prevStock + sale.quantity;
          textbooks[tbIdx] = {
            ...tb,
            stock: currentStock,
            currentStock,
            updatedAt: new Date().toISOString(),
          };
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
      }

      const payments = (api.getTextbookPayments as () => TextbookPayment[])();
      const removedIds = payments.filter((p) => p.textbookSaleId === saleId).map((p) => p.id);

      if (dbMode) {
        const orgId = requireTextbookOrgId();
        try {
          await textbookSaleDb.deletePaymentsForSale(orgId, saleId);
          await textbookSaleDb.deleteSale(orgId, saleId);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          if (!/0 rows|not found|PGRST116/i.test(msg)) {
            console.error('[cancelSale] DB 삭제', err);
          }
        }
      }

      deleteLinkedIncomesForPaymentIds('textbook', removedIds);
      sales.splice(idx, 1);
      mirrorSales(sales);
      mirrorPayments(payments.filter((p) => p.textbookSaleId !== saleId));
      return true;
    },

    async recordTextbookPayment(
      saleId: string,
      amount: number,
      paymentMethod: PaymentMethod = 'card',
      paymentDate?: string,
      memo?: string,
      options?: LinkedTextbookPaymentOptions
    ): Promise<{ payment: TextbookPayment; updatedSale: TextbookSale }> {
      const sales = getItem<TextbookSale[]>(STORAGE_KEYS.TEXTBOOK_SALES, []);
      const idx = sales.findIndex((s) => s.id === saleId);
      if (idx === -1) throw new Error('해당 교재 판매 내역을 찾을 수 없습니다.');

      const sale = sales[idx];
      if (sale.billingInvoiceId && !options?.allowLinkedInvoice) {
        throw new Error('월 청구에 합산된 교재입니다. 수강료 청구서에서 수납해 주세요.');
      }
      if (sale.unpaidAmount <= 0) throw new Error('이미 전액 납부 완료된 교재입니다.');

      const payAmount = Math.min(amount, sale.unpaidAmount);
      if (payAmount <= 0) throw new Error('납부 금액은 0원보다 커야 합니다.');

      const newPaidAmount = sale.paidAmount + payAmount;
      const newUnpaidAmount = Math.max(0, sale.totalAmount - newPaidAmount);
      const newStatus = paymentStatus(sale.totalAmount, newPaidAmount);
      const pDate = paymentDate || new Date().toISOString().slice(0, 10);
      const nowIso = new Date().toISOString();

      const updatedSale: TextbookSale = {
        ...sale,
        paidAmount: newPaidAmount,
        unpaidAmount: newUnpaidAmount,
        status: newStatus,
        paymentMethod,
        updatedAt: nowIso,
      };

      const payment: TextbookPayment = {
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
        id: generateEntityId('tp'),
        receiptNumber: buildReceiptNumber(),
        createdAt: nowIso,
      };

      if (isTextbookSaleDbAvailable()) {
        const orgId = requireTextbookOrgId();
        const dbSale = await textbookSaleDb.getSale(orgId, saleId);
        if (dbSale) {
          const savedPayment = await textbookSaleDb.insertPayment(orgId, payment);
          try {
            await textbookSaleDb.updateSale(orgId, saleId, updatedSale);
          } catch (updErr) {
            try {
              await textbookSaleDb.deletePayment(orgId, savedPayment.id);
            } catch (delErr) {
              console.error('[recordTextbookPayment] 판매 갱신 실패 후 수납 롤백 실패', delErr);
            }
            throw updErr;
          }
          payment.id = savedPayment.id;
          payment.receiptNumber = savedPayment.receiptNumber || payment.receiptNumber;
          payment.createdAt = savedPayment.createdAt || payment.createdAt;
        }
      }

      sales[idx] = updatedSale;
      mirrorSales(sales);
      const payments = getItem<TextbookPayment[]>(STORAGE_KEYS.TEXTBOOK_PAYMENTS, []);
      payments.unshift(payment);
      mirrorPayments(payments);

      if (!options?.skipIncome) {
        upsertLinkedIncome({
          sourceType: 'textbook',
          paymentId: payment.id,
          date: pDate,
          amount: payAmount,
          paymentMethod,
          description: `교재비 · ${sale.textbookTitle} · ${sale.studentName}`,
          payer: sale.studentName,
          memo: payment.memo,
        });
      }

      return { payment, updatedSale };
    },

    async reverseTextbookPayment(paymentId: string): Promise<boolean> {
      const payments = (api.getTextbookPayments as () => TextbookPayment[])();
      const payment = payments.find((p) => p.id === paymentId);
      if (!payment) return false;

      const sales = getItem<TextbookSale[]>(STORAGE_KEYS.TEXTBOOK_SALES, []);
      const idx = sales.findIndex((s) => s.id === payment.textbookSaleId);
      let updatedSale: TextbookSale | null = null;
      if (idx >= 0) {
        const sale = sales[idx];
        const newPaid = Math.max(0, sale.paidAmount - payment.amount);
        const newUnpaid = Math.max(0, sale.totalAmount - newPaid);
        updatedSale = {
          ...sale,
          paidAmount: newPaid,
          unpaidAmount: newUnpaid,
          status: paymentStatus(sale.totalAmount, newPaid),
          updatedAt: new Date().toISOString(),
        };
        sales[idx] = updatedSale;
      }

      if (isTextbookSaleDbAvailable()) {
        const orgId = requireTextbookOrgId();
        try {
          await textbookSaleDb.deletePayment(orgId, paymentId);
          if (updatedSale) {
            await textbookSaleDb.updateSale(orgId, updatedSale.id, updatedSale);
          }
        } catch (err) {
          console.error('[reverseTextbookPayment] DB', err);
        }
      }

      mirrorSales(sales);
      mirrorPayments(payments.filter((p) => p.id !== paymentId));
      deleteLinkedIncome('textbook', paymentId);
      return true;
    },

    async recordCombinedPayment(req: CombinedPaymentRequest): Promise<{
      tuitionInvoice?: TuitionInvoice;
      textbookPayments: TextbookPayment[];
      totalPaidAmount: number;
    }> {
      let tuitionInvoice: TuitionInvoice | undefined;
      const textbookPayments: TextbookPayment[] = [];
      let totalPaid = 0;

      const tuitionItems =
        req.tuitionPayments && req.tuitionPayments.length > 0
          ? req.tuitionPayments
          : req.tuitionAmount && req.tuitionAmount > 0
            ? (() => {
                const invoices = (api.getInvoices as () => TuitionInvoice[])().filter(
                  (i) => i.studentId === req.studentId && i.yearMonth === req.yearMonth
                );
                return invoices[0]
                  ? [{ invoiceId: invoices[0].id, amount: req.tuitionAmount }]
                  : [];
              })()
            : [];

      for (const item of tuitionItems) {
        if (item.amount <= 0) continue;
        const res = (
          api.recordPayment as (
            id: string,
            amount: number,
            method: PaymentMethod,
            notes?: string,
            paymentDate?: string
          ) => TuitionInvoice | null
        )(item.invoiceId, item.amount, req.paymentMethod, req.memo, req.paymentDate);
        if (res) {
          tuitionInvoice = res;
          totalPaid += item.amount;
        }
      }

      if (req.textbookPayments && req.textbookPayments.length > 0) {
        for (const item of req.textbookPayments) {
          if (item.amount > 0) {
            const res = await (
              api.recordTextbookPayment as (
                saleId: string,
                amount: number,
                method?: PaymentMethod,
                date?: string,
                memo?: string
              ) => Promise<{ payment: TextbookPayment; updatedSale: TextbookSale }>
            )(item.saleId, item.amount, req.paymentMethod, req.paymentDate, req.memo);
            if (res) {
              textbookPayments.push(res.payment);
              totalPaid += item.amount;
            }
          }
        }
      }

      return { tuitionInvoice, textbookPayments, totalPaidAmount: totalPaid };
    },
  };
}

export type TextbookSaleServiceApi = ReturnType<typeof createTextbookSaleService>;

async function createSaleLegacyLocal(
  api: StorageApi,
  ctx: {
    student: Student;
    tb: Textbook;
    qty: number;
    unitPrice: number;
    discount: number;
    totalAmount: number;
    initialPaid: number;
    unpaidAmount: number;
    status: 'unpaid' | 'partial' | 'paid';
    saleDate: string;
    nowIso: string;
    data: {
      paymentMethod?: PaymentMethod | null;
      memo?: string;
      teacherId?: string;
      teacherName?: string;
    };
  }
): Promise<{
  sale: TextbookSale;
  payment?: TextbookPayment;
  transaction: TextbookInventoryTransaction;
}> {
  const {
    student,
    tb,
    qty,
    unitPrice,
    discount,
    totalAmount,
    initialPaid,
    unpaidAmount,
    status,
    saleDate,
    nowIso,
    data,
  } = ctx;
  const saleId = generateEntityId('ts');
  const prevStock = tb.stock;
  const currentStock = Math.max(0, prevStock - qty);
  const textbooks = (api.getTextbooks as () => Textbook[])();
  const tbIdx = textbooks.findIndex((t) => t.id === tb.id);
  if (tbIdx >= 0) {
    textbooks[tbIdx] = {
      ...tb,
      stock: currentStock,
      currentStock,
      updatedAt: nowIso,
    };
    setItem(STORAGE_KEYS.TEXTBOOKS, textbooks);
  }

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
  mirrorSales(salesList);

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
    payment = (
      api.saveTextbookPaymentDirect as (
        d: Omit<TextbookPayment, 'id' | 'createdAt' | 'receiptNumber'>
      ) => TextbookPayment
    )({
      textbookSaleId: saleId,
      studentId: student.id,
      studentName: student.name,
      textbookTitle: tb.title,
      paymentDate: saleDate,
      amount: initialPaid,
      paymentMethod: data.paymentMethod || 'card',
      memo: '교재 판매 시 현장 수납',
    });
    upsertLinkedIncome({
      sourceType: 'textbook',
      paymentId: payment.id,
      date: saleDate,
      amount: initialPaid,
      paymentMethod: data.paymentMethod || 'card',
      description: `교재비 · ${tb.title} · ${student.name}`,
      payer: student.name,
      memo: '교재 판매 시 현장 수납',
    });
  }

  return { sale: newSale, payment, transaction: tx };
}
