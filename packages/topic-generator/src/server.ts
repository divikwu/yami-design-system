import {
  analyzeTopicIntent,
  type AnalyzeTopicIntentOptions,
} from "./analyze.js";
import { CatalogSnapshotLoadError } from "./catalog-snapshot.js";
import { buildTopicPagePlanFromProductSelection } from "./planner.js";
import {
  runTopicPageAutomationWorkflow,
  type HttpTopicPageAgent,
  type TopicPageAutomationRun,
  type TopicPageAutomationStageId,
} from "./page-automation/index.js";
import type { TopicPageAssetStore } from "./page-generation/contracts.js";
import type { TopicPageImageDecoder } from "./page-generation/image.js";
import {
  runLandingPageOrchestratorAgentWorkflow,
  type LandingPageExecutionPlan,
  type LandingPageTypeRef,
} from "./page-orchestration/index.js";
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
  getProductSelectionStrategyConfig,
  type ProductSelectionStrategyRef,
} from "./product-selection/index.js";
import { yamiCatalogCandidateAdapter } from "./yami-catalog.js";
import type {
  CategoryRoleRuntimeEvidence,
  ContentLanguage,
  ProductSelectionStrategy,
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
  topicPageAgent?: HttpTopicPageAgent;
  topicPageAssetStore?: TopicPageAssetStore;
  topicPageImageDecoder?: TopicPageImageDecoder;
  requireAutomaticPage?: boolean;
  pageAutomationConfigurationIssues?: string[];
}

const PAGE_AUTOMATION_STAGES: readonly TopicPageAutomationStageId[] = [
  "workflow-planning",
  "product-selection",
  "module-merchandising",
  "content-writing",
  "visual-generation",
  "asset-persistence",
  "page-generation",
  "automatic-qa",
  "experience-review",
];

