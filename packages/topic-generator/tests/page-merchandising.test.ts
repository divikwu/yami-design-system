import { describe, expect, it, vi } from "vitest";

import {
  advancePageMerchandisingRun,
  compileTopicPagePlanV2,
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
    ...productsFor("pairing", 8),
    ...productsFor("accessory", 8),
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
        productGroups: [{
          core: `core-${number}`,
          pairing: `pairing-${number}`,
          accessory: `accessory-${number}`,
        }],
      };
    }),
    modules: [
      {
        id: "start-here",
        productIds: ["core-1", "pairing-1", "accessory-1"],
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
        productIds: ["accessory-5", "accessory-6"],
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
): ModuleMerchandisingProposal {
  return {
    schemaVersion: "module-merchandising-proposal/v1",
    keyword: selection.keyword,
    site: selection.site,
    strategyRef: selection.strategyRef,
    templateRef: "topic-landing/topic@1",
    themeIntentDigest: themeIntentDigest(intent),
    productSelectionDigest: productSelectionDigest(selection),
    moduleOrder: [...MODULE_ORDER],
    modules: [
      {
        id: "hero",
        visible: true,
        shoppingGoal: "Introduce the strongest matcha proposition",
        reason: "Two unused core products represent the topic.",
        scenes: [],
        assignments: [{ productId: "core-5" }, { productId: "core-6" }],
      },
      {
        id: "shortcuts",
        visible: true,
        shoppingGoal: "Offer stable category entry points",
        reason: "Two core categories have representative products.",
        scenes: [],
        assignments: [{ productId: "core-7" }, { productId: "core-8" }],
      },
      {
        id: "start-here",
        visible: true,
        shoppingGoal: "Help shoppers assemble complete matcha occasions",
        reason: "Four validated source scenes cover distinct shopper tasks.",
        scenes: Array.from({ length: 4 }, (_, index) => ({
          id: `page-scene-${index + 1}`,
          sourceSceneId: `source-scene-${index + 1}`,
          shoppingGoal: `Complete matcha task ${index + 1}`,
          reason: `Source scene ${index + 1} is supported by selected products.`,
        })),
        assignments: Array.from({ length: 4 }, (_, index) => {
          const number = index + 1;
          const sceneId = `page-scene-${number}`;
          return [
            { productId: `core-${number}`, sceneId },
            { productId: `pairing-${number}`, sceneId },
            { productId: `accessory-${number}`, sceneId },
          ];
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
        assignments: [{ productId: "accessory-5" }, { productId: "accessory-6" }],
      },
    ],
  };
}

describe("PageMerchandising", () => {
  it("maps the maintained Brand, Topic, and Campaign page variants", () => {
    expect(listPageMerchandisingTemplateConfigs().map(({ ref }) => ref)).toEqual([
      "topic-landing/brand@1",
      "topic-landing/topic@1",
      "topic-landing/campaign@1",
      "topic-landing/relevance@1",
    ]);
  });

  it("offers a relevance template that does not invent missing shopping scenes", () => {
    const selection = selectionFixture();
    selection.strategyRef = "relevance/default@1";
    selection.selectedCategories = [];
    selection.scenes = [];
    selection.modules = [];

    const run = advancePageMerchandisingRun({
      intent: themeIntentFixture(),
      selection,
      templateRef: "topic-landing/relevance@1",
    });

    expect(run).toMatchObject({
      status: "needs-module-proposal",
      context: {
        templateRef: "topic-landing/relevance@1",
        sourceScenes: [],
        moduleRules: expect.arrayContaining([
          expect.objectContaining({ id: "start-here", required: false, maximumProducts: 0 }),
          expect.objectContaining({ id: "explore-more", allowedRoles: ["core", "pairing", "accessory"] }),
        ]),
      },
    });
  });

  it("compiles an accepted proposal into a stable, task-addressable PagePlan v2", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const proposal = validProposal(selection, intent);

    const first = compileTopicPagePlanV2(intent, selection, proposal);
    const second = compileTopicPagePlanV2(intent, selection, proposal);

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      schemaVersion: "topic-page-plan/v2",
      status: "plan-ready",
      keyword: "Matcha",
      templateRef: "topic-landing/topic@1",
      themeIntentDigest: themeIntentDigest(intent),
      productSelectionDigest: productSelectionDigest(selection),
      moduleOrder: MODULE_ORDER,
      productReusePolicy: {
        crossModule: "requires-reason",
        withinScene: "forbidden",
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
          productIds: ["core-1", "pairing-1", "accessory-1"],
        }),
      ]),
    });
  });

  it("declares one brand-banner task for each unique assigned brand", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const proposal = validProposal(selection, intent);
    const brand = proposal.modules.find(({ id }) => id === "brand-spotlight")!;
    brand.visible = true;
    brand.shoppingGoal = "Compare represented brands";
    brand.reason = "The assigned products represent two catalog-backed brands.";
    brand.assignments = [
      { productId: "core-5", reuseReason: "Also anchors the hero." },
      { productId: "core-6", reuseReason: "Also anchors the hero." },
      { productId: "pairing-5" },
    ];

    const plan = compileTopicPagePlanV2(intent, selection, proposal);

    expect(plan.modules.find(({ id }) => id === "brand-spotlight")?.assetTaskIds).toEqual([
      "asset-brand-spotlight-1",
      "asset-brand-spotlight-2",
    ]);
  });

  it("fails closed on unknown products, source-scene drift, and unexplained reuse", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const proposal = validProposal(selection, intent);
    proposal.themeIntentDigest = "sha256:stale-theme-intent";
    proposal.modules.find(({ id }) => id === "hero")!.assignments[0] = {
      productId: "missing-product",
    };
    proposal.modules.find(({ id }) => id === "start-here")!.assignments[2] = {
      productId: "accessory-5",
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
        "Product accessory-5 is not part of source scene source-scene-1.",
        "Product core-6 is reused across modules without a reuseReason.",
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
    const proposal = validProposal(selection, intent);
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

  it("returns a bounded Agent task before a proposal is available", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const run = advancePageMerchandisingRun({
      intent,
      selection,
      templateRef: "topic-landing/topic@1",
    });

    expect(run).toMatchObject({
      schemaVersion: "page-merchandising-run/v1",
      status: "needs-module-proposal",
      context: {
        keyword: "Matcha",
        templateRef: "topic-landing/topic@1",
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
        products: { length: 28 },
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
      templateRef: "topic-landing/topic@1",
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: [
        "Template topic-landing/topic@1 requires at least 4 validated source scenes for module start-here.",
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
