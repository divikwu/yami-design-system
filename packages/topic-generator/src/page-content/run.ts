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
  EvidencedPageCopy,
  TopicPageContentContext,
  TopicPageContentProposal,
  TopicPageContentRun,
  TopicPageContentSpec,
  TopicPageContentTaskContext,
} from "./contracts.js";
import {
  eligibleThemeIntentEvidenceIds,
  topicPageCopyRules,
  topicPageCopySlots,
  topicPageCopyPolicyRef,
  topicPageTemplateCopy,
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
    .map((module) => {
      const assignedProductIds = new Set(
        module.assignments.map(({ productId }) => productId),
      );
      const groups = (selection.modules.find(({ id }) => id === module.id)?.groups ?? [])
        .map((group) => ({
          id: group.id,
          label: group.label,
          productIds: group.productIds.filter((productId) =>
            assignedProductIds.has(productId)
          ),
          ...(group.sourceCategoryIds
            ? { sourceCategoryIds: [...group.sourceCategoryIds] }
            : {}),
        }))
        .filter(({ productIds }) => productIds.length > 0);
      const templateCopy = noviceGuided
        ? topicPageTemplateCopy(module.id, language)
        : undefined;
      const copyRules = topicPageCopyRules(module.id, language)
        .filter(({ slot }) => slot !== "groups[].label" || groups.length > 0)
        .map((rule) => ({
          ...rule,
          ...(rule.preferredLength
            ? { preferredLength: { ...rule.preferredLength } }
            : {}),
        }));
      return {
        taskId: module.contentTaskId!,
        moduleId: module.id,
        component: module.component,
        shoppingGoal: module.shoppingGoal,
        reason: module.reason,
        copySlots: topicPageCopySlots(module.id)
          .filter((slot) => slot !== "groups[].label" || groups.length > 0),
        copyRules,
        ...(templateCopy ? { templateCopy } : {}),
        assignments: module.assignments.map((assignment) => ({ ...assignment })),
        scenes: module.scenes.map((scene) => ({
          ...scene,
          productIds: [...scene.productIds],
        })),
        groups,
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
      };
    });
  const copyBrief = buildTopicPageCopyBrief({
    intent,
    templateRef: plan.templateRef,
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

function deterministicEvidenceRefs(
  context: TopicPageContentContext,
  task: TopicPageContentTaskContext,
  options: { productId?: string; sceneId?: string } = {},
) {
  if (options.sceneId) return [`scene:${options.sceneId}`];
  if (options.productId) return [`product:${options.productId}`];
  const productId = task.assignments[0]?.productId;
  if (productId) return [`product:${productId}`];
  const sceneId = task.scenes[0]?.id;
  if (sceneId) return [`scene:${sceneId}`];
  const intentEvidenceId = context.eligibleThemeIntentEvidenceIds[0];
  if (intentEvidenceId) return [`theme-intent:${intentEvidenceId}`];
  const backgroundClaimId = context.eligibleBackgroundEvidenceClaimIds[0];
  return backgroundClaimId ? [`background:${backgroundClaimId}`] : [];
}

function deterministicCopy(
  text: string,
  evidenceRefs: string[],
): EvidencedPageCopy {
  return { text, evidenceRefs };
}

function deterministicTaskCopy(
  context: TopicPageContentContext,
  task: TopicPageContentTaskContext,
) {
  const zh = context.language === "zh";
  const evidenceRefs = deterministicEvidenceRefs(context, task);
  const titleText = task.templateCopy?.title ?? (task.moduleId === "hero"
    ? context.keyword
    : task.moduleId === "start-here"
    ? (zh ? "从这里开始" : "Start Here")
    : task.moduleId === "explore-more"
    ? (zh ? "更多选择" : "Explore More")
    : (zh ? "精选商品" : "Selected Products"));
  const title = deterministicCopy(titleText, evidenceRefs);
  if (task.moduleId === "hero") {
    return {
      title,
      description: deterministicCopy(
        zh
          ? `围绕${context.keyword}浏览当前商品与搭配选择。`
          : `Explore current ${context.keyword} products and pairings.`,
        evidenceRefs,
      ),
      tags: [
        deterministicCopy(zh ? "精选商品" : "Selected Products", evidenceRefs),
        deterministicCopy(zh ? "搭配选择" : "Pairing Ideas", evidenceRefs),
      ],
    };
  }
  if (task.moduleId === "shortcuts") {
    return {
      title,
      items: task.assignments.map(({ slotId, productId }) => ({
        slotId,
        label: deterministicCopy(
          zh ? "查看商品" : "View Products",
          deterministicEvidenceRefs(context, task, { productId }),
        ),
      })),
    };
  }
  if (task.moduleId === "start-here") {
    return {
      title,
      scenes: task.scenes.map(({ id }) => {
        const sceneEvidence = deterministicEvidenceRefs(context, task, { sceneId: id });
        return {
          sceneId: id,
          label: deterministicCopy(zh ? "选购场景" : "Shopping Scene", sceneEvidence),
          title: deterministicCopy(zh ? "按场景选择" : "Choose by Scene", sceneEvidence),
          description: deterministicCopy(
            zh ? "浏览适合这一场景的商品搭配。" : "Browse products selected for this scene.",
            sceneEvidence,
          ),
        };
      }),
    };
  }
  const groups = task.groups.map((group) => ({
    groupId: group.id,
    label: deterministicCopy(
      zh ? "商品分组" : "Product Group",
      deterministicEvidenceRefs(context, task, { productId: group.productIds[0] }),
    ),
  }));
  if (task.moduleId === "explore-more") {
    return {
      title,
      description: deterministicCopy(
        task.templateCopy?.description ??
          (zh ? "浏览更多商品选择。" : "Browse more product options."),
        evidenceRefs,
      ),
      ...(groups.length > 0 ? { groups } : {}),
    };
  }
  if (task.moduleId === "popular-picks") {
    return { title, ...(groups.length > 0 ? { groups } : {}) };
  }
  return { title };
}

export function deterministicTopicPageContentProposal(
  context: TopicPageContentContext,
): TopicPageContentProposal {
  return {
    schemaVersion: "topic-page-content-proposal/v1",
    keyword: context.keyword,
    site: context.site,
    language: context.language,
    topicPagePlanDigest: context.topicPagePlanDigest,
    themeIntentDigest: context.themeIntentDigest,
    productSelectionDigest: context.productSelectionDigest,
    tasks: context.tasks.map((task) => ({
      taskId: task.taskId,
      moduleId: task.moduleId,
      component: task.component,
      copy: deterministicTaskCopy(context, task),
    })),
  };
}

export function compileDeterministicTopicPageContentRun(
  request: Omit<TopicPageContentRequest, "proposal">,
): TopicPageContentRun {
  const pending = advanceTopicPageContentRun(request);
  if (pending.status !== "needs-content-proposal") return pending;
  return advanceTopicPageContentRun({
    ...request,
    proposal: deterministicTopicPageContentProposal(pending.context),
  });
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
    { enforceTemplateCopy: noviceGuided },
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
