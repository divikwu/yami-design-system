import { describe, expect, it, vi } from "vitest";
import {
  loadCatalogCandidateSnapshot,
  parseCatalogCandidateSnapshot,
  type CatalogCandidateAdapter,
  type CatalogCandidateQuery,
  type ProductRole,
  yamiCatalogCandidateAdapter,
} from "../src/index.js";

describe("ProductSelection catalog candidate loader", () => {
  it("runs ten featured category queries and one sold discovery query", async () => {
    const roles: ProductRole[] = [
      "core", "core", "core", "core", "core",
      "pairing", "pairing", "pairing",
      "accessory", "accessory",
    ];
    const categories = roles.map((role, index) => ({
      id: String(1000 + index),
      label: `Category ${index + 1}`,
      path: ["Catalog", `Category ${index + 1}`],
      role,
      reason: `Reason ${index + 1}`,
    }));
    const queries: CatalogCandidateQuery[] = [];
    const search = vi.fn(async (query: CatalogCandidateQuery) => {
      queries.push(query);
      const categoryId = query.categoryId ?? "1005";
      return [{
        id: query.categoryId ? `category-${categoryId}` : "discovery-1",
        title: `Product ${categoryId}`,
        brand: `Brand ${categoryId}`,
        price: "$1.00",
        imageUrl: `https://example.com/${categoryId}.webp`,
        productUrl: `https://example.com/${categoryId}`,
        sourceRank: 1,
        categoryL3Id: Number(categoryId),
        soldCount: 100,
      }];
    });
    const adapter: CatalogCandidateAdapter = { id: "fixture", search };

    const snapshot = await loadCatalogCandidateSnapshot({
      keyword: "Matcha",
      site: "us",
      strategyRef: "category-role/landing-page-agent@1",
      taxonomyDigest: "sha256:taxonomy",
      categories,
      adapter,
      now: () => new Date("2026-08-18T00:00:00.000Z"),
    });

    expect(queries).toEqual([
      ...categories.map(({ id }) => ({
        keyword: "Matcha",
        site: "us",
        categoryId: id,
        limit: 100,
        sort: "featured",
      })),
      {
        keyword: "Matcha",
        site: "us",
        limit: 200,
        sort: "sold",
      },
    ]);
    expect(snapshot).toMatchObject({
      schemaVersion: "catalog-candidate-snapshot/v1",
      strategyRef: "category-role/landing-page-agent@1",
      fetchedAt: "2026-08-18T00:00:00.000Z",
      digest: expect.stringMatching(/^sha256:[a-f0-9]{64}$/),
      source: { adapterId: "fixture" },
      discoveryProductIds: ["discovery-1"],
    });
    expect(snapshot.source.attempts).toEqual(expect.arrayContaining([
      { requestId: "category:1000", status: "succeeded" },
      { requestId: "discovery", status: "succeeded" },
    ]));
    expect(snapshot.categories).toContainEqual(expect.objectContaining({
      id: "1000",
      role: "core",
      productIds: ["category-1000"],
    }));
    expect(new Set(snapshot.products.map(({ id }) => id)).size).toBe(11);
    expect(search).toHaveBeenCalledTimes(11);
    expect(parseCatalogCandidateSnapshot(snapshot)).toEqual(snapshot);
    expect(() => parseCatalogCandidateSnapshot({
      ...snapshot,
      products: snapshot.products.map((product, index) =>
        index === 0 ? { ...product, title: "Changed" } : product
      ),
    })).toThrow("digest");
  });

  it("maps portable candidate queries to the Yami getItemList contract", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        messageId: "10000",
        body: {
          items: [{
            item_number: "product-1",
            goods_ename: "Matcha Product",
            brand_ename: "Matcha Brand",
            category_l3_id: 1691,
            image_url: "/item/product-1.webp",
            slug: "matcha-product",
            status: "A",
            goods_number: 1,
          }],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      await yamiCatalogCandidateAdapter.search({
        keyword: "Matcha",
        site: "us",
        categoryId: "1691",
        limit: 100,
        sort: "featured",
      });
      await yamiCatalogCandidateAdapter.search({
        keyword: "Matcha",
        site: "us",
        limit: 200,
        sort: "sold",
      });

      expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
        keywords: "Matcha",
        category_ids: "1691",
        page_size: 100,
        sort_by: 3,
        sort_order: 0,
      });
      expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
        keywords: "Matcha",
        page_size: 200,
        sort_by: 6,
        sort_order: 0,
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
