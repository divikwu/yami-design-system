import type {
  ProductRole,
  ThemeIntent,
  YamiProduct,
  YamiSearchSnapshot,
} from "../types.js";
import type {
  ProductSelectionModuleGroup,
  ProductSelectionModuleResult,
  ProductSelectionResult,
  ProductSemanticProposalReview,
} from "./contracts.js";
import type { RelevanceStrategyConfig } from "./config.js";

const RELATED_LIMIT = 6;
const SCENARIO_FALLBACK_PRIMARY_LIMIT = 20;
const BRAND_SPOTLIGHT_MINIMUM_BRANDS = 2;
const BRAND_SPOTLIGHT_MAXIMUM_BRANDS = 6;
const BRAND_SPOTLIGHT_PRODUCTS_PER_BRAND = 3;
const POPULAR_PICKS_MINIMUM_PRODUCTS = 6;
const POPULAR_PICKS_MAXIMUM_PRODUCTS = 12;

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

function weeklySalesLowerBound(product: YamiProduct) {
  const quantity = product.weeklySalesLabel?.match(/[\d,]+/)?.[0];
  if (!quantity) return -1;
  const value = Number(quantity.replaceAll(",", ""));
  return Number.isFinite(value) ? value : -1;
}

function brandSpotlightModule(products: YamiProduct[]): ProductSelectionModuleResult {
  const brands = new Map<string, { id: string; label: string; products: YamiProduct[] }>();
  products.forEach((product) => {
    const normalizedBrand = normalized(product.brand);
    if (!normalizedBrand) return;
    const key = product.brandId ? `id:${product.brandId}` : `label:${normalizedBrand}`;
    const candidate = brands.get(key) ?? {
      id: product.brandId ? `brand-${product.brandId}` : `brand-${normalizedBrand.replaceAll(" ", "-")}`,
      label: product.brand.trim(),
      products: [],
    };
    candidate.products.push(product);
    brands.set(key, candidate);
  });

  const ranked = [...brands.values()]
    .filter(({ products: brandProducts }) =>
      brandProducts.length >= BRAND_SPOTLIGHT_PRODUCTS_PER_BRAND
    )
    .map((brand) => ({
      ...brand,
      products: [...brand.products].sort((left, right) =>
        (right.soldCount ?? weeklySalesLowerBound(right)) -
          (left.soldCount ?? weeklySalesLowerBound(left)) ||
        left.sourceRank - right.sourceRank ||
        left.id.localeCompare(right.id)
      ),
    }))
    .sort((left, right) =>
      right.products.length - left.products.length ||
      (right.products[0]?.soldCount ?? weeklySalesLowerBound(right.products[0]!)) -
        (left.products[0]?.soldCount ?? weeklySalesLowerBound(left.products[0]!)) ||
      (left.products[0]?.sourceRank ?? Number.MAX_SAFE_INTEGER) -
        (right.products[0]?.sourceRank ?? Number.MAX_SAFE_INTEGER) ||
      left.label.localeCompare(right.label)
    )
    .slice(0, BRAND_SPOTLIGHT_MAXIMUM_BRANDS);

  if (ranked.length < BRAND_SPOTLIGHT_MINIMUM_BRANDS) {
    return { id: "brand-spotlight", productIds: [], groups: [] };
  }
  const groups = ranked.map<ProductSelectionModuleGroup>((brand) => ({
    id: brand.id,
    label: brand.label,
    role: "core",
    productIds: brand.products
      .slice(0, BRAND_SPOTLIGHT_PRODUCTS_PER_BRAND)
      .map(({ id }) => id),
  }));
  return {
    id: "brand-spotlight",
    productIds: groups.flatMap(({ productIds }) => productIds),
    groups,
  };
}

