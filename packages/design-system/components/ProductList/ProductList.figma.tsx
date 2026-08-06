/**
 * ProductList.figma.tsx — Figma Code Connect bindings.
 *
 * Product List is split into PC rail and PC waterfall component sets in Figma.
 * Production code exposes those variants through one data-driven API.
 */

import { figma } from "@figma/code-connect";

import { ProductList } from "./ProductList";
import type { ProductListItem } from "./ProductList.types";

const FIGMA_FILE =
  "https://www.figma.com/design/6oOAy72DBff4P6NzJYc2hi/YAMI-UI-UX-Guidelines";

const products: ProductListItem[] = [
  {
    id: "product-1",
    href: "/products/product-1",
    image: "/images/product-1.webp",
    imageAlt: "Product name",
    brand: "Brand",
    brandHref: "/brands/brand",
    title: "Product name",
    priceCurrent: "$17.59",
    priceOriginal: "$21.00",
    rating: 4.9,
    ratingCount: "88",
  },
];

figma.connect(ProductList, `${FIGMA_FILE}?node-id=3878-61068`, {
  props: {},
  example: () => (
    <ProductList
      title="精选商品"
      products={products}
      layout="rail"
      tabs={[{ value: "all", label: "All" }]}
      onAddToCart={(productId) => {
        /* wire productId to the cart action */
      }}
    />
  ),
});

figma.connect(ProductList, `${FIGMA_FILE}?node-id=3878-61095`, {
  props: {},
  example: () => (
    <ProductList
      title="More to Explore"
      products={products}
      layout="waterfall"
      hasMore
      onLoadMore={() => {
        /* request the next product page */
      }}
    />
  ),
});
