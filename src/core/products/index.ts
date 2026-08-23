export type {
  Product,
  ProductSale,
  ProductSaleStatus,
  ProductStats,
  ProductModuleSettings,
  ProductModuleLabels,
  ProductModuleCapabilities,
  ProductTypeOption,
} from './types';
export {
  getDefaultProductSettings,
  getProductModuleSettings,
  isProductModuleEnabled,
} from './features';
export { ProductService } from './productService';
export { ProductManagementView } from './components/ProductManagementView';
