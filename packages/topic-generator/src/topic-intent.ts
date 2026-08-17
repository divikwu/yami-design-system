import {
  buildSearchFallbackIntent,
  resolveCatalogThemeIntent,
} from "./yami-catalog.js";
import type {
  ShoppingIntent,
  ThemeEntityType,
  ThemeIntent,
  ThemeIntentConstraint,
  ThemeType,
  YamiSearchSnapshot,
} from "./types.js";

export interface SemanticProposal {
  schemaVersion: "semantic-proposal/v1";
  themeType: ThemeType;
  entityType: ThemeEntityType;
  canonicalEntity: { id?: string; label: string } | null;
  shoppingIntent: ShoppingIntent;
  needs: string[];
  mustInclude: string[];
  mustExclude: string[];
  searchTerms: string[];
}

export interface SemanticProposalReview {
  status: "not-provided" | "accepted" | "partially-accepted" | "rejected";
  acceptedFields: string[];
  rejectedFields: string[];
  warnings: string[];
}

export interface TopicIntentResolution {
  intent: ThemeIntent;
  proposalReview: SemanticProposalReview;
}

export class SemanticProposalInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SemanticProposalInputError";
  }
}

function stringList(value: unknown, field: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new SemanticProposalInputError(`${field} must be an array of strings.`);
  }
  return uniqueStrings(value.map((item) => item.trim()));
}

export function parseSemanticProposal(value: unknown): SemanticProposal {
  if (typeof value !== "object" || value === null) {
    throw new SemanticProposalInputError("Semantic Proposal must be a JSON object.");
  }
  const proposal = value as Record<string, unknown>;
  const themeTypes: ThemeType[] = ["brand", "product", "activity", "uncertain"];
  const entityTypes: ThemeEntityType[] = [
    "brand",
    "category",
    "attribute",
    "scenario",
    "unknown",
  ];
  const shoppingIntents: ShoppingIntent[] = [
    "browse-brand",
    "find-product",
    "assemble-scenario",
    "clarify",
  ];
  if (proposal.schemaVersion !== "semantic-proposal/v1") {
    throw new SemanticProposalInputError(
      'schemaVersion must be "semantic-proposal/v1".',
    );
  }
  if (!themeTypes.includes(proposal.themeType as ThemeType)) {
    throw new SemanticProposalInputError("themeType is not supported.");
  }
  if (!entityTypes.includes(proposal.entityType as ThemeEntityType)) {
    throw new SemanticProposalInputError("entityType is not supported.");
  }
  if (!shoppingIntents.includes(proposal.shoppingIntent as ShoppingIntent)) {
    throw new SemanticProposalInputError("shoppingIntent is not supported.");
  }

  let canonicalEntity: SemanticProposal["canonicalEntity"] = null;
  const rawCanonicalEntity = proposal.canonicalEntity;
  if (rawCanonicalEntity !== null) {
    if (typeof rawCanonicalEntity !== "object") {
      throw new SemanticProposalInputError(
        "canonicalEntity must be null or contain a non-empty label.",
      );
    }
    const entity = rawCanonicalEntity as Record<string, unknown>;
    if (
      typeof entity.label !== "string" ||
      entity.label.trim().length === 0 ||
      (entity.id !== undefined && typeof entity.id !== "string")
    ) {
      throw new SemanticProposalInputError(
        "canonicalEntity must be null or contain a non-empty label.",
      );
    }
    canonicalEntity = {
      ...(typeof entity.id === "string"
        ? { id: entity.id.trim() }
        : {}),
      label: entity.label.trim(),
    };
  }

  return {
    schemaVersion: "semantic-proposal/v1",
    themeType: proposal.themeType as ThemeType,
    entityType: proposal.entityType as ThemeEntityType,
    canonicalEntity,
    shoppingIntent: proposal.shoppingIntent as ShoppingIntent,
    needs: stringList(proposal.needs, "needs"),
    mustInclude: stringList(proposal.mustInclude, "mustInclude"),
    mustExclude: stringList(proposal.mustExclude, "mustExclude"),
    searchTerms: stringList(proposal.searchTerms, "searchTerms"),
  };
}

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function uniqueStrings(values: string[]) {
  return values.filter((value, index, all) =>
    value.trim().length > 0 &&
    all.findIndex((candidate) => normalized(candidate) === normalized(value)) === index
  );
}

