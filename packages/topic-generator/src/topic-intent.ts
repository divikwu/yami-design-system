import {
  buildSearchFallbackIntent,
  resolveCatalogThemeIntent,
} from "./yami-catalog.js";
import type {
  ContentLanguage,
  ShoppingIntent,
  ThemeEntityType,
  ThemeIntent,
  ThemeIntentCategoryHypothesis,
  ThemeIntentConstraint,
  ThemeIntentScenarioHypothesis,
  TopicIntentRuntimeEvidence,
  ThemeType,
  YamiSearchSnapshot,
} from "./types.js";

interface SemanticProposalBase {
  themeType: ThemeType;
  entityType: ThemeEntityType;
  canonicalEntity: { id?: string; label: string } | null;
  shoppingIntent: ShoppingIntent;
  needs: string[];
  mustInclude: string[];
  mustExclude: string[];
  searchTerms: string[];
}

export interface SemanticProposalV1 extends SemanticProposalBase {
  schemaVersion: "semantic-proposal/v1";
}

export interface SemanticCategoryHypothesis {
  label: string;
  role: "core" | "pairing" | "accessory";
  categoryIds: string[];
  reason: string;
}

export interface SemanticScenarioHypothesis {
  name: string;
  shoppingGoal: string;
  categoryIds: string[];
  reason: string;
}

export interface SemanticProposalV2 extends SemanticProposalBase {
  schemaVersion: "semantic-proposal/v2";
  categoryHypotheses: SemanticCategoryHypothesis[];
  scenarioHypotheses: SemanticScenarioHypothesis[];
}

export type SemanticProposal = SemanticProposalV1 | SemanticProposalV2;

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

export interface TopicIntentAgentRun {
  schemaVersion: "topic-intent-agent-run/v1";
  status: "needs-semantic-proposal";
  context: {
    keyword: string;
    site: YamiSearchSnapshot["site"];
    language: ContentLanguage;
    intent: ThemeIntent;
    categories: Array<{
      id: string;
      label: string;
      path: string[];
      productCount: number;
    }>;
    /** Complete current product evidence; legacy field name retained for protocol compatibility. */
    representativeProducts: Array<{
      id: string;
      title: string;
      brand: string;
      categoryId?: string;
      categoryLabel?: string;
    }>;
  };
}

export interface TopicIntentAgent {
  id: string;
  proposeSemanticIntent(run: TopicIntentAgentRun): Promise<unknown>;
}

export interface TopicIntentAgentWorkflowRequest {
  snapshot: YamiSearchSnapshot;
  intent: ThemeIntent;
  language: ContentLanguage;
  proposalReview: SemanticProposalReview;
  agent?: TopicIntentAgent;
}

export interface TopicIntentAgentWorkflowResult {
  snapshot: YamiSearchSnapshot;
  intent: ThemeIntent;
  proposalReview: SemanticProposalReview;
  runtime: TopicIntentRuntimeEvidence;
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

function nonEmptyString(value: unknown, field: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new SemanticProposalInputError(`${field} must be a non-empty string.`);
  }
  return value.trim();
}

function parseCategoryHypotheses(value: unknown) {
  if (!Array.isArray(value)) {
    throw new SemanticProposalInputError("categoryHypotheses must be an array.");
  }
  const roles: SemanticCategoryHypothesis["role"][] = ["core", "pairing", "accessory"];
  return value.map<SemanticCategoryHypothesis>((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new SemanticProposalInputError(`categoryHypotheses[${index}] must be an object.`);
    }
    const hypothesis = item as Record<string, unknown>;
    if (!roles.includes(hypothesis.role as SemanticCategoryHypothesis["role"])) {
      throw new SemanticProposalInputError(`categoryHypotheses[${index}].role is not supported.`);
    }
    const categoryIds = stringList(
      hypothesis.categoryIds,
      `categoryHypotheses[${index}].categoryIds`,
    );
    if (categoryIds.length === 0) {
      throw new SemanticProposalInputError(
        `categoryHypotheses[${index}].categoryIds must contain at least one category ID.`,
      );
    }
    return {
      label: nonEmptyString(hypothesis.label, `categoryHypotheses[${index}].label`),
      role: hypothesis.role as SemanticCategoryHypothesis["role"],
      categoryIds,
      reason: nonEmptyString(hypothesis.reason, `categoryHypotheses[${index}].reason`),
    };
  });
}

