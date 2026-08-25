import { describe, expect, it, vi } from "vitest";

import {
  createHttpTopicPageAgent,
  HttpTopicPageAgentError,
} from "../src/index.js";

const runs = {
  intent: {
    schemaVersion: "topic-intent-agent-run/v1",
    status: "needs-semantic-proposal",
    context: { keyword: "Matcha" },
  },
  background: {
    schemaVersion: "topic-background-evidence-run/v1",
    status: "needs-background-evidence-proposal",
    context: { keyword: "Matcha" },
  },
  orchestration: {
    schemaVersion: "landing-page-orchestration-run/v1",
    status: "needs-execution-plan-proposal",
    context: { keyword: "Matcha" },
  },
  merchandising: {
    schemaVersion: "page-merchandising-run/v1",
    status: "needs-module-proposal",
    context: { keyword: "Matcha" },
  },
  content: {
    schemaVersion: "topic-page-content-run/v1",
    status: "needs-content-proposal",
    context: { keyword: "Matcha" },
  },
  contentReview: {
    schemaVersion: "topic-page-content-review-run/v1",
    status: "needs-content-review-proposal",
    context: { contentSpecDigest: "sha256:content" },
  },
  candidateSelection: {
    schemaVersion: "topic-page-content-candidate-selection-run/v1",
    status: "needs-candidate-selection-proposal",
    context: { candidateSet: { digest: "sha256:candidates" } },
  },
  visual: {
    schemaVersion: "topic-page-visual-run/v1",
    status: "needs-visual-proposal",
    context: { keyword: "Matcha" },
  },
  review: {
    schemaVersion: "topic-page-experience-review-run/v1",
    status: "needs-review-proposal",
    context: { executionPlanDigest: "sha256:plan" },
  },
} as const;

