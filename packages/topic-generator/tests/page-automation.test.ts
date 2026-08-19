import { describe, expect, it, vi } from "vitest";
import sharp from "sharp";

import {
  advanceLandingPageOrchestrationRun,
  runTopicPageAutomationWorkflow,
  sha256Bytes,
  type PageMerchandisingAgent,
  type ProductSelectionResult,
  type ThemeIntent,
  type TopicContentAgent,
  type TopicPageAssetStore,
  type TopicPageImageDecoder,
  type TopicPageReviewAgent,
  type TopicVisualAgent,
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

const REAL_PNG_FIXTURES = {
  "1600x900": "iVBORw0KGgoAAAANSUhEUgAABkAAAAOEAQMAAADDg2/hAAAAA1BMVEXS3MiRRRwVAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAxklEQVR42u3BgQAAAADDoPlTX+EAVQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwGsLCAAEUOY8tAAAAAElFTkSuQmCC",
  "512x512": "iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQMAAADOtka5AAAAA1BMVEXS3MiRRRwVAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAANklEQVR42u3BAQEAAACCIP+vbkhAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8G4IAAAFjdVCkAAAAAElFTkSuQmCC",
} as const;

function pngFixture(size: keyof typeof REAL_PNG_FIXTURES) {
  return new Uint8Array(Buffer.from(REAL_PNG_FIXTURES[size], "base64"));
}

const imageDecoder: TopicPageImageDecoder = {
  inspect: async (bytes) => {
    try {
      const image = sharp(bytes, { failOn: "error" });
      const metadata = await image.metadata();
      await image.clone().raw().toBuffer();
      const mimeType = metadata.format === "png"
        ? "image/png" as const
        : metadata.format === "jpeg"
          ? "image/jpeg" as const
          : metadata.format === "webp"
            ? "image/webp" as const
            : null;
      return mimeType && metadata.width && metadata.height
        ? { mimeType, width: metadata.width, height: metadata.height }
        : null;
    } catch {
      return null;
    }
  },
};

function workflowFixture(options: {
  invalidHeroDigest?: boolean;
  truncatedHero?: boolean;
} = {}) {
  const intent: ThemeIntent = {
    schemaVersion: "theme-intent/v2",
    source: "catalog-evidence",
    themeType: "product",
    catalogDomain: "grocery",
    attributeSchemaVersion: "catalog-v1",
    entityType: "category",
    canonicalEntity: null,
    shoppingIntent: "find-product",
    shopperAction: "find",
    shoppingGoal: "Find matcha",
    needs: ["matcha"],
    conditions: [],
    mustInclude: ["matcha"],
    mustExclude: [],
    searchTerms: ["matcha"],
    categories: [],
    constraints: [],
    evidenceRefs: [{ id: "matcha", source: "catalog-products", label: "Matcha" }],
    candidates: [],
    decision: {
      status: "resolved",
      selectedCandidateId: "matcha",
      evidenceLevel: "high",
      selectedCandidateMargin: null,
      requiresAgentReview: false,
    },
    reason: "Catalog evidence supports matcha.",
    confidence: 0.9,
  };
  const selection: ProductSelectionResult = {
    schemaVersion: "product-selection-result/v1",
    strategyRef: "relevance/intent-themes@2",
    keyword: "Matcha",
    site: "us",
    selectedAt: "2026-08-18T00:00:00.000Z",
    pools: { primaryIds: ["matcha-1"], relatedIds: [] },
    products: [{
      id: "matcha-1",
      title: "Ceremonial Matcha",
      brand: "Matcha House",
      price: "$19.99",
      imageUrl: "https://example.com/matcha.webp",
      productUrl: "https://example.com/matcha",
      sourceRank: 1,
      pool: "primary",
      role: "core",
    }],
    selectedCategories: [],
    scenes: [],
    modules: [],
  };
  const orchestrationTask = advanceLandingPageOrchestrationRun({
    intent,
    keyword: selection.keyword,
    site: selection.site,
    language: "zh",
    requestedSelectionStrategyRef: selection.strategyRef,
  });
  if (orchestrationTask.status !== "needs-execution-plan-proposal") {
    throw new Error("Expected orchestration task.");
  }
  const orchestration = advanceLandingPageOrchestrationRun({
    intent,
    keyword: selection.keyword,
    site: selection.site,
    language: "zh",
    requestedSelectionStrategyRef: selection.strategyRef,
    proposal: {
      schemaVersion: "landing-page-execution-plan-proposal/v1",
      keyword: selection.keyword,
      site: selection.site,
      language: "zh",
      themeIntentDigest: orchestrationTask.context.themeIntentDigest,
      requestedPageTypeRef: null,
      requestedSelectionStrategyRef: selection.strategyRef,
      pageTypeRef: "landing-page/topic@2",
      selectionStrategyRef: selection.strategyRef,
      templateRef: "topic-landing/topic-relevance@1",
      reason: "Use the active intent-theme relevance route for a product topic.",
    },
  });
  if (orchestration.status !== "ready") throw new Error("Expected ready execution plan.");
  const repeat = (productId: string) => ({
    productId,
    reuseReason: "The only frozen product also supports this module.",
  });
  const merchandising: PageMerchandisingAgent = {
    id: "fixture-merchandising-agent",
    proposeModuleMerchandising: async (run) => ({
      schemaVersion: "module-merchandising-proposal/v1",
      keyword: run.context.keyword,
      site: run.context.site,
      strategyRef: run.context.strategyRef,
      templateRef: run.context.templateRef,
      themeIntentDigest: run.context.themeIntentDigest,
      productSelectionDigest: run.context.productSelectionDigest,
      moduleOrder: [...MODULE_ORDER],
      modules: [
        { id: "hero", visible: true, shoppingGoal: "Introduce matcha", reason: "Strongest match.", scenes: [], assignments: [{ productId: "matcha-1" }] },
        { id: "shortcuts", visible: true, shoppingGoal: "Open matcha", reason: "Direct entry.", scenes: [], assignments: [repeat("matcha-1")] },
        { id: "start-here", visible: true, shoppingGoal: "Help shoppers begin with matcha", reason: "The frozen result supports a compact entry point without invented scenes.", scenes: [], assignments: [repeat("matcha-1")] },
        { id: "popular-picks", visible: true, shoppingGoal: "Show the best match", reason: "Frozen rank one.", scenes: [], assignments: [repeat("matcha-1")] },
        { id: "brand-spotlight", visible: false, shoppingGoal: "", reason: "One item cannot support a brand rail.", scenes: [], assignments: [] },
        { id: "reviews", visible: false, shoppingGoal: "", reason: "No verified reviews.", scenes: [], assignments: [] },
        { id: "explore-more", visible: true, shoppingGoal: "Continue discovery", reason: "Keep the strongest match available.", scenes: [], assignments: [repeat("matcha-1")] },
      ],
    }),
  };
  const copy = (text: string) => ({ text, evidenceRefs: ["product:matcha-1"] });
  const content: TopicContentAgent = {
    id: "fixture-content-agent",
    proposePageContent: async (run) => ({
      schemaVersion: "topic-page-content-proposal/v1",
      keyword: run.context.keyword,
      site: run.context.site,
      language: run.context.language,
      topicPagePlanDigest: run.context.topicPagePlanDigest,
      themeIntentDigest: run.context.themeIntentDigest,
      productSelectionDigest: run.context.productSelectionDigest,
      tasks: run.context.tasks.map((task) => ({
        taskId: task.taskId,
        moduleId: task.moduleId,
        component: task.component,
        copy: task.moduleId === "hero"
          ? {
              title: copy("开启抹茶日常"),
              description: copy("从一杯好抹茶开始。"),
              tags: [copy("抹茶"), copy("日常精选")],
            }
          : task.moduleId === "shortcuts"
            ? {
                title: copy("快速探索"),
                items: task.assignments.map(({ slotId }) => ({ slotId, label: copy("抹茶") })),
              }
            : task.moduleId === "start-here"
              ? { title: copy("从这里开始"), scenes: [] }
            : task.moduleId === "explore-more"
              ? { title: copy("探索更多"), description: copy("继续发现相关商品。") }
              : { title: copy("热门精选") },
      })),
    }),
  };
  const completeHeroBytes = pngFixture("1600x900");
  const heroBytes = options.truncatedHero ? completeHeroBytes.slice(0, 24) : completeHeroBytes;
  const shortcutBytes = pngFixture("512x512");
  const visual: TopicVisualAgent = {
    id: "fixture-visual-agent",
    generatePageVisuals: async (run) => {
      const assets = run.context.tasks.map((task) => {
        const bytes = task.kind === "hero-image" ? heroBytes : shortcutBytes;
        const ref = task.kind === "hero-image" ? "assets/hero.png" : "assets/shortcut.png";
        return {
          taskId: task.taskId,
          moduleId: task.moduleId,
          component: task.component,
          kind: task.kind,
          direction: {
            prompt: "Catalog-grounded matcha product scene",
            evidenceRefs: [`product:${task.products[0]!.id}`],
            referenceProductIds: task.products.map(({ id }) => id),
          },
          altText: task.altTextMode === "decorative"
            ? null
            : {
                language: run.context.language,
                text: "抹茶商品主题场景",
                evidenceRefs: [`product:${task.products[0]!.id}`],
              },
          artifact: {
            ref,
            mimeType: "image/png" as const,
            width: task.kind === "hero-image" ? 1600 : 512,
            height: task.kind === "hero-image" ? 900 : 512,
            digest: options.invalidHeroDigest && task.kind === "hero-image"
              ? `sha256:${"0".repeat(64)}`
              : sha256Bytes(bytes),
            focalPoint: { x: 0.5, y: 0.5 },
            ...(task.requiresBackgroundColor ? { backgroundColor: "#dfe3d4" } : {}),
          },
        };
      });
      return {
        schemaVersion: "topic-page-visual-agent-output/v1",
        proposal: {
          schemaVersion: "topic-page-visual-proposal/v1",
          keyword: run.context.keyword,
          site: run.context.site,
          language: run.context.language,
          topicPagePlanDigest: run.context.topicPagePlanDigest,
          topicPageContentSpecDigest: run.context.topicPageContentSpecDigest,
          themeIntentDigest: run.context.themeIntentDigest,
          productSelectionDigest: run.context.productSelectionDigest,
          productionMode: run.context.productionMode,
          assets,
        },
        assets: assets.map((asset) => ({
          taskId: asset.taskId,
          ref: asset.artifact.ref,
          mimeType: asset.artifact.mimeType,
          dataBase64: Buffer.from(
            asset.kind === "hero-image" ? heroBytes : shortcutBytes,
          ).toString("base64"),
        })),
      };
    },
  };
  const review: TopicPageReviewAgent = {
    id: "fixture-review-agent",
    reviewPageExperience: async (run) => ({
      schemaVersion: "topic-page-experience-review-proposal/v1",
      executionPlanDigest: run.context.executionPlanDigest,
      generationSpecDigest: run.context.generationSpec.digest,
      qaReportDigest: run.context.qaReport.digest,
      recommendation: "recommend-approval",
      summary: "The generated page is coherent and ready for human review.",
      issues: [],
    }),
  };
  const persisted = new Map<string, Uint8Array>();
  const put = vi.fn<TopicPageAssetStore["put"]>(async (ref, bytes) => {
    persisted.set(ref, bytes);
  });
  const assetStore: TopicPageAssetStore = {
    put,
    get: async (ref) => {
      const bytes = persisted.get(ref);
      if (!bytes) throw new Error(`Missing ${ref}`);
      return bytes;
    },
    publicUrl: (ref) => `/api/topic-generator/assets?ref=${encodeURIComponent(ref)}`,
  };
  return {
    intent,
    selection,
    executionPlan: orchestration.plan,
    agents: { merchandising, content, visual, review },
    assetStore,
    imageDecoder,
    persisted,
    put,
  };
}

describe("Topic page automation workflow", () => {
  it("runs module planning, copy, visual generation, persistence, spec, QA, and review packaging", async () => {
    const data = workflowFixture();

    const result = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      previewRefs: { desktop: "/?preview=desktop", mobile: "/?preview=mobile" },
    });

    expect(result).toMatchObject({
      schemaVersion: "topic-page-automation-run/v1",
      status: "ready",
      stage: "review-ready",
      stages: [
        { id: "workflow-planning", status: "completed" },
        { id: "product-selection", status: "completed" },
        { id: "module-merchandising", status: "completed" },
        { id: "content-writing", status: "completed" },
        { id: "visual-generation", status: "completed" },
        { id: "asset-persistence", status: "completed" },
        { id: "page-generation", status: "completed" },
        { id: "automatic-qa", status: "completed" },
        { id: "experience-review", status: "completed" },
      ],
      qaReport: { status: "passed" },
      experienceReview: { status: "review-recommended" },
      reviewPackage: {
        status: "review-ready",
        executionPlanDigest: data.executionPlan.digest,
      },
    });
    expect(data.put).toHaveBeenCalledTimes(2);
    expect(data.persisted.size).toBe(2);
    expect(result.generationSpec?.modules.find(({ id }) => id === "start-here")).toMatchObject({
      scenes: [],
    });
  });

  it("carries the requested visual production mode through the full automation workflow", async () => {
    const data = workflowFixture();

    const result = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      visualProductionMode: "source-product-images",
      previewRefs: { desktop: "/?preview=desktop", mobile: "/?preview=mobile" },
    });

    expect(result).toMatchObject({
      status: "ready",
      assetManifest: { productionMode: "source-product-images" },
    });
  });

  it("validates every image body before writing anything to the asset store", async () => {
    const data = workflowFixture({ invalidHeroDigest: true });

    const result = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      previewRefs: { desktop: "/", mobile: "/" },
    });

    expect(result).toMatchObject({
      status: "blocked",
      stage: "asset-persistence",
      issues: ["Asset asset-hero byte digest does not match the accepted visual proposal."],
    });
    expect(data.put).not.toHaveBeenCalled();
    expect(data.persisted.size).toBe(0);
  });

  it("rejects a truncated image before writing anything to the asset store", async () => {
    const data = workflowFixture({ truncatedHero: true });

    const result = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      previewRefs: { desktop: "/", mobile: "/" },
    });

    expect(result).toMatchObject({
      status: "blocked",
      stage: "asset-persistence",
      issues: ["Asset asset-hero is not a decodable PNG, JPEG, or WebP image."],
    });
    expect(data.put).not.toHaveBeenCalled();
    expect(data.persisted.size).toBe(0);
  });

  it("preserves a rejected Content Agent attempt for a content-writing retry", async () => {
    const data = workflowFixture();
    const validContentAgent = data.agents.content;
    const proposeModuleMerchandising = vi.fn(
      data.agents.merchandising.proposeModuleMerchandising,
    );
    data.agents.merchandising = {
      ...data.agents.merchandising,
      proposeModuleMerchandising,
    };
    let rejectedProposal: unknown;
    let revisedProposal: unknown;
    data.agents.content = {
      id: "invalid-content-agent",
      proposePageContent: async (run) => {
        revisedProposal = await validContentAgent.proposePageContent(run);
        rejectedProposal = { ...(revisedProposal as object), tasks: [] };
        return rejectedProposal;
      },
    };

    const result = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      previewRefs: { desktop: "/", mobile: "/" },
    });

    expect(result).toMatchObject({
      status: "blocked",
      stage: "content-writing",
      faultKind: "proposal-invalid",
      rollbackStage: "content-writing",
      plan: { digest: expect.stringMatching(/^sha256:/) },
      contentRun: {
        status: "blocked",
        faultKind: "proposal-invalid",
        rollbackStage: "content-writing",
      },
      contentAttempt: {
        schemaVersion: "topic-page-content-attempt/v1",
        agentId: "invalid-content-agent",
        proposal: rejectedProposal,
        proposalReview: { status: "rejected" },
      },
    });
    if (result.status !== "blocked" || !result.plan || !result.contentAttempt) {
      throw new Error("Expected a recoverable content-writing block.");
    }

    proposeModuleMerchandising.mockClear();
    const proposePageContent = vi.fn(validContentAgent.proposePageContent);
    data.agents.content = { ...validContentAgent, proposePageContent };
    const resumed = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      contentResume: {
        plan: result.plan,
        attempt: result.contentAttempt,
        proposal: revisedProposal,
      },
      previewRefs: { desktop: "/", mobile: "/" },
    });

    expect(resumed).toMatchObject({ status: "ready", stage: "review-ready" });
    expect(proposeModuleMerchandising).not.toHaveBeenCalled();
    expect(proposePageContent).not.toHaveBeenCalled();

    const staleResume = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      contentResume: {
        plan: result.plan,
        attempt: { ...result.contentAttempt, language: "en" },
        proposal: revisedProposal,
      },
      previewRefs: { desktop: "/", mobile: "/" },
    });
    expect(staleResume).toMatchObject({
      status: "blocked",
      stage: "content-writing",
      faultKind: "upstream-invalid",
      rollbackStage: "module-merchandising",
      issues: ["Content resume language does not match the current request."],
    });
    expect(proposeModuleMerchandising).not.toHaveBeenCalled();
    expect(proposePageContent).not.toHaveBeenCalled();

    const missingRevision = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      contentResume: {
        plan: result.plan,
        attempt: result.contentAttempt,
        proposal: undefined,
      },
      previewRefs: { desktop: "/", mobile: "/" },
    });
    expect(missingRevision).toMatchObject({
      status: "blocked",
      stage: "content-writing",
      faultKind: "proposal-invalid",
      rollbackStage: "content-writing",
      issues: ["Content resume requires a revised proposal."],
    });
    expect(proposeModuleMerchandising).not.toHaveBeenCalled();
    expect(proposePageContent).not.toHaveBeenCalled();
  });

  it("preserves the bound attempt when the Content Agent fails", async () => {
    const data = workflowFixture();
    data.agents.content = {
      id: "unavailable-content-agent",
      proposePageContent: async () => {
        throw new Error("Agent transport unavailable.");
      },
    };

    const result = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      previewRefs: { desktop: "/", mobile: "/" },
    });

    expect(result).toMatchObject({
      status: "blocked",
      stage: "content-writing",
      faultKind: "agent-failed",
      rollbackStage: "content-writing",
      issues: ["Content Agent failed while preparing a proposal."],
      contentAttempt: {
        schemaVersion: "topic-page-content-attempt/v1",
        agentId: "unavailable-content-agent",
        topicPagePlanDigest: expect.stringMatching(/^sha256:/),
        themeIntentDigest: expect.stringMatching(/^sha256:/),
        productSelectionDigest: expect.stringMatching(/^sha256:/),
        language: "zh",
      },
    });
  });
});
