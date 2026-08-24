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

export interface TopicPageContentGroupCopy {
  groupId: string;
  label: EvidencedPageCopy;
}

export interface TopicPageContentCopy {
  title: EvidencedPageCopy;
  description?: EvidencedPageCopy;
  tags?: EvidencedPageCopy[];
  items?: TopicPageContentItemCopy[];
  scenes?: TopicPageContentSceneCopy[];
  groups?: TopicPageContentGroupCopy[];
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
  revision?: TopicPageContentRevisionContext;
  proposalRevision?: TopicPageContentProposalRevisionContext;
  candidateSet?: TopicPageContentCandidateSet;
  candidateSelection?: TopicPageContentCandidateSelectionDecision;
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

export interface TopicPageContentLocalizationReference {
  language: ContentLanguage;
  contentSpec: TopicPageContentSpec;
  alignmentPolicy: "same-shopper-meaning-locale-native";
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
  localizationReference?: TopicPageContentLocalizationReference;
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

export interface TopicPageContentProposalRevisionContext {
  schemaVersion: "topic-page-content-proposal-revision/v1";
  attempt: 2;
  previousProposal: unknown;
  issues: string[];
}

export type TopicPageContentCandidateModuleId = Extract<
  TopicModuleId,
  "hero" | "start-here"
>;

export interface TopicPageContentCandidateDirection {
  id: `candidate-${1 | 2 | 3 | 4 | 5}`;
  focus:
    | "topic-proposition"
    | "routine-entry"
    | "shopping-decision"
    | "scene-journey"
    | "guided-discovery"
    | "brand-position"
    | "signature-concept"
    | "routine-role"
    | "need-led-choice"
    | "editorial-discovery";
  objective: string;
}

export interface TopicPageContentCandidateGenerationContext {
  schemaVersion: "topic-page-content-candidate-generation/v1";
  candidateCount: 5;
  targetModuleIds: TopicPageContentCandidateModuleId[];
  directions: TopicPageContentCandidateDirection[];
  selectionUnit: "module-package-with-optional-scene-picks";
  sharedTaskPolicy: "generate-once-preserve-exactly";
}

export interface TopicPageContentCandidate {
  id: TopicPageContentCandidateDirection["id"];
  directionId: TopicPageContentCandidateDirection["id"];
  direction?: TopicPageContentCandidateDirection;
  tasks: TopicPageContentTaskProposal[];
}

export interface TopicPageContentCandidateSetProposal {
  schemaVersion: "topic-page-content-candidate-set-proposal/v1";
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  topicPagePlanDigest: string;
  themeIntentDigest: string;
  productSelectionDigest: string;
  targetModuleIds: TopicPageContentCandidateModuleId[];
  sharedTasks: TopicPageContentTaskProposal[];
  candidates: TopicPageContentCandidate[];
}

export interface TopicPageContentCandidateSet
  extends Omit<TopicPageContentCandidateSetProposal, "schemaVersion"> {
  schemaVersion: "topic-page-content-candidate-set/v1";
  taskOrder: string[];
  advisoryWarnings: string[];
  digest: string;
}

export interface TopicPageContentCandidateSelection {
  moduleId: TopicPageContentCandidateModuleId;
  candidateId: TopicPageContentCandidateDirection["id"];
  reason: string;
  sceneSelections?: Array<{
    sceneId: string;
    candidateId: TopicPageContentCandidateDirection["id"];
    reason: string;
  }>;
}

export interface TopicPageContentCandidateSelectionProposal {
  schemaVersion: "topic-page-content-candidate-selection-proposal/v1";
  candidateSetDigest: string;
  selections: TopicPageContentCandidateSelection[];
}

export type TopicPageContentCandidateSelectionCriterion =
  | "newcomer-orientation"
  | "theme-specificity"
  | "scene-specificity"
  | "shopping-decision-usefulness"
  | "module-differentiation"
  | "evidence-claim-alignment"
  | "language-quality"
  | "cross-module-coherence"
  | "brand-distinctiveness"
  | "consumer-relevance"
  | "editorial-quality"
  | "meta-navigation-avoidance"
  | "module-redundancy-avoidance";

export interface TopicPageContentCandidateSelectionDecision
  extends Omit<TopicPageContentCandidateSelectionProposal, "schemaVersion"> {
  schemaVersion: "topic-page-content-candidate-selection/v1";
  selectorAgentId: string;
  advisoryWarnings: string[];
  digest: string;
}

export interface TopicPageContentCandidateSelectionContext {
  candidateSet: TopicPageContentCandidateSet;
  copyBrief: TopicPageCopyBrief;
  backgroundEvidence: TopicBackgroundEvidenceBundle | null;
  taskContexts: TopicPageContentTaskContext[];
  criteria: readonly TopicPageContentCandidateSelectionCriterion[];
  selectionPolicy: {
    unit: "module-package-with-optional-scene-picks";
    requireEveryTargetModule: true;
    finalContentReviewRequired: true;
    qualityEnforcement: "advisory-never-block-generation";
    sceneSelection: "optional-per-scene-with-module-fallback";
    advisoryCriteria: readonly TopicPageContentCandidateSelectionCriterion[];
  };
}

export type TopicPageContentCandidateSelectionRun =
  | {
      schemaVersion: "topic-page-content-candidate-selection-run/v1";
      status: "needs-candidate-selection-proposal";
      context: TopicPageContentCandidateSelectionContext;
    }
  | {
      schemaVersion: "topic-page-content-candidate-selection-run/v1";
      status: "ready";
      decision: TopicPageContentCandidateSelectionDecision;
      proposal: TopicPageContentProposal;
    }
  | {
      schemaVersion: "topic-page-content-candidate-selection-run/v1";
      status: "blocked";
      issues: string[];
    };

export type TopicPageContentCopySlot =
  | "title"
  | "description"
  | "tags"
  | "items[].label"
  | "groups[].label"
  | "scenes[].label"
  | "scenes[].title"
  | "scenes[].description";

export interface TopicPageContentCopyRule {
  slot: TopicPageContentCopySlot;
  /** Advisory layout ceiling for generation and review; never a deterministic rejection. */
  maxCharacters: number;
  preferredLength?: {
    minCharacters?: number;
    maxCharacters?: number;
    minWords?: number;
    maxWords?: number;
  };
}

export interface TopicPageContentTemplateCopy {
  title?: string;
  description?: string;
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

export interface TopicPageContentTaskGroup {
  id: string;
  label: string;
  productIds: string[];
  sourceCategoryIds?: string[];
}

export interface TopicPageContentTaskContext {
  taskId: string;
  moduleId: TopicModuleId;
  component: TopicPageComponent;
  shoppingGoal: string;
  reason: string;
  copySlots: TopicPageContentCopySlot[];
  copyRules: TopicPageContentCopyRule[];
  templateCopy?: TopicPageContentTemplateCopy;
  assignments: TopicPagePlanAssignmentV2[];
  scenes: TopicPagePlanSceneV2[];
  groups: TopicPageContentTaskGroup[];
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
  copyRules?: TopicPageContentCopyRule[];
  templateCopy?: TopicPageContentTemplateCopy;
}

interface TopicPageCopyBriefBase {
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

export interface TopicPageHeroStrategy {
  kind: "brand" | "topic" | "campaign";
  titleFocus: string;
  descriptionFocus: string;
}

export interface TopicPageCopyLocalizationStrategy {
  requestedLanguage: ContentLanguage;
  supportedLanguages: readonly ["zh", "en"];
  generationMode: "separate-proposals";
  adaptation: "locale-native-not-literal";
}

export interface TopicPageCopySignature {
  primaryClaimId: string | null;
  supportingClaimIds: string[];
  usage: "preferred-topic-context-only";
}

export interface TopicPageCopyBriefV2 extends TopicPageCopyBriefBase {
  schemaVersion: "topic-page-copy-brief/v2";
}

export interface TopicPageCopyBriefV3 extends TopicPageCopyBriefBase {
  schemaVersion: "topic-page-copy-brief/v3";
  heroStrategy: TopicPageHeroStrategy;
  topicSignature: TopicPageCopySignature;
  localizationStrategy: TopicPageCopyLocalizationStrategy;
}

export type TopicPageCopyBrief = TopicPageCopyBriefV2 | TopicPageCopyBriefV3;

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
    | "topic-page-copy/novice-guided@2"
    | "topic-page-copy/novice-guided@3";
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
  proposalRevision?: TopicPageContentProposalRevisionContext;
  candidateGeneration?: TopicPageContentCandidateGenerationContext;
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
