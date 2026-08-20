import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import sharp from "sharp";

import { asObject } from "./json.ts";
import {
  fetchApprovedSourceImage,
  SourceImageCompositorError,
  type SourceImageCompositorOptions,
} from "./source-image-compositor.ts";

const MAX_CANDIDATE_IMAGES = 80;
const MAX_ALTERNATIVES_PER_SCENE = 4;
const MAX_SOURCE_PIXELS = 40_000_000;

export interface MerchandisingProductInspection {
  attachments: Array<{ path: string; label: string }>;
  productIds: string[];
  cleanup(): Promise<void>;
}

function proposalObject(value: unknown) {
  const body = asObject(value);
  if (!body) return null;
  return asObject(body.proposal) ?? body;
}

function sourceSceneProductIds(run: Record<string, unknown>) {
  const context = asObject(run.context);
  const byScene = new Map<string, string[]>();
  if (!context || !Array.isArray(context.sourceScenes)) return byScene;
  for (const sceneValue of context.sourceScenes) {
    const scene = asObject(sceneValue);
    const sceneId = typeof scene?.id === "string" ? scene.id.trim() : "";
    if (!sceneId || !Array.isArray(scene?.productGroups)) continue;
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const groupValue of scene.productGroups) {
      const group = asObject(groupValue);
      if (!group) continue;
      for (const role of ["core", "pairing", "accessory"] as const) {
        const id = typeof group[role] === "string" ? group[role].trim() : "";
        if (id && !seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }
    }
    byScene.set(sceneId, ids);
  }
  return byScene;
}

function titleTokens(product: Record<string, unknown>) {
  const brand = typeof product.brand === "string" ? product.brand.toLowerCase() : "";
  const brandTokens = new Set(brand.match(/[\p{L}\p{N}]+/gu) ?? []);
  const title = typeof product.title === "string" ? product.title.toLowerCase() : "";
  return new Set((title.match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((token) => token.length > 2 && !/^\d/.test(token) &&
      !["with", "and", "the", "for", "fl", "oz", "ml"].includes(token) &&
      !brandTokens.has(token)));
}

function titleOverlap(left: Record<string, unknown>, right: Record<string, unknown>) {
  const leftTokens = titleTokens(left);
  const rightTokens = titleTokens(right);
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  let shared = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) shared += 1;
  });
  return shared / Math.min(leftTokens.size, rightTokens.size);
}

