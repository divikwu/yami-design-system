import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  buildTopicPagePlan,
  buildYamiSearchUrl,
  parseYamiCatalogResponse,
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
  it("keeps the generated plan in English while rendering analysis chrome in Chinese", () => {
    const plan = buildTopicPagePlan(
      snapshot([
        product("1", "ANUA Heartleaf Soothing Toner", 1),
        product("2", "ANUA Niacinamide Serum", 2),
      ]),
      "relevance",
      "en",
    );
    const html = renderToStaticMarkup(createElement(TopicAnalysisView, {
      plan,
      uiLanguage: "zh",
    }));

    expect(plan.language).toBe("en");
    expect(html).toContain("主题词理解与购物意图");
    expect(html).toContain("分析拆解");
    expect(html).toContain("识别对象");
    expect(html).toContain("购物任务");
    expect(html).not.toContain("Analysis breakdown");
  });

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

    expect(html).toContain("主题词理解与购物意图");
    expect(html).toContain('<h2 id="topic-analysis-title">ANUA</h2>');
    expect(html).toContain("一句话结论");
    expect(html).toContain("为什么这样判断");
    expect(html).toContain("分析拆解");
    expect(html).toContain("识别对象");
    expect(html).toContain("购物任务");
    expect(html).toContain("附加条件");
    expect(html).toContain("检索边界");
    expect(html).toContain("低证据");
    expect(html).toContain("需要复核");
    expect(html).toContain("浏览 Yami 上可售的 ANUA 商品");
    expect(html).toContain("结构化目录接口不可用");
    expect(html).not.toContain("56%");
    expect(html).not.toContain(plan.intent.reason);
  });

  it("keeps a long catalog label secondary to a concise shopper-facing conclusion", () => {
    const analysis = parseYamiCatalogResponse("ramen", {
      messageId: "10000",
      body: {
        categoryAgg: [{
          category_id: 10,
          category_name: "方便食品",
          category_ename: "Instant Noodles & Self-heating HotPot",
          children: [{
            category_id: 101,
            category_name: "方便面",
            category_ename: "Instant Noodles & Ramen & Cup Noodles & Tteokbokki",
            result_count: 54,
            children: [],
          }],
        }],
        items: [{
          item_number: "ramen-1",
          goods_ename: "Spicy Ramen",
          brand_ename: "Noodle Brand",
          category_l2_id: 10,
          category_l3_id: 101,
          image_url: "/item/ramen.webp",
          slug: "spicy-ramen",
          status: "A",
          goods_number: 6,
        }],
      },
    });
    const plan = buildTopicPagePlan(analysis.snapshot, "relevance", "zh");
    const html = renderToStaticMarkup(createElement(TopicAnalysisView, { plan }));

    expect(html).toContain("<h3>查找“ramen”相关商品</h3>");
    expect(html).toContain("Instant Noodles &amp; Ramen &amp; Cup Noodles &amp; Tteokbokki");
    expect(html).toContain("目录品类");
    expect(html).toContain("查找商品");
    expect(html).toContain("无附加条件");
    expect(html).toContain("高证据");
    expect(html).toContain("已确认");
    expect(html).not.toContain("category · find");
  });

  it("collapses lower-priority interpretations after a catalog decision is resolved", () => {
    const analysis = parseYamiCatalogResponse("ANUA", {
      messageId: "10000",
      body: {
        brandAgg: [{
          brand_id: 100,
          brand_name: "ANUA",
          brand_ename: "ANUA",
          result_count: 60,
        }],
        categoryAgg: [{
          category_id: 5,
          category_name: "美妆个护",
          category_ename: "Beauty",
          children: [{
            category_id: 50,
            category_name: "面部护理",
            category_ename: "Skin Care",
            children: [{
              category_id: 500,
              category_name: "精华",
              category_ename: "Serums & Value Sets",
              result_count: 42,
              children: [],
            }, {
              category_id: 501,
              category_name: "洁面",
              category_ename: "Cleanser & Exfoliators",
              result_count: 6,
              children: [],
            }],
          }],
        }],
        items: [
          {
            item_number: "anua-1",
            goods_ename: "ANUA Heartleaf Serum",
            brand_id: 100,
            brand_ename: "ANUA",
            category_l1_id: 5,
            category_l2_id: 50,
            category_l3_id: 500,
            image_url: "/item/anua.webp",
            slug: "anua-heartleaf-serum",
            status: "A",
            goods_number: 60,
          },
          {
            item_number: "anua-2",
            goods_ename: "ANUA Heartleaf Cleanser",
            brand_id: 100,
            brand_ename: "ANUA",
            category_l1_id: 5,
            category_l2_id: 50,
            category_l3_id: 501,
            image_url: "/item/anua-cleanser.webp",
            slug: "anua-heartleaf-cleanser",
            status: "A",
            goods_number: 6,
          },
        ],
      },
    });
    const plan = buildTopicPagePlan(analysis.snapshot, "relevance", "zh");
    const displayPlan = {
      ...plan,
      intent: {
        ...plan.intent,
        categories: plan.intent.categories.map((category, index) => ({
          ...category,
          evidenceCount: index === 0 ? 42 : 6,
        })),
      },
    };
    const html = renderToStaticMarkup(createElement(TopicAnalysisView, { plan: displayPlan }));

    expect(plan.intent.decision.status).toBe("resolved");
    expect(plan.intent.candidates).toHaveLength(2);
    expect(html).toContain("<details");
    expect(html).toContain("其他目录解释");
    expect(html).toContain("当前结论已确认");
    expect(html).toContain("Serums &amp; Value Sets");
    expect(html).toContain("当前快照覆盖分类");
    expect(html).toContain("2 个候选品类");
    expect(html).toContain("当前目录快照包含 48 件可售商品，覆盖 2 个候选品类");
    expect(html).toContain("不代表品牌全量商品数");
    expect(html).toContain("不代表分类总量或最终商品分配");
    expect(html).toContain("<small>Beauty / Skin Care</small>");
    expect(html).toContain('style="width:100%"');
    expect(html).toContain('style="width:14%"');
    expect(html).not.toContain("<h3>候选解释</h3>");
  });
});
