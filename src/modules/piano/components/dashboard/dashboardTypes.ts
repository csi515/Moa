import { StorageService } from '@/services/storage';

export type PianoDashboardStats = ReturnType<(typeof StorageService)['getDashboardStats']>;
export type PianoTextbookStats = ReturnType<(typeof StorageService)['getTextbookStats']>;
export type PianoTextbookSale = ReturnType<(typeof StorageService)['getTextbookSales']>[number];
