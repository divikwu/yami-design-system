import type {
  ContentLanguage,
  ThemeIntent,
  YamiSite,
} from "../types.js";

export type TopicBackgroundEvidenceSourceType =
  | "official-brand"
  | "wikipedia"
  | "authoritative-cultural";

export type TopicBackgroundEvidenceClaimType =
  | "identity"
  | "origin"
  | "meaning"
  | "tradition"
  | "terminology";

export interface TopicAudienceContext {
  schemaVersion: "topic-audience-context/v1";
  familiarity: "unfamiliar";
  marketContext: "non-asian-us";
  language: ContentLanguage;
  learningGoals: readonly [
    "understand-the-topic",
    "choose-an-entry-point",
    "compare-with-context",
  ];
  assumptionsToAvoid: readonly [
    "prior-brand-knowledge",
    "prior-product-knowledge",
    "prior-cultural-knowledge",
  ];
}

export interface TopicBackgroundEvidenceSource {
  id: string;
  type: TopicBackgroundEvidenceSourceType;
  title: string;
  url: string;
  publisher: string;
}

export interface TopicBackgroundEvidenceClaim {
  id: string;
  type: TopicBackgroundEvidenceClaimType;
  text: string;
  sourceIds: string[];
  usage: "context-only";
}

export interface TopicBackgroundEvidenceProposal {
  schemaVersion: "topic-background-evidence-proposal/v1";
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  themeIntentDigest: string;
  sources: TopicBackgroundEvidenceSource[];
  claims: TopicBackgroundEvidenceClaim[];
}

export interface TopicBackgroundEvidenceProposalReview {
  status: "accepted" | "rejected";
  issues: string[];
  proposal?: TopicBackgroundEvidenceProposal;
}

export interface TopicBackgroundEvidenceBundle {
  schemaVersion: "topic-background-evidence/v1";
  status: "ready" | "partial" | "unavailable";
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  themeIntentDigest: string;
  sources: TopicBackgroundEvidenceSource[];
  claims: TopicBackgroundEvidenceClaim[];
  issues: string[];
  digest: string;
}

export interface TopicBackgroundEvidenceContext {
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  themeIntentDigest: string;
  themeIntent: ThemeIntent;
  audienceContext: TopicAudienceContext;
  sourcePolicy: {
    officialBrandPriority: "required-when-brand";
    officialBrandResearchDepth: "homepage-plus-relevant-context-pages";
    brandContextGoal: "identity-plus-shopping-context-when-supported";
    wikipediaRole: "secondary-background-only";
    culturalSourceRequirement: "named-authoritative-publisher";
    allowedSourceTypes: readonly TopicBackgroundEvidenceSourceType[];
  };
  allowedClaimTypes: readonly TopicBackgroundEvidenceClaimType[];
  prohibitedClaimTypes: readonly [
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

export type TopicBackgroundEvidenceRun =
  | {
      schemaVersion: "topic-background-evidence-run/v1";
      status: "needs-background-evidence-proposal";
      context: TopicBackgroundEvidenceContext;
    }
  | {
      schemaVersion: "topic-background-evidence-run/v1";
      status: "ready";
      bundle: TopicBackgroundEvidenceBundle;
      proposalReview: TopicBackgroundEvidenceProposalReview;
    }
  | {
      schemaVersion: "topic-background-evidence-run/v1";
      status: "blocked";
      issues: string[];
      proposalReview: TopicBackgroundEvidenceProposalReview;
    };
