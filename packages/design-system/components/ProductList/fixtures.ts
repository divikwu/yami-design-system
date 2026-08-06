import type { ProductListItem, ProductListTab } from "./ProductList.types";

export type ProductListLocale = "zh" | "en";

/* This catalogue lived inside ProductList.stories.tsx, which meant the page
 * template could not reach it and grew a second, made-up one — the two drifted
 * on names, prices and categories. It is a fixture module now, like every
 * other component's, so a page that wants the component's data uses the
 * component's data. */

const productImages = [
  "https://cdn.yamibuy.net/item/1d488b732c5e4c652f93cbdb4c4c0b63_300x300.webp",
  "https://cdn.yamibuy.net/item/2ff473a84670925102266fa17a927ecd_300x300.webp",
  "https://cdn.yamibuy.net/item/c8568be11ea13624cfc37efdd0e0e691_300x300.webp",
  "https://cdn.yamibuy.net/item/55683ee55c215d0344db3c59ea798203_300x300.webp",
  "https://cdn.yamibuy.net/item/35d23180d6bee9a9135bd06aa2043c7f_300x300.webp",
  "https://cdn.yamibuy.net/item/ef469ce5321877bb6cdd4f23c90c8a26_300x300.webp",
  "https://cdn.yamibuy.net/item/a29bdecb8574e01e96cee6729ff396cc_300x300.webp",
  "https://cdn.yamibuy.net/item/436aa4bd5fe37fba8d44ad5166e479f9_300x300.webp",
  "https://cdn.yamibuy.net/item/a5aa8a37f917adb7910c6acdf4ea5bba_300x300.webp",
  "https://cdn.yamibuy.net/item/2f8b9fa0348a363563676ecf6cbff069_300x300.webp",
  "https://cdn.yamibuy.net/item/717fd1de7769457203d748e1f76e9ed5_300x300.webp",
  "https://cdn.yamibuy.net/item/71209e688af8d09f587eb17b89a4ed66_300x300.webp",
  "https://cdn.yamibuy.net/item/c4261c4e233a5bfc4b05cecd95f9bef8_300x300.webp",
  "https://cdn.yamibuy.net/item/6eb2bf7c36ea4c4641e15b2b7f6f1f38_300x300.webp",
  "https://cdn.yamibuy.net/item/84a11690e859ddef7887f088dcb4606b_300x300.webp",
  "https://cdn.yamibuy.net/item/5afb42a4833bd6ac060ee9f6742ea257_300x300.webp",
];

const productBrands = [
  "Gik",
  "LA ROCHE-POSAY",
  "ROUND LAB",
  "FineToday",
  "ICHIRAN RAMEN",
  "NESTLE",
  "RNW",
  "SONG CHAO",
];

// The two `tabs` arrays are read positionally — createProductListTabs derives
// each tab's `value` from its index — so they have to stay the same length and
// describe the same category at the same position. English used to carry an
// extra "Personal Care" after "Beauty", which shifted every later category by
// one and made a given tab value mean two different things per locale.
export const productListCopy = {
  zh: {
    heading: "产品列表",
    themedTitle: "主题列表",
    atmosphericTitle: "氛围列表",
    tabs: [
      "全部",
      "人气新品",
      "粮油调味",
      "零食饮料",
      "美妆个护",
      "健康养生",
      "数码家电",
      "家居生活",
      "母婴玩具",
      "礼品卡",
      "日韩精选",
    ],
    viewAll: "查看全部",
    loadMore: "加载更多",
    loading: "商品加载中",
    bannerAlt: "YAMI 季节限定促销活动",
  },
  en: {
    heading: "Product List",
    themedTitle: "Themed List",
    atmosphericTitle: "Atmospheric List",
    tabs: [
      "All",
      "New Popular",
      "Grocery",
      "Snack & Beverage",
      "Beauty",
      "Health",
      "Electronics",
      "Home",
      "Toys, Kids, Babies",
      "Gift Card",
      "Japan and Korea",
    ],
    viewAll: "See all",
    loadMore: "Load more",
    loading: "Loading products",
    bannerAlt: "YAMI seasonal promotion",
  },
} satisfies Record<ProductListLocale, Record<string, string | string[]>>;

