import type {
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
import { createThemeHeroProps } from "@yami/design-system/components/ThemeHero/fixtures";
import { createThemeProductListProps } from "@yami/design-system/components/ThemeProductList/fixtures";

import type { TopicLandingPageProps } from "./TopicLandingPage.types";

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

function createHeader(): HeaderProps {
  const header = createHeaderProps("en", { href: (slot) => `#${slot}` });
  return {
    ...header,
    cart: { ...header.cart, count: 2 },
    onSearchSubmit: () => {},
  };
}

function createFooter(): FooterProps {
  const copy = footerCopy.en;
  return {
    ariaLabel: copy.ariaLabel,
    columns: createFooterColumns("en"),
    socialLinks: createFooterSocialLinks("en"),
    subscribe: {
      title: copy.subscribeTitle,
      label: copy.subscribeLabel,
      placeholder: copy.subscribePlaceholder,
      submitLabel: copy.subscribeSubmit,
    },
    appTitle: copy.appTitle,
    appLinks: createFooterAppLinks(),
    copyright: copy.copyright,
    legalLinks: createFooterLegalLinks("en"),
    paymentMarks: createFooterPaymentMarks(),
  };
}

function createProductListProps(layout: "rail" | "waterfall"): ProductListProps {
  const copy = productListCopy.en;
  const isWaterfall = layout === "waterfall";
  return {
    title: copy.heading,
    products: createProductListProducts("en"),
    tabs: createProductListTabs("en"),
    layout,
    viewAllHref: isWaterfall ? undefined : "#all-products",
    viewAllLabel: copy.viewAll,
    hasMore: isWaterfall,
    loadMoreLabel: copy.loadMore,
    loadingLabel: copy.loading,
    onLoadMore: isWaterfall ? () => {} : undefined,
    onAddToCart: () => {},
  };
}

function createStandardRailProps(): ProductListProps {
  return {
    ...createProductListProps("rail"),
    title: "Popular Picks",
    viewAllHref: undefined,
    products: standardRailProducts,
    tabs: [
      "All",
      "Serums & Ampoules",
      "Cleansers",
      "Toners & Pads",
      "Moisturizers",
      "Sun Care",
    ].map((label, index) => ({
      value: `popular-picks-tab-${index + 1}`,
      label,
    })),
  };
}

export function createTopicLandingPageFixture(): TopicLandingPageProps {
  return {
    header: createHeader(),
    hero: createThemeHeroProps(),
    standardRail: createThemeProductListProps("en"),
    reviewList: createReviewListProps("en"),
    productRail: createStandardRailProps(),
    waterfall: createProductListProps("waterfall"),
    footer: createFooter(),
  };
}
