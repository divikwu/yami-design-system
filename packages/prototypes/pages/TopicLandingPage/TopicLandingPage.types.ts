import type {
  ActivityPageHeaderProps,
  BrandProductRailProps,
  ThemeHeroProps,
  FooterProps,
  HeaderProps,
  ProductListItem,
  ProductListProps,
  ReviewListProps,
  ShortcutRailProps,
  ThemeProductListProps,
} from "@yami/design-system";
import type { HTMLAttributes } from "react";

export interface TopicLandingPagePrimaryTab {
  value: string;
  label: string;
  targetId: string;
}

export interface TopicLandingPagePrimaryTabs {
  ariaLabel: string;
  defaultValue: string;
  items: TopicLandingPagePrimaryTab[];
}

export type TopicLandingPageModuleId =
  | "hero"
  | "shortcuts"
  | "start-here"
  | "popular-picks"
  | "brand-spotlight"
  | "reviews"
  | "explore-more";

export type TopicLandingPageWaterfallProps = ProductListProps & {
  productsByTab?: Record<string, ProductListItem[]>;
};

export type TopicLandingPageProductRailProps = ProductListProps & {
  productsByTab?: Record<string, ProductListItem[]>;
};

export interface TopicLandingPageProps extends HTMLAttributes<HTMLDivElement> {
  /** Maximum width shared by every content container inside main. Numbers are treated as pixels. */
  contentMaxWidth?: number | string;
  /** Font family shared by the hero title and every module title inside main. */
  titleFontFamily?: "sans" | "serif";
  /** Hides online-only global chrome for self-contained offline delivery. */
  showChrome?: boolean;
  activityHeader: ActivityPageHeaderProps;
  header: HeaderProps;
  hero: ThemeHeroProps;
  primaryTabs: TopicLandingPagePrimaryTabs;
  shortcutRail: ShortcutRailProps;
  standardRail?: ThemeProductListProps;
  reviewList?: ReviewListProps;
  productRail: TopicLandingPageProductRailProps;
  /** Optional brand collection rendered immediately after Popular Picks. */
  brandRail?: BrandProductRailProps;
  waterfall: TopicLandingPageWaterfallProps;
  /** Modules intentionally omitted by the compiled page plan. */
  hiddenModules?: readonly TopicLandingPageModuleId[];
  footer: FooterProps;
}
