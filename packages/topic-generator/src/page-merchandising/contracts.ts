import type {
  ProductPool,
  ProductRole,
  ThemeIntent,
  TopicModuleId,
  YamiSite,
} from "../types.js";
import type { ProductSelectionStrategyRef } from "../product-selection/config.js";
import type {
  ProductSelectionModuleResult,
  ProductSelectionProduct,
  ProductSelectionScene,
  SelectedCategoryRole,
} from "../product-selection/contracts.js";

export type TopicPageTemplateId =
  | "topic-landing/brand"
  | "topic-landing/topic"
  | "topic-landing/campaign"
  | "topic-landing/brand-relevance"
  | "topic-landing/topic-relevance"
  | "topic-landing/campaign-relevance"
  | "topic-landing/relevance";

export type TopicPageTemplateRef = `${TopicPageTemplateId}@${number}`;

export type TopicPageComponent =
  | "ThemeHero"
  | "ShortcutRail"
  | "ThemeProductList"
  | "ProductList"
  | "BrandProductRail"
  | "ReviewList";

export interface PageMerchandisingSceneProposal {
  id: string;
  sourceSceneId: string;
  shoppingGoal: string;
  reason: string;
}

export interface PageMerchandisingAssignmentProposal {
  productId: string;
  sceneId?: string;
  reuseReason?: string;
}

export interface PageMerchandisingModuleProposal {
  id: TopicModuleId;
  visible: boolean;
  shoppingGoal: string;
  reason: string;
  scenes: PageMerchandisingSceneProposal[];
  assignments: PageMerchandisingAssignmentProposal[];
}

export interface ModuleMerchandisingProposal {
  schemaVersion: "module-merchandising-proposal/v1";
  keyword: string;
  site: YamiSite;
  strategyRef: ProductSelectionStrategyRef;
  templateRef: TopicPageTemplateRef;
  themeIntentDigest: string;
  productSelectionDigest: string;
  moduleOrder: TopicModuleId[];
  modules: PageMerchandisingModuleProposal[];
}

export interface ModuleMerchandisingProposalReview {
  status: "accepted" | "rejected";
  issues: string[];
  proposal?: ModuleMerchandisingProposal;
}

export interface TopicPagePlanAssignmentV2 {
  slotId: string;
  productId: string;
  pool: ProductPool;
  role: ProductRole;
  sceneId?: string;
  reuseReason?: string;
}

export interface TopicPagePlanSceneV2 {
  id: string;
  sourceSceneId: string;
  shoppingGoal: string;
  reason: string;
  productIds: string[];
}

export interface TopicPagePlanModuleV2 {
  id: TopicModuleId;
  component: TopicPageComponent;
  visible: boolean;
  shoppingGoal: string;
  reason: string;
  assignments: TopicPagePlanAssignmentV2[];
  scenes: TopicPagePlanSceneV2[];
  contentTaskId: string | null;
  assetTaskIds: string[];
}

export interface TopicPagePlanV2 {
  schemaVersion: "topic-page-plan/v2";
  status: "plan-ready";
  keyword: string;
  site: YamiSite;
  strategyRef: ProductSelectionStrategyRef;
  templateRef: TopicPageTemplateRef;
  themeIntentDigest: string;
  productSelectionDigest: string;
  moduleOrder: TopicModuleId[];
  modules: TopicPagePlanModuleV2[];
  productReusePolicy: {
    crossModule: "requires-reason" | "reference-modules-only";
    withinScene: "forbidden";
    referenceModules?: ("hero" | "shortcuts")[];
  };
  digest: string;
}

export interface PageMerchandisingModuleRuleContext {
  id: TopicModuleId;
  component: TopicPageComponent;
  required: boolean;
  minimumProducts: number;
  maximumProducts: number;
  allowedPools: ProductPool[];
  allowedRoles: ProductRole[];
  sceneRange?: readonly [number, number];
}

export type PageMerchandisingCandidateProduct = Pick<
  ProductSelectionProduct,
  | "id"
  | "title"
  | "brand"
  | "imageUrl"
  | "sourceRank"
  | "categoryL3Id"
  | "categoryL3Name"
  | "soldCount"
  | "pool"
  | "role"
>;

export interface PageMerchandisingTaskContext {
  keyword: string;
  site: YamiSite;
  strategyRef: ProductSelectionStrategyRef;
  templateRef: TopicPageTemplateRef;
  themeIntentDigest: string;
  productSelectionDigest: string;
  assignmentAuthority: "proposal" | "product-selection";
  moduleOrder: TopicModuleId[];
  moduleRules: PageMerchandisingModuleRuleContext[];
  themeIntent: ThemeIntent;
  selectedCategories: SelectedCategoryRole[];
  selectionModules: ProductSelectionModuleResult[];
  sourceScenes: ProductSelectionScene[];
  products: PageMerchandisingCandidateProduct[];
}

export type PageMerchandisingRun =
  | {
      schemaVersion: "page-merchandising-run/v1";
      status: "needs-module-proposal";
      context: PageMerchandisingTaskContext;
    }
  | {
      schemaVersion: "page-merchandising-run/v1";
      status: "ready";
      plan: TopicPagePlanV2;
      proposalReview: ModuleMerchandisingProposalReview;
    }
  | {
      schemaVersion: "page-merchandising-run/v1";
      status: "blocked";
      issues: string[];
      proposalReview: ModuleMerchandisingProposalReview;
    };
