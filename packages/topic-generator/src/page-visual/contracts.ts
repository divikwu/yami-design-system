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
  TopicPageTemplateRef,
} from "../page-merchandising/contracts.js";
import type { TopicPageContentTaskProposal } from "../page-content/contracts.js";

export type TopicPageVisualAssetKind =
  | "hero-image"
  | "shortcut-image"
  | "scene-image"
  | "brand-banner";

export type TopicPageVisualAspectRatio = "16:9" | "1:1" | "111:40";
export type TopicPageVisualAltTextMode = "required" | "decorative";
export type TopicPageVisualMimeType = "image/webp" | "image/png" | "image/jpeg";
export type TopicPageVisualProductionMode = "generated-images" | "source-product-images";

export interface TopicPageVisualCompositionGuidance {
  preferredSubjectArea: "upper-three-quarters";
  lowerAreaUsage: "low-contrast-decoration-preferred";
}

export interface TopicPageVisualDirection {
  prompt: string;
  negativePrompt?: string;
  evidenceRefs: string[];
  referenceProductIds: string[];
}

export interface TopicPageVisualAltText {
  language: ContentLanguage;
  text: string;
  evidenceRefs: string[];
}

export interface TopicPageVisualArtifact {
  ref: string;
  mimeType: TopicPageVisualMimeType;
  width: number;
  height: number;
  digest: string;
  focalPoint: { x: number; y: number };
  backgroundColor?: string;
}

export interface TopicPageVisualAssetProposal {
  taskId: string;
  moduleId: TopicModuleId;
  component: TopicPageComponent;
  kind: TopicPageVisualAssetKind;
  direction: TopicPageVisualDirection;
  altText: TopicPageVisualAltText | null;
  artifact: TopicPageVisualArtifact;
}

export interface TopicPageVisualProposal {
  schemaVersion: "topic-page-visual-proposal/v1";
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  topicPagePlanDigest: string;
  topicPageContentSpecDigest: string;
  themeIntentDigest: string;
  productSelectionDigest: string;
  productionMode?: TopicPageVisualProductionMode;
  assets: TopicPageVisualAssetProposal[];
}

export interface TopicPageVisualAssetBody {
  taskId: string;
  ref: string;
  mimeType: TopicPageVisualMimeType;
  dataBase64: string;
}

export interface TopicPageVisualAgentOutput {
  schemaVersion: "topic-page-visual-agent-output/v1";
  proposal: unknown;
  assets: TopicPageVisualAssetBody[];
}

export interface TopicPageVisualProposalReview {
  status: "accepted" | "rejected";
  issues: string[];
  proposal?: TopicPageVisualProposal;
}

export interface TopicPageAssetManifest {
  schemaVersion: "topic-page-asset-manifest/v1";
  status: "asset-manifest-ready";
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  strategyRef: ProductSelectionStrategyRef;
  templateRef: TopicPageTemplateRef;
  topicPagePlanDigest: string;
  topicPageContentSpecDigest: string;
  themeIntentDigest: string;
  productSelectionDigest: string;
  productionMode?: TopicPageVisualProductionMode;
  assets: TopicPageVisualAssetProposal[];
  digest: string;
}

export type TopicPageVisualTaskProduct = Pick<
  ProductSelectionProduct,
  | "id"
  | "title"
  | "brand"
  | "imageUrl"
  | "categoryL3Id"
  | "categoryL3Name"
  | "pool"
  | "role"
>;

export interface TopicPageVisualTaskContext {
  taskId: string;
  moduleId: TopicModuleId;
  component: TopicPageComponent;
  kind: TopicPageVisualAssetKind;
  targetAspectRatio: TopicPageVisualAspectRatio;
  minimumWidth: number;
  minimumHeight: number;
  altTextMode: TopicPageVisualAltTextMode;
  requiresBackgroundColor: boolean;
  compositionGuidance?: TopicPageVisualCompositionGuidance;
  slotId?: string;
  sceneId?: string;
  brand?: string;
  assignments: TopicPagePlanAssignmentV2[];
  scene?: TopicPagePlanSceneV2;
  products: TopicPageVisualTaskProduct[];
  contentTask: TopicPageContentTaskProposal;
}

export interface TopicPageVisualContext {
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  strategyRef: ProductSelectionStrategyRef;
  templateRef: TopicPageTemplateRef;
  topicPagePlanDigest: string;
  topicPageContentSpecDigest: string;
  themeIntentDigest: string;
  productSelectionDigest: string;
  productionMode: TopicPageVisualProductionMode;
  themeIntent: ThemeIntent;
  selectedCategories: SelectedCategoryRole[];
  evidenceNamespaces: readonly [
    "theme-intent:<evidence-id>",
    "selected-category:<category-id>",
    "product:<task-product-id>",
    "scene:<task-scene-id>",
    "content-task:<module-content-task-id>",
  ];
  tasks: TopicPageVisualTaskContext[];
}

export type TopicPageVisualRun =
  | {
      schemaVersion: "topic-page-visual-run/v1";
      status: "needs-visual-proposal";
      context: TopicPageVisualContext;
    }
  | {
      schemaVersion: "topic-page-visual-run/v1";
      status: "ready";
      manifest: TopicPageAssetManifest;
      proposalReview: TopicPageVisualProposalReview;
    }
  | {
      schemaVersion: "topic-page-visual-run/v1";
      status: "blocked";
      issues: string[];
      proposalReview: TopicPageVisualProposalReview;
    };
