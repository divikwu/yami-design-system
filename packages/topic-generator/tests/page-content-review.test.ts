import { describe, expect, it, vi } from "vitest";

import {
  advanceTopicPageContentReviewRun,
  reviewTopicPageContentReviewDecision,
  runTopicPageContentReviewAgentWorkflow,
  topicAudienceContext,
  topicBackgroundEvidenceDigest,
  topicPageContentSpecDigest,
  topicPageCopyBriefDigest,
  type TopicBackgroundEvidenceBundle,
  type TopicPageContentReviewAgent,
  type TopicPageContentSpec,
  type TopicPageCopyBrief,
} from "../src/index.js";

function backgroundEvidenceFixture(): TopicBackgroundEvidenceBundle {
  const bundle = {
    schemaVersion: "topic-background-evidence/v1" as const,
    status: "ready" as const,
    keyword: "Matcha",
    site: "us" as const,
    language: "zh" as const,
    themeIntentDigest: "sha256:intent",
    sources: [{
      id: "source:matcha",
      type: "wikipedia" as const,
      title: "Matcha",
      url: "https://en.wikipedia.org/wiki/Matcha",
      publisher: "Wikipedia",
    }],
    claims: [{
      id: "claim:matcha-definition",
      type: "identity" as const,
      text: "Matcha is finely ground green tea.",
      sourceIds: ["source:matcha"],
      usage: "context-only" as const,
    }],
    issues: [],
  };
  return { ...bundle, digest: topicBackgroundEvidenceDigest(bundle) };
}

function copyBriefFixture(backgroundEvidence: TopicBackgroundEvidenceBundle): TopicPageCopyBrief {
  const brief = {
    schemaVersion: "topic-page-copy-brief/v2" as const,
    audienceContext: topicAudienceContext("zh"),
    pageProposition: "帮助第一次接触抹茶的用户理解并搭配日常仪式",
    newcomerQuestions: ["这个主题是什么？", "我应该从哪个场景开始？"],
    moduleObjectives: [
      {
        taskId: "content-hero",
        moduleId: "hero" as const,
        objective: "说明抹茶是什么",
        shoppingGoal: "介绍主题",
      },
      {
        taskId: "content-start-here",
        moduleId: "start-here" as const,
        objective: "解释日常场景",
        shoppingGoal: "从日常冲泡开始",
      },
    ],
    backgroundEvidenceDigest: backgroundEvidence.digest,
    backgroundEvidenceStatus: "ready" as const,
    evidenceRules: [
      "background-context-does-not-prove-product-performance",
      "catalog-evidence-does-not-prove-popularity",
      "every-claim-requires-an-explicit-reference",
    ] as const,
  };
  return { ...brief, digest: topicPageCopyBriefDigest(brief) };
}

function brandCopyBriefFixture(
  backgroundEvidence: TopicBackgroundEvidenceBundle,
): TopicPageCopyBrief {
  const base = copyBriefFixture(backgroundEvidence);
  const { schemaVersion: _schemaVersion, digest: _digest, ...shared } = base;
  void _schemaVersion;
  void _digest;
  const brief = {
    ...shared,
    schemaVersion: "topic-page-copy-brief/v3" as const,
    heroStrategy: {
      kind: "brand" as const,
      titleFocus: "Express an evidence-supported brand position.",
      descriptionFocus: "Connect the brand idea to available choices.",
    },
    topicSignature: {
      primaryClaimId: "claim:matcha-definition",
      supportingClaimIds: [],
      usage: "preferred-topic-context-only" as const,
    },
    localizationStrategy: {
      requestedLanguage: "zh" as const,
      supportedLanguages: ["zh", "en"] as const,
      generationMode: "separate-proposals" as const,
      adaptation: "locale-native-not-literal" as const,
    },
  };
  return { ...brief, digest: topicPageCopyBriefDigest(brief) };
}

