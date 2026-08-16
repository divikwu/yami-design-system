import type {
  CatalogAttributeEvidence,
  CatalogBrandEvidence,
  CatalogCategoryEvidence,
  ThemeIntent,
  ThemeIntentCategory,
  YamiProduct,
  YamiSearchSnapshot,
} from "./types.js";
import { YAMI_SITE } from "./types.js";
import { buildYamiSearchUrl } from "./yami-search.js";

/** Structured Yami Adapter and catalog-evidence normalization. */

export interface CatalogCategoryNode {
  category_id?: number;
  category_name?: string;
  category_ename?: string;
  level?: number;
  result_count?: number;
  children?: CatalogCategoryNode[];
}

export interface CatalogBrand {
  brand_id?: number;
  brand_name?: string;
  brand_ename?: string;
  result_count?: number;
}

export interface CatalogTag {
  tag_id?: number;
  tag?: string;
  tag_eng?: string;
}

export interface CatalogItem {
  item_number?: string;
  goods_name?: string;
  goods_ename?: string;
  brand_id?: number;
  brand_name?: string;
  brand_ename?: string;
  category_l1_id?: number;
  category_l2_id?: number;
  category_l3_id?: number;
  image_url?: string;
  slug?: string;
  shop_price?: number;
  status?: string;
  goods_number?: number;
  sold_count?: number;
  rated?: number;
}

export interface CatalogResponse {
  messageId?: string;
  body?: {
    brandAgg?: CatalogBrand[];
    categoryAgg?: CatalogCategoryNode[];
    tagAgg?: CatalogTag[];
    items?: CatalogItem[];
  };
}

interface FlatCategory {
  id: number;
  label: string;
  aliases: string[];
  path: string[];
  resultCount: number;
}

interface MatchedAttribute {
  attribute: CatalogAttributeEvidence;
  label: string;
  overlap: string[];
  direct: boolean;
}

const SCENARIO_TERMS = [
  "storage",
  "organization",
  "organizing",
  "restock",
  "routine",
  "essentials",
  "gift",
  "holiday",
  "festival",
  "season",
  "收纳",
  "整理",
  "补给",
  "日常",
  "场景",
  "节日",
  "季节",
  "礼物",
  "组合",
] as const;

export interface YamiCatalogResult {
  snapshot: YamiSearchSnapshot;
  intent: ThemeIntent;
}

export class YamiCatalogError extends Error {
  readonly code: "request_failed" | "invalid_response" | "no_products";

  constructor(code: YamiCatalogError["code"], message: string) {
    super(message);
    this.name = "YamiCatalogError";
    this.code = code;
  }
}

const YAMI_CATALOG_URL = "https://ecapi.yami.com/ec-prebff/plp/getItemList";

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function uniqueStrings(values: Array<string | undefined>) {
  return values
    .map((value) => value?.trim() ?? "")
    .filter((value, index, all) =>
      value.length > 0 &&
      all.findIndex((candidate) => normalized(candidate) === normalized(value)) === index
    );
}

function categoryLabel(node: CatalogCategoryNode) {
  return node.category_ename?.trim() || node.category_name?.trim() || "";
}

function flattenCategories(
  nodes: CatalogCategoryNode[],
  parentPath: string[] = [],
): FlatCategory[] {
  return nodes.flatMap((node) => {
    const label = categoryLabel(node);
    const aliases = uniqueStrings([node.category_ename, node.category_name]);
    const path = label ? [...parentPath, label] : parentPath;
    const current = typeof node.category_id === "number" && label
      ? [{
          id: node.category_id,
          label,
          aliases,
          path,
          resultCount: node.result_count ?? 0,
        }]
      : [];
    return [...current, ...flattenCategories(node.children ?? [], path)];
  });
}

function absoluteImageUrl(value: string) {
  return new URL(value, "https://cdn.yamibuy.net").toString();
}

function productUrl(item: CatalogItem) {
  const slug = item.slug?.trim() || "product";
  return `https://www.yami.com/us/en/p/${slug}/${item.item_number}`;
}

