import { access, readFile } from "node:fs/promises";

import { describe, expect, it, vi } from "vitest";

import {
  createCodexExecutor,
  parseCodexImageGenerationProbe,
  type AgentExecutor,
} from "../src/executor.ts";
import { createAgentRunnerHandler } from "../src/handler.ts";
import { AGENT_ROUTES } from "../src/registry.ts";

function fakeExecutor(
  result: unknown = { schemaVersion: "proposal/v1" },
  supportsImageInput = true,
  supportsImageGeneration = true,
) {
  return {
    id: "test",
    supportsImageInput,
    supportsImageGeneration,
    execute: vi.fn(async (_request: Parameters<AgentExecutor["execute"]>[0]) => result),
    generateVisuals: vi.fn(async (_request: Parameters<AgentExecutor["execute"]>[0]) => result),
  } satisfies AgentExecutor;
}

function post(path: string, body: Record<string, unknown>, token?: string) {
  return new Request(`http://127.0.0.1:4400${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe("TOPIC GENERATOR Agent Runner", () => {
  it("registers every canonical Skill and automatic stage", () => {
    expect(AGENT_ROUTES.map(({ protocol, stage }) => `${protocol}:${stage}`)).toEqual([
      "topic-page:topic-intent",
      "topic-page:background-evidence",
      "topic-page:workflow-planning",
      "topic-page:module-merchandising",
      "topic-page:content-writing",
      "topic-page:content-review",
      "topic-page:visual-generation",
      "topic-page:experience-review",
      "product-selection:product-semantic-proposal",
      "product-selection:category-role-proposal",
      "product-selection:scene-proposal",
    ]);
    expect(new Set(AGENT_ROUTES.map(({ skill }) => skill))).toEqual(new Set([
      "topic-intent",
      "background-evidence",
      "page-orchestration",
      "page-merchandising",
      "content-writing",
      "content-review",
      "visual-generation",
      "page-review",
      "product-selection",
    ]));
  });

  it("loads every registered Agent and complete Skill bundle", async () => {
    const executor = fakeExecutor();
    const handler = createAgentRunnerHandler({
      executor,
      inspectPreviews: async () => ({
        attachments: [],
        cleanup: async () => undefined,
      }),
    });

    for (const route of AGENT_ROUTES) {
      const path = route.protocol === "topic-page" ? "/topic-page" : "/product-selection";
      const schemaVersion = route.protocol === "topic-page"
        ? "topic-page-agent-request/v1"
        : "product-selection-agent-request/v1";
      const response = await handler(post(path, {
        schemaVersion,
        stage: route.stage,
        agentId: route.agentId,
        run: { schemaVersion: "test-run/v1" },
      }));
      expect(response.status, `${route.agentId}:${route.stage}`).toBe(200);
    }

    expect(executor.execute).toHaveBeenCalledTimes(AGENT_ROUTES.length);
    for (const call of executor.execute.mock.calls) {
      expect(call[0].skillInstructions).toContain("Referenced contract:");
      expect(call[0].agentInstructions).toContain("default_prompt:");
    }
  });

  it("routes a TopicIntent request through the registered Agent and Skill", async () => {
    const executor = fakeExecutor({ schemaVersion: "semantic-proposal/v2" });
    const handler = createAgentRunnerHandler({ executor });
    const response = await handler(post("/topic-page", {
      schemaVersion: "topic-page-agent-request/v1",
      stage: "topic-intent",
      agentId: "topic-strategy",
      run: { schemaVersion: "topic-intent-agent-run/v1" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      schemaVersion: "topic-page-agent-response/v1",
      stage: "topic-intent",
      proposal: { schemaVersion: "semantic-proposal/v2" },
    });
    expect(executor.execute).toHaveBeenCalledWith(expect.objectContaining({
      route: expect.objectContaining({
        agentId: "topic-strategy",
        skill: "topic-intent",
      }),
      skillInstructions: expect.stringContaining("# TOPIC GENERATOR Semantic Proposal contract"),
    }));
  });

  it("loads the exact ShortcutRail slot binding into the Content Agent contract", async () => {
    const executor = fakeExecutor({ schemaVersion: "topic-page-content-proposal/v1" });
    const handler = createAgentRunnerHandler({ executor });
    const response = await handler(post("/topic-page", {
      schemaVersion: "topic-page-agent-request/v1",
      stage: "content-writing",
      agentId: "topic-content",
      run: { schemaVersion: "topic-page-content-run/v1" },
    }));

    expect(response.status).toBe(200);
    expect(executor.execute).toHaveBeenCalledWith(expect.objectContaining({
      skillInstructions: expect.stringContaining('"slotId": "shortcuts-1"'),
    }));
  });

  it("runs text selection before shortlisted visual merchandising review", async () => {
    const cleanup = vi.fn(async () => undefined);
    const textProposal = {
      schemaVersion: "module-merchandising-proposal/v1",
      modules: [],
    };
    const visualProposal = {
      ...textProposal,
      visualReview: {
        schemaVersion: "module-merchandising-visual-review/v1",
        inspectedProductIds: ["product-1", "product-2"],
        duplicateGroups: [],
      },
    };
    const inspectMerchandisingProducts = vi.fn(async () => ({
      attachments: [
        { path: "/tmp/product-1.webp", label: "product:product-1" },
        { path: "/tmp/product-2.webp", label: "product:product-2" },
      ],
      productIds: ["product-1", "product-2"],
      cleanup,
    }));
    const executor = {
      id: "test",
      supportsImageInput: true,
      execute: vi.fn()
        .mockResolvedValueOnce(textProposal)
        .mockResolvedValueOnce(visualProposal),
    } satisfies AgentExecutor;
    const handler = createAgentRunnerHandler({ executor, inspectMerchandisingProducts });
    const run = {
      schemaVersion: "page-merchandising-run/v1",
      status: "needs-module-proposal",
      context: { sourceScenes: [], products: [] },
    };
    const response = await handler(post("/topic-page", {
      schemaVersion: "topic-page-agent-request/v1",
      stage: "module-merchandising",
      agentId: "topic-strategy",
      run,
    }));

    expect(response.status).toBe(200);
    expect(inspectMerchandisingProducts).toHaveBeenCalledWith(run, textProposal);
    expect(executor.execute).toHaveBeenCalledTimes(2);
    expect(executor.execute.mock.calls[0]?.[0]).not.toHaveProperty("attachments");
    expect(executor.execute.mock.calls[1]?.[0]).toEqual(expect.objectContaining({
      attachments: [
        { path: "/tmp/product-1.webp", label: "product:product-1" },
        { path: "/tmp/product-2.webp", label: "product:product-2" },
      ],
      skillInstructions: expect.stringMatching(/retain\s+the product with the higher\s+`soldCount`/),
    }));
    expect(executor.execute.mock.calls[1]?.[0].run).toMatchObject({
      context: {
        visualReviewTask: {
          schemaVersion: "module-merchandising-visual-review-task/v1",
          inspectedProductIds: ["product-1", "product-2"],
          textProposal,
        },
      },
    });
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("keeps text-only module merchandising available for a non-visual executor", async () => {
    const inspectMerchandisingProducts = vi.fn();
    const executor = fakeExecutor({ schemaVersion: "module-merchandising-proposal/v1" }, false);
    const handler = createAgentRunnerHandler({ executor, inspectMerchandisingProducts });
    const response = await handler(post("/topic-page", {
      schemaVersion: "topic-page-agent-request/v1",
      stage: "module-merchandising",
      agentId: "topic-strategy",
      run: {
        schemaVersion: "page-merchandising-run/v1",
        status: "needs-module-proposal",
        context: { sourceScenes: [], products: [] },
      },
    }));

    expect(response.status).toBe(200);
    expect(inspectMerchandisingProducts).not.toHaveBeenCalled();
    expect(executor.execute).toHaveBeenCalledWith(
      expect.not.objectContaining({ attachments: expect.anything() }),
    );
  });

  it("preserves visual asset bodies from a complete Agent envelope", async () => {
    const assets = [{
      taskId: "hero",
      ref: "run/hero.png",
      mimeType: "image/png",
      dataBase64: "iVBORw0KGgo=",
    }];
    const handler = createAgentRunnerHandler({
      executor: fakeExecutor({
        schemaVersion: "topic-page-agent-response/v1",
        stage: "visual-generation",
        proposal: { schemaVersion: "topic-page-visual-proposal/v1" },
        assets,
      }),
    });
    const response = await handler(post("/topic-page", {
      schemaVersion: "topic-page-agent-request/v1",
      stage: "visual-generation",
      agentId: "topic-visual",
      run: { schemaVersion: "topic-page-visual-run/v1" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: "topic-page-agent-response/v1",
      stage: "visual-generation",
      assets,
    });
  });

  it("rejects generated-image metadata when the Agent returns no real image body", async () => {
    const handler = createAgentRunnerHandler({
      executor: fakeExecutor({
        schemaVersion: "topic-page-agent-response/v1",
        stage: "visual-generation",
        proposal: {
          schemaVersion: "topic-page-visual-proposal/v1",
          assets: [{
            taskId: "asset-hero",
            artifact: {
              ref: "assets/fabricated-hero.png",
              mimeType: "image/png",
            },
          }],
        },
      }),
    });
    const response = await handler(post("/topic-page", {
      schemaVersion: "topic-page-agent-request/v1",
      stage: "visual-generation",
      agentId: "topic-visual",
      run: {
        schemaVersion: "topic-page-visual-run/v1",
        status: "needs-visual-proposal",
        context: {
          productionMode: "generated-images",
          tasks: [{ taskId: "asset-hero" }],
        },
      },
    }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      schemaVersion: "topic-agent-runner-error/v1",
      code: "generated_visual_assets_missing",
      message: "Generated visual output must contain one real image body for every visual task.",
    });
  });

  it("fails before Agent execution when the executor has no image-generation capability", async () => {
    const executor = fakeExecutor(undefined, true, false);
    const handler = createAgentRunnerHandler({ executor });
    const response = await handler(post("/topic-page", {
      schemaVersion: "topic-page-agent-request/v1",
      stage: "visual-generation",
      agentId: "topic-visual",
      run: {
        schemaVersion: "topic-page-visual-run/v1",
        status: "needs-visual-proposal",
        context: { productionMode: "generated-images", tasks: [{ taskId: "asset-hero" }] },
      },
    }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      code: "capability_unavailable",
      message: "test does not expose image generation for visual-generation.",
    });
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it("composes source product images before the Visual Agent inspects them", async () => {
    const bytes = Buffer.from("real-composed-webp");
    const prepared = {
      schemaVersion: "topic-page-agent-response/v1",
      stage: "visual-generation",
      proposal: {
        schemaVersion: "topic-page-visual-proposal/v1",
        keyword: "ANUA",
        site: "us",
        language: "zh",
        topicPagePlanDigest: "sha256:plan",
        topicPageContentSpecDigest: "sha256:content",
        themeIntentDigest: "sha256:intent",
        productSelectionDigest: "sha256:selection",
        productionMode: "source-product-images",
        assets: [{
          taskId: "asset-hero",
          moduleId: "hero",
          component: "ThemeHero",
          kind: "hero-image",
          direction: {
            prompt: "prepared direction",
            evidenceRefs: ["product:1"],
            referenceProductIds: ["1"],
          },
          altText: {
            language: "zh",
            text: "prepared alt",
            evidenceRefs: ["product:1"],
          },
          artifact: {
            ref: "assets/run/hero.webp",
            mimeType: "image/webp",
            width: 1200,
            height: 675,
            digest: "sha256:prepared",
            focalPoint: { x: 0.5, y: 0.5 },
            backgroundColor: "#f4f3ef",
          },
        }],
      },
      assets: [{
        taskId: "asset-hero",
        ref: "assets/run/hero.webp",
        mimeType: "image/webp",
        dataBase64: bytes.toString("base64"),
      }],
    };
    let inspectedPath = "";
    const executor = fakeExecutor({
      schemaVersion: "topic-page-visual-proposal/v1",
      assets: [{
        taskId: "asset-hero",
        direction: {
          prompt: "Agent-inspected direction",
          evidenceRefs: ["product:1"],
          referenceProductIds: ["1"],
        },
        altText: {
          language: "zh",
          text: "Agent-inspected alt text",
          evidenceRefs: ["product:1"],
        },
        artifact: { digest: "sha256:fabricated" },
      }],
    });
    executor.execute.mockImplementationOnce(async (request) => {
      inspectedPath = request.attachments?.[0]?.path ?? "";
      expect(await readFile(inspectedPath)).toEqual(bytes);
      expect(request.run).toMatchObject({
        context: {
          productionMode: "source-product-images",
          preparedSourceImageProposal: prepared.proposal,
        },
      });
      return {
        schemaVersion: "topic-page-visual-proposal/v1",
        assets: [{
          taskId: "asset-hero",
          direction: {
            prompt: "Agent-inspected direction",
            evidenceRefs: ["product:1"],
            referenceProductIds: ["1"],
          },
          altText: {
            language: "zh",
            text: "Agent-inspected alt text",
            evidenceRefs: ["product:1"],
          },
          artifact: { digest: "sha256:fabricated" },
        }],
      };
    });
    const composeSourceImages = vi.fn(async () => prepared);
    const handler = createAgentRunnerHandler({ executor, composeSourceImages });

    const response = await handler(post("/topic-page", {
      schemaVersion: "topic-page-agent-request/v1",
      stage: "visual-generation",
      agentId: "topic-visual",
      run: {
        schemaVersion: "topic-page-visual-run/v1",
        status: "needs-visual-proposal",
        context: { productionMode: "source-product-images" },
      },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      proposal: {
        assets: [{
          taskId: "asset-hero",
          direction: { prompt: "Agent-inspected direction" },
          altText: { text: "Agent-inspected alt text" },
          artifact: { digest: "sha256:prepared" },
        }],
      },
      assets: prepared.assets,
    });
    expect(composeSourceImages).toHaveBeenCalledOnce();
    await expect(access(inspectedPath)).rejects.toThrow();
  });

  it("captures generation-bound previews before the Review Agent runs", async () => {
    const cleanup = vi.fn(async () => undefined);
    const inspectPreviews = vi.fn(async () => ({
      attachments: [
        { path: "/tmp/desktop.png", label: "experience-review-desktop" as const },
        { path: "/tmp/mobile.png", label: "experience-review-mobile" as const },
      ],
      cleanup,
    }));
    const executor = fakeExecutor({ schemaVersion: "topic-page-review-proposal/v1" });
    const handler = createAgentRunnerHandler({ executor, inspectPreviews });
    const run = {
      schemaVersion: "topic-page-review-run/v1",
      status: "needs-review-proposal",
      context: {
        generationSpec: { digest: "sha256:generation" },
        previewRefs: {
          desktop: "http://127.0.0.1:3300/internal/topic-page-preview/token?viewport=desktop",
          mobile: "http://127.0.0.1:3300/internal/topic-page-preview/token?viewport=mobile",
        },
      },
    };

    const response = await handler(post("/topic-page", {
      schemaVersion: "topic-page-agent-request/v1",
      stage: "experience-review",
      agentId: "topic-review",
      run,
    }));

    expect(response.status).toBe(200);
    expect(inspectPreviews).toHaveBeenCalledWith(
      { stage: "experience-review", run },
      { allowedOrigin: undefined },
    );
    expect(executor.execute).toHaveBeenCalledWith(expect.objectContaining({
      attachments: [
        { path: "/tmp/desktop.png", label: "experience-review-desktop" },
        { path: "/tmp/mobile.png", label: "experience-review-mobile" },
      ],
    }));
    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("fails explicitly when the selected executor cannot inspect review screenshots", async () => {
    const executor = fakeExecutor(undefined, false);
    const inspectPreviews = vi.fn();
    const handler = createAgentRunnerHandler({ executor, inspectPreviews });
    const response = await handler(post("/topic-page", {
      schemaVersion: "topic-page-agent-request/v1",
      stage: "experience-review",
      agentId: "topic-review",
      run: { schemaVersion: "topic-page-review-run/v1", context: {} },
    }));

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({ code: "capability_unavailable" });
    expect(inspectPreviews).not.toHaveBeenCalled();
    expect(executor.execute).not.toHaveBeenCalled();
  });

  it("supports the registered ProductSelection proposal stages", async () => {
    const executor = fakeExecutor({
      schemaVersion: "product-selection-handoff-response/v1",
      stage: "category-role-proposal",
      proposal: { schemaVersion: "category-role-proposal/v1" },
    });
    const handler = createAgentRunnerHandler({ executor });
    const response = await handler(post("/product-selection", {
      schemaVersion: "product-selection-agent-request/v1",
      stage: "category-role-proposal",
      agentId: "topic-product-agent",
      run: { schemaVersion: "product-selection-run/v1" },
    }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      schemaVersion: "product-selection-agent-response/v1",
      stage: "category-role-proposal",
      proposal: { schemaVersion: "category-role-proposal/v1" },
    });
  });

  it("requires the configured token and rejects unregistered stages", async () => {
    const handler = createAgentRunnerHandler({
      executor: fakeExecutor(),
      token: "secret",
    });
    const unauthorized = await handler(post("/topic-page", {
      schemaVersion: "topic-page-agent-request/v1",
      stage: "topic-intent",
      agentId: "topic-strategy",
      run: {},
    }));
    expect(unauthorized.status).toBe(401);

    const unsupported = await handler(post("/topic-page", {
      schemaVersion: "topic-page-agent-request/v1",
      stage: "invented-stage",
      agentId: "invented-agent",
      run: {},
    }, "secret"));
    expect(unsupported.status).toBe(400);
    await expect(unsupported.json()).resolves.toMatchObject({ code: "unsupported_stage" });
  });

  it("reports the complete registry without exposing secrets", async () => {
    const handler = createAgentRunnerHandler({ executor: fakeExecutor(), token: "secret" });
    const response = await handler(new Request("http://127.0.0.1:4400/health"));
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.routes).toHaveLength(11);
    expect(payload.capabilities).toEqual({
      imageInput: true,
      imageGeneration: true,
    });
    expect(JSON.stringify(payload)).not.toContain("secret");
  });

  it("keeps the Runner deadline below the Host request deadline", () => {
    expect(() => createCodexExecutor({
      TOPIC_AGENT_RUNNER_TIMEOUT_MS: "300001",
    })).toThrow("Expected an integer between 1 and 300000.");
  });

  it("enables native image generation only for the Codex feature and ChatGPT login", () => {
    expect(parseCodexImageGenerationProbe(
      "Logged in using ChatGPT\n",
      "image_generation                     stable             true\n",
    )).toEqual({
      available: true,
      provider: "codex-native",
      modelSource: "unreported",
      authMode: "chatgpt",
    });
    expect(parseCodexImageGenerationProbe(
      "Logged in using an API key\n",
      "image_generation                     stable             true\n",
    )).toEqual({
      available: false,
      reason: "Codex native image generation requires a ChatGPT login.",
    });
    expect(parseCodexImageGenerationProbe(
      "Logged in using ChatGPT\n",
      "image_generation                     stable             false\n",
    )).toEqual({
      available: false,
      reason: "Codex image_generation is not enabled.",
    });
  });
});
