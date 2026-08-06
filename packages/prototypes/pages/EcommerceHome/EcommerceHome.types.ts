import type { ComponentProps } from "react";

import type {
  BillboardProps,
  BrandProductRailProps,
  FooterProps,
  HeaderProps,
  HeroBannerProps,
  ProductListProps,
  ShortcutRailProps,
  SocialMediaGalleryProps,
  TrendingSearchesProps,
} from "@yami/design-system";

export type EcommerceHomeSection =
  | {
      id: string;
      kind: "products";
      props: ProductListProps;
    }
  | {
      id: string;
      kind: "brands";
      props: BrandProductRailProps;
    }
  | {
      id: string;
      kind: "social";
      props: SocialMediaGalleryProps;
    }
  | {
      id: string;
      kind: "billboard";
      props: BillboardProps;
    }
  | {
      id: string;
      kind: "searches";
      props: TrendingSearchesProps;
    };

export interface EcommerceHomeProps
  extends Omit<ComponentProps<"div">, "children"> {
  header: HeaderProps;
  hero: HeroBannerProps;
  shortcutRail: ShortcutRailProps;
  sections: EcommerceHomeSection[];
  footer: FooterProps;
}
