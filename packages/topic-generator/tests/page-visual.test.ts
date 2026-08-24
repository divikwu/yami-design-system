import { describe, expect, it, vi } from "vitest";

import {
  advanceTopicPageVisualRun,
  compileTopicPageAssetManifest,
  productSelectionDigest,
  runTopicVisualAgentWorkflow,
  sha256Digest,
  themeIntentDigest,
  topicBackgroundEvidenceDigest,
  topicPageContentSpecDigest,
  topicPagePlanDigest,
  type ProductSelectionResult,
  type ThemeIntent,
  type TopicBackgroundEvidenceBundle,
  type TopicPageContentSpec,
  type TopicPagePlanV2,
  type TopicPageVisualProposal,
  type TopicVisualAgent,
} from "../src/index.js";

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

function selectionFixture(): ProductSelectionResult {
  const products = [
    ["core-1", "Ceremonial Matcha", "Matcha House", "core", 1000],
    ["core-2", "Daily Matcha", "Tea Lab", "core", 1000],
    ["pairing-1", "Rice Crackers", "Snack House", "pairing", 1001],
    ["accessory-1", "Bamboo Whisk", "Tea Tools", "accessory", 1002],
  ] as const;
  return {
    schemaVersion: "product-selection-result/v1",
    strategyRef: "category-role/landing-page-agent@1",
    keyword: "Matcha",
    site: "us",
    selectedAt: "2026-08-18T00:00:00.000Z",
    pools: { primaryIds: products.map(([id]) => id), relatedIds: [] },
    products: products.map(([id, title, brand, role, categoryL3Id], index) => ({
      id,
      title,
      brand,
      price: "$1.00",
      imageUrl: `https://example.com/${id}.webp`,
      productUrl: `https://example.com/${id}`,
      sourceRank: index + 1,
      categoryL3Id,
      categoryL3Name: `${role} category`,
      pool: "primary",
      role,
    })),
    selectedCategories: [
      { id: "1000", label: "Matcha", path: ["Tea", "Matcha"], role: "core", reason: "Core evidence" },
      { id: "1001", label: "Pairings", path: ["Snacks"], role: "pairing", reason: "Pairing evidence" },
      { id: "1002", label: "Tea tools", path: ["Tea tools"], role: "accessory", reason: "Accessory evidence" },
    ],
    scenes: [{
      id: "source-scene-1",
      name: "Daily ritual",
      title: "Legacy title",
      description: "Legacy description",
      productGroups: [{ core: "core-1", pairing: "pairing-1", accessory: "accessory-1" }],
    }],
    modules: [
      { id: "start-here", productIds: ["core-1", "pairing-1", "accessory-1"], groups: [] },
      { id: "popular-picks", productIds: ["core-2"], groups: [] },
      { id: "brand-spotlight", productIds: ["core-1", "core-2"], groups: [] },
      { id: "explore-more", productIds: ["accessory-1"], groups: [] },
    ],
  };
}

