import type {
  BrandProductRailProps,
  FooterProps,
  HeaderProps,
  HeroBannerProps,
  ImageSource,
  ProductListItem,
  ProductListProps,
  ResponsiveImageSource,
  ShortcutRailProps,
} from "@yami/design-system";
import { createBillboardProps } from "@yami/design-system/components/Billboard/fixtures";
import { createBrandProductRailProps } from "@yami/design-system/components/BrandProductRail/fixtures";
import { createHeroBannerItems } from "@yami/design-system/components/HeroBanner/fixtures";
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
import {
  atmosphericImages,
  billboardImages,
  brandBannerImages,
  heroCampaignImages,
  heroProductImages,
  shortcutImages,
  socialPosterImages,
  socialProductImages,
} from "./optimizedImages.generated";
import { createStorefrontHeader } from "../storefront-header.fixture";

export type EcommerceHomeLocale = "zh" | "en";

const productCardSizes =
  "(min-width: 1440px) 12.5vw, (min-width: 1024px) 16.667vw, 50vw";

function createCdnProductImage(
  hash: string,
  sizes = productCardSizes,
): ResponsiveImageSource {
  const source = (width: 300 | 600) =>
    `https://cdn.yamibuy.net/item/${hash}_${width}x${width}.webp`;
  return {
    src: source(600),
    width: 600,
    height: 600,
    candidates: [
      { src: source(300), width: 300 },
      { src: source(600), width: 600 },
    ],
    sizes,
  };
}

const brandProductHashes = {
  "maogeping-highlighter": "cdc33c77de29390c973f3657a26d7dad",
  "maogeping-cushion": "cb5b6b665b76f8c98f1aa5e86ca46740",
  "maogeping-concealer": "f3b0db50e04fcc15300211cd94111d83",
  "bb-lab-glutathione": "868c0f52ce4313e6e25590c6912b76be",
  "bb-lab-biotin": "bd38d43a3f00bf4e0aceb09fdfb74f32",
  "bb-lab-jelly": "fd11a661be4980bfd3190c67bd80392e",
  "biodance-mask": "c8dcfa16d92b0def7c96453886efa36e",
  "biodance-cream": "feeaac6b8f8c411271cccf3083b6b7c6",
  "biodance-pads": "571149d4d5b62b680da7db7c4cf4da19",
  "glow-concealer": "2e044fe0cba3e40ba88af9314dc927e6",
  "glow-patches": "0c9267eb8b700c650242578c3c2cac4b",
  "glow-bb": "de65f278eea28f7c5a794c6a32a179ac",
  "teabless-lotion": "cd20f86995dab51ce783ee9104b02d6d",
  "teabless-wash": "eef84b24bdfa83bc6c3ac1a17cb29e59",
  "teabless-rose": "4794d08d2d00a6ff549d75d4afcc5974",
  "voolga-mask": "090012ed3cd043cc3ee4ed514a5d56a9",
  "voolga-ampoule": "676f94362d286f3b93d0d1dee0b31cb2",
  "voolga-gel": "1d3d1cb694ae79f04fe706bfba3f1111",
} as const;

const featuredProductHashes = [
  "b21c446891140d6f29c77841b085fd28",
  "e3c1f9f0a0fa194ebba0e3c6aa34928e",
  "0a5b71afa1d59b2f45ce0a5b90a3b4f2",
  "29aad4f8b0c444171882b043ca849b08",
  "ae08094e7ec81daa6dccb333ee8e4b4e",
  "ebde4aedd980a725501d9ed711255d2a",
] as const;

function candidateAt(
  source: ResponsiveImageSource,
  width: number,
): string {
  return (
    source.candidates.find((candidate) => candidate.width === width)?.src ??
    source.src
  );
}

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
  const header = createStorefrontHeader(locale);
  return {
    ...header,
    imageLoadingStrategy: "windowed",
  };
}

/**
 * The hero reuses the component's own lineup, so the page template and the
 * HeroBanner Showcase cannot drift. Only the destinations are the page's.
 */