function relevanceCommerceModules(
  products: YamiProduct[],
  modules: ProductSelectionModuleResult[],
): ProductSelectionModuleResult[] {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const rankedProductIds = (productIds: string[]) => productIds
    .flatMap((id) => {
      const product = productsById.get(id);
      return product ? [product] : [];
    })
    .sort((left, right) =>
      weeklySalesLowerBound(right) - weeklySalesLowerBound(left) ||
      left.sourceRank - right.sourceRank
    )
    .slice(0, POPULAR_PICKS_MAXIMUM_PRODUCTS)
    .map(({ id }) => id);
  const allProductIds = rankedProductIds(products.map(({ id }) => id));
  const shortcutGroups = modules.find(({ id }) => id === "shortcuts")?.groups ?? [];
  const popularGroups: ProductSelectionModuleGroup[] = allProductIds.length <
      POPULAR_PICKS_MINIMUM_PRODUCTS
    ? []
    : [
        {
          id: "popular-picks-all",
          label: "All",
          role: "core",
          productIds: allProductIds,
        },
        ...shortcutGroups.flatMap((group) => {
          const productIds = rankedProductIds(group.productIds);
          return productIds.length >= POPULAR_PICKS_MINIMUM_PRODUCTS
            ? [{ ...group, productIds }]
            : [];
        }),
      ];
  const popularProductIds = [...new Set(
    popularGroups.flatMap(({ productIds }) => productIds),
  )];

  return [
    { id: "popular-picks", productIds: popularProductIds, groups: popularGroups },
    {
      id: "explore-more",
      productIds: products.map(({ id }) => id),
      groups: shortcutGroups.map((group) => ({
        ...group,
        productIds: [...group.productIds],
      })),
    },
  ];
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
  classificationReason?: string;
  shoppingGoal?: string;
  scenarioReason?: string;
  semanticSource?: "agent-proposal" | "catalog-fallback";
}

function compileSemanticGroups(
  products: YamiProduct[],
  sources: SemanticGroupSource[],
  minimumProducts: number,
  maximumThemes: number | undefined,
  maximumProducts?: number,
  balanceCategoryCoverage = false,
) {
  const assigned = new Set<string>();
  const groups: ProductSelectionModuleGroup[] = [];
  const categoryIds = new Set<string>();

  for (const source of sources) {
    if (maximumThemes !== undefined && groups.length >= maximumThemes) break;
    const sourceCategoryIds = new Set(source.categoryIds);
    const candidates = products
      .filter((product) =>
        sourceCategoryIds.has(String(product.categoryL3Id ?? "")) &&
        !assigned.has(product.id)
      )
      .sort((left, right) => left.sourceRank - right.sourceRank);
    const selected = maximumProducts === undefined
      ? candidates
      : balanceCategoryCoverage
        ? (() => {
            const queues = source.categoryIds.map((categoryId) =>
              candidates.filter((product) => String(product.categoryL3Id ?? "") === categoryId)
            );
            const balanced: YamiProduct[] = [];
            while (
              balanced.length < maximumProducts &&
              queues.some((queue) => queue.length > 0)
            ) {
              for (const queue of queues) {
                const next = queue.shift();
                if (next) balanced.push(next);
                if (balanced.length >= maximumProducts) break;
              }
            }
            return balanced.sort((left, right) => left.sourceRank - right.sourceRank);
          })()
        : candidates.slice(0, maximumProducts);
    if (selected.length < minimumProducts) continue;

    selected.forEach(({ id }) => assigned.add(id));
    source.categoryIds.forEach((id) => categoryIds.add(id));
    groups.push({
      id: source.id,
      label: source.label,
      role: source.role,
      productIds: selected.map(({ id }) => id),
      sourceCategoryIds: [...source.categoryIds],
      ...(source.classificationReason
        ? { classificationReason: source.classificationReason }
        : {}),
      ...(source.shoppingGoal ? { shoppingGoal: source.shoppingGoal } : {}),
      ...(source.scenarioReason ? { scenarioReason: source.scenarioReason } : {}),
      ...(source.semanticSource ? { semanticSource: source.semanticSource } : {}),
    });
  }

  return { groups, categoryIds };
}

function completeShortcutCoverage(
  products: YamiProduct[],
  result: ReturnType<typeof compileSemanticGroups>,
) {
  const assignedIds = new Set(result.groups.flatMap(({ productIds }) => productIds));
  const unassignedProducts = products.filter(({ id }) => !assignedIds.has(id));
  if (unassignedProducts.length === 0) return result;

  return {
    groups: [
      ...result.groups,
      {
        id: "theme-more-to-explore",
        label: "More to Explore",
        role: "core" as const,
        productIds: unassignedProducts.map(({ id }) => id),
        sourceCategoryIds: [],
      },
    ],
    categoryIds: result.categoryIds,
  };
}

