import { createHash } from "node:crypto";

import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

import {
  composeSourceProductImages,
} from "../src/source-image-compositor.ts";

function visualRun(imageUrl = "https://cdn.yamibuy.net/item/test-product.webp") {
  return {
    schemaVersion: "topic-page-visual-run/v1",
    status: "needs-visual-proposal",
    context: {
      keyword: "ANUA",
      site: "us",
      language: "zh",
      strategyRef: "relevance@1",
      templateRef: "brand@1",
      topicPagePlanDigest: `sha256:${"1".repeat(64)}`,
      topicPageContentSpecDigest: `sha256:${"2".repeat(64)}`,
      themeIntentDigest: `sha256:${"3".repeat(64)}`,
      productSelectionDigest: `sha256:${"4".repeat(64)}`,
      productionMode: "source-product-images",
      tasks: [{
        taskId: "asset-scene-routine",
        moduleId: "scene-routine",
        component: "ThemeProductList",
        kind: "scene-image",
        targetAspectRatio: "1:1",
        minimumWidth: 1024,
        minimumHeight: 1024,
        altTextMode: "required",
        requiresBackgroundColor: true,
        compositionGuidance: {
          preferredSubjectArea: "upper-three-quarters",
          lowerAreaUsage: "low-contrast-decoration-preferred",
        },
        assignments: [{ productId: "anua-1" }],
        products: [{
          id: "anua-1",
          title: "Heartleaf Toner",
          brand: "ANUA",
          imageUrl,
          categoryL3Id: "toner",
          categoryL3Name: "Toner",
          pool: "primary",
          role: "core",
        }],
        contentTask: { taskId: "content-scene-routine" },
      }],
    },
  };
}

async function fixturePng() {
  return sharp({
    create: {
      width: 80,
      height: 120,
      channels: 4,
      background: { r: 216, g: 36, b: 72, alpha: 1 },
    },
  }).png().toBuffer();
}

