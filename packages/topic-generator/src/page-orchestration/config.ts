import type {
  LandingPageExecutionStage,
  LandingPageReviewRollbackStage,
  LandingPageTypeConfig,
  LandingPageTypeRef,
} from "./contracts.js";

const PAGE_TYPES: readonly LandingPageTypeConfig[] = [
  {
    schemaVersion: "landing-page-type/v1",
    ref: "landing-page/brand@2",
    id: "landing-page/brand",
    version: 2,
    label: { en: "Brand landing page", zh: "品牌落地页" },
    supportedThemeTypes: ["brand"],
    requiresExplicitRequest: false,
    routes: [
      {
        selectionStrategyRef: "relevance/intent-themes@5",
        templateRef: "topic-landing/brand-relevance@2",
      },
      {
        selectionStrategyRef: "relevance/intent-themes@4",
        templateRef: "topic-landing/brand-relevance@2",
      },
      {
        selectionStrategyRef: "relevance/intent-themes@3",
        templateRef: "topic-landing/brand-relevance@1",
      },
      {
        selectionStrategyRef: "relevance/intent-themes@2",
        templateRef: "topic-landing/brand-relevance@1",
      },
      {
        selectionStrategyRef: "category-role/landing-page-agent@1",
        templateRef: "topic-landing/brand@2",
      },
    ],
  },
  {
    schemaVersion: "landing-page-type/v1",
    ref: "landing-page/topic@2",
    id: "landing-page/topic",
    version: 2,
    label: { en: "Topic landing page", zh: "主题落地页" },
    supportedThemeTypes: ["product", "uncertain"],
    requiresExplicitRequest: false,
    routes: [
      {
        selectionStrategyRef: "relevance/intent-themes@5",
        templateRef: "topic-landing/topic-relevance@2",
      },
      {
        selectionStrategyRef: "relevance/intent-themes@4",
        templateRef: "topic-landing/topic-relevance@2",
      },
      {
        selectionStrategyRef: "relevance/intent-themes@3",
        templateRef: "topic-landing/topic-relevance@1",
      },
      {
        selectionStrategyRef: "relevance/intent-themes@2",
        templateRef: "topic-landing/topic-relevance@1",
      },
      {
        selectionStrategyRef: "category-role/landing-page-agent@1",
        templateRef: "topic-landing/topic@2",
      },
    ],
  },
  {
    schemaVersion: "landing-page-type/v1",
    ref: "landing-page/campaign@2",
    id: "landing-page/campaign",
    version: 2,
    label: { en: "Campaign landing page", zh: "活动落地页" },
    supportedThemeTypes: ["activity"],
    requiresExplicitRequest: false,
    routes: [
      {
        selectionStrategyRef: "relevance/intent-themes@5",
        templateRef: "topic-landing/campaign-relevance@2",
      },
      {
        selectionStrategyRef: "relevance/intent-themes@4",
        templateRef: "topic-landing/campaign-relevance@2",
      },
      {
        selectionStrategyRef: "relevance/intent-themes@3",
        templateRef: "topic-landing/campaign-relevance@1",
      },
      {
        selectionStrategyRef: "relevance/intent-themes@2",
        templateRef: "topic-landing/campaign-relevance@1",
      },
      {
        selectionStrategyRef: "category-role/landing-page-agent@1",
        templateRef: "topic-landing/campaign@2",
      },
    ],
  },
];

const LEGACY_PAGE_TYPES: readonly LandingPageTypeConfig[] = PAGE_TYPES.map((config) => ({
  ...config,
  ref: `${config.id}@1` as LandingPageTypeRef,
  version: 1,
  routes: config.routes.flatMap((route) => {
    if (
      route.selectionStrategyRef === "relevance/intent-themes@5" ||
      route.selectionStrategyRef === "relevance/intent-themes@2" ||
      route.selectionStrategyRef === "relevance/intent-themes@3"
    ) return [];
    return [route.selectionStrategyRef === "relevance/intent-themes@4"
      ? {
          selectionStrategyRef: "relevance/default@1" as const,
          templateRef: "topic-landing/relevance@1" as const,
        }
      : ({
        ...route,
        templateRef: route.templateRef === "topic-landing/brand@2"
        ? "topic-landing/brand@1"
        : route.templateRef === "topic-landing/topic@2"
          ? "topic-landing/topic@1"
          : route.templateRef === "topic-landing/campaign@2"
            ? "topic-landing/campaign@1"
            : route.templateRef,
      })];
  }),
}));

export const LANDING_PAGE_WORKFLOW_REF = "landing-page/default@1" as const;

export const LANDING_PAGE_EXECUTION_STAGES: readonly LandingPageExecutionStage[] = [
  { id: "background-evidence", actor: "research-agent", maxAttempts: 1 },
  { id: "product-selection", actor: "strategy-agent", maxAttempts: 1 },
  { id: "module-merchandising", actor: "strategy-agent", maxAttempts: 2 },
  { id: "content-writing", actor: "content-agent", maxAttempts: 2 },
  { id: "content-review", actor: "review-agent", maxAttempts: 1 },
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
  const config = [...LEGACY_PAGE_TYPES, ...PAGE_TYPES].find((candidate) => candidate.ref === ref);
  if (!config) throw new Error(`Unknown landing page type: ${ref}`);
  return config;
}
