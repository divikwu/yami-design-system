import type { ContentLanguage, ThemeIntent, TopicModuleId } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import { sha256Digest } from "../product-selection/digest.js";
import {
  productSelectionDigest,
  themeIntentDigest,
} from "../page-merchandising/review.js";
import type {
  TopicPageComponent,
  TopicPagePlanModuleV2,
  TopicPagePlanV2,
} from "../page-merchandising/contracts.js";
import type {
  EvidencedPageCopy,
  TopicPageContentCopy,
  TopicPageContentCopySlot,
  TopicPageContentItemCopy,
  TopicPageContentProposalReview,
  TopicPageContentSceneCopy,
  TopicPageContentTaskProposal,
} from "./contracts.js";
import {
  eligibleThemeIntentEvidenceIds,
  pageCopyProperNouns,
  pageCopyUsesRequestedLanguage,
  topicPageCopyMaxCharacters,
  usesStrictPageCopyPolicy,
} from "./config.js";

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

export function topicPagePlanDigest<T extends object>(plan: T) {
  const boundPlan = { ...plan } as { digest?: string };
  delete boundPlan.digest;
  return sha256Digest(boundPlan);
}

export function topicPageContentSpecDigest<T extends object>(spec: T) {
  const boundSpec = { ...spec } as { digest?: string };
  delete boundSpec.digest;
  return sha256Digest(boundSpec);
}

export function reviewTopicPageContentPreflight(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  plan: TopicPagePlanV2,
) {
  const issues: string[] = [];
  if (plan.schemaVersion !== "topic-page-plan/v2" || plan.status !== "plan-ready") {
    issues.push("TopicPageContent requires a ready topic-page-plan/v2.");
  }
  if (plan.digest !== topicPagePlanDigest(plan)) {
    issues.push("TopicPagePlan digest is invalid.");
  }
  if (plan.themeIntentDigest !== themeIntentDigest(intent)) {
    issues.push("TopicPagePlan themeIntentDigest does not match ThemeIntent.");
  }
  if (plan.productSelectionDigest !== productSelectionDigest(selection)) {
    issues.push("TopicPagePlan productSelectionDigest does not match ProductSelectionResult.");
  }
  if (plan.keyword !== selection.keyword) {
    issues.push("TopicPagePlan keyword does not match ProductSelectionResult.");
  }
  if (plan.site !== selection.site) {
    issues.push("TopicPagePlan site does not match ProductSelectionResult.");
  }
  if (plan.strategyRef !== selection.strategyRef) {
    issues.push("TopicPagePlan strategyRef does not match ProductSelectionResult.");
  }
  if (!exactOrder(plan.moduleOrder, plan.modules.map(({ id }) => id))) {
    issues.push("TopicPagePlan modules do not match moduleOrder.");
  }

  const productsById = new Map(selection.products.map((product) => [product.id, product]));
  const taskIds = new Set<string>();
  for (const module of plan.modules) {
    if (module.visible && !module.contentTaskId) {
      issues.push(`Visible module ${module.id} requires contentTaskId.`);
    }
    if (!module.visible && module.contentTaskId) {
      issues.push(`Hidden module ${module.id} cannot define contentTaskId.`);
    }
    if (module.contentTaskId) {
      if (taskIds.has(module.contentTaskId)) {
        issues.push(`TopicPagePlan contentTaskId ${module.contentTaskId} is duplicated.`);
      }
      taskIds.add(module.contentTaskId);
    }
    if (module.visible && module.component === "ReviewList") {
      issues.push("Visible ReviewList content is unsupported without verified review records.");
    }
    for (const assignment of module.assignments) {
      const product = productsById.get(assignment.productId);
      if (!product) {
        issues.push(`TopicPagePlan product ${assignment.productId} is absent from ProductSelectionResult.`);
        continue;
      }
      if (product.pool !== assignment.pool || product.role !== assignment.role) {
        issues.push(`TopicPagePlan assignment ${assignment.slotId} changes frozen product pool or role.`);
      }
    }
    for (const scene of module.scenes) {
      const assignedIds = module.assignments
        .filter(({ sceneId }) => sceneId === scene.id)
        .map(({ productId }) => productId);
      if (!exactOrder(scene.productIds, assignedIds)) {
        issues.push(`TopicPagePlan scene ${scene.id} productIds do not match its assignments.`);
      }
    }
  }
  return issues;
}

interface EvidenceScope {
  intentEvidenceIds: Set<string>;
  eligibleIntentEvidenceIds: Set<string>;
  categoryIds: Set<string>;
  eligibleCategoryIds: Set<string>;
  productIds: Set<string>;
  sceneIds: Set<string>;
  language: ContentLanguage;
  properNouns: readonly string[];
  strictPolicy: boolean;
}