function availableCatalogItems(items: CatalogItem[]) {
  return items.filter((item) =>
    item.item_number && item.goods_ename && item.image_url && item.status === "A" &&
    (item.goods_number ?? 1) > 0
  );
}

function catalogProducts(
  items: CatalogItem[],
  categories: FlatCategory[],
): YamiProduct[] {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  return items.map((item, index) => {
    const categoryL1 = categoryMap.get(item.category_l1_id ?? -1);
    const categoryL2 = categoryMap.get(item.category_l2_id ?? -1);
    const categoryL3 = categoryMap.get(item.category_l3_id ?? -1);
    return {
      id: item.item_number ?? "",
      title: item.goods_ename ?? item.goods_name ?? "Yami product",
      brand: item.brand_ename?.trim() || item.brand_name?.trim() || "Yami selection",
      price: typeof item.shop_price === "number" ? `$${item.shop_price.toFixed(2)}` : "",
      imageUrl: absoluteImageUrl(item.image_url ?? ""),
      productUrl: productUrl(item),
      sourceRank: index + 1,
      brandId: item.brand_id,
      categoryL1Id: item.category_l1_id,
      categoryL2Id: item.category_l2_id,
      categoryL3Id: item.category_l3_id,
      categoryL1Name: categoryL1?.label,
      categoryL2Name: categoryL2?.label,
      categoryL3Name: categoryL3?.label,
      soldCount: item.sold_count,
      rating: item.rated,
    } satisfies YamiProduct;
  });
}

export function parseYamiCatalogSnapshot(
  keyword: string,
  response: CatalogResponse,
): YamiSearchSnapshot {
  if (response.messageId !== "10000" || !response.body) {
    throw new Error("Yami catalog returned an invalid response.");
  }

  const categories = flattenCategories(response.body.categoryAgg ?? []);
  const items = availableCatalogItems(response.body.items ?? []);
  const productCounts = new Map<number, number>();
  items.forEach((item) => {
    if (typeof item.category_l3_id !== "number") return;
    productCounts.set(
      item.category_l3_id,
      (productCounts.get(item.category_l3_id) ?? 0) + 1,
    );
  });

  return {
    keyword,
    site: YAMI_SITE,
    sourceUrl: buildYamiSearchUrl(keyword),
    fetchedAt: new Date().toISOString(),
    provider: "yami-catalog-search",
    products: catalogProducts(items, categories),
    evidence: {
      brands: (response.body.brandAgg ?? []).flatMap<CatalogBrandEvidence>((brand) => {
        const aliases = uniqueStrings([brand.brand_ename, brand.brand_name]);
        if (aliases.length === 0) return [];
        return [{
          id: String(brand.brand_id ?? aliases[0]),
          label: aliases[0]!,
          aliases,
          resultCount: brand.result_count ?? 0,
        }];
      }),
      categories: categories.map<CatalogCategoryEvidence>((category) => ({
        id: String(category.id),
        label: category.label,
        aliases: category.aliases,
        path: category.path,
        resultCount: category.resultCount,
        productCount: productCounts.get(category.id) ?? 0,
      })),
      attributes: (response.body.tagAgg ?? []).flatMap<CatalogAttributeEvidence>((tag) => {
        const aliases = uniqueStrings([tag.tag_eng, tag.tag]);
        if (aliases.length === 0) return [];
        return [{
          id: String(tag.tag_id ?? aliases[0]),
          label: aliases[0]!,
          aliases,
        }];
      }),
    },
  };
}

function exactBrand(keyword: string, brands: CatalogBrandEvidence[]) {
  const query = normalized(keyword);
  return brands.find((brand) =>
    brand.aliases.some((alias) => normalized(alias) === query)
  );
}

function exactCategory(keyword: string, categories: CatalogCategoryEvidence[]) {
  const query = normalized(keyword);
  return categories.find((category) =>
    category.aliases.some((alias) => normalized(alias) === query)
  );
}

function isScenarioKeyword(keyword: string) {
  const query = normalized(keyword);
  return SCENARIO_TERMS.some((term) => query.includes(normalized(term)));
}

