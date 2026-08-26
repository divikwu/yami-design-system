import { describe, expect, it, vi } from "vitest";

import {
  advancePageMerchandisingRun,
  compileDeterministicTopicPagePlanV2,
  compileTopicPagePlanV2,
  evidenceSizedSceneProductRange,
  getLandingPageTypeConfig,
  getPageMerchandisingTemplateConfig,
  listPageMerchandisingTemplateConfigs,
  productSelectionDigest,
  runPageMerchandisingAgentWorkflow,
  themeIntentDigest,
  type ModuleMerchandisingProposal,
  type PageMerchandisingAgent,
  type ProductRole,
  type ProductSelectionProduct,
  type ProductSelectionResult,
  type ThemeIntent,
} from "../src/index.js";

const MODULE_ORDER = [
  "hero",
  "shortcuts",
  "start-here",
  "popular-picks",
  "brand-spotlight",
  "reviews",
  "explore-more",
] as const;

function productsFor(role: ProductRole, count: number): ProductSelectionProduct[] {
  return Array.from({ length: count }, (_, index) => {
    const number = index + 1;
    return {
      id: `${role}-${number}`,
      title: `${role} product ${number}`,
      brand: `${role} brand ${Math.ceil(number / 2)}`,
      price: "$1.00",
      imageUrl: `https://example.com/${role}-${number}.webp`,
      productUrl: `https://example.com/${role}-${number}`,
      sourceRank: number,
      categoryL3Id: role === "core" ? 1000 : role === "pairing" ? 1001 : 1002,
      categoryL3Name: `${role} category`,
      soldCount: 100 - number,
      pool: "primary",
      role,
    };
  });
}

function selectionFixture(): ProductSelectionResult {
  const products = [
    ...productsFor("core", 12),
    ...productsFor("pairing", 12),
    ...productsFor("accessory", 12),
  ];
  return {
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
      { id: "1000", label: "Core", path: ["Core"], role: "core", reason: "Core evidence" },
      { id: "1001", label: "Pairing", path: ["Pairing"], role: "pairing", reason: "Pairing evidence" },
      { id: "1002", label: "Accessory", path: ["Accessory"], role: "accessory", reason: "Accessory evidence" },
    ],
    scenes: Array.from({ length: 4 }, (_, index) => {
      const number = index + 1;
      return {
        id: `source-scene-${number}`,
        name: `Source scene ${number}`,
        title: `Legacy scene title ${number}`,
        description: `Legacy scene description ${number}`,
        productGroups: [number, number + 4].map((productNumber) => ({
          core: `core-${productNumber}`,
          pairing: `pairing-${productNumber}`,
          accessory: `accessory-${productNumber}`,
        })),
      };
    }),
    modules: [
      {
        id: "start-here",
        productIds: Array.from({ length: 4 }, (_, index) => {
          const number = index + 1;
          return [number, number + 4].flatMap((productNumber) => [
            `core-${productNumber}`,
            `pairing-${productNumber}`,
            `accessory-${productNumber}`,
          ]);
        }).flat(),
        groups: [],
      },
      {
        id: "popular-picks",
        productIds: ["core-9", "core-10", "core-11", "core-12"],
        groups: [],
      },
      { id: "brand-spotlight", productIds: [], groups: [] },
      {
        id: "explore-more",
        productIds: ["accessory-9", "accessory-10"],
        groups: [],
      },
    ],
  };
}

function themeIntentFixture(): ThemeIntent {
  return {
    schemaVersion: "theme-intent/v2",
    source: "catalog-evidence",
    themeType: "activity",
    catalogDomain: "grocery",
    attributeSchemaVersion: "catalog-v1",
    entityType: "scenario",
    canonicalEntity: null,
    shoppingIntent: "assemble-scenario",
    shopperAction: "bundle",
    shoppingGoal: "Build a complete matcha ritual",
    needs: ["matcha", "pairings", "tools"],
    conditions: ["daily ritual"],
    mustInclude: ["matcha"],
    mustExclude: [],
    searchTerms: ["matcha"],
    categories: [],
    constraints: [{
      id: "scenario:matcha-ritual",
      kind: "scenario",
      value: "matcha ritual",
      status: "verified",
      evidenceIds: ["scenario:matcha"],
    }],
    evidenceRefs: [{
      id: "scenario:matcha",
      source: "scenario-vocabulary",
      label: "matcha ritual",
    }],
    candidates: [{
      id: "scenario:matcha-ritual",
      themeType: "activity",
      entityType: "scenario",
      canonicalEntity: null,
      shoppingIntent: "assemble-scenario",
      shopperAction: "bundle",
      score: 0.9,
      evidenceLevel: "high",
      reason: "Catalog products support a complete matcha ritual.",
      supportingEvidenceIds: ["scenario:matcha"],
      competingCandidateIds: [],
    }],
    decision: {
      status: "resolved",
      selectedCandidateId: "scenario:matcha-ritual",
      evidenceLevel: "high",
      selectedCandidateMargin: null,
      requiresAgentReview: false,
    },
    reason: "Catalog products support a complete matcha ritual.",
    confidence: 0.9,
  };
}