function reviewEvidenceRef(
  evidenceRef: string,
  moduleId: TopicModuleId,
  scope: EvidenceScope,
  issues: string[],
) {
  if (evidenceRef.startsWith("theme-intent:")) {
    const id = evidenceRef.slice("theme-intent:".length);
    if (!scope.intentEvidenceIds.has(id)) {
      issues.push(`Unknown ThemeIntent evidence reference: ${evidenceRef}.`);
    } else if (scope.strictPolicy && !scope.eligibleIntentEvidenceIds.has(id)) {
      issues.push(
        `ThemeIntent evidence reference ${evidenceRef} is not eligible for content claims.`,
      );
    }
    return;
  }
  if (evidenceRef.startsWith("selected-category:")) {
    const id = evidenceRef.slice("selected-category:".length);
    if (!scope.categoryIds.has(id)) {
      issues.push(`Unknown selected category evidence reference: ${evidenceRef}.`);
    } else if (scope.strictPolicy && !scope.eligibleCategoryIds.has(id)) {
      issues.push(`Evidence reference ${evidenceRef} is outside module ${moduleId}.`);
    }
    return;
  }
  if (evidenceRef.startsWith("product:")) {
    const id = evidenceRef.slice("product:".length);
    if (!scope.productIds.has(id)) {
      issues.push(`Evidence reference ${evidenceRef} is outside module ${moduleId}.`);
    }
    return;
  }
  if (evidenceRef.startsWith("scene:")) {
    const id = evidenceRef.slice("scene:".length);
    if (!scope.sceneIds.has(id)) {
      issues.push(`Evidence reference ${evidenceRef} is outside module ${moduleId}.`);
    }
    return;
  }
  issues.push(`Unsupported content evidence reference: ${evidenceRef}.`);
}

function reviewCopySegment(
  value: unknown,
  path: string,
  slot: TopicPageContentCopySlot,
  moduleId: TopicModuleId,
  scope: EvidenceScope,
  issues: string[],
): EvidencedPageCopy {
  const segment = objectValue(value);
  const text = stringValue(segment?.text);
  if (!segment) issues.push(`Copy field ${path} must be an object.`);
  if (!text) issues.push(`Copy field ${path} requires text.`);
  if (text && scope.strictPolicy &&
      !pageCopyUsesRequestedLanguage(text, scope.language, scope.properNouns)) {
    issues.push(
      `Copy field ${path} must use ${scope.language} copy except immutable proper nouns.`,
    );
  }
  const maxCharacters = topicPageCopyMaxCharacters(
    moduleId,
    slot,
  );
  if (text && scope.strictPolicy && maxCharacters !== undefined &&
      [...text].length > maxCharacters) {
    issues.push(`Copy field ${path} exceeds ${maxCharacters} characters.`);
  }
  const rawEvidenceRefs = Array.isArray(segment?.evidenceRefs)
    ? segment.evidenceRefs
    : [];
  if (!Array.isArray(segment?.evidenceRefs)) {
    issues.push(`Copy field ${path} evidenceRefs must be an array.`);
  }
  const evidenceRefs = rawEvidenceRefs
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
  if (evidenceRefs.length !== rawEvidenceRefs.length) {
    issues.push(`Copy field ${path} evidenceRefs may contain only non-empty strings.`);
  }
  if (evidenceRefs.length === 0) {
    issues.push(`Copy field ${path} requires at least one evidence reference.`);
  }
  evidenceRefs.forEach((evidenceRef) =>
    reviewEvidenceRef(evidenceRef, moduleId, scope, issues)
  );
  return { text, evidenceRefs };
}

function reportUnexpectedFields(
  copy: Record<string, unknown>,
  moduleId: string,
  allowed: readonly string[],
  issues: string[],
) {
  Object.keys(copy).forEach((field) => {
    if (!allowed.includes(field)) {
      issues.push(`Module ${moduleId} cannot define copy field ${field}.`);
    }
  });
}

function reviewItems(
  value: unknown,
  module: TopicPagePlanModuleV2,
  baseScope: EvidenceScope,
  issues: string[],
) {
  const rawItems = Array.isArray(value) ? value : [];
  if (!Array.isArray(value)) issues.push(`Module ${module.id} items must be an array.`);
  if (rawItems.length !== module.assignments.length) {
    issues.push(`Module ${module.id} must define one item label for every assignment slot.`);
  }
  const items: TopicPageContentItemCopy[] = [];
  rawItems.forEach((rawItem, index) => {
    const item = objectValue(rawItem);
    if (!item) {
      issues.push(`Module ${module.id} item ${index} must be an object.`);
      return;
    }
    const slotId = stringValue(item.slotId);
    const assignment = module.assignments.find((candidate) => candidate.slotId === slotId);
    if (!assignment) {
      issues.push(`Module ${module.id} item references unknown slot ${slotId || index}.`);
    } else if (module.assignments[index]?.slotId !== slotId) {
      issues.push(`Module ${module.id} item slots must preserve PagePlan order.`);
    }
    const scope = {
      ...baseScope,
      productIds: new Set(assignment ? [assignment.productId] : []),
    };
    items.push({
      slotId,
      label: reviewCopySegment(
        item.label,
        `${module.id}.items[${index}].label`,
        "items[].label",
        module.id,
        scope,
        issues,
      ),
    });
  });
  return items;
}

