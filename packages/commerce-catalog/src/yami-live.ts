import {
  CatalogError,
  normalizeCatalogRequest,
} from "./core";
import type {
  CatalogBadge,
  CatalogCategory,
  CatalogProduct,
  CatalogSearchRequest,
  CatalogSearchResult,
  CatalogLocale,
  CommerceCatalog,
  CategoryTreeRequest,
  CategoryTreeResult,
} from "./types";

const YAMI_CATALOG_URL = "https://ecapi.yami.com/ec-prebff/plp/getItemList";

const sortValues = {
  featured: [3, 0],
  "best-seller": [6, 0],
  popularity: [2, 0],
  "most-reviews": [1, 0],
  "most-ratings": [5, 0],
  newest: [7, 0],
  "price-low": [4, 1],
  "price-high": [4, 0],
} as const;

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as UnknownRecord
    : undefined;
}

function string(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function scalarString(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return string(value);
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function absoluteImageUrl(value: string) {
  return new URL(value, "https://cdn.yamibuy.net").toString();
}

function badge(label: string): CatalogBadge | undefined {
  if (/^-\d+%$/u.test(label)) return { label, kind: "discount" };
  if (label === "New") return { label, kind: "new" };
  if (label === "Hot") return { label, kind: "hot" };
  if (label === "Low Price") return { label, kind: "low-price" };
  if (label === "Choice") return { label, kind: "choice" };
  return undefined;
}

function product(value: unknown, locale: CatalogLocale): CatalogProduct | undefined {
  const item = record(value);
  if (!item || item.status !== "A") return undefined;
  const id = string(item.item_number);
  const title = locale === "zh"
    ? string(item.goods_name) || string(item.goods_ename)
    : string(item.goods_ename) || string(item.goods_name);
  const image = string(item.image_url);
  const current = number(item.promotion_price) ?? number(item.shop_price);
  if (!id || !title || !image || current === undefined) return undefined;

  const slug = string(item.slug) || "product";
  const brandLabel = locale === "zh"
    ? string(item.brand_name) || string(item.brand_ename)
    : string(item.brand_ename) || string(item.brand_name);
  const brandId = number(item.brand_id)?.toString() || string(item.brand_id);
  const brandSlug = string(item.brand_slug) || "brand";
  const original = number(item.market_price);
  const badges = [string(item.item_badge), string(item.price_badge)]
    .map(badge)
    .filter((itemBadge): itemBadge is CatalogBadge => itemBadge !== undefined)
    .slice(0, 2);

  return {
    id,
    title,
    imageUrl: absoluteImageUrl(image),
    productUrl: `https://www.yami.com/us/${locale}/p/${slug}/${id}`,
    ...(brandLabel
      ? {
          brand: {
            ...(brandId ? { id: brandId } : {}),
            label: brandLabel,
            ...(brandId ? { url: `https://www.yami.com/us/${locale}/b/${brandSlug}/${brandId}` } : {}),
          },
        }
      : {}),
    price: {
      currency: "USD",
      current,
      ...(original !== undefined && original > current ? { original } : {}),
    },
    ...(number(item.rated) !== undefined ? { rating: number(item.rated) } : {}),
    ...(number(item.comment_count) !== undefined ? { reviewCount: number(item.comment_count) } : {}),
    ...(scalarString(item.weekly_qty)
      ? { soldLabel: `${scalarString(item.weekly_qty)} ${string(item.weekly_qty_sign) || (locale === "zh" ? "周销" : "Sold")}` }
      : {}),
    badges,
  };
}

function categories(values: unknown, locale: CatalogLocale): CatalogCategory[] {
  if (!Array.isArray(values)) return [];
  return values.flatMap((value) => {
    const item = record(value);
    const id = number(item?.category_id)?.toString() || string(item?.category_id);
    const label = locale === "zh"
      ? string(item?.category_name) || string(item?.category_ename)
      : string(item?.category_ename) || string(item?.category_name);
    if (!item || !id || !label) return [];
    return [{
      id,
      label,
      ...(number(item.result_count) !== undefined ? { resultCount: number(item.result_count) } : {}),
      children: categories(item.children, locale),
    }];
  });
}

export interface YamiLiveCatalogOptions {
  fetch?: typeof fetch;
  now?: () => Date;
  timeoutMs?: number;
}

export class YamiLiveCatalogAdapter implements CommerceCatalog {
  private readonly fetcher: typeof fetch;
  private readonly now: () => Date;
  private readonly timeoutMs: number;

  constructor(options: YamiLiveCatalogOptions = {}) {
    this.fetcher = options.fetch ?? fetch;
    this.now = options.now ?? (() => new Date());
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  async search(request: CatalogSearchRequest): Promise<CatalogSearchResult> {
    const normalized = normalizeCatalogRequest(request);
    return this.load(normalized);
  }

  async getCategoryTree(request: CategoryTreeRequest): Promise<CategoryTreeResult> {
    const result = await this.load({
      query: "",
      locale: request.locale,
      page: 1,
      pageSize: 1,
      sort: "featured",
      categoryIds: [],
    });
    return { categories: result.categories, meta: result.meta };
  }

  private async load(
    request: ReturnType<typeof normalizeCatalogRequest> | {
      query: "";
      locale: CategoryTreeRequest["locale"];
      page: 1;
      pageSize: 1;
      sort: "featured";
      categoryIds: [];
    },
  ): Promise<CatalogSearchResult> {
    if (typeof window !== "undefined") {
      throw new CatalogError("server_only", "The live catalog Adapter is server-only.");
    }

    const [sortBy, sortOrder] = sortValues[request.sort];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response: Response;
    try {
      response = await this.fetcher(YAMI_CATALOG_URL, {
        method: "POST",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          origin: "https://www.yami.com",
          referer: "https://www.yami.com/",
          site_code: "US",
          token: "",
          y_language: request.locale === "zh" ? "zh_CN" : "en_US",
          y_platform: "web",
        },
        body: JSON.stringify({
          keywords: request.query,
          page_index: request.page,
          page_size: request.pageSize,
          sort_by: sortBy,
          sort_order: sortOrder,
          exclude_category_ids: "11",
          page_type: 3,
          oldCard: 1,
          recordSearchHistory: 0,
          ...(request.categoryIds.length > 0
            ? { category_ids: request.categoryIds.join(",") }
            : {}),
        }),
        signal: controller.signal,
      });
    } catch (error) {
      throw new CatalogError("request_failed", "Yami catalog search failed.", { cause: error });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      throw new CatalogError(
        "request_failed",
        `Yami catalog search returned HTTP ${response.status}.`,
      );
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch (error) {
      throw new CatalogError("invalid_response", "Yami catalog returned invalid JSON.", { cause: error });
    }

    const root = record(payload);
    const body = record(root?.body);
    if (root?.messageId !== "10000" || !body || !Array.isArray(body.items)) {
      throw new CatalogError("invalid_response", "Yami catalog returned an invalid response.");
    }

    const products = Array.from(new Map(body.items
      .map((item) => product(item, request.locale))
      .filter((item): item is CatalogProduct => item !== undefined)
      .map((item) => [item.id, item])).values());
    const page = record(body.page);
    const total = number(page?.total) ?? products.length;
    const fetchedAt = this.now().toISOString();

    return {
      request,
      products,
      categories: categories(body.categoryAgg, request.locale),
      pagination: {
        page: request.page,
        pageSize: request.pageSize,
        total,
        pageCount: Math.ceil(total / request.pageSize),
      },
      meta: {
        mode: "live",
        source: "yami-catalog",
        fetchedAt,
        cacheStatus: "miss",
      },
    };
  }
}
