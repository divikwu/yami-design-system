import type { ContentLanguage, ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type {
  TopicAudienceContext,
  TopicBackgroundEvidenceBundle,
} from "../background-evidence/contracts.js";
import type {
  TopicPageContentAttemptArtifact,
  TopicPageContentFaultKind,
  TopicPageContentRevisionContext,
  TopicPageContentRun,
  TopicPageContentSpec,
  TopicPageCopyBrief,
} from "./contracts.js";
import {
  runTopicPageContentReviewAgentWorkflow,
  type TopicPageContentReviewAgent,
  type TopicPageContentReviewDecision,
  type TopicPageContentReviewRun,
} from "./content-review.js";
import { advanceTopicPageContentRun } from "./run.js";
import {
  runTopicContentAgentWorkflow,
  TopicContentAgentWorkflowError,
  type TopicContentAgent,
} from "./workflow.js";

export interface TopicPageContentApprovalWorkflowRequest {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
  plan: TopicPagePlanV2;
  language: ContentLanguage;
  audienceContext?: TopicAudienceContext;
  backgroundEvidence?: TopicBackgroundEvidenceBundle;
  contentSpec: TopicPageContentSpec;
  contentAgent: TopicContentAgent;
  reviewAgent: TopicPageContentReviewAgent;
  maxContentAttempts?: 1 | 2;
}

export type TopicPageContentApprovalWorkflowResult =
  | {
      status: "ready";
      contentSpec: TopicPageContentSpec;
      copyBrief: TopicPageCopyBrief;
      contentReview: TopicPageContentReviewDecision & { verdict: "approved" };
      revisionAttempt?: TopicPageContentAttemptArtifact;
    }
  | {
      status: "blocked";
      stage: "content-writing" | "content-review";
      issues: string[];
      faultKind: TopicPageContentFaultKind | "agent-failed";
      rollbackStage: "content-writing";
      contentSpec?: TopicPageContentSpec;
      copyBrief?: TopicPageCopyBrief;
      contentReview?: TopicPageContentReviewRun;
      contentRun?: TopicPageContentRun;
      contentAttempt?: TopicPageContentAttemptArtifact;
    };

function message(error: unknown) {
  return error instanceof Error ? error.message : "Unknown content optimization failure.";
}

function revisionContext(
  contentSpec: TopicPageContentSpec,
  copyBrief: TopicPageCopyBrief,
  backgroundEvidence: TopicBackgroundEvidenceBundle | undefined,
  review: Extract<TopicPageContentReviewRun, { status: "blocked" }>,
): TopicPageContentRevisionContext {
  const decision = review.decision;
  return {
    schemaVersion: "topic-page-content-revision/v1",
    attempt: 2,
    previousContentSpec: structuredClone(contentSpec),
    review: {
      source: decision ? "review-agent" : "deterministic-review",
      contentSpecDigest: contentSpec.digest,
      copyBriefDigest: copyBrief.digest,
      backgroundEvidenceDigest: backgroundEvidence?.digest ?? null,
      ...(decision
        ? {
            reviewerAgentId: decision.reviewerAgentId,
            decisionDigest: decision.digest,
            issues: decision.issues.map((issue) => ({ ...issue })),
          }
        : {
            issues: review.issues.map((issue, index) => ({
              code: `deterministic-content-review-${index + 1}`,
              severity: "error" as const,
              message: issue,
            })),
          }),
    },
  };
}

export async function runTopicPageContentApprovalWorkflow(
  request: TopicPageContentApprovalWorkflowRequest,
): Promise<TopicPageContentApprovalWorkflowResult> {
  const contextRun = advanceTopicPageContentRun({
    intent: request.intent,
    selection: request.selection,
    plan: request.plan,
    language: request.language,
    audienceContext: request.audienceContext,
    backgroundEvidence: request.backgroundEvidence,
  });
  if (contextRun.status !== "needs-content-proposal") {
    const issues = contextRun.status === "blocked"
      ? contextRun.issues
      : ["Content review could not reconstruct the bound CopyBrief."];
    return {
      status: "blocked",
      stage: "content-review",
      issues,
      faultKind: "proposal-invalid",
      rollbackStage: "content-writing",
      contentSpec: request.contentSpec,
      ...(contextRun.status === "blocked" ? { contentRun: contextRun } : {}),
    };
  }
  const copyBrief = contextRun.context.copyBrief;
  let contentSpec = request.contentSpec;
  let revisionAttempt: TopicPageContentAttemptArtifact | undefined;

  for (let attempt = 1; attempt <= (request.maxContentAttempts ?? 2); attempt += 1) {
    const reviewed = await runTopicPageContentReviewAgentWorkflow({
      contentSpec,
      copyBrief,
      backgroundEvidence: request.backgroundEvidence,
      agent: request.reviewAgent,
    });
    if (reviewed.run.status === "ready") {
      return {
        status: "ready",
        contentSpec,
        copyBrief,
        contentReview: reviewed.run.decision,
        ...(revisionAttempt ? { revisionAttempt } : {}),
      };
    }
    if (reviewed.run.status === "needs-content-review-proposal") {
      return {
        status: "blocked",
        stage: "content-review",
        issues: ["Content Review Agent returned no proposal."],
        faultKind: "proposal-invalid",
        rollbackStage: "content-writing",
        contentSpec,
        copyBrief,
        contentReview: reviewed.run,
      };
    }
    const canRewrite = reviewed.run.faultKind === "content-quality" &&
      attempt < (request.maxContentAttempts ?? 2);
    if (!canRewrite) {
      return {
        status: "blocked",
        stage: "content-review",
        issues: reviewed.run.issues,
        faultKind: reviewed.run.faultKind === "agent-failed"
          ? "agent-failed"
          : "proposal-invalid",
        rollbackStage: "content-writing",
        contentSpec,
        copyBrief,
        contentReview: reviewed.run,
        ...(revisionAttempt ? { contentAttempt: revisionAttempt } : {}),
      };
    }

    let revised;
    try {
      revised = await runTopicContentAgentWorkflow({
        intent: request.intent,
        selection: request.selection,
        plan: request.plan,
        language: request.language,
        audienceContext: request.audienceContext,
        backgroundEvidence: request.backgroundEvidence,
        agent: request.contentAgent,
        revision: revisionContext(
          contentSpec,
          copyBrief,
          request.backgroundEvidence,
          reviewed.run,
        ),
      });
    } catch (error) {
      return error instanceof TopicContentAgentWorkflowError
        ? {
            status: "blocked",
            stage: "content-writing",
            issues: [message(error)],
            faultKind: error.faultKind,
            rollbackStage: error.rollbackStage,
            contentSpec,
            copyBrief,
            contentReview: reviewed.run,
            contentAttempt: error.attempt,
          }
        : {
            status: "blocked",
            stage: "content-writing",
            issues: [message(error)],
            faultKind: "agent-failed",
            rollbackStage: "content-writing",
            contentSpec,
            copyBrief,
            contentReview: reviewed.run,
          };
    }
    if (revised.run.status !== "ready") {
      return {
        status: "blocked",
        stage: "content-writing",
        issues: revised.run.status === "blocked"
          ? revised.run.issues
          : ["Content Agent did not return a revised proposal."],
        faultKind: revised.run.status === "blocked"
          ? revised.run.faultKind
          : "proposal-invalid",
        rollbackStage: "content-writing",
        contentSpec,
        copyBrief,
        contentReview: reviewed.run,
        contentRun: revised.run,
        ...(revised.artifacts ? { contentAttempt: revised.artifacts } : {}),
      };
    }
    contentSpec = revised.run.spec;
    revisionAttempt = revised.artifacts;
  }

  return {
    status: "blocked",
    stage: "content-review",
    issues: ["Content optimization exhausted its bounded attempts."],
    faultKind: "proposal-invalid",
    rollbackStage: "content-writing",
    contentSpec,
    copyBrief,
    ...(revisionAttempt ? { contentAttempt: revisionAttempt } : {}),
  };
}
