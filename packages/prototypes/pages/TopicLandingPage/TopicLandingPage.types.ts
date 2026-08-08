import type {
  ThemeHeroProps,
  FooterProps,
  HeaderProps,
  ProductListProps,
  ReviewListProps,
  ThemeProductListProps,
} from "@yami/design-system";
import type { HTMLAttributes } from "react";

export interface TopicLandingPageProps extends HTMLAttributes<HTMLDivElement> {
  header: HeaderProps;
  hero: ThemeHeroProps;
  standardRail: ThemeProductListProps;
  reviewList: ReviewListProps;
  productRail: ProductListProps;
  waterfall: ProductListProps;
  footer: FooterProps;
}