function matchedAttributes(
  keyword: string,
  attributes: CatalogAttributeEvidence[],
): MatchedAttribute[] {
  const query = normalized(keyword);
  const queryTerms = new Set(query.split(" ").filter((term) => term.length > 1));
  return attributes.flatMap<MatchedAttribute>((attribute) => {
    const matches = attribute.aliases.map((alias) => {
      const labelTerms = normalized(alias).split(" ").filter((term) => term.length > 1);
      const overlap = labelTerms.filter((term) => queryTerms.has(term));
      return { label: alias, overlap, direct: query.includes(normalized(alias)) };
    }).sort((left, right) =>
      Number(right.direct) - Number(left.direct) || right.overlap.length - left.overlap.length
    );
    const match = matches[0];
    if (!match || (!match.direct && match.overlap.length === 0)) return [];
    return [{ attribute, ...match }];
  }).sort((left, right) =>
    Number(right.direct) - Number(left.direct) || right.overlap.length - left.overlap.length
  );
}

function toIntentCategories(snapshot: YamiSearchSnapshot): ThemeIntentCategory[] {
  return (snapshot.evidence?.categories ?? [])
    .filter((category) => category.productCount > 0)
    .sort((left, right) =>
      right.productCount - left.productCount || right.resultCount - left.resultCount
    )
    .slice(0, 10)
    .map((category) => ({
      id: category.id,
      label: category.label,
      path: category.path,
      evidenceCount: category.productCount || category.resultCount,
    }));
}

function buildBrandIntent(
  keyword: string,
  brand: CatalogBrandEvidence,
  categories: ThemeIntentCategory[],
): ThemeIntent {
  const evidenceCount = categories.reduce(
    (total, category) => total + category.evidenceCount,
    0,
  );
  return {
    source: "catalog-evidence",
    themeType: "brand",
    catalogDomain: categories[0]?.path[0] ?? "catalog",
    attributeSchemaVersion: "catalog-v1",
    entityType: "brand",
    canonicalEntity: { id: brand.id, label: brand.label },
    shoppingIntent: "browse-brand",
    shoppingGoal: `Browse and compare ${brand.label} products available on Yami.`,
    needs: categories.map((category) => category.label),
    mustInclude: [brand.label],
    mustExclude: [],
    searchTerms: uniqueStrings([keyword, brand.label]),
    categories,
    reason: `The keyword exactly matches a catalog brand represented by ${evidenceCount} available products in the catalog snapshot.`,
    confidence: 0.95,
  };
}

function buildProductIntent(
  keyword: string,
  category: CatalogCategoryEvidence,
  categories: ThemeIntentCategory[],
): ThemeIntent {
  return {
    source: "catalog-evidence",
    themeType: "product",
    catalogDomain: category.path[0] ?? "catalog",
    attributeSchemaVersion: "catalog-v1",
    entityType: "category",
    canonicalEntity: { id: category.id, label: category.label },
    shoppingIntent: "find-product",
    shoppingGoal: `Find and compare ${category.label} products available on Yami.`,
    needs: category.path.slice(1),
    mustInclude: [category.label],
    mustExclude: [],
    searchTerms: uniqueStrings([keyword, category.label]),
    categories,
    reason: "The keyword exactly matches an enabled catalog category represented in the product results.",
    confidence: 0.92,
  };
}

function buildInferredProductIntent(
  keyword: string,
  category: ThemeIntentCategory,
  categories: ThemeIntentCategory[],
): ThemeIntent {
  return {
    source: "catalog-evidence",
    themeType: "product",
    catalogDomain: category.path[0] ?? "catalog",
    attributeSchemaVersion: "catalog-v1",
    entityType: "category",
    canonicalEntity: { id: category.id, label: category.label },
    shoppingIntent: "find-product",
    shoppingGoal: `Find ${keyword} products within the strongest matching catalog categories.`,
    needs: category.path.slice(1),
    mustInclude: [keyword],
    mustExclude: [],
    searchTerms: [keyword, category.label],
    categories,
    reason: "The keyword is not a canonical catalog label; the entity is inferred from the strongest category represented by available products.",
    confidence: 0.74,
  };
}

