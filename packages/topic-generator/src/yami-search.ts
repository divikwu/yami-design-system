import type {
  CatalogSnapshotQualityReport,
  YamiProduct,
  YamiSearchSnapshot,
} from "./types.js";
import { YAMI_SITE } from "./types.js";

/** Public search fallback used when structured catalog evidence is unavailable. */

const YAMI_ORIGIN = "https://www.yami.com";
const MAX_PRODUCTS = 30;
const FALLBACK_QUERY_STOP_WORDS = new Set([
  "and", "for", "no", "or", "product", "products", "the", "with",
]);

export class YamiSearchError extends Error {
  readonly code: "request_failed" | "invalid_response" | "no_products";
  readonly searchUrl: string;

  constructor(
    code: YamiSearchError["code"],
    message: string,
    searchUrl: string,
  ) {
    super(message);
    this.name = "YamiSearchError";
    this.code = code;
    this.searchUrl = searchUrl;
  }
}

export function buildYamiSearchUrl(keyword: string) {
  const url = new URL(`/${YAMI_SITE}/en/search`, YAMI_ORIGIN);
  url.searchParams.set("q", keyword.trim());
  return url.toString();
}

function decodeHtml(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
  };

  return value.replace(
    /&#x([0-9a-f]+);|&#(\d+);|&([a-z]+);/gi,
    (_match, hex: string | undefined, decimal: string | undefined, named: string | undefined) => {
      if (hex) return String.fromCodePoint(Number.parseInt(hex, 16));
      if (decimal) return String.fromCodePoint(Number.parseInt(decimal, 10));
      return namedEntities[named?.toLowerCase() ?? ""] ?? _match;
    },
  );
}

function attribute(tag: string | undefined, name: string) {
  if (!tag) return "";
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return decodeHtml(match?.[1] ?? "").trim();
}

function absoluteProductUrl(value: string) {
  const url = new URL(value, YAMI_ORIGIN);
  url.search = "";
  url.hash = "";
  return url.toString();
}

function largerProductImage(value: string) {
  return value.replace(/_300x300(?=\.[a-z]+(?:\?|$))/i, "_750x750");
}

