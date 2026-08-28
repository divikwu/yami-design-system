import { analyzeTopicIntent, type TopicIntentAnalysis } from "../analyze.js";
import {
  runTopicBackgroundEvidenceAgentWorkflow,
  topicAudienceContext,
  unavailableTopicBackgroundEvidence,
  type TopicBackgroundEvidenceBundle,
} from "../background-evidence/index.js";
import {
  compileDeterministicTopicPageContentRun,
  runTopicPageContentApprovalWorkflow,
  runTopicContentAgentWorkflow,
  type TopicPageContentSpec,
} from "../page-content/index.js";
import {
  compileTopicPageGenerationSpec,
  compileTopicPageReviewPackage,
  runTopicPageQa,
  topicPageQaHasIntegrityFailure,
} from "../page-generation/index.js";
import {
  compileDeterministicTopicPagePlanV2,
  runPageMerchandisingAgentWorkflow,
  type TopicPagePlanV2,
} from "../page-merchandising/index.js";
import {
  runLandingPageOrchestratorAgentWorkflow,
  type LandingPageExecutionPlan,
} from "../page-orchestration/index.js";
import { runTopicPageReviewAgentWorkflow } from "../page-review/index.js";
import {
  validateTopicPageVisualAssetBodies,
} from "../page-automation/workflow.js";
import { runTopicVisualAgentWorkflow } from "../page-visual/index.js";
import {
  getProductSelectionStrategyConfig,
  runProductSelectionAgentWorkflow,
  runProductSelectionWorkflow,
  type ProductSelectionRun,
  type ProductSelectionResult,
  type ProductSelectionAgentWorkflowResult,
  type ProductSelectionWorkflowResult,
} from "../product-selection/index.js";
import { buildTopicPagePlanFromProductSelection, buildTopicPagePlanMatrix } from "../planner.js";
import type { HandleTopicGeneratorOptions } from "../server.js";
import { runTopicIntentAgentWorkflow } from "../topic-intent.js";
import type { ContentLanguage, TopicPlanMatrix } from "../types.js";
import { yamiCatalogCandidateAdapter } from "../yami-catalog.js";
import type {
  TopicGeneratorDeliverableName,
  TopicGeneratorRunManifestV2,
  TopicGeneratorRunStageId,
  TopicGeneratorStageExecutionResult,
} from "./contracts.js";
import type { AdvanceTopicGeneratorRunOptions } from "./store.js";

export interface TopicIntentStageOutput {
  analysis: TopicIntentAnalysis;
  plans?: TopicPlanMatrix;
  runtime: Awaited<ReturnType<typeof runTopicIntentAgentWorkflow>>["runtime"];
}

export interface BackgroundEvidenceStageOutput {
  backgroundEvidence: TopicBackgroundEvidenceBundle;
  run: Awaited<ReturnType<typeof runTopicBackgroundEvidenceAgentWorkflow>>["run"] | null;
  backgroundEvidenceByLanguage: Record<ContentLanguage, TopicBackgroundEvidenceBundle>;
  runByLanguage: Record<
    ContentLanguage,
    Awaited<ReturnType<typeof runTopicBackgroundEvidenceAgentWorkflow>>["run"] | null
  >;
}

export interface ProductSelectionStageOutput {
  executionPlan: LandingPageExecutionPlan;
  selectionRun: ProductSelectionRun;
  selection: ProductSelectionResult;
  plans: TopicPlanMatrix;
  artifacts: Record<string, unknown>;
}

export interface ModuleMerchandisingStageOutput {
  plan: TopicPagePlanV2;
  plans: TopicPlanMatrix;
  fallbackUsed: boolean;
  artifacts: Record<string, unknown>;
}

export interface ContentWritingStageOutput {
  contentSpec: TopicPageContentSpec;
  contentAttempt?: Awaited<ReturnType<typeof runTopicContentAgentWorkflow>>["artifacts"];
  contentByLanguage: Record<ContentLanguage, {
    contentSpec: TopicPageContentSpec;
    contentAttempt?: Awaited<ReturnType<typeof runTopicContentAgentWorkflow>>["artifacts"];
  }>;
}

export interface ContentReviewStageOutput {
  contentSpec: TopicPageContentSpec;
  copyBrief: Extract<
    Awaited<ReturnType<typeof runTopicPageContentApprovalWorkflow>>,
    { status: "ready" }
  >["copyBrief"];
  contentReview: Extract<
    Awaited<ReturnType<typeof runTopicPageContentApprovalWorkflow>>,
    { status: "ready" }
  >["contentReview"];
  revisionAttempt?: Extract<
    Awaited<ReturnType<typeof runTopicPageContentApprovalWorkflow>>,
    { status: "ready" }
  >["revisionAttempt"];
  contentByLanguage: Record<ContentLanguage, {
    contentSpec: TopicPageContentSpec;
    copyBrief: Extract<
      Awaited<ReturnType<typeof runTopicPageContentApprovalWorkflow>>,
      { status: "ready" }
    >["copyBrief"];
    contentReview: Extract<
      Awaited<ReturnType<typeof runTopicPageContentApprovalWorkflow>>,
      { status: "ready" }
    >["contentReview"];
    revisionAttempt?: Extract<
      Awaited<ReturnType<typeof runTopicPageContentApprovalWorkflow>>,
      { status: "ready" }
    >["revisionAttempt"];
  }>;
}

export interface VisualGenerationStageOutput {
  assetManifest: Extract<
    Awaited<ReturnType<typeof runTopicVisualAgentWorkflow>>["run"],
    { status: "ready" }
  >["manifest"];
  assetBodies: NonNullable<
    Awaited<ReturnType<typeof runTopicVisualAgentWorkflow>>["artifacts"]["assetBodies"]
  >;
}