function normalizedText(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function visualCandidateProductIds(
  run: Record<string, unknown>,
  proposalValue: unknown,
  products: Map<string, Record<string, unknown>>,
) {
  const proposal = proposalObject(proposalValue);
  const modules = Array.isArray(proposal?.modules) ? proposal.modules : [];
  const startHere = modules
    .map(asObject)
    .find((module) => module?.id === "start-here");
  const scenes = Array.isArray(startHere?.scenes) ? startHere.scenes : [];
  const sourceSceneByPageScene = new Map(scenes.flatMap((value) => {
    const scene = asObject(value);
    const id = typeof scene?.id === "string" ? scene.id.trim() : "";
    const sourceSceneId = typeof scene?.sourceSceneId === "string"
      ? scene.sourceSceneId.trim()
      : "";
    return id && sourceSceneId ? [[id, sourceSceneId] as const] : [];
  }));
  const selectedBySourceScene = new Map<string, string[]>();
  const assignments = Array.isArray(startHere?.assignments) ? startHere.assignments : [];
  assignments.forEach((value) => {
    const assignment = asObject(value);
    const productId = typeof assignment?.productId === "string"
      ? assignment.productId.trim()
      : "";
    const sceneId = typeof assignment?.sceneId === "string" ? assignment.sceneId.trim() : "";
    const sourceSceneId = sourceSceneByPageScene.get(sceneId);
    if (!productId || !sourceSceneId) return;
    const selected = selectedBySourceScene.get(sourceSceneId) ?? [];
    if (!selected.includes(productId)) selected.push(productId);
    selectedBySourceScene.set(sourceSceneId, selected);
  });

  const sourceProductsByScene = sourceSceneProductIds(run);
  const shortlisted: string[] = [];
  const seen = new Set<string>();
  const add = (id: string) => {
    if (id && products.has(id) && !seen.has(id)) {
      seen.add(id);
      shortlisted.push(id);
    }
  };
  selectedBySourceScene.forEach((selectedIds, sourceSceneId) => {
    selectedIds.forEach(add);
    const selectedProducts = selectedIds.flatMap((id) => {
      const product = products.get(id);
      return product ? [product] : [];
    });
    const alternatives = (sourceProductsByScene.get(sourceSceneId) ?? [])
      .filter((id) => !seen.has(id))
      .flatMap((id) => {
        const product = products.get(id);
        if (!product) return [];
        const score = selectedProducts.reduce((maximum, selected) => {
          const sameBrand = normalizedText(product.brand) === normalizedText(selected.brand);
          const sameCategory = normalizedText(product.categoryL3Id) ===
            normalizedText(selected.categoryL3Id);
          return sameBrand && sameCategory
            ? Math.max(maximum, titleOverlap(product, selected))
            : maximum;
        }, 0);
        return score >= 0.7 ? [{ id, product, score }] : [];
      })
      .sort((left, right) => right.score - left.score ||
        (Number(right.product.soldCount) || 0) - (Number(left.product.soldCount) || 0) ||
        (Number(left.product.sourceRank) || Number.MAX_SAFE_INTEGER) -
          (Number(right.product.sourceRank) || Number.MAX_SAFE_INTEGER))
      .slice(0, MAX_ALTERNATIVES_PER_SCENE);
    alternatives.forEach(({ id }) => add(id));
  });
  return shortlisted;
}

async function productThumbnail(bytes: Buffer) {
  try {
    return await sharp(bytes, {
      failOn: "error",
      limitInputPixels: MAX_SOURCE_PIXELS,
      sequentialRead: true,
    })
      .rotate()
      .resize({
        width: 512,
        height: 512,
        fit: "contain",
        background: "#f4f3ef",
      })
      .webp({ quality: 82, effort: 3 })
      .toBuffer();
  } catch {
    throw new SourceImageCompositorError(
      "source_image_invalid",
      "Product image could not be decoded safely.",
    );
  }
}

export async function inspectMerchandisingProductImages(
  run: Record<string, unknown>,
  textProposal: unknown,
  options: SourceImageCompositorOptions = {},
): Promise<MerchandisingProductInspection> {
  const context = asObject(run.context);
  const products = new Map<string, Record<string, unknown>>();
  if (context && Array.isArray(context.products)) {
    for (const productValue of context.products) {
      const product = asObject(productValue);
      const id = typeof product?.id === "string" ? product.id.trim() : "";
      if (id) products.set(id, product!);
    }
  }
  const ids = visualCandidateProductIds(run, textProposal, products);
  if (ids.length > MAX_CANDIDATE_IMAGES) {
    throw new SourceImageCompositorError(
      "merchandising_image_limit",
      `Module merchandising shortlisted more than ${MAX_CANDIDATE_IMAGES} product images.`,
    );
  }
  const selected = ids.map((id) => {
    const product = products.get(id);
    const imageUrl = typeof product?.imageUrl === "string" ? product.imageUrl.trim() : "";
    if (!product || !imageUrl) {
      throw new SourceImageCompositorError(
        "source_image_missing",
        `Source-scene product ${id} requires a catalog image URL.`,
      );
    }
    return { id, imageUrl };
  });
  if (selected.length === 0) {
    return { attachments: [], productIds: [], cleanup: async () => undefined };
  }

  const root = await mkdtemp(join(tmpdir(), "yami-topic-merchandising-images-"));
  try {
    const attachments = await Promise.all(selected.map(async ({ id, imageUrl }, index) => {
      const bytes = await fetchApprovedSourceImage(imageUrl, options);
      const path = join(root, `${String(index + 1).padStart(2, "0")}-${id}.webp`);
      await writeFile(path, await productThumbnail(bytes), { flag: "wx" });
      return { path, label: `product:${id}` };
    }));
    return {
      attachments,
      productIds: selected.map(({ id }) => id),
      cleanup: async () => rm(root, { recursive: true, force: true }),
    };
  } catch (error) {
    await rm(root, { recursive: true, force: true });
    throw error;
  }
}
