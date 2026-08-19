import type { ThemeIntent, YamiProduct, YamiSearchSnapshot } from "../types.js";
import type { ProductSelectionResult } from "./contracts.js";
import type { RelevanceStrategyConfig } from "./config.js";

const RELATED_LIMIT = 6;

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function keywordTerms(keyword: string) {
  return normalized(keyword)
    .split(" ")
    .filter((term) => term.length > 1);
}

function matchesKeyword(product: YamiProduct, keyword: string) {
  const haystack = normalized(`${product.brand} ${product.title}`);
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
  ].filter(Boolean).join(" "));
  const candidate = normalized(term);
  return Boolean(candidate && haystack.includes(candidate));
}

function matchesIntent(product: YamiProduct, keyword: string, intent?: ThemeIntent) {
  if (!intent) return matchesKeyword(product, keyword);
  if (intent.mustExclude.some((term) => containsTerm(product, term))) return false;

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
  const minimumDirectCount = Math.min(6, products.length);
  const primarySource = hasResolvedIntent
    ? directProducts
    : directProducts.length < minimumDirectCount
    ? products.slice(0, 12)
    : directProducts;
  const themedSelection = intentThemeSelection(primarySource, snapshot, config);
  const themedIds = new Set(themedSelection?.primary.map(({ id }) => id) ?? []);
  const primary = themedSelection
    ? [
        ...themedSelection.primary,
        ...primarySource.filter(({ id }) => !themedIds.has(id)),
      ]
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
    modules: themedSelection ? [themedSelection.module] : [],
  };
}
