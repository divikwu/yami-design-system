import { describe, expect, it } from "vitest";
import {
  buildTopicPagePlan,
  buildTopicPagePlanMatrix,
  buildTopicPagePlans,
} from "../app/lib/topic-generator/planner";
import type {
  YamiProduct,
  YamiSearchSnapshot,
} from "../app/lib/topic-generator/types";
import {
  buildYamiSearchUrl,
  parseYamiSearchHtml,
} from "../app/lib/topic-generator/yami-search";

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

describe("Yami search provider", () => {
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

  it("builds relevance and category-role variants from the same candidate snapshot", () => {
    const variants = buildTopicPagePlans(snapshot(products));

    expect(variants.relevance.generatedAt).toBe(variants["category-role"].generatedAt);
    expect(variants.relevance.pools.primaryIds).toEqual([
      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    ]);
    expect(variants["category-role"].pools.primaryIds).toHaveLength(12);
    expect(variants["category-role"].products[0]?.selectionReason).toContain(
      "Core category",
    );
  });

  it("allocates category-role products to the modules used by the repository workflow", () => {
    const roleProducts = [
      product("30", "Ceremonial Matcha Powder", 1, "Tea brand"),
      product("31", "Organic Matcha Tea", 2, "Tea brand"),
      product("32", "Green Tea Mochi", 3, "Snack brand"),
      product("33", "Chocolate Cookie", 4, "Snack brand"),
      product("34", "Ceramic Tea Bowl", 5, "Home brand"),
      product("35", "Bamboo Kitchen Whisk", 6, "Home brand"),
    ];
    const plan = buildTopicPagePlan(
      {
        ...snapshot(roleProducts),
        keyword: "matcha",
      },
      "category-role",
    );

    expect(plan.products.map(({ id, role }) => [id, role])).toEqual([
      ["30", "core"],
      ["32", "pairing"],
      ["34", "accessory"],
      ["31", "core"],
      ["33", "pairing"],
      ["35", "accessory"],
    ]);
    expect(plan.modules.find(({ id }) => id === "shortcuts")?.productIds).toEqual(["30"]);
    expect(plan.modules.find(({ id }) => id === "popular-picks")?.productIds).toEqual(["30", "31"]);
    expect(plan.modules.find(({ id }) => id === "start-here")?.productIds).toEqual([
      "30", "32", "34", "31", "33", "35",
    ]);
    expect(plan.modules.find(({ id }) => id === "explore-more")?.productIds).toEqual([
      "32", "33", "34", "35",
    ]);
  });

  it("keeps pairing and accessory roles in PrimaryPool when core results exceed the limit", () => {
    const roleProducts = [
      ...Array.from({ length: 20 }, (_, index) =>
        product(`${index + 1}`, `Matcha Tea ${index + 1}`, index + 1, "Tea brand"),
      ),
      product("21", "Matcha Mochi", 21, "Snack brand"),
      product("22", "Matcha Cookie", 22, "Snack brand"),
      product("23", "Matcha Tea Bowl", 23, "Home brand"),
      product("24", "Matcha Bamboo Whisk", 24, "Home brand"),
    ];
    const plan = buildTopicPagePlan(
      {
        ...snapshot(roleProducts),
        keyword: "matcha",
      },
      "category-role",
    );
    const primaryProducts = plan.products.filter(({ pool }) => pool === "primary");

    expect(primaryProducts).toHaveLength(18);
    expect(primaryProducts.filter(({ role }) => role === "pairing").map(({ id }) => id)).toEqual([
      "21", "22",
    ]);
    expect(primaryProducts.filter(({ role }) => role === "accessory").map(({ id }) => id)).toEqual([
      "23", "24",
    ]);
    expect(plan.modules.find(({ id }) => id === "explore-more")?.productIds).toEqual([
      "21", "22", "23", "24",
    ]);
  });

  it("applies the repository 5:3:2 target to categories rather than products", () => {
    const categoryProducts = [
      product("core-1", "theme ramen", 1),
      product("core-2", "theme cleanser", 2),
      product("core-3", "theme toner", 3),
      product("core-4", "theme serum", 4),
      product("core-5", "theme cream", 5),
      product("core-6", "theme sunscreen", 6),
      product("pairing-1", "theme snack", 7),
      product("pairing-2", "theme cookie", 8),
      product("pairing-3", "theme tea", 9),
      product("pairing-4", "theme sauce", 10),
      product("accessory-1", "theme bowl", 11),
      product("accessory-2", "theme detergent", 12),
      product("accessory-3", "theme toothpaste", 13),
    ];
    const plan = buildTopicPagePlan(
      {
        ...snapshot(categoryProducts),
        keyword: "theme",
      },
      "category-role",
    );

    expect(plan.groups).toHaveLength(10);
    expect(plan.groups.filter(({ role }) => role === "core")).toHaveLength(5);
    expect(plan.groups.filter(({ role }) => role === "pairing")).toHaveLength(3);
    expect(plan.groups.filter(({ role }) => role === "accessory")).toHaveLength(2);
    expect(plan.pools.relatedIds).toEqual(["core-6", "pairing-4", "accessory-3"]);
    expect(plan.selectedCategories).toHaveLength(10);
    expect(plan.selectedCategories[0]).toMatchObject({
      role: "core",
      source: "inferred-product-type",
    });
    expect(plan.selectedCategories[0]?.reason).not.toBe("");
  });

  it("uses elastic category targets when core categories are scarce", () => {
    const categoryProducts = [
      product("core-1", "theme ramen", 1),
      product("core-2", "theme cleanser", 2),
      product("core-3", "theme toner", 3),
      product("pairing-1", "theme snack", 4),
      product("pairing-2", "theme cookie", 5),
      product("pairing-3", "theme tea", 6),
      product("pairing-4", "theme sauce", 7),
      product("accessory-1", "theme bowl", 8),
      product("accessory-2", "theme detergent", 9),
      product("accessory-3", "theme toothpaste", 10),
    ];
    const plan = buildTopicPagePlan(
      { ...snapshot(categoryProducts), keyword: "theme" },
      "category-role",
    );

    expect(plan.selectedCategories.filter(({ role }) => role === "core")).toHaveLength(3);
    expect(plan.selectedCategories.filter(({ role }) => role === "pairing")).toHaveLength(4);
    expect(plan.selectedCategories.filter(({ role }) => role === "accessory")).toHaveLength(3);
  });

  it("does not let a brand query override pairing and accessory categories", () => {
    const plan = buildTopicPagePlan(
      {
        ...snapshot([
          product("brand-core", "ANUA Heartleaf Serum", 1),
          product("brand-pairing", "ANUA Heartleaf Cookie", 2),
          product("brand-accessory", "ANUA Ceramic Bowl", 3),
          product("brand-related", "ANUA Limited Collectible", 4),
        ]),
        keyword: "ANUA",
      },
      "category-role",
    );
    const rolesByLabel = new Map(
      plan.selectedCategories.map(({ label, role }) => [label, role]),
    );

    expect(rolesByLabel.get("Serums & Essences")).toBe("core");
    expect(rolesByLabel.get("Sweets")).toBe("pairing");
    expect(rolesByLabel.get("Kitchen & Dining")).toBe("accessory");
    expect(rolesByLabel.get("More to Explore")).toBe("pairing");
  });

  it("requires the complete phrase before promoting a multiword category to core", () => {
    const plan = buildTopicPagePlan(
      {
        ...snapshot([
          product("storage", "Home Storage Organizer", 1, "Storage brand"),
          product("cream", "Home Face Cream", 2, "Beauty brand"),
          product("bowl", "Storage Bowl Set", 3, "Kitchen brand"),
        ]),
        keyword: "home storage",
      },
      "category-role",
    );
    const rolesByLabel = new Map(
      plan.selectedCategories.map(({ label, role }) => [label, role]),
    );

    expect(rolesByLabel.get("Home Care")).toBe("core");
    expect(rolesByLabel.get("Moisturizers")).toBe("pairing");
    expect(rolesByLabel.get("Kitchen & Dining")).toBe("accessory");
  });

  it("degrades category-role plans with fewer than three inferred categories", () => {
    const plan = buildTopicPagePlan(
      {
        ...snapshot([
          ...Array.from({ length: 8 }, (_, index) =>
            product(`ramen-${index}`, `Ramen Noodles ${index}`, index + 1, "Noodle brand"),
          ),
          product("cookie-1", "Chocolate Cookie", 9, "Snack brand"),
          product("cookie-2", "Matcha Mochi", 10, "Snack brand"),
        ]),
        keyword: "ramen",
      },
      "category-role",
    );

    expect(plan.selectedCategories).toHaveLength(2);
    expect(plan.status).toBe("degraded");
    expect(plan.statusReason).toContain("Only 2 candidate categories");
  });

  it("builds English and Chinese copy from the same selection result", () => {
    const matrix = buildTopicPagePlanMatrix(snapshot(products));
    const english = matrix.en.relevance;
    const chinese = matrix.zh.relevance;

    expect(chinese.language).toBe("zh");
    expect(chinese.generatedAt).toBe(english.generatedAt);
    expect(chinese.pools).toEqual(english.pools);
    expect(chinese.content.headline).toBe("探索 ANUA");
    expect(chinese.groups.find((group) => group.id === "cleansers")?.label).toBe("洁面");
    expect(chinese.modules.find((module) => module.id === "shortcuts")?.heading).toBe("按类型选购");
    expect(chinese.products[0]?.selectionReason).toContain("关键词直接命中");
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