function planFixture(
  intent = themeIntentFixture(),
  selection = selectionFixture(),
): TopicPagePlanV2 {
  const plan = {
    schemaVersion: "topic-page-plan/v2" as const,
    status: "plan-ready" as const,
    keyword: selection.keyword,
    site: selection.site,
    strategyRef: selection.strategyRef,
    templateRef: "topic-landing/topic@1" as const,
    themeIntentDigest: themeIntentDigest(intent),
    productSelectionDigest: productSelectionDigest(selection),
    moduleOrder: ["hero", "shortcuts", "start-here", "brand-spotlight"] as const,
    modules: [
      {
        id: "hero" as const,
        component: "ThemeHero" as const,
        visible: true,
        shoppingGoal: "Introduce the matcha ritual",
        reason: "The core product supports the topic.",
        assignments: [{ slotId: "hero-1", productId: "core-1", pool: "primary" as const, role: "core" as const }],
        scenes: [],
        contentTaskId: "content-hero",
        assetTaskIds: ["asset-hero"],
      },
      {
        id: "shortcuts" as const,
        component: "ShortcutRail" as const,
        visible: true,
        shoppingGoal: "Offer a category entry point",
        reason: "The assigned product represents Matcha.",
        assignments: [{ slotId: "shortcuts-1", productId: "core-2", pool: "primary" as const, role: "core" as const }],
        scenes: [],
        contentTaskId: "content-shortcuts",
        assetTaskIds: ["asset-shortcuts-1"],
      },
      {
        id: "start-here" as const,
        component: "ThemeProductList" as const,
        visible: true,
        shoppingGoal: "Build a daily ritual",
        reason: "The validated scene supplies the products.",
        assignments: [
          { slotId: "start-here-1", productId: "core-1", pool: "primary" as const, role: "core" as const, sceneId: "page-scene-1" },
          { slotId: "start-here-2", productId: "pairing-1", pool: "primary" as const, role: "pairing" as const, sceneId: "page-scene-1" },
          { slotId: "start-here-3", productId: "accessory-1", pool: "primary" as const, role: "accessory" as const, sceneId: "page-scene-1" },
        ],
        scenes: [{
          id: "page-scene-1",
          sourceSceneId: "source-scene-1",
          shoppingGoal: "Build a daily matcha ritual",
          reason: "The source scene contains matcha, a pairing, and a tool.",
          productIds: ["core-1", "pairing-1", "accessory-1"],
        }],
        contentTaskId: "content-start-here",
        assetTaskIds: ["asset-start-here-page-scene-1"],
      },
      {
        id: "brand-spotlight" as const,
        component: "BrandProductRail" as const,
        visible: true,
        shoppingGoal: "Compare two represented matcha brands",
        reason: "Two brands have assigned products.",
        assignments: [
          { slotId: "brand-spotlight-1", productId: "core-1", pool: "primary" as const, role: "core" as const, reuseReason: "Also represents the hero." },
          { slotId: "brand-spotlight-2", productId: "core-2", pool: "primary" as const, role: "core" as const, reuseReason: "Also represents the shortcut." },
        ],
        scenes: [],
        contentTaskId: "content-brand-spotlight",
        assetTaskIds: ["asset-brand-spotlight-1", "asset-brand-spotlight-2"],
      },
    ],
    productReusePolicy: {
      crossModule: "requires-reason" as const,
      withinScene: "forbidden" as const,
    },
  };
  return { ...plan, moduleOrder: [...plan.moduleOrder], digest: topicPagePlanDigest(plan) };
}

function copy(text: string, ...evidenceRefs: string[]) {
  return { text, evidenceRefs };
}

function contentSpecFixture(
  intent = themeIntentFixture(),
  selection = selectionFixture(),
  plan = planFixture(intent, selection),
): TopicPageContentSpec {
  const spec = {
    schemaVersion: "topic-page-content-spec/v1" as const,
    status: "content-ready" as const,
    keyword: plan.keyword,
    site: plan.site,
    language: "zh" as const,
    strategyRef: plan.strategyRef,
    templateRef: plan.templateRef,
    topicPagePlanDigest: plan.digest,
    themeIntentDigest: plan.themeIntentDigest,
    productSelectionDigest: plan.productSelectionDigest,
    tasks: [
      {
        taskId: "content-hero",
        moduleId: "hero" as const,
        component: "ThemeHero" as const,
        copy: {
          title: copy("开启抹茶日常", "theme-intent:scenario:matcha"),
          description: copy("从抹茶到茶具，完成日常仪式。", "product:core-1"),
          tags: [
            copy("日常抹茶", "theme-intent:scenario:matcha"),
            copy("完整搭配", "product:core-1"),
          ],
        },
      },
      {
        taskId: "content-shortcuts",
        moduleId: "shortcuts" as const,
        component: "ShortcutRail" as const,
        copy: {
          title: copy("按分类探索", "selected-category:1000"),
          items: [{ slotId: "shortcuts-1", label: copy("抹茶", "product:core-2") }],
        },
      },
      {
        taskId: "content-start-here",
        moduleId: "start-here" as const,
        component: "ThemeProductList" as const,
        copy: {
          title: copy("从这里开始", "scene:page-scene-1"),
          scenes: [{
            sceneId: "page-scene-1",
            label: copy("每日仪式", "scene:page-scene-1"),
            title: copy("一套配齐抹茶日常", "scene:page-scene-1"),
            description: copy("搭配米果与茶筅完成冲泡。", "product:pairing-1", "product:accessory-1"),
          }],
        },
      },
      {
        taskId: "content-brand-spotlight",
        moduleId: "brand-spotlight" as const,
        component: "BrandProductRail" as const,
        copy: { title: copy("按品牌探索", "product:core-1", "product:core-2") },
      },
    ],
  };
  return { ...spec, digest: sha256Digest(spec) };
}

