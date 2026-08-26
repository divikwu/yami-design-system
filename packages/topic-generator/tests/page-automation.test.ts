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
  type TopicPageContentReviewAgent,
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
  qaReadFailure?: boolean;
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
    pools: { primaryIds: ["matcha-1", "matcha-2", "matcha-3"], relatedIds: [] },
    products: [
      {
        id: "matcha-1",
        title: "Ceremonial Matcha",
        brand: "Matcha House",
        price: "$19.99",
        imageUrl: "https://example.com/matcha-1.webp",
        productUrl: "https://example.com/matcha-1",
        sourceRank: 1,
        pool: "primary",
        role: "core",
      },
      {
        id: "matcha-2",
        title: "Daily Matcha",
        brand: "Matcha House",
        price: "$14.99",
        imageUrl: "https://example.com/matcha-2.webp",
        productUrl: "https://example.com/matcha-2",
        sourceRank: 2,
        pool: "primary",
        role: "core",
      },
      {
        id: "matcha-3",
        title: "Organic Matcha",
        brand: "Tea Garden",
        price: "$16.99",
        imageUrl: "https://example.com/matcha-3.webp",
        productUrl: "https://example.com/matcha-3",
        sourceRank: 3,
        pool: "primary",
        role: "core",
      },
    ],
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
    reuseReason: "The frozen anchor also supports this module.",
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
        { id: "hero", visible: true, shoppingGoal: "Introduce matcha", reason: "Three frozen core products create a representative Hero.", scenes: [], assignments: [{ productId: "matcha-1", selectionReason: "Strong sales anchor." }, { productId: "matcha-2", selectionReason: "Adds daily-use coverage." }, { productId: "matcha-3", selectionReason: "Adds organic variety." }] },
        { id: "shortcuts", visible: true, shoppingGoal: "Open matcha", reason: "Direct entry.", scenes: [], assignments: [repeat("matcha-1")] },
        { id: "start-here", visible: false, shoppingGoal: "", reason: "The frozen result contains no catalog-backed source scenes.", scenes: [], assignments: [] },
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
  const contentReview: TopicPageContentReviewAgent = {
    id: "fixture-content-review-agent",
    reviewPageContent: async (run) => ({
      schemaVersion: "topic-page-content-review-proposal/v1",
      contentSpecDigest: run.context.contentSpecDigest,
      copyBriefDigest: run.context.copyBriefDigest,
      backgroundEvidenceDigest: run.context.backgroundEvidenceDigest,
      verdict: "approved",
      issues: [],
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
            evidenceRefs: [
              ...task.sceneBrief.evidenceRefs,
              ...task.products.map(({ id }) => `product:${id}`),
            ],
            referenceProductIds: task.products.map(({ id }) => id),
            generationProvenance: {
              provider: "fixture-native",
              modelSource: "unreported" as const,
              attempts: 1,
              cacheHit: false,
            },
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
      if (options.qaReadFailure) throw new Error(`Unavailable ${ref}`);
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
    agents: { merchandising, content, contentReview, visual, review },
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
        { id: "background-evidence", status: "completed" },
        { id: "product-selection", status: "completed" },
        { id: "module-merchandising", status: "completed" },
        { id: "content-writing", status: "completed" },
        { id: "content-review", status: "completed" },
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
    expect(result.generationSpec?.modules.find(({ id }) => id === "shortcuts")).toMatchObject({
      assets: [expect.objectContaining({
        url: expect.stringContaining("assets%2Fshortcut.png"),
        focalPoint: { x: 0.5, y: 0.5 },
      })],
      products: [expect.objectContaining({
        id: "matcha-1",
        imageUrl: "https://example.com/matcha-1.webp",
      })],
    });
    expect(result.generationSpec?.modules.find(({ id }) => id === "start-here")).toBeUndefined();
  });

  it("publishes the QA-passed generation spec before asking the Review Agent to inspect it", async () => {
    const data = workflowFixture();
    const reviewPageExperience = vi.fn(data.agents.review.reviewPageExperience);
    data.agents.review = { ...data.agents.review, reviewPageExperience };
    const previewResolver = vi.fn(async () => ({
      desktop: "http://127.0.0.1:3300/internal/topic-generator/review-preview/desktop-token",
      mobile: "http://127.0.0.1:3300/internal/topic-generator/review-preview/mobile-token",
    }));

    const result = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      previewResolver,
    });

    expect(result).toMatchObject({
      status: "ready",
      reviewPackage: {
        previewRefs: {
          desktop: "http://127.0.0.1:3300/internal/topic-generator/review-preview/desktop-token",
          mobile: "http://127.0.0.1:3300/internal/topic-generator/review-preview/mobile-token",
        },
      },
    });
    expect(previewResolver).toHaveBeenCalledOnce();
    expect(previewResolver).toHaveBeenCalledWith({
      executionPlan: data.executionPlan,
      generationSpec: result.generationSpec,
      qaReport: result.qaReport,
    });
    if (result.status !== "ready") throw new Error("Expected a review-ready run.");
    if (!result.reviewPackage) throw new Error("Expected a compiled review package.");
    expect(reviewPageExperience).toHaveBeenCalledOnce();
    expect(reviewPageExperience.mock.calls[0]?.[0].context.previewRefs).toEqual(
      result.reviewPackage.previewRefs,
    );
  });

  it("keeps a QA-passed page ready when its experience preview cannot be published", async () => {
    const data = workflowFixture();
    const reviewPageExperience = vi.fn(data.agents.review.reviewPageExperience);
    data.agents.review = { ...data.agents.review, reviewPageExperience };
    const previewResolver = vi.fn(async () => {
      throw new Error("Preview registry is unavailable.");
    });

    const result = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      previewResolver,
    });

    expect(result).toMatchObject({
      status: "ready",
      stage: "review-ready",
      issues: expect.arrayContaining(["Preview registry is unavailable."]),
      qaReport: { status: "passed" },
    });
    expect(previewResolver).toHaveBeenCalledOnce();
    expect(reviewPageExperience).not.toHaveBeenCalled();
  });

  it("does not publish a preview before hard QA passes", async () => {
    const data = workflowFixture({ qaReadFailure: true });
    const previewResolver = vi.fn(async () => ({
      desktop: "http://127.0.0.1:3300/desktop",
      mobile: "http://127.0.0.1:3300/mobile",
    }));

    const result = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      previewResolver,
    });

    expect(result).toMatchObject({
      status: "blocked",
      stage: "automatic-qa",
      qaReport: { status: "qa-blocked" },
    });
    expect(previewResolver).not.toHaveBeenCalled();
  });

  it("rewrites once when independent content review requests revision before visual generation", async () => {
    const data = workflowFixture();
    const proposePageContent = vi.fn(data.agents.content.proposePageContent);
    data.agents.content = { ...data.agents.content, proposePageContent };
    const generatePageVisuals = vi.fn(data.agents.visual.generatePageVisuals);
    data.agents.visual = { ...data.agents.visual, generatePageVisuals };
    let reviewAttempt = 0;
    data.agents.contentReview = {
      id: "fixture-content-review-agent",
      reviewPageContent: async (run) => {
        reviewAttempt += 1;
        return {
          schemaVersion: "topic-page-content-review-proposal/v1",
          contentSpecDigest: run.context.contentSpecDigest,
          copyBriefDigest: run.context.copyBriefDigest,
          backgroundEvidenceDigest: run.context.backgroundEvidenceDigest,
          verdict: reviewAttempt === 1 ? "revision-required" : "approved",
          issues: reviewAttempt === 1
            ? [{
                code: "generic-theme-copy",
                severity: "error",
                moduleId: "hero",
                message: "Explain what makes this topic distinct for a first-time shopper.",
              }]
            : [],
        };
      },
    };

    const result = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      previewRefs: { desktop: "/", mobile: "/" },
    });

    expect(result).toMatchObject({ status: "ready", stage: "review-ready" });
    expect(proposePageContent).toHaveBeenCalledTimes(2);
    expect(proposePageContent.mock.calls[1]?.[0].context.revision).toMatchObject({
      schemaVersion: "topic-page-content-revision/v1",
      attempt: 2,
      review: {
        source: "review-agent",
        issues: [{
          code: "generic-theme-copy",
          moduleId: "hero",
          message: "Explain what makes this topic distinct for a first-time shopper.",
        }],
      },
    });
    expect(result).toMatchObject({
      contentAttempt: {
        schemaVersion: "topic-page-content-attempt/v1",
        agentId: "fixture-content-agent",
        copyBriefDigest: expect.stringMatching(/^sha256:/),
        revision: {
          schemaVersion: "topic-page-content-revision/v1",
          attempt: 2,
          review: {
            source: "review-agent",
            reviewerAgentId: "fixture-content-review-agent",
            issues: [{ code: "generic-theme-copy", moduleId: "hero" }],
          },
        },
      },
    });
    expect(generatePageVisuals).toHaveBeenCalledOnce();
  });

  it("continues with advisory warnings when the bounded content rewrite still needs improvement", async () => {
    const data = workflowFixture();
    const proposePageContent = vi.fn(data.agents.content.proposePageContent);
    data.agents.content = { ...data.agents.content, proposePageContent };
    const generatePageVisuals = vi.fn(data.agents.visual.generatePageVisuals);
    data.agents.visual = { ...data.agents.visual, generatePageVisuals };
    const reviewPageContent = vi.fn(async (run: Parameters<
      TopicPageContentReviewAgent["reviewPageContent"]
    >[0]) => ({
      schemaVersion: "topic-page-content-review-proposal/v1" as const,
      contentSpecDigest: run.context.contentSpecDigest,
      copyBriefDigest: run.context.copyBriefDigest,
      backgroundEvidenceDigest: run.context.backgroundEvidenceDigest,
      verdict: "revision-required" as const,
      issues: [{
        code: "generic-theme-copy",
        severity: "error" as const,
        moduleId: "hero" as const,
        message: "Explain what makes this topic distinct for a first-time shopper.",
      }],
    }));
    data.agents.contentReview = {
      id: "fixture-content-review-agent",
      reviewPageContent,
    };

    const result = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      previewRefs: { desktop: "/", mobile: "/" },
    });

    expect(result).toMatchObject({
      status: "ready",
      stage: "review-ready",
      contentReview: {
        verdict: "approved",
        issues: [{
          code: "generic-theme-copy",
          severity: "warning",
          moduleId: "hero",
        }],
      },
    });
    expect(proposePageContent).toHaveBeenCalledTimes(2);
    expect(reviewPageContent).toHaveBeenCalledTimes(2);
    expect(generatePageVisuals).toHaveBeenCalledOnce();
    expect(data.put).toHaveBeenCalled();
  });

  it("continues with the valid ContentSpec when semantic review is unavailable", async () => {
    const data = workflowFixture();
    const proposePageContent = vi.fn(data.agents.content.proposePageContent);
    data.agents.content = { ...data.agents.content, proposePageContent };
    const generatePageVisuals = vi.fn(data.agents.visual.generatePageVisuals);
    data.agents.visual = { ...data.agents.visual, generatePageVisuals };
    data.agents.contentReview = {
      id: "fixture-content-review-agent",
      reviewPageContent: async () => {
        throw new Error("Review service unavailable.");
      },
    };

    const result = await runTopicPageAutomationWorkflow({
      ...data,
      language: "zh",
      previewRefs: { desktop: "/", mobile: "/" },
    });

    expect(result).toMatchObject({
      status: "ready",
      stage: "review-ready",
      contentReview: {
        verdict: "approved",
        issues: [{
          code: "content-review-advisory-1",
          severity: "warning",
          message: "Review service unavailable.",
        }],
      },
    });
    expect(proposePageContent).toHaveBeenCalledOnce();
    expect(generatePageVisuals).toHaveBeenCalledOnce();
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
      stage: "review-ready",
      assetManifest: { productionMode: "source-product-images" },
      qaReport: {
        status: "passed",
        checks: expect.arrayContaining([
          expect.objectContaining({ id: "visual-policy", status: "failed" }),
        ]),
        issues: expect.arrayContaining([
          "Source-product image composition is a draft-quality fallback; review visual quality before publication.",
        ]),
      },
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

  it("fills invalid Content Agent output with deterministic Host copy", async () => {
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
      status: "ready",
      stage: "review-ready",
      issues: expect.arrayContaining([
        "Content Agent output was replaced with deterministic Host copy.",
      ]),
      contentSpec: {
        status: "content-ready",
        tasks: expect.any(Array),
      },
      contentAttempt: {
        schemaVersion: "topic-page-content-attempt/v1",
        agentId: "invalid-content-agent",
        proposal: rejectedProposal,
        proposalReview: { status: "rejected" },
      },
    });
    expect(proposeModuleMerchandising).toHaveBeenCalledOnce();
    expect(revisedProposal).toBeDefined();
  });

  it("uses deterministic Host copy when the Content Agent fails", async () => {
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
      status: "ready",
      stage: "review-ready",
      issues: expect.arrayContaining([
        "Content Agent failed while preparing a proposal.",
      ]),
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
