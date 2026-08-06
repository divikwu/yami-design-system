/**
 * Shared HeroBanner demo content.
 *
 * Only campaigns that appear in more than one place live here. The rest of each
 * consumer's lineup stays local on purpose: the component story and the
 * EcommerceHome page run *different* campaign sets, because a hero lineup is
 * editorial content rather than chrome — unlike the Header rail, which is the
 * same storefront everywhere and is therefore shared wholesale.
 *
 * Every campaign here is mirrored from the production yami.com homepage
 * carousel, artwork and copy included. `backgroundColor` carries the colour the
 * production slide declares; `useImageBottomColor` samples the artwork and
 * overrides it whenever sampling succeeds.
 */

import type {
  HeroBannerImageOnlyItem,
  HeroBannerItem,
  HeroBannerImageTextItem,
  HeroBannerImageTextProductsItem,
  HeroBannerProductsOnlyItem,
} from "./HeroBanner.types";

export type HeroBannerLocale = "en" | "zh";

/* `new URL(..., import.meta.url)` only resolves for a static string literal —
 * Vite cannot analyze a template literal, which yields a broken image. */
const art = {
  backToSchool: new URL("./assets/back-to-school.webp", import.meta.url).href,
  glow: new URL("./assets/glow-skin-like-makeup.webp", import.meta.url).href,
  glowFoundation: new URL("./assets/glow-foundation.webp", import.meta.url).href,
  glowPatches: new URL("./assets/glow-patches.webp", import.meta.url).href,
  glowPalette: new URL("./assets/glow-palette.webp", import.meta.url).href,
  japanFestival: new URL("./assets/japanese-summer-festival.webp", import.meta.url)
    .href,
  yuzuChips: new URL("./assets/yuzu-chips.webp", import.meta.url).href,
  hokkaidoCookies: new URL(
    "./assets/hokkaido-caramel-cookies.webp",
    import.meta.url,
  ).href,
  matchaDango: new URL("./assets/matcha-dango.webp", import.meta.url).href,
  greenTea: new URL("./assets/green-tea.webp", import.meta.url).href,
  buldakSnack: new URL("./assets/buldak-snack.webp", import.meta.url).href,
  turtleChips: new URL("./assets/turtle-chips.webp", import.meta.url).href,
  summerDrink: new URL("./assets/summer-drink.webp", import.meta.url).href,
  midnightStreetFood: new URL(
    "./assets/midnight-street-food.webp",
    import.meta.url,
  ).href,
  trendingSummer: new URL("./assets/trending-summer.webp", import.meta.url).href,
  saleImage: new URL("./assets/sale-image.webp", import.meta.url).href,
  skinCare: new URL("./assets/skin-care.webp", import.meta.url).href,
  summerSnack: new URL("./assets/summer-snack.webp", import.meta.url).href,
} as const;

type CampaignCopy = {
  title: string;
  description: string;
  alt: string;
  products: readonly string[];
};

