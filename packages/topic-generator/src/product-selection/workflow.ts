import type { CatalogCandidateAdapter } from "./candidates.js";
import { loadCatalogCandidateSnapshot } from "./candidates.js";
import type {
  CatalogCandidateSnapshot,
  ProductSelectionRequest,
  ProductSelectionRun,
} from "./contracts.js";
import { analyzeCatalogCandidateQuality } from "./quality.js";
import type { CatalogCandidateQualityReport } from "./quality.js";
import { advanceProductSelectionRun } from "./run.js";

type NeedsCategoryProposalRun = Extract<
  ProductSelectionRun,
  { status: "needs-category-proposal" }
>;
type NeedsSceneProposalRun = Extract<
  ProductSelectionRun,
  { status: "needs-scene-proposal" }
>;

export interface ProductSelectionAgent {
  id: string;
  proposeCategoryRoles(run: NeedsCategoryProposalRun): Promise<unknown>;
  proposeScenes(run: NeedsSceneProposalRun): Promise<unknown>;
}

export interface ProductSelectionWorkflowRequest extends ProductSelectionRequest {
  candidateAdapter?: CatalogCandidateAdapter;
}

export interface ProductSelectionWorkflowResult {
  run: ProductSelectionRun;
  artifacts: {
    candidateSnapshot?: CatalogCandidateSnapshot;
    candidateQualityReport?: CatalogCandidateQualityReport;
  };
}

export interface ProductSelectionAgentWorkflowRequest extends ProductSelectionRequest {
  candidateAdapter: CatalogCandidateAdapter;
  agent: ProductSelectionAgent;
  now?: () => Date;
}

export interface ProductSelectionAgentWorkflowResult {
  run: ProductSelectionRun;
  artifacts: {
    agentId: string;
    categoryRoleProposal?: unknown;
    candidateSnapshot?: CatalogCandidateSnapshot;
    candidateQualityReport?: CatalogCandidateQualityReport;
    sceneProposal?: unknown;
  };
}

function blockOnCandidateQuality(
  run: ProductSelectionRun,
  report: CatalogCandidateQualityReport | undefined,
): ProductSelectionRun {
  if (
    report?.status !== "error" ||
    (run.status !== "needs-scene-proposal" && run.status !== "ready")
  ) {
    return run;
  }

  return {
    schemaVersion: "product-selection-run/v1",
    status: "blocked",
    strategyRef: run.status === "ready" ? run.result.strategyRef : run.strategyRef,
    ...(run.categoryProposalReview
      ? { categoryProposalReview: run.categoryProposalReview }
      : {}),
    ...(run.candidateSnapshotReview
      ? { candidateSnapshotReview: run.candidateSnapshotReview }
      : {}),
    issues: report.issues.map(({ message }) => message),
  };
}

export async function runProductSelectionWorkflow(
  request: ProductSelectionWorkflowRequest,
): Promise<ProductSelectionWorkflowResult> {
  let run = advanceProductSelectionRun(request);
  let candidateQualityReport = request.candidateSnapshot
    ? analyzeCatalogCandidateQuality(request.candidateSnapshot)
    : undefined;
  run = blockOnCandidateQuality(run, candidateQualityReport);
  if (
    run.status !== "needs-candidate-snapshot" ||
    !request.taxonomySnapshot ||
    !request.candidateAdapter
  ) {
    return {
      run,
      artifacts: candidateQualityReport ? { candidateQualityReport } : {},
    };
  }

  const candidateSnapshot = await loadCatalogCandidateSnapshot({
    keyword: request.snapshot.keyword,
    site: request.snapshot.site,
    strategyRef: run.strategyRef,
    taxonomyDigest: request.taxonomySnapshot.digest,
    categories: run.context.categories,
    adapter: request.candidateAdapter,
  });
  run = advanceProductSelectionRun({
    ...request,
    candidateSnapshot,
  });
  candidateQualityReport = analyzeCatalogCandidateQuality(candidateSnapshot);
  run = blockOnCandidateQuality(run, candidateQualityReport);
  return { run, artifacts: { candidateSnapshot, candidateQualityReport } };
}

/**
 * Drives only the states that explicitly request Agent input. Proposal review,
 * retrieval, allocation, and deduplication remain inside deterministic modules.
 */
export async function runProductSelectionAgentWorkflow(
  request: ProductSelectionAgentWorkflowRequest,
): Promise<ProductSelectionAgentWorkflowResult> {
  let categoryRoleProposal = request.categoryRoleProposal;
  let candidateSnapshot = request.candidateSnapshot;
  let sceneProposal = request.sceneProposal;

  for (let step = 0; step < 4; step += 1) {
    const candidateQualityReport = candidateSnapshot
      ? analyzeCatalogCandidateQuality(candidateSnapshot)
      : undefined;
    const run = blockOnCandidateQuality(advanceProductSelectionRun({
      snapshot: request.snapshot,
      strategyRef: request.strategyRef,
      taxonomySnapshot: request.taxonomySnapshot,
      categoryRoleProposal,
      candidateSnapshot,
      sceneProposal,
    }), candidateQualityReport);
    const artifacts = {
      agentId: request.agent.id,
      categoryRoleProposal,
      candidateSnapshot,
      ...(candidateQualityReport
        ? { candidateQualityReport }
        : {}),
      sceneProposal,
    };
    if (run.status === "ready" || run.status === "blocked") {
      return { run, artifacts };
    }
    if (run.status === "needs-category-proposal") {
      categoryRoleProposal = await request.agent.proposeCategoryRoles(run);
      continue;
    }
    if (run.status === "needs-candidate-snapshot") {
      if (!request.taxonomySnapshot) {
        throw new Error("ProductSelection Agent workflow lost its taxonomy snapshot.");
      }
      candidateSnapshot = await loadCatalogCandidateSnapshot({
        keyword: request.snapshot.keyword,
        site: request.snapshot.site,
        strategyRef: run.strategyRef,
        taxonomyDigest: request.taxonomySnapshot.digest,
        categories: run.context.categories,
        adapter: request.candidateAdapter,
        now: request.now,
      });
      continue;
    }
    sceneProposal = await request.agent.proposeScenes(run);
  }

  throw new Error("ProductSelection Agent workflow exceeded its bounded state transitions.");
}
