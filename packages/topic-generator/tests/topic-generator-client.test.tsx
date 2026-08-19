/* @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildTopicPagePlanMatrix,
  buildYamiSearchUrl,
  type YamiSearchSnapshot,
} from "../src/index";
import {
  TopicGenerator,
  type TopicPagePreviewRendererProps,
} from "../web/topic-generator-client";

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

describe("TopicGenerator result navigation", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("returns to the empty page preview after viewing the workflow", async () => {
    await act(async () => {
      root.render(<TopicGenerator />);
    });

    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("自动化流程").click());

    expect(button("页面预览").disabled).toBe(false);

    await act(async () => button("页面预览").click());

    expect(container.textContent).toContain("从主题词到");
    expect(container.textContent).toContain("从这里开始");
    expect(button("页面预览").getAttribute("aria-current")).toBe("page");
  });

  it("keeps the topic-intent explanation entry while showing the current stage 02 contract", async () => {
    await act(async () => root.render(<TopicGenerator />));
    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("自动化流程").click());
    const details = [...container.querySelectorAll<HTMLDetailsElement>("details")]
      .find((candidate) => candidate.textContent?.includes("02理解主题并生成页面路由"))!;
    await act(async () => details.querySelector("summary")!.click());

    expect(details.textContent).toContain("CatalogSnapshot + ThemeIntent + LandingPageExecutionPlan");
    expect(details.textContent).toContain("不决定模块显隐、顺序或具体商品槽位");

    await act(async () => button("目录证据驱动的主题理解").click());
    const dialog = container.querySelector<HTMLDialogElement>(
      "dialog[aria-labelledby='intent-help-title']",
    )!;
    expect(dialog.open).toBe(true);
    expect(dialog.textContent).toContain("系统如何理解主题词与购物意图");
    expect(dialog.textContent).toContain("AI 仅辅助歧义解释");
    expect(dialog.textContent).toContain("默认 Workbench 不自动调用 TopicIntent Agent 或 Wikipedia");
    expect(dialog.textContent).toContain("精确分类只扩展该节点及其后代");
    expect(dialog.textContent).toContain("shopperAction");
    expect(dialog.textContent).toContain("resolved、ambiguous、needs-review");
    expect(dialog.textContent).toContain("Coffee");
    expect(dialog.textContent).toContain("阶段 02 不决定模块显隐、顺序或具体商品槽位");
  });

  it("keeps selection-only runs on the module preview without generated copy or scenes", async () => {
    const productTypes = [
      "Cleanser", "Cleanser", "Cleanser", "Cleanser",
      "Toner", "Toner", "Toner", "Toner",
      "Serum", "Serum", "Serum", "Serum",
    ];
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: buildYamiSearchUrl("ANUA"),
      fetchedAt: "2026-08-18T00:00:00.000Z",
      products: productTypes.map((type, index) => ({
        id: `anua-${index + 1}`,
        title: `ANUA ${type}`,
        brand: "ANUA",
        price: "$19.99",
        imageUrl: `https://cdn.yamibuy.net/item/anua-${index + 1}.webp`,
        productUrl: `https://www.yami.com/us/en/p/anua-${index + 1}`,
        sourceRank: index + 1,
      })),
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ plans: buildTopicPagePlanMatrix(snapshot, "selection") }),
    );

    await act(async () => root.render(<TopicGenerator />));
    const button = (label: string) => [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("选品").click());

    expect(button("页面预览").disabled).toBe(false);
    expect(button("页面预览").getAttribute("aria-current")).toBe("page");
    expect(button("商品池").getAttribute("aria-current")).toBeNull();
    expect(button("规则与 QA").disabled).toBe(true);
    const previewTabs = container.querySelector<HTMLElement>(
      '[role="tablist"][aria-label="页面预览方式"]',
    )!;
    const distributionTab = [...previewTabs.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === "商品分布")!;
    const pageTab = [...previewTabs.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === "页面预览")!;
    expect(distributionTab.getAttribute("aria-selected")).toBe("true");
    expect(pageTab.getAttribute("aria-selected")).toBe("false");
    expect(pageTab.disabled).toBe(true);
    const preview = container.querySelector('[data-preview-mode="selection"]');
    expect(preview).not.toBeNull();
    expect(preview?.textContent).toContain("文案与场景图未生成");
    expect(preview?.textContent).toContain("精选分类");
    const startHereThemes = preview?.querySelectorAll("[data-start-here-theme]");
    expect(startHereThemes).toHaveLength(3);
    expect(startHereThemes?.[0]?.textContent).toContain("洁面");
    expect(startHereThemes?.[1]?.textContent).toContain("爽肤水");
    expect(startHereThemes?.[2]?.textContent).toContain("精华与精粹");
    expect(
      [...startHereThemes ?? []].map((theme) => theme.querySelectorAll("a").length),
    ).toEqual([4, 4, 4]);
    expect(preview?.textContent).not.toContain("探索 ANUA");
    expect(preview?.querySelectorAll("img").length).toBeGreaterThan(0);
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      mode: "selection",
      strategy: "relevance",
    });
  });

  it("explains the five-Agent and seven-Skill architecture inside the workflow", async () => {
    await act(async () => {
      root.render(<TopicGenerator />);
    });

    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("自动化流程").click());
    const tablist = container.querySelector('[role="tablist"][aria-label="流程与架构"]');
    const agentsTab = button("Agent 与 Skills");

    expect(tablist).not.toBeNull();
    expect(agentsTab.getAttribute("aria-selected")).toBe("false");

    await act(async () => agentsTab.click());

    const agentsPanel = container.querySelector<HTMLDivElement>("#workflow-agents-panel");
    expect(agentsTab.getAttribute("aria-selected")).toBe("true");
    expect(agentsPanel?.hidden).toBe(false);
    expect(container.querySelector<HTMLDivElement>("#workflow-diagram-panel")?.hidden).toBe(true);
    expect(agentsPanel?.textContent).toContain("1 个薄编排 Agent + 4 个专业 Agent");
    expect(agentsPanel?.textContent).toContain("topic-page-orchestrator");
    expect(agentsPanel?.textContent).toContain("topic-strategy");
    expect(agentsPanel?.textContent).toContain("topic-content");
    expect(agentsPanel?.textContent).toContain("topic-visual");
    expect(agentsPanel?.textContent).toContain("topic-review");
    expect(agentsPanel?.textContent).toContain("page-orchestration");
    expect(agentsPanel?.textContent).toContain("page-review");
    expect(agentsPanel?.textContent).toContain("核心才是最终规则权威");

    const agentCards = [
      ...agentsPanel!.querySelectorAll<HTMLDetailsElement>("details"),
    ];
    expect(agentCards).toHaveLength(5);
    expect(agentCards.every((card) => !card.open)).toBe(true);

    await act(async () => agentCards[0].querySelector("summary")!.click());
    expect(agentCards[0].open).toBe(true);
    expect(agentCards.slice(1).every((card) => !card.open)).toBe(true);

    await act(async () => agentCards[1].querySelector("summary")!.click());
    expect(agentCards[0].open).toBe(true);
    expect(agentCards[1].open).toBe(true);

    const agentFlow = agentsPanel?.querySelector('[aria-label="Agent 执行关系"]');
    expect(agentFlow?.querySelectorAll("[data-agent-flow-node]")).toHaveLength(5);
    const parallelAgents = agentFlow?.querySelector('[data-agent-flow="parallel"]');
    expect(parallelAgents?.textContent).toContain("页面文案 Agent");
    expect(parallelAgents?.textContent).toContain("场景视觉 Agent");
    expect(agentFlow?.textContent).toContain("Proposal 汇合");
    expect(agentFlow?.textContent).toContain("确定性核心验证 · 自动 QA");
  });

  it("shows the selection rationale in the pool heading instead of every product card", async () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: buildYamiSearchUrl("ANUA"),
      fetchedAt: "2026-08-17T00:00:00.000Z",
      products: [1, 2, 3].map((rank) => ({
        id: `anua-${rank}`,
        title: `ANUA Product ${rank}`,
        brand: "ANUA",
        price: "$19.99",
        imageUrl: `https://cdn.yamibuy.net/item/anua-${rank}.webp`,
        productUrl: `https://www.yami.com/us/en/p/anua-${rank}`,
        sourceRank: rank,
      })),
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      plans: buildTopicPagePlanMatrix(snapshot),
    }), { status: 200, headers: { "content-type": "application/json" } }));

    await act(async () => {
      root.render(<TopicGenerator />);
    });

    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("生成页面").click());
    await act(async () => button("商品池").click());

    const primaryHeading = [...container.querySelectorAll("section > header")]
      .find((header) => header.textContent?.includes("主商品池"));

    expect(primaryHeading?.textContent).toContain("选品依据");
    expect(primaryHeading?.textContent).toContain("优先关键词和品牌匹配，并保留 Yami 搜索结果顺序。");
    expect(container.textContent).not.toContain("关键词直接命中 · Yami 排名 #1");
  });

  it("shows complete brand coverage in four seller and availability groups sorted by weekly sales", async () => {
    const product = (
      id: string,
      soldCount: number,
      sellerKind: "yami" | "third-party",
      availability: "in-stock" | "out-of-stock",
    ) => ({
      id,
      title: `Beauty Product ${id}`,
      brand: "Beauty of Joseon",
      price: "$19.99",
      imageUrl: `https://cdn.yamibuy.net/item/${id}.webp`,
      productUrl: `https://www.yami.com/us/en/p/${id}`,
      sourceRank: soldCount,
      brandId: 10757,
      soldCount,
      sellerKind,
      sellerName: sellerKind === "yami" ? "YAMI" : "Marketplace seller",
      availability,
      weeklySalesLabel: soldCount >= 100 ? "100+ Sold" : undefined,
    });
    const yamiHigh = product("yami-high", 120, "yami", "in-stock");
    const thirdHigh = product("third-high", 100, "third-party", "in-stock");
    const yamiOut = product("yami-out", 90, "yami", "out-of-stock");
    const yamiLow = product("yami-low", 10, "yami", "in-stock");
    const snapshot: YamiSearchSnapshot = {
      keyword: "Beauty of Joseon",
      site: "us",
      sourceUrl: buildYamiSearchUrl("Beauty of Joseon"),
      fetchedAt: "2026-08-19T00:00:00.000Z",
      provider: "yami-catalog-search",
      products: [yamiHigh, thirdHigh, yamiLow],
      catalogCoverage: {
        provider: "yami-brand-page",
        sourceUrl: "https://www.yami.com/us/en/b/beauty-of-joseon/10757",
        sort: "weekly-sales-descending",
        totalCount: 4,
        products: [yamiHigh, thirdHigh, yamiOut, yamiLow],
        groups: {
          yami: { inStock: 2, outOfStock: 1 },
          thirdParty: { inStock: 1, outOfStock: 0 },
        },
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      plans: buildTopicPagePlanMatrix(snapshot),
    }));

    await act(async () => root.render(<TopicGenerator />));
    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((candidate) => candidate.textContent === label)!;
    await act(async () => button("生成页面").click());
    await act(async () => button("商品池").click());

    expect(container.textContent).toContain("目录商品总览");
    const poolStats = container.querySelector('[aria-label="商品池统计"]')!;
    expect([...poolStats.children].map((item) => item.textContent)).toEqual([
      "目录商品4",
      "在售商品3",
      "缺货商品1",
      "排序方式周销量降序",
    ]);
    expect(container.querySelector('[aria-label="目录商品统计"]')).toBeNull();
    const groups = [...container.querySelectorAll<HTMLElement>("[data-catalog-coverage-group]")];
    expect(groups).toHaveLength(4);
    expect(groups[0]?.textContent).toContain("YAMI 自营 · 在售");
    expect(groups[1]?.textContent).toContain("YAMI 自营 · 缺货");
    expect(groups[2]?.textContent).toContain("第三方商家 · 在售");
    expect(groups[3]?.textContent).toContain("第三方商家 · 缺货");
    expect(
      [...groups[0]!.querySelectorAll("img")].map((image) => image.getAttribute("alt")),
    ).toEqual(["Beauty Product yami-high", "Beauty Product yami-low"]);
    const firstCatalogMeta = groups[0]!.querySelector<HTMLElement>("a > span:last-child")!;
    const firstCatalogMetaHeader = firstCatalogMeta.firstElementChild!;
    expect([...firstCatalogMetaHeader.children].map((item) => item.textContent)).toEqual([
      "Beauty of Joseon",
      "周销量 100+",
    ]);
    expect(firstCatalogMeta.children[1]?.textContent).toBe("Beauty Product yami-high");
    const yamiInStockProducts = groups[0]!.querySelector<HTMLElement>(
      "#catalog-coverage-yami-in-stock-products",
    )!;
    const collapseYamiInStock = groups[0]!.querySelector<HTMLButtonElement>(
      '[aria-label="收起 YAMI 自营 · 在售"]',
    )!;
    expect(collapseYamiInStock.getAttribute("aria-expanded")).toBe("true");
    await act(async () => collapseYamiInStock.click());
    expect(yamiInStockProducts.hidden).toBe(true);
    expect(collapseYamiInStock.textContent).toBe("展开");
    expect(groups[2]!.querySelector<HTMLElement>(
      "#catalog-coverage-third-party-in-stock-products",
    )!.hidden).toBe(false);
    expect(groups[1]?.textContent).toContain("仅作目录审计，不进入页面模块");
    const outOfStockCard = groups[1]!.querySelector("a")!;
    const imageWrap = outOfStockCard.querySelector("img")!.parentElement!;
    const imageBadges = imageWrap.lastElementChild!;
    expect(imageBadges.children[0]?.textContent).toBe("#90");
    expect(imageBadges.children[1]?.textContent).toBe("缺货");
    expect(outOfStockCard.lastElementChild?.textContent).not.toContain("缺货");
    expect(groups[0]?.textContent).not.toContain("累计销量");
    expect(groups[0]?.textContent).toContain("周销量 100+");

    await act(async () => button("页面预览").click());
    expect(container.querySelector('[aria-label="商品池统计"]')).toBeNull();
    expect(container.textContent).toContain("主商品池3");
    expect(container.textContent).toContain("相关商品池0");
    expect(container.textContent).toContain("显示模块");
    expect(container.textContent).toContain("图片模式");
  });

  it("presents category-role output as a module product pool without an empty related pool", async () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "Matcha",
      site: "us",
      sourceUrl: buildYamiSearchUrl("Matcha"),
      fetchedAt: "2026-08-18T00:00:00.000Z",
      products: [1, 2, 3].map((rank) => ({
        id: `matcha-${rank}`,
        title: `Matcha Product ${rank}`,
        brand: "Matcha Brand",
        price: "$19.99",
        imageUrl: `https://example.com/matcha-${rank}.webp`,
        productUrl: `https://example.com/matcha-${rank}`,
        sourceRank: rank,
      })),
    };
    const plans = buildTopicPagePlanMatrix(snapshot);
    plans.zh["category-role"] = {
      ...plans.zh.relevance,
      selectionStrategy: {
        id: "category-role",
        label: "分类角色",
        description: "按分类角色验证并分配到页面模块。",
      },
      pools: { primaryIds: plans.zh.relevance.pools.primaryIds, relatedIds: [] },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      plans,
      selectionRuns: { "category-role": { status: "ready" } },
    }));

    await act(async () => root.render(<TopicGenerator />));
    const strategyTrigger = container.querySelector<HTMLButtonElement>(
      '[data-slot="workbench-select-trigger"]',
    )!;
    await act(async () => strategyTrigger.click());
    const categoryRoleOption = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')]
      .find((option) => option.textContent === "分类角色")!;
    await act(async () => categoryRoleOption.click());
    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("生成页面").click());
    await act(async () => button("商品池").click());

    expect(container.textContent).toContain("模块商品池");
    expect(container.textContent).not.toContain("相关商品池");
    expect(container.textContent).not.toContain("仅作回退");
  });

  it("opens the generated prototype tab and passes the orchestrated page type to its renderer", async () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "Matcha",
      site: "us",
      sourceUrl: buildYamiSearchUrl("Matcha"),
      fetchedAt: "2026-08-18T00:00:00.000Z",
      products: [{
        id: "matcha-1",
        title: "Ceremonial Matcha",
        brand: "Matcha House",
        price: "$19.99",
        imageUrl: "https://example.com/matcha.webp",
        productUrl: "https://example.com/matcha",
        sourceRank: 1,
      }],
    };
    const plans = buildTopicPagePlanMatrix(snapshot);
    const stages = [
      "workflow-planning",
      "product-selection",
      "module-merchandising",
      "content-writing",
      "visual-generation",
      "asset-persistence",
      "page-generation",
      "automatic-qa",
      "experience-review",
    ].map((id) => ({ id, status: "completed" }));
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        plans,
        selectionRuns: { relevance: { status: "ready" } },
        automation: {
          schemaVersion: "topic-page-automation-run/v1",
          status: "ready",
          stage: "review-ready",
          stages,
          issues: [],
          executionPlan: {
            digest: `sha256:${"f".repeat(64)}`,
            pageTypeRef: "landing-page/topic@1",
            selectionStrategyRef: "relevance/default@1",
            templateRef: "topic-landing/relevance@1",
          },
          generationSpec: {
            schemaVersion: "topic-page-generation-spec/v1",
            status: "generation-ready",
            keyword: "Matcha",
            site: "us",
            language: "zh",
            strategyRef: "relevance/default@1",
            templateRef: "topic-landing/relevance@1",
            bindings: {},
            moduleOrder: ["hero"],
            modules: [{
              id: "hero",
              component: "ThemeHero",
              shoppingGoal: "Introduce matcha",
              reason: "Catalog evidence",
              copy: {
                title: { text: "真实生成的抹茶主题", evidenceRefs: ["product:matcha-1"] },
                description: { text: "由 Content Agent 生成。", evidenceRefs: ["product:matcha-1"] },
                tags: [
                  { text: "抹茶", evidenceRefs: ["product:matcha-1"] },
                  { text: "精选", evidenceRefs: ["product:matcha-1"] },
                ],
              },
              products: [{ ...plans.zh.relevance.products[0], pool: "primary", role: "core" }],
              scenes: [],
              assets: [{
                taskId: "asset-hero",
                kind: "hero-image",
                ref: "assets/hero.png",
                url: "/api/topic-generator/assets?ref=assets%2Fhero.png",
                mimeType: "image/png",
                width: 1600,
                height: 900,
                digest: `sha256:${"a".repeat(64)}`,
                focalPoint: { x: 0.5, y: 0.5 },
                backgroundColor: "#dfe3d4",
                altText: { language: "zh", text: "抹茶主题场景", evidenceRefs: ["product:matcha-1"] },
              }],
            }],
            digest: `sha256:${"b".repeat(64)}`,
          },
          qaReport: {
            schemaVersion: "topic-page-qa-report/v1",
            status: "passed",
            generationSpecDigest: `sha256:${"b".repeat(64)}`,
            topicPageAssetManifestDigest: `sha256:${"c".repeat(64)}`,
            checks: [{ id: "assets", status: "passed", issueCount: 0 }],
            issues: [],
            digest: `sha256:${"d".repeat(64)}`,
          },
          experienceReview: {
            status: "review-recommended",
            recommendation: "recommend-approval",
            digest: `sha256:${"1".repeat(64)}`,
          },
          reviewPackage: {
            status: "review-ready",
            digest: `sha256:${"e".repeat(64)}`,
          },
        },
      }),
    );

    function PagePreviewRenderer({
      pageTypeRef,
      generationSpec,
    }: TopicPagePreviewRendererProps) {
      return (
        <div data-testid="prototype-preview" data-page-type-ref={pageTypeRef}>
          <h1>{generationSpec.modules[0]?.copy.title.text}</h1>
          <img src={generationSpec.modules[0]?.assets[0]?.url} alt="" />
        </div>
      );
    }

    await act(async () => root.render(
      <TopicGenerator PagePreviewRenderer={PagePreviewRenderer} />,
    ));
    const button = (label: string) => [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === label)!;
    await act(async () => button("生成页面").click());

    expect(container.textContent).toContain("真实生成的抹茶主题");
    expect(container.querySelector<HTMLImageElement>(
      'img[src="/api/topic-generator/assets?ref=assets%2Fhero.png"]',
    )).not.toBeNull();
    const previewTabs = container.querySelector<HTMLElement>(
      '[role="tablist"][aria-label="页面预览方式"]',
    )!;
    const distributionTab = [...previewTabs.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === "商品分布")!;
    const pageTab = [...previewTabs.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === "页面预览")!;
    expect(distributionTab.getAttribute("aria-selected")).toBe("false");
    expect(pageTab.getAttribute("aria-selected")).toBe("true");
    expect(pageTab.disabled).toBe(false);
    expect(container.querySelector('[data-testid="prototype-preview"]')?.getAttribute(
      "data-page-type-ref",
    )).toBe("landing-page/topic@1");

    await act(async () => distributionTab.click());
    expect(distributionTab.getAttribute("aria-selected")).toBe("true");
    const distributionPreview = container.querySelector('[data-preview-mode="page"]');
    expect(distributionPreview).not.toBeNull();
    expect(distributionPreview?.textContent).toContain("HERO · 商品分布");
    expect(distributionPreview?.textContent).toContain(
      "已分配 1 件商品；此处仅展示模块与商品分配。",
    );
    expect(distributionPreview?.textContent).not.toContain("探索 Matcha");
    expect(distributionPreview?.textContent).not.toContain("真实生成的抹茶主题");

    await act(async () => pageTab.click());
    expect(container.querySelector('[data-testid="prototype-preview"]')).not.toBeNull();
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      language: "zh",
      strategy: "relevance",
    });

    await act(async () => button("规则与 QA").click());
    expect(container.textContent).toContain("真实自动 QA");
    expect(container.textContent).toContain("assets · passed · 0");

    await act(async () => button("自动化流程").click());
    expect(container.textContent).toContain("等待用户 Review");
    expect(container.textContent).toContain("图片本体落盘");
  });

  it("generates a missing preview locale once and reuses the cached result", async () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: buildYamiSearchUrl("ANUA"),
      fetchedAt: "2026-08-18T00:00:00.000Z",
      products: [{
        id: "anua-1",
        title: "ANUA Heartleaf Serum",
        brand: "ANUA",
        price: "$19.99",
        imageUrl: "https://example.com/anua.webp",
        productUrl: "https://example.com/anua",
        sourceRank: 1,
      }],
    };
    const plans = buildTopicPagePlanMatrix(snapshot);
    const readyAutomation = (language: "en" | "zh", title: string) => ({
      schemaVersion: "topic-page-automation-run/v1",
      status: "ready",
      stage: "review-ready",
      stages: [],
      issues: [],
      executionPlan: {
        digest: `sha256:${"f".repeat(64)}`,
        pageTypeRef: "landing-page/brand@1",
        selectionStrategyRef: "relevance/default@1",
        templateRef: "topic-landing/brand@1",
      },
      generationSpec: {
        schemaVersion: "topic-page-generation-spec/v1",
        status: "generation-ready",
        keyword: "ANUA",
        site: "us",
        language,
        strategyRef: "relevance/default@1",
        templateRef: "topic-landing/brand@1",
        bindings: {
          themeIntentDigest: `sha256:${"1".repeat(64)}`,
          productSelectionDigest: `sha256:${"2".repeat(64)}`,
          topicPagePlanDigest: `sha256:${"3".repeat(64)}`,
          topicPageContentSpecDigest: `sha256:${(language === "zh" ? "4" : "5").repeat(64)}`,
          topicPageAssetManifestDigest: `sha256:${(language === "zh" ? "6" : "7").repeat(64)}`,
        },
        moduleOrder: ["hero"],
        modules: [{
          id: "hero",
          component: "ThemeHero",
          shoppingGoal: "Introduce ANUA",
          reason: "Catalog evidence",
          copy: {
            title: { text: title, evidenceRefs: ["product:anua-1"] },
            description: { text: title, evidenceRefs: ["product:anua-1"] },
            tags: [],
          },
          products: [],
          scenes: [],
          assets: [],
        }],
        digest: `sha256:${(language === "zh" ? "a" : "b").repeat(64)}`,
      },
    });
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({
        plans,
        automation: readyAutomation("zh", "ANUA 护肤选购指南"),
      }))
      .mockResolvedValueOnce(Response.json({
        plans,
        automation: readyAutomation("en", "A practical ANUA beauty edit"),
      }));

    function LocalizedPreview({ generationSpec }: TopicPagePreviewRendererProps) {
      return (
        <div data-testid="localized-preview" lang={generationSpec.language}>
          {generationSpec.modules[0]?.copy.title.text}
        </div>
      );
    }

    await act(async () => root.render(
      <TopicGenerator PagePreviewRenderer={LocalizedPreview} />,
    ));
    const button = (label: string) => [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("生成页面").click());
    expect(container.querySelector('[data-testid="localized-preview"]')?.textContent)
      .toBe("ANUA 护肤选购指南");

    await act(async () => {
      container.querySelector<HTMLInputElement>('input[value="en"]')!.click();
      await Promise.resolve();
    });

    const localizedPreview = container.querySelector('[data-testid="localized-preview"]');
    expect(localizedPreview?.getAttribute("lang")).toBe("en");
    expect(localizedPreview?.textContent).toBe("A practical ANUA beauty edit");
    expect(container.textContent).not.toContain("ANUA 护肤选购指南");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
      mode: "page",
      language: "en",
    });

    await act(async () => {
      container.querySelector<HTMLInputElement>('input[value="zh"]')!.click();
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="localized-preview"]')?.getAttribute("lang"))
      .toBe("zh");
    expect(container.querySelector('[data-testid="localized-preview"]')?.textContent)
      .toBe("ANUA 护肤选购指南");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shows the explicit taxonomy blocker for the category-role strategy", async () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: buildYamiSearchUrl("ANUA"),
      fetchedAt: "2026-08-18T00:00:00.000Z",
      products: [1, 2, 3].map((rank) => ({
        id: `anua-${rank}`,
        title: `ANUA Product ${rank}`,
        brand: "ANUA",
        price: "$19.99",
        imageUrl: `https://cdn.yamibuy.net/item/anua-${rank}.webp`,
        productUrl: `https://www.yami.com/us/en/p/anua-${rank}`,
        sourceRank: rank,
      })),
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      plans: buildTopicPagePlanMatrix(snapshot),
      selectionRuns: {
        "category-role": {
          schemaVersion: "product-selection-run/v1",
          status: "blocked",
          strategyRef: "category-role/landing-page-agent@1",
          issues: ["CategoryRole selection requires a CatalogTaxonomySnapshot."],
        },
      },
    }), { status: 200, headers: { "content-type": "application/json" } }));

    await act(async () => {
      root.render(<TopicGenerator />);
    });

    const strategyTrigger = container.querySelector<HTMLButtonElement>(
      '[data-slot="workbench-select-trigger"]',
    )!;
    await act(async () => strategyTrigger.click());
    const categoryRoleOption = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')]
      .find((option) => option.textContent === "分类角色")!;
    await act(async () => categoryRoleOption.click());

    const generateButton = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "生成页面")!;
    await act(async () => generateButton.click());

    const request = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body))).toMatchObject({ strategy: "category-role" });
    expect(container.textContent).toContain("生成已阻止");
    expect(container.textContent).toContain(
      "CategoryRole selection requires a CatalogTaxonomySnapshot.",
    );
    expect(container.textContent).not.toContain("由当前商品快照推断");
  });

  it("shows automatic category-role runtime evidence in the workflow", async () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "Matcha",
      site: "us",
      sourceUrl: buildYamiSearchUrl("Matcha"),
      fetchedAt: "2026-08-18T00:00:00.000Z",
      products: [1, 2, 3].map((rank) => ({
        id: `matcha-${rank}`,
        title: `Matcha Product ${rank}`,
        brand: "Matcha Brand",
        price: "$19.99",
        imageUrl: `https://cdn.yamibuy.net/item/matcha-${rank}.webp`,
        productUrl: `https://www.yami.com/us/en/p/matcha-${rank}`,
        sourceRank: rank,
      })),
    };
    const plans = buildTopicPagePlanMatrix(snapshot);
    plans.zh["category-role"] = {
      ...plans.zh.relevance,
      selectionStrategy: {
        id: "category-role",
        label: "分类角色",
        description: "Agent 分类提案经确定性规则验证。",
      },
    };
    plans.en["category-role"] = {
      ...plans.en.relevance,
      selectionStrategy: {
        id: "category-role",
        label: "Category roles",
        description: "Agent category proposals validated by deterministic rules.",
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      plans,
      selectionRuns: { "category-role": { status: "ready" } },
      runtime: {
        categoryRole: {
          mode: "automatic",
          taxonomy: {
            status: "ready",
            sourceRef: "categories.tsv",
            digest: "sha256:taxonomy",
            categoryCount: 727,
          },
          agent: { status: "ready", id: "topic-product-agent" },
          stages: [
            { id: "taxonomy", status: "completed" },
            { id: "category-proposal", status: "completed" },
            { id: "candidate-retrieval", status: "completed" },
            { id: "scene-proposal", status: "completed" },
            { id: "selection", status: "completed" },
          ],
          candidateAttempts: { succeeded: 11, total: 11 },
          candidateQuality: {
            status: "warning",
            issueCount: 1,
            emptyCategories: 0,
            lowCoverageCategories: 1,
            warnings: ["Category 1643 has 2 products; expected at least 3."],
          },
          categoryRoleDistribution: { core: 5, pairing: 3, accessory: 2 },
          sceneCount: 4,
          issues: [],
        },
      },
    }), { status: 200, headers: { "content-type": "application/json" } }));

    await act(async () => root.render(<TopicGenerator />));
    const strategyTrigger = container.querySelector<HTMLButtonElement>(
      '[data-slot="workbench-select-trigger"]',
    )!;
    await act(async () => strategyTrigger.click());
    const categoryRoleOption = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')]
      .find((option) => option.textContent === "分类角色")!;
    await act(async () => categoryRoleOption.click());
    const generateButton = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "生成页面")!;
    await act(async () => generateButton.click());
    const workflowButton = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "自动化流程")!;
    await act(async () => workflowButton.click());

    expect(container.textContent).toContain("本次分类角色运行");
    expect(container.textContent).toContain("topic-product-agent");
    expect(container.textContent).toContain("727 个分类");
    expect(container.textContent).toContain("11 / 11");
    expect(container.textContent).toContain("5 : 3 : 2");
    expect(container.textContent).toContain("候选质量：需复核");
    expect(container.textContent).toContain("Category 1643 has 2 products");
  });

  it("keeps category-role generation automatic without exposing handoff controls", async () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "Matcha",
      site: "us",
      sourceUrl: buildYamiSearchUrl("Matcha"),
      fetchedAt: "2026-08-18T00:00:00.000Z",
      products: [1, 2, 3].map((rank) => ({
        id: `matcha-${rank}`,
        title: `Matcha Product ${rank}`,
        brand: "Matcha Brand",
        price: "$19.99",
        imageUrl: `https://example.com/matcha-${rank}.webp`,
        productUrl: `https://example.com/matcha-${rank}`,
        sourceRank: rank,
      })),
    };
    const readyPlans = buildTopicPagePlanMatrix(snapshot);
    readyPlans.en["category-role"] = {
      ...readyPlans.en.relevance,
      selectionStrategy: {
        id: "category-role",
        label: "Category roles",
        description: "Validated interactive handoff.",
      },
    };
    readyPlans.zh["category-role"] = {
      ...readyPlans.zh.relevance,
      selectionStrategy: {
        id: "category-role",
        label: "分类角色",
        description: "已验证交互式交接。",
      },
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({
        plans: readyPlans,
        selectionRuns: {
          "category-role": {
            schemaVersion: "product-selection-run/v1",
            status: "ready",
            result: { keyword: "Matcha" },
          },
        },
      }), { status: 200, headers: { "content-type": "application/json" } }),
    );

    await act(async () => root.render(<TopicGenerator />));
    const strategyTrigger = container.querySelector<HTMLButtonElement>(
      '[data-slot="workbench-select-trigger"]',
    )!;
    await act(async () => strategyTrigger.click());
    const categoryRoleOption = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')]
      .find((option) => option.textContent === "分类角色")!;
    await act(async () => categoryRoleOption.click());
    expect(container.querySelector('[data-slot="advanced-agent-settings"]')).toBeNull();
    expect(container.querySelector('input[value="interactive"]')).toBeNull();
    expect(container.textContent).not.toContain("Codex/Kiro");
    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((candidate) => candidate.textContent === label)!;
    await act(async () => button("生成页面").click());
    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(requestBody).toMatchObject({ strategy: "category-role" });
    expect(requestBody).not.toHaveProperty("agentMode");
    expect(container.textContent).toContain("US · ZH-CN · 分类角色 · 需复核");
  });
});
