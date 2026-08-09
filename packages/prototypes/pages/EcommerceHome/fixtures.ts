import type {
  BrandProductRailProps,
  FooterProps,
  HeaderProps,
  HeroBannerProps,
  ProductListItem,
  ProductListProps,
  ShortcutRailProps,
} from "@yami/design-system";
import { createBillboardProps } from "@yami/design-system/components/Billboard/fixtures";
import { createBrandProductRailProps } from "@yami/design-system/components/BrandProductRail/fixtures";
import { createHeroBannerItems } from "@yami/design-system/components/HeroBanner/fixtures";
import { createHeaderProps } from "@yami/design-system/components/Header/fixtures";
import {
  createProductListProducts,
  createProductListTabs,
} from "@yami/design-system/components/ProductList/fixtures";
import {
  createFooterAppLinks,
  createFooterColumns,
  createFooterLegalLinks,
  createFooterPaymentMarks,
  createFooterSocialLinks,
  footerCopy,
} from "@yami/design-system/components/Footer/fixtures";
import {
  createShortcutItems,
  shortcutCopy,
} from "@yami/design-system/components/ShortcutRail/fixtures";
import { createSocialMediaGalleryFixture } from "@yami/design-system/components/SocialMediaGallery/fixtures";
import { createTrendingSearchesProps } from "@yami/design-system/components/TrendingSearches/fixtures";

import type {
  EcommerceHomeProps,
  EcommerceHomeSection,
} from "./EcommerceHome.types";

export type EcommerceHomeLocale = "zh" | "en";

const assets = {
  atmosphericDesktop: new URL(
    "../../../design-system/components/ProductList/assets/atmospheric-pc.jpg",
    import.meta.url,
  ).href,
  atmosphericMobile: new URL(
    "../../../design-system/components/ProductList/assets/atmospheric-mobile.jpg",
    import.meta.url,
  ).href,
  productHighlighter: new URL(
    "../../../design-system/components/BrandProductRail/assets/maogeping-highlighter.webp",
    import.meta.url,
  ).href,
  productMask: new URL(
    "../../../design-system/components/BrandProductRail/assets/biodance-mask.webp",
    import.meta.url,
  ).href,
  productBodyWash: new URL(
    "../../../design-system/components/BrandProductRail/assets/teabless-wash.webp",
    import.meta.url,
  ).href,
  productRepairMask: new URL(
    "../../../design-system/components/BrandProductRail/assets/voolga-mask.webp",
    import.meta.url,
  ).href,
  productBbCream: new URL(
    "../../../design-system/components/BrandProductRail/assets/glow-bb.webp",
    import.meta.url,
  ).href,
  productJelly: new URL(
    "../../../design-system/components/BrandProductRail/assets/bb-lab-jelly.webp",
    import.meta.url,
  ).href,
  productCream: new URL(
    "../../../design-system/components/BrandProductRail/assets/biodance-cream.webp",
    import.meta.url,
  ).href,
  productCushion: new URL(
    "../../../design-system/components/BrandProductRail/assets/maogeping-cushion.webp",
    import.meta.url,
  ).href,
  /* Artwork for the transcribed listings below. It lives with the page rather
   * than in a component's assets folder because the page fixture is its only
   * consumer — no component story reaches for it. */
  featuredEssence: new URL("./assets/sk-ii-treatment-essence.png", import.meta.url)
    .href,
  featuredMatcha: new URL(
    "./assets/marukyu-koyamaen-wakatake.png",
    import.meta.url,
  ).href,
  featuredSunscreen: new URL(
    "./assets/beauty-of-joseon-relief-sun.png",
    import.meta.url,
  ).href,
  featuredCleanser: new URL("./assets/beplain-cleansing-foam.jpg", import.meta.url)
    .href,
  featuredSunSerum: new URL("./assets/skin1004-sun-serum.jpg", import.meta.url)
    .href,
  featuredPowder: new URL("./assets/elegance-face-powder.png", import.meta.url)
    .href,
} as const;