function validProposal(
  selection = selectionFixture(),
  intent = themeIntentFixture(),
  templateRef: ModuleMerchandisingProposal["templateRef"] = "topic-landing/topic@1",
): ModuleMerchandisingProposal {
  return {
    schemaVersion: "module-merchandising-proposal/v1",
    keyword: selection.keyword,
    site: selection.site,
    strategyRef: selection.strategyRef,
    templateRef,
    themeIntentDigest: themeIntentDigest(intent),
    productSelectionDigest: productSelectionDigest(selection),
    moduleOrder: [...MODULE_ORDER],
    modules: [
      {
        id: "hero",
        visible: true,
        shoppingGoal: "Introduce the strongest matcha proposition",
        reason: "Three core products balance a strong anchor with representative variety.",
        scenes: [],
        assignments: [
          { productId: "core-5", selectionReason: "Strong sales anchor for the Hero." },
          { productId: "core-6", selectionReason: "Adds a distinct product type." },
          { productId: "core-7", selectionReason: "Completes representative catalog coverage." },
        ],
      },
      {
        id: "shortcuts",
        visible: true,
        shoppingGoal: "Offer stable category entry points",
        reason: "Two core categories have representative products.",
        scenes: [],
        assignments: [
          {
            groupId: "shortcut-core-7",
            productId: "core-7",
            reuseReason: "Also broadens the Hero composition.",
            selectionReason: "Highest-ranked representative for daily matcha.",
          },
          {
            groupId: "shortcut-core-8",
            productId: "core-8",
            selectionReason: "Distinct representative for ceremonial matcha.",
          },
        ],
      },
      {
        id: "start-here",
        visible: true,
        shoppingGoal: "Help shoppers assemble complete matcha occasions",
        reason: "Four validated source scenes cover distinct shopper tasks.",
        scenes: Array.from({ length: 4 }, (_, index) => ({
          id: `page-scene-${index + 1}`,
          sourceSceneId: `source-scene-${index + 1}`,
          targetProductCount: 6,
          shoppingGoal: `Complete matcha task ${index + 1}`,
          reason: `Source scene ${index + 1} is supported by selected products.`,
        })),
        assignments: Array.from({ length: 4 }, (_, index) => {
          const number = index + 1;
          const sceneId = `page-scene-${number}`;
          return [number, number + 4].flatMap((productNumber) => [
            {
              productId: `core-${productNumber}`,
              sceneId,
              ...(productNumber > 4
                ? {
                    reuseReason: productNumber < 7
                      ? "Also anchors the hero."
                      : "Also represents a shortcut.",
                  }
                : {}),
            },
            { productId: `pairing-${productNumber}`, sceneId },
            { productId: `accessory-${productNumber}`, sceneId },
          ]);
        }).flat(),
      },
      {
        id: "popular-picks",
        visible: true,
        shoppingGoal: "Surface strong core products",
        reason: "The next four core products preserve the frozen pool boundary.",
        scenes: [],
        assignments: [9, 10, 11, 12].map((number) => ({ productId: `core-${number}` })),
      },
      {
        id: "brand-spotlight",
        visible: false,
        shoppingGoal: "",
        reason: "No representative brand is required for this plan.",
        scenes: [],
        assignments: [],
      },
      {
        id: "reviews",
        visible: false,
        shoppingGoal: "",
        reason: "ProductSelection does not contain verified review records.",
        scenes: [],
        assignments: [],
      },
      {
        id: "explore-more",
        visible: true,
        shoppingGoal: "Continue into complementary discovery",
        reason: "Unused accessory products extend the topic without changing the core modules.",
        scenes: [],
        assignments: [{ productId: "accessory-9" }, { productId: "accessory-10" }],
      },
    ],
  };
}

