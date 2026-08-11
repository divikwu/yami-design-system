import type {
  ProductListItem,
  ThemeProductListProps,
  ThemeProductListTheme,
} from "@yami/design-system";

type Locale = "en" | "zh";

interface LocalizedText {
  en: string;
  zh: string;
}

interface AnuaProductSource {
  itemNumber: string;
  href: string;
  image: string;
  title: LocalizedText;
  price: number;
  marketPrice?: number;
  lowPrice?: boolean;
}

const images = {
  sceneCleanse: new URL(
    "./assets/start-here/scene-cleanse-v2.webp",
    import.meta.url,
  ).href,
  sceneCalm: new URL(
    "./assets/start-here/scene-calm-v2.webp",
    import.meta.url,
  ).href,
  sceneBrighten: new URL(
    "./assets/start-here/scene-brighten-v2.webp",
    import.meta.url,
  ).href,
  sceneHydrate: new URL(
    "./assets/start-here/scene-hydrate-v2.webp",
    import.meta.url,
  ).href,
  sceneProtect: new URL(
    "./assets/start-here/scene-protect-v2.webp",
    import.meta.url,
  ).href,
  cleansingOil: new URL(
    "./assets/start-here/product-cleansing-oil.webp",
    import.meta.url,
  ).href,
  heartleafCleansingFoam: new URL(
    "./assets/start-here/product-heartleaf-cleansing-foam.webp",
    import.meta.url,
  ).href,
  heartleafSuccinicCleansingFoam: new URL(
    "./assets/start-here/product-heartleaf-succinic-cleansing-foam.webp",
    import.meta.url,
  ).href,
  pdrnCleansingFoamSet: new URL(
    "./assets/start-here/product-pdrn-cleansing-foam-set.webp",
    import.meta.url,
  ).href,
  hyaluronicCleanser: new URL(
    "./assets/start-here/product-hyaluronic-cleanser.webp",
    import.meta.url,
  ).href,
  riceEnzymePowder: new URL(
    "./assets/start-here/product-rice-enzyme-powder.webp",
    import.meta.url,
  ).href,
  heartleafToner: new URL(
    "./assets/start-here/product-heartleaf-toner.webp",
    import.meta.url,
  ).href,
  heartleafTonerPad: new URL(
    "./assets/start-here/product-heartleaf-toner-pad.webp",
    import.meta.url,
  ).href,
  heartleafAmpoule: new URL(
    "./assets/start-here/product-heartleaf-ampoule.webp",
    import.meta.url,
  ).href,
  heartleafSheetMask: new URL(
    "./assets/start-here/product-heartleaf-sheet-mask.webp",
    import.meta.url,
  ).href,
  heartleafIntenseCalmingCream: new URL(
    "./assets/start-here/product-heartleaf-intense-calming-cream.webp",
    import.meta.url,
  ).href,
  heartleafRedSpotCream: new URL(
    "./assets/start-here/product-heartleaf-red-spot-cream.webp",
    import.meta.url,
  ).href,
  niacinamideTxaSerum: new URL(
    "./assets/start-here/product-niacinamide-txa-serum.webp",
    import.meta.url,
  ).href,
  riceMilkyToner: new URL(
    "./assets/start-here/product-rice-milky-toner.webp",
    import.meta.url,
  ).href,
  peachNiacinSerum: new URL(
    "./assets/start-here/product-peach-niacin-serum.webp",
    import.meta.url,
  ).href,
  peachCollagenMask: new URL(
    "./assets/start-here/product-peach-collagen-mask.webp",
    import.meta.url,
  ).href,
  niacinamideTxaMask: new URL(
    "./assets/start-here/product-niacinamide-txa-mask.webp",
    import.meta.url,
  ).href,
  azelaicAcidSerum: new URL(
    "./assets/start-here/product-azelaic-acid-serum.webp",
    import.meta.url,
  ).href,
  pdrnCapsuleSerum: new URL(
    "./assets/start-here/product-pdrn-capsule-serum.webp",
    import.meta.url,
  ).href,
  pdrnCream: new URL(
    "./assets/start-here/product-pdrn-cream.webp",
    import.meta.url,
  ).href,
  pdrnMist: new URL(
    "./assets/start-here/product-pdrn-mist.webp",
    import.meta.url,
  ).href,
  riceCeramideSerum: new URL(
    "./assets/start-here/product-rice-ceramide-serum.webp",
    import.meta.url,
  ).href,
  ceramidePanthenolCream: new URL(
    "./assets/start-here/product-ceramide-panthenol-cream.webp",
    import.meta.url,
  ).href,
  heartleafSoothingCream: new URL(
    "./assets/start-here/product-heartleaf-soothing-cream.webp",
    import.meta.url,
  ).href,
  kpdhSunscreen: new URL(
    "./assets/start-here/product-kpdh-sunscreen.webp",
    import.meta.url,
  ).href,
  zeroCastSunscreen: new URL(
    "./assets/start-here/product-zero-cast-sunscreen.webp",
    import.meta.url,
  ).href,
  peachConditioningMilk: new URL(
    "./assets/start-here/product-peach-conditioning-milk.webp",
    import.meta.url,
  ).href,
  heartleafDailyLotion: new URL(
    "./assets/start-here/product-heartleaf-daily-lotion.webp",
    import.meta.url,
  ).href,
  invisibleGlowSunStick: new URL(
    "./assets/start-here/product-invisible-glow-sun-stick.webp",
    import.meta.url,
  ).href,
  heartleafSilkySunCream: new URL(
    "./assets/start-here/product-heartleaf-silky-sun-cream.webp",
    import.meta.url,
  ).href,
} as const;