const campaignCopy = {
  /** Production banner 24684. The artwork carries the "Back to School" lockup. */
  backToSchool: {
    en: {
      title: "Capsule Machine",
      description: "Everyone wins: Prizes up to $200+!",
      alt: "Back to school capsule machine and stationery",
      products: [],
    },
    zh: {
      title: "扭蛋机",
      description: "人人有奖 最高 $200+ 好礼",
      alt: "开学季扭蛋机与文具",
      products: [],
    },
  },
  /** Production banner 24695. */
  glow: {
    en: {
      title: "glow: Skin-Like Makeup",
      description: "Everyday makeup, effortless glow",
      alt: "glow foundation, hydrating patches, and eyeshadow palette",
      products: [
        "glow serum foundation",
        "glow hydrating patches",
        "glow eyeshadow palette",
      ],
    },
    zh: {
      title: "glow 裸妆感彩妆",
      description: "日常妆容 自然透亮",
      alt: "glow 粉底液、补水贴与眼影盘",
      products: ["glow 精华粉底液", "glow 补水贴", "glow 眼影盘"],
    },
  },
  /** Re-order prompt rather than a campaign — no artwork, four product tiles. */
  keepShopping: {
    en: {
      title: "Keep Shopping For",
      description: "",
      alt: "",
      products: [
        "Bottled green tea",
        "Spicy snack",
        "Corn chips",
        "Fruit drink",
      ],
    },
    zh: {
      title: "继续购买",
      description: "",
      alt: "",
      products: ["瓶装绿茶", "火鸡味零食", "玉米脆片", "水果饮料"],
    },
  },
  midnightStreetFood: {
    en: {
      title: "Midnight Street Food",
      description: "Explore Asian night bites",
      alt: "Asian street food and drinks",
      products: ["Bottled green tea", "Spicy snack", "Corn chips"],
    },
    zh: {
      title: "午夜街头美食",
      description: "探索亚洲夜市风味",
      alt: "亚洲夜市食品与饮料",
      products: ["瓶装绿茶", "火鸡味零食", "玉米脆片"],
    },
  },
  trendingSummer: {
    en: {
      title: "Trending this Summer",
      description: "Discover your new summer favorites",
      alt: "Summer drinks and snacks",
      products: ["Summer skin care", "Summer snack", "Fruit drink"],
    },
    zh: {
      title: "今夏人气精选",
      description: "发现你的夏日新宠",
      alt: "夏日饮品与零食",
      products: ["夏日护肤品", "夏日限定零食", "水果饮料"],
    },
  },
  seasonalSale: {
    en: {
      title: "YAMI seasonal sale",
      description: "",
      alt: "YAMI seasonal sale",
      products: [],
    },
    zh: {
      title: "亚米季节限定优惠",
      description: "",
      alt: "亚米季节限定优惠",
      products: [],
    },
  },
  /** Production banner 24461. */
  japaneseSummerFestival: {
    en: {
      title: "Japanese Summer Festival",
      description: "Discover Japan's festival spirit",
      alt: "Japanese snacks, green tea, and strawberry KitKat",
      products: [
        "Satisfry zesty yuzu potato chips",
        "Hokkaido salted caramel cookies",
        "Matcha dango",
      ],
    },
    zh: {
      title: "日本夏日祭",
      description: "探索日本祭典风情",
      alt: "日本零食、绿茶与草莓味 KitKat",
      products: ["Satisfry 柚子味薯片", "北海道盐味焦糖曲奇", "抹茶团子"],
    },
  },
} as const satisfies Record<string, Record<HeroBannerLocale, CampaignCopy>>;

export { campaignCopy as heroBannerCampaignCopy };

/**
 * Back to School capsule machine — image-with-text, because the artwork already
 * carries the campaign lockup and production ships no product tiles on it.
 */
export function createBackToSchoolItem(
  locale: HeroBannerLocale,
  href: string,
): HeroBannerImageTextItem {
  const copy = campaignCopy.backToSchool[locale];
  return {
    id: "back-to-school",
    href,
    image: { src: art.backToSchool, alt: copy.alt },
    title: copy.title,
    description: copy.description,
    backgroundColor: "#D3E7FF",
  };
}

/** glow: Skin-Like Makeup — image, copy, and three product tiles. */
export function createGlowItem(
  locale: HeroBannerLocale,
  href: string,
): HeroBannerImageTextProductsItem {
  const copy = campaignCopy.glow[locale];
  return {
    id: "glow-skin-like-makeup",
    href,
    image: { src: art.glow, alt: copy.alt },
    title: copy.title,
    description: copy.description,
    backgroundColor: "#F7E1E2",
    products: [
      { src: art.glowFoundation, alt: copy.products[0] },
      { src: art.glowPatches, alt: copy.products[1] },
      { src: art.glowPalette, alt: copy.products[2] },
    ],
  };
}

