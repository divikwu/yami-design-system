import type { ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import { sha256Digest } from "../product-selection/digest.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type { TopicPageContentSpec } from "../page-content/contracts.js";
import type { TopicBackgroundEvidenceBundle } from "../background-evidence/contracts.js";
import type {
  TopicPageAssetManifest,
  TopicPageVisualContext,
  TopicPageVisualProductionMode,
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
  backgroundEvidence?: TopicBackgroundEvidenceBundle;
  productionMode?: TopicPageVisualProductionMode;
  proposal?: unknown;
}

function taskContext(
  intent: ThemeIntent,
  selection: ProductSelectionResult,
  plan: TopicPagePlanV2,
  contentSpec: TopicPageContentSpec,
  productionMode: TopicPageVisualProductionMode,
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
    productionMode,
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
    tasks: deriveTopicPageVisualTasks(intent, plan, selection, contentSpec),
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
    productionMode: request.productionMode ?? "generated-images",
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
  productionMode: TopicPageVisualProductionMode = "generated-images",
  backgroundEvidence?: TopicBackgroundEvidenceBundle,
) {
  const preflightIssues = reviewTopicPageVisualPreflight(
    intent,
    selection,
    plan,
    contentSpec,
    backgroundEvidence,
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
    productionMode,
  );
  if (review.status !== "accepted" || !review.proposal) {
    throw new Error(`TopicPageVisualProposal rejected: ${review.issues.join(" ")}`);
  }
  return compileAcceptedManifest(
    { intent, selection, plan, contentSpec, productionMode },
    review.proposal.assets,
  );
}

export function advanceTopicPageVisualRun(
  request: TopicPageVisualRequest,
): TopicPageVisualRun {
  const productionMode = request.productionMode ?? "generated-images";
  const preflightIssues = reviewTopicPageVisualPreflight(
    request.intent,
    request.selection,
    request.plan,
    request.contentSpec,
    request.backgroundEvidence,
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
        productionMode,
      ),
    };
  }
  const proposalReview = reviewTopicPageVisualProposal(
    request.intent,
    request.selection,
    request.plan,
    request.contentSpec,
    request.proposal,
    productionMode,
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
