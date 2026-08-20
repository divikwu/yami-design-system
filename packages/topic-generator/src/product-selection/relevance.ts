import type {
  ProductRole,
  ThemeIntent,
  YamiProduct,
  YamiSearchSnapshot,
} from "../types.js";
import type {
  ProductSelectionModuleGroup,
  ProductSelectionResult,
} from "./contracts.js";
import type { RelevanceStrategyConfig } from "./config.js";

const RELATED_LIMIT = 6;
const SCENARIO_FALLBACK_PRIMARY_LIMIT = 20;

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function keywordTerms(keyword: string) {
  return normalized(keyword)
    .split(" ")
    .filter((term) => term.length > 1);
}

function matchesKeyword(product: YamiProduct, keyword: string) {
  const haystack = normalized([
    product.brand,
    product.title,
    ...(product.searchAliases ?? []),
  ].join(" "));
  const phrase = normalized(keyword);
  const terms = keywordTerms(keyword);
  return Boolean(
    phrase && (haystack.includes(phrase) || terms.some((term) => haystack.includes(term))),
  );
}

function containsTerm(product: YamiProduct, term: string) {
  const haystack = normalized([
    product.brand,
    product.title,
    product.categoryL1Name,
    product.categoryL2Name,
    product.categoryL3Name,
    ...(product.searchAliases ?? []),
  ].filter(Boolean).join(" "));
  const candidate = normalized(term);
  return Boolean(candidate && haystack.includes(candidate));
}

function matchesIntent(product: YamiProduct, keyword: string, intent?: ThemeIntent) {
  if (!intent) return matchesKeyword(product, keyword);
  if (intent.mustExclude.some((term) => containsTerm(product, term))) return false;

  const supportsUnverifiedModifiers = intent.constraints
    .filter(({ kind, status }) => kind === "modifier" && status === "unverified")
    .every(({ value }) => containsTerm(product, value));
  if (!supportsUnverifiedModifiers) return false;

  const canonicalId = intent.canonicalEntity?.id;
  const canonicalLabel = intent.canonicalEntity?.label;
  if (intent.entityType === "brand" && intent.canonicalEntity) {
    return (canonicalId && String(product.brandId ?? "") === canonicalId) ||
      (canonicalLabel ? normalized(product.brand) === normalized(canonicalLabel) : false);
  }
  if (intent.entityType === "category" && intent.canonicalEntity) {
    return [product.categoryL1Id, product.categoryL2Id, product.categoryL3Id]
      .some((id) => canonicalId && String(id ?? "") === canonicalId) ||
      [product.categoryL1Name, product.categoryL2Name, product.categoryL3Name]
        .some((label) => canonicalLabel && normalized(label ?? "") === normalized(canonicalLabel));
  }
  const categoryIds = new Set(intent.categories.map(({ id }) => id));
  if (categoryIds.has(String(product.categoryL3Id ?? ""))) return true;
  return matchesKeyword(product, keyword);
}

function intentThemeSelection(
  products: YamiProduct[],
  snapshot: YamiSearchSnapshot,
  config: RelevanceStrategyConfig,
) {
  const policy = config.themeCollections;
  const intent = snapshot.intent;
  if (!policy || !intent || intent.decision.status !== "resolved") return null;

  const categories = intent.categories.flatMap((category) => {
    const categoryProducts = products
      .filter((product) => String(product.categoryL3Id ?? "") === category.id)
      .sort((left, right) => left.sourceRank - right.sourceRank)
      .slice(0, policy.maximumProducts);
    return categoryProducts.length >= policy.minimumProducts
      ? [{ category, products: categoryProducts }]
      : [];
  }).slice(0, policy.maximumThemes);
  if (categories.length < policy.minimumThemes) return null;

  const groups = categories.map(({ category, products: categoryProducts }) => ({
    id: `theme-${category.id}`,
    label: category.label,
    role: "core" as const,
    productIds: categoryProducts.map(({ id }) => id),
  }));
  const primary = categories.flatMap(({ products: categoryProducts }) => categoryProducts);
  return {
    primary,
    selectedCategories: categories.map(({ category }) => ({
      id: category.id,
      label: category.label,
      path: [...category.path],
      role: "core" as const,
      reason: `Verified ThemeIntent category with at least ${policy.minimumProducts} Yami products.`,
    })),
    scenes: groups.map((group) => ({
      id: group.id,
      name: group.label,
      title: group.label,
      description: `Catalog-backed ${group.label} theme for ${snapshot.keyword}.`,
      productGroups: group.productIds.map((productId) => ({
        core: productId,
        pairing: null,
        accessory: null,
      })),
    })),
    module: {
      id: "start-here" as const,
      productIds: primary.map(({ id }) => id),
      groups,
    },
  };
}

