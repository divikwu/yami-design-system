import type { ComponentProps } from "react";

import type {
  FooterProps,
  HeaderProps,
  ProductListItem,
} from "@yami/design-system";

export type SearchResultsLocale = "zh" | "en";

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
  query: string;
  resultCount?: number;
  header: HeaderProps;
  footer?: FooterProps;
  products: ProductListItem[];
  filters: SearchResultsFilter[];
  filtersLoading?: boolean;
  copy: SearchResultsCopy;
}