function uniqueEvidenceRefs(values: ThemeIntent["evidenceRefs"]) {
  return values.filter((value, index, all) =>
    all.findIndex((candidate) => candidate.id === value.id) === index
  );
}

function evidencePhrases(snapshot: YamiSearchSnapshot) {
  return uniqueStrings([
    snapshot.keyword,
    ...snapshot.products.flatMap((product) => [
      product.title,
      product.brand,
      product.categoryL1Name ?? "",
      product.categoryL2Name ?? "",
      product.categoryL3Name ?? "",
    ]),
    ...(snapshot.evidence?.brands.flatMap((brand) => brand.aliases) ?? []),
    ...(snapshot.evidence?.categories.flatMap((category) => [
      category.label,
      ...category.aliases,
      ...category.path,
    ]) ?? []),
    ...(snapshot.evidence?.attributes.flatMap((attribute) => attribute.aliases) ?? []),
  ]);
}

function supportedTerm(term: string, phrases: string[]) {
  const candidate = normalized(term);
  if (!candidate) return false;
  return phrases.some((phrase) => {
    const evidence = normalized(phrase);
    return evidence === candidate || evidence.includes(candidate);
  });
}

function reviewedList(
  field: string,
  values: string[],
  phrases: string[],
  acceptedFields: string[],
  rejectedFields: string[],
) {
  return uniqueStrings(values).filter((value) => {
    const key = `${field}:${value}`;
    if (supportedTerm(value, phrases)) {
      acceptedFields.push(key);
      return true;
    }
    rejectedFields.push(key);
    return false;
  });
}

function reviewStatus(acceptedFields: string[], rejectedFields: string[]) {
  if (acceptedFields.length === 0) return "rejected" as const;
  if (rejectedFields.length > 0) return "partially-accepted" as const;
  return "accepted" as const;
}

function baseIntent(snapshot: YamiSearchSnapshot) {
  return snapshot.provider === "yami-catalog-search" || snapshot.evidence
    ? resolveCatalogThemeIntent(snapshot)
    : buildSearchFallbackIntent(snapshot.keyword, snapshot.products);
}

function semanticShopperAction(keyword: string) {
  const query = normalized(keyword);
  if (["restock", "replenish", "补给"].some((term) => query.includes(normalized(term)))) {
    return "replenish" as const;
  }
  if (["gift", "礼物"].some((term) => query.includes(normalized(term)))) {
    return "gift" as const;
  }
  return "bundle" as const;
}

function constraintEvidenceIds(intent: ThemeIntent, value: string) {
  const candidate = normalized(value);
  return intent.evidenceRefs
    .filter((evidence) => {
      const label = normalized(evidence.label);
      return label === candidate || label.includes(candidate) || candidate.includes(label);
    })
    .map((evidence) => evidence.id);
}

function completeConstraintCoverage(intent: ThemeIntent): ThemeIntent {
  const constraints = intent.constraints.reduce<ThemeIntentConstraint[]>((result, item) => {
    const existing = result.find((candidate) =>
      candidate.kind === item.kind && normalized(candidate.value) === normalized(item.value)
    );
    if (!existing) return [...result, { ...item }];
    existing.evidenceIds = uniqueStrings([...existing.evidenceIds, ...item.evidenceIds]);
    if (item.status === "verified") existing.status = "verified";
    else if (item.status === "unverified" && existing.status === "rejected") {
      existing.status = "unverified";
    }
    return result;
  }, []);
  const append = (
    value: string,
    kind: ThemeIntentConstraint["kind"],
    fallbackStatus: ThemeIntentConstraint["status"],
  ) => {
    if (constraints.some((item) => normalized(item.value) === normalized(value))) return;
    const evidenceIds = constraintEvidenceIds(intent, value);
    const hasCatalogEvidence = evidenceIds.some((id) =>
      id.startsWith("catalog-brand:") ||
      id.startsWith("catalog-category:") ||
      id.startsWith("catalog-attribute:")
    );
    constraints.push({
      id: `${kind}:${normalized(value).replace(/\s+/g, "-") || "value"}`,
      kind,
      value,
      status: hasCatalogEvidence ? "verified" : fallbackStatus,
      evidenceIds,
    });
  };

  intent.mustInclude.forEach((value) => append(
    value,
    normalized(value) === normalized(intent.canonicalEntity?.label ?? "")
      ? "core-entity"
      : "modifier",
    "unverified",
  ));
  intent.mustExclude.forEach((value) => append(value, "exclusion", "unverified"));

  return {
    ...intent,
    conditions: uniqueStrings([
      ...intent.conditions,
      ...constraints
        .filter((item) => item.kind === "modifier" || item.kind === "scenario")
        .map((item) => item.value),
    ]),
    constraints,
  };
}

