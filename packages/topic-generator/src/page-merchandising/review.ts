import type { ProductPool, ProductRole, ThemeIntent, TopicModuleId } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import { sha256Digest } from "../product-selection/digest.js";
import { getPageMerchandisingTemplateConfig } from "./config.js";
import type {
  ModuleMerchandisingProposalReview,
  PageMerchandisingAssignmentProposal,
  PageMerchandisingModuleProposal,
  PageMerchandisingSceneProposal,
  TopicPageTemplateRef,
} from "./contracts.js";

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function exactOrder(left: readonly string[], right: readonly string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

const DETERMINISTIC_SELECTION_MODULE_IDS = new Set<TopicModuleId>([
  "start-here",
  "popular-picks",
  "brand-spotlight",
  "explore-more",
]);

const REFERENCE_MODULE_IDS = new Set<TopicModuleId>(["hero", "shortcuts"]);

function sourceSceneProductOrder(selection: ProductSelectionResult) {
  return new Map(selection.scenes.map((scene) => [
    scene.id,
    scene.productGroups.flatMap(({ core, pairing, accessory }) =>
      [core, pairing, accessory].filter((id): id is string => Boolean(id))
    ),
  ]));
}

function sourceSceneProductIds(selection: ProductSelectionResult) {
  return new Map([...sourceSceneProductOrder(selection)].map(([sceneId, productIds]) => [
    sceneId,
    new Set(productIds),
  ]));
}

export function productSelectionDigest(selection: ProductSelectionResult) {
  return sha256Digest(selection);
}

export function themeIntentDigest(intent: ThemeIntent) {
  return sha256Digest(intent);
}

export function reviewModuleMerchandisingProposal(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  value: unknown,
  expectedTemplateRef?: TopicPageTemplateRef,
): ModuleMerchandisingProposalReview {
  const proposal = objectValue(value);
  const issues: string[] = [];
  if (!proposal) {
    return {
      status: "rejected",
      issues: ["ModuleMerchandisingProposal must be a JSON object."],
    };
  }

  const templateRef = stringValue(proposal.templateRef) as TopicPageTemplateRef;
  let config;
  try {
    config = getPageMerchandisingTemplateConfig(templateRef);
  } catch {
    return {
      status: "rejected",
      issues: [`Unknown PageMerchandising template: ${templateRef || "missing"}`],
    };
  }

  if (proposal.schemaVersion !== "module-merchandising-proposal/v1") {
    issues.push('schemaVersion must be "module-merchandising-proposal/v1".');
  }
  if (proposal.keyword !== selection.keyword) {
    issues.push("Proposal keyword does not match ProductSelectionResult.");
  }
  if (proposal.site !== selection.site) {
    issues.push("Proposal site does not match ProductSelectionResult.");
  }
  if (proposal.strategyRef !== selection.strategyRef) {
    issues.push("Proposal strategyRef does not match ProductSelectionResult.");
  }
  if (expectedTemplateRef && templateRef !== expectedTemplateRef) {
    issues.push("Proposal templateRef does not match the PageMerchandising task.");
  }
  if (proposal.themeIntentDigest !== themeIntentDigest(intent)) {
    issues.push("Proposal themeIntentDigest does not match ThemeIntent.");
  }
  if (proposal.productSelectionDigest !== productSelectionDigest(selection)) {
    issues.push("Proposal productSelectionDigest does not match ProductSelectionResult.");
  }

  const rawModuleOrder = Array.isArray(proposal.moduleOrder)
    ? proposal.moduleOrder.filter((item): item is string => typeof item === "string")
    : [];
  if (!Array.isArray(proposal.moduleOrder)) issues.push("moduleOrder must be an array.");
  else if (rawModuleOrder.length !== proposal.moduleOrder.length) {
    issues.push("moduleOrder may contain only module IDs.");
  }
  if (!exactOrder(rawModuleOrder, config.moduleOrder)) {
    issues.push(`moduleOrder must match ${config.moduleOrder.join(" -> ")}.`);
  }

  const rawModules = Array.isArray(proposal.modules) ? proposal.modules : [];
  if (!Array.isArray(proposal.modules)) issues.push("modules must be an array.");
  if (rawModules.length !== config.modules.length) {
    issues.push(`Proposal must define exactly ${config.modules.length} modules.`);
  }

  const productsById = new Map(selection.products.map((product) => [product.id, product]));
  const primaryIds = new Set(selection.pools.primaryIds);
  const relatedIds = new Set(selection.pools.relatedIds);
  const sourceScenesById = new Map(selection.scenes.map((scene) => [scene.id, scene]));
  const sourceProductOrderByScene = sourceSceneProductOrder(selection);
  const sourceProductsByScene = sourceSceneProductIds(selection);
  const selectionModulesById = new Map<
    TopicModuleId,
    ProductSelectionResult["modules"][number]
  >(selection.modules.map((module) => [module.id, module]));
  const preserveModuleAssignments = config.assignmentAuthority === "product-selection";
  const selectionOwnedProductIds = new Set(
    selection.modules.flatMap(({ productIds }) => productIds),
  );
  const firstModuleByProduct = new Map<string, TopicModuleId>();
  const seenModuleIds = new Set<TopicModuleId>();
  const modules: PageMerchandisingModuleProposal[] = [];

  rawModules.forEach((rawModule, moduleIndex) => {
    const module = objectValue(rawModule);
    if (!module) {
      issues.push(`modules[${moduleIndex}] must be an object.`);
      return;
    }
    const id = stringValue(module.id) as TopicModuleId;
    const rule = config.modules.find((candidate) => candidate.id === id);
    if (!rule) {
      issues.push(`Module ${id || moduleIndex} is not supported by ${config.ref}.`);
      return;
    }
    if (seenModuleIds.has(id)) issues.push(`Module ${id} is defined more than once.`);
    seenModuleIds.add(id);
    if (id !== rawModuleOrder[moduleIndex]) {
      issues.push(`Module ${id} does not match moduleOrder position ${moduleIndex}.`);
    }

    const visible = module.visible === true;
    if (typeof module.visible !== "boolean") issues.push(`Module ${id} visible must be boolean.`);
    const shoppingGoal = stringValue(module.shoppingGoal);
    const reason = stringValue(module.reason);
    if (visible && !shoppingGoal) issues.push(`Visible module ${id} requires shoppingGoal.`);
    if (!visible && shoppingGoal) issues.push(`Hidden module ${id} cannot define shoppingGoal.`);
    if (!reason) issues.push(`Module ${id} requires a reviewable reason.`);
    if (rule.required && !visible) issues.push(`Required module ${id} cannot be hidden.`);
    if (visible && rule.maximumProducts === 0) {
      issues.push(`Module ${id} cannot be visible without supported evidence.`);
    }
    const selectionModule = preserveModuleAssignments && DETERMINISTIC_SELECTION_MODULE_IDS.has(id)
      ? selectionModulesById.get(id)
      : undefined;

    const rawScenes = Array.isArray(module.scenes) ? module.scenes : [];
    if (!Array.isArray(module.scenes)) issues.push(`Module ${id} scenes must be an array.`);
    const scenes: PageMerchandisingSceneProposal[] = [];
    const seenSceneIds = new Set<string>();
    rawScenes.forEach((rawScene, sceneIndex) => {
      const scene = objectValue(rawScene);
      if (!scene) {
        issues.push(`Module ${id} scene ${sceneIndex} must be an object.`);
        return;
      }
      const sceneId = stringValue(scene.id);
      const sourceSceneId = stringValue(scene.sourceSceneId);
      const sceneGoal = stringValue(scene.shoppingGoal);
      const sceneReason = stringValue(scene.reason);
      if (!sceneId) issues.push(`Module ${id} scene ${sceneIndex} requires id.`);
      if (seenSceneIds.has(sceneId)) issues.push(`Module ${id} scene ${sceneId} is duplicated.`);
      seenSceneIds.add(sceneId);
      if (!sourceScenesById.has(sourceSceneId)) {
        issues.push(`Source scene ${sourceSceneId || sceneIndex} is absent from ProductSelectionResult.`);
      }
      if (!sceneGoal || !sceneReason) {
        issues.push(`Module ${id} scene ${sceneId || sceneIndex} requires shoppingGoal and reason.`);
      }
      if (sceneId && sourceSceneId && sceneGoal && sceneReason) {
        scenes.push({ id: sceneId, sourceSceneId, shoppingGoal: sceneGoal, reason: sceneReason });
      }
    });
    if (!rule.sceneRange && scenes.length > 0) issues.push(`Module ${id} does not accept scenes.`);
    if (visible && rule.sceneRange) {
      const [minimumScenes, maximumScenes] = rule.sceneRange;
      if (scenes.length < minimumScenes || scenes.length > maximumScenes) {
        issues.push(`Module ${id} must contain ${minimumScenes}-${maximumScenes} scenes.`);
      }
    }

    const rawAssignments = Array.isArray(module.assignments) ? module.assignments : [];
    if (!Array.isArray(module.assignments)) {
      issues.push(`Module ${id} assignments must be an array.`);
    }
    if (!visible && (rawAssignments.length > 0 || scenes.length > 0)) {
      issues.push(`Hidden module ${id} cannot contain scenes or product assignments.`);
    }
    if (visible && (
      rawAssignments.length < rule.minimumProducts ||
      rawAssignments.length > rule.maximumProducts
    )) {
      issues.push(
        `Module ${id} must assign ${rule.minimumProducts}-${rule.maximumProducts} products when visible.`,
      );
    }

    const assignments: PageMerchandisingAssignmentProposal[] = [];
    const nonSceneProductIds = new Set<string>();
    const productIdsByScene = new Map<string, Set<string>>();
    rawAssignments.forEach((rawAssignment, assignmentIndex) => {
      const assignment = objectValue(rawAssignment);
      if (!assignment) {
        issues.push(`Module ${id} assignment ${assignmentIndex} must be an object.`);
        return;
      }
      const productId = stringValue(assignment.productId);
      const sceneId = stringValue(assignment.sceneId) || undefined;
      const reuseReason = stringValue(assignment.reuseReason) || undefined;
      const product = productsById.get(productId);
      if (!product) {
        issues.push(`Product ${productId || assignmentIndex} is absent from ProductSelectionResult.`);
      } else {
        const inPrimary = primaryIds.has(productId);
        const inRelated = relatedIds.has(productId);
        const pool: ProductPool | null = inPrimary ? "primary" : inRelated ? "related" : null;
        if (!pool) issues.push(`Product ${productId} is outside the frozen ProductSelection pools.`);
        else if (!rule.allowedPools.includes(pool)) {
          issues.push(`Product ${productId} cannot use the ${pool} pool in module ${id}.`);
        }
        if (!rule.allowedRoles.includes(product.role as ProductRole)) {
          issues.push(`Product ${productId} cannot fill the ${product.role} role in module ${id}.`);
        }
        if (selectionModule && !selectionModule.productIds.includes(productId)) {
          issues.push(`Product ${productId} is not assigned to module ${id} by ProductSelectionResult.`);
        }
        if (preserveModuleAssignments && REFERENCE_MODULE_IDS.has(id) &&
            !selectionOwnedProductIds.has(productId)) {
          issues.push(
            `Product ${productId} can be referenced by module ${id} only after ProductSelection assigns it to an owned module.`,
          );
        }
      }

      if (rule.sceneRange) {
        if (!sceneId) {
          issues.push(`Module ${id} assignment ${productId || assignmentIndex} requires sceneId.`);
        } else {
          const scene = scenes.find((candidate) => candidate.id === sceneId);
          if (!scene) {
            issues.push(`Module ${id} assignment references unknown scene ${sceneId}.`);
          } else if (!sourceProductsByScene.get(scene.sourceSceneId)?.has(productId)) {
            issues.push(`Product ${productId} is not part of source scene ${scene.sourceSceneId}.`);
          }
          const sceneProducts = productIdsByScene.get(sceneId) ?? new Set<string>();
          if (sceneProducts.has(productId)) {
            issues.push(`Product ${productId} is duplicated within scene ${sceneId}.`);
          }
          sceneProducts.add(productId);
          productIdsByScene.set(sceneId, sceneProducts);
        }
      } else {
        if (sceneId) issues.push(`Module ${id} assignment ${productId} cannot reference a scene.`);
        if (nonSceneProductIds.has(productId)) {
          issues.push(`Module ${id} assigns product ${productId} more than once.`);
        }
        nonSceneProductIds.add(productId);
      }

      const firstModule = firstModuleByProduct.get(productId);
      if (firstModule && firstModule !== id) {
        if (preserveModuleAssignments && !REFERENCE_MODULE_IDS.has(firstModule) &&
            !REFERENCE_MODULE_IDS.has(id)) {
          issues.push(
            `Product ${productId} cannot be reused across ProductSelection-owned modules ${firstModule} and ${id}.`,
          );
        } else if (!reuseReason) {
          issues.push(`Product ${productId} is reused across modules without a reuseReason.`);
        }
      }
      if (!firstModule) firstModuleByProduct.set(productId, id);
      if (productId) assignments.push({ productId, ...(sceneId ? { sceneId } : {}), ...(reuseReason ? { reuseReason } : {}) });
    });
    scenes.forEach((scene) => {
      const assignedProductIds = assignments
        .filter((assignment) => assignment.sceneId === scene.id)
        .map(({ productId }) => productId);
      if (assignedProductIds.length === 0) {
        issues.push(`Module ${id} scene ${scene.id} has no product assignments.`);
      }
      if (preserveModuleAssignments && id === "start-here") {
        const expectedProductIds = sourceProductOrderByScene.get(scene.sourceSceneId) ?? [];
        if (!exactOrder(assignedProductIds, expectedProductIds)) {
          issues.push(
            `Page scene ${scene.id} must preserve every product from source scene ${scene.sourceSceneId} in order.`,
          );
        }
      }
    });
    if (visible && selectionModule && !exactOrder(
      assignments.map(({ productId }) => productId),
      selectionModule.productIds,
    )) {
      issues.push(`Module ${id} must preserve ProductSelectionResult product order.`);
    }
    if (visible && preserveModuleAssignments && id === "start-here" && !exactOrder(
      scenes.map(({ sourceSceneId }) => sourceSceneId),
      selection.scenes.map(({ id: sourceSceneId }) => sourceSceneId),
    )) {
      issues.push(
        "Module start-here must preserve each ProductSelectionResult source scene exactly once and in order.",
      );
    }

    modules.push({ id, visible, shoppingGoal, reason, scenes, assignments });
  });

  config.modules.forEach(({ id }) => {
    if (!seenModuleIds.has(id)) issues.push(`Module ${id} is missing from the proposal.`);
  });

  if (issues.length > 0) return { status: "rejected", issues };
  return {
    status: "accepted",
    issues: [],
    proposal: {
      schemaVersion: "module-merchandising-proposal/v1",
      keyword: selection.keyword,
      site: selection.site,
      strategyRef: selection.strategyRef,
      templateRef,
      themeIntentDigest: themeIntentDigest(intent),
      productSelectionDigest: productSelectionDigest(selection),
      moduleOrder: [...config.moduleOrder],
      modules,
    },
  };
}