function parseScenarioHypotheses(value: unknown) {
  if (!Array.isArray(value)) {
    throw new SemanticProposalInputError("scenarioHypotheses must be an array.");
  }
  return value.map<SemanticScenarioHypothesis>((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new SemanticProposalInputError(`scenarioHypotheses[${index}] must be an object.`);
    }
    const hypothesis = item as Record<string, unknown>;
    const categoryIds = stringList(
      hypothesis.categoryIds,
      `scenarioHypotheses[${index}].categoryIds`,
    );
    if (categoryIds.length < 2) {
      throw new SemanticProposalInputError(
        `scenarioHypotheses[${index}].categoryIds must contain at least two category IDs.`,
      );
    }
    if (categoryIds.length > 8) {
      throw new SemanticProposalInputError(
        `scenarioHypotheses[${index}].categoryIds may contain at most eight category IDs.`,
      );
    }
    return {
      name: nonEmptyString(hypothesis.name, `scenarioHypotheses[${index}].name`),
      shoppingGoal: nonEmptyString(
        hypothesis.shoppingGoal,
        `scenarioHypotheses[${index}].shoppingGoal`,
      ),
      categoryIds,
      reason: nonEmptyString(hypothesis.reason, `scenarioHypotheses[${index}].reason`),
    };
  });
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
  if (
    proposal.schemaVersion !== "semantic-proposal/v1" &&
    proposal.schemaVersion !== "semantic-proposal/v2"
  ) {
    throw new SemanticProposalInputError(
      'schemaVersion must be "semantic-proposal/v1" or "semantic-proposal/v2".',
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

  const base = {
    themeType: proposal.themeType as ThemeType,
    entityType: proposal.entityType as ThemeEntityType,
    canonicalEntity,
    shoppingIntent: proposal.shoppingIntent as ShoppingIntent,
    needs: stringList(proposal.needs, "needs"),
    mustInclude: stringList(proposal.mustInclude, "mustInclude"),
    mustExclude: stringList(proposal.mustExclude, "mustExclude"),
    searchTerms: stringList(proposal.searchTerms, "searchTerms"),
  };
  return proposal.schemaVersion === "semantic-proposal/v2"
    ? {
        schemaVersion: "semantic-proposal/v2",
        ...base,
        categoryHypotheses: parseCategoryHypotheses(proposal.categoryHypotheses),
        scenarioHypotheses: parseScenarioHypotheses(proposal.scenarioHypotheses),
      }
    : { schemaVersion: "semantic-proposal/v1", ...base };
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

function reviewSemanticHypotheses(
  snapshot: YamiSearchSnapshot,
  proposal: SemanticProposal,
  resolution: TopicIntentResolution,
): TopicIntentResolution {
  if (proposal.schemaVersion !== "semantic-proposal/v2") return resolution;

  const acceptedFields = [...resolution.proposalReview.acceptedFields];
  const rejectedFields = [...resolution.proposalReview.rejectedFields];
  const evidenceCategories = new Map(
    (snapshot.evidence?.categories ?? [])
      .filter((category) => category.productCount > 0)
      .map((category) => [category.id, category]),
  );
  const usedCategoryIds = new Set<string>();
  const categoryHypotheses: ThemeIntentCategoryHypothesis[] = [];

  proposal.categoryHypotheses.forEach((hypothesis, index) => {
    const field = `categoryHypotheses[${index}]`;
    const categories = hypothesis.categoryIds.map((id) => evidenceCategories.get(id));
    const hasUnknownCategory = categories.some((category) => !category);
    const reusesCategory = hypothesis.categoryIds.some((id) => usedCategoryIds.has(id));
    if (hasUnknownCategory || reusesCategory) {
      rejectedFields.push(field);
      return;
    }
    hypothesis.categoryIds.forEach((id) => usedCategoryIds.add(id));
    categoryHypotheses.push({
      ...hypothesis,
      evidenceIds: hypothesis.categoryIds.map((id) => `catalog-category:${id}`),
    });
    acceptedFields.push(field);
  });

  const scenarioHypotheses: ThemeIntentScenarioHypothesis[] = [];
  const usedScenarioNames = new Set<string>();
  const usedScenarioGoals = new Set<string>();
  const usedScenarioCategoryIds = new Set<string>();
  proposal.scenarioHypotheses.forEach((hypothesis, index) => {
    const field = `scenarioHypotheses[${index}]`;
    const categories = hypothesis.categoryIds.map((id) => evidenceCategories.get(id));
    const normalizedName = normalized(hypothesis.name);
    const normalizedGoal = normalized(hypothesis.shoppingGoal);
    const addsDistinctCategory = hypothesis.categoryIds.some(
      (id) => !usedScenarioCategoryIds.has(id),
    );
    if (
      index >= 6 ||
      categories.some((category) => !category) ||
      usedScenarioNames.has(normalizedName) ||
      usedScenarioGoals.has(normalizedGoal) ||
      !addsDistinctCategory
    ) {
      rejectedFields.push(field);
      return;
    }
    usedScenarioNames.add(normalizedName);
    usedScenarioGoals.add(normalizedGoal);
    hypothesis.categoryIds.forEach((id) => usedScenarioCategoryIds.add(id));
    scenarioHypotheses.push({
      ...hypothesis,
      evidenceIds: hypothesis.categoryIds.map((id) => `catalog-category:${id}`),
    });
    acceptedFields.push(field);
  });

  const acceptedCategoryIds = uniqueStrings([
    ...categoryHypotheses.flatMap(({ categoryIds }) => categoryIds),
    ...scenarioHypotheses.flatMap(({ categoryIds }) => categoryIds),
  ]);
  const acceptedCategories = acceptedCategoryIds.flatMap((id) => {
    const category = evidenceCategories.get(id);
    return category
      ? [{
          id: category.id,
          label: category.label,
          path: [...category.path],
          evidenceCount: category.productCount,
        }]
      : [];
  });
  const acceptedIdSet = new Set(acceptedCategoryIds);
  const catalogEvidenceRefs = acceptedCategories.map((category) => ({
    id: `catalog-category:${category.id}`,
    source: "catalog-category" as const,
    label: category.label,
    count: category.evidenceCount,
  }));
  const omittedCategoryCount = [...evidenceCategories.keys()]
    .filter((categoryId) => !usedCategoryIds.has(categoryId))
    .length;
  const warnings = uniqueStrings([
    ...resolution.proposalReview.warnings,
    ...(rejectedFields.some((field) => field.startsWith("categoryHypotheses"))
      ? ["Category hypotheses must reference one or more known, unused catalog leaf category IDs; invalid hypotheses were ignored."]
      : []),
    ...(rejectedFields.some((field) => field.startsWith("scenarioHypotheses"))
      ? ["Scenario hypotheses with unknown categories, duplicate goals, no distinct category evidence, or excess entries were ignored."]
      : []),
    ...(omittedCategoryCount > 0
      ? [`Category hypotheses omitted ${omittedCategoryCount} catalog ${omittedCategoryCount === 1 ? "category" : "categories"}; deterministic ProductSelection will restore ${omittedCategoryCount === 1 ? "it" : "them"} as ${omittedCategoryCount === 1 ? "a verified category group" : "verified category groups"}.`]
      : []),
  ]);

  return {
    intent: {
      ...resolution.intent,
      categories: [
        ...acceptedCategories,
        ...resolution.intent.categories.filter((category) => !acceptedIdSet.has(category.id)),
      ],
      categoryHypotheses,
      scenarioHypotheses,
      conditions: uniqueStrings([
        ...resolution.intent.conditions,
        ...scenarioHypotheses.map(({ name }) => name),
      ]),
      searchTerms: uniqueStrings([
        ...resolution.intent.searchTerms,
        ...acceptedCategories.map(({ label }) => label),
      ]),
      evidenceRefs: uniqueEvidenceRefs([
        ...resolution.intent.evidenceRefs,
        ...catalogEvidenceRefs,
      ]),
    },
    proposalReview: {
      status: reviewStatus(acceptedFields, rejectedFields),
      acceptedFields,
      rejectedFields,
      warnings,
    },
  };
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
  const baseResolution = scenarioResolution(snapshot, intent, proposal, phrases) ??
    reviewAgainstBase(intent, proposal, phrases);
  const resolution = reviewSemanticHypotheses(snapshot, proposal, baseResolution);
  return {
    ...resolution,
    intent: completeConstraintCoverage(resolution.intent),
  };
}

function topicIntentAgentRun(
  snapshot: YamiSearchSnapshot,
  intent: ThemeIntent,
  language: ContentLanguage,
): TopicIntentAgentRun {
  return {
    schemaVersion: "topic-intent-agent-run/v1",
    status: "needs-semantic-proposal",
    context: {
      keyword: snapshot.keyword,
      site: snapshot.site,
      language,
      intent,
      categories: (snapshot.evidence?.categories ?? [])
        .filter(({ productCount }) => productCount > 0)
        .map(({ id, label, path, productCount }) => ({
          id,
          label,
          path: [...path],
          productCount,
        })),
      representativeProducts: snapshot.products.map((product) => ({
        id: product.id,
        title: product.title,
        brand: product.brand,
        ...(product.categoryL3Id !== undefined
          ? { categoryId: String(product.categoryL3Id) }
          : {}),
        ...(product.categoryL3Name ? { categoryLabel: product.categoryL3Name } : {}),
      })),
    },
  };
}

export async function runTopicIntentAgentWorkflow(
  request: TopicIntentAgentWorkflowRequest,
): Promise<TopicIntentAgentWorkflowResult> {
  const fallback = (
    issues: string[],
    agent: TopicIntentRuntimeEvidence["agent"],
    proposalReview: SemanticProposalReview = request.proposalReview,
  ): TopicIntentAgentWorkflowResult => ({
    snapshot: request.snapshot,
    intent: request.intent,
    proposalReview,
    runtime: {
      mode: "catalog-fallback",
      status: "fallback",
      agent,
      proposalReview,
      categoryHypothesisCount: request.intent.categoryHypotheses?.length ?? 0,
      scenarioHypothesisCount: request.intent.scenarioHypotheses?.length ?? 0,
      issues,
    },
  });

  if (!request.agent) {
    return fallback([], { status: "missing" });
  }

  try {
    const proposal = parseSemanticProposal(
      await request.agent.proposeSemanticIntent(
        topicIntentAgentRun(request.snapshot, request.intent, request.language),
      ),
    );
    const resolution = resolveTopicIntent(request.snapshot, proposal);
    const categoryHypothesisCount = resolution.intent.categoryHypotheses?.length ?? 0;
    const scenarioHypothesisCount = resolution.intent.scenarioHypotheses?.length ?? 0;
    if (categoryHypothesisCount === 0 && scenarioHypothesisCount === 0) {
      return fallback(
        ["TopicIntent Agent proposal produced no accepted category or scenario hypotheses."],
        { status: "ready", id: request.agent.id },
        resolution.proposalReview,
      );
    }
    return {
      intent: resolution.intent,
      snapshot: { ...request.snapshot, intent: resolution.intent },
      proposalReview: resolution.proposalReview,
      runtime: {
        mode: "automatic",
        status: "ready",
        agent: { status: "ready", id: request.agent.id },
        proposalReview: resolution.proposalReview,
        categoryHypothesisCount,
        scenarioHypothesisCount,
        issues: [],
      },
    };
  } catch (error) {
    return fallback(
      [error instanceof Error ? error.message : "TopicIntent Agent failed."],
      { status: "ready", id: request.agent.id },
    );
  }
}