function createHero(locale: EcommerceHomeLocale): HeroBannerProps {
  const localeCopy = copy[locale];
  const campaignKeys = {
    "back-to-school": "back-to-school",
    "glow-skin-like-makeup": "glow-skin-like-makeup",
    "japanese-summer-festival": "japanese-summer-festival",
    "midnight-street-food": "midnight-street-food",
    "trending-summer": "trending-summer",
    "seasonal-sale": "sale-image",
  } as const;
  const productKeys = {
    "glow-skin-like-makeup": [
      "glow-foundation",
      "glow-patches",
      "glow-palette",
    ],
    "japanese-summer-festival": [
      "yuzu-chips",
      "hokkaido-caramel-cookies",
      "matcha-dango",
    ],
    "midnight-street-food": ["green-tea", "buldak-snack", "turtle-chips"],
    "trending-summer": ["skin-care", "summer-snack", "summer-drink"],
    "keep-shopping": [
      "green-tea",
      "buldak-snack",
      "turtle-chips",
      "summer-drink",
    ],
  } as const;
  const items: HeroBannerProps["items"] = createHeroBannerItems(
    locale,
    (slug) => `#${slug}`,
  ).map((item) => {
    const campaignKey = campaignKeys[item.id as keyof typeof campaignKeys];
    const itemProductKeys = productKeys[item.id as keyof typeof productKeys];
    return {
      ...item,
      ...(campaignKey && "image" in item && item.image
        ? {
            image: {
              ...item.image,
              src: heroCampaignImages[campaignKey],
            },
          }
        : {}),
      ...(itemProductKeys && "products" in item && item.products
        ? {
            products: item.products.map((product, index) => ({
              ...product,
              src: heroProductImages[itemProductKeys[index]],
            })),
          }
        : {}),
    } as HeroBannerProps["items"][number];
  });

  return {
    items,
    ariaLabel: localeCopy.heroLabel,
    previousLabel: localeCopy.heroPrevious,
    nextLabel: localeCopy.heroNext,
    imageLoadingStrategy: "windowed",
  };
}

function createShortcutRail(locale: EcommerceHomeLocale): ShortcutRailProps {
  const localeCopy = shortcutCopy[locale];
  return {
    items: createShortcutItems(locale).map((item, index) => ({
      ...item,
      iconSrc:
        shortcutImages[
          String(index + 1).padStart(2, "0") as keyof typeof shortcutImages
        ],
    })),
    surface: "card",
    ariaLabel: localeCopy.ariaLabel,
    previousLabel: localeCopy.previousLabel,
    nextLabel: localeCopy.nextLabel,
    imageLoadingStrategy: "windowed",
  };
}

const productImageIds = [
  "maogeping-highlighter",
  "biodance-mask",
  "teabless-wash",
  "voolga-mask",
  "glow-bb",
  "bb-lab-jelly",
  "biodance-cream",
  "maogeping-cushion",
] as const;