function blockedPageAutomation(
  issues: string[],
  stage: TopicPageAutomationStageId = "workflow-planning",
  executionPlan?: LandingPageExecutionPlan,
): TopicPageAutomationRun {
  const blockedIndex = PAGE_AUTOMATION_STAGES.indexOf(stage);
  return {
    schemaVersion: "topic-page-automation-run/v1",
    status: "blocked",
    stage,
    stages: PAGE_AUTOMATION_STAGES.map((id) => ({
      id,
      status: id === stage
        ? "blocked"
        : PAGE_AUTOMATION_STAGES.indexOf(id) < blockedIndex ? "completed" : "pending",
    })),
    issues,
    ...(executionPlan ? { executionPlan } : {}),
  };
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
    const { intent, snapshot } = await analyzeTopicIntent(keyword, options);
    const requestPayload = payload as Record<string, unknown>;
    const requestedStrategy: ProductSelectionStrategy =
      requestPayload.strategy === "category-role" ? "category-role" : "relevance";
    const requestedSelectionStrategyRef: ProductSelectionStrategyRef =
      typeof requestPayload.selectionStrategyRef === "string" &&
        requestPayload.selectionStrategyRef.trim()
        ? requestPayload.selectionStrategyRef.trim() as ProductSelectionStrategyRef
        : requestedStrategy === "category-role"
          ? "category-role/landing-page-agent@1"
          : "relevance/intent-themes@2";
    const requestedPageTypeRef =
      typeof requestPayload.pageTypeRef === "string" && requestPayload.pageTypeRef.trim()
        ? requestPayload.pageTypeRef.trim() as LandingPageTypeRef
        : undefined;
    const contentLanguage: ContentLanguage = requestPayload.language === "en" ? "en" : "zh";
    const interactiveHandoff = requestPayload.agentMode === "interactive";
    const automaticCategoryRole = options.requireAutomaticCategoryRole === true &&
      !interactiveHandoff;
    const pageConfigurationIssues = [
      ...(options.pageAutomationConfigurationIssues ?? []),
      ...(!options.topicPageAgent &&
          (options.pageAutomationConfigurationIssues?.length ?? 0) === 0
        ? ["Automatic page generation requires a Topic Page Agent."]
        : []),
      ...(!options.topicPageAssetStore &&
          (options.pageAutomationConfigurationIssues?.length ?? 0) === 0
        ? ["Automatic page generation requires an asset store."]
        : []),
      ...(!options.topicPageImageDecoder &&
          (options.pageAutomationConfigurationIssues?.length ?? 0) === 0
        ? ["Automatic page generation requires an image decoder."]
        : []),
    ];
    let executionPlan: LandingPageExecutionPlan | undefined;
    let orchestrationIssues: string[] = [];
    if (generationMode === "page" && options.requireAutomaticPage &&
        pageConfigurationIssues.length === 0 && options.topicPageAgent &&
        options.topicPageAssetStore && options.topicPageImageDecoder) {
      try {
        const orchestration = await runLandingPageOrchestratorAgentWorkflow({
          intent,
          keyword: snapshot.keyword,
          site: snapshot.site,
          language: contentLanguage,
          requestedPageTypeRef,
          requestedSelectionStrategyRef,
          agent: options.topicPageAgent,
        });
        if (orchestration.run.status === "ready") executionPlan = orchestration.run.plan;
        else orchestrationIssues = orchestration.run.status === "blocked"
          ? orchestration.run.issues
          : ["Orchestrator Agent did not return an execution plan proposal."];
      } catch (error) {
        orchestrationIssues = [
          error instanceof Error ? error.message : "Orchestrator Agent failed.",
        ];
      }
    }
    const selectedStrategy: ProductSelectionStrategy = executionPlan
      ? getProductSelectionStrategyConfig(executionPlan.selectionStrategyRef).engine
      : requestedStrategy;
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
    const relevanceStrategyRef = getProductSelectionStrategyConfig(
      requestedSelectionStrategyRef,
    ).engine === "relevance"
      ? requestedSelectionStrategyRef
      : "relevance/intent-themes@2";
    const relevanceRun = advanceProductSelectionRun({
      snapshot,
      strategyRef: relevanceStrategyRef,
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
        selectedStrategy === "category-role" &&
        automaticIssues.length === 0 &&
        taxonomySnapshot &&
        options.productSelectionAgent
      ? await runProductSelectionAgentWorkflow({
          ...categoryRequest,
          taxonomySnapshot,
          candidateAdapter: options.candidateAdapter ?? yamiCatalogCandidateAdapter,
          agent: options.productSelectionAgent,
        })
      : automaticCategoryRole && selectedStrategy === "category-role"
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
    let automation: TopicPageAutomationRun | undefined;
    if (generationMode === "page") {
      const selectedRun = selectedStrategy === "category-role" ? categoryRun : relevanceRun;
      if (options.requireAutomaticPage) {
        if (pageConfigurationIssues.length > 0 || !options.topicPageAgent ||
            !options.topicPageAssetStore || !options.topicPageImageDecoder) {
          automation = blockedPageAutomation(pageConfigurationIssues);
        } else if (orchestrationIssues.length > 0 || !executionPlan) {
          automation = blockedPageAutomation(
            orchestrationIssues.length > 0
              ? orchestrationIssues
              : ["Orchestrator Agent did not produce an execution plan."],
          );
        } else if (selectedRun.status !== "ready") {
          automation = blockedPageAutomation(
            selectedRun.status === "blocked"
              ? selectedRun.issues
              : ["The selected product strategy did not produce a ready result."],
            "product-selection",
            executionPlan,
          );
        } else {
          const previewQuery = new URLSearchParams({
            "content-language": contentLanguage,
            "selection-strategy": selectedStrategy,
          }).toString();
          automation = await runTopicPageAutomationWorkflow({
            intent,
            selection: selectedRun.result,
            executionPlan,
            language: contentLanguage,
            agents: {
              merchandising: options.topicPageAgent,
              content: options.topicPageAgent,
              visual: options.topicPageAgent,
              review: options.topicPageAgent,
            },
            assetStore: options.topicPageAssetStore,
            imageDecoder: options.topicPageImageDecoder,
            previewRefs: {
              desktop: `/?${previewQuery}&preview=desktop`,
              mobile: `/?${previewQuery}&preview=mobile`,
            },
          });
        }
      }
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
      ...(automation ? { automation } : {}),
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
