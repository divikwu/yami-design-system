import type {
  LandingPageExecutionStage,
  LandingPageReviewRollbackStage,
  LandingPageTypeConfig,
  LandingPageTypeRef,
} from "./contracts.js";

const PAGE_TYPES: readonly LandingPageTypeConfig[] = [
  {
    schemaVersion: "landing-page-type/v1",
    ref: "landing-page/brand@1",
    id: "landing-page/brand",
    version: 1,
    label: { en: "Brand landing page", zh: "品牌落地页" },
    supportedThemeTypes: ["brand"],
    requiresExplicitRequest: false,
    routes: [
      {
        selectionStrategyRef: "relevance/default@1",
        templateRef: "topic-landing/relevance@1",
      },
      {
        selectionStrategyRef: "category-role/landing-page-agent@1",
        templateRef: "topic-landing/brand@1",
      },
    ],
  },
  {
    schemaVersion: "landing-page-type/v1",
    ref: "landing-page/topic@1",
    id: "landing-page/topic",
    version: 1,
    label: { en: "Topic landing page", zh: "主题落地页" },
    supportedThemeTypes: ["product"],
    requiresExplicitRequest: false,
    routes: [
      {
        selectionStrategyRef: "relevance/default@1",
        templateRef: "topic-landing/relevance@1",
      },
      {
        selectionStrategyRef: "category-role/landing-page-agent@1",
        templateRef: "topic-landing/topic@1",
      },
    ],
  },
  {
    schemaVersion: "landing-page-type/v1",
    ref: "landing-page/campaign@1",
    id: "landing-page/campaign",
    version: 1,
    label: { en: "Campaign landing page", zh: "活动落地页" },
    supportedThemeTypes: ["activity"],
    requiresExplicitRequest: false,
    routes: [
      {
        selectionStrategyRef: "relevance/default@1",
        templateRef: "topic-landing/relevance@1",
      },
      {
        selectionStrategyRef: "category-role/landing-page-agent@1",
        templateRef: "topic-landing/campaign@1",
      },
    ],
  },
];

export const LANDING_PAGE_WORKFLOW_REF = "landing-page/default@1" as const;

export const LANDING_PAGE_EXECUTION_STAGES: readonly LandingPageExecutionStage[] = [
  { id: "product-selection", actor: "strategy-agent", maxAttempts: 1 },
  { id: "module-merchandising", actor: "strategy-agent", maxAttempts: 1 },
  { id: "content-writing", actor: "content-agent", maxAttempts: 1 },
  { id: "visual-generation", actor: "visual-agent", maxAttempts: 1 },
  { id: "asset-persistence", actor: "system", maxAttempts: 1 },
  { id: "page-generation", actor: "system", maxAttempts: 1 },
  { id: "automatic-qa", actor: "system", maxAttempts: 1 },
  { id: "experience-review", actor: "review-agent", maxAttempts: 1 },
];

export const LANDING_PAGE_REVIEW_ROLLBACK_STAGES: readonly LandingPageReviewRollbackStage[] = [
  "module-merchandising",
  "content-writing",
  "visual-generation",
];

export function listLandingPageTypeConfigs() {
  return PAGE_TYPES;
}

export function getLandingPageTypeConfig(ref: LandingPageTypeRef) {
  const config = PAGE_TYPES.find((candidate) => candidate.ref === ref);
  if (!config) throw new Error(`Unknown landing page type: ${ref}`);
  return config;
}