// Snapshot verified against the ANUA brand catalog on 2026-08-10.
const products = {
  cleansingOil: {
    itemNumber: "1022373071",
    href: "https://www.yami.com/us/zh/p/heartleaf-pore-control-cleansing-oil-200ml/1022373071",
    image: images.cleansingOil,
    title: {
      en: "Heartleaf Pore Control Cleansing Oil, 200 ml",
      zh: "鱼腥草毛孔清洁卸妆油 200ml",
    },
    price: 18.99,
    marketPrice: 19.99,
  },
  heartleafCleansingFoam: {
    itemNumber: "1022446461",
    href: "https://www.yami.com/us/zh/p/heartleaf-quercetinol-pore-deep-cleansing-foam-5-07-fl-oz/1022446461",
    image: images.heartleafCleansingFoam,
    title: {
      en: "Heartleaf Quercetinol Pore Deep Cleansing Foam, 150 ml",
      zh: "鱼腥草槲皮素深层毛孔洁面泡沫 150ml",
    },
    price: 10.29,
    marketPrice: 14.99,
    lowPrice: true,
  },
  hyaluronicCleanser: {
    itemNumber: "1022604281",
    href: "https://www.yami.com/us/zh/p/8-hyaluronic-acid-hydrating-gentle-foaming/1022604281",
    image: images.hyaluronicCleanser,
    title: {
      en: "8 Hyaluronic Acid Hydrating Gentle Foaming Cleanser, 150 ml",
      zh: "8 重玻尿酸温和保湿洁面泡沫 150ml",
    },
    price: 13.09,
    marketPrice: 13.99,
  },
  riceEnzymePowder: {
    itemNumber: "3022589911",
    href: "https://www.yami.com/us/zh/p/vietnam-vinamilk-anua-rice-enzyme-brightening-cleansing-powder-40g/3022589911",
    image: images.riceEnzymePowder,
    title: {
      en: "Rice Enzyme Brightening Cleansing Powder, 40 g",
      zh: "大米酵素焕亮洁面粉 40g",
    },
    price: 16.39,
    marketPrice: 18,
  },
  heartleafToner: {
    itemNumber: "1022281871",
    href: "https://www.yami.com/us/zh/p/heartleaf-77-soothing-toner-8-45-fl-oz/1022281871",
    image: images.heartleafToner,
    title: {
      en: "Heartleaf 77% + Hyaluron Soothing Toner, 250 ml",
      zh: "鱼腥草 77% 玻尿酸舒缓爽肤水 250ml",
    },
    price: 14.83,
    marketPrice: 20.99,
  },
  heartleafTonerPad: {
    itemNumber: "1022281861",
    href: "https://www.yami.com/us/zh/p/heartleaf-77-clear-pad-70-tablets-box/1022281861",
    image: images.heartleafTonerPad,
    title: {
      en: "Heartleaf 77% Clear Toner Pad, 70 pads",
      zh: "鱼腥草 77% 舒缓棉片 70片",
    },
    price: 20.19,
    marketPrice: 24.99,
  },
  heartleafAmpoule: {
    itemNumber: "5022426121",
    href: "https://www.yami.com/us/zh/p/anua-heartleaf-80-moisture-soothing-ampoule-30ml/5022426121",
    image: images.heartleafAmpoule,
    title: {
      en: "Heartleaf 80% Moisture Soothing Ampoule, 30 ml",
      zh: "鱼腥草 80% 保湿舒缓安瓶 30ml",
    },
    price: 21.99,
    marketPrice: 25,
  },
  heartleafSheetMask: {
    itemNumber: "1127080041",
    href: "https://www.yami.com/us/zh/p/anua-heartleaf-77-soothing-sheet-mask-0-85-fl-oz-10ea/1127080041",
    image: images.heartleafSheetMask,
    title: {
      en: "Heartleaf 77% Soothing Sheet Mask, 10 sheets",
      zh: "鱼腥草 77% 舒缓面膜 10片",
    },
    price: 26.99,
    marketPrice: 32,
  },
  niacinamideTxaSerum: {
    itemNumber: "1022446351",
    href: "https://www.yami.com/us/zh/p/niacinamide-10-txa-4-dark-spot-correcting-serum-1-01-fl-oz/1022446351",
    image: images.niacinamideTxaSerum,
    title: {
      en: "Niacinamide 10% + TXA 4% Dark Spot Correcting Serum, 30 ml",
      zh: "烟酰胺 10% + 传明酸 4% 淡斑精华 30ml",
    },
    price: 23.09,
    marketPrice: 24.99,
  },
  riceMilkyToner: {
    itemNumber: "1022500901",
    href: "https://www.yami.com/us/zh/p/rice-70-glow-milky-toner/1022500901",
    image: images.riceMilkyToner,
    title: {
      en: "Rice 70% Glow Milky Toner, 250 ml",
      zh: "大米 70% 焕亮乳白爽肤水 250ml",
    },
    price: 18.21,
    marketPrice: 22.59,
  },
  peachNiacinSerum: {
    itemNumber: "3022605261",
    href: "https://www.yami.com/us/zh/p/peach-70-niacinamide-serum-30ml/3022605261",
    image: images.peachNiacinSerum,
    title: {
      en: "Peach 70% Niacinamide Serum, 30 ml",
      zh: "桃子 70% 烟酰胺精华 30ml",
    },
    price: 16.99,
    marketPrice: 20,
  },
  peachCollagenMask: {
    itemNumber: "1127155961",
    href: "https://www.yami.com/us/zh/p/4ea-peach-70-niacin-brightening-collagen-mask/1127155961",
    image: images.peachCollagenMask,
    title: {
      en: "Peach 70% Niacin Brightening Collagen Mask, 4 sheets",
      zh: "桃子 70% 烟酰胺焕亮胶原面膜 4片",
    },
    price: 19.99,
    marketPrice: 24,
  },
  pdrnCapsuleSerum: {
    itemNumber: "3022589791",
    href: "https://www.yami.com/us/zh/p/vietnam-vinamilk-anua-pdrn-hyaluronic-acid-capsule-100-serum-30ml/3022589791",
    image: images.pdrnCapsuleSerum,
    title: {
      en: "PDRN Hyaluronic Acid Capsule 100 Serum, 30 ml",
      zh: "PDRN 玻尿酸胶囊 100 精华 30ml",
    },
    price: 24.39,
    marketPrice: 29,
  },
  pdrnCream: {
    itemNumber: "3022619681",
    href: "https://www.yami.com/us/zh/p/vietnam-vinamilk-anua-pdrn-hyaluronic-acid-100-moisturizing-cream-60ml-1pc/3022619681",
    image: images.pdrnCream,
    title: {
      en: "PDRN Hyaluronic Acid 100 Moisturizing Cream, 60 ml",
      zh: "PDRN 玻尿酸 100 保湿面霜 60ml",
    },
    price: 17.59,
    marketPrice: 26.99,
  },
  pdrnMist: {
    itemNumber: "3022634191",
    href: "https://www.yami.com/us/zh/p/vietnam-vinamilk-anua-pdrn-hyaluronic-acid-hydrating-capsule-mist-30ml-100ml/3022634191",
    image: images.pdrnMist,
    title: {
      en: "PDRN Hyaluronic Acid Hydrating Capsule Mist, 100 ml",
      zh: "PDRN 玻尿酸补水胶囊喷雾 100ml",
    },
    price: 20.69,
    marketPrice: 32.99,
  },
  riceCeramideSerum: {
    itemNumber: "1022500661",
    href: "https://www.yami.com/us/zh/p/7-rice-ceramide-hydrating-barrier-serum/1022500661",
    image: images.riceCeramideSerum,
    title: {
      en: "7+ Rice Ceramide Hydrating Barrier Serum, 50 ml",
      zh: "大米 7+ 神经酰胺屏障精华 50ml",
    },
    price: 21.09,
    marketPrice: 23.49,
  },
  kpdhSunscreen: {
    itemNumber: "5022760411",
    href: "https://www.yami.com/us/zh/p/kpdh-daily-clear-moisturizing-sun-cream-50ml/5022760411",
    image: images.kpdhSunscreen,
    title: {
      en: "KPDH Daily Clear Moisturizing Sun Cream SPF50+, 50 ml",
      zh: "KPDH 清爽保湿防晒霜 SPF50+ 50ml",
    },
    price: 12.99,
    marketPrice: 16.99,
  },
  zeroCastSunscreen: {
    itemNumber: "3022619621",
    href: "https://www.yami.com/us/zh/p/vietnam-vinamilk-anua-zero-cast-moisturizing-finish-sunscreen-50ml/3022619621",
    image: images.zeroCastSunscreen,
    title: {
      en: "Zero-Cast Moisturizing Finish Sunscreen, 50 ml",
      zh: "Zero-Cast 清爽保湿防晒霜 50ml",
    },
    price: 12.98,
    marketPrice: 16.99,
  },
  peachConditioningMilk: {
    itemNumber: "1022693801",
    href: "https://www.yami.com/us/zh/p/peach-77-niacin-conditioning-milk-150ml/1022693801",
    image: images.peachConditioningMilk,
    title: {
      en: "Peach 77+ Niacin Conditioning Milk, 150 ml",
      zh: "桃子 77+ 烟酰胺润肤乳 150ml",
    },
    price: 22.69,
    marketPrice: 28.49,
  },
  heartleafDailyLotion: {
    itemNumber: "1025121361",
    href: "https://www.yami.com/us/zh/p/anua-70-heartleaf-daily-lotion-200ml/1025121361",
    image: images.heartleafDailyLotion,
    title: {
      en: "Heartleaf 70% Daily Lotion, 200 ml",
      zh: "鱼腥草 70% 日常舒缓乳液 200ml",
    },
    price: 20.5,
    marketPrice: 24.99,
  },
  heartleafSuccinicCleansingFoam: {
    itemNumber: "3022589871",
    href: "https://www.yami.com/us/zh/p/heartleaf-succinic-moisture-cleansing-foam-150ml/3022589871",
    image: images.heartleafSuccinicCleansingFoam,
    title: {
      en: "Heartleaf Succinic Moisture Cleansing Foam, 150 ml",
      zh: "鱼腥草琥珀酸保湿洁面泡沫 150ml",
    },
    price: 11.99,
    marketPrice: 17.4,
  },
  pdrnCleansingFoamSet: {
    itemNumber: "3022763211",
    href: "https://www.yami.com/us/zh/p/pdrn-hyaluronic-acid-moisturizing-cleansing-foam-150ml-set/3022763211",
    image: images.pdrnCleansingFoamSet,
    title: {
      en: "PDRN Hyaluronic Acid Moisturizing Cleansing Foam Set, 150 ml",
      zh: "PDRN 玻尿酸保湿洁面泡沫套装 150ml",
    },
    price: 20,
    marketPrice: 25,
  },
  heartleafIntenseCalmingCream: {
    itemNumber: "3022605251",
    href: "https://www.yami.com/us/zh/p/heartleaf-70-intense-calming-cream-with-ceramide-50ml/3022605251",
    image: images.heartleafIntenseCalmingCream,
    title: {
      en: "Heartleaf 70% Intense Calming Cream with Ceramide, 50 ml",
      zh: "鱼腥草 70% 神经酰胺深度舒缓霜 50ml",
    },
    price: 17.99,
    marketPrice: 25,
  },
  heartleafRedSpotCream: {
    itemNumber: "3022619671",
    href: "https://www.yami.com/us/zh/p/heartleaf-centella-red-spot-cream-30g/3022619671",
    image: images.heartleafRedSpotCream,
    title: {
      en: "Heartleaf Centella Red Spot Cream, 30 g",
      zh: "鱼腥草积雪草修红霜 30g",
    },
    price: 11.99,
    marketPrice: 19,
  },
  niacinamideTxaMask: {
    itemNumber: "3127200081",
    href: "https://www.yami.com/us/zh/p/niacinamide-txa-serum-mask-5-sheets/3127200081",
    image: images.niacinamideTxaMask,
    title: {
      en: "Niacinamide TXA Serum Mask, 5 sheets",
      zh: "烟酰胺 + 传明酸精华面膜 5片",
    },
    price: 17.83,
  },
  azelaicAcidSerum: {
    itemNumber: "3022747351",
    href: "https://www.yami.com/us/zh/p/azelaic-acid-10-hyaluron-redness-soothing-serum/3022747351",
    image: images.azelaicAcidSerum,
    title: {
      en: "Azelaic Acid 10% + Hyaluron Redness Soothing Serum, 30 ml",
      zh: "壬二酸 10% + 玻尿酸舒缓修红精华 30ml",
    },
    price: 19.99,
  },
  ceramidePanthenolCream: {
    itemNumber: "3022747321",
    href: "https://www.yami.com/us/zh/p/3-ceramide-panthenol-moisture-barrier-cream-100ml/3022747321",
    image: images.ceramidePanthenolCream,
    title: {
      en: "3+ Ceramide Panthenol Moisture Barrier Cream, 100 ml",
      zh: "3+ 神经酰胺泛醇保湿屏障霜 100ml",
    },
    price: 23.99,
  },
  heartleafSoothingCream: {
    itemNumber: "5022424181",
    href: "https://www.yami.com/us/zh/p/heartleaf-70-soothing-cream-100ml/5022424181",
    image: images.heartleafSoothingCream,
    title: {
      en: "Heartleaf 70% Soothing Cream, 100 ml",
      zh: "鱼腥草 70% 舒缓面霜 100ml",
    },
    price: 16.99,
    marketPrice: 28,
  },
  invisibleGlowSunStick: {
    itemNumber: "3022763031",
    href: "https://www.yami.com/us/zh/p/invisible-glow-finish-sunscreen-stick-18g/3022763031",
    image: images.invisibleGlowSunStick,
    title: {
      en: "Invisible Glow Finish Sunscreen Stick, 18 g",
      zh: "隐形光泽防晒棒 18g",
    },
    price: 16.99,
    marketPrice: 22,
  },
  heartleafSilkySunCream: {
    itemNumber: "3022747441",
    href: "https://www.yami.com/us/zh/p/heartleaf-silky-moisture-sun-cream-50ml/3022747441",
    image: images.heartleafSilkySunCream,
    title: {
      en: "Heartleaf Silky Moisture Sun Cream, 50 ml",
      zh: "鱼腥草丝滑保湿防晒霜 50ml",
    },
    price: 24.2,
  },
} satisfies Record<string, AnuaProductSource>;

