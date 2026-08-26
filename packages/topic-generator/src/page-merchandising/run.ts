import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type {
  ContentLanguage,
  ThemeIntent,
  TopicModuleId,
  TopicPagePlan,
} from "../types.js";
import { sha256Digest } from "../product-selection/digest.js";
import {
  evidenceSizedSceneProductRange,
  getPageMerchandisingTemplateConfig,
  type PageMerchandisingTemplateConfig,
} from "./config.js";
import type {
  ModuleMerchandisingProposal,
  PageMerchandisingModuleProposal,
  PageMerchandisingRun,
  PageMerchandisingTaskContext,
  TopicPagePlanModuleV2,
  TopicPagePlanV2,
  TopicPageTemplateRef,
} from "./contracts.js";
import {
  brandSpotlightSelectionIssues,
  productSelectionDigest,
  preservesCurrentRelevanceSelectionAssignments,
  reviewModuleMerchandisingProposal,
  themeIntentDigest,
} from "./review.js";

export interface PageMerchandisingRequest {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
  language?: ContentLanguage;
  templateRef?: TopicPageTemplateRef;
  proposal?: unknown;
}

function proposalTemplateRef(value: unknown): TopicPageTemplateRef | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const templateRef = (value as Record<string, unknown>).templateRef;
  return typeof templateRef === "string" ? templateRef as TopicPageTemplateRef : undefined;
}

function assetTaskIds(
  module: ModuleMerchandisingProposal["modules"][number],
  mode: ReturnType<typeof getPageMerchandisingTemplateConfig>["modules"][number]["assetTaskMode"],
  selection: ProductSelectionResult,
) {
  if (!module.visible || mode === "none") return [];
  if (mode === "module") return [`asset-${module.id}`];
  if (mode === "assignment") {
    return module.assignments.map((_, index) => `asset-${module.id}-${index + 1}`);
  }
  if (mode === "scene") {
    return module.scenes.map((scene) => `asset-${module.id}-${scene.id}`);
  }
  const productsById = new Map(selection.products.map((product) => [product.id, product]));
  const brands = [...new Set(module.assignments
    .map(({ productId }) => productsById.get(productId)?.brand.trim())
    .filter((brand): brand is string => Boolean(brand)))];
  return brands.map((_, index) => `asset-${module.id}-${index + 1}`);
}

function compileAcceptedPlan(
  selection: ProductSelectionResult,
  proposal: ModuleMerchandisingProposal,
): TopicPagePlanV2 {
  const config = getPageMerchandisingTemplateConfig(proposal.templateRef);
  const productsById = new Map(selection.products.map((product) => [product.id, product]));
  const primaryIds = new Set(selection.pools.primaryIds);
  const modules: TopicPagePlanModuleV2[] = proposal.modules.map((module) => {
    const rule = config.modules.find((candidate) => candidate.id === module.id)!;
    const assignments = module.assignments.map((assignment, index) => {
      const product = productsById.get(assignment.productId)!;
      return {
        slotId: `${module.id}-${index + 1}`,
        productId: assignment.productId,
        pool: primaryIds.has(assignment.productId) ? "primary" as const : "related" as const,
        role: product.role,
        ...(assignment.groupId ? { groupId: assignment.groupId } : {}),
        ...(assignment.sceneId ? { sceneId: assignment.sceneId } : {}),
        ...(assignment.reuseReason ? { reuseReason: assignment.reuseReason } : {}),
        ...(assignment.selectionReason ? { selectionReason: assignment.selectionReason } : {}),
      };
    });
    return {
      id: module.id,
      component: rule.component,
      visible: module.visible,
      shoppingGoal: module.shoppingGoal,
      reason: module.reason,
      assignments,
      scenes: module.scenes.map((scene) => ({
        ...scene,
        productIds: assignments
          .filter((assignment) => assignment.sceneId === scene.id)
          .map(({ productId }) => productId),
      })),
      contentTaskId: module.visible ? `content-${module.id}` : null,
      assetTaskIds: assetTaskIds(module, rule.assetTaskMode, selection),
    };
  });
  const plan = {
    schemaVersion: "topic-page-plan/v2" as const,
    status: "plan-ready" as const,
    keyword: selection.keyword,
    site: selection.site,
    strategyRef: selection.strategyRef,
    templateRef: proposal.templateRef,
    themeIntentDigest: proposal.themeIntentDigest,
    productSelectionDigest: proposal.productSelectionDigest,
    moduleOrder: [...proposal.moduleOrder],
    modules,
    productReusePolicy: {
      crossModule: config.assignmentAuthority === "product-selection"
        ? "reference-modules-only" as const
        : "requires-reason" as const,
      withinScene: "forbidden" as const,
      ...(config.assignmentAuthority === "product-selection"
        ? { referenceModules: ["hero", "shortcuts"] as ("hero" | "shortcuts")[] }
        : {}),
    },
  };
  return { ...plan, digest: sha256Digest(plan) };
}

