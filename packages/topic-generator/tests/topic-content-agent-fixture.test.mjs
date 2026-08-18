import { describe, expect, it } from "vitest";

import { contentProposal } from "./fixtures/topic-content-agent.mjs";

function product(id, title, categoryL3Id, categoryL3Name) {
  return {
    id,
    title,
    brand: "ANUA",
    categoryL3Id,
    categoryL3Name,
    pool: "primary",
    role: "core",
  };
}

function contextFixture() {
  const serum = product("serum", "Niacinamide 10% Serum", 101, "Serums");
  const cleanser = product("cleanser", "Gentle Foaming Cleanser", 102, "Cleansers");
  const pads = product("pads", "Hyaluronic Glow Pad", 103, "Toner Pads");
  return {
    keyword: "ANUA",
    site: "us",
    language: "zh",
    strategyRef: "relevance/default@1",
    templateRef: "topic-landing/brand@1",
    topicPagePlanDigest: "sha256:plan",
    themeIntentDigest: "sha256:intent",
    productSelectionDigest: "sha256:selection",
    themeIntent: {
      themeType: "brand",
      catalogDomain: "beauty",
      evidenceRefs: [{ id: "brand:anua", label: "ANUA", source: "catalog-brand" }],
    },
    selectedCategories: [
      { id: "101", label: "精华与套装" },
      { id: "102", label: "清洁" },
      { id: "103", label: "爽肤棉" },
    ],
    tasks: [
      {
        taskId: "content-hero",
        moduleId: "hero",
        component: "ThemeHero",
        assignments: [serum, cleanser].map((item, index) => ({
          slotId: `hero-${index + 1}`,
          productId: item.id,
        })),
        scenes: [],
        products: [serum, cleanser],
      },
      {
        taskId: "content-shortcuts",
        moduleId: "shortcuts",
        component: "ShortcutRail",
        assignments: [serum, cleanser, pads].map((item, index) => ({
          slotId: `shortcuts-${index + 1}`,
          productId: item.id,
        })),
        scenes: [],
        products: [serum, cleanser, pads],
      },
      {
        taskId: "content-popular",
        moduleId: "popular-picks",
        component: "ProductList",
        assignments: [{ slotId: "popular-1", productId: serum.id }],
        scenes: [],
        products: [serum],
      },
      {
        taskId: "content-explore",
        moduleId: "explore-more",
        component: "ProductList",
        assignments: [serum, cleanser, pads].map((item, index) => ({
          slotId: `explore-${index + 1}`,
          productId: item.id,
        })),
        scenes: [],
        products: [serum, cleanser, pads],
      },
    ],
  };
}

function allSegments(value) {
  if (!value || typeof value !== "object") return [];
  if (typeof value.text === "string" && Array.isArray(value.evidenceRefs)) return [value];
  return Object.values(value).flatMap(allSegments);
}

