import type {
  Product,
  ProductSale,
  ProductSaleStatus,
  ProductStats,
} from '@/core/products/types';
import { STORAGE_KEYS } from '../adapters';
import { generateEntityId, getItem, setItem, type StorageApi } from './helpers';

function computeSaleStatus(total: number, paid: number): ProductSaleStatus {
  if (paid <= 0) return 'unpaid';
  if (paid >= total) return 'paid';
  return 'partial';
}

export function createProductStorage(_api: StorageApi) {
  return {
    getProducts(): Product[] {
      return getItem<Product[]>(STORAGE_KEYS.PRODUCTS, []);
    },

    getProductById(id: string): Product | undefined {
      return this.getProducts().find((p) => p.id === id);
    },

    saveProduct(input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Product {
      const list = this.getProducts();
      const now = new Date().toISOString();
      const salePrice = Number(input.salePrice) || 0;
      const costPrice = Number(input.costPrice) || 0;
      const stock = Number(input.stock) || 0;
      const minStock = Number(input.minStock) || 0;

      if (input.id) {
        const idx = list.findIndex((p) => p.id === input.id);
        const saved: Product = {
          id: input.id,
          name: input.name.trim(),
          productType: input.productType || 'other',
          sku: input.sku?.trim() || undefined,
          salePrice,
          costPrice,
          stock,
          minStock,
          isForSale: input.isForSale !== false,
          memo: input.memo?.trim() || undefined,
          createdAt: list[idx]?.createdAt || now,
          updatedAt: now,
        };
        if (idx >= 0) list[idx] = saved;
        else list.push(saved);
        setItem(STORAGE_KEYS.PRODUCTS, list);
        return saved;
      }

      const saved: Product = {
        id: generateEntityId('product'),
        name: input.name.trim(),
        productType: input.productType || 'other',
        sku: input.sku?.trim() || undefined,
        salePrice,
        costPrice,
        stock,
        minStock,
        isForSale: input.isForSale !== false,
        memo: input.memo?.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      list.push(saved);
      setItem(STORAGE_KEYS.PRODUCTS, list);
      return saved;
    },

    deleteProduct(id: string): boolean {
      const list = this.getProducts();
      const filtered = list.filter((p) => p.id !== id);
      if (filtered.length === list.length) return false;
      setItem(STORAGE_KEYS.PRODUCTS, filtered);
      return true;
    },

    adjustProductStock(productId: string, delta: number): Product | null {
      const list = this.getProducts();
      const idx = list.findIndex((p) => p.id === productId);
      if (idx < 0) return null;
      const next = Math.max(0, list[idx].stock + delta);
      list[idx] = { ...list[idx], stock: next, updatedAt: new Date().toISOString() };
      setItem(STORAGE_KEYS.PRODUCTS, list);
      return list[idx];
    },

    getProductSales(): ProductSale[] {
      return getItem<ProductSale[]>(STORAGE_KEYS.PRODUCT_SALES, []);
    },

    saveProductSale(
      input: Omit<ProductSale, 'id' | 'createdAt' | 'updatedAt' | 'unpaidAmount' | 'status'> & {
        id?: string;
        status?: ProductSaleStatus;
      },
      options?: { deductStock?: boolean }
    ): ProductSale {
      const list = this.getProductSales();
      const now = new Date().toISOString();
      const totalAmount = Number(input.totalAmount);
      const paidAmount = Number(input.paidAmount) || 0;
      const unpaidAmount = Math.max(0, totalAmount - paidAmount);
      const status = input.status || computeSaleStatus(totalAmount, paidAmount);

      const saved: ProductSale = {
        ...input,
        id: input.id || generateEntityId('product_sale'),
        unpaidAmount,
        status,
        createdAt: input.id
          ? list.find((s) => s.id === input.id)?.createdAt || now
          : now,
        updatedAt: now,
      };

      const idx = list.findIndex((s) => s.id === saved.id);
      const isNew = idx < 0;
      if (idx >= 0) list[idx] = saved;
      else list.unshift(saved);
      setItem(STORAGE_KEYS.PRODUCT_SALES, list);

      if (isNew && options?.deductStock !== false && saved.status !== 'cancelled') {
        this.adjustProductStock(saved.productId, -saved.quantity);
      }

      return saved;
    },

    cancelProductSale(id: string): ProductSale | null {
      const list = this.getProductSales();
      const idx = list.findIndex((s) => s.id === id);
      if (idx < 0) return null;
      const sale = list[idx];
      if (sale.status === 'cancelled') return sale;

      const updated: ProductSale = {
        ...sale,
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      };
      list[idx] = updated;
      setItem(STORAGE_KEYS.PRODUCT_SALES, list);
      this.adjustProductStock(sale.productId, sale.quantity);
      return updated;
    },

    deleteProductSale(id: string): boolean {
      const list = this.getProductSales();
      const sale = list.find((s) => s.id === id);
      if (!sale) return false;
      if (sale.status !== 'cancelled') {
        this.adjustProductStock(sale.productId, sale.quantity);
      }
      setItem(
        STORAGE_KEYS.PRODUCT_SALES,
        list.filter((s) => s.id !== id)
      );
      return true;
    },

    getProductStats(yearMonth?: string): ProductStats {
      const ym = yearMonth || new Date().toISOString().slice(0, 7);
      const products = this.getProducts();
      const sales = this.getProductSales().filter((s) => s.status !== 'cancelled');
      const monthSales = sales.filter((s) => s.saleDate.startsWith(ym));

      const byProduct = new Map<string, { name: string; quantity: number; amount: number }>();
      for (const s of monthSales) {
        const prev = byProduct.get(s.productId) || {
          name: s.productName,
          quantity: 0,
          amount: 0,
        };
        prev.quantity += s.quantity;
        prev.amount += s.totalAmount;
        byProduct.set(s.productId, prev);
      }

      const topProducts = Array.from(byProduct.entries())
        .map(([productId, v]) => ({ productId, ...v }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      return {
        yearMonth: ym,
        monthlySaleAmount: monthSales.reduce((sum, s) => sum + s.totalAmount, 0),
        monthlyPaidAmount: monthSales.reduce((sum, s) => sum + s.paidAmount, 0),
        monthlyUnitsSold: monthSales.reduce((sum, s) => sum + s.quantity, 0),
        totalUnpaidAmount: sales.reduce((sum, s) => sum + s.unpaidAmount, 0),
        lowStockCount: products.filter((p) => p.isForSale && p.stock <= p.minStock).length,
        productCount: products.length,
        topProducts,
      };
    },
  };
}
