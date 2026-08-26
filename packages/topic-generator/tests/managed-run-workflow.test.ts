import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  compileTopicPageGenerationSpec: vi.fn(),
  compileTopicPageReviewPackage: vi.fn(),
  runTopicPageQa: vi.fn(),
  runTopicBackgroundEvidenceAgentWorkflow: vi.fn(),
  runTopicContentAgentWorkflow: vi.fn(),
  runTopicPageContentApprovalWorkflow: vi.fn(),
  runPageMerchandisingAgentWorkflow: vi.fn(),
  runTopicPageReviewAgentWorkflow: vi.fn(),
}));

vi.mock("../src/page-generation/index.js", async (importOriginal) => ({
  ...await importOriginal<typeof import("../src/page-generation/index.js")>(),
  compileTopicPageGenerationSpec: mocks.compileTopicPageGenerationSpec,
  compileTopicPageReviewPackage: mocks.compileTopicPageReviewPackage,
  runTopicPageQa: mocks.runTopicPageQa,
}));

vi.mock("../src/background-evidence/index.js", async (importOriginal) => ({
  ...await importOriginal<typeof import("../src/background-evidence/index.js")>(),
  runTopicBackgroundEvidenceAgentWorkflow: mocks.runTopicBackgroundEvidenceAgentWorkflow,
}));

vi.mock("../src/page-content/index.js", async (importOriginal) => ({
  ...await importOriginal<typeof import("../src/page-content/index.js")>(),
  runTopicContentAgentWorkflow: mocks.runTopicContentAgentWorkflow,
  runTopicPageContentApprovalWorkflow: mocks.runTopicPageContentApprovalWorkflow,
}));

vi.mock("../src/page-merchandising/index.js", async (importOriginal) => ({
  ...await importOriginal<typeof import("../src/page-merchandising/index.js")>(),
  runPageMerchandisingAgentWorkflow: mocks.runPageMerchandisingAgentWorkflow,
}));

vi.mock("../src/page-review/index.js", async (importOriginal) => ({
  ...await importOriginal<typeof import("../src/page-review/index.js")>(),
  runTopicPageReviewAgentWorkflow: mocks.runTopicPageReviewAgentWorkflow,
}));

import { createTopicGeneratorManagedStageExecutor } from "../src/managed-run/workflow.js";