export function compileTopicPagePlanV2(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  proposal: unknown,
): TopicPagePlanV2 {
  const review = reviewModuleMerchandisingProposal(intent, selection, proposal);
  if (review.status !== "accepted" || !review.proposal) {
    throw new Error(`ModuleMerchandisingProposal rejected: ${review.issues.join(" ")}`);
  }
  return compileAcceptedPlan(selection, review.proposal);
}

export function compileDeterministicTopicPagePlanV2(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  sourcePlan: TopicPagePlan,
  templateRef: TopicPageTemplateRef,
): TopicPagePlanV2 {
  const config = getPageMerchandisingTemplateConfig(templateRef);
  const sourceModulesById = new Map(sourcePlan.modules.map((module) => [module.id, module]));
  const selectionModulesById = new Map<
    TopicModuleId,
    ProductSelectionResult["modules"][number]
  >(selection.modules.map((module) => [module.id, module]));
  const assignedModuleByProductId = new Map<string, TopicModuleId>();
  const assignmentsWithReuseReason = (
    moduleId: TopicModuleId,
    assignments: PageMerchandisingModuleProposal["assignments"],
  ) => assignments.map((assignment) => {
    const firstModuleId = assignedModuleByProductId.get(assignment.productId);
    if (!firstModuleId) assignedModuleByProductId.set(assignment.productId, moduleId);
    return firstModuleId && firstModuleId !== moduleId
      ? {
          ...assignment,
          reuseReason: assignment.reuseReason ??
            `Rule fallback reuses the frozen ${firstModuleId} assignment.`,
        }
      : assignment;
  });
  const modules: ModuleMerchandisingProposal["modules"] = config.moduleOrder.map((id) => {
    const rule = config.modules.find((candidate) => candidate.id === id)!;
    const sourceModule = sourceModulesById.get(id);
    const selectionModule = selectionModulesById.get(id);
    const productSelectionOwnsAssignments = config.assignmentAuthority === "product-selection" &&
      (id === "start-here" || id === "popular-picks" || id === "brand-spotlight" ||
        id === "explore-more");
    const visible = id === "reviews"
      ? false
      : productSelectionOwnsAssignments
        ? Boolean(selectionModule?.productIds.length) || rule.required
        : Boolean(sourceModule?.visible);
    const shoppingGoal = visible
      ? sourceModule?.heading || sourceModule?.label || `Support the ${id} shopping task.`
      : "";
    const reason = sourceModule?.reason || (visible
      ? `Rule fallback preserves the frozen ${id} product assignment.`
      : `Rule fallback hides ${id} because no verified assignment is available.`);

    if (id === "shortcuts") {
      const groups = selectionModulesById.get("shortcuts")?.groups ?? sourceModule?.groups ?? [];
      return {
        id,
        visible,
        shoppingGoal,
        reason,
        scenes: [],
        assignments: assignmentsWithReuseReason(id, groups.flatMap((group) => {
          const productId = group.productIds[0];
          return productId
            ? [{
                productId,
                groupId: group.id,
                selectionReason: group.classificationReason || sourceModule?.productReasons?.[productId] ||
                  `Highest-ranked frozen representative for ${group.label}.`,
              }]
            : [];
        })),
      };
    }

    if (id === "start-here" && visible) {
      const scenes = selection.scenes.map((scene) => {
        const sourceGroup = selectionModule?.groups.find((group) => group.id === scene.id);
        const productIds = scene.productGroups.flatMap(({ core, pairing, accessory }) =>
          [core, pairing, accessory].filter((productId): productId is string => Boolean(productId))
        );
        return {
          scene: {
            id: scene.id,
            sourceSceneId: scene.id,
            ...(rule.requireSceneTargetProductCount
              ? { targetProductCount: productIds.length }
              : {}),
            shoppingGoal: sourceGroup?.shoppingGoal || scene.title,
            reason: sourceGroup?.scenarioReason || scene.description,
          },
          productIds,
        };
      });
      return {
        id,
        visible,
        shoppingGoal,
        reason,
        scenes: scenes.map(({ scene }) => scene),
        assignments: assignmentsWithReuseReason(id, scenes.flatMap(({ scene, productIds }) =>
          productIds.map((productId) => ({ productId, sceneId: scene.id }))
        )),
      };
    }

    const groupIdByProductId = new Map(
      (selectionModule?.groups ?? []).flatMap((group) =>
        group.productIds.map((productId) => [productId, group.id] as const)
      ),
    );
    const productIds = productSelectionOwnsAssignments
      ? selectionModule?.productIds ?? []
      : sourceModule?.productIds ?? [];
    return {
      id,
      visible,
      shoppingGoal,
      reason,
      scenes: [],
      assignments: assignmentsWithReuseReason(id, visible
        ? productIds.map((productId) => ({
            productId,
            ...(groupIdByProductId.has(productId)
              ? { groupId: groupIdByProductId.get(productId) }
              : {}),
            ...(id === "hero"
              ? {
                  selectionReason: sourceModule?.productReasons?.[productId] ||
                    "Highest-ranked frozen core product with distinct source imagery.",
                }
              : {}),
          }))
        : []),
    };
  });
  const proposal: ModuleMerchandisingProposal = {
    schemaVersion: "module-merchandising-proposal/v1",
    keyword: selection.keyword,
    site: selection.site,
    strategyRef: selection.strategyRef,
    templateRef,
    themeIntentDigest: themeIntentDigest(intent),
    productSelectionDigest: productSelectionDigest(selection),
    moduleOrder: [...config.moduleOrder],
    modules,
  };
  const review = reviewModuleMerchandisingProposal(intent, selection, proposal);
  if (review.status === "accepted" && review.proposal) {
    return compileAcceptedPlan(selection, review.proposal);
  }
  const capacityOnly = review.issues.length > 0 && review.issues.every((issue) =>
    /^Required module .+ cannot be hidden\.$/.test(issue) ||
    /^Module .+ must assign \d+-\d+ products when visible\.$/.test(issue)
  );
  if (capacityOnly) return compileAcceptedPlan(selection, proposal);
  throw new Error(`ModuleMerchandisingProposal rejected: ${review.issues.join(" ")}`);
}