function backgroundEvidenceFixture(
  intent = themeIntentFixture(),
): TopicBackgroundEvidenceBundle {
  const bundle = {
    schemaVersion: "topic-background-evidence/v1" as const,
    status: "ready" as const,
    keyword: "Matcha",
    site: "us" as const,
    language: "zh" as const,
    themeIntentDigest: themeIntentDigest(intent),
    sources: [{
      id: "source:matcha-wikipedia",
      type: "wikipedia" as const,
      title: "Matcha",
      url: "https://en.wikipedia.org/wiki/Matcha",
      publisher: "Wikipedia",
    }],
    claims: [{
      id: "claim:matcha-definition",
      type: "identity" as const,
      text: "Matcha is finely ground green tea traditionally prepared with water.",
      sourceIds: ["source:matcha-wikipedia"],
      usage: "context-only" as const,
    }],
    issues: [],
  };
  return { ...bundle, digest: topicBackgroundEvidenceDigest(bundle) };
}

function artifact(
  ref: string,
  width: number,
  height: number,
  digestCharacter: string,
  backgroundColor?: string,
) {
  return {
    ref,
    mimeType: "image/webp" as const,
    width,
    height,
    digest: `sha256:${digestCharacter.repeat(64)}`,
    focalPoint: { x: 0.5, y: 0.5 },
    ...(backgroundColor ? { backgroundColor } : {}),
  };
}

function visualProposalFixture(
  intent = themeIntentFixture(),
  selection = selectionFixture(),
  plan = planFixture(intent, selection),
  contentSpec = contentSpecFixture(intent, selection, plan),
): TopicPageVisualProposal {
  return {
    schemaVersion: "topic-page-visual-proposal/v1",
    keyword: plan.keyword,
    site: plan.site,
    language: contentSpec.language,
    topicPagePlanDigest: plan.digest,
    topicPageContentSpecDigest: contentSpec.digest,
    themeIntentDigest: plan.themeIntentDigest,
    productSelectionDigest: plan.productSelectionDigest,
    assets: [
      {
        taskId: "asset-hero",
        moduleId: "hero",
        component: "ThemeHero",
        kind: "hero-image",
        direction: {
          prompt: "Sunlit matcha ritual with the assigned ceremonial matcha as the visual anchor.",
          evidenceRefs: [
            "theme-intent:scenario:matcha",
            "selected-category:1000",
            "product:core-1",
            "content-task:content-hero",
          ],
          referenceProductIds: ["core-1"],
        },
        altText: {
          language: "zh",
          text: "阳光桌面上的抹茶与冲泡场景",
          evidenceRefs: ["theme-intent:scenario:matcha", "product:core-1"],
        },
        artifact: artifact("assets/hero.webp", 1600, 900, "a", "#dfe3d4"),
      },
      {
        taskId: "asset-shortcuts-1",
        moduleId: "shortcuts",
        component: "ShortcutRail",
        kind: "shortcut-image",
        direction: {
          prompt: "Square full-bleed matcha category scene centered on the assigned daily matcha.",
          evidenceRefs: [
            "theme-intent:scenario:matcha",
            "selected-category:1000",
            "product:core-2",
            "content-task:content-shortcuts",
          ],
          referenceProductIds: ["core-2"],
        },
        altText: null,
        artifact: artifact("assets/shortcut-matcha.webp", 600, 600, "b"),
      },
      {
        taskId: "asset-start-here-page-scene-1",
        moduleId: "start-here",
        component: "ThemeProductList",
        kind: "scene-image",
        direction: {
          prompt: "Square lifestyle scene with matcha, rice crackers, and bamboo whisk from the assigned scene.",
          evidenceRefs: [
            "theme-intent:scenario:matcha",
            "selected-category:1000",
            "selected-category:1001",
            "selected-category:1002",
            "scene:page-scene-1",
            "content-task:content-start-here",
          ],
          referenceProductIds: ["core-1", "pairing-1", "accessory-1"],
        },
        altText: {
          language: "zh",
          text: "抹茶、米果与竹茶筅组成的日常冲泡场景",
          evidenceRefs: ["scene:page-scene-1", "product:core-1", "product:pairing-1", "product:accessory-1"],
        },
        artifact: artifact("assets/scene-daily-ritual.webp", 1200, 1200, "c", "#9aaa8f"),
      },
      {
        taskId: "asset-brand-spotlight-1",
        moduleId: "brand-spotlight",
        component: "BrandProductRail",
        kind: "brand-banner",
        direction: {
          prompt: "Wide editorial banner for Matcha House using its assigned ceremonial matcha.",
          evidenceRefs: [
            "theme-intent:scenario:matcha",
            "selected-category:1000",
            "product:core-1",
            "content-task:content-brand-spotlight",
          ],
          referenceProductIds: ["core-1"],
        },
        altText: {
          language: "zh",
          text: "Matcha House 抹茶主题横幅",
          evidenceRefs: ["product:core-1"],
        },
        artifact: artifact("assets/brand-matcha-house.webp", 888, 320, "d"),
      },
      {
        taskId: "asset-brand-spotlight-2",
        moduleId: "brand-spotlight",
        component: "BrandProductRail",
        kind: "brand-banner",
        direction: {
          prompt: "Wide editorial banner for Tea Lab using its assigned daily matcha.",
          evidenceRefs: [
            "theme-intent:scenario:matcha",
            "selected-category:1000",
            "product:core-2",
            "content-task:content-brand-spotlight",
          ],
          referenceProductIds: ["core-2"],
        },
        altText: {
          language: "zh",
          text: "Tea Lab 抹茶主题横幅",
          evidenceRefs: ["product:core-2"],
        },
        artifact: artifact("assets/brand-tea-lab.webp", 888, 320, "e"),
      },
    ],
  };
}

