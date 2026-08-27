import type {
  ActivityPageHeaderProps,
  FooterProps,
  HeaderProps,
  ProductListItem,
  ProductListProps,
} from "@yami/design-system";
import {
  createFooterAppLinks,
  createFooterColumns,
  createFooterLegalLinks,
  createFooterPaymentMarks,
  createFooterSocialLinks,
  footerCopy,
} from "@yami/design-system/components/Footer/fixtures";
import {
  createProductListProducts,
  createProductListTabs,
  productListCopy,
} from "@yami/design-system/components/ProductList/fixtures";
import { createReviewListProps } from "@yami/design-system/components/ReviewList/fixtures";
import { createFullBleedShortcutItems } from "@yami/design-system/components/ShortcutRail/fixtures";
import { createThemeHeroProps } from "@yami/design-system/components/ThemeHero/fixtures";

import { createStorefrontHeader } from "../storefront-header.fixture";
import type { TopicLandingPageProps } from "./TopicLandingPage.types";
import {
  createExploreMoreProducts,
  exploreMoreShortcutValues,
} from "./exploreMore.fixture";
import { createStartHereProps } from "./startHere.fixture";

export type TopicLandingPageLocale = "en" | "zh";

const standardRailImages = [
  new URL(
    "./assets/popular-picks/01-heartleaf-cleansing-foam.webp",
    import.meta.url,
  ).href,
  new URL(
    "./assets/popular-picks/02-niacinamide-txa-serum.webp",
    import.meta.url,
  ).href,
  new URL(
    "./assets/popular-picks/03-heartleaf-77-toner.webp",
    import.meta.url,
  ).href,
  new URL(
    "./assets/popular-picks/04-heartleaf-cleansing-oil.webp",
    import.meta.url,
  ).href,
  new URL(
    "./assets/popular-picks/05-rice-70-toner.webp",
    import.meta.url,
  ).href,
  new URL(
    "./assets/popular-picks/06-heartleaf-cleansing-foam-alt.webp",
    import.meta.url,
  ).href,
  new URL(
    "./assets/popular-picks/07-hyaluronic-foam-cleanser.webp",
    import.meta.url,
  ).href,
  new URL(
    "./assets/popular-picks/08-kpdh-sunscreen.webp",
    import.meta.url,
  ).href,
] as const;

const shortcutImages = [
  new URL("./assets/category-cleanse-peel.webp", import.meta.url).href,
  new URL("./assets/category-toners-pads.webp", import.meta.url).href,
  new URL("./assets/category-serums-care.webp", import.meta.url).href,
  new URL("./assets/category-moisturizers.webp", import.meta.url).href,
  new URL("./assets/category-sunscreens.webp", import.meta.url).href,
  new URL("./assets/category-face-masks.webp", import.meta.url).href,
  new URL("./assets/category-makeup.webp", import.meta.url).href,
] as const;

/* The first eight cards mirror the ANUA brand page's sales-ranked "All" tab.
 * Images are bundled so the story remains deterministic. */