function taskContext(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  templateRef: TopicPageTemplateRef,
  language: ContentLanguage,
): PageMerchandisingTaskContext {
  const config = getPageMerchandisingTemplateConfig(templateRef);
  const startHereRule = config.modules.find(({ id }) => id === "start-here");
  const startHereGroupsById = new Map(
    (selection.modules.find(({ id }) => id === "start-here")?.groups ?? [])
      .map((group) => [group.id, group]),
  );
  const shortcutGroupCount = selection.modules.find(({ id }) => id === "shortcuts")
    ?.groups.length ?? 0;
  const selectionModulesById = new Map<
    TopicModuleId,
    ProductSelectionResult["modules"][number]
  >(selection.modules.map((module) => [module.id, module]));
  return {
    keyword: selection.keyword,
    site: selection.site,
    language,
    strategyRef: selection.strategyRef,
    templateRef,
    themeIntentDigest: themeIntentDigest(intent),
    productSelectionDigest: productSelectionDigest(selection),
    assignmentAuthority: config.assignmentAuthority,
    moduleOrder: [...config.moduleOrder],
    moduleRules: config.modules.map((rule) => {
      const exactSelectionProductCount = (
        rule.id === "brand-spotlight" ||
        preservesCurrentRelevanceSelectionAssignments(templateRef, rule.id)
      )
        ? selectionModulesById.get(rule.id)?.productIds.length
        : undefined;
      return {
      id: rule.id,
      component: rule.component,
      required: rule.required,
      minimumProducts: exactSelectionProductCount ?? (
        rule.id === "shortcuts" && shortcutGroupCount > 0
          ? shortcutGroupCount
          : rule.minimumProducts
      ),
      maximumProducts: exactSelectionProductCount ?? (
        rule.id === "shortcuts"
          ? shortcutGroupCount > 0 ? shortcutGroupCount : selection.products.length
          : rule.maximumProducts
      ),
      allowedPools: [...rule.allowedPools],
      allowedRoles: [...rule.allowedRoles],
      ...(rule.sceneRange ? { sceneRange: rule.sceneRange } : {}),
      ...(rule.productsPerSceneRange
        ? { productsPerSceneRange: rule.productsPerSceneRange }
        : {}),
      ...(rule.requireSceneTargetProductCount
        ? { requireSceneTargetProductCount: true }
        : {}),
      };
    }),
    themeIntent: structuredClone(intent),
    selectedCategories: selection.selectedCategories.map((category) => ({
      ...category,
      path: [...category.path],
    })),
    selectionModules: selection.modules.map((module) => ({
      ...module,
      productIds: [...module.productIds],
      groups: module.groups.map((group) => ({
        ...group,
        productIds: [...group.productIds],
      })),
    })),
    sourceScenes: selection.scenes.map((scene) => {
      const productGroups = scene.productGroups.map((group) => ({ ...group }));
      const sourceCategoryIds = [
        ...(startHereGroupsById.get(scene.id)?.sourceCategoryIds ?? []),
      ];
      const sourceProductCount = productGroups.flatMap(({ core, pairing, accessory }) =>
        [core, pairing, accessory].filter(Boolean)
      ).length;
      const [minimumRecommendedProducts, maximumProducts] =
        evidenceSizedSceneProductRange(
          startHereRule?.productsPerSceneRange ?? [sourceProductCount, sourceProductCount],
          sourceProductCount,
          sourceCategoryIds.length,
        );
      return {
        ...scene,
        productGroups,
        sourceCategoryIds,
        minimumRecommendedProducts,
        maximumProducts,
      };
    }),
    products: selection.products.map((product) => ({
      id: product.id,
      title: product.title,
      brand: product.brand,
      imageUrl: product.imageUrl,
      sourceRank: product.sourceRank,
      categoryL3Id: product.categoryL3Id,
      categoryL3Name: product.categoryL3Name,
      soldCount: product.soldCount,
      weeklySalesLabel: product.weeklySalesLabel,
      availability: product.availability,
      pool: product.pool,
      role: product.role,
    })),
  };
}

