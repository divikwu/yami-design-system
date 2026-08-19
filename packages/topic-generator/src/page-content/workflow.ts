import type { ContentLanguage, ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import {
  productSelectionDigest,
  themeIntentDigest,
} from "../page-merchandising/review.js";
import type {
  TopicPageContentAttemptArtifact,
  TopicPageContentProposal,
  TopicPageContentRun,
} from "./contracts.js";
import { advanceTopicPageContentRun } from "./run.js";

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
  agent: TopicContentAgent;
  proposal?: unknown;
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
    proposal,
  });
  if (run.status === "blocked" && run.faultKind === "upstream-invalid") {
    return { run };
  }
  if (run.status === "needs-content-proposal") {
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
