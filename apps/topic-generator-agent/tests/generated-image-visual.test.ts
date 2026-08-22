import { createHash } from "node:crypto";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  compileGeneratedImageVisualResponse,
  generatedImageTaskPrompt,
  parseNativeImageTaskResult,
  type GeneratedVisualContext,
  type GeneratedVisualTask,
} from "../src/generated-image-visual.ts";

function visualRun() {
  const sharedBrief = {
    priority: "scene-first",
    productRole: "reference-only",
    theme: {
      shoppingGoal: "帮助用户按饮用方式选择抹茶",
      needs: ["日常冲饮"],
      conditions: ["自然光"],
    },
    module: {
      shoppingGoal: "建立抹茶日常饮用主题",
      reason: "先呈现使用环境，再进入商品比较",
    },
    categories: [{ id: "tea", name: "Tea" }],
    content: {
      taskId: "content-hero",
      texts: ["认识 Matcha，从饮用方式开始选"],
    },
    evidenceRefs: ["theme-intent:evidence-1", "content-task:content-hero"],
    requirements: [
      "Depict a coherent, naturalistic scene that expresses this module's shopping goal.",
      "Treat assigned products as visual references only; they do not need to appear.",
      "Do not use isolated product packshots, tiled product grids, or product montages as the primary visual.",
      "Do not generate or alter packaging, labels, logos, or product claims.",
    ],
  };
  return {
    schemaVersion: "topic-page-visual-run/v1",
    status: "needs-visual-proposal",
    context: {
      keyword: "matcha",
      site: "us",
      language: "zh",
      productionMode: "generated-images",
      topicPagePlanDigest: "sha256:plan",
      topicPageContentSpecDigest: "sha256:content",
      themeIntentDigest: "sha256:intent",
      productSelectionDigest: "sha256:selection",
      tasks: [
        {
          taskId: "asset-hero",
          moduleId: "hero",
          component: "ThemeHero",
          kind: "hero-image",
          targetAspectRatio: "16:9",
          minimumWidth: 1200,
          minimumHeight: 675,
          altTextMode: "required",
          requiresBackgroundColor: true,
          products: [{ id: "product-1", title: "UNTRUSTED PRODUCT TITLE" }],
          sceneBrief: sharedBrief,
        },
        {
          taskId: "asset-shortcuts-1",
          moduleId: "shortcuts",
          component: "ShortcutRail",
          kind: "shortcut-image",
          targetAspectRatio: "1:1",
          minimumWidth: 512,
          minimumHeight: 512,
          altTextMode: "decorative",
          requiresBackgroundColor: false,
          products: [{ id: "product-2", title: "ANOTHER UNTRUSTED TITLE" }],
          sceneBrief: {
            ...sharedBrief,
            module: {
              shoppingGoal: "表现日常冲饮",
              reason: "帮助用户快速识别饮用分类",
            },
            content: {
              taskId: "content-shortcuts",
              texts: ["直接冲饮"],
            },
            evidenceRefs: [
              "selected-category:tea",
              "content-task:content-shortcuts",
            ],
          },
        },
      ],
    },
  };
}

describe("Codex-native generated Topic visuals", () => {
  it("builds scene-first task prompts without leaking product titles into art direction", () => {
    const run = visualRun();
    const task = run.context.tasks[0]!;
    const prompt = generatedImageTaskPrompt(
      run.context as unknown as GeneratedVisualContext,
      task as unknown as GeneratedVisualTask,
      "generated.png",
    );

    expect(prompt).toContain("Scene and module-theme fidelity are the primary criteria");
    expect(prompt).toContain("reference-only");
    expect(prompt).toContain("isolated product packshot");
    expect(prompt).toContain("generated.png");
    expect(prompt).not.toContain("UNTRUSTED PRODUCT TITLE");
  });

  it("normalizes real image bytes, preserves task order, and derives trusted metadata", async () => {
    const source = await sharp({
      create: {
        width: 768,
        height: 768,
        channels: 3,
        background: { r: 211, g: 220, b: 202 },
      },
    }).png().toBuffer();
    let active = 0;
    let peak = 0;
    const response = await compileGeneratedImageVisualResponse(
      visualRun(),
      async ({ task }) => {
        active += 1;
        peak = Math.max(peak, active);
        await new Promise((resolve) => setTimeout(resolve, task.taskId === "asset-hero" ? 10 : 1));
        active -= 1;
        return source;
      },
      { concurrency: 2 },
    );

    expect(peak).toBe(2);
    expect(response.proposal.assets.map(({ taskId }) => taskId)).toEqual([
      "asset-hero",
      "asset-shortcuts-1",
    ]);
    expect(response.assets.map(({ taskId }) => taskId)).toEqual([
      "asset-hero",
      "asset-shortcuts-1",
    ]);
    expect(response.proposal.assets[0]).toMatchObject({
      taskId: "asset-hero",
      moduleId: "hero",
      component: "ThemeHero",
      kind: "hero-image",
      altText: {
        language: "zh",
        evidenceRefs: ["theme-intent:evidence-1", "content-task:content-hero"],
      },
      artifact: {
        ref: "assets/generated/01-asset-hero.webp",
        mimeType: "image/webp",
        width: 1600,
        height: 900,
        focalPoint: { x: 0.5, y: 0.45 },
        backgroundColor: expect.stringMatching(/^#[a-f0-9]{6}$/),
      },
    });
    expect(response.proposal.assets[1]).toMatchObject({
      altText: null,
      artifact: {
        ref: "assets/generated/02-asset-shortcuts-1.webp",
        width: 1024,
        height: 1024,
      },
    });
    for (const [index, body] of response.assets.entries()) {
      const bytes = Buffer.from(body.dataBase64, "base64");
      const metadata = await sharp(bytes).metadata();
      expect(metadata.format).toBe("webp");
      expect(metadata.width).toBe(response.proposal.assets[index]?.artifact.width);
      expect(metadata.height).toBe(response.proposal.assets[index]?.artifact.height);
      expect(response.proposal.assets[index]?.artifact.digest).toBe(
        `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
      );
    }
  });

  it("requires a native task to report accepted inspection and the fixed output file", () => {
    expect(parseNativeImageTaskResult({
      schemaVersion: "topic-page-native-image-task-result/v1",
      taskId: "asset-hero",
      status: "accepted",
      relativePath: "generated.png",
      issues: [],
    }, "asset-hero", "generated.png")).toEqual({
      relativePath: "generated.png",
      issues: [],
    });

    expect(() => parseNativeImageTaskResult({
      schemaVersion: "topic-page-native-image-task-result/v1",
      taskId: "asset-hero",
      status: "rejected",
      relativePath: "generated.png",
      issues: ["product-grid composition"],
    }, "asset-hero", "generated.png")).toThrow("product-grid composition");
  });
});
