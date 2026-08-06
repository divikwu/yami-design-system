/**
 * ProductList — canonical examples.
 */

import { ProductList } from "./ProductList";
import type { ProductListItem } from "./ProductList.types";

const products: ProductListItem[] = [
  {
    id: "soothing-cream",
    image:
      "https://cdn.yamibuy.net/item/3ccf61fd74fd43320d647a1b8779a978_757x757.webp",
    imageAlt: "Torriden Dive In Soothing Cream",
    brand: "Torriden",
    brandHref: "/brands/torriden",
    href: "/products/soothing-cream",
    title: "Dive In Low Molecular Hyaluronic Acid Soothing Cream",
    priceCurrent: "$17.59",
    priceOriginal: "$21.00",
    rating: 4.9,
    ratingCount: "88",
    soldCount: "200+ Sold",
    badges: [{ label: "-16%", type: "discount" }],
  },
  {
    id: "hydrating-mask",
    image:
      "https://cdn.yamibuy.net/item/3ccf61fd74fd43320d647a1b8779a978_757x757.webp",
    imageAlt: "Torriden Hydrating Mask",
    brand: "Torriden",
    brandHref: "/brands/torriden",
    href: "/products/hydrating-mask",
    title: "Dive In Low Molecular Hyaluronic Acid Mask, 10pc",
    priceCurrent: "$19.99",
    rating: 4.8,
    ratingCount: "126",
    soldCount: "100+ Sold",
  },
];

export const ProductRailExample = () => (
  <ProductList
    title="精选商品"
    products={products}
    tabs={[
      { value: "all", label: "All" },
      { value: "beauty", label: "Beauty" },
    ]}
    viewAllHref="/collections/recommended"
    onAddToCart={(productId) => {
      void productId;
    }}
  />
);

export const ProductWaterfallExample = () => (
  <ProductList
    title="More to Explore"
    products={products}
    layout="waterfall"
    hasMore
    onLoadMore={() => {}}
    onAddToCart={(productId) => {
      void productId;
    }}
  />
);

export const LoadingProductListExample = () => (
  <ProductList
    title="精选商品"
    products={[]}
    layout="rail"
    loading
    loadingLabel="Loading products"
  />
);
