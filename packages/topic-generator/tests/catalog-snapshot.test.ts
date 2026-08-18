import { describe, expect, it, vi } from "vitest";
import {
  CatalogSnapshotLoadError,
  loadCatalogSnapshot,
  type CatalogSnapshotAdapter,
} from "../src/catalog-snapshot.js";
import type { YamiSearchSnapshot } from "../src/types.js";
import {
  fetchYamiCatalogSnapshot,
  parseYamiCatalogSnapshot,
} from "../src/yami-catalog.js";

function snapshot(provider: YamiSearchSnapshot["provider"]): YamiSearchSnapshot {
  return {
    keyword: "ANUA",
    site: "us",
    sourceUrl: "https://example.com/catalog?q=ANUA",
    fetchedAt: "2026-08-17T00:00:00.000Z",
    provider,
    products: [{
      id: "1001",
      title: "ANUA Heartleaf Toner",
      brand: "ANUA",
      price: "$19.99",
      imageUrl: "https://example.com/1001.webp",
      productUrl: "https://example.com/1001",
      sourceRank: 1,
    }],
  };
}

describe("CatalogSnapshot Seam", () => {
  it("records a structured Adapter failure before using the fallback Adapter", async () => {
    const structuredLoad = vi.fn().mockRejectedValue(
      Object.assign(new Error("catalog unavailable"), { code: "request_failed" }),
    );
    const fallbackLoad = vi.fn().mockResolvedValue(snapshot("yami-web-search"));
    const adapters: CatalogSnapshotAdapter[] = [
      { id: "yami-catalog-search", load: structuredLoad },
      { id: "yami-web-search", load: fallbackLoad },
    ];

    const result = await loadCatalogSnapshot("ANUA", { adapters });

    expect(structuredLoad).toHaveBeenCalledWith({ keyword: "ANUA", site: "us" });
    expect(fallbackLoad).toHaveBeenCalledWith({ keyword: "ANUA", site: "us" });
    expect(result).toMatchObject({
      fallbackUsed: true,
      snapshot: { provider: "yami-web-search" },
      attempts: [
        {
          adapterId: "yami-catalog-search",
          status: "failed",
          errorCode: "request_failed",
          message: "catalog unavailable",
        },
        { adapterId: "yami-web-search", status: "succeeded" },
      ],
    });
  });

  it("returns every failed Adapter attempt when no CatalogSnapshot can be loaded", async () => {
    const adapters: CatalogSnapshotAdapter[] = [
      {
        id: "structured",
        load: vi.fn().mockRejectedValue(
          Object.assign(new Error("bad payload"), { code: "invalid_response" }),
        ),
      },
      {
        id: "fallback",
        load: vi.fn().mockRejectedValue(
          Object.assign(new Error("no items"), { code: "no_products" }),
        ),
      },
    ];

    await expect(loadCatalogSnapshot("ANUA", { adapters })).rejects.toMatchObject({
      name: "CatalogSnapshotLoadError",
      attempts: [
        { adapterId: "structured", status: "failed", errorCode: "invalid_response" },
        { adapterId: "fallback", status: "failed", errorCode: "no_products" },
      ],
    } satisfies Partial<CatalogSnapshotLoadError>);
  });

  it("normalizes structured catalog evidence before any ThemeIntent is resolved", () => {
    const result = parseYamiCatalogSnapshot("ANUA", {
      messageId: "10000",
      body: {
        brandAgg: [{
          brand_id: 100,
          brand_name: "艾诺碧",
          brand_ename: "ANUA",
          result_count: 12,
        }],
        categoryAgg: [{
          category_id: 5,
          category_name: "美妆个护",
          category_ename: "Beauty",
          children: [{
            category_id: 50,
            category_name: "面部护理",
            category_ename: "Skin Care",
            children: [{
              category_id: 500,
              category_name: "爽肤水",
              category_ename: "Toners",
              result_count: 12,
              children: [],
            }],
          }],
        }],
        tagAgg: [{ tag_id: 437, tag: "鱼腥草", tag_eng: "Heartleaf" }],
        items: [{
          item_number: "1001",
          goods_ename: "ANUA Heartleaf Toner",
          brand_id: 100,
          brand_ename: "ANUA",
          category_l1_id: 5,
          category_l2_id: 50,
          category_l3_id: 500,
          image_url: "/item/anua_0x0.webp",
          slug: "anua-heartleaf-toner",
          status: "A",
          goods_number: 3,
        }],
      },
    });

    expect(result.intent).toBeUndefined();
    expect(result.evidence).toEqual({
      brands: [{
        id: "100",
        label: "ANUA",
        aliases: ["ANUA", "艾诺碧"],
        resultCount: 12,
      }],
      categories: expect.arrayContaining([{
        id: "500",
        label: "Toners",
        aliases: ["Toners", "爽肤水"],
        path: ["Beauty", "Skin Care", "Toners"],
        resultCount: 12,
        productCount: 1,
      }]),
      attributes: [{
        id: "437",
        label: "Heartleaf",
        aliases: ["Heartleaf", "鱼腥草"],
      }],
    });
  });

  it("deduplicates structured products before calculating category coverage", () => {
    const item = {
      item_number: "1001",
      goods_ename: "ANUA Heartleaf Toner",
      brand_ename: "ANUA",
      category_l3_id: 500,
      image_url: "/item/anua_0x0.webp",
      slug: "anua-heartleaf-toner",
      status: "A",
      goods_number: 3,
    };
    const result = parseYamiCatalogSnapshot("ANUA", {
      messageId: "10000",
      body: {
        categoryAgg: [{
          category_id: 500,
          category_ename: "Toners",
          result_count: 12,
        }],
        items: [item, { ...item, sold_count: 99 }],
      },
    });

    expect(result.products.map(({ id }) => id)).toEqual(["1001"]);
    expect(result.evidence?.categories[0]).toMatchObject({
      id: "500",
      resultCount: 12,
      productCount: 1,
    });
  });

  it("reports structured product rejection and field-quality counts", () => {
    const validItem = {
      item_number: "1001",
      goods_ename: "ANUA Heartleaf Toner",
      brand_ename: "ANUA",
      category_l3_id: 500,
      image_url: "/item/anua_0x0.webp",
      slug: "anua-heartleaf-toner",
      shop_price: 19.99,
      status: "A",
      goods_number: 3,
    };
    const result = parseYamiCatalogSnapshot("ANUA", {
      messageId: "10000",
      body: {
        items: [
          validItem,
          { ...validItem, item_number: "1002", brand_ename: undefined, shop_price: undefined },
          { ...validItem, sold_count: 99 },
          { ...validItem, item_number: undefined },
          { ...validItem, item_number: "1003", goods_ename: undefined },
          { ...validItem, item_number: "1004", image_url: undefined },
          { ...validItem, item_number: "1005", status: "I" },
          { ...validItem, item_number: "1006", goods_number: 0 },
        ],
      },
    });

    expect(result.quality).toEqual({
      observedProductCount: 8,
      acceptedProductCount: 2,
      rejectedProductCount: 6,
      truncatedProductCount: 0,
      issueCounts: {
        duplicateId: 1,
        missingId: 1,
        missingTitle: 1,
        missingBrand: 1,
        missingImage: 1,
        missingPrice: 1,
        missingProductUrl: 1,
        unavailable: 1,
        outOfStock: 1,
        notPurchasable: 0,
        keywordMismatch: 0,
      },
    });
  });

  it("recalculates category product counts after a narrowed catalog query", async () => {
    const item = (id: string) => ({
      item_number: id,
      goods_ename: `ANUA Toner ${id}`,
      brand_ename: "ANUA",
      category_l3_id: 500,
      image_url: `/item/${id}.webp`,
      slug: `anua-toner-${id}`,
      status: "A",
      goods_number: 3,
    });
    const categoryAgg = [{
      category_id: 500,
      category_ename: "Toners",
      result_count: 12,
    }];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messageId: "10000",
          body: { categoryAgg, items: [item("1001"), item("1002")] },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          messageId: "10000",
          body: { categoryAgg, items: [item("1001")] },
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const result = await fetchYamiCatalogSnapshot("ANUA");
      expect(result.products.map(({ id }) => id)).toEqual(["1001"]);
      expect(result.evidence?.categories[0]).toMatchObject({
        id: "500",
        resultCount: 12,
        productCount: 1,
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
