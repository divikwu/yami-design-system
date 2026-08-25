import type {
  TopicPageGenerationSpec,
  TopicPageQaReport,
  TopicPageReviewPackage,
} from "../page-generation/contracts.js";
import type { LandingPageExecutionPlan } from "../page-orchestration/contracts.js";
import type {
  TopicPageExperienceReviewContext,
  TopicPageExperienceReviewDecision,
  TopicPageExperienceReviewRun,
} from "./contracts.js";
import {
  reviewEvidenceRefs,
  reviewTopicPageExperienceProposal,
  topicPageExperienceReviewDecisionDigest,
  topicPageExperienceReviewPreflightIssues,
} from "./review.js";

export interface TopicPageExperienceReviewRequest {
  executionPlan: LandingPageExecutionPlan;
  generationSpec: TopicPageGenerationSpec;
  qaReport: TopicPageQaReport;
  previewRefs: TopicPageReviewPackage["previewRefs"];
  proposal?: unknown;
}

function visualPolicy(
  generationSpec: TopicPageGenerationSpec,
): TopicPageExperienceReviewContext["visualPolicy"] {
  return {
    assets: generationSpec.modules.flatMap((module) => module.assets.map((asset) => {
      if (asset.kind === "hero-image") {
        return {
          taskId: asset.taskId,
          moduleId: module.id,
          kind: asset.kind,
          priority: "scene-and-module-theme" as const,
          productRole: "reference-only" as const,
          blockingConditions: [
            "asset-does-not-match-module-theme-or-copy",
            "product-grid-or-montage-used-as-hero",
            "product-appears-floating-or-lands-on-vertical-surface",
            "hero-primary-content-has-responsive-crop-risk",
            "reference-derived-product-uses-blank-generic-or-materially-inconsistent-packaging",
          ],
        };
      }
      if (asset.kind === "shortcut-image") {
        return {
          taskId: asset.taskId,
          moduleId: module.id,
          kind: asset.kind,
          priority: "scene-and-module-theme" as const,
          productRole: "primary-subject" as const,
          blockingConditions: [
            "asset-does-not-match-module-theme-or-copy",
            "circular-crop-obscures-primary-subject",
            "image-lacks-category-relevant-primary-subject",
            "reference-derived-product-uses-blank-generic-or-materially-inconsistent-packaging",
          ],
        };
      }
      return {
        taskId: asset.taskId,
        moduleId: module.id,
        kind: asset.kind,
        priority: "scene-and-module-theme" as const,
        productRole: "reference-only" as const,
        blockingConditions: [
          "isolated-product-packshot-used-as-semantic-scene",
          "product-grid-or-montage-used-as-semantic-scene",
          "asset-does-not-match-module-theme-or-copy",
          "reference-derived-product-uses-blank-generic-or-materially-inconsistent-packaging",
        ],
      };
    })),
  };
}

function compileDecision(
  proposal: NonNullable<ReturnType<typeof reviewTopicPageExperienceProposal>["proposal"]>,
): TopicPageExperienceReviewDecision {
  const advisoryIssues = proposal.issues.map(({ rollbackStage: _rollbackStage, ...issue }) => ({
    ...issue,
    severity: "warning" as const,
    evidenceRefs: [...issue.evidenceRefs],
  }));
  const base = {
    schemaVersion: "topic-page-experience-review-decision/v1" as const,
    status: "review-recommended" as const,
    executionPlanDigest: proposal.executionPlanDigest,
    generationSpecDigest: proposal.generationSpecDigest,
    qaReportDigest: proposal.qaReportDigest,
    recommendation: "recommend-approval" as const,
    summary: proposal.summary,
    issues: advisoryIssues,
  };
  return { ...base, digest: topicPageExperienceReviewDecisionDigest(base) };
}

export function advanceTopicPageExperienceReviewRun(
  request: TopicPageExperienceReviewRequest,
): TopicPageExperienceReviewRun {
  const preflightIssues = topicPageExperienceReviewPreflightIssues(request);
  if (preflightIssues.length > 0) {
    return {
      schemaVersion: "topic-page-experience-review-run/v1",
      status: "blocked",
      issues: preflightIssues,
    };
  }
  const qaReport = request.qaReport as TopicPageQaReport & { status: "passed" };
  if (request.proposal === undefined) {
    return {
      schemaVersion: "topic-page-experience-review-run/v1",
      status: "needs-review-proposal",
      context: {
        qualityPolicy: "advisory-never-block-generation",
        executionPlanDigest: request.executionPlan.digest,
        executionPlan: structuredClone(request.executionPlan),
        generationSpec: structuredClone(request.generationSpec),
        qaReport: structuredClone(qaReport),
        previewRefs: { ...request.previewRefs },
        allowedEvidenceRefs: reviewEvidenceRefs({
          generationSpec: request.generationSpec,
          qaReport,
        }),
        allowedRollbackStages: [...request.executionPlan.allowedReviewRollbackStages],
        visualPolicy: visualPolicy(request.generationSpec),
      },
    };
  }
  const proposalReview = reviewTopicPageExperienceProposal({
    executionPlan: request.executionPlan,
    generationSpec: request.generationSpec,
    qaReport,
    value: request.proposal,
  });
  if (proposalReview.status !== "accepted" || !proposalReview.proposal) {
    return {
      schemaVersion: "topic-page-experience-review-run/v1",
      status: "blocked",
      issues: proposalReview.issues,
      proposalReview,
    };
  }
  return {
    schemaVersion: "topic-page-experience-review-run/v1",
    status: "ready",
    decision: compileDecision(proposalReview.proposal),
    proposalReview,
  };
}