describe("PageMerchandising", () => {
  it("compiles a minimal degraded page when only one primary product is available", () => {
    const intent = themeIntentFixture();
    const onlyProduct = productsFor("core", 1)[0]!;
    const selection: ProductSelectionResult = {
      schemaVersion: "product-selection-result/v1",
      strategyRef: "relevance/intent-themes@5",
      keyword: "Heytea",
      site: "us",
      selectedAt: "2026-08-25T00:00:00.000Z",
      pools: { primaryIds: [onlyProduct.id], relatedIds: [] },
      products: [onlyProduct],
      selectedCategories: [],
      scenes: [],
      modules: [
        { id: "popular-picks", productIds: [], groups: [] },
        { id: "explore-more", productIds: [onlyProduct.id], groups: [] },
        { id: "brand-spotlight", productIds: [], groups: [] },
      ],
    };
    const sourcePlan = {
      modules: MODULE_ORDER.map((id) => ({
        id,
        visible: id === "hero" || id === "explore-more",
        heading: id === "hero" ? "Heytea" : "Explore more",
        label: id,
        reason: "Continue with the limited verified assortment.",
        productIds: id === "hero" || id === "explore-more" ? [onlyProduct.id] : [],
        productReasons: { [onlyProduct.id]: "Only verified primary product." },
      })),
    };

    const plan = compileDeterministicTopicPagePlanV2(
      intent,
      selection,
      sourcePlan as never,
      "topic-landing/topic-relevance@2",
    );

    expect(plan.status).toBe("plan-ready");
    expect(plan.modules.find(({ id }) => id === "hero")).toMatchObject({
      visible: true,
      assignments: [expect.objectContaining({ productId: onlyProduct.id })],
    });
    expect(plan.modules.find(({ id }) => id === "shortcuts")?.visible).toBe(false);
    expect(plan.modules.find(({ id }) => id === "popular-picks")?.visible).toBe(false);
  });

  it("maps maintained category-role and page-specific relevance variants", () => {
    expect(listPageMerchandisingTemplateConfigs().map(({ ref }) => ref)).toEqual([
      "topic-landing/brand@2",
      "topic-landing/topic@2",
      "topic-landing/campaign@2",
      "topic-landing/brand-relevance@1",
      "topic-landing/topic-relevance@1",
      "topic-landing/campaign-relevance@1",
      "topic-landing/brand-relevance@2",
      "topic-landing/topic-relevance@2",
      "topic-landing/campaign-relevance@2",
    ]);
  });

  it("routes each maintained page type to an evidence-safe relevance template", () => {
    const cases = [
      ["landing-page/brand@2", "topic-landing/brand-relevance@2", 0],
      ["landing-page/topic@2", "topic-landing/topic-relevance@2", 18],
      ["landing-page/campaign@2", "topic-landing/campaign-relevance@2", 18],
    ] as const;

    cases.forEach(([pageTypeRef, templateRef, brandMaximumProducts]) => {
      const route = getLandingPageTypeConfig(pageTypeRef).routes.find(
        ({ selectionStrategyRef }) => selectionStrategyRef === "relevance/intent-themes@4",
      );
      expect(route?.templateRef).toBe(templateRef);

      const template = getPageMerchandisingTemplateConfig(templateRef);
      expect(template.modules.find(({ id }) => id === "hero")).toMatchObject({
        minimumProducts: 3,
        maximumProducts: 5,
      });
      expect(template.modules.find(({ id }) => id === "shortcuts")).toMatchObject({
        assetTaskMode: "assignment",
      });
      expect(template.modules.find(({ id }) => id === "start-here")).toMatchObject({
        required: false,
        minimumProducts: 8,
        maximumProducts: 96,
        sceneRange: [2, 6],
        productsPerSceneRange: [4, 16],
        requireSceneTargetProductCount: true,
        assetTaskMode: "scene",
      });
      expect(template.modules.find(({ id }) => id === "brand-spotlight")).toMatchObject({
        maximumProducts: brandMaximumProducts,
      });
      expect(template.modules.find(({ id }) => id === "reviews")).toMatchObject({
        required: false,
        maximumProducts: 0,
      });
    });
  });

  it("sizes current relevance scenes from four to sixteen by category evidence", () => {
    expect(evidenceSizedSceneProductRange([4, 16], 20, 2)).toEqual([4, 16]);
    expect(evidenceSizedSceneProductRange([4, 16], 20, 3)).toEqual([6, 16]);
    expect(evidenceSizedSceneProductRange([4, 16], 20, 8)).toEqual([16, 16]);
    expect(evidenceSizedSceneProductRange([4, 16], 6, 8)).toEqual([6, 6]);
  });

  it("makes relevance Start Here optional when no shopping scenes are available", () => {
    const selection = selectionFixture();
    selection.strategyRef = "relevance/default@1";
    selection.selectedCategories = [];
    selection.scenes = [];
    selection.modules = [];

    const run = advancePageMerchandisingRun({
      intent: themeIntentFixture(),
      selection,
      templateRef: "topic-landing/topic-relevance@2",
    });

    expect(run).toMatchObject({
      status: "needs-module-proposal",
      context: {
        templateRef: "topic-landing/topic-relevance@2",
        sourceScenes: [],
        moduleRules: expect.arrayContaining([
          expect.objectContaining({
            id: "start-here",
            required: false,
            minimumProducts: 8,
            maximumProducts: 96,
            sceneRange: [2, 6],
            productsPerSceneRange: [4, 16],
            requireSceneTargetProductCount: true,
          }),
          expect.objectContaining({ id: "explore-more", allowedRoles: ["core", "pairing", "accessory"] }),
        ]),
      },
    });
  });

  it("gives the merchandising Agent the catalog evidence needed to compose Hero products", () => {
    const selection = selectionFixture();
    selection.strategyRef = "relevance/default@1";
    selection.selectedCategories = [];
    selection.scenes = [];
    selection.modules = [];
    selection.products[0] = {
      ...selection.products[0]!,
      weeklySalesLabel: "900+ Sold",
      availability: "in-stock",
    };

    const run = advancePageMerchandisingRun({
      intent: themeIntentFixture(),
      selection,
      templateRef: "topic-landing/brand-relevance@1",
    });

    expect(run.status).toBe("needs-module-proposal");
    if (run.status !== "needs-module-proposal") throw new Error("Expected Agent context.");
    expect(run.context.products[0]).toMatchObject({
      id: "core-1",
      imageUrl: "https://example.com/core-1.webp",
      categoryL3Id: 1000,
      categoryL3Name: "core category",
      soldCount: 99,
      weeklySalesLabel: "900+ Sold",
      availability: "in-stock",
    });
  });

  it("compiles relevance Brand with reviewed Start Here scenes and without unsupported Reviews", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    selection.strategyRef = "relevance/default@1";
    selection.selectedCategories = [];
    const proposal = validProposal(selection, intent, "topic-landing/brand-relevance@1");

    const plan = compileTopicPagePlanV2(intent, selection, proposal);

    expect(plan.modules.filter(({ visible }) => visible).map(({ id }) => id)).toEqual([
      "hero",
      "shortcuts",
      "start-here",
      "popular-picks",
      "explore-more",
    ]);
    expect(plan.modules.find(({ id }) => id === "start-here")).toMatchObject({
      scenes: [
        expect.objectContaining({ sourceSceneId: "source-scene-1" }),
        expect.objectContaining({ sourceSceneId: "source-scene-2" }),
        expect.objectContaining({ sourceSceneId: "source-scene-3" }),
        expect.objectContaining({ sourceSceneId: "source-scene-4" }),
      ],
    });
    expect(plan.modules.find(({ id }) => id === "start-here")?.scenes.map(
      ({ productIds }) => productIds.length,
    )).toEqual([6, 6, 6, 6]);
    expect(plan.modules.find(({ id }) => id === "reviews")).toMatchObject({ visible: false });
  });

  it("compiles an accepted proposal into a stable, task-addressable PagePlan v2", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const proposal = validProposal(selection, intent, "topic-landing/topic@2");

    const first = compileTopicPagePlanV2(intent, selection, proposal);
    const second = compileTopicPagePlanV2(intent, selection, proposal);

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      schemaVersion: "topic-page-plan/v2",
      status: "plan-ready",
      keyword: "Matcha",
      templateRef: "topic-landing/topic@2",
      themeIntentDigest: themeIntentDigest(intent),
      productSelectionDigest: productSelectionDigest(selection),
      moduleOrder: MODULE_ORDER,
      productReusePolicy: {
        crossModule: "reference-modules-only",
        withinScene: "forbidden",
        referenceModules: ["hero", "shortcuts"],
      },
    });
    expect(first.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(first.modules.find(({ id }) => id === "hero")).toMatchObject({
      component: "ThemeHero",
      contentTaskId: "content-hero",
      assetTaskIds: ["asset-hero"],
      assignments: [
        { slotId: "hero-1", productId: "core-5", pool: "primary", role: "core" },
        { slotId: "hero-2", productId: "core-6", pool: "primary", role: "core" },
        { slotId: "hero-3", productId: "core-7", pool: "primary", role: "core" },
      ],
    });
    expect(first.modules.find(({ id }) => id === "start-here")).toMatchObject({
      component: "ThemeProductList",
      contentTaskId: "content-start-here",
      assetTaskIds: [
        "asset-start-here-page-scene-1",
        "asset-start-here-page-scene-2",
        "asset-start-here-page-scene-3",
        "asset-start-here-page-scene-4",
      ],
      scenes: expect.arrayContaining([
        expect.objectContaining({
          id: "page-scene-1",
          sourceSceneId: "source-scene-1",
          productIds: [
            "core-1",
            "pairing-1",
            "accessory-1",
            "core-5",
            "pairing-5",
            "accessory-5",
          ],
        }),
      ]),
    });
  });

  it("requires three to five Hero products and rejects duplicate source images", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    selection.products.find(({ id }) => id === "core-6")!.imageUrl =
      selection.products.find(({ id }) => id === "core-5")!.imageUrl;
    const proposal = validProposal(selection, intent, "topic-landing/topic@2");

    const duplicateImageRun = advancePageMerchandisingRun({ intent, selection, proposal });
    expect(duplicateImageRun).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Hero cannot assign more than one product with the same source image.",
      ]),
    });

    selection.products.find(({ id }) => id === "core-6")!.imageUrl =
      "https://example.com/core-6.webp";
    const tooSmallProposal = validProposal(selection, intent, "topic-landing/topic@2");
    tooSmallProposal.modules.find(({ id }) => id === "hero")!.assignments.pop();
    const tooSmallRun = advancePageMerchandisingRun({
      intent,
      selection,
      proposal: tooSmallProposal,
    });
    expect(tooSmallRun).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Module hero must assign 3-5 products when visible.",
      ]),
    });

    const missingReasonProposal = validProposal(selection, intent, "topic-landing/topic@2");
    delete missingReasonProposal.modules.find(({ id }) => id === "hero")!
      .assignments[0]!.selectionReason;
    const missingReasonRun = advancePageMerchandisingRun({
      intent,
      selection,
      proposal: missingReasonProposal,
    });
    expect(missingReasonRun).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Hero assignment core-5 requires selectionReason.",
      ]),
    });
  });

  it("binds every semantic shortcut group to one reviewed representative", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    selection.modules.push({
      id: "shortcuts",
      productIds: ["core-7", "core-8"],
      groups: [
        { id: "shortcut-core-7", label: "Daily matcha", role: "core", productIds: ["core-7"] },
        { id: "shortcut-core-8", label: "Ceremonial matcha", role: "core", productIds: ["core-8"] },
      ],
    });
    const proposal = validProposal(selection, intent, "topic-landing/topic@1");

    const ready = advancePageMerchandisingRun({ intent, selection, proposal });
    expect(ready.status).toBe("ready");
    if (ready.status === "ready") {
      expect(ready.plan.modules.find(({ id }) => id === "shortcuts")?.assignments)
        .toEqual([
          expect.objectContaining({
            groupId: "shortcut-core-7",
            productId: "core-7",
            selectionReason: "Highest-ranked representative for daily matcha.",
          }),
          expect.objectContaining({
            groupId: "shortcut-core-8",
            productId: "core-8",
            selectionReason: "Distinct representative for ceremonial matcha.",
          }),
        ]);
    }

    delete proposal.modules.find(({ id }) => id === "shortcuts")!
      .assignments[0]!.groupId;
    const missingGroup = advancePageMerchandisingRun({ intent, selection, proposal });
    expect(missingGroup).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Shortcut assignment core-7 requires groupId.",
        "Shortcut group shortcut-core-7 has no representative assignment.",
      ]),
    });
  });

  it("derives the Shortcuts assignment count from all frozen navigation groups", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const shortcutProducts = Array.from({ length: 7 }, (_, index) => ({
      id: `shortcut-${index + 1}`,
      title: `Shortcut product ${index + 1}`,
      brand: "Shortcut brand",
      price: "$10.00",
      imageUrl: `https://example.com/shortcut-${index + 1}.webp`,
      productUrl: `https://example.com/shortcut-${index + 1}`,
      sourceRank: 100 + index,
      categoryL3Id: 2000 + index,
      categoryL3Name: `Shortcut category ${index + 1}`,
      soldCount: 10 - index,
      pool: "primary" as const,
      role: "core" as const,
    }));
    selection.products.push(...shortcutProducts);
    selection.pools.primaryIds.push(...shortcutProducts.map(({ id }) => id));
    selection.modules.push({
      id: "shortcuts",
      productIds: shortcutProducts.map(({ id }) => id),
      groups: shortcutProducts.map((product, index) => ({
        id: `shortcut-group-${index + 1}`,
        label: `Shortcut group ${index + 1}`,
        role: "core",
        productIds: [product.id],
      })),
    });

    const pending = advancePageMerchandisingRun({
      intent,
      selection,
      templateRef: "topic-landing/topic@1",
    });
    expect(pending).toMatchObject({
      status: "needs-module-proposal",
      context: {
        moduleRules: expect.arrayContaining([
          expect.objectContaining({
            id: "shortcuts",
            minimumProducts: 7,
            maximumProducts: 7,
          }),
        ]),
      },
    });

    const proposal = validProposal(selection, intent, "topic-landing/topic@1");
    const shortcuts = proposal.modules.find(({ id }) => id === "shortcuts")!;
    shortcuts.reason = "Every frozen category group has one representative.";
    shortcuts.assignments = shortcutProducts.map((product, index) => ({
      groupId: `shortcut-group-${index + 1}`,
      productId: product.id,
      selectionReason: `Represents shortcut group ${index + 1}.`,
    }));

    const ready = advancePageMerchandisingRun({ intent, selection, proposal });
    expect(ready.status).toBe("ready");
    if (ready.status === "ready") {
      expect(ready.plan.modules.find(({ id }) => id === "shortcuts")?.assignments)
        .toHaveLength(7);
    }
  });

  it("declares one brand-banner task for each unique assigned brand", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    selection.modules.find(({ id }) => id === "brand-spotlight")!.productIds = [
      "core-5",
      "core-6",
      "pairing-11",
    ];
    const proposal = validProposal(selection, intent, "topic-landing/topic@2");
    const brand = proposal.modules.find(({ id }) => id === "brand-spotlight")!;
    brand.visible = true;
    brand.shoppingGoal = "Compare represented brands";
    brand.reason = "The assigned products represent two catalog-backed brands.";
    brand.assignments = [
      { productId: "core-5", reuseReason: "Also anchors the hero." },
      { productId: "core-6", reuseReason: "Also anchors the hero." },
      { productId: "pairing-11" },
    ];

    const plan = compileTopicPagePlanV2(intent, selection, proposal);

    expect(plan.modules.find(({ id }) => id === "brand-spotlight")?.assetTaskIds).toEqual([
      "asset-brand-spotlight-1",
      "asset-brand-spotlight-2",
    ]);
  });

  it("requires relevance proposals to preserve every frozen Brand Spotlight group", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    selection.strategyRef = "relevance/intent-themes@5";
    ["core-1", "core-2", "core-3"].forEach((id) => {
      const product = selection.products.find((candidate) => candidate.id === id)!;
      product.brand = "Brand Alpha";
      product.brandId = 101;
    });
    ["core-9", "core-10", "core-11"].forEach((id) => {
      const product = selection.products.find((candidate) => candidate.id === id)!;
      product.brand = "Brand Beta";
      product.brandId = 102;
    });
    const brandSelection = selection.modules.find(({ id }) => id === "brand-spotlight")!;
    brandSelection.productIds = [
      "core-1", "core-2", "core-3",
      "core-9", "core-10", "core-11",
    ];
    brandSelection.groups = [
      {
        id: "brand-101",
        label: "Brand Alpha",
        role: "core",
        productIds: ["core-1", "core-2", "core-3"],
      },
      {
        id: "brand-102",
        label: "Brand Beta",
        role: "core",
        productIds: ["core-9", "core-10", "core-11"],
      },
    ];
    const proposal = validProposal(selection, intent, "topic-landing/topic-relevance@2");
    const brand = proposal.modules.find(({ id }) => id === "brand-spotlight")!;
    brand.visible = true;
    brand.shoppingGoal = "Compare representative matcha brands";
    brand.reason = "Two frozen brands each contribute three products.";
    brand.assignments = brandSelection.groups.flatMap((group) =>
      group.productIds.map((productId) => ({
        productId,
        groupId: group.id,
        reuseReason: "Also appears in an evidence-backed Start Here scene.",
      }))
    );

    const ready = advancePageMerchandisingRun({ intent, selection, proposal });
    expect(ready.status).toBe("ready");

    const truncated = structuredClone(proposal);
    truncated.modules.find(({ id }) => id === "brand-spotlight")!.assignments.pop();
    const blocked = advancePageMerchandisingRun({ intent, selection, proposal: truncated });
    expect(blocked).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Module brand-spotlight must assign 6-6 products when visible.",
        "Module brand-spotlight must preserve ProductSelectionResult product order.",
      ]),
    });
  });

  it("rejects malformed frozen Brand Spotlight groups before asking the Agent", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const brand = selection.modules.find(({ id }) => id === "brand-spotlight")!;
    brand.productIds = ["core-1", "core-2", "core-3"];
    brand.groups = [{
      id: "brand-only",
      label: "Only Brand",
      role: "core",
      productIds: ["core-1", "core-2", "core-3"],
    }];

    const run = advancePageMerchandisingRun({
      intent,
      selection,
      templateRef: "topic-landing/topic@2",
    });
    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "ProductSelection Brand Spotlight must contain 2-6 brand groups.",
      ]),
    });
  });

  it("fails closed on unknown products, source-scene drift, and unexplained reuse", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const proposal = validProposal(selection, intent, "topic-landing/topic@2");
    proposal.themeIntentDigest = "sha256:stale-theme-intent";
    proposal.modules.find(({ id }) => id === "hero")!.assignments[0] = {
      productId: "missing-product",
    };
    proposal.modules.find(({ id }) => id === "start-here")!.assignments[2] = {
      productId: "accessory-9",
      sceneId: "page-scene-1",
    };
    proposal.modules.find(({ id }) => id === "popular-picks")!.assignments[0] = {
      productId: "core-6",
    };

    const run = advancePageMerchandisingRun({ intent, selection, proposal });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Proposal themeIntentDigest does not match ThemeIntent.",
        "Product missing-product is absent from ProductSelectionResult.",
        "Product accessory-9 is not part of source scene source-scene-1.",
        "Product core-6 is reused across modules without a reuseReason.",
      ]),
    });
  });

  it("enforces ordered, distinct relevance scenes with four to sixteen products each", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    selection.strategyRef = "relevance/intent-themes@4";
    const proposal = validProposal(selection, intent, "topic-landing/topic-relevance@2");
    const startHere = proposal.modules.find(({ id }) => id === "start-here")!;
    [startHere.scenes[0], startHere.scenes[1]] = [startHere.scenes[1]!, startHere.scenes[0]!];
    startHere.assignments = startHere.assignments.filter((assignment) =>
      assignment.sceneId !== "page-scene-1" ||
      ["core-1", "pairing-1", "accessory-1"].includes(assignment.productId)
    );

    const run = advancePageMerchandisingRun({ intent, selection, proposal });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Module start-here scenes must preserve ProductSelectionResult source-scene order.",
        "Module start-here scene page-scene-1 must assign 4-16 products.",
      ]),
    });
  });

  it("requires current relevance scenes to declare an evidence-sized product target", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    selection.strategyRef = "relevance/intent-themes@4";
    selection.modules.find(({ id }) => id === "start-here")!.groups = [{
      id: "source-scene-1",
      label: "Complex routine",
      role: "core",
      productIds: [
        "core-1", "pairing-1", "accessory-1",
        "core-5", "pairing-5", "accessory-5",
      ],
      sourceCategoryIds: ["1000", "1001", "1002"],
    }];
    const proposal = validProposal(selection, intent, "topic-landing/topic-relevance@2");
    proposal.modules.find(({ id }) => id === "start-here")!.scenes[0]!.targetProductCount = 4;

    const run = advancePageMerchandisingRun({ intent, selection, proposal });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Module start-here scene page-scene-1 targetProductCount must be 6-6 based on its source categories and available products.",
      ]),
    });
  });

  it("enforces frozen pool and role constraints", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const pairing = selection.products.find(({ id }) => id === "pairing-5")!;
    pairing.pool = "related";
    selection.pools.primaryIds = selection.pools.primaryIds.filter((id) => id !== pairing.id);
    selection.pools.relatedIds = [pairing.id];
    const proposal = validProposal(selection, intent, "topic-landing/topic@2");
    proposal.modules.find(({ id }) => id === "hero")!.assignments[0] = {
      productId: pairing.id,
    };

    const run = advancePageMerchandisingRun({ intent, selection, proposal });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Product pairing-5 cannot use the related pool in module hero.",
        "Product pairing-5 cannot fill the pairing role in module hero.",
      ]),
    });
  });

  it("preserves deterministic category-role module assignments", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const proposal = validProposal(selection, intent, "topic-landing/topic@2");
    proposal.modules.find(({ id }) => id === "popular-picks")!.assignments[0] = {
      productId: "core-8",
      reuseReason: "Also represents a shortcut.",
    };
    proposal.modules.find(({ id }) => id === "explore-more")!.assignments[0] = {
      productId: "pairing-9",
    };

    const run = advancePageMerchandisingRun({ intent, selection, proposal });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Product core-8 is not assigned to module popular-picks by ProductSelectionResult.",
        "Module popular-picks must preserve ProductSelectionResult product order.",
        "Product pairing-9 is not assigned to module explore-more by ProductSelectionResult.",
        "Module explore-more must preserve ProductSelectionResult product order.",
      ]),
    });
  });

  it("preserves frozen Popular Picks and Explore More assignments for current relevance templates", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    selection.strategyRef = "relevance/intent-themes@5";
    const proposal = validProposal(selection, intent, "topic-landing/topic-relevance@2");
    proposal.modules.find(({ id }) => id === "popular-picks")!.assignments.splice(1);
    proposal.modules.find(({ id }) => id === "explore-more")!.assignments.splice(1);

    const run = advancePageMerchandisingRun({ intent, selection, proposal });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Module popular-picks must assign 4-4 products when visible.",
        "Module popular-picks must preserve ProductSelectionResult product order.",
        "Module explore-more must assign 2-2 products when visible.",
        "Module explore-more must preserve ProductSelectionResult product order.",
      ]),
    });
  });

  it("keeps category-role @1 proposal-owned assignments replayable", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const proposal = validProposal(selection, intent, "topic-landing/topic@1");
    proposal.modules.find(({ id }) => id === "popular-picks")!.assignments[0] = {
      productId: "core-8",
      reuseReason: "Legacy proposal-owned module assignment.",
    };
    proposal.modules.find(({ id }) => id === "explore-more")!.assignments[0] = {
      productId: "pairing-9",
    };

    expect(advancePageMerchandisingRun({ intent, selection, proposal })).toMatchObject({
      status: "ready",
      plan: {
        templateRef: "topic-landing/topic@1",
        productReusePolicy: { crossModule: "requires-reason" },
      },
    });
  });

  it("does not let reuseReason authorize reuse across ProductSelection-owned modules", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    selection.modules.find(({ id }) => id === "popular-picks")!.productIds[0] = "core-1";
    const proposal = validProposal(selection, intent, "topic-landing/topic@2");
    proposal.modules.find(({ id }) => id === "popular-picks")!.assignments[0] = {
      productId: "core-1",
      reuseReason: "Also performs well in the source scene.",
    };

    const run = advancePageMerchandisingRun({ intent, selection, proposal });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Product core-1 cannot be reused across ProductSelection-owned modules start-here and popular-picks.",
      ]),
    });
  });

  it("preserves every validated source scene and its complete product order", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const incomplete = validProposal(selection, intent, "topic-landing/topic@2");
    const startHere = incomplete.modules.find(({ id }) => id === "start-here")!;
    startHere.assignments = startHere.assignments.filter(({ productId }) =>
      productId !== "pairing-1" && productId !== "accessory-1"
    );

    const incompleteRun = advancePageMerchandisingRun({
      intent,
      selection,
      proposal: incomplete,
    });

    expect(incompleteRun).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Module start-here must preserve ProductSelectionResult product order.",
        "Page scene page-scene-1 must preserve every product from source scene source-scene-1 in order.",
      ]),
    });

    const duplicated = validProposal(selection, intent, "topic-landing/topic@2");
    const duplicatedStartHere = duplicated.modules.find(({ id }) => id === "start-here")!;
    duplicatedStartHere.scenes[3]!.sourceSceneId = "source-scene-1";
    duplicatedStartHere.assignments.splice(18, 6,
      { productId: "core-1", sceneId: "page-scene-4" },
      { productId: "pairing-1", sceneId: "page-scene-4" },
      { productId: "accessory-1", sceneId: "page-scene-4" },
      { productId: "core-5", sceneId: "page-scene-4", reuseReason: "Also anchors the hero." },
      { productId: "pairing-5", sceneId: "page-scene-4" },
      { productId: "accessory-5", sceneId: "page-scene-4" },
    );

    const duplicatedRun = advancePageMerchandisingRun({
      intent,
      selection,
      proposal: duplicated,
    });

    expect(duplicatedRun).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Module start-here must preserve each ProductSelectionResult source scene exactly once and in order.",
        "Module start-here must preserve ProductSelectionResult product order.",
      ]),
    });
  });

  it("returns a bounded Agent task before a proposal is available", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const run = advancePageMerchandisingRun({
      intent,
      selection,
      templateRef: "topic-landing/topic@2",
    });

    expect(run).toMatchObject({
      schemaVersion: "page-merchandising-run/v1",
      status: "needs-module-proposal",
      context: {
        keyword: "Matcha",
        templateRef: "topic-landing/topic@2",
        assignmentAuthority: "product-selection",
        themeIntentDigest: themeIntentDigest(intent),
        productSelectionDigest: productSelectionDigest(selection),
        themeIntent: { shoppingGoal: "Build a complete matcha ritual" },
        selectedCategories: { length: 3 },
        selectionModules: { length: 4 },
        moduleRules: expect.arrayContaining([
          expect.objectContaining({ id: "hero", component: "ThemeHero", required: true }),
          expect.objectContaining({ id: "reviews", maximumProducts: 0 }),
        ]),
        sourceScenes: { length: 4 },
        products: { length: 36 },
      },
    });
  });

  it("blocks before Agent work when the frozen selection cannot satisfy the template", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    selection.scenes = [];

    const run = advancePageMerchandisingRun({
      intent,
      selection,
      templateRef: "topic-landing/topic@2",
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: [
        "Template topic-landing/topic@2 requires at least 4 validated source scenes for module start-here.",
      ],
    });
  });

  it("uses deterministic module capacity for category-role preflight", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    selection.modules.find(({ id }) => id === "popular-picks")!.productIds = [];

    const run = advancePageMerchandisingRun({
      intent,
      selection,
      templateRef: "topic-landing/topic@2",
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: [
        "Template topic-landing/topic@2 requires at least 4 products already assigned to module popular-picks by ProductSelectionResult.",
      ],
    });
  });

  it("lets an injected Strategy Agent create only the requested proposal", async () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const proposeModuleMerchandising = vi.fn<
      PageMerchandisingAgent["proposeModuleMerchandising"]
    >(async () => validProposal(selection, intent));

    const result = await runPageMerchandisingAgentWorkflow({
      intent,
      selection,
      templateRef: "topic-landing/topic@1",
      agent: { id: "fixture-strategy-agent", proposeModuleMerchandising },
    });

    expect(proposeModuleMerchandising).toHaveBeenCalledOnce();
    expect(result).toMatchObject({
      run: { status: "ready", plan: { schemaVersion: "topic-page-plan/v2" } },
      artifacts: {
        agentId: "fixture-strategy-agent",
        proposal: { schemaVersion: "module-merchandising-proposal/v1" },
      },
    });
  });

  it("gives the Agent one bounded revision with deterministic proposal issues", async () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const proposeModuleMerchandising = vi.fn<
      PageMerchandisingAgent["proposeModuleMerchandising"]
    >(async (run) => {
      if (run.context.previousProposalIssues) return validProposal(selection, intent);
      run.context.themeIntent.shoppingGoal = "tampered first attempt";
      return {};
    });

    const result = await runPageMerchandisingAgentWorkflow({
      intent,
      selection,
      templateRef: "topic-landing/topic@1",
      agent: { id: "revising-strategy-agent", proposeModuleMerchandising },
    });

    expect(proposeModuleMerchandising).toHaveBeenCalledTimes(2);
    expect(proposeModuleMerchandising.mock.calls[1]![0].context.previousProposalIssues)
      .toEqual(expect.arrayContaining([
        "Unknown PageMerchandising template: missing",
      ]));
    expect(proposeModuleMerchandising.mock.calls[1]![0].context.themeIntent.shoppingGoal)
      .toBe(intent.shoppingGoal);
    expect(result).toMatchObject({
      run: { status: "ready" },
      artifacts: {
        agentId: "revising-strategy-agent",
        attemptCount: 2,
        proposal: { schemaVersion: "module-merchandising-proposal/v1" },
      },
    });
  });

  it("isolates frozen inputs from mutations inside an injected Agent", async () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const originalIntentDigest = themeIntentDigest(intent);
    const originalSelectionDigest = productSelectionDigest(selection);
    const agent: PageMerchandisingAgent = {
      id: "mutating-fixture-agent",
      proposeModuleMerchandising: async (run) => {
        run.context.themeIntent.shoppingGoal = "tampered";
        run.context.selectedCategories[0]!.label = "tampered";
        run.context.selectionModules[0]!.productIds[0] = "tampered";
        run.context.sourceScenes[0]!.productGroups[0]!.core = "tampered";
        return validProposal(selection, intent);
      },
    };

    const result = await runPageMerchandisingAgentWorkflow({
      intent,
      selection,
      templateRef: "topic-landing/topic@1",
      agent,
    });

    expect(result.run.status).toBe("ready");
    expect(themeIntentDigest(intent)).toBe(originalIntentDigest);
    expect(productSelectionDigest(selection)).toBe(originalSelectionDigest);
  });
});
