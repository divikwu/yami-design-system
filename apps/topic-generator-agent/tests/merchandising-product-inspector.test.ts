import { access } from "node:fs/promises";

import sharp from "sharp";
import { describe, expect, it, vi } from "vitest";

import {
  inspectMerchandisingProductImages,
} from "../src/merchandising-product-inspector.ts";

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

function merchandisingRun() {
  return {
    schemaVersion: "page-merchandising-run/v1",
    status: "needs-module-proposal",
    context: {
      sourceScenes: [{
        id: "routine",
        productGroups: [
          { core: "product-1", pairing: "product-2" },
          { core: "product-1" },
        ],
      }],
      products: [
        {
          id: "product-1",
          title: "Heartleaf Quercetinol Pore Deep Cleansing Foam 5.07 fl oz",
          brand: "ANUA",
          categoryL3Id: "cleansing",
          sourceRank: 1,
          soldCount: 200,
          imageUrl: "https://cdn.yamibuy.net/item/product-1.webp",
        },
        {
          id: "product-2",
          title: "Heartleaf Quercentinol Pore Deep Cleansing Foam 150ml",
          brand: "ANUA",
          categoryL3Id: "cleansing",
          sourceRank: 6,
          soldCount: 20,
          imageUrl: "https://cdn.yamibuy.net/item/product-2.webp",
        },
        {
          id: "not-in-source-scene",
          imageUrl: "https://cdn.yamibuy.net/item/product-3.webp",
        },
      ],
    },
  };
}

function textProposal() {
  return {
    schemaVersion: "module-merchandising-proposal/v1",
    modules: [{
      id: "start-here",
      scenes: [{ id: "page-routine", sourceSceneId: "routine" }],
      assignments: [{ productId: "product-2", sceneId: "page-routine" }],
    }],
  };
}

describe("module merchandising product image inspection", () => {
  it("prepares selected products and only text-similar source-scene alternatives", async () => {
    const source = await fixturePng();
    const fetchMock = vi.fn(async () => new Response(source, {
      status: 200,
      headers: {
        "content-length": String(source.byteLength),
        "content-type": "image/png",
      },
    }));

    const inspection = await inspectMerchandisingProductImages(merchandisingRun(), textProposal(), {
      fetch: fetchMock as typeof globalThis.fetch,
    });
    expect(inspection.attachments.map(({ label }) => label)).toEqual([
      "product:product-2",
      "product:product-1",
    ]);
    expect(inspection.productIds).toEqual(["product-2", "product-1"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await Promise.all(inspection.attachments.map(async ({ path }) => {
      await expect(access(path)).resolves.toBeUndefined();
      await expect(sharp(path).metadata()).resolves.toMatchObject({
        format: "webp",
        width: 512,
        height: 512,
      });
    }));

    const paths = inspection.attachments.map(({ path }) => path);
    await inspection.cleanup();
    await Promise.all(paths.map((path) => expect(access(path)).rejects.toThrow()));
  });

  it("returns no attachments when the run contains no source-scene products", async () => {
    const inspection = await inspectMerchandisingProductImages({
      schemaVersion: "page-merchandising-run/v1",
      status: "needs-module-proposal",
      context: { sourceScenes: [], products: [] },
    }, textProposal());

    expect(inspection.attachments).toEqual([]);
    expect(inspection.productIds).toEqual([]);
    await expect(inspection.cleanup()).resolves.toBeUndefined();
  });
});