function contentSpecFixture(
  backgroundEvidence: TopicBackgroundEvidenceBundle,
  copyBrief: TopicPageCopyBrief,
): TopicPageContentSpec {
  const spec = {
    schemaVersion: "topic-page-content-spec/v1" as const,
    status: "content-ready" as const,
    keyword: "Matcha",
    site: "us" as const,
    language: "zh" as const,
    strategyRef: "category-role/landing-page-agent@1" as const,
    templateRef: "topic-landing/topic@2",
    topicPagePlanDigest: "sha256:plan",
    themeIntentDigest: "sha256:intent",
    productSelectionDigest: "sha256:selection",
    audienceContext: copyBrief.audienceContext,
    backgroundEvidenceDigest: backgroundEvidence.digest,
    copyBriefDigest: copyBrief.digest,
    tasks: [
      {
        taskId: "content-hero",
        moduleId: "hero" as const,
        component: "ThemeHero" as const,
        copy: {
          title: { text: "第一次认识抹茶", evidenceRefs: ["background:claim:matcha-definition"] },
          description: {
            text: "先理解抹茶，再按冲泡场景挑选茶粉、搭配与工具。",
            evidenceRefs: ["background:claim:matcha-definition", "theme-intent:scenario:matcha"],
          },
          tags: [
            { text: "抹茶入门", evidenceRefs: ["background:claim:matcha-definition"] },
            { text: "按场景选", evidenceRefs: ["theme-intent:scenario:matcha"] },
          ],
        },
      },
      {
        taskId: "content-start-here",
        moduleId: "start-here" as const,
        component: "ThemeProductList" as const,
        copy: {
          title: { text: "从日常冲泡开始", evidenceRefs: ["scene:daily"] },
          scenes: [{
            sceneId: "daily",
            label: { text: "日常冲泡", evidenceRefs: ["scene:daily"] },
            title: { text: "茶粉、搭配与工具一次看懂", evidenceRefs: ["scene:daily"] },
            description: {
              text: "按准备、冲泡和享用的顺序比较这一场景里的商品。",
              evidenceRefs: ["scene:daily"],
            },
          }],
        },
      },
    ],
  };
  return { ...spec, digest: topicPageContentSpecDigest(spec) };
}