function selectionPreflightIssues(
  selection: ProductSelectionResult,
  config: PageMerchandisingTemplateConfig,
) {
  const primaryIds = new Set(selection.pools.primaryIds);
  const relatedIds = new Set(selection.pools.relatedIds);
  const issues = brandSpotlightSelectionIssues(selection);
  if (config.assignmentAuthority === "product-selection") {
    const firstOwnedModuleByProduct = new Map<string, string>();
    selection.modules.forEach((module) => {
      module.productIds.forEach((productId) => {
        const firstModule = firstOwnedModuleByProduct.get(productId);
        if (firstModule && firstModule !== module.id) {
          issues.push(
            `Product ${productId} cannot be reused across ProductSelection-owned modules ${firstModule} and ${module.id}.`,
          );
        } else if (!firstModule) {
          firstOwnedModuleByProduct.set(productId, module.id);
        }
      });
    });
  }
  config.modules.filter(({ required }) => required).forEach((rule) => {
    const selectionModule = config.assignmentAuthority === "product-selection"
      ? selection.modules.find(({ id }) => id === rule.id)
      : undefined;
    if (selectionModule) {
      if (selectionModule.productIds.length < rule.minimumProducts) {
        issues.push(
          `Template ${config.ref} requires at least ${rule.minimumProducts} products already assigned to module ${rule.id} by ProductSelectionResult.`,
        );
      }
      if (rule.sceneRange && selection.scenes.length < rule.sceneRange[0]) {
        issues.push(
          `Template ${config.ref} requires at least ${rule.sceneRange[0]} validated source scenes for module ${rule.id}.`,
        );
      }
      return;
    }
    const eligibleProducts = selection.products.filter((product) => {
      const pool = primaryIds.has(product.id)
        ? "primary"
        : relatedIds.has(product.id)
          ? "related"
          : null;
      return pool !== null && rule.allowedPools.includes(pool) &&
        rule.allowedRoles.includes(product.role);
    });
    if (eligibleProducts.length < rule.minimumProducts) {
      issues.push(
        `Template ${config.ref} requires at least ${rule.minimumProducts} eligible products for module ${rule.id}.`,
      );
    }
    if (rule.sceneRange && selection.scenes.length < rule.sceneRange[0]) {
      issues.push(
        `Template ${config.ref} requires at least ${rule.sceneRange[0]} validated source scenes for module ${rule.id}.`,
      );
    }
  });
  return issues;
}