describe("Topic Generator managed stage executor", () => {
  it("projects reviewed Start Here scenes and assignments into both preview languages", async () => {
    const startHereModule = {
      id: "start-here",
      visible: true,
      productIds: ["product-1", "product-2"],
      productReasons: {},
      groups: [{
        id: "scenario-hypothesis-1",
        label: "基础日常护肤",
        role: "core",
        productIds: ["product-1", "product-2"],
        sourceCategoryIds: ["129"],
        shoppingGoal: "Build a daily routine.",
        scenarioReason: "The source products cover the routine.",
      }],
    };
    const plans = {
      en: { relevance: { modules: [structuredClone(startHereModule)] } },
      zh: { relevance: { modules: [structuredClone(startHereModule)] } },
    };
    const reviewedPlan = {
      digest: "sha256:plan",
      modules: [{
        id: "start-here",
        visible: true,
        reason: "Use the reviewed daily routine.",
        assignments: [{
          slotId: "start-here-1",
          productId: "product-1",
          pool: "primary",
          role: "core",
          sceneId: "daily-routine",
        }],
        scenes: [{
          id: "daily-routine",
          sourceSceneId: "scenario-hypothesis-1",
          shoppingGoal: "Build a reviewed daily routine.",
          reason: "One product is assigned to the reviewed scene.",
          productIds: ["product-1"],
        }],
      }],
    };
    mocks.runPageMerchandisingAgentWorkflow.mockResolvedValue({
      run: { status: "ready", plan: reviewedPlan },
      artifacts: {},
    });
    const outputs = {
      "topic-intent": { analysis: { intent: { id: "intent" } } },
      "product-selection": {
        executionPlan: {
          digest: "sha256:execution",
          selectionStrategyRef: "relevance/intent-themes@3",
          templateRef: "topic-landing/brand-relevance@2",
        },
        selection: { strategyRef: "relevance/intent-themes@3" },
        plans,
      },
    } as const;
    const execute = createTopicGeneratorManagedStageExecutor({
      topicPageAgent: { id: "topic-page-agent" },
      deliverableRenderer: { render: async () => "" },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "module-merchandising",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: {},
    } as never);

    expect(result).toMatchObject({
      status: "completed",
      output: {
        plans: {
          en: { relevance: { modules: [{ groups: [{
            id: "daily-routine",
            productIds: ["product-1"],
          }] }] } },
          zh: { relevance: { modules: [{ groups: [{
            id: "daily-routine",
            productIds: ["product-1"],
          }] }] } },
        },
      },
    });
  });

  it("collects localized background evidence for both content languages", async () => {
    mocks.runTopicBackgroundEvidenceAgentWorkflow.mockImplementation(async ({ language }) => ({
      bundle: { language, digest: `sha256:${language}-background`, issues: [] },
      run: { status: "ready", proposalReview: { proposal: { language } } },
    }));
    const outputs = {
      "topic-intent": {
        analysis: {
          intent: { id: "intent" },
          snapshot: { keyword: "matcha", site: "us" },
        },
      },
    } as const;
    const execute = createTopicGeneratorManagedStageExecutor({
      topicPageAgent: { id: "topic-page-agent" },
      deliverableRenderer: { render: async () => "" },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "background-evidence",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: {},
    } as never);

    expect(mocks.runTopicBackgroundEvidenceAgentWorkflow.mock.calls.map(([input]) => input.language))
      .toEqual(["zh", "en"]);
    expect(result).toMatchObject({
      status: "completed",
      output: {
        backgroundEvidence: { language: "zh", digest: "sha256:zh-background" },
        backgroundEvidenceByLanguage: {
          zh: { language: "zh", digest: "sha256:zh-background" },
          en: { language: "en", digest: "sha256:en-background" },
        },
      },
    });
  });

  it("keeps background-evidence warnings advisory and continues the managed run", async () => {
    mocks.runTopicBackgroundEvidenceAgentWorkflow.mockImplementation(async ({ language }) => ({
      bundle: {
        language,
        digest: `sha256:${language}-unavailable`,
        status: "unavailable",
        issues: ["Theme intent needs clarification before background research."],
      },
      run: {
        status: "blocked",
        issues: ["Theme intent needs clarification before background research."],
      },
    }));
    const outputs = {
      "topic-intent": {
        analysis: {
          intent: { id: "ambiguous-intent" },
          snapshot: { keyword: "Heytea", site: "us" },
        },
      },
    } as const;
    const execute = createTopicGeneratorManagedStageExecutor({
      topicPageAgent: { id: "topic-page-agent" },
      deliverableRenderer: { render: async () => "" },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "background-evidence",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: {},
    } as never);

    expect(result).toMatchObject({
      status: "completed",
      issues: [
        "zh: Theme intent needs clarification before background research.",
        "en: Theme intent needs clarification before background research.",
      ],
      output: {
        backgroundEvidenceByLanguage: {
          zh: { status: "unavailable" },
          en: { status: "unavailable" },
        },
      },
    });
  });

  it("keeps visual and accessibility QA findings advisory after page generation", async () => {
    mocks.runTopicPageQa.mockResolvedValue({
      status: "qa-blocked",
      digest: "sha256:qa",
      checks: [
        { id: "visual-policy", status: "failed", issueCount: 1 },
        { id: "accessibility-structure", status: "failed", issueCount: 1 },
      ],
      issues: ["Generated image composition needs review.", "Hero alt text needs review."],
    });
    const outputs = {
      "topic-intent": { analysis: { intent: { id: "intent" } } },
      "product-selection": { selection: { id: "selection" } },
      "module-merchandising": { plan: { digest: "sha256:plan" } },
      "content-review": { contentSpec: { digest: "sha256:content" } },
      "asset-persistence": { assetManifest: { digest: "sha256:assets" } },
      "page-generation": { generationSpec: { digest: "sha256:generation" } },
    } as const;
    const execute = createTopicGeneratorManagedStageExecutor({
      topicPageImageDecoder: { inspect: async () => null },
      deliverableRenderer: { render: async () => "" },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "automatic-qa",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: {},
    } as never);

    expect(result).toMatchObject({
      status: "completed",
      issues: ["Generated image composition needs review.", "Hero alt text needs review."],
      output: { qaReport: { status: "qa-blocked" } },
    });
  });

  it("finishes the generation path when only advisory QA prevents experience review", async () => {
    const outputs = {
      "product-selection": {
        executionPlan: { digest: "sha256:execution" },
      },
      "page-generation": {
        generationSpec: { digest: "sha256:generation" },
      },
      "automatic-qa": {
        qaReport: {
          status: "qa-blocked",
          digest: "sha256:qa",
          checks: [{ id: "visual-policy", status: "failed", issueCount: 1 }],
          issues: ["Generated image composition needs review."],
        },
      },
    } as const;
    const execute = createTopicGeneratorManagedStageExecutor({
      topicPageAgent: { id: "topic-page-agent" },
      topicPagePreviewResolver: async () => ({ desktop: "/desktop", mobile: "/mobile" }),
      deliverableRenderer: { render: async () => "" },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "experience-review",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: {},
    } as never);

    expect(result).toMatchObject({
      status: "completed",
      issues: ["Generated image composition needs review."],
      output: {
        qaAdvisoryIssues: ["Generated image composition needs review."],
      },
    });
  });

  it("keeps an unavailable experience reviewer advisory after hard QA", async () => {
    const outputs = {
      "product-selection": {
        executionPlan: { digest: "sha256:execution" },
      },
      "page-generation": {
        generationSpec: { digest: "sha256:generation" },
      },
      "automatic-qa": {
        qaReport: {
          status: "passed",
          digest: "sha256:qa",
          checks: [],
          issues: [],
        },
      },
    } as const;
    const execute = createTopicGeneratorManagedStageExecutor({
      deliverableRenderer: { render: async () => "" },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "experience-review",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: {},
    } as never);

    expect(result).toMatchObject({
      status: "completed",
      issues: ["Experience review was unavailable; hard QA remains authoritative."],
      output: {
        reviewAdvisoryIssues: [
          "Experience review was unavailable; hard QA remains authoritative.",
        ],
      },
    });
  });

  it("keeps an invalid experience-review proposal advisory after generation", async () => {
    mocks.runTopicPageReviewAgentWorkflow.mockResolvedValue({
      run: {
        status: "blocked",
        issues: ["Experience review proposal used an unknown evidence ref."],
      },
      artifacts: { proposal: { schemaVersion: "invalid-review/v1" } },
    });
    const outputs = {
      "product-selection": {
        executionPlan: { digest: "sha256:execution" },
      },
      "page-generation": {
        generationSpec: { digest: "sha256:generation" },
      },
      "automatic-qa": {
        qaReport: {
          status: "passed",
          digest: "sha256:qa",
          checks: [],
          issues: [],
        },
      },
    } as const;
    const execute = createTopicGeneratorManagedStageExecutor({
      topicPageAgent: { id: "topic-page-agent" },
      topicPagePreviewResolver: async () => ({ desktop: "/desktop", mobile: "/mobile" }),
      deliverableRenderer: { render: async () => "" },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "experience-review",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: {},
    } as never);

    expect(result).toMatchObject({
      status: "completed",
      issues: ["Experience review proposal used an unknown evidence ref."],
      output: {
        reviewAdvisoryIssues: ["Experience review proposal used an unknown evidence ref."],
      },
    });
  });

  it("continues from a successful experience review directly to automatic finalization", async () => {
    const decision = {
      status: "review-recommended",
      recommendation: "recommend-approval",
    };
    mocks.runTopicPageReviewAgentWorkflow.mockResolvedValue({
      run: { status: "ready", decision },
      artifacts: { proposal: { schemaVersion: "topic-page-experience-review-proposal/v1" } },
    });
    mocks.compileTopicPageReviewPackage.mockReturnValue({
      status: "review-ready",
      digest: "sha256:review-package",
    });
    const outputs = {
      "product-selection": { executionPlan: { digest: "sha256:execution" } },
      "page-generation": { generationSpec: { digest: "sha256:generation" } },
      "automatic-qa": {
        qaReport: {
          status: "passed",
          digest: "sha256:qa",
          checks: [],
          issues: [],
        },
      },
    } as const;
    const execute = createTopicGeneratorManagedStageExecutor({
      topicPageAgent: { id: "topic-page-agent" },
      topicPagePreviewResolver: async () => ({ desktop: "/desktop", mobile: "/mobile" }),
      deliverableRenderer: { render: async () => "" },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "experience-review",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: {},
    } as never);

    expect(result).toMatchObject({
      status: "completed",
      reviewPackageDigest: "sha256:review-package",
      output: { experienceReview: decision },
    });
    expect(result).not.toHaveProperty("runStatus");
  });

  it("generates independent Chinese and English content specs in one content-writing stage", async () => {
    mocks.runTopicContentAgentWorkflow.mockImplementation(async ({ language }) => ({
      run: {
        status: "ready",
        spec: { language, digest: `sha256:${language}-content` },
      },
      artifacts: { language },
    }));
    const outputs = {
      "topic-intent": { analysis: { intent: { id: "intent" } } },
      "background-evidence": {
        backgroundEvidence: { language: "zh", digest: "sha256:zh-background" },
        backgroundEvidenceByLanguage: {
          zh: { language: "zh", digest: "sha256:zh-background" },
          en: { language: "en", digest: "sha256:en-background" },
        },
      },
      "product-selection": { selection: { id: "selection" } },
      "module-merchandising": { plan: { digest: "sha256:plan" } },
    } as const;
    const topicPageAgent = { id: "topic-page-agent" };
    const execute = createTopicGeneratorManagedStageExecutor({
      topicPageAgent,
      deliverableRenderer: { render: async () => "" },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "content-writing",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: {},
    } as never);

    expect(mocks.runTopicContentAgentWorkflow.mock.calls.map(([input]) => input.language))
      .toEqual(["zh", "en"]);
    expect(mocks.runTopicContentAgentWorkflow.mock.calls.map(([input]) => input.selectorAgent))
      .toEqual([topicPageAgent, topicPageAgent]);
    expect(result).toMatchObject({
      status: "completed",
      output: {
        contentSpec: { language: "zh", digest: "sha256:zh-content" },
        contentByLanguage: {
          zh: { contentSpec: { language: "zh", digest: "sha256:zh-content" } },
          en: { contentSpec: { language: "en", digest: "sha256:en-content" } },
        },
      },
    });
  });

  it("persists the successful bounded rewrite attempt in content-review output", async () => {
    const initialContentSpec = { digest: "sha256:initial-content" };
    const englishContentSpec = { digest: "sha256:english-content" };
    const revisedContentSpec = { digest: "sha256:revised-content" };
    const reviewedEnglishContentSpec = { digest: "sha256:reviewed-english-content" };
    const revisionAttempt = {
      schemaVersion: "topic-page-content-attempt/v1",
      agentId: "topic-content",
      topicPagePlanDigest: "sha256:plan",
      themeIntentDigest: "sha256:intent",
      productSelectionDigest: "sha256:selection",
      backgroundEvidenceDigest: "sha256:background",
      copyBriefDigest: "sha256:brief",
      language: "zh",
      revision: {
        schemaVersion: "topic-page-content-revision/v1",
        attempt: 2,
        previousContentSpec: initialContentSpec,
        review: {
          source: "review-agent",
          contentSpecDigest: "sha256:initial-content",
          copyBriefDigest: "sha256:brief",
          backgroundEvidenceDigest: "sha256:background",
          reviewerAgentId: "topic-content-review",
          issues: [{
            code: "generic-theme-copy",
            severity: "error",
            moduleId: "hero",
            message: "Explain the topic identity.",
          }],
        },
      },
    };
    const copyBrief = { digest: "sha256:brief" };
    const contentReview = { verdict: "approved", digest: "sha256:review" };
    mocks.runTopicPageContentApprovalWorkflow.mockImplementation(async ({ language }) =>
      language === "zh"
        ? {
            status: "ready",
            contentSpec: revisedContentSpec,
            copyBrief,
            contentReview,
            revisionAttempt,
          }
        : {
            status: "ready",
            contentSpec: reviewedEnglishContentSpec,
            copyBrief: { digest: "sha256:english-brief" },
            contentReview: { verdict: "approved", digest: "sha256:english-review" },
          }
    );
    const outputs = {
      "topic-intent": { analysis: { intent: { id: "intent" } } },
      "background-evidence": {
        backgroundEvidence: { digest: "sha256:background" },
        backgroundEvidenceByLanguage: {
          zh: { digest: "sha256:background" },
          en: { digest: "sha256:english-background" },
        },
      },
      "product-selection": { selection: { id: "selection" } },
      "module-merchandising": { plan: { digest: "sha256:plan" } },
      "content-writing": {
        contentSpec: initialContentSpec,
        contentByLanguage: {
          zh: { contentSpec: initialContentSpec },
          en: { contentSpec: englishContentSpec },
        },
      },
    } as const;
    const render = vi.fn(async () => "<!doctype html><title>Content preview</title>");
    const execute = createTopicGeneratorManagedStageExecutor({
      topicPageAgent: { id: "topic-page-agent" },
      deliverableRenderer: { render },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "content-review",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: {},
    } as never);

    expect(mocks.runTopicPageContentApprovalWorkflow.mock.calls[0]?.[0])
      .not.toHaveProperty("localizationReference");
    expect(mocks.runTopicPageContentApprovalWorkflow.mock.calls[1]?.[0])
      .toMatchObject({
        language: "en",
        localizationReference: {
          language: "zh",
          contentSpec: revisedContentSpec,
        },
      });

    expect(result).toMatchObject({
      status: "completed",
      deliverables: {
        "page-draft.html": "<!doctype html><title>Content preview</title>",
      },
      output: {
        contentSpec: revisedContentSpec,
        copyBrief,
        contentReview,
        revisionAttempt,
        contentByLanguage: {
          zh: {
            contentSpec: revisedContentSpec,
            copyBrief,
            contentReview,
            revisionAttempt,
          },
          en: {
            contentSpec: reviewedEnglishContentSpec,
            copyBrief: { digest: "sha256:english-brief" },
            contentReview: { verdict: "approved", digest: "sha256:english-review" },
          },
        },
      },
    });
    expect(render).toHaveBeenCalledWith(expect.objectContaining({
      name: "page-draft.html",
      stages: expect.objectContaining({
        "content-review": expect.objectContaining({ contentSpec: revisedContentSpec }),
      }),
    }));
  });

  it("refreshes the downloadable preview after page generation", async () => {
    const generationSpec = {
      language: "zh",
      digest: "sha256:latest-page",
    };
    mocks.compileTopicPageGenerationSpec.mockReturnValue(generationSpec);
    const outputs = {
      "topic-intent": { analysis: { intent: { id: "intent" } } },
      "background-evidence": { backgroundEvidence: { digest: "sha256:background" } },
      "product-selection": { selection: { id: "selection" } },
      "module-merchandising": { plan: { digest: "sha256:plan" } },
      "content-review": { contentSpec: { digest: "sha256:content" } },
      "asset-persistence": { assetManifest: { digest: "sha256:assets" } },
    } as const;
    const render = vi.fn(async () => "<!doctype html><title>Latest page preview</title>");
    const execute = createTopicGeneratorManagedStageExecutor({
      deliverableRenderer: { render },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "page-generation",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: { publicUrl: (ref: string) => `/assets/${ref}` },
    } as never);

    expect(result).toMatchObject({
      status: "completed",
      output: { generationSpec },
      deliverables: {
        "page-draft.html": "<!doctype html><title>Latest page preview</title>",
      },
    });
    expect(render).toHaveBeenCalledWith(expect.objectContaining({
      name: "page-draft.html",
      stages: expect.objectContaining({
        "page-generation": { generationSpec },
      }),
    }));
  });

  it("persists an empty visual manifest without requiring an image decoder", async () => {
    const assetManifest = { digest: "sha256:empty-assets", assets: [] };
    const execute = createTopicGeneratorManagedStageExecutor({
      deliverableRenderer: { render: async () => "" },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "asset-persistence",
      attempt: 1,
      readStageResult: async () => ({ assetManifest, assetBodies: [] }),
      assetStore: { put: vi.fn() },
    } as never);

    expect(result).toMatchObject({
      status: "completed",
      output: { assetManifest, persistedRefs: [] },
    });
  });

  it("runs automatic QA for an image-free page without requiring an image decoder", async () => {
    const qaReport = { status: "passed", digest: "sha256:qa", checks: [], issues: [] };
    mocks.runTopicPageQa.mockResolvedValue(qaReport);
    const outputs = {
      "topic-intent": { analysis: { intent: { id: "intent" } } },
      "product-selection": { selection: { id: "selection" } },
      "module-merchandising": { plan: { digest: "sha256:plan" } },
      "content-review": { contentSpec: { digest: "sha256:content" } },
      "asset-persistence": { assetManifest: { digest: "sha256:empty-assets", assets: [] } },
      "page-generation": { generationSpec: { digest: "sha256:generation" } },
    } as const;
    const execute = createTopicGeneratorManagedStageExecutor({
      deliverableRenderer: { render: async () => "" },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "automatic-qa",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: {},
    } as never);

    expect(result).toMatchObject({ status: "completed", output: { qaReport } });
    expect(mocks.runTopicPageQa).toHaveBeenCalledWith(expect.objectContaining({
      imageDecoder: { inspect: expect.any(Function) },
    }));
  });

  it("automatically finalizes a QA-checked page without waiting for user approval", async () => {
    const outputs = {
      "automatic-qa": {
        qaReport: { status: "passed", digest: "sha256:qa", checks: [], issues: [] },
      },
      "experience-review": {
        reviewPackage: { digest: "sha256:review-package" },
      },
    } as const;
    const render = vi.fn(async () => "<!doctype html><title>Final page</title>");
    const execute = createTopicGeneratorManagedStageExecutor({
      deliverableRenderer: { render },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "user-approval",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: {},
    } as never);

    expect(result).toMatchObject({
      status: "completed",
      runStatus: "completed",
      output: {
        completion: "automatic",
        qaReportDigest: "sha256:qa",
        reviewPackageDigest: "sha256:review-package",
      },
      deliverables: {
        "page-final.html": "<!doctype html><title>Final page</title>",
      },
    });
    expect(render).toHaveBeenCalledWith(expect.objectContaining({
      name: "page-final.html",
      stages: expect.objectContaining({
        "automatic-qa": outputs["automatic-qa"],
        "experience-review": outputs["experience-review"],
      }),
    }));
  });
});