const copy = {
  zh: {
    heroLabel: "精选活动",
    heroPrevious: "上一组活动",
    heroNext: "下一组活动",
    trending: "热销榜单",
    trendingTabs: ["全部", "零食饮料", "美妆个护", "家居生活", "健康养生"],
    summer: "夏日囤货季",
    forYou: "猜你喜欢",
    loadMore: "加载更多",
    loading: "商品加载中",
    viewAll: "查看全部",
    featuredNames: [
      "护肤精华露（神仙水）330ml 强韧屏障 抗氧修护 细致毛孔 抗初老",
      "若竹抹茶粉 100g【清新茶香】【冲饮烘焙两用】",
      "大米益生菌舒缓防晒霜 SPF50+·PA++++ 50ml×2【超值装】",
      "绿豆温和平衡洁面泡沫 160ml",
      "马达加斯加积雪草玻尿酸水感防晒精华 提亮款 50ml×2 干敏肌适用【超值装】",
      "蜜粉饼 #I 8.8g @Cosme 大赏",
    ],
    productNames: [
      "毛戈平光影塑颜高光膏 5g",
      "BIODANCE 胶原蛋白水光面膜 4片",
      "TEABLESS 紫茶香氛沐浴露 500g",
      "敷尔佳透明质酸钠修复贴 5片",
      "GLOW 透气修护 BB 霜",
      "BB LAB 低糖胶原果冻 10条",
      "BIODANCE 胶原肽紧致面霜 50ml",
      "毛戈平星耀锁妆气垫 14g",
    ],
  },
  en: {
    heroLabel: "Featured promotions",
    heroPrevious: "Previous promotions",
    heroNext: "Next promotions",
    trending: "Best Sellers",
    trendingTabs: ["All", "Snack & Beverage", "Beauty", "Home", "Health"],
    summer: "Summer Stock-Up",
    forYou: "Recommended For You",
    loadMore: "Load more",
    loading: "Loading products",
    viewAll: "View all",
    featuredNames: [
      "SK2 Pitera Facial Treatment Essence, 11.16 fl oz. - Strong Barrier Antioxidant Repair Shrinks Pores Anti-Aging",
      "Japanese Matcha Powder Wakatake, 3.53oz 【Fresh Green Tea Aroma】【For Drinks & Cooking】",
      "Relief Sun Rice Probiotics Sunscreen SPF50+·PA++++, 1.7 fl oz*2【Value Pack】",
      "Mung Bean ph-Balanced Cleansing Foam, 5.41 fl oz",
      "Madagascar Centella Hyalu-Cica Water-Fit Sun Serum, Brightening, 1.69 fl oz.*2 Dry&Sensitive Skin【Value Pack】",
      "Face Powder Compact #I, 0.31 oz @Cosme Award",
    ],
    productNames: [
      "MGP Highlighting Cream Powder, 5g",
      "BIODANCE Bio-Collagen Real Deep Mask, 4ct",
      "TEABLESS Purple Tea Perfume Body Wash, 500g",
      "VOOLGA Sodium Hyaluronate Repair Dressing, 5ct",
      "GLOW Breathable Blemish Balm",
      "BB LAB Low-Sugar Collagen Jelly, 10ct",
      "BIODANCE Collagen Peptide Cream, 50ml",
      "MGP Starlight Lock Makeup Cushion, 14g",
    ],
  },
} as const;

/**
 * The page reuses the component's own storefront fixture, so the rail, copy,
 * and brand assets cannot drift from `Header`'s stories. The page only supplies
 * destinations — it is a linked template, where the component story renders
 * everything non-navigating.
 */
function createHeader(locale: EcommerceHomeLocale): HeaderProps {
  const header = createHeaderProps(locale, { href: (slot) => `#${slot}` });
  return {
    ...header,
    // A populated cart is the page's own scenario, not the component default.
    cart: { ...header.cart, count: 2 },
    onSearchSubmit: () => {},
  };
}

/**
 * The hero reuses the component's own lineup, so the page template and the
 * HeroBanner Showcase cannot drift. Only the destinations are the page's.
 */
function createHero(locale: EcommerceHomeLocale): HeroBannerProps {
  const localeCopy = copy[locale];
  const items = createHeroBannerItems(locale, (slug) => `#${slug}`);

  return {
    items,
    ariaLabel: localeCopy.heroLabel,
    previousLabel: localeCopy.heroPrevious,
    nextLabel: localeCopy.heroNext,
    imageLoading: "eager",
  };
}

function createShortcutRail(locale: EcommerceHomeLocale): ShortcutRailProps {
  const localeCopy = shortcutCopy[locale];
  return {
    items: createShortcutItems(locale),
    ariaLabel: localeCopy.ariaLabel,
    previousLabel: localeCopy.previousLabel,
    nextLabel: localeCopy.nextLabel,
  };
}

const productImages = [
  assets.productHighlighter,
  assets.productMask,
  assets.productBodyWash,
  assets.productRepairMask,
  assets.productBbCream,
  assets.productJelly,
  assets.productCream,
  assets.productCushion,
] as const;

