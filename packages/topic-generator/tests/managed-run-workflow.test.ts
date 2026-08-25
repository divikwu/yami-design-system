import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  compileTopicPageGenerationSpec: vi.fn(),
  runTopicBackgroundEvidenceAgentWorkflow: vi.fn(),
  runTopicContentAgentWorkflow: vi.fn(),
  runTopicPageContentApprovalWorkflow: vi.fn(),
  runPageMerchandisingAgentWorkflow: vi.fn(),
}));

vi.mock("../src/page-generation/index.js", async (importOriginal) => ({
  ...await importOriginal<typeof import("../src/page-generation/index.js")>(),
  compileTopicPageGenerationSpec: mocks.compileTopicPageGenerationSpec,
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
});
