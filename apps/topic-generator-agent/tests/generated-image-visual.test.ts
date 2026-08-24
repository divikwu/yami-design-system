import { createHash } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";
import { describe, expect, it } from "vitest";

import {
  createSuccessfulVisualTaskCache,
  composeLockedHeroProducts,
  composeSourceProductLifestyleFallback,
  compileGeneratedImageVisualResponse,
  generatedImageTaskPrompt,
  heroCompositionVerificationPrompt,
  heroPlacementRecoveryPrompt,
  parseHeroCompositionVerificationResult,
  parseHeroPlacementRecoveryResult,
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
            priority: "scene-composite",
            productRole: "locked-source-products",
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

const safeSupportRegion = {
  left: 0.08,
  right: 0.92,
  top: 0.5,
  bottom: 0.74,
  surface: "horizontal-light-neutral" as const,
};

describe("Codex-native generated Topic visuals", () => {
  it("composites real source-product layers in the Hero center and preserves the bottom quarter", async () => {
    const run = visualRun();
    const heroTask = run.context.tasks[0]!;
    const task = {
      ...heroTask,
      products: [
        ...heroTask.products,
        {
          id: "product-5",
          title: "Matcha Face Mask",
          brand: "Matcha House",
          imageUrl: "https://cdn.yamibuy.net/item/product-5.webp",
          categoryL3Name: "Face masks",
        },
      ],
    };
    const background = await sharp({
      create: {
        width: 1600,
        height: 900,
        channels: 3,
        background: { r: 232, g: 226, b: 216 },
      },
    }).png().toBuffer();
    const colors = ["#d63034", "#2f9e44", "#1971c2", "#f08c00"];
    const sources = await Promise.all(colors.map(async (color) =>
      await sharp({
        create: {
          width: 500,
          height: 500,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      }).composite([{
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360"><rect width="360" height="360" rx="22" fill="${color}"/></svg>`,
        ),
        left: 70,
        top: 70,
      }]).png().toBuffer()
    ));

    const result = await composeLockedHeroProducts(
      background,
      sources,
      task as unknown as GeneratedVisualTask,
      undefined,
      { backgroundMode: "safe-neutral" },
    );
    const metadata = await sharp(result).metadata();
    const raw = await sharp(result).raw().toBuffer({ resolveWithObject: true });
    const primaryX = Math.round(
      result.placement.plan.anchors[result.placement.plan.primaryIndex]!.x * raw.info.width,
    );
    const bottomCenter = (800 * raw.info.width + 800) * raw.info.channels;
    const rgb = [...raw.data.subarray(bottomCenter, bottomCenter + 3)];
    const contactShadow = (650 * raw.info.width + primaryX) * raw.info.channels;
    const contactShadowRgb = [...raw.data.subarray(contactShadow, contactShadow + 3)];
    const centralOverlap = (400 * raw.info.width + primaryX) * raw.info.channels;
    const centralOverlapRgb = [...raw.data.subarray(centralOverlap, centralOverlap + 3)];
    const bounds = result.compositionAudit.products.map(({ bounds }) => bounds);
    const subjectLeft = Math.min(...bounds.map(({ left }) => left));
    const subjectRight = Math.max(...bounds.map(({ right }) => right));
    const subjectTop = Math.min(...bounds.map(({ top }) => top));
    const subjectBottom = Math.max(...bounds.map(({ bottom }) => bottom));

    expect(metadata).toMatchObject({ format: "png", width: 1600, height: 900 });
    expect(rgb).toEqual([232, 226, 216]);
    expect(contactShadowRgb.reduce((sum, channel) => sum + channel, 0)).toBeLessThan(674);
    expect(centralOverlapRgb[1]).toBeGreaterThan(centralOverlapRgb[0]! * 2);
    expect(bounds[1]!.bottom - bounds[2]!.bottom).toBeGreaterThanOrEqual(0.035);
    expect(bounds[1]!.bottom - bounds[0]!.bottom).toBeGreaterThanOrEqual(0.02);
    expect(subjectRight - subjectLeft).toBeGreaterThanOrEqual(0.78);
    expect(subjectRight - subjectLeft).toBeLessThanOrEqual(0.88);
    expect(subjectBottom - subjectTop).toBeGreaterThanOrEqual(0.43);
    expect((subjectLeft + subjectRight) / 2).toBeGreaterThanOrEqual(0.48);
    expect((subjectLeft + subjectRight) / 2).toBeLessThanOrEqual(0.52);
    expect(subjectBottom).toBeLessThan(0.75);
  });

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

  it("uses optional Agent placement anchors without making them a generation blocker", async () => {
    const run = visualRun();
    const heroTask = run.context.tasks[0]!;
    const colors = ["#d63034", "#2f9e44", "#1971c2"];
    const background = await sharp({
      create: {
        width: 1600,
        height: 900,
        channels: 3,
        background: { r: 232, g: 226, b: 216 },
      },
    }).png().toBuffer();
    const sources = await Promise.all(colors.map(async (color) =>
      await sharp({
        create: {
          width: 500,
          height: 500,
          channels: 3,
          background: { r: 255, g: 255, b: 255 },
        },
      }).composite([{
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="360"><rect width="360" height="360" rx="22" fill="${color}"/></svg>`,
        ),
        left: 70,
        top: 70,
      }]).png().toBuffer()
    ));
    const result = await composeLockedHeroProducts(
      background,
      sources,
      heroTask as unknown as GeneratedVisualTask,
      {
        primaryIndex: 1,
        anchors: [
          { x: 0.3, y: 0.62, scale: 0.8, depth: 1 },
          { x: 0.5, y: 0.7, scale: 1, depth: 2 },
          { x: 0.7, y: 0.58, scale: 0.75, depth: 0 },
        ],
        shadowDirection: { x: -0.5, y: 0.5 },
        supportRegion: safeSupportRegion,
      },
    );
    expect(result.compositionAudit.products.map(({ bounds }) => bounds.bottom)).toEqual([
      0.62,
      0.7,
      0.58,
    ]);
    expect(result.compositionAudit.products.map(({ contactPoint }) => contactPoint)).toEqual([
      { x: 0.3, y: 0.62 },
      { x: 0.5, y: 0.7 },
      { x: 0.7, y: 0.58 },
    ]);
  });

  it("rejects overlapping Agent placement anchors instead of applying fixed anchors to the scene", async () => {
    const run = visualRun();
    const heroTask = run.context.tasks[0]!;
    const colors = ["#d63034", "#2f9e44", "#1971c2"];
    const background = await sharp({
      create: { width: 1600, height: 900, channels: 3, background: "#e8e2d8" },
    }).png().toBuffer();
    const sources = await Promise.all(colors.map(async (color) => await sharp({
      create: { width: 500, height: 500, channels: 3, background: "#ffffff" },
    }).composite([{
      input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="220" height="380"><rect width="220" height="380" rx="24" fill="${color}"/></svg>`),
      left: 140,
      top: 60,
    }]).png().toBuffer()));

    await expect(composeLockedHeroProducts(
      background,
      sources,
      heroTask as unknown as GeneratedVisualTask,
      {
        primaryIndex: 0,
        anchors: [
          { x: 0.5, y: 0.7, scale: 1.2, depth: 2 },
          { x: 0.5, y: 0.7, scale: 1.2, depth: 1 },
          { x: 0.5, y: 0.7, scale: 1.2, depth: 0 },
        ],
        shadowDirection: { x: 0.5, y: 0.5 },
        supportRegion: safeSupportRegion,
      },
    )).rejects.toThrow("agent-placement-overlap");
  });

  it("preserves a pale product body behind a deterministic white-background silhouette mask", async () => {
    const run = visualRun();
    const task = run.context.tasks[0]!;
    const source = await sharp({
      create: { width: 500, height: 500, channels: 3, background: "#ffffff" },
    }).composite([{
      input: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="390"><rect x="10" y="10" width="200" height="370" rx="36" fill="#f3f3ef" stroke="#b8c4bd" stroke-width="8"/><rect x="45" y="170" width="130" height="70" fill="#dfe9e2"/></svg>'),
      left: 140,
      top: 55,
    }]).png().toBuffer();
    const background = await sharp({
      create: { width: 1600, height: 900, channels: 3, background: "#e8e2d8" },
    }).png().toBuffer();

    const result = await composeLockedHeroProducts(
      background,
      [source],
      { ...task, products: [task.products[0]!] } as unknown as GeneratedVisualTask,
      undefined,
      { backgroundMode: "safe-neutral" },
    );
    const raw = await sharp(result.bytes).raw().toBuffer({ resolveWithObject: true });
    const centerOffset = (390 * raw.info.width + 800) * raw.info.channels;
    const center = [...raw.data.subarray(centerOffset, centerOffset + 3)];

    expect(center.reduce((sum, channel) => sum + channel, 0)).toBeGreaterThan(580);
    expect(result.compositionAudit.products[0]).toMatchObject({
      preparationMethod: "white-background-direct",
      preparationConfidence: expect.any(Number),
    });
  });

  it("asks the Agent to plan a product-aware Hero background before locked-layer composition", () => {
    const run = visualRun();
    const task = run.context.tasks[0]!;
    const prompt = generatedImageTaskPrompt(
      run.context as unknown as GeneratedVisualContext,
      task as unknown as GeneratedVisualTask,
      "generated.png",
      {
        skillInstructions: "SKILL CONTRACT: do not attach Hero product pixels.",
        agentInstructions: "AGENT CONFIG: visual-generation only.",
      },
    );

    expect(prompt).toContain("SKILL CONTRACT: do not attach Hero product pixels");
    expect(prompt).toContain("AGENT CONFIG: visual-generation only");
    expect(prompt).toContain("No product source image is attached");
    expect(prompt).toContain("locked catalog product layers");
    expect(prompt).toContain("central visual focus");
    expect(prompt).toContain("continuous upward-facing light-neutral support region");
    expect(prompt).toContain("Natural environmental shadows");
    expect(prompt).toContain("product-shaped shadows");
    expect(prompt).toContain("placementPlan");
    expect(prompt).toContain("supportRegion");
    expect(prompt).toContain("inside supportRegion");
    expect(prompt).toContain("Host owns the single bounded retry");
    expect(prompt).not.toContain("make exactly one targeted retry");
    expect(prompt).not.toContain("UNTRUSTED PRODUCT TITLE");
    expect(prompt).not.toContain("Matcha House");
    expect(prompt).toContain("product 1: Matcha");
    expect(prompt).toContain("generated.png");
    expect(prompt).not.toContain("washbasin");
    expect(prompt).not.toContain("skincare plants");
  });

  it("builds a product-led lifestyle prompt and carries the exact shortcut reference image", async () => {
    const run = visualRun();
    const task = run.context.tasks[1]!;
    const prompt = generatedImageTaskPrompt(
      run.context as unknown as GeneratedVisualContext,
      task as unknown as GeneratedVisualTask,
      "generated.png",
    );

    expect(prompt).toContain("attached representative product image");
    expect(prompt).toContain("single primary subject");
    expect(prompt).toContain("near the exact center");
    expect(prompt).toContain("circular crop");
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
      lockedProductImageUrls?: string[];
    }> = [];
    await compileGeneratedImageVisualResponse(run, async (request) => {
      requests.push(request);
      return source;
    });

    expect(requests[0]).toEqual(expect.objectContaining({
      lockedProductImageUrls: [
        "https://cdn.yamibuy.net/item/product-1.webp",
        "https://cdn.yamibuy.net/item/product-3.webp",
        "https://cdn.yamibuy.net/item/product-4.webp",
      ],
    }));
    expect(requests[0]).not.toHaveProperty("referenceImageUrl");
    expect(requests[1]).toEqual(expect.objectContaining({
      referenceImageUrl: "https://cdn.yamibuy.net/item/product-2.webp",
    }));
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

  it("uses two workers by default to bound native image-generation load", async () => {
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

    expect(peak).toBe(2);
  });

  it("retries each transient image task once without restarting completed tasks", async () => {
    const source = await sharp({
      create: {
        width: 768,
        height: 768,
        channels: 3,
        background: { r: 211, g: 220, b: 202 },
      },
    }).png().toBuffer();
    const attempts = new Map<string, number>();

    const response = await compileGeneratedImageVisualResponse(visualRun(), async ({ task }) => {
      const attempt = (attempts.get(task.taskId) ?? 0) + 1;
      attempts.set(task.taskId, attempt);
      if (attempt === 1) throw new Error("Transient image request failed.");
      return source;
    });

    expect(Object.fromEntries(attempts)).toEqual({
      "asset-hero": 2,
      "asset-shortcuts-1": 2,
    });
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
      lockedProductImageUrls: ["https://cdn.yamibuy.net/item/product-1.webp"],
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
        lockedProductImageUrls: ["https://cdn.yamibuy.net/item/product-1.webp"],
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

    expect(parseNativeImageTaskResult({
      schemaVersion: "topic-page-native-image-task-result/v1",
      taskId: "asset-hero",
      status: "accepted",
      relativePath: "generated.png",
      scenePrompt: "A flexible scene.",
      placementPlan: {
        primaryIndex: 1,
        anchors: [
          { x: 0.3, y: 0.62, scale: 0.8, depth: 1 },
          { x: 0.5, y: 0.7, scale: 1, depth: 2 },
        ],
        shadowDirection: { x: -0.5, y: 0.5 },
        supportRegion: safeSupportRegion,
      },
      issues: [],
    }, "asset-hero", "generated.png")).toEqual({
      relativePath: "generated.png",
      scenePrompt: "A flexible scene.",
      placementPlan: {
        primaryIndex: 1,
        anchors: [
          { x: 0.3, y: 0.62, scale: 0.8, depth: 1 },
          { x: 0.5, y: 0.7, scale: 1, depth: 2 },
        ],
        shadowDirection: { x: -0.5, y: 0.5 },
        supportRegion: safeSupportRegion,
      },
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

  it("runs a separate read-only Hero verifier for support contact and source fidelity", () => {
    const task = visualRun().context.tasks[0] as unknown as GeneratedVisualTask;
    const prompt = heroCompositionVerificationPrompt(
      task,
      "SKILL: locked source products",
      "AGENT: visual only",
    );
    expect(prompt).toContain("first attached image is the final Hero composite");
    expect(prompt).toContain("next 3 attached images are the exact catalog source images");
    expect(prompt).toContain("upward-facing horizontal support surface");
    expect(prompt).toContain("wall, vertical face, or open air");
    expect(prompt).toContain("SKILL: locked source products");
    expect(prompt).toContain("AGENT: visual only");
    expect(parseHeroCompositionVerificationResult({
      schemaVersion: "topic-page-hero-composition-verification/v1",
      taskId: "asset-hero",
      status: "accepted",
      issues: [],
    }, "asset-hero")).toEqual({ status: "accepted", issues: [] });
    expect(() => parseHeroCompositionVerificationResult({
      schemaVersion: "topic-page-hero-composition-verification/v1",
      taskId: "asset-hero",
      status: "rejected",
      issues: ["product floats above the support plane"],
    }, "asset-hero")).toThrow("product floats above the support plane");
  });

  it("recovers missing Hero placement from the existing background without generating another image", () => {
    const task = visualRun().context.tasks[0] as unknown as GeneratedVisualTask;
    const prompt = heroPlacementRecoveryPrompt(
      task,
      "SKILL: recover only a horizontal support surface",
      "AGENT: visual only",
    );
    expect(prompt).toContain("Do not generate or edit an image");
    expect(prompt).toContain("3 catalog products");
    expect(prompt).toContain("wall, vertical face, step riser, object, or open air");
    expect(prompt).toContain("SKILL: recover only a horizontal support surface");
    const placementPlan = {
      primaryIndex: 1,
      anchors: [
        { x: 0.3, y: 0.64, scale: 0.8, depth: 1 },
        { x: 0.5, y: 0.68, scale: 1, depth: 2 },
        { x: 0.7, y: 0.62, scale: 0.78, depth: 0 },
      ],
      shadowDirection: { x: 0.6, y: 0.5 },
      supportRegion: {
        left: 0.08,
        right: 0.92,
        top: 0.5,
        bottom: 0.72,
        surface: "horizontal-light-neutral",
      },
    } as const;
    expect(parseHeroPlacementRecoveryResult({
      schemaVersion: "topic-page-hero-placement-recovery/v1",
      taskId: "asset-hero",
      status: "accepted",
      placementPlan,
      issues: [],
    }, task)).toEqual(placementPlan);
    expect(() => parseHeroPlacementRecoveryResult({
      schemaVersion: "topic-page-hero-placement-recovery/v1",
      taskId: "asset-hero",
      status: "rejected",
      issues: ["no horizontal support region"],
    }, task)).toThrow("no horizontal support region");
  });
});
