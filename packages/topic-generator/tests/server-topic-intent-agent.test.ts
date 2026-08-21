import { describe, expect, it, vi } from "vitest";

import {
  handleTopicGeneratorPost,
  type CatalogSnapshotAdapter,
  type HttpTopicPageAgent,
  type TopicIntentAgent,
} from "../src/index.js";

function catalogFixture(productsPerCategory = 4) {
  const categories = [
    { id: "101", label: "Cleansers", path: ["Beauty", "Cleansers"] },
    { id: "102", label: "Toners", path: ["Beauty", "Toners"] },
    { id: "103", label: "Serums", path: ["Beauty", "Serums"] },
  ];
  const products = categories.flatMap((category, categoryIndex) =>
    Array.from({ length: productsPerCategory }, (_, productIndex) => ({
      id: `${category.id}-${productIndex + 1}`,
      title: `ANUA ${category.label} ${productIndex + 1}`,
      brand: "ANUA",
      price: "$19.99",
      imageUrl: `https://example.com/${category.id}-${productIndex + 1}.webp`,
      productUrl: `https://example.com/${category.id}-${productIndex + 1}`,
      sourceRank: categoryIndex * productsPerCategory + productIndex + 1,
      categoryL3Id: Number(category.id),
      categoryL3Name: category.label,
    })),
  );
  const adapter: CatalogSnapshotAdapter = {
    id: "fixture-topic-intent-catalog",
    load: async () => ({
      keyword: "ANUA",
      site: "us",
      sourceUrl: "https://example.com/search?q=ANUA",
      fetchedAt: "2026-08-20T00:00:00.000Z",
      provider: "yami-catalog-search",
      products,
      evidence: {
        brands: [{ id: "anua", label: "ANUA", aliases: ["ANUA"], resultCount: products.length }],
        categories: categories.map((category) => ({
          ...category,
          aliases: [],
          resultCount: productsPerCategory,
          productCount: productsPerCategory,
        })),
        attributes: [],
      },
    }),
  };
  return { adapter };
}

function semanticProposal() {
  return {
    schemaVersion: "semantic-proposal/v2",
    themeType: "brand",
    entityType: "brand",
    canonicalEntity: { id: "anua", label: "ANUA" },
    shoppingIntent: "browse-brand",
    needs: [],
    mustInclude: ["ANUA"],
    mustExclude: [],
    searchTerms: ["ANUA"],
    categoryHypotheses: [
      {
        label: "基础清洁",
        role: "core",
        categoryIds: ["101"],
        reason: "Cleansers are verified in the current catalog snapshot.",
      },
      {
        label: "补水爽肤",
        role: "pairing",
        categoryIds: ["102"],
        reason: "Toners are a verified navigation category in the current catalog snapshot.",
      },
      {
        label: "精华护理",
        role: "pairing",
        categoryIds: ["103"],
        reason: "Serums are a verified navigation category in the current catalog snapshot.",
      },
    ],
    scenarioHypotheses: [
      {
        name: "日常基础护理",
        shoppingGoal: "Complete a cleanser and toner routine.",
        categoryIds: ["101", "102"],
        reason: "The scene uses two verified catalog categories.",
      },
      {
        name: "集中补水护理",
        shoppingGoal: "Combine toner and serum products.",
        categoryIds: ["102", "103"],
        reason: "The scene uses two verified catalog categories.",
      },
    ],
  };
}

