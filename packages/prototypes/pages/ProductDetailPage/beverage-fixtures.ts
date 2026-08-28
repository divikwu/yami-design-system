import type { ProductListItem } from "@yami/design-system";

import { createProductDetailPageFixture, type ProductDetailPageLocale } from "./fixtures";
import type { ProductDetailPageProps } from "./ProductDetailPage.types";

export const beverageProductSource = {
  url: "https://www.yami.com/us/en/p/binggrae-banana-flavored-milk-drink-6pack-200ml/1020002371",
  capturedAt: "2026-08-27",
  itemNumber: "1020002371",
  // Use this complete, legible label consistently; the gallery also has a different label version.
  labelImage: "https://cdn.yamibuy.net/item/219493ce026d1f821952f6a431233410_757x757.webp",
} as const;

// Official gallery stills only; the source video's poster is not a product photo.
const imageHashes = [
  "755cfdfd19ac6e4680897f44ff6312dc",
  "f3ab77d81c0401216c4bf1548a02aada",
  "c9b8c129e2836addc8dc678bd54ba247",
  "4b040568a9bd29807a82d1e421f9fd83",
  "36fc99138692077c9d040139f0704ea0",
  "96bcab9ce5c0b0f6b5b512ee53a6f8ae",
  "a9f3473906e1a0abbaa65dd133a4c340",
  "a67624a252ff33ee2456b62da1840dc0",
  "a1d52c032d7105ccbfd99c21bc75d20e",
  "a30081015e187f905b87eec29b2e15d5",
  "219493ce026d1f821952f6a431233410",
] as const;

const koreaRegionIcon = new URL(
  "../../../design-system/components/Header/assets/korea.png",
  import.meta.url,
).href;

const recommendedProducts = [
  {
    id: "1020020331", path: "sangaria-royal-milk-tea-strawberry-flavor-272ml",
    brand: "SANGARIA", brandPath: "sangaria/3119",
    en: "Strawberry milk, 8.96 fl oz", zh: "草莓牛奶，8.96液体盎司",
    image: "afe06fef248381cb177865854a94d20c", price: "$1.79", original: "$2.59",
  },
  {
    id: "1020024141", path: "seoul-milk-coffee-flavored-milk-200ml-6",
    brand: "SEOUL MILK", brandPath: "seoul-milk/3566",
    en: "Coffee flavored milk, 6.42 fl oz × 6", zh: "咖啡味牛奶，6.42液体盎司 × 6盒",
    image: "f03490237a8b39663d9c9a213f65a756", price: "$6.99", original: "$7.39",
  },
  {
    id: "1020098591", path: "sweetened-soft-drink-strawberry-flavor",
    brand: "LIZIYUAN", brandPath: "liziyuan/10633",
    en: "Sweetened drink, strawberry flavor", zh: "草莓风味甜饮料",
    image: "e6a03d016164c666444d00cc646219d5", price: "$4.29", original: undefined,
  },
  {
    id: "1159011541", path: "beihai-ranch-milk-beverage-strawberry-flavor-200ml-x10",
    brand: "BHMC", brandPath: "bhmc/23481",
    en: "Strawberry milk beverage, 6.76 fl oz", zh: "草莓牛乳饮品，6.76液体盎司",
    image: "70279bb197885926858b757aa4dbe4de", price: "$1.79", original: "$2.99",
  },
  {
    id: "1020011341", path: "want-want-milk-drink-4-packs-125ml-4",
    brand: "WANT WANT", brandPath: "want-want/96",
    en: "Milk drink, 4.22 oz × 4", zh: "牛奶饮料，4.22盎司 × 4盒",
    image: "27103bd24991395a9f05a832d3dff138", price: "$3.79", original: "$4.29",
  },
  {
    id: "1020055171", path: "maroyaka-ichigo-milk-500ml",
    brand: "SANGARIA", brandPath: "sangaria/3119",
    en: "Maroyaka strawberry & milk, 500ml", zh: "醇香草莓牛奶，500毫升",
    image: "58a274fe92cbebd84a49ac3771c81f7a", price: "$2.19", original: "$2.59",
  },
  {
    id: "1159004531", path: "institute-lychee-rose-milk-6-76-fl-oz-6",
    brand: "GHYJS", brandPath: "ghyjs/16740",
    en: "Osmanthus orchid fragrance milk, 6.76 fl oz × 6", zh: "桂花幽兰风味牛奶，6.76液体盎司 × 6盒",
    image: "74d454aace711ab023500936374f530f", price: "$8.79", original: "$9.99",
  },
  {
    id: "1020090011", path: "hui-er-kang-peanut-milk",
    brand: "HUIERKANG", brandPath: "huierkang/1560",
    en: "Peanut & milk protein drink, 12.87 oz × 6", zh: "花生牛奶蛋白饮料，12.87盎司 × 6瓶",
    image: "adc360a0f90b5c130338e032508c6788", price: "$9.59", original: undefined,
  },
] as const;

