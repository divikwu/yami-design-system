import { describe, expect, it, vi } from "vitest";

import {
  advanceTopicPageContentRun,
  compileTopicPageContentSpec,
  productSelectionDigest,
  runTopicContentAgentWorkflow,
  themeIntentDigest,
  topicAudienceContext,
  topicBackgroundEvidenceDigest,
  topicPagePlanDigest,
  type ProductSelectionResult,
  type ThemeIntent,
  type TopicBackgroundEvidenceBundle,
  type TopicContentAgent,
  type TopicPageContentProposal,
  type TopicPagePlanV2,
} from "../src/index.js";
import {
  pageCopyUsesRequestedLanguage,
  usesStrictPageCopyPolicy,
} from "../src/page-content/config.js";

const MODULE_ORDER = [
  "hero",
  "shortcuts",
  "start-here",
  "popular-picks",
  "brand-spotlight",
  "reviews",
  "explore-more",
] as const;

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
    pools: {
      primaryIds: products.map(([id]) => id),
      relatedIds: [],
    },
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
      { id: "brand-spotlight", productIds: [], groups: [] },
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
    templateRef: "topic-landing/topic@2" as const,
    themeIntentDigest: themeIntentDigest(intent),
    productSelectionDigest: productSelectionDigest(selection),
    moduleOrder: [...MODULE_ORDER],
    modules: [
      {
        id: "hero" as const,
        component: "ThemeHero" as const,
        visible: true,
        shoppingGoal: "Introduce the verified matcha proposition",
        reason: "The topic and core product support the proposition.",
        assignments: [{ slotId: "hero-1", productId: "core-1", pool: "primary" as const, role: "core" as const }],
        scenes: [],
        contentTaskId: "content-hero",
        assetTaskIds: ["asset-hero"],
      },
      {
        id: "shortcuts" as const,
        component: "ShortcutRail" as const,
        visible: true,
        shoppingGoal: "Offer category entry points",
        reason: "The assigned core product represents a selected category.",
        assignments: [{ slotId: "shortcuts-1", productId: "core-2", pool: "primary" as const, role: "core" as const }],
        scenes: [],
        contentTaskId: "content-shortcuts",
        assetTaskIds: ["asset-shortcuts-1"],
      },
      {
        id: "start-here" as const,
        component: "ThemeProductList" as const,
        visible: true,
        shoppingGoal: "Help shoppers assemble a daily ritual",
        reason: "One validated source scene supplies the products.",
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
        id: "popular-picks" as const,
        component: "ProductList" as const,
        visible: true,
        shoppingGoal: "Surface a popular core product",
        reason: "The product is in the frozen core pool.",
        assignments: [{ slotId: "popular-picks-1", productId: "core-2", pool: "primary" as const, role: "core" as const, reuseReason: "Also provides a category shortcut." }],
        scenes: [],
        contentTaskId: "content-popular-picks",
        assetTaskIds: [],
      },
      {
        id: "brand-spotlight" as const,
        component: "BrandProductRail" as const,
        visible: false,
        shoppingGoal: "",
        reason: "No separate brand story is required.",
        assignments: [],
        scenes: [],
        contentTaskId: null,
        assetTaskIds: [],
      },
      {
        id: "reviews" as const,
        component: "ReviewList" as const,
        visible: false,
        shoppingGoal: "",
        reason: "No verified review records are available.",
        assignments: [],
        scenes: [],
        contentTaskId: null,
        assetTaskIds: [],
      },
      {
        id: "explore-more" as const,
        component: "ProductList" as const,
        visible: true,
        shoppingGoal: "Continue into complementary tools",
        reason: "The assigned accessory extends the ritual.",
        assignments: [{ slotId: "explore-more-1", productId: "accessory-1", pool: "primary" as const, role: "accessory" as const, reuseReason: "The tool is also part of the start-here scene." }],
        scenes: [],
        contentTaskId: "content-explore-more",
        assetTaskIds: [],
      },
    ],
    productReusePolicy: {
      crossModule: "requires-reason" as const,
      withinScene: "forbidden" as const,
    },
  };
  return { ...plan, digest: topicPagePlanDigest(plan) };
}

function copy(text: string, ...evidenceRefs: string[]) {
  return { text, evidenceRefs };
}

