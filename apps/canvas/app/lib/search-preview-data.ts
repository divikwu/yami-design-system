import {
  ScenarioCatalogAdapter,
  SnapshotCatalogAdapter,
  YamiLiveCatalogAdapter,
  type CatalogBadge,
  type CatalogCategory,
  type CatalogDataMode,
  type CatalogDataset,
  type CatalogProduct,
  type CatalogSearchRequest,
  type CommerceCatalog,
} from "@yami/commerce-catalog";
import type {
  ProductBadge,
  ProductListItem,
} from "@yami/design-system";
import { createSearchResultsFixture } from "@yami/prototypes/search-results-page";
import type { SearchResultsCategoryOption } from "@yami/prototypes/search-results-page";
import type { ReactNode } from "react";

import { searchPreviewSnapshots } from "../data/search-preview-snapshots";

function text(value: ReactNode) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function money(value: ReactNode) {
  const parsed = Number.parseFloat(text(value).replace(/[^0-9.]+/gu, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function imageUrl(product: ProductListItem) {
  if (typeof product.image === "string") return product.image;
  return product.image?.src ?? "";
}

function catalogProduct(product: ProductListItem): CatalogProduct {
  const brandLabel = text(product.brand);
  const badges: CatalogBadge[] = [];
  for (const item of product.badges ?? []) {
    const label = text(item.label);
    if (!label) continue;
    if (item.type === "discount") badges.push({ label, kind: "discount" });
    if (item.type === "new") badges.push({ label, kind: "new" });
    if (item.type === "hot") badges.push({ label, kind: "hot" });
    if (item.type === "low-price") badges.push({ label, kind: "low-price" });
    if (item.type === "choice") badges.push({ label, kind: "choice" });
  }
  return {
    id: product.id.replace(/^search-/u, ""),
    title: text(product.title) || "Yami product",
    imageUrl: imageUrl(product),
    productUrl: product.href,
    ...(brandLabel
      ? {
          brand: {
            label: brandLabel,
            ...(product.brandHref ? { url: product.brandHref } : {}),
          },
        }
      : {}),
    price: {
      currency: "USD",
      current: money(product.priceCurrent),
      ...(product.priceOriginal ? { original: money(product.priceOriginal) } : {}),
    },
    ...(typeof product.rating === "number" ? { rating: product.rating } : {}),
    ...(text(product.ratingCount)
      ? { reviewCount: Number.parseInt(text(product.ratingCount).replace(/[^0-9]+/gu, ""), 10) || 0 }
      : {}),
    ...(text(product.soldCount) ? { soldLabel: text(product.soldCount) } : {}),
    badges,
  };
}

type FixtureCategory = {
  label: string;
  value: string;
  children?: readonly FixtureCategory[];
};

function catalogCategories(values: readonly FixtureCategory[]): CatalogCategory[] {
  return values.map((value) => ({
    id: value.value,
    label: value.label,
    children: catalogCategories(value.children ?? []),
  }));
}

function fixtureDataset(locale: "en" | "zh"): CatalogDataset {
  const fixture = createSearchResultsFixture(locale);
  return {
    id: `search-results-baseline-${locale}`,
    locale,
    products: fixture.products.map(catalogProduct),
    categories: catalogCategories(fixture.copy.categoryOptions),
    total: fixture.resultCount ?? fixture.products.length,
  };
}

export function isSearchPreviewLiveEnabled(
  environment: Readonly<Record<string, string | undefined>> = process.env,
  nodeEnv = process.env.NODE_ENV,
) {
  return nodeEnv === "development" || environment.CANVAS_LIVE_CATALOG_ENABLED === "true";
}

export function createSearchPreviewCatalog(
  mode: CatalogDataMode,
  request: CatalogSearchRequest,
  scenario: string,
): CommerceCatalog {
  const dataset = fixtureDataset(request.locale);

  if (mode === "live") return new YamiLiveCatalogAdapter();

  if (mode === "scenario") {
    return new ScenarioCatalogAdapter(
      scenario === "empty"
        ? { ...dataset, id: `search-results-empty-${request.locale}`, products: [], total: 0 }
        : dataset,
    );
  }

  return new SnapshotCatalogAdapter(searchPreviewSnapshots[request.locale]);
}

const badgeTypes: Record<CatalogProduct["badges"][number]["kind"], ProductBadge["type"]> = {
  choice: "choice",
  discount: "discount",
  hot: "hot",
  "low-price": "low-price",
  new: "new",
};

function price(value: number) {
  return `$${value.toFixed(2)}`;
}

export function catalogProductsToProductListItems(
  products: readonly CatalogProduct[],
): ProductListItem[] {
  return products.map((product) => ({
    id: `search-${product.id}`,
    image: product.imageUrl,
    imageAlt: product.title,
    title: product.title,
    href: product.productUrl,
    ...(product.brand
      ? {
          brand: product.brand.label,
          brandHref: product.brand.url ?? product.productUrl,
        }
      : {}),
    priceCurrent: price(product.price.current),
    ...(product.price.original ? { priceOriginal: price(product.price.original) } : {}),
    ...(product.rating !== undefined ? { rating: product.rating } : {}),
    ...(product.reviewCount !== undefined ? { ratingCount: String(product.reviewCount) } : {}),
    ...(product.soldLabel ? { soldCount: product.soldLabel } : {}),
    badges: product.badges.map((item) => ({
      label: item.label,
      type: badgeTypes[item.kind],
    })),
  }));
}

export function catalogCategoriesToSearchResultsOptions(
  categories: readonly CatalogCategory[],
): SearchResultsCategoryOption[] {
  return categories.map((category) => ({
    label: category.label,
    value: category.id,
    children: catalogCategoriesToSearchResultsOptions(category.children),
  }));
}
