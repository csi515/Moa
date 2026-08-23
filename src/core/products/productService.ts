import { StorageService } from '@/services/storage';
import type { Product, ProductSale, ProductStats } from './types';

export const ProductService = {
  getProducts(): Product[] {
    return StorageService.getProducts();
  },

  getForSaleProducts(): Product[] {
    return StorageService.getProducts().filter((p) => p.isForSale);
  },

  saveProduct(input: Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Product {
    return StorageService.saveProduct(input);
  },

  deleteProduct(id: string): boolean {
    return StorageService.deleteProduct(id);
  },

  adjustStock(productId: string, delta: number): Product | null {
    return StorageService.adjustProductStock(productId, delta);
  },

  getSales(): ProductSale[] {
    return StorageService.getProductSales();
  },

  saveSale(
    input: Omit<ProductSale, 'id' | 'createdAt' | 'updatedAt' | 'unpaidAmount' | 'status'> & {
      id?: string;
      status?: ProductSale['status'];
    },
    options?: { deductStock?: boolean }
  ): ProductSale {
    return StorageService.saveProductSale(input, options);
  },

  cancelSale(id: string): ProductSale | null {
    return StorageService.cancelProductSale(id);
  },

  deleteSale(id: string): boolean {
    return StorageService.deleteProductSale(id);
  },

  getStats(yearMonth?: string): ProductStats {
    return StorageService.getProductStats(yearMonth);
  },
};
