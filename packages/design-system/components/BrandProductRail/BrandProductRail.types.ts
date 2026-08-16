import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import type {
  ProductListItem,
  ProductListTab,
} from "../ProductList";
import type { SectionDividerProps } from "../sectionDivider.types";
import type { ImageLoadingStrategy, ImageSource } from "../image.types";

export interface BrandProductCampaign {
  id: string;
  title: ReactNode;
  href?: string;
  banner: {
    src: ImageSource;
    alt: string;
    badgeSrc?: string;
    badgeAlt?: string;
  };
  products: ProductListItem[];
}

export type BrandProductRailMobileSurface = "card" | "plain";

export interface BrandProductRailProps
  extends Omit<HTMLAttributes<HTMLElement>, "title">,
    SectionDividerProps {
  title: ReactNode;
  mobileTitle?: ReactNode;
  /** Optional serif treatment for editorial section headings. */
  titleFontFamily?: "sans" | "serif";
  campaigns: BrandProductCampaign[];
  /** Mobile section surface. Plain is full-bleed with 16px content padding and supports section dividers. */
  mobileSurface?: BrandProductRailMobileSurface;
  tabs?: ProductListTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  viewAllHref?: string;
  viewAllLabel?: ReactNode;
  previousLabel?: string;
  nextLabel?: string;
  onAddToCart?: (campaignId: string, productId: string) => void;
  imageLoadingStrategy?: ImageLoadingStrategy;
}
