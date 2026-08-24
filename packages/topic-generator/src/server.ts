import {
  analyzeTopicIntent,
  type AnalyzeTopicIntentOptions,
} from "./analyze.js";
import { CatalogSnapshotLoadError } from "./catalog-snapshot.js";
import { buildTopicPagePlanFromProductSelection } from "./planner.js";
import {
  runTopicPageAutomationWorkflow,
  validateTopicPageVisualAssetBodies,
  type HttpTopicPageAgent,
  type TopicPageAutomationRun,
  type TopicPageAutomationStageId,
  type TopicPageReviewPreviewResolver,
} from "./page-automation/index.js";
import {
  compileTopicPageGenerationSpec,
  type TopicPageAssetStore,
} from "./page-generation/index.js";
import type { TopicPageImageDecoder } from "./page-generation/image.js";
import {
  advanceTopicPageContentRun,
  reviewTopicPageContentReviewDecision,
  runTopicPageContentApprovalWorkflow,
  runTopicContentAgentWorkflow,
  type TopicPageContentReviewDecision,
  type TopicPageContentSpec,
} from "./page-content/index.js";
import {
  runTopicBackgroundEvidenceAgentWorkflow,
  topicAudienceContext,
  unavailableTopicBackgroundEvidence,
  type TopicBackgroundEvidenceBundle,
} from "./background-evidence/index.js";
import {
  runTopicVisualAgentWorkflow,
  type TopicPageVisualProductionMode,
} from "./page-visual/index.js";
import {
  compileDeterministicTopicPagePlanV2,
  runPageMerchandisingAgentWorkflow,
  type HeroSelectionRun,
  type ShortcutSelectionRun,
  type StartHereSelectionRun,
  type TopicPagePlanV2,
} from "./page-merchandising/index.js";
import {
  runLandingPageOrchestratorAgentWorkflow,
  type LandingPageExecutionPlan,
  type LandingPageTypeRef,
} from "./page-orchestration/index.js";
import {
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
  type ProductSelectionResult,
  getProductSelectionStrategyConfig,
  type ProductSelectionStrategyRef,
} from "./product-selection/index.js";
import { yamiCatalogCandidateAdapter } from "./yami-catalog.js";
import type {
  CategoryRoleRuntimeEvidence,
  ContentLanguage,
  ProductSelectionStrategy,
  ProductRole,
  ThemeIntent,
  TopicGenerationMode,
  TopicPlanMatrix,
} from "./types.js";
import {
  runTopicIntentAgentWorkflow,
  type TopicIntentAgent,
} from "./topic-intent.js";

export interface HandleTopicGeneratorOptions extends AnalyzeTopicIntentOptions {
  topicIntentAgent?: TopicIntentAgent;
  candidateAdapter?: CatalogCandidateAdapter;
  taxonomySnapshot?: CatalogTaxonomySnapshot;
  productSelectionAgent?: ProductSelectionAgent;
  requireAutomaticCategoryRole?: boolean;
  categoryRoleConfigurationIssues?: string[];
  topicPageAgent?: HttpTopicPageAgent;
  topicPageAssetStore?: TopicPageAssetStore;
  topicPageImageDecoder?: TopicPageImageDecoder;
  topicPagePreviewResolver?: TopicPageReviewPreviewResolver;
  visualProductionMode?: TopicPageVisualProductionMode;
  requireAutomaticHeroReview?: boolean;
  requireAutomaticModuleReview?: boolean;
  requireAutomaticPage?: boolean;
  pageAutomationConfigurationIssues?: string[];
}

