import { describe, expect, it } from "vitest";
import sharp from "sharp";

import {
  advanceLandingPageOrchestrationRun,
  compileTopicPageGenerationSpec,
  compileTopicPageReviewPackage,
  productSelectionDigest,
  runTopicPageQa,
  sha256Bytes,
  sha256Digest,
  themeIntentDigest,
  topicPageAssetManifestDigest,
  topicPageContentSpecDigest,
  topicPageGenerationSpecDigest,
  topicPagePlanDigest,
  topicPageExperienceReviewDecisionDigest,
  type ProductSelectionResult,
  type ThemeIntent,
  type TopicPageAssetManifest,
  type TopicPageAssetReader,
  type TopicPageImageDecoder,
  type TopicPageContentSpec,
  type TopicPagePlanV2,
} from "../src/index.js";

const REAL_PNG_FIXTURES = {
  "1600x900": "iVBORw0KGgoAAAANSUhEUgAABkAAAAOEAQMAAADDg2/hAAAAA1BMVEXS3MiRRRwVAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAxklEQVR42u3BgQAAAADDoPlTX+EAVQEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwGsLCAAEUOY8tAAAAAElFTkSuQmCC",
  "1200x1200": "iVBORw0KGgoAAAANSUhEUgAABLAAAASwAQMAAADR7yGMAAAAA1BMVEXS3MiRRRwVAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAxklEQVR42u3BMQEAAADCoPVPbQlPoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgb8PuAAGXc2RaAAAAAElFTkSuQmCC",
} as const;

function pngFixture(size: keyof typeof REAL_PNG_FIXTURES) {
  return new Uint8Array(Buffer.from(REAL_PNG_FIXTURES[size], "base64"));
}