/** Japanese Summer Festival — image, copy, and three product tiles. */
export function createJapaneseSummerFestivalItem(
  locale: HeroBannerLocale,
  href: string,
): HeroBannerImageTextProductsItem {
  const copy = campaignCopy.japaneseSummerFestival[locale];
  return {
    id: "japanese-summer-festival",
    href,
    image: { src: art.japanFestival, alt: copy.alt },
    title: copy.title,
    description: copy.description,
    backgroundColor: "#FFF6D5",
    products: [
      { src: art.yuzuChips, alt: copy.products[0] },
      { src: art.hokkaidoCookies, alt: copy.products[1] },
      { src: art.matchaDango, alt: copy.products[2] },
    ],
  };
}

/**
 * "Keep shopping for" — a re-order prompt, not a campaign. It ships no artwork,
 * so `HeroBanner` pins it to the last slot of the first view, hides it below
 * 1024px, and borrows its surface from a sibling. Declaring no
 * `backgroundColor` here is what enables that last part.
 */
export function createKeepShoppingItem(
  locale: HeroBannerLocale,
  href: string,
): HeroBannerProductsOnlyItem {
  const copy = campaignCopy.keepShopping[locale];
  return {
    id: "keep-shopping",
    href,
    title: copy.title,
    products: [
      { src: art.greenTea, alt: copy.products[0] },
      { src: art.buldakSnack, alt: copy.products[1] },
      { src: art.turtleChips, alt: copy.products[2] },
      { src: art.summerDrink, alt: copy.products[3] },
    ],
  };
}

/** Midnight Street Food — image, copy, and three product tiles. */
export function createMidnightStreetFoodItem(
  locale: HeroBannerLocale,
  href: string,
): HeroBannerImageTextProductsItem {
  const copy = campaignCopy.midnightStreetFood[locale];
  return {
    id: "midnight-street-food",
    href,
    image: { src: art.midnightStreetFood, alt: copy.alt },
    title: copy.title,
    description: copy.description,
    backgroundColor: "#FFD4B4",
    products: [
      { src: art.greenTea, alt: copy.products[0] },
      { src: art.buldakSnack, alt: copy.products[1] },
      { src: art.turtleChips, alt: copy.products[2] },
    ],
  };
}

/** Trending this Summer — image, copy, and three product tiles. */
export function createTrendingSummerItem(
  locale: HeroBannerLocale,
  href: string,
): HeroBannerImageTextProductsItem {
  const copy = campaignCopy.trendingSummer[locale];
  return {
    id: "trending-summer",
    href,
    image: { src: art.trendingSummer, alt: copy.alt },
    title: copy.title,
    description: copy.description,
    backgroundColor: "#E6E2FB",
    products: [
      { src: art.skinCare, alt: copy.products[0] },
      { src: art.summerSnack, alt: copy.products[1] },
      { src: art.summerDrink, alt: copy.products[2] },
    ],
  };
}

/** Seasonal sale — artwork only, no copy layer. */
export function createSeasonalSaleItem(
  locale: HeroBannerLocale,
  href: string,
): HeroBannerImageOnlyItem {
  const copy = campaignCopy.seasonalSale[locale];
  return {
    id: "seasonal-sale",
    href,
    image: { src: art.saleImage, alt: copy.alt },
  };
}

/**
 * The authored hero lineup, shared by the component Showcase and the
 * EcommerceHome page so the two cannot drift. Order is the production
 * homepage's: the three current campaigns lead, the rest follow. `HeroBanner`
 * moves the products-only card into the first view at render time.
 *
 * Consumers differ only in `href`: the component story points at real campaign
 * paths, a page template at its own anchors.
 */
export function createHeroBannerItems(
  locale: HeroBannerLocale,
  href: (slug: string) => string,
): HeroBannerItem[] {
  return [
    createBackToSchoolItem(locale, href("back-to-school")),
    createGlowItem(locale, href("glow-skin-like-makeup")),
    createJapaneseSummerFestivalItem(locale, href("japanese-summer-festival")),
    createMidnightStreetFoodItem(locale, href("midnight-street-food")),
    createTrendingSummerItem(locale, href("trending-summer")),
    createSeasonalSaleItem(locale, href("seasonal-sale")),
    createKeepShoppingItem(locale, href("keep-shopping")),
  ];
}
