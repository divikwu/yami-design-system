import { asObject } from "./json.ts";

function proposalObject(value: unknown) {
  const body = asObject(value);
  if (!body) throw new Error("Visual merchandising review returned a non-object result.");
  return asObject(body.proposal) ?? body;
}

function normalizedText(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function priority(product: Record<string, unknown>) {
  return {
    soldCount: typeof product.soldCount === "number"
      ? product.soldCount
      : Number.NEGATIVE_INFINITY,
    sourceRank: typeof product.sourceRank === "number"
      ? product.sourceRank
      : Number.MAX_SAFE_INTEGER,
  };
}

function preferredProductId(
  productIds: readonly string[],
  products: Map<string, Record<string, unknown>>,
) {
  return [...productIds].sort((leftId, rightId) => {
    const left = priority(products.get(leftId)!);
    const right = priority(products.get(rightId)!);
    return right.soldCount - left.soldCount || left.sourceRank - right.sourceRank;
  })[0]!;
}

export function applyMerchandisingVisualReview(
  run: Record<string, unknown>,
  inspectedProductIds: readonly string[],
  value: unknown,
) {
  const proposal = proposalObject(value);
  const visualReview = asObject(proposal.visualReview);
  if (visualReview?.schemaVersion !== "module-merchandising-visual-review/v1") {
    throw new Error("Visual merchandising pass must return visualReview metadata.");
  }
  const returnedIds = Array.isArray(visualReview.inspectedProductIds)
    ? visualReview.inspectedProductIds.filter((id): id is string => typeof id === "string")
    : [];
  if (returnedIds.length !== inspectedProductIds.length ||
      new Set(returnedIds).size !== returnedIds.length ||
      inspectedProductIds.some((id) => !returnedIds.includes(id))) {
    throw new Error("Visual merchandising pass must confirm every shortlisted product image.");
  }
  if (!Array.isArray(visualReview.duplicateGroups)) {
    throw new Error("Visual merchandising pass must return duplicateGroups.");
  }

  const context = asObject(run.context);
  const products = new Map<string, Record<string, unknown>>();
  if (context && Array.isArray(context.products)) {
    context.products.forEach((value) => {
      const product = asObject(value);
      const id = typeof product?.id === "string" ? product.id.trim() : "";
      if (id) products.set(id, product!);
    });
  }
  const sourceProductsByScene = new Map<string, Set<string>>();
  if (context && Array.isArray(context.sourceScenes)) {
    context.sourceScenes.forEach((value) => {
      const scene = asObject(value);
      const sceneId = typeof scene?.id === "string" ? scene.id.trim() : "";
      if (!sceneId || !Array.isArray(scene?.productGroups)) return;
      const ids = new Set<string>();
      scene.productGroups.forEach((groupValue) => {
        const group = asObject(groupValue);
        [group?.core, group?.pairing, group?.accessory].forEach((id) => {
          if (typeof id === "string" && id.trim()) ids.add(id.trim());
        });
      });
      sourceProductsByScene.set(sceneId, ids);
    });
  }

  const inspected = new Set(inspectedProductIds);
  const grouped = new Set<string>();
  const duplicateGroups = visualReview.duplicateGroups.map((value, index) => {
    const group = asObject(value);
    const productIds = Array.isArray(group?.productIds)
      ? group.productIds.filter((id): id is string => typeof id === "string" && Boolean(id.trim()))
        .map((id) => id.trim())
      : [];
    const reason = typeof group?.reason === "string" ? group.reason.trim() : "";
    if (productIds.length < 2 || new Set(productIds).size !== productIds.length || !reason) {
      throw new Error(`Visual duplicate group ${index + 1} is invalid.`);
    }
    const groupProducts = productIds.map((id) => {
      if (!inspected.has(id)) {
        throw new Error(`Visual duplicate product ${id} was not in the image shortlist.`);
      }
      if (grouped.has(id)) {
        throw new Error(`Visual duplicate product ${id} appears in more than one group.`);
      }
      const product = products.get(id);
      if (!product) throw new Error(`Visual duplicate product ${id} is absent from the run.`);
      grouped.add(id);
      return product;
    });
    const brands = new Set(groupProducts.map((product) => normalizedText(product.brand)));
    if (brands.size !== 1 || brands.has("")) {
      throw new Error(`Visual duplicate group ${index + 1} must contain one verified brand.`);
    }
    return {
      productIds,
      preferredProductId: preferredProductId(productIds, products),
    };
  });

  const adjusted = structuredClone(proposal);
  const modules = Array.isArray(adjusted.modules) ? adjusted.modules : [];
  modules.forEach((moduleValue) => {
    const module = asObject(moduleValue);
    if (module?.id !== "start-here" || !Array.isArray(module.assignments)) return;
    const pageScenes = new Map<string, string>();
    if (Array.isArray(module.scenes)) {
      module.scenes.forEach((sceneValue) => {
        const scene = asObject(sceneValue);
        const id = typeof scene?.id === "string" ? scene.id.trim() : "";
        const sourceSceneId = typeof scene?.sourceSceneId === "string"
          ? scene.sourceSceneId.trim()
          : "";
        if (id && sourceSceneId) pageScenes.set(id, sourceSceneId);
      });
    }
    const assignments = module.assignments.map(asObject);
    duplicateGroups.forEach(({ productIds, preferredProductId }) => {
      assignments.forEach((assignment) => {
        const productId = typeof assignment?.productId === "string"
          ? assignment.productId.trim()
          : "";
        if (!assignment || productId === preferredProductId || !productIds.includes(productId)) {
          return;
        }
        const sceneId = typeof assignment.sceneId === "string" ? assignment.sceneId.trim() : "";
        const sourceSceneId = pageScenes.get(sceneId);
        if (!sourceSceneId || !sourceProductsByScene.get(sourceSceneId)?.has(preferredProductId)) {
          throw new Error(
            `Preferred visual duplicate ${preferredProductId} cannot replace ${productId} in scene ${sceneId}.`,
          );
        }
        const preferredAlreadyAssigned = assignments.some((candidate) =>
          candidate !== assignment && candidate?.sceneId === sceneId &&
          candidate?.productId === preferredProductId
        );
        if (preferredAlreadyAssigned) {
          throw new Error(
            `Scene ${sceneId} selected more than one listing from a visual duplicate group.`,
          );
        }
        assignment.productId = preferredProductId;
        if (!assignment.reuseReason) {
          assignment.reuseReason =
            "Visual review retained the duplicate listing with stronger sales and source rank.";
        }
      });
    });
  });
  return adjusted;
}
