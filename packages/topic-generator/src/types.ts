/** Public contracts shared by the TOPIC GENERATOR product, CLI, and UI hosts. */
export const YAMI_SITE = "us" as const;
export const PRODUCT_SELECTION_STRATEGIES = ["relevance", "category-role"] as const;
export const CONTENT_LANGUAGES = ["en", "zh"] as const;

export type YamiSite = typeof YAMI_SITE;
export type ProductSelectionStrategy = (typeof PRODUCT_SELECTION_STRATEGIES)[number];
export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number];

export type PlanStatus = "ready" | "degraded" | "blocked";
export type ProductPool = "primary" | "related";
export type ProductRole = "core" | "pairing" | "accessory";
export type ThemeType = "brand" | "product" | "activity" | "uncertain";
export type ThemeEntityType = "brand" | "category" | "attribute" | "scenario" | "unknown";
export type ShoppingIntent = "browse-brand" | "find-product" | "assemble-scenario" | "clarify";
export type ShopperAction =
  | "browse"
  | "find"
  | "compare"
  | "filter"
  | "replenish"
  | "bundle"
  | "gift"
  | "clarify";
export type IntentEvidenceLevel = "high" | "medium" | "low";
export type IntentDecisionStatus = "resolved" | "ambiguous" | "needs-review";
export type IntentConstraintStatus = "verified" | "unverified" | "rejected";
export type IntentConstraintKind = "core-entity" | "modifier" | "scenario" | "exclusion";

export interface ThemeIntentEvidenceRef {
  id: string;
  source:
    | "catalog-brand"
    | "catalog-category"
    | "catalog-attribute"
    | "catalog-products"
    | "scenario-vocabulary"
    | "search-fallback";
  label: string;
  count?: number;
}

export interface ThemeIntentConstraint {
  id: string;
  kind: IntentConstraintKind;
  value: string;
  status: IntentConstraintStatus;
  evidenceIds: string[];
}

export interface ThemeIntentCandidate {
  id: string;
  themeType: ThemeType;
  entityType: ThemeEntityType;
  canonicalEntity: { id: string; label: string } | null;
  shoppingIntent: ShoppingIntent;
  shopperAction: ShopperAction;
  score: number;
  evidenceLevel: IntentEvidenceLevel;
  reason: string;
  supportingEvidenceIds: string[];
  competingCandidateIds: string[];
}

export interface ThemeIntentDecision {
  status: IntentDecisionStatus;
  selectedCandidateId: string;
  evidenceLevel: IntentEvidenceLevel;
  selectedCandidateMargin: number | null;
  requiresAgentReview: boolean;
}

export interface ThemeIntentCategory {
  id: string;
  label: string;
  path: string[];
  evidenceCount: number;
}

export interface ThemeIntent {
  schemaVersion: "theme-intent/v2";
  source: "catalog-evidence" | "search-fallback";
  themeType: ThemeType;
  catalogDomain: string;
  attributeSchemaVersion: "catalog-v1";
  entityType: ThemeEntityType;
  canonicalEntity: { id: string; label: string } | null;
  shoppingIntent: ShoppingIntent;
  shopperAction: ShopperAction;
  shoppingGoal: string;
  needs: string[];
  conditions: string[];
  mustInclude: string[];
  mustExclude: string[];
  searchTerms: string[];
  categories: ThemeIntentCategory[];
  constraints: ThemeIntentConstraint[];
  evidenceRefs: ThemeIntentEvidenceRef[];
  candidates: ThemeIntentCandidate[];
  decision: ThemeIntentDecision;
  reason: string;
  /** Compatibility rule score only. Use decision status and evidence level for review. */
  confidence: number;
}

export interface YamiProduct {
  id: string;
  title: string;
  brand: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  sourceRank: number;
  brandId?: number;
  categoryL1Id?: number;
  categoryL2Id?: number;
  categoryL3Id?: number;
  categoryL1Name?: string;
  categoryL2Name?: string;
  categoryL3Name?: string;
  soldCount?: number;
  rating?: number;
}

export interface CatalogBrandEvidence {
  id: string;
  label: string;
  aliases: string[];
  resultCount: number;
}

export interface CatalogCategoryEvidence {
  id: string;
  label: string;
  aliases: string[];
  path: string[];
  resultCount: number;
  productCount: number;
}

export interface CatalogAttributeEvidence {
  id: string;
  label: string;
  aliases: string[];
}

