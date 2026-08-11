import type { ProductListItem, ProductListTab } from "@yami/design-system";

import {
  createAnuaProductMap,
  type AnuaProductKey,
} from "./startHere.fixture";

type Locale = "en" | "zh";

export const exploreMoreShortcutValues = [
  "cleanse-peel",
  "toners-pads",
  "serums-care",
  "moisturizers",
  "sunscreens",
  "face-masks",
  "makeup",
] as const;

interface SupplementalProductSource {
  id: string;
  image: string;
  href: string;
  title: Record<Locale, string>;
  price: number;
  marketPrice?: number;
}

const supplementalProducts: SupplementalProductSource[] = [
  {
    id: "3022750531",
    image: "https://cdn.yamibuy.net/item/31a5a573c166d84767efee8fa4cb4b59_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-heartleaf-pore-control-cleansing-oil-mild/3022750531",
    title: {
      en: "Heartleaf Pore Control Cleansing Oil (Mild), 200 ml",
      zh: "鱼腥草毛孔控制温和洁颜油 200ml",
    },
    price: 16.99,
  },
  {
    id: "3022763331",
    image: "https://cdn.yamibuy.net/item/b36d0e215cf45205c2154bd087f63aab_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-peach-niacin-spread-cleansing-foam-150ml/3022763331",
    title: {
      en: "Peach Niacin Cleansing Foam, 150 ml",
      zh: "桃子烟酰胺泡沫洁面乳 150ml",
    },
    price: 17,
    marketPrice: 22,
  },
  {
    id: "1127155931",
    image: "https://cdn.yamibuy.net/item/ca24d59a467a7de30aac56830ca2af50_0x0.webp",
    href: "https://www.yami.com/us/zh/p/pdrn-hyaluronic-glow-pad-180ml-60ea/1127155931",
    title: {
      en: "PDRN 100 Hyaluronic Acid Glow Pad, 60 pads",
      zh: "PDRN 100 玻尿酸光采湿敷棉片 60片",
    },
    price: 18.47,
    marketPrice: 22,
  },
  {
    id: "1022582311",
    image: "https://cdn.yamibuy.net/item/a978f3aaad71ecb9786aeb6f821ef22b_0x0.webp",
    href: "https://www.yami.com/us/zh/p/heartleaf-77-soothing-toner-vegan-8-45-fl-oz-2-2-packs/1022582311",
    title: {
      en: "Heartleaf 77% Soothing Toner Value Pack, 250 ml × 2",
      zh: "鱼腥草 77% 舒缓爽肤水超值装 250ml × 2",
    },
    price: 29.69,
    marketPrice: 41.98,
  },
  {
    id: "3022762851",
    image: "https://cdn.yamibuy.net/item/755729128018154902ab9c7fc083ce90_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-heartleaf-77-hyaluron-soothing-toner-350ml/3022762851",
    title: {
      en: "Heartleaf 77 Hyaluron Soothing Toner, 350 ml",
      zh: "鱼腥草 77 玻尿酸舒缓爽肤水 350ml",
    },
    price: 39.99,
    marketPrice: 43,
  },
  {
    id: "3022763161",
    image: "https://cdn.yamibuy.net/item/02c74c95cd27721e88df9b2d1944450b_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-pdrn-hyaluronic-acid-hydrating-capsule-mist-100ml-double-pack/3022763161",
    title: {
      en: "PDRN Hyaluronic Acid Capsule Mist Duo, 100 ml × 2",
      zh: "PDRN 玻尿酸保湿胶囊喷雾双包装 100ml × 2",
    },
    price: 39,
    marketPrice: 49,
  },
  {
    id: "1022602961",
    image: "https://cdn.yamibuy.net/item/9b678f117d7f9fc5b26ee7fb92c7da46_0x0.webp",
    href: "https://www.yami.com/us/zh/p/retinol-0-3-niacin-renewing-serum-30m/1022602961",
    title: {
      en: "Retinol 0.3% + Niacin Renewing Serum, 30 ml",
      zh: "视黄醇 0.3% + 烟酰胺焕肤精华 30ml",
    },
    price: 26.89,
    marketPrice: 30,
  },
  {
    id: "3022765021",
    image: "https://cdn.yamibuy.net/item/36dd429dd4d49a3ee15d0c3c027fd818_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-peach-77-niacin-enriched-cream-50ml/3022765021",
    title: {
      en: "Peach 77 Niacin Enriched Cream, 50 ml",
      zh: "桃子 77 烟酰胺滋润霜 50ml",
    },
    price: 24,
    marketPrice: 31,
  },
  {
    id: "3022955581",
    image: "https://cdn.yamibuy.net/item/a8b828d4220f5cdda1bccc70155e717a_0x0.webp",
    href: "https://www.yami.com/us/zh/p/anua-mineral-light-no-trace-sunscreen-spf50-50ml/3022955581",
    title: {
      en: "Mineral Light No-Trace Sunscreen SPF50+, 50 ml",
      zh: "矿物轻盈无痕防晒霜 SPF50+ 50ml",
    },
    price: 19.99,
    marketPrice: 20,
  },
  {
    id: "3022957781",
    image: "https://cdn.yamibuy.net/item/73ff4074ab392f9e1d6b359d6370f563_0x0.webp",
    href: "https://www.yami.com/us/zh/p/anua-zero-residue-moist-sunscreen-duo-50ml-x-2/3022957781",
    title: {
      en: "Zero Residue Moist Sunscreen Duo, 50 ml × 2",
      zh: "零残留保湿防晒霜双联包 50ml × 2",
    },
    price: 32.99,
    marketPrice: 33,
  },
  {
    id: "1127111951",
    image: "https://cdn.yamibuy.net/item/4499a69ef0a64385412d9415f4eac26a_0x0.webp",
    href: "https://www.yami.com/us/zh/p/heartleaf-cream-mask-night-solution-0-85-fl-oz-10pcs/1127111951",
    title: {
      en: "Heartleaf Cream Mask Night Solution, 10 sheets",
      zh: "鱼腥草乳霜夜间修护面膜 10片",
    },
    price: 26.22,
    marketPrice: 35.99,
  },
  {
    id: "3127190651",
    image: "https://cdn.yamibuy.net/item/c7ce424599ee0b712d5ca6ead1a7f711_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-mask-sheet-5ea-set-1ea-set-retinol-niacin-1ea/3127190651",
    title: {
      en: "Retinol Niacin Mask Set, 5 + 1 sheets",
      zh: "视黄醇烟酰胺面膜套装 5+1片",
    },
    price: 11.4,
  },
  {
    id: "3127174111",
    image: "https://cdn.yamibuy.net/item/24354aff7a37ee457b6e1bb0bf4207b4_0x0.webp",
    href: "https://www.yami.com/us/zh/p/vietnam-vinamilk-anua-kpdh-peach-70-niacinamide-essence-mask-10-sheets/3127174111",
    title: {
      en: "KPDH Peach 70 Niacinamide Essence Mask, 10 sheets",
      zh: "KPDH 桃子 70% 烟酰胺精华面膜 10片",
    },
    price: 22.99,
    marketPrice: 32,
  },
  {
    id: "3127222471",
    image: "https://cdn.yamibuy.net/item/408f07a1f196c8847530fe1102674897_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-biodance-anua-kpop-demon-hunters-ceramide-barrier-collagen-mask-29g-1-02-oz-x-4-sheets/3127222471",
    title: {
      en: "KPDH Ceramide Barrier Collagen Mask, 4 sheets",
      zh: "KPDH 神经酰胺屏障胶原面膜 4片",
    },
    price: 16,
    marketPrice: 18,
  },
  {
    id: "3127222431",
    image: "https://cdn.yamibuy.net/item/84fdb19b365b72439747fccb22999d45_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-biodance-anua-kpop-demon-hunters-vita-brightening-collagen-mask-34g-1-19-oz-x-4-sheets/3127222431",
    title: {
      en: "KPDH Vita Brightening Collagen Mask, 4 sheets",
      zh: "KPDH Vita 亮白胶原面膜 4片",
    },
    price: 16,
    marketPrice: 18,
  },
  {
    id: "3023876611",
    image: "https://cdn.yamibuy.net/item/19b7f9c28069c2f7ad70d7caa78789eb_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-gyul-cushion-spf50-pa-03-natural-15g/3023876611",
    title: {
      en: "Gyul Cushion SPF50+ 03 Natural, 15 g",
      zh: "Gyul 气垫 SPF50+ 03 自然色 15g",
    },
    price: 25.99,
    marketPrice: 28,
  },
  {
    id: "3023876641",
    image: "https://cdn.yamibuy.net/item/2f30213b3a837141abcae5dee019751a_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-matte-but-glow-cover-beige-50ml/3023876641",
    title: {
      en: "Matte But Glow Cover Beige, 50 ml",
      zh: "Matte But Glow 光泽遮瑕米色 50ml",
    },
    price: 22,
    marketPrice: 28,
  },
  {
    id: "3023876631",
    image: "https://cdn.yamibuy.net/item/5acc0fda931eb0d32d0743a32a5ac871_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-matte-but-glow-cover-beige-50ml-double-pack/3023876631",
    title: {
      en: "Matte But Glow Cover Beige Duo, 50 ml × 2",
      zh: "Matte But Glow 光泽遮瑕双包装 50ml × 2",
    },
    price: 71,
    marketPrice: 89,
  },
  {
    id: "3023876621",
    image: "https://cdn.yamibuy.net/item/19b7f9c28069c2f7ad70d7caa78789eb_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-gyul-cushion-spf50-pa-01-clear-15g/3023876621",
    title: {
      en: "Gyul Cushion SPF50+ 01 Clear, 15 g",
      zh: "Gyul 气垫 SPF50+ 01 清透色 15g",
    },
    price: 25.99,
    marketPrice: 28,
  },
  {
    id: "3023876601",
    image: "https://cdn.yamibuy.net/item/19b7f9c28069c2f7ad70d7caa78789eb_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-gyul-cushion-spf50-pa-2-5-neutral-15g/3023876601",
    title: {
      en: "Gyul Cushion SPF50+ 2.5 Neutral, 15 g",
      zh: "Gyul 气垫 SPF50+ 2.5 自然色 15g",
    },
    price: 25.99,
    marketPrice: 28,
  },
  {
    id: "3023876591",
    image: "https://cdn.yamibuy.net/item/19b7f9c28069c2f7ad70d7caa78789eb_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-gyul-cushion-spf50-pa-1-5-fair-15g/3023876591",
    title: {
      en: "Gyul Cushion SPF50+ 1.5 Fair, 15 g",
      zh: "Gyul 气垫 SPF50+ 1.5 浅色 15g",
    },
    price: 25.99,
    marketPrice: 33,
  },
  {
    id: "3023876581",
    image: "https://cdn.yamibuy.net/item/19b7f9c28069c2f7ad70d7caa78789eb_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-gyul-cushion-spf50-pa-set-1-5-fair-refill-15g/3023876581",
    title: {
      en: "Gyul Cushion SPF50+ 1.5 Fair + Refill Set",
      zh: "Gyul 气垫 SPF50+ 1.5 浅色替换装套装",
    },
    price: 38.99,
    marketPrice: 50,
  },
  {
    id: "3023876571",
    image: "https://cdn.yamibuy.net/item/19b7f9c28069c2f7ad70d7caa78789eb_0x0.webp",
    href: "https://www.yami.com/us/zh/p/korea-anua-gyul-cushion-spf50-pa-02-light-15g/3023876571",
    title: {
      en: "Gyul Cushion SPF50+ 02 Light, 15 g",
      zh: "Gyul 气垫 SPF50+ 02 亮白色 15g",
    },
    price: 25.99,
    marketPrice: 33,
  },
  {
    id: "3022740551",
    image: "https://cdn.yamibuy.net/item/2ad32d8d695a1b7d7ad45f49b09eb844_0x0.webp",
    href: "https://www.yami.com/us/zh/p/vietnam-vinamilk-anua-niacinamide-10-txa-serum-30ml-double-pack/3022740551",
    title: {
      en: "Niacinamide 10% + TXA Serum Duo, 30 ml × 2",
      zh: "烟酰胺 10% + TXA 精华双瓶装 30ml × 2",
    },
    price: 30.99,
    marketPrice: 45,
  },
  {
    id: "3022913071",
    image: "https://cdn.yamibuy.net/item/d9ce4900289002754655bac2e4c72555_0x0.webp",
    href: "https://www.yami.com/us/zh/p/vietnam-vinamilk-anua-pdrn-hyaluronic-acid-100-capsule-serum-30ml-30ml-refill/3022913071",
    title: {
      en: "PDRN Hyaluronic Acid Capsule Serum + Refill, 30 ml × 2",
      zh: "PDRN 玻尿酸胶囊精华补充装 30ml × 2",
    },
    price: 35.99,
    marketPrice: 45.99,
  },
];

