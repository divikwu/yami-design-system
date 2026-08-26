import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const keyword = "matcha powder";
const pageSize = 30;
const popularSearchKeywords = [
  "matcha",
  "hot pot",
  "tsubaki",
  "canmake",
  "sunscreen",
  "snacks",
  "anua",
  "konjac jelly",
  "beauty of joseon",
  "noodles",
];
const searchPageUrl = `https://www.yami.com/us/en/search?q=${encodeURIComponent(keyword)}`;
const catalogUrl = "https://ecapi.yami.com/ec-prebff/plp/getItemList";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outputPath = path.join(
  root,
  "packages/prototypes/pages/SearchResultsPage/live-matcha-products.fixture.ts",
);
const popularSearchOutputPath = path.join(
  root,
  "packages/prototypes/pages/EcommerceHome/popular-search-products.fixture.ts",
);

function anonymousSession(headers) {
  const cookies = headers.getSetCookie();
  const tokenCookie = cookies.find((cookie) => cookie.startsWith("YMB_TK="));
  const token = tokenCookie?.match(/^YMB_TK=([^;]+)/)?.[1];
  if (!token) throw new Error("Yami search did not return an anonymous YMB_TK token.");
  return {
    token,
    cookie: cookies.map((cookie) => cookie.split(";", 1)[0]).join("; "),
  };
}

function absoluteImageUrl(value) {
  return new URL(value, "https://cdn.yamibuy.net").toString();
}

function productUrl(item) {
  return `https://www.yami.com/us/en/p/${item.slug || "product"}/${item.item_number}`;
}

function brandUrl(item) {
  return `https://www.yami.com/us/en/b/${item.brand_slug || "brand"}/${item.brand_id}`;
}

function money(value) {
  return `$${Number(value).toFixed(2)}`;
}

function badges(item) {
  return [item.item_badge, item.price_badge]
    .filter((value) =>
      typeof value === "string" &&
      (value === "New" || value === "Hot" || value === "Low Price" ||
        value === "Choice" || /^-\d+%$/.test(value))
    )
    .slice(0, 2);
}

function productSource(item) {
  const currentPrice = item.promotion_price ?? item.shop_price;
  const originalPrice = item.market_price;
  return {
    id: item.item_number,
    title: item.goods_ename || item.goods_name,
    image: absoluteImageUrl(item.image_url),
    href: productUrl(item),
    brand: item.brand_ename || item.brand_name || "Yami selection",
    brandHref: brandUrl(item),
    priceCurrent: money(currentPrice),
    ...(typeof originalPrice === "number" && originalPrice > currentPrice
      ? { priceOriginal: money(originalPrice) }
      : {}),
    ...(typeof item.rated === "number" ? { rating: item.rated } : {}),
    ...(typeof item.comment_count === "number" && item.comment_count > 0
      ? { ratingCount: String(item.comment_count) }
      : {}),
    ...(item.weekly_qty
      ? { soldCount: `${item.weekly_qty} ${item.weekly_qty_sign || "Sold"}`.trim() }
      : {}),
    badges: badges(item),
  };
}

