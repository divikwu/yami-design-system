import type { ThemeProductListProps } from "./ThemeProductList.types";
import type { ProductListItem } from "../ProductList";
import type { ProductListLocale } from "../ProductList/fixtures";

const sceneImage = new URL(
  "./assets/anua-cleanse-reset.png",
  import.meta.url,
).href;

const themeProductImages = [
  new URL(
    "./assets/anua-heartleaf-cleansing-oil.jpeg",
    import.meta.url,
  ).href,
  new URL(
    "./assets/anua-heartleaf-cleansing-foam.png",
    import.meta.url,
  ).href,
  new URL(
    "./assets/anua-hyaluronic-foaming-cleanser.png",
    import.meta.url,
  ).href,
  new URL(
    "./assets/anua-rice-enzyme-cleansing-powder.png",
    import.meta.url,
  ).href,
] as const;

/* Product copy mirrors the four visible cards in Figma node 1865:43831 and
 * the matching ANUA brand-page cards. The design file's image URLs are
 * temporary, so the fixture uses bundled assets while keeping the product
 * data stable and inspectable in Storybook. */
const themeProducts: ProductListItem[] = [
  {
    id: "anua-heartleaf-cleansing-oil",
    image: themeProductImages[0],
    imageAlt:
      "Heartleaf Pore Control Cleansing Oil, 6.76 fl oz Quick Makeup Removal, Deep Cleansing Pores, Suitable for Acne-Prone Skin",
    brand: "ANUA",
    brandHref: "/en/brands/anua",
    href: "/en/products/anua-heartleaf-cleansing-oil",
    title:
      "Heartleaf Pore Control Cleansing Oil, 6.76 fl oz Quick Makeup Removal, Deep Cleansing Pores, Suitable for Acne-Prone Skin",
    priceCurrent: "$18.99",
    priceOriginal: "$19.99",
    ranking: "#10 Most Liked Makeup Remover",
    rating: 4.5,
    ratingCount: "6",
    soldCount: "80+ Sold",
  },
  {
    id: "anua-heartleaf-cleansing-foam",
    image: themeProductImages[1],
    imageAlt: "Heartleaf Quercetinol Pore Deep Cleansing Foam, 5.07 fl oz",
    brand: "ANUA",
    brandHref: "/en/brands/anua",
    href: "/en/products/anua-heartleaf-cleansing-foam",
    title: "Heartleaf Quercetinol Pore Deep Cleansing Foam, 5.07 fl oz",
    priceCurrent: "$9.99",
    priceOriginal: "$14.99",
  },
  {
    id: "anua-hyaluronic-foaming-cleanser",
    image: themeProductImages[2],
    imageAlt: "8 Hyaluronic Acid Hydrating Gentle Foaming Cleanser, 5.07 fl oz.",
    brand: "ANUA",
    brandHref: "/en/brands/anua",
    href: "/en/products/anua-hyaluronic-foaming-cleanser",
    title: "8 Hyaluronic Acid Hydrating Gentle Foaming Cleanser, 5.07 fl oz.",
    priceCurrent: "$13.09",
    priceOriginal: "$13.99",
    badges: [{ label: "Low Price", type: "low-price" }],
    rating: 5,
    ratingCount: "1",
    soldCount: "30+ Sold",
  },
  {
    id: "anua-rice-enzyme-cleansing-powder",
    image: themeProductImages[3],
    imageAlt: "Rice Enzyme Brightening Cleansing Powder, 1.41 oz",
    brand: "ANUA",
    brandHref: "/en/brands/anua",
    href: "/en/products/anua-rice-enzyme-cleansing-powder",
    title: "Rice Enzyme Brightening Cleansing Powder, 1.41 oz",
    priceCurrent: "$16.99",
    priceOriginal: "$21.00",
  },
];

const copy = {
  zh: {
    title: "从这里开始",
    tabs: ["清洁焕新", "调理打底", "修护焕肤", "锁水防护", "每周面膜护理"],
    imageAlt: "ANUA 清洁焕新泡沫洁面场景",
    contentTitle: "清新洁净，平衡肌肤",
    contentDescription:
      "卸除彩妆、防晒和肌肤负担，再用温和洁面完成清洁，让肌肤清新舒适。",
    previous: "上一个主题商品",
    next: "下一个主题商品",
  },
  en: {
    title: "Start Here",
    tabs: [
      "Cleanse & Reset",
      "Tone & Prep",
      "Treat & Target",
      "Seal & Protect",
      "Weekly Mask Care",
    ],
    imageAlt: "ANUA cleanse and reset foaming cleanser scene",
    contentTitle: "Start Fresh, Stay Balanced",
    contentDescription:
      "Melt away makeup, sunscreen, and buildup, then follow with a gentle cleanser for fresh, comfortable skin.",
    previous: "Previous theme products",
    next: "Next theme products",
  },
} as const;

export function createThemeProductListProps(
  locale: ProductListLocale = "en",
): ThemeProductListProps {
  const localeCopy = copy[locale];

  return {
    title: localeCopy.title,
    products: themeProducts,
    tabs: localeCopy.tabs.map((label, index) => ({
      value: `theme-tab-${index + 1}`,
      label,
    })),
    content: {
      image: {
        src: sceneImage,
        alt: localeCopy.imageAlt,
      },
      title: localeCopy.contentTitle,
      description: localeCopy.contentDescription,
      href: "#cleanse-reset",
    },
    previousLabel: localeCopy.previous,
    nextLabel: localeCopy.next,
    onAddToCart: () => {},
  };
}