export type AnuaProductKey = keyof typeof products;

interface ThemeDefinition {
  value: string;
  label: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  image: string;
  imageAlt: LocalizedText;
  backgroundColor: string;
  productKeys: AnuaProductKey[];
}

const themeDefinitions: ThemeDefinition[] = [
  {
    value: "cleanse-reset",
    label: { en: "Cleanse & Reset", zh: "温和清洁" },
    title: {
      en: "Thoroughly cleanse, without the tight feel",
      zh: "清洁彻底，也保持舒适",
    },
    description: {
      en: "Dissolve makeup and sunscreen first, then finish with foam or enzyme care to reduce pore buildup.",
      zh: "先溶解彩妆与防晒，再用泡沫或酵素完成清洁，减少毛孔负担。",
    },
    image: images.sceneCleanse,
    imageAlt: {
      en: "ANUA Heartleaf cleansing oil in a clear water setting",
      zh: "清透水感场景中的 ANUA 鱼腥草卸妆油",
    },
    backgroundColor: "rgb(208, 205, 205)",
    productKeys: [
      "cleansingOil",
      "heartleafCleansingFoam",
      "hyaluronicCleanser",
      "riceEnzymePowder",
      "heartleafSuccinicCleansingFoam",
      "pdrnCleansingFoamSet",
    ],
  },
  {
    value: "calm-prep",
    label: { en: "Calm & Prep", zh: "舒缓调理" },
    title: {
      en: "Soothe first, then prep for what follows",
      zh: "先舒缓，再为后续护理打底",
    },
    description: {
      en: "Layer Heartleaf toner and pads with an ampoule or mask to replenish sensitive, redness-prone skin.",
      zh: "用鱼腥草爽肤水与棉片补水舒缓，搭配安瓶和面膜照顾敏感泛红。",
    },
    image: images.sceneCalm,
    imageAlt: {
      en: "ANUA Heartleaf 77 toner held against a soft gray background",
      zh: "柔灰背景中的 ANUA 鱼腥草 77 爽肤水",
    },
    backgroundColor: "rgb(154, 165, 164)",
    productKeys: [
      "heartleafToner",
      "heartleafTonerPad",
      "heartleafAmpoule",
      "heartleafSheetMask",
      "heartleafIntenseCalmingCream",
      "heartleafRedSpotCream",
    ],
  },
  {
    value: "brighten-correct",
    label: { en: "Brighten & Correct", zh: "淡斑提亮" },
    title: {
      en: "Target dark spots and dull tone",
      zh: "集中改善暗沉与痘印",
    },
    description: {
      en: "Combine niacinamide, TXA, rice, and peach care to brighten the look of uneven, tired skin.",
      zh: "烟酰胺、传明酸、大米与桃子系列协同提亮，让肤色更均匀透亮。",
    },
    image: images.sceneBrighten,
    imageAlt: {
      en: "ANUA Niacinamide 10% and TXA 4% serum with pink accents",
      zh: "粉色光感场景中的 ANUA 烟酰胺 10% 与传明酸 4% 精华",
    },
    backgroundColor: "rgb(208, 149, 155)",
    productKeys: [
      "niacinamideTxaSerum",
      "riceMilkyToner",
      "peachNiacinSerum",
      "peachCollagenMask",
      "niacinamideTxaMask",
      "azelaicAcidSerum",
    ],
  },
  {
    value: "hydrate-repair",
    label: { en: "Hydrate & Repair", zh: "补水修护" },
    title: {
      en: "Replenish moisture and support the barrier",
      zh: "补足水分，稳住肌肤屏障",
    },
    description: {
      en: "Use PDRN, hyaluronic acid, and ceramides to cushion dry skin, then seal hydration with cream.",
      zh: "以 PDRN、玻尿酸和神经酰胺补水充盈，并用面霜锁住水分。",
    },
    image: images.sceneHydrate,
    imageAlt: {
      en: "ANUA PDRN Hyaluronic Acid serum in a fresh aqua setting",
      zh: "清透水绿色场景中的 ANUA PDRN 玻尿酸精华",
    },
    backgroundColor: "rgb(146, 169, 173)",
    productKeys: [
      "pdrnCapsuleSerum",
      "pdrnCream",
      "pdrnMist",
      "riceCeramideSerum",
      "ceramidePanthenolCream",
      "heartleafSoothingCream",
    ],
  },
  {
    value: "protect-finish",
    label: { en: "Protect & Finish", zh: "日间防护" },
    title: {
      en: "Moisturize, then finish with daily SPF",
      zh: "保湿打底，完成日间防护",
    },
    description: {
      en: "Start with a lightweight lotion, then complete the routine with comfortable, no-cast sun protection.",
      zh: "轻盈乳液先补水，再用清爽防晒完成日间保护，减少厚重负担。",
    },
    image: images.sceneProtect,
    imageAlt: {
      en: "ANUA Zero-Cast sunscreen displayed in warm daylight",
      zh: "暖阳场景中陈列的 ANUA Zero-Cast 防晒霜",
    },
    backgroundColor: "rgb(185, 165, 137)",
    productKeys: [
      "kpdhSunscreen",
      "zeroCastSunscreen",
      "peachConditioningMilk",
      "heartleafDailyLotion",
      "invisibleGlowSunStick",
      "heartleafSilkySunCream",
    ],
  },
];

