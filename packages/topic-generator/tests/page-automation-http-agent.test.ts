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

    expect(fetchMock).toHaveBeenCalledTimes(8);
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
