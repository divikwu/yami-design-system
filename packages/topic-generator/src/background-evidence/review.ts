import type { ThemeIntent } from "../types.js";
import { sha256Digest } from "../product-selection/digest.js";
import { themeIntentDigest } from "../page-merchandising/review.js";
import type {
  TopicBackgroundEvidenceClaim,
  TopicBackgroundEvidenceClaimType,
  TopicBackgroundEvidenceBundle,
  TopicBackgroundEvidenceProposalReview,
  TopicBackgroundEvidenceSource,
  TopicBackgroundEvidenceSourceType,
} from "./contracts.js";

const SOURCE_TYPES = new Set<TopicBackgroundEvidenceSourceType>([
  "official-brand",
  "wikipedia",
  "authoritative-cultural",
]);

const CLAIM_TYPES = new Set<TopicBackgroundEvidenceClaimType>([
  "identity",
  "origin",
  "meaning",
  "tradition",
  "terminology",
]);

function objectValue(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function validHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function isWikipediaHost(hostname: string) {
  return hostname === "wikipedia.org" || hostname.endsWith(".wikipedia.org");
}

export function topicBackgroundEvidenceDigest<T extends object>(bundle: T) {
  const bound = { ...bundle } as { digest?: string };
  delete bound.digest;
  return sha256Digest(bound);
}

function reviewSource(
  value: unknown,
  index: number,
  seenIds: Set<string>,
  issues: string[],
): TopicBackgroundEvidenceSource | null {
  const source = objectValue(value);
  if (!source) {
    issues.push(`Background source ${index} must be an object.`);
    return null;
  }
  const id = stringValue(source.id);
  const type = stringValue(source.type) as TopicBackgroundEvidenceSourceType;
  const title = stringValue(source.title);
  const url = stringValue(source.url);
  const publisher = stringValue(source.publisher);
  if (!id) issues.push(`Background source ${index} requires id.`);
  if (id && seenIds.has(id)) issues.push(`Background source ${id} is duplicated.`);
  if (id) seenIds.add(id);
  if (!SOURCE_TYPES.has(type)) issues.push(`Background source ${id || index} has unsupported type.`);
  if (!title || title.length > 200) {
    issues.push(`Background source ${id || index} requires a title no longer than 200 characters.`);
  }
  if (!publisher || publisher.length > 100) {
    issues.push(`Background source ${id || index} requires a publisher no longer than 100 characters.`);
  }
  const parsedUrl = validHttpsUrl(url);
  if (!parsedUrl) {
    issues.push(`Background source ${id || index} requires an HTTPS URL.`);
  } else if (type === "wikipedia" && !isWikipediaHost(parsedUrl.hostname)) {
    issues.push(`Wikipedia source ${id || index} must use a wikipedia.org URL.`);
  } else if (type === "official-brand" && isWikipediaHost(parsedUrl.hostname)) {
    issues.push(`Background official-brand source cannot use a Wikipedia URL: ${id || index}.`);
  }
  return { id, type, title, url, publisher };
}

function reviewClaim(
  value: unknown,
  index: number,
  sourceIds: Set<string>,
  seenIds: Set<string>,
  issues: string[],
): TopicBackgroundEvidenceClaim | null {
  const claim = objectValue(value);
  if (!claim) {
    issues.push(`Background claim ${index} must be an object.`);
    return null;
  }
  const id = stringValue(claim.id);
  const type = stringValue(claim.type) as TopicBackgroundEvidenceClaimType;
  const text = stringValue(claim.text);
  const rawSourceIds = Array.isArray(claim.sourceIds) ? claim.sourceIds : [];
  const claimSourceIds = rawSourceIds
    .filter((sourceId): sourceId is string => typeof sourceId === "string")
    .map((sourceId) => sourceId.trim())
    .filter(Boolean);
  if (!id) issues.push(`Background claim ${index} requires id.`);
  if (id && seenIds.has(id)) issues.push(`Background claim ${id} is duplicated.`);
  if (id) seenIds.add(id);
  if (!CLAIM_TYPES.has(type)) issues.push(`Background claim ${id || index} has unsupported type.`);
  if (!text || text.length > 500) {
    issues.push(`Background claim ${id || index} requires text no longer than 500 characters.`);
  }
  if (!Array.isArray(claim.sourceIds) || claimSourceIds.length === 0 ||
      claimSourceIds.length !== rawSourceIds.length) {
    issues.push(`Background claim ${id || index} requires non-empty sourceIds.`);
  }
  claimSourceIds.forEach((sourceId) => {
    if (!sourceIds.has(sourceId)) {
      issues.push(`Background claim ${id || index} references unknown source ${sourceId}.`);
    }
  });
  if (claim.usage !== "context-only") {
    issues.push(`Background claim ${id || index} usage must be context-only.`);
  }
  return { id, type, text, sourceIds: claimSourceIds, usage: "context-only" };
}

export function reviewTopicBackgroundEvidenceProposal(
  intent: ThemeIntent,
  keyword: string,
  language: "en" | "zh",
  value: unknown,
): TopicBackgroundEvidenceProposalReview {
  const proposal = objectValue(value);
  const issues: string[] = [];
  if (!proposal) {
    return {
      status: "rejected",
      issues: ["TopicBackgroundEvidenceProposal must be a JSON object."],
    };
  }
  if (proposal.schemaVersion !== "topic-background-evidence-proposal/v1") {
    issues.push('schemaVersion must be "topic-background-evidence-proposal/v1".');
  }
  if (proposal.keyword !== keyword) issues.push("Background evidence keyword does not match.");
  if (proposal.site !== "us") issues.push("Background evidence site must be us.");
  if (proposal.language !== language) {
    issues.push("Background evidence language does not match the requested language.");
  }
  if (proposal.themeIntentDigest !== themeIntentDigest(intent)) {
    issues.push("Background evidence themeIntentDigest does not match ThemeIntent.");
  }
  const rawSources = Array.isArray(proposal.sources) ? proposal.sources : [];
  const rawClaims = Array.isArray(proposal.claims) ? proposal.claims : [];
  if (!Array.isArray(proposal.sources) || rawSources.length === 0 || rawSources.length > 8) {
    issues.push("Background evidence requires between 1 and 8 sources.");
  }
  if (!Array.isArray(proposal.claims) || rawClaims.length === 0 || rawClaims.length > 12) {
    issues.push("Background evidence requires between 1 and 12 claims.");
  }
  const seenSourceIds = new Set<string>();
  const sources = rawSources.flatMap((source, index) => {
    const reviewed = reviewSource(source, index, seenSourceIds, issues);
    return reviewed ? [reviewed] : [];
  });
  const sourceIds = new Set(sources.map(({ id }) => id));
  const seenClaimIds = new Set<string>();
  const claims = rawClaims.flatMap((claim, index) => {
    const reviewed = reviewClaim(claim, index, sourceIds, seenClaimIds, issues);
    return reviewed ? [reviewed] : [];
  });
  if (issues.length > 0) return { status: "rejected", issues };
  return {
    status: "accepted",
    issues: [],
    proposal: {
      schemaVersion: "topic-background-evidence-proposal/v1",
      keyword,
      site: "us",
      language,
      themeIntentDigest: themeIntentDigest(intent),
      sources,
      claims,
    },
  };
}

export function reviewTopicBackgroundEvidenceBundle(
  intent: ThemeIntent,
  bundle: TopicBackgroundEvidenceBundle,
) {
  const issues: string[] = [];
  if (bundle.schemaVersion !== "topic-background-evidence/v1") {
    issues.push('Background evidence schemaVersion must be "topic-background-evidence/v1".');
  }
  if (bundle.themeIntentDigest !== themeIntentDigest(intent)) {
    issues.push("Background evidence themeIntentDigest does not match ThemeIntent.");
  }
  if (bundle.digest !== topicBackgroundEvidenceDigest(bundle)) {
    issues.push("Background evidence digest is invalid.");
  }
  if (bundle.status === "unavailable") {
    if (bundle.sources.length > 0 || bundle.claims.length > 0) {
      issues.push("Unavailable background evidence cannot contain sources or claims.");
    }
    return issues;
  }
  const review = reviewTopicBackgroundEvidenceProposal(
    intent,
    bundle.keyword,
    bundle.language,
    {
      schemaVersion: "topic-background-evidence-proposal/v1",
      keyword: bundle.keyword,
      site: bundle.site,
      language: bundle.language,
      themeIntentDigest: bundle.themeIntentDigest,
      sources: bundle.sources,
      claims: bundle.claims,
    },
  );
  issues.push(...review.issues);
  if (bundle.status === "ready" && intent.themeType === "brand" &&
      !bundle.sources.some(({ type }) => type === "official-brand")) {
    issues.push("Ready brand background evidence requires an official brand source.");
  }
  return issues;
}
