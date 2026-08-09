import type {
  ActivityPageHeaderProps,
  ThemeHeroProps,
  FooterProps,
  HeaderProps,
  ProductListProps,
  ReviewListProps,
  ShortcutRailProps,
  ThemeProductListProps,
} from "@yami/design-system";
import type { HTMLAttributes } from "react";

export interface TopicLandingPagePrimaryTab {
  value: string;
  label: string;
}

export interface TopicLandingPagePrimaryTabs {
  ariaLabel: string;
  defaultValue: string;
  items: TopicLandingPagePrimaryTab[];
}

export interface TopicLandingPageProps extends HTMLAttributes<HTMLDivElement> {
  /** Maximum width shared by every content container inside main. Numbers are treated as pixels. */
  contentMaxWidth?: number | string;
  /** Font family shared by the hero title and every module title inside main. */
  titleFontFamily?: "sans" | "serif";
  activityHeader: ActivityPageHeaderProps;
  header: HeaderProps;
  hero: ThemeHeroProps;
  primaryTabs: TopicLandingPagePrimaryTabs;
  shortcutRail: ShortcutRailProps;
  standardRail: ThemeProductListProps;
  reviewList: ReviewListProps;
  productRail: ProductListProps;
  waterfall: ProductListProps;
  footer: FooterProps;
}
