import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type { ContentLanguage, ThemeIntent } from "../types.js";
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
  language?: ContentLanguage;
  templateRef: TopicPageTemplateRef;
  agent: PageMerchandisingAgent;
  proposal?: unknown;
}

export interface PageMerchandisingAgentWorkflowResult {
  run: PageMerchandisingRun;
  artifacts: {
    agentId: string;
    attemptCount: number;
    proposal?: ModuleMerchandisingProposal | unknown;
  };
}

export async function runPageMerchandisingAgentWorkflow(
  request: PageMerchandisingAgentWorkflowRequest,
): Promise<PageMerchandisingAgentWorkflowResult> {
  let proposal = request.proposal;
  let attemptCount = 0;
  let run = advancePageMerchandisingRun({
    intent: request.intent,
    selection: request.selection,
    language: request.language,
    templateRef: request.templateRef,
    proposal,
  });
  while (run.status === "needs-module-proposal" && attemptCount < 2) {
    const taskRun = run;
    proposal = await request.agent.proposeModuleMerchandising(taskRun);
    attemptCount += 1;
    run = advancePageMerchandisingRun({
      intent: request.intent,
      selection: request.selection,
      language: request.language,
      templateRef: request.templateRef,
      proposal,
    });
    if (
      run.status === "blocked" &&
      run.proposalReview.status === "rejected" &&
      attemptCount < 2
    ) {
      const proposalIssues = [...run.issues];
      const retryRun = advancePageMerchandisingRun({
        intent: request.intent,
        selection: request.selection,
        language: request.language,
        templateRef: request.templateRef,
      });
      run = retryRun.status === "needs-module-proposal"
        ? {
            ...retryRun,
            context: {
              ...retryRun.context,
              previousProposalIssues: proposalIssues,
            },
          }
        : retryRun;
    }
  }
  return {
    run,
    artifacts: {
      agentId: request.agent.id,
      attemptCount,
      ...(proposal === undefined ? {} : { proposal }),
    },
  };
}
