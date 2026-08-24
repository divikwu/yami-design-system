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
  TopicPageContentLocalizationReference,
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
  topicPageContentReviewDecisionDigest,
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
  localizationReference?: TopicPageContentLocalizationReference;
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
  localizationReference?: TopicPageContentLocalizationReference,
): TopicPageContentRevisionContext {
  const decision = review.decision;
  return {
    schemaVersion: "topic-page-content-revision/v1",
    attempt: 2,
    previousContentSpec: structuredClone(contentSpec),
    ...(localizationReference
      ? { localizationReference: structuredClone(localizationReference) }
      : {}),
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

function advisoryApprovalDecision(
  contentSpec: TopicPageContentSpec,
  copyBrief: TopicPageCopyBrief,
  backgroundEvidence: TopicBackgroundEvidenceBundle | undefined,
  reviewAgent: TopicPageContentReviewAgent,
  review: Extract<TopicPageContentReviewRun, { status: "blocked" }>,
  additionalWarnings: readonly string[] = [],
): TopicPageContentReviewDecision & { verdict: "approved" } {
  const reviewIssues = review.decision?.issues ?? review.issues.map((issue, index) => ({
    code: `content-review-advisory-${index + 1}`,
    severity: "warning" as const,
    message: issue,
  }));
  const issues = [
    ...reviewIssues.map((issue) => ({ ...issue, severity: "warning" as const })),
    ...additionalWarnings.map((warning, index) => ({
      code: `content-rewrite-advisory-${index + 1}`,
      severity: "warning" as const,
      message: warning,
    })),
  ].slice(0, 20).map((issue) => ({
    ...issue,
    message: issue.message.slice(0, 300),
  }));
  const decision = {
    schemaVersion: "topic-page-content-review/v1" as const,
    contentSpecDigest: contentSpec.digest,
    copyBriefDigest: copyBrief.digest,
    backgroundEvidenceDigest: backgroundEvidence?.digest ?? null,
    verdict: "approved" as const,
    issues,
    reviewerAgentId: review.decision?.reviewerAgentId ??
      reviewAgent.reviewerAgentId ?? reviewAgent.id,
  };
  return {
    ...decision,
    digest: topicPageContentReviewDecisionDigest(decision),
  };
}

function advisoryReviewFailure(
  issues: string[],
): Extract<TopicPageContentReviewRun, { status: "blocked" }> {
  return {
    schemaVersion: "topic-page-content-review-run/v1",
    status: "blocked",
    faultKind: "review-invalid",
    rollbackStage: "content-writing",
    issues,
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
      localizationReference: request.localizationReference,
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
        status: "ready",
        contentSpec,
        copyBrief,
        contentReview: advisoryApprovalDecision(
          contentSpec,
          copyBrief,
          request.backgroundEvidence,
          request.reviewAgent,
          advisoryReviewFailure(["Content Review Agent returned no proposal."]),
        ),
        ...(revisionAttempt ? { revisionAttempt } : {}),
      };
    }
    if (reviewed.run.faultKind === "structural-invalid") {
      return {
        status: "blocked",
        stage: "content-review",
        issues: reviewed.run.issues,
        faultKind: "proposal-invalid",
        rollbackStage: "content-writing",
        contentSpec,
        copyBrief,
        contentReview: reviewed.run,
        ...(revisionAttempt ? { contentAttempt: revisionAttempt } : {}),
      };
    }
    const canRewrite = reviewed.run.faultKind === "content-quality" &&
      attempt < (request.maxContentAttempts ?? 2);
    if (!canRewrite) {
      return {
        status: "ready",
        contentSpec,
        copyBrief,
        contentReview: advisoryApprovalDecision(
          contentSpec,
          copyBrief,
          request.backgroundEvidence,
          request.reviewAgent,
          reviewed.run,
        ),
        ...(revisionAttempt ? { revisionAttempt } : {}),
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
          request.localizationReference,
        ),
      });
    } catch (error) {
      return {
        status: "ready",
        contentSpec,
        copyBrief,
        contentReview: advisoryApprovalDecision(
          contentSpec,
          copyBrief,
          request.backgroundEvidence,
          request.reviewAgent,
          reviewed.run,
          [`Best-effort content rewrite was unavailable: ${message(error)}`],
        ),
        ...(error instanceof TopicContentAgentWorkflowError
          ? { revisionAttempt: error.attempt }
          : {}),
      };
    }
    if (revised.run.status !== "ready") {
      return {
        status: "ready",
        contentSpec,
        copyBrief,
        contentReview: advisoryApprovalDecision(
          contentSpec,
          copyBrief,
          request.backgroundEvidence,
          request.reviewAgent,
          reviewed.run,
          revised.run.status === "blocked"
            ? revised.run.issues
            : ["Content Agent did not return a revised proposal."],
        ),
        ...(revised.artifacts ? { revisionAttempt: revised.artifacts } : {}),
      };
    }
    contentSpec = revised.run.spec;
    revisionAttempt = revised.artifacts;
  }

  return {
    status: "ready",
    contentSpec,
    copyBrief,
    contentReview: advisoryApprovalDecision(
      contentSpec,
      copyBrief,
      request.backgroundEvidence,
      request.reviewAgent,
      advisoryReviewFailure(["Content optimization exhausted its bounded attempts."]),
    ),
    ...(revisionAttempt ? { revisionAttempt } : {}),
  };
}
