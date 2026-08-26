import type { FooterProps } from "@yami/design-system";
import {
  createFooterAppLinks,
  createFooterColumns,
  createFooterLegalLinks,
  createFooterPaymentMarks,
  createFooterSocialLinks,
  footerCopy,
} from "@yami/design-system/components/Footer/fixtures";

import { createMatchaProductsByCategory } from "../TopicLandingPage/matcha.fixture";
import { createStorefrontHeader } from "../storefront-header.fixture";

import type {
  SearchResultsLocale,
  SearchResultsPageProps,
} from "./SearchResultsPage.types";
import {
  createLiveMatchaSearchProducts,
  liveMatchaSearchResultCount,
} from "./live-matcha-products.fixture";

const copy = {
  en: {
    resultsFor: "for",
    resultSingular: "result",
    resultPlural: "results",
    productsTitle: "Products",
    filtersLabel: "Popular filters:",
    filtersButton: "Filters",
    fulfilledByYami: "Fulfilled by Yami",
    filterMenus: [
      "Category",
      "Offers",
      "In Stock",
      "Brand",
      "Region",
      "Price",
      "Tags",
      "Seller",
    ],
    filterMenuOptions: {
      Offers: ["On Sale", "VVIP Price"],
      Brand: ["MARUKYU KOYAMAEN", "ITO EN", "TSUJIRI", "AGF"],
      Region: ["Japan", "Korea", "China", "United States"],
      Price: ["Under $10", "$10–$25", "$25–$50", "$50 & above"],
      Tags: ["Organic", "Sugar Free", "Vegan", "Best Seller"],
      Seller: ["Yami", "Yami Fresh", "Official Store", "Marketplace"],
    },
    categoryOptions: [
      {
        label: "Beverage",
        value: "beverage",
        children: [
          {
            label: "Tea",
            value: "tea",
            children: [
              { label: "Loose Leaf Tea", value: "loose-leaf-tea" },
              { label: "Tea Drinks", value: "tea-drinks" },
              { label: "Tea Bags", value: "tea-bags" },
              { label: "Instant Tea & Concentrate", value: "instant-tea" },
            ],
          },
          { label: "Boba & Milk Tea", value: "boba-milk-tea" },
          { label: "Coffee", value: "coffee" },
          { label: "Dairy & Dairy Alternatives", value: "dairy" },
          { label: "Soft Drinks", value: "soft-drinks" },
        ],
      },
      { label: "Health", value: "health" },
      { label: "Home", value: "home" },
      { label: "Grocery", value: "grocery" },
      { label: "Beauty", value: "beauty" },
      { label: "Personal Care", value: "personal-care" },
      { label: "Clothing", value: "clothing" },
      { label: "Electronic", value: "electronic" },
      { label: "Toys, Kids, Babies", value: "toys-kids-babies" },
    ],
    clearSelection: "Clear",
    showResults: (count: number) =>
      `Show ${count.toLocaleString("en-US")} results`,
    clearFilters: "Clear all",
    sortLabel: "Sort by",
    sortFeatured: "Featured",
    sortBestSeller: "Best Seller",
    sortPopularity: "Popularity",
    sortMostReviews: "Most Reviews",
    sortMostRatings: "Most Ratings",
    sortNewest: "Newest",
    sortPriceLow: "Price: low to high",
    sortPriceHigh: "Price: high to low",
    emptyTitle: "No exact matches yet",
    emptyDescription:
      "Try a broader search or clear your filters to explore more Asian essentials.",
    resetSearch: "Clear search",
    loadMore: "Load more results",
    loading: "Loading search results",
  },
  zh: {
    resultsFor: "搜索结果",
    resultSingular: "件商品",
    resultPlural: "件商品",
    productsTitle: "商品",
    filtersLabel: "热门筛选：",
    filtersButton: "筛选",
    fulfilledByYami: "亚米配送",
    filterMenus: [
      "分类",
      "优惠",
      "有货",
      "品牌",
      "地区",
      "价格",
      "标签",
      "商家",
    ],
    filterMenuOptions: {
      优惠: ["促销中", "VVIP 价格"],
      品牌: ["MARUKYU KOYAMAEN", "ITO EN", "TSUJIRI", "AGF"],
      地区: ["日本", "韩国", "中国", "美国"],
      价格: ["¥70 以下", "¥70–¥180", "¥180–¥360", "¥360 以上"],
      标签: ["有机", "无糖", "纯素", "畅销"],
      商家: ["亚米", "亚米生鲜", "官方旗舰店", "第三方商家"],
    },
    categoryOptions: [
      {
        label: "饮料",
        value: "beverage",
        children: [
          {
            label: "茶饮",
            value: "tea",
            children: [
              { label: "散装茶叶", value: "loose-leaf-tea" },
              { label: "即饮茶", value: "tea-drinks" },
              { label: "茶包", value: "tea-bags" },
              { label: "速溶茶与浓缩液", value: "instant-tea" },
            ],
          },
          { label: "波霸与奶茶", value: "boba-milk-tea" },
          { label: "咖啡", value: "coffee" },
          { label: "乳制品与替代品", value: "dairy" },
          { label: "软饮料", value: "soft-drinks" },
        ],
      },
      { label: "健康", value: "health" },
      { label: "家居", value: "home" },
      { label: "食品杂货", value: "grocery" },
      { label: "美妆", value: "beauty" },
      { label: "个人护理", value: "personal-care" },
      { label: "服饰", value: "clothing" },
      { label: "电子产品", value: "electronic" },
      { label: "玩具、儿童与母婴", value: "toys-kids-babies" },
    ],
    clearSelection: "清除",
    showResults: (count: number) =>
      `查看 ${count.toLocaleString("zh-CN")} 件商品`,
    clearFilters: "清除全部",
    sortLabel: "排序方式",
    sortFeatured: "精选",
    sortBestSeller: "畅销商品",
    sortPopularity: "人气排序",
    sortMostReviews: "评论最多",
    sortMostRatings: "评分最高",
    sortNewest: "最新上架",
    sortPriceLow: "价格从低到高",
    sortPriceHigh: "价格从高到低",
    emptyTitle: "暂时没有精准匹配",
    emptyDescription: "尝试缩短搜索词或清除筛选，发现更多亚洲好物。",
    resetSearch: "清空搜索",
    loadMore: "加载更多结果",
    loading: "正在加载搜索结果",
  },
} as const;