function withShortcutClassification(
  result: ReturnType<typeof compileSemanticGroups>,
  sources: SemanticGroupSource[],
) {
  const sourcesById = new Map(sources.map((source) => [source.id, source]));
  return {
    ...result,
    groups: result.groups.map((group) => {
      const source = sourcesById.get(group.id);
      return source
        ? {
            ...group,
            sourceCategoryIds: [...source.categoryIds],
            ...(source.classificationReason
              ? { classificationReason: source.classificationReason }
              : {}),
          }
        : group;
    }),
  };
}

function assertCompleteShortcutCoverage(
  products: YamiProduct[],
  groups: ProductSelectionModuleGroup[],
) {
  const expectedIds = new Set(products.map(({ id }) => id));
  const groupedIds = groups.flatMap(({ productIds }) => productIds);
  const uniqueGroupedIds = new Set(groupedIds);
  if (
    groupedIds.length !== expectedIds.size ||
    uniqueGroupedIds.size !== expectedIds.size ||
    groupedIds.some((id) => !expectedIds.has(id))
  ) {
    throw new Error("Shortcuts must assign every PrimaryPool product to exactly one group.");
  }
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
    semanticSource: "catalog-fallback",
  }));
  const categorySources: SemanticGroupSource[] = (intent.categoryHypotheses ?? []).flatMap(
    (hypothesis, index) => hypothesis.categoryIds.length > 0
      ? [{
          id: `category-hypothesis-${index + 1}`,
          label: hypothesis.label,
          role: hypothesis.role,
          categoryIds: hypothesis.categoryIds,
          classificationReason: hypothesis.reason,
          semanticSource: "agent-proposal",
        }]
      : [],
  );
  const proposedCategoryIds = new Set(categorySources.flatMap(({ categoryIds }) => categoryIds));
  const completeCategorySources = categorySources.length > 0
    ? [
        ...categorySources,
        ...catalogSources.filter(({ categoryIds }) =>
          categoryIds.some((categoryId) => !proposedCategoryIds.has(categoryId))
        ),
      ]
    : [];
  const scenarioSources: SemanticGroupSource[] = (intent.scenarioHypotheses ?? []).map(
    (hypothesis, index) => ({
      id: `scenario-hypothesis-${index + 1}`,
      label: hypothesis.name,
      role: "core",
      categoryIds: hypothesis.categoryIds,
      shoppingGoal: hypothesis.shoppingGoal,
      scenarioReason: hypothesis.reason,
      semanticSource: "agent-proposal",
    }),
  );
  const shortcutMinimumProducts = policy.minimumShortcutProducts ?? policy.minimumProducts;
  const shortcutMaximumThemes = policy.maximumShortcutThemes === null
    ? undefined
    : policy.maximumShortcutThemes ?? policy.maximumThemes;
  const proposedShortcuts = completeShortcutCoverage(
    products,
    withShortcutClassification(
      compileSemanticGroups(
        products,
        completeCategorySources,
        shortcutMinimumProducts,
        shortcutMaximumThemes,
      ),
      completeCategorySources,
    ),
  );
  const proposedStartHere = compileSemanticGroups(
    products,
    scenarioSources,
    policy.minimumProducts,
    policy.maximumThemes,
    policy.maximumProducts,
    true,
  );
  const fallbackShortcuts = completeShortcutCoverage(
    products,
    withShortcutClassification(
      compileSemanticGroups(
        products,
        catalogSources,
        shortcutMinimumProducts,
        shortcutMaximumThemes,
      ),
      catalogSources,
    ),
  );
  const fallbackStartHere = compileSemanticGroups(
    products,
    catalogSources,
    policy.minimumProducts,
    policy.maximumThemes,
    policy.maximumProducts,
    true,
  );
  const shortcuts = proposedShortcuts.groups.length >= policy.minimumThemes
    ? proposedShortcuts
    : fallbackShortcuts;
  const startHere = proposedStartHere.groups.length >= policy.minimumThemes
    ? proposedStartHere
    : fallbackStartHere.groups.length >= policy.minimumThemes
      ? fallbackStartHere
      : { groups: [], categoryIds: new Set<string>() };
  if (shortcuts.groups.length < policy.minimumThemes) return null;
  assertCompleteShortcutCoverage(products, shortcuts.groups);

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
      title: group.shoppingGoal ?? group.label,
      description: group.scenarioReason ??
        `Catalog-verified ${group.label} theme for ${snapshot.keyword}.`,
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