// Summaries of complete, visible banana-flavor reviews, not verbatim quotes.
const reviewSummaries = [
  {
    reviewer: "想吃火锅的猫", date: "2021-11-28", helpful: 7,
    en: "The reviewer first enjoyed this banana milk in Korea and has returned to it many times.",
    zh: "买家曾在韩国喝过这款香蕉牛奶，此后多次回购。",
  },
  {
    reviewer: "Abbyeey", date: "2022-04-27", helpful: 5,
    en: "The reviewer enjoyed the taste and would recommend it.",
    zh: "买家喜欢这款饮料的味道，并表示愿意推荐。",
  },
  {
    reviewer: "imkat", date: "2022-01-11", helpful: 5,
    en: "The reviewer compared the flavor to banana candy and enjoyed it.",
    zh: "买家觉得味道像香蕉糖，并表示很喜欢。",
  },
  {
    reviewer: "Foodie_77", date: "2023-11-09", helpful: 4,
    en: "The reviewer found the packaging secure and the sweet banana flavor as expected.",
    zh: "买家认为包装稳妥，甜甜的香蕉风味符合预期。",
  },
] as const;

export function createBeverageProductDetailPageFixture(
  locale: ProductDetailPageLocale = "en",
): ProductDetailPageProps {
  const { header, footer, copy, reviewSection } = createProductDetailPageFixture(locale);
  const zh = locale === "zh";
  const site = `https://www.yami.com/us/${locale}`;
  const title = zh
    ? "BINGGRAE 宾格瑞 香蕉味牛奶饮料，200毫升 × 6盒"
    : "BINGGRAE Banana flavored milk drink, 200ml / 6.76 fl oz × 6 pack";
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
      { label: zh ? "乳制品及替代品" : "Dairy & dairy alternatives", href: `${site}/c/dairy-dairy-alternatives/315` },
      { label: zh ? "牛奶及风味奶" : "Milk & flavored milk", href: `${site}/c/milk-flavored-milk-dairy-dairy-alternatives/1504` },
    ],
    images: imageHashes.map((hash, index) => ({
      id: `binggrae-${index + 1}`,
      src: `https://cdn.yamibuy.net/item/${hash}_757x757.webp`,
      alt: zh ? `${title}，商品图 ${index + 1}` : `${title}, product image ${index + 1}`,
    })),
    brand: "BINGGRAE",
    brandHref: `${site}/b/binggrae/522`,
    title,
    ranking: "",
    rating: 4.8,
    ratingCount: "539",
    soldCount: zh ? "已售1000+" : "1000+ sold",
    priceCurrent: "$6.89",
    priceOriginal: "$8.89",
    discountLabel: zh ? "78折" : "22% off",
    optionGroups: [],
    bestBefore: zh ? "2027年4月22日" : "Apr 22, 2027",
    highlights: zh ? [
      "来自韩国 BINGGRAE 宾格瑞的香蕉味牛奶饮料。",
      "奶香与香甜香蕉风味结合，口感顺滑。",
      "每盒200毫升，6盒装，方便随身携带。",
      "冰镇后饮用更佳，开封后需冷藏。",
    ] : [
      "A banana flavored milk drink from Korea's BINGGRAE.",
      "A smooth, milky drink with a sweet banana flavor.",
      "Six individual 200ml cartons, easy to take along.",
      "Enjoy chilled and refrigerate after opening.",
    ],
    specifications: [
      { label: zh ? "品牌" : "Brand", value: "BINGGRAE" },
      { label: zh ? "品牌发源地" : "Brand origin", value: zh ? "韩国" : "Korea" },
      { label: zh ? "净含量" : "Net content", value: zh ? "200毫升 × 6盒" : "200ml / 6.76 fl oz × 6 pack" },
      { label: zh ? "口味" : "Flavor", value: zh ? "香蕉味" : "Banana" },
      { label: zh ? "包装" : "Packaging", value: zh ? "盒装" : "Carton" },
      { label: zh ? "储存方式" : "Storage", value: zh ? "开封后冷藏" : "Refrigerate after opening" },
      { label: zh ? "饮用建议" : "Serving suggestion", value: zh ? "冰镇饮用更佳" : "Best served chilled" },
      { label: zh ? "含糖情况" : "Sugar", value: zh ? "含糖" : "Contains sugar" },
    ],
    nutrition: {
      title: zh ? "营养成分表" : "Nutrition Facts",
      servingSizeLabel: zh ? "每份用量" : "Serving size",
      servingSize: zh ? "1盒（200毫升）" : "1 carton (200ml)",
      servingsPerContainer: zh ? "每包装含6份" : "6 servings per container",
      amountPerServingLabel: zh ? "每份含量" : "Amount per serving",
      calories: { label: zh ? "热量（千卡）" : "Calories", value: "160" },
      dailyValueLabel: zh ? "每日参考值%*" : "% Daily Value*",
      rows: [
        { label: zh ? "总脂肪" : "Total Fat", amount: "5.5g", dailyValue: "8%" },
        { label: zh ? "饱和脂肪" : "Saturated Fat", amount: "2.7g", dailyValue: "14%", indented: true },
        { label: zh ? "反式脂肪" : "Trans Fat", amount: "0g", indented: true },
        { label: zh ? "胆固醇" : "Cholesterol", amount: "20mg", dailyValue: "6%" },
        { label: zh ? "钠" : "Sodium", amount: "85mg", dailyValue: "4%" },
        { label: zh ? "总碳水化合物" : "Total Carbohydrate", amount: "22g", dailyValue: "7%" },
        { label: zh ? "膳食纤维" : "Dietary Fiber", amount: "0g", dailyValue: "0%", indented: true },
        { label: zh ? "糖" : "Sugars", amount: "21g", indented: true },
        { label: zh ? "蛋白质" : "Protein", amount: "5.2g" },
        { label: zh ? "维生素A" : "Vitamin A", dailyValue: "2%", groupStart: true },
        { label: zh ? "维生素C" : "Vitamin C", dailyValue: "4%" },
        { label: zh ? "钙" : "Calcium", dailyValue: "18%" },
        { label: zh ? "铁" : "Iron", dailyValue: "1%" },
      ],
      dailyValueNote: zh
        ? "*每日参考值百分比沿用原标签，基于每日2000千卡饮食。— 表示标签未列出，并非0。"
        : "*Daily Values follow the source label and are based on a 2,000-calorie diet. — means not listed, not zero.",
      note: zh
        ? "本信息由 AI 辅助从商品标签中提取。为获取准确、最新的信息，请以实物包装为准。"
        : "This information was extracted from the product label with AI assistance. Please refer to the actual product packaging for the most accurate and up-to-date information.",
      sourceHref: beverageProductSource.labelImage,
      sourceLabel: zh ? "查看营养及配料标签原图" : "View nutrition and ingredients label",
    },
    ingredients: {
      title: zh ? "配料" : "Ingredients",
      body: zh
        ? "牛奶、水、糖、糊精、浓缩香蕉汁（0.32%，由100%香蕉制成）、人工香料、单及双甘油酯、卡拉胶、胭脂树橙（着色用）、瓜尔胶。"
        : "Milk, water, sugar, dextrin, banana juice concentrate (0.32%, from 100% banana), artificial flavors, mono- and diglycerides, carrageenan, annatto (for color), guar gum.",
      allergenLabel: zh ? "过敏原：" : "Allergens:",
      allergens: zh ? "含牛奶。" : "Contains milk.",
      sourceHref: beverageProductSource.labelImage,
      sourceLabel: zh ? "查看配料标签原图" : "View ingredients label",
    },
    serviceDetailsHref: `${site}/article/474092`,
    purchaseTags: zh ? ["趣味好物", "编辑精选", "韩流好物"] : ["Interesting Finds", "Editor's Picks", "K-pop Discoveries"],
    region: { label: zh ? "地区" : "Region", value: zh ? "韩国" : "Korea", iconSrc: koreaRegionIcon },
    recommendations,
    reviewSection: {
      title: zh ? "顾客评价" : "Customer reviews",
      reviewCount: 539,
      averageRating: 4.8,
      ratingDistribution: [
        { stars: 5, percentage: 89 },
        { stars: 4, percentage: 6 },
        { stars: 3, percentage: 3 },
        { stars: 2, percentage: 1 },
        { stars: 1, percentage: 1 },
      ],
      reviews: reviewSummaries.map((review) => ({
        id: `binggrae-${review.date}`,
        reviewer: review.reviewer,
        reviewedAt: review.date,
        locale: zh ? "评论于美国" : "Reviewed in US",
        rating: 5,
        verifiedPurchase: true,
        title: zh ? "评价摘要" : "Review summary",
        body: review[locale],
        helpfulCount: review.helpful,
        commentCount: 0,
        showOriginalHref: `${beverageProductSource.url}#nav-assist-skip-to-reviews`,
      })),
      copy: {
        ...reviewSection!.copy,
        referenceNotice: zh
          ? "以下为官网部分香蕉口味评价的摘要与翻译，并非原文；完整评价请查看商品来源页。"
          : "Selected banana-flavor review summaries, not verbatim quotes. See the source product page for complete reviews.",
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
        ? "商品包装、配料、规格和价格可能调整。以上为官网信息快照；饮用前请核对实物包装上的配料、营养信息、过敏原及储存说明。"
        : "Packaging, ingredients, specifications and prices may change. This is a source-page snapshot; check the actual pack for ingredients, nutrition, allergens and storage instructions before consuming.",
    },
  };
}