function buildScenarioIntent(
  keyword: string,
  categories: ThemeIntentCategory[],
): ThemeIntent {
  return {
    source: "catalog-evidence",
    themeType: "activity",
    catalogDomain: categories[0]?.path[0] ?? "catalog",
    attributeSchemaVersion: "catalog-v1",
    entityType: "scenario",
    canonicalEntity: {
      id: normalized(keyword).replace(/\s+/g, "-"),
      label: keyword,
    },
    shoppingIntent: "assemble-scenario",
    shoppingGoal: `Assemble products that collectively support ${keyword}.`,
    needs: categories.map((category) => category.label),
    mustInclude: [],
    mustExclude: [],
    searchTerms: [keyword, ...categories.map((category) => category.label)],
    categories,
    reason: "The keyword expresses a shopping scenario and the catalog results cover multiple product categories.",
    confidence: categories.length > 1 ? 0.84 : 0.72,
  };
}

function buildAttributeIntent(
  keyword: string,
  attributes: MatchedAttribute[],
  categories: ThemeIntentCategory[],
): ThemeIntent {
  const primaryAttribute = attributes.find((attribute) => attribute.direct);
  const constraints = [
    keyword,
    primaryAttribute?.label,
    ...attributes.flatMap((attribute) => attribute.overlap.map((term) =>
      term.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase())
    )),
  ];
  const mustInclude = uniqueStrings(constraints);

  return {
    source: "catalog-evidence",
    themeType: "product",
    catalogDomain: categories[0]?.path[0] ?? "catalog",
    attributeSchemaVersion: "catalog-v1",
    entityType: "attribute",
    canonicalEntity: primaryAttribute
      ? { id: `tag:${primaryAttribute.attribute.id}`, label: primaryAttribute.label }
      : {
          id: `attribute:${normalized(keyword).replace(/\s+/g, "-")}`,
          label: keyword,
        },
    shoppingIntent: "find-product",
    shoppingGoal: `Find products matching ${keyword} and verify the catalog constraints.`,
    needs: mustInclude,
    mustInclude,
    mustExclude: [],
    searchTerms: [keyword, ...mustInclude, ...categories.map((category) => category.label)],
    categories,
    reason: primaryAttribute
      ? "The keyword directly contains a catalog-backed attribute and is supported by product-category evidence."
      : "Catalog attributes only partially overlap the keyword, so the complete keyword remains an unverified product constraint.",
    confidence: primaryAttribute ? 0.82 : 0.68,
  };
}

export function resolveCatalogThemeIntent(snapshot: YamiSearchSnapshot): ThemeIntent {
  const evidence = snapshot.evidence;
  if (!evidence) {
    throw new Error("Structured catalog evidence is required to resolve ThemeIntent.");
  }

  const categories = toIntentCategories(snapshot);
  const brand = exactBrand(snapshot.keyword, evidence.brands);
  const category = exactCategory(snapshot.keyword, evidence.categories);
  const scenario = isScenarioKeyword(snapshot.keyword) && categories.length > 0;
  const attributes = matchedAttributes(snapshot.keyword, evidence.attributes);
  const inferredCategory = categories[0];
  if (!brand && !category && !scenario && attributes.length === 0 && !inferredCategory) {
    throw new Error("Catalog intent is not implemented for this keyword yet.");
  }

  return brand
    ? buildBrandIntent(snapshot.keyword, brand, categories)
    : category
      ? buildProductIntent(snapshot.keyword, category, categories)
      : scenario
        ? buildScenarioIntent(snapshot.keyword, categories)
        : attributes.length > 0
          ? buildAttributeIntent(snapshot.keyword, attributes, categories)
          : buildInferredProductIntent(snapshot.keyword, inferredCategory!, categories);
}

export function parseYamiCatalogResponse(
  keyword: string,
  response: CatalogResponse,
): YamiCatalogResult {
  const snapshot = parseYamiCatalogSnapshot(keyword, response);
  const intent = resolveCatalogThemeIntent(snapshot);
  return { intent, snapshot: { ...snapshot, intent } };
}

