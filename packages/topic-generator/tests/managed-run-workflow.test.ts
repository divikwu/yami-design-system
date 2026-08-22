import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  runTopicBackgroundEvidenceAgentWorkflow: vi.fn(),
  runTopicContentAgentWorkflow: vi.fn(),
  runTopicPageContentApprovalWorkflow: vi.fn(),
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

import { createTopicGeneratorManagedStageExecutor } from "../src/managed-run/workflow.js";

describe("Topic Generator managed stage executor", () => {
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
    const execute = createTopicGeneratorManagedStageExecutor({
      topicPageAgent: { id: "topic-page-agent" },
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
    const execute = createTopicGeneratorManagedStageExecutor({
      topicPageAgent: { id: "topic-page-agent" },
      deliverableRenderer: { render: async () => "" },
    } as never);

    const result = await execute({
      manifest: { request: { language: "zh" } },
      state: {},
      stageId: "content-review",
      attempt: 1,
      readStageResult: async (stageId: keyof typeof outputs) => outputs[stageId],
      assetStore: {},
    } as never);

    expect(result).toMatchObject({
      status: "completed",
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
  });
});