export interface AssetPersistenceStageOutput {
  assetManifest: VisualGenerationStageOutput["assetManifest"];
  persistedRefs: string[];
}

export interface PageGenerationStageOutput {
  generationSpec: ReturnType<typeof compileTopicPageGenerationSpec>;
}

export interface AutomaticQaStageOutput {
  qaReport: Awaited<ReturnType<typeof runTopicPageQa>>;
}

export interface ExperienceReviewStageOutput {
  experienceReview?: Extract<
    Awaited<ReturnType<typeof runTopicPageReviewAgentWorkflow>>["run"],
    { status: "ready" }
  >["decision"];
  reviewPackage?: ReturnType<typeof compileTopicPageReviewPackage>;
  qaAdvisoryIssues?: string[];
  reviewAdvisoryIssues?: string[];
}

export interface TopicGeneratorDeliverableRenderRequest {
  name: TopicGeneratorDeliverableName;
  manifest: TopicGeneratorRunManifestV2;
  stages: Partial<Record<TopicGeneratorRunStageId, unknown>>;
  outputLanguage?: ContentLanguage;
}

export interface TopicGeneratorDeliverableRenderer {
  render(request: TopicGeneratorDeliverableRenderRequest): Promise<string>;
}

export interface TopicGeneratorManagedRuntimeOptions extends HandleTopicGeneratorOptions {
  deliverableRenderer: TopicGeneratorDeliverableRenderer;
}

function blocked(output: unknown, issues: string[]): TopicGeneratorStageExecutionResult {
  return { status: "blocked", output, issues: [...new Set(issues)] };
}

function required<T>(value: unknown, label: string): T {
  if (typeof value !== "object" || value === null) {
    throw new Error(`${label} is missing from the managed run.`);
  }
  return value as T;
}

function contentLanguages(primary: ContentLanguage): [ContentLanguage, ContentLanguage] {
  return primary === "zh" ? ["zh", "en"] : ["en", "zh"];
}