export function buildSearchFallbackIntent(
  keyword: string,
  products: YamiProduct[],
): ThemeIntent {
  const query = normalized(keyword);
  const matchingBrand = products.find((product) => normalized(product.brand) === query)?.brand;
  const isBrand = Boolean(matchingBrand);
  return {
    source: "search-fallback",
    themeType: isBrand ? "brand" : "uncertain",
    catalogDomain: "unknown",
    attributeSchemaVersion: "catalog-v1",
    entityType: isBrand ? "brand" : "unknown",
    canonicalEntity: matchingBrand
      ? { id: normalized(matchingBrand), label: matchingBrand }
      : null,
    shoppingIntent: isBrand ? "browse-brand" : "clarify",
    shoppingGoal: isBrand
      ? `Browse ${matchingBrand} products from the fallback search results.`
      : `Review fallback search results for ${keyword}.`,
    needs: [],
    mustInclude: [keyword],
    mustExclude: [],
    searchTerms: [keyword],
    categories: [],
    reason: "The structured catalog interface was unavailable, so the plan uses public search-page evidence and requires review.",
    confidence: isBrand ? 0.56 : 0.35,
  };
}

async function requestCatalog(keyword: string, categoryIds?: string[]) {
  let response: Response;
  try {
    response = await fetch(YAMI_CATALOG_URL, {
      method: "POST",
      cache: "no-store",
      headers: { "content-type": "application/json", token: "" },
      body: JSON.stringify({
        keywords: keyword.trim(),
        page_index: 1,
        page_size: 60,
        sort_by: 3,
        sort_order: 0,
        exclude_category_ids: "11",
        page_type: 3,
        oldCard: 1,
        recordSearchHistory: 0,
        ...(categoryIds && categoryIds.length > 0
          ? { category_ids: categoryIds.join(",") }
          : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new YamiCatalogError(
      "request_failed",
      "Yami catalog search is temporarily unreachable.",
    );
  }

  if (!response.ok) {
    throw new YamiCatalogError(
      "request_failed",
      `Yami catalog search returned HTTP ${response.status}.`,
    );
  }

  try {
    return await response.json() as CatalogResponse;
  } catch {
    throw new YamiCatalogError(
      "invalid_response",
      "Yami catalog search returned invalid JSON.",
    );
  }
}

function parseCatalogSnapshotOrThrow(keyword: string, response: CatalogResponse) {
  try {
    return parseYamiCatalogSnapshot(keyword, response);
  } catch (error) {
    throw new YamiCatalogError(
      "invalid_response",
      error instanceof Error
        ? error.message
        : "Yami catalog response could not be normalized.",
    );
  }
}

export async function fetchYamiCatalogSnapshot(
  keyword: string,
): Promise<YamiSearchSnapshot> {
  const broad = parseCatalogSnapshotOrThrow(keyword, await requestCatalog(keyword));
  if (broad.products.length === 0) {
    throw new YamiCatalogError(
      "no_products",
      "No currently available catalog products were found for this keyword.",
    );
  }

  const categoryIds = (broad.evidence?.categories ?? [])
    .filter((category) => category.productCount > 0)
    .sort((left, right) =>
      right.productCount - left.productCount || right.resultCount - left.resultCount
    )
    .map((category) => category.id);
  if (categoryIds.length === 0) return broad;

  try {
    const narrowed = parseCatalogSnapshotOrThrow(
      keyword,
      await requestCatalog(keyword, categoryIds),
    );
    if (narrowed.products.length > 0) {
      return { ...narrowed, evidence: broad.evidence };
    }
  } catch {
    // The broad CatalogSnapshot remains valid evidence when narrowing fails.
  }
  return broad;
}

export async function searchYamiCatalog(keyword: string): Promise<YamiCatalogResult> {
  const snapshot = await fetchYamiCatalogSnapshot(keyword);
  const intent = resolveCatalogThemeIntent(snapshot);
  return { intent, snapshot: { ...snapshot, intent } };
}