interface SemanticGroupSource {
  id: string;
  label: string;
  role: ProductRole;
  categoryIds: string[];
}

function compileSemanticGroups(
  products: YamiProduct[],
  sources: SemanticGroupSource[],
  minimumProducts: number,
  maximumThemes: number,
  maximumProducts?: number,
) {
  const assigned = new Set<string>();
  const groups: ProductSelectionModuleGroup[] = [];
  const categoryIds = new Set<string>();

  for (const source of sources) {
    if (groups.length >= maximumThemes) break;
    const sourceCategoryIds = new Set(source.categoryIds);
    const candidates = products
      .filter((product) =>
        sourceCategoryIds.has(String(product.categoryL3Id ?? "")) &&
        !assigned.has(product.id)
      )
      .sort((left, right) => left.sourceRank - right.sourceRank);
    const selected = maximumProducts === undefined
      ? candidates
      : candidates.slice(0, maximumProducts);
    if (selected.length < minimumProducts) continue;

    selected.forEach(({ id }) => assigned.add(id));
    source.categoryIds.forEach((id) => categoryIds.add(id));
    groups.push({
      id: source.id,
      label: source.label,
      role: source.role,
      productIds: selected.map(({ id }) => id),
    });
  }

  return { groups, categoryIds };
}

function semanticIntentThemeSelection(
  products: YamiProduct[],
  snapshot: YamiSearchSnapshot,
  config: RelevanceStrategyConfig,
) {
  const policy = config.themeCollections;
  const intent = snapshot.intent;
  if (!policy || !intent || intent.decision.status !== "resolved") return null;

  const catalogSources: SemanticGroupSource[] = intent.categories.map((category) => ({
    id: `theme-${category.id}`,
    label: category.label,
    role: "core",
    categoryIds: [category.id],
  }));
  const categorySources: SemanticGroupSource[] = (intent.categoryHypotheses ?? []).map(
    (hypothesis, index) => ({
      id: `category-hypothesis-${index + 1}`,
      label: hypothesis.label,
      role: hypothesis.role,
      categoryIds: hypothesis.categoryIds,
    }),
  );
  const scenarioSources: SemanticGroupSource[] = (intent.scenarioHypotheses ?? []).map(
    (hypothesis, index) => ({
      id: `scenario-hypothesis-${index + 1}`,
      label: hypothesis.name,
      role: "core",
      categoryIds: hypothesis.categoryIds,
    }),
  );
  const proposedShortcuts = compileSemanticGroups(
    products,
    categorySources,
    policy.minimumProducts,
    policy.maximumThemes,
  );
  const proposedStartHere = compileSemanticGroups(
    products,
    scenarioSources,
    policy.minimumProducts,
    policy.maximumThemes,
    policy.maximumProducts,
  );
  const fallbackShortcuts = compileSemanticGroups(
    products,
    catalogSources,
    policy.minimumProducts,
    policy.maximumThemes,
  );
  const fallbackStartHere = compileSemanticGroups(
    products,
    catalogSources,
    policy.minimumProducts,
    policy.maximumThemes,
    policy.maximumProducts,
  );
  const shortcuts = proposedShortcuts.groups.length >= policy.minimumThemes
    ? proposedShortcuts
    : fallbackShortcuts;
  const startHere = proposedStartHere.groups.length >= policy.minimumThemes
    ? proposedStartHere
    : fallbackStartHere;
  if (
    shortcuts.groups.length < policy.minimumThemes ||
    startHere.groups.length < policy.minimumThemes
  ) return null;

  const selectedCategoryIds = new Set([
    ...shortcuts.categoryIds,
    ...startHere.categoryIds,
  ]);
  const selectedCategories = intent.categories.flatMap((category) =>
    selectedCategoryIds.has(category.id)
      ? [{
          id: category.id,
          label: category.label,
          path: [...category.path],
          role: "core" as const,
          reason: "Verified ThemeIntent category used by deterministic semantic grouping.",
        }]
      : [],
  );
  const startHereProductIds = startHere.groups.flatMap(({ productIds }) => productIds);

  return {
    primary: products,
    selectedCategories,
    scenes: startHere.groups.map((group) => ({
      id: group.id,
      name: group.label,
      title: group.label,
      description: `Catalog-verified ${group.label} theme for ${snapshot.keyword}.`,
      productGroups: group.productIds.map((productId) => ({
        core: productId,
        pairing: null,
        accessory: null,
      })),
    })),
    modules: [
      {
        id: "shortcuts" as const,
        productIds: shortcuts.groups.flatMap(({ productIds }) => productIds),
        groups: shortcuts.groups,
      },
      {
        id: "start-here" as const,
        productIds: startHereProductIds,
        groups: startHere.groups,
      },
    ],
  };
}

