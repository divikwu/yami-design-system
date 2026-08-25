/* @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildTopicPagePlanMatrix,
  TOPIC_GENERATOR_RUN_STAGE_IDS,
  type TopicGeneratorRunDetail,
  type TopicGeneratorRunStageId,
  type TopicGeneratorRunStatus,
  type TopicGeneratorRunSummary,
} from "../src/index";
import {
  exploreGroupsWithAll,
  managedGenerationProgressSteps,
  TopicGenerator,
  type TopicPagePreviewRendererProps,
} from "../web";

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true;

const runId = "matcha-20260821000000000-deadbeef";
const summary: TopicGeneratorRunSummary = {
  schemaVersion: "topic-generator-run-summary/v1",
  runId,
  keyword: "matcha",
  site: "us",
  language: "zh",
  strategy: "relevance",
  goal: "selection",
  status: "paused",
  nextStage: "background-evidence",
  completedStageCount: 1,
  stageCount: 12,
  deliverables: [{
    name: "topic-brief.html",
    status: "ready",
    file: "deliverables/topic-brief.html",
    mediaType: "text/html",
    sha256: "a".repeat(64),
    bytes: 100,
    generatedAt: "2026-08-21T00:00:00.000Z",
    issues: [],
  }, {
    name: "page-draft.html",
    status: "pending",
    file: "deliverables/page-draft.html",
    mediaType: "text/html",
    issues: [],
  }, {
    name: "page-final.html",
    status: "pending",
    file: "deliverables/page-final.html",
    mediaType: "text/html",
    issues: [],
  }],
  createdAt: "2026-08-21T00:00:00.000Z",
  updatedAt: "2026-08-21T00:00:00.000Z",
  legacy: true,
  continuable: true,
  diagnostics: [],
  origin: { type: "imported", sourceDigest: "b".repeat(64) },
};

describe("Topic Generator Explore More groups", () => {
  it("prepends one localized All group with the complete product set", () => {
    const groups = [{ id: "cleanser", label: "清洁", productIds: ["1"] }, {
      id: "serum",
      label: "精华",
      productIds: ["2"],
    }];

    expect(exploreGroupsWithAll(groups, ["1", "2"], "zh")).toEqual([
      { id: "explore-more-all", label: "全部", productIds: ["1", "2"] },
      ...groups,
    ]);
    expect(exploreGroupsWithAll(groups, ["1", "2"], "en")[0]).toEqual({
      id: "explore-more-all",
      label: "All",
      productIds: ["1", "2"],
    });
  });

  it("replaces imported All aliases, resolves the reserved id, and normalizes memberships", () => {
    const groups = [{
      id: "explore-more-all",
      label: "All Products",
      productIds: ["2", "1", "2"],
    }, {
      id: "legacy-all",
      label: "全部商品",
      productIds: ["1", "2"],
    }, {
      id: "all-treatments",
      label: "全部护理",
      productIds: ["2", "1", "2"],
    }, {
      id: "cleanser",
      label: "清洁",
      productIds: ["1", "1", "unknown"],
    }, {
      id: "orphaned",
      label: "无可用商品",
      productIds: ["unknown"],
    }];

    expect(exploreGroupsWithAll(groups, ["1", "2", "1"], "zh")).toEqual([
      { id: "explore-more-all", label: "全部", productIds: ["1", "2"] },
      { id: "all-treatments", label: "全部护理", productIds: ["2", "1"] },
      { id: "cleanser", label: "清洁", productIds: ["1"] },
    ]);
  });

  it("returns no recommendation tabs when the module has no products", () => {
    expect(exploreGroupsWithAll([
      { id: "explore-more-all", label: "All", productIds: [] },
    ], [], "en")).toEqual([]);
  });
});

describe("Topic Generator managed generation progress", () => {
  it("describes bilingual candidate generation and advisory review truthfully", () => {
    expect(managedGenerationProgressSteps("content-writing", "zh")).toEqual([
      "并行生成中文和英文各 5 套 Hero 与主题专辑候选",
      "分别评选每个模块与场景的最佳候选",
      "汇总双语 ContentSpec，长度仅作优化建议",
    ]);
    expect(managedGenerationProgressSteps("content-review", "en")).toEqual([
      "Review topic, scene, and evidence expression in the primary locale",
      "Review the other locale for the same shopper meaning and natural phrasing",
      "Keep structurally valid copy moving; quality findings remain advisory",
    ]);
  });

  it("describes the active visual, assembly, QA, and experience-review stage", () => {
    expect(managedGenerationProgressSteps("visual-generation", "zh")).toEqual([
      "读取已通过审核的双语文案与视觉任务",
      "并行生成 Hero、分类入口与主题专辑场景图",
      "检查场景构图、真实图片与无障碍元数据",
    ]);
    expect(managedGenerationProgressSteps("asset-persistence", "en")).toEqual([
      "Validate image bytes, formats, and task bindings",
      "Persist every validated visual asset",
      "Create stable asset URLs for page rendering",
    ]);
    expect(managedGenerationProgressSteps("page-generation", "zh")).toEqual([
      "编译双语文案、商品与视觉资产",
      "组装 Hero、主题专辑与商品模块",
      "生成可交互的双语页面预览",
    ]);
    expect(managedGenerationProgressSteps("automatic-qa", "en")).toEqual([
      "Verify image bytes, formats, dimensions, and bindings",
      "Validate modules, copy, products, and accessibility structure",
      "Compile the deterministic QA report",
    ]);
    expect(managedGenerationProgressSteps("experience-review", "zh")).toEqual([
      "检查桌面端与移动端真实页面预览",
      "复核层级、可读性与购物决策",
      "保留质量建议并继续进入用户审核",
    ]);
    expect(managedGenerationProgressSteps("user-approval", "zh")).toEqual([
      "校验当前评审包与确认摘要",
      "渲染可离线打开的最终页面",
      "写入确认记录与可下载产物",
    ]);
  });
});

function v2Detail(
  runId: string,
  options: {
    status: TopicGeneratorRunStatus;
    nextStage: TopicGeneratorRunStageId | null;
    completedThrough: TopicGeneratorRunStageId | null;
    parentRunId?: string;
    strategy?: TopicGeneratorRunSummary["strategy"];
  },
): TopicGeneratorRunDetail {
  const completedIndex = options.completedThrough
    ? TOPIC_GENERATOR_RUN_STAGE_IDS.indexOf(options.completedThrough)
    : -1;
  const stages = TOPIC_GENERATOR_RUN_STAGE_IDS.map((id, index) => ({
    id,
    status: index <= completedIndex ? "completed" as const : "pending" as const,
    attempts: index <= completedIndex ? 1 : 0,
    ...(index <= completedIndex ? { resultDigest: "c".repeat(64) } : {}),
    issues: [],
  }));
  const runSummary: TopicGeneratorRunSummary = {
    ...summary,
    runId,
    ...(options.parentRunId ? { parentRunId: options.parentRunId } : {}),
    goal: "page",
    strategy: options.strategy ?? "relevance",
    status: options.status,
    nextStage: options.nextStage,
    completedStageCount: completedIndex + 1,
    legacy: false,
    origin: options.parentRunId ? { type: "derived" } : { type: "new" },
  };
  return {
    schemaVersion: "topic-generator-run-detail/v1",
    manifest: {
      schemaVersion: "topic-generator-run/v2",
      product: "TOPIC GENERATOR",
      runId,
      ...(options.parentRunId ? { parentRunId: options.parentRunId } : {}),
      createdAt: summary.createdAt,
      request: {
        keyword: "matcha",
        site: "us",
        language: "zh",
        strategy: options.strategy ?? "relevance",
        goal: "page",
      },
      requestDigest: "d".repeat(64),
      origin: options.parentRunId ? { type: "derived" } : { type: "new" },
      contracts: {
        state: "topic-generator-run-state/v1",
        stageResult: "topic-generator-stage-result/v1",
        pageAutomation: "topic-page-automation-run/v1",
      },
    },
    state: {
      schemaVersion: "topic-generator-run-state/v1",
      runId,
      status: options.status,
      nextStage: options.nextStage,
      stages,
      deliverables: summary.deliverables,
      issues: [],
      processedRequests: [],
      updatedAt: summary.updatedAt,
    },
    summary: runSummary,
    stageResults: {},
    diagnostics: [],
  };
}

describe("Topic Generator managed run loading", () => {
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
    delete (window as typeof window & { showDirectoryPicker?: unknown }).showDirectoryPicker;
    vi.restoreAllMocks();
  });

  it("shows saved topics by their highest completed user milestone", async () => {
    const items = [
      v2Detail("matcha-selection", {
        status: "paused",
        nextStage: "content-writing",
        completedThrough: "module-merchandising",
      }).summary,
      v2Detail("matcha-content", {
        status: "blocked",
        nextStage: "visual-generation",
        completedThrough: "content-review",
      }).summary,
      v2Detail("matcha-visual", {
        status: "interrupted",
        nextStage: "page-generation",
        completedThrough: "asset-persistence",
      }).summary,
      v2Detail("matcha-page", {
        status: "paused",
        nextStage: "automatic-qa",
        completedThrough: "page-generation",
      }).summary,
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      schemaVersion: "topic-generator-run-list/v1",
      items,
      nextCursor: null,
    }));

    await act(async () => {
      root.render(<TopicGenerator managedRunApiBase="/api/topic-generator" />);
      await Promise.resolve();
    });
    await act(async () => {
      container.querySelector<HTMLInputElement>(
        'input[name="topic-source"][value="load"]',
      )!.click();
      await Promise.resolve();
    });
    await act(async () => {
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent === "加载主题")!.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect([...container.querySelectorAll<HTMLElement>(
      '[class*="managedRunOptionStatus"]',
    )].map(({ textContent }) => textContent)).toEqual([
      "选品完成",
      "文案生成完成",
      "图片生成完成",
      "页面已生成",
    ]);

    await act(async () => {
      container.querySelector<HTMLInputElement>(
        'input[name="ui-language"][value="en"]',
      )!.click();
    });
    expect([...container.querySelectorAll<HTMLElement>(
      '[class*="managedRunOptionStatus"]',
    )].map(({ textContent }) => textContent)).toEqual([
      "Product selection complete",
      "Copy generation complete",
      "Image generation complete",
      "Page generated",
    ]);
  });

  it("lists, loads, and safely deletes one selected managed topic", async () => {
    const plans = buildTopicPagePlanMatrix({
      keyword: "matcha",
      site: "us",
      sourceUrl: "https://example.com/search?q=matcha",
      fetchedAt: "2026-08-21T00:00:00.000Z",
      products: [],
    }, "selection");
    const otherSummary: TopicGeneratorRunSummary = {
      ...summary,
      runId: "ramen-20260820000000000-cafebabe",
      keyword: "ramen",
      updatedAt: "2026-08-20T00:00:00.000Z",
    };
    let resolveArchive: ((response: Response) => void) | undefined;
    const archiveResponse = new Promise<Response>((resolve) => {
      resolveArchive = resolve;
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/runs?limit=100") && init?.method === undefined) {
        return Response.json({
          schemaVersion: "topic-generator-run-list/v1",
          items: [otherSummary, summary],
          nextCursor: null,
        });
      }
      if (url.endsWith(`/runs/${runId}`) && init?.method === undefined) {
        return Response.json({
          schemaVersion: "topic-generator-legacy-run-detail/v1",
          summary,
          manifest: {
            schemaVersion: "topic-generator-run/v1",
            product: "TOPIC GENERATOR",
            runId,
            keyword: "matcha",
            createdAt: summary.createdAt,
            fallbackUsed: false,
            proposalStatus: "not-provided",
            artifacts: [],
          },
          artifacts: { "page-plans.json": { plans } },
          diagnostics: [],
        });
      }
      if (url.endsWith(`/runs/${runId}`) && init?.method === "DELETE") {
        return Response.json({
          schemaVersion: "topic-generator-run-deletion/v1",
          runId,
          deletedAt: "2026-08-21T00:01:00.000Z",
          recoverable: true,
        });
      }
      if (
        url.endsWith(`/runs/${runId}/archive?type=preview`) &&
        init?.method === undefined
      ) {
        return archiveResponse;
      }
      throw new Error(`Unexpected ${init?.method ?? "GET"} ${url}`);
    });

    await act(async () => {
      root.render(<TopicGenerator managedRunApiBase="/api/topic-generator" />);
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    const loadSourceTab = container.querySelector<HTMLInputElement>(
      'input[name="topic-source"][value="load"]',
    )!;
    await act(async () => loadSourceTab.click());
    const loadButton = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "加载主题")!;
    expect(loadButton.className).toContain("default");
    await act(async () => {
      loadButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const dialog = container.querySelector<HTMLDialogElement>(
      "#topic-generator-managed-run-picker",
    )!;
    expect(dialog.open).toBe(true);
    expect(loadButton.getAttribute("aria-haspopup")).toBe("dialog");
    expect(dialog.querySelector("h2")?.textContent).toBe("选择已存主题（2）");

    let options = [...dialog.querySelectorAll<HTMLInputElement>(
      'input[name="topic-generator-managed-run"]',
    )];
    expect(options).toHaveLength(2);
    const firstStatus = options[0]?.closest("label")
      ?.querySelector<HTMLElement>('[class*="managedRunOptionStatus"]');
    expect(firstStatus?.textContent).toBe("已暂停");
    expect(firstStatus?.parentElement).toBe(options[0]?.closest("label"));
    expect([...dialog.querySelectorAll<HTMLButtonElement>("button")]
      .some((button) => button.textContent === "取消")).toBe(false);
    expect(options[0]?.closest("label")?.hasAttribute("data-selected")).toBe(true);
    expect(options[1]?.closest("label")?.hasAttribute("data-selected")).toBe(false);
    await act(async () => {
      dialog.dispatchEvent(new Event("cancel", { cancelable: true }));
      await Promise.resolve();
    });
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(loadButton);
    expect(container.querySelectorAll('input[name="topic-generator-managed-run"]')).toHaveLength(0);

    await act(async () => {
      loadButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    options = [...dialog.querySelectorAll<HTMLInputElement>(
      'input[name="topic-generator-managed-run"]',
    )];
    expect(options[0]?.checked).toBe(true);
    expect(options[1]?.checked).toBe(false);
    await act(async () => options[1]?.click());
    expect(options[0]?.checked).toBe(false);
    expect(options[1]?.checked).toBe(true);
    expect(options[0]?.closest("label")?.hasAttribute("data-selected")).toBe(false);
    expect(options[1]?.closest("label")?.hasAttribute("data-selected")).toBe(true);

    const loadSelected = [...dialog.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "加载")!;
    await act(async () => {
      loadSelected.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchMock.mock.calls.some(([input, init]) =>
      String(input).endsWith("/advance") && init?.method === "POST"
    )).toBe(false);
    expect(dialog.open).toBe(false);
    expect(container.querySelectorAll('input[name="topic-generator-managed-run"]')).toHaveLength(0);
    expect(container.textContent).not.toContain(runId);
    const loadedKeyword = container.querySelector<HTMLInputElement>(
      '#topic-source-load-panel input:disabled',
    )!;
    expect(loadedKeyword.value).toBe("matcha");
    expect(loadedKeyword.readOnly).toBe(false);
    expect(loadedKeyword.disabled).toBe(true);
    expect(loadedKeyword.labels?.item(0)?.textContent).toBe("主题");
    const loadedStrategy = container.querySelector<HTMLButtonElement>(
      '#topic-source-load-panel [data-slot="workbench-select-trigger"]',
    )!;
    expect(loadedStrategy.disabled).toBe(false);
    expect(loadedStrategy.textContent).toContain("精准匹配");
    expect([...container.querySelectorAll<HTMLElement>(
      '#topic-source-load-panel [data-slot="workbench-field-label"]',
    )].some((label) => label.textContent === "选品策略")).toBe(true);
    const changeTopic = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "更换主题")!;
    expect(changeTopic.parentElement?.parentElement)
      .toBe(loadedKeyword.parentElement?.parentElement);
    expect(changeTopic.parentElement?.textContent).toBe("更换主题重置");
    const generatedContent = container.querySelector<HTMLElement>(
      'section[aria-label="生成内容"]',
    )!;
    expect(generatedContent.querySelector("#loaded-topic-status")).toBeNull();
    const generatorActions = [...container.querySelectorAll<HTMLElement>("div")]
      .find((element) => element.className.includes("generatorActions"))!;
    expect(generatorActions.compareDocumentPosition(generatedContent) &
      Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    const topicPackageDownload = [...generatedContent.querySelectorAll<HTMLButtonElement>(
      "button",
    )].find((button) => button.textContent === "下载主题包")!;
    expect(topicPackageDownload.textContent).toBe("下载主题包");
    expect(topicPackageDownload.querySelector("svg")).not.toBeNull();
    expect(generatedContent.querySelector(
      `a[download="${runId}-run-archive.zip"]`,
    )).toBeNull();
    expect(generatedContent.textContent).not.toContain("下载内容");
    expect(generatedContent.querySelector('a[download$=".html"]')).toBeNull();

    const createObjectUrl = vi.spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:topic-package");
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const downloadClick = vi.spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    await act(async () => {
      topicPackageDownload.click();
      await Promise.resolve();
    });
    expect(topicPackageDownload.textContent).toBe("正在打包…");
    expect(topicPackageDownload.disabled).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/topic-generator/runs/${runId}/archive?type=preview`,
    );

    await act(async () => {
      resolveArchive?.(new Response(new Blob(["zip"]), {
        headers: { "content-type": "application/zip" },
      }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(topicPackageDownload.textContent).toBe("下载主题包");
    expect(topicPackageDownload.disabled).toBe(false);
    expect(createObjectUrl).toHaveBeenCalledOnce();
    expect(downloadClick).toHaveBeenCalledOnce();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:topic-package");
    for (const label of ["生成页面", "选品", "生成文案", "生成图片"]) {
      const action = [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent === label)!;
      expect(action.disabled).toBe(false);
    }
    const englishLanguage = container.querySelector<HTMLInputElement>(
      'input[name="ui-language"][value="en"]',
    )!;
    expect(englishLanguage.closest("fieldset")?.disabled).toBe(false);
    expect(englishLanguage.matches(":disabled")).toBe(false);
    await act(async () => englishLanguage.click());
    expect(container.querySelector("main")?.getAttribute("lang")).toBe("en");
    await act(async () => {
      container.querySelector<HTMLInputElement>(
        'input[name="ui-language"][value="zh"]',
      )!.click();
    });

    await act(async () => {
      container.querySelector<HTMLInputElement>(
        'input[name="topic-source"][value="input"]',
      )!.click();
    });
    expect([...generatedContent.querySelectorAll<HTMLButtonElement>("button")]
      .some((button) => button.textContent === "下载主题包")).toBe(true);
    expect([...container.querySelectorAll<HTMLButtonElement>("button")]
      .some((button) => button.textContent === "重置")).toBe(true);
    await act(async () => {
      container.querySelector<HTMLInputElement>(
        'input[name="topic-source"][value="load"]',
      )!.click();
    });

    await act(async () => {
      [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent === "更换主题")!.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const selectedCurrent = [...dialog.querySelectorAll<HTMLInputElement>(
      'input[name="topic-generator-managed-run"]',
    )].find((input) => input.checked)!;
    expect(selectedCurrent.closest("label")?.textContent).toContain(runId);

    const requestDeletion = [...dialog.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "删除")!;
    await act(async () => requestDeletion.click());
    expect(dialog.textContent).toContain("删除已存主题");
    expect(dialog.textContent).toContain("外部导入源不会被修改");

    const cancelDeletion = [...dialog.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "取消")!;
    await act(async () => cancelDeletion.click());
    expect(dialog.open).toBe(true);
    expect(dialog.querySelectorAll('input[name="topic-generator-managed-run"]')).toHaveLength(2);
    expect(fetchMock.mock.calls.some(([input, init]) =>
      String(input).endsWith(`/runs/${runId}`) && init?.method === "DELETE"
    )).toBe(false);

    await act(async () => {
      [...dialog.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent === "删除")?.click();
    });
    const confirmDeletion = [...dialog.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "确认删除")!;
    await act(async () => {
      confirmDeletion.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchMock.mock.calls.some(([input, init]) =>
      String(input).endsWith(`/runs/${runId}`) && init?.method === "DELETE"
    )).toBe(true);
    expect(dialog.open).toBe(true);
    expect(dialog.querySelectorAll('input[name="topic-generator-managed-run"]')).toHaveLength(1);
    expect(dialog.querySelector("h2")?.textContent).toBe("选择已存主题（1）");
    expect(dialog.textContent).not.toContain(runId);
    expect(container.textContent).not.toContain("继续生成");
    expect(container.textContent).not.toContain("派生新运行");
    expect(container.textContent).not.toContain("刷新数据");

    const inputSourceTab = container.querySelector<HTMLInputElement>(
      'input[name="topic-source"][value="input"]',
    )!;
    await act(async () => inputSourceTab.click());
    const keyword = container.querySelector<HTMLInputElement>(
      'input[placeholder="例如 ANUA、ramen"]',
    )!;
    expect(keyword.value).toBe("matcha");
    expect(keyword.disabled).toBe(false);
    expect(keyword.readOnly).toBe(false);
  });

  it("imports one selected external run from the saved-topic picker", async () => {
    const plans = buildTopicPagePlanMatrix({
      keyword: "matcha",
      site: "us",
      sourceUrl: "https://example.com/search?q=matcha",
      fetchedAt: "2026-08-21T00:00:00.000Z",
      products: [],
    }, "selection");
    const runFiles = ["run-a", "run-b"].map((name) => ({
      name,
      kind: "directory" as const,
      async *values() {
        yield {
          name: "run.json",
          kind: "file" as const,
          getFile: async () => new File([
            JSON.stringify({ schemaVersion: "topic-generator-run/v1", runId: name }),
          ], "run.json", { type: "application/json" }),
        };
      },
    }));
    Object.defineProperty(window, "showDirectoryPicker", {
      configurable: true,
      value: vi.fn(async () => ({
        name: "runs",
        kind: "directory" as const,
        async *values() {
          for (const directory of runFiles) yield directory;
        },
      })),
    });
    let committedCandidateIds: string[] = [];
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/runs?limit=100") && init?.method === undefined) {
        return Response.json({
          schemaVersion: "topic-generator-run-list/v1",
          items: [],
          nextCursor: null,
        });
      }
      if (url.endsWith("/imports/start") && init?.method === "POST") {
        return Response.json({
          id: "import-session",
          candidates: [{
            id: "candidate-a",
            sourceRoot: "run-a",
            runId: "run-a",
            schemaVersion: "topic-generator-run/v1",
            keyword: "matcha a",
            createdAt: summary.createdAt,
            valid: true,
            issues: [],
          }, {
            id: "candidate-b",
            sourceRoot: "run-b",
            runId,
            schemaVersion: "topic-generator-run/v1",
            keyword: "matcha",
            createdAt: summary.createdAt,
            valid: true,
            issues: [],
          }],
          limits: { maxChunkBytes: 1024 * 1024 },
        });
      }
      if (url.includes("/imports/import-session/files?") && init?.method === "PUT") {
        expect(decodeURIComponent(url)).toContain("path=run-b/run.json");
        return new Response(null, { status: 204 });
      }
      if (url.endsWith("/imports/import-session/commit") && init?.method === "POST") {
        committedCandidateIds = (JSON.parse(String(init.body)) as { candidateIds: string[] })
          .candidateIds;
        return Response.json({ results: [{ runId }] });
      }
      if (url.endsWith(`/runs/${runId}`)) {
        return Response.json({
          schemaVersion: "topic-generator-legacy-run-detail/v1",
          summary,
          manifest: {
            schemaVersion: "topic-generator-run/v1",
            product: "TOPIC GENERATOR",
            runId,
            keyword: "matcha",
            createdAt: summary.createdAt,
            fallbackUsed: false,
            proposalStatus: "not-provided",
            artifacts: [],
          },
          artifacts: { "page-plans.json": { plans } },
          diagnostics: [],
        });
      }
      throw new Error(`Unexpected ${init?.method ?? "GET"} ${url}`);
    });

    await act(async () => {
      root.render(<TopicGenerator managedRunApiBase="/api/topic-generator" />);
      await Promise.resolve();
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(container.textContent).not.toContain("本机受管目录");
    expect(container.textContent).not.toContain(".topic-generator/runs");
    expect(container.querySelector<HTMLInputElement>(
      'input[name="topic-source"][value="input"]',
    )?.checked).toBe(true);
    expect(container.querySelector<HTMLInputElement>(
      'input[name="topic-source"][value="load"]',
    )).not.toBeNull();
    expect(container.textContent).not.toContain("新建主题");
    expect(container.textContent).toContain("输入主题");
    expect(container.textContent).not.toContain("RUN FILE");
    expect(container.textContent).not.toContain("历史运行");

    await act(async () => {
      container.querySelector<HTMLInputElement>(
        'input[name="topic-source"][value="load"]',
      )?.click();
    });
    const loadButton = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "加载主题")!;
    await act(async () => {
      loadButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const dialog = container.querySelector<HTMLDialogElement>(
      "#topic-generator-managed-run-picker",
    )!;
    expect(dialog.open).toBe(true);
    expect(container.textContent).toContain("受管目录中还没有主题");

    const externalImportButton = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "导入")!;
    await act(async () => {
      externalImportButton.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const candidates = [...container.querySelectorAll<HTMLInputElement>(
      'input[name="topic-generator-import-candidate"]',
    )];
    expect(candidates).toHaveLength(2);
    expect(dialog.contains(candidates[0]!)).toBe(true);
    expect(dialog.open).toBe(true);
    expect(candidates[0]?.checked).toBe(true);
    expect(candidates[1]?.checked).toBe(false);
    expect(candidates[0]?.closest("label")?.hasAttribute("data-selected")).toBe(true);
    expect(candidates[1]?.closest("label")?.hasAttribute("data-selected")).toBe(false);
    await act(async () => candidates[1]?.click());
    expect(candidates[0]?.checked).toBe(false);
    expect(candidates[1]?.checked).toBe(true);
    expect(candidates[0]?.closest("label")?.hasAttribute("data-selected")).toBe(false);
    expect(candidates[1]?.closest("label")?.hasAttribute("data-selected")).toBe(true);

    const commit = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "导入运行")!;
    await act(async () => {
      commit.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchMock.mock.calls.some(([input, init]) =>
      String(input).endsWith("/advance") && init?.method === "POST"
    )).toBe(false);
    expect(committedCandidateIds).toEqual(["candidate-b"]);
    expect(dialog.open).toBe(false);
    expect(container.textContent).not.toContain(runId);
    const importedKeyword = container.querySelector<HTMLInputElement>(
      '#topic-source-load-panel input:disabled',
    )!;
    expect(importedKeyword.value).toBe("matcha");
    expect(importedKeyword.readOnly).toBe(false);
    expect(importedKeyword.disabled).toBe(true);
    expect(container.textContent).toContain("下载主题包");
    expect(container.textContent).not.toContain("导出完整运行归档");
    expect(container.textContent).not.toContain("继续生成");
    expect(container.textContent).not.toContain("派生新运行");
    expect(container.textContent).not.toContain("刷新数据");
    for (const label of ["生成页面", "选品", "生成文案", "生成图片"]) {
      const action = [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent === label)!;
      expect(action.disabled).toBe(false);
    }
  });

  it("keeps a new topic in input mode and exposes its generated files", async () => {
    const generatedRunId = "matcha-20260821003000000-generated";
    const generatedBase = v2Detail(generatedRunId, {
      status: "paused",
      nextStage: "automatic-qa",
      completedThrough: "page-generation",
    });
    const generatedDeliverables = generatedBase.state.deliverables.map((deliverable) =>
      deliverable.name === "page-draft.html"
        ? {
            ...deliverable,
            status: "ready" as const,
            sha256: "e".repeat(64),
            bytes: 200,
            generatedAt: "2026-08-21T00:30:00.000Z",
          }
        : deliverable
    );
    const generated: TopicGeneratorRunDetail = {
      ...generatedBase,
      state: { ...generatedBase.state, deliverables: generatedDeliverables },
      summary: { ...generatedBase.summary, deliverables: generatedDeliverables },
    };
    let createBody: Record<string, unknown> | null = null;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/runs") && init?.method === "POST") {
        createBody = JSON.parse(String(init.body)) as Record<string, unknown>;
        return Response.json({ manifest: { runId: generatedRunId } }, { status: 201 });
      }
      if (url.endsWith(`/runs/${generatedRunId}`) && init?.method === undefined) {
        return Response.json(generated);
      }
      throw new Error(`Unexpected ${init?.method ?? "GET"} ${url}`);
    });

    await act(async () => {
      root.render(<TopicGenerator managedRunApiBase="/api/topic-generator" />);
      await Promise.resolve();
    });

    const editableKeyword = container.querySelector<HTMLInputElement>(
      'input[placeholder="例如 ANUA、ramen"]',
    )!;
    expect(editableKeyword.readOnly).toBe(false);
    expect(editableKeyword.disabled).toBe(false);

    const generatePage = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "生成页面")!;
    await act(async () => {
      generatePage.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(createBody).toMatchObject({ request: { keyword: "ANUA", goal: "page" } });
    expect(container.querySelector<HTMLInputElement>(
      'input[name="topic-source"][value="input"]',
    )?.checked).toBe(true);
    expect(container.querySelector<HTMLInputElement>(
      'input[name="topic-source"][value="load"]',
    )?.checked).toBe(false);
    expect(editableKeyword.value).toBe("matcha");
    expect(editableKeyword.readOnly).toBe(false);
    expect(editableKeyword.disabled).toBe(false);
    const generatedDownload = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "下载主题包")!;
    expect(generatedDownload.querySelector("svg")).not.toBeNull();
    expect(container.querySelector(
      `a[download="${generatedRunId}-page-preview.html"]`,
    )).toBeNull();
    expect(container.querySelector('section[aria-label="生成内容"]')
      ?.querySelectorAll("a")).toHaveLength(0);
    expect(container.querySelector('section[aria-label="生成内容"]')?.textContent)
      .not.toContain("下载内容");
  });

  it("keeps input and page preview selected while selecting products for a new topic", async () => {
    const selectionRunId = "anua-20260823130536358-selection";
    const pendingSelection = v2Detail(selectionRunId, {
      status: "paused",
      nextStage: "product-selection",
      completedThrough: "background-evidence",
    });
    const blockedSelection = v2Detail(selectionRunId, {
      status: "blocked",
      nextStage: "product-selection",
      completedThrough: "background-evidence",
    });
    let resolveAdvance!: (response: Response) => void;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/runs") && init?.method === "POST") {
        return Response.json({ manifest: { runId: selectionRunId } }, { status: 201 });
      }
      if (url.endsWith(`/runs/${selectionRunId}`) && init?.method === undefined) {
        return Response.json(pendingSelection);
      }
      if (url.endsWith(`/runs/${selectionRunId}/advance`) && init?.method === "POST") {
        return new Promise((resolve) => {
          resolveAdvance = resolve;
        });
      }
      throw new Error(`Unexpected ${init?.method ?? "GET"} ${url}`);
    });

    await act(async () => {
      root.render(<TopicGenerator managedRunApiBase="/api/topic-generator" />);
      await Promise.resolve();
    });

    const selectProducts = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "选品")!;
    await act(async () => {
      selectProducts.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.querySelector<HTMLInputElement>(
      'input[name="topic-source"][value="input"]',
    )?.checked).toBe(true);
    expect(container.querySelector<HTMLInputElement>(
      'input[name="topic-source"][value="load"]',
    )?.checked).toBe(false);
    const resultTabs = container.querySelector<HTMLElement>(
      '[role="tablist"][aria-label="生成结果视图"]',
    )!;
    const pagePreview = [...resultTabs.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "页面预览")!;
    const topicAnalysis = [...resultTabs.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "主题词分析")!;
    expect(pagePreview.getAttribute("aria-selected")).toBe("true");
    expect(topicAnalysis.getAttribute("aria-selected")).toBe("false");
    expect(container.textContent).toContain("正在为“matcha”选品");

    await act(async () => {
      resolveAdvance(Response.json({ detail: blockedSelection }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  });

  it("switches a newly generated managed run to its saved English content without a fallback request", async () => {
    const bilingualRunId = "matcha-20260822150000000-bilingual";
    const plans = buildTopicPagePlanMatrix({
      keyword: "matcha",
      site: "us",
      sourceUrl: "https://example.com/search?q=matcha",
      fetchedAt: "2026-08-22T15:00:00.000Z",
      products: ["1", "2", "3"].map((id, index) => ({
        id,
        title: `Matcha ${id}`,
        brand: "Matcha Brand",
        price: "$9.99",
        imageUrl: `https://example.com/${id}.webp`,
        productUrl: `https://example.com/${id}`,
        sourceRank: index + 1,
      })),
    }, "selection");
    const base = v2Detail(bilingualRunId, {
      status: "awaiting-approval",
      nextStage: "user-approval",
      completedThrough: "experience-review",
    });
    const deliverables = base.state.deliverables.map((deliverable) =>
      deliverable.name === "page-draft.html"
        ? {
            ...deliverable,
            status: "ready" as const,
            sha256: "f".repeat(64),
            bytes: 200,
            generatedAt: "2026-08-22T15:00:00.000Z",
          }
        : deliverable
    );
    const localizedContent = (language: "zh" | "en", title: string) => ({
      schemaVersion: "topic-page-content-spec/v1",
      status: "content-ready",
      keyword: "matcha",
      site: "us",
      language,
      tasks: [{
        taskId: "content-hero",
        moduleId: "hero",
        component: "ThemeHero",
        copy: { title: { text: title, evidenceRefs: ["product:1"] } },
      }],
      digest: `sha256:${language}-content`,
    });
    const zhContent = localizedContent("zh", "从一碗抹茶开始品味日常");
    const enContent = localizedContent("en", "Make Matcha Part of Your Everyday Ritual");
    const detail: TopicGeneratorRunDetail = {
      ...base,
      state: { ...base.state, deliverables },
      summary: { ...base.summary, deliverables },
      stageResults: {
        "topic-intent": { analysis: { intent: { id: "intent" } }, plans },
        "background-evidence": { backgroundEvidence: { language: "zh" } },
        "product-selection": {
          executionPlan: { pageTypeRef: "landing-page/topic@2" },
          selection: { id: "selection" },
          selectionRun: { status: "ready" },
          plans,
        },
        "module-merchandising": {
          plan: { schemaVersion: "topic-page-plan/v2", digest: "sha256:plan" },
          plans,
        },
        "content-review": {
          contentSpec: zhContent,
          copyBrief: { digest: "sha256:zh-brief" },
          contentReview: { verdict: "approved", digest: "sha256:zh-review" },
          contentByLanguage: {
            zh: {
              contentSpec: zhContent,
              copyBrief: { digest: "sha256:zh-brief" },
              contentReview: { verdict: "approved", digest: "sha256:zh-review" },
            },
            en: {
              contentSpec: enContent,
              copyBrief: { digest: "sha256:en-brief" },
              contentReview: { verdict: "approved", digest: "sha256:en-review" },
            },
          },
        },
        "page-generation": {
          generationSpec: {
            language: "zh",
            digest: "sha256:zh-visual",
          },
        },
      },
    } as never;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/runs") && init?.method === "POST") {
        return Response.json({ manifest: { runId: bilingualRunId } }, { status: 201 });
      }
      if (url.endsWith(`/runs/${bilingualRunId}`) && init?.method === undefined) {
        return Response.json(detail);
      }
      throw new Error(`Unexpected ${init?.method ?? "GET"} ${url}`);
    });
    const Preview = (preview: TopicPagePreviewRendererProps) => {
      const state = preview.mode === "visual"
        ? `visual:${preview.generationSpec.language}:${preview.generationSpec.digest}`
        : preview.mode === "content"
        ? `content:${preview.contentSpec.language}:${preview.retainedVisualSpec?.digest ?? "none"}`
        : preview.mode;
      return <div data-testid="localized-preview">{state}</div>;
    };

    await act(async () => {
      root.render(
        <TopicGenerator
          PagePreviewRenderer={Preview}
          managedRunApiBase="/api/topic-generator"
        />,
      );
      await Promise.resolve();
    });
    const generateContent = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "生成页面")!;
    await act(async () => {
      generateContent.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(container.querySelector('[data-testid="localized-preview"]')?.textContent)
      .toBe("visual:zh:sha256:zh-visual");

    const requestCount = fetchMock.mock.calls.length;
    await act(async () => {
      container.querySelector<HTMLInputElement>(
        'input[name="ui-language"][value="en"]',
      )!.click();
    });

    expect(container.querySelector('[data-testid="localized-preview"]')?.textContent)
      .toBe("content:en:sha256:zh-visual");
    expect(fetchMock).toHaveBeenCalledTimes(requestCount);

    await act(async () => {
      container.querySelector<HTMLInputElement>(
        'input[name="ui-language"][value="zh"]',
      )!.click();
    });

    expect(container.querySelector('[data-testid="localized-preview"]')?.textContent)
      .toBe("visual:zh:sha256:zh-visual");
    expect(fetchMock).toHaveBeenCalledTimes(requestCount);
  });

  it("passes retained ancestor visuals into a scoped content preview", async () => {
    const parentRunId = "matcha-20260824010000000-visual-parent";
    const childRunId = "matcha-20260824010100000-content-child";
    const plans = buildTopicPagePlanMatrix({
      keyword: "matcha",
      site: "us",
      sourceUrl: "https://example.com/search?q=matcha",
      fetchedAt: "2026-08-24T01:00:00.000Z",
      products: [],
    }, "selection");
    const base = v2Detail(childRunId, {
      status: "paused",
      nextStage: "visual-generation",
      completedThrough: "content-review",
      parentRunId,
    });
    const deliverables = base.state.deliverables.map((deliverable) =>
      deliverable.name === "page-draft.html"
        ? {
            ...deliverable,
            status: "ready" as const,
            sha256: "e".repeat(64),
            bytes: 200,
            generatedAt: "2026-08-24T01:00:00.000Z",
          }
        : deliverable
    );
    const contentSpec = {
      language: "zh",
      digest: "sha256:new-content",
      tasks: [],
    };
    const detail: TopicGeneratorRunDetail = {
      ...base,
      state: { ...base.state, deliverables },
      summary: { ...base.summary, deliverables },
      stageResults: {
        "topic-intent": { analysis: { intent: { id: "intent" } }, plans },
        "product-selection": {
          executionPlan: { pageTypeRef: "landing-page/topic@2" },
          selection: { id: "selection" },
          selectionRun: { status: "ready" },
          plans,
        },
        "module-merchandising": {
          plan: { schemaVersion: "topic-page-plan/v2", digest: "sha256:plan" },
          plans,
        },
        "content-review": {
          contentSpec,
          copyBrief: { digest: "sha256:brief" },
          contentReview: { verdict: "approved", digest: "sha256:review" },
        },
      },
      retainedVisualPreview: {
        sourceRunId: parentRunId,
        pageGeneration: {
          generationSpec: { digest: "sha256:retained-visual" },
        },
      },
    } as never;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/runs?limit=100") && init?.method === undefined) {
        return Response.json({
          schemaVersion: "topic-generator-run-list/v1",
          items: [detail.summary],
          nextCursor: null,
        });
      }
      if (url.endsWith(`/runs/${childRunId}`) && init?.method === undefined) {
        return Response.json(detail);
      }
      throw new Error(`Unexpected ${init?.method ?? "GET"} ${url}`);
    });
    const Preview = (preview: TopicPagePreviewRendererProps) => {
      return (
        <div data-testid="retained-visual-preview">
          {preview.mode}:{preview.mode === "content" ? preview.contentSpec.digest : "none"}:
          {preview.mode === "content" ? preview.retainedVisualSpec?.digest ?? "none" : "none"}
        </div>
      );
    };

    await act(async () => {
      root.render(
        <TopicGenerator
          PagePreviewRenderer={Preview}
          managedRunApiBase="/api/topic-generator"
        />,
      );
      await Promise.resolve();
    });
    await act(async () => {
      container.querySelector<HTMLInputElement>(
        'input[name="topic-source"][value="load"]',
      )!.click();
    });
    const loadTopic = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "加载主题")!;
    await act(async () => {
      loadTopic.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const dialog = container.querySelector<HTMLDialogElement>(
      "#topic-generator-managed-run-picker",
    )!;
    const load = [...dialog.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "加载")!;
    await act(async () => {
      load.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.querySelector('[data-testid="retained-visual-preview"]')?.textContent)
      .toBe("content:sha256:new-content:sha256:retained-visual");
  });

  it.each([
    ["生成页面", "topic-intent"],
    ["选品", "product-selection"],
    ["生成文案", "content-writing"],
    ["生成图片", "visual-generation"],
  ] as const)(
    "regenerates a completed saved topic from the %s scope",
    async (actionLabel, rollbackStage) => {
      const completedRunId = "matcha-20260821010000000-complete";
      const childRunId = `matcha-20260821010100000-${rollbackStage}`;
      const completedBase = v2Detail(completedRunId, {
        status: "completed",
        nextStage: null,
        completedThrough: "user-approval",
      });
      const completedDeliverables = completedBase.state.deliverables.map((deliverable) =>
        deliverable.name === "page-final.html"
          ? {
              ...deliverable,
              status: "ready" as const,
              sha256: "f".repeat(64),
              bytes: 1024,
              generatedAt: "2026-08-21T01:00:00.000Z",
            }
          : deliverable
      );
      const completed = {
        ...completedBase,
        state: { ...completedBase.state, deliverables: completedDeliverables },
        summary: { ...completedBase.summary, deliverables: completedDeliverables },
      };
      const rollbackIndex = TOPIC_GENERATOR_RUN_STAGE_IDS.indexOf(rollbackStage);
      const completedBeforeRollback = rollbackIndex > 0
        ? TOPIC_GENERATOR_RUN_STAGE_IDS[rollbackIndex - 1]!
        : null;
      const derived = v2Detail(childRunId, {
        status: "paused",
        nextStage: rollbackStage,
        completedThrough: completedBeforeRollback,
        parentRunId: completedRunId,
      });
      const blocked = v2Detail(childRunId, {
        status: "blocked",
        nextStage: rollbackStage,
        completedThrough: completedBeforeRollback,
        parentRunId: completedRunId,
      });
      let deriveBody: Record<string, unknown> | null = null;
      let advanceCalls = 0;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
        const url = String(input);
        if (url.endsWith("/runs?limit=100") && init?.method === undefined) {
          return Response.json({
            schemaVersion: "topic-generator-run-list/v1",
            items: [completed.summary],
            nextCursor: null,
          });
        }
        if (url.endsWith(`/runs/${completedRunId}`) && init?.method === undefined) {
          return Response.json(completed);
        }
        if (url.endsWith(`/runs/${completedRunId}/derive`) && init?.method === "POST") {
          deriveBody = JSON.parse(String(init.body)) as Record<string, unknown>;
          return Response.json({ manifest: { runId: childRunId } }, { status: 201 });
        }
        if (url.endsWith(`/runs/${childRunId}`) && init?.method === undefined) {
          return Response.json(derived);
        }
        if (url.endsWith(`/runs/${childRunId}/advance`) && init?.method === "POST") {
          advanceCalls += 1;
          return Response.json({ detail: blocked });
        }
        throw new Error(`Unexpected ${init?.method ?? "GET"} ${url}`);
      });

      await act(async () => {
        root.render(<TopicGenerator managedRunApiBase="/api/topic-generator" />);
        await Promise.resolve();
      });
      await act(async () => {
        container.querySelector<HTMLInputElement>(
          'input[name="topic-source"][value="load"]',
        )?.click();
      });
      const loadTopic = [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent === "加载主题")!;
      await act(async () => {
        loadTopic.click();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
      const dialog = container.querySelector<HTMLDialogElement>(
        "#topic-generator-managed-run-picker",
      )!;
      const load = [...dialog.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent === "加载")!;
      await act(async () => {
        load.click();
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const finalPageDownload = container.querySelector<HTMLAnchorElement>(
        `a[download="${completedRunId}-page-final.html"]`,
      );
      expect(finalPageDownload?.getAttribute("href")).toBe(
        `/api/topic-generator/runs/${completedRunId}/deliverables/page-final.html`,
      );

      const action = [...container.querySelectorAll<HTMLButtonElement>("button")]
        .find((button) => button.textContent === actionLabel)!;
      expect(action.disabled).toBe(false);
      await act(async () => {
        action.click();
        await new Promise((resolve) => setTimeout(resolve, 0));
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(deriveBody).toEqual({ origin: "derived", rollbackStage });
      expect(advanceCalls).toBe(1);
      expect(container.textContent).not.toContain("派生新运行");
      expect(container.textContent).not.toContain(childRunId);
    },
  );

  it("derives a saved topic from product selection when its strategy changes", async () => {
    const completedRunId = "matcha-20260821020000000-complete";
    const childRunId = "matcha-20260821020100000-category-role";
    const completed = v2Detail(completedRunId, {
      status: "completed",
      nextStage: null,
      completedThrough: "user-approval",
    });
    const derived = v2Detail(childRunId, {
      status: "paused",
      nextStage: "product-selection",
      completedThrough: "background-evidence",
      parentRunId: completedRunId,
      strategy: "category-role",
    });
    const blocked = v2Detail(childRunId, {
      status: "blocked",
      nextStage: "product-selection",
      completedThrough: "background-evidence",
      parentRunId: completedRunId,
      strategy: "category-role",
    });
    let deriveBody: Record<string, unknown> | null = null;
    let advanceCalls = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = String(input);
      if (url.endsWith("/runs?limit=100") && init?.method === undefined) {
        return Response.json({
          schemaVersion: "topic-generator-run-list/v1",
          items: [completed.summary],
          nextCursor: null,
        });
      }
      if (url.endsWith(`/runs/${completedRunId}`) && init?.method === undefined) {
        return Response.json(completed);
      }
      if (url.endsWith(`/runs/${completedRunId}/derive`) && init?.method === "POST") {
        deriveBody = JSON.parse(String(init.body)) as Record<string, unknown>;
        return Response.json({ manifest: { runId: childRunId } }, { status: 201 });
      }
      if (url.endsWith(`/runs/${childRunId}`) && init?.method === undefined) {
        return Response.json(derived);
      }
      if (url.endsWith(`/runs/${childRunId}/advance`) && init?.method === "POST") {
        advanceCalls += 1;
        return Response.json({ detail: blocked });
      }
      throw new Error(`Unexpected ${init?.method ?? "GET"} ${url}`);
    });

    await act(async () => {
      root.render(<TopicGenerator managedRunApiBase="/api/topic-generator" />);
      await Promise.resolve();
    });
    await act(async () => {
      container.querySelector<HTMLInputElement>(
        'input[name="topic-source"][value="load"]',
      )?.click();
    });
    const loadTopic = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "加载主题")!;
    await act(async () => {
      loadTopic.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    const dialog = container.querySelector<HTMLDialogElement>(
      "#topic-generator-managed-run-picker",
    )!;
    const load = [...dialog.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "加载")!;
    await act(async () => {
      load.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const strategyTrigger = container.querySelector<HTMLButtonElement>(
      '#topic-source-load-panel [data-slot="workbench-select-trigger"]',
    )!;
    expect(strategyTrigger.disabled).toBe(false);
    await act(async () => strategyTrigger.click());
    const categoryRoleOption = [...document.body.querySelectorAll<HTMLElement>('[role="option"]')]
      .find((option) => option.textContent === "分类角色")!;
    await act(async () => categoryRoleOption.click());
    expect(strategyTrigger.textContent).toContain("分类角色");

    const generateContent = [...container.querySelectorAll<HTMLButtonElement>("button")]
      .find((button) => button.textContent === "生成文案")!;
    await act(async () => {
      generateContent.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(deriveBody).toEqual({
      origin: "derived",
      rollbackStage: "product-selection",
      request: { strategy: "category-role" },
    });
    expect(advanceCalls).toBe(1);
  });
});