function formatPrice(value: number) {
  return `$${value.toFixed(2)}`;
}

function createProduct(
  source: AnuaProductSource,
  locale: Locale,
): ProductListItem {
  const title = source.title[locale];
  const discount = source.marketPrice
    ? Math.round(
        ((source.marketPrice - source.price) / source.marketPrice) * 100,
      )
    : undefined;
  return {
    id: source.itemNumber,
    image: source.image,
    imageAlt: title,
    brand: "ANUA",
    brandHref: `https://www.yami.com/us/${locale}/b/anua/11712`,
    href: source.href.replace("/zh/", `/${locale}/`),
    title,
    priceCurrent: formatPrice(source.price),
    priceOriginal: source.marketPrice
      ? formatPrice(source.marketPrice)
      : undefined,
    badges: source.lowPrice
      ? [{ label: "Low Price", type: "low-price" }]
      : discount
        ? [{ label: `-${discount}%`, type: "discount" }]
        : undefined,
    addButtonAriaLabel:
      locale === "zh" ? `添加${title}到购物车` : `Add ${title} to cart`,
  };
}

export function createAnuaProductMap(
  locale: Locale,
): Record<AnuaProductKey, ProductListItem> {
  return Object.fromEntries(
    Object.entries(products).map(([key, source]) => [
      key,
      createProduct(source, locale),
    ]),
  ) as Record<AnuaProductKey, ProductListItem>;
}

export function createStartHereProps(locale: Locale): ThemeProductListProps {
  const themes: ThemeProductListTheme[] = themeDefinitions.map(
    (definition) => ({
      value: definition.value,
      label: definition.label[locale],
      content: {
        image: {
          src: definition.image,
          alt: definition.imageAlt[locale],
        },
        backgroundColor: definition.backgroundColor,
        title: definition.title[locale],
        description: definition.description[locale],
        href: `https://www.yami.com/us/${locale}/b/anua/11712`,
      },
      products: definition.productKeys.map((key) =>
        createProduct(products[key], locale),
      ),
    }),
  );
  const firstTheme = themes[0];

  return {
    title: locale === "zh" ? "从这里开始" : "Start here",
    content: firstTheme.content,
    products: firstTheme.products,
    themes,
    defaultValue: firstTheme.value,
    previousLabel: locale === "zh" ? "上一组商品" : "Previous products",
    nextLabel: locale === "zh" ? "下一组商品" : "Next products",
    onAddToCart: () => {},
  };
}
