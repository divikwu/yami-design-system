import {
  CatalogError,
  type CatalogDataMode,
  type CatalogSearchRequest,
  type CatalogSort,
} from "@yami/commerce-catalog";
import type { Metadata } from "next";

import {
  catalogProductsToProductListItems,
  catalogCategoriesToSearchResultsOptions,
  createSearchPreviewCatalog,
  isSearchPreviewLiveEnabled,
} from "../../lib/search-preview-data";
import { SearchPreviewSurface } from "../../ui/search-preview-surface";

export const metadata: Metadata = {
  title: "Search Results Preview | Yami",
  description: "Evaluate Yami search results with scenario, snapshot, or live catalog data.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function dataMode(value: string | undefined): CatalogDataMode {
  return value === "live" || value === "scenario" ? value : "snapshot";
}

function positiveInteger(value: string | undefined, fallback: number) {
  const number = Number.parseInt(value ?? "", 10);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

const catalogSorts = new Set<CatalogSort>([
  "featured",
  "best-seller",
  "popularity",
  "most-reviews",
  "most-ratings",
  "newest",
  "price-low",
  "price-high",
]);

function catalogSort(value: string | undefined): CatalogSort {
  return value && catalogSorts.has(value as CatalogSort) ? value as CatalogSort : "featured";
}

function categoryIds(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function previewHref(values: Record<string, string>) {
  return `/preview/search?${new URLSearchParams(values).toString()}`;
}

function Recovery({
  locale,
  label,
  title,
  description,
  href,
  action,
}: {
  locale: "en" | "zh";
  label: string;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <main
      className="placeholder-route"
      data-slot="search-preview-data-error"
      lang={locale === "zh" ? "zh-CN" : "en"}
    >
      <span>{label}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <a href={href}>{action}</a>
    </main>
  );
}

export default async function SearchPreviewPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const locale = first(params.locale) === "zh" ? "zh" : "en";
  const theme = first(params.theme) === "dark" ? "dark" : "light";
  const mode = dataMode(first(params.data));
  const liveEnabled = isSearchPreviewLiveEnabled();
  const query = first(params.q)?.trim() || (locale === "zh" ? "抹茶粉" : "matcha powder");
  const snapshotQuery = locale === "zh" ? "抹茶粉" : "matcha powder";
  const snapshotHref = previewHref({ q: snapshotQuery, data: "snapshot", locale, theme });
  if (mode === "live" && !liveEnabled) {
    return (
      <Recovery
        locale={locale}
        label="Live disabled"
        title={locale === "zh" ? "当前环境没有启用 Live 目录。" : "Live catalog is not enabled in this environment."}
        description={locale === "zh"
          ? "生产环境默认关闭实时上游请求。请使用可复现的 Snapshot，或由部署方显式启用 Live。"
          : "Production disables upstream live requests by default. Use the reproducible Snapshot or ask the host to enable Live explicitly."}
        href={snapshotHref}
        action={locale === "zh" ? "使用 Snapshot" : "Use Snapshot"}
      />
    );
  }
  const request = {
    query,
    locale,
    page: positiveInteger(first(params.page), 1),
    pageSize: Math.min(positiveInteger(first(params.pageSize), mode === "snapshot" ? 12 : 30), 60),
    sort: catalogSort(first(params.sort)),
    categoryIds: categoryIds(params.categories),
  } satisfies CatalogSearchRequest;
  const catalog = createSearchPreviewCatalog(
    mode,
    request,
    first(params.scenario) ?? "baseline",
  );
  let result;
  try {
    result = await catalog.search(request);
  } catch (error) {
    if (!(error instanceof CatalogError)) throw error;
    const snapshotMismatch = error.code === "snapshot_mismatch";
    const liveHref = previewHref({ q: query, data: "live", locale, theme });
    const canUseLive = snapshotMismatch && liveEnabled;
    const fallbackHref = canUseLive ? liveHref : snapshotHref;
    return (
      <Recovery
        locale={locale}
        label={snapshotMismatch ? "Snapshot mismatch" : "Catalog unavailable"}
        title={locale === "zh"
          ? snapshotMismatch ? "这份 Snapshot 与当前评估请求不匹配。" : "当前无法加载 Live 目录数据。"
          : snapshotMismatch ? "This Snapshot does not match the evaluation request." : "Live catalog data could not be loaded."}
        description={locale === "zh"
          ? snapshotMismatch
            ? "Snapshot 会固定搜索词、排序、分类和分页。切换到 Live，或回到已捕获的基线。"
            : "实时上游失败时不会重复请求同一模式；请回到可复现的 Snapshot 基线。"
          : snapshotMismatch
            ? "A Snapshot freezes query, sort, categories, and pagination. Switch to Live or return to its captured baseline."
            : "A failed upstream request does not loop back to the same mode. Return to the reproducible Snapshot baseline."}
        href={fallbackHref}
        action={locale === "zh"
          ? canUseLive ? "使用 Live 数据" : "回到 Snapshot"
          : canUseLive ? "Use Live data" : "Return to Snapshot"}
      />
    );
  }

  return (
    <SearchPreviewSurface
      locale={locale}
      theme={theme}
      query={query}
      mode={result.meta.mode}
      source={result.meta.source}
      fetchedAt={result.meta.fetchedAt}
      resultCount={result.pagination.total}
      pageCount={result.pagination.pageCount}
      request={result.request}
      categories={catalogCategoriesToSearchResultsOptions(result.categories)}
      products={catalogProductsToProductListItems(result.products)}
    />
  );
}