const categoryDefinitions: Array<{
  value: string;
  label: Record<Locale, string>;
  baseKeys?: AnuaProductKey[];
  supplementalIds?: string[];
}> = [
  { value: "all", label: { en: "All", zh: "全部" } },
  {
    value: "complete-routine",
    label: { en: "Complete the Routine", zh: "搭配购买" },
    baseKeys: ["pdrnCleansingFoamSet"],
    supplementalIds: [
      "1022582311",
      "3022763161",
      "3022957781",
      "3127190651",
      "3023876581",
      "3022740551",
      "3022913071",
    ],
  },
  {
    value: "cleanse-peel",
    label: { en: "Cleanse & Peel", zh: "清洁与去角质" },
    baseKeys: [
      "cleansingOil",
      "heartleafCleansingFoam",
      "hyaluronicCleanser",
      "riceEnzymePowder",
      "heartleafSuccinicCleansingFoam",
      "pdrnCleansingFoamSet",
    ],
    supplementalIds: ["3022750531", "3022763331"],
  },
  {
    value: "toners-pads",
    label: { en: "Toners & Pads", zh: "爽肤水与棉片" },
    baseKeys: [
      "heartleafToner",
      "heartleafTonerPad",
      "riceMilkyToner",
      "pdrnMist",
    ],
    supplementalIds: [
      "1127155931",
      "1022582311",
      "3022762851",
      "3022763161",
    ],
  },
  {
    value: "serums-care",
    label: { en: "Serums & Care", zh: "精华与护理" },
    baseKeys: [
      "heartleafAmpoule",
      "niacinamideTxaSerum",
      "peachNiacinSerum",
      "pdrnCapsuleSerum",
      "riceCeramideSerum",
      "azelaicAcidSerum",
      "pdrnMist",
    ],
    supplementalIds: ["1022602961"],
  },
  {
    value: "moisturizers",
    label: { en: "Moisturizers", zh: "乳液与面霜" },
    baseKeys: [
      "pdrnCream",
      "peachConditioningMilk",
      "heartleafDailyLotion",
      "heartleafIntenseCalmingCream",
      "heartleafRedSpotCream",
      "ceramidePanthenolCream",
      "heartleafSoothingCream",
    ],
    supplementalIds: ["3022765021"],
  },
  {
    value: "sunscreens",
    label: { en: "Sunscreens", zh: "防晒" },
    baseKeys: [
      "kpdhSunscreen",
      "zeroCastSunscreen",
      "invisibleGlowSunStick",
      "heartleafSilkySunCream",
    ],
    supplementalIds: ["3022955581", "3022957781"],
  },
  {
    value: "face-masks",
    label: { en: "Face Masks", zh: "面膜" },
    baseKeys: [
      "heartleafSheetMask",
      "peachCollagenMask",
      "niacinamideTxaMask",
    ],
    supplementalIds: [
      "1127111951",
      "3127190651",
      "3127174111",
      "3127222471",
      "3127222431",
    ],
  },
  {
    value: "makeup",
    label: { en: "Makeup", zh: "彩妆" },
    supplementalIds: [
      "3023876611",
      "3023876641",
      "3023876631",
      "3023876621",
      "3023876601",
      "3023876591",
      "3023876581",
      "3023876571",
    ],
  },
];

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

