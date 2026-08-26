import { listPageMerchandisingTemplateConfigs } from "../page-merchandising/config.js";
import {
  listProductSelectionStrategyConfigs,
  type ProductSelectionStrategyRef,
} from "../product-selection/config.js";
import type { ContentLanguage, ThemeIntent, YamiSite } from "../types.js";
import {
  LANDING_PAGE_EXECUTION_STAGES,
  LANDING_PAGE_REVIEW_ROLLBACK_STAGES,
  LANDING_PAGE_WORKFLOW_REF,
  listLandingPageTypeConfigs,
} from "./config.js";
import type {
  LandingPageExecutionPlan,
  LandingPageOrchestrationRun,
  LandingPageTypeRef,
} from "./contracts.js";
import {
  landingPageExecutionPlanDigest,
  orchestrationThemeIntentDigest,
  reviewLandingPageExecutionPlanProposal,
} from "./review.js";

export interface LandingPageOrchestrationRequest {
  intent: ThemeIntent;
  keyword?: string;
  site?: YamiSite;
  language: ContentLanguage;
  requestedPageTypeRef?: LandingPageTypeRef;
  requestedSelectionStrategyRef?: ProductSelectionStrategyRef;
  proposal?: unknown;
}

function requestKeyword(request: LandingPageOrchestrationRequest) {
  return request.keyword?.trim() || request.intent.canonicalEntity?.label.trim() ||
    request.intent.searchTerms[0]?.trim() || "";
}

function compilePlan(
  proposal: NonNullable<ReturnType<typeof reviewLandingPageExecutionPlanProposal>["proposal"]>,
): LandingPageExecutionPlan {
  const base = {
    schemaVersion: "landing-page-execution-plan/v1" as const,
    status: "execution-ready" as const,
    keyword: proposal.keyword,
    site: proposal.site,
    language: proposal.language,
    themeIntentDigest: proposal.themeIntentDigest,
    pageTypeRef: proposal.pageTypeRef,
    selectionStrategyRef: proposal.selectionStrategyRef,
    templateRef: proposal.templateRef,
    workflowRef: LANDING_PAGE_WORKFLOW_REF,
    reason: proposal.reason,
    stages: LANDING_PAGE_EXECUTION_STAGES.map((stage) => ({ ...stage })),
    allowedReviewRollbackStages: [...LANDING_PAGE_REVIEW_ROLLBACK_STAGES],
  };
  return { ...base, digest: landingPageExecutionPlanDigest(base) };
}

export function advanceLandingPageOrchestrationRun(
  request: LandingPageOrchestrationRequest,
): LandingPageOrchestrationRun {
  const keyword = requestKeyword(request);
  if (!keyword) {
    return {
      schemaVersion: "landing-page-orchestration-run/v1",
      status: "blocked",
      issues: ["Landing page orchestration requires the original keyword."],
    };
  }
  const site = request.site ?? "us";
  if (request.proposal === undefined) {
    return {
      schemaVersion: "landing-page-orchestration-run/v1",
      status: "needs-execution-plan-proposal",
      context: {
        keyword,
        site,
        language: request.language,
        themeIntentDigest: orchestrationThemeIntentDigest(request.intent),
        themeIntent: structuredClone(request.intent),
        requestedPageTypeRef: request.requestedPageTypeRef ?? null,
        requestedSelectionStrategyRef: request.requestedSelectionStrategyRef ?? null,
        pageTypes: listLandingPageTypeConfigs().map((config) => structuredClone(config)),
        selectionStrategies: listProductSelectionStrategyConfigs()
          .map((config) => structuredClone(config)),
        templates: listPageMerchandisingTemplateConfigs()
          .map((config) => structuredClone(config)),
      },
    };
  }

  const proposalReview = reviewLandingPageExecutionPlanProposal({
    intent: request.intent,
    keyword,
    site,
    language: request.language,
    requestedPageTypeRef: request.requestedPageTypeRef,
    requestedSelectionStrategyRef: request.requestedSelectionStrategyRef,
    value: request.proposal,
  });
  if (proposalReview.status !== "accepted" || !proposalReview.proposal) {
    return {
      schemaVersion: "landing-page-orchestration-run/v1",
      status: "blocked",
      issues: proposalReview.issues,
      proposalReview,
    };
  }
  return {
    schemaVersion: "landing-page-orchestration-run/v1",
    status: "ready",
    plan: compilePlan(proposalReview.proposal),
    proposalReview,
  };
}