const productBrands = [
  "MAOGEPING",
  "BIODANCE",
  "TEABLESS",
  "VOOLGA",
  "GLOW",
  "BB LAB",
  "BIODANCE",
  "MAOGEPING",
] as const;

function createProducts(locale: EcommerceHomeLocale): ProductListItem[] {
  return copy[locale].productNames.map((title, index) => ({
    id: `home-product-${index + 1}`,
    image: productImages[index],
    imageAlt: title,
    brand: productBrands[index],
    brandHref: `#brand-${index + 1}`,
    href: `#product-${index + 1}`,
    title,
    priceCurrent: `$${(12.99 + index * 3.7).toFixed(2)}`,
    priceOriginal: `$${(18.99 + index * 4.1).toFixed(2)}`,
    rating: 4.8,
    ratingCount: `${72 + index * 19}`,
    soldCount: locale === "en" ? `${100 + index * 20}+ Sold` : `周销 ${100 + index * 20}+`,
    badges: [{ label: index % 2 === 0 ? "-20%" : "NEW", type: index % 2 === 0 ? "discount" : "new" }],
  }));
}

/* Six listings transcribed from the live storefront's Best Sellers rail, with
 * the figures those listings actually carry. The eight above derive price,
 * rating and sold count from their index, which fills a rail but never asks the
 * card anything: no title long enough to clamp, no rating standing on six
 * reviews, no $335.40 to strike through. These do. Brands stay in `brand`, so
 * the titles hold none — the storefront splits them the same way. */
type FeaturedProduct = {
  image: string;
  brand: string;
  priceCurrent: string;
  priceOriginal: string;
  rating?: number;
  ratingCount?: string;
  sold: number;
  badge?: { type: "discount"; label: string } | { type: "low-price" };
};

const featuredProducts: readonly FeaturedProduct[] = [
  {
    image: assets.featuredEssence,
    brand: "SK-II",
    priceCurrent: "$208.99",
    priceOriginal: "$335.40",
    rating: 4.8,
    ratingCount: "6",
    sold: 90,
    badge: { type: "discount", label: "-37%" },
  },
  {
    image: assets.featuredMatcha,
    brand: "MARUKYU KOYAMAEN",
    priceCurrent: "$42.99",
    priceOriginal: "$69.99",
    // No reviews yet on the live listing, which is worth carrying: the card
    // has to hold its shape when the rating row is absent.
    sold: 60,
    badge: { type: "low-price" },
  },
  {
    image: assets.featuredSunscreen,
    brand: "Beauty of Joseon",
    priceCurrent: "$22.99",
    priceOriginal: "$39.98",
    rating: 5,
    ratingCount: "7",
    sold: 200,
    badge: { type: "low-price" },
  },
  {
    image: assets.featuredCleanser,
    brand: "beplain",
    priceCurrent: "$16.13",
    priceOriginal: "$26.00",
    rating: 5,
    ratingCount: "2",
    sold: 40,
    badge: { type: "low-price" },
  },
  {
    image: assets.featuredSunSerum,
    brand: "SKIN1004",
    priceCurrent: "$24.28",
    priceOriginal: "$34.99",
    rating: 5,
    ratingCount: "4",
    sold: 100,
    badge: { type: "discount", label: "-30%" },
  },
  {
    image: assets.featuredPowder,
    brand: "ELEGANCE",
    priceCurrent: "$119.99",
    priceOriginal: "$144.99",
    rating: 4.9,
    ratingCount: "15",
    sold: 60,
    // Nothing on sale and nothing scarce, so no badge at all.
  },
];

function createFeaturedProducts(
  locale: EcommerceHomeLocale,
): ProductListItem[] {
  const localeCopy = copy[locale];
  return featuredProducts.map((product, index) => {
    const title = localeCopy.featuredNames[index];
    // Storefront product badges stay in English in every locale. Product names
    // and surrounding interface copy continue to use the selected locale.
    const badge =
      product.badge?.type === "low-price"
        ? { label: "Low Price", type: "low-price" as const }
        : product.badge
          ? { label: product.badge.label, type: "discount" as const }
          : undefined;

    return {
      id: `home-featured-${index + 1}`,
      image: product.image,
      imageAlt: title,
      brand: product.brand,
      brandHref: `#brand-featured-${index + 1}`,
      href: `#product-featured-${index + 1}`,
      title,
      priceCurrent: product.priceCurrent,
      priceOriginal: product.priceOriginal,
      rating: product.rating,
      ratingCount: product.ratingCount,
      soldCount:
        locale === "en" ? `${product.sold}+ Sold` : `周销 ${product.sold}+`,
      badges: badge ? [badge] : undefined,
    };
  });
}

