import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  createSuccessfulVisualTaskCache,
  composeSourceProductLifestyleFallback,
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
          products: [{
            id: "product-1",
            title: "UNTRUSTED PRODUCT TITLE",
            brand: "Matcha House",
            imageUrl: "https://cdn.yamibuy.net/item/product-1.webp",
            categoryL3Name: "Matcha",
          }, {
            id: "product-3",
            title: "Daily Whisk Set",
            brand: "Tea Lab",
            imageUrl: "https://cdn.yamibuy.net/item/product-3.webp",
            categoryL3Name: "Tea tools",
          }, {
            id: "product-4",
            title: "Matcha Rice Crackers",
            brand: "Snack House",
            imageUrl: "https://cdn.yamibuy.net/item/product-4.webp",
            categoryL3Name: "Rice crackers",
          }],
          sceneBrief: {
            ...sharedBrief,
            priority: "scene-first",
            productRole: "reference-only",
          },
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
          products: [{
            id: "product-2",
            title: "Daily Matcha Powder",
            brand: "Tea Lab",
            imageUrl: "https://cdn.yamibuy.net/item/product-2.webp",
            categoryL3Name: "Matcha",
          }],
          sceneBrief: {
            ...sharedBrief,
            priority: "product-first",
            productRole: "primary-subject",
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
  it("builds a centered square source-product lifestyle fallback", async () => {
    const run = visualRun();
    const task = run.context.tasks[1]!;
    const product = await sharp({
      create: {
        width: 400,
        height: 400,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    }).composite([{
      input: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="300"><rect width="140" height="300" rx="18" fill="#d63034"/></svg>',
      ),
      left: 130,
      top: 50,
    }]).png().toBuffer();

    const fallback = await composeSourceProductLifestyleFallback(
      product,
      task as unknown as GeneratedVisualTask,
    );
    const metadata = await sharp(fallback).metadata();
    const center = await sharp(fallback).raw().toBuffer({ resolveWithObject: true });
    const centerOffset = (512 * center.info.width + 512) * center.info.channels;
    const centerPixel = [...center.data.subarray(centerOffset, centerOffset + 3)];

    expect(metadata).toMatchObject({ format: "png", width: 1024, height: 1024 });
    expect(centerPixel).toEqual([214, 48, 52]);
  });

  it("asks the Agent to regenerate one complete Hero from flexible product references", () => {
    const run = visualRun();
    const task = run.context.tasks[0]!;
    const prompt = generatedImageTaskPrompt(
      run.context as unknown as GeneratedVisualContext,
      task as unknown as GeneratedVisualTask,
      "generated.png",
      {
        skillInstructions: "SKILL CONTRACT: generate the complete Hero from attached references.",
        agentInstructions: "AGENT CONFIG: visual-generation only.",
      },
    );

    expect(prompt).toContain("SKILL CONTRACT: generate the complete Hero from attached references");
    expect(prompt).toContain("AGENT CONFIG: visual-generation only");
    expect(prompt).toContain("attached product images");
    expect(prompt).toContain("complete Hero scene");
    expect(prompt).toContain("not a count checklist");
    expect(prompt).toContain("do not enforce exact quantity");
    expect(prompt).toContain("For every referenced product that appears, reproduce its source packaging as faithfully as the image model allows");
    expect(prompt).toContain("visible brand name and logo, key label text");
    expect(prompt).toContain("never replace it with blank or generic packaging");
    expect(prompt).toContain("missing label text");
    expect(prompt).toContain("Do not perform visual rejection");
    expect(prompt).toContain("return status accepted");
    expect(prompt).not.toContain("supportRegion");
    expect(prompt).not.toContain("locked catalog product layers");
    expect(prompt).not.toContain("make exactly one targeted retry");
    expect(prompt).not.toContain("UNTRUSTED PRODUCT TITLE");
    expect(prompt).not.toContain("Matcha House");
    expect(prompt).toContain("product 1: Matcha");
    expect(prompt).toContain("generated.png");
    expect(prompt).not.toContain("washbasin");
    expect(prompt).not.toContain("skincare plants");
  });

  it("builds a product-led lifestyle prompt and carries one shortcut reference image", async () => {
    const run = visualRun();
    run.context.tasks[0]!.products.push({
      id: "product-5",
      title: "Tea Cup",
      brand: "Tea Lab",
      imageUrl: "https://cdn.yamibuy.net/item/product-5.webp",
      categoryL3Name: "Tea cups",
    });
    const task = run.context.tasks[1]!;
    const prompt = generatedImageTaskPrompt(
      run.context as unknown as GeneratedVisualContext,
      task as unknown as GeneratedVisualTask,
      "generated.png",
    );

    expect(prompt).toContain("attached representative product image");
    expect(prompt).toContain("one product-led lifestyle scene");
    expect(prompt).toContain("near the center");
    expect(prompt).toContain("circular crop");
    expect(prompt).toContain("Reproduce its source packaging as faithfully as the image model allows");
    expect(prompt).toContain("visible brand name and logo, key label text");
    expect(prompt).toContain("never replace it with blank or generic packaging");
    expect(prompt).toContain("Do not perform semantic visual rejection for the Shortcut");
    expect(prompt).toContain("Product category: Matcha");
    expect(prompt).not.toContain("Daily Matcha Powder");
    expect(prompt).not.toContain("Show no bottles, jars, tubes");

    const source = await sharp({
      create: {
        width: 768,
        height: 768,
        channels: 3,
        background: { r: 211, g: 220, b: 202 },
      },
    }).png().toBuffer();
    const requests: Array<{
      referenceImageUrl?: string;
      referenceImageUrls?: string[];
    }> = [];
    await compileGeneratedImageVisualResponse(run, async (request) => {
      requests.push(request);
      return source;
    });

    expect(requests[0]).toEqual(expect.objectContaining({
      referenceImageUrls: [
        "https://cdn.yamibuy.net/item/product-1.webp",
        "https://cdn.yamibuy.net/item/product-3.webp",
        "https://cdn.yamibuy.net/item/product-4.webp",
        "https://cdn.yamibuy.net/item/product-5.webp",
      ],
    }));
    expect(requests[0]).not.toHaveProperty("referenceImageUrl");
    expect(requests[1]).toEqual(expect.objectContaining({
      referenceImageUrl: "https://cdn.yamibuy.net/item/product-2.webp",
    }));
  });

  it("uses current-scene products as flexible references for a responsive editorial scene", async () => {
    const run = visualRun();
    const sceneTask = {
      taskId: "asset-start-here-daily-ritual",
      moduleId: "start-here",
      component: "ThemeProductList",
      kind: "scene-image",
      targetAspectRatio: "1:1",
      minimumWidth: 1024,
      minimumHeight: 1024,
      altTextMode: "required",
      requiresBackgroundColor: true,
      products: [
        run.context.tasks[0]!.products[0]!,
        run.context.tasks[0]!.products[1]!,
        run.context.tasks[0]!.products[2]!,
        {
          id: "product-5",
          imageUrl: "https://cdn.yamibuy.net/item/product-5.webp",
          categoryL3Name: "Tea cups",
        },
      ],
      sceneBrief: {
        ...run.context.tasks[0]!.sceneBrief,
        priority: "scene-first",
        productRole: "reference-only",
        scene: {
          shoppingGoal: "Build a calm daily matcha ritual",
          reason: "Help shoppers compare a complete routine",
        },
        content: {
          taskId: "content-start-here",
          texts: ["按日常冲泡方式选择", "组合抹茶、茶具与搭配"],
        },
        evidenceRefs: [
          "theme-intent:evidence-1",
          "scene:daily-ritual",
          "content-task:content-start-here",
        ],
      },
    };
    const sceneRun = {
      ...run,
      context: {
        ...run.context,
        tasks: [sceneTask],
      },
    };
    const prompt = generatedImageTaskPrompt(
      sceneRun.context as unknown as GeneratedVisualContext,
      sceneTask as unknown as GeneratedVisualTask,
      "generated.png",
    );

    expect(prompt).toContain("attached current-scene product images are optional visual references");
    expect(prompt).toContain("a product-free result is valid");
    expect(prompt).toContain("For every referenced product that appears, reproduce its source packaging as faithfully as the image model allows");
    expect(prompt).toContain("visible brand name and logo, key label text");
    expect(prompt).toContain("never replace it with blank or generic packaging");
    expect(prompt).toContain("Do not enforce exact product quantity or one-to-one placement");
    expect(prompt).toContain("Regenerate products and environment together");
    expect(prompt).toContain("generic unlabeled product container");
    expect(prompt).not.toContain("invented readable packaging text");
    expect(prompt).toContain("Do not copy source backdrops, swatches, discs, badges, white canvases");
    expect(prompt).toContain("upper-right");
    expect(prompt).toContain("lower-left copy-safe area");
    expect(prompt).toContain("centered wide and card crops");
    expect(prompt).toContain("Do not bake text, a gradient, a text panel, or a scrim into the image");
    expect(prompt).toContain("could not credibly illustrate a sibling scene after only swapping the title");
    expect(prompt).not.toContain("Show no bottles, jars, tubes");

    const source = await sharp({
      create: {
        width: 1024,
        height: 1024,
        channels: 3,
        background: { r: 229, g: 222, b: 211 },
      },
    }).png().toBuffer();
    const requests: Array<{ referenceImageUrls?: string[] }> = [];
    await compileGeneratedImageVisualResponse(sceneRun, async (request) => {
      requests.push(request);
      return source;
    });

    expect(requests[0]).toEqual(expect.objectContaining({
      referenceImageUrls: [
        "https://cdn.yamibuy.net/item/product-1.webp",
        "https://cdn.yamibuy.net/item/product-3.webp",
        "https://cdn.yamibuy.net/item/product-4.webp",
      ],
    }));
    const response = await compileGeneratedImageVisualResponse(sceneRun, async () => source);
    expect(response.proposal.assets[0]?.direction).toMatchObject({
      referenceProductIds: ["product-1", "product-3", "product-4", "product-5"],
      attachedReferenceProductIds: ["product-1", "product-3", "product-4"],
    });
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

  it("uses three workers by default to reduce native image-generation queue time", async () => {
    const source = await sharp({
      create: {
        width: 768,
        height: 768,
        channels: 3,
        background: { r: 211, g: 220, b: 202 },
      },
    }).png().toBuffer();
    const run = visualRun();
    const task = run.context.tasks[0]!;
    run.context.tasks = Array.from({ length: 9 }, (_, index) => ({
      ...task,
      taskId: `asset-hero-${index + 1}`,
    }));
    let active = 0;
    let peak = 0;

    await compileGeneratedImageVisualResponse(run, async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 10));
      active -= 1;
      return source;
    });

    expect(peak).toBe(3);
  });

  it("uses the same bounded technical retry for Hero and Shortcut", async () => {
    const source = await sharp({
      create: {
        width: 768,
        height: 768,
        channels: 3,
        background: { r: 211, g: 220, b: 202 },
      },
    }).png().toBuffer();
    const attempts = new Map<string, number>();

    const fallbackTasks: string[] = [];
    const response = await compileGeneratedImageVisualResponse(
      visualRun(),
      async ({ task }) => {
        const attempt = (attempts.get(task.taskId) ?? 0) + 1;
        attempts.set(task.taskId, attempt);
        if (attempt === 1) throw new Error("Transient image request failed.");
        return source;
      },
      {
        fallback: async ({ task }) => {
          fallbackTasks.push(task.taskId);
          return source;
        },
      },
    );

    expect(Object.fromEntries(attempts)).toEqual({
      "asset-hero": 2,
      "asset-shortcuts-1": 2,
    });
    expect(fallbackTasks).toEqual([]);
    expect(response.assets).toHaveLength(2);
  });

  it("uses a task-level fallback after retries so one shortcut failure does not block the page", async () => {
    const source = await sharp({
      create: {
        width: 768,
        height: 768,
        channels: 3,
        background: { r: 211, g: 220, b: 202 },
      },
    }).png().toBuffer();
    const attempts = new Map<string, number>();
    const fallbackTasks: string[] = [];

    const response = await compileGeneratedImageVisualResponse(
      visualRun(),
      async ({ task }) => {
        attempts.set(task.taskId, (attempts.get(task.taskId) ?? 0) + 1);
        if (task.kind === "shortcut-image") throw new Error("Native image HTTP 403.");
        return source;
      },
      {
        fallback: async ({ task }, error) => {
          fallbackTasks.push(task.taskId);
          expect(error).toMatchObject({ message: "Native image HTTP 403." });
          return source;
        },
      },
    );

    expect(Object.fromEntries(attempts)).toEqual({
      "asset-hero": 1,
      "asset-shortcuts-1": 2,
    });
    expect(fallbackTasks).toEqual(["asset-shortcuts-1"]);
    expect(response.assets).toHaveLength(2);
    expect(response.proposal.assets.map(({ taskId }) => taskId)).toEqual([
      "asset-hero",
      "asset-shortcuts-1",
    ]);
  });

  it("records queue, task, and attempt timings with bounded retry reasons", async () => {
    const source = await sharp({
      create: { width: 768, height: 768, channels: 3, background: "#d3dcca" },
    }).png().toBuffer();
    let heroAttempts = 0;
    const response = await compileGeneratedImageVisualResponse(
      visualRun(),
      async ({ task }) => {
        if (task.kind === "hero-image" && ++heroAttempts === 1) {
          throw new Error("temporary provider delay");
        }
        return source;
      },
      {
        generationProvenance: {
          provider: "codex-native",
          modelSource: "unreported",
        },
      },
    );

    expect(response.proposal.assets[0]?.direction.generationProvenance).toMatchObject({
      attempts: 2,
      cacheHit: false,
      queueDurationMs: expect.any(Number),
      taskDurationMs: expect.any(Number),
      attemptDurationsMs: [expect.any(Number), expect.any(Number)],
      attemptIssues: ["temporary provider delay"],
    });
    expect(response.proposal.assets[1]?.direction.generationProvenance).toMatchObject({
      attempts: 1,
      attemptDurationsMs: [expect.any(Number)],
      attemptIssues: [],
    });
  });

  it("records fallback provenance instead of reporting the requested scene as generated", async () => {
    const source = await sharp({
      create: { width: 768, height: 768, channels: 3, background: "#d3dcca" },
    }).png().toBuffer();
    const response = await compileGeneratedImageVisualResponse(
      visualRun(),
      async () => { throw new Error("native generation unavailable"); },
      {
        attempts: 1,
        fallback: async () => ({
          bytes: source,
          scenePrompt: "Deterministic neutral source-layer fallback.",
          fallbackUsed: true,
        }),
      },
    );

    expect(response.proposal.assets[0]?.direction).toMatchObject({
      prompt: "Deterministic neutral source-layer fallback.",
      fallbackUsed: true,
      fallbackReason: "native generation unavailable",
    });
  });

  it("reuses successful task results while evicting failures", async () => {
    const source = await sharp({
      create: { width: 32, height: 32, channels: 3, background: "#d3dcca" },
    }).png().toBuffer();
    let calls = 0;
    const cached = createSuccessfulVisualTaskCache(async () => {
      calls += 1;
      return source;
    });
    const request = {
      task: visualRun().context.tasks[0] as unknown as GeneratedVisualTask,
      prompt: "stable prompt",
      outputFilename: "generated.png",
      referenceImageUrls: ["https://cdn.yamibuy.net/item/product-1.webp"],
    };

    await cached(request);
    await cached(request);
    expect(calls).toBe(1);

    let failures = 0;
    const retryable = createSuccessfulVisualTaskCache(async () => {
      failures += 1;
      if (failures === 1) throw new Error("transient");
      return source;
    });
    await expect(retryable(request)).rejects.toThrow("transient");
    await expect(retryable(request)).resolves.toEqual(source);
    expect(failures).toBe(2);
  });

  it("reuses a successful task from the persistent cache after a Runner restart", async () => {
    const directory = await mkdtemp(join(tmpdir(), "topic-visual-cache-test-"));
    try {
      const source = await sharp({
        create: { width: 32, height: 32, channels: 3, background: "#d3dcca" },
      }).png().toBuffer();
      const request = {
        task: visualRun().context.tasks[0] as unknown as GeneratedVisualTask,
        prompt: "stable prompt",
        outputFilename: "generated.png",
        referenceImageUrls: ["https://cdn.yamibuy.net/item/product-1.webp"],
      };
      let calls = 0;
      const firstRunner = createSuccessfulVisualTaskCache(async () => {
        calls += 1;
        return { bytes: source, scenePrompt: "cached scene" };
      }, { directory });
      await firstRunner(request);

      const restartedRunner = createSuccessfulVisualTaskCache(async () => {
        calls += 1;
        return source;
      }, { directory });
      await expect(restartedRunner(request)).resolves.toMatchObject({
        bytes: source,
        scenePrompt: "cached scene",
        cacheHit: true,
      });
      expect(calls).toBe(1);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("rejects a relative persistent visual cache root", () => {
    expect(() => createSuccessfulVisualTaskCache(async () => Buffer.from("image"), {
      directory: "relative/cache",
    })).toThrow("must be absolute");
  });

  it("requires the fixed output file while allowing generated-scene visual rejection to pass through", () => {
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

    expect(parseNativeImageTaskResult({
      schemaVersion: "topic-page-native-image-task-result/v1",
      taskId: "asset-hero",
      status: "accepted",
      relativePath: "generated.png",
      scenePrompt: "A flexible scene.",
      issues: [],
    }, "asset-hero", "generated.png")).toEqual({
      relativePath: "generated.png",
      scenePrompt: "A flexible scene.",
      issues: [],
    });

    expect(() => parseNativeImageTaskResult({
      schemaVersion: "topic-page-native-image-task-result/v1",
      taskId: "asset-hero",
      status: "rejected",
      relativePath: "generated.png",
      issues: ["product-grid composition"],
    }, "asset-hero", "generated.png")).toThrow("product-grid composition");

    expect(parseNativeImageTaskResult({
      schemaVersion: "topic-page-native-image-task-result/v1",
      taskId: "asset-hero",
      status: "rejected",
      relativePath: "generated.png",
      issues: ["product-grid composition"],
    }, "asset-hero", "generated.png", { acceptRejected: true })).toEqual({
      relativePath: "generated.png",
      issues: ["product-grid composition"],
    });

    expect(parseNativeImageTaskResult({
      schemaVersion: "topic-page-native-image-task-result/v1",
      taskId: "asset-shortcuts-1",
      status: "rejected",
      relativePath: "generated.png",
      issues: ["approximate packaging"],
    }, "asset-shortcuts-1", "generated.png", { acceptRejected: true })).toEqual({
      relativePath: "generated.png",
      issues: ["approximate packaging"],
    });
  });

});