function evidencedSegments(value: unknown): Array<{ text: string; evidenceRefs: string[] }> {
  if (typeof value !== "object" || value === null) return [];
  if ("text" in value && typeof value.text === "string" &&
      "evidenceRefs" in value && Array.isArray(value.evidenceRefs)) {
    return [value as { text: string; evidenceRefs: string[] }];
  }
  return Object.values(value).flatMap(evidencedSegments);
}

function proposalFixture(
  intent = themeIntentFixture(),
  selection = selectionFixture(),
  plan = planFixture(intent, selection),
): TopicPageContentProposal {
  return {
    schemaVersion: "topic-page-content-proposal/v1",
    keyword: plan.keyword,
    site: plan.site,
    language: "zh",
    topicPagePlanDigest: plan.digest,
    themeIntentDigest: plan.themeIntentDigest,
    productSelectionDigest: plan.productSelectionDigest,
    tasks: [
      {
        taskId: "content-hero",
        moduleId: "hero",
        component: "ThemeHero",
        copy: {
          title: copy("开启你的抹茶日常", "theme-intent:scenario:matcha"),
          description: copy("从抹茶到茶筅，一次配齐日常仪式所需。", "product:core-1", "theme-intent:scenario:matcha"),
          tags: [
            copy("日常抹茶", "theme-intent:scenario:matcha"),
            copy("完整搭配", "product:core-1"),
          ],
        },
      },
      {
        taskId: "content-shortcuts",
        moduleId: "shortcuts",
        component: "ShortcutRail",
        copy: {
          title: copy("按分类探索", "selected-category:1000"),
          items: [{
            slotId: "shortcuts-1",
            label: copy("抹茶", "product:core-2", "selected-category:1000"),
          }],
        },
      },
      {
        taskId: "content-start-here",
        moduleId: "start-here",
        component: "ThemeProductList",
        copy: {
          title: copy("从这里开始搭配", "scene:page-scene-1"),
          scenes: [{
            sceneId: "page-scene-1",
            label: copy("每日仪式", "scene:page-scene-1"),
            title: copy("一套配齐抹茶日常", "scene:page-scene-1", "product:core-1"),
            description: copy("搭配米果与茶筅，完成冲泡、享用与整理。", "scene:page-scene-1", "product:pairing-1", "product:accessory-1"),
          }],
        },
      },
      {
        taskId: "content-popular-picks",
        moduleId: "popular-picks",
        component: "ProductList",
        copy: {
          title: copy("热门抹茶", "product:core-2"),
        },
      },
      {
        taskId: "content-explore-more",
        moduleId: "explore-more",
        component: "ProductList",
        copy: {
          title: copy("探索更多搭配", "selected-category:1002"),
          description: copy("继续发现让冲泡更顺手的茶具。", "product:accessory-1"),
        },
      },
    ],
  };
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
      text: "Matcha is finely ground green tea traditionally prepared by whisking it with water.",
      sourceIds: ["source:matcha-wikipedia"],
      usage: "context-only" as const,
    }],
    issues: [],
  };
  return { ...bundle, digest: topicBackgroundEvidenceDigest(bundle) };
}

