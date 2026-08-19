import type { ContentLanguage, ThemeIntent } from "../types.js";
import type { LandingPageExecutionPlan } from "../page-orchestration/contracts.js";
import type { ProductSelectionResult } from "../product-selection/contracts.js";
import type { PageMerchandisingAgent } from "../page-merchandising/workflow.js";
import type { TopicPagePlanV2 } from "../page-merchandising/contracts.js";
import type { TopicContentAgent } from "../page-content/workflow.js";
import type {
  TopicPageContentAttemptArtifact,
  TopicPageContentFaultKind,
  TopicPageContentRollbackStage,
  TopicPageContentRun,
  TopicPageContentSpec,
} from "../page-content/contracts.js";
import type { TopicVisualAgent } from "../page-visual/workflow.js";
import type { TopicPageReviewAgent } from "../page-review/workflow.js";
import type { TopicPageExperienceReviewDecision } from "../page-review/contracts.js";
import type {
  TopicPageAssetManifest,
  TopicPageVisualProductionMode,
} from "../page-visual/contracts.js";
import type {
  TopicPageAssetStore,
  TopicPageGenerationSpec,
  TopicPageQaReport,
  TopicPageReviewPackage,
} from "../page-generation/contracts.js";
import type { TopicPageImageDecoder } from "../page-generation/image.js";

export type TopicPageAutomationStageId =
  | "workflow-planning"
  | "product-selection"
  | "module-merchandising"
  | "content-writing"
  | "visual-generation"
  | "asset-persistence"
  | "page-generation"
  | "automatic-qa"
  | "experience-review";

export interface TopicPageAutomationStage {
  id: TopicPageAutomationStageId;
  status: "pending" | "completed" | "blocked";
}

export interface TopicPageAutomationWorkflowOptions {
  intent: ThemeIntent;
  selection: ProductSelectionResult;
  executionPlan: LandingPageExecutionPlan;
  language: ContentLanguage;
  visualProductionMode?: TopicPageVisualProductionMode;
  agents: {
    merchandising: PageMerchandisingAgent;
    content: TopicContentAgent;
    visual: TopicVisualAgent;
    review: TopicPageReviewAgent;
  };
  assetStore: TopicPageAssetStore;
  imageDecoder: TopicPageImageDecoder;
  previewRefs: TopicPageReviewPackage["previewRefs"];
  contentResume?: {
    plan: TopicPagePlanV2;
    attempt: TopicPageContentAttemptArtifact;
    proposal: unknown;
  };
}

interface TopicPageAutomationPartialArtifacts {
  executionPlan?: LandingPageExecutionPlan;
  plan?: TopicPagePlanV2;
  contentRun?: TopicPageContentRun;
  contentAttempt?: TopicPageContentAttemptArtifact;
  contentSpec?: TopicPageContentSpec;
  assetManifest?: TopicPageAssetManifest;
  generationSpec?: TopicPageGenerationSpec;
  qaReport?: TopicPageQaReport;
  experienceReview?: TopicPageExperienceReviewDecision;
}

export type TopicPageAutomationRun =
  | ({
      schemaVersion: "topic-page-automation-run/v1";
      status: "ready";
      stage: "review-ready";
      stages: TopicPageAutomationStage[];
      issues: [];
      executionPlan: LandingPageExecutionPlan;
      plan: TopicPagePlanV2;
      contentSpec: TopicPageContentSpec;
      assetManifest: TopicPageAssetManifest;
      generationSpec: TopicPageGenerationSpec;
      qaReport: TopicPageQaReport & { status: "passed" };
      experienceReview: TopicPageExperienceReviewDecision & { status: "review-recommended" };
      reviewPackage: TopicPageReviewPackage;
    })
  | ({
      schemaVersion: "topic-page-automation-run/v1";
      status: "blocked";
      stage: TopicPageAutomationStageId;
      stages: TopicPageAutomationStage[];
      issues: string[];
      faultKind?: TopicPageContentFaultKind | "agent-failed";
      rollbackStage?: TopicPageContentRollbackStage;
    } & TopicPageAutomationPartialArtifacts);
