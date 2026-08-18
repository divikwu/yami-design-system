import type {
  ContentLanguage,
  ThemeIntent,
  ThemeType,
  YamiSite,
} from "../types.js";
import type {
  ProductSelectionStrategyConfig,
  ProductSelectionStrategyRef,
} from "../product-selection/config.js";
import type {
  PageMerchandisingTemplateConfig,
} from "../page-merchandising/config.js";
import type { TopicPageTemplateRef } from "../page-merchandising/contracts.js";

export type LandingPageTypeRef = `${string}@${number}`;
export type LandingPageWorkflowRef = `${string}@${number}`;

export type LandingPageExecutionStageId =
  | "product-selection"
  | "module-merchandising"
  | "content-writing"
  | "visual-generation"
  | "asset-persistence"
  | "page-generation"
  | "automatic-qa"
  | "experience-review";

export type LandingPageReviewRollbackStage =
  | "module-merchandising"
  | "content-writing"
  | "visual-generation";

export type LandingPageExecutionActor =
  | "strategy-agent"
  | "content-agent"
  | "visual-agent"
  | "review-agent"
  | "system";

export interface LandingPageTypeRoute {
  selectionStrategyRef: ProductSelectionStrategyRef;
  templateRef: TopicPageTemplateRef;
}

export interface LandingPageTypeConfig {
  schemaVersion: "landing-page-type/v1";
  ref: LandingPageTypeRef;
  id: string;
  version: number;
  label: { en: string; zh: string };
  supportedThemeTypes: ThemeType[];
  requiresExplicitRequest: boolean;
  routes: LandingPageTypeRoute[];
}

export interface LandingPageExecutionStage {
  id: LandingPageExecutionStageId;
  actor: LandingPageExecutionActor;
  maxAttempts: number;
}

export interface LandingPageExecutionPlanProposal {
  schemaVersion: "landing-page-execution-plan-proposal/v1";
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  themeIntentDigest: string;
  requestedPageTypeRef: LandingPageTypeRef | null;
  requestedSelectionStrategyRef: ProductSelectionStrategyRef | null;
  pageTypeRef: LandingPageTypeRef;
  selectionStrategyRef: ProductSelectionStrategyRef;
  templateRef: TopicPageTemplateRef;
  reason: string;
}

export interface LandingPageExecutionPlanProposalReview {
  status: "accepted" | "rejected";
  issues: string[];
  proposal?: LandingPageExecutionPlanProposal;
}

export interface LandingPageExecutionPlan {
  schemaVersion: "landing-page-execution-plan/v1";
  status: "execution-ready";
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  themeIntentDigest: string;
  pageTypeRef: LandingPageTypeRef;
  selectionStrategyRef: ProductSelectionStrategyRef;
  templateRef: TopicPageTemplateRef;
  workflowRef: LandingPageWorkflowRef;
  reason: string;
  stages: LandingPageExecutionStage[];
  allowedReviewRollbackStages: LandingPageReviewRollbackStage[];
  digest: string;
}

export interface LandingPageOrchestrationTaskContext {
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  themeIntentDigest: string;
  themeIntent: ThemeIntent;
  requestedPageTypeRef: LandingPageTypeRef | null;
  requestedSelectionStrategyRef: ProductSelectionStrategyRef | null;
  pageTypes: LandingPageTypeConfig[];
  selectionStrategies: ProductSelectionStrategyConfig[];
  templates: PageMerchandisingTemplateConfig[];
}

export type LandingPageOrchestrationRun =
  | {
      schemaVersion: "landing-page-orchestration-run/v1";
      status: "needs-execution-plan-proposal";
      context: LandingPageOrchestrationTaskContext;
    }
  | {
      schemaVersion: "landing-page-orchestration-run/v1";
      status: "ready";
      plan: LandingPageExecutionPlan;
      proposalReview: LandingPageExecutionPlanProposalReview;
    }
  | {
      schemaVersion: "landing-page-orchestration-run/v1";
      status: "blocked";
      issues: string[];
      proposalReview?: LandingPageExecutionPlanProposalReview;
    };
