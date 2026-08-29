"use client";

import type {
  CatalogDataMode,
} from "@yami/commerce-catalog";
import type { ProductListItem } from "@yami/design-system";
import {
  createSearchResultsFixture,
  SearchResultsPage,
  type SearchResultsCategoryOption,
  type SearchResultsFilter,
  type SearchResultsRequestState,
} from "@yami/prototypes/search-results-page";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import "@yami/design-system/styles/base.css";

function liveFilters(
  products: ProductListItem[],
  locale: "en" | "zh",
): SearchResultsFilter[] {
  if (products.length === 0) return [];
  const brands = new Map<string, string[]>();
  for (const product of products) {
    if (typeof product.brand !== "string" || !product.brand) continue;
    brands.set(product.brand, [...(brands.get(product.brand) ?? []), product.id]);
  }
  return [
    {
      id: "all-live-products",
      label: locale === "zh" ? "当前结果" : "Current results",
      icon: "hot",
      productIds: products.map((product) => product.id),
    },
    ...Array.from(brands, ([label, productIds], index) => ({
      id: `brand-${index}-${label.toLocaleLowerCase().replace(/[^a-z0-9]+/gu, "-")}`,
      label,
      productIds,
    })).slice(0, 4),
  ];
}

export interface SearchPreviewSurfaceProps {
  locale: "en" | "zh";
  theme: "light" | "dark";
  query: string;
  mode: CatalogDataMode;
  source: string;
  fetchedAt: string;
  resultCount: number;
  pageCount: number;
  request: SearchResultsRequestState;
  categories: SearchResultsCategoryOption[];
  products: ProductListItem[];
}

export function SearchPreviewSurface({
  locale,
  theme,
  query,
  mode,
  source,
  fetchedAt,
  resultCount,
  pageCount,
  request,
  categories,
  products,
}: SearchPreviewSurfaceProps) {
  const fixture = createSearchResultsFixture(locale);
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const homeHref = `/preview/ecommerce-home?${new URLSearchParams({ locale, theme }).toString()}`;

  function updateLiveRequest(next: SearchResultsRequestState) {
    const nextParams = new URLSearchParams(params.toString());
    if (next.query) nextParams.set("q", next.query);
    else nextParams.delete("q");
    if (next.page === 1) nextParams.delete("page");
    else nextParams.set("page", String(next.page));
    if (next.sort === "featured") nextParams.delete("sort");
    else nextParams.set("sort", next.sort);
    if (next.categoryIds.length > 0) nextParams.set("categories", next.categoryIds.join(","));
    else nextParams.delete("categories");
    nextParams.set("data", "live");
    router.push(`${pathname}?${nextParams.toString()}`);
  }

  return (
    <div
      className={`prototype-root${theme === "dark" ? " dark" : ""}`}
      data-theme={theme}
      data-catalog-mode={mode}
      data-catalog-source={source}
      data-catalog-fetched-at={fetchedAt}
    >
      <SearchResultsPage
        {...fixture}
        header={{ ...fixture.header, homeHref }}
        query={query}
        resultCount={resultCount}
        products={products}
        filters={liveFilters(products, locale)}
        copy={{ ...fixture.copy, categoryOptions: categories }}
        interaction={mode === "live" ? { request, pageCount, onRequestChange: updateLiveRequest } : undefined}
      />
    </div>
  );
}
