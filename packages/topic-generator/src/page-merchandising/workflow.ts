import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type { ThemeIntent } from "../types.js";
import type {
  ModuleMerchandisingProposal,
  PageMerchandisingRun,
  TopicPageTemplateRef,
} from "./contracts.js";
import { advancePageMerchandisingRun } from "./run.js";

type NeedsModuleProposalRun = Extract<
  PageMerchandisingRun,
  { status: "needs-module-proposal" }
>;

export interface PageMerchandisingAgent {
  id: string;
  proposeModuleMerchandising(run: NeedsModuleProposalRun): Promise<unknown>;
}

export interface PageMerchandisingAgentWorkflowRequest {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
  templateRef: TopicPageTemplateRef;
  agent: PageMerchandisingAgent;
  proposal?: unknown;
}

export interface PageMerchandisingAgentWorkflowResult {
  run: PageMerchandisingRun;
  artifacts: {
    agentId: string;
    proposal?: ModuleMerchandisingProposal | unknown;
  };
}

export async function runPageMerchandisingAgentWorkflow(
  request: PageMerchandisingAgentWorkflowRequest,
): Promise<PageMerchandisingAgentWorkflowResult> {
  let proposal = request.proposal;
  let run = advancePageMerchandisingRun({
    intent: request.intent,
    selection: request.selection,
    templateRef: request.templateRef,
    proposal,
  });
  if (run.status === "needs-module-proposal") {
    proposal = await request.agent.proposeModuleMerchandising(run);
    run = advancePageMerchandisingRun({
      intent: request.intent,
      selection: request.selection,
      templateRef: request.templateRef,
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
