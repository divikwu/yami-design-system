import type {
  ActivityPageHeaderProps,
  ThemeHeroProps,
  FooterProps,
  HeaderProps,
  ProductListProps,
  ReviewListProps,
  ThemeProductListProps,
} from "@yami/design-system";
import type { HTMLAttributes } from "react";

export interface TopicLandingPageProps extends HTMLAttributes<HTMLDivElement> {
  activityHeader: ActivityPageHeaderProps;
  header: HeaderProps;
  hero: ThemeHeroProps;
  standardRail: ThemeProductListProps;
  reviewList: ReviewListProps;
  productRail: ProductListProps;
  waterfall: ProductListProps;
  footer: FooterProps;
}
