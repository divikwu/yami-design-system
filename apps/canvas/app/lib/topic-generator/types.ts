export const YAMI_SITE = "us" as const;
export const PRODUCT_SELECTION_STRATEGIES = ["relevance", "category-role"] as const;
export const CONTENT_LANGUAGES = ["en", "zh"] as const;

export type YamiSite = typeof YAMI_SITE;
export type ProductSelectionStrategy = (typeof PRODUCT_SELECTION_STRATEGIES)[number];
export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number];

export type PlanStatus = "ready" | "degraded" | "blocked";
export type ProductPool = "primary" | "related";
export type ProductRole = "core" | "pairing" | "accessory";

export interface YamiProduct {
  id: string;
  title: string;
  brand: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  sourceRank: number;
}

export interface YamiSearchSnapshot {
  keyword: string;
  site: YamiSite;
  sourceUrl: string;
  fetchedAt: string;
  products: YamiProduct[];
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
  source: "inferred-product-type";
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

export interface TopicPagePlan {
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
  generatedAt: string;
  source: {
    provider: "yami-web-search";
    searchUrl: string;
    note: string;
  };
  content: {
    eyebrow: string;
    headline: string;
    description: string;
    tags: string[];
    copyMode: "deterministic-template";
  };
  assetStrategy: {
    mode: "source-product-images";
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

export type TopicPlanVariants = Record<ProductSelectionStrategy, TopicPagePlan>;
export type TopicPlanMatrix = Record<ContentLanguage, TopicPlanVariants>;
