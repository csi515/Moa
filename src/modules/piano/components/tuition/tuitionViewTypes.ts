export type ViewMode = 'invoices' | 'combined';

export interface TuitionStats {
  totalBilled: number;
  totalPaid: number;
  totalUnpaid: number;
  collectionRate: number;
  unpaidCount: number;
  totalCount: number;
}
