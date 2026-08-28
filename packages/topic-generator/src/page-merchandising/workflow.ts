import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type { ContentLanguage, ThemeIntent } from "../types.js";
import type {
  ModuleMerchandisingProposal,
  PageMerchandisingRun,
  TopicPageTemplateRef,
} from "./contracts.js";
import { preservesCurrentRelevanceSelectionAssignments } from "./review.js";
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

function materializeFrozenRelevanceAssignments(
  selection: ProductSelectionResult,
  templateRef: TopicPageTemplateRef,
  value: unknown,
) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return value;
  const proposal = value as Record<string, unknown>;
  if (!Array.isArray(proposal.modules)) return value;
  return {
    ...proposal,
    modules: proposal.modules.map((rawModule) => {
      if (typeof rawModule !== "object" || rawModule === null || Array.isArray(rawModule)) {
        return rawModule;
      }
      const module = rawModule as Record<string, unknown>;
      const moduleId = typeof module.id === "string" ? module.id : "";
      const selectionModule = selection.modules.find(({ id }) => id === moduleId);
      if (moduleId === "brand-spotlight" && selectionModule?.groups.length &&
          preservesCurrentRelevanceSelectionAssignments(templateRef, "popular-picks") &&
          Array.isArray(module.assignments)) {
        return {
          ...module,
          assignments: module.assignments.map((value: unknown) => {
            if (typeof value !== "object" || value === null || Array.isArray(value)) return value;
            const assignment = value as Record<string, unknown>;
            const group = selectionModule.groups.find(({ id }) => id === assignment.groupId);
            if (typeof assignment.productId !== "string" ||
                !group?.productIds.includes(assignment.productId) ||
                typeof assignment.reuseReason === "string" && assignment.reuseReason.trim()) return value;
            return {
              ...assignment,
              reuseReason: "Preserved from the ProductSelection brand group for cross-module brand comparison.",
            };
          }),
        };
      }
      if (
        moduleId !== "popular-picks" && moduleId !== "explore-more" ||
        !preservesCurrentRelevanceSelectionAssignments(templateRef, moduleId)
      ) {
        return rawModule;
      }
      if (!selectionModule) return rawModule;
      return {
        ...module,
        assignments: selectionModule.productIds.map((productId) => ({
          productId,
          reuseReason:
            "Preserved from the ProductSelection-owned module; the Agent does not reselect it.",
        })),
      };
    }),
  };
}

export async function runPageMerchandisingAgentWorkflow(
  request: PageMerchandisingAgentWorkflowRequest,
): Promise<PageMerchandisingAgentWorkflowResult> {
  let proposal = materializeFrozenRelevanceAssignments(
    request.selection,
    request.templateRef,
    request.proposal,
  );
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
    proposal = materializeFrozenRelevanceAssignments(
      request.selection,
      request.templateRef,
      await request.agent.proposeModuleMerchandising(taskRun),
    );
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