describe("TopicPageContent", () => {
  it("applies strict copy policy to every active relevance template", () => {
    expect([
      "topic-landing/brand-relevance@1",
      "topic-landing/topic-relevance@1",
      "topic-landing/campaign-relevance@1",
      "topic-landing/brand-relevance@2",
      "topic-landing/topic-relevance@2",
      "topic-landing/campaign-relevance@2",
    ].every((templateRef) => usesStrictPageCopyPolicy(templateRef))).toBe(true);
    expect(usesStrictPageCopyPolicy("topic-landing/relevance@1")).toBe(false);
  });

  it("allows catalog-backed uppercase acronyms in Chinese copy", () => {
    expect(pageCopyUsesRequestedLanguage(
      "PDRN 与 SPF 50 日常护理",
      "zh",
      ["ANUA PDRN Serum", "ANUA Daily Sunscreen SPF 50"],
    )).toBe(true);
    expect(pageCopyUsesRequestedLanguage(
      "Explore PDRN 日常护理",
      "zh",
      ["ANUA PDRN Serum"],
    )).toBe(false);
  });

  it("returns only the declared visible content tasks and their real component copy slots", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);

    const run = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "zh",
    });

    expect(run).toMatchObject({
      schemaVersion: "topic-page-content-run/v1",
      status: "needs-content-proposal",
      context: {
        language: "zh",
        copyPolicyRef: "topic-page-copy/evidence-bound@1",
        claimPolicy: {
          evidenceRequirement: "explicit-in-cited-artifact",
          evidenceRefsAuthorize: "scope-only",
          planningGoalsAuthorizeClaims: false,
          restrictedClaimTypes: [
            "ingredient",
            "benefit",
            "efficacy",
            "popularity",
            "inventory",
            "discount",
            "rating",
            "customer-outcome",
          ],
        },
        topicPagePlanDigest: plan.digest,
        eligibleThemeIntentEvidenceIds: ["scenario:matcha"],
        tasks: [
          {
            taskId: "content-hero",
            moduleId: "hero",
            copySlots: ["title", "description", "tags"],
            copyRules: [
              { slot: "title", maxCharacters: 64 },
              { slot: "description", maxCharacters: 180 },
              { slot: "tags", maxCharacters: 32 },
            ],
          },
          { taskId: "content-shortcuts", moduleId: "shortcuts", copySlots: ["title", "items[].label"] },
          {
            taskId: "content-start-here",
            moduleId: "start-here",
            copySlots: ["title", "scenes[].label", "scenes[].title", "scenes[].description"],
          },
          { taskId: "content-popular-picks", moduleId: "popular-picks", copySlots: ["title"] },
          { taskId: "content-explore-more", moduleId: "explore-more", copySlots: ["title", "description"] },
        ],
      },
    });
    if (run.status !== "needs-content-proposal") throw new Error("Expected content task.");
    expect(run.context.tasks.find(({ moduleId }) => moduleId === "hero")?.products)
      .toEqual([expect.objectContaining({ id: "core-1" })]);
    expect(run.context.tasks.flatMap(({ moduleId }) => moduleId)).not.toContain("reviews");
  });

  it("builds a novice copy brief and exposes only digest-bound background claims", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const backgroundEvidence = backgroundEvidenceFixture(intent);
    const audienceContext = topicAudienceContext("zh");

    const run = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "zh",
      audienceContext,
      backgroundEvidence,
    });

    expect(run).toMatchObject({
      status: "needs-content-proposal",
      context: {
        copyPolicyRef: "topic-page-copy/novice-guided@2",
        languagePolicy: {
          requestedLanguage: "zh",
          immutableProperNouns: expect.arrayContaining([
            "Matcha",
            "Ceremonial Matcha",
          ]),
          generatedCopyRequirement: "requested-language-only-except-listed-proper-nouns",
        },
        audienceContext: {
          familiarity: "unfamiliar",
          marketContext: "non-asian-us",
        },
        backgroundEvidence: {
          digest: backgroundEvidence.digest,
          status: "ready",
        },
        eligibleBackgroundEvidenceClaimIds: ["claim:matcha-definition"],
        copyBrief: {
          schemaVersion: "topic-page-copy-brief/v2",
          backgroundEvidenceDigest: backgroundEvidence.digest,
          newcomerQuestions: expect.arrayContaining([
            "这个主题是什么？",
            "我应该从哪个品类或场景开始？",
          ]),
          moduleObjectives: expect.arrayContaining([
            expect.objectContaining({ moduleId: "hero", taskId: "content-hero" }),
            expect.objectContaining({ moduleId: "start-here", taskId: "content-start-here" }),
          ]),
        },
      },
    });
    if (run.status !== "needs-content-proposal") throw new Error("Expected content task.");
    expect(run.context.evidenceNamespaces).toContain("background:<claim-id>");
    expect(run.context.copyBrief.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("blocks background evidence from a different content language", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const backgroundEvidence = backgroundEvidenceFixture(intent);

    const run = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "en",
      audienceContext: topicAudienceContext("en"),
      backgroundEvidence,
    });

    expect(run).toMatchObject({
      status: "blocked",
      faultKind: "upstream-invalid",
      rollbackStage: "background-evidence",
      issues: ["Background evidence language does not match the content request."],
    });
  });

  it("accepts a scoped background claim and rejects an unknown background reference", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const backgroundEvidence = backgroundEvidenceFixture(intent);
    const proposal = proposalFixture(intent, selection, plan);
    proposal.tasks[0]!.copy.title.evidenceRefs = ["background:claim:matcha-definition"];

    const ready = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "zh",
      audienceContext: topicAudienceContext("zh"),
      backgroundEvidence,
      proposal,
    });
    expect(ready.status).toBe("ready");
    if (ready.status !== "ready") throw new Error("Expected ready content.");
    expect(ready.spec).toMatchObject({
      backgroundEvidenceDigest: backgroundEvidence.digest,
      copyBriefDigest: expect.stringMatching(/^sha256:/),
    });

    proposal.tasks[0]!.copy.title.evidenceRefs = ["background:claim:missing"];
    const blocked = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "zh",
      audienceContext: topicAudienceContext("zh"),
      backgroundEvidence,
      proposal,
    });
    expect(blocked).toMatchObject({
      status: "blocked",
      issues: [expect.stringContaining("Unknown background evidence reference")],
    });
  });

  it("compiles evidence-bound copy into a deterministic ContentSpec", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const proposal = proposalFixture(intent, selection, plan);

    const first = compileTopicPageContentSpec(intent, selection, plan, "zh", proposal);
    const second = compileTopicPageContentSpec(intent, selection, plan, "zh", proposal);

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      schemaVersion: "topic-page-content-spec/v1",
      status: "content-ready",
      language: "zh",
      topicPagePlanDigest: plan.digest,
      themeIntentDigest: themeIntentDigest(intent),
      productSelectionDigest: productSelectionDigest(selection),
      tasks: proposal.tasks,
    });
    expect(first.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("blocks before Agent work when the PagePlan or upstream digests drift", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    plan.digest = "sha256:stale-page-plan";
    plan.themeIntentDigest = "sha256:stale-theme-intent";

    const run = advanceTopicPageContentRun({ intent, selection, plan, language: "zh" });

    expect(run).toMatchObject({
      status: "blocked",
      faultKind: "upstream-invalid",
      rollbackStage: "module-merchandising",
      issues: expect.arrayContaining([
        "TopicPagePlan digest is invalid.",
        "TopicPagePlan themeIntentDigest does not match ThemeIntent.",
      ]),
    });
  });

  it("rejects undeclared tasks, component drift, and out-of-scope evidence", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const proposal = proposalFixture(intent, selection, plan);
    proposal.tasks[0]!.component = "ProductList";
    proposal.tasks[0]!.copy.title.evidenceRefs = ["product:accessory-1"];
    proposal.tasks[2]!.copy.scenes![0]!.description.evidenceRefs = [
      "scene:missing-scene",
      "theme-intent:missing-evidence",
    ];
    proposal.tasks.push({
      taskId: "content-reviews",
      moduleId: "reviews",
      component: "ReviewList",
      copy: { title: copy("顾客怎么说", "theme-intent:scenario:matcha") },
    });

    const run = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "zh",
      proposal,
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Content proposal must define exactly 5 tasks.",
        "Task content-hero component does not match PagePlan module hero.",
        "Evidence reference product:accessory-1 is outside module hero.",
        "Evidence reference scene:missing-scene is outside module start-here.",
        "Unknown ThemeIntent evidence reference: theme-intent:missing-evidence.",
        "Task content-reviews is not declared by TopicPagePlan.",
      ]),
    });
  });

  it("enforces component-specific copy completeness and evidence on every segment", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const proposal = proposalFixture(intent, selection, plan);
    proposal.tasks[0]!.copy.tags = [copy("只有一个标签", "theme-intent:scenario:matcha")];
    proposal.tasks[1]!.copy.items = [];
    proposal.tasks[2]!.copy.scenes![0]!.label.evidenceRefs = [];
    delete proposal.tasks[4]!.copy.description;

    const run = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "zh",
      proposal,
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Module hero requires 2-4 tags.",
        "Module shortcuts must define one item label for every assignment slot.",
        "Copy field start-here.scenes[0].label requires at least one evidence reference.",
        "Module explore-more requires description.",
      ]),
    });
  });

  it("rejects mixed-language copy for active templates", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const proposal = proposalFixture(intent, selection, plan);
    proposal.tasks[4]!.copy.title.text = "Explore more";

    const run = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "zh",
      proposal,
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Copy field explore-more.title must use zh copy except immutable proper nouns.",
      ]),
    });
  });

  it("rejects copy that exceeds the active template text limit", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const proposal = proposalFixture(intent, selection, plan);
    proposal.tasks[0]!.copy.description!.text = "长".repeat(181);

    const run = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "zh",
      proposal,
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Copy field hero.description exceeds 180 characters.",
      ]),
    });
  });

  it("rejects ThemeIntent evidence that is present but not eligible for content claims", () => {
    const intent = themeIntentFixture();
    intent.evidenceRefs.push({
      id: "brand:unrelated",
      source: "catalog-brand",
      label: "Unrelated Brand",
    });
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const proposal = proposalFixture(intent, selection, plan);
    proposal.tasks[0]!.copy.title.evidenceRefs = ["theme-intent:brand:unrelated"];

    const run = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "zh",
      proposal,
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "ThemeIntent evidence reference theme-intent:brand:unrelated is not eligible for content claims.",
      ]),
    });
  });

  it("rejects selected-category evidence outside the active module assignments", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const proposal = proposalFixture(intent, selection, plan);
    proposal.tasks[1]!.copy.title.evidenceRefs = ["selected-category:1002"];

    const run = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "zh",
      proposal,
    });

    expect(run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Evidence reference selected-category:1002 is outside module shortcuts.",
      ]),
    });
  });

  it("keeps legacy template proposals replayable without the active copy policy", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    plan.templateRef = "topic-landing/topic@1";
    plan.digest = topicPagePlanDigest(plan);
    const proposal = proposalFixture(intent, selection, plan);
    proposal.tasks[4]!.copy.title.text = "Explore more";
    proposal.tasks[0]!.copy.description!.text = "长".repeat(181);

    const run = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "zh",
      proposal,
    });

    expect(run).toMatchObject({ status: "ready" });
  });

  it("accepts English copy with immutable proper nouns and rejects mixed Chinese text", () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const proposal = proposalFixture(intent, selection, plan);
    proposal.language = "en";
    evidencedSegments(proposal.tasks).forEach((segment) => {
      segment.text = `Shop ${plan.keyword}`;
    });

    expect(advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "en",
      proposal,
    })).toMatchObject({ status: "ready" });

    proposal.tasks[0]!.copy.title.text = `探索 ${plan.keyword}`;
    expect(advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "en",
      proposal,
    })).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining([
        "Copy field hero.title must use en copy except immutable proper nouns.",
      ]),
    });
  });

  it("keeps the independent Content Agent behind the same deterministic review", async () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const proposal = proposalFixture(intent, selection, plan);
    const proposePageContent = vi.fn(async (
      _run: Parameters<TopicContentAgent["proposePageContent"]>[0],
    ) => proposal);
    const agent: TopicContentAgent = {
      id: "topic-content-agent",
      proposePageContent,
    };

    const result = await runTopicContentAgentWorkflow({
      intent,
      selection,
      plan,
      language: "zh",
      agent,
    });

    expect(proposePageContent).toHaveBeenCalledOnce();
    expect(result.run).toMatchObject({ status: "ready", spec: { language: "zh" } });
    expect(result.artifacts).toEqual({
      schemaVersion: "topic-page-content-attempt/v1",
      agentId: "topic-content-agent",
      topicPagePlanDigest: plan.digest,
      themeIntentDigest: themeIntentDigest(intent),
      productSelectionDigest: productSelectionDigest(selection),
      language: "zh",
      proposal,
      proposalReview: result.run.status === "ready" ? result.run.proposalReview : undefined,
    });
  });

  it("gives a bounded rewrite the previous ContentSpec and structured review issues", async () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const proposal = proposalFixture(intent, selection, plan);
    const initial = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "zh",
      proposal,
    });
    const pending = advanceTopicPageContentRun({
      intent,
      selection,
      plan,
      language: "zh",
    });
    if (initial.status !== "ready" || pending.status !== "needs-content-proposal") {
      throw new Error("Expected ready content and a bound pending context.");
    }
    const proposePageContent = vi.fn(async (
      _run: Parameters<TopicContentAgent["proposePageContent"]>[0],
    ) => proposal);
    const agent: TopicContentAgent = {
      id: "topic-content-agent",
      proposePageContent,
    };

    const result = await runTopicContentAgentWorkflow({
      intent,
      selection,
      plan,
      language: "zh",
      agent,
      revision: {
        schemaVersion: "topic-page-content-revision/v1",
        attempt: 2,
        previousContentSpec: initial.spec,
        review: {
          source: "review-agent",
          contentSpecDigest: initial.spec.digest,
          copyBriefDigest: pending.context.copyBrief.digest,
          backgroundEvidenceDigest: null,
          reviewerAgentId: "topic-content-review",
          decisionDigest: "sha256:review-decision",
          issues: [{
            code: "generic-theme-copy",
            severity: "error",
            moduleId: "hero",
            message: "Explain what makes this topic distinct for a first-time shopper.",
          }],
        },
      },
    });

    expect(result.run).toMatchObject({ status: "ready" });
    expect(proposePageContent).toHaveBeenCalledOnce();
    expect(proposePageContent.mock.calls[0]?.[0].context.revision).toMatchObject({
      schemaVersion: "topic-page-content-revision/v1",
      attempt: 2,
      previousContentSpec: { digest: initial.spec.digest },
      review: {
        contentSpecDigest: initial.spec.digest,
        copyBriefDigest: pending.context.copyBrief.digest,
        issues: [{ code: "generic-theme-copy", moduleId: "hero" }],
      },
    });
  });

  it("rechecks a revised proposal against the same content task digests without another Agent call", async () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const rejectedProposal = { ...proposalFixture(intent, selection, plan), tasks: [] };
    const proposePageContent = vi.fn(async () => rejectedProposal);
    const agent: TopicContentAgent = {
      id: "topic-content-agent",
      proposePageContent,
    };

    const rejected = await runTopicContentAgentWorkflow({
      intent,
      selection,
      plan,
      language: "zh",
      agent,
    });
    expect(rejected).toMatchObject({
      run: {
        status: "blocked",
        faultKind: "proposal-invalid",
        rollbackStage: "content-writing",
      },
      artifacts: {
        schemaVersion: "topic-page-content-attempt/v1",
        agentId: "topic-content-agent",
        topicPagePlanDigest: plan.digest,
        themeIntentDigest: themeIntentDigest(intent),
        productSelectionDigest: productSelectionDigest(selection),
        language: "zh",
        proposal: rejectedProposal,
        proposalReview: { status: "rejected" },
      },
    });

    const revisedProposal = proposalFixture(intent, selection, plan);
    const resumed = await runTopicContentAgentWorkflow({
      intent,
      selection,
      plan,
      language: "zh",
      agent,
      proposal: revisedProposal,
    });

    expect(resumed).toMatchObject({
      run: {
        status: "ready",
        spec: {
          topicPagePlanDigest: plan.digest,
          themeIntentDigest: themeIntentDigest(intent),
          productSelectionDigest: productSelectionDigest(selection),
        },
      },
      artifacts: { agentId: "topic-content-agent", proposal: revisedProposal },
    });
    expect(proposePageContent).toHaveBeenCalledOnce();
  });

  it("classifies Content Agent failures without losing the bound attempt", async () => {
    const intent = themeIntentFixture();
    const selection = selectionFixture();
    const plan = planFixture(intent, selection);
    const agent: TopicContentAgent = {
      id: "failing-content-agent",
      proposePageContent: async () => {
        throw new Error("Agent transport unavailable.");
      },
    };

    await expect(runTopicContentAgentWorkflow({
      intent,
      selection,
      plan,
      language: "zh",
      agent,
    })).rejects.toMatchObject({
      name: "TopicContentAgentWorkflowError",
      faultKind: "agent-failed",
      rollbackStage: "content-writing",
      attempt: {
        schemaVersion: "topic-page-content-attempt/v1",
        agentId: "failing-content-agent",
        topicPagePlanDigest: plan.digest,
        themeIntentDigest: themeIntentDigest(intent),
        productSelectionDigest: productSelectionDigest(selection),
        language: "zh",
      },
    });
  });
});
