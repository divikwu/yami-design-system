import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  LandingPageExecutionPlan,
  TopicPageGenerationSpec,
  TopicPageQaReport,
} from "@yami/topic-generator";

vi.mock("server-only", () => ({}));

import { loadTopicGeneratorPageAutomationRuntime } from "./page-automation-runtime";
import { createConfiguredTopicPageReviewPreviewRegistry } from "./topic-page-review-preview-registry";

const roots: string[] = [];

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe("Topic Generator page automation runtime", () => {
  it("uses generated scene imagery by default and keeps source composition explicit", async () => {
    const generated = await loadTopicGeneratorPageAutomationRuntime({ environment: {} });
    expect(generated.visualProductionMode).toBe("generated-images");

    const sourceFallback = await loadTopicGeneratorPageAutomationRuntime({
      environment: { TOPIC_GENERATOR_VISUAL_PRODUCTION_MODE: "source-product-images" },
    });
    expect(sourceFallback.visualProductionMode).toBe("source-product-images");

    const invalid = await loadTopicGeneratorPageAutomationRuntime({
      environment: { TOPIC_GENERATOR_VISUAL_PRODUCTION_MODE: "product-grid" },
    });
    expect(invalid.visualProductionMode).toBe("generated-images");
    expect(invalid.pageAutomationConfigurationIssues).toContain(
      "TOPIC_GENERATOR_VISUAL_PRODUCTION_MODE must be generated-images or source-product-images.",
    );
  });

  it("allows a complete concurrent visual batch to finish bounded retries", async () => {
    const timeout = vi.spyOn(AbortSignal, "timeout")
      .mockReturnValue(new AbortController().signal);
    const runtime = await loadTopicGeneratorPageAutomationRuntime({
      environment: {
        TOPIC_GENERATOR_PAGE_AGENT_ENDPOINT: "http://127.0.0.1:4400/topic-page",
      },
      fetch: vi.fn(async () => Response.json({
        schemaVersion: "topic-page-agent-response/v1",
        stage: "workflow-planning",
        proposal: { schemaVersion: "landing-page-execution-plan-proposal/v1" },
      })),
    });

    await runtime.topicPageAgent?.proposeExecutionPlan({} as never);

    expect(timeout).toHaveBeenCalledWith(900_000);
  });

  it("uses dedicated background and content review identities by default", async () => {
    const requests: Array<{ stage: string; agentId: string }> = [];
    const runtime = await loadTopicGeneratorPageAutomationRuntime({
      environment: {
        TOPIC_GENERATOR_PAGE_AGENT_ENDPOINT: "http://127.0.0.1:4400/topic-page",
      },
      fetch: vi.fn(async (_input, init) => {
        const request = JSON.parse(String(init?.body)) as { stage: string; agentId: string };
        requests.push(request);
        return Response.json({
          schemaVersion: "topic-page-agent-response/v1",
          stage: request.stage,
          proposal: {},
        });
      }),
    });

    await runtime.topicPageAgent?.proposeBackgroundEvidence({} as never);
    await runtime.topicPageAgent?.reviewPageContent({} as never);

    expect(requests.map(({ stage, agentId }) => ({ stage, agentId }))).toEqual([
      { stage: "background-evidence", agentId: "topic-background-evidence" },
      { stage: "content-review", agentId: "topic-content-review" },
    ]);
    expect(runtime.topicPageAgent?.reviewerAgentId).toBe("topic-content-review");
  });

  it("publishes absolute local review previews from the configured asset root", async () => {
    const root = await mkdtemp(join(tmpdir(), "topic-page-runtime-"));
    roots.push(root);
    const environment = {
      TOPIC_GENERATOR_PAGE_AGENT_ENDPOINT: "http://127.0.0.1:3301/agents/run",
      TOPIC_GENERATOR_ASSET_ROOT: root,
      TOPIC_GENERATOR_PREVIEW_ORIGIN: "http://127.0.0.1:3300",
    };
    const runtime = await loadTopicGeneratorPageAutomationRuntime({ environment });
    const executionPlan = {
      schemaVersion: "landing-page-execution-plan/v1",
      status: "execution-ready",
      keyword: "Matcha",
      site: "us",
      language: "zh",
      themeIntentDigest: "sha256:intent",
      pageTypeRef: "landing-page/topic@2",
      selectionStrategyRef: "relevance/intent-themes@2",
      templateRef: "topic-landing/topic-relevance@1",
      workflowRef: "topic-page/default@1",
      reason: "Use the topic page.",
      stages: [],
      allowedReviewRollbackStages: [],
      digest: "sha256:execution",
    } satisfies LandingPageExecutionPlan;
    const generationSpec = {
      schemaVersion: "topic-page-generation-spec/v1",
      status: "generation-ready",
      keyword: "Matcha",
      site: "us",
      language: "zh",
      strategyRef: "relevance/intent-themes@2",
      templateRef: "topic-landing/topic-relevance@1",
      bindings: {
        themeIntentDigest: "sha256:intent",
        productSelectionDigest: "sha256:selection",
        topicPagePlanDigest: "sha256:plan",
        topicPageContentSpecDigest: "sha256:content",
        topicPageAssetManifestDigest: "sha256:assets",
      },
      moduleOrder: [],
      modules: [],
      digest: "sha256:generation",
    } satisfies TopicPageGenerationSpec;
    const qaReport = {
      schemaVersion: "topic-page-qa-report/v1",
      status: "passed",
      generationSpecDigest: generationSpec.digest,
      topicPageAssetManifestDigest: "sha256:assets",
      checks: [],
      issues: [],
      digest: "sha256:qa",
    } satisfies TopicPageQaReport & { status: "passed" };

    const refs = await runtime.topicPagePreviewResolver?.({
      executionPlan,
      generationSpec,
      qaReport,
    });

    expect(runtime.pageAutomationConfigurationIssues).toEqual([]);
    expect(refs?.desktop).toMatch(/^http:\/\/127\.0\.0\.1:3300\/internal\//);
    const token = new URL(refs!.desktop).pathname.split("/").at(-1)!;
    await expect(
      createConfiguredTopicPageReviewPreviewRegistry(environment).read(token),
    ).resolves.toMatchObject({
      pageTypeRef: executionPlan.pageTypeRef,
      generationSpec: { digest: generationSpec.digest },
    });
  });
});