function productSemanticThemeSelection(
  products: YamiProduct[],
  snapshot: YamiSearchSnapshot,
  config: RelevanceStrategyConfig,
  review: ProductSemanticProposalReview,
) {
  const policy = config.themeCollections;
  const intent = snapshot.intent;
  if (!policy || review.status !== "accepted") return null;
  const productsById = new Map(products.map((product) => [product.id, product]));
  const orderedIds = (ids: string[]) => ids
    .map((id) => productsById.get(id))
    .filter((product): product is YamiProduct => Boolean(product))
    .sort((left, right) => left.sourceRank - right.sourceRank)
    .map(({ id }) => id);
  const sourceCategoryIds = (ids: string[]) => [...new Set(ids.flatMap((id) => {
    const categoryId = productsById.get(id)?.categoryL3Id;
    return categoryId === undefined ? [] : [String(categoryId)];
  }))];
  const shortcutGroups: ProductSelectionModuleGroup[] = review.groups.map((group) => ({
    id: group.id,
    label: group.label,
    role: "core",
    productIds: orderedIds(group.productIds),
    sourceCategoryIds: sourceCategoryIds(group.productIds),
    classificationReason: group.reason,
    semanticSource: "agent-proposal",
  }));
  assertCompleteShortcutCoverage(products, shortcutGroups);

  const groupsById = new Map(review.groups.map((group) => [group.id, group]));
  const assignedSceneIds = new Set<string>();
  const startHereGroups: ProductSelectionModuleGroup[] = review.scenes.map((scene) => {
    const candidateIds = orderedIds(scene.groupIds.flatMap((groupId) =>
      groupsById.get(groupId)?.productIds ?? []
    )).filter((id) => !assignedSceneIds.has(id));
    const productIds = candidateIds.slice(0, policy.maximumProducts);
    productIds.forEach((id) => assignedSceneIds.add(id));
    return {
      id: scene.id,
      label: scene.name,
      role: "core" as const,
      productIds,
      sourceCategoryIds: sourceCategoryIds(productIds),
      shoppingGoal: scene.shoppingGoal,
      scenarioReason: scene.reason,
      semanticSource: "agent-proposal" as const,
    };
  });
  const startHereProductIds = startHereGroups.flatMap(({ productIds }) => productIds);

  return {
    primary: products,
    selectedCategories: intent
      ? intent.categories.map((category) => ({
          id: category.id,
          label: category.label,
          path: [...category.path],
          role: "core" as const,
          reason: "Verified ThemeIntent category represented by Agent-reviewed product semantics.",
        }))
      : [...new Map(products.flatMap((product) => {
          const id = product.categoryL3Id;
          const label = product.categoryL3Name;
          if (id === undefined || !label) return [];
          const categoryId = String(id);
          const path = [
            product.categoryL1Name,
            product.categoryL2Name,
            product.categoryL3Name,
          ].filter((value): value is string => Boolean(value));
          return [[categoryId, {
            id: categoryId,
            label,
            path,
            role: "core" as const,
            reason: "Verified catalog category represented by Agent-reviewed product semantics.",
          }]] as const;
        })).values()],
    scenes: startHereGroups.map((group) => ({
      id: group.id,
      name: group.label,
      title: group.shoppingGoal ?? group.label,
      description: group.scenarioReason ?? group.label,
      productGroups: group.productIds.map((productId) => ({
        core: productId,
        pairing: null,
        accessory: null,
      })),
    })),
    modules: [
      {
        id: "shortcuts" as const,
        productIds: shortcutGroups.flatMap(({ productIds }) => productIds),
        groups: shortcutGroups,
      },
      {
        id: "start-here" as const,
        productIds: startHereProductIds,
        groups: startHereGroups,
      },
    ],
  };
}

export function selectByRelevance(
  snapshot: YamiSearchSnapshot,
  config: RelevanceStrategyConfig,
  productSemanticReview?: ProductSemanticProposalReview,
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
  const catalogThemedSelection = config.semanticOrganization
    ? semanticIntentThemeSelection(primarySource, snapshot, config)
    : intentThemeSelection(primarySource, snapshot, config);
  const themedSelection = catalogThemedSelection ?? (
    productSemanticReview
      ? productSemanticThemeSelection(primarySource, snapshot, config, productSemanticReview)
      : null
  );
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
  const themedModules = themedSelection
    ? "modules" in themedSelection
      ? themedSelection.modules
      : [themedSelection.module]
    : [];

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
    modules: [
      ...themedModules,
      ...relevanceCommerceModules(primary, themedModules),
      brandSpotlightModule(primary),
    ],
  };
}
