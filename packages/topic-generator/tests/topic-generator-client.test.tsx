/* @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildTopicPagePlanMatrix,
  buildYamiSearchUrl,
  type YamiSearchSnapshot,
} from "../src/index";
import { TopicGenerator } from "../web/topic-generator-client";

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
    expect(button("页面预览").getAttribute("aria-current")).toBe("page");
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