function reviewScenes(
  value: unknown,
  module: TopicPagePlanModuleV2,
  baseScope: EvidenceScope,
  issues: string[],
) {
  const rawScenes = Array.isArray(value) ? value : [];
  if (!Array.isArray(value)) issues.push(`Module ${module.id} scenes must be an array.`);
  if (rawScenes.length !== module.scenes.length) {
    issues.push(`Module ${module.id} must define copy for every PagePlan scene.`);
  }
  const scenes: TopicPageContentSceneCopy[] = [];
  rawScenes.forEach((rawScene, index) => {
    const sceneCopy = objectValue(rawScene);
    if (!sceneCopy) {
      issues.push(`Module ${module.id} scene copy ${index} must be an object.`);
      return;
    }
    const sceneId = stringValue(sceneCopy.sceneId);
    const scene = module.scenes.find((candidate) => candidate.id === sceneId);
    if (!scene) {
      issues.push(`Module ${module.id} content references unknown scene ${sceneId || index}.`);
    } else if (module.scenes[index]?.id !== sceneId) {
      issues.push(`Module ${module.id} scene copy must preserve PagePlan order.`);
    }
    const scope = {
      ...baseScope,
      productIds: new Set(scene?.productIds ?? []),
      sceneIds: new Set(scene ? [scene.id] : []),
    };
    scenes.push({
      sceneId,
      label: reviewCopySegment(
        sceneCopy.label,
        `${module.id}.scenes[${index}].label`,
        "scenes[].label",
        module.id,
        scope,
        issues,
      ),
      title: reviewCopySegment(
        sceneCopy.title,
        `${module.id}.scenes[${index}].title`,
        "scenes[].title",
        module.id,
        scope,
        issues,
      ),
      description: reviewCopySegment(
        sceneCopy.description,
        `${module.id}.scenes[${index}].description`,
        "scenes[].description",
        module.id,
        scope,
        issues,
      ),
    });
  });
  return scenes;
}

function reviewTaskCopy(
  value: unknown,
  module: TopicPagePlanModuleV2,
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  plan: TopicPagePlanV2,
  language: ContentLanguage,
  issues: string[],
): TopicPageContentCopy {
  const rawCopy = objectValue(value) ?? {};
  if (!objectValue(value)) issues.push(`Task ${module.contentTaskId} copy must be an object.`);
  const assignedProductIds = new Set(module.assignments.map(({ productId }) => productId));
  const scope: EvidenceScope = {
    intentEvidenceIds: new Set(intent.evidenceRefs.map(({ id }) => id)),
    eligibleIntentEvidenceIds: new Set(eligibleThemeIntentEvidenceIds(intent)),
    categoryIds: new Set(selection.selectedCategories.map(({ id }) => id)),
    eligibleCategoryIds: new Set(selection.products
      .filter(({ id }) => assignedProductIds.has(id))
      .flatMap(({ categoryL3Id }) => categoryL3Id === undefined ? [] : [String(categoryL3Id)])),
    productIds: new Set(module.assignments.map(({ productId }) => productId)),
    sceneIds: new Set(module.scenes.map(({ id }) => id)),
    language,
    properNouns: pageCopyProperNouns(intent, selection, plan.keyword),
    strictPolicy: usesStrictPageCopyPolicy(plan.templateRef),
  };
  const title = reviewCopySegment(
    rawCopy.title,
    `${module.id}.title`,
    "title",
    module.id,
    scope,
    issues,
  );

  if (module.id === "hero") {
    reportUnexpectedFields(rawCopy, module.id, ["title", "description", "tags"], issues);
    const rawTags = Array.isArray(rawCopy.tags) ? rawCopy.tags : [];
    if (!Array.isArray(rawCopy.tags)) issues.push("Module hero tags must be an array.");
    if (rawTags.length < 2 || rawTags.length > 4) {
      issues.push("Module hero requires 2-4 tags.");
    }
    return {
      title,
      description: reviewCopySegment(
        rawCopy.description,
        "hero.description",
        "description",
        module.id,
        scope,
        issues,
      ),
      tags: rawTags.map((tag, index) =>
        reviewCopySegment(tag, `hero.tags[${index}]`, "tags", module.id, scope, issues)
      ),
    };
  }
  if (module.id === "shortcuts") {
    reportUnexpectedFields(rawCopy, module.id, ["title", "items"], issues);
    return { title, items: reviewItems(rawCopy.items, module, scope, issues) };
  }
  if (module.id === "start-here") {
    reportUnexpectedFields(rawCopy, module.id, ["title", "scenes"], issues);
    return { title, scenes: reviewScenes(rawCopy.scenes, module, scope, issues) };
  }
  if (module.id === "explore-more") {
    reportUnexpectedFields(rawCopy, module.id, ["title", "description"], issues);
    if (!objectValue(rawCopy.description)) {
      issues.push("Module explore-more requires description.");
    }
    return {
      title,
      description: reviewCopySegment(
        rawCopy.description,
        "explore-more.description",
        "description",
        module.id,
        scope,
        issues,
      ),
    };
  }

  reportUnexpectedFields(rawCopy, module.id, ["title"], issues);
  return { title };
}

