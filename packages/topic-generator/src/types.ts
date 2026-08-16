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

export interface ThemeIntentCategory {
  id: string;
  label: string;
  path: string[];
  evidenceCount: number;
}

export interface ThemeIntent {
  source: "catalog-evidence" | "search-fallback";
  themeType: ThemeType;
  catalogDomain: string;
  attributeSchemaVersion: "catalog-v1";
  entityType: ThemeEntityType;
  canonicalEntity: { id: string; label: string } | null;
  shoppingIntent: ShoppingIntent;
  shoppingGoal: string;
  needs: string[];
  mustInclude: string[];
  mustExclude: string[];
  searchTerms: string[];
  categories: ThemeIntentCategory[];
  reason: string;
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

export interface YamiSearchSnapshot {
  keyword: string;
  site: YamiSite;
  sourceUrl: string;
  fetchedAt: string;
  products: YamiProduct[];
  provider?: "yami-catalog-search" | "yami-web-search";
  evidence?: CatalogEvidence;
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
  source: "catalog-category" | "inferred-product-type";
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
