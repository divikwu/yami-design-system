import { describe, expect, it, vi } from "vitest";

import {
  CatalogError,
  ScenarioCatalogAdapter,
  SnapshotCatalogAdapter,
  YamiLiveCatalogAdapter,
  type CatalogDataset,
} from "../src/index";

const product = {
  id: "1",
  title: "Matcha powder",
  imageUrl: "https://cdn.yamibuy.net/matcha.webp",
  productUrl: "https://www.yami.com/us/en/p/matcha/1",
  price: { currency: "USD", current: 12.99 },
  badges: [],
} as const;

const dataset = {
  id: "baseline",
  locale: "en",
  products: [product],
  total: 1,
  capturedAt: "2026-08-26T00:00:00.000Z",
} satisfies CatalogDataset;

describe("CommerceCatalog Seam", () => {
  it("serves a deterministic scenario through the shared Interface", async () => {
    const catalog = new ScenarioCatalogAdapter(dataset);
    const result = await catalog.search({ query: " matcha ", locale: "en" });

    expect(result.request.query).toBe("matcha");
    expect(result.products).toEqual([product]);
    expect(result.meta).toMatchObject({ mode: "scenario", source: "baseline" });
  });

  it("rejects a snapshot when the requested evaluation no longer matches it", async () => {
    const catalog = new SnapshotCatalogAdapter({
      schemaVersion: "1",
      id: "matcha-2026-08-26",
      digest: "sha256:test",
      capturedAt: "2026-08-26T00:00:00.000Z",
      request: {
        query: "matcha",
        locale: "en",
        page: 1,
        pageSize: 30,
        sort: "featured",
        categoryIds: [],
      },
      result: {
        products: [product],
        categories: [],
        pagination: { page: 1, pageSize: 30, total: 1, pageCount: 1 },
      },
    });

    const result = await catalog.search({ query: "matcha", locale: "en" });
    expect(result.meta.source).toBe("matcha-2026-08-26");

    await expect(catalog.search({ query: "ramen", locale: "en" })).rejects.toMatchObject({
      code: "snapshot_mismatch",
    } satisfies Partial<CatalogError>);
    await expect(catalog.search({ query: "matcha", locale: "en", page: 2 })).rejects.toMatchObject({
      code: "snapshot_mismatch",
    } satisfies Partial<CatalogError>);
    await expect(catalog.search({
      query: "matcha",
      locale: "en",
      sort: "price-low",
    })).rejects.toMatchObject({
      code: "snapshot_mismatch",
    } satisfies Partial<CatalogError>);
  });

  it("normalizes the live Yami response without leaking its response shape", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      messageId: "10000",
      body: {
        items: [{
          status: "A",
          item_number: "1157",
          goods_ename: "Ceremonial Matcha",
          image_url: "/matcha.webp",
          slug: "ceremonial-matcha",
          brand_ename: "Yami Tea",
          brand_id: 99,
          brand_slug: "yami-tea",
          shop_price: 18.99,
          market_price: 22.99,
          rated: 4.8,
          comment_count: 12,
          item_badge: "Hot",
        }],
        page: { total: 42 },
        categoryAgg: [{
          category_id: 8,
          category_ename: "Tea",
          result_count: 42,
          children: [],
        }],
      },
    }), { status: 200 }));
    const catalog = new YamiLiveCatalogAdapter({
      fetch: fetcher,
      now: () => new Date("2026-08-29T00:00:00.000Z"),
    });

    const result = await catalog.search({ query: "matcha", locale: "en", pageSize: 30 });

    expect(result.products[0]).toMatchObject({
      id: "1157",
      title: "Ceremonial Matcha",
      imageUrl: "https://cdn.yamibuy.net/matcha.webp",
      price: { currency: "USD", current: 18.99, original: 22.99 },
      badges: [{ label: "Hot", kind: "hot" }],
    });
    expect(result.categories).toEqual([{
      id: "8",
      label: "Tea",
      resultCount: 42,
      children: [],
    }]);
    expect(result.meta).toEqual({
      mode: "live",
      source: "yami-catalog",
      fetchedAt: "2026-08-29T00:00:00.000Z",
      cacheStatus: "miss",
    });

    const request = fetcher.mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body))).toMatchObject({
      keywords: "matcha",
      page_index: 1,
      page_size: 30,
      sort_by: 3,
    });
  });

  it("maps Chinese live fields and destinations for the Chinese locale", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      messageId: "10000",
      body: {
        items: [{
          status: "A",
          item_number: "1157",
          goods_name: "宇治抹茶粉",
          goods_ename: "Uji Matcha Powder",
          image_url: "/matcha.webp",
          slug: "uji-matcha",
          brand_name: "丸久小山园",
          brand_ename: "MARUKYU KOYAMAEN",
          brand_id: 99,
          brand_slug: "marukyu-koyamaen",
          shop_price: 18.99,
          weekly_qty: 100,
          weekly_qty_sign: "周销",
        }],
        page: { total: 1 },
        categoryAgg: [{
          category_id: 8,
          category_name: "茶饮",
          category_ename: "Tea",
          children: [],
        }],
      },
    }), { status: 200 }));
    const catalog = new YamiLiveCatalogAdapter({ fetch: fetcher });

    const result = await catalog.search({ query: "抹茶", locale: "zh" });

    expect(result.products[0]).toMatchObject({
      title: "宇治抹茶粉",
      productUrl: "https://www.yami.com/us/zh/p/uji-matcha/1157",
      brand: {
        label: "丸久小山园",
        url: "https://www.yami.com/us/zh/b/marukyu-koyamaen/99",
      },
      soldLabel: "100 周销",
    });
    expect(result.categories[0]?.label).toBe("茶饮");
  });

  it("fails closed when the live response is not a catalog response", async () => {
    const catalog = new YamiLiveCatalogAdapter({
      fetch: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ body: { items: [] } }), { status: 200 }),
      ),
    });

    await expect(catalog.search({ query: "matcha", locale: "en" })).rejects.toMatchObject({
      code: "invalid_response",
    } satisfies Partial<CatalogError>);
  });
});