describe("TopicPageContentReview", () => {
  it("requests a bounded independent review before visual generation", () => {
    const backgroundEvidence = backgroundEvidenceFixture();
    const copyBrief = copyBriefFixture(backgroundEvidence);
    const contentSpec = contentSpecFixture(backgroundEvidence, copyBrief);
    const run = advanceTopicPageContentReviewRun({
      contentSpec,
      copyBrief,
      backgroundEvidence,
    });

    expect(run).toMatchObject({
      status: "needs-content-review-proposal",
      context: {
        contentSpecDigest: contentSpec.digest,
        qualityPolicy: "advisory-optimize-never-block",
        criteria: [
          "newcomer-orientation",
          "theme-specificity",
          "scene-specificity",
          "shopping-decision-usefulness",
          "module-differentiation",
          "evidence-claim-alignment",
          "language-quality",
          "consumer-relevance",
          "editorial-quality",
          "meta-navigation-avoidance",
          "module-redundancy-avoidance",
        ],
      },
    });
  });

  it("adds brand distinctiveness to the final review criteria", () => {
    const backgroundEvidence = backgroundEvidenceFixture();
    const copyBrief = brandCopyBriefFixture(backgroundEvidence);
    const contentSpec = contentSpecFixture(backgroundEvidence, copyBrief);
    const run = advanceTopicPageContentReviewRun({
      contentSpec,
      copyBrief,
      backgroundEvidence,
    });

    expect(run).toMatchObject({
      status: "needs-content-review-proposal",
      context: {
        criteria: expect.arrayContaining(["brand-distinctiveness"]),
      },
    });
  });

  it("exposes the reviewed primary locale as a semantic alignment reference", () => {
    const backgroundEvidence = backgroundEvidenceFixture();
    const copyBrief = brandCopyBriefFixture(backgroundEvidence);
    const contentSpec = contentSpecFixture(backgroundEvidence, copyBrief);
    const run = advanceTopicPageContentReviewRun({
      contentSpec,
      copyBrief,
      backgroundEvidence,
      localizationReference: {
        language: "en",
        contentSpec: structuredClone(contentSpec),
        alignmentPolicy: "same-shopper-meaning-locale-native",
      },
    });

    expect(run).toMatchObject({
      status: "needs-content-review-proposal",
      context: {
        criteria: expect.arrayContaining(["cross-locale-semantic-alignment"]),
        localizationReference: {
          language: "en",
          alignmentPolicy: "same-shopper-meaning-locale-native",
          contentSpec: { digest: contentSpec.digest },
        },
      },
    });
  });

  it("keeps invalid content bindings structural instead of treating them as copy quality", async () => {
    const backgroundEvidence = backgroundEvidenceFixture();
    const copyBrief = copyBriefFixture(backgroundEvidence);
    const contentSpec = contentSpecFixture(backgroundEvidence, copyBrief);
    contentSpec.digest = "sha256:stale";
    const reviewPageContent = vi.fn();
    const result = await runTopicPageContentReviewAgentWorkflow({
      contentSpec,
      copyBrief,
      backgroundEvidence,
      agent: { id: "content-review", reviewPageContent },
    });

    expect(reviewPageContent).not.toHaveBeenCalled();
    expect(result.run).toMatchObject({
      status: "blocked",
      faultKind: "structural-invalid",
      issues: ["TopicPageContentSpec digest is invalid."],
    });
  });

  it("passes deterministic copy-quality findings to the Review Agent as advisory warnings", async () => {
    const backgroundEvidence = backgroundEvidenceFixture();
    const copyBrief = copyBriefFixture(backgroundEvidence);
    const contentSpec = contentSpecFixture(backgroundEvidence, copyBrief);
    contentSpec.tasks[0]!.copy.title.evidenceRefs = ["theme-intent:scenario:matcha"];
    contentSpec.tasks[0]!.copy.description!.evidenceRefs = ["theme-intent:scenario:matcha"];
    contentSpec.tasks[1]!.copy.title.text = contentSpec.tasks[0]!.copy.title.text;
    contentSpec.digest = topicPageContentSpecDigest(contentSpec);
    const reviewPageContent = vi.fn<TopicPageContentReviewAgent["reviewPageContent"]>(
      async (run) => ({
        schemaVersion: "topic-page-content-review-proposal/v1",
        contentSpecDigest: run.context.contentSpecDigest,
        copyBriefDigest: run.context.copyBriefDigest,
        backgroundEvidenceDigest: run.context.backgroundEvidenceDigest,
        verdict: "approved",
        issues: [],
      }),
    );
    const result = await runTopicPageContentReviewAgentWorkflow({
      contentSpec,
      copyBrief,
      backgroundEvidence,
      agent: {
        id: "topic-page-agent",
        reviewerAgentId: "topic-content-review",
        reviewPageContent,
      },
    });

    expect(reviewPageContent).toHaveBeenCalledOnce();
    expect(reviewPageContent.mock.calls[0]?.[0].context.advisoryWarnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "hero-background-context-missing" }),
        expect.objectContaining({ code: "duplicate-module-title" }),
      ]),
    );
    expect(result.run).toMatchObject({
      status: "ready",
      decision: {
        verdict: "approved",
        issues: expect.arrayContaining([
          expect.objectContaining({
            code: "hero-background-context-missing",
            severity: "warning",
          }),
          expect.objectContaining({ code: "duplicate-module-title", severity: "warning" }),
        ]),
      },
    });
  });

  it("accepts an approved semantic review bound to the ContentSpec", async () => {
    const backgroundEvidence = backgroundEvidenceFixture();
    const copyBrief = copyBriefFixture(backgroundEvidence);
    const contentSpec = contentSpecFixture(backgroundEvidence, copyBrief);
    const reviewPageContent = vi.fn<TopicPageContentReviewAgent["reviewPageContent"]>(
      async () => ({
        schemaVersion: "topic-page-content-review-proposal/v1",
        contentSpecDigest: contentSpec.digest,
        copyBriefDigest: copyBrief.digest,
        backgroundEvidenceDigest: backgroundEvidence.digest,
        verdict: "approved",
        issues: [],
      }),
    );
    const result = await runTopicPageContentReviewAgentWorkflow({
      contentSpec,
      copyBrief,
      backgroundEvidence,
      agent: {
        id: "topic-page-agent",
        reviewerAgentId: "topic-content-review",
        reviewPageContent,
      },
    });

    expect(reviewPageContent).toHaveBeenCalledOnce();
    expect(result.run).toMatchObject({
      status: "ready",
      decision: {
        schemaVersion: "topic-page-content-review/v1",
        verdict: "approved",
        reviewerAgentId: "topic-content-review",
      },
    });
    if (result.run.status !== "ready") throw new Error("Expected approved content review.");
    expect(reviewTopicPageContentReviewDecision({
      contentSpec,
      copyBrief,
      backgroundEvidence,
    }, result.run.decision)).toEqual([]);
    expect(reviewTopicPageContentReviewDecision({
      contentSpec,
      copyBrief,
      backgroundEvidence,
    }, {
      ...result.run.decision,
      contentSpecDigest: "sha256:stale",
    })).toEqual(expect.arrayContaining([
      "Content review contentSpecDigest does not match TopicPageContentSpec.",
      "Content review decision digest is invalid.",
    ]));
  });

  it("returns actionable revision issues to content-writing only", async () => {
    const backgroundEvidence = backgroundEvidenceFixture();
    const copyBrief = copyBriefFixture(backgroundEvidence);
    const contentSpec = contentSpecFixture(backgroundEvidence, copyBrief);
    const agent: TopicPageContentReviewAgent = {
      id: "content-review",
      reviewPageContent: async () => ({
        schemaVersion: "topic-page-content-review-proposal/v1",
        contentSpecDigest: contentSpec.digest,
        copyBriefDigest: copyBrief.digest,
        backgroundEvidenceDigest: backgroundEvidence.digest,
        verdict: "revision-required",
        issues: [{
          code: "generic-theme-copy",
          severity: "error",
          moduleId: "hero",
          message: "Explain what makes this topic distinct for a first-time shopper.",
        }],
      }),
    };
    const result = await runTopicPageContentReviewAgentWorkflow({
      contentSpec,
      copyBrief,
      backgroundEvidence,
      agent,
    });

    expect(result.run).toMatchObject({
      status: "blocked",
      rollbackStage: "content-writing",
      issues: ["Hero: Explain what makes this topic distinct for a first-time shopper."],
    });
  });
});