function componentValue(value: unknown): TopicPageComponent {
  return stringValue(value) as TopicPageComponent;
}

export function reviewTopicPageContentProposal(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  plan: TopicPagePlanV2,
  language: ContentLanguage,
  value: unknown,
): TopicPageContentProposalReview {
  const proposal = objectValue(value);
  const issues: string[] = [];
  if (!proposal) {
    return {
      status: "rejected",
      issues: ["TopicPageContentProposal must be a JSON object."],
    };
  }
  if (proposal.schemaVersion !== "topic-page-content-proposal/v1") {
    issues.push('schemaVersion must be "topic-page-content-proposal/v1".');
  }
  if (proposal.keyword !== plan.keyword) issues.push("Proposal keyword does not match TopicPagePlan.");
  if (proposal.site !== plan.site) issues.push("Proposal site does not match TopicPagePlan.");
  if (proposal.language !== language) {
    issues.push("Proposal language does not match the requested content language.");
  }
  if (proposal.topicPagePlanDigest !== plan.digest) {
    issues.push("Proposal topicPagePlanDigest does not match TopicPagePlan.");
  }
  if (proposal.themeIntentDigest !== themeIntentDigest(intent)) {
    issues.push("Proposal themeIntentDigest does not match ThemeIntent.");
  }
  if (proposal.productSelectionDigest !== productSelectionDigest(selection)) {
    issues.push("Proposal productSelectionDigest does not match ProductSelectionResult.");
  }

  const expectedModules = plan.modules.filter(({ visible, contentTaskId }) =>
    visible && contentTaskId
  );
  const rawTasks = Array.isArray(proposal.tasks) ? proposal.tasks : [];
  if (!Array.isArray(proposal.tasks)) issues.push("Content proposal tasks must be an array.");
  if (rawTasks.length !== expectedModules.length) {
    issues.push(`Content proposal must define exactly ${expectedModules.length} tasks.`);
  }
  const seenTaskIds = new Set<string>();
  const tasks: TopicPageContentTaskProposal[] = [];
  rawTasks.forEach((rawTask, index) => {
    const task = objectValue(rawTask);
    if (!task) {
      issues.push(`Content task ${index} must be an object.`);
      return;
    }
    const taskId = stringValue(task.taskId);
    const module = expectedModules.find((candidate) => candidate.contentTaskId === taskId);
    if (!module) {
      issues.push(`Task ${taskId || index} is not declared by TopicPagePlan.`);
      return;
    }
    if (seenTaskIds.has(taskId)) issues.push(`Task ${taskId} is defined more than once.`);
    seenTaskIds.add(taskId);
    if (expectedModules[index]?.contentTaskId !== taskId) {
      issues.push("Content tasks must preserve TopicPagePlan order.");
    }
    if (task.moduleId !== module.id) {
      issues.push(`Task ${taskId} moduleId does not match PagePlan module ${module.id}.`);
    }
    const component = componentValue(task.component);
    if (component !== module.component) {
      issues.push(`Task ${taskId} component does not match PagePlan module ${module.id}.`);
    }
    tasks.push({
      taskId,
      moduleId: module.id,
      component: module.component,
      copy: reviewTaskCopy(task.copy, module, intent, selection, plan, language, issues),
    });
  });
  expectedModules.forEach((module) => {
    if (!seenTaskIds.has(module.contentTaskId!)) {
      issues.push(`Content task ${module.contentTaskId} is missing from the proposal.`);
    }
  });

  if (issues.length > 0) return { status: "rejected", issues };
  return {
    status: "accepted",
    issues: [],
    proposal: {
      schemaVersion: "topic-page-content-proposal/v1",
      keyword: plan.keyword,
      site: plan.site,
      language,
      topicPagePlanDigest: plan.digest,
      themeIntentDigest: themeIntentDigest(intent),
      productSelectionDigest: productSelectionDigest(selection),
      tasks,
    },
  };
}
