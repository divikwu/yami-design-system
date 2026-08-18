import type {
  ContentLanguage,
  ThemeIntent,
  TopicModuleId,
  YamiSite,
} from "../types.js";
import type { ProductSelectionStrategyRef } from "../product-selection/config.js";
import type {
  ProductSelectionProduct,
  SelectedCategoryRole,
} from "../product-selection/contracts.js";
import type {
  TopicPageComponent,
  TopicPagePlanAssignmentV2,
  TopicPagePlanSceneV2,
} from "../page-merchandising/contracts.js";

export type TopicPageContentEvidenceRef =
  | `theme-intent:${string}`
  | `selected-category:${string}`
  | `product:${string}`
  | `scene:${string}`;

export interface EvidencedPageCopy {
  text: string;
  evidenceRefs: string[];
}

export interface TopicPageContentItemCopy {
  slotId: string;
  label: EvidencedPageCopy;
}

export interface TopicPageContentSceneCopy {
  sceneId: string;
  label: EvidencedPageCopy;
  title: EvidencedPageCopy;
  description: EvidencedPageCopy;
}

export interface TopicPageContentCopy {
  title: EvidencedPageCopy;
  description?: EvidencedPageCopy;
  tags?: EvidencedPageCopy[];
  items?: TopicPageContentItemCopy[];
  scenes?: TopicPageContentSceneCopy[];
}

export interface TopicPageContentTaskProposal {
  taskId: string;
  moduleId: TopicModuleId;
  component: TopicPageComponent;
  copy: TopicPageContentCopy;
}

export interface TopicPageContentProposal {
  schemaVersion: "topic-page-content-proposal/v1";
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  topicPagePlanDigest: string;
  themeIntentDigest: string;
  productSelectionDigest: string;
  tasks: TopicPageContentTaskProposal[];
}

export interface TopicPageContentProposalReview {
  status: "accepted" | "rejected";
  issues: string[];
  proposal?: TopicPageContentProposal;
}

export interface TopicPageContentSpec {
  schemaVersion: "topic-page-content-spec/v1";
  status: "content-ready";
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  strategyRef: ProductSelectionStrategyRef;
  templateRef: string;
  topicPagePlanDigest: string;
  themeIntentDigest: string;
  productSelectionDigest: string;
  tasks: TopicPageContentTaskProposal[];
  digest: string;
}

export type TopicPageContentCopySlot =
  | "title"
  | "description"
  | "tags"
  | "items[].label"
  | "scenes[].label"
  | "scenes[].title"
  | "scenes[].description";

export type TopicPageContentTaskProduct = Pick<
  ProductSelectionProduct,
  | "id"
  | "title"
  | "brand"
  | "categoryL3Id"
  | "categoryL3Name"
  | "pool"
  | "role"
>;

export interface TopicPageContentTaskContext {
  taskId: string;
  moduleId: TopicModuleId;
  component: TopicPageComponent;
  shoppingGoal: string;
  reason: string;
  copySlots: TopicPageContentCopySlot[];
  assignments: TopicPagePlanAssignmentV2[];
  scenes: TopicPagePlanSceneV2[];
  products: TopicPageContentTaskProduct[];
}

export interface TopicPageContentContext {
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  strategyRef: ProductSelectionStrategyRef;
  templateRef: string;
  topicPagePlanDigest: string;
  themeIntentDigest: string;
  productSelectionDigest: string;
  themeIntent: ThemeIntent;
  selectedCategories: SelectedCategoryRole[];
  evidenceNamespaces: readonly [
    "theme-intent:<evidence-id>",
    "selected-category:<category-id>",
    "product:<assigned-product-id>",
    "scene:<module-scene-id>",
  ];
  tasks: TopicPageContentTaskContext[];
}

export type TopicPageContentRun =
  | {
      schemaVersion: "topic-page-content-run/v1";
      status: "needs-content-proposal";
      context: TopicPageContentContext;
    }
  | {
      schemaVersion: "topic-page-content-run/v1";
      status: "ready";
      spec: TopicPageContentSpec;
      proposalReview: TopicPageContentProposalReview;
    }
  | {
      schemaVersion: "topic-page-content-run/v1";
      status: "blocked";
      issues: string[];
      proposalReview: TopicPageContentProposalReview;
    };
