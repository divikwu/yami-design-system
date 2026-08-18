import {
  analyzeTopicIntent,
  type AnalyzeTopicIntentOptions,
} from "./analyze.js";
import { CatalogSnapshotLoadError } from "./catalog-snapshot.js";
import { buildTopicPagePlanFromProductSelection } from "./planner.js";
import {
  advanceProductSelectionRun,
  CatalogCandidateLoadError,
  HttpProductSelectionAgentError,
  parseCatalogCandidateSnapshot,
  parseCatalogTaxonomySnapshot,
  runProductSelectionAgentWorkflow,
  runProductSelectionWorkflow,
  type CatalogCandidateAdapter,
  type CatalogCandidateQualityReport,
  type CatalogCandidateSnapshot,
  type CatalogTaxonomySnapshot,
  type ProductSelectionAgent,
  type ProductSelectionRun,
} from "./product-selection/index.js";
import { yamiCatalogCandidateAdapter } from "./yami-catalog.js";
import type {
  CategoryRoleRuntimeEvidence,
  ProductRole,
  TopicGenerationMode,
  TopicPlanMatrix,
} from "./types.js";

export interface HandleTopicGeneratorOptions extends AnalyzeTopicIntentOptions {
  candidateAdapter?: CatalogCandidateAdapter;
  taxonomySnapshot?: CatalogTaxonomySnapshot;
  productSelectionAgent?: ProductSelectionAgent;
  requireAutomaticCategoryRole?: boolean;
  categoryRoleConfigurationIssues?: string[];
}

function blockedCategoryRoleRun(issues: string[]): ProductSelectionRun {
  return {
    schemaVersion: "product-selection-run/v1",
    status: "blocked",
    strategyRef: "category-role/landing-page-agent@1",
    issues,
  };
}

function categoryRoleRuntimeEvidence(options: {
  automatic: boolean;
  taxonomySnapshot?: CatalogTaxonomySnapshot;
  agent?: ProductSelectionAgent;
  run: ProductSelectionRun;
  categoryRoleProposal?: unknown;
  candidateSnapshot?: CatalogCandidateSnapshot;
  candidateQualityReport?: CatalogCandidateQualityReport;
  sceneProposal?: unknown;
  configurationIssues: string[];
}): CategoryRoleRuntimeEvidence {
  const candidateAttempts = options.candidateSnapshot?.source.attempts ?? [];
  const readyResult = options.run.status === "ready" ? options.run.result : undefined;
  const distribution = readyResult?.selectedCategories.reduce<Record<ProductRole, number>>(
    (counts, category) => ({ ...counts, [category.role]: counts[category.role] + 1 }),
    { core: 0, pairing: 0, accessory: 0 },
  );
  const stageStatus = (completed: boolean) => completed
    ? "completed" as const
    : options.run.status === "blocked" ? "blocked" as const : "pending" as const;
  return {
    mode: options.automatic ? "automatic" : "resumable",
    taxonomy: options.taxonomySnapshot
      ? {
          status: "ready",
          sourceRef: options.taxonomySnapshot.sourceRef,
          digest: options.taxonomySnapshot.digest,
          fetchedAt: options.taxonomySnapshot.fetchedAt,
          categoryCount: options.taxonomySnapshot.categories.length,
        }
      : { status: "missing" },
    agent: options.agent
      ? { status: "ready", id: options.agent.id }
      : { status: "missing" },
    stages: [
      { id: "taxonomy", status: stageStatus(Boolean(options.taxonomySnapshot)) },
      { id: "category-proposal", status: stageStatus(Boolean(options.categoryRoleProposal)) },
      { id: "candidate-retrieval", status: stageStatus(Boolean(options.candidateSnapshot)) },
      { id: "scene-proposal", status: stageStatus(Boolean(options.sceneProposal)) },
      { id: "selection", status: stageStatus(options.run.status === "ready") },
    ],
    issues: options.run.status === "blocked"
      ? options.run.issues
      : options.configurationIssues,
    ...(candidateAttempts.length > 0
      ? {
          candidateAttempts: {
            succeeded: candidateAttempts.filter(({ status }) => status === "succeeded").length,
            total: candidateAttempts.length,
          },
        }
      : {}),
    ...(options.candidateQualityReport
      ? {
          candidateQuality: {
            status: options.candidateQualityReport.status,
            issueCount: options.candidateQualityReport.issues.length,
            emptyCategories: options.candidateQualityReport.summary.categories.empty,
            lowCoverageCategories:
              options.candidateQualityReport.summary.categories.lowCoverage,
            warnings: options.candidateQualityReport.issues.map(({ message }) => message),
          },
        }
      : {}),
    ...(distribution ? { categoryRoleDistribution: distribution } : {}),
    ...(readyResult ? { sceneCount: readyResult.scenes.length } : {}),
  };
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  sourceUrl?: string,
  details?: Record<string, unknown>,
) {
  return Response.json(
    { error: { code, message, sourceUrl, ...details } },
    { status },
  );
}