describe("Topic Content Agent protocol fixture", () => {
  it("writes consumer-facing brand copy from intent, categories, and assigned products", () => {
    const proposal = contentProposal({ context: contextFixture() });
    const hero = proposal.tasks.find(({ moduleId }) => moduleId === "hero").copy;
    const shortcuts = proposal.tasks.find(({ moduleId }) => moduleId === "shortcuts").copy;
    const popular = proposal.tasks.find(({ moduleId }) => moduleId === "popular-picks").copy;
    const explore = proposal.tasks.find(({ moduleId }) => moduleId === "explore-more").copy;

    expect(hero.title.text).toBe("ANUA 护肤选购指南");
    expect(hero.description.text).toContain("精华与套装、清洁");
    expect(hero.description.text).not.toMatch(/已验证|商品池|Agent|PagePlan/);
    expect(hero.tags.map(({ text }) => text)).toEqual(["精华与套装", "清洁"]);
    expect(shortcuts.title.text).toBe("按品类快速查找");
    expect(shortcuts.items.map(({ label }) => label.text)).toEqual([
      "精华与套装",
      "清洁",
      "爽肤棉",
    ]);
    expect(popular.title.text).toBe("先看这些 ANUA 单品");
    expect(explore.title.text).toBe("继续探索 ANUA");
    expect(allSegments(proposal).every(({ evidenceRefs }) => evidenceRefs.length > 0)).toBe(true);
    expect(hero.title.evidenceRefs).toEqual(expect.arrayContaining([
      "theme-intent:brand:anua",
      "selected-category:101",
      "product:serum",
    ]));
  });

  it("writes the same brand task set entirely in English when English is requested", () => {
    const context = contextFixture();
    context.language = "en";
    context.themeIntent.catalogDomain = "Beauty";
    context.selectedCategories = [
      { id: "101", label: "Serums & Value Sets" },
      { id: "102", label: "Cleansers" },
      { id: "103", label: "Toner Pads" },
    ];

    const proposal = contentProposal({ context });
    const hero = proposal.tasks.find(({ moduleId }) => moduleId === "hero").copy;
    const shortcuts = proposal.tasks.find(({ moduleId }) => moduleId === "shortcuts").copy;
    const popular = proposal.tasks.find(({ moduleId }) => moduleId === "popular-picks").copy;
    const explore = proposal.tasks.find(({ moduleId }) => moduleId === "explore-more").copy;

    expect(proposal.language).toBe("en");
    expect(hero.title.text).toBe("A practical ANUA beauty edit");
    expect(hero.description.text).toContain("Serums & Value Sets and Cleansers");
    expect(hero.tags.map(({ text }) => text)).toEqual([
      "Serums & Value Sets",
      "Cleansers",
    ]);
    expect(shortcuts.title.text).toBe("Browse by category");
    expect(shortcuts.items.map(({ label }) => label.text)).toEqual([
      "Serums & Value Sets",
      "Cleansers",
      "Toner Pads",
    ]);
    expect(popular.title.text).toBe("ANUA picks to start with");
    expect(explore.title.text).toBe("Keep exploring ANUA");
    expect(allSegments(proposal).map(({ text }) => text).join(" ")).not.toMatch(/[\u3400-\u9fff]/u);
    expect(allSegments(proposal).every(({ evidenceRefs }) => evidenceRefs.length > 0)).toBe(true);
  });

  it("keeps scene copy bound to the declared scene and its products", () => {
    const context = contextFixture();
    context.keyword = "Matcha morning";
    context.language = "en";
    context.templateRef = "topic-landing/campaign@1";
    context.themeIntent = {
      themeType: "activity",
      catalogDomain: "grocery",
      evidenceRefs: [{ id: "scenario:matcha", label: "Matcha morning", source: "scenario-vocabulary" }],
    };
    context.selectedCategories = [
      { id: "101", label: "Matcha" },
      { id: "102", label: "Tea snacks" },
    ];
    const sceneProducts = context.tasks[1].products.slice(0, 2);
    context.tasks = [{
      taskId: "content-start-here",
      moduleId: "start-here",
      component: "ThemeProductList",
      assignments: sceneProducts.map((item, index) => ({
        slotId: `start-${index + 1}`,
        productId: item.id,
        sceneId: "morning",
      })),
      scenes: [{
        id: "morning",
        productIds: sceneProducts.map(({ id }) => id),
      }],
      products: sceneProducts,
    }];

    const proposal = contentProposal({ context });
    const scene = proposal.tasks[0].copy.scenes[0];
    expect(scene.label.text).toBe("Matcha and Tea snacks");
    expect(scene.title.text).toBe("Start with Matcha and Tea snacks");
    expect(scene.description.text).toContain("main picks and complementary products");
    expect(scene.description.evidenceRefs).toEqual(expect.arrayContaining([
      "scene:morning",
      "product:serum",
      "product:cleanser",
    ]));
  });

  it("uses assigned product categories when relevance selection has no category roles", () => {
    const context = contextFixture();
    context.themeIntent.catalogDomain = "Beauty";
    context.selectedCategories = [];
    context.tasks[0].products[0].categoryL3Name = "Serums & Value Sets";
    context.tasks[1].products[0].categoryL3Name = "Serums & Value Sets";
    context.tasks[1].products[1].categoryL3Name = "Cleanser & Exfoliators";
    context.tasks[1].products[2].categoryL3Name = "Toning Pads";

    const proposal = contentProposal({ context });
    const hero = proposal.tasks.find(({ moduleId }) => moduleId === "hero").copy;
    const shortcuts = proposal.tasks.find(({ moduleId }) => moduleId === "shortcuts").copy;

    expect(hero.title.text).toBe("ANUA 护肤选购指南");
    expect(hero.description.text).toContain("精华与套装、洁面与去角质");
    expect(shortcuts.items.map(({ label }) => label.text)).toEqual([
      "精华与套装",
      "洁面与去角质",
      "爽肤棉",
    ]);
    expect(allSegments(proposal).every(({ evidenceRefs }) => evidenceRefs.length > 0)).toBe(true);
  });
});
