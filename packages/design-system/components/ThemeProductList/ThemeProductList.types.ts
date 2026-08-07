import type { ReactNode } from "react";

import type { ProductListProps } from "../ProductList";

export interface ThemeProductListContent {
  image: {
    src: string;
    alt: string;
  };
  title: ReactNode;
  description: ReactNode;
  href?: string;
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
}