function withoutDigest<T extends object>(value: T) {
  const copy = { ...value } as T & { digest?: string };
  delete copy.digest;
  return copy;
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

function fixture() {
  const intent: ThemeIntent = {
    schemaVersion: "theme-intent/v2",
    source: "catalog-evidence",
    themeType: "activity",
    catalogDomain: "grocery",
    attributeSchemaVersion: "catalog-v1",
    entityType: "scenario",
    canonicalEntity: null,
    shoppingIntent: "assemble-scenario",
    shopperAction: "bundle",
    shoppingGoal: "Build a matcha ritual",
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
    strategyRef: "relevance/default@1",
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
  const planBase = {
    schemaVersion: "topic-page-plan/v2" as const,
    status: "plan-ready" as const,
    keyword: "Matcha",
    site: "us" as const,
    strategyRef: "relevance/default@1" as const,
    templateRef: "topic-landing/relevance@1" as const,
    themeIntentDigest: themeIntentDigest(intent),
    productSelectionDigest: productSelectionDigest(selection),
    moduleOrder: ["hero"] as const,
    modules: [{
      id: "hero" as const,
      component: "ThemeHero" as const,
      visible: true,
      shoppingGoal: "Introduce matcha",
      reason: "The assigned product is the strongest catalog match.",
      assignments: [{
        slotId: "hero-1",
        productId: "matcha-1",
        pool: "primary" as const,
        role: "core" as const,
      }],
      scenes: [],
      contentTaskId: "content-hero",
      assetTaskIds: ["asset-hero"],
    }],
    productReusePolicy: {
      crossModule: "requires-reason" as const,
      withinScene: "forbidden" as const,
    },
  };
  const plan: TopicPagePlanV2 = {
    ...planBase,
    moduleOrder: [...planBase.moduleOrder],
    digest: topicPagePlanDigest(planBase),
  };
  const contentBase = {
    schemaVersion: "topic-page-content-spec/v1" as const,
    status: "content-ready" as const,
    keyword: "Matcha",
    site: "us" as const,
    language: "zh" as const,
    strategyRef: plan.strategyRef,
    templateRef: plan.templateRef,
    topicPagePlanDigest: plan.digest,
    themeIntentDigest: plan.themeIntentDigest,
    productSelectionDigest: plan.productSelectionDigest,
    tasks: [{
      taskId: "content-hero",
      moduleId: "hero" as const,
      component: "ThemeHero" as const,
      copy: {
        title: { text: "开启抹茶日常", evidenceRefs: ["theme-intent:matcha"] },
        description: { text: "从一杯好抹茶开始。", evidenceRefs: ["product:matcha-1"] },
        tags: [
          { text: "抹茶", evidenceRefs: ["theme-intent:matcha"] },
          { text: "日常仪式", evidenceRefs: ["product:matcha-1"] },
        ],
      },
    }],
  };
  const contentSpec: TopicPageContentSpec = {
    ...contentBase,
    digest: topicPageContentSpecDigest(contentBase),
  };
  const bytes = pngFixture("1600x900");
  const manifestBase = {
    schemaVersion: "topic-page-asset-manifest/v1" as const,
    status: "asset-manifest-ready" as const,
    keyword: "Matcha",
    site: "us" as const,
    language: "zh" as const,
    strategyRef: plan.strategyRef,
    templateRef: plan.templateRef,
    topicPagePlanDigest: plan.digest,
    topicPageContentSpecDigest: contentSpec.digest,
    themeIntentDigest: plan.themeIntentDigest,
    productSelectionDigest: plan.productSelectionDigest,
    productionMode: "generated-images" as const,
    assets: [{
      taskId: "asset-hero",
      moduleId: "hero" as const,
      component: "ThemeHero" as const,
      kind: "hero-image" as const,
      direction: {
        prompt: "Sunlit matcha scene",
        evidenceRefs: [
          "theme-intent:matcha",
          "product:matcha-1",
          "content-task:content-hero",
        ],
        referenceProductIds: ["matcha-1"],
        generationProvenance: {
          provider: "fixture-native",
          modelSource: "unreported" as const,
          attempts: 1,
          cacheHit: false,
        },
      },
      altText: {
        language: "zh" as const,
        text: "阳光下的一杯抹茶",
        evidenceRefs: ["theme-intent:matcha"],
      },
      artifact: {
        ref: "assets/hero.png",
        mimeType: "image/png" as const,
        width: 1600,
        height: 900,
        digest: sha256Bytes(bytes),
        focalPoint: { x: 0.5, y: 0.5 },
        backgroundColor: "#dfe3d4",
      },
    }],
  };
  const manifest: TopicPageAssetManifest = {
    ...manifestBase,
    digest: topicPageAssetManifestDigest(manifestBase),
  };
  const bodies = new Map([["assets/hero.png", bytes]]);
  const reader: TopicPageAssetReader = {
    get: async (ref) => {
      const value = bodies.get(ref);
      if (!value) throw new Error(`Missing ${ref}`);
      return value;
    },
  };
  return { intent, selection, plan, contentSpec, manifest, bytes, bodies, reader, imageDecoder };
}

function executionPlanFor(data: ReturnType<typeof fixture>) {
  const task = advanceLandingPageOrchestrationRun({
    intent: data.intent,
    keyword: data.selection.keyword,
    site: data.selection.site,
    language: data.contentSpec.language,
    requestedSelectionStrategyRef: data.selection.strategyRef,
  });
  if (task.status !== "needs-execution-plan-proposal") {
    throw new Error("Expected an orchestration proposal task.");
  }
  const run = advanceLandingPageOrchestrationRun({
    intent: data.intent,
    keyword: data.selection.keyword,
    site: data.selection.site,
    language: data.contentSpec.language,
    requestedSelectionStrategyRef: data.selection.strategyRef,
    proposal: {
      schemaVersion: "landing-page-execution-plan-proposal/v1",
      keyword: task.context.keyword,
      site: task.context.site,
      language: task.context.language,
      themeIntentDigest: task.context.themeIntentDigest,
      requestedPageTypeRef: null,
      requestedSelectionStrategyRef: data.selection.strategyRef,
      pageTypeRef: "landing-page/campaign@1",
      selectionStrategyRef: data.selection.strategyRef,
      templateRef: data.plan.templateRef,
      reason: "Use the registered campaign relevance route for this activity fixture.",
    },
  });
  if (run.status !== "ready") throw new Error("Expected a ready execution plan.");
  return run.plan;
}

function groupedFixture() {
  const data = fixture();
  const selection: ProductSelectionResult = {
    ...data.selection,
    modules: [{
      id: "popular-picks",
      productIds: ["matcha-1"],
      groups: [{
        id: "all",
        label: "全部",
        productIds: ["matcha-1"],
      }, {
        id: "matcha-powder",
        label: "抹茶粉",
        productIds: ["matcha-1"],
      }],
    }],
  };
  const planBase = {
    ...data.plan,
    productSelectionDigest: productSelectionDigest(selection),
    moduleOrder: ["hero", "popular-picks"] as const,
    modules: [...data.plan.modules, {
      id: "popular-picks" as const,
      component: "ProductList" as const,
      visible: true,
      shoppingGoal: "Surface popular matcha products",
      reason: "The frozen selection contains a popular group.",
      assignments: [{
        slotId: "popular-picks-1",
        productId: "matcha-1",
        pool: "primary" as const,
        role: "core" as const,
      }],
      scenes: [],
      contentTaskId: "content-popular-picks",
      assetTaskIds: [],
    }],
  };
  const planWithoutDigest = withoutDigest(planBase);
  const plan: TopicPagePlanV2 = {
    ...planWithoutDigest,
    moduleOrder: [...planBase.moduleOrder],
    digest: topicPagePlanDigest(planWithoutDigest),
  };
  const contentBase = {
    ...data.contentSpec,
    topicPagePlanDigest: plan.digest,
    productSelectionDigest: plan.productSelectionDigest,
    tasks: [...data.contentSpec.tasks, {
      taskId: "content-popular-picks",
      moduleId: "popular-picks" as const,
      component: "ProductList" as const,
      copy: {
        title: { text: "热门精选", evidenceRefs: ["product:matcha-1"] },
        groups: [{
          groupId: "all",
          label: { text: "全部商品", evidenceRefs: ["product:matcha-1"] },
        }, {
          groupId: "matcha-powder",
          label: { text: "纯抹茶粉", evidenceRefs: ["product:matcha-1"] },
        }],
      },
    }],
  };
  const contentWithoutDigest = withoutDigest(contentBase);
  const contentSpec: TopicPageContentSpec = {
    ...contentWithoutDigest,
    digest: topicPageContentSpecDigest(contentWithoutDigest),
  };
  const manifestBase = {
    ...data.manifest,
    topicPagePlanDigest: plan.digest,
    topicPageContentSpecDigest: contentSpec.digest,
    productSelectionDigest: plan.productSelectionDigest,
  };
  const manifestWithoutDigest = withoutDigest(manifestBase);
  const manifest: TopicPageAssetManifest = {
    ...manifestWithoutDigest,
    digest: topicPageAssetManifestDigest(manifestWithoutDigest),
  };
  return { ...data, selection, plan, contentSpec, manifest };
}

describe("PageGenerationSpec and final automatic QA", () => {
  it("freezes copy, products, and generated assets into a renderable spec", () => {
    const data = fixture();
    const spec = compileTopicPageGenerationSpec({
      ...data,
      assetUrl: (ref) => `/api/topic-generator/assets?ref=${encodeURIComponent(ref)}`,
    });

    expect(spec).toMatchObject({
      schemaVersion: "topic-page-generation-spec/v1",
      status: "generation-ready",
      bindings: {
        topicPagePlanDigest: data.plan.digest,
        topicPageContentSpecDigest: data.contentSpec.digest,
        topicPageAssetManifestDigest: data.manifest.digest,
      },
      modules: [{
        id: "hero",
        component: "ThemeHero",
        copy: { title: { text: "开启抹茶日常" } },
        products: [{ id: "matcha-1", title: "Ceremonial Matcha" }],
        assets: [{
          taskId: "asset-hero",
          url: "/api/topic-generator/assets?ref=assets%2Fhero.png",
        }],
      }],
    });
    expect(spec.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("freezes ProductSelection groups into generated product modules", () => {
    const data = groupedFixture();

    const spec = compileTopicPageGenerationSpec({
      ...data,
      assetUrl: (ref) => `/assets?ref=${encodeURIComponent(ref)}`,
    });

    expect(spec.modules.find(({ id }) => id === "popular-picks")?.groups).toEqual([
      { id: "all", label: "全部商品", productIds: ["matcha-1"] },
      { id: "matcha-powder", label: "纯抹茶粉", productIds: ["matcha-1"] },
    ]);
  });

  it("blocks final QA when generated product groups drift from ProductSelection", async () => {
    const data = groupedFixture();
    const generationSpec = compileTopicPageGenerationSpec({
      ...data,
      assetUrl: (ref) => `/assets?ref=${encodeURIComponent(ref)}`,
    });
    const popular = generationSpec.modules.find(({ id }) => id === "popular-picks")!;
    popular.groups = [{ id: "all", label: "全部", productIds: [] }];
    generationSpec.digest = topicPageGenerationSpecDigest(generationSpec);

    const qaReport = await runTopicPageQa({ ...data, generationSpec });

    expect(qaReport).toMatchObject({
      status: "qa-blocked",
      issues: expect.arrayContaining([
        "Generated module popular-picks groups do not match ProductSelectionResult.",
      ]),
    });
  });

  it("checks real bytes, MIME, dimensions, digests, bindings, and review readiness", async () => {
    const data = fixture();
    const generationSpec = compileTopicPageGenerationSpec({
      ...data,
      assetUrl: (ref) => `/api/topic-generator/assets?ref=${encodeURIComponent(ref)}`,
    });
    const qaReport = await runTopicPageQa({ ...data, generationSpec });
    const executionPlan = executionPlanFor(data);
    const experienceReviewBase = {
      schemaVersion: "topic-page-experience-review-decision/v1" as const,
      status: "review-recommended" as const,
      executionPlanDigest: executionPlan.digest,
      generationSpecDigest: generationSpec.digest,
      qaReportDigest: qaReport.digest,
      recommendation: "recommend-approval" as const,
      summary: "Ready for human review.",
      issues: [],
    };
    const experienceReview = {
      ...experienceReviewBase,
      digest: topicPageExperienceReviewDecisionDigest(experienceReviewBase),
    };
    const reviewPackage = compileTopicPageReviewPackage({
      executionPlan,
      generationSpec,
      qaReport,
      experienceReview,
      previewRefs: { desktop: "/?preview=desktop", mobile: "/?preview=mobile" },
    });

    expect(qaReport).toMatchObject({
      schemaVersion: "topic-page-qa-report/v1",
      status: "passed",
      issues: [],
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "bindings", status: "passed" }),
        expect.objectContaining({ id: "assets", status: "passed" }),
        expect.objectContaining({ id: "accessibility-structure", status: "passed" }),
      ]),
    });
    expect(reviewPackage).toMatchObject({
      schemaVersion: "topic-page-review-package/v1",
      status: "review-ready",
      executionPlanDigest: executionPlan.digest,
      generationSpecDigest: generationSpec.digest,
      qaReportDigest: qaReport.digest,
      experienceReviewDigest: experienceReview.digest,
    });

    const unboundReviewBase = {
      ...experienceReview,
      executionPlanDigest: `sha256:${"9".repeat(64)}`,
      digest: "",
    };
    const unboundReview = {
      ...unboundReviewBase,
      digest: topicPageExperienceReviewDecisionDigest(unboundReviewBase),
    };
    expect(() => compileTopicPageReviewPackage({
      executionPlan,
      generationSpec,
      qaReport,
      experienceReview: unboundReview,
      previewRefs: { desktop: "/?preview=desktop", mobile: "/?preview=mobile" },
    })).toThrow("ExperienceReview bound to ExecutionPlan and QAReport");
  });

  it("blocks generated assets without model provenance evidence", async () => {
    const data = fixture();
    const direction = data.manifest.assets[0]!.direction;
    delete direction.generationProvenance;
    data.manifest.digest = topicPageAssetManifestDigest(data.manifest);
    const generationSpec = compileTopicPageGenerationSpec({
      ...data,
      assetUrl: (ref) => `/assets?ref=${encodeURIComponent(ref)}`,
    });

    const qaReport = await runTopicPageQa({ ...data, generationSpec });

    expect(qaReport).toMatchObject({
      status: "qa-blocked",
      issues: expect.arrayContaining([
        "Generated asset asset-hero has no generation provenance.",
      ]),
    });
  });

  it("blocks review when persisted bytes no longer match the accepted manifest", async () => {
    const data = fixture();
    const generationSpec = compileTopicPageGenerationSpec({
      ...data,
      assetUrl: (ref) => `/assets?ref=${encodeURIComponent(ref)}`,
    });
    data.bodies.set("assets/hero.png", pngFixture("1200x1200"));

    const qaReport = await runTopicPageQa({ ...data, generationSpec });

    expect(qaReport).toMatchObject({
      status: "qa-blocked",
      issues: expect.arrayContaining([
        "Asset asset-hero byte digest does not match TopicPageAssetManifest.",
        "Asset asset-hero dimensions 1200x1200 do not match declared dimensions 1600x900.",
      ]),
    });
    expect(() => compileTopicPageReviewPackage({
      executionPlan: undefined as never,
      generationSpec,
      qaReport,
      experienceReview: undefined as never,
      previewRefs: { desktop: "/", mobile: "/" },
    })).toThrow("ReviewPackage requires a passed QAReport.");
  });

  it("keeps source-product compositions as draft fallback instead of final visual QA", async () => {
    const data = fixture();
    data.manifest.productionMode = "source-product-images";
    data.manifest.digest = topicPageAssetManifestDigest(data.manifest);
    const generationSpec = compileTopicPageGenerationSpec({
      ...data,
      assetUrl: (ref) => `/assets?ref=${encodeURIComponent(ref)}`,
    });

    const qaReport = await runTopicPageQa({ ...data, generationSpec });

    expect(qaReport).toMatchObject({
      status: "qa-blocked",
      checks: expect.arrayContaining([
        expect.objectContaining({ id: "visual-policy", status: "failed" }),
      ]),
      issues: expect.arrayContaining([
        "Source-product image composition is a draft fallback and cannot pass final visual QA.",
      ]),
    });
  });

  it("blocks review when a persisted image has a valid header but cannot be decoded", async () => {
    const data = fixture();
    const generationSpec = compileTopicPageGenerationSpec({
      ...data,
      assetUrl: (ref) => `/assets?ref=${encodeURIComponent(ref)}`,
    });
    data.bodies.set("assets/hero.png", data.bytes.slice(0, 24));

    const qaReport = await runTopicPageQa({ ...data, generationSpec });

    expect(qaReport).toMatchObject({
      status: "qa-blocked",
      issues: expect.arrayContaining([
        "Asset asset-hero is not a decodable PNG, JPEG, or WebP image.",
      ]),
    });
  });

  it("rejects digest drift before a generation spec can be emitted", () => {
    const data = fixture();
    data.contentSpec.topicPagePlanDigest = sha256Digest("stale");

    expect(() => compileTopicPageGenerationSpec({
      ...data,
      assetUrl: (ref) => ref,
    })).toThrow("TopicPageContentSpec topicPagePlanDigest does not match TopicPagePlan.");
  });
});
