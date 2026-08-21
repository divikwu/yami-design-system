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
import type {
  TopicAudienceContext,
  TopicBackgroundEvidenceBundle,
} from "../background-evidence/contracts.js";

export type TopicPageContentEvidenceRef =
  | `theme-intent:${string}`
  | `selected-category:${string}`
  | `product:${string}`
  | `scene:${string}`
  | `background:${string}`;

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

export interface TopicPageContentAttemptArtifact {
  schemaVersion: "topic-page-content-attempt/v1";
  agentId: string;
  topicPagePlanDigest: string;
  themeIntentDigest: string;
  productSelectionDigest: string;
  backgroundEvidenceDigest?: string;
  copyBriefDigest?: string;
  language: ContentLanguage;
  proposal?: unknown;
  proposalReview?: TopicPageContentProposalReview;
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
  audienceContext?: TopicAudienceContext;
  backgroundEvidenceDigest?: string;
  copyBriefDigest?: string;
  tasks: TopicPageContentTaskProposal[];
  digest: string;
}

export interface TopicPageContentRevisionIssue {
  code: string;
  severity: "warning" | "error";
  moduleId?: TopicModuleId;
  message: string;
}

export interface TopicPageContentRevisionContext {
  schemaVersion: "topic-page-content-revision/v1";
  attempt: 2;
  previousContentSpec: TopicPageContentSpec;
  review: {
    source: "deterministic-review" | "review-agent";
    contentSpecDigest: string;
    copyBriefDigest: string;
    backgroundEvidenceDigest: string | null;
    reviewerAgentId?: string;
    decisionDigest?: string;
    issues: TopicPageContentRevisionIssue[];
  };
}

export type TopicPageContentCopySlot =
  | "title"
  | "description"
  | "tags"
  | "items[].label"
  | "scenes[].label"
  | "scenes[].title"
  | "scenes[].description";

export interface TopicPageContentCopyRule {
  slot: TopicPageContentCopySlot;
  maxCharacters: number;
}

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
  copyRules: TopicPageContentCopyRule[];
  assignments: TopicPagePlanAssignmentV2[];
  scenes: TopicPagePlanSceneV2[];
  products: TopicPageContentTaskProduct[];
}

export interface TopicPageContentClaimPolicy {
  evidenceRequirement: "explicit-in-cited-artifact";
  evidenceRefsAuthorize: "scope-only";
  planningGoalsAuthorizeClaims: false;
  restrictedClaimTypes: readonly [
    "ingredient",
    "benefit",
    "efficacy",
    "popularity",
    "inventory",
    "discount",
    "rating",
    "customer-outcome",
  ];
}

export interface TopicPageCopyBriefModuleObjective {
  taskId: string;
  moduleId: TopicModuleId;
  objective: string;
  shoppingGoal: string;
}

export interface TopicPageCopyBrief {
  schemaVersion: "topic-page-copy-brief/v2";
  audienceContext: TopicAudienceContext;
  pageProposition: string;
  newcomerQuestions: string[];
  moduleObjectives: TopicPageCopyBriefModuleObjective[];
  backgroundEvidenceDigest: string | null;
  backgroundEvidenceStatus: TopicBackgroundEvidenceBundle["status"] | "not-provided";
  evidenceRules: readonly [
    "background-context-does-not-prove-product-performance",
    "catalog-evidence-does-not-prove-popularity",
    "every-claim-requires-an-explicit-reference",
  ];
  digest: string;
}

export interface TopicPageContentContext {
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  languagePolicy: {
    requestedLanguage: ContentLanguage;
    immutableProperNouns: string[];
    generatedCopyRequirement: "requested-language-only-except-listed-proper-nouns";
  };
  copyPolicyRef:
    | "topic-page-copy/legacy@1"
    | "topic-page-copy/evidence-bound@1"
    | "topic-page-copy/novice-guided@2";
  claimPolicy: TopicPageContentClaimPolicy;
  audienceContext: TopicAudienceContext;
  backgroundEvidence: TopicBackgroundEvidenceBundle | null;
  eligibleBackgroundEvidenceClaimIds: string[];
  copyBrief: TopicPageCopyBrief;
  strategyRef: ProductSelectionStrategyRef;
  templateRef: string;
  topicPagePlanDigest: string;
  themeIntentDigest: string;
  productSelectionDigest: string;
  themeIntent: ThemeIntent;
  selectedCategories: SelectedCategoryRole[];
  eligibleThemeIntentEvidenceIds: string[];
  evidenceNamespaces: readonly string[];
  tasks: TopicPageContentTaskContext[];
  revision?: TopicPageContentRevisionContext;
}

export type TopicPageContentFaultKind = "upstream-invalid" | "proposal-invalid";

export type TopicPageContentRollbackStage =
  | "background-evidence"
  | "module-merchandising"
  | "content-writing";

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
      faultKind: TopicPageContentFaultKind;
      rollbackStage: TopicPageContentRollbackStage;
      issues: string[];
      proposalReview: TopicPageContentProposalReview;
    };