function reviewAgainstBase(
  intent: ThemeIntent,
  proposal: SemanticProposal,
  phrases: string[],
): TopicIntentResolution {
  const acceptedFields: string[] = [];
  const rejectedFields: string[] = [];

  (["themeType", "entityType", "shoppingIntent"] as const).forEach((field) => {
    if (proposal[field] === intent[field]) acceptedFields.push(field);
    else rejectedFields.push(field);
  });

  if (
    proposal.canonicalEntity &&
    intent.canonicalEntity &&
    normalized(proposal.canonicalEntity.label) === normalized(intent.canonicalEntity.label)
  ) {
    acceptedFields.push("canonicalEntity");
  } else if (proposal.canonicalEntity !== null || intent.canonicalEntity !== null) {
    rejectedFields.push("canonicalEntity");
  }

  const needs = reviewedList(
    "needs",
    proposal.needs,
    phrases,
    acceptedFields,
    rejectedFields,
  );
  const mustInclude = reviewedList(
    "mustInclude",
    proposal.mustInclude,
    phrases,
    acceptedFields,
    rejectedFields,
  );
  const mustExclude = reviewedList(
    "mustExclude",
    proposal.mustExclude,
    phrases,
    acceptedFields,
    rejectedFields,
  );
  const searchTerms = reviewedList(
    "searchTerms",
    proposal.searchTerms,
    phrases,
    acceptedFields,
    rejectedFields,
  );

  return {
    intent: {
      ...intent,
      needs: uniqueStrings([...intent.needs, ...needs]),
      mustInclude: uniqueStrings([...intent.mustInclude, ...mustInclude]),
      mustExclude: uniqueStrings([...intent.mustExclude, ...mustExclude]),
      searchTerms: uniqueStrings([...intent.searchTerms, ...searchTerms]),
    },
    proposalReview: {
      status: reviewStatus(acceptedFields, rejectedFields),
      acceptedFields,
      rejectedFields,
      warnings: rejectedFields.length > 0
        ? ["Unsupported Semantic Proposal fields were ignored."]
        : [],
    },
  };
}

