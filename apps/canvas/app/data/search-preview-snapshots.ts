import type {
  CatalogBadge,
  CatalogCategory,
  CatalogLocale,
  CatalogProduct,
  PrototypeCatalogSnapshot,
} from "@yami/commerce-catalog";

const capturedAt = "2026-08-26T00:00:00.000Z";

interface SnapshotProductSource {
  id: string;
  title: Record<CatalogLocale, string>;
  imageUrl: string;
  productSlug: string;
  brand: Record<CatalogLocale, string>;
  brandId: string;
  brandSlug: string;
  current: number;
  original?: number;
  rating?: number;
  reviewCount?: number;
  soldLabel: Record<CatalogLocale, string>;
  badges?: readonly CatalogBadge[];
}

const products = [
  {
    id: "1157010241",
    title: { en: "Japanese Matcha Powder, Isuzu, Premium Green Tea, 1.41 oz", zh: "丸久小山园 五十铃高级抹茶粉 1.41 oz" },
    imageUrl: "https://cdn.yamibuy.net/item/0366931674f74f6c47d1fb9424c53286_0x0.webp",
    productSlug: "matcha-powder-1-41-oz",
    brand: { en: "MARUKYU KOYAMAEN", zh: "丸久小山园" },
    brandId: "13583",
    brandSlug: "marukyu-koyamaen",
    current: 39.49,
    original: 49.99,
    rating: 4.9,
    reviewCount: 9,
    soldLabel: { en: "100+ Sold", zh: "周销 100+" },
    badges: [{ label: "Hot", kind: "hot" }],
  },
  {
    id: "1020002271",
    title: { en: "Japanese Matcha Green Tea Powder, Unsweetened, 0.98 oz", zh: "前田园 日本无糖抹茶绿茶粉 0.98 oz" },
    imageUrl: "https://cdn.yamibuy.net/item/f7ba4a880b5402d26388d9cd61b2f2aa_0x0.webp",
    productSlug: "maeda-en-matcha-green-tea-powder-28g",
    brand: { en: "MAEDA-EN", zh: "前田园" },
    brandId: "462",
    brandSlug: "maeda-en",
    current: 16.99,
    original: 19.99,
    rating: 4.8,
    reviewCount: 52,
    soldLabel: { en: "60+ Sold", zh: "周销 60+" },
    badges: [{ label: "Low Price", kind: "low-price" }],
  },
  {
    id: "1020065241",
    title: { en: "Uji Matcha Powder, Unsweetened Japanese Green Tea, 1.41 oz", zh: "辻利 宇治无糖抹茶粉 1.41 oz" },
    imageUrl: "https://cdn.yamibuy.net/item/1fed61add370f497428cbe3090fd3981_0x0.webp",
    productSlug: "soluble-and-unsweetened-matcha-40g",
    brand: { en: "TSUJIRI", zh: "辻利" },
    brandId: "7482",
    brandSlug: "sujiri",
    current: 9.69,
    original: 10.99,
    rating: 4.7,
    reviewCount: 33,
    soldLabel: { en: "200+ Sold", zh: "周销 200+" },
  },
  {
    id: "1020062601",
    title: { en: "Japanese Culinary Matcha Green Tea Powder, 0.98 oz", zh: "前田园 烘焙用日本抹茶粉 0.98 oz" },
    imageUrl: "https://cdn.yamibuy.net/item/e52fc64a272a7d283babf188f29766d8_0x0.webp",
    productSlug: "matcha-culinary-qlty-28g",
    brand: { en: "MAEDA-EN", zh: "前田园" },
    brandId: "462",
    brandSlug: "maeda-en",
    current: 16.19,
    rating: 4.6,
    reviewCount: 7,
    soldLabel: { en: "50+ Sold", zh: "周销 50+" },
    badges: [{ label: "Low Price", kind: "low-price" }],
  },
  {
    id: "1157077631",
    title: { en: "Japanese Matcha Powder Wako, Smooth Texture, 0.71 oz", zh: "丸久小山园 和光抹茶粉 0.71 oz" },
    imageUrl: "https://cdn.yamibuy.net/item/62a13d24611a5f14cd01ce21c55e1078_0x0.webp",
    productSlug: "marukyu-koyamaen-matcha-powder-wakou-0-71oz-classic-matcha-smooth-texture-ideal-for-tea-preparation",
    brand: { en: "MARUKYU KOYAMAEN", zh: "丸久小山园" },
    brandId: "13583",
    brandSlug: "marukyu-koyamaen",
    current: 34.99,
    original: 44.99,
    rating: 5,
    reviewCount: 1,
    soldLabel: { en: "30+ Sold", zh: "周销 30+" },
    badges: [{ label: "Low Price", kind: "low-price" }],
  },
  {
    id: "1157087711",
    title: { en: "Matcha Powder Yugen, Ceremonial Grade, 0.70 oz", zh: "丸久小山园 又玄茶道级抹茶粉 0.70 oz" },
    imageUrl: "https://cdn.yamibuy.net/item/e982afa9caefc881cad9141d3cc787e2_0x0.webp",
    productSlug: "matcha-powder-yugen-ceremonial-grade-0-70-oz-for-lattes-smoothies-baking-cooking",
    brand: { en: "MARUKYU KOYAMAEN", zh: "丸久小山园" },
    brandId: "13583",
    brandSlug: "marukyu-koyamaen",
    current: 27.79,
    original: 39.99,
    rating: 0,
    soldLabel: { en: "70+ Sold", zh: "周销 70+" },
    badges: [{ label: "Low Price", kind: "low-price" }],
  },
  {
    id: "1157077621",
    title: { en: "Matcha Powder Yugen, Ceremonial Grade, 1.41 oz", zh: "丸久小山园 又玄茶道级抹茶粉 1.41 oz" },
    imageUrl: "https://cdn.yamibuy.net/item/9c75aa179c3f0ccc2f6592678862dac0_0x0.webp",
    productSlug: "marukyu-koyamaen-matcha-powder-yugen-1-41oz-premium-grade-matcha-complex-flavor-profile-for-drinks-desserts",
    brand: { en: "MARUKYU KOYAMAEN", zh: "丸久小山园" },
    brandId: "13583",
    brandSlug: "marukyu-koyamaen",
    current: 63.99,
    original: 64.99,
    rating: 5,
    reviewCount: 1,
    soldLabel: { en: "20+ Sold", zh: "周销 20+" },
    badges: [{ label: "Low Price", kind: "low-price" }],
  },
  {
    id: "1157113361",
    title: { en: "Pure Matcha Powder, Zero Sugar, No Additives, 1.41 oz", zh: "AOZEN 纯抹茶粉 无糖无添加 1.41 oz" },
    imageUrl: "https://cdn.yamibuy.net/item/100f9e99feb2e66e1d1d127a1f020dca_0x0.webp",
    productSlug: "matcha-powder-1-41-oz",
    brand: { en: "AOZEN", zh: "AOZEN" },
    brandId: "24594",
    brandSlug: "aozen",
    current: 19.99,
    original: 21.99,
    rating: 5,
    reviewCount: 2,
    soldLabel: { en: "80+ Sold", zh: "周销 80+" },
  },
  {
    id: "1157055151",
    title: { en: "Organic Matcha Powder, Ceremonial Grade, 1.05 oz", zh: "Balance Master 有机茶道级抹茶粉 1.05 oz" },
    imageUrl: "https://cdn.yamibuy.net/item/57fea5744e5ca5f7c50aeba0514a898d_0x0.webp",
    productSlug: "mocha-green-tea-1-06-oz",
    brand: { en: "Balance Master", zh: "Balance Master" },
    brandId: "15703",
    brandSlug: "balance-master",
    current: 12.99,
    original: 14.99,
    rating: 4.8,
    reviewCount: 6,
    soldLabel: { en: "200+ Sold", zh: "周销 200+" },
  },
  {
    id: "1029405491",
    title: { en: "Matcha Powder and Chasen Bamboo Tea Whisk Set", zh: "AOZEN 抹茶粉与茶筅套装" },
    imageUrl: "https://cdn.yamibuy.net/item/6ea95d573b690d42209a2aeb0e6bb96e_0x0.webp",
    productSlug: "hyakuhon-dachi-japanese-matcha-whisk-brush-tea-ceremony-tool-1-pc-pure-matcha-powder-1-41-oz-100-pure-zero-sugar-no-additives-clean-label-2-packs",
    brand: { en: "AOZEN", zh: "AOZEN" },
    brandId: "24594",
    brandSlug: "aozen",
    current: 27.98,
    rating: 0,
    soldLabel: { en: "10+ Sold", zh: "周销 10+" },
  },
  {
    id: "1157040151",
    title: { en: "Ayame Culinary Japanese Matcha Powder, 17.6 oz", zh: "丸久小山园 绫女烘焙抹茶粉 17.6 oz" },
    imageUrl: "https://cdn.yamibuy.net/item/9665a1343922844de1d1ce76045d213c_0x0.webp",
    productSlug: "f-matcha-ayame-koyamaen-17-6-oz",
    brand: { en: "MARUKYU KOYAMAEN", zh: "丸久小山园" },
    brandId: "13583",
    brandSlug: "marukyu-koyamaen",
    current: 70.99,
    original: 89.99,
    rating: 0,
    soldLabel: { en: "40+ Sold", zh: "周销 40+" },
    badges: [{ label: "Choice", kind: "choice" }],
  },
  {
    id: "1157060031",
    title: { en: "Blendy Matcha Ippuku, Unsweetened, 4 Sticks", zh: "AGF Blendy 一服无糖抹茶 4条" },
    imageUrl: "https://cdn.yamibuy.net/item/cb763f7d9e8f5e2c0bb312dc7ee52436_0x0.webp",
    productSlug: "ajinomoto-agf-blendy-matcha-ippuku-no-milk-4-sticks",
    brand: { en: "AGF", zh: "AGF" },
    brandId: "1140",
    brandSlug: "agf",
    current: 4.49,
    original: 4.79,
    rating: 5,
    reviewCount: 1,
    soldLabel: { en: "10+ Sold", zh: "周销 10+" },
    badges: [{ label: "Low Price", kind: "low-price" }],
  },
] satisfies readonly SnapshotProductSource[];

