import { describe, expect, it, vi } from "vitest";
import {
  buildTopicPagePlan,
  buildTopicPagePlanMatrix,
} from "../src/planner.js";
import type {
  YamiProduct,
  YamiSearchSnapshot,
} from "../src/types.js";
import {
  buildYamiSearchUrl,
  parseYamiSearchHtml,
} from "../src/yami-search.js";
import {
  parseYamiCatalogResponse,
  searchYamiCatalog,
} from "../src/yami-catalog.js";

function product(
  id: string,
  title: string,
  rank: number,
  brand = "ANUA",
): YamiProduct {
  return {
    id,
    title,
    brand,
    price: rank % 2 === 0 ? "$1.00" : "$99.00",
    imageUrl: `https://cdn.yamibuy.net/item/${id}_750x750.webp`,
    productUrl: `https://www.yami.com/us/en/p/example/${id}`,
    sourceRank: rank,
  };
}

function snapshot(products: YamiProduct[]): YamiSearchSnapshot {
  return {
    keyword: "ANUA",
    site: "us",
    sourceUrl: buildYamiSearchUrl("ANUA"),
    fetchedAt: "2026-08-15T00:00:00.000Z",
    products,
  };
}

describe("TOPIC GENERATOR Yami search provider", () => {
  it("requeries products with the catalog categories selected by ThemeIntent", async () => {
    const payload = {
      messageId: "10000",
      body: {
        categoryAgg: [
          {
            category_id: 3,
            category_name: "茶饮冲调",
            category_ename: "Tea & Beverages",
            children: [
              {
                category_id: 31,
                category_name: "茶",
                category_ename: "Tea",
                children: [
                  {
                    category_id: 1691,
                    category_name: "抹茶",
                    category_ename: "Matcha",
                    result_count: 1,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
        items: [
          {
            item_number: "2001",
            goods_ename: "Uji Matcha Powder 40g",
            category_l1_id: 3,
            category_l2_id: 31,
            category_l3_id: 1691,
            image_url: "/item/matcha_0x0.webp",
            slug: "uji-matcha-powder",
            status: "A",
            goods_number: 8,
          },
        ],
      },
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => payload,
    });
    vi.stubGlobal("fetch", fetchMock);

    try {
      await searchYamiCatalog("matcha");
      expect(fetchMock).toHaveBeenCalledTimes(2);
      const secondRequest = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));
      expect(secondRequest.category_ids).toBe("1691");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("retries a zero-result scenario with a reviewable retrieval query", async () => {
    const emptyPayload = { messageId: "10000", body: { items: [] } };
    const payload = {
      messageId: "10000",
      body: {
        categoryAgg: [
          {
            category_id: 9,
            category_name: "火锅底料",
            category_ename: "Hot Pot Soup Base",
            result_count: 1,
            children: [],
          },
          {
            category_id: 10,
            category_name: "火锅食材",
            category_ename: "Hot Pot Ingredients",
            result_count: 1,
            children: [],
          },
        ],
        items: [
          {
            item_number: "hot-pot-1",
            goods_ename: "Hot Pot Soup Base",
            category_l3_id: 9,
            image_url: "/item/hot-pot.webp",
            slug: "hot-pot-soup-base",
            status: "A",
            goods_number: 8,
          },
          {
            item_number: "hot-pot-2",
            goods_ename: "Hot Pot Fish Ball",
            category_l3_id: 10,
            image_url: "/item/fish-ball.webp",
            slug: "hot-pot-fish-ball",
            status: "A",
            goods_number: 8,
          },
        ],
      },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => emptyPayload })
      .mockResolvedValue({ ok: true, json: async () => payload });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const result = await searchYamiCatalog("hot pot night essentials");
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
        keywords: "hot pot",
      });
      expect(result.snapshot.retrievalTerms).toEqual(["hot pot"]);
      expect(result.intent).toMatchObject({
        themeType: "activity",
        shopperAction: "bundle",
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rewrites a low-coverage Chinese scenario query before resolving intent", async () => {
    const lowCoveragePayload = {
      messageId: "10000",
      body: {
        categoryAgg: [{
          category_id: 80,
          category_name: "餐厅家具",
          category_ename: "Dining & Kitchen Furniture",
          result_count: 1,
          children: [],
        }],
        items: [{
          item_number: "furniture-1",
          goods_ename: "Small Kitchen Shelf",
          category_l3_id: 80,
          image_url: "/item/furniture.webp",
          slug: "small-kitchen-shelf",
          status: "A",
          goods_number: 2,
        }],
      },
    };
    const broadPayload = {
      messageId: "10000",
      body: {
        categoryAgg: [
          {
            category_id: 81,
            category_name: "厨房收纳",
            category_ename: "Kitchen Storage",
            result_count: 8,
            children: [],
          },
          {
            category_id: 82,
            category_name: "置物架",
            category_ename: "Storage Racks",
            result_count: 5,
            children: [],
          },
        ],
        items: Array.from({ length: 12 }, (_, index) => ({
          item_number: `storage-${index}`,
          goods_ename: `Kitchen Storage Product ${index}`,
          category_l3_id: index < 8 ? 81 : 82,
          image_url: `/item/storage-${index}.webp`,
          slug: `kitchen-storage-${index}`,
          status: "A",
          goods_number: 2,
        })),
      },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => lowCoveragePayload })
      .mockResolvedValue({ ok: true, json: async () => broadPayload });
    vi.stubGlobal("fetch", fetchMock);

    try {
      const result = await searchYamiCatalog("小户型厨房收纳");
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
        keywords: "厨房收纳",
      });
      expect(result.snapshot.retrievalTerms).toEqual(["厨房收纳"]);
      expect(result.intent).toMatchObject({
        themeType: "activity",
        entityType: "scenario",
        shopperAction: "bundle",
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("builds a catalog-evidenced brand intent from the product interface", () => {
    const result = parseYamiCatalogResponse("ANUA", {
      messageId: "10000",
      body: {
        brandAgg: [
          {
            brand_id: 100,
            brand_name: "艾诺碧",
            brand_ename: "ANUA",
            result_count: 12,
          },
        ],
        categoryAgg: [
          {
            category_id: 5,
            category_name: "美妆个护",
            category_ename: "Beauty",
            level: 1,
            children: [
              {
                category_id: 50,
                category_name: "面部护理",
                category_ename: "Skin Care",
                level: 2,
                children: [
                  {
                    category_id: 500,
                    category_name: "精华",
                    category_ename: "Serums & Essences",
                    level: 3,
                    result_count: 12,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
        items: [
          {
            item_number: "1001",
            goods_ename: "ANUA Heartleaf Serum",
            goods_name: "ANUA 鱼腥草精华",
            brand_id: 100,
            brand_name: "艾诺碧",
            brand_ename: "ANUA",
            category_l1_id: 5,
            category_l2_id: 50,
            category_l3_id: 500,
            image_url: "/item/anua_0x0.webp",
            slug: "anua-heartleaf-serum",
            shop_price: 19.99,
            status: "A",
            goods_number: 3,
          },
        ],
      },
    });

    expect(result.intent).toMatchObject({
      schemaVersion: "theme-intent/v2",
      source: "catalog-evidence",
      themeType: "brand",
      entityType: "brand",
      canonicalEntity: { id: "100", label: "ANUA" },
      shoppingIntent: "browse-brand",
      shopperAction: "browse",
      decision: {
        status: "resolved",
        evidenceLevel: "high",
        requiresAgentReview: false,
      },
    });
    expect(result.intent.constraints).toContainEqual(expect.objectContaining({
      value: "ANUA",
      status: "verified",
    }));
    expect(result.intent.candidates.map(({ entityType }) => entityType)).toEqual([
      "brand",
      "category",
    ]);
    expect(result.snapshot.products[0]).toMatchObject({
      id: "1001",
      categoryL3Id: 500,
      categoryL3Name: "Serums & Essences",
    });
  });

  it("uses an exact catalog category as the canonical product intent", () => {
    const result = parseYamiCatalogResponse("matcha", {
      messageId: "10000",
      body: {
        categoryAgg: [
          {
            category_id: 3,
            category_name: "茶饮冲调",
            category_ename: "Tea & Beverages",
            level: 1,
            children: [
              {
                category_id: 31,
                category_name: "茶",
                category_ename: "Tea",
                level: 2,
                children: [
                  {
                    category_id: 1691,
                    category_name: "抹茶",
                    category_ename: "Matcha",
                    level: 3,
                    result_count: 18,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
        items: [
          {
            item_number: "2001",
            goods_ename: "Uji Matcha Powder 40g",
            brand_ename: "Tea Brand",
            category_l1_id: 3,
            category_l2_id: 31,
            category_l3_id: 1691,
            image_url: "/item/matcha_0x0.webp",
            slug: "uji-matcha-powder",
            shop_price: 29.99,
            status: "A",
            goods_number: 8,
          },
        ],
      },
    });

    expect(result.intent).toMatchObject({
      source: "catalog-evidence",
      themeType: "product",
      entityType: "category",
      canonicalEntity: { id: "1691", label: "Matcha" },
      shoppingIntent: "find-product",
      confidence: 0.92,
    });
  });

  it("matches the Chinese alias of a catalog category as exact evidence", () => {
    const result = parseYamiCatalogResponse("抹茶", {
      messageId: "10000",
      body: {
        categoryAgg: [{
          category_id: 3,
          category_name: "茶饮冲调",
          category_ename: "Tea & Beverages",
          children: [{
            category_id: 31,
            category_name: "茶",
            category_ename: "Tea",
            children: [{
              category_id: 1691,
              category_name: "抹茶",
              category_ename: "Matcha",
              result_count: 8,
              children: [],
            }],
          }],
        }],
        items: [{
          item_number: "2001",
          goods_ename: "Uji Matcha Powder 40g",
          category_l1_id: 3,
          category_l2_id: 31,
          category_l3_id: 1691,
          image_url: "/item/matcha_0x0.webp",
          slug: "uji-matcha-powder",
          status: "A",
          goods_number: 8,
        }],
      },
    });

    expect(result.intent).toMatchObject({
      entityType: "category",
      canonicalEntity: { id: "1691", label: "Matcha" },
      confidence: 0.92,
    });
  });

  it("keeps competing exact entity interpretations instead of hiding a collision", () => {
    const result = parseYamiCatalogResponse("Matcha", {
      messageId: "10000",
      body: {
        brandAgg: [{
          brand_id: 800,
          brand_name: "抹茶牌",
          brand_ename: "Matcha",
          result_count: 4,
        }],
        categoryAgg: [{
          category_id: 3,
          category_name: "茶饮冲调",
          category_ename: "Tea & Beverages",
          children: [{
            category_id: 1691,
            category_name: "抹茶",
            category_ename: "Matcha",
            result_count: 4,
            children: [],
          }],
        }],
        items: [{
          item_number: "collision-1",
          goods_ename: "Matcha Green Tea",
          brand_id: 800,
          brand_ename: "Matcha",
          category_l1_id: 3,
          category_l3_id: 1691,
          image_url: "/item/collision_0x0.webp",
          slug: "matcha-green-tea",
          status: "A",
          goods_number: 5,
        }],
      },
    });

    expect(result.intent).toMatchObject({
      entityType: "brand",
      decision: {
        status: "ambiguous",
        selectedCandidateMargin: 0.03,
        requiresAgentReview: true,
      },
    });
    expect(result.intent.candidates.map(({ entityType }) => entityType)).toEqual([
      "brand",
      "category",
    ]);
  });

  it("recognizes a multi-category shopping scenario without a model call", () => {
    const result = parseYamiCatalogResponse("small kitchen storage", {
      messageId: "10000",
      body: {
        categoryAgg: [
          {
            category_id: 8,
            category_name: "家居生活",
            category_ename: "Home & Living",
            level: 1,
            children: [
              {
                category_id: 81,
                category_name: "厨房用品",
                category_ename: "Kitchen & Dining",
                level: 2,
                children: [
                  {
                    category_id: 810,
                    category_name: "厨房收纳",
                    category_ename: "Kitchen Storage",
                    level: 3,
                    result_count: 6,
                    children: [],
                  },
                  {
                    category_id: 811,
                    category_name: "置物架",
                    category_ename: "Storage Racks",
                    level: 3,
                    result_count: 4,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
        items: [
          {
            item_number: "3001",
            goods_ename: "Slim Kitchen Storage Rack",
            brand_ename: "Home Brand",
            category_l1_id: 8,
            category_l2_id: 81,
            category_l3_id: 810,
            image_url: "/item/rack_0x0.webp",
            slug: "slim-kitchen-storage-rack",
            status: "A",
            goods_number: 4,
          },
          {
            item_number: "3002",
            goods_ename: "Countertop Organizer",
            brand_ename: "Home Brand",
            category_l1_id: 8,
            category_l2_id: 81,
            category_l3_id: 811,
            image_url: "/item/organizer_0x0.webp",
            slug: "countertop-organizer",
            status: "A",
            goods_number: 2,
          },
        ],
      },
    });

    expect(result.intent).toMatchObject({
      themeType: "activity",
      entityType: "scenario",
      shoppingIntent: "assemble-scenario",
      canonicalEntity: { label: "small kitchen storage" },
    });
    expect(result.intent.categories.map(({ id }) => id)).toEqual(["810", "811"]);
  });

  it("uses catalog tags as evidence for an attribute-constrained product intent", () => {
    const result = parseYamiCatalogResponse("sugar free matcha snacks", {
      messageId: "10000",
      body: {
        tagAgg: [
          { tag_id: 437, tag: "0糖", tag_eng: "Sugar Free" },
          { tag_id: 748, tag: "季节抹茶限定", tag_eng: "For Matcha Lovers" },
        ],
        categoryAgg: [
          {
            category_id: 1,
            category_name: "零食",
            category_ename: "Snack",
            level: 1,
            children: [
              {
                category_id: 16,
                category_name: "饼干糕点",
                category_ename: "Cookies & Cakes",
                level: 2,
                children: [
                  {
                    category_id: 101,
                    category_name: "饼干",
                    category_ename: "Cookies",
                    level: 3,
                    result_count: 9,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
        items: [
          {
            item_number: "4001",
            goods_ename: "Sugar Free Matcha Cookies",
            brand_ename: "Snack Brand",
            category_l1_id: 1,
            category_l2_id: 16,
            category_l3_id: 101,
            image_url: "/item/cookie_0x0.webp",
            slug: "sugar-free-matcha-cookies",
            status: "A",
            goods_number: 12,
          },
        ],
      },
    });

    expect(result.intent).toMatchObject({
      themeType: "product",
      entityType: "category",
      shoppingIntent: "find-product",
      shopperAction: "filter",
      canonicalEntity: { id: "1", label: "Snack" },
    });
    expect(result.intent.mustInclude).toEqual(expect.arrayContaining(["Snack", "Sugar Free"]));
    expect(result.intent.conditions).toEqual(expect.arrayContaining(["Sugar Free", "Matcha"]));
  });

  it("keeps the full keyword as an unverified constraint when tags only partially overlap", () => {
    const result = parseYamiCatalogResponse("sugar free matcha snacks", {
      messageId: "10000",
      body: {
        tagAgg: [
          { tag_id: 924, tag: "健康零食", tag_eng: "Healthy Snacks" },
          { tag_id: 748, tag: "季节抹茶限定", tag_eng: "For Matcha Lovers" },
        ],
        categoryAgg: [
          {
            category_id: 1,
            category_name: "零食",
            category_ename: "Snack",
            children: [
              {
                category_id: 101,
                category_name: "饼干",
                category_ename: "Cookies",
                result_count: 1,
                children: [],
              },
            ],
          },
        ],
        items: [
          {
            item_number: "4002",
            goods_ename: "Matcha Cookies",
            category_l1_id: 1,
            category_l2_id: 1,
            category_l3_id: 101,
            image_url: "/item/cookie_0x0.webp",
            slug: "matcha-cookies",
            status: "A",
            goods_number: 2,
          },
        ],
      },
    });

    expect(result.intent).toMatchObject({
      entityType: "category",
      canonicalEntity: { id: "1", label: "Snack" },
      confidence: 0.76,
      shopperAction: "filter",
      decision: {
        status: "ambiguous",
        evidenceLevel: "medium",
        requiresAgentReview: true,
      },
    });
    expect(result.intent.mustInclude).toContain("Snack");
    expect(result.intent.conditions).toContain("sugar free");
    expect(result.intent.constraints).toContainEqual(expect.objectContaining({
      value: "sugar free",
      status: "unverified",
    }));
  });

  it("separates an unverified modifier from a contained catalog category", () => {
    const result = parseYamiCatalogResponse("heartleaf toner", {
      messageId: "10000",
      body: {
        categoryAgg: [
          {
            category_id: 5,
            category_name: "美妆个护",
            category_ename: "Beauty",
            level: 1,
            children: [
              {
                category_id: 50,
                category_name: "面部护理",
                category_ename: "Skin Care",
                level: 2,
                children: [
                  {
                    category_id: 501,
                    category_name: "爽肤水",
                    category_ename: "Toners",
                    level: 3,
                    result_count: 7,
                    children: [],
                  },
                ],
              },
            ],
          },
        ],
        items: [
          {
            item_number: "5001",
            goods_ename: "Heartleaf Soothing Toner",
            brand_ename: "Beauty Brand",
            category_l1_id: 5,
            category_l2_id: 50,
            category_l3_id: 501,
            image_url: "/item/toner_0x0.webp",
            slug: "heartleaf-soothing-toner",
            status: "A",
            goods_number: 5,
          },
        ],
      },
    });

    expect(result.intent).toMatchObject({
      themeType: "product",
      entityType: "category",
      canonicalEntity: { id: "501", label: "Toners" },
      shoppingIntent: "find-product",
      shopperAction: "filter",
    });
    expect(result.intent.mustInclude).toContain("Toners");
    expect(result.intent.conditions).toContain("heartleaf");
    expect(result.intent.constraints).toContainEqual(expect.objectContaining({
      value: "heartleaf",
      status: "unverified",
    }));
  });

  it("normalizes a Chinese shopper term to the catalog category while retaining its modifier", () => {
    const result = parseYamiCatalogResponse("鱼腥草爽肤水", {
      messageId: "10000",
      body: {
        categoryAgg: [{
          category_id: 5,
          category_name: "美妆个护",
          category_ename: "Beauty",
          children: [{
            category_id: 50,
            category_name: "面部护理",
            category_ename: "Skin Care",
            children: [{
              category_id: 501,
              category_name: "化妆水",
              category_ename: "Toners",
              result_count: 7,
              children: [],
            }],
          }],
        }],
        items: [{
          item_number: "5002",
          goods_ename: "Heartleaf Soothing Toner",
          category_l1_id: 5,
          category_l2_id: 50,
          category_l3_id: 501,
          image_url: "/item/heartleaf-toner.webp",
          slug: "heartleaf-soothing-toner",
          status: "A",
          goods_number: 5,
        }],
      },
    });

    expect(result.intent).toMatchObject({
      themeType: "product",
      entityType: "category",
      canonicalEntity: { id: "501", label: "Toners" },
      shopperAction: "filter",
      decision: { status: "ambiguous" },
    });
    expect(result.intent.conditions).toContain("鱼腥草");
    expect(result.intent.constraints).toContainEqual(expect.objectContaining({
      value: "鱼腥草",
      status: "unverified",
    }));
  });

  it("builds a United States catalog URL", () => {
    expect(buildYamiSearchUrl("matcha latte")).toBe(
      "https://www.yami.com/us/en/search?q=matcha+latte",
    );
  });

  it("parses purchasable cards and ignores unavailable cards", () => {
    const html = `
      <div data-qa-itemcard="" data-item_number="1001">
        <a class="itemCard_productImageWrapper__abc" href="/us/en/p/heartleaf-serum/1001?track=search">
          <img data-qa-itemcard-image-md5="" src="https://cdn.yamibuy.net/item/demo_300x300.webp" />
        </a>
        <a data-qa-itemcard-brand-txt="" aria-label="Brands ANUA"></a>
        <a data-qa-itemcard-name-txt="" title="Heartleaf &amp; Hyaluron Serum"></a>
        <div aria-label="Current price: $19.99"></div>
        <button data-qa-itemcard-addcart-btn=""></button>
      </div>
      <div data-qa-itemcard="" data-item_number="1002">
        <a class="itemCard_productImageWrapper__abc" href="/us/en/p/sold-out/1002">
          <img data-qa-itemcard-image-md5="" src="https://cdn.yamibuy.net/item/sold_300x300.webp" />
        </a>
        <a data-qa-itemcard-brand-txt="" aria-label="Brands ANUA"></a>
        <a data-qa-itemcard-name-txt="" title="Sold out toner"></a>
        <span>Get Restock Alerts</span>
      </div>
    `;

    expect(parseYamiSearchHtml(html)).toEqual([
      {
        id: "1001",
        title: "Heartleaf & Hyaluron Serum",
        brand: "ANUA",
        price: "$19.99",
        imageUrl: "https://cdn.yamibuy.net/item/demo_750x750.webp",
        productUrl: "https://www.yami.com/us/en/p/heartleaf-serum/1001",
        sourceRank: 1,
      },
    ]);
  });
});

describe("Topic page planner", () => {
  const products = [
    product("1", "ANUA Heartleaf Cleansing Foam", 1),
    product("2", "ANUA Heartleaf Soothing Toner", 2),
    product("3", "ANUA Niacinamide Serum", 3),
    product("4", "ANUA Rice Moisturizing Cream", 4),
    product("5", "ANUA Daily Sunscreen SPF 50", 5),
    product("6", "ANUA PDRN Serum Mask", 6),
    product("7", "ANUA Cleansing Oil", 7),
    product("8", "ANUA Hyaluron Ampoule", 8),
    product("9", "ANUA Barrier Lotion", 9),
    product("10", "ANUA Glow Toner", 10),
    product("11", "Rice Toner", 11, "Related Brand"),
    product("12", "Daily Sheet Mask", 12, "Related Brand"),
  ];

  it("keeps price out of ordering and uses PrimaryPool for every visible module", () => {
    const plan = buildTopicPagePlan(snapshot(products), "relevance");
    const primaryIds = new Set(plan.pools.primaryIds);

    expect(plan.pools.primaryIds.slice(0, 4)).toEqual(["1", "2", "3", "4"]);
    expect(plan.products.find((item) => item.id === "1")?.price).toBe("$99.00");
    plan.modules
      .filter((module) => module.visible)
      .forEach((module) => {
        expect(module.productIds.every((id) => primaryIds.has(id))).toBe(true);
      });
    expect(plan.qualityNotes).toContain(
      "Price is not displayed and is never used for filtering, relevance, or module order.",
    );
    expect(plan.qualityNotes).toContain(
      "Catalog is fixed to Yami United States; site is never inferred by the planner.",
    );
    expect(plan.selectionStrategy.id).toBe("relevance");
  });

  it("degrades a plan when catalog evidence only partially verifies the intent", () => {
    const plan = buildTopicPagePlan(
      {
        ...snapshot(Array.from({ length: 10 }, (_, index) =>
          product(String(index + 1), `Sugar Free Matcha Snack ${index + 1}`, index + 1, "Snack Brand")
        )),
        keyword: "sugar free matcha snacks",
        provider: "yami-catalog-search",
        intent: {
          schemaVersion: "theme-intent/v2",
          source: "catalog-evidence",
          themeType: "product",
          catalogDomain: "Snack",
          attributeSchemaVersion: "catalog-v1",
          entityType: "category",
          canonicalEntity: { id: "1", label: "Snack" },
          shoppingIntent: "find-product",
          shopperAction: "filter",
          shoppingGoal: "Find products matching the complete keyword.",
          needs: ["Sugar Free", "Matcha"],
          conditions: ["sugar free", "matcha"],
          mustInclude: ["Snack"],
          mustExclude: [],
          searchTerms: ["sugar free matcha snacks"],
          categories: [],
          constraints: [
            {
              id: "core-entity:snack",
              kind: "core-entity",
              value: "Snack",
              status: "verified",
              evidenceIds: ["catalog-category:1"],
            },
            {
              id: "modifier:sugar-free",
              kind: "modifier",
              value: "sugar free",
              status: "unverified",
              evidenceIds: [],
            },
          ],
          evidenceRefs: [{
            id: "catalog-category:1",
            source: "catalog-category",
            label: "Snack",
          }],
          candidates: [{
            id: "product:category:1:find-product:filter",
            themeType: "product",
            entityType: "category",
            canonicalEntity: { id: "1", label: "Snack" },
            shoppingIntent: "find-product",
            shopperAction: "filter",
            score: 0.76,
            evidenceLevel: "medium",
            reason: "Catalog tags only partially overlap the keyword.",
            supportingEvidenceIds: ["catalog-category:1"],
            competingCandidateIds: [],
          }],
          decision: {
            status: "ambiguous",
            selectedCandidateId: "product:category:1:find-product:filter",
            evidenceLevel: "medium",
            selectedCandidateMargin: 0.02,
            requiresAgentReview: true,
          },
          reason: "Catalog tags only partially overlap the keyword.",
          confidence: 0.76,
        },
      },
      "relevance",
      "zh",
    );

    expect(plan.status).toBe("degraded");
    expect(plan.statusReason).toContain("购物意图证据不足");
  });

  it("builds English and Chinese copy from the same selection result", () => {
    const matrix = buildTopicPagePlanMatrix(snapshot(products));
    const english = matrix.en.relevance;
    const chinese = matrix.zh.relevance;

    expect(chinese.language).toBe("zh");
    expect(chinese.generatedAt).toBe(english.generatedAt);
    expect(chinese.pools).toEqual(english.pools);
    expect(chinese.content.headline).toBe("探索 ANUA");
    expect(chinese.statusReason).toBe("10 件直接匹配商品已可用于模块规划。");
    expect(chinese.groups.find((group) => group.id === "cleansers")?.label).toBe("洁面");
    expect(chinese.modules.find((module) => module.id === "shortcuts")?.heading).toBe("按类型选购");
    expect(chinese.products[0]?.brand).toBe(english.products[0]?.brand);
    expect(chinese.products[0]?.title).toBe(english.products[0]?.title);
    expect(chinese.products[0]?.selectionReason).toContain("关键词直接命中");
  });

  it("stops after module assignment in selection mode", () => {
    const plan = buildTopicPagePlan(snapshot(products), "relevance", "en", "selection");

    expect(plan.generationMode).toBe("selection");
    expect(plan.pools.primaryIds).not.toHaveLength(0);
    expect(plan.modules.length).toBeGreaterThan(0);
    expect(plan.modules.every((module) => module.heading === "" && module.description === ""))
      .toBe(true);
    expect(plan.modules.find(({ id }) => id === "popular-picks")?.productIds)
      .toEqual(plan.pools.primaryIds.slice(0, 8));
    expect(plan.content).toMatchObject({
      headline: "",
      description: "",
      copyMode: "not-generated",
    });
    expect(plan.assetStrategy.mode).toBe("not-generated");
    expect(plan.workflow.map((step) => step.stage)).toEqual(["03", "04"]);
  });

  it("enables a brand spotlight only for a query-matched dominant brand", () => {
    const plan = buildTopicPagePlan(snapshot(products), "relevance");
    const brandModule = plan.modules.find((module) => module.id === "brand-spotlight");
    const reviewModule = plan.modules.find((module) => module.id === "reviews");

    expect(brandModule?.visible).toBe(true);
    expect(brandModule?.heading).toBe("Meet ANUA");
    expect(reviewModule?.visible).toBe(false);
    expect(reviewModule?.reason).toContain("do not provide review evidence");
  });

  it("marks a plan degraded when only contextual Yami results are available", () => {
    const contextual = products.map((item) => ({
      ...item,
      brand: "Mixed brand",
      title: item.title.replaceAll("ANUA", "Daily"),
    }));
    const result = buildTopicPagePlan(
      {
        ...snapshot(contextual),
        keyword: "夏日护理",
      },
      "relevance",
    );

    expect(result.status).toBe("degraded");
    expect(result.pools.primaryIds).toHaveLength(12);
    expect(result.products[0]?.selectionReason).toContain("Contextual Yami result");
  });

  it("prioritizes high-confidence food types over ambiguous beauty words", () => {
    const ramenProducts = Array.from({ length: 8 }, (_, index) =>
      product(
        String(index + 20),
        `Spicy creamy ramen noodle bowl ${index + 1}`,
        index + 1,
        "Noodle brand",
      ),
    );
    const result = buildTopicPagePlan(
      {
        ...snapshot(ramenProducts),
        keyword: "ramen",
      },
      "relevance",
    );

    expect(result.groups).toEqual([
      {
        id: "noodles-meals",
        label: "Noodles & Meals",
        role: "core",
        productIds: ramenProducts.map((item) => item.id),
      },
    ]);
  });
});
