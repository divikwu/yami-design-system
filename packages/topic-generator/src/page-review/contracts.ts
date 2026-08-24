import type { TopicModuleId } from "../types.js";
import type {
  LandingPageExecutionPlan,
  LandingPageReviewRollbackStage,
} from "../page-orchestration/contracts.js";
import type {
  TopicPageGenerationSpec,
  TopicPageQaReport,
  TopicPageReviewPackage,
} from "../page-generation/contracts.js";

export type TopicPageExperienceReviewRecommendation =
  | "recommend-approval"
  | "request-revision";

export type TopicPageExperienceReviewSeverity = "warning" | "blocking";
export type TopicPageExperienceReviewScope =
  | "merchandising"
  | "content"
  | "visual"
  | "experience";

export interface TopicPageExperienceReviewIssue {
  id: string;
  severity: TopicPageExperienceReviewSeverity;
  scope: TopicPageExperienceReviewScope;
  moduleId?: TopicModuleId;
  message: string;
  evidenceRefs: string[];
  rollbackStage?: LandingPageReviewRollbackStage;
}

export interface TopicPageExperienceReviewProposal {
  schemaVersion: "topic-page-experience-review-proposal/v1";
  executionPlanDigest: string;
  generationSpecDigest: string;
  qaReportDigest: string;
  recommendation: TopicPageExperienceReviewRecommendation;
  summary: string;
  issues: TopicPageExperienceReviewIssue[];
}

export interface TopicPageExperienceReviewProposalReview {
  status: "accepted" | "rejected";
  issues: string[];
  proposal?: TopicPageExperienceReviewProposal;
}

export interface TopicPageExperienceReviewDecision {
  schemaVersion: "topic-page-experience-review-decision/v1";
  status: "review-recommended" | "revision-requested";
  executionPlanDigest: string;
  generationSpecDigest: string;
  qaReportDigest: string;
  recommendation: TopicPageExperienceReviewRecommendation;
  summary: string;
  issues: TopicPageExperienceReviewIssue[];
  digest: string;
}

export interface TopicPageExperienceReviewContext {
  qualityPolicy: "advisory-never-block-generation";
  executionPlanDigest: string;
  executionPlan: LandingPageExecutionPlan;
  generationSpec: TopicPageGenerationSpec;
  qaReport: TopicPageQaReport & { status: "passed" };
  previewRefs: TopicPageReviewPackage["previewRefs"];
  allowedEvidenceRefs: string[];
  allowedRollbackStages: LandingPageReviewRollbackStage[];
  visualPolicy: {
    priority: "scene-and-module-theme";
    productRole: "reference-only";
    blockingConditions: readonly [
      "isolated-product-packshot-used-as-semantic-scene",
      "product-grid-or-montage-used-as-semantic-scene",
      "asset-does-not-match-module-theme-or-copy",
      "visible-product-packaging-is-generated-or-altered",
    ];
  };
}

export type TopicPageExperienceReviewRun =
  | {
      schemaVersion: "topic-page-experience-review-run/v1";
      status: "needs-review-proposal";
      context: TopicPageExperienceReviewContext;
    }
  | {
      schemaVersion: "topic-page-experience-review-run/v1";
      status: "ready";
      decision: TopicPageExperienceReviewDecision;
      proposalReview: TopicPageExperienceReviewProposalReview;
    }
  | {
      schemaVersion: "topic-page-experience-review-run/v1";
      status: "blocked";
      issues: string[];
      proposalReview?: TopicPageExperienceReviewProposalReview;
    };
