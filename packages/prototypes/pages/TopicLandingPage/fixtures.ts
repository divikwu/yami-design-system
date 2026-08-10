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
import { createHeaderProps } from "@yami/design-system/components/Header/fixtures";
import {
  createProductListProducts,
  createProductListTabs,
  productListCopy,
} from "@yami/design-system/components/ProductList/fixtures";
import { createReviewListProps } from "@yami/design-system/components/ReviewList/fixtures";
import { createFullBleedShortcutItems } from "@yami/design-system/components/ShortcutRail/fixtures";
import { createThemeHeroProps } from "@yami/design-system/components/ThemeHero/fixtures";
import { createThemeProductListProps } from "@yami/design-system/components/ThemeProductList/fixtures";

import type { TopicLandingPageProps } from "./TopicLandingPage.types";

export type TopicLandingPageLocale = "en" | "zh";

const standardRailImages = [
  new URL("./assets/anua-niacinamide-txa.png", import.meta.url).href,
  new URL("./assets/anua-azelaic-hyaluron-serum.png", import.meta.url).href,
  new URL("./assets/anua-pdrn-moisturizing-cream.png", import.meta.url).href,
  new URL("./assets/anua-pdrn-capsule-mist.png", import.meta.url).href,
  new URL("./assets/anua-heartleaf-cleansing-foam.png", import.meta.url).href,
  new URL("./assets/anua-pdrn-capsule-serum.png", import.meta.url).href,
] as const;

/* Six cards mirror Figma node 1865:43850 (Popular Picks). The image crops are
 * bundled so the page story remains deterministic and does not depend on a
 * temporary Figma asset URL. */
const standardRailProducts: ProductListItem[] = [
  {
    id: "anua-niacinamide-txa-serum",
    image: standardRailImages[0],
    imageAlt: "Niacinamide 10% + TXA 4% Dark Spot Correcting Serum, 1.01 fl oz",
    brand: "ANUA",
    brandHref: "/en/brands/anua",
    href: "/en/products/anua-niacinamide-txa-serum",
    title: "Niacinamide 10% + TXA 4% Dark Spot Correcting Serum, 1.01 fl oz",
    priceCurrent: "$23.09",
    priceOriginal: "$24.99",
    badges: [{ label: "-8%", type: "discount" }],
  },
  {
    id: "anua-azelaic-hyaluron-serum",
    image: standardRailImages[1],
    imageAlt: "Azelaic Acid 10% + Hyaluron Redness Soothing Serum, 1 fl oz",
    brand: "ANUA",
    brandHref: "/en/brands/anua",
    href: "/en/products/anua-azelaic-hyaluron-serum",
    title: "Azelaic Acid 10% + Hyaluron Redness Soothing Serum, 1 fl oz",
    priceCurrent: "$19.18",
    priceOriginal: "$32.00",
    badges: [{ label: "-40%", type: "discount" }],
  },
  {
    id: "anua-pdrn-moisturizing-cream",
    image: standardRailImages[2],
    imageAlt: "PDRN Hyaluronic Acid 100 Moisturizing Cream, 60 ml",
    brand: "ANUA",
    brandHref: "/en/brands/anua",
    href: "/en/products/anua-pdrn-moisturizing-cream",
    title: "PDRN Hyaluronic Acid 100 Moisturizing Cream, 60 ml",
    priceCurrent: "$16.99",
    priceOriginal: "$26.99",
    badges: [{ label: "-37%", type: "discount" }],
  },
  {
    id: "anua-pdrn-capsule-mist",
    image: standardRailImages[3],
    imageAlt: "PDRN Hyaluronic Acid Hydrating Capsule Mist, 100 ml",
    brand: "ANUA",
    brandHref: "/en/brands/anua",
    href: "/en/products/anua-pdrn-capsule-mist",
    title: "PDRN Hyaluronic Acid Hydrating Capsule Mist, 100 ml",
    priceCurrent: "$19.99",
    priceOriginal: "$32.99",
    badges: [{ label: "-39%", type: "discount" }],
  },
  {
    id: "anua-heartleaf-cleansing-foam",
    image: standardRailImages[4],
    imageAlt: "Heartleaf Quercetinol Pore Deep Cleansing Foam, 5.07 fl oz",
    brand: "ANUA",
    brandHref: "/en/brands/anua",
    href: "/en/products/anua-heartleaf-cleansing-foam",
    title: "Heartleaf Quercetinol Pore Deep Cleansing Foam, 5.07 fl oz",
    priceCurrent: "$9.99",
    priceOriginal: "$14.99",
    badges: [{ label: "-33%", type: "discount" }],
  },
  {
    id: "anua-pdrn-capsule-serum",
    image: standardRailImages[5],
    imageAlt: "PDRN Hyaluronic Acid Capsule 100 Serum, 1.01 fl oz",
    brand: "ANUA",
    brandHref: "/en/brands/anua",
    href: "/en/products/anua-pdrn-capsule-serum",
    title: "PDRN Hyaluronic Acid Capsule 100 Serum, 1.01 fl oz",
    priceCurrent: "$27.79",
    priceOriginal: "$28.00",
    badges: [{ label: "-1%", type: "discount" }],
  },
];

