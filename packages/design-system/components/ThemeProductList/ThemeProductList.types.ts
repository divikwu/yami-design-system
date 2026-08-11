import type { ReactNode } from "react";

import type { ProductListItem, ProductListProps } from "../ProductList";

export interface ThemeProductListContent {
  image: {
    src: string;
    alt: string;
  };
  /** Pre-sampled color from the image's lower copy region. Prevents a foreground-color flash before client-side sampling completes. */
  backgroundColor?: string;
  title: ReactNode;
  description: ReactNode;
  href?: string;
}

export interface ThemeProductListTheme {
  value: string;
  label: ReactNode;
  content: ThemeProductListContent;
  products: ProductListItem[];
  disabled?: boolean;
}

export interface ThemeProductListProps
  extends Omit<
    ProductListProps,
    | "appearance"
    | "banner"
    | "backgroundColor"
    | "backgroundImage"
    | "backgroundImageMobile"
    | "content"
    | "layout"
    | "leadingContent"
  > {
  content: ThemeProductListContent;
  /** Optional tab-driven content sets. When present, each tab swaps both the editorial panel and products. */
  themes?: ThemeProductListTheme[];
}
