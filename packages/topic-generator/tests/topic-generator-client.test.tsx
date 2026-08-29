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

  async function enterTopic(value = "ANUA") {
    const topicInput = container.querySelector<HTMLInputElement>("input[minlength='2']")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
        topicInput,
        value,
      );
      topicInput.dispatchEvent(new Event("input", { bubbles: true }));
    });
  }

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("starts with an empty topic input", async () => {
    await act(async () => {
      root.render(<TopicGenerator />);
    });

    const topicInput = container.querySelector<HTMLInputElement>("input[minlength='2']");
    expect(topicInput?.value).toBe("");
    expect(topicInput?.placeholder).toBe("例如 ANUA、ramen");
  });

  it("returns to the empty page preview after viewing the workflow", async () => {
    await act(async () => {
      root.render(<TopicGenerator />);
    });
    await enterTopic();

    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("自动化流程").click());

    expect(button("页面预览").disabled).toBe(false);
    expect(container.textContent).not.toContain("阶段门控、局部回退");
    expect(container.textContent).not.toContain("下方流程状态来自本次真实运行");

    await act(async () => button("页面预览").click());

    expect(container.textContent).toContain("从主题词到");
    expect(container.textContent).toContain("从这里开始");
    expect(button("页面预览").getAttribute("aria-selected")).toBe("true");
  });

  it("keeps the agent architecture introduction focused without duplicate metrics", async () => {
    await act(async () => {
      root.render(<TopicGenerator />);
    });
    await enterTopic();

    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("自动化流程").click());
    await act(async () => button("Agent 与 Skills").click());

    const panel = container.querySelector("#workflow-agents-panel")!;
    expect(panel.textContent).toContain("1 个薄编排 Agent + 6 个执行与审核 Agent");
    expect(panel.querySelector(":scope > section:first-child > dl")).toBeNull();
    expect(panel.textContent).not.toContain("核心才是最终规则权威");
    expect(panel.textContent).not.toContain("ExecutionPlan → ProductSelectionResult");
    expect(panel.querySelector(":scope > aside")).toBeNull();
  });

  it("returns to the selection loading preview after viewing the workflow", async () => {
    let resolveRequest!: (response: Response) => void;
    vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise((resolve) => {
      resolveRequest = resolve;
    }));
    await act(async () => {
      root.render(<TopicGenerator />);
    });
    await enterTopic();
    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("选品").click());
    await act(async () => button("自动化流程").click());

    expect(button("页面预览").disabled).toBe(false);
    await act(async () => button("页面预览").click());
    expect(button("页面预览").getAttribute("aria-selected")).toBe("true");
    expect(container.textContent).toContain("正在为“ANUA”选品");

    await act(async () => {
      resolveRequest(Response.json({ plans: null }));
      await Promise.resolve();
    });
  });

  it("keeps Generate page as the primary full-flow action and gates capability actions", async () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: buildYamiSearchUrl("ANUA"),
      fetchedAt: "2026-08-21T00:00:00.000Z",
      products: [1, 2, 3].map((rank) => ({
        id: `anua-${rank}`,
        title: `ANUA Product ${rank}`,
        brand: "ANUA",
        price: "$19.99",
        imageUrl: `https://example.com/${rank}.webp`,
        productUrl: `https://example.com/${rank}`,
        sourceRank: rank,
      })),
    };
    const plans = buildTopicPagePlanMatrix(snapshot, "selection");
    const contentSpec = {
      schemaVersion: "topic-page-content-spec/v1",
      status: "content-ready",
      keyword: "ANUA",
      site: "us",
      language: "zh",
      strategyRef: "relevance/intent-themes@5",
      templateRef: "topic-landing/brand@2",
      topicPagePlanDigest: "sha256:plan",
      themeIntentDigest: "sha256:intent",
      productSelectionDigest: "sha256:selection",
      tasks: [],
      digest: "sha256:content",
    } as const;
    const contentReview = { verdict: "approved" } as const;
    const initialBackgroundEvidence = {
      language: "zh",
      digest: "sha256:selection-background",
    } as const;
    const contentBackgroundEvidence = {
      language: "zh",
      digest: "sha256:content-background",
    } as const;
    const generationSpec = {
      schemaVersion: "topic-page-generation-spec/v1",
      status: "generation-ready",
      modules: [],
      digest: "sha256:generation",
    } as const;
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({
        plans,
        pagePreview: { pageTypeRef: "landing-page/brand@2" },
        capabilityArtifacts: {
          intent: {},
          selection: {},
          plan: {},
          pageTypeRef: "landing-page/brand@2",
          backgroundEvidence: initialBackgroundEvidence,
        },
      }))
      .mockResolvedValueOnce(Response.json({
        capability: "content",
        contentSpec,
        contentReview,
        backgroundEvidence: contentBackgroundEvidence,
      }))
      .mockResolvedValueOnce(Response.json({
        capability: "visual",
        contentSpec,
        contentReview,
        backgroundEvidence: contentBackgroundEvidence,
        generationSpec,
      }));

    function CapabilityPreview(props: TopicPagePreviewRendererProps) {
      return <div data-preview-capability={props.mode} />;
    }

    await act(async () => root.render(
      <TopicGenerator PagePreviewRenderer={CapabilityPreview} />,
    ));
    await enterTopic();
    const button = (label: string) => [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === label)!;

    expect(button("生成页面").type).toBe("submit");
    expect(button("选品").type).toBe("button");
    expect(button("生成文案").disabled).toBe(true);
    expect(button("生成图片").disabled).toBe(true);

    await act(async () => button("选品").click());
    expect(button("生成文案").disabled).toBe(false);
    expect(button("生成图片").disabled).toBe(true);

    await act(async () => button("生成文案").click());
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toMatchObject({
      mode: "content",
      artifacts: { pageTypeRef: "landing-page/brand@2" },
    });
    expect(button("生成图片").disabled).toBe(false);
    expect(container.querySelector("[data-preview-capability='content']")).not.toBeNull();
    expect(container.textContent).toContain("文案审核");
    expect(container.textContent).toContain("已通过");

    await act(async () => button("生成图片").click());
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toMatchObject({
      mode: "visual",
      contentSpec: { digest: "sha256:content" },
      contentReview: { verdict: "approved" },
      artifacts: {
        backgroundEvidence: { digest: "sha256:content-background" },
      },
    });
    expect(container.querySelector("[data-preview-capability='visual']")).not.toBeNull();
  });

  it("labels an exhausted content optimization as a copy failure instead of a Yami search failure", async () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: buildYamiSearchUrl("ANUA"),
      fetchedAt: "2026-08-21T00:00:00.000Z",
      products: [1, 2, 3].map((rank) => ({
        id: `anua-${rank}`,
        title: `ANUA Product ${rank}`,
        brand: "ANUA",
        price: "$19.99",
        imageUrl: `https://example.com/${rank}.webp`,
        productUrl: `https://example.com/${rank}`,
        sourceRank: rank,
      })),
    };
    const plans = buildTopicPagePlanMatrix(snapshot, "selection");
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({
        plans,
        pagePreview: { pageTypeRef: "landing-page/brand@2" },
        capabilityArtifacts: {
          intent: {},
          selection: {},
          plan: {},
          pageTypeRef: "landing-page/brand@2",
        },
      }))
      .mockResolvedValueOnce(Response.json({
        error: {
          code: "content_optimization_blocked",
          message: "Hero copy still does not orient a first-time shopper.",
        },
      }, { status: 422 }));

    await act(async () => root.render(<TopicGenerator />));
    await enterTopic();
    const button = (label: string) => [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("选品").click());
    await act(async () => button("生成文案").click());

    expect(container.textContent).toContain("文案优化未完成");
    expect(container.textContent).toContain("文案优化未能完成。");
    expect(container.textContent).not.toContain("Yami 搜索结果无法转换为页面方案。");
  });

  it("keeps the topic-intent explanation entry while showing the current stage 02 contract", async () => {
    await act(async () => root.render(<TopicGenerator />));
    await enterTopic();
    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("自动化流程").click());
    const details = [...container.querySelectorAll<HTMLDetailsElement>("details")]
      .find((candidate) => candidate.textContent?.includes("02理解主题并生成页面路由"))!;
    await act(async () => details.querySelector("summary")!.click());

    expect(details.textContent).toContain(
      "CatalogSnapshot + ThemeIntent + BackgroundEvidence + LandingPageExecutionPlan",
    );
    expect(details.textContent).toContain("不决定模块显隐、顺序或具体商品槽位");

    await act(async () => button("目录证据驱动的主题理解").click());
    const dialog = container.querySelector<HTMLDialogElement>(
      "dialog[aria-labelledby='intent-help-title']",
    )!;
    expect(dialog.open).toBe(true);
    expect(dialog.textContent).toContain("系统如何理解主题词与购物意图");
    expect(dialog.textContent).toContain("目录事实与 Agent 语义建议分开处理");
    expect(dialog.textContent).toContain("Agent 缺失、失败或提案越权时回退到已验证目录分类");
    expect(dialog.textContent).toContain("Wikipedia 不参与商品归属判断");
    expect(dialog.textContent).toContain("精确分类只扩展该节点及其后代");
    expect(dialog.textContent).toContain("shopperAction");
    expect(dialog.textContent).toContain("resolved、ambiguous、needs-review");
    expect(dialog.textContent).toContain("Coffee");
    expect(dialog.textContent).toContain("阶段 02 不决定模块显隐、顺序或具体商品槽位");
  });

  it("keeps product distribution selected after selection updates the page preview", async () => {
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
    const plans = buildTopicPagePlanMatrix(snapshot, "selection");
    expect(plans.zh.relevance.modules.find(({ id }) => id === "shortcuts")?.reason)
      .toBe("按全部可识别商品类型生成 3 个分类入口；每个入口使用一件代表商品。");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      plans,
      pagePreview: { pageTypeRef: "landing-page/brand@2" },
    }));

    function FinalPagePreview(props: TopicPagePreviewRendererProps) {
      if (props.mode !== "selection") return null;
      return (
        <div data-testid="final-selection-page" data-page-type-ref={props.pageTypeRef}>
          {props.plan.modules.filter(({ visible }) => visible).map((module) => (
            <section key={module.id} data-final-page-module={module.id}>
              {module.productIds.map((productId) => (
                <span key={productId} data-final-page-product={productId} />
              ))}
            </section>
          ))}
        </div>
      );
    }

    await act(async () => root.render(
      <TopicGenerator PagePreviewRenderer={FinalPagePreview} />,
    ));
    await enterTopic();
    const button = (label: string) => [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("选品").click());

    expect(button("页面预览").disabled).toBe(false);
    expect(button("页面预览").getAttribute("aria-selected")).toBe("true");
    expect(button("商品池").getAttribute("aria-selected")).toBe("false");
    expect(button("规则与 QA").getAttribute("aria-disabled")).toBe("true");
    const resultTabs = container.querySelector<HTMLElement>(
      '[role="tablist"][aria-label="生成结果视图"]',
    )!;
    expect(resultTabs.dataset.slot).toBe("workbench-tab-list");
    const previewTabs = container.querySelector<HTMLElement>(
      '[role="tablist"][aria-label="页面预览方式"]',
    )!;
    expect(previewTabs.dataset.slot).toBe("workbench-tab-list");
    const distributionTab = [...previewTabs.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === "商品分布")!;
    const pageTab = [...previewTabs.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === "页面预览")!;
    expect(distributionTab.getAttribute("aria-selected")).toBe("true");
    expect(pageTab.getAttribute("aria-selected")).toBe("false");
    expect(pageTab.disabled).toBe(false);
    const preview = container.querySelector('[data-preview-mode="selection"]');
    expect(preview).not.toBeNull();
    expect(preview?.querySelector(
      '[role="tablist"][aria-label="热门精选分类"]',
    )?.getAttribute("data-slot")).toBe("workbench-tab-list");
    expect(preview?.querySelector(
      '[role="tablist"][aria-label="综合推荐分类"]',
    )?.getAttribute("data-slot")).toBe("workbench-tab-list");
    expect(preview?.textContent).toContain("文案与场景图未生成");
    expect(preview?.textContent).toContain("按品类浏览 ANUA");
    expect(preview?.textContent).toContain("按选购场景开始浏览");
    expect(preview?.textContent).toContain("ANUA 精选商品");
    expect(preview?.textContent).toContain("继续浏览 ANUA 商品");
    expect(preview?.textContent).toContain(
      "3 个分类入口已按主题语义与商品归属生成；代表商品等待 Page Merchandising Agent 复核",
    );
    const startHereThemes = preview?.querySelectorAll("[data-start-here-theme]");
    expect(startHereThemes).toHaveLength(3);
    expect(startHereThemes?.[0]?.textContent).toContain("洁面");
    expect(startHereThemes?.[1]?.textContent).toContain("爽肤水");
    expect(startHereThemes?.[2]?.textContent).toContain("精华与精粹");
    expect(
      [...startHereThemes ?? []].map((theme) => theme.querySelectorAll("a").length),
    ).toEqual([4, 4, 4]);
    const firstTheme = startHereThemes?.[0] as HTMLElement;
    const firstThemeToggle = firstTheme.querySelector<HTMLButtonElement>(
      'button[aria-controls="start-here-products-1"]',
    )!;
    const firstThemeProducts = firstTheme.querySelector<HTMLElement>(
      '[data-start-here-products]',
    )!;
    expect(firstThemeToggle.textContent).toBe("收起商品");
    expect(firstThemeToggle.getAttribute("aria-expanded")).toBe("true");
    expect(firstThemeProducts.hidden).toBe(false);

    await act(async () => firstThemeToggle.click());

    expect(firstThemeToggle.textContent).toBe("展开商品");
    expect(firstThemeToggle.getAttribute("aria-expanded")).toBe("false");
    expect(firstThemeProducts.hidden).toBe(true);
    expect(startHereThemes?.[1]?.querySelector<HTMLElement>("[data-start-here-products]")?.hidden)
      .toBe(false);
    expect(preview?.textContent).not.toContain("探索 ANUA");
    expect(preview?.querySelectorAll("img").length).toBeGreaterThan(0);

    await act(async () => pageTab.click());
    expect(pageTab.getAttribute("aria-selected")).toBe("true");
    const pagePreview = container.querySelector<HTMLElement>('[data-testid="final-selection-page"]')!;
    expect(pagePreview.dataset.pageTypeRef).toBe("landing-page/brand@2");
    const distributionModuleIds = [...plans.zh.relevance.modules]
      .filter(({ visible }) => visible)
      .map(({ id }) => id);
    expect(
      [...pagePreview.querySelectorAll<HTMLElement>("[data-final-page-module]")]
        .map((module) => module.dataset.finalPageModule),
    ).toEqual(distributionModuleIds);
    for (const module of plans.zh.relevance.modules.filter(({ visible }) => visible)) {
      const previewModule = pagePreview.querySelector<HTMLElement>(
        `[data-final-page-module="${module.id}"]`,
      )!;
      expect(
        [...previewModule.querySelectorAll<HTMLElement>("[data-final-page-product]")]
          .map((product) => product.dataset.finalPageProduct),
      ).toEqual(module.productIds);
    }
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))).toMatchObject({
      mode: "selection",
      strategy: "relevance",
    });
  });

  it("shows Popular Picks as All plus eligible Shortcut tabs sorted by weekly sales", async () => {
    const groupProducts = (
      prefix: string,
      count: number,
      categoryL3Name: string,
      weeklySalesStart: number,
      sourceRankStart: number,
    ) => Array.from({ length: count }, (_, index) => ({
      id: `${prefix}-${index + 1}`,
      title: `ANUA ${prefix} ${index + 1}`,
      brand: "ANUA",
      price: "$19.99",
      imageUrl: `https://cdn.yamibuy.net/item/${prefix}-${index + 1}.webp`,
      productUrl: `https://www.yami.com/us/en/p/${prefix}-${index + 1}`,
      sourceRank: sourceRankStart + index,
      categoryL3Name,
      weeklySalesLabel: `${weeklySalesStart - index * 10}+ Sold`,
    }));
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: buildYamiSearchUrl("ANUA"),
      fetchedAt: "2026-08-20T00:00:00.000Z",
      products: [
        ...groupProducts("serum", 9, "Serums & Essences", 300, 1),
        ...groupProducts("mask", 7, "Sheet Masks", 700, 10),
        ...groupProducts("sun", 5, "Sun Care", 1000, 17),
      ],
    };
    const plans = buildTopicPagePlanMatrix(snapshot, "selection");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ plans }));

    await act(async () => root.render(<TopicGenerator />));
    await enterTopic();
    const select = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === "选品")!;
    await act(async () => select.click());

    const tabs = [...container.querySelectorAll<HTMLButtonElement>(
      '#popular-picks [role="tab"]',
    )];
    expect(tabs.map(({ textContent }) => textContent)).toEqual([
      "全部12 件",
      "精华与精粹9 件",
      "片状面膜7 件",
    ]);
    expect(tabs.some(({ textContent }) => textContent?.includes("防晒护理"))).toBe(false);

    await act(async () => tabs[1]!.click());

    expect(tabs[1]?.getAttribute("aria-selected")).toBe("true");
    const activePanel = container.querySelector<HTMLElement>(
      '#popular-picks [role="tabpanel"]:not([hidden])',
    )!;
    expect([...activePanel.querySelectorAll("a strong")].slice(0, 3).map(({ textContent }) =>
      textContent
    )).toEqual(["ANUA serum 1", "ANUA serum 2", "ANUA serum 3"]);
  });

  it("presents an Agent-reviewed Hero as the completed selection result", async () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: buildYamiSearchUrl("ANUA"),
      fetchedAt: "2026-08-20T00:00:00.000Z",
      products: [1, 2, 3, 4].map((rank) => ({
        id: `anua-${rank}`,
        title: `ANUA Product ${rank}`,
        brand: "ANUA",
        price: "$19.99",
        imageUrl: `https://cdn.yamibuy.net/item/anua-${rank}.webp`,
        productUrl: `https://www.yami.com/us/en/p/anua-${rank}`,
        sourceRank: rank,
      })),
    };
    const plans = buildTopicPagePlanMatrix(snapshot, "selection");
    const hero = plans.zh.relevance.modules.find(({ id }) => id === "hero")!;
    hero.productIds = ["anua-1", "anua-3", "anua-4"];
    hero.reason = "Agent selected a representative three-product ANUA composition.";
    hero.productReasons = {
      "anua-1": "Strong catalog anchor",
      "anua-3": "Adds treatment coverage",
      "anua-4": "Adds hydration coverage",
    };
    const shortcuts = plans.zh.relevance.modules.find(({ id }) => id === "shortcuts")!;
    shortcuts.visible = true;
    shortcuts.productIds = ["anua-1", "anua-3"];
    shortcuts.groups = [
      {
        id: "group-cleansing",
        label: "基础清洁",
        role: "core",
        productIds: ["anua-1", "anua-2", "anua-3"],
        sourceCategoryIds: ["101", "102"],
        classificationReason: "帮助用户找到日常洁面商品。",
      },
      {
        id: "group-care",
        label: "集中护理",
        role: "pairing",
        productIds: ["anua-4"],
        sourceCategoryIds: ["102"],
        classificationReason: "帮助用户找到针对性护理商品。",
      },
    ];
    const startHere = plans.zh.relevance.modules.find(({ id }) => id === "start-here")!;
    startHere.visible = true;
    startHere.productIds = ["anua-1", "anua-2", "anua-3", "anua-4"];
    startHere.groups = [
      {
        id: "source-routine",
        label: "日常护理",
        role: "core",
        productIds: ["anua-1", "anua-2"],
        shoppingGoal: "完成清洁和补水步骤。",
        scenarioReason: "两个目录分类支持基础流程。",
        semanticSource: "agent-proposal",
      },
      {
        id: "source-treatment",
        label: "集中护理",
        role: "core",
        productIds: ["anua-3", "anua-4"],
        shoppingGoal: "搭配针对性护理商品。",
        scenarioReason: "护理商品形成独立目标。",
        semanticSource: "agent-proposal",
      },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      plans,
      selectionRuns: { relevance: { status: "ready" } },
      heroSelection: {
        schemaVersion: "hero-selection-run/v1",
        status: "ready",
        source: "page-merchandising-agent",
        agentId: "topic-strategy",
        templateRef: "topic-landing/brand-relevance@1",
        planDigest: `sha256:${"a".repeat(64)}`,
        productIds: ["anua-1", "anua-3", "anua-4"],
        productReasons: hero.productReasons,
        moduleReason: hero.reason,
      },
      shortcutSelection: {
        schemaVersion: "shortcut-selection-run/v1",
        status: "ready",
        source: "page-merchandising-agent",
        agentId: "topic-strategy",
        templateRef: "topic-landing/brand-relevance@1",
        planDigest: `sha256:${"b".repeat(64)}`,
        assignments: [
          {
            groupId: "group-cleansing",
            productId: "anua-2",
            selectionReason: "代表基础清洁分类。",
          },
          {
            groupId: "group-care",
            productId: "anua-4",
            selectionReason: "代表集中护理分类。",
          },
        ],
        moduleReason: "Agent reviewed each semantic category representative.",
      },
      startHereSelection: {
        schemaVersion: "start-here-selection-run/v1",
        status: "ready",
        source: "page-merchandising-agent",
        agentId: "topic-strategy",
        templateRef: "topic-landing/brand-relevance@1",
        planDigest: `sha256:${"c".repeat(64)}`,
        visible: true,
        scenes: [
          {
            id: "reviewed-routine",
            sourceSceneId: "source-routine",
            label: "日常护理",
            shoppingGoal: "完成清洁和补水步骤。",
            reason: "两个目录分类支持基础流程。",
            productIds: ["anua-1", "anua-2"],
          },
          {
            id: "reviewed-treatment",
            sourceSceneId: "source-treatment",
            label: "集中护理",
            shoppingGoal: "搭配针对性护理商品。",
            reason: "护理商品形成独立目标。",
            productIds: ["anua-3", "anua-4"],
          },
        ],
        moduleReason: "Agent reviewed both Start Here scenes.",
      },
    }));

    await act(async () => root.render(<TopicGenerator />));
    await enterTopic();
    const select = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === "选品")!;
    await act(async () => select.click());

    const preview = container.querySelector('[data-preview-mode="selection"]');
    expect(preview?.textContent).toContain("Hero 选品完成 · 3 件商品");
    expect(preview?.textContent).toContain("Page Merchandising Agent 已复核组合");
    expect(preview?.textContent).toContain("Adds treatment coverage");
    expect(preview?.textContent).toContain(
      "2 个分类入口已按主题语义与商品归属生成；2 件代表商品已由 Page Merchandising Agent 复核",
    );
    expect(preview?.textContent).toContain(
      "“基础清洁”覆盖 3/4 件商品，分类范围较宽，建议复核是否存在可验证子分类",
    );
    expect(preview?.textContent).not.toContain("必须恢复为一类一入口");
    expect(preview?.textContent).toContain("帮助用户找到日常洁面商品");
    expect(preview?.textContent).not.toContain("代表基础清洁分类");
    expect(preview?.querySelectorAll("[data-shortcut-group]")).toHaveLength(2);
    expect(preview?.querySelector('[data-shortcut-group="group-cleansing"] img')
      ?.getAttribute("src")).toContain("anua-2.webp");
    expect(preview?.querySelector('[data-shortcut-group="group-care"] img')
      ?.getAttribute("src")).toContain("anua-4.webp");
    expect(preview?.querySelector('a[href^="#group-"]')).toBeNull();
    expect(preview?.textContent).not.toContain("临时预选");
    expect(preview?.textContent).toContain(
      "2 个场景及商品组合已由 Page Merchandising Agent 正式复核",
    );
    expect(preview?.textContent).toContain("完成清洁和补水步骤");
    expect(preview?.textContent).toContain("两个目录分类支持基础流程");
    expect(container.textContent).toContain("模块选品Agent 已复核");
  });

  it("labels deterministic Hero output as a visible fallback", async () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: buildYamiSearchUrl("ANUA"),
      fetchedAt: "2026-08-20T00:00:00.000Z",
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
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      plans: buildTopicPagePlanMatrix(snapshot, "selection"),
      selectionRuns: { relevance: { status: "ready" } },
      heroSelection: {
        schemaVersion: "hero-selection-run/v1",
        status: "fallback",
        source: "deterministic-rules",
        productIds: ["anua-1", "anua-2", "anua-3"],
        productReasons: {},
        issues: ["Automatic Hero selection requires a Topic Page Agent."],
      },
    }));

    await act(async () => root.render(<TopicGenerator />));
    await enterTopic();
    const select = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === "选品")!;
    await act(async () => select.click());

    const preview = container.querySelector('[data-preview-mode="selection"]');
    expect(preview?.textContent).toContain("Hero 规则预选 · 3 件商品");
    expect(preview?.textContent).toContain("Agent 复核暂不可用");
    expect(container.textContent).toContain("模块选品规则预选");
  });

  it("renders module-owned semantic groups instead of reconstructing raw catalog categories", async () => {
    const products = Array.from({ length: 8 }, (_, index) => ({
      id: `semantic-${index + 1}`,
      title: `ANUA Product ${index + 1}`,
      brand: "ANUA",
      price: "$19.99",
      imageUrl: `https://cdn.yamibuy.net/item/semantic-${index + 1}.webp`,
      productUrl: `https://www.yami.com/us/en/p/semantic-${index + 1}`,
      sourceRank: index + 1,
    }));
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: buildYamiSearchUrl("ANUA"),
      fetchedAt: "2026-08-20T00:00:00.000Z",
      products,
    };
    const plans = buildTopicPagePlanMatrix(snapshot, "selection");
    plans.zh.relevance.modules = plans.zh.relevance.modules.map((module) => {
      if (module.id === "shortcuts") return {
        ...module,
        visible: true,
        productIds: ["semantic-1", "semantic-5"],
        groups: [
          { id: "category-hypothesis-1", label: "日常基础", role: "core", productIds: ["semantic-1", "semantic-2", "semantic-3", "semantic-4"] },
          { id: "category-hypothesis-2", label: "集中护理", role: "pairing", productIds: ["semantic-5", "semantic-6", "semantic-7", "semantic-8"] },
        ],
      };
      if (module.id === "start-here") return {
        ...module,
        visible: true,
        productIds: products.map(({ id }) => id),
        groups: [
          { id: "scenario-hypothesis-1", label: "晨间流程", role: "core", productIds: ["semantic-1", "semantic-2", "semantic-5", "semantic-6"] },
          { id: "scenario-hypothesis-2", label: "晚间流程", role: "core", productIds: ["semantic-3", "semantic-4", "semantic-7", "semantic-8"] },
        ],
      };
      return module;
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      plans,
      runtime: {
        topicIntent: {
          mode: "automatic",
          status: "ready",
          agent: { status: "ready", id: "topic-intent" },
          proposalReview: {
            status: "accepted",
            acceptedFields: ["categoryHypotheses[0]", "scenarioHypotheses[0]"],
            rejectedFields: [],
            warnings: [],
          },
          categoryHypothesisCount: 2,
          scenarioHypothesisCount: 2,
          issues: [],
        },
      },
    }));

    await act(async () => root.render(<TopicGenerator />));
    await enterTopic();
    const select = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === "选品")!;
    await act(async () => select.click());

    expect(container.querySelector('[data-shortcut-group="category-hypothesis-1"]')?.textContent)
      .toContain("日常基础");
    expect(container.querySelector('[data-shortcut-group="category-hypothesis-2"]')?.textContent)
      .toContain("集中护理");
    expect(container.querySelector('a[href^="#group-category-hypothesis-"]')).toBeNull();
    expect(
      [...container.querySelectorAll("[data-start-here-theme]")].map((theme) =>
        theme.querySelector("h4")?.textContent
      ),
    ).toEqual(["晨间流程", "晚间流程"]);
    expect(container.querySelector('[data-preview-mode="selection"]')?.textContent)
      .toContain("Hero 预选");
    expect(container.querySelector('[data-preview-mode="selection"]')?.textContent)
      .toContain("正式组合复核尚未完成");
  });

  it("uses every Shortcut as a directory link to the matching recommendation tab", async () => {
    const products = Array.from({ length: 14 }, (_, index) => ({
      id: `navigation-${index + 1}`,
      title: `ANUA Product ${index + 1}`,
      brand: "ANUA",
      price: "$19.99",
      imageUrl: `https://cdn.yamibuy.net/item/navigation-${index + 1}.webp`,
      productUrl: `https://www.yami.com/us/en/p/navigation-${index + 1}`,
      sourceRank: index + 1,
    }));
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: buildYamiSearchUrl("ANUA"),
      fetchedAt: "2026-08-20T00:00:00.000Z",
      products,
    };
    const plans = buildTopicPagePlanMatrix(snapshot, "selection");
    const groups = Array.from({ length: 7 }, (_, index) => ({
      id: `navigation-group-${index + 1}`,
      label: `分类 ${index + 1}`,
      role: "core" as const,
      productIds: [`navigation-${index * 2 + 1}`, `navigation-${index * 2 + 2}`],
    }));
    plans.zh.relevance.modules = plans.zh.relevance.modules.map((module) =>
      module.id === "shortcuts"
        ? {
            ...module,
            visible: true,
            groups,
            productIds: groups.map(({ productIds }) => productIds[0]!),
          }
        : module.id === "explore-more"
          ? { ...module, visible: true, groups, productIds: products.map(({ id }) => id) }
          : module
    );
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ plans }));

    await act(async () => root.render(<TopicGenerator />));
    await enterTopic();
    const select = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === "选品")!;
    await act(async () => select.click());

    const shortcutLinks = container.querySelectorAll<HTMLAnchorElement>(
      '[data-shortcut-group][href="#explore-more"]',
    );
    expect(shortcutLinks).toHaveLength(7);
    const recommendationTabs = container.querySelectorAll<HTMLButtonElement>(
      '#explore-more [role="tab"]',
    );
    expect(recommendationTabs).toHaveLength(8);
    expect(recommendationTabs[0]?.textContent).toContain("全部");
    expect(recommendationTabs[0]?.getAttribute("aria-selected")).toBe("true");

    await act(async () => shortcutLinks[6]!.click());

    expect(recommendationTabs[7]?.getAttribute("aria-selected")).toBe("true");
    expect(container.querySelector('#explore-more [role="tabpanel"]')?.textContent)
      .toContain("ANUA Product 13");
  });

  it("explains the seven-Agent and nine-Skill architecture inside the workflow", async () => {
    await act(async () => {
      root.render(<TopicGenerator />);
    });
    await enterTopic();

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
    expect(agentsPanel?.textContent).toContain("1 个薄编排 Agent + 6 个执行与审核 Agent");
    expect(agentsPanel?.textContent).toContain("topic-page-orchestrator");
    expect(agentsPanel?.textContent).toContain("topic-strategy");
    expect(agentsPanel?.textContent).toContain("topic-background-evidence");
    expect(agentsPanel?.textContent).toContain("topic-content");
    expect(agentsPanel?.textContent).toContain("topic-content-review");
    expect(agentsPanel?.textContent).toContain("topic-visual");
    expect(agentsPanel?.textContent).toContain("topic-review");
    expect(agentsPanel?.textContent).toContain("page-orchestration");
    expect(agentsPanel?.textContent).toContain("page-copywriting");
    expect(agentsPanel?.textContent).not.toContain("content-writing");
    expect(agentsPanel?.textContent).toContain("page-review");
    expect(agentsPanel?.textContent).toContain("选品阶段内 · 路由规划");
    expect(agentsPanel?.textContent).toContain("主题意图 / 选品语义 / 模块编排");
    expect(agentsPanel?.textContent).toContain("页面路由提案（LandingPageExecutionPlanProposal）");
    expect(agentsPanel?.textContent).toContain("单一文案提案或五候选提案");
    expect(agentsPanel?.textContent).toContain("文案审核提案（TopicPageContentReviewProposal）");
    expect(agentsPanel?.textContent).not.toContain("TopicPageContentReviewDecision");
    expect(agentsPanel?.textContent).toContain("不把主观体验问题变成生成阻断");
    expect(agentsPanel?.textContent).not.toContain("核心才是最终规则权威");
    expect(agentsPanel?.querySelector(":scope > aside")).toBeNull();

    const agentCards = [
      ...agentsPanel!.querySelectorAll<HTMLDetailsElement>("details"),
    ];
    expect(agentCards).toHaveLength(7);
    expect(agentCards.every((card) => !card.open)).toBe(true);

    await act(async () => agentCards[0].querySelector("summary")!.click());
    expect(agentCards[0].open).toBe(true);
    expect(agentCards.slice(1).every((card) => !card.open)).toBe(true);
    expect([...agentCards[0].querySelectorAll("dt")].map((item) => item.textContent)).toEqual([
      "职责",
      "Skills",
      "输入",
      "提案输出",
      "职责边界",
    ]);
    const workflowDetailsClass = container
      .querySelector<HTMLDListElement>("#workflow-details-panel dl")!
      .className;
    expect(agentCards[0].querySelector("dl")?.classList.contains(workflowDetailsClass)).toBe(true);

    await act(async () => agentCards[1].querySelector("summary")!.click());
    expect(agentCards[0].open).toBe(true);
    expect(agentCards[1].open).toBe(true);

    const agentFlow = agentsPanel?.querySelector('[aria-label="当前实现依赖顺序"]');
    const flowNodes = [...agentFlow!.querySelectorAll<HTMLElement>("[data-agent-flow-node]")];
    expect(flowNodes).toHaveLength(8);
    expect(flowNodes.map((node) => node.dataset.agentFlowNode)).toEqual([
      "topic-strategy",
      "topic-background-evidence",
      "topic-page-orchestrator",
      "topic-strategy",
      "topic-content",
      "topic-content-review",
      "topic-visual",
      "topic-review",
    ]);
    expect(agentFlow?.querySelector('[data-agent-flow="parallel"]')).toBeNull();
    expect(agentFlow?.textContent).toContain("主题意图");
    expect(agentFlow?.textContent).toContain("选品阶段内 · 路由规划");
    expect(agentFlow?.textContent).toContain("选品 · 模块编排");
    expect(agentFlow?.textContent).toContain("文案生成 → 文案审核 → 视觉生成");
    expect(agentFlow?.textContent).toContain("资产落盘 → 页面生成 → 自动 QA");
    expect(agentFlow?.textContent).toContain("体验审核");
    expect(agentFlow?.textContent).toContain("自动定稿");
    expect(agentFlow?.textContent).not.toContain("Proposal 汇合");
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
    const plans = buildTopicPagePlanMatrix(snapshot);
    plans.zh.relevance.selectionDiagnostics = {
      candidateCount: 3,
      directMatchCount: 1,
      primaryCount: 3,
      relatedCount: 0,
      recoveryStrategy: "verified-category-context",
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({ plans }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }));

    await act(async () => {
      root.render(<TopicGenerator />);
    });
    await enterTopic();

    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("生成页面").click());
    await act(async () => button("商品池").click());

    const primaryHeading = [...container.querySelectorAll("section > header")]
      .find((header) => header.textContent?.includes("主商品池"));

    expect(primaryHeading?.textContent).toContain("选品依据");
    expect(primaryHeading?.textContent).toContain("优先关键词和品牌匹配，并保留 Yami 搜索结果顺序。");
    expect(primaryHeading?.textContent).toContain("自动恢复");
    expect(primaryHeading?.textContent).toContain("3 件候选中仅 1 件直接匹配，已使用验证分类恢复为 3 件主商品");
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
      catalogRefinement: {
        status: "complete",
        target: "brand",
        requestedKeys: ["structured-brand:10757", "brand-page:10757"],
        completedKeys: ["structured-brand:10757", "brand-page:10757"],
        failedKeys: [],
        issues: [],
      },
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      plans: buildTopicPagePlanMatrix(snapshot),
    }));

    await act(async () => root.render(<TopicGenerator />));
    await enterTopic();
    const button = (label: string) =>
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((candidate) => candidate.textContent === label)!;
    await act(async () => button("生成页面").click());
    await act(async () => button("商品池").click());

    expect(container.textContent).toContain("目录商品总览");
    expect(container.textContent).toContain("召回状态目录召回完成");
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
    await enterTopic();
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
      "background-evidence",
      "product-selection",
      "module-merchandising",
      "content-writing",
      "content-review",
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
          copyBrief: { digest: `sha256:${"2".repeat(64)}` },
          contentReview: { verdict: "approved" },
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

    function PagePreviewRenderer(props: TopicPagePreviewRendererProps) {
      if (props.mode !== "generated") return null;
      const { pageTypeRef, generationSpec } = props;
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
    await enterTopic();
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
      "Hero 选品完成 · 1 件商品；Page Merchandising Agent 已复核组合",
    );
    expect(distributionPreview?.textContent).toContain("主商品池首位锚点");
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
    expect(container.textContent).toContain("生成完成");
    expect(container.textContent).toContain("文案审核");
    expect(container.textContent).toContain("图片本体落盘");

    fetchMock.mockResolvedValueOnce(Response.json({
      plans: buildTopicPagePlanMatrix(snapshot, "selection"),
      selectionRuns: { relevance: { status: "ready" } },
    }));
    await act(async () => button("选品").click());
    expect(container.querySelector('[data-testid="prototype-preview"]')).toBeNull();
    const selectionPreviewTabs = container.querySelector<HTMLElement>(
      '[role="tablist"][aria-label="页面预览方式"]',
    )!;
    const selectionDistributionTab = [...selectionPreviewTabs.querySelectorAll<HTMLButtonElement>(
      "button",
    )].find((candidate) => candidate.textContent === "商品分布")!;
    const selectionPageTab = [...selectionPreviewTabs.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === "页面预览")!;
    expect(selectionDistributionTab.getAttribute("aria-selected")).toBe("true");
    await act(async () => selectionPageTab.click());
    expect(container.querySelector('[data-selection-page-preview="true"]')).not.toBeNull();
    expect(container.textContent).not.toContain("真实生成的抹茶主题");
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

    function LocalizedPreview(props: TopicPagePreviewRendererProps) {
      if (props.mode !== "generated") return null;
      const { generationSpec } = props;
      return (
        <div data-testid="localized-preview" lang={generationSpec.language}>
          {generationSpec.modules[0]?.copy.title.text}
        </div>
      );
    }

    await act(async () => root.render(
      <TopicGenerator PagePreviewRenderer={LocalizedPreview} />,
    ));
    await enterTopic();
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

  it("switches an existing selection preview language without selecting products again", async () => {
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
    const plans = buildTopicPagePlanMatrix(snapshot, "selection");
    const backgroundEvidence = {
      schemaVersion: "topic-background-evidence/v1",
      status: "ready",
      keyword: "ANUA",
      site: "us",
      language: "zh",
      themeIntentDigest: `sha256:${"a".repeat(64)}`,
      sources: [{
        id: "source:brand",
        type: "official-brand",
        title: "About ANUA",
        url: "https://brand.example/about",
        publisher: "ANUA official",
      }],
      claims: [{
        id: "claim:identity",
        type: "identity",
        text: "切换英文后不应显示的中文摘要。",
        sourceIds: ["source:brand"],
        usage: "context-only",
      }],
      issues: [],
      digest: `sha256:${"b".repeat(64)}`,
    } as const;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      plans,
      pagePreview: { pageTypeRef: "landing-page/brand@2" },
      backgroundEvidence,
      capabilityArtifacts: {
        intent: plans.zh.relevance.intent,
        selection: { keyword: "ANUA", site: "us" },
        plan: {},
        pageTypeRef: "landing-page/brand@2",
        backgroundEvidence,
      },
    }));

    function SelectionPreview(props: TopicPagePreviewRendererProps) {
      if (props.mode !== "selection") return null;
      return <div data-testid="selection-language">{props.plan.language}</div>;
    }

    await act(async () => root.render(
      <TopicGenerator PagePreviewRenderer={SelectionPreview} />,
    ));
    await enterTopic();
    const button = (label: string) => [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === label)!;

    await act(async () => button("选品").click());
    const previewTabs = container.querySelector<HTMLElement>(
      '[role="tablist"][aria-label="页面预览方式"]',
    )!;
    const pageTab = [...previewTabs.querySelectorAll<HTMLButtonElement>("button")]
      .find((candidate) => candidate.textContent === "页面预览")!;
    await act(async () => pageTab.click());
    expect(container.querySelector('[data-testid="selection-language"]')?.textContent).toBe("zh");

    await act(async () => {
      container.querySelector<HTMLInputElement>('input[value="en"]')!.click();
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="selection-language"]')?.textContent).toBe("en");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(async () => button("Keyword analysis").click());
    expect(container.textContent).not.toContain("切换英文后不应显示的中文摘要");
    expect(container.textContent).toContain("without selecting products again");
    expect(container.querySelector('a[href="https://brand.example/about"]')).not.toBeNull();
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
    await enterTopic();

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

  it("keeps a valid catalog plan visible when page automation is not configured", async () => {
    const snapshot: YamiSearchSnapshot = {
      keyword: "ANUA",
      site: "us",
      sourceUrl: buildYamiSearchUrl("ANUA"),
      fetchedAt: "2026-08-19T00:00:00.000Z",
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
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      plans: buildTopicPagePlanMatrix(snapshot),
      selectionRuns: { relevance: { status: "ready" } },
      automation: {
        schemaVersion: "topic-page-automation-run/v1",
        status: "blocked",
        stage: "workflow-planning",
        stages: [],
        issues: ["TOPIC_GENERATOR_PAGE_AGENT_ENDPOINT is not configured."],
      },
      pagePreview: { pageTypeRef: "landing-page/brand@2" },
    }));

    function SelectionPageRenderer(props: TopicPagePreviewRendererProps) {
      return props.mode === "selection"
        ? <div data-testid="selection-page-skeleton">{props.plan.keyword}</div>
        : null;
    }

    await act(async () => root.render(
      <TopicGenerator PagePreviewRenderer={SelectionPageRenderer} />,
    ));
    await enterTopic();
    const generateButton = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "生成页面")!;
    await act(async () => generateButton.click());

    expect(container.textContent).toContain("ANUA");
    expect(container.textContent).toContain("主商品池");
    expect(container.textContent).not.toContain("Yami 搜索结果无法转换为页面方案");
    expect(container.textContent).not.toContain("生成已阻止");
    const previewTabs = container.querySelector<HTMLElement>(
      '[role="tablist"][aria-label="页面预览方式"]',
    )!;
    const distributionTab = [...previewTabs.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "商品分布")!;
    const pageTab = [...previewTabs.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "页面预览")!;
    expect(distributionTab.getAttribute("aria-selected")).toBe("true");
    expect(pageTab.getAttribute("aria-selected")).toBe("false");
    expect(pageTab.getAttribute("aria-disabled")).toBe("false");
    expect(container.querySelector('[data-preview-mode="page"]')?.textContent)
      .toContain("HERO · 商品分布");
    expect(container.textContent).not.toContain("探索 ANUA");

    await act(async () => pageTab.click());
    expect(container.querySelector('[data-testid="selection-page-skeleton"]')?.textContent)
      .toBe("ANUA");

    const workflowButton = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "自动化流程")!;
    await act(async () => workflowButton.click());
    expect(container.textContent).toContain("TOPIC_GENERATOR_PAGE_AGENT_ENDPOINT is not configured.");
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
    await enterTopic();
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
    await enterTopic();
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
