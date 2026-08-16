import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildTopicPagePlan,
  buildYamiSearchUrl,
  type YamiProduct,
  type YamiSearchSnapshot,
} from "../src/index";
import { TopicAnalysisView } from "../web/topic-analysis-view";

function product(id: string, title: string, rank: number): YamiProduct {
  return {
    id,
    title,
    brand: "ANUA",
    price: "$19.99",
    imageUrl: `https://cdn.yamibuy.net/item/${id}_750x750.webp`,
    productUrl: `https://www.yami.com/us/en/p/example/${id}`,
    sourceRank: rank,
  };
}

function snapshot(products: YamiProduct[]): YamiSearchSnapshot {
  return {
    keyword: "ANUA",
    site: "us",
    sourceUrl: buildYamiSearchUrl("ANUA"),
    fetchedAt: "2026-08-16T00:00:00.000Z",
    products,
  };
}

describe("TopicAnalysisView", () => {
  it("renders the keyword analysis conclusion and evidence-based reason", () => {
    const plan = buildTopicPagePlan(
      snapshot([
        product("1", "ANUA Heartleaf Soothing Toner", 1),
        product("2", "ANUA Niacinamide Serum", 2),
      ]),
      "relevance",
      "zh",
    );
    const html = renderToStaticMarkup(createElement(TopicAnalysisView, { plan }));

    expect(html).toContain("主题词分析");
    expect(html).toContain("ANUA");
    expect(html).toContain("分析结论");
    expect(html).toContain("判断原因");
    expect(html).toContain("浏览并比较 Yami 上可售的 ANUA 商品");
    expect(html).toContain("结构化目录接口不可用");
    expect(html).not.toContain(plan.intent.reason);
  });
});
