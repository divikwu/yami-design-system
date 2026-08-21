import type { ContentLanguage, ThemeIntent, YamiSite } from "../types.js";
import { themeIntentDigest } from "../page-merchandising/review.js";
import type {
  TopicAudienceContext,
  TopicBackgroundEvidenceBundle,
  TopicBackgroundEvidenceContext,
  TopicBackgroundEvidenceRun,
} from "./contracts.js";
import {
  reviewTopicBackgroundEvidenceProposal,
  topicBackgroundEvidenceDigest,
} from "./review.js";

export interface TopicBackgroundEvidenceRequest {
  intent: ThemeIntent;
  keyword: string;
  site: YamiSite;
  language: ContentLanguage;
  proposal?: unknown;
}

export function topicAudienceContext(language: ContentLanguage): TopicAudienceContext {
  return {
    schemaVersion: "topic-audience-context/v1",
    familiarity: "unfamiliar",
    marketContext: "non-asian-us",
    language,
    learningGoals: [
      "understand-the-topic",
      "choose-an-entry-point",
      "compare-with-context",
    ],
    assumptionsToAvoid: [
      "prior-brand-knowledge",
      "prior-product-knowledge",
      "prior-cultural-knowledge",
    ],
  };
}

function context(request: TopicBackgroundEvidenceRequest): TopicBackgroundEvidenceContext {
  return {
    keyword: request.keyword,
    site: request.site,
    language: request.language,
    themeIntentDigest: themeIntentDigest(request.intent),
    themeIntent: structuredClone(request.intent),
    audienceContext: topicAudienceContext(request.language),
    sourcePolicy: {
      officialBrandPriority: "required-when-brand",
      officialBrandResearchDepth: "homepage-plus-relevant-context-pages",
      brandContextGoal: "identity-plus-shopping-context-when-supported",
      wikipediaRole: "secondary-background-only",
      culturalSourceRequirement: "named-authoritative-publisher",
      allowedSourceTypes: [
        "official-brand",
        "wikipedia",
        "authoritative-cultural",
      ],
    },
    allowedClaimTypes: ["identity", "origin", "meaning", "tradition", "terminology"],
    prohibitedClaimTypes: [
      "ingredient",
      "benefit",
      "efficacy",
      "popularity",
      "inventory",
      "discount",
      "rating",
      "customer-outcome",
    ],
  };
}

export function unavailableTopicBackgroundEvidence(
  request: Omit<TopicBackgroundEvidenceRequest, "proposal">,
  issues: string[],
): TopicBackgroundEvidenceBundle {
  const bundle = {
    schemaVersion: "topic-background-evidence/v1" as const,
    status: "unavailable" as const,
    keyword: request.keyword,
    site: request.site,
    language: request.language,
    themeIntentDigest: themeIntentDigest(request.intent),
    sources: [],
    claims: [],
    issues,
  };
  return { ...bundle, digest: topicBackgroundEvidenceDigest(bundle) };
}

export function advanceTopicBackgroundEvidenceRun(
  request: TopicBackgroundEvidenceRequest,
): TopicBackgroundEvidenceRun {
  if (request.intent.decision.status !== "resolved") {
    const issues = [
      "Background evidence requires a resolved ThemeIntent; clarify the topic before researching context.",
    ];
    return {
      schemaVersion: "topic-background-evidence-run/v1",
      status: "blocked",
      issues,
      proposalReview: { status: "rejected", issues },
    };
  }
  if (request.proposal === undefined) {
    return {
      schemaVersion: "topic-background-evidence-run/v1",
      status: "needs-background-evidence-proposal",
      context: context(request),
    };
  }
  const proposalReview = reviewTopicBackgroundEvidenceProposal(
    request.intent,
    request.keyword,
    request.language,
    request.proposal,
  );
  if (proposalReview.status !== "accepted" || !proposalReview.proposal) {
    return {
      schemaVersion: "topic-background-evidence-run/v1",
      status: "blocked",
      issues: proposalReview.issues,
      proposalReview,
    };
  }
  const missingOfficialBrandSource = request.intent.themeType === "brand" &&
    !proposalReview.proposal.sources.some(({ type }) => type === "official-brand");
  const issues = missingOfficialBrandSource
    ? ["Brand background evidence has no official brand source; use it only as partial context."]
    : [];
  const bundle = {
    schemaVersion: "topic-background-evidence/v1" as const,
    status: missingOfficialBrandSource ? "partial" as const : "ready" as const,
    keyword: request.keyword,
    site: request.site,
    language: request.language,
    themeIntentDigest: themeIntentDigest(request.intent),
    sources: proposalReview.proposal.sources,
    claims: proposalReview.proposal.claims,
    issues,
  };
  return {
    schemaVersion: "topic-background-evidence-run/v1",
    status: "ready",
    bundle: { ...bundle, digest: topicBackgroundEvidenceDigest(bundle) },
    proposalReview,
  };
}
