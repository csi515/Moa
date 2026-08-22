import type { Textbook, TextbookInventoryTransaction } from '../../types';
import { STORAGE_KEYS } from '../adapters';
import { generateEntityId, getItem, setItem, type StorageApi } from './helpers';

/** 교재 목록·재고·입출고 이력 */
export function createTextbookCatalogStorage(api: StorageApi) {
  return {
    getTextbooks(): Textbook[] {
      return getItem<Textbook[]>(STORAGE_KEYS.TEXTBOOKS, []);
    },

    getTextbookById(id: string): Textbook | undefined {
      return (api.getTextbooks as () => Textbook[])().find((t) => t.id === id);
    },

    saveTextbook(tb: Partial<Textbook> & { title: string }): Textbook {
      const list = (api.getTextbooks as () => Textbook[])();
      const nowStr = new Date().toISOString();
      const price = Number(tb.salePrice ?? tb.price ?? 15000);
      const cost = Number(tb.costPrice ?? Math.round(price * 0.6));
      const stock = Number(tb.stock ?? 0);
      const minStock = Number(tb.minStock ?? 5);

      let saved: Textbook;
      if (tb.id) {
        const idx = list.findIndex((t) => t.id === tb.id);
        if (idx >= 0) {
          const prev = list[idx];
          saved = {
            ...prev,
            ...tb,
            price,
            salePrice: price,
            costPrice: cost,
            stock,
            minStock,
            isForSale: tb.isForSale !== undefined ? tb.isForSale : true,
            updatedAt: nowStr,
          };
          list[idx] = saved;
        } else {
          saved = {
            id: tb.id,
            title: tb.title,
            publisher: tb.publisher || '기타출판',
            author: tb.author || '',
            isbn: tb.isbn || '',
            level: tb.level || '기초',
            price,
            salePrice: price,
            costPrice: cost,
            stock,
            minStock,
            isForSale: tb.isForSale !== undefined ? tb.isForSale : true,
            memo: tb.memo || '',
            createdAt: nowStr,
            updatedAt: nowStr,
          };
          list.push(saved);
        }
      } else {
        const newId = `tb-${Date.now()}`;
        saved = {
          id: newId,
          title: tb.title,
          publisher: tb.publisher || '기타출판',
          author: tb.author || '',
          isbn: tb.isbn || '',
          level: tb.level || '기초',
          price,
          salePrice: price,
          costPrice: cost,
          stock,
          minStock,
          isForSale: tb.isForSale !== undefined ? tb.isForSale : true,
          memo: tb.memo || '',
          createdAt: nowStr,
          updatedAt: nowStr,
        };
        list.push(saved);

        if (stock > 0) {
          (api.recordInventoryTransaction as (
            tx: Omit<TextbookInventoryTransaction, 'id' | 'createdAt'>
          ) => TextbookInventoryTransaction)({
            textbookId: newId,
            textbookTitle: saved.title,
            transactionType: 'inbound',
            quantity: stock,
            previousStock: 0,
            currentStock: stock,
            transactionDate: new Date().toISOString().slice(0, 10),
            memo: '신규 교재 등록 시 초기 재고 설정',
          });
        }
      }
      setItem(STORAGE_KEYS.TEXTBOOKS, list);
      return saved;
    },

    deleteTextbook(id: string): boolean {
      const list = (api.getTextbooks as () => Textbook[])();
      const filtered = list.filter((t) => t.id !== id);
      if (filtered.length !== list.length) {
        setItem(STORAGE_KEYS.TEXTBOOKS, filtered);
        return true;
      }
      return false;
    },

    adjustStock(
      textbookId: string,
      quantityDelta: number,
      transactionType: 'inbound' | 'adjust' | 'return' = 'inbound',
      memo?: string
    ): { textbook: Textbook; transaction: TextbookInventoryTransaction } | null {
      const list = (api.getTextbooks as () => Textbook[])();
      const idx = list.findIndex((t) => t.id === textbookId);
      if (idx === -1) return null;

      const tb = list[idx];
      const prevStock = tb.stock;
      const newStock = Math.max(0, prevStock + quantityDelta);

      const updatedTb: Textbook = {
        ...tb,
        stock: newStock,
        updatedAt: new Date().toISOString(),
      };
      list[idx] = updatedTb;
      setItem(STORAGE_KEYS.TEXTBOOKS, list);

      const tx = (api.recordInventoryTransaction as (
        tx: Omit<TextbookInventoryTransaction, 'id' | 'createdAt'>
      ) => TextbookInventoryTransaction)({
        textbookId: tb.id,
        textbookTitle: tb.title,
        transactionType,
        quantity: quantityDelta,
        previousStock: prevStock,
        currentStock: newStock,
        transactionDate: new Date().toISOString().slice(0, 10),
        memo:
          memo ||
          `${transactionType === 'inbound' ? '교재 입고' : transactionType === 'return' ? '반품 입고' : '재고 수동 조정'}`,
      });

      return { textbook: updatedTb, transaction: tx };
    },

    getTextbookInventoryTransactions(): TextbookInventoryTransaction[] {
      return getItem<TextbookInventoryTransaction[]>(STORAGE_KEYS.TEXTBOOK_INVENTORY_TRANSACTIONS, []);
    },

    getTransactionsByTextbookId(textbookId: string): TextbookInventoryTransaction[] {
      return (api.getTextbookInventoryTransactions as () => TextbookInventoryTransaction[])().filter(
        (t) => t.textbookId === textbookId
      );
    },

    recordInventoryTransaction(
      tx: Omit<TextbookInventoryTransaction, 'id' | 'createdAt'>
    ): TextbookInventoryTransaction {
      const list = (api.getTextbookInventoryTransactions as () => TextbookInventoryTransaction[])();
      const newTx: TextbookInventoryTransaction = {
        ...tx,
        id: generateEntityId('tit'),
        createdAt: new Date().toISOString(),
      };
      list.unshift(newTx);
      setItem(STORAGE_KEYS.TEXTBOOK_INVENTORY_TRANSACTIONS, list);
      return newTx;
    },

    getLowStockTextbooks(): Textbook[] {
      return (api.getTextbooks as () => Textbook[])().filter((t) => t.stock <= t.minStock);
    },
  };
}