const standardRailProducts: ProductListItem[] = [
  {
    id: "anua-heartleaf-cleansing-foam",
    image: standardRailImages[0],
    imageAlt: "Heartleaf Quercetinol Pore Deep Cleansing Foam, 5.07 fl oz",
    brand: "ANUA",
    brandHref: "/en/b/anua/11712",
    href: "/en/p/heartleaf-quercetinol-pore-deep-cleansing-foam-5-07-fl-oz/1022446461",
    title: "Heartleaf Quercetinol Pore Deep Cleansing Foam, 5.07 fl oz",
    priceCurrent: "$10.29",
    priceOriginal: "$14.99",
  },
  {
    id: "anua-niacinamide-txa-serum",
    image: standardRailImages[1],
    imageAlt: "Niacinamide 10% + TXA 4% Dark Spot Correcting Serum, 1.01 fl oz",
    brand: "ANUA",
    brandHref: "/en/b/anua/11712",
    href: "/en/p/niacinamide-10-txa-4-dark-spot-correcting-serum-1-01-fl-oz/1022446351",
    title: "Niacinamide 10% + TXA 4% Dark Spot Correcting Serum, 1.01 fl oz",
    priceCurrent: "$23.09",
    priceOriginal: "$24.99",
  },
  {
    id: "anua-heartleaf-77-toner",
    image: standardRailImages[2],
    imageAlt: "Heartleaf 77 Soothing Toner, 8.45 fl oz",
    brand: "ANUA",
    brandHref: "/en/b/anua/11712",
    href: "/en/p/heartleaf-77-soothing-toner-8-45-fl-oz/1022281871",
    title: "Heartleaf 77 Soothing Toner, 8.45 fl oz",
    priceCurrent: "$14.83",
    priceOriginal: "$20.99",
  },
  {
    id: "anua-heartleaf-cleansing-oil",
    image: standardRailImages[3],
    imageAlt: "Heartleaf Pore Control Cleansing Oil, 200 ml",
    brand: "ANUA",
    brandHref: "/en/b/anua/11712",
    href: "/en/p/heartleaf-pore-control-cleansing-oil-200ml/1022373071",
    title: "Heartleaf Pore Control Cleansing Oil, 200 ml",
    priceCurrent: "$18.99",
    priceOriginal: "$19.99",
  },
  {
    id: "anua-rice-70-milky-toner",
    image: standardRailImages[4],
    imageAlt: "Rice 70 Glow Milky Toner, 250 ml",
    brand: "ANUA",
    brandHref: "/en/b/anua/11712",
    href: "/en/p/rice-70-glow-milky-toner/1022500901",
    title: "Rice 70 Glow Milky Toner, 250 ml",
    priceCurrent: "$18.21",
    priceOriginal: "$22.59",
  },
  {
    id: "anua-heartleaf-cleansing-foam-alt",
    image: standardRailImages[5],
    imageAlt: "Heartleaf Pore Deep Cleansing Foam, 150 ml, assorted packaging",
    brand: "ANUA",
    brandHref: "/en/b/anua/11712",
    href: "/en/p/anua-s-heartleaf-quercentinol-pore-deep-cleansing-foam-150ml/5022424261",
    title: "Heartleaf Pore Deep Cleansing Foam, 150 ml, assorted packaging",
    priceCurrent: "$10.29",
    priceOriginal: "$13.00",
  },
  {
    id: "anua-hyaluronic-foam-cleanser",
    image: standardRailImages[6],
    imageAlt: "8 Hyaluronic Acid Hydrating Gentle Foaming Cleanser, 150 ml",
    brand: "ANUA",
    brandHref: "/en/b/anua/11712",
    href: "/en/p/8-hyaluronic-acid-hydrating-gentle-foaming/1022604281",
    title: "8 Hyaluronic Acid Hydrating Gentle Foaming Cleanser, 150 ml",
    priceCurrent: "$11.52",
    priceOriginal: "$13.99",
  },
  {
    id: "anua-kpdh-sunscreen",
    image: standardRailImages[7],
    imageAlt: "ANUA × KPDH Daily Clear Moisturizing Sun Cream SPF50+, 50 ml",
    brand: "ANUA",
    brandHref: "/en/b/anua/11712",
    href: "/en/p/kpdh-daily-clear-moisturizing-sun-cream-50ml/5022760411",
    title: "ANUA × KPDH Daily Clear Moisturizing Sun Cream SPF50+, 50 ml",
    priceCurrent: "$12.99",
    priceOriginal: "$16.99",
  },
];

