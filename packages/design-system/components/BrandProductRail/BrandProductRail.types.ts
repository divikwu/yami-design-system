import type {
  HTMLAttributes,
  ReactNode,
} from "react";

import type {
  ProductListItem,
  ProductListTab,
} from "../ProductList";
import type { SectionDividerProps } from "../sectionDivider.types";

export interface BrandProductCampaign {
  id: string;
  title: ReactNode;
  href?: string;
  banner: {
    src: string;
    alt: string;
    badgeSrc?: string;
    badgeAlt?: string;
  };
  products: ProductListItem[];
}

export interface BrandProductRailProps
  extends Omit<HTMLAttributes<HTMLElement>, "title">,
    SectionDividerProps {
  title: ReactNode;
  mobileTitle?: ReactNode;
  campaigns: BrandProductCampaign[];
  tabs?: ProductListTab[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  viewAllHref?: string;
  viewAllLabel?: ReactNode;
  previousLabel?: string;
  nextLabel?: string;
  onAddToCart?: (campaignId: string, productId: string) => void;
}
