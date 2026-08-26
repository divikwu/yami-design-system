import type { ThemeIntent } from "../types.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type { TopicPageContentSpec } from "../page-content/contracts.js";
import type { TopicBackgroundEvidenceBundle } from "../background-evidence/contracts.js";
import type {
  TopicPageVisualAgentOutput,
  TopicPageVisualAssetBody,
  TopicPageVisualProposal,
  TopicPageVisualProductionMode,
  TopicPageVisualRun,
} from "./contracts.js";
import { advanceTopicPageVisualRun } from "./run.js";

type NeedsVisualProposalRun = Extract<
  TopicPageVisualRun,
  { status: "needs-visual-proposal" }
>;

export interface TopicVisualAgent {
  id: string;
  generatePageVisuals(run: NeedsVisualProposalRun): Promise<unknown>;
}

export interface TopicVisualAgentWorkflowRequest {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
  plan: TopicPagePlanV2;
  contentSpec: TopicPageContentSpec;
  backgroundEvidence?: TopicBackgroundEvidenceBundle;
  productionMode?: TopicPageVisualProductionMode;
  agent: TopicVisualAgent;
  proposal?: unknown;
}

export interface TopicVisualAgentWorkflowResult {
  run: TopicPageVisualRun;
  artifacts: {
    agentId: string;
    proposal?: TopicPageVisualProposal | unknown;
    assetBodies?: TopicPageVisualAssetBody[];
    issues?: string[];
  };
}

function visualAgentOutput(value: unknown): TopicPageVisualAgentOutput | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const output = value as Partial<TopicPageVisualAgentOutput>;
  return output.schemaVersion === "topic-page-visual-agent-output/v1" &&
      Array.isArray(output.assets) && "proposal" in output
    ? output as TopicPageVisualAgentOutput
    : null;
}

export async function runTopicVisualAgentWorkflow(
  request: TopicVisualAgentWorkflowRequest,
): Promise<TopicVisualAgentWorkflowResult> {
  let rawOutput = request.proposal;
  let output = visualAgentOutput(rawOutput);
  let proposal = output?.proposal ?? rawOutput;
  let run = advanceTopicPageVisualRun({
    intent: request.intent,
    selection: request.selection,
    plan: request.plan,
    contentSpec: request.contentSpec,
    backgroundEvidence: request.backgroundEvidence,
    productionMode: request.productionMode,
    proposal,
  });
  if (run.status === "needs-visual-proposal") {
    rawOutput = await request.agent.generatePageVisuals(run);
    output = visualAgentOutput(rawOutput);
    proposal = output?.proposal ?? rawOutput;
    run = advanceTopicPageVisualRun({
      intent: request.intent,
      selection: request.selection,
      plan: request.plan,
      contentSpec: request.contentSpec,
      backgroundEvidence: request.backgroundEvidence,
      productionMode: request.productionMode,
      proposal,
    });
  }
  const reviewIssues = "proposalReview" in run ? run.proposalReview.issues : [];
  return {
    run,
    artifacts: {
      agentId: request.agent.id,
      ...(proposal === undefined ? {} : { proposal }),
      ...(output ? { assetBodies: output.assets } : {}),
      ...((output?.issues?.length || reviewIssues.length)
        ? { issues: [...new Set([...(output?.issues ?? []), ...reviewIssues])] }
        : {}),
    },
  };
}
