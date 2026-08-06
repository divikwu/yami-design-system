/**
 * Web page templates barrel — reference implementations of the recipes
 * in pages/recipes/. Phase 7 compose_page uses these as generation hints.
 */

export type {
  CartItem,
  CartProps,
  CartRelated,
  CartSummary,
} from './Cart'
export { CartTemplate } from './Cart'
export { cartExampleData } from './Cart.example'
export type {
  ProductDetailProduct,
  ProductDetailProps,
  ProductDetailRelatedProduct,
} from './ProductDetail'
export { ProductDetailTemplate } from './ProductDetail'
export { productDetailExampleData } from './ProductDetail.example'
export type { ProductListCategory, ProductListProduct, ProductListProps } from './ProductList'
export { ProductListTemplate } from './ProductList'
export { productListExampleData } from './ProductList.example'