function createProductSection(
  locale: EcommerceHomeLocale,
  atmospheric = false,
): ProductListProps {
  const localeCopy = copy[locale];
  const base = {
    title: atmospheric ? localeCopy.summer : localeCopy.trending,
    // The trending rail opens on the transcribed listings — it is the section
    // claiming to rank real best sellers, so the real ones lead and the
    // generated filler follows. The campaign band keeps the filler alone: its
    // products are a seasonal selection, not a ranking.
    products: atmospheric
      ? [...createProducts(locale)].reverse()
      : [...createFeaturedProducts(locale), ...createProducts(locale)],
    tabs: localeCopy.trendingTabs.map((label, index) => ({
      value: `category-${index + 1}`,
      label,
    })),
    viewAllHref: "#all-products",
    viewAllLabel: localeCopy.viewAll,
    previousLabel: locale === "en" ? "Previous products" : "上一组商品",
    nextLabel: locale === "en" ? "Next products" : "下一组商品",
    onAddToCart: () => {},
  };

  if (!atmospheric) {
    return { ...base, appearance: "standard" };
  }

  return {
    ...base,
    appearance: "atmospheric",
    dividerPosition: "top",
    dividerVariant: "gray",
    backgroundColor: "#FFF8EB",
    backgroundImage: assets.atmosphericDesktop,
    backgroundImageMobile: assets.atmosphericMobile,
  };
}

/* The waterfall tail: an open-ended feed under the campaign bands, so the page
 * ends on something to keep scrolling rather than a hard stop. It carries no
 * view-all — the grid is the collection, and "load more" extends it in place. */
function createForYouSection(locale: EcommerceHomeLocale): ProductListProps {
  const localeCopy = copy[locale];
  return {
    title: localeCopy.forYou,
    // ProductList's own catalogue and categories, not a second set built here.
    // The page used to repeat its eight rail products three times to fill the
    // grid, which put made-up names and prices next to the component's real
    // ones two sections apart.
    products: createProductListProducts(locale),
    tabs: createProductListTabs(locale),
    layout: "waterfall",
    appearance: "standard",
    hasMore: true,
    loadMoreLabel: localeCopy.loadMore,
    loadingLabel: localeCopy.loading,
    onLoadMore: () => {},
    onAddToCart: () => {},
  };
}

function createBrandRail(locale: EcommerceHomeLocale): BrandProductRailProps {
  return createBrandProductRailProps(locale, "#all-brands");
}

function createFooter(locale: EcommerceHomeLocale): FooterProps {
  const localeCopy = footerCopy[locale];
  return {
    ariaLabel: localeCopy.ariaLabel,
    columns: createFooterColumns(locale),
    socialLinks: createFooterSocialLinks(locale),
    subscribe: {
      title: localeCopy.subscribeTitle,
      label: localeCopy.subscribeLabel,
      placeholder: localeCopy.subscribePlaceholder,
      submitLabel: localeCopy.subscribeSubmit,
    },
    appTitle: localeCopy.appTitle,
    appLinks: createFooterAppLinks(),
    copyright: localeCopy.copyright,
    legalLinks: createFooterLegalLinks(locale),
    paymentMarks: createFooterPaymentMarks(),
  };
}

export function createEcommerceHomeFixture(
  locale: EcommerceHomeLocale,
): EcommerceHomeProps {
  const sections: EcommerceHomeSection[] = [
    /* Production runs this band directly under the shortcut rail, before the
     * first product list — the first thing after the entry points. */
    {
      id: "new-user-offer",
      kind: "billboard",
      props: createBillboardProps(locale, "#new-user-offer"),
    },
    {
      id: "trending-products",
      kind: "products",
      props: createProductSection(locale),
    },
    {
      id: "featured-brands",
      kind: "brands",
      props: createBrandRail(locale),
    },
    {
      id: "social-media",
      kind: "social",
      props: createSocialMediaGalleryFixture(locale),
    },
    {
      id: "trending-searches",
      kind: "searches",
      props: createTrendingSearchesProps(locale),
    },
    {
      id: "summer-stock-up",
      kind: "products",
      props: createProductSection(locale, true),
    },
    {
      id: "for-you",
      kind: "products",
      props: createForYouSection(locale),
    },
  ];

  return {
    id: "home",
    contentMaxWidth: 1920,
    header: createHeader(locale),
    hero: createHero(locale),
    shortcutRail: createShortcutRail(locale),
    sections,
    footer: createFooter(locale),
  };
}