const productNames = {
  zh: [
    "韩国桃瑞丹低分子玻尿酸舒缓面霜 100ml",
    "低分子玻尿酸补水面膜 10片装",
    "高保湿水润精华液 50ml",
    "清爽舒缓水乳套装",
    "敏感肌修护保湿霜",
    "深层补水睡眠面膜",
    "玻尿酸洁面泡沫",
    "日常清透防晒乳",
    "胶原蛋白修护面膜 10片装",
    "水润修护防晒霜 SPF50+",
    "控油蓬松洗发水 550ml",
    "博多豚骨拉面组合 5包装",
    "抹茶巧克力威化饼 10枚",
    "柔顺修护护发精油",
    "无火香薰礼盒装",
    "高保湿身体乳 400ml",
  ],
  en: [
    "Dive In Hyaluronic Acid Soothing Cream, 100ml",
    "Low Molecular Hyaluronic Acid Mask, 10pc",
    "High Moisture Hydrating Serum, 50ml",
    "Soothing Toner and Lotion Set",
    "Sensitive Skin Barrier Cream",
    "Deep Hydration Sleeping Mask",
    "Hyaluronic Cleansing Foam",
    "Daily Weightless Sun Lotion",
    "Collagen Repair Face Mask, 10pc",
    "Moisturizing Sunscreen SPF50+",
    "Oil Control Volumizing Shampoo, 550ml",
    "Hakata Tonkotsu Ramen Kit, 5 Packs",
    "Matcha Chocolate Wafers, 10pc",
    "Smoothing Repair Hair Oil",
    "Flameless Aromatherapy Gift Set",
    "High Moisture Body Lotion, 400ml",
  ],
} satisfies Record<ProductListLocale, string[]>;

type FeaturedProductFixture = {
  id: string;
  image: string;
  brand: string;
  title: string;
  priceCurrent: string;
  priceOriginal: string;
  rating?: number;
  ratingCount?: string;
  soldCount?: string;
  badges?: ProductListItem["badges"];
};

const featuredProducts = {
  zh: [
    {
      id: "elegance-face-powder-i",
      image:
        "https://cdn.yamibuy.net/item/4420b725cb239ac2df66f7c3ca95737b_300x300.webp",
      brand: "ELEGANCE",
      title:
        "日本ELEGANCE 极致欢颜蜜粉饼 #I 8.8g E大饼便携装 COSME大赏受赏【全美超低价不叠加折扣码】",
      priceCurrent: "$119.99",
      priceOriginal: "$144.99",
      rating: 4.9,
      ratingCount: "15",
      soldCount: "周销 60+",
    },
    {
      id: "revive-moisturizing-renewal-cream",
      image:
        "https://cdn.yamibuy.net/item/d54933cb51ac7b04a381ab478e0edc1b_300x300.webp",
      brand: "ReVive",
      title:
        "美国 ReVive 【官方正品】RéVive瑞维斐奢润新活翡翠面霜 温和果酸修护抗皱面霜 50ml",
      priceCurrent: "$111.15",
      priceOriginal: "$195.00",
      badges: [{ label: "-43%", type: "discount" as const }],
    },
  ],
  en: [
    {
      id: "elegance-face-powder-i",
      image:
        "https://cdn.yamibuy.net/item/4420b725cb239ac2df66f7c3ca95737b_300x300.webp",
      brand: "ELEGANCE",
      title:
        "ELEGANCE Face Powder Compact #I, 8.8g, Portable @COSME Award Winner",
      priceCurrent: "$119.99",
      priceOriginal: "$144.99",
      rating: 4.9,
      ratingCount: "15",
      soldCount: "60+ Sold",
    },
    {
      id: "revive-moisturizing-renewal-cream",
      image:
        "https://cdn.yamibuy.net/item/d54933cb51ac7b04a381ab478e0edc1b_300x300.webp",
      brand: "ReVive",
      title:
        "ReVive Moisturizing Renewal Cream with Gentle AHA, 50ml",
      priceCurrent: "$111.15",
      priceOriginal: "$195.00",
      badges: [{ label: "-43%", type: "discount" as const }],
    },
  ],
} satisfies Record<ProductListLocale, FeaturedProductFixture[]>;

export function createProductListProducts(
  locale: ProductListLocale,
): ProductListItem[] {
  const catalogue = productNames[locale].map((title, index) => ({
    id: `torriden-${index + 1}`,
    image: productImages[index],
    imageAlt: title,
    brand: productBrands[index % productBrands.length],
    brandHref: `/${locale}/brands/${index + 1}`,
    href: `/${locale}/products/torriden-${index + 1}`,
    title,
    priceCurrent: `$${(17.59 + index).toFixed(2)}`,
    priceOriginal: `$${(21 + index).toFixed(2)}`,
    ranking: locale === "zh" ? "乳液 面霜 加购榜 No.4" : "#4 Most in Cart",
    rating: 4.9,
    ratingCount: `${8 + index}`,
    soldCount: locale === "zh" ? "周销 200+" : "200+ Sold",
    badges: [{ label: "-16%", type: "discount" as const }],
  }));

  const additions = featuredProducts[locale].map((product) => ({
    ...product,
    imageAlt: product.title,
    brandHref: `/${locale}/brands/${product.id}`,
    href: `/${locale}/products/${product.id}`,
  }));

  return [...catalogue, ...additions];
}

export function createProductListTabs(
  locale: ProductListLocale,
): ProductListTab[] {
  return productListCopy[locale].tabs.map((label, index) => ({
    value: `tab-${index + 1}`,
    label,
  }));
}
