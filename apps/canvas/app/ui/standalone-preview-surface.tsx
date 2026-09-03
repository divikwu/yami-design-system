"use client";

import type { HeaderSearchPanel, HeaderSearchTag } from "@yami/design-system";
import { createPopularSearchImagePanel } from "@yami/design-system/components/Header/fixtures";
import {
  createEcommerceHomeFixture,
  createTopicKeywordLandingPageFixture,
  createTopicLandingPageFixture,
  EcommerceHomeTemplate,
  TopicLandingPage,
} from "@yami/prototypes";
import { popularSearchProductTags } from "@yami/prototypes/ecommerce-home/popular-search-products";
import { useRouter, useSearchParams } from "next/navigation";
import "@yami/design-system/styles/base.css";

export type StandalonePreview = "ecommerce-home" | "topic" | "brand";

const zhSearchDiscovery = {
  recentTitle: "最近搜索",
  clearLabel: "清除",
  recent: ["抹茶粉", "韩式辣面", "日本糖果", "拉面", "咖啡", "湿巾", "奶茶"],
  popularTitle: "热门搜索",
  popular: ["抹茶", "火锅", "丝蓓绮", "Canmake", "防晒", "零食", "Anua", "蒟蒻果冻", "Beauty of Joseon", "方便面"],
  hotDealsTitle: "热门优惠",
  hotDeals: ["父亲节礼物", "国货美妆特惠", "三丽鸥联名精选", "iUNIK 韩系护肤新品", "iUNIK 韩系护肤新品", "K-Pharmacy 热门精选"],
  suggestions: ["抹", "抹茶碗", "抹茶蛋糕", "抹茶糖果", "抹茶巧克力", "抹茶曲奇", "抹茶拿铁", "抹茶粉", "抹茶套装", "抹茶零食", "抹茶刷", "抹茶"],
} as const;

function createLiveSearchPanel(
  source: HeaderSearchPanel,
  locale: "en" | "zh",
  hrefForQuery: (query: string) => string,
): HeaderSearchPanel {
  const panel = createPopularSearchImagePanel(source, popularSearchProductTags);

  function linkedTag(entry: string | HeaderSearchTag, label?: string): HeaderSearchTag {
    const tag = typeof entry === "string" ? { label: entry } : entry;
    const nextLabel = label ?? tag.label;
    return { ...tag, label: nextLabel, href: hrefForQuery(nextLabel) };
  }

  return {
    ...panel,
    recentTitle: locale === "zh" ? zhSearchDiscovery.recentTitle : panel.recentTitle,
    clearLabel: locale === "zh" ? zhSearchDiscovery.clearLabel : panel.clearLabel,
    recent: panel.recent.map((tag, index) => linkedTag(tag, locale === "zh" ? zhSearchDiscovery.recent[index] : undefined)),
    popularTitle: locale === "zh" ? zhSearchDiscovery.popularTitle : panel.popularTitle,
    popular: panel.popular.map((tag, index) => linkedTag(tag, locale === "zh" ? zhSearchDiscovery.popular[index] : undefined)),
    hotDealsTitle: locale === "zh" ? zhSearchDiscovery.hotDealsTitle : panel.hotDealsTitle,
    hotDeals: panel.hotDeals.map((tag, index) => linkedTag(tag, locale === "zh" ? zhSearchDiscovery.hotDeals[index] : undefined)),
    suggestions: panel.suggestions.map((suggestion, index) => ({
      ...suggestion,
      label: locale === "zh" ? zhSearchDiscovery.suggestions[index] ?? suggestion.label : suggestion.label,
    })),
  };
}

export function StandalonePreviewSurface({ preview }: { preview: StandalonePreview }) {
  const params = useSearchParams();
  const router = useRouter();
  const locale = params.get("locale") === "zh" ? "zh" : "en";
  const theme = params.get("theme") === "dark" ? "dark" : "light";
  const categoryMenuPresentation = params.get("categoryMenu") === "images" ? "images" : "text";
  const homeFixture = preview === "ecommerce-home" ? createEcommerceHomeFixture(locale) : null;

  function searchHref(query?: string) {
    const searchParams = new URLSearchParams({ data: "live", locale, theme });
    if (query?.trim()) searchParams.set("q", query.trim());
    return `/preview/search?${searchParams.toString()}`;
  }

  const searchPanelSource = homeFixture?.header.searchPanel
    ?? (homeFixture ? createEcommerceHomeFixture("en").header.searchPanel : undefined);
  const searchPanel = searchPanelSource
    ? createLiveSearchPanel(searchPanelSource, locale, searchHref)
    : undefined;

  const content = homeFixture
    ? <EcommerceHomeTemplate
        {...homeFixture}
        header={{
          ...homeFixture.header,
          categoryMenu: homeFixture.header.categoryMenu
            ? { ...homeFixture.header.categoryMenu, presentation: categoryMenuPresentation }
            : undefined,
          homeHref: `/preview/ecommerce-home?${new URLSearchParams({ locale, theme, ...(categoryMenuPresentation === "images" ? { categoryMenu: "images" } : {}) }).toString()}`,
          mobileSearchHref: searchHref(),
          onSearchSubmit: (query) => router.push(searchHref(query)),
          searchPanel,
        }}
      />
    : <TopicLandingPage {...(preview === "brand"
      ? createTopicLandingPageFixture(locale)
      : createTopicKeywordLandingPageFixture(locale))} />;

  return (
    <div className={`prototype-root${theme === "dark" ? " dark" : ""}`} data-theme={theme}>
      {content}
    </div>
  );
}
