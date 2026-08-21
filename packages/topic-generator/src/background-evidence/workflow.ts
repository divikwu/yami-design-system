import type { ContentLanguage, ThemeIntent, YamiSite } from "../types.js";
import type {
  TopicBackgroundEvidenceBundle,
  TopicBackgroundEvidenceRun,
} from "./contracts.js";
import {
  advanceTopicBackgroundEvidenceRun,
  unavailableTopicBackgroundEvidence,
} from "./run.js";

type NeedsBackgroundEvidenceProposalRun = Extract<
  TopicBackgroundEvidenceRun,
  { status: "needs-background-evidence-proposal" }
>;

export interface TopicBackgroundEvidenceAgent {
  id: string;
  proposeBackgroundEvidence(run: NeedsBackgroundEvidenceProposalRun): Promise<unknown>;
}

export interface TopicBackgroundEvidenceAgentWorkflowRequest {
  intent: ThemeIntent;
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  agent: TopicBackgroundEvidenceAgent;
}

export interface TopicBackgroundEvidenceAgentWorkflowResult {
  run: TopicBackgroundEvidenceRun;
  bundle: TopicBackgroundEvidenceBundle;
}

function message(error: unknown) {
  return error instanceof Error ? error.message : "Background evidence research failed.";
}

export async function runTopicBackgroundEvidenceAgentWorkflow(
  request: TopicBackgroundEvidenceAgentWorkflowRequest,
): Promise<TopicBackgroundEvidenceAgentWorkflowResult> {
  const pending = advanceTopicBackgroundEvidenceRun(request);
  if (pending.status === "blocked") {
    return {
      run: pending,
      bundle: unavailableTopicBackgroundEvidence(request, pending.issues),
    };
  }
  if (pending.status !== "needs-background-evidence-proposal") {
    throw new Error("Background evidence workflow did not produce a pending run.");
  }
  let proposal: unknown;
  try {
    proposal = await request.agent.proposeBackgroundEvidence(pending);
  } catch (error) {
    const issues = [`Background Evidence Agent failed: ${message(error)}`];
    return {
      run: {
        schemaVersion: "topic-background-evidence-run/v1",
        status: "blocked",
        issues,
        proposalReview: { status: "rejected", issues },
      },
      bundle: unavailableTopicBackgroundEvidence(request, issues),
    };
  }
  const run = advanceTopicBackgroundEvidenceRun({ ...request, proposal });
  if (run.status === "ready") return { run, bundle: run.bundle };
  const issues = run.status === "blocked"
    ? run.issues
    : ["Background Evidence Agent returned no proposal."];
  return {
    run,
    bundle: unavailableTopicBackgroundEvidence(request, issues),
  };
}
