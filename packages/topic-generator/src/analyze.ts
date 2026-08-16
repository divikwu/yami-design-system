import {
  loadCatalogSnapshot,
  type CatalogSnapshotAttempt,
  type LoadCatalogSnapshotOptions,
} from "./catalog-snapshot.js";
import {
  resolveTopicIntent,
  type SemanticProposal,
  type SemanticProposalReview,
} from "./topic-intent.js";
import type { ThemeIntent, YamiSearchSnapshot } from "./types.js";

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
  const resolution = resolveTopicIntent(result.snapshot, options.semanticProposal);
  return {
    intent: resolution.intent,
    snapshot: { ...result.snapshot, intent: resolution.intent },
    fallbackUsed: result.fallbackUsed,
    attempts: result.attempts,
    proposalReview: resolution.proposalReview,
  };
}
