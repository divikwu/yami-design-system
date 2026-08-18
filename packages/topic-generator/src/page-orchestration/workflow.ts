import type { ProductSelectionStrategyRef } from "../product-selection/config.js";
import type { ContentLanguage, ThemeIntent, YamiSite } from "../types.js";
import type {
  LandingPageExecutionPlanProposal,
  LandingPageOrchestrationRun,
  LandingPageTypeRef,
} from "./contracts.js";
import { advanceLandingPageOrchestrationRun } from "./run.js";

type NeedsExecutionPlanProposalRun = Extract<
  LandingPageOrchestrationRun,
  { status: "needs-execution-plan-proposal" }
>;

export interface LandingPageOrchestratorAgent {
  id: string;
  proposeExecutionPlan(run: NeedsExecutionPlanProposalRun): Promise<unknown>;
}

export interface LandingPageOrchestratorAgentWorkflowRequest {
  intent: ThemeIntent;
  keyword?: string;
  site?: YamiSite;
  language: ContentLanguage;
  requestedPageTypeRef?: LandingPageTypeRef;
  requestedSelectionStrategyRef?: ProductSelectionStrategyRef;
  agent: LandingPageOrchestratorAgent;
  proposal?: unknown;
}

export interface LandingPageOrchestratorAgentWorkflowResult {
  run: LandingPageOrchestrationRun;
  artifacts: {
    agentId: string;
    proposal?: LandingPageExecutionPlanProposal | unknown;
  };
}

export async function runLandingPageOrchestratorAgentWorkflow(
  request: LandingPageOrchestratorAgentWorkflowRequest,
): Promise<LandingPageOrchestratorAgentWorkflowResult> {
  let proposal = request.proposal;
  let run = advanceLandingPageOrchestrationRun({ ...request, proposal });
  if (run.status === "needs-execution-plan-proposal") {
    proposal = await request.agent.proposeExecutionPlan(run);
    run = advanceLandingPageOrchestrationRun({ ...request, proposal });
  }
  return {
    run,
    artifacts: {
      agentId: request.agent.id,
      ...(proposal === undefined ? {} : { proposal }),
    },
  };
}