const productImages = productImageIds.map((id) =>
  createCdnProductImage(brandProductHashes[id]),
);

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
  image: ImageSource;
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
    image: createCdnProductImage(featuredProductHashes[0]),
    brand: "SK-II",
    priceCurrent: "$208.99",
    priceOriginal: "$335.40",
    rating: 4.8,
    ratingCount: "6",
    sold: 90,
    badge: { type: "discount", label: "-37%" },
  },
  {
    image: createCdnProductImage(featuredProductHashes[1]),
    brand: "MARUKYU KOYAMAEN",
    priceCurrent: "$42.99",
    priceOriginal: "$69.99",
    // No reviews yet on the live listing, which is worth carrying: the card
    // has to hold its shape when the rating row is absent.
    sold: 60,
    badge: { type: "low-price" },
  },
  {
    image: createCdnProductImage(featuredProductHashes[2]),
    brand: "Beauty of Joseon",
    priceCurrent: "$22.99",
    priceOriginal: "$39.98",
    rating: 5,
    ratingCount: "7",
    sold: 200,
    badge: { type: "low-price" },
  },
  {
    image: createCdnProductImage(featuredProductHashes[3]),
    brand: "beplain",
    priceCurrent: "$16.13",
    priceOriginal: "$26.00",
    rating: 5,
    ratingCount: "2",
    sold: 40,
    badge: { type: "low-price" },
  },
  {
    image: createCdnProductImage(featuredProductHashes[4]),
    brand: "SKIN1004",
    priceCurrent: "$24.28",
    priceOriginal: "$34.99",
    rating: 5,
    ratingCount: "4",
    sold: 100,
    badge: { type: "discount", label: "-30%" },
  },
  {
    image: createCdnProductImage(featuredProductHashes[5]),
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
    imageLoadingStrategy: "windowed" as const,
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
    backgroundImage: candidateAt(atmosphericImages.desktop, 1920),
    backgroundImage2x: candidateAt(atmosphericImages.desktop, 3840),
    backgroundImageMobile: candidateAt(atmosphericImages.mobile, 600),
    backgroundImageMobile2x: candidateAt(atmosphericImages.mobile, 1200),
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
  const rail = createBrandProductRailProps(locale, "#all-brands");
  return {
    ...rail,
    imageLoadingStrategy: "windowed",
    campaigns: rail.campaigns.map((campaign) => ({
      ...campaign,
      banner: {
        ...campaign.banner,
        src:
          brandBannerImages[
            campaign.id as keyof typeof brandBannerImages
          ] ?? campaign.banner.src,
      },
      products: campaign.products.map((product) => {
        const hash =
          brandProductHashes[
            product.id as keyof typeof brandProductHashes
          ];
        return hash
          ? { ...product, image: createCdnProductImage(hash) }
          : product;
      }),
    })),
  };
}

function createSocialGallery(locale: EcommerceHomeLocale) {
  const gallery = createSocialMediaGalleryFixture(locale);
  return {
    ...gallery,
    imageLoadingStrategy: "windowed" as const,
    cards: gallery.cards.map((card, index) => {
      const assetIndex = index % 6;
      return {
        ...card,
        posterSrc:
          socialPosterImages[
            String(assetIndex + 1) as keyof typeof socialPosterImages
          ],
        products: card.products?.map((product, productIndex) => ({
          ...product,
          imageSrc:
            socialProductImages[
              String(
                ((assetIndex + productIndex) % 5) + 1,
              ) as keyof typeof socialProductImages
            ],
        })),
      };
    }),
  };
}

const trendingProductIds = [
  "maogeping-highlighter",
  "biodance-mask",
  "glow-bb",
  "bb-lab-jelly",
  "biodance-cream",
  "teabless-lotion",
  "glow-patches",
  "maogeping-cushion",
] as const;

function createTrendingSearches(locale: EcommerceHomeLocale) {
  const searches = createTrendingSearchesProps(locale);
  return {
    ...searches,
    imageLoadingStrategy: "windowed" as const,
    keywords: searches.keywords.map((keyword, keywordIndex) => {
      const imageForIndex = (index: number) => {
        const id = trendingProductIds[index % trendingProductIds.length];
        return createCdnProductImage(brandProductHashes[id]);
      };
      return {
        ...keyword,
        thumbnail: keyword.thumbnail
          ? { ...keyword.thumbnail, src: imageForIndex(keywordIndex * 2) }
          : undefined,
        products: keyword.products.map((product, productIndex) => ({
          ...product,
          image: imageForIndex(keywordIndex * 2 + productIndex),
        })),
      };
    }),
  };
}

function createBillboard(locale: EcommerceHomeLocale) {
  const billboard = createBillboardProps(locale, "#new-user-offer");
  return {
    ...billboard,
    revealOnLoad: true,
    image: {
      ...billboard.image,
      src: locale === "zh" ? billboardImages.zhDesktop : billboardImages.enDesktop,
      mobile: billboard.image.mobile
        ? { ...billboard.image.mobile, src: billboardImages.mobile }
        : undefined,
    },
  };
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
    imageLoading: "lazy",
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
      props: createBillboard(locale),
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
      props: createSocialGallery(locale),
    },
    {
      id: "trending-searches",
      kind: "searches",
      props: {
        ...createTrendingSearches(locale),
        dividerPosition: "top",
        dividerVariant: "gray",
      },
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