export function advancePageMerchandisingRun(
  request: PageMerchandisingRequest,
): PageMerchandisingRun {
  const templateRef = request.templateRef ?? proposalTemplateRef(request.proposal);
  if (!templateRef) {
    const proposalReview = {
      status: "rejected" as const,
      issues: ["PageMerchandising requires a versioned templateRef."],
    };
    return {
      schemaVersion: "page-merchandising-run/v1",
      status: "blocked",
      issues: proposalReview.issues,
      proposalReview,
    };
  }
  let config: PageMerchandisingTemplateConfig;
  try {
    config = getPageMerchandisingTemplateConfig(templateRef);
  } catch (error) {
    const proposalReview = {
      status: "rejected" as const,
      issues: [error instanceof Error ? error.message : "Unknown PageMerchandising template."],
    };
    return {
      schemaVersion: "page-merchandising-run/v1",
      status: "blocked",
      issues: proposalReview.issues,
      proposalReview,
    };
  }
  const preflightIssues = selectionPreflightIssues(request.selection, config);
  if (preflightIssues.length > 0) {
    const proposalReview = {
      status: "rejected" as const,
      issues: preflightIssues,
    };
    return {
      schemaVersion: "page-merchandising-run/v1",
      status: "blocked",
      issues: preflightIssues,
      proposalReview,
    };
  }
  if (request.proposal === undefined) {
    return {
      schemaVersion: "page-merchandising-run/v1",
      status: "needs-module-proposal",
      context: taskContext(
        request.intent,
        request.selection,
        templateRef,
        request.language ?? "en",
      ),
    };
  }

  const proposalReview = reviewModuleMerchandisingProposal(
    request.intent,
    request.selection,
    request.proposal,
    templateRef,
  );
  if (proposalReview.status !== "accepted" || !proposalReview.proposal) {
    return {
      schemaVersion: "page-merchandising-run/v1",
      status: "blocked",
      issues: proposalReview.issues,
      proposalReview,
    };
  }
  return {
    schemaVersion: "page-merchandising-run/v1",
    status: "ready",
    plan: compileAcceptedPlan(request.selection, proposalReview.proposal),
    proposalReview,
  };
}