function snapshotCategories(locale: CatalogLocale): CatalogCategory[] {
  return [{
    id: "8",
    label: locale === "zh" ? "茶饮" : "Tea",
    resultCount: 2000,
    children: [{
      id: "81",
      label: locale === "zh" ? "抹茶" : "Matcha",
      resultCount: 2000,
      children: [],
    }],
  }];
}

function snapshotProducts(locale: CatalogLocale): CatalogProduct[] {
  return products.map((product) => ({
    id: product.id,
    title: product.title[locale],
    imageUrl: product.imageUrl,
    productUrl: `https://www.yami.com/us/${locale}/p/${product.productSlug}/${product.id}`,
    brand: {
      id: product.brandId,
      label: product.brand[locale],
      url: `https://www.yami.com/us/${locale}/b/${product.brandSlug}/${product.brandId}`,
    },
    price: {
      currency: "USD",
      current: product.current,
      ...(product.original ? { original: product.original } : {}),
    },
    ...(product.rating !== undefined ? { rating: product.rating } : {}),
    ...(product.reviewCount !== undefined ? { reviewCount: product.reviewCount } : {}),
    soldLabel: product.soldLabel[locale],
    badges: product.badges ?? [],
  }));
}

function createSnapshot(locale: CatalogLocale): PrototypeCatalogSnapshot {
  const query = locale === "zh" ? "抹茶粉" : "matcha powder";
  const capturedProducts = snapshotProducts(locale);
  return {
    schemaVersion: "1",
    id: `matcha-search-${locale}-2026-08-26-v1`,
    digest: locale === "zh"
      ? "sha256:850750630763d31363b402dbffe8b0ff6847dcaf2d5609886133e6425f950d20"
      : "sha256:8486f7101c6268304f3724ab9fddf482fe6cdebf6c75847471efc8abb060e7d2",
    capturedAt,
    request: {
      query,
      locale,
      page: 1,
      pageSize: 12,
      sort: "featured",
      categoryIds: [],
    },
    result: {
      products: capturedProducts,
      categories: snapshotCategories(locale),
      pagination: { page: 1, pageSize: 12, total: 2000, pageCount: 167 },
    },
  };
}

export const searchPreviewSnapshots = {
  en: createSnapshot("en"),
  zh: createSnapshot("zh"),
} as const;
