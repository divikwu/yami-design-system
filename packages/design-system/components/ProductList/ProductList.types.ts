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

export type ProductListAppearance =
  | "standard"
  | "themed"
  | "atmospheric";

export type ProductListLayout = "rail" | "waterfall";

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
  title: ReactNode;
  products: ProductListItem[];
  layout?: ProductListLayout;
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
}

type StandardAppearanceProps = {
  appearance?: "standard";
  banner?: never;
  backgroundColor?: never;
  backgroundImage?: never;
  backgroundImageMobile?: never;
};

type ThemedAppearanceProps = {
  appearance: "themed";
  banner: {
    src: string;
    mobileSrc?: string;
    alt: string;
    backgroundColor?: string;
    mobileBackgroundColor?: string;
  };
  backgroundColor?: never;
  backgroundImage?: never;
  backgroundImageMobile?: never;
};

type AtmosphericAppearanceProps = {
  appearance: "atmospheric";
  banner?: never;
  backgroundColor?: string;
  backgroundImage?: string;
  backgroundImageMobile?: string;
};

export type ProductListProps = ProductListBaseProps &
  (
    | StandardAppearanceProps
    | ThemedAppearanceProps
    | AtmosphericAppearanceProps
  );