function createSupplementalProduct(
  source: SupplementalProductSource,
  locale: Locale,
): ProductListItem {
  const title = source.title[locale];
  return {
    id: source.id,
    image: source.image,
    imageAlt: title,
    brand: "ANUA",
    brandHref: `https://www.yami.com/us/${locale}/b/anua/11712`,
    href: source.href.replace("/zh/", `/${locale}/`),
    title,
    priceCurrent: formatPrice(source.price),
    priceOriginal:
      source.marketPrice && source.marketPrice !== source.price
        ? formatPrice(source.marketPrice)
        : undefined,
    addButtonAriaLabel:
      locale === "zh" ? `添加${title}到购物车` : `Add ${title} to cart`,
  };
}

function withoutBadges(product: ProductListItem): ProductListItem {
  return { ...product, badges: undefined };
}

export function createExploreMoreProducts(locale: Locale) {
  const baseProducts = createAnuaProductMap(locale);
  const supplementalProductMap = new Map(
    supplementalProducts.map((source) => [
      source.id,
      createSupplementalProduct(source, locale),
    ]),
  );
  const allProducts = [
    ...Object.values(baseProducts),
    ...supplementalProductMap.values(),
  ].map(withoutBadges);
  const productsByTab = Object.fromEntries(
    categoryDefinitions.map((category) => [
      category.value,
      category.value === "all"
        ? allProducts
        : [
            ...(category.baseKeys ?? []).map((key) => baseProducts[key]),
            ...(category.supplementalIds ?? []).flatMap((id) => {
              const product = supplementalProductMap.get(id);
              return product ? [product] : [];
            }),
          ].map(withoutBadges),
    ]),
  );
  const tabs: ProductListTab[] = categoryDefinitions.map((category) => ({
    value: category.value,
    label: category.label[locale],
  }));

  return {
    products: allProducts,
    productsByTab,
    tabs,
    defaultValue: "all",
  };
}
