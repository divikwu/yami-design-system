import type { ContentLanguage, ProductPool, ProductRole, TopicModuleId, YamiSite } from "../types.js";
import type { ProductSelectionStrategyRef } from "../product-selection/config.js";
import type { TopicPageContentCopy } from "../page-content/contracts.js";
import type {
  TopicPageComponent,
  TopicPagePlanSceneV2,
  TopicPageTemplateRef,
} from "../page-merchandising/contracts.js";
import type {
  TopicPageVisualAltText,
  TopicPageVisualAssetKind,
  TopicPageVisualMimeType,
} from "../page-visual/contracts.js";

export interface TopicPageAssetReader {
  get(ref: string): Promise<Uint8Array>;
}

export interface TopicPageAssetStore extends TopicPageAssetReader {
  put(ref: string, bytes: Uint8Array): Promise<void>;
  publicUrl(ref: string): string;
}

export interface TopicPageGeneratedProduct {
  id: string;
  title: string;
  brand: string;
  price: string;
  imageUrl: string;
  productUrl: string;
  sourceRank: number;
  pool: ProductPool;
  role: ProductRole;
}

export interface TopicPageGeneratedAsset {
  taskId: string;
  kind: TopicPageVisualAssetKind;
  ref: string;
  url: string;
  mimeType: TopicPageVisualMimeType;
  width: number;
  height: number;
  digest: string;
  focalPoint: { x: number; y: number };
  backgroundColor?: string;
  altText: TopicPageVisualAltText | null;
}

export interface TopicPageGeneratedProductGroup {
  id: string;
  label: string;
  productIds: string[];
}

export interface TopicPageGenerationModule {
  id: TopicModuleId;
  component: TopicPageComponent;
  shoppingGoal: string;
  reason: string;
  copy: TopicPageContentCopy;
  products: TopicPageGeneratedProduct[];
  groups?: TopicPageGeneratedProductGroup[];
  scenes: TopicPagePlanSceneV2[];
  assets: TopicPageGeneratedAsset[];
}

export interface TopicPageGenerationSpec {
  schemaVersion: "topic-page-generation-spec/v1";
  status: "generation-ready";
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  strategyRef: ProductSelectionStrategyRef;
  templateRef: TopicPageTemplateRef;
  bindings: {
    themeIntentDigest: string;
    productSelectionDigest: string;
    topicPagePlanDigest: string;
    topicPageContentSpecDigest: string;
    topicPageAssetManifestDigest: string;
  };
  moduleOrder: TopicModuleId[];
  modules: TopicPageGenerationModule[];
  digest: string;
}

export type TopicPageQaCheckId =
  | "sources"
  | "bindings"
  | "modules"
  | "content"
  | "assets"
  | "accessibility-structure";

export interface TopicPageQaCheck {
  id: TopicPageQaCheckId;
  status: "passed" | "failed";
  issueCount: number;
}

export interface TopicPageQaReport {
  schemaVersion: "topic-page-qa-report/v1";
  status: "passed" | "qa-blocked";
  generationSpecDigest: string;
  topicPageAssetManifestDigest: string;
  checks: TopicPageQaCheck[];
  issues: string[];
  digest: string;
}

export interface TopicPageReviewPackage {
  schemaVersion: "topic-page-review-package/v1";
  status: "review-ready";
  executionPlanDigest: string;
  generationSpecDigest: string;
  qaReportDigest: string;
  experienceReviewDigest: string;
  evidenceManifestDigest: string;
  previewRefs: {
    desktop: string;
    mobile: string;
  };
  digest: string;
}