describe("Topic Generator automatic TopicIntent Agent integration", () => {
  it("returns an Agent-reviewed Hero when selection mode has a Topic Page Agent", async () => {
    const { adapter } = catalogFixture();
    const proposeSemanticIntent = vi.fn<TopicIntentAgent["proposeSemanticIntent"]>(
      async () => semanticProposal(),
    );
    const proposeBackgroundEvidence = vi.fn<HttpTopicPageAgent["proposeBackgroundEvidence"]>(
      async (run) => ({
        schemaVersion: "topic-background-evidence-proposal/v1",
        keyword: run.context.keyword,
        site: run.context.site,
        language: run.context.language,
        themeIntentDigest: run.context.themeIntentDigest,
        sources: [{
          id: "source:anua-official",
          type: "official-brand",
          title: "About ANUA",
          url: "https://brand.example/about",
          publisher: "ANUA",
        }],
        claims: [{
          id: "claim:anua-identity",
          type: "identity",
          text: "A source-backed brand identity statement for a first-time shopper.",
          sourceIds: ["source:anua-official"],
          usage: "context-only",
        }],
      }),
    );
    const proposeExecutionPlan = vi.fn<HttpTopicPageAgent["proposeExecutionPlan"]>(
      async (run) => ({
        schemaVersion: "landing-page-execution-plan-proposal/v1",
        keyword: run.context.keyword,
        site: run.context.site,
        language: run.context.language,
        themeIntentDigest: run.context.themeIntentDigest,
        requestedPageTypeRef: run.context.requestedPageTypeRef,
        requestedSelectionStrategyRef: run.context.requestedSelectionStrategyRef,
        pageTypeRef: "landing-page/brand@2",
        selectionStrategyRef: "relevance/intent-themes@5",
        templateRef: "topic-landing/brand-relevance@2",
        reason: "Use the registered relevance route for the resolved brand intent.",
      }),
    );
    const proposeModuleMerchandising = vi.fn<HttpTopicPageAgent["proposeModuleMerchandising"]>(
      async (run) => {
        return ({
        schemaVersion: "module-merchandising-proposal/v1",
        keyword: run.context.keyword,
        site: run.context.site,
        strategyRef: run.context.strategyRef,
        templateRef: run.context.templateRef,
        themeIntentDigest: run.context.themeIntentDigest,
        productSelectionDigest: run.context.productSelectionDigest,
        moduleOrder: [...run.context.moduleOrder],
        modules: [
          {
            id: "hero",
            visible: true,
            shoppingGoal: "Introduce a representative ANUA routine",
            reason: "Three distinct catalog types create a representative ANUA Hero.",
            scenes: [],
            assignments: [
              { productId: "101-1", selectionReason: "Strong catalog anchor." },
              { productId: "102-1", selectionReason: "Adds toner coverage." },
              { productId: "103-1", selectionReason: "Adds serum coverage." },
            ],
          },
          {
            id: "shortcuts",
            visible: true,
            shoppingGoal: "Open verified category entry points",
            reason: "Each accepted semantic group has one representative product.",
            scenes: [],
            assignments: [
              {
                groupId: "category-hypothesis-1",
                productId: "101-2",
                selectionReason: "Represents the verified cleanser group.",
              },
              {
                groupId: "category-hypothesis-2",
                productId: "102-3",
                selectionReason: "Represents the verified toner group.",
              },
              {
                groupId: "category-hypothesis-3",
                productId: "103-3",
                selectionReason: "Represents the verified serum group.",
              },
            ],
          },
          {
            id: "start-here",
            visible: true,
            shoppingGoal: "Help shoppers complete reviewed ANUA routines",
            reason: "Two catalog-backed source scenes support distinct shopping goals.",
            scenes: run.context.sourceScenes.map((scene, index) => ({
              id: `reviewed-scene-${index + 1}`,
              sourceSceneId: scene.id,
              targetProductCount: scene.productGroups.flatMap(
                ({ core, pairing, accessory }) => [core, pairing, accessory].filter(Boolean),
              ).length,
              shoppingGoal: scene.title,
              reason: scene.description,
            })),
            assignments: run.context.sourceScenes.flatMap((scene, index) =>
              scene.productGroups.flatMap(({ core, pairing, accessory }) =>
                [core, pairing, accessory]
                  .filter((productId): productId is string => Boolean(productId))
                  .map((productId) => ({
                    productId,
                    sceneId: `reviewed-scene-${index + 1}`,
                    reuseReason: "Start Here uses this frozen product in a reviewed scene.",
                  }))
              )
            ),
          },
          {
            id: "popular-picks",
            visible: true,
            shoppingGoal: "Show the complete frozen popular assortment",
            reason: "ProductSelection owns the complete Popular Picks assortment.",
            scenes: [],
            assignments: [],
          },
          {
            id: "brand-spotlight",
            visible: false,
            shoppingGoal: "",
            reason: "The compact selection does not need another brand rail.",
            scenes: [],
            assignments: [],
          },
          {
            id: "reviews",
            visible: false,
            shoppingGoal: "",
            reason: "No verified review evidence is available.",
            scenes: [],
            assignments: [],
          },
          {
            id: "explore-more",
            visible: true,
            shoppingGoal: "Browse the complete frozen catalog assortment",
            reason: "ProductSelection owns the complete Explore More assortment.",
            scenes: [],
            assignments: [],
          },
        ],
        });
      },
    );
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({
          keyword: "ANUA",
          mode: "selection",
          strategy: "relevance",
          language: "zh",
        }),
      }),
      {
        adapters: [adapter],
        topicIntentAgent: {
          id: "topic-intent-agent",
          proposeSemanticIntent,
        },
        topicPageAgent: {
          id: "topic-page-agent",
          proposeBackgroundEvidence,
          proposeExecutionPlan,
          proposeModuleMerchandising,
        } as unknown as HttpTopicPageAgent,
        requireAutomaticHeroReview: true,
      },
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(proposeSemanticIntent).toHaveBeenCalledOnce();
    expect(proposeBackgroundEvidence).toHaveBeenCalledOnce();
    expect(proposeExecutionPlan).toHaveBeenCalledOnce();
    expect(proposeModuleMerchandising).toHaveBeenCalledOnce();
    expect(proposeSemanticIntent.mock.invocationCallOrder[0]).toBeLessThan(
      proposeBackgroundEvidence.mock.invocationCallOrder[0]!,
    );
    expect(proposeBackgroundEvidence.mock.invocationCallOrder[0]).toBeLessThan(
      proposeExecutionPlan.mock.invocationCallOrder[0]!,
    );
    expect(proposeModuleMerchandising).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({
        language: "zh",
        moduleRules: expect.arrayContaining([
          expect.objectContaining({ id: "popular-picks", minimumProducts: 12, maximumProducts: 12 }),
          expect.objectContaining({ id: "explore-more", minimumProducts: 12, maximumProducts: 12 }),
        ]),
      }),
    }));
    expect(payload.automation).toBeUndefined();
    expect(payload.pagePreview).toEqual({ pageTypeRef: "landing-page/brand@2" });
    expect(payload.capabilityArtifacts).toMatchObject({
      pageTypeRef: "landing-page/brand@2",
      intent: { canonicalEntity: { label: "ANUA" } },
      selection: { keyword: "ANUA", strategyRef: "relevance/intent-themes@5" },
      plan: { schemaVersion: "topic-page-plan/v2", status: "plan-ready" },
      backgroundEvidence: {
        status: "ready",
        claims: [{ id: "claim:anua-identity", usage: "context-only" }],
      },
    });
    expect(payload.heroSelection).toMatchObject({
      schemaVersion: "hero-selection-run/v1",
      status: "ready",
      source: "page-merchandising-agent",
      agentId: "topic-page-agent",
      templateRef: "topic-landing/brand-relevance@2",
      productIds: ["101-1", "102-1", "103-1"],
      moduleReason: "Three distinct catalog types create a representative ANUA Hero.",
      productReasons: {
        "101-1": "Strong catalog anchor.",
        "102-1": "Adds toner coverage.",
        "103-1": "Adds serum coverage.",
      },
    });
    expect(payload.shortcutSelection).toMatchObject({
      schemaVersion: "shortcut-selection-run/v1",
      status: "ready",
      source: "page-merchandising-agent",
      agentId: "topic-page-agent",
      assignments: [
        {
          groupId: "category-hypothesis-1",
          productId: "101-2",
          selectionReason: "Represents the verified cleanser group.",
        },
        {
          groupId: "category-hypothesis-2",
          productId: "102-3",
          selectionReason: "Represents the verified toner group.",
        },
        {
          groupId: "category-hypothesis-3",
          productId: "103-3",
          selectionReason: "Represents the verified serum group.",
        },
      ],
      moduleReason: "Each accepted semantic group has one representative product.",
    });
    expect(payload.startHereSelection).toMatchObject({
      schemaVersion: "start-here-selection-run/v1",
      status: "ready",
      source: "page-merchandising-agent",
      agentId: "topic-page-agent",
      visible: true,
      scenes: [
        expect.objectContaining({
          id: "reviewed-scene-1",
          sourceSceneId: "scenario-hypothesis-1",
          label: "日常基础护理",
          shoppingGoal: "Complete a cleanser and toner routine.",
        }),
        expect.objectContaining({
          id: "reviewed-scene-2",
          sourceSceneId: "scenario-hypothesis-2",
          label: "集中补水护理",
          shoppingGoal: "Combine toner and serum products.",
        }),
      ],
      moduleReason: "Two catalog-backed source scenes support distinct shopping goals.",
    });
    expect(payload.startHereSelection.scenes.map(
      (scene: { productIds: string[] }) => scene.productIds.length,
    )).toEqual([8, 4]);
    expect(payload.plans.zh.relevance.modules.find(
      (module: { id: string }) => module.id === "hero",
    )).toMatchObject({
      productIds: ["101-1", "102-1", "103-1"],
      reason: "Three distinct catalog types create a representative ANUA Hero.",
    });
    expect(payload.plans.zh.relevance.modules.find(
      (module: { id: string }) => module.id === "shortcuts",
    )).toMatchObject({
      productIds: ["101-2", "102-3", "103-3"],
      reason: "Each accepted semantic group has one representative product.",
    });
    expect(payload.plans.zh.relevance.modules.find(
      (module: { id: string }) => module.id === "start-here",
    )).toMatchObject({
      reason: "Two catalog-backed source scenes support distinct shopping goals.",
      groups: [
        expect.objectContaining({
          id: "reviewed-scene-1",
          label: "日常基础护理",
          shoppingGoal: "Complete a cleanser and toner routine.",
          semanticSource: "agent-reviewed",
        }),
        expect.objectContaining({
          id: "reviewed-scene-2",
          label: "集中补水护理",
          shoppingGoal: "Combine toner and serum products.",
          semanticSource: "agent-reviewed",
        }),
      ],
    });
    expect(payload.plans.zh.relevance.modules.find(
      (module: { id: string }) => module.id === "start-here",
    ).productIds).toHaveLength(12);
    expect(payload.plans.zh.relevance.modules.map(
      (module: { id: string; visible: boolean; productIds: string[] }) => ({
        id: module.id,
        visible: module.visible,
        productIds: module.productIds,
      }),
    )).toEqual([
      { id: "hero", visible: true, productIds: ["101-1", "102-1", "103-1"] },
      { id: "shortcuts", visible: true, productIds: ["101-2", "102-3", "103-3"] },
      {
        id: "start-here",
        visible: true,
        productIds: payload.startHereSelection.scenes.flatMap(
          (scene: { productIds: string[] }) => scene.productIds,
        ),
      },
      {
        id: "popular-picks",
        visible: true,
        productIds: [
          "101-1", "101-2", "101-3", "101-4",
          "102-1", "102-2", "102-3", "102-4",
          "103-1", "103-2", "103-3", "103-4",
        ],
      },
      { id: "brand-spotlight", visible: false, productIds: [] },
      { id: "reviews", visible: false, productIds: [] },
      {
        id: "explore-more",
        visible: true,
        productIds: [
          "101-1", "101-2", "101-3", "101-4",
          "102-1", "102-2", "102-3", "102-4",
          "103-1", "103-2", "103-3", "103-4",
        ],
      },
    ]);
    for (const moduleId of ["popular-picks", "explore-more"]) {
      const module = payload.plans.zh.relevance.modules.find(
        (candidate: { id: string }) => candidate.id === moduleId,
      );
      expect([
        ...new Set(module.groups.flatMap((group: { productIds: string[] }) => group.productIds)),
      ]).toEqual(module.productIds);
    }
  });

  it("labels the deterministic Hero as fallback when its Agent is unavailable", async () => {
    const { adapter } = catalogFixture();
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "ANUA", mode: "selection", strategy: "relevance" }),
      }),
      {
        adapters: [adapter],
        requireAutomaticHeroReview: true,
      },
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(payload.heroSelection).toMatchObject({
      schemaVersion: "hero-selection-run/v1",
      status: "fallback",
      source: "deterministic-rules",
      issues: ["Automatic module selection requires a Topic Page Agent."],
    });
    expect(payload.shortcutSelection).toMatchObject({
      schemaVersion: "shortcut-selection-run/v1",
      status: "fallback",
      source: "deterministic-rules",
      issues: ["Automatic module selection requires a Topic Page Agent."],
    });
    expect(payload.startHereSelection).toMatchObject({
      schemaVersion: "start-here-selection-run/v1",
      status: "fallback",
      source: "deterministic-rules",
      visible: true,
      issues: ["Automatic module selection requires a Topic Page Agent."],
    });
  });

  it("returns capability artifacts when module review uses the deterministic fallback", async () => {
    const { adapter } = catalogFixture();
    const proposeModuleMerchandising = vi.fn(async () => ({
      schemaVersion: "invalid-module-proposal/v1",
    }));
    const proposeExecutionPlan = vi.fn<HttpTopicPageAgent["proposeExecutionPlan"]>(
      async (run) => ({
        schemaVersion: "landing-page-execution-plan-proposal/v1",
        keyword: run.context.keyword,
        site: run.context.site,
        language: run.context.language,
        themeIntentDigest: run.context.themeIntentDigest,
        requestedPageTypeRef: run.context.requestedPageTypeRef,
        requestedSelectionStrategyRef: run.context.requestedSelectionStrategyRef,
        pageTypeRef: "landing-page/brand@2",
        selectionStrategyRef: "relevance/intent-themes@5",
        templateRef: "topic-landing/brand-relevance@2",
        reason: "Use the registered relevance route for the resolved brand intent.",
      }),
    );
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({
          keyword: "ANUA",
          mode: "selection",
          strategy: "relevance",
          language: "zh",
        }),
      }),
      {
        adapters: [adapter],
        topicIntentAgent: {
          id: "topic-intent-agent",
          proposeSemanticIntent: async () => semanticProposal(),
        },
        topicPageAgent: {
          id: "topic-page-agent",
          proposeExecutionPlan,
          proposeModuleMerchandising,
        } as unknown as HttpTopicPageAgent,
        requireAutomaticHeroReview: true,
      },
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(proposeModuleMerchandising).toHaveBeenCalledTimes(2);
    expect(payload.heroSelection).toMatchObject({
      status: "fallback",
      source: "deterministic-rules",
    });
    expect(payload.capabilityArtifacts).toMatchObject({
      pageTypeRef: "landing-page/brand@2",
      selection: { keyword: "ANUA" },
      plan: {
        schemaVersion: "topic-page-plan/v2",
        status: "plan-ready",
        templateRef: "topic-landing/brand-relevance@2",
      },
    });
  });

  it("uses a reviewed semantic proposal for relevance module grouping", async () => {
    const { adapter } = catalogFixture(10);
    const proposeSemanticIntent = vi.fn<TopicIntentAgent["proposeSemanticIntent"]>(
      async () => semanticProposal(),
    );
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({
          keyword: "ANUA",
          mode: "selection",
          strategy: "relevance",
          language: "zh",
        }),
      }),
      {
        adapters: [adapter],
        topicIntentAgent: { id: "topic-intent-agent", proposeSemanticIntent },
      },
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(proposeSemanticIntent).toHaveBeenCalledWith(expect.objectContaining({
      schemaVersion: "topic-intent-agent-run/v1",
      status: "needs-semantic-proposal",
      context: expect.objectContaining({
        keyword: "ANUA",
        language: "zh",
        categories: expect.arrayContaining([
          expect.objectContaining({ id: "101", label: "Cleansers", productCount: 10 }),
        ]),
      }),
    }));
    expect(proposeSemanticIntent.mock.calls[0]?.[0].context.representativeProducts)
      .toHaveLength(30);
    expect(payload.runtime.topicIntent).toMatchObject({
      mode: "automatic",
      status: "ready",
      agent: { status: "ready", id: "topic-intent-agent" },
      proposalReview: { status: "accepted" },
      categoryHypothesisCount: 3,
      scenarioHypothesisCount: 2,
      issues: [],
    });
    const shortcutModule = payload.plans.zh.relevance.modules.find(
      (module: { id: string }) => module.id === "shortcuts",
    );
    const startHereModule = payload.plans.zh.relevance.modules.find(
      (module: { id: string }) => module.id === "start-here",
    );
    expect(shortcutModule.groups.map(({ label }: { label: string }) => label)).toEqual([
      "基础清洁",
      "补水爽肤",
      "精华护理",
    ]);
    expect(startHereModule.groups.map(({ label }: { label: string }) => label)).toEqual([
      "日常基础护理",
      "集中补水护理",
    ]);
  });

  it("falls back to verified catalog groups when the Agent proposal is invalid", async () => {
    const { adapter } = catalogFixture();
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "ANUA", mode: "selection", strategy: "relevance" }),
      }),
      {
        adapters: [adapter],
        topicIntentAgent: {
          id: "topic-intent-agent",
          proposeSemanticIntent: async () => ({ schemaVersion: "invented-proposal/v9" }),
        },
      },
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(payload.selectionRuns.relevance.status).toBe("ready");
    expect(payload.runtime.topicIntent).toMatchObject({
      mode: "catalog-fallback",
      status: "fallback",
      agent: { status: "ready", id: "topic-intent-agent" },
    });
    expect(payload.runtime.topicIntent.issues[0]).toContain("schemaVersion");
    const shortcutModule = payload.plans.zh.relevance.modules.find(
      (module: { id: string }) => module.id === "shortcuts",
    );
    expect(shortcutModule.groups.map(({ label }: { label: string }) => label)).toEqual([
      "洁面",
      "爽肤水",
      "Serums",
    ]);
  });

  it("keeps rejected Agent fields visible while falling back to catalog groups", async () => {
    const { adapter } = catalogFixture();
    const proposal = semanticProposal();
    proposal.categoryHypotheses = [{
      ...proposal.categoryHypotheses[0],
      categoryIds: ["999"],
    }];
    proposal.scenarioHypotheses = [{
      ...proposal.scenarioHypotheses[0],
      categoryIds: ["998", "999"],
    }];
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "ANUA", mode: "selection", strategy: "relevance" }),
      }),
      {
        adapters: [adapter],
        topicIntentAgent: {
          id: "topic-intent-agent",
          proposeSemanticIntent: async () => proposal,
        },
      },
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(payload.runtime.topicIntent).toMatchObject({
      mode: "catalog-fallback",
      status: "fallback",
      proposalReview: {
        status: "partially-accepted",
        rejectedFields: ["categoryHypotheses[0]", "scenarioHypotheses[0]"],
      },
    });
    expect(payload.runtime.topicIntent.issues).toEqual([
      "TopicIntent Agent proposal produced no accepted category or scenario hypotheses.",
    ]);
  });
});
