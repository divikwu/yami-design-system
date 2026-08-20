import type {
  HTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from "react";

import type {
  ProductCardPresentation,
  ProductCardProps,
} from "../ProductCard";
import type { SectionDividerProps } from "../sectionDivider.types";
import type { ImageLoadingStrategy, ImageSource } from "../image.types";

export type ProductListAppearance =
  | "standard"
  | "themed"
  | "atmospheric";

export type ProductListLayout = "rail" | "waterfall";

export type ProductListMobileSurface = "card" | "plain";

export type ProductListItem = Omit<
  ProductCardProps,
  "presentation" | "onAddToCart"
> & {
  id: string;
};

export interface ProductListTab {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface ProductListBaseProps
  extends Omit<HTMLAttributes<HTMLElement>, "title">,
    SectionDividerProps {
  "data-component"?: string;
  title: ReactNode;
  /** Optional supporting copy rendered alongside the section title. */
  description?: ReactNode;
  /** Optional full-width editorial content rendered before the product collection. */
  introContent?: ReactNode;
  /** Optional serif treatment for editorial section headings. */
  titleFontFamily?: "sans" | "serif";
  products: ProductListItem[];
  /** Optional editorial content rendered before the rail on mobile and before the first product card on desktop. */
  leadingContent?: ReactNode;
  layout?: ProductListLayout;
  /** Mobile section surface. Plain is full-bleed with 16px content padding and supports section dividers. */
  mobileSurface?: ProductListMobileSurface;
  presentation?: ProductCardPresentation;
  tabs?: ProductListTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  viewAllHref?: string;
  viewAllLabel?: ReactNode;
  previousLabel?: string;
  nextLabel?: string;
  hasMore?: boolean;
  onLoadMore?: MouseEventHandler<HTMLButtonElement>;
  loadMoreLabel?: ReactNode;
  onAddToCart?: (productId: string) => void;
  loading?: boolean;
  loadingLabel?: string;
  skeletonCount?: number;
  /** Opt-in request window for horizontal rails. Waterfall keeps native lazy loading. */
  imageLoadingStrategy?: ImageLoadingStrategy;
}

type StandardAppearanceProps = {
  appearance?: "standard";
  banner?: never;
  backgroundColor?: never;
  backgroundImage?: never;
  backgroundImageMobile?: never;
  backgroundImage2x?: never;
  backgroundImageMobile2x?: never;
};

type ThemedAppearanceProps = {
  appearance: "themed";
  banner: {
    src: ImageSource;
    mobileSrc?: ImageSource;
    alt: string;
    backgroundColor?: string;
    mobileBackgroundColor?: string;
  };
  backgroundColor?: never;
  backgroundImage?: never;
  backgroundImageMobile?: never;
  backgroundImage2x?: never;
  backgroundImageMobile2x?: never;
};

type AtmosphericAppearanceProps = {
  appearance: "atmospheric";
  banner?: never;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundImageMobile?: string;
  backgroundImage2x?: string;
  backgroundImageMobile2x?: string;
};

export type ProductListProps = ProductListBaseProps &
  (
    | StandardAppearanceProps
    | ThemedAppearanceProps
    | AtmosphericAppearanceProps
  );
