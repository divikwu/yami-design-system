import type {
  TopicPageGenerationSpec,
  TopicPageQaReport,
  TopicPageReviewPackage,
} from "../page-generation/contracts.js";
import type { LandingPageExecutionPlan } from "../page-orchestration/contracts.js";
import type {
  TopicPageExperienceReviewProposal,
  TopicPageExperienceReviewRun,
} from "./contracts.js";
import { advanceTopicPageExperienceReviewRun } from "./run.js";

type NeedsReviewProposalRun = Extract<
  TopicPageExperienceReviewRun,
  { status: "needs-review-proposal" }
>;

export interface TopicPageReviewAgent {
  id: string;
  reviewPageExperience(run: NeedsReviewProposalRun): Promise<unknown>;
}

export interface TopicPageReviewAgentWorkflowRequest {
  executionPlan: LandingPageExecutionPlan;
  generationSpec: TopicPageGenerationSpec;
  qaReport: TopicPageQaReport;
  previewRefs: TopicPageReviewPackage["previewRefs"];
  agent: TopicPageReviewAgent;
  proposal?: unknown;
}

export interface TopicPageReviewAgentWorkflowResult {
  run: TopicPageExperienceReviewRun;
  artifacts: {
    agentId: string;
    proposal?: TopicPageExperienceReviewProposal | unknown;
  };
}

export async function runTopicPageReviewAgentWorkflow(
  request: TopicPageReviewAgentWorkflowRequest,
): Promise<TopicPageReviewAgentWorkflowResult> {
  let proposal = request.proposal;
  let run = advanceTopicPageExperienceReviewRun({ ...request, proposal });
  if (run.status === "needs-review-proposal") {
    proposal = await request.agent.reviewPageExperience(run);
    run = advanceTopicPageExperienceReviewRun({ ...request, proposal });
  }
  return {
    run,
    artifacts: {
      agentId: request.agent.id,
      ...(proposal === undefined ? {} : { proposal }),
    },
  };
}