export interface CatalogEvidence {
  brands: CatalogBrandEvidence[];
  categories: CatalogCategoryEvidence[];
  attributes: CatalogAttributeEvidence[];
}

export interface CatalogSnapshotQualityIssueCounts {
  duplicateId: number;
  missingId: number;
  missingTitle: number;
  missingBrand: number;
  missingImage: number;
  missingPrice: number;
  missingProductUrl: number;
  unavailable: number;
  outOfStock: number;
  notPurchasable: number;
  keywordMismatch: number;
}

export interface CatalogSnapshotQualityReport {
  observedProductCount: number;
  acceptedProductCount: number;
  rejectedProductCount: number;
  truncatedProductCount: number;
  issueCounts: CatalogSnapshotQualityIssueCounts;
}

export interface YamiSearchSnapshot {
  keyword: string;
  site: YamiSite;
  sourceUrl: string;
  fetchedAt: string;
  products: YamiProduct[];
  provider?: "yami-catalog-search" | "yami-web-search";
  retrievalTerms?: string[];
  evidence?: CatalogEvidence;
  quality?: CatalogSnapshotQualityReport;
  intent?: ThemeIntent;
}

export interface TopicProduct extends YamiProduct {
  pool: ProductPool;
  role: ProductRole;
  productType: string;
  productTypeLabel: string;
  selectionReason: string;
}

export interface TopicGroup {
  id: string;
  label: string;
  role: ProductRole;
  productIds: string[];
}

export interface TopicCategorySelection {
  id: string;
  label: string;
  role: ProductRole;
  source: "catalog-category";
  productIds: string[];
  reason: string;
}

export type TopicModuleId =
  | "hero"
  | "shortcuts"
  | "start-here"
  | "popular-picks"
  | "brand-spotlight"
  | "reviews"
  | "explore-more";

export interface TopicModulePlan {
  id: TopicModuleId;
  label: string;
  heading: string;
  description: string;
  required: boolean;
  visible: boolean;
  productIds: string[];
  reason: string;
}

export interface WorkflowStep {
  stage: "03" | "04" | "05" | "06";
  label: string;
  output: string;
}

export type TopicGenerationMode = "selection" | "page";

export type CategoryRoleRuntimeStageId =
  | "taxonomy"
  | "category-proposal"
  | "candidate-retrieval"
  | "scene-proposal"
  | "selection";

export interface CategoryRoleRuntimeEvidence {
  mode: "automatic" | "resumable";
  taxonomy:
    | {
        status: "ready";
        sourceRef: string;
        digest: string;
        fetchedAt: string;
        categoryCount: number;
      }
    | { status: "missing" };
  agent:
    | { status: "ready"; id: string }
    | { status: "missing" };
  stages: Array<{
    id: CategoryRoleRuntimeStageId;
    status: "completed" | "pending" | "blocked";
  }>;
  issues: string[];
  candidateAttempts?: { succeeded: number; total: number };
  candidateQuality?: {
    status: "ok" | "warning" | "error";
    issueCount: number;
    emptyCategories: number;
    lowCoverageCategories: number;
    warnings: string[];
  };
  categoryRoleDistribution?: Record<ProductRole, number>;
  sceneCount?: number;
}

export interface TopicPagePlan {
  generationMode: TopicGenerationMode;
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  selectionStrategy: {
    id: ProductSelectionStrategy;
    label: string;
    description: string;
  };
  status: PlanStatus;
  statusReason: string;
  intent: ThemeIntent;
  generatedAt: string;
  source: {
    provider: "yami-catalog-search" | "yami-web-search";
    searchUrl: string;
    note: string;
  };
  content: {
    eyebrow: string;
    headline: string;
    description: string;
    tags: string[];
    copyMode:
      | "deterministic-template"
      | "background-assisted-template"
      | "not-generated";
    backgroundSource?: {
      provider: "wikipedia";
      language: ContentLanguage;
      title: string;
      url: string;
      retrievedAt: string;
    };
  };
  assetStrategy: {
    mode: "source-product-images" | "not-generated";
    note: string;
  };
  pools: {
    primaryIds: string[];
    relatedIds: string[];
  };
  products: TopicProduct[];
  selectedCategories: TopicCategorySelection[];
  groups: TopicGroup[];
  modules: TopicModulePlan[];
  workflow: WorkflowStep[];
  qualityNotes: string[];
}

export interface TopicPlanVariants {
  relevance: TopicPagePlan;
  "category-role"?: TopicPagePlan;
}
export type TopicPlanMatrix = Record<ContentLanguage, TopicPlanVariants>;