function createFooter(locale: SearchResultsLocale): FooterProps {
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

export function createSearchResultsFixture(
  locale: SearchResultsLocale
): SearchResultsPageProps {
  const categoryProducts = createMatchaProductsByCategory(locale);
  const products =
    locale === "en"
      ? createLiveMatchaSearchProducts()
      : Array.from(
          new Map(
            Object.values(categoryProducts)
              .flat()
              .map((product, index) => [
                product.id,
                {
                  ...product,
                  priceOriginal:
                    typeof product.priceCurrent === "string"
                      ? `$${(
                          Number.parseFloat(product.priceCurrent.slice(1)) * 1.2
                        ).toFixed(2)}`
                      : undefined,
                  rating: 4.9,
                  ratingCount: `${1888 - index * 17}`,
                  soldCount: "周销 100+",
                },
              ])
          ).values()
        );
  const beautyIds = products.slice(0, 10).map((product) => product.id);
  const valueIds = products
    .filter(
      (product) =>
        typeof product.priceCurrent === "string" &&
        Number.parseFloat(product.priceCurrent.slice(1)) < 25
    )
    .map((product) => product.id);

  return {
    locale,
    contentMaxWidth: 1440,
    query: locale === "en" ? "matcha powder" : "抹茶粉",
    resultCount: locale === "en" ? liveMatchaSearchResultCount : 4033,
    header: createStorefrontHeader(locale),
    footer: createFooter(locale),
    products,
    filters: [
      {
        id: "hot",
        label: locale === "en" ? "Hot" : "热门",
        icon: "hot",
        productIds: products.map((product) => product.id),
      },
      {
        id: "tea-drinks",
        label: locale === "en" ? "Tea Drinks" : "茶饮",
        productIds: beautyIds,
      },
      {
        id: "marukyu-koyamaen",
        label: "MARUKYU KOYAMAEN",
        productIds: products.slice(0, 12).map((product) => product.id),
      },
      {
        id: "ito-en",
        label: "ITO EN",
        productIds: valueIds,
      },
      {
        id: "balance-master",
        label: "Balance Master",
        productIds: products.slice(3, 15).map((product) => product.id),
      },
      {
        id: "ujinotsuyu",
        label: "UJINOTSUYU",
        productIds: valueIds,
      },
      {
        id: "nestle",
        label: "NESTLE",
        productIds: products.slice(5, 17).map((product) => product.id),
      },
      {
        id: "tsujiri",
        label: "TSUJIRI",
        productIds: products.slice(6).map((product) => product.id),
      },
      {
        id: "hishiwaen",
        label: "hishiwaen",
        productIds: products.slice(2, 14).map((product) => product.id),
      },
      {
        id: "agf",
        label: "AGF",
        productIds: products.slice(4, 16).map((product) => product.id),
      },
    ],
    copy: copy[locale],
  };
}
