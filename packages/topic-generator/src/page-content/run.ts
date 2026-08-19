import type { ContentLanguage, ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import { sha256Digest } from "../product-selection/digest.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type {
  TopicPageContentContext,
  TopicPageContentRun,
  TopicPageContentSpec,
} from "./contracts.js";
import {
  eligibleThemeIntentEvidenceIds,
  topicPageCopyRules,
  topicPageCopySlots,
  topicPageCopyPolicyRef,
  usesStrictPageCopyPolicy,
} from "./config.js";
import {
  reviewTopicPageContentPreflight,
  reviewTopicPageContentProposal,
} from "./review.js";

export interface TopicPageContentRequest {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
  plan: TopicPagePlanV2;
  language: ContentLanguage;
  proposal?: unknown;
}

function taskContext(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  plan: TopicPagePlanV2,
  language: ContentLanguage,
): TopicPageContentContext {
  const productsById = new Map(selection.products.map((product) => [product.id, product]));
  const eligibleEvidenceIds = usesStrictPageCopyPolicy(plan.templateRef)
    ? eligibleThemeIntentEvidenceIds(intent)
    : intent.evidenceRefs.map(({ id }) => id);
  return {
    keyword: plan.keyword,
    site: plan.site,
    language,
    copyPolicyRef: topicPageCopyPolicyRef(plan.templateRef),
    strategyRef: plan.strategyRef,
    templateRef: plan.templateRef,
    topicPagePlanDigest: plan.digest,
    themeIntentDigest: plan.themeIntentDigest,
    productSelectionDigest: plan.productSelectionDigest,
    themeIntent: structuredClone(intent),
    selectedCategories: selection.selectedCategories.map((category) => ({
      ...category,
      path: [...category.path],
    })),
    eligibleThemeIntentEvidenceIds: eligibleEvidenceIds,
    evidenceNamespaces: [
      "theme-intent:<evidence-id>",
      "selected-category:<category-id>",
      "product:<assigned-product-id>",
      "scene:<module-scene-id>",
    ],
    tasks: plan.modules
      .filter((module) => module.visible && module.contentTaskId)
      .map((module) => ({
        taskId: module.contentTaskId!,
        moduleId: module.id,
        component: module.component,
        shoppingGoal: module.shoppingGoal,
        reason: module.reason,
        copySlots: [...topicPageCopySlots(module.id)],
        copyRules: topicPageCopyRules(module.id).map((rule) => ({ ...rule })),
        assignments: module.assignments.map((assignment) => ({ ...assignment })),
        scenes: module.scenes.map((scene) => ({
          ...scene,
          productIds: [...scene.productIds],
        })),
        products: module.assignments.map(({ productId }) => {
          const product = productsById.get(productId)!;
          return {
            id: product.id,
            title: product.title,
            brand: product.brand,
            categoryL3Id: product.categoryL3Id,
            categoryL3Name: product.categoryL3Name,
            pool: product.pool,
            role: product.role,
          };
        }),
      })),
  };
}

function compileAcceptedSpec(
  request: Omit<TopicPageContentRequest, "proposal">,
  proposal: NonNullable<ReturnType<typeof reviewTopicPageContentProposal>["proposal"]>,
): TopicPageContentSpec {
  const spec = {
    schemaVersion: "topic-page-content-spec/v1" as const,
    status: "content-ready" as const,
    keyword: request.plan.keyword,
    site: request.plan.site,
    language: request.language,
    strategyRef: request.plan.strategyRef,
    templateRef: request.plan.templateRef,
    topicPagePlanDigest: request.plan.digest,
    themeIntentDigest: request.plan.themeIntentDigest,
    productSelectionDigest: request.plan.productSelectionDigest,
    tasks: proposal.tasks,
  };
  return { ...spec, digest: sha256Digest(spec) };
}

export function compileTopicPageContentSpec(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  plan: TopicPagePlanV2,
  language: ContentLanguage,
  proposal: unknown,
) {
  const preflightIssues = reviewTopicPageContentPreflight(intent, selection, plan);
  if (preflightIssues.length > 0) {
    throw new Error(`TopicPageContent preflight failed: ${preflightIssues.join(" ")}`);
  }
  const review = reviewTopicPageContentProposal(intent, selection, plan, language, proposal);
  if (review.status !== "accepted" || !review.proposal) {
    throw new Error(`TopicPageContentProposal rejected: ${review.issues.join(" ")}`);
  }
  return compileAcceptedSpec({ intent, selection, plan, language }, review.proposal);
}

export function advanceTopicPageContentRun(
  request: TopicPageContentRequest,
): TopicPageContentRun {
  const preflightIssues = reviewTopicPageContentPreflight(
    request.intent,
    request.selection,
    request.plan,
  );
  if (preflightIssues.length > 0) {
    const proposalReview = { status: "rejected" as const, issues: preflightIssues };
    return {
      schemaVersion: "topic-page-content-run/v1",
      status: "blocked",
      faultKind: "upstream-invalid",
      rollbackStage: "module-merchandising",
      issues: preflightIssues,
      proposalReview,
    };
  }
  if (request.proposal === undefined) {
    return {
      schemaVersion: "topic-page-content-run/v1",
      status: "needs-content-proposal",
      context: taskContext(
        request.intent,
        request.selection,
        request.plan,
        request.language,
      ),
    };
  }
  const proposalReview = reviewTopicPageContentProposal(
    request.intent,
    request.selection,
    request.plan,
    request.language,
    request.proposal,
  );
  if (proposalReview.status !== "accepted" || !proposalReview.proposal) {
    return {
      schemaVersion: "topic-page-content-run/v1",
      status: "blocked",
      faultKind: "proposal-invalid",
      rollbackStage: "content-writing",
      issues: proposalReview.issues,
      proposalReview,
    };
  }
  return {
    schemaVersion: "topic-page-content-run/v1",
    status: "ready",
    spec: compileAcceptedSpec(request, proposalReview.proposal),
    proposalReview,
  };
}