const pageCopy = {
  en: {
    activityTitle: "Anua",
    heroTitle: "Anua: Gentle yet Effective Korean Skincare",
    heroDescription:
      "Skin-friendly ingredients and targeted actives for simple daily care across soothing, hydration, brightening, and barrier support.",
    heroTags: [
      "Heartleaf Botanical",
      "Gentle Daily Formulas",
      "Targeted Active Care",
    ],
    heroImageAlt:
      "Anua Korean skincare products displayed on a clear circular stand",
    heroPrimaryCta: "Shop Products",
    heroSecondaryCta: "Explore More",
    shortcutTitle: "Featured shortcuts",
    primaryTabsLabel: "Topic navigation",
    shortcutLabels: [
      "Grocery",
      "Snack & Beverage",
      "Beauty",
      "Personal Care",
      "Health",
      "Electronics",
      "Home",
      "Toys , Kids, Babies",
    ],
    standardRailTitle: "Popular Picks",
    standardRailTabs: [
      "All",
      "Serums & Ampoules",
      "Cleansers",
      "Toners & Pads",
      "Moisturizers",
      "Sun Care",
    ],
    standardProductNames: standardRailProducts.map((product) =>
      String(product.title),
    ),
    themeProductNames: [
      "Heartleaf Pore Control Cleansing Oil, 6.76 fl oz Quick Makeup Removal, Deep Cleansing Pores, Suitable for Acne-Prone Skin",
      "Heartleaf Quercetinol Pore Deep Cleansing Foam, 5.07 fl oz",
      "8 Hyaluronic Acid Hydrating Gentle Foaming Cleanser, 5.07 fl oz.",
      "Rice Enzyme Brightening Cleansing Powder, 1.41 oz",
    ],
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
    heroTags: ["Heartleaf 鱼腥草", "温和日常配方", "针对性活性护理"],
    heroImageAlt: "透明圆台上陈列的 Anua 韩系护肤产品",
    heroPrimaryCta: "选购商品",
    heroSecondaryCta: "探索更多",
    shortcutTitle: "精选分类",
    primaryTabsLabel: "主题导航",
    shortcutLabels: [
      "粮油调味",
      "零食饮料",
      "美妆个护",
      "个护清洁",
      "健康养生",
      "数码家电",
      "家居生活",
      "母婴玩具",
    ],
    standardRailTitle: "热门精选",
    standardRailTabs: [
      "全部",
      "精华安瓶",
      "洁面",
      "爽肤水与棉片",
      "面霜",
      "防晒",
    ],
    standardProductNames: [
      "烟酰胺 10% + 传明酸 4% 淡斑精华 30ml",
      "壬二酸 10% + 玻尿酸舒缓修红精华 30ml",
      "PDRN 玻尿酸 100 保湿面霜 60ml",
      "PDRN 玻尿酸补水胶囊喷雾 100ml",
      "鱼腥草槲皮素深层毛孔洁面泡沫 150ml",
      "PDRN 玻尿酸胶囊 100 精华 30ml",
    ],
    themeProductNames: [
      "鱼腥草毛孔清洁卸妆油 200ml",
      "鱼腥草槲皮素深层毛孔洁面泡沫 150ml",
      "8 重玻尿酸温和保湿洁面泡沫 150ml",
      "大米酵素焕亮洁面粉 40g",
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

function createHeader(locale: TopicLandingPageLocale): HeaderProps {
  const header = createHeaderProps(locale, { href: (slot) => `#${slot}` });
  return {
    ...header,
    cart: { ...header.cart, count: 2 },
    onSearchSubmit: () => {},
  };
}

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

function scrollToPageSection(id: string) {
  return () => {
    document.getElementById(id)?.scrollIntoView({ block: "start" });
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
    hasMore: isWaterfall,
    loadMoreLabel: copy.loadMore,
    loadingLabel: copy.loading,
    onLoadMore: isWaterfall ? () => {} : undefined,
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
    tabs: copy.standardRailTabs.map((label, index) => ({
      value: `popular-picks-tab-${index + 1}`,
      label,
    })),
  };
}

export function createTopicLandingPageFixture(
  locale: TopicLandingPageLocale = "en",
): TopicLandingPageProps {
  const copy = pageCopy[locale];
  const header = createHeader(locale);
  const hero = createThemeHeroProps();
  const shortcutItems = createFullBleedShortcutItems().map((item, index) => ({
    ...item,
    label: copy.shortcutLabels[index],
  }));
  const themeProductList = createThemeProductListProps(locale);
  const reviewList = createReviewListProps(locale);
  const productRail = createStandardRailProps(locale);
  const waterfall = createProductListProps("waterfall", locale);
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
      tags: copy.heroTags,
      tagSize: "md",
      tagTone: "dark",
      image: { ...hero.image, alt: copy.heroImageAlt },
      cta: {
        label: copy.heroPrimaryCta,
        controls: "shop",
        onClick: scrollToPageSection("shop"),
      },
      secondaryCta: {
        label: copy.heroSecondaryCta,
        controls: "explore",
        onClick: scrollToPageSection("explore"),
      },
    },
    primaryTabs: {
      ariaLabel: copy.primaryTabsLabel,
      defaultValue: "featured-shortcuts",
      items: [
        { value: "featured-shortcuts", label: copy.shortcutTitle },
        { value: "start-here", label: String(themeProductList.title) },
        { value: "popular-picks", label: String(productRail.title) },
        { value: "reviews", label: String(reviewList.title) },
        { value: "product-list", label: String(waterfall.title) },
      ],
    },
    shortcutRail: {
      title: copy.shortcutTitle,
      items: shortcutItems,
    },
    standardRail: {
      ...themeProductList,
      products: themeProductList.products.map((product, index) => ({
        ...product,
        title: copy.themeProductNames[index],
        imageAlt: copy.themeProductNames[index],
        ranking:
          locale === "zh" && index === 0 ? "卸妆产品好评榜 No.10" : product.ranking,
        soldCount:
          locale === "zh" && product.soldCount ? "售出 80+" : product.soldCount,
      })),
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
