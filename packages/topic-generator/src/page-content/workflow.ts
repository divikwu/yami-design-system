import type { ContentLanguage, ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type {
  TopicAudienceContext,
  TopicBackgroundEvidenceBundle,
} from "../background-evidence/contracts.js";
import {
  productSelectionDigest,
  themeIntentDigest,
} from "../page-merchandising/review.js";
import type {
  TopicPageContentAttemptArtifact,
  TopicPageContentProposal,
  TopicPageContentRevisionContext,
  TopicPageContentRun,
} from "./contracts.js";
import { advanceTopicPageContentRun } from "./run.js";
import { topicPageContentSpecDigest } from "./review.js";

type NeedsContentProposalRun = Extract<
  TopicPageContentRun,
  { status: "needs-content-proposal" }
>;

export interface TopicContentAgent {
  id: string;
  proposePageContent(run: NeedsContentProposalRun): Promise<unknown>;
}

export interface TopicContentAgentWorkflowRequest {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
  plan: TopicPagePlanV2;
  language: ContentLanguage;
  audienceContext?: TopicAudienceContext;
  backgroundEvidence?: TopicBackgroundEvidenceBundle;
  agent: TopicContentAgent;
  proposal?: unknown;
  revision?: TopicPageContentRevisionContext;
  resume?: {
    attempt: TopicPageContentAttemptArtifact;
    proposal: unknown;
  };
}

export interface TopicContentAgentWorkflowResult {
  run: TopicPageContentRun;
  artifacts?: TopicPageContentAttemptArtifact;
}

export class TopicContentAgentWorkflowError extends Error {
  readonly faultKind = "agent-failed" as const;
  readonly rollbackStage = "content-writing" as const;

  constructor(
    message: string,
    readonly attempt: TopicPageContentAttemptArtifact,
    cause?: unknown,
  ) {
    super(message);
    this.name = "TopicContentAgentWorkflowError";
    this.cause = cause;
  }
}

function attemptArtifact(
  request: TopicContentAgentWorkflowRequest,
  proposal?: TopicPageContentProposal | unknown,
  run?: TopicPageContentRun,
  agentId = request.agent.id,
): TopicPageContentAttemptArtifact {
  return {
    schemaVersion: "topic-page-content-attempt/v1",
    agentId,
    topicPagePlanDigest: request.plan.digest,
    themeIntentDigest: request.plan.themeIntentDigest,
    productSelectionDigest: request.plan.productSelectionDigest,
    ...(request.backgroundEvidence
      ? { backgroundEvidenceDigest: request.backgroundEvidence.digest }
      : {}),
    ...(request.revision
      ? {
          copyBriefDigest: request.revision.review.copyBriefDigest,
          revision: structuredClone(request.revision),
        }
      : {}),
    language: request.language,
    ...(proposal === undefined ? {} : { proposal }),
    ...(run && "proposalReview" in run ? { proposalReview: run.proposalReview } : {}),
  };
}

function contentResumeIssues(request: TopicContentAgentWorkflowRequest) {
  const attempt = request.resume?.attempt;
  if (!attempt) return [];
  const issues: string[] = [];
  if (attempt.topicPagePlanDigest !== request.plan.digest) {
    issues.push("Content resume topicPagePlanDigest does not match the current PagePlan.");
  }
  if (attempt.themeIntentDigest !== themeIntentDigest(request.intent)) {
    issues.push("Content resume themeIntentDigest does not match the current ThemeIntent.");
  }
  if (attempt.productSelectionDigest !== productSelectionDigest(request.selection)) {
    issues.push("Content resume productSelectionDigest does not match the current ProductSelectionResult.");
  }
  if (attempt.language !== request.language) {
    issues.push("Content resume language does not match the current request.");
  }
  if (attempt.backgroundEvidenceDigest !== request.backgroundEvidence?.digest) {
    issues.push("Content resume backgroundEvidenceDigest does not match the current background evidence.");
  }
  return issues;
}

function contentRevisionIssues(
  request: TopicContentAgentWorkflowRequest,
  pending: NeedsContentProposalRun,
) {
  const revision = request.revision;
  if (!revision) return [];
  const issues: string[] = [];
  if (request.resume || request.proposal !== undefined) {
    issues.push("Content revision cannot be combined with a supplied proposal or explicit resume.");
  }
  if (revision.schemaVersion !== "topic-page-content-revision/v1" || revision.attempt !== 2) {
    issues.push("Content revision must be the bounded second content attempt.");
  }
  const previous = revision.previousContentSpec;
  if (previous.digest !== topicPageContentSpecDigest(previous)) {
    issues.push("Content revision previous ContentSpec digest is invalid.");
  }
  if (previous.topicPagePlanDigest !== request.plan.digest ||
      previous.themeIntentDigest !== themeIntentDigest(request.intent) ||
      previous.productSelectionDigest !== productSelectionDigest(request.selection) ||
      previous.language !== request.language) {
    issues.push("Content revision previous ContentSpec bindings do not match the current request.");
  }
  if (previous.backgroundEvidenceDigest !== request.backgroundEvidence?.digest ||
      (previous.copyBriefDigest !== undefined &&
        previous.copyBriefDigest !== pending.context.copyBrief.digest)) {
    issues.push("Content revision evidence or CopyBrief binding does not match the current request.");
  }
  if (revision.review.contentSpecDigest !== previous.digest ||
      revision.review.copyBriefDigest !== pending.context.copyBrief.digest ||
      revision.review.backgroundEvidenceDigest !== (request.backgroundEvidence?.digest ?? null)) {
    issues.push("Content revision review bindings do not match the previous ContentSpec.");
  }
  if (!revision.review.issues.some(({ severity }) => severity === "error")) {
    issues.push("Content revision requires at least one blocking review issue.");
  }
  return issues;
}

export async function runTopicContentAgentWorkflow(
  request: TopicContentAgentWorkflowRequest,
): Promise<TopicContentAgentWorkflowResult> {
  if (request.resume && request.resume.proposal === undefined) {
    const issues = ["Content resume requires a revised proposal."];
    return {
      run: {
        schemaVersion: "topic-page-content-run/v1",
        status: "blocked",
        faultKind: "proposal-invalid",
        rollbackStage: "content-writing",
        issues,
        proposalReview: { status: "rejected", issues },
      },
      artifacts: request.resume.attempt,
    };
  }
  const resumeIssues = contentResumeIssues(request);
  if (resumeIssues.length > 0) {
    return {
      run: {
        schemaVersion: "topic-page-content-run/v1",
        status: "blocked",
        faultKind: "upstream-invalid",
        rollbackStage: "module-merchandising",
        issues: resumeIssues,
        proposalReview: { status: "rejected", issues: resumeIssues },
      },
    };
  }
  let proposal = request.resume?.proposal ?? request.proposal;
  let run = advanceTopicPageContentRun({
    intent: request.intent,
    selection: request.selection,
    plan: request.plan,
    language: request.language,
    audienceContext: request.audienceContext,
    backgroundEvidence: request.backgroundEvidence,
    proposal,
  });
  if (run.status === "blocked" && run.faultKind === "upstream-invalid") {
    return { run };
  }
  if (run.status === "needs-content-proposal") {
    const revisionIssues = contentRevisionIssues(request, run);
    if (revisionIssues.length > 0) {
      return {
        run: {
          schemaVersion: "topic-page-content-run/v1",
          status: "blocked",
          faultKind: "upstream-invalid",
          rollbackStage: "content-writing",
          issues: revisionIssues,
          proposalReview: { status: "rejected", issues: revisionIssues },
        },
      };
    }
    if (request.revision) {
      run = {
        ...run,
        context: {
          ...run.context,
          revision: structuredClone(request.revision),
        },
      };
    }
    try {
      proposal = await request.agent.proposePageContent(run);
    } catch (error) {
      throw new TopicContentAgentWorkflowError(
        "Content Agent failed while preparing a proposal.",
        attemptArtifact(request),
        error,
      );
    }
    if (proposal === undefined) {
      throw new TopicContentAgentWorkflowError(
        "Content Agent returned no proposal.",
        attemptArtifact(request),
      );
    }
    run = advanceTopicPageContentRun({
      intent: request.intent,
      selection: request.selection,
      plan: request.plan,
      language: request.language,
      audienceContext: request.audienceContext,
      backgroundEvidence: request.backgroundEvidence,
      proposal,
    });
  }
  return {
    run,
    ...(proposal === undefined
      ? {}
      : {
          artifacts: attemptArtifact(
            request,
            proposal,
            run,
            request.resume?.attempt.agentId,
          ),
        }),
  };
}
