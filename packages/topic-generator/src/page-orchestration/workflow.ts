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
    agentProposal?: unknown;
    fallbackUsed?: boolean;
    fallbackIssues?: string[];
  };
}

function deterministicProposal(
  run: NeedsExecutionPlanProposalRun,
): LandingPageExecutionPlanProposal | null {
  const compatiblePageTypes = run.context.pageTypes.filter(({ ref, supportedThemeTypes }) =>
    supportedThemeTypes.includes(run.context.themeIntent.themeType) &&
    (!run.context.requestedPageTypeRef || ref === run.context.requestedPageTypeRef)
  );
  const pageType = compatiblePageTypes.find(({ routes }) =>
    !run.context.requestedSelectionStrategyRef || routes.some(({ selectionStrategyRef }) =>
      selectionStrategyRef === run.context.requestedSelectionStrategyRef
    )
  );
  const route = pageType?.routes.find(({ selectionStrategyRef }) =>
    !run.context.requestedSelectionStrategyRef ||
    selectionStrategyRef === run.context.requestedSelectionStrategyRef
  );
  if (!pageType || !route) return null;
  return {
    schemaVersion: "landing-page-execution-plan-proposal/v1",
    keyword: run.context.keyword,
    site: run.context.site,
    language: run.context.language,
    themeIntentDigest: run.context.themeIntentDigest,
    requestedPageTypeRef: run.context.requestedPageTypeRef,
    requestedSelectionStrategyRef: run.context.requestedSelectionStrategyRef,
    pageTypeRef: pageType.ref,
    selectionStrategyRef: route.selectionStrategyRef,
    templateRef: route.templateRef,
    reason: "Use the first registered route compatible with the current ThemeIntent and caller constraints.",
  };
}

export async function runLandingPageOrchestratorAgentWorkflow(
  request: LandingPageOrchestratorAgentWorkflowRequest,
): Promise<LandingPageOrchestratorAgentWorkflowResult> {
  let proposal = request.proposal;
  let run = advanceLandingPageOrchestrationRun({ ...request, proposal });
  let agentProposal: unknown;
  let fallbackIssues: string[] = [];
  let fallbackUsed = false;
  if (run.status === "needs-execution-plan-proposal") {
    const pending = run;
    try {
      agentProposal = await request.agent.proposeExecutionPlan(run);
      proposal = agentProposal;
      run = advanceLandingPageOrchestrationRun({ ...request, proposal });
      if (run.status === "blocked") fallbackIssues = [...run.issues];
    } catch (error) {
      fallbackIssues = [error instanceof Error
        ? error.message
        : "Landing Page Orchestrator Agent failed."];
    }
    if (run.status !== "ready") {
      const fallbackProposal = deterministicProposal(pending);
      if (fallbackProposal) {
        fallbackUsed = true;
        proposal = fallbackProposal;
        run = advanceLandingPageOrchestrationRun({ ...request, proposal });
      }
    }
  }
  return {
    run,
    artifacts: {
      agentId: request.agent.id,
      ...(proposal === undefined ? {} : { proposal }),
      ...(agentProposal === undefined ? {} : { agentProposal }),
      ...(fallbackUsed ? { fallbackUsed } : {}),
      ...(fallbackIssues.length > 0 ? { fallbackIssues } : {}),
    },
  };
}
