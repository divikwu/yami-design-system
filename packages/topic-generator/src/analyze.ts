import {
  loadCatalogSnapshot,
  type CatalogSnapshotAttempt,
  type LoadCatalogSnapshotOptions,
} from "./catalog-snapshot.js";
import {
  resolveTopicIntent,
  type SemanticProposal,
  type SemanticProposalReview,
  type TopicIntentResolution,
} from "./topic-intent.js";
import type { ThemeIntent, YamiSearchSnapshot } from "./types.js";
import { refineYamiCatalogSnapshotForIntent } from "./yami-catalog.js";

/** Analyze one shopping keyword against current catalog evidence. */

export interface TopicIntentAnalysis {
  intent: ThemeIntent;
  snapshot: YamiSearchSnapshot;
  fallbackUsed: boolean;
  attempts: CatalogSnapshotAttempt[];
  proposalReview: SemanticProposalReview;
}

export interface AnalyzeTopicIntentOptions extends LoadCatalogSnapshotOptions {
  semanticProposal?: SemanticProposal;
}

export class TopicIntentInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TopicIntentInputError";
  }
}

function resolvedCoreIdentity(intent: ThemeIntent) {
  if (
    intent.decision.status !== "resolved" ||
    !intent.canonicalEntity ||
    (intent.entityType !== "brand" && intent.entityType !== "category")
  ) {
    return null;
  }
  return [
    intent.themeType,
    intent.entityType,
    intent.canonicalEntity.id,
    intent.shoppingIntent,
    intent.shopperAction,
  ].join(":");
}

function reconcileRefinedResolution(
  initial: TopicIntentResolution,
  refined: TopicIntentResolution,
): TopicIntentResolution {
  const initialCore = resolvedCoreIdentity(initial.intent);
  if (!initialCore || initialCore === resolvedCoreIdentity(refined.intent)) return refined;
  return {
    ...initial,
    intent: {
      ...initial.intent,
      decision: {
        ...initial.intent.decision,
        status: "needs-review",
        requiresAgentReview: true,
      },
      reason: `${initial.intent.reason} Refined catalog evidence conflicted with the resolved core entity, so the original entity remains frozen for review.`,
    },
  };
}

export async function analyzeTopicIntent(
  keyword: string,
  options: AnalyzeTopicIntentOptions = {},
): Promise<TopicIntentAnalysis> {
  const normalizedKeyword = keyword.trim();
  if (normalizedKeyword.length < 2 || normalizedKeyword.length > 80) {
    throw new TopicIntentInputError("Keyword must contain between 2 and 80 characters.");
  }

  const result = await loadCatalogSnapshot(normalizedKeyword, {
    adapters: options.adapters,
  });
  let snapshot = result.snapshot;
  let resolution = resolveTopicIntent(snapshot, options.semanticProposal);
  if (options.adapters === undefined && snapshot.provider === "yami-catalog-search") {
    snapshot = await refineYamiCatalogSnapshotForIntent(snapshot, resolution.intent);
    resolution = reconcileRefinedResolution(
      resolution,
      resolveTopicIntent(snapshot, options.semanticProposal),
    );
  }
  return {
    intent: resolution.intent,
    snapshot: { ...snapshot, intent: resolution.intent },
    fallbackUsed: result.fallbackUsed,
    attempts: result.attempts,
    proposalReview: resolution.proposalReview,
  };
}
