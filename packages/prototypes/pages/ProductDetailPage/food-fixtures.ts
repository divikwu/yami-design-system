import type { ProductListItem } from "@yami/design-system";

import { createProductDetailPageFixture, type ProductDetailPageLocale } from "./fixtures";
import type { ProductDetailPageProps } from "./ProductDetailPage.types";

export const foodProductSource = {
  url: "https://www.yami.com/us/en/p/soluble-and-unsweetened-matcha-40g/1020065241",
  capturedAt: "2026-08-27",
  itemNumber: "1020065241",
} as const;

// Public Yami gallery and recommendation snapshot, not a live price/stock feed.
const imageHashes = [
  "1fed61add370f497428cbe3090fd3981",
  "581bea1e0777fecaff68d9e8a7b6294c",
  "f33db30f75a2b318d59878d12ad51c89",
  "9ca0a4918fe2ae2e83d988b007c76017",
  "e47adbe89a19bf16c683b9579b852a40",
  "0e40ce456e06a714b5e4ca887eee9f3f",
  "47d02f27695654e3db9cf00bd21bbec5",
  "90b38725cc3d095cae7d15bc03911e66",
  "9488b058a7827058a0fed484dd397894",
] as const;

const japanRegionIcon = new URL(
  "../../../design-system/components/Header/assets/japan.png",
  import.meta.url,
).href;

const recommendedProducts = [
  {
    id: "1020051271", path: "tea-powder-matcha-green-tea-2oz",
    brand: "ITO EN", brandPath: "ito-en/643",
    en: "Unsweetened Japanese matcha powder, 2 oz",
    zh: "日本无糖抹茶粉，2盎司",
    image: "f40fd3ec2b2edc092ef9ff6cbd37e1e3", price: "$12.99", original: "$14.99",
  },
  {
    id: "1020002271", path: "maeda-en-matcha-green-tea-powder-28g",
    brand: "MAEDA-EN", brandPath: "maeda-en/462",
    en: "Japanese matcha powder, 28g",
    zh: "日本抹茶粉，28克",
    image: "f7ba4a880b5402d26388d9cd61b2f2aa", price: "$16.99", original: "$19.99",
  },
  {
    id: "1157055151", path: "mocha-green-tea-1-06-oz",
    brand: "Balance Master", brandPath: "balance-master/15703",
    en: "Organic matcha powder, 1.05 oz",
    zh: "有机抹茶粉，1.05盎司",
    image: "57fea5744e5ca5f7c50aeba0514a898d", price: "$12.99", original: "$14.99",
  },
  {
    id: "1157077841", path: "kyoto-uji-matcha",
    brand: "YAMAMO", brandPath: "yamamo/22597",
    en: "Kyoto Uji matcha powder, 1.05 oz",
    zh: "京都宇治抹茶粉，1.05盎司",
    image: "325f24a422f5ccbdff595bf94e9ca7f4", price: "$14.99", original: "$19.99",
  },
  {
    id: "1157064891", path: "ujinotsuyu-matcha-powder-midori-1-41-oz",
    brand: "UJINOTSUYU", brandPath: "ujinotsuyu/1024",
    en: "Midori matcha powder, 1.41 oz",
    zh: "绿款抹茶粉，1.41盎司",
    image: "52bbfabfe88430387cb3bfa2677c1d81", price: "$10.99", original: "$12.71",
  },
  {
    id: "1157040151", path: "f-matcha-ayame-koyamaen-17-6-oz",
    brand: "MARUKYU KOYAMAEN", brandPath: "marukyu-koyamaen/13583",
    en: "Ayame culinary matcha powder, 17.6 oz",
    zh: "菖蒲料理用抹茶粉，17.6盎司",
    image: "9665a1343922844de1d1ce76045d213c", price: "$70.99", original: "$89.99",
  },
  {
    id: "1157113361", path: "matcha-powder-1-41-oz",
    brand: "AOZEN", brandPath: "aozen/24594",
    en: "Pure matcha powder, 1.41 oz",
    zh: "纯抹茶粉，1.41盎司",
    image: "100f9e99feb2e66e1d1d127a1f020dca", price: "$19.99", original: "$21.99",
  },
  {
    id: "1157065641", path: "kagura-organic-matcha-powder-50g",
    brand: "KAGURA", brandPath: "kagura/16083",
    en: "Organic matcha powder, 50g",
    zh: "有机抹茶粉，50克",
    image: "d6ad164ecc30b898f83d6c893bebfbca", price: "$22.39", original: "$26.99",
  },
] as const;