function scenarioResolution(
  snapshot: YamiSearchSnapshot,
  intent: ThemeIntent,
  proposal: SemanticProposal,
  phrases: string[],
): TopicIntentResolution | null {
  const availableCategories = intent.categories.filter((category) => category.evidenceCount > 0);
  if (
    intent.confidence >= 0.9 ||
    availableCategories.length < 2 ||
    proposal.themeType !== "activity" ||
    proposal.entityType !== "scenario" ||
    proposal.shoppingIntent !== "assemble-scenario"
  ) {
    return null;
  }

  const acceptedFields = ["themeType", "entityType", "shoppingIntent"];
  const rejectedFields: string[] = [];
  const canonicalLabel = proposal.canonicalEntity?.label ?? "";
  if (normalized(canonicalLabel) === normalized(snapshot.keyword)) {
    acceptedFields.push("canonicalEntity");
  } else if (proposal.canonicalEntity) {
    rejectedFields.push("canonicalEntity");
  }

  const needs = reviewedList(
    "needs",
    proposal.needs,
    phrases,
    acceptedFields,
    rejectedFields,
  );
  const mustInclude = reviewedList(
    "mustInclude",
    proposal.mustInclude,
    phrases,
    acceptedFields,
    rejectedFields,
  );
  const mustExclude = reviewedList(
    "mustExclude",
    proposal.mustExclude,
    phrases,
    acceptedFields,
    rejectedFields,
  );
  const searchTerms = reviewedList(
    "searchTerms",
    proposal.searchTerms,
    phrases,
    acceptedFields,
    rejectedFields,
  );

  const confidence = 0.78;
  const shopperAction = semanticShopperAction(snapshot.keyword);
  const shoppingGoal = shopperAction === "replenish"
    ? `Find products needed to replenish ${snapshot.keyword}.`
    : shopperAction === "gift"
      ? `Assemble products suitable for ${snapshot.keyword}.`
      : `Assemble products that collectively support ${snapshot.keyword}.`;
  const categoryEvidenceRefs = availableCategories.map((category) => ({
    id: `catalog-category:${category.id}`,
    source: "catalog-category" as const,
    label: category.label,
    count: category.evidenceCount,
  }));
  const selectedCandidateId = `activity:scenario:${normalized(snapshot.keyword).replace(/\s+/g, "-")}:assemble-scenario:${shopperAction}`;
  const scenarioCandidate = {
    id: selectedCandidateId,
    themeType: "activity" as const,
    entityType: "scenario" as const,
    canonicalEntity: {
      id: normalized(snapshot.keyword).replace(/\s+/g, "-"),
      label: snapshot.keyword,
    },
    shoppingIntent: "assemble-scenario" as const,
    shopperAction,
    score: confidence,
    evidenceLevel: "medium" as const,
    reason: `The Agent Semantic Proposal identifies a shopping scenario, and ${availableCategories.length} catalog categories provide supporting product evidence.`,
    supportingEvidenceIds: categoryEvidenceRefs.map((evidence) => evidence.id),
    competingCandidateIds: intent.candidates.map((candidate) => candidate.id),
  };
  const baselineCandidates = intent.candidates
    .filter((candidate) => candidate.id !== selectedCandidateId)
    .map((candidate) => ({
      ...candidate,
      competingCandidateIds: uniqueStrings([
        ...candidate.competingCandidateIds,
        selectedCandidateId,
      ]),
    }));
  const topBaselineScore = baselineCandidates[0]?.score;

  return {
    intent: {
      ...intent,
      themeType: "activity",
      entityType: "scenario",
      canonicalEntity: {
        id: normalized(snapshot.keyword).replace(/\s+/g, "-"),
        label: snapshot.keyword,
      },
      shoppingIntent: "assemble-scenario",
      shopperAction,
      shoppingGoal,
      needs: needs.length > 0
        ? needs
        : availableCategories.map((category) => category.label),
      mustInclude,
      mustExclude,
      conditions: uniqueStrings([snapshot.keyword, ...mustInclude]),
      searchTerms: uniqueStrings([
        snapshot.keyword,
        ...searchTerms,
        ...availableCategories.map((category) => category.label),
      ]),
      constraints: [{
        id: `scenario:${normalized(snapshot.keyword).replace(/\s+/g, "-")}`,
        kind: "scenario",
        value: snapshot.keyword,
        status: "unverified",
        evidenceIds: categoryEvidenceRefs.map((evidence) => evidence.id),
      }],
      evidenceRefs: uniqueEvidenceRefs([
        ...intent.evidenceRefs,
        ...categoryEvidenceRefs,
      ]),
      candidates: [scenarioCandidate, ...baselineCandidates],
      decision: {
        status: "resolved",
        selectedCandidateId,
        evidenceLevel: "medium",
        selectedCandidateMargin: typeof topBaselineScore === "number"
          ? Number((confidence - topBaselineScore).toFixed(2))
          : null,
        requiresAgentReview: false,
      },
      reason: `The Agent Semantic Proposal identifies a shopping scenario, and ${availableCategories.length} catalog categories provide supporting product evidence.`,
      confidence,
    },
    proposalReview: {
      status: reviewStatus(acceptedFields, rejectedFields),
      acceptedFields,
      rejectedFields,
      warnings: rejectedFields.length > 0
        ? ["Unsupported Semantic Proposal fields were ignored."]
        : [],
    },
  };
}

export function resolveTopicIntent(
  snapshot: YamiSearchSnapshot,
  proposal?: SemanticProposal,
): TopicIntentResolution {
  const intent = baseIntent(snapshot);
  if (!proposal) {
    return {
      intent: completeConstraintCoverage(intent),
      proposalReview: {
        status: "not-provided",
        acceptedFields: [],
        rejectedFields: [],
        warnings: [],
      },
    };
  }

  const phrases = evidencePhrases(snapshot);
  const resolution = scenarioResolution(snapshot, intent, proposal, phrases) ??
    reviewAgainstBase(intent, proposal, phrases);
  return {
    ...resolution,
    intent: completeConstraintCoverage(resolution.intent),
  };
}
