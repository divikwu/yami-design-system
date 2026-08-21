import type { ProductPool, ProductRole, ThemeIntent, TopicModuleId } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import { sha256Digest } from "../product-selection/digest.js";
import {
  evidenceSizedSceneProductRange,
  getPageMerchandisingTemplateConfig,
} from "./config.js";
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

function normalizedBrand(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function brandSpotlightSelectionIssues(selection: ProductSelectionResult) {
  const module = selection.modules.find(({ id }) => id === "brand-spotlight");
  if (!module) return [];
  if (module.groups.length === 0 && module.productIds.length === 0) return [];

  const issues: string[] = [];
  if (module.groups.length < 2 || module.groups.length > 6) {
    issues.push("ProductSelection Brand Spotlight must contain 2-6 brand groups.");
  }
  const productsById = new Map(selection.products.map((product) => [product.id, product]));
  const primaryIds = new Set(selection.pools.primaryIds);
  const seenGroupIds = new Set<string>();
  const seenBrandKeys = new Set<string>();
  const seenProductIds = new Set<string>();
  module.groups.forEach((group) => {
    if (seenGroupIds.has(group.id)) {
      issues.push(`ProductSelection Brand Spotlight group ${group.id} is duplicated.`);
    }
    seenGroupIds.add(group.id);
    if (group.productIds.length !== 3) {
      issues.push(`ProductSelection Brand Spotlight group ${group.id} must contain exactly 3 products.`);
    }
    const brandKeys = new Set<string>();
    group.productIds.forEach((productId) => {
      if (seenProductIds.has(productId)) {
        issues.push(`ProductSelection Brand Spotlight product ${productId} is duplicated.`);
      }
      seenProductIds.add(productId);
      const product = productsById.get(productId);
      if (!product) {
        issues.push(`ProductSelection Brand Spotlight product ${productId} is missing.`);
        return;
      }
      if (!primaryIds.has(productId)) {
        issues.push(`ProductSelection Brand Spotlight product ${productId} is outside PrimaryPool.`);
      }
      brandKeys.add(product.brandId
        ? `id:${product.brandId}`
        : `label:${normalizedBrand(product.brand)}`);
    });
    if (brandKeys.size !== 1) {
      issues.push(`ProductSelection Brand Spotlight group ${group.id} mixes multiple brands.`);
    }
    const brandKey = [...brandKeys][0];
    if (brandKey && seenBrandKeys.has(brandKey)) {
      issues.push(`ProductSelection Brand Spotlight repeats brand ${group.label}.`);
    }
    if (brandKey) seenBrandKeys.add(brandKey);
  });
  const groupedProductIds = module.groups.flatMap(({ productIds }) => productIds);
  if (!exactOrder(module.productIds, groupedProductIds)) {
    issues.push("ProductSelection Brand Spotlight productIds must match grouped brand order.");
  }
  return issues;
}

const DETERMINISTIC_SELECTION_MODULE_IDS = new Set<TopicModuleId>([
  "start-here",
  "popular-picks",
  "brand-spotlight",
  "explore-more",
]);

const CURRENT_RELEVANCE_TEMPLATE_REFS = new Set<TopicPageTemplateRef>([
  "topic-landing/brand-relevance@2",
  "topic-landing/topic-relevance@2",
  "topic-landing/campaign-relevance@2",
]);

const CURRENT_RELEVANCE_SELECTION_MODULE_IDS = new Set<TopicModuleId>([
  "popular-picks",
  "explore-more",
]);

export function preservesCurrentRelevanceSelectionAssignments(
  templateRef: TopicPageTemplateRef,
  moduleId: TopicModuleId,
) {
  return CURRENT_RELEVANCE_TEMPLATE_REFS.has(templateRef) &&
    CURRENT_RELEVANCE_SELECTION_MODULE_IDS.has(moduleId);
}

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
  const sourceGroupsById = new Map(
    (selectionModulesById.get("start-here")?.groups ?? []).map((group) => [group.id, group]),
  );
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
    const preserveCurrentRelevanceAssignments =
      preservesCurrentRelevanceSelectionAssignments(templateRef, id);
    const selectionModule = preserveModuleAssignments && DETERMINISTIC_SELECTION_MODULE_IDS.has(id)
      ? selectionModulesById.get(id)
      : id === "brand-spotlight" || preserveCurrentRelevanceAssignments
        ? selectionModulesById.get(id)
        : undefined;
    const shortcutSelectionModule = id === "shortcuts"
      ? selectionModulesById.get("shortcuts")
      : undefined;
    const shortcutGroupsById = new Map(
      (shortcutSelectionModule?.groups ?? []).map((group) => [group.id, group]),
    );
    const brandGroups = id === "brand-spotlight" ? selectionModule?.groups ?? [] : [];
    const brandGroupIdByProductId = new Map(
      brandGroups.flatMap((group) => group.productIds.map((productId) => [productId, group.id] as const)),
    );
    const exactSelectionProductCount = selectionModule && (
      id === "brand-spotlight" || preserveCurrentRelevanceAssignments
    )
      ? selectionModule.productIds.length
      : null;
    const minimumProducts = exactSelectionProductCount !== null
      ? exactSelectionProductCount
      : id === "shortcuts" && shortcutGroupsById.size > 0
        ? shortcutGroupsById.size
        : rule.minimumProducts;
    const maximumProducts = exactSelectionProductCount !== null
      ? exactSelectionProductCount
      : id === "shortcuts"
        ? shortcutGroupsById.size > 0 ? shortcutGroupsById.size : selection.products.length
        : rule.maximumProducts;
    if (id === "brand-spotlight" && exactSelectionProductCount !== null) {
      if (exactSelectionProductCount > 0 && !visible) {
        issues.push("Module brand-spotlight must be visible when ProductSelection provides 2-6 eligible brand groups.");
      }
      if (exactSelectionProductCount === 0 && visible) {
        issues.push("Module brand-spotlight must be hidden when ProductSelection provides fewer than two eligible brands.");
      }
    }

    const rawScenes = Array.isArray(module.scenes) ? module.scenes : [];
    if (!Array.isArray(module.scenes)) issues.push(`Module ${id} scenes must be an array.`);
    const scenes: PageMerchandisingSceneProposal[] = [];
    const seenSceneIds = new Set<string>();
    const seenSourceSceneIds = new Set<string>();
    rawScenes.forEach((rawScene, sceneIndex) => {
      const scene = objectValue(rawScene);
      if (!scene) {
        issues.push(`Module ${id} scene ${sceneIndex} must be an object.`);
        return;
      }
      const sceneId = stringValue(scene.id);
      const sourceSceneId = stringValue(scene.sourceSceneId);
      const targetProductCount = typeof scene.targetProductCount === "number" &&
          Number.isInteger(scene.targetProductCount)
        ? scene.targetProductCount
        : undefined;
      const sceneGoal = stringValue(scene.shoppingGoal);
      const sceneReason = stringValue(scene.reason);
      if (!sceneId) issues.push(`Module ${id} scene ${sceneIndex} requires id.`);
      if (seenSceneIds.has(sceneId)) issues.push(`Module ${id} scene ${sceneId} is duplicated.`);
      seenSceneIds.add(sceneId);
      if (!sourceScenesById.has(sourceSceneId)) {
        issues.push(`Source scene ${sourceSceneId || sceneIndex} is absent from ProductSelectionResult.`);
      } else if (seenSourceSceneIds.has(sourceSceneId)) {
        issues.push(`Source scene ${sourceSceneId} is used more than once in module ${id}.`);
      } else {
        seenSourceSceneIds.add(sourceSceneId);
      }
      if (!sceneGoal || !sceneReason) {
        issues.push(`Module ${id} scene ${sceneId || sceneIndex} requires shoppingGoal and reason.`);
      }
      if (rule.requireSceneTargetProductCount && targetProductCount === undefined) {
        issues.push(
          `Module ${id} scene ${sceneId || sceneIndex} requires an integer targetProductCount.`,
        );
      }
      if (targetProductCount !== undefined && rule.productsPerSceneRange && sourceSceneId) {
        const sourceProductCount = sourceProductOrderByScene.get(sourceSceneId)?.length ?? 0;
        const sourceCategoryCount = sourceGroupsById.get(sourceSceneId)?.sourceCategoryIds?.length ?? 0;
        const [minimumTarget, maximumTarget] = evidenceSizedSceneProductRange(
          rule.productsPerSceneRange,
          sourceProductCount,
          sourceCategoryCount,
        );
        if (targetProductCount < minimumTarget || targetProductCount > maximumTarget) {
          issues.push(
            `Module ${id} scene ${sceneId || sceneIndex} targetProductCount must be ${minimumTarget}-${maximumTarget} based on its source categories and available products.`,
          );
        }
      }
      if (sceneId && sourceSceneId && sceneGoal && sceneReason) {
        scenes.push({
          id: sceneId,
          sourceSceneId,
          ...(targetProductCount !== undefined ? { targetProductCount } : {}),
          shoppingGoal: sceneGoal,
          reason: sceneReason,
        });
      }
    });
    if (!rule.sceneRange && scenes.length > 0) issues.push(`Module ${id} does not accept scenes.`);
    if (visible && rule.sceneRange) {
      const [minimumScenes, maximumScenes] = rule.sceneRange;
      if (scenes.length < minimumScenes || scenes.length > maximumScenes) {
        issues.push(`Module ${id} must contain ${minimumScenes}-${maximumScenes} scenes.`);
      }
      const sourceSceneOrder = new Map(
        selection.scenes.map((scene, index) => [scene.id, index]),
      );
      const proposedOrder = scenes.map((scene) => sourceSceneOrder.get(scene.sourceSceneId) ?? -1);
      if (proposedOrder.some((position, index) =>
        position < 0 || (index > 0 && position <= proposedOrder[index - 1]!)
      )) {
        issues.push(`Module ${id} scenes must preserve ProductSelectionResult source-scene order.`);
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
      rawAssignments.length < minimumProducts ||
      rawAssignments.length > maximumProducts
    )) {
      issues.push(
        `Module ${id} must assign ${minimumProducts}-${maximumProducts} products when visible.`,
      );
    }
    if (visible && shortcutGroupsById.size > 0 && rawAssignments.length !== shortcutGroupsById.size) {
      issues.push(
        `Module shortcuts must assign exactly one representative for each of ${shortcutGroupsById.size} ProductSelection groups.`,
      );
    }

    const assignments: PageMerchandisingAssignmentProposal[] = [];
    const nonSceneProductIds = new Set<string>();
    const productIdsByScene = new Map<string, Set<string>>();
    const heroImageKeys = new Set<string>();
    const shortcutImageKeys = new Set<string>();
    const assignedShortcutGroupIds = new Set<string>();
    rawAssignments.forEach((rawAssignment, assignmentIndex) => {
      const assignment = objectValue(rawAssignment);
      if (!assignment) {
        issues.push(`Module ${id} assignment ${assignmentIndex} must be an object.`);
        return;
      }
      const productId = stringValue(assignment.productId);
      const groupId = stringValue(assignment.groupId) || undefined;
      const sceneId = stringValue(assignment.sceneId) || undefined;
      const reuseReason = stringValue(assignment.reuseReason) || undefined;
      const selectionReason = stringValue(assignment.selectionReason) || undefined;
      if (id === "hero" && !selectionReason) {
        issues.push(`Hero assignment ${productId || assignmentIndex} requires selectionReason.`);
      }
      if (id === "shortcuts" && shortcutGroupsById.size > 0) {
        if (!groupId) {
          issues.push(`Shortcut assignment ${productId || assignmentIndex} requires groupId.`);
        } else if (!shortcutGroupsById.has(groupId)) {
          issues.push(`Shortcut assignment references unknown ProductSelection group ${groupId}.`);
        } else if (assignedShortcutGroupIds.has(groupId)) {
          issues.push(`Shortcut group ${groupId} is assigned more than once.`);
        } else {
          assignedShortcutGroupIds.add(groupId);
        }
        if (!selectionReason) {
          issues.push(`Shortcut assignment ${productId || assignmentIndex} requires selectionReason.`);
        }
      }
      if (id === "brand-spotlight" && brandGroups.length > 0) {
        const expectedGroupId = brandGroupIdByProductId.get(productId);
        if (!groupId) {
          issues.push(`Brand Spotlight assignment ${productId || assignmentIndex} requires groupId.`);
        } else if (!expectedGroupId) {
          issues.push(`Product ${productId} is not part of a ProductSelection Brand Spotlight group.`);
        } else if (groupId !== expectedGroupId) {
          issues.push(`Product ${productId} must remain in Brand Spotlight group ${expectedGroupId}.`);
        }
      }
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
        if (id === "hero") {
          const imageKey = product.imageUrl.trim().split(/[?#]/, 1)[0] ?? "";
          if (imageKey && heroImageKeys.has(imageKey)) {
            issues.push("Hero cannot assign more than one product with the same source image.");
          } else if (imageKey) {
            heroImageKeys.add(imageKey);
          }
        }
        if (id === "shortcuts" && shortcutGroupsById.size > 0) {
          const group = groupId ? shortcutGroupsById.get(groupId) : undefined;
          if (group && !group.productIds.includes(productId)) {
            issues.push(`Product ${productId} does not belong to shortcut group ${group.id}.`);
          }
          const imageKey = product.imageUrl.trim().split(/[?#]/, 1)[0] ?? "";
          if (imageKey && shortcutImageKeys.has(imageKey)) {
            issues.push("Shortcuts cannot assign more than one representative with the same source image.");
          } else if (imageKey) {
            shortcutImageKeys.add(imageKey);
          }
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
      if (productId) assignments.push({
        productId,
        ...(groupId ? { groupId } : {}),
        ...(sceneId ? { sceneId } : {}),
        ...(reuseReason ? { reuseReason } : {}),
        ...(selectionReason ? { selectionReason } : {}),
      });
    });
    if (visible && shortcutGroupsById.size > 0) {
      shortcutGroupsById.forEach((_group, groupId) => {
        if (!assignedShortcutGroupIds.has(groupId)) {
          issues.push(`Shortcut group ${groupId} has no representative assignment.`);
        }
      });
      if (!exactOrder(
        assignments.flatMap(({ groupId }) => groupId ? [groupId] : []),
        [...shortcutGroupsById.keys()],
      )) {
        issues.push("Module shortcuts must preserve ProductSelection group order.");
      }
    }
    if (visible && brandGroups.length > 0 && !exactOrder(
      assignments.flatMap(({ groupId }) => groupId ? [groupId] : []),
      selectionModule!.productIds.map((productId) => brandGroupIdByProductId.get(productId) ?? ""),
    )) {
      issues.push("Module brand-spotlight must preserve ProductSelection brand group order.");
    }
    scenes.forEach((scene) => {
      const assignedProductIds = assignments
        .filter((assignment) => assignment.sceneId === scene.id)
        .map(({ productId }) => productId);
      if (assignedProductIds.length === 0) {
        issues.push(`Module ${id} scene ${scene.id} has no product assignments.`);
      }
      if (visible && rule.productsPerSceneRange) {
        const [minimumSceneProducts, maximumSceneProducts] = rule.productsPerSceneRange;
        if (
          assignedProductIds.length < minimumSceneProducts ||
          assignedProductIds.length > maximumSceneProducts
        ) {
          issues.push(
            `Module ${id} scene ${scene.id} must assign ${minimumSceneProducts}-${maximumSceneProducts} products.`,
          );
        }
      }
      if (
        visible &&
        scene.targetProductCount !== undefined &&
        assignedProductIds.length !== scene.targetProductCount
      ) {
        issues.push(
          `Module ${id} scene ${scene.id} must assign exactly its targetProductCount of ${scene.targetProductCount} products.`,
        );
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
