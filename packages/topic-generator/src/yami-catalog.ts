import type {
  CatalogAttributeEvidence,
  CatalogBrandEvidence,
  CatalogCategoryEvidence,
  CatalogSnapshotQualityReport,
  IntentEvidenceLevel,
  ThemeIntent,
  ThemeIntentCandidate,
  ThemeIntentCategory,
  ThemeIntentConstraint,
  ThemeIntentEvidenceRef,
  YamiProduct,
  YamiSearchSnapshot,
} from "./types.js";
import { YAMI_SITE } from "./types.js";
import {
  buildYamiSearchUrl,
  filterKeywordRelevantProducts,
} from "./yami-search.js";
import type {
  CatalogCandidateAdapter,
  CatalogCandidateQuery,
} from "./product-selection/candidates.js";

/** Structured Yami Adapter and catalog-evidence normalization. */

export interface CatalogCategoryNode {
  category_id?: number;
  category_name?: string;
  category_ename?: string;
  level?: number;
  result_count?: number;
  children?: CatalogCategoryNode[];
  [key: string]: unknown;
}

export interface CatalogBrand {
  brand_id?: number;
  brand_name?: string;
  brand_ename?: string;
  result_count?: number;
  [key: string]: unknown;
}

export interface CatalogTag {
  tag_id?: number;
  tag?: string;
  tag_eng?: string;
  [key: string]: unknown;
}