describe("source product image compositor", () => {
  it("returns real WebP bytes and keeps the scene lower quarter low-information", async () => {
    const source = await fixturePng();
    const fetchMock = vi.fn(async () => new Response(source, {
      status: 200,
      headers: {
        "content-length": String(source.byteLength),
        "content-type": "image/png",
      },
    }));

    const result = await composeSourceProductImages({
      stage: "visual-generation",
      run: visualRun(),
    }, { fetch: fetchMock as typeof globalThis.fetch });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://cdn.yamibuy.net/item/test-product.webp"),
      expect.objectContaining({ redirect: "manual" }),
    );
    expect(result).toMatchObject({
      schemaVersion: "topic-page-agent-response/v1",
      stage: "visual-generation",
      proposal: {
        schemaVersion: "topic-page-visual-proposal/v1",
        productionMode: "source-product-images",
        assets: [{
          taskId: "asset-scene-routine",
          kind: "scene-image",
          direction: {
            evidenceRefs: ["product:anua-1"],
            referenceProductIds: ["anua-1"],
          },
          altText: {
            language: "zh",
            evidenceRefs: ["product:anua-1"],
          },
          artifact: {
            mimeType: "image/webp",
            width: 1024,
            height: 1024,
            focalPoint: { x: 0.5, y: 0.36 },
            backgroundColor: "#f4f3ef",
          },
        }],
      },
      assets: [{
        taskId: "asset-scene-routine",
        mimeType: "image/webp",
      }],
    });
    const body = Buffer.from(result.assets[0]!.dataBase64, "base64");
    const metadata = await sharp(body).metadata();
    expect(metadata).toMatchObject({ format: "webp", width: 1024, height: 1024 });
    expect(result.proposal.assets[0]!.artifact.digest).toBe(
      `sha256:${createHash("sha256").update(body).digest("hex")}`,
    );

    const lowerQuarter = await sharp(body)
      .extract({ left: 0, top: 768, width: 1024, height: 256 })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const lowerQuarterStats = await sharp(lowerQuarter.data, { raw: lowerQuarter.info }).stats();
    expect(lowerQuarterStats.channels.every(({ stdev }) => stdev < 1)).toBe(true);
  });

  it("rejects non-Yami hosts before making a request", async () => {
    const fetchMock = vi.fn();
    const failure = composeSourceProductImages({
      stage: "visual-generation",
      run: visualRun("https://example.com/product.webp"),
    }, { fetch: fetchMock as typeof globalThis.fetch });

    await expect(failure).rejects.toMatchObject({
      code: "source_image_host_not_allowed",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when an assigned source image is unavailable", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 404 }));
    const failure = composeSourceProductImages({
      stage: "visual-generation",
      run: visualRun(),
    }, { fetch: fetchMock as typeof globalThis.fetch });

    await expect(failure).rejects.toMatchObject({
      code: "source_image_unavailable",
    });
  });

  it("fails closed when an assigned product has no catalog image", async () => {
    const run = visualRun();
    run.context.tasks[0]!.products[0]!.imageUrl = "";
    const failure = composeSourceProductImages({
      stage: "visual-generation",
      run,
    });

    await expect(failure).rejects.toMatchObject({ code: "source_image_missing" });
  });

  it.each([9, 18])("accepts a maintained brand banner with %i assigned products", async (count) => {
    const source = await fixturePng();
    const fetchMock = vi.fn(async () => new Response(source, {
      status: 200,
      headers: {
        "content-length": String(source.byteLength),
        "content-type": "image/png",
      },
    }));
    const run = visualRun();
    const productIds = Array.from({ length: count }, (_, index) => `anua-${index + 1}`);
    run.context.tasks[0] = {
      taskId: "asset-brand-anua",
      moduleId: "brand-spotlight",
      component: "BrandProductRail",
      kind: "brand-banner",
      targetAspectRatio: "111:40",
      minimumWidth: 888,
      minimumHeight: 320,
      altTextMode: "required",
      requiresBackgroundColor: false,
      compositionGuidance: {
        preferredSubjectArea: "upper-three-quarters",
        lowerAreaUsage: "low-contrast-decoration-preferred",
      },
      assignments: productIds.map((productId) => ({ productId })),
      products: productIds.map((id) => ({
        id,
        title: `ANUA product ${id}`,
        brand: "ANUA",
        imageUrl: "https://cdn.yamibuy.net/item/test-product.webp",
        categoryL3Id: "serum",
        categoryL3Name: "Serum",
        pool: "primary",
        role: "core",
      })),
      contentTask: { taskId: "content-brand-anua" },
    };

    const result = await composeSourceProductImages({
      stage: "visual-generation",
      run,
    }, { fetch: fetchMock as typeof globalThis.fetch });

    expect(result.proposal.assets[0]?.direction.referenceProductIds).toEqual(productIds);
  });

  it("revalidates redirect destinations against the Yami allowlist", async () => {
    const fetchMock = vi.fn(async () => new Response(null, {
      status: 302,
      headers: { location: "https://example.com/redirected.webp" },
    }));
    const failure = composeSourceProductImages({
      stage: "visual-generation",
      run: visualRun(),
    }, { fetch: fetchMock as typeof globalThis.fetch });

    await expect(failure).rejects.toMatchObject({
      code: "source_image_host_not_allowed",
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("enforces source byte and request timeout limits", async () => {
    const oversizedFetch = vi.fn(async () => new Response(new Uint8Array([1]), {
      status: 200,
      headers: { "content-length": "9" },
    }));
    await expect(composeSourceProductImages({
      stage: "visual-generation",
      run: visualRun(),
    }, {
      fetch: oversizedFetch as typeof globalThis.fetch,
      maxSourceBytes: 8,
    })).rejects.toMatchObject({ code: "source_image_too_large" });

    const stalledFetch = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      })
    );
    await expect(composeSourceProductImages({
      stage: "visual-generation",
      run: visualRun(),
    }, {
      fetch: stalledFetch as typeof globalThis.fetch,
      timeoutMs: 5,
    })).rejects.toMatchObject({ code: "source_image_timeout" });
  });
});
