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

/** Static Yami catalog snapshot for "matcha powder", captured 2026-08-26. */
const liveMatchaProducts = [
  {
    "id": "1157010241",
    "title": "Japanese Matcha Powder, Isuzu, Premium Green Tea,Japanese Tea,1.41 oz",
    "image": "https://cdn.yamibuy.net/item/0366931674f74f6c47d1fb9424c53286_0x0.webp",
    "href": "https://www.yami.com/us/en/p/matcha-powder-1-41-oz/1157010241",
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "priceCurrent": "$39.49",
    "priceOriginal": "$49.99",
    "rating": 4.9,
    "ratingCount": "9",
    "soldCount": "100+ Sold",
    "badges": [
      "Hot"
    ]
  },
  {
    "id": "1020002271",
    "title": "Japanese Matcha Powder ,Green Tea Powder, Universal Quality,0 Sugar 0 Added, 0.98 oz",
    "image": "https://cdn.yamibuy.net/item/f7ba4a880b5402d26388d9cd61b2f2aa_0x0.webp",
    "href": "https://www.yami.com/us/en/p/maeda-en-matcha-green-tea-powder-28g/1020002271",
    "brand": "MAEDA-EN",
    "brandHref": "https://www.yami.com/us/en/b/maeda-en/462",
    "priceCurrent": "$16.99",
    "priceOriginal": "$19.99",
    "rating": 4.8,
    "ratingCount": "52",
    "soldCount": "60+ Sold",
    "badges": [
      "Low Price"
    ]
  },
  {
    "id": "1020065241",
    "title": "Uji  Matcha Powder Unsweetened, Japanese Green Tea, 0 Sugar,1.41 oz",
    "image": "https://cdn.yamibuy.net/item/1fed61add370f497428cbe3090fd3981_0x0.webp",
    "href": "https://www.yami.com/us/en/p/soluble-and-unsweetened-matcha-40g/1020065241",
    "brand": "TSUJIRI",
    "brandHref": "https://www.yami.com/us/en/b/sujiri/7482",
    "priceCurrent": "$9.69",
    "priceOriginal": "$10.99",
    "rating": 4.7,
    "ratingCount": "33",
    "soldCount": "200+ Sold",
    "badges": []
  },
  {
    "id": "1020062601",
    "title": "Japanese Matcha Powder ,Green Tea Powder,Culinary Grade ,0 Sugar 0 Added, 0.98 oz",
    "image": "https://cdn.yamibuy.net/item/e52fc64a272a7d283babf188f29766d8_0x0.webp",
    "href": "https://www.yami.com/us/en/p/matcha-culinary-qlty-28g/1020062601",
    "brand": "MAEDA-EN",
    "brandHref": "https://www.yami.com/us/en/b/maeda-en/462",
    "priceCurrent": "$16.19",
    "rating": 4.6,
    "ratingCount": "7",
    "soldCount": "50+ Sold",
    "badges": [
      "Low Price"
    ]
  },
  {
    "id": "1157077631",
    "title": "Japanese Matcha Powder Wako, 0.71 oz【Smooth Texture】【For Drinks & Cooking】",
    "image": "https://cdn.yamibuy.net/item/62a13d24611a5f14cd01ce21c55e1078_0x0.webp",
    "href": "https://www.yami.com/us/en/p/marukyu-koyamaen-matcha-powder-wakou-0-71oz-classic-matcha-smooth-texture-ideal-for-tea-preparation/1157077631",
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "priceCurrent": "$34.99",
    "priceOriginal": "$44.99",
    "rating": 5,
    "ratingCount": "1",
    "soldCount": "30+ Sold",
    "badges": [
      "Low Price"
    ]
  },
  {
    "id": "1157087711",
    "title": "Matcha Powder  Yugen,Ceremonial Grade, 0.70 oz【For Lattes, Smoothies, Baking & Cooking】",
    "image": "https://cdn.yamibuy.net/item/e982afa9caefc881cad9141d3cc787e2_0x0.webp",
    "href": "https://www.yami.com/us/en/p/matcha-powder-yugen-ceremonial-grade-0-70-oz-for-lattes-smoothies-baking-cooking/1157087711",
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "priceCurrent": "$27.79",
    "priceOriginal": "$39.99",
    "rating": 0,
    "soldCount": "70+ Sold",
    "badges": [
      "Low Price"
    ]
  },
  {
    "id": "1157077621",
    "title": "Matcha Powder Yugen,Ceremonial Grade, 1.41 oz【For Lattes, Smoothies, Baking & Cooking】",
    "image": "https://cdn.yamibuy.net/item/9c75aa179c3f0ccc2f6592678862dac0_0x0.webp",
    "href": "https://www.yami.com/us/en/p/marukyu-koyamaen-matcha-powder-yugen-1-41oz-premium-grade-matcha-complex-flavor-profile-for-drinks-desserts/1157077621",
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "priceCurrent": "$63.99",
    "priceOriginal": "$64.99",
    "rating": 5,
    "ratingCount": "1",
    "soldCount": "20+ Sold",
    "badges": [
      "Low Price"
    ]
  },
  {
    "id": "1157113361",
    "title": "Matcha Powder, 1.41 oz【100% Pure, Zero Sugar, No Additives】【Clean Label】【Ideal for Matcha Lattes, Baking & Smoothies】",
    "image": "https://cdn.yamibuy.net/item/100f9e99feb2e66e1d1d127a1f020dca_0x0.webp",
    "href": "https://www.yami.com/us/en/p/matcha-powder-1-41-oz/1157113361",
    "brand": "AOZEN",
    "brandHref": "https://www.yami.com/us/en/b/aozen/24594",
    "priceCurrent": "$19.99",
    "priceOriginal": "$21.99",
    "rating": 5,
    "ratingCount": "2",
    "soldCount": "80+ Sold",
    "badges": []
  },
  {
    "id": "1157055151",
    "title": "Organic Matcha Powder,1.05 oz【National Standard Grade 1 Tea Ceremony Grade Thin Tea】 【For Latte Drinking Baked Desserts】",
    "image": "https://cdn.yamibuy.net/item/57fea5744e5ca5f7c50aeba0514a898d_0x0.webp",
    "href": "https://www.yami.com/us/en/p/mocha-green-tea-1-06-oz/1157055151",
    "brand": "Balance Master",
    "brandHref": "https://www.yami.com/us/en/b/balance-master/15703",
    "priceCurrent": "$12.99",
    "priceOriginal": "$14.99",
    "rating": 4.8,
    "ratingCount": "6",
    "soldCount": "200+ Sold",
    "badges": []
  },
  {
    "id": "1029405491",
    "title": "Matcha Powder 1.41 oz+ Chasen Bamboo Tea Whisk 【Japanese Matcha Whisking Set】【DIY Matcha Latte Essential】",
    "image": "https://cdn.yamibuy.net/item/6ea95d573b690d42209a2aeb0e6bb96e_0x0.webp",
    "href": "https://www.yami.com/us/en/p/hyakuhon-dachi-japanese-matcha-whisk-brush-tea-ceremony-tool-1-pc-pure-matcha-powder-1-41-oz-100-pure-zero-sugar-no-additives-clean-label-2-packs/1029405491",
    "brand": "AOZEN",
    "brandHref": "https://www.yami.com/us/en/b/aozen/24594",
    "priceCurrent": "$27.98",
    "rating": 0,
    "soldCount": "10+ Sold",
    "badges": []
  },
  {
    "id": "1157040151",
    "title": "Ayame Matcha Powder ​,\"Koyamaen\" Culinary Japanese Green Tea Powder,17.6 oz【For Drinks And Baked Desserts】",
    "image": "https://cdn.yamibuy.net/item/9665a1343922844de1d1ce76045d213c_0x0.webp",
    "href": "https://www.yami.com/us/en/p/f-matcha-ayame-koyamaen-17-6-oz/1157040151",
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "priceCurrent": "$70.99",
    "priceOriginal": "$89.99",
    "rating": 0,
    "soldCount": "40+ Sold",
    "badges": [
      "Choice"
    ]
  },
  {
    "id": "1157060031",
    "title": "Blendy Matcha Ippuku,Matcha Powder,No Milk,4 Sticks 1.05 oz【0 Sugar】",
    "image": "https://cdn.yamibuy.net/item/cb763f7d9e8f5e2c0bb312dc7ee52436_0x0.webp",
    "href": "https://www.yami.com/us/en/p/ajinomoto-agf-blendy-matcha-ippuku-no-milk-4-sticks/1157060031",
    "brand": "AGF",
    "brandHref": "https://www.yami.com/us/en/b/agf/1140",
    "priceCurrent": "$4.49",
    "priceOriginal": "$4.79",
    "rating": 5,
    "ratingCount": "1",
    "badges": [
      "Low Price"
    ]
  },
  {
    "id": "1157064891",
    "title": "Ujinotsuyu Matcha Powder Midori 1.41 oz【For Drinks And Baked Desserts】",
    "image": "https://cdn.yamibuy.net/item/52bbfabfe88430387cb3bfa2677c1d81_0x0.webp",
    "href": "https://www.yami.com/us/en/p/ujinotsuyu-matcha-powder-midori-1-41-oz/1157064891",
    "brand": "UJINOTSUYU",
    "brandHref": "https://www.yami.com/us/en/b/ujinotsuyu/1024",
    "priceCurrent": "$10.99",
    "priceOriginal": "$12.71",
    "rating": 5,
    "ratingCount": "1",
    "soldCount": "10+ Sold",
    "badges": []
  },
  {
    "id": "1157111301",
    "title": "Oi Ocha Matcha Powder,Ceremonial Grade, 1.06 oz【For Matcha Latte, Beverages, Baking & Desserts】",
    "image": "https://cdn.yamibuy.net/item/02ebb0201c1dc78d1309eb0d4fa890f9_0x0.webp",
    "href": "https://www.yami.com/us/en/p/oi-ocha-ceremonial-matcha-powder-1-06-oz/1157111301",
    "brand": "ITO EN",
    "brandHref": "https://www.yami.com/us/en/b/ito-en/643",
    "priceCurrent": "$26.99",
    "priceOriginal": "$35.99",
    "rating": 0,
    "soldCount": "10+ Sold",
    "badges": [
      "-25%"
    ]
  },
  {
    "id": "1157091351",
    "title": "Uji Matcha Powder 0.7 oz 【Ceremonial Grade】 【For Matcha Lattes, Drinks, Baking & Desserts】",
    "image": "https://cdn.yamibuy.net/item/d8c864c2269c57d69a0c5802b1e17389_0x0.webp",
    "href": "https://www.yami.com/us/en/p/uji-matcha-kiwami-temote/1157091351",
    "brand": "MIMIKOU",
    "brandHref": "https://www.yami.com/us/en/b/mimiko/23964",
    "priceCurrent": "$36.99",
    "priceOriginal": "$58.99",
    "rating": 0,
    "badges": [
      "-37%"
    ]
  },
  {
    "id": "1020012041",
    "title": "Sweet Matcha Powder,Green Tea Powder, 17.5 oz",
    "image": "https://cdn.yamibuy.net/item/007160e8375b74019dc38e1e3870b044_0x0.webp",
    "href": "https://www.yami.com/us/en/p/ito-en-sweet-matcha-powder-500g/1020012041",
    "brand": "ITO EN",
    "brandHref": "https://www.yami.com/us/en/b/ito-en/643",
    "priceCurrent": "$29.99",
    "priceOriginal": "$30.99",
    "rating": 0,
    "soldCount": "20+ Sold",
    "badges": [
      "Low Price"
    ]
  },
  {
    "id": "1157075991",
    "title": "Tian Shou Matcha Powder, 1.1 oz[Tea Ceremony Grade] [0 Sugar 0 Additives] [Suitable for Lattes, Beverages and Baking]",
    "image": "https://cdn.yamibuy.net/item/8378f75a3f616a5492e0daf2b153dbdd_0x0.webp",
    "href": "https://www.yami.com/us/en/p/tian-shou-matcha-powder-1-1oz/1157075991",
    "brand": "Balance Master",
    "brandHref": "https://www.yami.com/us/en/b/balance-master/15703",
    "priceCurrent": "$20.29",
    "priceOriginal": "$24.99",
    "rating": 0,
    "soldCount": "30+ Sold",
    "badges": []
  },
  {
    "id": "1157091421",
    "title": "Uji Matcha Powder Kyohaku,Green Tea Powder, 1.41 oz【Refreshing Usucha】【For Matcha Latte, Baking & Desserts】",
    "image": "https://cdn.yamibuy.net/item/dc5b2107c2e1cee43ae25db51e1e8675_0x0.webp",
    "href": "https://www.yami.com/us/en/p/kyohaku-yumemandokoro/1157091421",
    "brand": "YUMEMANDOKORO",
    "brandHref": "https://www.yami.com/us/en/b/yumemandokoro/23321",
    "priceCurrent": "$41.89",
    "priceOriginal": "$56.99",
    "rating": 0,
    "badges": [
      "-26%"
    ]
  },
  {
    "id": "1157020821",
    "title": "Japanese Matcha Love Matcha Powder ,Green Tea Powder, 0 Sugar 0 Added,1.05 oz",
    "image": "https://cdn.yamibuy.net/item/9d983def11366ceaed29bbcfda90a35e_0x0.webp",
    "href": "https://www.yami.com/us/en/p/tea-matcha-love-unsweet-matcha-1-05-oz/1157020821",
    "brand": "ITO EN",
    "brandHref": "https://www.yami.com/us/en/b/ito-en/643",
    "priceCurrent": "$17.79",
    "priceOriginal": "$17.99",
    "rating": 0,
    "soldCount": "10+ Sold",
    "badges": [
      "Low Price"
    ]
  },
  {
    "id": "1157064911",
    "title": "Matcha Powder Ceremonial Gold, 1.41 oz【100% Pure and Authentic Uji Matcha】【For DIY Latte Drinks And Desserts Baking】",
    "image": "https://cdn.yamibuy.net/item/49dbe21963184aae30c1dd04ae26f194_0x0.webp",
    "href": "https://www.yami.com/us/en/p/ujinotsuyu-matcha-powder-kin-1-41-oz/1157064911",
    "brand": "UJINOTSUYU",
    "brandHref": "https://www.yami.com/us/en/b/ujinotsuyu/1024",
    "priceCurrent": "$20.99",
    "priceOriginal": "$25.99",
    "rating": 0,
    "soldCount": "10+ Sold",
    "badges": []
  },
  {
    "id": "1157077561",
    "title": "Iemon Instant Green Tea Genmaicha Stick 30p, 0.84 oz【Add Uji Matcha Powder】",
    "image": "https://cdn.yamibuy.net/item/418cbb43da224a66f837d6e846c2d5c9_0x0.webp",
    "href": "https://www.yami.com/us/en/p/instant-green-tea/1157077561",
    "brand": "UJINOTSUYU",
    "brandHref": "https://www.yami.com/us/en/b/ujinotsuyu/1024",
    "priceCurrent": "$8.69",
    "priceOriginal": "$10.99",
    "rating": 0,
    "soldCount": "20+ Sold",
    "badges": []
  },
  {
    "id": "1157077551",
    "title": "Iemon Instant Ryokucha Green Tea Stick 30p, 0.84 oz【Add Uji Matcha Powder】",
    "image": "https://cdn.yamibuy.net/item/3576cf760c72bfc39a261b32c62b4e4d_0x0.webp",
    "href": "https://www.yami.com/us/en/p/instant-green-tea/1157077551",
    "brand": "UJINOTSUYU",
    "brandHref": "https://www.yami.com/us/en/b/ujinotsuyu/1024",
    "priceCurrent": "$8.99",
    "priceOriginal": "$10.99",
    "rating": 0,
    "soldCount": "10+ Sold",
    "badges": []
  },
  {
    "id": "1157091251",
    "title": "Lucky Cat Tin Matcha Powder 1.06 oz 【For Matcha Latte, Brewing & Baking】 【Popular Souvenir】",
    "image": "https://cdn.yamibuy.net/item/a2a3faca056aa8a44674649f472c309e_0x0.webp",
    "href": "https://www.yami.com/us/en/p/manekineko-can-matcha-hishiwaen/1157091251",
    "brand": "hishiwaen",
    "brandHref": "https://www.yami.com/us/en/b/hishiwaen/19845",
    "priceCurrent": "$11.39",
    "priceOriginal": "$16.99",
    "rating": 0,
    "badges": [
      "-32%"
    ]
  },
  {
    "id": "1157065641",
    "title": "Organic Matcha Powder, 1.76 oz【No Additives】【For DIY Latte Drinks And Baked Desserts】",
    "image": "https://cdn.yamibuy.net/item/d6ad164ecc30b898f83d6c893bebfbca_0x0.webp",
    "href": "https://www.yami.com/us/en/p/kagura-organic-matcha-powder-50g/1157065641",
    "brand": "KAGURA",
    "brandHref": "https://www.yami.com/us/en/b/kagura/16083",
    "priceCurrent": "$22.39",
    "priceOriginal": "$26.99",
    "rating": 0,
    "badges": []
  },
  {
    "id": "1157077841",
    "title": "Kyoto Uji Matcha Powder, 1.05 oz【No Additives】【For DIY Latte Drinks And Desserts Baking】",
    "image": "https://cdn.yamibuy.net/item/325f24a422f5ccbdff595bf94e9ca7f4_0x0.webp",
    "href": "https://www.yami.com/us/en/p/kyoto-uji-matcha/1157077841",
    "brand": "YAMAMO",
    "brandHref": "https://www.yami.com/us/en/b/yamamo/22597",
    "priceCurrent": "$14.99",
    "priceOriginal": "$19.99",
    "rating": 0,
    "badges": [
      "-25%"
    ]
  },
  {
    "id": "1157091241",
    "title": "Daruma Tin Matcha Powder 1.06 oz 【For Matcha Latte, Brewing & Baking】 【Popular Souvenir】",
    "image": "https://cdn.yamibuy.net/item/4562721557b96e871f025ecd24143282_0x0.webp",
    "href": "https://www.yami.com/us/en/p/daruma-can-matcha-hishiwaen/1157091241",
    "brand": "hishiwaen",
    "brandHref": "https://www.yami.com/us/en/b/hishiwaen/19845",
    "priceCurrent": "$10.69",
    "priceOriginal": "$16.99",
    "rating": 0,
    "badges": [
      "-37%"
    ]
  },
  {
    "id": "1157128051",
    "title": "Organic Matcha Powder, Ceremonial  Grade,1.05 oz【Clean Label】【USDA Certification】【For Smoothies, Lattes & Baking】",
    "image": "https://cdn.yamibuy.net/item/ebd660fee048fab64acd135b74f5082d_0x0.webp",
    "href": "https://www.yami.com/us/en/p/organic-ceremonial-matcha-1-06-oz/1157128051",
    "brand": "YAMAMOTOYAMA",
    "brandHref": "https://www.yami.com/us/en/b/yamamotoyama/1749",
    "priceCurrent": "$14.99",
    "priceOriginal": "$17.99",
    "rating": 0,
    "badges": []
  },
  {
    "id": "5157069441",
    "title": "Yiyou Yamen Uji Matcha Strong Tea Hot and Cold Matcha Latte Powder 120g",
    "image": "https://cdn.yamibuy.net/item/da55d1d3aaccd9d8779f433479d9bb6c_0x0.webp",
    "href": "https://www.yami.com/us/en/p/yiyou-yamen-uji-matcha-strong-tea-hot-and-cold-matcha-latte-powder-120g/5157069441",
    "brand": "Fukujuen",
    "brandHref": "https://www.yami.com/us/en/b/fukujoen/8443",
    "priceCurrent": "$9.99",
    "priceOriginal": "$12.79",
    "rating": 0,
    "soldCount": "50+ Sold",
    "badges": []
  },
  {
    "id": "3157066241",
    "title": "Uji Seiran Sugar-free Matcha Powder For Baking 40g",
    "image": "https://cdn.yamibuy.net/item/02f6eb0aba2a2351ee39b4248feb757e_0x0.webp",
    "href": "https://www.yami.com/us/en/p/marukyu-koyamaen-uji-seiran-sugar-free-matcha-powder-for-baking-40g/3157066241",
    "brand": "MARUKYU KOYAMAEN",
    "brandHref": "https://www.yami.com/us/en/b/marukyu-koyamaen/13583",
    "priceCurrent": "$35.80",
    "priceOriginal": "$49.99",
    "rating": 0,
    "soldCount": "200+ Sold",
    "badges": [
      "-28%"
    ]
  },
  {
    "id": "5157034111",
    "title": "2 Times Extra Thick Kyoto Uji Matcha Powder 150g*2 packs",
    "image": "https://cdn.yamibuy.net/item/873faaeb46252606320b35251dac80cf_0x0.webp",
    "href": "https://www.yami.com/us/en/p/2-times-extra-thick-kyoto-uji-matcha-powder-150g/5157034111",
    "brand": "KATAOKA",
    "brandHref": "https://www.yami.com/us/en/b/kataoka/1843",
    "priceCurrent": "$14.99",
    "priceOriginal": "$19.99",
    "rating": 5,
    "ratingCount": "1",
    "soldCount": "30+ Sold",
    "badges": [
      "-25%"
    ]
  }
] satisfies LiveMatchaProductSource[];

export const liveMatchaSearchResultCount = 2000;

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
