import { describe, expect, it } from "vitest";
import {
  buildTopicPagePlan,
  buildTopicPagePlanFromProductSelection,
  type ProductSelectionResult,
  type YamiSearchSnapshot,
} from "../src/index.js";

describe("ProductSelection to PagePlan boundary", () => {
  it("preserves category roles and deterministic module assignments", () => {
    const products = ([
      { id: "core-1", title: "Ceramic Bowl", role: "core", categoryL3Id: 1000 },
      { id: "core-2", title: "Matcha Powder", role: "core", categoryL3Id: 1000 },
      { id: "pairing-1", title: "Matcha Cookie", role: "pairing", categoryL3Id: 1005 },
      { id: "accessory-1", title: "Bamboo Whisk", role: "accessory", categoryL3Id: 1008 },
    ] as const).map((product, index) => ({
      ...product,
      brand: `Brand ${index + 1}`,
      price: "$1.00",
      imageUrl: `https://example.com/${product.id}.webp`,
      productUrl: `https://example.com/${product.id}`,
      sourceRank: index + 1,
      pool: "primary" as const,
    }));
    const snapshot: YamiSearchSnapshot = {
      keyword: "Matcha",
      site: "us",
      sourceUrl: "https://example.com/search?q=Matcha",
      fetchedAt: "2026-08-18T00:00:00.000Z",
      products,
    };
    const result: ProductSelectionResult = {
      schemaVersion: "product-selection-result/v1",
      strategyRef: "category-role/landing-page-agent@1",
      keyword: "Matcha",
      site: "us",
      selectedAt: "2026-08-18T00:00:00.000Z",
      pools: {
        primaryIds: products.map(({ id }) => id),
        relatedIds: [],
      },
      products,
      selectedCategories: [
        { id: "1000", label: "Matcha Core", path: ["Tea", "Matcha Core"], role: "core", reason: "Core reason" },
        { id: "1005", label: "Tea Pairing", path: ["Snacks", "Tea Pairing"], role: "pairing", reason: "Pairing reason" },
        { id: "1008", label: "Tea Tool", path: ["Kitchen", "Tea Tool"], role: "accessory", reason: "Accessory reason" },
      ],
      scenes: [],
      modules: [
        { id: "start-here", productIds: ["core-1", "pairing-1", "accessory-1"], groups: [] },
        { id: "popular-picks", productIds: ["core-2"], groups: [] },
        { id: "brand-spotlight", productIds: ["pairing-1"], groups: [] },
        { id: "explore-more", productIds: ["accessory-1"], groups: [] },
      ],
    };

    const plan = buildTopicPagePlanFromProductSelection(snapshot, result, "zh");

    expect(plan.selectionStrategy.id).toBe("category-role");
    expect(plan.selectedCategories[0]).toMatchObject({
      id: "1000",
      label: "Matcha Core",
      role: "core",
      source: "catalog-category",
      productIds: ["core-1", "core-2"],
    });
    expect(plan.groups).toContainEqual(expect.objectContaining({
      label: "Matcha Core",
      role: "core",
      productIds: ["core-1", "core-2"],
    }));
    expect(plan.products.find(({ id }) => id === "core-1")).toMatchObject({
      productType: "Matcha Core",
      role: "core",
    });
    for (const selectionModule of result.modules) {
      expect(plan.modules.find(({ id }) => id === selectionModule.id)?.productIds)
        .toEqual(selectionModule.productIds);
    }
  });

  it("does not allow the legacy category-role inference entry point", () => {
    expect(() => buildTopicPagePlan({
      keyword: "Matcha",
      site: "us",
      sourceUrl: "https://example.com/search?q=Matcha",
      fetchedAt: "2026-08-18T00:00:00.000Z",
      products: [],
    }, "category-role")).toThrow("ProductSelectionResult");
  });
});
