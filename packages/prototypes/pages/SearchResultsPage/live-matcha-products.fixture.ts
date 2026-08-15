import type { ProductBadge, ProductListItem } from "@yami/design-system";

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
/** Yami search snapshot for "matcha powder", captured 2026-08-15. */
const liveMatchaProducts = [
  {
    "badges": [
      "New"
    ],
    "brand": "AOZEN",
    "brandHref": "https://www.yami.com/us/en/b/aozen/24594",
    "href": "https://www.yami.com/us/en/p/matcha-powder-1-41-oz/1157113361",
    "id": "1157113361",
    "image": "https://cdn.yamibuy.net/item/100f9e99feb2e66e1d1d127a1f020dca_300x300.webp",
    "priceCurrent": "$19.99",
    "priceOriginal": "$21.99",
    "rating": 5,
    "ratingCount": "2",
    "soldCount": "50+ Sold",
    "title": "Matcha Powder, 1.41 oz【100% Pure, Zero Sugar, No Additives】【Clean Label】【Ideal for Matcha Lattes, Baking & Smoothies】"
  },
  {
    "badges": [
      "Hot",
      "Low Price"
    ],
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "href": "https://www.yami.com/us/en/p/matcha-powder-1-41-oz/1157010241",
    "id": "1157010241",
    "image": "https://cdn.yamibuy.net/item/0366931674f74f6c47d1fb9424c53286_300x300.webp",
    "priceCurrent": "$35.99",
    "priceOriginal": "$49.99",
    "rating": 4.9,
    "ratingCount": "8",
    "soldCount": "100+ Sold",
    "title": "Japanese Matcha Powder, Isuzu, Premium Green Tea,Japanese Tea,1.41 oz"
  },
  {
    "badges": [],
    "brand": "TSUJIRI",
    "brandHref": "https://www.yami.com/us/en/b/sujiri/7482",
    "href": "https://www.yami.com/us/en/p/soluble-and-unsweetened-matcha-40g/1020065241",
    "id": "1020065241",
    "image": "https://cdn.yamibuy.net/item/1fed61add370f497428cbe3090fd3981_300x300.webp",
    "priceCurrent": "$9.99",
    "priceOriginal": "$10.99",
    "rating": 4.7,
    "ratingCount": "32",
    "soldCount": "200+ Sold",
    "title": "Uji Matcha Powder Unsweetened, Japanese Green Tea, 0 Sugar,1.41 oz"
  },
  {
    "badges": [],
    "brand": "Balance Master",
    "brandHref": "https://www.yami.com/us/en/b/balance-master/15703",
    "href": "https://www.yami.com/us/en/p/mocha-green-tea-1-06-oz/1157055151",
    "id": "1157055151",
    "image": "https://cdn.yamibuy.net/item/57fea5744e5ca5f7c50aeba0514a898d_300x300.webp",
    "priceCurrent": "$12.99",
    "priceOriginal": "$14.99",
    "rating": 4.8,
    "ratingCount": "6",
    "soldCount": "200+ Sold",
    "title": "Organic Matcha Powder,1.05 oz【National Standard Grade 1 Tea Ceremony Grade Thin Tea】 【For Latte Drinking Baked Desserts】"
  },
  {
    "badges": [
      "Low Price"
    ],
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "href": "https://www.yami.com/us/en/p/matcha-powder-yugen-ceremonial-grade-0-70-oz-for-lattes-smoothies-baking-cooking/1157087711",
    "id": "1157087711",
    "image": "https://cdn.yamibuy.net/item/e982afa9caefc881cad9141d3cc787e2_300x300.webp",
    "priceCurrent": "$27.79",
    "priceOriginal": "$39.99",
    "soldCount": "60+ Sold",
    "title": "Matcha Powder Yugen,Ceremonial Grade, 0.70 oz【For Lattes, Smoothies, Baking & Cooking】"
  },
  {
    "badges": [],
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "href": "https://www.yami.com/us/en/p/uji-matcha-wakosugar-free-cooking-and-baking-aluminum-can-40g/5157065751",
    "id": "5157065751",
    "image": "https://cdn.yamibuy.net/item/c24f2354c9fba1997f0f9444870c05e8_300x300.webp",
    "priceCurrent": "$36.90",
    "priceOriginal": "$48.90",
    "rating": 4.7,
    "ratingCount": "3",
    "soldCount": "40+ Sold",
    "title": "Uji Matcha wako Sugar-free Cooking And Baking Aluminum Can 20g"
  },
  {
    "badges": [
      "-28%"
    ],
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "href": "https://www.yami.com/us/en/p/matcha-powder-isuzu-40g-canned/5157074231",
    "id": "5157074231",
    "image": "https://cdn.yamibuy.net/item/1458ff11d24cbaa4de5894726ad0b10f_300x300.webp",
    "priceCurrent": "$35.99",
    "priceOriginal": "$49.99",
    "soldCount": "100+ Sold",
    "title": "Matcha Powder Isuzu 40g Canned"
  },
  {
    "badges": [],
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "href": "https://www.yami.com/us/en/p/uji-matcha-matagen-aluminum-can-40g/5158007681",
    "id": "5158007681",
    "image": "https://cdn.yamibuy.net/item/f2bf76e03ba1580e3760e6239fc9ea1c_300x300.webp",
    "priceCurrent": "$49.90",
    "priceOriginal": "$65.90",
    "rating": 5,
    "ratingCount": "1",
    "soldCount": "50+ Sold",
    "title": "Uji Matcha Matagen aluminum can 40g"
  },
  {
    "badges": [
      "-50%"
    ],
    "brand": "yanocha",
    "brandHref": "https://www.yami.com/us/en/b/yanocha/19406",
    "href": "https://www.yami.com/us/en/p/uji-matcha-green-tea-powder-ginsen-no-shiro-40g/5157080501",
    "id": "5157080501",
    "image": "https://cdn.yamibuy.net/item/eded66f659fad18fc977c76054e9e7f8_300x300.webp",
    "priceCurrent": "$19.99",
    "priceOriginal": "$39.99",
    "soldCount": "20+ Sold",
    "title": "Uji Matcha Powder - Masu no Shiro - 40g"
  },
  {
    "badges": [
      "Choice"
    ],
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "href": "https://www.yami.com/us/en/p/f-matcha-ayame-koyamaen-17-6-oz/1157040151",
    "id": "1157040151",
    "image": "https://cdn.yamibuy.net/item/9665a1343922844de1d1ce76045d213c_300x300.webp",
    "priceCurrent": "$70.99",
    "priceOriginal": "$89.99",
    "soldCount": "40+ Sold",
    "title": "Ayame Matcha Powder ​,\"Koyamaen\" Culinary Japanese Green Tea Powder,17.6 oz【For Drinks And Baked Desserts】"
  },
  {
    "badges": [
      "-28%"
    ],
    "brand": "OGAWA",
    "brandHref": "https://www.yami.com/us/en/b/ogawa/1189",
    "href": "https://www.yami.com/us/en/p/ooigawa-tea-garden-shizuoka-matcha-50g/5157061571",
    "id": "5157061571",
    "image": "https://cdn.yamibuy.net/item/7c94946faec7eb9df5024119c7b3a126_300x300.webp",
    "priceCurrent": "$9.99",
    "priceOriginal": "$13.99",
    "soldCount": "50+ Sold",
    "title": "Ooigawa Tea Garden Shizuoka Matcha 50g"
  },
  {
    "badges": [],
    "brand": "ITOHKYUEMON",
    "brandHref": "https://www.yami.com/us/en/b/itohkyuemon/3164",
    "href": "https://www.yami.com/us/en/p/premium-quality-matcha-powder-uji-midori-20g-in-jar/5157072911",
    "id": "5157072911",
    "image": "https://cdn.yamibuy.net/item/30062ab94e36b113b983a0ed0cf7e5f2_300x300.webp",
    "priceCurrent": "$24.99",
    "priceOriginal": "$26.99",
    "soldCount": "20+ Sold",
    "title": "Premium Quality Matcha Powder Uji Midori 20g in Jar"
  },
  {
    "badges": [],
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "href": "https://www.yami.com/us/en/p/uji-matcha-isuzu-sugar-free-cooking-and-baking-aluminum-can-40g/5157049931",
    "id": "5157049931",
    "image": "https://cdn.yamibuy.net/item/f57b2c43bc462f9b6a759366112b49b1_300x300.webp",
    "priceCurrent": "$39.90",
    "priceOriginal": "$49.90",
    "rating": 5,
    "ratingCount": "3",
    "soldCount": "40+ Sold",
    "title": "Uji Matcha Isuzu Sugar-free Cooking and Baking Aluminum Can 1 pc 40g"
  },
  {
    "badges": [
      "-33%"
    ],
    "brand": "DongFangChiTi",
    "brandHref": "https://www.yami.com/us/en/b/dongfangchiti/22774",
    "href": "https://www.yami.com/us/en/p/matcha-30g/5157099621",
    "id": "5157099621",
    "image": "https://cdn.yamibuy.net/item/7e11d1e90b2c11448a8e5896855b3e6f_300x300.webp",
    "priceCurrent": "$8.99",
    "priceOriginal": "$13.49",
    "rating": 5,
    "ratingCount": "1",
    "soldCount": "20+ Sold",
    "title": "Isuzu Japanese Matcha Powder 30g | Ceremonial Grade, Mild & Smooth for Baking or Drinking"
  },
  {
    "badges": [
      "-30%"
    ],
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "href": "https://www.yami.com/us/en/p/uji-matcha-yugen-sugar-free-cooking-and-baking-40g/5157065741",
    "id": "5157065741",
    "image": "https://cdn.yamibuy.net/item/64f9b6517724953c83d3a6af29dad031_300x300.webp",
    "priceCurrent": "$31.90",
    "priceOriginal": "$45.90",
    "soldCount": "30+ Sold",
    "title": "Uji Matcha yugen Sugar-free Cooking And Baking 20g"
  },
  {
    "badges": [
      "Choice"
    ],
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "href": "https://www.yami.com/us/en/p/uji-matcha-qinglan-sugar-free-cooking-and-baking-100g/5157044651",
    "id": "5157044651",
    "image": "https://cdn.yamibuy.net/item/00e9e407b23315194517a2d6ed78c628_300x300.webp",
    "priceCurrent": "$59.90",
    "priceOriginal": "$65.90",
    "rating": 5,
    "ratingCount": "2",
    "soldCount": "50+ Sold",
    "title": "Uji Matcha Qinglan Sugar-free Cooking And Baking 100g"
  },
  {
    "badges": [
      "Choice",
      "-57%"
    ],
    "brand": "DongFangChiTi",
    "brandHref": "https://www.yami.com/us/en/b/dongfangchiti/22774",
    "href": "https://www.yami.com/us/en/p/isuzu-matcha-powder-1000-mesh-30g-instant-drink-baking-milk-tea-shop-green-tea-powder-uji-matcha-latte/5157088731",
    "id": "5157088731",
    "image": "https://cdn.yamibuy.net/item/2a320afac64b2e057e7e81035d7d48bc_300x300.webp",
    "priceCurrent": "$8.84",
    "priceOriginal": "$20.61",
    "rating": 5,
    "ratingCount": "3",
    "soldCount": "60+ Sold",
    "title": "Isuzu Matcha Powder 1000 Mesh 30g Instant Drink Baking Milk Tea Shop Green Tea Powder Uji Matcha Latte"
  },
  {
    "badges": [],
    "brand": "MAEDA-EN",
    "brandHref": "https://www.yami.com/us/en/b/maeda-en/462",
    "href": "https://www.yami.com/us/en/p/maeda-en-matcha-green-tea-powder-28g/1020002271",
    "id": "1020002271",
    "image": "https://cdn.yamibuy.net/item/f7ba4a880b5402d26388d9cd61b2f2aa_300x300.webp",
    "priceCurrent": "$16.99",
    "priceOriginal": "$19.99",
    "rating": 4.8,
    "ratingCount": "52",
    "soldCount": "60+ Sold",
    "title": "Japanese Matcha Powder ,Green Tea Powder, Universal Quality,0 Sugar 0 Added, 0.98 oz"
  },
  {
    "badges": [],
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "href": "https://www.yami.com/us/en/p/uji-matcha-isuzu-cooking-and-baking-100g/5157044641",
    "id": "5157044641",
    "image": "https://cdn.yamibuy.net/item/691ef20e814a16bb51670f7e0e87d01f_300x300.webp",
    "priceCurrent": "$69.90",
    "priceOriginal": "$79.90",
    "rating": 5,
    "ratingCount": "3",
    "soldCount": "100+ Sold",
    "title": "Uji Matcha Isuzu Cooking And Baking 100g"
  },
  {
    "badges": [
      "-25%"
    ],
    "brand": "ITOHKYUEMON",
    "brandHref": "https://www.yami.com/us/en/b/itohkyuemon/3164",
    "href": "https://www.yami.com/us/en/p/uji-midori-matcha-powder-canned-20g/5157072811",
    "id": "5157072811",
    "image": "https://cdn.yamibuy.net/item/2ac3b29bad00f1fc96f969966122d305_300x300.webp",
    "priceCurrent": "$26.99",
    "priceOriginal": "$35.99",
    "soldCount": "30+ Sold",
    "title": "Uji Midori Matcha Powder Canned 20g"
  },
  {
    "badges": [],
    "brand": "ITO EN",
    "brandHref": "https://www.yami.com/us/en/b/ito-en/643",
    "href": "https://www.yami.com/us/en/p/tea-powder-matcha-green-tea-2oz/1020051271",
    "id": "1020051271",
    "image": "https://cdn.yamibuy.net/item/f40fd3ec2b2edc092ef9ff6cbd37e1e3_300x300.webp",
    "priceCurrent": "$12.99",
    "priceOriginal": "$14.99",
    "rating": 4.6,
    "ratingCount": "10",
    "soldCount": "70+ Sold",
    "title": "Japanese Unsweetened Matcha Green Tea Powder,2 oz【0 Sugar No Added】"
  },
  {
    "badges": [
      "New"
    ],
    "brand": "AOZEN",
    "brandHref": "https://www.yami.com/us/en/b/aozen/24594",
    "href": "https://www.yami.com/us/en/p/hyakuhon-dachi-japanese-matcha-whisk-brush-tea-ceremony-tool-1-pc-pure-matcha-powder-1-41-oz-100-pure-zero-sugar-no-additives-clean-label-2-packs/1029405491",
    "id": "1029405491",
    "image": "https://cdn.yamibuy.net/item/6ea95d573b690d42209a2aeb0e6bb96e_300x300.webp",
    "priceCurrent": "$27.98",
    "title": "Matcha Powder 1.41 oz+ Chasen Bamboo Tea Whisk 【Japanese Matcha Whisking Set】【DIY Matcha Latte Essential】"
  },
  {
    "badges": [
      "New"
    ],
    "brand": "ZOWOKI",
    "brandHref": "https://www.yami.com/us/en/b/zowoki/19292",
    "href": "https://www.yami.com/us/en/p/pure-matcha-powder-15-sticks-box-no-lumps-ultra-smooth-instant-dissolve/3175206541",
    "id": "3175206541",
    "image": "https://cdn.yamibuy.net/item/ded1881ba0927eb9cabfb06a61d81b88_300x300.webp",
    "priceCurrent": "$21.92",
    "title": "Pure Matcha Powder 15 Sticks/Box - No Lumps Ultra Smooth Instant Dissolve"
  },
  {
    "badges": [],
    "brand": "TSUJIRI",
    "brandHref": "https://www.yami.com/us/en/b/sujiri/7482",
    "href": "https://www.yami.com/us/en/p/matcha-milk-extra-strong-tea-style-150g/5157082961",
    "id": "5157082961",
    "image": "https://cdn.yamibuy.net/item/0d9a33ae8d927c6735f3676ca20ae835_300x300.webp",
    "priceCurrent": "$11.99",
    "priceOriginal": "$13.99",
    "soldCount": "50+ Sold",
    "title": "Matcha Milk Extra Strong Tea Style 150g"
  }
] satisfies readonly LiveMatchaProductSource[];

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
    id: `search-${source.id}`,
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