async function stageOutputs(
  readStageResult: AdvanceTopicGeneratorRunOptions["execute"] extends (
    input: infer T,
  ) => unknown ? T extends { readStageResult: infer R } ? R : never : never,
  currentStage: TopicGeneratorRunStageId,
  currentOutput?: unknown,
) {
  const ids: TopicGeneratorRunStageId[] = [
    "topic-intent",
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
  const outputs: Partial<Record<TopicGeneratorRunStageId, unknown>> = {};
  for (const id of ids) {
    if (id === currentStage && currentOutput !== undefined) {
      outputs[id] = currentOutput;
      continue;
    }
    const result = await (readStageResult as (stageId: TopicGeneratorRunStageId) => Promise<unknown>)(id);
    if (result !== undefined) outputs[id] = result;
  }
  return outputs;
}

function applyPagePlanV2ToLegacyPlans(
  plans: TopicPlanMatrix,
  strategy: "relevance" | "category-role",
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
      if (module.id === "start-here") {
        const sourceGroups = new Map(
          (module.groups ?? []).map((group) => [group.id, group]),
        );
        module.groups = reviewedModule.scenes.map((scene) => {
          const sourceGroup = sourceGroups.get(scene.sourceSceneId);
          return {
            ...sourceGroup,
            id: scene.id,
            label: sourceGroup?.label ?? scene.shoppingGoal,
            role: sourceGroup?.role ?? "core",
            productIds: [...scene.productIds],
            shoppingGoal: scene.shoppingGoal,
            scenarioReason: scene.reason,
            semanticSource: "agent-reviewed",
          };
        });
      } else if (module.id === "brand-spotlight" && module.groups) {
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

async function topicIntentStage(
  manifest: TopicGeneratorRunManifestV2,
  options: TopicGeneratorManagedRuntimeOptions,
): Promise<TopicGeneratorStageExecutionResult> {
  const initial = await analyzeTopicIntent(manifest.request.keyword, options);
  const resolved = await runTopicIntentAgentWorkflow({
    snapshot: initial.snapshot,
    intent: initial.intent,
    language: manifest.request.language,
    proposalReview: initial.proposalReview,
    agent: options.topicIntentAgent,
  });
  const output: TopicIntentStageOutput = {
    analysis: {
      ...initial,
      snapshot: resolved.snapshot,
      intent: resolved.intent,
      proposalReview: resolved.proposalReview,
    },
    plans: buildTopicPagePlanMatrix(resolved.snapshot, "selection"),
    runtime: resolved.runtime,
  };
  return {
    status: "completed",
    request: {
      keyword: manifest.request.keyword,
      site: manifest.request.site,
      language: manifest.request.language,
    },
    output,
  };
}

async function backgroundEvidenceStage(
  manifest: TopicGeneratorRunManifestV2,
  readStageResult: (stageId: TopicGeneratorRunStageId) => Promise<unknown | undefined>,
  options: TopicGeneratorManagedRuntimeOptions,
): Promise<TopicGeneratorStageExecutionResult> {
  const intentOutput = required<TopicIntentStageOutput>(
    await readStageResult("topic-intent"),
    "Topic intent stage",
  );
  const { intent, snapshot } = intentOutput.analysis;
  const localized = await Promise.all(contentLanguages(manifest.request.language).map(
    async (language) => {
      const workflow = options.topicPageAgent
        ? await runTopicBackgroundEvidenceAgentWorkflow({
            intent,
            keyword: snapshot.keyword,
            site: snapshot.site,
            language,
            agent: options.topicPageAgent,
          })
        : null;
      return {
        language,
        workflow,
        backgroundEvidence: workflow?.bundle ?? unavailableTopicBackgroundEvidence({
          intent,
          keyword: snapshot.keyword,
          site: snapshot.site,
          language,
        }, ["Background Evidence Agent is not configured."]),
      };
    },
  ));
  const byLanguage = Object.fromEntries(localized.map(({ language, backgroundEvidence }) => [
    language,
    backgroundEvidence,
  ])) as Record<ContentLanguage, TopicBackgroundEvidenceBundle>;
  const runByLanguage = Object.fromEntries(localized.map(({ language, workflow }) => [
    language,
    workflow?.run ?? null,
  ])) as BackgroundEvidenceStageOutput["runByLanguage"];
  const backgroundEvidence = byLanguage[manifest.request.language];
  const workflow = localized.find(({ language }) => language === manifest.request.language)!
    .workflow;
  const output: BackgroundEvidenceStageOutput = {
    backgroundEvidence,
    run: workflow?.run ?? null,
    backgroundEvidenceByLanguage: byLanguage,
    runByLanguage,
  };
  const html = await options.deliverableRenderer.render({
    name: "topic-brief.html",
    manifest,
    stages: await stageOutputs(readStageResult, "background-evidence", output),
  });
  const blockedIssues = localized.flatMap(({ language, workflow: localizedWorkflow, backgroundEvidence }) =>
    localizedWorkflow?.run.status === "ready"
      ? []
      : (backgroundEvidence.issues.length > 0
          ? backgroundEvidence.issues
          : ["Background evidence could not be completed."])
        .map((issue) => `${language}: ${issue}`)
  );
  return {
    status: "completed",
    request: {
      themeIntentDigest: backgroundEvidence.themeIntentDigest,
      language: manifest.request.language,
    },
    proposal: Object.fromEntries(localized.map(({ language, workflow }) => [
      language,
      workflow?.run && "proposalReview" in workflow.run
        ? workflow.run.proposalReview.proposal ?? null
        : null,
    ])),
    output,
    ...(blockedIssues.length > 0 ? { issues: blockedIssues } : {}),
    deliverables: { "topic-brief.html": html },
  };
}

async function productSelectionStage(
  manifest: TopicGeneratorRunManifestV2,
  readStageResult: (stageId: TopicGeneratorRunStageId) => Promise<unknown | undefined>,
  options: TopicGeneratorManagedRuntimeOptions,
): Promise<TopicGeneratorStageExecutionResult> {
  const intentOutput = required<TopicIntentStageOutput>(
    await readStageResult("topic-intent"),
    "Topic intent stage",
  );
  const { intent, snapshot } = intentOutput.analysis;
  const requestedSelectionStrategyRef = manifest.request.requestedSelectionStrategyRef ??
    (manifest.request.strategy === "category-role"
      ? "category-role/landing-page-agent@1"
      : "relevance/intent-themes@5");
  const orchestration = await runLandingPageOrchestratorAgentWorkflow({
    intent,
    keyword: snapshot.keyword,
    site: snapshot.site,
    language: manifest.request.language,
    requestedPageTypeRef: manifest.request.requestedPageTypeRef,
    requestedSelectionStrategyRef,
    ...(options.topicPageAgent ? { agent: options.topicPageAgent } : {}),
  });
  if (orchestration.run.status !== "ready") {
    return blocked(
      { orchestration: orchestration.run },
      orchestration.run.status === "blocked"
        ? orchestration.run.issues
        : ["Orchestrator Agent returned no execution plan."],
    );
  }
  const executionPlan = orchestration.run.plan;
  const strategy = getProductSelectionStrategyConfig(executionPlan.selectionStrategyRef).engine;
  let selectionWorkflow: ProductSelectionWorkflowResult | ProductSelectionAgentWorkflowResult;
  if (strategy === "category-role") {
    const issues = [
      ...(options.categoryRoleConfigurationIssues ?? []),
      ...(!options.taxonomySnapshot ? ["CategoryRole selection requires a taxonomy snapshot."] : []),
      ...(!options.productSelectionAgent ? ["CategoryRole selection requires a Product Agent."] : []),
    ];
    if (issues.length > 0 || !options.taxonomySnapshot || !options.productSelectionAgent) {
      return blocked({ executionPlan }, issues);
    }
    selectionWorkflow = await runProductSelectionAgentWorkflow({
      snapshot,
      strategyRef: executionPlan.selectionStrategyRef,
      language: manifest.request.language,
      taxonomySnapshot: options.taxonomySnapshot,
      candidateAdapter: options.candidateAdapter ?? yamiCatalogCandidateAdapter,
      agent: options.productSelectionAgent,
    });
  } else if (options.productSelectionAgent) {
    try {
      selectionWorkflow = await runProductSelectionAgentWorkflow({
        snapshot,
        strategyRef: executionPlan.selectionStrategyRef,
        language: manifest.request.language,
        candidateAdapter: options.candidateAdapter ?? yamiCatalogCandidateAdapter,
        agent: options.productSelectionAgent,
      });
    } catch (error) {
      return blocked({ executionPlan }, [
        error instanceof Error ? error.message : "Product semantic grouping failed.",
      ]);
    }
  } else {
    selectionWorkflow = await runProductSelectionWorkflow({
      snapshot,
      strategyRef: executionPlan.selectionStrategyRef,
      language: manifest.request.language,
      productSemanticProposal: null,
    });
  }
  if ("agentId" in selectionWorkflow.artifacts &&
      selectionWorkflow.artifacts.productSemanticFallbackUsed) {
    return blocked(
      { executionPlan, selectionRun: selectionWorkflow.run, artifacts: selectionWorkflow.artifacts },
      selectionWorkflow.artifacts.productSemanticProposalReview?.issues ??
        ["Product semantic grouping was not accepted."],
    );
  }
  if (selectionWorkflow.run.status !== "ready") {
    return blocked(
      { executionPlan, selectionRun: selectionWorkflow.run },
      selectionWorkflow.run.status === "blocked"
        ? selectionWorkflow.run.issues
        : ["Product selection returned no ready result."],
    );
  }
  const selection = selectionWorkflow.run.result;
  const plans = buildTopicPagePlanMatrix(snapshot);
  plans.en[strategy] = buildTopicPagePlanFromProductSelection(
    snapshot,
    selection,
    "en",
    manifest.request.goal === "selection" ? "selection" : "page",
  );
  plans.zh[strategy] = buildTopicPagePlanFromProductSelection(
    snapshot,
    selection,
    "zh",
    manifest.request.goal === "selection" ? "selection" : "page",
  );
  const output: ProductSelectionStageOutput = {
    executionPlan,
    selectionRun: selectionWorkflow.run,
    selection,
    plans,
    artifacts: selectionWorkflow.artifacts,
  };
  return {
    status: "completed",
    request: {
      executionPlanDigest: executionPlan.digest,
      strategyRef: executionPlan.selectionStrategyRef,
    },
    proposal: {
      orchestration: orchestration.artifacts.proposal ?? null,
      selection: selectionWorkflow.artifacts,
    },
    output,
  };
}

async function moduleMerchandisingStage(
  manifest: TopicGeneratorRunManifestV2,
  readStageResult: (stageId: TopicGeneratorRunStageId) => Promise<unknown | undefined>,
  options: TopicGeneratorManagedRuntimeOptions,
): Promise<TopicGeneratorStageExecutionResult> {
  const intentOutput = required<TopicIntentStageOutput>(
    await readStageResult("topic-intent"),
    "Topic intent stage",
  );
  const selectionOutput = required<ProductSelectionStageOutput>(
    await readStageResult("product-selection"),
    "Product selection stage",
  );
  const strategy = getProductSelectionStrategyConfig(
    selectionOutput.executionPlan.selectionStrategyRef,
  ).engine;
  const sourcePlan = selectionOutput.plans[manifest.request.language][strategy] ??
    selectionOutput.plans[manifest.request.language].relevance;
  let plan: TopicPagePlanV2;
  let fallbackUsed = false;
  let artifacts: Record<string, unknown> = {};
  if (options.topicPageAgent) {
    try {
      const workflow = await runPageMerchandisingAgentWorkflow({
        intent: intentOutput.analysis.intent,
        selection: selectionOutput.selection,
        language: manifest.request.language,
        templateRef: selectionOutput.executionPlan.templateRef,
        agent: options.topicPageAgent,
      });
      artifacts = workflow.artifacts;
      if (workflow.run.status === "ready") {
        plan = workflow.run.plan;
      } else {
        fallbackUsed = true;
        plan = compileDeterministicTopicPagePlanV2(
          intentOutput.analysis.intent,
          selectionOutput.selection,
          sourcePlan,
          selectionOutput.executionPlan.templateRef,
        );
        artifacts = { ...artifacts, blockedRun: workflow.run };
      }
    } catch (error) {
      fallbackUsed = true;
      artifacts = {
        issue: error instanceof Error ? error.message : "Page merchandising failed.",
      };
      plan = compileDeterministicTopicPagePlanV2(
        intentOutput.analysis.intent,
        selectionOutput.selection,
        sourcePlan,
        selectionOutput.executionPlan.templateRef,
      );
    }
  } else {
    fallbackUsed = true;
    plan = compileDeterministicTopicPagePlanV2(
      intentOutput.analysis.intent,
      selectionOutput.selection,
      sourcePlan,
      selectionOutput.executionPlan.templateRef,
    );
  }
  const plans = structuredClone(selectionOutput.plans);
  applyPagePlanV2ToLegacyPlans(plans, strategy, plan);
  const output: ModuleMerchandisingStageOutput = {
    plan,
    plans,
    fallbackUsed,
    artifacts,
  };
  const html = await options.deliverableRenderer.render({
    name: "page-draft.html",
    manifest,
    stages: await stageOutputs(readStageResult, "module-merchandising", output),
  });
  return {
    status: "completed",
    request: {
      executionPlanDigest: selectionOutput.executionPlan.digest,
      selectionStrategyRef: selectionOutput.selection.strategyRef,
    },
    proposal: artifacts,
    output,
    deliverables: { "page-draft.html": html },
  };
}

async function contentWritingStage(
  manifest: TopicGeneratorRunManifestV2,
  readStageResult: (stageId: TopicGeneratorRunStageId) => Promise<unknown | undefined>,
  options: TopicGeneratorManagedRuntimeOptions,
): Promise<TopicGeneratorStageExecutionResult> {
  const intentOutput = required<TopicIntentStageOutput>(
    await readStageResult("topic-intent"),
    "Topic intent stage",
  );
  const backgroundOutput = required<BackgroundEvidenceStageOutput>(
    await readStageResult("background-evidence"),
    "Background evidence stage",
  );
  const selectionOutput = required<ProductSelectionStageOutput>(
    await readStageResult("product-selection"),
    "Product selection stage",
  );
  const moduleOutput = required<ModuleMerchandisingStageOutput>(
    await readStageResult("module-merchandising"),
    "Module merchandising stage",
  );
  const localized = await Promise.all(contentLanguages(manifest.request.language).map(
    async (language) => {
      const request = {
        intent: intentOutput.analysis.intent,
        selection: selectionOutput.selection,
        plan: moduleOutput.plan,
        language,
        audienceContext: topicAudienceContext(language),
        backgroundEvidence: backgroundOutput.backgroundEvidenceByLanguage[language],
      };
      let workflow: Awaited<ReturnType<typeof runTopicContentAgentWorkflow>> | undefined;
      let fallbackIssue: string | undefined;
      if (options.topicPageAgent) {
        try {
          workflow = await runTopicContentAgentWorkflow({
            ...request,
            agent: options.topicPageAgent,
            selectorAgent: options.topicPageAgent,
          });
          if (workflow.run.status !== "ready") {
            fallbackIssue = "Content Agent output was replaced with deterministic Host copy.";
          }
        } catch (error) {
          fallbackIssue = error instanceof Error
            ? error.message
            : "Content Agent failed while preparing a proposal.";
        }
      } else {
        fallbackIssue = "Content Agent is unavailable; deterministic Host copy was used.";
      }
      const run = workflow?.run.status === "ready"
        ? workflow.run
        : compileDeterministicTopicPageContentRun(request);
      return { language, workflow, run, fallbackIssue };
    },
  ));
  const failed = localized.filter(({ run }) => run.status !== "ready");
  if (failed.length > 0) {
    return blocked(
      { contentByLanguage: Object.fromEntries(localized.map(({ language, workflow, run }) => [
        language,
        { contentRun: run, contentAttempt: workflow?.artifacts },
      ])) },
      failed.flatMap(({ language, run }) => (
        run.status === "blocked"
          ? run.issues
          : ["Content Agent returned no proposal."]
      ).map((issue) => `${language}: ${issue}`)),
    );
  }
  const contentByLanguage = Object.fromEntries(localized.map(({ language, workflow, run }) => {
    const ready = run as Extract<typeof run, { status: "ready" }>;
    return [language, {
      contentSpec: ready.spec,
      ...(workflow?.artifacts ? { contentAttempt: workflow.artifacts } : {}),
    }];
  })) as ContentWritingStageOutput["contentByLanguage"];
  const primary = contentByLanguage[manifest.request.language];
  const output: ContentWritingStageOutput = {
    contentSpec: primary.contentSpec,
    ...(primary.contentAttempt ? { contentAttempt: primary.contentAttempt } : {}),
    contentByLanguage,
  };
  return {
    status: "completed",
    request: {
      topicPagePlanDigest: moduleOutput.plan.digest,
      backgroundEvidenceDigests: Object.fromEntries(contentLanguages(manifest.request.language)
        .map((language) => [language, backgroundOutput.backgroundEvidenceByLanguage[language].digest])),
    },
    proposal: Object.fromEntries(localized.map(({ language, workflow }) => [
      language,
      workflow?.artifacts?.proposal ?? null,
    ])),
    output,
    ...(localized.some(({ fallbackIssue }) => fallbackIssue)
      ? { issues: localized.flatMap(({ language, fallbackIssue }) =>
          fallbackIssue ? [`${language}: ${fallbackIssue}`] : []) }
      : {}),
  };
}

async function contentReviewStage(
  manifest: TopicGeneratorRunManifestV2,
  readStageResult: (stageId: TopicGeneratorRunStageId) => Promise<unknown | undefined>,
  options: TopicGeneratorManagedRuntimeOptions,
): Promise<TopicGeneratorStageExecutionResult> {
  const intentOutput = required<TopicIntentStageOutput>(
    await readStageResult("topic-intent"),
    "Topic intent stage",
  );
  const backgroundOutput = required<BackgroundEvidenceStageOutput>(
    await readStageResult("background-evidence"),
    "Background evidence stage",
  );
  const selectionOutput = required<ProductSelectionStageOutput>(
    await readStageResult("product-selection"),
    "Product selection stage",
  );
  const moduleOutput = required<ModuleMerchandisingStageOutput>(
    await readStageResult("module-merchandising"),
    "Module merchandising stage",
  );
  const contentOutput = required<ContentWritingStageOutput>(
    await readStageResult("content-writing"),
    "Content writing stage",
  );
  const languages = contentLanguages(manifest.request.language);
  const contentAgent = options.topicPageAgent ?? {
    id: "deterministic-host",
    async proposePageContent() { return undefined; },
    async reviewPageContent() { return undefined; },
  };
  const localized: Array<{
    language: ContentLanguage;
    workflow: Awaited<ReturnType<typeof runTopicPageContentApprovalWorkflow>>;
  }> = [];
  for (const language of languages) {
    const primary = localized.find(({ language: reviewedLanguage }) =>
      reviewedLanguage === manifest.request.language
    );
    const primaryReady = primary?.workflow.status === "ready"
      ? primary.workflow
      : null;
    localized.push({
      language,
      workflow: await runTopicPageContentApprovalWorkflow({
        intent: intentOutput.analysis.intent,
        selection: selectionOutput.selection,
        plan: moduleOutput.plan,
        language,
        audienceContext: topicAudienceContext(language),
        backgroundEvidence: backgroundOutput.backgroundEvidenceByLanguage[language],
        contentSpec: contentOutput.contentByLanguage[language].contentSpec,
        contentAgent,
        reviewAgent: contentAgent,
        ...(primaryReady
          ? {
              localizationReference: {
                language: manifest.request.language,
                contentSpec: primaryReady.contentSpec,
                alignmentPolicy: "same-shopper-meaning-locale-native",
              } as const,
            }
          : {}),
      }),
    });
  }
  const failed = localized.filter(({ workflow }) => workflow.status !== "ready");
  if (failed.length > 0) {
    return blocked(
      { contentByLanguage: Object.fromEntries(localized.map(({ language, workflow }) => [
        language,
        workflow,
      ])) },
      failed.flatMap(({ language, workflow }) => {
        const blockedWorkflow = workflow as Exclude<typeof workflow, { status: "ready" }>;
        return blockedWorkflow.issues.map((issue) => `${language}: ${issue}`);
      }),
    );
  }
  const contentByLanguage = Object.fromEntries(localized.map(({ language, workflow }) => {
    const ready = workflow as Extract<typeof workflow, { status: "ready" }>;
    return [language, {
      contentSpec: ready.contentSpec,
      copyBrief: ready.copyBrief,
      contentReview: ready.contentReview,
      ...(ready.revisionAttempt ? { revisionAttempt: ready.revisionAttempt } : {}),
    }];
  })) as ContentReviewStageOutput["contentByLanguage"];
  const primary = contentByLanguage[manifest.request.language];
  const output: ContentReviewStageOutput = {
    contentSpec: primary.contentSpec,
    copyBrief: primary.copyBrief,
    contentReview: primary.contentReview,
    ...(primary.revisionAttempt ? { revisionAttempt: primary.revisionAttempt } : {}),
    contentByLanguage,
  };
  const html = await options.deliverableRenderer.render({
    name: "page-draft.html",
    manifest,
    stages: await stageOutputs(readStageResult, "content-review", output),
  });
  return {
    status: "completed",
    request: {
      contentSpecDigests: Object.fromEntries(contentLanguages(manifest.request.language)
        .map((language) => [language, contentOutput.contentByLanguage[language].contentSpec.digest])),
      backgroundEvidenceDigests: Object.fromEntries(contentLanguages(manifest.request.language)
        .map((language) => [language, backgroundOutput.backgroundEvidenceByLanguage[language].digest])),
    },
    proposal: Object.fromEntries(contentLanguages(manifest.request.language).map((language) => [
      language,
      contentByLanguage[language].contentReview,
    ])),
    output,
    deliverables: { "page-draft.html": html },
  };
}

async function visualGenerationStage(
  readStageResult: (stageId: TopicGeneratorRunStageId) => Promise<unknown | undefined>,
  options: TopicGeneratorManagedRuntimeOptions,
): Promise<TopicGeneratorStageExecutionResult> {
  if (!options.topicPageAgent) {
    return blocked(null, ["Visual generation requires the configured Topic Page Agent."]);
  }
  const intentOutput = required<TopicIntentStageOutput>(
    await readStageResult("topic-intent"),
    "Topic intent stage",
  );
  const backgroundOutput = required<BackgroundEvidenceStageOutput>(
    await readStageResult("background-evidence"),
    "Background evidence stage",
  );
  const selectionOutput = required<ProductSelectionStageOutput>(
    await readStageResult("product-selection"),
    "Product selection stage",
  );
  const moduleOutput = required<ModuleMerchandisingStageOutput>(
    await readStageResult("module-merchandising"),
    "Module merchandising stage",
  );
  const contentOutput = required<ContentReviewStageOutput>(
    await readStageResult("content-review"),
    "Content review stage",
  );
  const workflow = await runTopicVisualAgentWorkflow({
    intent: intentOutput.analysis.intent,
    selection: selectionOutput.selection,
    plan: moduleOutput.plan,
    contentSpec: contentOutput.contentSpec,
    backgroundEvidence: backgroundOutput.backgroundEvidence,
    productionMode: options.visualProductionMode ?? "generated-images",
    agent: options.topicPageAgent,
  });
  if (workflow.run.status !== "ready" || !workflow.artifacts.assetBodies) {
    return blocked(
      { visualRun: workflow.run },
      workflow.run.status === "blocked"
        ? workflow.run.issues
        : ["Visual Agent returned no complete image output."],
    );
  }
  const output: VisualGenerationStageOutput = {
    assetManifest: workflow.run.manifest,
    assetBodies: workflow.artifacts.assetBodies,
  };
  return {
    status: "completed",
    request: {
      topicPagePlanDigest: moduleOutput.plan.digest,
      contentSpecDigest: contentOutput.contentSpec.digest,
    },
    proposal: workflow.artifacts.proposal ?? null,
    output,
    ...(workflow.artifacts.issues?.length ? { issues: workflow.artifacts.issues } : {}),
  };
}

async function assetPersistenceStage(
  readStageResult: (stageId: TopicGeneratorRunStageId) => Promise<unknown | undefined>,
  assetStore: Parameters<AdvanceTopicGeneratorRunOptions["execute"]>[0]["assetStore"],
  options: TopicGeneratorManagedRuntimeOptions,
): Promise<TopicGeneratorStageExecutionResult> {
  const visualOutput = required<VisualGenerationStageOutput>(
    await readStageResult("visual-generation"),
    "Visual generation stage",
  );
  if (visualOutput.assetManifest.assets.length === 0) {
    return {
      status: "completed",
      request: { topicPageAssetManifestDigest: visualOutput.assetManifest.digest },
      output: {
        assetManifest: visualOutput.assetManifest,
        persistedRefs: [],
      } satisfies AssetPersistenceStageOutput,
    };
  }
  if (!options.topicPageImageDecoder) {
    return blocked(null, ["Asset persistence requires an image decoder."]);
  }
  const validated = await validateTopicPageVisualAssetBodies(
    visualOutput.assetBodies,
    visualOutput.assetManifest,
    options.topicPageImageDecoder,
  );
  if (validated.issues.length > 0) {
    return blocked({ assetManifest: visualOutput.assetManifest }, validated.issues);
  }
  for (const body of validated.decoded) await assetStore.put(body.ref, body.bytes);
  const output: AssetPersistenceStageOutput = {
    assetManifest: visualOutput.assetManifest,
    persistedRefs: validated.decoded.map(({ ref }) => ref),
  };
  return {
    status: "completed",
    request: { topicPageAssetManifestDigest: visualOutput.assetManifest.digest },
    output,
  };
}

async function pageGenerationStage(
  manifest: TopicGeneratorRunManifestV2,
  readStageResult: (stageId: TopicGeneratorRunStageId) => Promise<unknown | undefined>,
  assetStore: Parameters<AdvanceTopicGeneratorRunOptions["execute"]>[0]["assetStore"],
  options: TopicGeneratorManagedRuntimeOptions,
): Promise<TopicGeneratorStageExecutionResult> {
  const intentOutput = required<TopicIntentStageOutput>(
    await readStageResult("topic-intent"),
    "Topic intent stage",
  );
  const backgroundOutput = required<BackgroundEvidenceStageOutput>(
    await readStageResult("background-evidence"),
    "Background evidence stage",
  );
  const selectionOutput = required<ProductSelectionStageOutput>(
    await readStageResult("product-selection"),
    "Product selection stage",
  );
  const moduleOutput = required<ModuleMerchandisingStageOutput>(
    await readStageResult("module-merchandising"),
    "Module merchandising stage",
  );
  const contentOutput = required<ContentReviewStageOutput>(
    await readStageResult("content-review"),
    "Content review stage",
  );
  const assetsOutput = required<AssetPersistenceStageOutput>(
    await readStageResult("asset-persistence"),
    "Asset persistence stage",
  );
  const generationSpec = compileTopicPageGenerationSpec({
    intent: intentOutput.analysis.intent,
    selection: selectionOutput.selection,
    plan: moduleOutput.plan,
    contentSpec: contentOutput.contentSpec,
    backgroundEvidence: backgroundOutput.backgroundEvidence,
    manifest: assetsOutput.assetManifest,
    assetUrl: assetStore.publicUrl,
  });
  const output: PageGenerationStageOutput = { generationSpec };
  const html = await options.deliverableRenderer.render({
    name: "page-draft.html",
    manifest,
    stages: await stageOutputs(readStageResult, "page-generation", output),
  });
  return {
    status: "completed",
    request: {
      topicPagePlanDigest: moduleOutput.plan.digest,
      topicPageContentSpecDigest: contentOutput.contentSpec.digest,
      topicPageAssetManifestDigest: assetsOutput.assetManifest.digest,
    },
    output,
    deliverables: { "page-draft.html": html },
  };
}

async function automaticQaStage(
  readStageResult: (stageId: TopicGeneratorRunStageId) => Promise<unknown | undefined>,
  assetStore: Parameters<AdvanceTopicGeneratorRunOptions["execute"]>[0]["assetStore"],
  options: TopicGeneratorManagedRuntimeOptions,
): Promise<TopicGeneratorStageExecutionResult> {
  const intentOutput = required<TopicIntentStageOutput>(
    await readStageResult("topic-intent"),
    "Topic intent stage",
  );
  const selectionOutput = required<ProductSelectionStageOutput>(
    await readStageResult("product-selection"),
    "Product selection stage",
  );
  const moduleOutput = required<ModuleMerchandisingStageOutput>(
    await readStageResult("module-merchandising"),
    "Module merchandising stage",
  );
  const contentOutput = required<ContentReviewStageOutput>(
    await readStageResult("content-review"),
    "Content review stage",
  );
  const assetsOutput = required<AssetPersistenceStageOutput>(
    await readStageResult("asset-persistence"),
    "Asset persistence stage",
  );
  const generationOutput = required<PageGenerationStageOutput>(
    await readStageResult("page-generation"),
    "Page generation stage",
  );
  const imageDecoder = options.topicPageImageDecoder ??
    (assetsOutput.assetManifest.assets.length === 0
      ? { inspect: async () => null }
      : undefined);
  if (!imageDecoder) {
    return blocked(null, ["Automatic QA requires an image decoder."]);
  }
  const qaReport = await runTopicPageQa({
    intent: intentOutput.analysis.intent,
    selection: selectionOutput.selection,
    plan: moduleOutput.plan,
    contentSpec: contentOutput.contentSpec,
    manifest: assetsOutput.assetManifest,
    generationSpec: generationOutput.generationSpec,
    reader: assetStore,
    imageDecoder,
  });
  const output: AutomaticQaStageOutput = { qaReport };
  if (topicPageQaHasIntegrityFailure(qaReport)) return blocked(output, qaReport.issues);
  return {
    status: "completed",
    request: { generationSpecDigest: generationOutput.generationSpec.digest },
    output,
    ...(qaReport.issues.length > 0 ? { issues: qaReport.issues } : {}),
  };
}

async function experienceReviewStage(
  readStageResult: (stageId: TopicGeneratorRunStageId) => Promise<unknown | undefined>,
  options: TopicGeneratorManagedRuntimeOptions,
): Promise<TopicGeneratorStageExecutionResult> {
  const selectionOutput = required<ProductSelectionStageOutput>(
    await readStageResult("product-selection"),
    "Product selection stage",
  );
  const generationOutput = required<PageGenerationStageOutput>(
    await readStageResult("page-generation"),
    "Page generation stage",
  );
  const qaOutput = required<AutomaticQaStageOutput>(
    await readStageResult("automatic-qa"),
    "Automatic QA stage",
  );
  if (qaOutput.qaReport.status !== "passed") {
    if (topicPageQaHasIntegrityFailure(qaOutput.qaReport)) {
      return blocked(qaOutput, qaOutput.qaReport.issues);
    }
    const output: ExperienceReviewStageOutput = {
      qaAdvisoryIssues: [...qaOutput.qaReport.issues],
    };
    return {
      status: "completed",
      request: {
        executionPlanDigest: selectionOutput.executionPlan.digest,
        generationSpecDigest: generationOutput.generationSpec.digest,
        qaReportDigest: qaOutput.qaReport.digest,
      },
      output,
      issues: [...qaOutput.qaReport.issues],
    };
  }
  const passedQaReport = qaOutput.qaReport as AutomaticQaStageOutput["qaReport"] & {
    status: "passed";
  };
  if (!options.topicPageAgent || !options.topicPagePreviewResolver) {
    const issues = [
      "Experience review was unavailable; hard QA remains authoritative.",
    ];
    return {
      status: "completed",
      request: {
        executionPlanDigest: selectionOutput.executionPlan.digest,
        generationSpecDigest: generationOutput.generationSpec.digest,
        qaReportDigest: passedQaReport.digest,
      },
      output: { reviewAdvisoryIssues: issues } satisfies ExperienceReviewStageOutput,
      issues,
    };
  }
  const previewRefs = await options.topicPagePreviewResolver({
    executionPlan: selectionOutput.executionPlan,
    generationSpec: generationOutput.generationSpec,
    qaReport: passedQaReport,
  });
  const workflow = await runTopicPageReviewAgentWorkflow({
    executionPlan: selectionOutput.executionPlan,
    generationSpec: generationOutput.generationSpec,
    qaReport: passedQaReport,
    previewRefs,
    agent: options.topicPageAgent,
  });
  if (workflow.run.status !== "ready") {
    const issues = workflow.run.status === "blocked"
      ? workflow.run.issues
      : ["Experience Review Agent returned no proposal."];
    return {
      status: "completed",
      request: {
        executionPlanDigest: selectionOutput.executionPlan.digest,
        generationSpecDigest: generationOutput.generationSpec.digest,
        qaReportDigest: qaOutput.qaReport.digest,
      },
      proposal: workflow.artifacts.proposal ?? null,
      output: { reviewAdvisoryIssues: [...issues] } satisfies ExperienceReviewStageOutput,
      issues,
    };
  }
  if (workflow.run.decision.status === "revision-requested") {
    const issues = workflow.run.decision.issues.map(({ message }) => message);
    return {
      status: "completed",
      request: {
        executionPlanDigest: selectionOutput.executionPlan.digest,
        generationSpecDigest: generationOutput.generationSpec.digest,
        qaReportDigest: qaOutput.qaReport.digest,
      },
      proposal: workflow.artifacts.proposal ?? null,
      output: {
        experienceReview: workflow.run.decision,
        reviewAdvisoryIssues: [...issues],
      } satisfies ExperienceReviewStageOutput,
      issues,
    };
  }
  const reviewPackage = compileTopicPageReviewPackage({
    executionPlan: selectionOutput.executionPlan,
    generationSpec: generationOutput.generationSpec,
    qaReport: passedQaReport,
    experienceReview: workflow.run.decision,
    previewRefs,
  });
  const output: ExperienceReviewStageOutput = {
    experienceReview: workflow.run.decision,
    reviewPackage,
  };
  return {
    status: "completed",
    request: {
      executionPlanDigest: selectionOutput.executionPlan.digest,
      generationSpecDigest: generationOutput.generationSpec.digest,
      qaReportDigest: qaOutput.qaReport.digest,
    },
    proposal: workflow.artifacts.proposal ?? null,
    output,
    reviewPackageDigest: reviewPackage.digest,
  };
}

async function automaticFinalizationStage(
  manifest: TopicGeneratorRunManifestV2,
  readStageResult: (stageId: TopicGeneratorRunStageId) => Promise<unknown | undefined>,
  options: TopicGeneratorManagedRuntimeOptions,
): Promise<TopicGeneratorStageExecutionResult> {
  const qaOutput = required<AutomaticQaStageOutput>(
    await readStageResult("automatic-qa"),
    "Automatic QA stage",
  );
  if (topicPageQaHasIntegrityFailure(qaOutput.qaReport)) {
    return blocked(qaOutput, qaOutput.qaReport.issues);
  }
  const reviewOutput = required<ExperienceReviewStageOutput>(
    await readStageResult("experience-review"),
    "Experience review stage",
  );
  const html = await options.deliverableRenderer.render({
    name: "page-final.html",
    manifest,
    stages: await stageOutputs(readStageResult, "user-approval"),
  });
  return {
    status: "completed",
    runStatus: "completed",
    output: {
      completion: "automatic",
      qaReportDigest: qaOutput.qaReport.digest,
      reviewPackageDigest: reviewOutput.reviewPackage?.digest ?? null,
    },
    deliverables: { "page-final.html": html },
  };
}

export function createTopicGeneratorManagedStageExecutor(
  options: TopicGeneratorManagedRuntimeOptions,
): AdvanceTopicGeneratorRunOptions["execute"] {
  return async ({ manifest, stageId, readStageResult, assetStore }) => {
    switch (stageId) {
      case "topic-intent":
        return topicIntentStage(manifest, options);
      case "background-evidence":
        return backgroundEvidenceStage(manifest, readStageResult, options);
      case "product-selection":
        return productSelectionStage(manifest, readStageResult, options);
      case "module-merchandising":
        return moduleMerchandisingStage(manifest, readStageResult, options);
      case "content-writing":
        return contentWritingStage(manifest, readStageResult, options);
      case "content-review":
        return contentReviewStage(manifest, readStageResult, options);
      case "visual-generation":
        return visualGenerationStage(readStageResult, options);
      case "asset-persistence":
        return assetPersistenceStage(readStageResult, assetStore, options);
      case "page-generation":
        return pageGenerationStage(manifest, readStageResult, assetStore, options);
      case "automatic-qa":
        return automaticQaStage(readStageResult, assetStore, options);
      case "experience-review":
        return experienceReviewStage(readStageResult, options);
      case "user-approval":
        return automaticFinalizationStage(manifest, readStageResult, options);
    }
  };
}

export async function renderTopicGeneratorManagedDeliverable(
  name: TopicGeneratorDeliverableName,
  manifest: TopicGeneratorRunManifestV2,
  readStageResult: (stageId: TopicGeneratorRunStageId) => Promise<unknown | undefined>,
  renderer: TopicGeneratorDeliverableRenderer,
) {
  return renderer.render({
    name,
    manifest,
    stages: await stageOutputs(readStageResult, "user-approval"),
  });
}
