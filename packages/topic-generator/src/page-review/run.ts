import type {
  TopicPageGenerationSpec,
  TopicPageQaReport,
  TopicPageReviewPackage,
} from "../page-generation/contracts.js";
import type { LandingPageExecutionPlan } from "../page-orchestration/contracts.js";
import type {
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

function compileDecision(
  proposal: NonNullable<ReturnType<typeof reviewTopicPageExperienceProposal>["proposal"]>,
): TopicPageExperienceReviewDecision {
  const base = {
    schemaVersion: "topic-page-experience-review-decision/v1" as const,
    status: proposal.recommendation === "recommend-approval"
      ? "review-recommended" as const
      : "revision-requested" as const,
    executionPlanDigest: proposal.executionPlanDigest,
    generationSpecDigest: proposal.generationSpecDigest,
    qaReportDigest: proposal.qaReportDigest,
    recommendation: proposal.recommendation,
    summary: proposal.summary,
    issues: proposal.issues.map((issue) => ({
      ...issue,
      evidenceRefs: [...issue.evidenceRefs],
    })),
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