const PAGE_AUTOMATION_STAGES: readonly TopicPageAutomationStageId[] = [
  "workflow-planning",
  "background-evidence",
  "product-selection",
  "module-merchandising",
  "content-writing",
  "content-review",
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

function fallbackHeroSelection(
  plan: TopicPlanMatrix[ContentLanguage][ProductSelectionStrategy] | undefined,
  issues: string[],
): HeroSelectionRun {
  const hero = plan?.modules.find(({ id }) => id === "hero");
  return {
    schemaVersion: "hero-selection-run/v1",
    status: "fallback",
    source: "deterministic-rules",
    productIds: [...(hero?.productIds ?? [])],
    productReasons: { ...(hero?.productReasons ?? {}) },
    issues,
  };
}

function reviewedHeroSelection(
  agentId: string,
  plan: TopicPagePlanV2,
): HeroSelectionRun {
  const hero = plan.modules.find(({ id }) => id === "hero");
  if (!hero?.visible || hero.assignments.length === 0) {
    return {
      schemaVersion: "hero-selection-run/v1",
      status: "fallback",
      source: "deterministic-rules",
      productIds: [],
      productReasons: {},
      issues: ["Page Merchandising Agent returned no visible Hero assignments."],
    };
  }
  return {
    schemaVersion: "hero-selection-run/v1",
    status: "ready",
    source: "page-merchandising-agent",
    agentId,
    templateRef: plan.templateRef,
    planDigest: plan.digest,
    productIds: hero.assignments.map(({ productId }) => productId),
    productReasons: Object.fromEntries(hero.assignments.map((assignment) => [
      assignment.productId,
      assignment.selectionReason ?? assignment.reuseReason ?? hero.reason,
    ])),
    moduleReason: hero.reason,
  };
}

function applyHeroSelection(
  plans: TopicPlanMatrix,
  strategy: ProductSelectionStrategy,
  selection: Extract<HeroSelectionRun, { status: "ready" }>,
) {
  (["en", "zh"] as const).forEach((language) => {
    const plan = plans[language][strategy];
    const hero = plan?.modules.find(({ id }) => id === "hero");
    if (!hero) return;
    hero.productIds = [...selection.productIds];
    hero.productReasons = { ...selection.productReasons };
    hero.reason = selection.moduleReason;
  });
}

function fallbackShortcutSelection(
  plan: TopicPlanMatrix[ContentLanguage][ProductSelectionStrategy] | undefined,
  issues: string[],
): ShortcutSelectionRun {
  const shortcuts = plan?.modules.find(({ id }) => id === "shortcuts");
  return {
    schemaVersion: "shortcut-selection-run/v1",
    status: "fallback",
    source: "deterministic-rules",
    assignments: (shortcuts?.groups ?? []).flatMap((group) => {
      const productId = group.productIds[0];
      return productId
        ? [{
            groupId: group.id,
            productId,
            selectionReason: shortcuts?.productReasons?.[productId] ?? shortcuts?.reason ??
              "Primary Yami source-ranked representative for this verified group.",
          }]
        : [];
    }),
    issues,
  };
}

function reviewedShortcutSelection(
  agentId: string,
  plan: TopicPagePlanV2,
): ShortcutSelectionRun {
  const shortcuts = plan.modules.find(({ id }) => id === "shortcuts");
  if (!shortcuts?.visible || shortcuts.assignments.length === 0 ||
      shortcuts.assignments.some(({ groupId, selectionReason }) => !groupId || !selectionReason)) {
    return {
      schemaVersion: "shortcut-selection-run/v1",
      status: "fallback",
      source: "deterministic-rules",
      assignments: [],
      issues: ["Page Merchandising Agent returned no complete Shortcuts group assignments."],
    };
  }
  return {
    schemaVersion: "shortcut-selection-run/v1",
    status: "ready",
    source: "page-merchandising-agent",
    agentId,
    templateRef: plan.templateRef,
    planDigest: plan.digest,
    assignments: shortcuts.assignments.map((assignment) => ({
      groupId: assignment.groupId!,
      productId: assignment.productId,
      selectionReason: assignment.selectionReason!,
    })),
    moduleReason: shortcuts.reason,
  };
}

function applyShortcutSelection(
  plans: TopicPlanMatrix,
  strategy: ProductSelectionStrategy,
  selection: Extract<ShortcutSelectionRun, { status: "ready" }>,
) {
  (["en", "zh"] as const).forEach((language) => {
    const plan = plans[language][strategy];
    const shortcuts = plan?.modules.find(({ id }) => id === "shortcuts");
    if (!shortcuts) return;
    const assignmentsByGroupId = new Map(
      selection.assignments.map((assignment) => [assignment.groupId, assignment]),
    );
    const groups = shortcuts.groups ?? [];
    if (
      assignmentsByGroupId.size !== groups.length ||
      groups.some(({ id }) => !assignmentsByGroupId.has(id))
    ) {
      throw new Error("Page Merchandising must preserve every frozen Shortcuts group.");
    }
    shortcuts.productIds = groups.map(({ id }) => assignmentsByGroupId.get(id)!.productId);
    shortcuts.productReasons = Object.fromEntries(
      selection.assignments.map(({ productId, selectionReason }) => [productId, selectionReason]),
    );
    shortcuts.reason = selection.moduleReason;
  });
}

function fallbackStartHereSelection(
  plan: TopicPlanMatrix[ContentLanguage][ProductSelectionStrategy] | undefined,
  issues: string[],
): StartHereSelectionRun {
  const startHere = plan?.modules.find(({ id }) => id === "start-here");
  return {
    schemaVersion: "start-here-selection-run/v1",
    status: "fallback",
    source: "deterministic-rules",
    visible: Boolean(startHere?.visible),
    scenes: (startHere?.groups ?? []).map((group) => ({
      id: group.id,
      sourceSceneId: group.id,
      label: group.label,
      shoppingGoal: group.shoppingGoal ?? group.label,
      reason: group.scenarioReason ?? startHere?.reason ?? "Catalog-backed scene fallback.",
      productIds: [...group.productIds],
      ...(group.sourceCategoryIds
        ? { sourceCategoryIds: [...group.sourceCategoryIds] }
        : {}),
    })),
    issues,
  };
}

function reviewedStartHereSelection(
  agentId: string,
  plan: TopicPagePlanV2,
  selection: ProductSelectionResult,
): StartHereSelectionRun {
  const startHere = plan.modules.find(({ id }) => id === "start-here");
  if (!startHere) {
    return {
      schemaVersion: "start-here-selection-run/v1",
      status: "fallback",
      source: "deterministic-rules",
      visible: false,
      scenes: [],
      issues: ["Page Merchandising Agent returned no Start Here module."],
    };
  }
  if (!startHere.visible) {
    return {
      schemaVersion: "start-here-selection-run/v1",
      status: "ready",
      source: "page-merchandising-agent",
      agentId,
      templateRef: plan.templateRef,
      planDigest: plan.digest,
      visible: false,
      scenes: [],
      moduleReason: startHere.reason,
    };
  }
  const sourceScenesById = new Map(selection.scenes.map((scene) => [scene.id, scene]));
  const sourceGroupsById = new Map(
    (selection.modules.find(({ id }) => id === "start-here")?.groups ?? [])
      .map((group) => [group.id, group]),
  );
  if (startHere.scenes.length === 0) {
    return {
      schemaVersion: "start-here-selection-run/v1",
      status: "fallback",
      source: "deterministic-rules",
      visible: true,
      scenes: [],
      issues: ["Page Merchandising Agent returned no reviewed Start Here scenes."],
    };
  }
  const scenes = startHere.scenes.flatMap((scene) => {
    const sourceScene = sourceScenesById.get(scene.sourceSceneId);
    if (!sourceScene) return [];
    const sourceGroup = sourceGroupsById.get(scene.sourceSceneId);
    return [{
      id: scene.id,
      sourceSceneId: scene.sourceSceneId,
      ...(scene.targetProductCount !== undefined
        ? { targetProductCount: scene.targetProductCount }
        : {}),
      label: sourceScene.name,
      shoppingGoal: scene.shoppingGoal || sourceScene.title,
      reason: scene.reason || sourceScene.description,
      productIds: [...scene.productIds],
      ...(sourceGroup?.sourceCategoryIds
        ? { sourceCategoryIds: [...sourceGroup.sourceCategoryIds] }
        : {}),
    }];
  });
  if (scenes.length !== startHere.scenes.length) {
    return {
      schemaVersion: "start-here-selection-run/v1",
      status: "fallback",
      source: "deterministic-rules",
      visible: true,
      scenes: [],
      issues: ["Page Merchandising Agent referenced an unknown Start Here source scene."],
    };
  }
  return {
    schemaVersion: "start-here-selection-run/v1",
    status: "ready",
    source: "page-merchandising-agent",
    agentId,
    templateRef: plan.templateRef,
    planDigest: plan.digest,
    visible: true,
    scenes,
    moduleReason: startHere.reason,
  };
}

function applyStartHereSelection(
  plans: TopicPlanMatrix,
  strategy: ProductSelectionStrategy,
  selection: Extract<StartHereSelectionRun, { status: "ready" }>,
) {
  (["en", "zh"] as const).forEach((language) => {
    const plan = plans[language][strategy];
    const startHere = plan?.modules.find(({ id }) => id === "start-here");
    if (!startHere) return;
    startHere.visible = selection.visible;
    startHere.productIds = selection.scenes.flatMap(({ productIds }) => productIds);
    startHere.groups = selection.scenes.map((scene) => ({
      id: scene.id,
      label: scene.label,
      role: "core",
      productIds: [...scene.productIds],
      shoppingGoal: scene.shoppingGoal,
      scenarioReason: scene.reason,
      semanticSource: "agent-reviewed",
      ...(scene.sourceCategoryIds
        ? { sourceCategoryIds: [...scene.sourceCategoryIds] }
        : {}),
    }));
    startHere.reason = selection.moduleReason;
  });
}

function applyReviewedModuleAssignments(
  plans: TopicPlanMatrix,
  strategy: ProductSelectionStrategy,
  reviewedPlan: TopicPagePlanV2,
) {
  const reviewedModules = new Map(reviewedPlan.modules.map((module) => [module.id, module]));
  (["en", "zh"] as const).forEach((language) => {
    const plan = plans[language][strategy];
    if (!plan) return;
    plan.modules.forEach((module) => {
      const reviewedModule = reviewedModules.get(module.id);
      if (!reviewedModule) return;
      module.visible = reviewedModule.visible;
      module.productIds = reviewedModule.assignments.map(({ productId }) => productId);
      module.productReasons = Object.fromEntries(reviewedModule.assignments.map((assignment) => [
        assignment.productId,
        assignment.selectionReason ?? assignment.reuseReason ?? reviewedModule.reason,
      ]));
      module.reason = reviewedModule.reason;
      if (module.id === "brand-spotlight" && module.groups) {
        module.groups = module.groups.flatMap((group) => {
          const productIds = reviewedModule.assignments
            .filter(({ groupId }) => groupId === group.id)
            .map(({ productId }) => productId);
          return productIds.length > 0 ? [{ ...group, productIds }] : [];
        });
      } else if ((module.id === "popular-picks" || module.id === "explore-more") &&
          module.groups) {
        module.groups = module.groups.flatMap((group) => {
          const productIds = module.productIds.filter((productId) =>
            group.productIds.includes(productId)
          );
          return productIds.length > 0 ? [{ ...group, productIds }] : [];
        });
      }
    });
  });
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

type TopicGeneratorCapabilityMode = "content" | "visual";

interface TopicGeneratorCapabilityArtifacts {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
  plan: TopicPagePlanV2;
  pageTypeRef: LandingPageTypeRef;
  backgroundEvidence?: TopicBackgroundEvidenceBundle;
}

async function handleTopicGeneratorCapability(
  mode: TopicGeneratorCapabilityMode,
  requestPayload: Record<string, unknown>,
  options: HandleTopicGeneratorOptions,
) {
  if (!options.topicPageAgent) {
    return errorResponse(503, "agent_unavailable", "Topic Page Agent is not configured.");
  }
  const artifacts = requestPayload.artifacts as TopicGeneratorCapabilityArtifacts | undefined;
  if (!artifacts?.intent || !artifacts.selection || !artifacts.plan || !artifacts.pageTypeRef) {
    return errorResponse(
      400,
      "missing_upstream_artifacts",
      "Capability execution requires the frozen selection and PagePlan artifacts.",
    );
  }
  const language: ContentLanguage = requestPayload.language === "en" ? "en" : "zh";
  const audienceContext = topicAudienceContext(language);
  const frozenBackgroundEvidence = artifacts.backgroundEvidence;
  const backgroundEvidenceMatchesRequest = frozenBackgroundEvidence?.keyword ===
      artifacts.selection.keyword &&
    frozenBackgroundEvidence.site === artifacts.selection.site &&
    frozenBackgroundEvidence.language === language;
  let backgroundEvidence: TopicBackgroundEvidenceBundle;
  if (backgroundEvidenceMatchesRequest && frozenBackgroundEvidence) {
    backgroundEvidence = frozenBackgroundEvidence;
  } else {
    const refreshedBackgroundEvidence = await runTopicBackgroundEvidenceAgentWorkflow({
        intent: artifacts.intent,
        keyword: artifacts.selection.keyword,
        site: artifacts.selection.site,
        language,
        agent: options.topicPageAgent,
      });
    backgroundEvidence = refreshedBackgroundEvidence.bundle;
  }
  const contentContextRun = advanceTopicPageContentRun({
    intent: artifacts.intent,
    selection: artifacts.selection,
    plan: artifacts.plan,
    language,
    audienceContext,
    backgroundEvidence,
  });
  if (contentContextRun.status !== "needs-content-proposal") {
    return errorResponse(
      422,
      "content_context_invalid",
      contentContextRun.status === "blocked"
        ? contentContextRun.issues.join(" ")
        : "The bounded Content context could not be prepared.",
    );
  }
  let contentSpec = requestPayload.contentSpec as TopicPageContentSpec | undefined;
  if (mode === "visual" && !contentSpec) {
    return errorResponse(
      400,
      "missing_content_spec",
      "Visual generation requires the frozen ContentSpec produced by the content capability.",
    );
  }
  if (!contentSpec) {
    const content = await runTopicContentAgentWorkflow({
      intent: artifacts.intent,
      selection: artifacts.selection,
      plan: artifacts.plan,
      language,
      audienceContext,
      backgroundEvidence,
      agent: options.topicPageAgent,
      selectorAgent: options.topicPageAgent,
    });
    if (content.run.status !== "ready") {
      return errorResponse(
        422,
        "content_generation_blocked",
        content.run.status === "blocked"
          ? content.run.issues.join(" ")
          : "Content Agent did not return a proposal.",
      );
    }
    contentSpec = content.run.spec;
  }
  if (mode === "content") {
    const contentApproval = await runTopicPageContentApprovalWorkflow({
      intent: artifacts.intent,
      selection: artifacts.selection,
      plan: artifacts.plan,
      language,
      audienceContext,
      backgroundEvidence,
      contentSpec,
      contentAgent: options.topicPageAgent,
      reviewAgent: options.topicPageAgent,
    });
    if (contentApproval.status !== "ready") {
      return errorResponse(
        422,
        "content_optimization_blocked",
        contentApproval.issues.join(" "),
        undefined,
        {
          stage: contentApproval.stage,
          faultKind: contentApproval.faultKind,
        },
      );
    }
    return Response.json({
      capability: "content",
      contentSpec: contentApproval.contentSpec,
      contentReview: contentApproval.contentReview,
      backgroundEvidence,
    });
  }
  const contentReview = requestPayload.contentReview as
    | TopicPageContentReviewDecision
    | undefined;
  const contentReviewIssues = reviewTopicPageContentReviewDecision({
    contentSpec,
    copyBrief: contentContextRun.context.copyBrief,
    backgroundEvidence,
  }, contentReview);
  if (contentReviewIssues.length > 0) {
    return errorResponse(
      422,
      "content_review_invalid",
      contentReviewIssues.join(" "),
    );
  }
  if (!options.topicPageAssetStore || !options.topicPageImageDecoder) {
    return errorResponse(
      503,
      "visual_runtime_unavailable",
      "Visual generation requires the configured asset store and image decoder.",
    );
  }
  const visual = await runTopicVisualAgentWorkflow({
    intent: artifacts.intent,
    selection: artifacts.selection,
    plan: artifacts.plan,
    contentSpec,
    backgroundEvidence,
    productionMode: options.visualProductionMode ?? "generated-images",
    agent: options.topicPageAgent,
  });
  if (visual.run.status !== "ready") {
    return errorResponse(
      422,
      "visual_generation_blocked",
      visual.run.status === "blocked"
        ? visual.run.issues.join(" ")
        : "Visual Agent did not return a proposal.",
    );
  }
  const manifest = visual.run.manifest;
  const validatedBodies = await validateTopicPageVisualAssetBodies(
    visual.artifacts.assetBodies,
    manifest,
    options.topicPageImageDecoder,
  );
  if (validatedBodies.issues.length > 0) {
    return errorResponse(
      422,
      "visual_asset_invalid",
      validatedBodies.issues.join(" "),
    );
  }
  for (const body of validatedBodies.decoded) {
    await options.topicPageAssetStore.put(body.ref, body.bytes);
  }
  const generationSpec = compileTopicPageGenerationSpec({
    intent: artifacts.intent,
    selection: artifacts.selection,
    plan: artifacts.plan,
    contentSpec,
    backgroundEvidence,
    manifest,
    assetUrl: (ref) => options.topicPageAssetStore!.publicUrl(ref),
  });
  return Response.json({
    capability: "visual",
    contentSpec,
    contentReview,
    backgroundEvidence,
    generationSpec,
  });
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

  const requestPayload = payload as Record<string, unknown>;
  if (requestPayload.mode === "content" || requestPayload.mode === "visual") {
    try {
      return await handleTopicGeneratorCapability(requestPayload.mode, requestPayload, options);
    } catch (error) {
      return errorResponse(
        500,
        "capability_failed",
        error instanceof Error ? error.message : "Capability execution failed.",
      );
    }
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
    const requestedStrategy: ProductSelectionStrategy =
      requestPayload.strategy === "category-role" ? "category-role" : "relevance";
    const requestedSelectionStrategyRef: ProductSelectionStrategyRef =
      typeof requestPayload.selectionStrategyRef === "string" &&
        requestPayload.selectionStrategyRef.trim()
        ? requestPayload.selectionStrategyRef.trim() as ProductSelectionStrategyRef
        : requestedStrategy === "category-role"
          ? "category-role/landing-page-agent@1"
          : "relevance/intent-themes@5";
    const requestedPageTypeRef =
      typeof requestPayload.pageTypeRef === "string" && requestPayload.pageTypeRef.trim()
        ? requestPayload.pageTypeRef.trim() as LandingPageTypeRef
        : undefined;
    const contentLanguage: ContentLanguage = requestPayload.language === "en" ? "en" : "zh";
    const initialAnalysis = await analyzeTopicIntent(keyword, options);
    const topicIntentWorkflow = (
      requestedSelectionStrategyRef === "relevance/intent-themes@3" ||
      requestedSelectionStrategyRef === "relevance/intent-themes@4" ||
      requestedSelectionStrategyRef === "relevance/intent-themes@5"
    )
      ? await runTopicIntentAgentWorkflow({
          snapshot: initialAnalysis.snapshot,
          intent: initialAnalysis.intent,
          language: contentLanguage,
          proposalReview: initialAnalysis.proposalReview,
          agent: options.topicIntentAgent,
        })
      : {
          snapshot: initialAnalysis.snapshot,
          intent: initialAnalysis.intent,
          proposalReview: initialAnalysis.proposalReview,
          runtime: {
            mode: "catalog-fallback" as const,
            status: "fallback" as const,
            agent: { status: "missing" as const },
            proposalReview: initialAnalysis.proposalReview,
            categoryHypothesisCount: initialAnalysis.intent.categoryHypotheses?.length ?? 0,
            scenarioHypothesisCount: initialAnalysis.intent.scenarioHypotheses?.length ?? 0,
            issues: [],
          },
        };
    const { intent, snapshot } = topicIntentWorkflow;
    const backgroundEvidenceWorkflow = options.topicPageAgent
      ? await runTopicBackgroundEvidenceAgentWorkflow({
          intent,
          keyword: snapshot.keyword,
          site: snapshot.site,
          language: contentLanguage,
          agent: options.topicPageAgent,
        })
      : null;
    const backgroundEvidence = backgroundEvidenceWorkflow?.bundle ??
      unavailableTopicBackgroundEvidence({
        intent,
        keyword: snapshot.keyword,
        site: snapshot.site,
        language: contentLanguage,
      }, ["Background Evidence Agent is not configured."]);
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
      ...(!options.topicPagePreviewResolver &&
          (options.pageAutomationConfigurationIssues?.length ?? 0) === 0
        ? ["Automatic page generation requires a review preview resolver."]
        : []),
    ];
    let executionPlan: LandingPageExecutionPlan | undefined;
    let orchestrationIssues: string[] = [];
    if (generationMode === "page" && options.requireAutomaticPage &&
        pageConfigurationIssues.length === 0 && options.topicPageAgent &&
        options.topicPageAssetStore && options.topicPageImageDecoder &&
        options.topicPagePreviewResolver) {
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
      : "relevance/intent-themes@5";
    let relevanceWorkflow;
    if (options.productSelectionAgent) {
      try {
        relevanceWorkflow = await runProductSelectionAgentWorkflow({
          snapshot,
          strategyRef: relevanceStrategyRef,
          language: contentLanguage,
          candidateAdapter: options.candidateAdapter ?? yamiCatalogCandidateAdapter,
          agent: options.productSelectionAgent,
        });
      } catch {
        relevanceWorkflow = await runProductSelectionWorkflow({
          snapshot,
          strategyRef: relevanceStrategyRef,
          language: contentLanguage,
          productSemanticProposal: null,
        });
      }
    } else {
      relevanceWorkflow = await runProductSelectionWorkflow({
        snapshot,
        strategyRef: relevanceStrategyRef,
        language: contentLanguage,
        productSemanticProposal: null,
      });
    }
    const relevanceRun = relevanceWorkflow.run;
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
    const selectedRun = selectedStrategy === "category-role" ? categoryRun : relevanceRun;
    let heroSelection: HeroSelectionRun | undefined;
    let shortcutSelection: ShortcutSelectionRun | undefined;
    let startHereSelection: StartHereSelectionRun | undefined;
    let capabilityPlan: TopicPagePlanV2 | undefined;
    const automaticModuleReview = options.requireAutomaticModuleReview === true ||
      options.requireAutomaticHeroReview === true;
    if (generationMode === "selection" && automaticModuleReview) {
      const fallbackPlan = plans[contentLanguage][selectedStrategy] ??
        plans[contentLanguage].relevance;
      if (!options.topicPageAgent) {
        const issues = ["Automatic module selection requires a Topic Page Agent."];
        heroSelection = fallbackHeroSelection(fallbackPlan, issues);
        shortcutSelection = fallbackShortcutSelection(fallbackPlan, issues);
        startHereSelection = fallbackStartHereSelection(fallbackPlan, issues);
      } else if (selectedRun.status !== "ready") {
        const issues = selectedRun.status === "blocked"
          ? selectedRun.issues
          : ["ProductSelection did not produce a ready result for module review."];
        heroSelection = fallbackHeroSelection(fallbackPlan, issues);
        shortcutSelection = fallbackShortcutSelection(fallbackPlan, issues);
        startHereSelection = fallbackStartHereSelection(fallbackPlan, issues);
      } else {
        try {
          const heroOrchestration = await runLandingPageOrchestratorAgentWorkflow({
            intent,
            keyword: snapshot.keyword,
            site: snapshot.site,
            language: contentLanguage,
            requestedPageTypeRef,
            requestedSelectionStrategyRef,
            agent: options.topicPageAgent,
          });
          if (heroOrchestration.run.status !== "ready") {
            const issues = heroOrchestration.run.status === "blocked"
              ? heroOrchestration.run.issues
              : ["Orchestrator Agent did not return an execution plan proposal."];
            heroSelection = fallbackHeroSelection(fallbackPlan, issues);
            shortcutSelection = fallbackShortcutSelection(fallbackPlan, issues);
            startHereSelection = fallbackStartHereSelection(fallbackPlan, issues);
          } else {
            executionPlan = heroOrchestration.run.plan;
            const merchandising = await runPageMerchandisingAgentWorkflow({
              intent,
              selection: selectedRun.result,
              language: contentLanguage,
              templateRef: heroOrchestration.run.plan.templateRef,
              agent: options.topicPageAgent,
            });
            if (merchandising.run.status === "ready") {
              capabilityPlan = merchandising.run.plan;
              applyReviewedModuleAssignments(plans, selectedStrategy, merchandising.run.plan);
              heroSelection = reviewedHeroSelection(
                merchandising.artifacts.agentId,
                merchandising.run.plan,
              );
              shortcutSelection = reviewedShortcutSelection(
                merchandising.artifacts.agentId,
                merchandising.run.plan,
              );
              startHereSelection = reviewedStartHereSelection(
                merchandising.artifacts.agentId,
                merchandising.run.plan,
                selectedRun.result,
              );
              if (heroSelection.status === "ready") {
                applyHeroSelection(plans, selectedStrategy, heroSelection);
              }
              if (shortcutSelection.status === "ready") {
                applyShortcutSelection(plans, selectedStrategy, shortcutSelection);
              }
              if (startHereSelection.status === "ready") {
                applyStartHereSelection(plans, selectedStrategy, startHereSelection);
              }
            } else {
              const issues = merchandising.run.status === "blocked"
                ? merchandising.run.issues
                : ["Page Merchandising Agent did not return a proposal."];
              try {
                capabilityPlan = compileDeterministicTopicPagePlanV2(
                  intent,
                  selectedRun.result,
                  fallbackPlan,
                  heroOrchestration.run.plan.templateRef,
                );
              } catch (error) {
                issues.push(error instanceof Error
                  ? `Rule fallback PagePlan failed: ${error.message}`
                  : "Rule fallback PagePlan failed.");
              }
              heroSelection = fallbackHeroSelection(fallbackPlan, issues);
              shortcutSelection = fallbackShortcutSelection(fallbackPlan, issues);
              startHereSelection = fallbackStartHereSelection(fallbackPlan, issues);
            }
          }
        } catch (error) {
          const issues = [error instanceof Error ? error.message : "Module selection Agent failed."];
          if (executionPlan && selectedRun.status === "ready") {
            try {
              capabilityPlan = compileDeterministicTopicPagePlanV2(
                intent,
                selectedRun.result,
                fallbackPlan,
                executionPlan.templateRef,
              );
            } catch (fallbackError) {
              issues.push(fallbackError instanceof Error
                ? `Rule fallback PagePlan failed: ${fallbackError.message}`
                : "Rule fallback PagePlan failed.");
            }
          }
          heroSelection = fallbackHeroSelection(fallbackPlan, issues);
          shortcutSelection = fallbackShortcutSelection(fallbackPlan, issues);
          startHereSelection = fallbackStartHereSelection(fallbackPlan, issues);
        }
      }
    }
    let automation: TopicPageAutomationRun | undefined;
    if (generationMode === "page") {
      if (options.requireAutomaticPage) {
        if (pageConfigurationIssues.length > 0 || !options.topicPageAgent ||
            !options.topicPageAssetStore || !options.topicPageImageDecoder ||
            !options.topicPagePreviewResolver) {
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
          automation = await runTopicPageAutomationWorkflow({
            intent,
            selection: selectedRun.result,
            executionPlan,
            language: contentLanguage,
            audienceContext: topicAudienceContext(contentLanguage),
            backgroundEvidence,
            agents: {
              merchandising: options.topicPageAgent,
              content: options.topicPageAgent,
              contentSelector: options.topicPageAgent,
              contentReview: options.topicPageAgent,
              visual: options.topicPageAgent,
              review: options.topicPageAgent,
            },
            visualProductionMode: options.visualProductionMode ?? "generated-images",
            assetStore: options.topicPageAssetStore,
            imageDecoder: options.topicPageImageDecoder,
            previewResolver: options.topicPagePreviewResolver,
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
        topicIntent: topicIntentWorkflow.runtime,
        backgroundEvidence: {
          mode: backgroundEvidenceWorkflow ? "agent" : "fallback",
          status: backgroundEvidence.status,
          sourceCount: backgroundEvidence.sources.length,
          claimCount: backgroundEvidence.claims.length,
          issues: backgroundEvidence.issues,
          digest: backgroundEvidence.digest,
        },
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
      ...(heroSelection ? { heroSelection } : {}),
      ...(shortcutSelection ? { shortcutSelection } : {}),
      ...(startHereSelection ? { startHereSelection } : {}),
      ...(executionPlan
        ? { pagePreview: { pageTypeRef: executionPlan.pageTypeRef } }
        : {}),
      ...(generationMode === "selection" && executionPlan && capabilityPlan &&
          selectedRun.status === "ready"
        ? {
            capabilityArtifacts: {
              intent,
              selection: selectedRun.result,
              plan: capabilityPlan,
              pageTypeRef: executionPlan.pageTypeRef,
              backgroundEvidence,
            },
          }
        : {}),
      ...(automation ? { automation } : {}),
      backgroundEvidence,
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
