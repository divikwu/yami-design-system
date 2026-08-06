import type { HTMLAttributes, ReactNode } from "react";

import type { ProductListItem } from "../ProductList";

export interface TrendingSearchKeyword {
  id: string;
  /** The search term itself, e.g. "Sunscreen". */
  keyword: string;
  /** Search-results destination, used by both the desktop link and the mobile CTA. */
  href: string;
  /** One line on why the term is trending. Renders beside the sparkle. */
  tagline?: ReactNode;
  /**
   * Row artwork, mobile only. The collapsed list is six near-identical rows of
   * text; the thumbnail is what makes them scannable.
   */
  thumbnail?: { src: string; alt: string };
  /**
   * Results for the term. Desktop shows the leading two — the card is a
   * fixed-height preview, not a list — and mobile scrolls the whole set.
   */
  products: ProductListItem[];
  /** Mobile CTA copy, e.g. "Explore Anua". Falls back to the see-all label. */
  exploreLabel?: ReactNode;
}

export interface TrendingSearchesProps
  extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  title: ReactNode;
  /** Shorter title below 1024px, where the section title shares a row. */
  mobileTitle?: ReactNode;
  keywords: TrendingSearchKeyword[];
  /** Desktop per-keyword link copy. */
  seeAllLabel?: ReactNode;
  previousLabel?: string;
  nextLabel?: string;
  /** Accessible name for the mobile row toggles, given the keyword. */
  expandLabel?: (keyword: string) => string;
  /**
   * Which row opens first on mobile. Defaults to the top-ranked term, because
   * an accordion that opens closed shows nothing but a list of words.
   */
  defaultExpandedId?: string;
  onAddToCart?: (productId: string) => void;
}