export interface CatalogItem {
  goods_id?: number;
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
  promotion_price?: number;
  seller_name?: string;
  seller_ename?: string;
  status?: string;
  goods_number?: number;
  sold_count?: number;
  rated?: number;
  marks?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CatalogResponse {
  messageId?: string;
  message?: string;
  body?: {
    page?: Record<string, unknown>;
    brandAgg?: CatalogBrand[];
    categoryAgg?: CatalogCategoryNode[];
    tagAgg?: CatalogTag[];
    items?: CatalogItem[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
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
  "party",
  "gathering",
  "movie night",
  "camping",
  "picnic",
  "travel essentials",
  "restock",
  "routine",
  "essentials",
  "gift",
  "holiday",
  "festival",
  "season",
  "收纳",
  "整理",
  "聚会",
  "露营",
  "野餐",
  "旅行必备",
  "补给",
  "日常",
  "场景",
  "节日",
  "季节",
  "礼物",
  "组合",
] as const;

const GENERIC_SCENARIO_MODIFIERS = [
  "summer",
  "winter",
  "spring",
  "fall",
  "autumn",
  "small",
  "daily",
  "everyday",
  "night",
  "essentials",
  "seasonal",
  "小户型",
  "日用",
  "日常",
  "夏季",
  "冬季",
  "春季",
  "秋季",
] as const;

const SCENARIO_TERM_EQUIVALENTS = [
  ["storage", "organization", "organizing", "收纳", "整理"],
  ["party", "gathering", "聚会"],
  ["camping", "露营"],
  ["picnic", "野餐"],
  ["travel essentials", "旅行必备"],
  ["restock", "replenish", "补给"],
  ["routine", "日常"],
  ["gift", "礼物"],
  ["holiday", "festival", "节日"],
  ["season", "季节"],
] as const;

const ATTRIBUTE_GENERIC_TERMS = new Set([
  "and",
  "for",
  "free",
  "no",
  "the",
  "with",
]);

const CATALOG_TERM_EQUIVALENTS_V1 = [
  ["爽肤水", "化妆水", "toner", "toners"],
  ["无糖", "0糖", "sugar free"],
  ["零食", "snack", "snacks"],
  ["收纳", "storage", "organization", "organizing"],
  ["厨房", "kitchen"],
  ["洗衣", "laundry"],
  ["补给", "restock", "replenish"],
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

export const YAMI_CATALOG_URL = "https://ecapi.yami.com/ec-prebff/plp/getItemList";

export const YAMI_CATALOG_SORT_BY = {
  date: 0,
  comment: 1,
  view: 2,
  featured: 3,
  price: 4,
  rating: 5,
  sold: 6,
  new: 7,
  gmv: 9,
} as const;

export type YamiCatalogSort = keyof typeof YAMI_CATALOG_SORT_BY;
export type YamiCatalogSortOrder = "ascending" | "descending";

export interface YamiCatalogSearchRequest {
  keywords: string;
  categoryIds?: string[];
  pageIndex?: number;
  pageSize?: number;
  sortBy?: YamiCatalogSort;
  sortOrder?: YamiCatalogSortOrder;
  isFby?: boolean;
  includeBooks?: boolean;
}

export interface YamiCatalogProviderOptions {
  fetch?: typeof fetch;
}

/** Lossless server-side access to the complete Yami catalog search surface. */
export async function searchYamiCatalogProvider(
  request: YamiCatalogSearchRequest,
  options: YamiCatalogProviderOptions = {},
): Promise<CatalogResponse> {
  const categoryIds = request.categoryIds?.map((id) => id.trim()).filter(Boolean) ?? [];
  const response = await (options.fetch ?? fetch)(YAMI_CATALOG_URL, {
    method: "POST",
    cache: "no-store",
    headers: { "content-type": "application/json", token: "" },
    body: JSON.stringify({
      keywords: request.keywords.trim(),
      page_index: request.pageIndex ?? 1,
      page_size: request.pageSize ?? 60,
      sort_by: YAMI_CATALOG_SORT_BY[request.sortBy ?? "featured"],
      sort_order: request.sortOrder === "ascending" ? 1 : 0,
      exclude_category_ids: request.includeBooks ? "" : "11",
      page_type: 3,
      oldCard: 1,
      recordSearchHistory: 0,
      ...(categoryIds.length > 0 ? { category_ids: categoryIds.join(",") } : {}),
      ...(request.isFby ? { is_fby: "1" } : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  });
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

function containsNonAscii(value: string) {
  return Array.from(value).some((character) =>
    (character.codePointAt(0) ?? 0) > 0x7f
  );
}

function expandedCategoryAliases(values: Array<string | undefined>) {
  const base = uniqueStrings(values);
  const segments = base.flatMap((value) =>
    value.split(/\s*(?:,|&|\/)\s*/u).filter(Boolean)
  );
  const headNouns = segments.flatMap((segment) => {
    if (containsNonAscii(segment)) return [];
    const tokens = segment.trim().split(/\s+/u);
    return tokens.length > 1 ? [tokens.at(-1)] : [];
  });
  return uniqueStrings([...base, ...segments, ...headNouns]);
}

const AMBIGUOUS_CANDIDATE_MARGIN = 0.1;

function evidenceLevel(score: number): IntentEvidenceLevel {
  if (score >= 0.9) return "high";
  if (score >= 0.7) return "medium";
  return "low";
}

function evidenceRef(
  source: ThemeIntentEvidenceRef["source"],
  id: string,
  label: string,
  count?: number,
): ThemeIntentEvidenceRef {
  return {
    id: `${source}:${id}`,
    source,
    label,
    ...(typeof count === "number" ? { count } : {}),
  };
}

function constraint(
  kind: ThemeIntentConstraint["kind"],
  value: string,
  status: ThemeIntentConstraint["status"],
  evidenceIds: string[],
): ThemeIntentConstraint {
  return {
    id: `${kind}:${normalized(value).replace(/\s+/g, "-") || "value"}`,
    kind,
    value,
    status,
    evidenceIds,
  };
}

function candidateId(intent: ThemeIntent) {
  const entity = intent.canonicalEntity?.id ?? normalized(intent.shoppingGoal).replace(/\s+/g, "-");
  return `${intent.themeType}:${intent.entityType}:${entity}:${intent.shoppingIntent}:${intent.shopperAction}`;
}

function candidateFromIntent(intent: ThemeIntent): ThemeIntentCandidate {
  return {
    id: candidateId(intent),
    themeType: intent.themeType,
    entityType: intent.entityType,
    canonicalEntity: intent.canonicalEntity,
    shoppingIntent: intent.shoppingIntent,
    shopperAction: intent.shopperAction,
    score: intent.confidence,
    evidenceLevel: evidenceLevel(intent.confidence),
    reason: intent.reason,
    supportingEvidenceIds: intent.evidenceRefs.map((evidence) => evidence.id),
    competingCandidateIds: [],
  };
}

function pendingCandidateFields(confidence: number) {
  return {
    candidates: [],
    decision: {
      status: evidenceLevel(confidence) === "low" ? "needs-review" : "resolved",
      selectedCandidateId: "",
      evidenceLevel: evidenceLevel(confidence),
      selectedCandidateMargin: null,
      requiresAgentReview: evidenceLevel(confidence) === "low",
    },
  } satisfies Pick<ThemeIntent, "candidates" | "decision">;
}

function selectIntent(candidates: ThemeIntent[]) {
  const uniqueCandidates = candidates.filter((intent, index, all) =>
    all.findIndex((candidate) => candidateId(candidate) === candidateId(intent)) === index
  );
  const ranked = [...uniqueCandidates].sort((left, right) =>
    right.confidence - left.confidence || candidateId(left).localeCompare(candidateId(right))
  );
  const selected = ranked[0];
  if (!selected) {
    throw new Error("Catalog intent is not implemented for this keyword yet.");
  }

  const candidateRecords = ranked.map(candidateFromIntent);
  const selectedCandidateMargin = candidateRecords.length > 1
    ? Number((candidateRecords[0]!.score - candidateRecords[1]!.score).toFixed(2))
    : null;
  const hasUnverifiedInterpretation = selected.entityType !== "scenario" &&
    selected.constraints.some((item) =>
      item.status === "unverified" &&
      (item.kind === "core-entity" || item.kind === "modifier")
    );
  const status = evidenceLevel(selected.confidence) === "low"
    ? "needs-review"
    : selectedCandidateMargin !== null && selectedCandidateMargin < AMBIGUOUS_CANDIDATE_MARGIN
      ? "ambiguous"
      : hasUnverifiedInterpretation
        ? "needs-review"
        : "resolved";
  const candidatesWithCompetition = candidateRecords.map((candidate) => ({
    ...candidate,
    competingCandidateIds: candidateRecords
      .filter((other) => other.id !== candidate.id)
      .map((other) => other.id),
  }));

  return {
    ...selected,
    candidates: candidatesWithCompetition,
    decision: {
      status,
      selectedCandidateId: candidateId(selected),
      evidenceLevel: evidenceLevel(selected.confidence),
      selectedCandidateMargin,
      requiresAgentReview: status !== "resolved",
    },
  } satisfies ThemeIntent;
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
    const aliases = expandedCategoryAliases([node.category_ename, node.category_name]);
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
  const issueCounts: CatalogSnapshotQualityReport["issueCounts"] = {
    duplicateId: 0,
    missingId: 0,
    missingTitle: 0,
    missingBrand: 0,
    missingImage: 0,
    missingPrice: 0,
    missingProductUrl: 0,
    unavailable: 0,
    outOfStock: 0,
    notPurchasable: 0,
    keywordMismatch: 0,
  };
  const seenIds = new Set<string>();
  const available = items.filter((item) => {
    const missingId = !item.item_number;
    const missingTitle = !item.goods_ename && !item.goods_name;
    const missingImage = !item.image_url;
    const unavailable = item.status !== "A";
    const outOfStock = (item.goods_number ?? 1) <= 0;
    if (missingId) {
      issueCounts.missingId += 1;
      issueCounts.missingProductUrl += 1;
    }
    if (missingTitle) issueCounts.missingTitle += 1;
    if (!item.brand_ename && !item.brand_name) issueCounts.missingBrand += 1;
    if (missingImage) issueCounts.missingImage += 1;
    if (typeof item.shop_price !== "number") issueCounts.missingPrice += 1;
    if (unavailable) issueCounts.unavailable += 1;
    if (outOfStock) issueCounts.outOfStock += 1;
    if (missingId || missingTitle || missingImage || unavailable || outOfStock) {
      return false;
    }
    if (seenIds.has(item.item_number!)) {
      issueCounts.duplicateId += 1;
      return false;
    }
    seenIds.add(item.item_number!);
    return true;
  });
  return {
    items: available,
    quality: {
      observedProductCount: items.length,
      acceptedProductCount: available.length,
      rejectedProductCount: items.length - available.length,
      truncatedProductCount: 0,
      issueCounts,
    } satisfies CatalogSnapshotQualityReport,
  };
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
  const inspected = availableCatalogItems(response.body.items ?? []);
  const items = inspected.items;
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
    quality: inspected.quality,
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
  return categories
    .filter((category) => category.aliases.some((alias) => normalized(alias) === query))
    .sort((left, right) =>
      normalized(left.label).length - normalized(right.label).length ||
      right.resultCount - left.resultCount ||
      left.path.length - right.path.length
    )[0];
}

function semanticToken(value: string) {
  const token = normalized(value);
  return /^[a-z0-9]+$/u.test(token) && token.length > 3 && token.endsWith("s")
    ? token.slice(0, -1)
    : token;
}

function directTermPresent(keyword: string, term: string) {
  const query = normalized(keyword);
  const candidate = normalized(term);
  if (!candidate) return false;
  if (containsNonAscii(candidate) || candidate.includes(" ")) {
    return query.includes(candidate);
  }
  return query.split(" ").map(semanticToken).includes(semanticToken(candidate));
}

function equivalentTermsPresent(keyword: string, phrase: string) {
  const candidate = normalized(phrase);
  return CATALOG_TERM_EQUIVALENTS_V1.find((group) =>
    group.some((term) => normalized(term) === candidate)
  )?.filter((term) => directTermPresent(keyword, term)) ?? [];
}

function semanticQueryTokens(keyword: string) {
  const tokens = new Set(normalized(keyword).split(" ").map(semanticToken));
  CATALOG_TERM_EQUIVALENTS_V1.forEach((group) => {
    if (!group.some((term) => directTermPresent(keyword, term))) return;
    group.forEach((term) => {
      normalized(term).split(" ").map(semanticToken).forEach((token) => tokens.add(token));
    });
  });
  return tokens;
}

function phraseContained(keyword: string, phrase: string) {
  const query = normalized(keyword);
  const candidate = normalized(phrase);
  if (!candidate) return false;
  if (query.includes(candidate) || equivalentTermsPresent(keyword, phrase).length > 0) {
    return true;
  }
  if (containsNonAscii(candidate)) return false;
  const queryTokens = semanticQueryTokens(keyword);
  return candidate.split(" ").map(semanticToken).every((token) => queryTokens.has(token));
}

function phrasePosition(keyword: string, phrase: string) {
  const query = normalized(keyword);
  const candidate = normalized(phrase);
  const directPosition = query.lastIndexOf(candidate);
  if (directPosition >= 0) return directPosition;
  const equivalentPosition = Math.max(
    -1,
    ...equivalentTermsPresent(keyword, phrase).map((term) =>
      query.lastIndexOf(normalized(term))
    ),
  );
  if (equivalentPosition >= 0 || containsNonAscii(candidate)) return equivalentPosition;
  const queryTokens = query.split(" ").map(semanticToken);
  return Math.max(
    ...candidate.split(" ").map(semanticToken).map((token) => queryTokens.lastIndexOf(token)),
  );
}

function containedCategory(keyword: string, categories: CatalogCategoryEvidence[]) {
  return categories
    .flatMap((category) => category.aliases.some((alias) => phraseContained(keyword, alias))
      ? [category]
      : [])
    .sort((left, right) =>
      Math.max(...right.aliases.map((alias) => phrasePosition(keyword, alias))) -
        Math.max(...left.aliases.map((alias) => phrasePosition(keyword, alias))) ||
      right.productCount - left.productCount ||
      right.resultCount - left.resultCount ||
      right.path.length - left.path.length ||
      Math.max(...right.aliases.map((alias) => normalized(alias).length)) -
        Math.max(...left.aliases.map((alias) => normalized(alias).length))
    )[0];
}

function residualCondition(
  keyword: string,
  categoryAliases: string[],
  attributes: MatchedAttribute[],
) {
  const query = normalized(keyword);
  const consumed = uniqueStrings([
    ...categoryAliases.flatMap((alias) => {
      if (!phraseContained(keyword, alias)) return [];
      const equivalents = equivalentTermsPresent(keyword, alias);
      return equivalents.length > 0 ? equivalents : [alias];
    }),
    ...attributes.flatMap((attribute) =>
      attribute.direct ? [attribute.label] : attribute.overlap
    ),
  ]);
  if (containsNonAscii(query)) {
    return consumed.reduce(
      (value, term) => value.replace(normalized(term), ""),
      query,
    ).trim();
  }
  const consumedTokens = new Set(
    consumed.flatMap((value) => normalized(value).split(" ").map(semanticToken)),
  );
  return query
    .split(" ")
    .filter((token) => !consumedTokens.has(semanticToken(token)))
    .join(" ")
    .trim();
}

function isScenarioKeyword(keyword: string) {
  const query = normalized(keyword);
  return SCENARIO_TERMS.some((term) => query.includes(normalized(term)));
}

function matchedScenarioTerm(keyword: string) {
  const query = normalized(keyword);
  return [...SCENARIO_TERMS]
    .sort((left, right) => normalized(right).length - normalized(left).length)
    .find((term) => query.includes(normalized(term)));
}

function scenarioContextTerms(keyword: string, scenarioTerm: string) {
  let remainder = normalized(keyword).replace(normalized(scenarioTerm), " ");
  GENERIC_SCENARIO_MODIFIERS.forEach((term) => {
    remainder = remainder.replaceAll(normalized(term), " ");
  });
  return uniqueStrings(remainder.match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((term) => term.length > 1);
}

function scenarioEvidenceTerms(scenarioTerm: string) {
  const equivalents = SCENARIO_TERM_EQUIVALENTS.find((group) =>
    group.some((term) => normalized(term) === normalized(scenarioTerm))
  ) ?? [scenarioTerm];
  return uniqueStrings(equivalents.flatMap((term) => [
    normalized(term),
    ...(normalized(term).match(/[\p{L}\p{N}]+/gu) ?? [])
      .filter((token) =>
        token.length > 1 &&
        !GENERIC_SCENARIO_MODIFIERS.some((modifier) => normalized(modifier) === token)
      ),
  ]));
}

function scenarioShopperAction(keyword: string) {
  const query = normalized(keyword);
  if (["restock", "replenish", "补给"].some((term) => query.includes(normalized(term)))) {
    return "replenish" as const;
  }
  if (["gift", "礼物"].some((term) => query.includes(normalized(term)))) {
    return "gift" as const;
  }
  return "bundle" as const;
}

function catalogQueryCandidates(keyword: string) {
  if (!isScenarioKeyword(keyword)) return [keyword];
  const query = normalized(keyword);
  const candidates = [keyword];
  if (query.includes("movie") && query.includes("night")) candidates.push("movie snacks");
  if (query.includes("厨房") && query.includes("收纳")) candidates.push("厨房收纳");
  if (query.includes("洗衣")) candidates.push("洗衣用品");
  const retrievalStopTerms = new Set([
    "basket",
    "essentials",
    "gift",
    "holiday",
    "night",
    "restock",
    "routine",
    "small",
    "travel",
    "winter",
  ]);
  const stripped = query
    .split(" ")
    .filter((term) => !retrievalStopTerms.has(term))
    .join(" ")
    .trim();
  if (stripped.length >= 2) candidates.push(stripped);
  const strippedChinese = ["小户型", "日用", "补给", "日常", "场景", "组合"]
    .reduce((value, term) => value.replaceAll(term, ""), keyword)
    .trim();
  if (strippedChinese.length >= 2) candidates.push(strippedChinese);
  return uniqueStrings(candidates);
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
      const direct = query.includes(normalized(alias));
      const meaningfulOverlap = overlap.filter((term) => !ATTRIBUTE_GENERIC_TERMS.has(term));
      return {
        label: alias,
        overlap: direct ? overlap : meaningfulOverlap,
        direct,
      };
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

function toScenarioIntentCategories(
  snapshot: YamiSearchSnapshot,
  categories: ThemeIntentCategory[],
) {
  const scenarioTerm = matchedScenarioTerm(snapshot.keyword);
  if (!scenarioTerm) return { categories: [], support: "none" as const };

  const scenarioTerms = scenarioEvidenceTerms(scenarioTerm);
  const contextTerms = scenarioContextTerms(snapshot.keyword, scenarioTerm);
  const evidenceById = new Map(
    (snapshot.evidence?.categories ?? []).map((category) => [category.id, category]),
  );
  const functionalProductCounts = new Map<string, number>();
  const thematicProductCounts = new Map<string, number>();

  categories.forEach((category) => {
    const evidence = evidenceById.get(category.id);
    const categoryText = normalized([
      category.label,
      ...category.path,
      ...(evidence?.aliases ?? []),
    ].join(" "));
    const categoryProducts = snapshot.products.filter((product) =>
      String(product.categoryL3Id ?? "") === category.id
    );
    const hasFunctionalSupport = categoryProducts.some((product) => {
      const structuralText = normalized([
        categoryText,
        product.categoryL1Name ?? "",
        product.categoryL2Name ?? "",
        product.categoryL3Name ?? "",
      ].join(" "));
      return scenarioTerms.some((term) => structuralText.includes(term)) ||
        contextTerms.some((term) => structuralText.includes(normalized(term)));
    });
    if (hasFunctionalSupport) {
      functionalProductCounts.set(category.id, categoryProducts.length);
      return;
    }
    const titleMatches = categoryProducts.filter((product) => {
      if (String(product.categoryL3Id ?? "") !== category.id) return false;
      const titleText = normalized([
        product.title,
        product.brand,
      ].join(" "));
      return scenarioTerms.some((term) => titleText.includes(term)) ||
        contextTerms.some((term) => titleText.includes(normalized(term)));
    });
    if (titleMatches.length > 0) {
      thematicProductCounts.set(category.id, titleMatches.length);
    }
  });

  const functionalCategories = categories.flatMap((category) => {
    const evidenceCount = functionalProductCounts.get(category.id);
    return evidenceCount
      ? [{ ...category, evidenceCount }]
      : [];
  });
  if (functionalCategories.length >= 2) {
    return { categories: functionalCategories, support: "functional" as const };
  }

  const reviewableCategories = categories.flatMap((category) => {
    const evidenceCount = functionalProductCounts.get(category.id) ??
      thematicProductCounts.get(category.id);
    return evidenceCount
      ? [{ ...category, evidenceCount }]
      : [];
  });
  return reviewableCategories.length >= 2
    ? { categories: reviewableCategories, support: "title-only" as const }
    : { categories: [], support: "none" as const };
}

function toCoreIntentCategory(
  category: CatalogCategoryEvidence,
  availableCategories: ThemeIntentCategory[],
): ThemeIntentCategory {
  const evidenceCount = availableCategories
    .filter((candidate) => candidate.path.some((label) =>
      normalized(label) === normalized(category.label)
    ))
    .reduce((total, candidate) => total + candidate.evidenceCount, 0);
  return {
    id: category.id,
    label: category.label,
    path: category.path,
    evidenceCount: evidenceCount || category.productCount || category.resultCount,
  };
}

function buildBrandIntent(
  keyword: string,
  brand: CatalogBrandEvidence,
  categories: ThemeIntentCategory[],
): ThemeIntent {
  const confidence = 0.95;
  const evidenceCount = categories.reduce(
    (total, category) => total + category.evidenceCount,
    0,
  );
  const brandEvidence = evidenceRef(
    "catalog-brand",
    brand.id,
    brand.label,
    brand.resultCount,
  );
  const productEvidence = evidenceRef(
    "catalog-products",
    normalized(keyword).replace(/\s+/g, "-"),
    `${evidenceCount} available products`,
    evidenceCount,
  );
  return {
    schemaVersion: "theme-intent/v2",
    source: "catalog-evidence",
    themeType: "brand",
    catalogDomain: categories[0]?.path[0] ?? "catalog",
    attributeSchemaVersion: "catalog-v1",
    entityType: "brand",
    canonicalEntity: { id: brand.id, label: brand.label },
    shoppingIntent: "browse-brand",
    shopperAction: "browse",
    shoppingGoal: `Browse and compare ${brand.label} products available on Yami.`,
    needs: categories.map((category) => category.label),
    conditions: [],
    mustInclude: [brand.label],
    mustExclude: [],
    searchTerms: uniqueStrings([keyword, brand.label]),
    categories,
    constraints: [
      constraint("core-entity", brand.label, "verified", [brandEvidence.id]),
    ],
    evidenceRefs: [brandEvidence, productEvidence],
    ...pendingCandidateFields(confidence),
    reason: `The keyword exactly matches a catalog brand represented by ${evidenceCount} available products in the catalog snapshot.`,
    confidence,
  };
}

function buildProductIntent(
  keyword: string,
  category: CatalogCategoryEvidence,
  categories: ThemeIntentCategory[],
): ThemeIntent {
  const confidence = 0.92;
  const categoryEvidence = evidenceRef(
    "catalog-category",
    category.id,
    category.label,
    category.productCount || category.resultCount,
  );
  return {
    schemaVersion: "theme-intent/v2",
    source: "catalog-evidence",
    themeType: "product",
    catalogDomain: category.path[0] ?? "catalog",
    attributeSchemaVersion: "catalog-v1",
    entityType: "category",
    canonicalEntity: { id: category.id, label: category.label },
    shoppingIntent: "find-product",
    shopperAction: "find",
    shoppingGoal: `Find and compare ${category.label} products available on Yami.`,
    needs: category.path.slice(1),
    conditions: [],
    mustInclude: [category.label],
    mustExclude: [],
    searchTerms: uniqueStrings([keyword, category.label]),
    categories,
    constraints: [
      constraint("core-entity", category.label, "verified", [categoryEvidence.id]),
    ],
    evidenceRefs: [categoryEvidence],
    ...pendingCandidateFields(confidence),
    reason: "The keyword exactly matches an enabled catalog category represented in the product results.",
    confidence,
  };
}

function buildInferredProductIntent(
  keyword: string,
  category: ThemeIntentCategory,
  categories: ThemeIntentCategory[],
): ThemeIntent {
  const confidence = 0.74;
  const categoryEvidence = evidenceRef(
    "catalog-category",
    category.id,
    category.label,
    category.evidenceCount,
  );
  return {
    schemaVersion: "theme-intent/v2",
    source: "catalog-evidence",
    themeType: "product",
    catalogDomain: category.path[0] ?? "catalog",
    attributeSchemaVersion: "catalog-v1",
    entityType: "category",
    canonicalEntity: { id: category.id, label: category.label },
    shoppingIntent: "find-product",
    shopperAction: "find",
    shoppingGoal: `Find ${keyword} products within the strongest matching catalog categories.`,
    needs: category.path.slice(1),
    conditions: [keyword],
    mustInclude: [keyword],
    mustExclude: [],
    searchTerms: [keyword, category.label],
    categories,
    constraints: [
      constraint("core-entity", category.label, "verified", [categoryEvidence.id]),
      constraint("modifier", keyword, "unverified", []),
    ],
    evidenceRefs: [categoryEvidence],
    ...pendingCandidateFields(confidence),
    reason: "The keyword is not a canonical catalog label; the entity is inferred from the strongest category represented by available products.",
    confidence,
  };
}

function buildScenarioIntent(
  keyword: string,
  categories: ThemeIntentCategory[],
  support: "functional" | "title-only" = "functional",
): ThemeIntent {
  const confidence = support === "functional"
    ? categories.length > 1 ? 0.84 : 0.82
    : 0.66;
  const shopperAction = scenarioShopperAction(keyword);
  const scenarioTerm = SCENARIO_TERMS.find((term) =>
    normalized(keyword).includes(normalized(term))
  );
  const scenarioEvidence = evidenceRef(
    "scenario-vocabulary",
    normalized(scenarioTerm ?? keyword).replace(/\s+/g, "-"),
    scenarioTerm ?? keyword,
  );
  const categoryEvidence = categories.map((category) => evidenceRef(
    "catalog-category",
    category.id,
    category.label,
    category.evidenceCount,
  ));
  return {
    schemaVersion: "theme-intent/v2",
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
    shopperAction,
    shoppingGoal: shopperAction === "replenish"
      ? `Find products needed to replenish ${keyword}.`
      : shopperAction === "gift"
        ? `Assemble products suitable for ${keyword}.`
        : `Assemble products that collectively support ${keyword}.`,
    needs: categories.map((category) => category.label),
    conditions: [keyword],
    mustInclude: [],
    mustExclude: [],
    searchTerms: [keyword, ...categories.map((category) => category.label)],
    categories,
    constraints: [
      constraint("scenario", keyword, "unverified", [scenarioEvidence.id]),
    ],
    evidenceRefs: [scenarioEvidence, ...categoryEvidence],
    ...pendingCandidateFields(confidence),
    reason: support === "functional"
      ? "The keyword expresses a shopping scenario and multiple catalog categories provide functional support."
      : "The keyword expresses a shopping scenario, but the available matches are supported by product titles or brands only and require semantic review.",
    confidence,
  };
}

function buildAttributeIntent(
  keyword: string,
  attributes: MatchedAttribute[],
  coreCategory: ThemeIntentCategory,
  coreCategoryAliases: string[],
  categories: ThemeIntentCategory[],
): ThemeIntent {
  const categoryTokens = new Set(
    coreCategoryAliases.flatMap((alias) => normalized(alias).split(" ").map(semanticToken)),
  );
  const relevantAttributes = attributes.filter((attribute) =>
    attribute.direct || attribute.overlap.some((term) => !categoryTokens.has(semanticToken(term)))
  );
  const confidence = relevantAttributes.some((attribute) => attribute.direct)
    ? 0.82
    : relevantAttributes.length > 0
      ? 0.76
      : 0.75;
  const primaryAttribute = relevantAttributes.find((attribute) => attribute.direct);
  const conditionLabels = uniqueStrings(relevantAttributes.flatMap((attribute) =>
    attribute.direct
      ? [attribute.label]
      : attribute.overlap.map((term) =>
          term.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase())
        )
  ));
  const mustInclude = uniqueStrings([
    coreCategory.label,
    ...relevantAttributes.filter((attribute) => attribute.direct).map((attribute) => attribute.label),
  ]);
  const residual = residualCondition(keyword, coreCategoryAliases, relevantAttributes);
  const categoryEvidence = evidenceRef(
    "catalog-category",
    coreCategory.id,
    coreCategory.label,
    coreCategory.evidenceCount,
  );
  const attributeEvidence = relevantAttributes.map(({ attribute, label }) => evidenceRef(
    "catalog-attribute",
    attribute.id,
    label,
  ));
  const evidenceIdByAttribute = new Map(
    relevantAttributes.map(({ attribute }, index) => [attribute.id, attributeEvidence[index]!.id]),
  );
  const intentConstraints = relevantAttributes.map(({ attribute, label, direct }) =>
    constraint(
      "modifier",
      direct
        ? label
        : uniqueStrings(relevantAttributes.find((item) => item.attribute.id === attribute.id)?.overlap ?? [label]).join(" "),
      direct ? "verified" : "unverified",
      [evidenceIdByAttribute.get(attribute.id)!],
    )
  );
  intentConstraints.unshift(
    constraint("core-entity", coreCategory.label, "verified", [categoryEvidence.id]),
  );
  if (residual) {
    intentConstraints.push(constraint("modifier", residual, "unverified", []));
  }

  return {
    schemaVersion: "theme-intent/v2",
    source: "catalog-evidence",
    themeType: "product",
    catalogDomain: coreCategory.path[0] ?? categories[0]?.path[0] ?? "catalog",
    attributeSchemaVersion: "catalog-v1",
    entityType: "category",
    canonicalEntity: { id: coreCategory.id, label: coreCategory.label },
    shoppingIntent: "find-product",
    shopperAction: "filter",
    shoppingGoal: `Find products matching ${keyword} and verify the catalog constraints.`,
    needs: uniqueStrings([...coreCategory.path.slice(1), ...conditionLabels]),
    conditions: uniqueStrings([
      ...conditionLabels,
      residual,
    ]),
    mustInclude,
    mustExclude: [],
    searchTerms: [keyword, ...mustInclude, ...categories.map((category) => category.label)],
    categories,
    constraints: intentConstraints,
    evidenceRefs: [categoryEvidence, ...attributeEvidence],
    ...pendingCandidateFields(confidence),
    reason: primaryAttribute
      ? "The keyword directly contains a catalog-backed attribute and is supported by product-category evidence."
      : relevantAttributes.length > 0
        ? "Catalog attributes partially overlap the keyword; unsupported modifiers remain explicit unverified constraints."
        : "The keyword contains a catalog category plus an unverified modifier that requires product-detail evidence.",
    confidence,
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
  const keywordCategory = category ?? containedCategory(snapshot.keyword, evidence.categories);
  const scenarioMatch = isScenarioKeyword(snapshot.keyword)
    ? toScenarioIntentCategories(snapshot, categories)
    : { categories: [], support: "none" as const };
  const attributes = matchedAttributes(snapshot.keyword, evidence.attributes);
  const inferredCategory = categories[0];
  const coreCategory = keywordCategory
    ? toCoreIntentCategory(keywordCategory, categories)
    : inferredCategory;
  const coreCategoryEvidence = keywordCategory ?? evidence.categories.find((candidate) =>
    candidate.id === coreCategory?.id
  );
  const candidates: ThemeIntent[] = [];
  if (brand) candidates.push(buildBrandIntent(snapshot.keyword, brand, categories));
  if (category) candidates.push(buildProductIntent(snapshot.keyword, category, categories));
  if (scenarioMatch.support !== "none") {
    candidates.push(buildScenarioIntent(
      snapshot.keyword,
      scenarioMatch.categories,
      scenarioMatch.support,
    ));
  }
  if (
    coreCategory &&
    coreCategoryEvidence &&
    (attributes.length > 0 || Boolean(keywordCategory && !category))
  ) {
    candidates.push(buildAttributeIntent(
      snapshot.keyword,
      attributes,
      coreCategory,
      coreCategoryEvidence.aliases,
      categories,
    ));
  }
  const directAttributeSupportsCoreCategory = inferredCategory?.id === coreCategory?.id &&
    attributes.some((attribute) => attribute.direct);
  if (
    inferredCategory &&
    inferredCategory.id !== category?.id &&
    !directAttributeSupportsCoreCategory &&
    scenarioMatch.support !== "title-only"
  ) {
    candidates.push(buildInferredProductIntent(snapshot.keyword, inferredCategory, categories));
  }

  return selectIntent(candidates);
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
  const confidence = isBrand ? 0.56 : 0.35;
  const fallbackEvidence = evidenceRef(
    "search-fallback",
    normalized(keyword).replace(/\s+/g, "-"),
    `${products.length} public search results`,
    products.length,
  );
  const intent: ThemeIntent = {
    schemaVersion: "theme-intent/v2",
    source: "search-fallback",
    themeType: isBrand ? "brand" : "uncertain",
    catalogDomain: "unknown",
    attributeSchemaVersion: "catalog-v1",
    entityType: isBrand ? "brand" : "unknown",
    canonicalEntity: matchingBrand
      ? { id: normalized(matchingBrand), label: matchingBrand }
      : null,
    shoppingIntent: isBrand ? "browse-brand" : "clarify",
    shopperAction: isBrand ? "browse" : "clarify",
    shoppingGoal: isBrand
      ? `Browse ${matchingBrand} products from the fallback search results.`
      : `Review fallback search results for ${keyword}.`,
    needs: [],
    conditions: [keyword],
    mustInclude: [keyword],
    mustExclude: [],
    searchTerms: [keyword],
    categories: [],
    constraints: [
      constraint(
        isBrand ? "core-entity" : "modifier",
        matchingBrand ?? keyword,
        "unverified",
        [fallbackEvidence.id],
      ),
    ],
    evidenceRefs: [fallbackEvidence],
    ...pendingCandidateFields(confidence),
    reason: "The structured catalog interface was unavailable, so the plan uses public search-page evidence and requires review.",
    confidence,
  };
  return selectIntent([intent]);
}

interface CatalogRequestOptions {
  pageSize?: number;
  sortBy?: YamiCatalogSort;
}

async function requestCatalog(
  keyword: string,
  categoryIds?: string[],
  options: CatalogRequestOptions = {},
) {
  try {
    return await searchYamiCatalogProvider({
      keywords: keyword,
      categoryIds,
      pageSize: options.pageSize,
      sortBy: options.sortBy,
    });
  } catch (error) {
    if (error instanceof YamiCatalogError) throw error;
    throw new YamiCatalogError(
      "request_failed",
      "Yami catalog search is temporarily unreachable.",
    );
  }
}

async function searchYamiCatalogCandidateProducts(query: CatalogCandidateQuery) {
  const response = await requestCatalog(
    query.keyword,
    query.categoryId ? [query.categoryId] : undefined,
    { pageSize: query.limit, sortBy: query.sort },
  );
  return parseCatalogSnapshotOrThrow(query.keyword, response).products;
}

export const yamiCatalogCandidateAdapter: CatalogCandidateAdapter = {
  id: "yami-catalog-search",
  search: searchYamiCatalogCandidateProducts,
};

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

function evidenceWithProductCounts(
  evidence: YamiSearchSnapshot["evidence"],
  products: YamiProduct[],
) {
  if (!evidence) return undefined;
  const productCounts = new Map<number, number>();
  products.forEach((product) => {
    if (typeof product.categoryL3Id !== "number") return;
    productCounts.set(
      product.categoryL3Id,
      (productCounts.get(product.categoryL3Id) ?? 0) + 1,
    );
  });
  return {
    ...evidence,
    categories: evidence.categories.map((category) => ({
      ...category,
      productCount: productCounts.get(Number(category.id)) ?? 0,
    })),
  };
}

function filterStructuredCatalogSnapshot(
  snapshot: YamiSearchSnapshot,
  keyword: string,
) {
  if (containsNonAscii(keyword) || isScenarioKeyword(keyword)) return snapshot;

  const searchableProducts = snapshot.products.map((product) => ({
    ...product,
    title: [
      product.title,
      product.categoryL1Name,
      product.categoryL2Name,
      product.categoryL3Name,
    ].filter(Boolean).join(" "),
  }));
  const relevantIds = new Set(
    filterKeywordRelevantProducts(keyword, searchableProducts).map(({ id }) => id),
  );
  const products = snapshot.products.filter(({ id }) => relevantIds.has(id));
  const keywordMismatchCount = snapshot.products.length - products.length;
  return {
    ...snapshot,
    products,
    ...(snapshot.quality
      ? {
          quality: {
            ...snapshot.quality,
            acceptedProductCount: products.length,
            rejectedProductCount:
              snapshot.quality.rejectedProductCount + keywordMismatchCount,
            issueCounts: {
              ...snapshot.quality.issueCounts,
              keywordMismatch:
                snapshot.quality.issueCounts.keywordMismatch + keywordMismatchCount,
            },
          },
        }
      : {}),
    ...(snapshot.evidence
      ? {
          evidence: evidenceWithProductCounts(snapshot.evidence, products),
        }
      : {}),
  } satisfies YamiSearchSnapshot;
}

export async function fetchYamiCatalogSnapshot(
  keyword: string,
): Promise<YamiSearchSnapshot> {
  let broad: YamiSearchSnapshot | undefined;
  let retrievalKeyword = keyword;
  for (const candidate of catalogQueryCandidates(keyword)) {
    const snapshot = filterStructuredCatalogSnapshot(
      parseCatalogSnapshotOrThrow(keyword, await requestCatalog(candidate)),
      candidate,
    );
    if (snapshot.products.length === 0) continue;
    if (!broad || snapshot.products.length > broad.products.length) {
      broad = { ...snapshot, retrievalTerms: [candidate] };
      retrievalKeyword = candidate;
    }
    if (snapshot.products.length >= 12) break;
  }
  if (!broad) {
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
    const narrowed = filterStructuredCatalogSnapshot(
      parseCatalogSnapshotOrThrow(
        keyword,
        await requestCatalog(retrievalKeyword, categoryIds),
      ),
      retrievalKeyword,
    );
    if (narrowed.products.length > 0) {
      return {
        ...narrowed,
        evidence: evidenceWithProductCounts(broad.evidence, narrowed.products),
        retrievalTerms: broad.retrievalTerms,
      };
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