export function selectByRelevance(
  snapshot: YamiSearchSnapshot,
  config: RelevanceStrategyConfig,
): ProductSelectionResult {
  const seenProductIds = new Set<string>();
  const products = snapshot.products.filter((product) => {
    if (seenProductIds.has(product.id)) return false;
    seenProductIds.add(product.id);
    return true;
  });
  const directProducts = products.filter((product) =>
    matchesIntent(product, snapshot.keyword, snapshot.intent)
  );
  const hasResolvedIntent = snapshot.intent?.decision.status === "resolved";
  const hasReviewRequiredIntent = Boolean(
    snapshot.intent && snapshot.intent.decision.status !== "resolved",
  );
  const minimumDirectCount = Math.min(6, products.length);
  const primarySource = hasResolvedIntent
    ? directProducts
    : hasReviewRequiredIntent
    ? directProducts
    : directProducts.length < minimumDirectCount
    ? products.slice(0, 12)
    : directProducts;
  const themedSelection = config.semanticOrganization
    ? semanticIntentThemeSelection(primarySource, snapshot, config)
    : intentThemeSelection(primarySource, snapshot, config);
  const themedIds = new Set(themedSelection?.primary.map(({ id }) => id) ?? []);
  const usesSingleCategoryScenarioFallback = !themedSelection &&
    snapshot.intent?.themeType === "activity" &&
    snapshot.intent.entityType === "scenario" &&
    snapshot.intent.decision.status === "resolved";
  const primary = themedSelection
    ? [
        ...themedSelection.primary,
        ...primarySource.filter(({ id }) => !themedIds.has(id)),
      ]
    : usesSingleCategoryScenarioFallback
      ? primarySource.slice(0, SCENARIO_FALLBACK_PRIMARY_LIMIT)
      : primarySource;
  const primaryIds = new Set(primary.map((product) => product.id));
  const related = (hasResolvedIntent ? directProducts : products)
    .filter((product) => !primaryIds.has(product.id))
    .slice(0, RELATED_LIMIT);

  return {
    schemaVersion: "product-selection-result/v1",
    strategyRef: config.ref,
    keyword: snapshot.keyword,
    site: snapshot.site,
    selectedAt: snapshot.fetchedAt,
    pools: {
      primaryIds: primary.map((product) => product.id),
      relatedIds: related.map((product) => product.id),
    },
    products: [
      ...primary.map((product) => ({ ...product, pool: "primary" as const, role: "core" as const })),
      ...related.map((product) => ({ ...product, pool: "related" as const, role: "pairing" as const })),
    ],
    selectedCategories: themedSelection?.selectedCategories ?? [],
    scenes: themedSelection?.scenes ?? [],
    modules: themedSelection
      ? "modules" in themedSelection
        ? themedSelection.modules
        : [themedSelection.module]
      : [],
  };
}
