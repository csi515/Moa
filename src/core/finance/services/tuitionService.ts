import { StorageService } from '@/services/storage';
import { getCoreClient, isSupabaseConfigured } from '@/lib/supabase';
import type {
  AcademyEvent,
  AcademySettings,
  CombinedPaymentRequest,
  PaymentMethod,
  Student,
  StudentMonthlyBillingSummary,
  TextbookSale,
  TuitionInvoice,
  TuitionPayment,
} from '@/types';
import { findExistingStudentMonthInvoice } from '@/core/finance/invoiceDedupe';

export { findExistingStudentMonthInvoice };

/**
 * 수강료·청구 도메인 파사드.
 * UI는 StorageService 대신 이 Service를 사용한다.
 */
export const TuitionService = {
  getInvoices(): TuitionInvoice[] {
    return StorageService.getInvoices();
  },

  getInvoicesByStudent(studentId: string): TuitionInvoice[] {
    return StorageService.getInvoices().filter((i) => i.studentId === studentId);
  },

  getInvoiceById(id: string): TuitionInvoice | undefined {
    return StorageService.getInvoices().find((i) => i.id === id);
  },

  /** 동일 학생·연월 청구서 (있으면 반환) */
  findInvoiceForStudentMonth(
    studentId: string,
    yearMonth: string
  ): TuitionInvoice | undefined {
    return findExistingStudentMonthInvoice(this.getInvoices(), studentId, yearMonth);
  },

  getSettings(): AcademySettings {
    return StorageService.getSettings();
  },

  getTextbookSales(): TextbookSale[] {
    return StorageService.getTextbookSales();
  },

  getEvents(): AcademyEvent[] {
    return StorageService.getEvents();
  },

  linkTextbookSalesToInvoice(saleIds: string[], invoiceId: string): void {
    StorageService.linkTextbookSalesToInvoice(saleIds, invoiceId);
  },

  saveInvoice(inv: Omit<TuitionInvoice, 'id'> & { id?: string }): TuitionInvoice {
    return StorageService.saveInvoice(inv);
  },

  deleteInvoice(id: string): boolean {
    return StorageService.deleteInvoice(id);
  },

  createInvoiceForStudent(
    student: Student,
    yearMonth?: string,
    options?: { includeExtras?: boolean; extraFee?: number; extraFeeLabel?: string }
  ): TuitionInvoice | null {
    return StorageService.createInvoiceForStudent(student, yearMonth, options);
  },

  generateMonthlyInvoicesForAllActive(yearMonth: string): number {
    return StorageService.generateMonthlyInvoicesForAllActive(yearMonth);
  },

  /** 청구서 수동 발송 (알림 포함). 자동 발송 금지. */
  sendInvoice(invoiceId: string): TuitionInvoice | null {
    return StorageService.sendInvoice(invoiceId);
  },

  sendInvoices(invoiceIds: string[]): number {
    return StorageService.sendInvoices(invoiceIds);
  },

  bulkCreateAndSendInvoices(params: {
    studentIds: string[];
    yearMonth: string;
    title: string;
    amount: number;
    dueDate: string;
    notes?: string;
  }): { created: number; sent: number } {
    return StorageService.bulkCreateAndSendInvoices(params);
  },

  /**
   * 현금영수증 발행 요청.
   * 로컬 캐시를 갱신하고, 클라우드 설정 시 request_payment_cash_receipt RPC를 호출한다.
   */
  async requestCashReceipt(invoiceId: string): Promise<TuitionInvoice | null> {
    const updated = StorageService.requestCashReceipt(invoiceId);
    if (!updated) return null;

    if (isSupabaseConfigured()) {
      try {
        const { error } = await getCoreClient().rpc('request_payment_cash_receipt' as never, {
          p_payment_id: invoiceId,
        } as never);
        if (error) {
          console.warn('request_payment_cash_receipt RPC failed:', error.message);
        }
      } catch (err) {
        console.warn('request_payment_cash_receipt unavailable:', err);
      }
    }
    return updated;
  },

  recordPayment(
    invoiceId: string,
    amount: number,
    method: PaymentMethod,
    notes?: string,
    paymentDate?: string,
    options?: { cashReceiptIssued?: boolean }
  ): TuitionInvoice | null {
    return StorageService.recordPayment(invoiceId, amount, method, notes, paymentDate, options);
  },

  recordCombinedPayment(req: CombinedPaymentRequest): {
    tuitionInvoice?: TuitionInvoice;
    textbookPayments: unknown[];
    totalPaidAmount: number;
  } {
    return StorageService.recordCombinedPayment(req);
  },

  getTuitionPayments(): TuitionPayment[] {
    return StorageService.getTuitionPayments();
  },

  getStudentBillingSummary(
    studentId: string,
    yearMonth?: string
  ): StudentMonthlyBillingSummary {
    return StorageService.getStudentBillingSummary(studentId, yearMonth);
  },
};
