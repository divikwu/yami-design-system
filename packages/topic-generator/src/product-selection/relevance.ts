import type { YamiProduct, YamiSearchSnapshot } from "../types.js";
import type { ProductSelectionResult } from "./contracts.js";
import type { RelevanceStrategyConfig } from "./config.js";

const PRIMARY_LIMIT = 18;
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
    matchesKeyword(product, snapshot.keyword)
  );
  const minimumDirectCount = Math.min(6, products.length);
  const primarySource = directProducts.length < minimumDirectCount
    ? products.slice(0, 12)
    : directProducts;
  const primary = primarySource.slice(0, PRIMARY_LIMIT);
  const primaryIds = new Set(primary.map((product) => product.id));
  const related = products
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
    selectedCategories: [],
    scenes: [],
    modules: [],
  };
}
