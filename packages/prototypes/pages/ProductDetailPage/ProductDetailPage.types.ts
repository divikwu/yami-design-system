import type { ComponentProps } from "react";

import type {
  FooterProps,
  HeaderProps,
  ProductListItem,
  ProductMediaGalleryItem,
  ProductReviewSectionProps,
} from "@yami/design-system";

export interface ProductDetailBreadcrumbItem {
  label: string;
  href?: string;
}

export interface ProductDetailOption {
  label: string;
  value: string;
  unavailable?: boolean;
}

export interface ProductDetailOptionGroup {
  id: string;
  label: string;
  value: string;
  options: readonly ProductDetailOption[];
}

export interface ProductDetailSpecification {
  label: string;
  value: string;
}

export interface ProductDetailRegion {
  label: string;
  value: string;
  iconSrc: string;
}

export interface ProductDetailBrandSection {
  title: string;
  /** Optional decorative brand mark shown in the center of the section heading. */
  logo?: {
    src: string;
    width: number;
    height: number;
  };
  aboutLabel: string;
  description: string;
  products: ProductListItem[];
  viewAllHref?: string;
  viewAllLabel: string;
  previousLabel: string;
  nextLabel: string;
}

export interface ProductDetailPageCopy {
  galleryLabel: string;
  thumbnailsLabel: string;
  previousImage: string;
  nextImage: string;
  ratingLabel: string;
  writeReview: string;
  bestBefore: string;
  productHighlights: string;
  specifications: string;
  disclaimer: string;
  disclaimerBody: string;
  addToFavorites: string;
  share: string;
  shareWeibo: string;
  shareFacebook: string;
  shareEmail: string;
  shareWechat: string;
  quantity: string;
  decreaseQuantity: string;
  increaseQuantity: string;
  addToCart: string;
  seller: string;
  shipTo: string;
  deliveryEstimate: string;
  serviceGuarantees: readonly string[];
  viewDetails: string;
  tags: string;
  showAllTags: string;
  showFewerTags: string;
  recommendations: string;
  recentlyViewed: string;
  viewAll: string;
}

export interface ProductDetailPageProps
  extends Omit<ComponentProps<"div">, "children"> {
  contentMaxWidth?: number | string;
  header: HeaderProps;
  footer?: FooterProps;
  breadcrumb: readonly ProductDetailBreadcrumbItem[];
  images: readonly ProductMediaGalleryItem[];
  brand: string;
  brandHref?: string;
  title: string;
  ranking: string;
  rating: number;
  ratingCount: string;
  soldCount: string;
  priceCurrent: string;
  priceOriginal: string;
  discountLabel: string;
  optionGroups: readonly ProductDetailOptionGroup[];
  bestBefore: string;
  highlights: readonly string[];
  specifications: readonly ProductDetailSpecification[];
  serviceDetailsHref?: string;
  purchaseTags?: readonly string[];
  region?: ProductDetailRegion;
  recommendations: ProductListItem[];
  recentlyViewed?: ProductListItem[];
  reviewSection?: ProductReviewSectionProps;
  brandSection?: ProductDetailBrandSection;
  copy: ProductDetailPageCopy;
}