/** Handle the product's JSON HTTP endpoint without coupling it to a Web framework. */
export async function handleTopicGeneratorPost(
  request: Request,
  options: HandleTopicGeneratorOptions = {},
) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorResponse(400, "invalid_json", "Request body must be valid JSON.");
  }

  const keyword =
    typeof payload === "object" &&
    payload !== null &&
    "keyword" in payload &&
    typeof payload.keyword === "string"
      ? payload.keyword.trim()
      : "";
  const generationMode: TopicGenerationMode =
    typeof payload === "object" &&
    payload !== null &&
    "mode" in payload &&
    payload.mode === "selection"
      ? "selection"
      : "page";

  if (keyword.length < 2 || keyword.length > 80) {
    return errorResponse(
      400,
      "invalid_keyword",
      "Keyword must contain between 2 and 80 characters.",
    );
  }

  try {
    const { snapshot } = await analyzeTopicIntent(keyword, options);
    const requestPayload = payload as Record<string, unknown>;
    const interactiveHandoff = requestPayload.agentMode === "interactive";
    const automaticCategoryRole = options.requireAutomaticCategoryRole === true &&
      !interactiveHandoff;
    let taxonomySnapshot = options.taxonomySnapshot;
    try {
      taxonomySnapshot = automaticCategoryRole
        ? taxonomySnapshot
        : taxonomySnapshot ?? (requestPayload.taxonomySnapshot === undefined
          ? undefined
          : parseCatalogTaxonomySnapshot(requestPayload.taxonomySnapshot));
    } catch (error) {
      return errorResponse(
        400,
        "invalid_taxonomy_snapshot",
        error instanceof Error ? error.message : "CatalogTaxonomySnapshot is invalid.",
      );
    }
    let candidateSnapshot: CatalogCandidateSnapshot | undefined;
    try {
      candidateSnapshot = automaticCategoryRole || requestPayload.candidateSnapshot === undefined
        ? undefined
        : parseCatalogCandidateSnapshot(requestPayload.candidateSnapshot);
    } catch (error) {
      return errorResponse(
        400,
        "invalid_candidate_snapshot",
        error instanceof Error ? error.message : "CatalogCandidateSnapshot is invalid.",
      );
    }
    const categoryRequest = {
      snapshot,
      strategyRef: "category-role/landing-page-agent@1" as const,
      taxonomySnapshot,
      categoryRoleProposal: automaticCategoryRole
        ? undefined
        : requestPayload.categoryRoleProposal,
      candidateSnapshot: automaticCategoryRole ? undefined : candidateSnapshot,
      sceneProposal: automaticCategoryRole ? undefined : requestPayload.sceneProposal,
    };
    const relevanceRun = advanceProductSelectionRun({
      snapshot,
      strategyRef: "relevance/default@1",
    });
    const configurationIssues = options.categoryRoleConfigurationIssues ?? [];
    const automaticIssues = automaticCategoryRole
      ? [
          ...configurationIssues,
          ...(!taxonomySnapshot && configurationIssues.length === 0
            ? ["Automatic CategoryRole selection requires a taxonomy snapshot."]
            : []),
          ...(!options.productSelectionAgent && configurationIssues.length === 0
            ? ["Automatic CategoryRole selection requires a Product Agent."]
            : []),
        ]
      : [];
    const categoryWorkflow = automaticCategoryRole &&
        requestPayload.strategy === "category-role" &&
        automaticIssues.length === 0 &&
        taxonomySnapshot &&
        options.productSelectionAgent
      ? await runProductSelectionAgentWorkflow({
          ...categoryRequest,
          taxonomySnapshot,
          candidateAdapter: options.candidateAdapter ?? yamiCatalogCandidateAdapter,
          agent: options.productSelectionAgent,
        })
      : automaticCategoryRole && requestPayload.strategy === "category-role"
        ? { run: blockedCategoryRoleRun(automaticIssues), artifacts: {} }
        : await runProductSelectionWorkflow({
            ...categoryRequest,
            candidateAdapter: options.candidateAdapter ?? yamiCatalogCandidateAdapter,
          });
    const categoryRun = categoryWorkflow.run;
    const generatedCandidateSnapshot = categoryWorkflow.artifacts.candidateSnapshot;
    const candidateQualityReport = categoryWorkflow.artifacts.candidateQualityReport;
    const categoryRoleProposal = "categoryRoleProposal" in categoryWorkflow.artifacts
      ? categoryWorkflow.artifacts.categoryRoleProposal
      : categoryRequest.categoryRoleProposal;
    const sceneProposal = "sceneProposal" in categoryWorkflow.artifacts
      ? categoryWorkflow.artifacts.sceneProposal
      : categoryRequest.sceneProposal;
    if (relevanceRun.status !== "ready") {
      throw new Error("Relevance ProductSelection did not produce a ready result.");
    }
    const plans: TopicPlanMatrix = {
      en: {
        relevance: buildTopicPagePlanFromProductSelection(
          snapshot,
          relevanceRun.result,
          "en",
          generationMode,
        ),
      },
      zh: {
        relevance: buildTopicPagePlanFromProductSelection(
          snapshot,
          relevanceRun.result,
          "zh",
          generationMode,
        ),
      },
    };
    if (categoryRun.status === "ready") {
      plans.en["category-role"] = buildTopicPagePlanFromProductSelection(
        snapshot,
        categoryRun.result,
        "en",
        generationMode,
      );
      plans.zh["category-role"] = buildTopicPagePlanFromProductSelection(
        snapshot,
        categoryRun.result,
        "zh",
        generationMode,
      );
    }
    return Response.json({
      plans,
      selectionRuns: {
        relevance: relevanceRun,
        "category-role": categoryRun,
      },
      runtime: {
        categoryRole: categoryRoleRuntimeEvidence({
          automatic: automaticCategoryRole,
          taxonomySnapshot,
          agent: automaticCategoryRole ? options.productSelectionAgent : undefined,
          run: categoryRun,
          categoryRoleProposal,
          candidateSnapshot: generatedCandidateSnapshot ?? candidateSnapshot,
          candidateQualityReport,
          sceneProposal,
          configurationIssues,
        }),
      },
      ...(generatedCandidateSnapshot || candidateQualityReport
        ? {
            artifacts: {
              ...(generatedCandidateSnapshot
                ? { candidateSnapshot: generatedCandidateSnapshot }
                : {}),
              ...(candidateQualityReport ? { candidateQualityReport } : {}),
            },
          }
        : {}),
    });
  } catch (error) {
    if (error instanceof CatalogSnapshotLoadError) {
      return errorResponse(
        error.attempts.every((attempt) => attempt.errorCode === "no_products")
          ? 404
          : 502,
        "catalog_unavailable",
        error.message,
        undefined,
        { attempts: error.attempts },
      );
    }

    if (error instanceof CatalogCandidateLoadError) {
      return errorResponse(
        502,
        "candidate_catalog_unavailable",
        error.message,
        undefined,
        { attempts: error.attempts },
      );
    }

    if (error instanceof HttpProductSelectionAgentError) {
      return errorResponse(
        502,
        "product_agent_unavailable",
        error.message,
        undefined,
        {
          agentId: error.agentId,
          stage: error.stage,
          ...(error.status ? { status: error.status } : {}),
        },
      );
    }

    return errorResponse(
      500,
      "generation_failed",
      "The topic plan could not be generated. Try again.",
    );
  }
}
