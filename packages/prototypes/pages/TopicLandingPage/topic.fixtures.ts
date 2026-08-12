import type { ProductListTab } from "@yami/design-system";

import {
  createTopicLandingPageFixture,
  type TopicLandingPageLocale,
} from "./fixtures";
import {
  createMatchaBrandCampaigns,
  createMatchaEditorialNotes,
  createMatchaPopularProducts,
  createMatchaProduct,
  createMatchaProductsByCategory,
  createMatchaThemes,
  matchaCategoryValues,
  matchaImages,
  type MatchaProductKey,
} from "./matcha.fixture";

const copy = {
  en: {
    activityTitle: "Matcha",
    heroTitle: "Matcha, from first whisk to favorite treat",
    heroDescription:
      "Explore matcha by the way you enjoy it: whisked pure, folded into a creamy latte, or paired with chocolate, cookies and Japanese sweets.",
    heroTags: ["Uji Matcha", "Latte Ready", "Tea-Time Treats"],
    heroImageAlt:
      "Fresh matcha, an iced matcha latte, bamboo whisk and Japanese sweets on a sunlit stone table",
    shortcutTitle: "Explore Matcha",
    primaryTabsLabel: "Matcha topic navigation",
    categoryLabels: [
      "Matcha Powder",
      "Matcha Latte",
      "Cookies & Snacks",
      "Chocolate",
      "Mochi & Sweets",
      "Tea Tools",
    ],
    startTitle: "Start with Matcha",
    popularTitle: "Popular Matcha Picks",
    popularAll: "All",
    brandTitle: "Matcha by Brand",
    notesTitle: "Tasting Notes",
    moreTitle: "More Matcha",
    moreDescription:
      "Keep exploring powders, drinks, sweets and tools selected from Yami's current matcha assortment.",
    moreTabs: ["All", "Powder", "Latte", "Snacks", "Chocolate", "Sweets", "Tools"],
    moreLabel: "Explore more matcha",
  },
  zh: {
    activityTitle: "抹茶",
    heroTitle: "从第一碗到心仪甜点，探索抹茶",
    heroDescription:
      "按喜欢的方式认识抹茶：纯饮点茶、顺滑拿铁，或搭配巧克力、饼干与日式甜点。",
    heroTags: ["宇治抹茶", "拿铁友好", "下午茶甜点"],
    heroImageAlt: "阳光石桌上的鲜抹茶、冰抹茶拿铁、竹茶筅与日式甜点",
    shortcutTitle: "探索抹茶",
    primaryTabsLabel: "抹茶主题导航",
    categoryLabels: [
      "抹茶粉",
      "抹茶拿铁",
      "饼干与零食",
      "巧克力",
      "麻薯与甜点",
      "茶具",
    ],
    startTitle: "从这里开始",
    popularTitle: "热门抹茶精选",
    popularAll: "全部",
    brandTitle: "按品牌选抹茶",
    notesTitle: "风味笔记",
    moreTitle: "更多抹茶",
    moreDescription: "继续探索 Yami 当前抹茶商品中的茶粉、饮品、甜点与茶具。",
    moreTabs: ["全部", "抹茶粉", "拿铁", "零食", "巧克力", "甜点", "茶具"],
    moreLabel: "探索更多抹茶",
  },
} as const;

const shortcutProductKeyByCategory = {
  powder: "marukyuIsuzu",
  latte: "itoAlmondLatte",
  snacks: "glicoPocky",
  chocolate: "hokkaidoChocolate",
  sweets: "filledMochi",
  tools: "teaSet",
} satisfies Record<(typeof matchaCategoryValues)[number], MatchaProductKey>;

function createTabs(
  values: readonly string[],
  labels: readonly string[],
): ProductListTab[] {
  return values.map((value, index) => ({ value, label: labels[index] }));
}

/**
 * Matcha topic fixture based on Yami's in-stock catalog snapshot from
 * 2026-08-11. Product availability and prices are intentionally kept in the
 * fixture so future template maintenance can update one topic independently.
 */
