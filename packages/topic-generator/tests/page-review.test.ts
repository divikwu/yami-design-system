import { describe, expect, it, vi } from "vitest";

import {
  advanceTopicPageExperienceReviewRun,
  landingPageExecutionPlanDigest,
  runTopicPageReviewAgentWorkflow,
  topicPageGenerationSpecDigest,
  topicPageQaReportDigest,
  type LandingPageExecutionPlan,
  type TopicPageGenerationSpec,
  type TopicPageQaReport,
  type TopicPageReviewAgent,
} from "../src/index.js";

function reviewFixture() {
  const planBase = {
    schemaVersion: "landing-page-execution-plan/v1" as const,
    status: "execution-ready" as const,
    keyword: "ANUA",
    site: "us" as const,
    language: "zh" as const,
    themeIntentDigest: `sha256:${"1".repeat(64)}`,
    pageTypeRef: "landing-page/brand@1" as const,
    selectionStrategyRef: "relevance/default@1" as const,
    templateRef: "topic-landing/relevance@1" as const,
    workflowRef: "landing-page/default@1" as const,
    reason: "Registered route.",
    stages: [
      { id: "product-selection" as const, actor: "strategy-agent" as const, maxAttempts: 1 },
      { id: "module-merchandising" as const, actor: "strategy-agent" as const, maxAttempts: 1 },
      { id: "content-writing" as const, actor: "content-agent" as const, maxAttempts: 1 },
      { id: "visual-generation" as const, actor: "visual-agent" as const, maxAttempts: 1 },
      { id: "asset-persistence" as const, actor: "system" as const, maxAttempts: 1 },
      { id: "page-generation" as const, actor: "system" as const, maxAttempts: 1 },
      { id: "automatic-qa" as const, actor: "system" as const, maxAttempts: 1 },
      { id: "experience-review" as const, actor: "review-agent" as const, maxAttempts: 1 },
    ],
    allowedReviewRollbackStages: [
      "module-merchandising" as const,
      "content-writing" as const,
      "visual-generation" as const,
    ],
  };
  const executionPlan: LandingPageExecutionPlan = {
    ...planBase,
    digest: landingPageExecutionPlanDigest(planBase),
  };
  const generationBase = {
    schemaVersion: "topic-page-generation-spec/v1" as const,
    status: "generation-ready" as const,
    keyword: "ANUA",
    site: "us" as const,
    language: "zh" as const,
    strategyRef: "relevance/default@1" as const,
    templateRef: "topic-landing/relevance@1" as const,
    bindings: {
      themeIntentDigest: executionPlan.themeIntentDigest,
      productSelectionDigest: `sha256:${"2".repeat(64)}`,
      topicPagePlanDigest: `sha256:${"3".repeat(64)}`,
      topicPageContentSpecDigest: `sha256:${"4".repeat(64)}`,
      topicPageAssetManifestDigest: `sha256:${"5".repeat(64)}`,
    },
    moduleOrder: ["hero" as const],
    modules: [{
      id: "hero" as const,
      component: "ThemeHero" as const,
      shoppingGoal: "Introduce ANUA",
      reason: "Brand entry point.",
      copy: {
        title: { text: "ANUA 精选", evidenceRefs: ["product:anua-1"] },
        description: { text: "探索已验证商品。", evidenceRefs: ["product:anua-1"] },
        tags: [],
      },
      products: [{
        id: "anua-1",
        title: "ANUA Toner",
        brand: "ANUA",
        price: "$19.99",
        imageUrl: "https://example.com/anua.webp",
        productUrl: "https://example.com/anua",
        sourceRank: 1,
        pool: "primary" as const,
        role: "core" as const,
      }],
      scenes: [],
      assets: [{
        taskId: "asset-hero",
        kind: "hero-image" as const,
        ref: "assets/hero.png",
        url: "/api/topic-generator/assets?ref=assets%2Fhero.png",
        mimeType: "image/png" as const,
        width: 1600,
        height: 900,
        digest: `sha256:${"6".repeat(64)}`,
        focalPoint: { x: 0.5, y: 0.5 },
        altText: {
          language: "zh" as const,
          text: "ANUA 护肤主题场景",
          evidenceRefs: ["product:anua-1"],
        },
      }],
    }],
  };
  const generationSpec: TopicPageGenerationSpec = {
    ...generationBase,
    digest: topicPageGenerationSpecDigest(generationBase),
  };
  const qaBase = {
    schemaVersion: "topic-page-qa-report/v1" as const,
    status: "passed" as const,
    generationSpecDigest: generationSpec.digest,
    topicPageAssetManifestDigest: generationSpec.bindings.topicPageAssetManifestDigest,
    checks: [{ id: "sources" as const, status: "passed" as const, issueCount: 0 }],
    issues: [],
  };
  const qaReport: TopicPageQaReport = {
    ...qaBase,
    digest: topicPageQaReportDigest(qaBase),
  };
  return {
    executionPlan,
    generationSpec,
    qaReport,
    previewRefs: { desktop: "/?preview=desktop", mobile: "/?preview=mobile" },
  };
}

