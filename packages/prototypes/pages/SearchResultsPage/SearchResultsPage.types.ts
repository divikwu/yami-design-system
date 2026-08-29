import type { ComponentProps } from "react";

import type {
  FooterProps,
  HeaderProps,
  ProductListItem,
} from "@yami/design-system";

export type SearchResultsLocale = "zh" | "en";

export type SearchResultsSort =
  | "featured"
  | "best-seller"
  | "popularity"
  | "most-reviews"
  | "most-ratings"
  | "newest"
  | "price-high"
  | "price-low";

export interface SearchResultsRequestState {
  query: string;
  page: number;
  sort: SearchResultsSort;
  categoryIds: readonly string[];
}

export interface SearchResultsInteraction {
  request: SearchResultsRequestState;
  pageCount: number;
  onRequestChange: (request: SearchResultsRequestState) => void;
}

export interface SearchResultsFilter {
  id: string;
  label: string;
  productIds: string[];
  icon?: "hot";
}

export interface SearchResultsCategoryOption {
  label: string;
  value: string;
  children?: readonly SearchResultsCategoryOption[];
}

export interface SearchResultsCopy {
  resultsFor: string;
  resultSingular: string;
  resultPlural: string;
  productsTitle: string;
  filtersLabel: string;
  filtersButton: string;
  fulfilledByYami: string;
  filterMenus: readonly string[];
  filterMenuOptions: Readonly<Record<string, readonly string[]>>;
  categoryOptions: readonly SearchResultsCategoryOption[];
  clearSelection: string;
  showResults: (count: number) => string;
  clearFilters: string;
  sortLabel: string;
  sortFeatured: string;
  sortBestSeller: string;
  sortPopularity: string;
  sortMostReviews: string;
  sortMostRatings: string;
  sortNewest: string;
  sortPriceLow: string;
  sortPriceHigh: string;
  emptyTitle: string;
  emptyDescription: string;
  resetSearch: string;
  loadMore: string;
  loading: string;
}

export interface SearchResultsPageProps
  extends Omit<ComponentProps<"div">, "children"> {
  locale?: SearchResultsLocale;
  contentMaxWidth?: number | string;
  mobileBackHref?: string;
  query: string;
  resultCount?: number;
  header: HeaderProps;
  footer?: FooterProps;
  products: ProductListItem[];
  filters: SearchResultsFilter[];
  filtersLoading?: boolean;
  interaction?: SearchResultsInteraction;
  copy: SearchResultsCopy;
}