function fixtureSource(products, resultCount, capturedAt) {
  return `import type { ProductBadge, ProductListItem } from "@yami/design-system";

interface LiveMatchaProductSource {
  id: string;
  title: string;
  image: string;
  href: string;
  brand: string;
  brandHref: string;
  priceCurrent: string;
  priceOriginal?: string;
  rating?: number;
  ratingCount?: string;
  soldCount?: string;
  badges: string[];
}

/** Static Yami catalog snapshot for "${keyword}", captured ${capturedAt}. */
const liveMatchaProducts = ${JSON.stringify(products, null, 2)} satisfies LiveMatchaProductSource[];

export const liveMatchaSearchResultCount = ${resultCount};

const badgeTypes: Record<string, ProductBadge["type"]> = {
  New: "new",
  Hot: "hot",
  "Low Price": "low-price",
  Choice: "choice",
};

function createBadge(label: string): ProductBadge | undefined {
  const type = label.startsWith("-") ? "discount" : badgeTypes[label];
  return type ? { label, type } : undefined;
}

export function createLiveMatchaSearchProducts(): ProductListItem[] {
  return liveMatchaProducts.map((source) => ({
    id: \`search-\${source.id}\`,
    image: source.image,
    imageAlt: source.title,
    title: source.title,
    href: source.href,
    brand: source.brand,
    brandHref: source.brandHref,
    priceCurrent: source.priceCurrent,
    ...(source.priceOriginal ? { priceOriginal: source.priceOriginal } : {}),
    ...(source.rating !== undefined ? { rating: source.rating } : {}),
    ...(source.ratingCount ? { ratingCount: source.ratingCount } : {}),
    ...(source.soldCount ? { soldCount: source.soldCount } : {}),
    badges: source.badges
      .map(createBadge)
      .filter((badge): badge is ProductBadge => badge !== undefined),
  }));
}
`;
}

function popularSearchFixtureSource(tags, capturedAt) {
  return `import type { HeaderSearchTag } from "@yami/design-system";

/** Static first-product images from Yami catalog searches, captured ${capturedAt}. */
export const popularSearchProductTags = ${JSON.stringify(tags, null, 2)} satisfies HeaderSearchTag[];
`;
}

async function fetchCatalog(session, searchKeyword, requestedPageSize) {
  const response = await fetch(catalogUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: session.cookie,
      origin: "https://www.yami.com",
      referer: "https://www.yami.com/",
      site_code: "US",
      token: session.token,
      y_language: "en_US",
      y_platform: "web",
    },
    body: JSON.stringify({
      keywords: searchKeyword,
      page_index: 1,
      page_size: requestedPageSize,
      sort_by: 3,
      sort_order: 0,
      exclude_category_ids: "11",
      page_type: 3,
      oldCard: 1,
      recordSearchHistory: 0,
    }),
  });
  if (!response.ok) {
    throw new Error(`Yami catalog search for "${searchKeyword}" returned HTTP ${response.status}.`);
  }
  const payload = await response.json();
  if (payload.messageId !== "10000" || !Array.isArray(payload.body?.items)) {
    throw new Error(`Yami catalog search for "${searchKeyword}" returned an invalid response.`);
  }
  return payload;
}

const sessionResponse = await fetch(searchPageUrl, { redirect: "follow" });
if (!sessionResponse.ok) {
  throw new Error(`Yami search session returned HTTP ${sessionResponse.status}.`);
}
const session = anonymousSession(sessionResponse.headers);
const payload = await fetchCatalog(session, keyword, pageSize);
const products = payload.body.items
  .filter((item) => item.status === "A" && item.item_number && item.image_url &&
    typeof (item.promotion_price ?? item.shop_price) === "number")
  .map(productSource);
if (products.length === 0) throw new Error("Yami catalog search returned no usable products.");

const resultCount = payload.body.page?.total ?? products.length;
const capturedAt = new Date().toISOString().slice(0, 10);
await writeFile(outputPath, fixtureSource(products, resultCount, capturedAt));
const popularSearchTags = [];
for (const popularKeyword of popularSearchKeywords) {
  const popularPayload = await fetchCatalog(session, popularKeyword, 1);
  const firstProduct = popularPayload.body.items.find((item) =>
    item.status === "A" && item.image_url
  );
  if (!firstProduct) {
    throw new Error(`Yami catalog search for "${popularKeyword}" returned no usable product image.`);
  }
  popularSearchTags.push({
    label: popularKeyword,
    image: {
      src: absoluteImageUrl(firstProduct.image_url),
      alt: "",
    },
  });
}
await writeFile(
  popularSearchOutputPath,
  popularSearchFixtureSource(popularSearchTags, capturedAt),
);
console.log(`Updated ${path.relative(root, outputPath)} with ${products.length} products (${resultCount} results).`);
console.log(`Updated ${path.relative(root, popularSearchOutputPath)} with ${popularSearchTags.length} popular searches.`);
