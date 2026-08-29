export type CatalogLocale = "en" | "zh";

export type CatalogSort =
  | "featured"
  | "best-seller"
  | "popularity"
  | "most-reviews"
  | "most-ratings"
  | "newest"
  | "price-low"
  | "price-high";

export interface CatalogSearchRequest {
  query: string;
  locale: CatalogLocale;
  page?: number;
  pageSize?: number;
  sort?: CatalogSort;
  categoryIds?: readonly string[];
}

export type NormalizedCatalogSearchRequest = Required<
  Pick<CatalogSearchRequest, "query" | "locale" | "page" | "pageSize" | "sort">
> & {
  categoryIds: readonly string[];
};

export interface CategoryTreeRequest {
  locale: CatalogLocale;
}

export type CatalogBadgeKind =
  | "discount"
  | "new"
  | "hot"
  | "low-price"
  | "choice";

export interface CatalogBadge {
  label: string;
  kind: CatalogBadgeKind;
}

export interface CatalogProduct {
  id: string;
  title: string;
  imageUrl: string;
  productUrl: string;
  brand?: {
    id?: string;
    label: string;
    url?: string;
  };
  price: {
    currency: "USD";
    current: number;
    original?: number;
  };
  rating?: number;
  reviewCount?: number;
  soldLabel?: string;
  badges: readonly CatalogBadge[];
}

export interface CatalogCategory {
  id: string;
  label: string;
  resultCount?: number;
  children: readonly CatalogCategory[];
}

export interface CatalogPagination {
  page: number;
  pageSize: number;
  total: number;
  pageCount: number;
}

export type CatalogDataMode = "scenario" | "snapshot" | "live";

export interface CatalogResultMeta {
  mode: CatalogDataMode;
  source: string;
  fetchedAt: string;
  cacheStatus: "hit" | "miss" | "stale";
}

export interface CatalogSearchResult {
  request: NormalizedCatalogSearchRequest;
  products: readonly CatalogProduct[];
  categories: readonly CatalogCategory[];
  pagination: CatalogPagination;
  meta: CatalogResultMeta;
}

export interface CategoryTreeResult {
  categories: readonly CatalogCategory[];
  meta: CatalogResultMeta;
}

export interface CommerceCatalog {
  search(request: CatalogSearchRequest): Promise<CatalogSearchResult>;
  getCategoryTree(request: CategoryTreeRequest): Promise<CategoryTreeResult>;
}

export interface CatalogDataset {
  id: string;
  locale?: CatalogLocale;
  products: readonly CatalogProduct[];
  categories?: readonly CatalogCategory[];
  total?: number;
  capturedAt?: string;
}

export interface PrototypeCatalogSnapshot {
  schemaVersion: "1";
  id: string;
  digest: `sha256:${string}`;
  capturedAt: string;
  request: NormalizedCatalogSearchRequest;
  result: Pick<CatalogSearchResult, "products" | "categories" | "pagination">;
}