function normalizedSearchText(value: string) {
  return value.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

function searchToken(value: string) {
  return /^[a-z0-9]+$/u.test(value) && value.length > 3 && value.endsWith("s")
    ? value.slice(0, -1)
    : value;
}

function fallbackProductMatchesKeyword(product: YamiProduct, keyword: string) {
  const phrase = normalizedSearchText(keyword);
  const terms = phrase
    .split(" ")
    .map(searchToken)
    .filter((term) => term.length > 1 && !FALLBACK_QUERY_STOP_WORDS.has(term));
  const haystack = normalizedSearchText(`${product.brand} ${product.title}`);
  const haystackTerms = new Set(haystack.split(" ").map(searchToken));
  const matchingTerms = terms.filter((term) => haystackTerms.has(term));
  const requiredTermCount = terms.length <= 1
    ? 1
    : Math.ceil(terms.length * 0.6);
  return Boolean(
    phrase &&
    (haystack.includes(phrase) || matchingTerms.length >= requiredTermCount),
  );
}

export function filterKeywordRelevantProducts(
  keyword: string,
  products: YamiProduct[],
) {
  return products.filter((product) => fallbackProductMatchesKeyword(product, keyword));
}

export function parseYamiSearchHtml(html: string): YamiProduct[] {
  return parseYamiSearchHtmlWithQuality(html).products;
}

function parseYamiSearchHtmlWithQuality(html: string) {
  const starts = [...html.matchAll(/<div\b[^>]*\bdata-qa-itemcard=""[^>]*>/gi)];
  const products: YamiProduct[] = [];
  const seenIds = new Set<string>();
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
  let rejectedProductCount = 0;
  let truncatedProductCount = 0;

  starts.forEach((match, index) => {
    const start = match.index ?? 0;
    const end = starts[index + 1]?.index ?? html.length;
    const card = html.slice(start, end);
    const outerTag = match[0];
    const titleTag = card.match(
      /<a\b[^>]*\bdata-qa-itemcard-name-txt=""[^>]*>/i,
    )?.[0];
    const imageLinkTag = card.match(
      /<a\b[^>]*class="[^"]*itemCard_productImageWrapper[^"]*"[^>]*>/i,
    )?.[0];
    const imageTag = card.match(
      /<img\b[^>]*\bdata-qa-itemcard-image-md5=""[^>]*>/i,
    )?.[0];
    const brandTag = card.match(
      /<a\b[^>]*\bdata-qa-itemcard-brand-txt=""[^>]*>/i,
    )?.[0];
    const priceTag = card.match(
      /<[^>]+aria-label="Current price: [^"]+"[^>]*>/i,
    )?.[0];

    const id = attribute(outerTag, "data-item_number");
    const title = attribute(titleTag, "title");
    const href = attribute(imageLinkTag, "href");
    const imageUrl = attribute(imageTag, "src");
    const brandLabel = attribute(brandTag, "aria-label");
    const brand = brandLabel.replace(/^Brands\s+/i, "").trim();
    const price = attribute(priceTag, "aria-label").replace(/^Current price:\s*/i, "");
    const canAddToCart = card.includes('data-qa-itemcard-addcart-btn=""');

    if (!id) issueCounts.missingId += 1;
    if (!title) issueCounts.missingTitle += 1;
    if (!brand) issueCounts.missingBrand += 1;
    if (!imageUrl) issueCounts.missingImage += 1;
    if (!price) issueCounts.missingPrice += 1;
    if (!href) issueCounts.missingProductUrl += 1;
    if (!canAddToCart) issueCounts.notPurchasable += 1;

    if (
      !id ||
      !title ||
      !href ||
      !imageUrl ||
      !canAddToCart
    ) {
      rejectedProductCount += 1;
      return;
    }
    if (seenIds.has(id)) {
      issueCounts.duplicateId += 1;
      rejectedProductCount += 1;
      return;
    }

    seenIds.add(id);
    if (products.length >= MAX_PRODUCTS) {
      truncatedProductCount += 1;
      return;
    }
    products.push({
      id,
      title,
      brand: brand || "Yami selection",
      price,
      imageUrl: largerProductImage(imageUrl),
      productUrl: absoluteProductUrl(href),
      sourceRank: index + 1,
    });
  });

  return {
    products,
    quality: {
      observedProductCount: starts.length,
      acceptedProductCount: products.length,
      rejectedProductCount,
      truncatedProductCount,
      issueCounts,
    } satisfies CatalogSnapshotQualityReport,
  };
}

export async function searchYamiProducts(
  keyword: string,
): Promise<YamiSearchSnapshot> {
  const sourceUrl = buildYamiSearchUrl(keyword);
  let response: Response;

  try {
    response = await fetch(sourceUrl, {
      cache: "no-store",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
        "user-agent":
          "Mozilla/5.0 (compatible; YamiTopicGenerator/0.1; +https://www.yami.com)",
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new YamiSearchError(
      "request_failed",
      "Yami search is temporarily unreachable. Open the source search or try again.",
      sourceUrl,
    );
  }

  if (!response.ok) {
    throw new YamiSearchError(
      "request_failed",
      `Yami search returned HTTP ${response.status}.`,
      sourceUrl,
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new YamiSearchError(
      "invalid_response",
      "Yami returned an unsupported response format.",
      sourceUrl,
    );
  }

  const parsed = parseYamiSearchHtmlWithQuality(await response.text());
  const products = filterKeywordRelevantProducts(keyword, parsed.products);
  const keywordMismatchCount = parsed.products.length - products.length;
  if (products.length === 0) {
    throw new YamiSearchError(
      "no_products",
      "No keyword-relevant purchasable products were found for this keyword.",
      sourceUrl,
    );
  }

  return {
    keyword,
    site: YAMI_SITE,
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    products,
    provider: "yami-web-search",
    quality: {
      ...parsed.quality,
      acceptedProductCount: products.length,
      rejectedProductCount:
        parsed.quality.rejectedProductCount + keywordMismatchCount,
      issueCounts: {
        ...parsed.quality.issueCounts,
        keywordMismatch:
          parsed.quality.issueCounts.keywordMismatch + keywordMismatchCount,
      },
    },
  };
}