// Paraphrases of four complete, visible reviews; never presented as verbatim quotes.
const reviewSummaries = [
  {
    reviewer: "user8870294363", date: "2023-01-26", helpful: 19,
    en: "The reviewer used it in red-bean rolls and enjoyed the pronounced matcha aroma.",
    zh: "买家用它制作抹茶红豆卷，认为抹茶香气浓郁。",
  },
  {
    reviewer: "user1157903222728429568", date: "2025-08-30", helpful: 1,
    en: "The reviewer liked its color and smooth texture, describing an aromatic flavor with light bitterness and umami.",
    zh: "买家喜欢它的颜色与细腻口感，认为香气清新，带有轻微苦味和鲜味。",
  },
  {
    reviewer: "user5135636026", date: "2022-04-01", helpful: 5,
    en: "The reviewer described it as an ordinary matcha powder.",
    zh: "买家认为它是一款普通的抹茶粉。",
  },
  {
    reviewer: "The Hanged Man", date: "2023-09-18", helpful: 3,
    en: "The reviewer found the powder fine and enjoyed it mixed into iced water.",
    zh: "买家认为粉质细腻，用冰水冲泡很清爽。",
  },
] as const;

export function createFoodProductDetailPageFixture(
  locale: ProductDetailPageLocale = "en",
): ProductDetailPageProps {
  // Reuse localized storefront chrome only, not the beauty product or its reviews.
  const { header, footer, copy, reviewSection } = createProductDetailPageFixture(locale);
  const zh = locale === "zh";
  const site = `https://www.yami.com/us/${locale}`;
  const title = zh
    ? "TSUJIRI 辻利 无糖宇治抹茶粉，40克"
    : "TSUJIRI Uji matcha powder, unsweetened, 40g / 1.41 oz";
  const recommendations: ProductListItem[] = recommendedProducts.map((product) => ({
    id: product.id,
    href: `${site}/p/${product.path}/${product.id}`,
    image: `https://cdn.yamibuy.net/item/${product.image}_300x300.webp`,
    imageAlt: `${product.brand} ${product[locale]}`,
    brand: product.brand,
    brandHref: `${site}/b/${product.brandPath}`,
    title: product[locale],
    priceCurrent: product.price,
    priceOriginal: product.original,
    addButtonAriaLabel: zh ? `将${product[locale]}加入购物车` : `Add ${product[locale]} to cart`,
  }));

  return {
    lang: locale,
    contentMaxWidth: 1920,
    header,
    footer,
    breadcrumb: [
      { label: zh ? "饮料" : "Beverages", href: `${site}/c/beverage/310` },
      { label: zh ? "茶" : "Tea", href: `${site}/c/tea/313` },
      { label: zh ? "抹茶" : "Matcha", href: `${site}/c/matcha-tea/1691` },
    ],
    images: imageHashes.map((hash, index) => ({
      id: `tsujiri-${index + 1}`,
      src: `https://cdn.yamibuy.net/item/${hash}_757x757.webp`,
      alt: zh ? `${title}，商品图 ${index + 1}` : `${title}, product image ${index + 1}`,
    })),
    brand: "TSUJIRI",
    brandHref: `${site}/b/sujiri/7482`,
    title,
    ranking: zh ? "抹茶喜爱榜第3名" : "#3 Most Liked Matcha",
    rating: 4.7,
    ratingCount: "33",
    soldCount: zh ? "已售200+" : "200+ sold",
    priceCurrent: "$9.69",
    priceOriginal: "$10.99",
    discountLabel: zh ? "89折" : "11% off",
    optionGroups: [],
    bestBefore: zh ? "2026年11月30日" : "Nov 30, 2026",
    highlights: zh ? [
      "来自创立于1860年的京都茶铺 TSUJIRI 辻利。",
      "选用初摘茶叶，以传统石磨工艺研磨。",
      "无糖配方，保留抹茶本身的茶香。",
      "细腻粉末可与水或牛奶调和，适合制作抹茶饮品。",
      "也可用于蛋糕、甜点等烘焙制作。",
    ] : [
      "From TSUJIRI, a Kyoto tea house founded in 1860.",
      "Made with first-harvest tea leaves using traditional stone milling.",
      "Unsweetened, with the flavor of matcha at the center.",
      "Mix the fine powder with water or milk for matcha drinks.",
      "Also suitable for cakes and other baked desserts.",
    ],
    specifications: [
      { label: zh ? "品牌" : "Brand", value: "TSUJIRI" },
      { label: zh ? "品牌发源地" : "Brand origin", value: zh ? "日本" : "Japan" },
      { label: zh ? "净含量" : "Net content", value: zh ? "40克" : "40g / 1.41 oz" },
    ],
    serviceDetailsHref: `${site}/article/474092`,
    purchaseTags: zh
      ? ["抹茶爱好者", "无糖", "自制冰皮月饼"]
      : ["For Matcha Lovers", "Sugar Free", "DIY Snow Skin Mooncakes"],
    region: { label: zh ? "地区" : "Region", value: zh ? "日本" : "Japan", iconSrc: japanRegionIcon },
    recommendations,
    reviewSection: {
      title: zh ? "顾客评价" : "Customer reviews",
      reviewCount: 33,
      averageRating: 4.7,
      ratingDistribution: [
        { stars: 5, percentage: 88 },
        { stars: 4, percentage: 3 },
        { stars: 3, percentage: 6 },
        { stars: 2, percentage: 0 },
        { stars: 1, percentage: 3 },
      ],
      reviews: reviewSummaries.map((review) => ({
        id: `tsujiri-${review.date}`,
        reviewer: review.reviewer,
        reviewedAt: review.date,
        locale: zh ? "评论于美国" : "Reviewed in US",
        rating: 5,
        verifiedPurchase: true,
        title: zh ? "评价摘要" : "Review summary",
        body: review[locale],
        helpfulCount: review.helpful,
        commentCount: 0,
        showOriginalHref: `${foodProductSource.url}#nav-assist-skip-to-reviews`,
      })),
      copy: {
        ...reviewSection!.copy,
        referenceNotice: zh
          ? "以下为官网部分评价的摘要与翻译，并非原文；完整评价请查看商品来源页。"
          : "Selected review summaries, not verbatim quotes. See the source product page for the complete reviews.",
        showOriginal: zh ? "查看官网评价" : "Read reviews on Yami",
        viewMore: zh ? "查看更多摘要" : "Show more summaries",
      },
      sortOptions: reviewSection!.sortOptions,
      initialVisibleCount: 3,
      viewMoreIncrement: 1,
    },
    copy: {
      ...copy,
      bestBefore: zh ? "赏味期限至" : "Best before",
      deliveryEstimate: zh ? "具体送达时间以结账页为准。" : "Delivery timing is confirmed at checkout.",
      disclaimerBody: zh
        ? "商品包装、规格和价格可能调整。食用前请阅读包装上的配料、营养信息、过敏原提示及食用说明。"
        : "Packaging, specifications and prices may change. Read the pack for ingredients, nutrition, allergen information and preparation instructions before consuming.",
    },
  };
}