describe("Topic Page Agent HTTP contract", () => {
  it("routes TopicIntent and seven page Agents through one versioned endpoint", async () => {
    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      const request = JSON.parse(String(init?.body)) as { stage: string };
      return Response.json({
        schemaVersion: "topic-page-agent-response/v1",
        stage: request.stage,
        proposal: { stage: request.stage },
        ...(request.stage === "visual-generation"
          ? {
              assets: [{
                taskId: "asset-hero",
                ref: "assets/hero.png",
                mimeType: "image/png",
                dataBase64: "iVBORw0KGgo=",
              }],
            }
          : {}),
      });
    });
    const agent = createHttpTopicPageAgent({
      id: "topic-page-agent",
      endpoint: "http://127.0.0.1:4400/agent",
      token: "test-token",
      fetch: fetchMock,
      agentIds: {
        "topic-intent": "topic-intent",
        "background-evidence": "topic-background-evidence",
        "workflow-planning": "topic-page-orchestrator",
        "module-merchandising": "topic-strategy",
        "content-writing": "topic-content",
        "content-review": "topic-content-review",
        "visual-generation": "topic-visual",
        "experience-review": "topic-review",
      },
    });

    await expect(agent.proposeSemanticIntent(runs.intent as never))
      .resolves.toEqual({ stage: "topic-intent" });
    await expect(agent.proposeBackgroundEvidence(runs.background as never))
      .resolves.toEqual({ stage: "background-evidence" });
    await expect(agent.proposeExecutionPlan(runs.orchestration as never))
      .resolves.toEqual({ stage: "workflow-planning" });
    await expect(agent.proposeModuleMerchandising(runs.merchandising as never))
      .resolves.toEqual({ stage: "module-merchandising" });
    await expect(agent.proposePageContent(runs.content as never))
      .resolves.toEqual({ stage: "content-writing" });
    await expect(agent.selectPageContentCandidates(runs.candidateSelection as never))
      .resolves.toEqual({ stage: "content-review" });
    await expect(agent.reviewPageContent(runs.contentReview as never))
      .resolves.toEqual({ stage: "content-review" });
    await expect(agent.generatePageVisuals(runs.visual as never)).resolves.toEqual({
      schemaVersion: "topic-page-visual-agent-output/v1",
      proposal: { stage: "visual-generation" },
      assets: [{
        taskId: "asset-hero",
        ref: "assets/hero.png",
        mimeType: "image/png",
        dataBase64: "iVBORw0KGgo=",
      }],
    });
    await expect(agent.reviewPageExperience(runs.review as never))
      .resolves.toEqual({ stage: "experience-review" });

    expect(agent.reviewerAgentId).toBe("topic-content-review");
    expect(agent.selectorAgentId).toBe("topic-content-review");

    expect(fetchMock).toHaveBeenCalledTimes(9);
    const requests = fetchMock.mock.calls.map(([, init]) => ({
      headers: init?.headers,
      body: JSON.parse(String(init?.body)),
    }));
    expect(requests.map(({ body }) => body.stage)).toEqual([
      "topic-intent",
      "background-evidence",
      "workflow-planning",
      "module-merchandising",
      "content-writing",
      "content-review",
      "content-review",
      "visual-generation",
      "experience-review",
    ]);
    expect(requests.map(({ body }) => body.agentId)).toEqual([
      "topic-intent",
      "topic-background-evidence",
      "topic-page-orchestrator",
      "topic-strategy",
      "topic-content",
      "topic-content-review",
      "topic-content-review",
      "topic-visual",
      "topic-review",
    ]);
    expect(requests[0]).toMatchObject({
      headers: {
        "content-type": "application/json",
        authorization: "Bearer test-token",
      },
      body: {
        schemaVersion: "topic-page-agent-request/v1",
        agentId: "topic-intent",
        run: runs.intent,
      },
    });
  });

  it("splits generated-image visual runs into bounded task requests and merges them in order", async () => {
    let activeRequests = 0;
    let maximumActiveRequests = 0;
    const fetchMock = vi.fn<typeof fetch>(async (_input, init) => {
      activeRequests += 1;
      maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);
      const request = JSON.parse(String(init?.body)) as {
        run: { context: { tasks: Array<{ taskId: string }> } };
      };
      const task = request.run.context.tasks[0]!;
      await new Promise((resolve) => setTimeout(resolve, task.taskId === "asset-hero" ? 10 : 1));
      activeRequests -= 1;
      return Response.json({
        schemaVersion: "topic-page-agent-response/v1",
        stage: "visual-generation",
        proposal: {
          schemaVersion: "topic-page-visual-proposal/v1",
          keyword: "Matcha",
          site: "us",
          language: "en",
          topicPagePlanDigest: "sha256:plan",
          topicPageContentSpecDigest: "sha256:content",
          themeIntentDigest: "sha256:intent",
          productSelectionDigest: "sha256:selection",
          productionMode: "generated-images",
          assets: [{
            taskId: task.taskId,
            artifact: { ref: `assets/generated/01-${task.taskId}.webp` },
          }],
        },
        assets: [{
          taskId: task.taskId,
          ref: `assets/generated/01-${task.taskId}.webp`,
          mimeType: "image/webp",
          dataBase64: "aW1hZ2U=",
        }],
      });
    });
    const agent = createHttpTopicPageAgent({
      id: "topic-page-agent",
      endpoint: "http://127.0.0.1:4400/topic-page",
      fetch: fetchMock,
    });
    const run = {
      schemaVersion: "topic-page-visual-run/v1",
      status: "needs-visual-proposal",
      context: {
        keyword: "Matcha",
        productionMode: "generated-images",
        tasks: [
          { taskId: "asset-hero" },
          { taskId: "asset-shortcuts-1" },
          { taskId: "asset-start-here-1" },
        ],
      },
    };

    await expect(agent.generatePageVisuals(run as never)).resolves.toMatchObject({
      schemaVersion: "topic-page-visual-agent-output/v1",
      proposal: {
        schemaVersion: "topic-page-visual-proposal/v1",
        assets: [
          { taskId: "asset-hero", artifact: { ref: "assets/generated/01-asset-hero.webp" } },
          {
            taskId: "asset-shortcuts-1",
            artifact: { ref: "assets/generated/02-asset-shortcuts-1.webp" },
          },
          {
            taskId: "asset-start-here-1",
            artifact: { ref: "assets/generated/03-asset-start-here-1.webp" },
          },
        ],
      },
      assets: [
        { taskId: "asset-hero", ref: "assets/generated/01-asset-hero.webp" },
        { taskId: "asset-shortcuts-1", ref: "assets/generated/02-asset-shortcuts-1.webp" },
        { taskId: "asset-start-here-1", ref: "assets/generated/03-asset-start-here-1.webp" },
      ],
    });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(maximumActiveRequests).toBe(2);
    expect(fetchMock.mock.calls.map(([, init]) => {
      const request = JSON.parse(String(init?.body)) as {
        run: { context: { tasks: Array<{ taskId: string }> } };
      };
      return request.run.context.tasks.map(({ taskId }) => taskId);
    })).toEqual([
      ["asset-hero"],
      ["asset-shortcuts-1"],
      ["asset-start-here-1"],
    ]);
  });

  it("identifies the failed task in a split visual request", async () => {
    const agent = createHttpTopicPageAgent({
      id: "topic-page-agent",
      endpoint: "http://127.0.0.1:4400/topic-page",
      fetch: vi.fn(async (_input, init) => {
        const request = JSON.parse(String(init?.body)) as {
          run: { context: { tasks: Array<{ taskId: string }> } };
        };
        const taskId = request.run.context.tasks[0]!.taskId;
        if (taskId === "asset-shortcuts-1") throw new TypeError("fetch failed");
        return Response.json({
          schemaVersion: "topic-page-agent-response/v1",
          stage: "visual-generation",
          proposal: {
            schemaVersion: "topic-page-visual-proposal/v1",
            keyword: "Matcha",
            assets: [{ taskId, artifact: { ref: `assets/generated/01-${taskId}.webp` } }],
          },
          assets: [{
            taskId,
            ref: `assets/generated/01-${taskId}.webp`,
            mimeType: "image/webp",
            dataBase64: "aW1hZ2U=",
          }],
        });
      }),
    });
    const run = {
      schemaVersion: "topic-page-visual-run/v1",
      status: "needs-visual-proposal",
      context: {
        productionMode: "generated-images",
        tasks: [{ taskId: "asset-hero" }, { taskId: "asset-shortcuts-1" }],
      },
    };

    await expect(agent.generatePageVisuals(run as never)).rejects.toMatchObject({
      name: "HttpTopicPageAgentError",
      stage: "visual-generation",
      message: 'Visual task "asset-shortcuts-1" failed: Topic Page Agent request failed: fetch failed',
    });
  });

  it("fails closed on HTTP, response-stage, and visual-body contract drift", async () => {
    const responses = [
      new Response("unavailable", { status: 503 }),
      Response.json({
        schemaVersion: "topic-page-agent-response/v1",
        stage: "visual-generation",
        proposal: {},
      }),
      Response.json({
        schemaVersion: "topic-page-agent-response/v1",
        stage: "visual-generation",
        proposal: {},
        assets: [{ taskId: "asset-hero", ref: "../hero.png", mimeType: "image/png" }],
      }),
    ];
    const fetchMock = vi.fn<typeof fetch>(async () => responses.shift()!);
    const agent = createHttpTopicPageAgent({
      id: "topic-page-agent",
      endpoint: "http://127.0.0.1:4400/agent",
      fetch: fetchMock,
    });

    await expect(agent.proposePageContent(runs.content as never)).rejects.toMatchObject({
      name: "HttpTopicPageAgentError",
      stage: "content-writing",
      status: 503,
    });
    await expect(agent.proposeModuleMerchandising(runs.merchandising as never)).rejects.toThrow(
      'Topic Page Agent response stage must be "module-merchandising".',
    );
    await expect(agent.generatePageVisuals(runs.visual as never)).rejects.toThrow(
      "Topic Page Agent visual response contains an invalid asset body.",
    );
    expect(HttpTopicPageAgentError).toBeTypeOf("function");
  });

  it("preserves a bounded Runner capability failure", async () => {
    const errorBody = JSON.stringify({
      schemaVersion: "topic-agent-runner-error/v1",
      code: "capability_unavailable",
      message: "The selected executor does not support image attachments.",
    });
    const agent = createHttpTopicPageAgent({
      id: "topic-page-agent",
      endpoint: "http://127.0.0.1:4400/topic-page",
      fetch: vi.fn(async () => new Response(errorBody, {
        status: 422,
        headers: {
          "content-length": String(Buffer.byteLength(errorBody)),
          "content-type": "application/json",
        },
      })),
    });

    await expect(agent.reviewPageExperience(runs.review as never)).rejects.toMatchObject({
      name: "HttpTopicPageAgentError",
      status: 422,
      code: "capability_unavailable",
      message: "The selected executor does not support image attachments.",
    });
  });

  it("accepts a small chunked Runner error without trusting Content-Length", async () => {
    const errorBody = JSON.stringify({
      schemaVersion: "topic-agent-runner-error/v1",
      code: "capability_unavailable",
      message: "Image input is unavailable.",
    });
    const agent = createHttpTopicPageAgent({
      id: "topic-page-agent",
      endpoint: "http://127.0.0.1:4400/topic-page",
      fetch: vi.fn(async () => new Response(errorBody, {
        status: 422,
        headers: { "content-type": "application/json" },
      })),
    });

    await expect(agent.reviewPageExperience(runs.review as never)).rejects.toMatchObject({
      code: "capability_unavailable",
      message: "Image input is unavailable.",
    });
  });

  it("ignores a Runner error whose actual body exceeds the byte limit", async () => {
    const errorBody = JSON.stringify({
      schemaVersion: "topic-agent-runner-error/v1",
      code: "capability_unavailable",
      message: "Image input is unavailable.",
      padding: "x".repeat(9_000),
    });
    const agent = createHttpTopicPageAgent({
      id: "topic-page-agent",
      endpoint: "http://127.0.0.1:4400/topic-page",
      fetch: vi.fn(async () => new Response(errorBody, {
        status: 422,
        headers: {
          "content-length": "1",
          "content-type": "application/json",
        },
      })),
    });

    await expect(agent.reviewPageExperience(runs.review as never)).rejects.toMatchObject({
      code: undefined,
      message: "Topic Page Agent returned HTTP 422.",
    });
  });
});