describe("Topic page experience review", () => {
  it("accepts a read-only approval recommendation bound to passed hard QA", () => {
    const fixture = reviewFixture();
    const pending = advanceTopicPageExperienceReviewRun(fixture);
    expect(pending).toMatchObject({
      schemaVersion: "topic-page-experience-review-run/v1",
      status: "needs-review-proposal",
      context: {
        qualityPolicy: "advisory-never-block-generation",
        visualPolicy: {
          assets: [{
            taskId: "asset-hero",
            moduleId: "hero",
            kind: "hero-image",
            priority: "scene-and-module-theme",
            productRole: "reference-only",
            blockingConditions: expect.arrayContaining([
              "product-grid-or-montage-used-as-hero",
              "product-appears-floating-or-lands-on-vertical-surface",
              "hero-primary-content-has-responsive-crop-risk",
            ]),
          }],
        },
      },
    });
    if (pending.status !== "needs-review-proposal") throw new Error("Expected review context.");

    const ready = advanceTopicPageExperienceReviewRun({
      ...fixture,
      proposal: {
        schemaVersion: "topic-page-experience-review-proposal/v1",
        executionPlanDigest: fixture.executionPlan.digest,
        generationSpecDigest: fixture.generationSpec.digest,
        qaReportDigest: fixture.qaReport.digest,
        recommendation: "recommend-approval",
        summary: "Content, imagery, and module intent are coherent for human review.",
        issues: [],
      },
    });

    expect(ready).toMatchObject({
      status: "ready",
      decision: {
        schemaVersion: "topic-page-experience-review-decision/v1",
        status: "review-recommended",
        recommendation: "recommend-approval",
        issues: [],
      },
    });
  });

  it("keeps experience-review quality findings advisory so generation can continue", () => {
    const fixture = reviewFixture();
    const result = advanceTopicPageExperienceReviewRun({
      ...fixture,
      proposal: {
        schemaVersion: "topic-page-experience-review-proposal/v1",
        executionPlanDigest: fixture.executionPlan.digest,
        generationSpecDigest: fixture.generationSpec.digest,
        qaReportDigest: fixture.qaReport.digest,
        recommendation: "request-revision",
        summary: "The hero message and image communicate different shopping goals.",
        issues: [{
          id: "hero-message-mismatch",
          severity: "blocking",
          scope: "content",
          moduleId: "hero",
          message: "Hero copy does not describe the visible product scene.",
          evidenceRefs: ["module:hero", "asset:asset-hero", "preview:desktop"],
          rollbackStage: "content-writing",
        }],
      },
    });

    expect(result).toMatchObject({
      status: "ready",
      decision: {
        status: "review-recommended",
        recommendation: "recommend-approval",
        issues: [{ severity: "warning" }],
      },
    });
    if (result.status !== "ready") throw new Error("Expected an advisory review decision.");
    expect(result.decision.issues[0]).not.toHaveProperty("rollbackStage");
  });

  it("rejects unsupported evidence and invokes the Review Agent only after hard QA", async () => {
    const fixture = reviewFixture();
    const reviewPageExperience = vi.fn<TopicPageReviewAgent["reviewPageExperience"]>(
      async (run) => ({
        schemaVersion: "topic-page-experience-review-proposal/v1",
        executionPlanDigest: run.context.executionPlanDigest,
        generationSpecDigest: run.context.generationSpec.digest,
        qaReportDigest: run.context.qaReport.digest,
        recommendation: "recommend-approval",
        summary: "Ready for human review.",
        issues: [],
      }),
    );
    const agent: TopicPageReviewAgent = { id: "topic-review", reviewPageExperience };
    const result = await runTopicPageReviewAgentWorkflow({ ...fixture, agent });
    expect(result.run.status).toBe("ready");
    expect(reviewPageExperience).toHaveBeenCalledTimes(1);

    const blocked = advanceTopicPageExperienceReviewRun({
      ...fixture,
      proposal: {
        schemaVersion: "topic-page-experience-review-proposal/v1",
        executionPlanDigest: fixture.executionPlan.digest,
        generationSpecDigest: fixture.generationSpec.digest,
        qaReportDigest: fixture.qaReport.digest,
        recommendation: "request-revision",
        summary: "Unsupported finding.",
        issues: [{
          id: "unsupported-evidence",
          severity: "blocking",
          scope: "visual",
          message: "Unknown visual evidence.",
          evidenceRefs: ["asset:not-declared"],
          rollbackStage: "visual-generation",
        }],
      },
    });
    expect(blocked).toMatchObject({
      status: "blocked",
      issues: ["Unsupported review evidence reference: asset:not-declared."],
    });
  });
});