describe("TopicPageVisual", () => {
  it("revalidates background-backed copy with its bound evidence without expanding visual evidence", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const backgroundEvidence = backgroundEvidenceFixture(intent);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    contentSpec.backgroundEvidenceDigest = backgroundEvidence.digest;
    contentSpec.tasks[0]!.copy.title.evidenceRefs = [
      "background:claim:matcha-definition",
    ];
    contentSpec.digest = topicPageContentSpecDigest(contentSpec);

    const run = advanceTopicPageVisualRun({
      intent,
      selection,
      plan,
      contentSpec,
      backgroundEvidence,
    });

    expect(run.status).toBe("needs-visual-proposal");
    if (run.status !== "needs-visual-proposal") throw new Error("Expected visual tasks.");
    expect(run.context.evidenceNamespaces).not.toContain("background:<claim-id>");

    const missingEvidenceRun = advanceTopicPageVisualRun({
      intent,
      selection,
      plan,
      contentSpec,
    });
    expect(missingEvidenceRun).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "TopicPageVisual requires the BackgroundEvidence bound to TopicPageContentSpec.",
      ]),
    });
  });

  it("returns only PagePlan asset tasks with real component presentation requirements", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);

    const run = advanceTopicPageVisualRun({ intent, selection, plan, contentSpec });

    expect(run).toMatchObject({
      schemaVersion: "topic-page-visual-run/v1",
      status: "needs-visual-proposal",
      context: {
        language: "zh",
        topicPagePlanDigest: plan.digest,
        topicPageContentSpecDigest: contentSpec.digest,
        tasks: [
          { taskId: "asset-hero", kind: "hero-image", targetAspectRatio: "16:9", altTextMode: "required" },
          { taskId: "asset-shortcuts-1", kind: "shortcut-image", targetAspectRatio: "1:1", altTextMode: "decorative" },
          { taskId: "asset-start-here-page-scene-1", kind: "scene-image", targetAspectRatio: "1:1", sceneId: "page-scene-1" },
          { taskId: "asset-brand-spotlight-1", kind: "brand-banner", targetAspectRatio: "111:40", brand: "Matcha House" },
          { taskId: "asset-brand-spotlight-2", kind: "brand-banner", targetAspectRatio: "111:40", brand: "Tea Lab" },
        ],
      },
    });
    if (run.status !== "needs-visual-proposal") throw new Error("Expected visual tasks.");
    expect(run.context.tasks[0]!.sceneBrief).toMatchObject({
      priority: "scene-composite",
      productRole: "locked-source-products",
      requirements: expect.arrayContaining([
        "Let the visual Agent derive the setting and supporting elements from the accepted Hero copy and assigned product mix.",
        "Compose the verified source product images as locked real-product layers; do not ask the image model to redraw their packaging.",
        "Keep the combined product group at the visual center and keep the bottom quarter free of principal products or scene elements.",
      ]),
    });
    expect(run.context.tasks[1]!.products).toEqual([
      expect.objectContaining({
        id: "core-2",
        title: "Daily Matcha",
        imageUrl: "https://example.com/core-2.webp",
      }),
    ]);
    expect(run.context.tasks[1]!.sceneBrief).toMatchObject({
      priority: "product-first",
      productRole: "primary-subject",
      requirements: expect.arrayContaining([
        "Use the assigned representative product as the single primary visual subject.",
        "Place the product near the center with enough clear margin for a circular crop.",
        "Build a natural lifestyle setting around the product; props and environment remain secondary.",
      ]),
    });
    expect(run.context.tasks[2]!.contentTask).toMatchObject({
      taskId: "content-start-here",
    });
    expect(run.context.tasks[2]!.sceneBrief).toMatchObject({
      priority: "scene-first",
      productRole: "reference-only",
      theme: {
        shoppingGoal: "Build a complete matcha ritual",
        needs: ["matcha", "pairings", "tools"],
        conditions: ["daily ritual"],
      },
      module: {
        shoppingGoal: "Build a daily ritual",
        reason: "The validated scene supplies the products.",
      },
      scene: {
        id: "page-scene-1",
        shoppingGoal: "Build a daily matcha ritual",
      },
      content: {
        taskId: "content-start-here",
        texts: expect.arrayContaining([
          "从这里开始",
          "每日仪式",
          "一套配齐抹茶日常",
          "搭配米果与茶筅完成冲泡。",
        ]),
      },
      evidenceRefs: expect.arrayContaining([
        "theme-intent:scenario:matcha",
        "selected-category:1000",
        "selected-category:1001",
        "selected-category:1002",
        "scene:page-scene-1",
        "content-task:content-start-here",
      ]),
      requirements: expect.arrayContaining([
        "Depict a coherent, naturalistic scene that expresses this module's shopping goal.",
        "Treat assigned products as visual references only; they do not need to appear.",
        "Do not use isolated product packshots, tiled product grids, or product montages as the primary visual.",
        "Do not generate or alter packaging, labels, logos, or product claims.",
      ]),
    });
  });

  it("requires every direction to cite its deterministic module scene brief", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    const proposal = visualProposalFixture(intent, selection, plan, contentSpec);
    proposal.assets[0]!.direction.evidenceRefs = ["product:core-1"];
    proposal.assets[1]!.direction.evidenceRefs = ["product:core-2"];
    proposal.assets[2]!.direction.evidenceRefs = ["product:core-1"];
    proposal.assets[3]!.direction.evidenceRefs = ["product:core-1"];

    const run = advanceTopicPageVisualRun({
      intent,
      selection,
      plan,
      contentSpec,
      proposal,
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Asset asset-hero direction requires scene brief evidence reference theme-intent:scenario:matcha.",
        "Asset asset-hero direction requires scene brief evidence reference content-task:content-hero.",
        "Asset asset-shortcuts-1 direction requires scene brief evidence reference selected-category:1000.",
        "Asset asset-shortcuts-1 direction requires scene brief evidence reference content-task:content-shortcuts.",
        "Asset asset-start-here-page-scene-1 direction requires scene brief evidence reference scene:page-scene-1.",
        "Asset asset-start-here-page-scene-1 direction requires scene brief evidence reference content-task:content-start-here.",
        "Asset asset-brand-spotlight-1 direction requires scene brief evidence reference content-task:content-brand-spotlight.",
      ]),
    });
  });

  it("gives scene images soft composition guidance without constraining other visual tasks", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);

    const run = advanceTopicPageVisualRun({ intent, selection, plan, contentSpec });

    if (run.status !== "needs-visual-proposal") throw new Error("Expected visual tasks.");
    expect(run.context.tasks.find(({ kind }) => kind === "scene-image")).toMatchObject({
      compositionGuidance: {
        preferredSubjectArea: "upper-three-quarters",
        lowerAreaUsage: "low-contrast-decoration-preferred",
      },
    });
    expect(
      run.context.tasks
        .filter(({ kind }) => kind !== "scene-image")
        .every(({ compositionGuidance }) => compositionGuidance === undefined),
    ).toBe(true);
  });

  it("exposes the requested visual production mode to the Visual Agent", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);

    const run = advanceTopicPageVisualRun({
      intent,
      selection,
      plan,
      contentSpec,
      productionMode: "source-product-images",
    });

    expect(run).toMatchObject({
      status: "needs-visual-proposal",
      context: { productionMode: "source-product-images" },
    });
  });

  it("binds the accepted AssetManifest to the requested visual production mode", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    const proposal = {
      ...visualProposalFixture(intent, selection, plan, contentSpec),
      productionMode: "source-product-images" as const,
    };

    const run = advanceTopicPageVisualRun({
      intent,
      selection,
      plan,
      contentSpec,
      productionMode: "source-product-images",
      proposal,
    });

    expect(run).toMatchObject({
      status: "ready",
      manifest: { productionMode: "source-product-images" },
    });
  });

  it("rejects a visual proposal produced with a different production mode", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    const proposal = visualProposalFixture(intent, selection, plan, contentSpec);

    const run = advanceTopicPageVisualRun({
      intent,
      selection,
      plan,
      contentSpec,
      productionMode: "source-product-images",
      proposal,
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Proposal productionMode does not match the requested visual production mode.",
      ]),
    });
  });

  it("compiles generated asset metadata into a deterministic digest-bound manifest", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    const proposal = visualProposalFixture(intent, selection, plan, contentSpec);

    const first = compileTopicPageAssetManifest(intent, selection, plan, contentSpec, proposal);
    const second = compileTopicPageAssetManifest(intent, selection, plan, contentSpec, proposal);

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      schemaVersion: "topic-page-asset-manifest/v1",
      status: "asset-manifest-ready",
      language: "zh",
      topicPagePlanDigest: plan.digest,
      topicPageContentSpecDigest: contentSpec.digest,
      assets: proposal.assets,
    });
    expect(first.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("blocks before Agent work when PagePlan or ContentSpec digests drift", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    plan.digest = "sha256:stale-page-plan";
    contentSpec.digest = "sha256:stale-content-spec";

    const run = advanceTopicPageVisualRun({ intent, selection, plan, contentSpec });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "TopicPagePlan digest is invalid.",
        "TopicPageContentSpec digest is invalid.",
      ]),
    });
  });

  it("rejects undeclared tasks, task drift, and evidence outside each asset scope", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    const proposal = visualProposalFixture(intent, selection, plan, contentSpec);
    proposal.assets[0]!.component = "ProductList";
    proposal.assets[0]!.direction.referenceProductIds = ["accessory-1"];
    proposal.assets[0]!.direction.evidenceRefs = ["scene:page-scene-1"];
    proposal.assets.push({
      ...structuredClone(proposal.assets[1]!),
      taskId: "asset-reviews",
      moduleId: "reviews",
    });

    const run = advanceTopicPageVisualRun({
      intent,
      selection,
      plan,
      contentSpec,
      proposal,
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Visual proposal must define exactly 5 assets.",
        "Asset asset-hero component does not match PagePlan module hero.",
        "Asset asset-hero referenceProductIds must match its assigned products.",
        "Evidence reference scene:page-scene-1 is outside visual task asset-hero.",
        "Asset task asset-reviews is not declared by TopicPagePlan.",
      ]),
    });
  });

  it("persists a bounded Hero placement audit and rejects incomplete geometry", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    const proposal = visualProposalFixture(intent, selection, plan, contentSpec);
    proposal.assets[0]!.direction.placementPlan = {
      primaryIndex: 0,
      anchors: [{ x: 0.5, y: 0.66, scale: 1, depth: 1 }],
      shadowDirection: { x: 0.4, y: 0.6 },
      supportRegion: {
        left: 0.08,
        right: 0.92,
        top: 0.5,
        bottom: 0.74,
        surface: "horizontal-light-neutral",
      },
    };
    proposal.assets[0]!.direction.placementSource = "agent";
    proposal.assets[0]!.direction.compositionAudit = {
      verification: "host-geometry-v1",
      semanticVerification: "agent-vision-v1",
      supportSurfaceLightness: 0.82,
      maximumOverlapRatio: 0,
      bottomSafeAreaStart: 0.75,
      products: [{
        productId: proposal.assets[0]!.direction.referenceProductIds[0]!,
        sourceDigest: `sha256:${"7".repeat(64)}`,
        preparationMethod: "white-background-direct",
        preparationConfidence: 0.98,
        bounds: { left: 0.4, top: 0.28, right: 0.6, bottom: 0.66 },
        contactPoint: { x: 0.5, y: 0.66 },
      }],
    };
    proposal.assets[0]!.direction.generationProvenance = {
      provider: "codex-native",
      modelSource: "unreported",
      attempts: 1,
      cacheHit: false,
    };

    const accepted = advanceTopicPageVisualRun({ intent, selection, plan, contentSpec, proposal });
    expect(accepted.status).toBe("ready");
    if (accepted.status !== "ready") throw new Error("Expected a ready visual manifest.");
    expect(accepted.manifest.assets[0]!.direction).toMatchObject({
      placementSource: "agent",
      placementPlan: { anchors: [{ x: 0.5, y: 0.66 }] },
      compositionAudit: {
        verification: "host-geometry-v1",
        semanticVerification: "agent-vision-v1",
        products: [{ preparationMethod: "white-background-direct" }],
      },
      generationProvenance: { modelSource: "unreported", attempts: 1 },
    });

    proposal.assets[0]!.direction.placementSource = "agent-recovered";
    const recovered = advanceTopicPageVisualRun({ intent, selection, plan, contentSpec, proposal });
    expect(recovered.status).toBe("ready");
    if (recovered.status !== "ready") throw new Error("Expected recovered placement to be ready.");
    expect(recovered.manifest.assets[0]!.direction.placementSource).toBe("agent-recovered");

    proposal.assets[0]!.direction.placementPlan!.anchors = [];
    const rejected = advanceTopicPageVisualRun({ intent, selection, plan, contentSpec, proposal });
    expect(rejected).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Hero asset asset-hero placementPlan must contain one anchor per product.",
        "Asset asset-hero placementPlan and placementSource must be provided together.",
      ]),
    });
  });

  it("rejects unsafe artifact refs, wrong crops, invalid hashes, and alt-text mode drift", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    const proposal = visualProposalFixture(intent, selection, plan, contentSpec);
    proposal.assets[0]!.artifact.ref = "../hero.webp";
    proposal.assets[0]!.artifact.width = 1200;
    proposal.assets[0]!.artifact.height = 1200;
    proposal.assets[0]!.artifact.digest = "sha256:not-a-digest";
    proposal.assets[1]!.altText = {
      language: "zh",
      text: "不应出现的替代文本",
      evidenceRefs: ["product:core-2"],
    };
    delete proposal.assets[2]!.artifact.backgroundColor;

    const run = advanceTopicPageVisualRun({
      intent,
      selection,
      plan,
      contentSpec,
      proposal,
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Asset asset-hero artifact ref must be a safe relative path.",
        "Asset asset-hero dimensions do not match target aspect ratio 16:9.",
        "Asset asset-hero artifact digest must be a SHA-256 digest.",
        "Decorative asset asset-shortcuts-1 must use null altText.",
        "Asset asset-start-here-page-scene-1 requires backgroundColor.",
      ]),
    });
  });

  it("rejects deterministic fallback provenance for scene-first assets", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    const proposal = visualProposalFixture(intent, selection, plan, contentSpec);
    const sceneAsset = proposal.assets.find(({ kind }) => kind === "scene-image")!;
    sceneAsset.direction.fallbackUsed = true;
    sceneAsset.direction.fallbackReason = "native generation unavailable";

    const run = advanceTopicPageVisualRun({ intent, selection, plan, contentSpec, proposal });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        `Asset ${sceneAsset.taskId} may not use a fallback for a scene-first visual task.`,
      ]),
    });
  });

  it("rejects a fallback without an observable reason", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    const proposal = visualProposalFixture(intent, selection, plan, contentSpec);
    const shortcutAsset = proposal.assets.find(({ kind }) => kind === "shortcut-image")!;
    shortcutAsset.direction.fallbackUsed = true;

    const run = advanceTopicPageVisualRun({ intent, selection, plan, contentSpec, proposal });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        `Fallback asset ${shortcutAsset.taskId} requires a fallbackReason.`,
      ]),
    });
  });

  it("keeps the independent Visual Agent behind deterministic review", async () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    const proposal = visualProposalFixture(intent, selection, plan, contentSpec);
    const generatePageVisuals = vi.fn(async () => proposal);
    const agent: TopicVisualAgent = { id: "topic-visual-agent", generatePageVisuals };

    const result = await runTopicVisualAgentWorkflow({
      intent,
      selection,
      plan,
      contentSpec,
      agent,
    });

    expect(generatePageVisuals).toHaveBeenCalledOnce();
    expect(result.run).toMatchObject({
      status: "ready",
      manifest: { status: "asset-manifest-ready" },
    });
    expect(result.artifacts).toEqual({ agentId: "topic-visual-agent", proposal });
  });

  it("carries the selected production mode through the Visual Agent workflow", async () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    const proposal = {
      ...visualProposalFixture(intent, selection, plan, contentSpec),
      productionMode: "source-product-images" as const,
    };
    const generatePageVisuals = vi.fn(async () => proposal);

    const result = await runTopicVisualAgentWorkflow({
      intent,
      selection,
      plan,
      contentSpec,
      productionMode: "source-product-images",
      agent: { id: "topic-visual-agent", generatePageVisuals },
    });

    expect(generatePageVisuals).toHaveBeenCalledWith(expect.objectContaining({
      context: expect.objectContaining({ productionMode: "source-product-images" }),
    }));
    expect(result.run).toMatchObject({
      status: "ready",
      manifest: { productionMode: "source-product-images" },
    });
  });

  it("separates generated image bytes from the proposal before deterministic review", async () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    const proposal = visualProposalFixture(intent, selection, plan, contentSpec);
    const assetBodies = proposal.assets.map((asset) => ({
      taskId: asset.taskId,
      ref: asset.artifact.ref,
      mimeType: asset.artifact.mimeType,
      dataBase64: "iVBORw0KGgo=",
    }));
    const agent: TopicVisualAgent = {
      id: "topic-visual-agent",
      generatePageVisuals: async () => ({
        schemaVersion: "topic-page-visual-agent-output/v1",
        proposal,
        assets: assetBodies,
      }),
    };

    const result = await runTopicVisualAgentWorkflow({
      intent,
      selection,
      plan,
      contentSpec,
      agent,
    });

    expect(result.run.status).toBe("ready");
    expect(result.artifacts).toEqual({
      agentId: "topic-visual-agent",
      proposal,
      assetBodies,
    });
  });

  it("isolates frozen handoff artifacts from mutations inside the Visual Agent", async () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const contentSpec = contentSpecFixture(intent, selection, plan);
    const proposal = visualProposalFixture(intent, selection, plan, contentSpec);
    const originalIntentDigest = themeIntentDigest(intent);
    const originalSelectionDigest = productSelectionDigest(selection);
    const originalPlanDigest = plan.digest;
    const originalContentDigest = contentSpec.digest;
    const agent: TopicVisualAgent = {
      id: "mutating-visual-agent",
      generatePageVisuals: async (run) => {
        run.context.themeIntent.shoppingGoal = "tampered";
        run.context.selectedCategories[0]!.label = "tampered";
        run.context.tasks[0]!.products[0]!.title = "tampered";
        run.context.tasks[0]!.assignments[0]!.productId = "tampered";
        run.context.tasks[0]!.contentTask.copy.title.text = "tampered";
        return proposal;
      },
    };

    const result = await runTopicVisualAgentWorkflow({
      intent,
      selection,
      plan,
      contentSpec,
      agent,
    });

    expect(result.run.status).toBe("ready");
    expect(themeIntentDigest(intent)).toBe(originalIntentDigest);
    expect(productSelectionDigest(selection)).toBe(originalSelectionDigest);
    expect(topicPagePlanDigest(plan)).toBe(originalPlanDigest);
    expect(topicPageContentSpecDigest(contentSpec)).toBe(originalContentDigest);
    expect(contentSpec.tasks[0]!.copy.title.text).toBe("开启抹茶日常");
  });
});
