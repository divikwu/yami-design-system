import type { ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import { sha256Digest } from "../product-selection/digest.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type { TopicPageContentSpec } from "../page-content/contracts.js";
import type {
  TopicPageAssetManifest,
  TopicPageVisualContext,
  TopicPageVisualRun,
} from "./contracts.js";
import {
  reviewTopicPageVisualPreflight,
  reviewTopicPageVisualProposal,
} from "./review.js";
import { deriveTopicPageVisualTasks } from "./tasks.js";

export interface TopicPageVisualRequest {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
  plan: TopicPagePlanV2;
  contentSpec: TopicPageContentSpec;
  proposal?: unknown;
}

function taskContext(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  plan: TopicPagePlanV2,
  contentSpec: TopicPageContentSpec,
): TopicPageVisualContext {
  return {
    keyword: plan.keyword,
    site: plan.site,
    language: contentSpec.language,
    strategyRef: plan.strategyRef,
    templateRef: plan.templateRef,
    topicPagePlanDigest: plan.digest,
    topicPageContentSpecDigest: contentSpec.digest,
    themeIntentDigest: plan.themeIntentDigest,
    productSelectionDigest: plan.productSelectionDigest,
    themeIntent: structuredClone(intent),
    selectedCategories: selection.selectedCategories.map((category) => ({
      ...category,
      path: [...category.path],
    })),
    evidenceNamespaces: [
      "theme-intent:<evidence-id>",
      "selected-category:<category-id>",
      "product:<task-product-id>",
      "scene:<task-scene-id>",
      "content-task:<module-content-task-id>",
    ],
    tasks: deriveTopicPageVisualTasks(plan, selection, contentSpec),
  };
}

function compileAcceptedManifest(
  request: Omit<TopicPageVisualRequest, "proposal">,
  assets: TopicPageAssetManifest["assets"],
): TopicPageAssetManifest {
  const manifest = {
    schemaVersion: "topic-page-asset-manifest/v1" as const,
    status: "asset-manifest-ready" as const,
    keyword: request.plan.keyword,
    site: request.plan.site,
    language: request.contentSpec.language,
    strategyRef: request.plan.strategyRef,
    templateRef: request.plan.templateRef,
    topicPagePlanDigest: request.plan.digest,
    topicPageContentSpecDigest: request.contentSpec.digest,
    themeIntentDigest: request.plan.themeIntentDigest,
    productSelectionDigest: request.plan.productSelectionDigest,
    assets,
  };
  return { ...manifest, digest: sha256Digest(manifest) };
}

export function compileTopicPageAssetManifest(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  plan: TopicPagePlanV2,
  contentSpec: TopicPageContentSpec,
  proposal: unknown,
) {
  const preflightIssues = reviewTopicPageVisualPreflight(
    intent,
    selection,
    plan,
    contentSpec,
  );
  if (preflightIssues.length > 0) {
    throw new Error(`TopicPageVisual preflight failed: ${preflightIssues.join(" ")}`);
  }
  const review = reviewTopicPageVisualProposal(
    intent,
    selection,
    plan,
    contentSpec,
    proposal,
  );
  if (review.status !== "accepted" || !review.proposal) {
    throw new Error(`TopicPageVisualProposal rejected: ${review.issues.join(" ")}`);
  }
  return compileAcceptedManifest(
    { intent, selection, plan, contentSpec },
    review.proposal.assets,
  );
}

export function advanceTopicPageVisualRun(
  request: TopicPageVisualRequest,
): TopicPageVisualRun {
  const preflightIssues = reviewTopicPageVisualPreflight(
    request.intent,
    request.selection,
    request.plan,
    request.contentSpec,
  );
  if (preflightIssues.length > 0) {
    const proposalReview = { status: "rejected" as const, issues: preflightIssues };
    return {
      schemaVersion: "topic-page-visual-run/v1",
      status: "blocked",
      issues: preflightIssues,
      proposalReview,
    };
  }
  if (request.proposal === undefined) {
    return {
      schemaVersion: "topic-page-visual-run/v1",
      status: "needs-visual-proposal",
      context: taskContext(
        request.intent,
        request.selection,
        request.plan,
        request.contentSpec,
      ),
    };
  }
  const proposalReview = reviewTopicPageVisualProposal(
    request.intent,
    request.selection,
    request.plan,
    request.contentSpec,
    request.proposal,
  );
  if (proposalReview.status !== "accepted" || !proposalReview.proposal) {
    return {
      schemaVersion: "topic-page-visual-run/v1",
      status: "blocked",
      issues: proposalReview.issues,
      proposalReview,
    };
  }
  return {
    schemaVersion: "topic-page-visual-run/v1",
    status: "ready",
    manifest: compileAcceptedManifest(request, proposalReview.proposal.assets),
    proposalReview,
  };
}