const pageCopy = {
  en: {
    activityTitle: "Anua",
    heroTitle: "Anua: Gentle yet Effective Korean Skincare",
    heroDescription:
      "Skin-friendly ingredients and targeted actives for simple daily care across soothing, hydration, brightening, and barrier support.",
    heroDescriptionExpandLabel: "More",
    heroDescriptionCollapseLabel: "Less",
    heroTags: [
      "Heartleaf Botanical",
      "Gentle Daily Formulas",
      "Targeted Active Care",
    ],
    heroImageAlt:
      "Anua Korean skincare products displayed on a clear circular stand",
    shortcutTitle: "Explore by Type",
    primaryTabsLabel: "Topic navigation",
    shortcutLabels: [
      "Cleanse & Peel",
      "Toners & Pads",
      "Serums & Care",
      "Moisturizers",
      "Sunscreens",
      "Face Masks",
      "Makeup",
    ],
    standardRailTitle: "Popular Picks",
    standardRailAllLabel: "All",
    reviewTitle: "What Customers Say",
    productListTitle: "Explore More",
    productListDescription:
      "Discover more from the collection, plus complementary picks selected for you.",
    standardProductNames: standardRailProducts.map((product) =>
      String(product.title),
    ),
    reviews: [
      "It feels so gentle and still gets all the gunk out",
      "I highly recommend it. After using it for a week, my skin is noticeably smoother and smoother. I have sensitive, combination, oily and dry skin and I find this bottle very moisturizing and easy to absorb.",
      "I LOVE IT!!!! It really helped with my dark spots around my underarm!! ❤️❤️❤️❤️",
    ],
    reviewProductNames: [
      "Heartleaf Quercetinol Pore Deep Cleansing Foam, 5.07 fl oz",
      "Heartleaf 77 + Hyaluron Soothing Toner Vegan, 8.45 fl oz",
      "Niacinamide 10% + TXA 4% Dark Spot Correcting Serum, 1.01 fl oz",
    ],
  },
  zh: {
    activityTitle: "艾努雅",
    heroTitle: "Anua：温和有效的韩系护肤",
    heroDescription:
      "以温和亲肤成分结合针对性活性成分，为舒缓、补水、提亮与屏障护理提供简单清晰的日常方案。",
    heroDescriptionExpandLabel: "更多",
    heroDescriptionCollapseLabel: "收起",
    heroTags: ["Heartleaf 鱼腥草", "温和日常配方", "针对性活性护理"],
    heroImageAlt: "透明圆台上陈列的 Anua 韩系护肤产品",
    shortcutTitle: "精选分类",
    primaryTabsLabel: "主题导航",
    shortcutLabels: [
      "清洁与去角质",
      "爽肤水与棉片",
      "精华与护理",
      "乳液与面霜",
      "防晒",
      "面膜",
      "彩妆",
    ],
    standardRailTitle: "热门精选",
    standardRailAllLabel: "全部",
    reviewTitle: "顾客怎么说",
    productListTitle: "探索更多",
    productListDescription: "探索该系列更多产品，以及为你精选的搭配好物。",
    standardProductNames: [
      "鱼腥草毛孔深层清洁泡沫洗面奶 150ml",
      "烟酰胺 10% + 传明酸 4% 淡斑精华 30ml",
      "77% 鱼腥草舒缓爽肤水 250ml",
      "鱼腥草毛孔清洁卸妆油 200ml",
      "大米 70% 焕亮乳白爽肤水 250ml",
      "鱼腥草毛孔深层清洁泡沫 150ml（新旧包装随机）",
      "8 重玻尿酸保湿温和泡沫洁面乳 150ml",
      "ANUA × KPDH Daily Clear 清爽防晒霜 SPF50+ 50ml",
    ],
    reviews: [
      "温和又干净，洗完很舒服",
      "非常推荐。使用一周后，肌肤明显更细腻、更水润，也很好吸收。",
      "真的很喜欢！腋下暗沉看起来改善了很多！❤️❤️❤️❤️",
    ],
    reviewProductNames: [
      "鱼腥草槲皮素深层毛孔洁面泡沫 150ml",
      "鱼腥草 77% 玻尿酸舒缓爽肤水 250ml",
      "烟酰胺 10% + 传明酸 4% 淡斑精华 30ml",
    ],
  },
} as const;

function createActivityHeader(
  header: HeaderProps,
  locale: TopicLandingPageLocale,
): ActivityPageHeaderProps {
  return {
    title: pageCopy[locale].activityTitle,
    locale,
    homeHref: header.homeHref,
    searchLabel: header.searchLabel,
    cartLabel: header.cart.label,
    onSearch: () => {},
    onCart: () => {},
  };
}

function createFooter(locale: TopicLandingPageLocale): FooterProps {
  const copy = footerCopy[locale];
  return {
    ariaLabel: copy.ariaLabel,
    columns: createFooterColumns(locale),
    socialLinks: createFooterSocialLinks(locale),
    subscribe: {
      title: copy.subscribeTitle,
      label: copy.subscribeLabel,
      placeholder: copy.subscribePlaceholder,
      submitLabel: copy.subscribeSubmit,
    },
    appTitle: copy.appTitle,
    appLinks: createFooterAppLinks(),
    copyright: copy.copyright,
    legalLinks: createFooterLegalLinks(locale),
    paymentMarks: createFooterPaymentMarks(),
  };
}

