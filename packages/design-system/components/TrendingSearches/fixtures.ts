import type { ProductListItem } from "../ProductList";

import type {
  TrendingSearchKeyword,
  TrendingSearchesProps,
} from "./TrendingSearches.types";

export type TrendingSearchesLocale = "zh" | "en";

/* Borrows BrandProductRail's product photography rather than shipping a second
 * copy of the same catalogue. Each URL is spelled out: `new URL` with a
 * template string is invisible to the bundler's static analysis, which leaves
 * every one of these resolving to a path that does not exist. */
const catalogue = [
  {
    image: new URL(
      "../BrandProductRail/assets/maogeping-highlighter.webp",
      import.meta.url,
    ).href,
    brand: "MAOGEPING",
  },
  {
    image: new URL(
      "../BrandProductRail/assets/biodance-mask.webp",
      import.meta.url,
    ).href,
    brand: "BIODANCE",
  },
  {
    image: new URL("../BrandProductRail/assets/glow-bb.webp", import.meta.url)
      .href,
    brand: "GLOW",
  },
  {
    image: new URL(
      "../BrandProductRail/assets/bb-lab-jelly.webp",
      import.meta.url,
    ).href,
    brand: "BB LAB",
  },
  {
    image: new URL(
      "../BrandProductRail/assets/biodance-cream.webp",
      import.meta.url,
    ).href,
    brand: "BIODANCE",
  },
  {
    image: new URL(
      "../BrandProductRail/assets/teabless-lotion.webp",
      import.meta.url,
    ).href,
    brand: "TEABLESS",
  },
  {
    image: new URL(
      "../BrandProductRail/assets/glow-patches.webp",
      import.meta.url,
    ).href,
    brand: "GLOW",
  },
  {
    image: new URL(
      "../BrandProductRail/assets/maogeping-cushion.webp",
      import.meta.url,
    ).href,
    brand: "MAOGEPING",
  },
] as const;

export const trendingSearchesCopy = {
  zh: {
    title: "大家都在搜",
    mobileTitle: "热搜榜",
    seeAll: "查看全部",
    previous: "上一组热搜",
    next: "下一组热搜",
    explore: (keyword: string) => `探索${keyword}`,
    expand: (keyword: string) => `展开「${keyword}」的搜索结果`,
    keywords: [
      { keyword: "防晒", tagline: "轻薄好推的日常防晒精选。" },
      { keyword: "三文鱼针", tagline: "热门 PDRN 护肤，水润更平滑。" },
      { keyword: "凯朵", tagline: "日系彩妆的唇部、眼部与底妆之选。" },
      { keyword: "Anua", tagline: "韩系人气品牌，洁面、爽肤与精华。" },
      { keyword: "抹茶", tagline: "冲饮与烘焙都合适的抹茶粉。" },
      { keyword: "胶原蛋白", tagline: "内服外用的胶原蛋白热销单品。" },
    ],
    productNames: [
      "光影塑颜高光膏 5g",
      "胶原蛋白水光面膜 4片",
      "透气修护 BB 霜",
      "低糖胶原果冻 10条",
      "胶原肽紧致面霜 50ml",
      "紫茶舒缓身体乳 300ml",
      "亮眼精华眼膜 60片",
      "星耀锁妆气垫 14g",
    ],
    sold: (count: number) => `周销 ${count}+`,
  },
  en: {
    title: "What People Are Searching",
    mobileTitle: "Top Searches",
    seeAll: "See all",
    previous: "Previous searches",
    next: "Next searches",
    explore: (keyword: string) => `Explore ${keyword}`,
    expand: (keyword: string) => `Show results for ${keyword}`,
    keywords: [
      {
        keyword: "Sunscreen",
        tagline: "Daily SPF picks for lightweight sun protection.",
      },
      {
        keyword: "PDRN",
        tagline: "Trending PDRN skincare for hydrated, smoother-looking skin.",
      },
      {
        keyword: "Kate",
        tagline: "Japanese makeup picks for lips, eyes, and complexion.",
      },
      {
        keyword: "Anua",
        tagline: "Popular K-beauty brand for cleansers, toners and serums.",
      },
      {
        keyword: "Matcha",
        tagline: "Ceremonial-grade powders for drinks and baking.",
      },
      {
        keyword: "Collagen",
        tagline: "Best-selling collagen, taken and applied.",
      },
    ],
    productNames: [
      "MGP Highlighting Cream Powder, 5g",
      "BIODANCE Bio-Collagen Real Deep Mask, 4ct",
      "GLOW Breathable Blemish Balm",
      "BB LAB Low-Sugar Collagen Jelly, 10ct",
      "BIODANCE Collagen Peptide Cream, 50ml",
      "TEABLESS Purple Tea Body Lotion, 300ml",
      "GLOW Brightening Eye Patches, 60ct",
      "MGP Starlight Lock Makeup Cushion, 14g",
    ],
    sold: (count: number) => `${count}+ Sold`,
  },
} as const;

function createProducts(
  locale: TrendingSearchesLocale,
  keywordIndex: number,
): ProductListItem[] {
  const localeCopy = trendingSearchesCopy[locale];
  // Three per term: desktop previews the leading two and mobile scrolls the
  // set, so a fixture with two would leave the mobile rail with nothing to
  // scroll and the overflow rule untested.
  return [0, 1, 2].map((offset) => {
    const index = (keywordIndex * 2 + offset) % catalogue.length;
    const entry = catalogue[index];
    const title = localeCopy.productNames[index];
    return {
      id: `trending-search-${keywordIndex + 1}-${offset + 1}`,
      image: entry.image,
      imageAlt: title,
      brand: entry.brand,
      brandHref: `#brand-${index + 1}`,
      href: `#product-${index + 1}`,
      title,
      priceCurrent: `$${(11.08 + index * 4.3).toFixed(2)}`,
      priceOriginal: `$${(17 + index * 5.1).toFixed(2)}`,
      rating: 4.9,
      ratingCount: "1,888",
      soldCount: localeCopy.sold(100 + index * 20),
    };
  });
}

export function createTrendingSearchKeywords(
  locale: TrendingSearchesLocale,
): TrendingSearchKeyword[] {
  const localeCopy = trendingSearchesCopy[locale];
  return localeCopy.keywords.map((entry, index) => ({
    id: `trending-search-${index + 1}`,
    keyword: entry.keyword,
    tagline: entry.tagline,
    href: `#search-${index + 1}`,
    // The mobile rows reuse the term's leading product photo, which is what
    // the storefront shows and what makes six rows of text scannable.
    thumbnail: {
      src: catalogue[(index * 2) % catalogue.length].image,
      alt: "",
    },
    products: createProducts(locale, index),
    exploreLabel: localeCopy.explore(entry.keyword),
  }));
}

export function createTrendingSearchesProps(
  locale: TrendingSearchesLocale,
): TrendingSearchesProps {
  const localeCopy = trendingSearchesCopy[locale];
  return {
    title: localeCopy.title,
    mobileTitle: localeCopy.mobileTitle,
    keywords: createTrendingSearchKeywords(locale),
    seeAllLabel: localeCopy.seeAll,
    previousLabel: localeCopy.previous,
    nextLabel: localeCopy.next,
    expandLabel: localeCopy.expand,
    onAddToCart: () => {},
  };
}
