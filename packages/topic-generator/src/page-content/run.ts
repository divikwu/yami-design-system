import type { ContentLanguage, ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import { sha256Digest } from "../product-selection/digest.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type {
  TopicAudienceContext,
  TopicBackgroundEvidenceBundle,
} from "../background-evidence/contracts.js";
import { reviewTopicBackgroundEvidenceBundle } from "../background-evidence/review.js";
import { topicAudienceContext } from "../background-evidence/run.js";
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
import { buildTopicPageCopyBrief } from "./brief.js";

export interface TopicPageContentRequest {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
  plan: TopicPagePlanV2;
  language: ContentLanguage;
  audienceContext?: TopicAudienceContext;
  backgroundEvidence?: TopicBackgroundEvidenceBundle;
  proposal?: unknown;
}

function taskContext(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  plan: TopicPagePlanV2,
  language: ContentLanguage,
  audienceContext = topicAudienceContext(language),
  backgroundEvidence?: TopicBackgroundEvidenceBundle,
  noviceGuided = false,
): TopicPageContentContext {
  const productsById = new Map(selection.products.map((product) => [product.id, product]));
  const eligibleEvidenceIds = usesStrictPageCopyPolicy(plan.templateRef)
    ? eligibleThemeIntentEvidenceIds(intent)
    : intent.evidenceRefs.map(({ id }) => id);
  const tasks = plan.modules
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
    }));
  const copyBrief = buildTopicPageCopyBrief({
    intent,
    keyword: plan.keyword,
    language,
    audienceContext,
    backgroundEvidence,
    tasks,
  });
  const immutableProperNouns = [...new Set([
    plan.keyword,
    intent.canonicalEntity?.label,
    ...selection.selectedCategories.flatMap((category) => [category.label, ...category.path]),
    ...tasks.flatMap((task) => task.products.flatMap((product) => [
      product.brand,
      product.title,
    ])),
  ].filter((value): value is string =>
    typeof value === "string" && value.trim().length > 0
  ))].sort((left, right) => right.length - left.length);
  return {
    keyword: plan.keyword,
    site: plan.site,
    language,
    languagePolicy: {
      requestedLanguage: language,
      immutableProperNouns,
      generatedCopyRequirement: "requested-language-only-except-listed-proper-nouns",
    },
    copyPolicyRef: topicPageCopyPolicyRef(plan.templateRef, noviceGuided),
    claimPolicy: {
      evidenceRequirement: "explicit-in-cited-artifact",
      evidenceRefsAuthorize: "scope-only",
      planningGoalsAuthorizeClaims: false,
      restrictedClaimTypes: [
        "ingredient",
        "benefit",
        "efficacy",
        "popularity",
        "inventory",
        "discount",
        "rating",
        "customer-outcome",
      ],
    },
    audienceContext,
    backgroundEvidence: backgroundEvidence ? structuredClone(backgroundEvidence) : null,
    eligibleBackgroundEvidenceClaimIds: backgroundEvidence?.claims.map(({ id }) => id) ?? [],
    copyBrief,
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
      ...(backgroundEvidence && backgroundEvidence.claims.length > 0
        ? ["background:<claim-id>"]
        : []),
    ],
    tasks,
  };
}

function compileAcceptedSpec(
  request: Omit<TopicPageContentRequest, "proposal">,
  proposal: NonNullable<ReturnType<typeof reviewTopicPageContentProposal>["proposal"]>,
): TopicPageContentSpec {
  const noviceGuided = request.audienceContext !== undefined ||
    request.backgroundEvidence !== undefined;
  const contentContext = taskContext(
    request.intent,
    request.selection,
    request.plan,
    request.language,
    request.audienceContext,
    request.backgroundEvidence,
    noviceGuided,
  );
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
    ...(noviceGuided
      ? {
          audienceContext: contentContext.audienceContext,
          ...(request.backgroundEvidence
            ? { backgroundEvidenceDigest: request.backgroundEvidence.digest }
            : {}),
          copyBriefDigest: contentContext.copyBrief.digest,
        }
      : {}),
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
  if (request.backgroundEvidence) {
    const backgroundIssues = reviewTopicBackgroundEvidenceBundle(
      request.intent,
      request.backgroundEvidence,
    );
    if (request.backgroundEvidence.keyword !== request.plan.keyword) {
      backgroundIssues.push("Background evidence keyword does not match TopicPagePlan.");
    }
    if (request.backgroundEvidence.site !== request.plan.site) {
      backgroundIssues.push("Background evidence site does not match TopicPagePlan.");
    }
    if (request.backgroundEvidence.language !== request.language) {
      backgroundIssues.push("Background evidence language does not match the content request.");
    }
    if (backgroundIssues.length > 0) {
      const proposalReview = { status: "rejected" as const, issues: backgroundIssues };
      return {
        schemaVersion: "topic-page-content-run/v1",
        status: "blocked",
        faultKind: "upstream-invalid",
        rollbackStage: "background-evidence",
        issues: backgroundIssues,
        proposalReview,
      };
    }
  }
  const noviceGuided = request.audienceContext !== undefined ||
    request.backgroundEvidence !== undefined;
  if (request.proposal === undefined) {
    return {
      schemaVersion: "topic-page-content-run/v1",
      status: "needs-content-proposal",
      context: taskContext(
        request.intent,
        request.selection,
        request.plan,
        request.language,
        request.audienceContext,
        request.backgroundEvidence,
        noviceGuided,
      ),
    };
  }
  const proposalReview = reviewTopicPageContentProposal(
    request.intent,
    request.selection,
    request.plan,
    request.language,
    request.proposal,
    request.backgroundEvidence,
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