function createProductListProps(
  layout: "rail" | "waterfall",
  locale: TopicLandingPageLocale,
): ProductListProps {
  const copy = productListCopy[locale];
  const isWaterfall = layout === "waterfall";
  return {
    title: copy.heading,
    products: createProductListProducts(locale),
    tabs: createProductListTabs(locale),
    layout,
    mobileSurface: "plain",
    dividerPosition: "top",
    dividerVariant: "gray",
    viewAllHref: isWaterfall ? undefined : "#all-products",
    viewAllLabel: copy.viewAll,
    loadMoreLabel: copy.loadMore,
    loadingLabel: copy.loading,
    onAddToCart: () => {},
  };
}

function createStandardRailProps(
  locale: TopicLandingPageLocale,
): ProductListProps {
  const copy = pageCopy[locale];
  return {
    ...createProductListProps("rail", locale),
    title: copy.standardRailTitle,
    viewAllHref: undefined,
    products: standardRailProducts.map((product, index) => ({
      ...product,
      title: copy.standardProductNames[index],
      imageAlt: copy.standardProductNames[index],
      brandHref: product.brandHref?.replace("/en/", `/${locale}/`),
      href: product.href?.replace("/en/", `/${locale}/`),
    })),
    tabs: [copy.standardRailAllLabel, ...copy.shortcutLabels].map(
      (label, index) => ({
        value: `popular-picks-tab-${index + 1}`,
        label,
      }),
    ),
  };
}

export function createTopicLandingPageFixture(
  locale: TopicLandingPageLocale = "en",
): TopicLandingPageProps {
  const copy = pageCopy[locale];
  const header = createStorefrontHeader(locale);
  const hero = createThemeHeroProps();
  const shortcutItems = createFullBleedShortcutItems()
    .slice(0, copy.shortcutLabels.length)
    .map((item, index) => ({
      ...item,
      label: copy.shortcutLabels[index],
      iconSrc: shortcutImages[index],
      href: `#explore-more-${exploreMoreShortcutValues[index]}`,
    }));
  const themeProductList = createStartHereProps(locale);
  const reviewList = {
    ...createReviewListProps(locale),
    title: copy.reviewTitle,
  };
  const productRail = createStandardRailProps(locale);
  const waterfall = {
    ...createProductListProps("waterfall", locale),
    ...createExploreMoreProducts(locale),
    title: copy.productListTitle,
    description: copy.productListDescription,
  };
  return {
    lang: locale,
    contentMaxWidth: 1440,
    titleFontFamily: "serif",
    activityHeader: createActivityHeader(header, locale),
    header,
    hero: {
      ...hero,
      title: copy.heroTitle,
      description: copy.heroDescription,
      descriptionExpandLabel: copy.heroDescriptionExpandLabel,
      descriptionCollapseLabel: copy.heroDescriptionCollapseLabel,
      tags: copy.heroTags,
      tagSize: "md",
      tagTone: "dark",
      image: { ...hero.image, alt: copy.heroImageAlt },
      cta: undefined,
      secondaryCta: undefined,
    },
    primaryTabs: {
      ariaLabel: copy.primaryTabsLabel,
      defaultValue: "featured-shortcuts",
      items: [
        {
          value: "featured-shortcuts",
          label: copy.shortcutTitle,
          targetId: "explore",
        },
        {
          value: "start-here",
          label: String(themeProductList.title),
          targetId: "shop",
        },
        {
          value: "popular-picks",
          label: String(productRail.title),
          targetId: "popular-picks",
        },
        {
          value: "reviews",
          label: String(reviewList.title),
          targetId: "reviews",
        },
        {
          value: "product-list",
          label: String(waterfall.title),
          targetId: "product-list",
        },
      ],
    },
    shortcutRail: {
      title: copy.shortcutTitle,
      items: shortcutItems,
    },
    standardRail: {
      ...themeProductList,
      mobileSurface: "plain",
      dividerPosition: "top",
      dividerVariant: "gray",
    },
    reviewList: {
      ...reviewList,
      reviews: reviewList.reviews.map((review, index) => ({
        ...review,
        review: copy.reviews[index],
        product: {
          ...review.product,
          imageAlt: copy.reviewProductNames[index],
          name: copy.reviewProductNames[index],
          href: review.product.href?.replace("/en/", `/${locale}/`),
        },
      })),
      mobileSurface: "plain",
      dividerPosition: "top",
      dividerVariant: "gray",
    },
    productRail,
    waterfall,
    footer: createFooter(locale),
  };
}
