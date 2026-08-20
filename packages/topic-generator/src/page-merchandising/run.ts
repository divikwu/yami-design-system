import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type { ThemeIntent } from "../types.js";
import { sha256Digest } from "../product-selection/digest.js";
import {
  getPageMerchandisingTemplateConfig,
  type PageMerchandisingTemplateConfig,
} from "./config.js";
import type {
  ModuleMerchandisingProposal,
  PageMerchandisingRun,
  PageMerchandisingTaskContext,
  TopicPagePlanModuleV2,
  TopicPagePlanV2,
  TopicPageTemplateRef,
} from "./contracts.js";
import {
  productSelectionDigest,
  reviewModuleMerchandisingProposal,
  themeIntentDigest,
} from "./review.js";

export interface PageMerchandisingRequest {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
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
        ...(assignment.sceneId ? { sceneId: assignment.sceneId } : {}),
        ...(assignment.reuseReason ? { reuseReason: assignment.reuseReason } : {}),
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

function taskContext(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  templateRef: TopicPageTemplateRef,
): PageMerchandisingTaskContext {
  const config = getPageMerchandisingTemplateConfig(templateRef);
  return {
    keyword: selection.keyword,
    site: selection.site,
    strategyRef: selection.strategyRef,
    templateRef,
    themeIntentDigest: themeIntentDigest(intent),
    productSelectionDigest: productSelectionDigest(selection),
    assignmentAuthority: config.assignmentAuthority,
    moduleOrder: [...config.moduleOrder],
    moduleRules: config.modules.map((rule) => ({
      id: rule.id,
      component: rule.component,
      required: rule.required,
      minimumProducts: rule.minimumProducts,
      maximumProducts: rule.maximumProducts,
      allowedPools: [...rule.allowedPools],
      allowedRoles: [...rule.allowedRoles],
      ...(rule.sceneRange ? { sceneRange: rule.sceneRange } : {}),
    })),
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
    sourceScenes: selection.scenes.map((scene) => ({
      ...scene,
      productGroups: scene.productGroups.map((group) => ({ ...group })),
    })),
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
  const issues: string[] = [];
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
      context: taskContext(request.intent, request.selection, templateRef),
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