export function createTopicKeywordLandingPageFixture(
  locale: TopicLandingPageLocale = "en",
) {
  const base = createTopicLandingPageFixture(locale);
  const localizedCopy = copy[locale];
  const themes = createMatchaThemes(locale);
  const productsByCategory = createMatchaProductsByCategory(locale);
  const popularProducts = createMatchaPopularProducts(locale);
  const allProducts = matchaCategoryValues.flatMap(
    (value) => productsByCategory[value],
  );
  const waterfallValues = ["all", ...matchaCategoryValues] as const;
  const waterfallTabs = createTabs(waterfallValues, localizedCopy.moreTabs);

  return {
    ...base,
    titleFontFamily: "serif" as const,
    activityHeader: {
      ...base.activityHeader,
      title: localizedCopy.activityTitle,
    },
    hero: {
      ...base.hero,
      title: localizedCopy.heroTitle,
      description: localizedCopy.heroDescription,
      tags: localizedCopy.heroTags,
      image: {
        src: matchaImages.hero,
        alt: localizedCopy.heroImageAlt,
        width: 1672,
        height: 941,
      },
      backgroundImageSrc: matchaImages.hero,
      backgroundColor: "#dfe3d4",
    },
    primaryTabs: {
      ariaLabel: localizedCopy.primaryTabsLabel,
      defaultValue: "explore-matcha",
      items: [
        {
          value: "explore-matcha",
          label: localizedCopy.shortcutTitle,
          targetId: "explore",
        },
        {
          value: "start-with-matcha",
          label: localizedCopy.startTitle,
          targetId: "shop",
        },
        {
          value: "popular-matcha",
          label: localizedCopy.popularTitle,
          targetId: "popular-picks",
        },
        {
          value: "tasting-notes",
          label: localizedCopy.notesTitle,
          targetId: "reviews",
        },
        {
          value: "more-matcha",
          label: localizedCopy.moreTitle,
          targetId: "product-list",
        },
      ],
    },
    shortcutRail: {
      ...base.shortcutRail,
      title: localizedCopy.shortcutTitle,
      ariaLabel: localizedCopy.moreLabel,
      surface: "plain" as const,
      lines: 1 as const,
      items: matchaCategoryValues.map((value, index) => ({
        id: `matcha-shortcut-${value}`,
        label: localizedCopy.categoryLabels[index],
        iconSrc: createMatchaProduct(
          shortcutProductKeyByCategory[value],
          locale,
        ).image as string,
        imagePresentation: "full-bleed" as const,
        href: `#explore-more-${value}`,
      })),
    },
    standardRail: {
      ...base.standardRail,
      title: localizedCopy.startTitle,
      content: themes[0].content,
      products: themes[0].products,
      themes,
      tabs: themes.map((theme) => ({
        value: theme.value,
        label: theme.label,
      })),
      mobileSurface: "plain" as const,
    },
    productRail: {
      ...base.productRail,
      title: localizedCopy.popularTitle,
      products: popularProducts,
      tabs: [
        { value: "popular-all", label: localizedCopy.popularAll },
        ...createTabs(matchaCategoryValues, localizedCopy.categoryLabels),
      ],
      mobileSurface: "plain" as const,
    },
    brandRail: {
      title: localizedCopy.brandTitle,
      campaigns: createMatchaBrandCampaigns(locale),
      defaultValue: "matcha-ito-en",
      viewAllHref: `https://www.yami.com/us/${locale}/search?q=matcha`,
      viewAllLabel: localizedCopy.moreLabel,
      mobileSurface: "plain" as const,
      dividerPosition: "top" as const,
      dividerVariant: "gray" as const,
      onAddToCart: () => {},
    },
    reviewList: {
      ...base.reviewList,
      title: localizedCopy.notesTitle,
      reviews: createMatchaEditorialNotes(locale),
      viewAllHref: undefined,
      mobileSurface: "plain" as const,
    },
    waterfall: {
      ...base.waterfall,
      title: localizedCopy.moreTitle,
      description: localizedCopy.moreDescription,
      products: allProducts,
      productsByTab: {
        all: allProducts,
        ...productsByCategory,
      },
      tabs: waterfallTabs,
      defaultValue: "all",
      mobileSurface: "plain" as const,
    },
  };
}
