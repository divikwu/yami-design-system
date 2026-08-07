import type {
  ThemeHeroProps,
  FooterProps,
  HeaderProps,
  ProductListProps,
  ThemeProductListProps,
} from "@yami/design-system";
import type { HTMLAttributes } from "react";

export interface TopicLandingPageProps extends HTMLAttributes<HTMLDivElement> {
  header: HeaderProps;
  hero: ThemeHeroProps;
  standardRail: ThemeProductListProps;
  productRail: ProductListProps;
  waterfall: ProductListProps;
  footer: FooterProps;
}
