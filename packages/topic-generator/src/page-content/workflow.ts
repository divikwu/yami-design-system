import type { ContentLanguage, ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type {
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
}

export interface TopicContentAgentWorkflowResult {
  run: TopicPageContentRun;
  artifacts: {
    agentId: string;
    proposal?: TopicPageContentProposal | unknown;
  };
}

export async function runTopicContentAgentWorkflow(
  request: TopicContentAgentWorkflowRequest,
): Promise<TopicContentAgentWorkflowResult> {
  let proposal = request.proposal;
  let run = advanceTopicPageContentRun({
    intent: request.intent,
    selection: request.selection,
    plan: request.plan,
    language: request.language,
    proposal,
  });
  if (run.status === "needs-content-proposal") {
    proposal = await request.agent.proposePageContent(run);
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
    artifacts: {
      agentId: request.agent.id,
      ...(proposal === undefined ? {} : { proposal }),
    },
  };
}
