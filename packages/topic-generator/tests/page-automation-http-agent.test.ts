import { describe, expect, it, vi } from "vitest";

import {
  createHttpTopicPageAgent,
  HttpTopicPageAgentError,
} from "../src/index.js";

const runs = {
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
  it("routes five logical Agents through one versioned endpoint", async () => {
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
        "workflow-planning": "topic-page-orchestrator",
        "module-merchandising": "topic-strategy",
        "content-writing": "topic-content",
        "visual-generation": "topic-visual",
        "experience-review": "topic-review",
      },
    });

    await expect(agent.proposeExecutionPlan(runs.orchestration as never))
      .resolves.toEqual({ stage: "workflow-planning" });
    await expect(agent.proposeModuleMerchandising(runs.merchandising as never))
      .resolves.toEqual({ stage: "module-merchandising" });
    await expect(agent.proposePageContent(runs.content as never))
      .resolves.toEqual({ stage: "content-writing" });
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

    expect(fetchMock).toHaveBeenCalledTimes(5);
    const requests = fetchMock.mock.calls.map(([, init]) => ({
      headers: init?.headers,
      body: JSON.parse(String(init?.body)),
    }));
    expect(requests.map(({ body }) => body.stage)).toEqual([
      "workflow-planning",
      "module-merchandising",
      "content-writing",
      "visual-generation",
      "experience-review",
    ]);
    expect(requests.map(({ body }) => body.agentId)).toEqual([
      "topic-page-orchestrator",
      "topic-strategy",
      "topic-content",
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
        agentId: "topic-page-orchestrator",
        run: runs.orchestration,
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
});
