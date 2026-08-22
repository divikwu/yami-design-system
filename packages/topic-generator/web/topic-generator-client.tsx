"use client";

import {
  AiBrain01Icon,
  ArchiveArrowDownIcon,
  ArrowDown01Icon,
  ArrowTurnBackwardIcon,
  Cancel01Icon,
  CheckmarkBadge02Icon,
  Grid2X2Icon,
  Image02Icon,
  Route02Icon,
  Search02Icon,
  Settings01Icon,
  Shield01Icon,
  TextIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ChangeEvent, ComponentType, FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  CategoryRoleRuntimeEvidence,
  ContentLanguage,
  ProductSelectionStrategy,
  TopicGenerationMode,
  TopicModulePlan,
  TopicPagePlan,
  TopicPlanMatrix,
  TopicProduct,
} from "../src/types";
import type {
  ProductSelectionResult,
  ProductSelectionRun,
} from "../src/product-selection/contracts";
import type { TopicPageAutomationRun } from "../src/page-automation/contracts";
import type {
  HeroSelectionRun,
  ShortcutSelectionRun,
  StartHereSelectionRun,
  TopicPagePlanV2,
} from "../src/page-merchandising/contracts";
import type { TopicPageContentSpec } from "../src/page-content/contracts";
import type { TopicPageContentReviewDecision } from "../src/page-content/content-review";
import type { TopicBackgroundEvidenceBundle } from "../src/background-evidence/contracts";
import type { LandingPageTypeRef } from "../src/page-orchestration/contracts";
import type {
  TopicPageGeneratedProduct,
  TopicPageGenerationModule,
  TopicPageGenerationSpec,
} from "../src/page-generation/contracts";
import type {
  AutomaticQaStageOutput,
  AssetPersistenceStageOutput,
  BackgroundEvidenceStageOutput,
  ContentReviewStageOutput,
  ExperienceReviewStageOutput,
  ModuleMerchandisingStageOutput,
  PageGenerationStageOutput,
  ProductSelectionStageOutput,
  TopicGeneratorAnyRunDetail,
  TopicGeneratorRunGoal,
  TopicGeneratorRunDeletion,
  TopicGeneratorRunStageId,
  TopicGeneratorRunSummary,
  TopicIntentStageOutput,
} from "../src/managed-run/index";
import {
  SegmentedControl,
  WorkbenchButton,
  WorkbenchLink,
  WorkbenchSelect,
  WorkbenchTabPanel,
  WorkbenchTabs,
  WorkbenchTextField,
} from "./workbench-controls";
import { TopicAnalysisView } from "./topic-analysis-view";
import { themeIntentDisplayCopy } from "./theme-intent-copy";
import styles from "./topic-generator.module.css";

type ResultView = "preview" | "pools" | "workflow" | "analysis" | "rules";
type WorkflowMode = "diagram" | "details" | "agents";
type PreviewMode = "distribution" | "page";
type CapabilityMode = TopicGenerationMode | "content" | "visual";
type TopicSourceMode = "input" | "load";
type SelectionRuns = Partial<Record<ProductSelectionStrategy, ProductSelectionRun>>;
type ReadyTopicPageAutomationRun = Extract<TopicPageAutomationRun, { status: "ready" }>;

const MANAGED_STAGE_ORDER: readonly TopicGeneratorRunStageId[] = [
  "topic-intent",
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
  "user-approval",
];

const MANAGED_MILESTONE: Record<TopicGeneratorRunGoal, TopicGeneratorRunStageId> = {
  selection: "module-merchandising",
  content: "content-review",
  visual: "page-generation",
  page: "experience-review",
};

const MANAGED_REGENERATION_STAGE: Record<
  TopicGeneratorRunGoal,
  TopicGeneratorRunStageId
> = {
  selection: "product-selection",
  content: "content-writing",
  visual: "visual-generation",
  page: "topic-intent",
};

const MANAGED_RUN_STATUS_LABELS: Record<
  ContentLanguage,
  Record<TopicGeneratorRunSummary["status"], string>
> = {
  en: {
    pending: "Pending",
    running: "Running",
    paused: "Paused",
    "awaiting-approval": "Awaiting approval",
    completed: "Completed",
    blocked: "Blocked",
    interrupted: "Interrupted",
  },
  zh: {
    pending: "待开始",
    running: "生成中",
    paused: "已暂停",
    "awaiting-approval": "待审批",
    completed: "已完成",
    blocked: "已阻塞",
    interrupted: "已中断",
  },
};

interface ImportBrowserFile {
  file: File;
  path: string;
  sha256: string;
}

interface ImportCandidate {
  id: string;
  sourceRoot: string;
  runId: string;
  schemaVersion: string;
  keyword: string;
  createdAt: string;
  valid: boolean;
  issues: string[];
}

interface PendingImport {
  sessionId: string;
  files: ImportBrowserFile[];
  candidates: ImportCandidate[];
  selectedIds: string[];
  maxChunkBytes: number;
}

function isManagedV2Detail(
  detail: TopicGeneratorAnyRunDetail,
): detail is Extract<TopicGeneratorAnyRunDetail, { schemaVersion: "topic-generator-run-detail/v1" }> {
  return detail.schemaVersion === "topic-generator-run-detail/v1";
}

function managedAutomation(
  detail: Extract<TopicGeneratorAnyRunDetail, { schemaVersion: "topic-generator-run-detail/v1" }>,
): ReadyTopicPageAutomationRun | null {
  const selection = detail.stageResults["product-selection"] as
    ProductSelectionStageOutput | undefined;
  const merchandising = detail.stageResults["module-merchandising"] as
    ModuleMerchandisingStageOutput | undefined;
  const content = detail.stageResults["content-review"] as ContentReviewStageOutput | undefined;
  const assets = detail.stageResults["asset-persistence"] as
    AssetPersistenceStageOutput | undefined;
  const page = detail.stageResults["page-generation"] as PageGenerationStageOutput | undefined;
  const qa = detail.stageResults["automatic-qa"] as AutomaticQaStageOutput | undefined;
  const experience = detail.stageResults["experience-review"] as
    ExperienceReviewStageOutput | undefined;
  if (!selection || !merchandising || !content || !assets || !page ||
      qa?.qaReport.status !== "passed" ||
      experience?.experienceReview.status !== "review-recommended") {
    return null;
  }
  const passedQa = qa.qaReport as typeof qa.qaReport & { status: "passed" };
  const recommendedReview = experience.experienceReview as
    typeof experience.experienceReview & { status: "review-recommended" };
  const completed = new Set(detail.state.stages
    .filter(({ status }) => status === "completed")
    .map(({ id }) => id));
  return {
    schemaVersion: "topic-page-automation-run/v1",
    status: "ready",
    stage: "review-ready",
    stages: MANAGED_STAGE_ORDER
      .filter((id) => id !== "topic-intent" && id !== "user-approval")
      .map((id) => ({
        id,
        status: completed.has(id) ? "completed" as const : "pending" as const,
      })),
    issues: [],
    executionPlan: selection.executionPlan,
    plan: merchandising.plan,
    contentSpec: content.contentSpec,
    copyBrief: content.copyBrief,
    contentReview: content.contentReview,
    assetManifest: assets.assetManifest,
    generationSpec: page.generationSpec,
    qaReport: passedQa,
    experienceReview: recommendedReview,
    reviewPackage: experience.reviewPackage,
  };
}

function managedContentForLanguage(
  content: ContentReviewStageOutput | undefined,
  language: ContentLanguage,
) {
  const localized = content?.contentByLanguage?.[language];
  if (localized) return localized;
  if (content?.contentSpec.language !== language) return null;
  return {
    contentSpec: content.contentSpec,
    copyBrief: content.copyBrief,
    contentReview: content.contentReview,
    ...(content.revisionAttempt ? { revisionAttempt: content.revisionAttempt } : {}),
  };
}

async function fileDigest(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizedBrowserFiles(files: Array<{ file: File; path: string }>) {
  const paths = files.map(({ path }) => path.replace(/^\/+/, ""));
  const firstSegments = new Set(paths.map((path) => path.split("/", 1)[0]));
  const removeRoot = firstSegments.size === 1 && !paths.includes("run.json");
  return files.map(({ file }, index) => {
    const path = paths[index]!;
    return {
      file,
      path: removeRoot ? path.slice(path.indexOf("/") + 1) : path,
    };
  });
}

interface BrowserDirectoryHandle {
  name: string;
  kind: "directory";
  values(): AsyncIterable<BrowserDirectoryHandle | BrowserFileHandle>;
}

interface BrowserFileHandle {
  name: string;
  kind: "file";
  getFile(): Promise<File>;
}

async function filesFromDirectory(
  directory: BrowserDirectoryHandle,
  prefix = "",
): Promise<Array<{ file: File; path: string }>> {
  const files: Array<{ file: File; path: string }> = [];
  for await (const entry of directory.values()) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.kind === "file") files.push({ file: await entry.getFile(), path });
    else files.push(...await filesFromDirectory(entry, path));
  }
  return files;
}

interface LocalizedAutomationCache {
  requestKey: string;
  sourceSignature: string;
  runs: Partial<Record<ContentLanguage, ReadyTopicPageAutomationRun>>;
}

interface CapabilityArtifacts {
  intent: TopicPagePlan["intent"];
  selection: ProductSelectionResult;
  plan: TopicPagePlanV2;
  pageTypeRef: LandingPageTypeRef;
  backgroundEvidence?: TopicBackgroundEvidenceBundle;
}

export type TopicPagePreviewRendererProps =
  | {
      mode: "selection";
      pageTypeRef: LandingPageTypeRef;
      plan: TopicPagePlan;
    }
  | {
      mode: "generated";
      pageTypeRef: LandingPageTypeRef;
      generationSpec: TopicPageGenerationSpec;
    }
  | {
      mode: "content";
      pageTypeRef: LandingPageTypeRef;
      plan: TopicPagePlan;
      contentSpec: TopicPageContentSpec;
    }
  | {
      mode: "visual";
      pageTypeRef: LandingPageTypeRef;
      generationSpec: TopicPageGenerationSpec;
    };

export interface TopicGeneratorProps {
  PagePreviewRenderer?: ComponentType<TopicPagePreviewRendererProps>;
  /** Enables the standalone host's managed run, import, and resume APIs. */
  managedRunApiBase?: string;
}

export function selectionDefaultCopy(keyword: string, language: ContentLanguage) {
  if (language === "zh") {
    return {
      heroTitle: `浏览 ${keyword} 商品`,
      heroDescription: `查看本次选中的 ${keyword} 商品，并按品类和选购场景继续浏览。`,
      shortcutsTitle: `按品类浏览 ${keyword}`,
      startHereTitle: "按选购场景开始浏览",
      sceneDescription: `查看这一场景下已选的 ${keyword} 商品。`,
      popularTitle: `${keyword} 精选商品`,
      brandTitle: "按品牌浏览",
      reviewsTitle: "顾客评价",
      exploreTitle: `继续浏览 ${keyword} 商品`,
      exploreDescription: "按更多品类查看本次选中的商品。",
    };
  }
  return {
    heroTitle: `Browse ${keyword} products`,
    heroDescription: `Browse the selected ${keyword} products by category and shopping scenario.`,
    shortcutsTitle: `Browse ${keyword} by category`,
    startHereTitle: "Start with a shopping scenario",
    sceneDescription: `Browse the selected ${keyword} products for this scenario.`,
    popularTitle: `Selected ${keyword} products`,
    brandTitle: "Browse by brand",
    reviewsTitle: "Customer reviews",
    exploreTitle: `Continue browsing ${keyword} products`,
    exploreDescription: "Browse more of the selected products by category.",
  };
}

function selectionModuleTitle(plan: TopicPagePlan, module: TopicModulePlan) {
  const copy = selectionDefaultCopy(plan.keyword, plan.language);
  const fallback = {
    hero: copy.heroTitle,
    shortcuts: copy.shortcutsTitle,
    "start-here": copy.startHereTitle,
    "popular-picks": copy.popularTitle,
    "brand-spotlight": copy.brandTitle,
    reviews: copy.reviewsTitle,
    "explore-more": copy.exploreTitle,
  }[module.id];
  return module.heading.trim() || fallback || module.label;
}

interface GeneratorError {
  code?: string;
  message: string;
  sourceUrl?: string;
}

const EXAMPLE_KEYWORDS = ["ANUA", "ramen", "matcha", "home storage"];
const WORKFLOW_ICONS = {
  input: Settings01Icon,
  route: Route02Icon,
  search: Search02Icon,
  pool: AiBrain01Icon,
  modules: Grid2X2Icon,
  content: Image02Icon,
  qa: Shield01Icon,
  review: UserIcon,
  publish: CheckmarkBadge02Icon,
  chevron: ArrowDown01Icon,
} as const;
const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文" },
] as const;
const STRATEGY_OPTIONS = {
  en: [
    { value: "relevance", label: "Relevance" },
    { value: "category-role", label: "Category roles" },
  ],
  zh: [
    { value: "relevance", label: "精准匹配" },
    { value: "category-role", label: "分类角色" },
  ],
} as const;

function automationRequestKey(keyword: string, strategy: ProductSelectionStrategy) {
  return JSON.stringify([keyword, strategy]);
}

function automationSourceSignature(automation: ReadyTopicPageAutomationRun) {
  const { executionPlan, generationSpec } = automation;
  return JSON.stringify({
    pageTypeRef: executionPlan.pageTypeRef,
    strategyRef: generationSpec.strategyRef,
    templateRef: generationSpec.templateRef,
    keyword: generationSpec.keyword,
    site: generationSpec.site,
    moduleOrder: generationSpec.moduleOrder,
    modules: generationSpec.modules.map((module) => ({
      id: module.id,
      component: module.component,
      shoppingGoal: module.shoppingGoal,
      reason: module.reason,
      products: module.products,
      scenes: module.scenes,
    })),
  });
}

function heroSelectionFromAutomation(
  automation: ReadyTopicPageAutomationRun | null,
  fallbackPlan?: TopicPagePlan | null,
): HeroSelectionRun | null {
  const hero = automation?.plan?.modules.find(({ id }) => id === "hero");
  const fallbackHero = fallbackPlan?.modules.find(({ id }) => id === "hero");
  if (!automation || (!hero && !fallbackHero)) return null;
  const productIds = hero?.visible
    ? hero.assignments.map(({ productId }) => productId)
    : fallbackHero?.productIds ?? [];
  if (productIds.length === 0) return null;
  const moduleReason = hero?.reason ?? fallbackHero?.reason ?? "Agent-reviewed Hero composition.";
  return {
    schemaVersion: "hero-selection-run/v1",
    status: "ready",
    source: "page-merchandising-agent",
    agentId: "topic-strategy",
    templateRef: automation.plan?.templateRef ?? automation.executionPlan.templateRef,
    planDigest: automation.plan?.digest ?? automation.generationSpec.digest,
    productIds,
    productReasons: hero
      ? Object.fromEntries(hero.assignments.map((assignment) => [
          assignment.productId,
          assignment.selectionReason ?? assignment.reuseReason ?? hero.reason,
        ]))
      : { ...(fallbackHero?.productReasons ?? {}) },
    moduleReason,
  };
}

function shortcutSelectionFromAutomation(
  automation: ReadyTopicPageAutomationRun | null,
): ShortcutSelectionRun | null {
  const shortcuts = automation?.plan?.modules.find(({ id }) => id === "shortcuts");
  if (!automation || !shortcuts?.visible || shortcuts.assignments.length === 0 ||
      shortcuts.assignments.some(({ groupId, selectionReason }) => !groupId || !selectionReason)) {
    return null;
  }
  return {
    schemaVersion: "shortcut-selection-run/v1",
    status: "ready",
    source: "page-merchandising-agent",
    agentId: "topic-strategy",
    templateRef: automation.plan.templateRef,
    planDigest: automation.plan.digest,
    assignments: shortcuts.assignments.map((assignment) => ({
      groupId: assignment.groupId!,
      productId: assignment.productId,
      selectionReason: assignment.selectionReason!,
    })),
    moduleReason: shortcuts.reason,
  };
}

function startHereSelectionFromAutomation(
  automation: ReadyTopicPageAutomationRun | null,
  fallbackPlan?: TopicPagePlan | null,
): StartHereSelectionRun | null {
  const startHere = automation?.plan?.modules.find(({ id }) => id === "start-here");
  if (!automation || !startHere) return null;
  const fallbackGroups = new Map(
    (fallbackPlan?.modules.find(({ id }) => id === "start-here")?.groups ?? [])
      .map((group) => [group.id, group]),
  );
  return {
    schemaVersion: "start-here-selection-run/v1",
    status: "ready",
    source: "page-merchandising-agent",
    agentId: "topic-strategy",
    templateRef: automation.plan.templateRef,
    planDigest: automation.plan.digest,
    visible: startHere.visible,
    scenes: startHere.scenes.map((scene) => {
      const sourceGroup = fallbackGroups.get(scene.sourceSceneId);
      return {
        id: scene.id,
        sourceSceneId: scene.sourceSceneId,
        label: sourceGroup?.label ?? scene.shoppingGoal,
        shoppingGoal: scene.shoppingGoal,
        reason: scene.reason,
        productIds: [...scene.productIds],
        ...(sourceGroup?.sourceCategoryIds
          ? { sourceCategoryIds: [...sourceGroup.sourceCategoryIds] }
          : {}),
      };
    }),
    moduleReason: startHere.reason,
  };
}

function evidenceLevelLabel(plan: TopicPagePlan, uiLanguage: ContentLanguage) {
  const labels = uiLanguage === "zh"
    ? { high: "高证据", medium: "中证据", low: "低证据" }
    : { high: "High evidence", medium: "Medium evidence", low: "Low evidence" };
  return labels[plan.intent.decision.evidenceLevel];
}

function resultLocaleLabel(language: ContentLanguage) {
  return language === "zh" ? "ZH-CN" : "EN-US";
}

function planStatusLabel(plan: TopicPagePlan, language: ContentLanguage) {
  const labels = language === "zh"
    ? { ready: "就绪", degraded: "需复核", blocked: "已阻止" }
    : { ready: "Ready", degraded: "Needs review", blocked: "Blocked" };
  return labels[plan.status];
}

function productCountLabel(count: number, language: ContentLanguage) {
  if (language === "zh") return `${count} 件商品`;
  return `${count} ${count === 1 ? "product" : "products"}`;
}

function itemCountLabel(count: number, language: ContentLanguage) {
  if (language === "zh") return `${count} 件`;
  return `${count} ${count === 1 ? "item" : "items"}`;
}
const UI_COPY = {
  en: {
    keywordLabel: "Enter topic",
    loadedKeywordLabel: "Topic",
    keywordPlaceholder: "e.g. ANUA, ramen",
    examplesLabel: "Example keywords",
    interfaceLanguage: "Language",
    searching: "SEARCHING YAMI…",
    strategyLabel: "Product selection strategy",
    selectProducts: "Select products",
    selectingProducts: "Selecting…",
    generateContent: "Generate copy",
    generatingContent: "Generating copy…",
    generateVisuals: "Generate images",
    generatingVisuals: "Generating images…",
    generatePage: "Generate page",
    generatingPage: "Generating…",
    currentRun: "Current run",
    waiting: "Waiting for input",
    previewLabel: "Topic page generation workspace",
    resultViewsLabel: "Result views",
    tabs: {
      workflow: "Automation workflow",
      analysis: "Keyword analysis",
      preview: "Page preview",
      pools: "Product pools",
      rules: "Rules & QA",
    },
    previewModesLabel: "Page preview mode",
    previewModes: {
      distribution: "Product distribution",
      page: "Page preview",
    },
    generatedPlan: "Generated English page plan",
    selectedPlan: "English selection and module assignment complete",
    sourceLink: "View Yami source ↗",
    visibleModules: "Visible modules",
    assetMode: "Asset mode",
    sourceImages: "Source images",
  },
  zh: {
    keywordLabel: "输入主题",
    loadedKeywordLabel: "主题",
    keywordPlaceholder: "例如 ANUA、ramen",
    examplesLabel: "示例关键词",
    interfaceLanguage: "语言",
    searching: "正在搜索 YAMI…",
    strategyLabel: "选品策略",
    selectProducts: "选品",
    selectingProducts: "选品中…",
    generateContent: "生成文案",
    generatingContent: "生成文案中…",
    generateVisuals: "生成图片",
    generatingVisuals: "生成图片中…",
    generatePage: "生成页面",
    generatingPage: "生成中…",
    currentRun: "当前运行",
    waiting: "等待输入",
    previewLabel: "Topic 页面生成工作区",
    resultViewsLabel: "生成结果视图",
    tabs: {
      workflow: "自动化流程",
      analysis: "主题词分析",
      preview: "页面预览",
      pools: "商品池",
      rules: "规则与 QA",
    },
    previewModesLabel: "页面预览方式",
    previewModes: {
      distribution: "商品分布",
      page: "页面预览",
    },
    generatedPlan: "已生成中文页面方案",
    selectedPlan: "已完成中文选品与模块分配",
    sourceLink: "查看 Yami 来源 ↗",
    visibleModules: "显示模块",
    assetMode: "图片模式",
    sourceImages: "来源商品图",
  },
} as const;
const PREVIEW_COPY = {
  en: {
    ready: "Topic page generator",
    headline: <>From keyword to a{" "}<br />reviewable topic page</>,
    description: "Start with intent analysis and product selection, then generate the title, description, and product imagery.",
    blueprintLabel: "Planned Topic Landing Page modules",
    hero: "Theme Hero",
    categories: "Featured categories",
    startHere: "Start here",
    popular: "Popular picks",
    explore: "Explore more",
    running: "Run in progress",
    building: (keyword: string) => `Building “${keyword}”`,
    selecting: (keyword: string) => `Selecting products for “${keyword}”`,
    loadingSteps: [
      "Searching the Yami United States catalog",
      "Running the selected versioned product strategy",
      "Assigning products to eligible modules",
      "Reviewing the final Hero composition with the Agent",
      "Composing copy and page preview",
    ],
    blocked: "RUN BLOCKED",
    errorTitle: "Yami search could not be converted into a page plan.",
    contentBlocked: "COPY OPTIMIZATION INCOMPLETE",
    contentErrorTitle: "Copy optimization could not be completed.",
    genericErrorTitle: "Page generation could not be completed.",
    sourceLink: "Open the source search ↗",
  },
  zh: {
    ready: "主题页生成器",
    headline: <>从主题词到<br />可审阅的主题页</>,
    description: "先完成主题识别与选品，再生成标题、描述和商品图片。",
    blueprintLabel: "规划中的 Topic Landing Page 模块",
    hero: "主题 Hero",
    categories: "精选分类",
    startHere: "从这里开始",
    popular: "热门精选",
    explore: "探索更多",
    running: "正在生成",
    building: (keyword: string) => `正在生成“${keyword}”`,
    selecting: (keyword: string) => `正在为“${keyword}”选品`,
    loadingSteps: [
      "搜索 Yami 美国站商品目录",
      "执行所选的版本化选品策略",
      "将商品分配给符合条件的模块",
      "由 Agent 复核最终 Hero 组合",
      "生成文案与页面预览",
    ],
    blocked: "生成已阻止",
    errorTitle: "Yami 搜索结果无法转换为页面方案。",
    contentBlocked: "文案优化未完成",
    contentErrorTitle: "文案优化未能完成。",
    genericErrorTitle: "页面生成未能完成。",
    sourceLink: "打开来源搜索 ↗",
  },
} satisfies Record<ContentLanguage, {
  ready: string;
  headline: ReactNode;
  description: string;
  blueprintLabel: string;
  hero: string;
  categories: string;
  startHere: string;
  popular: string;
  explore: string;
  running: string;
  building(keyword: string): string;
  selecting(keyword: string): string;
  loadingSteps: string[];
  blocked: string;
  errorTitle: string;
  contentBlocked: string;
  contentErrorTitle: string;
  genericErrorTitle: string;
  sourceLink: string;
}>;

type ProductCardProduct = Pick<
  TopicProduct,
  | "id"
  | "title"
  | "brand"
  | "price"
  | "imageUrl"
  | "productUrl"
  | "sourceRank"
  | "weeklySalesLabel"
  | "availability"
>;

function formatWeeklySalesLabel(label: string, language: ContentLanguage) {
  const quantity = label.replace(/\s+Sold$/i, "");
  return language === "zh" ? `周销量 ${quantity}` : `Weekly sales ${quantity}`;
}

function ProductCard({
  product,
  showCatalogMeta = false,
  uiLanguage = "zh",
  selectionProductId,
  hideImage = false,
}: {
  product: ProductCardProduct;
  showCatalogMeta?: boolean;
  uiLanguage?: ContentLanguage;
  selectionProductId?: string;
  hideImage?: boolean;
}) {
  return (
    <a
      className={`${styles.productCard} ${
        product.availability === "out-of-stock" ? styles.productCardOutOfStock : ""
      }`}
      href={product.productUrl}
      target="_blank"
      rel="noreferrer"
      data-selection-product-id={selectionProductId}
    >
      {!hideImage && <span className={styles.productImageWrap}>
        <img
          src={product.imageUrl}
          alt={product.title}
          width={750}
          height={750}
          loading="lazy"
        />
        <span className={styles.productImageBadges}>
          <span className={styles.rank}>#{product.sourceRank}</span>
          {showCatalogMeta && product.availability === "out-of-stock" && (
            <span className={styles.outOfStockBadge}>缺货</span>
          )}
        </span>
      </span>}
      <span className={styles.productMeta}>
        <span className={styles.productMetaHeader}>
          <span className={styles.productBrand}>{product.brand}</span>
          {showCatalogMeta && product.weeklySalesLabel && (
            <span className={styles.productSales}>
              <small>{formatWeeklySalesLabel(product.weeklySalesLabel, uiLanguage)}</small>
            </span>
          )}
        </span>
        <strong>{product.title}</strong>
      </span>
    </a>
  );
}

function ModuleHeading({
  module,
  plan,
  structureOnly = false,
}: {
  module: TopicModulePlan;
  plan: TopicPagePlan;
  structureOnly?: boolean;
}) {
  return (
    <header className={styles.moduleHeading}>
      <div>
        <span>{structureOnly ? module.id : module.label}</span>
        <h3>{selectionModuleTitle(plan, module)}</h3>
      </div>
      {!structureOnly && <p>{module.description}</p>}
    </header>
  );
}

function EmptyState({ language }: { language: ContentLanguage }) {
  const copy = PREVIEW_COPY[language];

  return (
    <section className={styles.emptyState} lang={language === "zh" ? "zh-CN" : "en"}>
      <div className={styles.emptyCopy}>
        <span className={styles.kicker}>{copy.ready}</span>
        <h2>{copy.headline}</h2>
        <p>{copy.description}</p>
      </div>
      <div className={styles.blueprint} aria-label={copy.blueprintLabel}>
        <div className={styles.blueprintHero}>
          <span>{copy.hero}</span>
          <i /><i /><i />
        </div>
        <div className={styles.blueprintRail}>
          <span>{copy.categories}</span>
          <b /><b /><b /><b />
        </div>
        <div className={styles.blueprintRail}>
          <span>{copy.startHere}</span>
          <b /><b /><b /><b />
        </div>
        <div className={styles.blueprintProducts}>
          <span>{copy.popular}</span>
          <b /><b /><b /><b />
        </div>
        <div className={styles.blueprintFooter}>{copy.explore}</div>
      </div>
    </section>
  );
}

function LoadingState({
  keyword,
  language,
  mode,
  strategy,
}: {
  keyword: string;
  language: ContentLanguage;
  mode: CapabilityMode;
  strategy: ProductSelectionStrategy;
}) {
  const copy = PREVIEW_COPY[language];
  const categoryRoleSteps = language === "zh"
    ? [
        "加载并校验完整分类目录",
        "请求 Product Agent 提交分类角色提案",
        "执行 10 次分类检索和 1 次发现检索",
        "请求 Product Agent 提交购物场景提案",
        "确定性分配模块并执行全局去重",
        "由 Page Merchandising Agent 复核最终 Hero 组合",
      ]
    : [
        "Load and validate the complete taxonomy",
        "Request the category-role proposal from the Product Agent",
        "Run ten category queries and one discovery query",
        "Request the shopping-scene proposal from the Product Agent",
        "Allocate modules and deduplicate deterministically",
        "Review the final Hero composition with the Page Merchandising Agent",
      ];
  const steps = strategy === "category-role" ? categoryRoleSteps : copy.loadingSteps;
  const capabilitySteps = language === "zh"
    ? {
        content: ["读取冻结的 PagePlan 与商品证据", "由页面文案 Agent 生成并校验 ContentSpec"],
        visual: ["读取已通过校验的 ContentSpec", "由场景视觉 Agent 生成图片并装配预览"],
      }
    : {
        content: ["Read the frozen PagePlan and product evidence", "Generate and validate ContentSpec with the Content Agent"],
        visual: ["Read the validated ContentSpec", "Generate imagery and assemble the preview with the Visual Agent"],
      };
  const visibleSteps = mode === "content" || mode === "visual"
    ? capabilitySteps[mode]
    : mode === "selection"
      ? strategy === "category-role" ? categoryRoleSteps : copy.loadingSteps.slice(0, 4)
      : steps;
  const heading = mode === "selection"
    ? copy.selecting(keyword)
    : mode === "content"
      ? language === "zh" ? `正在为“${keyword}”生成文案` : `Generating copy for “${keyword}”`
      : mode === "visual"
        ? language === "zh" ? `正在为“${keyword}”生成图片` : `Generating images for “${keyword}”`
        : copy.building(keyword);

  return (
    <section className={styles.loadingState} aria-live="polite">
      <div className={styles.loadingMark}><span /></div>
      <span className={styles.kicker}>{copy.running}</span>
      <h2>{heading}</h2>
      <ol>
        {visibleSteps.map((step, index) => (
          <li key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span> {step}
          </li>
        ))}
      </ol>
    </section>
  );
}

const CATEGORY_RUNTIME_STAGE_LABELS = {
  en: {
    taxonomy: "Taxonomy",
    "category-proposal": "Category proposal",
    "candidate-retrieval": "Candidate retrieval",
    "scene-proposal": "Scene proposal",
    selection: "Selection result",
  },
  zh: {
    taxonomy: "分类目录",
    "category-proposal": "分类角色提案",
    "candidate-retrieval": "候选商品召回",
    "scene-proposal": "购物场景提案",
    selection: "选品结果",
  },
} as const;

function CategoryRoleRuntimePanel({
  evidence,
  language,
}: {
  evidence: CategoryRoleRuntimeEvidence;
  language: ContentLanguage;
}) {
  const zh = language === "zh";
  const statusLabel = (status: CategoryRoleRuntimeEvidence["stages"][number]["status"]) =>
    status === "completed"
      ? zh ? "已完成" : "Completed"
      : status === "blocked"
        ? zh ? "已阻止" : "Blocked"
        : zh ? "等待中" : "Pending";
  return (
    <section
      className={styles.categoryRuntime}
      aria-label={zh ? "分类角色运行证据" : "Category-role runtime evidence"}
    >
      <header>
        <div>
          <span>ProductSelection Runtime</span>
          <h4>{zh ? "本次分类角色运行" : "Category-role run"}</h4>
        </div>
        <strong>
          {evidence.mode === "automatic"
            ? zh ? "自动 Agent" : "Automatic Agent"
            : zh ? "可恢复运行" : "Resumable run"}
        </strong>
      </header>
      <dl className={styles.categoryRuntimeFacts}>
        <div>
          <dt>Taxonomy</dt>
          <dd>{evidence.taxonomy.status === "ready"
            ? zh
              ? `${evidence.taxonomy.categoryCount} 个分类`
              : `${evidence.taxonomy.categoryCount} categories`
            : zh ? "未配置" : "Not configured"}</dd>
        </div>
        <div>
          <dt>Agent</dt>
          <dd>{evidence.agent.status === "ready"
            ? evidence.agent.id
            : zh ? "未配置" : "Not configured"}</dd>
        </div>
        <div>
          <dt>{zh ? "目录请求" : "Catalog requests"}</dt>
          <dd>{evidence.candidateAttempts
            ? `${evidence.candidateAttempts.succeeded} / ${evidence.candidateAttempts.total}`
            : "—"}</dd>
        </div>
        <div>
          <dt>{zh ? "角色配比" : "Role distribution"}</dt>
          <dd>{evidence.categoryRoleDistribution
            ? `${evidence.categoryRoleDistribution.core} : ${evidence.categoryRoleDistribution.pairing} : ${evidence.categoryRoleDistribution.accessory}`
            : "—"}</dd>
        </div>
      </dl>
      <ol className={styles.categoryRuntimeStages}>
        {evidence.stages.map((stage, index) => (
          <li key={stage.id} data-status={stage.status}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <strong>{CATEGORY_RUNTIME_STAGE_LABELS[language][stage.id]}</strong>
            <small>{statusLabel(stage.status)}</small>
          </li>
        ))}
      </ol>
      {evidence.candidateQuality && (
        <div
          className={styles.categoryRuntimeQuality}
          data-status={evidence.candidateQuality.status}
        >
          <strong>
            {zh ? "候选质量" : "Candidate quality"}：{
              evidence.candidateQuality.status === "ok"
                ? zh ? "正常" : "OK"
                : evidence.candidateQuality.status === "warning"
                  ? zh ? "需复核" : "Needs review"
                  : zh ? "异常" : "Error"
            }
          </strong>
          <span>
            {zh
              ? `${evidence.candidateQuality.issueCount} 项问题 · ${evidence.candidateQuality.lowCoverageCategories} 个低覆盖分类`
              : `${evidence.candidateQuality.issueCount} issues · ${evidence.candidateQuality.lowCoverageCategories} low-coverage categories`}
          </span>
        </div>
      )}
      {evidence.candidateQuality && evidence.candidateQuality.warnings.length > 0 && (
        <ul className={styles.categoryRuntimeWarnings}>
          {evidence.candidateQuality.warnings.map((warning) => (
            <li key={warning}>{warning}</li>
          ))}
        </ul>
      )}
      {evidence.issues.length > 0 && (
        <ul className={styles.categoryRuntimeIssues}>
          {evidence.issues.map((issue) => <li key={issue}>{issue}</li>)}
        </ul>
      )}
    </section>
  );
}

function ErrorState({
  error,
  language,
}: {
  error: GeneratorError;
  language: ContentLanguage;
}) {
  const copy = PREVIEW_COPY[language];
  const contentError = error.code?.startsWith("content_") === true ||
    error.code === "missing_content_spec";
  const catalogError = error.code === "catalog_unavailable" ||
    error.code === "candidate_catalog_unavailable" ||
    error.code === "product_agent_unavailable";

  return (
    <section className={styles.errorState} role="alert">
      <span className={styles.errorCode}>
        {contentError ? copy.contentBlocked : copy.blocked}
      </span>
      <h2>
        {contentError
          ? copy.contentErrorTitle
          : catalogError
            ? copy.errorTitle
            : copy.genericErrorTitle}
      </h2>
      <p>{error.message}</p>
      {error.sourceUrl && (
        <a href={error.sourceUrl} target="_blank" rel="noreferrer">
          {copy.sourceLink}
        </a>
      )}
    </section>
  );
}

function selectionRunError(
  run: ProductSelectionRun | undefined,
  language: ContentLanguage,
): GeneratorError | null {
  if (!run || run.status === "ready") return null;
  if (run.status === "blocked") return { message: run.issues.join(" ") };
  const zh = language === "zh";
  if (run.status === "needs-category-proposal") {
    return {
      message: zh
        ? "taxonomy 已验证，等待 Product Agent 提交 CategoryRoleProposal。"
        : "The taxonomy is verified; a CategoryRoleProposal from the Product Agent is required.",
    };
  }
  if (run.status === "needs-candidate-snapshot") {
    return {
      message: zh
        ? "分类提案已通过，等待目录适配器生成 CatalogCandidateSnapshot。"
        : "The category proposal is accepted; a CatalogCandidateSnapshot is required.",
    };
  }
  return {
    message: zh
      ? "候选商品已冻结，等待 Product Agent 提交 SceneProposal。"
      : "Candidate products are frozen; a SceneProposal from the Product Agent is required.",
  };
}

function PreviewView({
  plan,
  heroSelection,
  shortcutSelection,
  startHereSelection,
}: {
  plan: TopicPagePlan;
  heroSelection?: HeroSelectionRun | null;
  shortcutSelection?: ShortcutSelectionRun | null;
  startHereSelection?: StartHereSelectionRun | null;
}) {
  const [requestedPopularGroupId, setRequestedPopularGroupId] = useState<string | null>(null);
  const [requestedExploreGroupId, setRequestedExploreGroupId] = useState<string | null>(null);
  const [collapsedStartHereGroupIds, setCollapsedStartHereGroupIds] = useState<Set<string>>(
    () => new Set(),
  );
  const productMap = useMemo(
    () => new Map(plan.products.map((product) => [product.id, product])),
    [plan.products],
  );
  const moduleMap = useMemo(
    () => new Map(plan.modules.map((module) => [module.id, module])),
    [plan.modules],
  );
  const productsFor = (moduleId: TopicModulePlan["id"]) =>
    (moduleMap.get(moduleId)?.productIds ?? [])
      .map((id) => productMap.get(id))
      .filter((product): product is TopicProduct => Boolean(product));
  const heroModule = moduleMap.get("hero");
  const heroProductIds = heroSelection?.productIds.length
    ? heroSelection.productIds
    : heroModule?.productIds ?? [];
  const heroProducts = heroProductIds
    .map((id) => productMap.get(id))
    .filter((product): product is TopicProduct => Boolean(product));
  const shortcutModule = moduleMap.get("shortcuts");
  const startHereModule = moduleMap.get("start-here");
  const popularModule = moduleMap.get("popular-picks");
  const brandModule = moduleMap.get("brand-spotlight");
  const exploreModule = moduleMap.get("explore-more");
  const brandGroups = brandModule?.groups ?? [];
  const shortcutProductIds = new Set(shortcutModule?.productIds ?? []);
  const shortcutGroups = shortcutModule?.groups ?? plan.groups.filter((group) =>
    group.productIds.some((id) => shortcutProductIds.has(id)),
  );
  const shortcutAssignmentsByGroupId = new Map(
    (shortcutSelection?.assignments ?? []).map((assignment) => [assignment.groupId, assignment]),
  );
  const startHereProductIds = new Set(startHereModule?.productIds ?? []);
  const reviewedStartHereGroups = startHereSelection?.status === "ready"
    ? startHereSelection.scenes.map((scene) => ({
        id: scene.id,
        label: scene.label,
        role: "core" as const,
        productIds: [...scene.productIds],
        shoppingGoal: scene.shoppingGoal,
        scenarioReason: scene.reason,
        semanticSource: "agent-reviewed" as const,
        ...(scene.sourceCategoryIds
          ? { sourceCategoryIds: [...scene.sourceCategoryIds] }
          : {}),
      }))
    : null;
  const startHereGroups = reviewedStartHereGroups ?? startHereModule?.groups ??
    plan.groups.flatMap((group) => {
      const productIds = group.productIds.filter((id) => startHereProductIds.has(id));
      return productIds.length > 0 ? [{ ...group, productIds }] : [];
    });
  const exploreProductIds = new Set(exploreModule?.productIds ?? []);
  const fallbackPopularProductIds = (popularModule?.productIds ?? []).slice(0, 12);
  const popularGroups = popularModule?.groups ?? (
    fallbackPopularProductIds.length >= 6
      ? [{
          id: "popular-picks-all",
          label: plan.language === "zh" ? "全部" : "All",
          role: "core" as const,
          productIds: fallbackPopularProductIds,
        }]
      : []
  );
  const activePopularGroupId = popularGroups.some(({ id }) => id === requestedPopularGroupId)
    ? requestedPopularGroupId
    : popularGroups[0]?.id ?? null;
  const exploreGroups = exploreModule?.groups ?? plan.groups.flatMap((group) => {
    const productIds = group.productIds.filter((id) => exploreProductIds.has(id));
    return productIds.length > 0 ? [{ ...group, productIds }] : [];
  });
  const activeExploreGroupId = exploreGroups.some(({ id }) => id === requestedExploreGroupId)
    ? requestedExploreGroupId
    : exploreGroups[0]?.id ?? null;
  const dominantShortcutGroup = shortcutGroups.length > 1
    ? shortcutGroups.reduce((largest, group) =>
        group.productIds.length > largest.productIds.length ? group : largest
      )
    : undefined;
  const shortcutPrimaryCount = plan.pools.primaryIds.length;
  const shortcutNeedsBalanceReview = Boolean(
    dominantShortcutGroup && shortcutPrimaryCount > 0 &&
    dominantShortcutGroup.productIds.length / shortcutPrimaryCount >= 0.4,
  );
  return (
    <div className={styles.pagePreview} data-preview-mode={plan.generationMode}>
      <section className={styles.topicHero}>
        <div className={styles.heroCopy}>
          <span>HERO · {plan.language === "zh" ? "商品分布" : "Product distribution"}</span>
          <h1>{selectionDefaultCopy(plan.keyword, plan.language).heroTitle}</h1>
          <p aria-live="polite">
            {plan.language === "zh"
              ? heroSelection?.status === "ready"
                ? `Hero 选品完成 · ${heroProducts.length} 件商品；Page Merchandising Agent 已复核组合，文案与场景图将在生成页面时完成。`
                : heroSelection?.status === "fallback"
                  ? `Hero 规则预选 · ${heroProducts.length} 件商品；Agent 复核暂不可用，当前结果仅作为明确降级。`
                  : `Hero 预选 · ${heroProducts.length} 件商品；正式组合复核尚未完成，文案与场景图未生成。`
              : heroSelection?.status === "ready"
                ? `Hero selection complete · ${heroProducts.length} products; the Page Merchandising Agent reviewed the composition. Copy and scene imagery are created during page generation.`
                : heroSelection?.status === "fallback"
                  ? `Rule-based Hero selection · ${heroProducts.length} products; Agent review is unavailable, so this result is an explicit fallback.`
                  : `Hero preselection · ${heroProducts.length} products; formal composition review is still required, and copy and scene imagery are not generated.`}
          </p>
        </div>
        <div className={styles.heroProducts}>
          {heroProducts.map((product, index) => {
            const reason = heroSelection?.productReasons[product.id] ??
              heroModule?.productReasons?.[product.id] ?? product.selectionReason;
            return (
              <a
                key={product.id}
                href={product.productUrl}
                target="_blank"
                rel="noreferrer"
                title={`${product.title} — ${reason}`}
              >
                <img
                  src={product.imageUrl}
                  alt={product.title}
                  width={750}
                  height={750}
                />
                <div className={styles.heroProductMeta}>
                  <span>{String(index + 1).padStart(2, "0")} · {product.brand}</span>
                  <small>{reason}</small>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {shortcutModule?.visible && (
        <section className={styles.previewModule}>
          <ModuleHeading module={shortcutModule} plan={plan} structureOnly />
          <div className={styles.shortcutSelectionStatus} aria-live="polite">
            <span>
              {plan.language === "zh"
                ? shortcutSelection?.status === "ready"
                  ? `${shortcutGroups.length} 个分类入口已按主题语义与商品归属生成；${shortcutSelection.assignments.length} 件代表商品已由 Page Merchandising Agent 复核。`
                  : shortcutSelection?.status === "fallback"
                    ? `已按目录规则生成 ${shortcutGroups.length} 个分类入口；代表商品暂未完成 Agent 复核。`
                    : `${shortcutGroups.length} 个分类入口已按主题语义与商品归属生成；代表商品等待 Page Merchandising Agent 复核。`
                : shortcutSelection?.status === "ready"
                  ? `${shortcutGroups.length} category shortcuts were generated from theme semantics and product membership; the Page Merchandising Agent reviewed ${shortcutSelection.assignments.length} representatives.`
                  : shortcutSelection?.status === "fallback"
                    ? `${shortcutGroups.length} category shortcuts were generated from catalog rules; Agent review of representatives is unavailable.`
                    : `${shortcutGroups.length} category shortcuts were generated from theme semantics and product membership; representative review by the Page Merchandising Agent is pending.`}
            </span>
            {shortcutNeedsBalanceReview && dominantShortcutGroup ? (
              <span>
                {plan.language === "zh"
                  ? `“${dominantShortcutGroup.label}”覆盖 ${dominantShortcutGroup.productIds.length}/${shortcutPrimaryCount} 件商品，分类范围较宽，建议复核是否存在可验证子分类。`
                  : `“${dominantShortcutGroup.label}” covers ${dominantShortcutGroup.productIds.length}/${shortcutPrimaryCount} products and is broad; review whether verified subcategories support a finer split.`}
              </span>
            ) : null}
          </div>
          <div className={styles.shortcutGrid}>
            {shortcutGroups.map((group) => {
              const assignment = shortcutAssignmentsByGroupId.get(group.id);
              const product = productMap.get(assignment?.productId ?? group.productIds[0]);
              const classificationReason = group.classificationReason ?? (
                group.sourceCategoryIds?.length === 0
                  ? plan.language === "zh"
                    ? "收录暂无可验证目录叶子分类的商品。"
                    : "Collects products without a verified catalog leaf category."
                  : group.sourceCategoryIds?.length === 1
                    ? plan.language === "zh"
                      ? "对应一个已验证的 Yami 目录叶子分类。"
                      : "Maps to one verified Yami catalog leaf category."
                    : plan.language === "zh"
                      ? "根据主题购物心智整合多个已验证的 Yami 目录分类。"
                      : "Combines verified Yami catalog categories around one theme shopping intent."
              );
              if (!product) return null;
              return (
                <a
                  key={group.id}
                  href="#explore-more"
                  className={styles.shortcutCard}
                  data-shortcut-group={group.id}
                  onClick={() => setRequestedExploreGroupId(group.id)}
                >
                  <img src={product.imageUrl} alt="" width={750} height={750} loading="lazy" />
                  <span>
                    <strong>{group.label}</strong>
                    {productCountLabel(group.productIds.length, plan.language)}
                    {classificationReason
                      ? <small>{classificationReason}</small>
                      : assignment?.selectionReason
                        ? <small>{assignment.selectionReason}</small>
                        : null}
                  </span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {startHereModule?.visible && (
        <section className={styles.previewModule}>
          <ModuleHeading module={startHereModule} plan={plan} structureOnly />
          <div className={styles.startHereSelectionStatus} aria-live="polite">
            {plan.language === "zh"
              ? startHereSelection?.status === "ready"
                ? `${startHereGroups.length} 个场景及商品组合已由 Page Merchandising Agent 正式复核。`
                : `${startHereGroups.length} 个场景按目录规则生成；正式场景复核尚未完成。`
              : startHereSelection?.status === "ready"
                ? `${startHereGroups.length} scenes and product compositions were formally reviewed by the Page Merchandising Agent.`
                : `${startHereGroups.length} scenes were generated from catalog rules; formal scene review is pending.`}
          </div>
          <div className={styles.startHereThemes}>
            {startHereGroups.map((group, index) => {
              const collapsed = collapsedStartHereGroupIds.has(group.id);
              const productsId = `start-here-products-${index + 1}`;
              return (
                <section
                  key={group.id}
                  className={styles.startHereTheme}
                  data-start-here-theme={group.id}
                >
                  <header>
                    <div className={styles.startHereThemeHeading}>
                      <span>
                        {plan.language === "zh" ? "主题" : "Theme"}{" "}
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h4>{group.label}</h4>
                    </div>
                    <small>{productCountLabel(group.productIds.length, plan.language)}</small>
                    <WorkbenchButton
                      className={styles.startHereThemeToggle}
                      aria-controls={productsId}
                      aria-expanded={!collapsed}
                      onClick={() => setCollapsedStartHereGroupIds((current) => {
                        const next = new Set(current);
                        if (next.has(group.id)) next.delete(group.id);
                        else next.add(group.id);
                        return next;
                      })}
                    >
                      {plan.language === "zh"
                        ? collapsed ? "展开商品" : "收起商品"
                        : collapsed ? "Show products" : "Hide products"}
                    </WorkbenchButton>
                  </header>
                  {group.shoppingGoal || group.scenarioReason ? (
                    <div className={styles.startHereThemeContext}>
                      {group.shoppingGoal && group.shoppingGoal !== group.label
                        ? <p>{group.shoppingGoal}</p>
                        : null}
                      {group.scenarioReason ? <small>{group.scenarioReason}</small> : null}
                    </div>
                  ) : null}
                  <div
                    id={productsId}
                    className={styles.startHereThemeProducts}
                    data-start-here-products={group.id}
                    hidden={collapsed}
                  >
                    {group.productIds.map((id) => {
                      const product = productMap.get(id);
                      return product ? <ProductCard key={id} product={product} /> : null;
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      )}

      {popularModule?.visible && activePopularGroupId && (
        <section id="popular-picks" className={styles.previewModule}>
          <ModuleHeading module={popularModule} plan={plan} structureOnly />
          <WorkbenchTabs
            label={plan.language === "zh" ? "热门精选分类" : "Popular Picks categories"}
            options={popularGroups.map((group) => ({
              value: group.id,
              label: group.label,
              meta: itemCountLabel(group.productIds.length, plan.language),
            }))}
            value={activePopularGroupId}
            onValueChange={setRequestedPopularGroupId}
          >
            {popularGroups.map((group) => (
              <WorkbenchTabPanel
                key={group.id}
                className={styles.recommendationPanel}
                value={group.id}
              >
                <div className={styles.productGrid}>
                  {group.productIds.map((id) => {
                    const product = productMap.get(id);
                    return product ? <ProductCard key={id} product={product} /> : null;
                  })}
                </div>
              </WorkbenchTabPanel>
            ))}
          </WorkbenchTabs>
        </section>
      )}

      {brandModule?.visible && (
        <section className={`${styles.previewModule} ${styles.brandModule}`}>
          <ModuleHeading module={brandModule} plan={plan} structureOnly />
          {brandGroups.length > 0 ? (
            <div className={styles.brandGroups}>
              {brandGroups.map((group) => (
                <section key={group.id} className={styles.brandGroup}>
                  <header className={styles.brandGroupHeading}>
                    <h4>{group.label}</h4>
                    <span>{itemCountLabel(group.productIds.length, plan.language)}</span>
                  </header>
                  <div className={styles.brandProducts}>
                    {group.productIds.map((id) => {
                      const product = productMap.get(id);
                      return product ? <ProductCard key={id} product={product} /> : null;
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className={styles.brandProducts}>
              {productsFor("brand-spotlight").map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      )}

      {exploreModule?.visible && (
        <section
          id="explore-more"
          className={`${styles.previewModule} ${styles.recommendationModule}`}
        >
          <ModuleHeading module={exploreModule} plan={plan} structureOnly />
          {activeExploreGroupId && (
            <WorkbenchTabs
              label={plan.language === "zh" ? "综合推荐分类" : "Recommendation categories"}
              options={exploreGroups.map((group) => ({
                value: group.id,
                label: group.label,
                meta: itemCountLabel(group.productIds.length, plan.language),
              }))}
              value={activeExploreGroupId}
              onValueChange={setRequestedExploreGroupId}
            >
              {exploreGroups.map((group) => (
                <WorkbenchTabPanel
                  key={group.id}
                  className={styles.recommendationPanel}
                  value={group.id}
                >
                  <div className={styles.exploreRow}>
                    {group.productIds.map((id) => {
                      const product = productMap.get(id);
                      return product ? <ProductCard key={id} product={product} /> : null;
                    })}
                  </div>
                </WorkbenchTabPanel>
              ))}
            </WorkbenchTabs>
          )}
        </section>
      )}
    </div>
  );
}

function SelectionPagePreview({ plan }: { plan: TopicPagePlan }) {
  const productMap = new Map(plan.products.map((product) => [product.id, product]));
  return (
    <div
      className={styles.pagePreview}
      data-selection-page-preview="true"
      data-preview-mode={plan.generationMode}
    >
      {plan.modules.filter(({ visible }) => visible).map((module) => {
        const hideProductImages = module.id === "hero" || module.id === "shortcuts";
        return (
          <section
            key={module.id}
            className={module.id === "hero" ? styles.topicHero : styles.previewModule}
            data-selection-preview-module={module.id}
          >
            <ModuleHeading module={module} plan={plan} />
            <div className={styles.productGrid}>
              {module.productIds.flatMap((productId) => {
                const product = productMap.get(productId);
                return product
                  ? [(
                      <ProductCard
                        key={productId}
                        product={product}
                        uiLanguage={plan.language}
                        selectionProductId={productId}
                        hideImage={hideProductImages}
                      />
                    )]
                  : [];
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function generatedProductsForScene(
  module: TopicPageGenerationModule,
  productIds: readonly string[],
) {
  const ids = new Set(productIds);
  return module.products.filter((product) => ids.has(product.id));
}

function GeneratedProductGrid({
  products,
  compact = false,
}: {
  products: TopicPageGeneratedProduct[];
  compact?: boolean;
}) {
  return (
    <div className={compact ? styles.productGridCompact : styles.productGrid}>
      {products.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}

function PageGenerationPreview({ spec }: { spec: TopicPageGenerationSpec }) {
  const hero = spec.modules.find(({ component }) => component === "ThemeHero");
  const remainingModules = spec.modules.filter(({ id }) => id !== hero?.id);
  const heroAsset = hero?.assets[0];

  return (
    <div className={styles.pagePreview} data-generation-spec={spec.digest}>
      {hero && (
        <section
          className={`${styles.topicHero} ${styles.generatedHero}`}
          style={{ backgroundColor: heroAsset?.backgroundColor }}
        >
          <div className={styles.heroCopy}>
            <span>{spec.keyword}</span>
            <h1>{hero.copy.title.text}</h1>
            {hero.copy.description && <p>{hero.copy.description.text}</p>}
            {hero.copy.tags && (
              <ul>{hero.copy.tags.map((tag) => <li key={tag.text}>{tag.text}</li>)}</ul>
            )}
          </div>
          <div className={styles.generatedHeroVisual}>
            {heroAsset && (
              <img
                src={heroAsset.url}
                alt={heroAsset.altText?.text ?? ""}
                width={heroAsset.width}
                height={heroAsset.height}
              />
            )}
            <div className={styles.generatedHeroProducts}>
              {hero.products.map((product) => (
                <a key={product.id} href={product.productUrl} target="_blank" rel="noreferrer">
                  <img src={product.imageUrl} alt={product.title} width={160} height={160} />
                  <span>{product.brand}</span>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {remainingModules.map((module) => {
        if (module.component === "ShortcutRail") {
          return (
            <section key={module.id} className={styles.previewModule}>
              <header className={styles.moduleHeading}>
                <div><span>ShortcutRail</span><h3>{module.copy.title.text}</h3></div>
              </header>
              <div className={styles.shortcutGrid}>
                {module.products.map((product, index) => {
                  const asset = module.assets[index];
                  const label = module.copy.items?.find(
                    ({ slotId }) => slotId === `${module.id}-${index + 1}`,
                  )?.label.text ?? product.title;
                  return (
                    <a key={`${module.id}-${index}`} href={product.productUrl} target="_blank" rel="noreferrer">
                      <img
                        src={asset?.url ?? product.imageUrl}
                        alt={asset?.altText?.text ?? ""}
                        width={asset?.width ?? 750}
                        height={asset?.height ?? 750}
                      />
                      <span><strong>{label}</strong>{product.brand}</span>
                    </a>
                  );
                })}
              </div>
            </section>
          );
        }
        if (module.component === "ThemeProductList") {
          return (
            <section key={module.id} className={styles.previewModule}>
              <header className={styles.moduleHeading}>
                <div><span>ThemeProductList</span><h3>{module.copy.title.text}</h3></div>
              </header>
              <div className={styles.generatedScenes}>
                {module.scenes.map((scene, index) => {
                  const sceneCopy = module.copy.scenes?.find(({ sceneId }) => sceneId === scene.id);
                  const asset = module.assets[index];
                  return (
                    <article key={scene.id} className={styles.generatedScene}>
                      {asset && (
                        <img
                          src={asset.url}
                          alt={asset.altText?.text ?? ""}
                          width={asset.width}
                          height={asset.height}
                        />
                      )}
                      <div>
                        <span>{sceneCopy?.label.text ?? scene.shoppingGoal}</span>
                        <h4>{sceneCopy?.title.text ?? scene.shoppingGoal}</h4>
                        {sceneCopy?.description && <p>{sceneCopy.description.text}</p>}
                      </div>
                      <GeneratedProductGrid
                        products={generatedProductsForScene(module, scene.productIds)}
                        compact
                      />
                    </article>
                  );
                })}
              </div>
            </section>
          );
        }
        if (module.component === "BrandProductRail") {
          return (
            <section key={module.id} className={`${styles.previewModule} ${styles.brandModule}`}>
              <header className={styles.moduleHeading}>
                <div><span>BrandProductRail</span><h3>{module.copy.title.text}</h3></div>
              </header>
              {module.assets.length > 0 && (
                <div className={styles.generatedBrandAssets}>
                  {module.assets.map((asset) => (
                    <img
                      key={asset.taskId}
                      src={asset.url}
                      alt={asset.altText?.text ?? ""}
                      width={asset.width}
                      height={asset.height}
                    />
                  ))}
                </div>
              )}
              <GeneratedProductGrid products={module.products} compact />
            </section>
          );
        }
        return (
          <section key={module.id} className={styles.previewModule}>
            <header className={styles.moduleHeading}>
              <div><span>{module.component}</span><h3>{module.copy.title.text}</h3></div>
              {module.copy.description && <p>{module.copy.description.text}</p>}
            </header>
            <GeneratedProductGrid products={module.products} />
          </section>
        );
      })}
    </div>
  );
}

function PoolsView({
  plan,
  uiLanguage,
}: {
  plan: TopicPagePlan;
  uiLanguage: ContentLanguage;
}) {
  const zh = uiLanguage === "zh";
  const categoryRole = plan.selectionStrategy.id === "category-role";
  const primary = plan.products.filter((product) => product.pool === "primary");
  const related = plan.products.filter((product) => product.pool === "related");
  const coverage = plan.catalogCoverage;
  const refinement = plan.catalogRefinement;
  const [collapsedCoverageGroups, setCollapsedCoverageGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const primaryDescription = categoryRole
    ? zh ? "按分类角色选择，用于模块分配" : "selected by category role for module assignment"
    : zh ? "可用于核心模块" : "eligible for core modules";
  const relatedSelectionReason = zh
    ? "未进入主商品池的 Yami 相关候选，保留原始搜索顺序。"
    : "Related Yami candidates outside the primary pool, preserving original search order.";
  const refinementLabel = refinement?.status === "complete"
    ? zh ? "目录召回完成" : "Catalog retrieval complete"
    : refinement?.status === "fallback"
    ? zh ? "品牌页不可用，已使用结构化目录完整分页" : "Brand page unavailable; using complete structured-catalog pagination"
    : refinement?.status === "partial"
    ? zh
      ? `目录召回部分完成（${refinement.completedKeys.length}/${refinement.requestedKeys.length}）`
      : `Catalog retrieval partial (${refinement.completedKeys.length}/${refinement.requestedKeys.length})`
    : null;

  function toggleCoverageGroup(groupId: string) {
    setCollapsedCoverageGroups((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }

  if (coverage) {
    const groupConfigs = [
      {
        id: "yami-in-stock",
        sellerKind: "yami" as const,
        availability: "in-stock" as const,
        label: zh ? "YAMI 自营 · 在售" : "Sold by YAMI · In stock",
        description: zh ? "可进入选品与页面模块。" : "Eligible for selection and page modules.",
      },
      {
        id: "yami-out-of-stock",
        sellerKind: "yami" as const,
        availability: "out-of-stock" as const,
        label: zh ? "YAMI 自营 · 缺货" : "Sold by YAMI · Out of stock",
        description: zh ? "仅作目录审计，不进入页面模块。" : "Catalog audit only; excluded from page modules.",
      },
      {
        id: "third-party-in-stock",
        sellerKind: "third-party" as const,
        availability: "in-stock" as const,
        label: zh ? "第三方商家 · 在售" : "Marketplace · In stock",
        description: zh ? "可进入选品与页面模块。" : "Eligible for selection and page modules.",
      },
      {
        id: "third-party-out-of-stock",
        sellerKind: "third-party" as const,
        availability: "out-of-stock" as const,
        label: zh ? "第三方商家 · 缺货" : "Marketplace · Out of stock",
        description: zh ? "仅作目录审计，不进入页面模块。" : "Catalog audit only; excluded from page modules.",
      },
    ];

    return (
      <div className={`${styles.poolView} ${styles.catalogCoverageView}`}>
        <header className={`${styles.viewHeading} ${styles.catalogCoverageHeading}`}>
          <div>
            <span>03 · {zh ? "商品池" : "Product pool"}</span>
            <h3>{zh ? "目录商品总览" : "Catalog coverage"}</h3>
            <p className={styles.poolSelectionReason}>
              <strong>{zh ? "选品规则" : "Selection rule"}</strong>
              {zh
                ? "完整品牌目录按销售方与库存状态分组；只有在售商品进入选品。"
                : "The complete brand catalog is grouped by seller and availability; only in-stock items enter selection."}
            </p>
            {refinementLabel && (
              <p className={styles.poolSelectionReason}>
                <strong>{zh ? "召回状态" : "Retrieval status"}</strong>
                {refinementLabel}
              </p>
            )}
          </div>
        </header>
        {groupConfigs.map((group) => {
          const products = coverage.products.filter((product) =>
            product.sellerKind === group.sellerKind &&
            product.availability === group.availability
          );
          const collapsed = collapsedCoverageGroups.has(group.id);
          const productsId = `catalog-coverage-${group.id}-products`;
          return (
            <section key={group.id} data-catalog-coverage-group={group.id} className={styles.catalogCoverageGroup}>
              <header>
                <div>
                  <h4>{group.label}</h4>
                  <p>{group.description}</p>
                </div>
                <div className={styles.catalogCoverageGroupActions}>
                  <strong>{productCountLabel(products.length, uiLanguage)}</strong>
                  {products.length > 0 && (
                    <button
                      type="button"
                      className={styles.catalogCoverageToggle}
                      aria-expanded={!collapsed}
                      aria-controls={productsId}
                      aria-label={`${collapsed ? zh ? "展开" : "Expand" : zh ? "收起" : "Collapse"} ${group.label}`}
                      onClick={() => toggleCoverageGroup(group.id)}
                    >
                      {collapsed ? zh ? "展开" : "Expand" : zh ? "收起" : "Collapse"}
                    </button>
                  )}
                </div>
              </header>
              <div id={productsId} hidden={collapsed}>
                {products.length > 0 ? (
                  <div className={styles.poolGrid}>
                    {products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        showCatalogMeta
                        uiLanguage={uiLanguage}
                      />
                    ))}
                  </div>
                ) : (
                  <p className={styles.noRelated}>{zh ? "当前没有商品。" : "No products in this group."}</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className={styles.poolView}>
      <section>
        <header className={styles.viewHeading}>
          <div>
            <span>03 · {zh ? "商品池" : "Product pool"}</span>
            <h3>
              {categoryRole
                ? zh ? "模块商品池" : "Module product pool"
                : zh ? "主商品池" : "PrimaryPool"}
            </h3>
            <p className={styles.poolSelectionReason}>
              <strong>{zh ? "选品依据" : "Selection rationale"}</strong>
              {plan.selectionStrategy.description}
            </p>
            {refinementLabel && (
              <p className={styles.poolSelectionReason}>
                <strong>{zh ? "召回状态" : "Retrieval status"}</strong>
                {refinementLabel}
              </p>
            )}
          </div>
          <p>{productCountLabel(primary.length, uiLanguage)} · {primaryDescription}</p>
        </header>
        <div className={styles.poolGrid}>
          {primary.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      {!categoryRole && <section>
        <header className={styles.viewHeading}>
          <div>
            <span>{zh ? "仅作回退" : "Fallback only"}</span>
            <h3>{zh ? "相关商品池" : "RelatedPool"}</h3>
            <p className={styles.poolSelectionReason}>
              <strong>{zh ? "选品依据" : "Selection rationale"}</strong>
              {relatedSelectionReason}
            </p>
          </div>
          <p>{productCountLabel(related.length, uiLanguage)} · {zh ? "不用于填充核心模块" : "never used to fill core modules"}</p>
        </header>
        {related.length > 0 ? (
          <div className={styles.poolGrid}>
            {related.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className={styles.noRelated}>
            {zh ? "本次运行不需要相关候选商品。" : "No related candidates were needed for this run."}
          </p>
        )}
      </section>}
    </div>
  );
}

const AUTOMATION_STAGE_LABELS = {
  en: {
    "workflow-planning": "Workflow planning",
    "background-evidence": "Background evidence",
    "product-selection": "Product selection",
    "module-merchandising": "Module merchandising",
    "content-writing": "Content writing",
    "content-review": "Content review",
    "visual-generation": "Visual generation",
    "asset-persistence": "Asset persistence",
    "page-generation": "Page assembly",
    "automatic-qa": "Automatic QA",
    "experience-review": "Experience review",
  },
  zh: {
    "workflow-planning": "流程编排",
    "background-evidence": "品牌 / 文化背景证据",
    "product-selection": "选品",
    "module-merchandising": "模块策划与商品分配",
    "content-writing": "页面文案",
    "content-review": "文案审核",
    "visual-generation": "场景图片生成",
    "asset-persistence": "图片本体落盘",
    "page-generation": "页面确定性装配",
    "automatic-qa": "自动 QA",
    "experience-review": "体验审核",
  },
} as const;

const AUTOMATION_STAGE_NUMBERS = {
  "workflow-planning": "02",
  "background-evidence": "02",
  "product-selection": "03",
  "module-merchandising": "04",
  "content-writing": "05",
  "content-review": "05",
  "visual-generation": "05",
  "asset-persistence": "05",
  "page-generation": "05",
  "automatic-qa": "06",
  "experience-review": "07",
} as const;

function AutomationRuntimePanel({
  automation,
  language,
}: {
  automation: TopicPageAutomationRun;
  language: ContentLanguage;
}) {
  const zh = language === "zh";
  const statusLabel = (status: TopicPageAutomationRun["stages"][number]["status"]) =>
    status === "completed"
      ? zh ? "已完成" : "Completed"
      : status === "blocked"
        ? zh ? "已阻止" : "Blocked"
        : zh ? "等待中" : "Pending";
  return (
    <section className={styles.automationRuntime} aria-label={zh ? "页面自动化运行证据" : "Page automation runtime evidence"}>
      <header>
        <div>
          <span>Page Automation Runtime</span>
          <h4>{zh ? "本次落地页生成" : "Landing page run"}</h4>
        </div>
        <strong data-status={automation.status}>
          {automation.status === "ready"
            ? zh ? "等待用户 Review" : "Ready for review"
            : zh ? `阻止于 ${AUTOMATION_STAGE_LABELS.zh[automation.stage]}` : `Blocked at ${AUTOMATION_STAGE_LABELS.en[automation.stage]}`}
        </strong>
      </header>
      <ol>
        {automation.stages.map((stage) => (
          <li key={stage.id} data-status={stage.status}>
            <span>{AUTOMATION_STAGE_NUMBERS[stage.id]}</span>
            <strong>{AUTOMATION_STAGE_LABELS[language][stage.id]}</strong>
            <small>{statusLabel(stage.status)}</small>
          </li>
        ))}
      </ol>
      {automation.status === "ready" && (
        <dl>
          <div><dt>ExecutionPlan</dt><dd>{automation.executionPlan.digest.slice(0, 18)}…</dd></div>
          {automation.copyBrief && <div><dt>CopyBrief</dt><dd>{automation.copyBrief.digest.slice(0, 18)}…</dd></div>}
          {automation.contentReview && <div><dt>ContentReview</dt><dd>{automation.contentReview.verdict}</dd></div>}
          <div><dt>PageGenerationSpec</dt><dd>{automation.generationSpec.digest.slice(0, 18)}…</dd></div>
          <div><dt>QAReport</dt><dd>{automation.qaReport.status}</dd></div>
          <div><dt>ExperienceReview</dt><dd>{automation.experienceReview.status}</dd></div>
          <div><dt>ReviewPackage</dt><dd>{automation.reviewPackage.status}</dd></div>
        </dl>
      )}
      {automation.status === "blocked" && automation.issues.length > 0 && (
        <ul>{automation.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
      )}
    </section>
  );
}

function WorkflowView({
  uiLanguage,
  plan,
  categoryRoleRuntime,
  automation,
}: {
  uiLanguage: ContentLanguage;
  plan: TopicPagePlan | null;
  categoryRoleRuntime: CategoryRoleRuntimeEvidence | null;
  automation: TopicPageAutomationRun | null;
}) {
  const isChinese = uiLanguage === "zh";
  const displayIntent = plan
    ? themeIntentDisplayCopy(plan.intent, plan.keyword, uiLanguage)
    : null;
  const [workflowMode, setWorkflowMode] = useState<WorkflowMode>("diagram");
  const intentHelpDialog = useRef<HTMLDialogElement>(null);
  const steps = [
    {
      stage: "01",
      icon: WORKFLOW_ICONS.input,
      label: isChinese ? "主题与生成配置" : "Topic and generation settings",
      output: isChinese
        ? "确定本次页面生成的范围与约束"
        : "Define the scope and constraints for this page generation run",
      input: isChinese ? "关键词" : "Keyword",
      config: isChinese
        ? "美国站（固定）、页面语言（随顶部语言选择）、选品策略（用户选择）"
        : "US site (fixed), page language (follows the header language control), selection strategy (user selected)",
      action: isChinese ? "校验关键词并冻结本次生成配置" : "Validate the keyword and freeze the generation settings for this run",
      result: "GenerationBrief",
      state: "input",
    },
    {
      stage: "02",
      icon: WORKFLOW_ICONS.route,
      label: isChinese ? "理解主题并生成页面路由" : "Interpret the topic and create the page route",
      output: isChinese
        ? "基于 Yami 目录证据生成 ThemeIntent，补充品牌 / 文化背景证据，并选择已注册的页面路由"
        : "Build ThemeIntent from Yami catalog evidence, add brand or cultural background evidence, then select a registered page route",
      input: isChinese
        ? "关键词 + 站点 / 页面语言 / 选品策略约束"
        : "Keyword + site / page language / selection constraints",
      read: isChinese
        ? "keyword、site、language 与 requestedSelectionStrategy；结合 CatalogSnapshot 的品牌、分类、标签、商品和 Adapter attempts"
        : "keyword, site, language, and requestedSelectionStrategy, together with CatalogSnapshot brands, categories, tags, products, and Adapter attempts",
      action: isChinese
        ? "解析并校验主题意图，为陌生用户研究可审计背景，再从注册表生成兼容的页面执行路由"
        : "Resolve and validate the topic intent, research auditable newcomer context, then create a compatible route from registered configs",
      actionGroups: isChinese
        ? [
            {
              title: "目录证据驱动的主题理解",
              items: [
                "首次搜索读取品牌、分类、标签、可售商品与分页信息，形成 CatalogSnapshot",
                "先生成目录基线 ThemeIntent，再按已确认分类补充分页商品证据",
                "精确品牌或分类的核心实体保持冻结；歧义或证据冲突进入待确认",
                "此阶段不直接选择商品",
              ],
            },
            {
              title: "陌生用户所需的品牌 / 文化背景",
              items: [
                "品牌主题优先打开品牌官网；Wikipedia 只补充中性背景，不能替代可用官网",
                "节日和文化主题使用具名权威机构或 Wikipedia，页面内容始终按不可信外部证据处理",
                "背景事实仅用于解释身份、来源、含义、传统和术语，不能证明商品功效或流行度",
                "研究能力不可用时记录 unavailable 并继续选品，不从模型记忆补造事实",
              ],
            },
            {
              title: "系统校验并生成可执行路由",
              items: [
                "只有已确认的 ThemeIntent 才能进入页面编排",
                "从注册表选择兼容的页面类型、选品策略与模板引用",
                "校验主题摘要、页面语言和策略—模板组合",
                "不决定模块显隐、顺序或具体商品槽位",
              ],
            },
          ]
        : [
            {
              title: "Catalog-evidenced topic interpretation",
              items: [
                "Read brands, categories, tags, available products, and paging metadata into CatalogSnapshot",
                "Build the catalog baseline ThemeIntent, then refine product evidence for resolved categories",
                "Freeze exact brand or category identity; send ambiguity or evidence conflicts to review",
                "Do not select products at this stage",
              ],
            },
            {
              title: "Brand and cultural background for unfamiliar shoppers",
              items: [
                "Open the official brand site first; Wikipedia adds neutral context but cannot replace an available official source",
                "Use a named authority or Wikipedia for festivals and cultural topics, treating every page as untrusted evidence",
                "Use background only for identity, origin, meaning, tradition, and terminology—not product efficacy or popularity",
                "Record background as unavailable and continue selection when research is unavailable; never fill gaps from model memory",
              ],
            },
            {
              title: "The system validates and creates an executable route",
              items: [
                "Allow only a resolved ThemeIntent into page orchestration",
                "Select compatible page type, selection strategy, and template refs from registries",
                "Validate the intent digest, page language, and strategy-template combination",
                "Do not decide module visibility, order, or specific product slots",
              ],
            },
          ],
      result: "CatalogSnapshot + ThemeIntent + BackgroundEvidence + LandingPageExecutionPlan",
      rollback: isChinese
        ? "主题证据不足或冲突时返回 01 补充输入；注册路由不兼容时阻止执行"
        : "Return to 01 for insufficient or conflicting topic evidence; block incompatible registered routes",
      state: "automatic",
    },
    {
      stage: "03",
      icon: WORKFLOW_ICONS.search,
      label: isChinese ? "获取商品并构建商品池" : "Fetch products and build product pools",
      output: isChinese
        ? "搜索 Yami 美国站，验证商品并按当前选品策略冻结商品池结构"
        : "Search Yami US, validate products, and freeze the pool structure for the selected strategy",
      input: "CatalogSnapshot + ThemeIntent + LandingPageExecutionPlan",
      action: isChinese ? "读取商品身份、图片与可售状态，校验相关性并按用途分层" : "Read identity, imagery, and availability, validate relevance, and assign pool roles",
      result: "ProductSelectionResult",
      rollback: isChinese ? "商品不足或不相关时在 03 重搜；主题歧义返回 02" : "Retry search in 03 for weak results; return topic ambiguity to 02",
      state: "automatic",
    },
    {
      stage: "04",
      icon: WORKFLOW_ICONS.modules,
      label: isChinese ? "配置模块并分配商品" : "Configure modules and assign products",
      output: isChinese
        ? "决定模块显隐与顺序，并按槽位分配具体商品"
        : "Decide module visibility and order, then assign products to slots",
      input: isChinese ? "模板规则与商品池" : "Template rules and product pools",
      action: isChinese ? "判断模块资格、排序并分配商品槽位" : "Resolve module eligibility, order, and product slots",
      result: "PagePlan",
      rollback: isChinese ? "商品槽位不足返回 03；模块配置问题留在 04 修复" : "Return slot shortages to 03; repair module configuration in 04",
      state: "automatic",
    },
    {
      stage: "05",
      icon: WORKFLOW_ICONS.content,
      label: isChinese ? "生成文案、审核、图片并装配页面" : "Generate and review copy, then create imagery and assemble the page",
      output: isChinese
        ? "先按陌生用户 CopyBrief 生成文案并独立审核；审核通过后才生成视觉资产并确定性装配页面"
        : "Generate copy from the newcomer CopyBrief and review it independently; create visual assets only after approval, then assemble deterministically",
      input: isChinese ? "PagePlan + AudienceContext + BackgroundEvidence + 来源证据" : "PagePlan + AudienceContext + BackgroundEvidence + source evidence",
      action: isChinese ? "编译 CopyBrief、生成文案、校验主题与场景表达，审核通过后再生成资产并装配组件" : "Compile the CopyBrief, generate copy, validate topic and scene specificity, then generate assets and assemble modules after approval",
      result: "CopyBrief + ContentReviewDecision + PageGenerationSpec + Preview + AssetManifest",
      rollback: isChinese ? "文案审核失败返回 content-writing；图片问题只重跑受影响的视觉节点" : "Return failed copy review to content-writing; rerun only affected visual nodes for image issues",
      state: "automatic",
    },
    {
      stage: "06",
      icon: WORKFLOW_ICONS.qa,
      label: isChinese ? "执行自动 QA" : "Run automatic QA",
      output: isChinese
        ? "校验商品、模块、文案与图片；失败时回退到对应阶段"
        : "Validate products, modules, copy, and images; return failures to the owning stage",
      input: "PageGenerationSpec + Preview + AssetManifest",
      action: isChinese ? "校验商品、模块、文案、图片、响应式、可访问性与来源证据" : "Validate products, modules, copy, images, responsive behavior, accessibility, and evidence",
      result: "QAReport + ReviewPackage",
      rollback: isChinese ? "商品问题返回 03 / 04；组件返回 04；文案或图片返回 05" : "Return product issues to 03/04, module issues to 04, and copy or image issues to 05",
      state: "automatic",
    },
    {
      stage: "07",
      icon: WORKFLOW_ICONS.review,
      label: isChinese ? "用户 Review" : "User review",
      output: isChinese
        ? "检查选品、模块、文案与来源资产"
        : "Review products, modules, copy, and source assets",
      input: "ReviewPackage",
      action: isChinese ? "用户检查页面方案并提出定向修改或批准；修改后必须重新 QA" : "Review the page plan and request targeted changes or approve; changes must pass QA again",
      result: "ReviewDecision",
      rollback: isChinese ? "修改意见映射回 02–05 的所属阶段，再重新执行 06" : "Map requested changes to their owning stage in 02–05, then rerun 06",
      state: "manual",
    },
    {
      stage: "08",
      icon: WORKFLOW_ICONS.publish,
      label: isChinese ? "确认并发布" : "Confirm and publish",
      output: isChinese
        ? "仅发布已通过 QA、用户批准且 spec_hash 未变化的版本"
        : "Publish only a QA-passed, user-approved version with an unchanged spec_hash",
      input: "ReviewDecision + PageGenerationSpec + spec_hash",
      action: isChinese ? "冻结版本，执行发布与烟雾测试，并记录回滚入口" : "Freeze the version, publish, run smoke tests, and record the rollback entry",
      result: "ReleaseRecord + RollbackRecord",
      rollback: isChinese ? "未批准、QA 失败或哈希变化时阻止发布" : "Block publishing when approval, QA, or hash checks fail",
      state: "manual",
    },
  ];
  const agentArchitecture = [
    {
      index: "01",
      id: "topic-page-orchestrator",
      icon: WORKFLOW_ICONS.route,
      name: isChinese ? "Topic Page 编排 Agent" : "Topic Page Orchestrator",
      role: isChinese ? "薄编排" : "Thin orchestration",
      stage: "02",
      skills: ["page-orchestration"],
      responsibility: isChinese
        ? "从注册表选择页面类型、选品策略与模板路线，不执行具体业务阶段。"
        : "Select a registered page type, selection strategy, and template route without executing business stages.",
      input: "ThemeIntent + caller constraints + registries",
      output: "LandingPageExecutionPlanProposal",
      boundary: isChinese
        ? "不重新理解主题，不选商品，不写文案，不生成图片，也不发布。"
        : "Does not reinterpret the topic, select products, write copy, generate imagery, or publish.",
    },
    {
      index: "02",
      id: "topic-strategy",
      icon: WORKFLOW_ICONS.pool,
      name: isChinese ? "主题策略 Agent" : "Topic Strategy Agent",
      role: isChinese ? "专业 Agent" : "Specialist Agent",
      stage: "02–04",
      skills: ["topic-intent", "product-selection", "page-merchandising"],
      responsibility: isChinese
        ? "理解主题与分类场景语义，在冻结商品池内提出模块主题、场景和商品分配。"
        : "Interpret topic, category, and scene semantics, then propose modules, scenes, and assignments within frozen pools.",
      input: "CatalogSnapshot + ThemeIntent + ProductSelectionRun",
      output: "Semantic · CategoryRole · Scene · Merchandising Proposals",
      boundary: isChinese
        ? "不声明目录事实，不越过冻结商品池，不撰写最终文案或生成图片。"
        : "Does not declare catalog facts, escape frozen pools, write final copy, or generate imagery.",
    },
    {
      index: "03",
      id: "topic-background-evidence",
      icon: WORKFLOW_ICONS.search,
      name: isChinese ? "背景证据 Agent" : "Background Evidence Agent",
      role: isChinese ? "只读研究 Agent" : "Read-only research Agent",
      stage: isChinese ? "ThemeIntent 后、选品前" : "After ThemeIntent, before selection",
      skills: ["background-evidence"],
      responsibility: isChinese
        ? "为不熟悉主题的用户检索品牌官网、Wikipedia 或具名文化机构，形成可审计的背景事实。"
        : "Research official brand, Wikipedia, or named cultural sources into auditable context for unfamiliar shoppers.",
      input: "Resolved ThemeIntent + AudienceContext + Host research capability",
      output: "TopicBackgroundEvidenceProposal",
      boundary: isChinese
        ? "不使用模型记忆补事实，不证明商品功效或流行度，不改变主题、选品、模块或文案。"
        : "Does not fill facts from model memory, prove product efficacy or popularity, or change intent, selection, modules, or copy.",
    },
    {
      index: "04",
      id: "topic-content",
      icon: TextIcon,
      name: isChinese ? "页面文案 Agent" : "Topic Content Agent",
      role: isChinese ? "专业 Agent" : "Specialist Agent",
      stage: "05",
      skills: ["content-writing"],
      responsibility: isChinese
        ? "根据冻结 PagePlan、语言与可引用证据生成模块标题、说明、标签和 CTA。"
        : "Generate module titles, descriptions, labels, and CTAs from the frozen PagePlan and scoped evidence.",
      input: "PagePlan + CopyBrief + BackgroundEvidence + scoped catalog evidence",
      output: "TopicPageContentProposal",
      boundary: isChinese
        ? "不换商品，不改变模块显隐或顺序，不创造商品事实。"
        : "Does not swap products, change module visibility or order, or invent product facts.",
    },
    {
      index: "05",
      id: "topic-content-review",
      icon: WORKFLOW_ICONS.qa,
      name: isChinese ? "文案审核 Agent" : "Topic Content Review Agent",
      role: isChinese ? "只读专业 Agent" : "Read-only specialist",
      stage: isChinese ? "文案后、图片前" : "After copy, before imagery",
      skills: ["content-review"],
      responsibility: isChinese
        ? "独立检查陌生用户可理解性、主题与场景感、模块差异、证据边界和语言质量。"
        : "Independently review newcomer clarity, topic and scene specificity, module differentiation, evidence boundaries, and language quality.",
      input: "ContentSpec + CopyBrief + BackgroundEvidence",
      output: "TopicPageContentReviewDecision",
      boundary: isChinese
        ? "不改写文案，不搜索新事实，不检查布局或图片；失败时只返回可执行的文案修改问题。"
        : "Does not rewrite copy, research new facts, or review layout and imagery; returns actionable copy issues only.",
    },
    {
      index: "06",
      id: "topic-visual",
      icon: WORKFLOW_ICONS.content,
      name: isChinese ? "场景视觉 Agent" : "Topic Visual Agent",
      role: isChinese ? "专业 Agent" : "Specialist Agent",
      stage: "05",
      skills: ["visual-generation"],
      responsibility: isChinese
        ? "根据视觉任务、ContentSpec 与商品引用生成场景媒体和受约束的资产元数据。"
        : "Generate scene media and constrained asset metadata from visual tasks, ContentSpec, and product references.",
      input: "PagePlan + approved ContentReviewDecision + ContentSpec + asset tasks",
      output: "Image media + TopicPageVisualProposal",
      boundary: isChinese
        ? "不改商品分配或场景定义，不伪造图片字节、品牌标识和元数据。"
        : "Does not change assignments or scenes, or fabricate image bytes, brand marks, or metadata.",
    },
    {
      index: "07",
      id: "topic-review",
      icon: WORKFLOW_ICONS.qa,
      name: isChinese ? "体验审核 Agent" : "Topic Review Agent",
      role: isChinese ? "只读专业 Agent" : "Read-only specialist",
      stage: isChinese ? "硬 QA 后" : "After hard QA",
      skills: ["page-review"],
      responsibility: isChinese
        ? "独立检查选品、文案、视觉和跨阶段一致性，建议通过或返回允许的修改阶段。"
        : "Independently inspect merchandising, copy, visual quality, and cross-stage coherence, then recommend approval or revision.",
      input: "ExecutionPlan + GenerationSpec + passed QA + previews",
      output: "TopicPageExperienceReviewProposal",
      boundary: isChinese
        ? "不直接修复结果，不重复硬 QA，不批准发布，也不代替用户 Review。"
        : "Does not repair output, repeat hard QA, approve publishing, or replace user review.",
    },
  ];
  const coreResponsibilities = isChinese
    ? [
        "页面类型、选品策略与模板注册表",
        "状态机、执行顺序、尝试次数与回退边界",
        "目录 / 背景证据、CopyBrief、任务成员和全部 SHA-256 摘要校验",
        "文案审核通过后才开放视觉生成",
        "资产落盘、确定性装配、硬 QA 与发布门禁",
      ]
    : [
        "Page-type, selection-strategy, and template registries",
        "Workflow state, execution order, attempts, and rollback boundaries",
        "Catalog and background evidence, CopyBrief, task membership, and every SHA-256 binding",
        "Visual generation only after content-review approval",
        "Asset persistence, deterministic assembly, hard QA, and publish gate",
      ];
  const renderAgentFlowNode = (agent: (typeof agentArchitecture)[number]) => (
    <article
      className={`${styles.workflowDiagramNode} ${styles.agentArchitectureFlowNode}`}
      data-agent-flow-node={agent.id}
    >
      <span className={styles.workflowDiagramIcon}>
        <HugeiconsIcon
          icon={agent.icon}
          size={20}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </span>
      <span className={styles.workflowDiagramIndex}>{agent.index}</span>
      <strong>{agent.name}</strong>
      <small>{isChinese ? "阶段" : "Stage"} {agent.stage}</small>
    </article>
  );

  return (
    <div className={styles.workflowView}>
      <div className={`${styles.viewHeading} ${styles.workflowHeader}`}>
        <div>
          <span>01–08 · Target automation workflow</span>
          <h3>{isChinese ? "理想的 Topic 页面生成流程" : "Ideal Topic page generation workflow"}</h3>
        </div>
        <p>
          {automation
            ? isChinese
              ? "下方流程状态来自本次真实运行；07 用户 Review 与 08 发布仍是人工门控。"
              : "The status below comes from this run; 07 user review and 08 publishing remain manual gates."
            : isChinese
              ? "阶段门控、局部回退；生成页面后将显示本次真实执行证据。"
              : "Stage-gated with local rollback; generate a page to see runtime evidence."}
        </p>
      </div>
      {automation && <AutomationRuntimePanel automation={automation} language={uiLanguage} />}
      {categoryRoleRuntime && (
        <CategoryRoleRuntimePanel
          evidence={categoryRoleRuntime}
          language={uiLanguage}
        />
      )}
      <div
        className={styles.workflowModeTabs}
        role="tablist"
        aria-label={isChinese ? "流程与架构" : "Workflow and architecture"}
      >
        <button
          id="workflow-diagram-tab"
          type="button"
          role="tab"
          aria-controls="workflow-diagram-panel"
          aria-selected={workflowMode === "diagram"}
          onClick={() => setWorkflowMode("diagram")}
        >
          {isChinese ? "流程图" : "Flow diagram"}
        </button>
        <button
          id="workflow-details-tab"
          type="button"
          role="tab"
          aria-controls="workflow-details-panel"
          aria-selected={workflowMode === "details"}
          onClick={() => setWorkflowMode("details")}
        >
          {isChinese ? "详细版" : "Detailed view"}
        </button>
        <button
          id="workflow-agents-tab"
          type="button"
          role="tab"
          aria-controls="workflow-agents-panel"
          aria-selected={workflowMode === "agents"}
          onClick={() => setWorkflowMode("agents")}
        >
          {isChinese ? "Agent 与 Skills" : "Agents & Skills"}
        </button>
      </div>
      <div
        id="workflow-diagram-panel"
        className={styles.workflowDiagramPanel}
        role="tabpanel"
        aria-labelledby="workflow-diagram-tab"
        hidden={workflowMode !== "diagram"}
      >
        <ol className={styles.workflowDiagram}>
          {steps.map((step, index) => (
            <li key={step.stage} className={styles.workflowDiagramStep} data-stage={step.stage}>
              <article className={styles.workflowDiagramNode}>
                <span className={styles.workflowDiagramIcon}>
                  <HugeiconsIcon
                    icon={step.icon}
                    size={20}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
                <span className={styles.workflowDiagramIndex}>{step.stage}</span>
                <strong>{step.label}</strong>
                <small className={styles[`workflow${step.state[0].toUpperCase()}${step.state.slice(1)}`]}>
                  {step.state === "automatic"
                    ? isChinese ? "自动执行" : "Automatic"
                    : step.state === "input"
                      ? isChinese ? "用户输入" : "User input"
                      : isChinese ? "人工确认" : "Human approval"}
                </small>
              </article>
              {step.stage === "06" && (
                <aside className={styles.workflowReturnMap}>
                  <HugeiconsIcon
                    icon={ArrowTurnBackwardIcon}
                    size={18}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <div>
                    <strong>{isChinese ? "QA 未通过" : "QA failed"}</strong>
                    <span>{isChinese ? "商品 → 03 / 04 · 组件 → 04 · 文案 / 图片 → 05" : "Products → 03/04 · Modules → 04 · Copy / images → 05"}</span>
                  </div>
                </aside>
              )}
              {step.stage === "07" && (
                <aside className={styles.workflowReturnMap}>
                  <HugeiconsIcon
                    icon={ArrowTurnBackwardIcon}
                    size={18}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <div>
                    <strong>{isChinese ? "要求修改" : "Changes requested"}</strong>
                    <span>{isChinese ? "返回 02–05 所属阶段，修改后重新执行 06" : "Return to the owning stage in 02–05, then rerun 06"}</span>
                  </div>
                </aside>
              )}
              {index < steps.length - 1 && (
                <span className={styles.workflowDiagramConnector} aria-hidden="true">
                  <HugeiconsIcon icon={ArrowDown01Icon} size={20} strokeWidth={1.5} />
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
      <div
        id="workflow-details-panel"
        className={styles.workflowContent}
        role="tabpanel"
        aria-labelledby="workflow-details-tab"
        hidden={workflowMode !== "details"}
      >
        <ol className={`${styles.trace} ${styles.workflowTrace}`}>
          {steps.map((step, index) => (
            <li key={step.stage}>
              <details open={index === 0}>
                <summary>
                  <span className={styles.workflowIcon}>
                    <HugeiconsIcon
                      icon={step.icon}
                      size={20}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                  </span>
                  <span className={styles.workflowSummaryCopy}>
                    <span>{step.stage}</span>
                    <strong>{step.label}</strong>
                    <span>{step.output}</span>
                  </span>
                  <small className={styles[`workflow${step.state[0].toUpperCase()}${step.state.slice(1)}`]}>
                    {step.state === "automatic"
                      ? isChinese ? "自动执行" : "Automatic"
                      : step.state === "input"
                        ? isChinese ? "用户输入" : "User input"
                        : isChinese ? "人工确认" : "Human approval"}
                  </small>
                  <HugeiconsIcon
                    className={styles.workflowChevron}
                    icon={WORKFLOW_ICONS.chevron}
                    size={12}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </summary>
                <dl className={styles.workflowDetails}>
                  <div>
                    <dt>{isChinese ? "输入" : "Input"}</dt>
                    <dd>{step.input}</dd>
                  </div>
                  {"config" in step && step.config && (
                    <div>
                      <dt>{isChinese ? "配置" : "Configuration"}</dt>
                      <dd>{step.config}</dd>
                    </div>
                  )}
                  {"read" in step && step.read && (
                    <div>
                      <dt>{isChinese ? "读取字段" : "Fields read"}</dt>
                      <dd>{step.read}</dd>
                    </div>
                  )}
                  <div>
                    <dt>{isChinese ? "执行动作" : "Action"}</dt>
                    <dd>
                      {"actionGroups" in step && step.actionGroups ? (
                        <ul className={styles.workflowActionGroups}>
                          {step.actionGroups.map((group, groupIndex) => (
                            <li key={group.title}>
                              <div className={styles.workflowActionGroupHeading}>
                                {step.stage === "02" && groupIndex === 0 ? (
                                  <button
                                    type="button"
                                    className={styles.workflowActionGroupLink}
                                    aria-haspopup="dialog"
                                    onClick={() => intentHelpDialog.current?.showModal()}
                                  >
                                    {group.title}
                                  </button>
                                ) : (
                                  <strong>{group.title}</strong>
                                )}
                              </div>
                              <ul>
                                {group.items.map((item) => <li key={item}>{item}</li>)}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      ) : step.action}
                    </dd>
                  </div>
                  <div>
                    <dt>{isChinese ? "输出" : "Output"}</dt>
                    <dd>{step.result}</dd>
                  </div>
                  {step.rollback && (
                    <div>
                      <dt>{isChinese ? "回退规则" : "Rollback"}</dt>
                      <dd>{step.rollback}</dd>
                    </div>
                  )}
                </dl>
              </details>
            </li>
          ))}
        </ol>
      </div>
      <div
        id="workflow-agents-panel"
        className={styles.agentArchitecturePanel}
        role="tabpanel"
        aria-labelledby="workflow-agents-tab"
        hidden={workflowMode !== "agents"}
      >
        <section className={styles.agentArchitectureIntro}>
          <div>
            <span>AGENT SYSTEM MAP · 1 + 6</span>
            <h4>
              {isChinese
                ? "1 个薄编排 Agent + 6 个专业 Agent"
                : "1 thin orchestrator + 6 specialist Agents"}
            </h4>
            <p>
              {isChinese
                ? "按能力拆 Agent，按阶段拆 Skill。Agent 只提交 Proposal；确定性核心验证并编译所有可执行 Artifact。"
                : "Split Agents by capability and Skills by stage. Agents submit proposals; the deterministic core validates and compiles every executable artifact."}
            </p>
          </div>
          <dl className={styles.agentArchitectureMetrics}>
            <div><dt>Agents</dt><dd>1 + 6</dd></div>
            <div><dt>Skills</dt><dd>9</dd></div>
            <div><dt>{isChinese ? "运行阶段" : "Runtime stages"}</dt><dd>11</dd></div>
            <div><dt>{isChinese ? "规则权威" : "Rule authority"}</dt><dd>TypeScript</dd></div>
          </dl>
        </section>

        <ol
          className={styles.agentArchitectureFlow}
          aria-label={isChinese ? "Agent 执行关系" : "Agent execution relationship"}
        >
          <li className={styles.agentArchitectureFlowStep}>
            {renderAgentFlowNode(agentArchitecture[0])}
            <span className={styles.agentArchitectureFlowConnector} aria-hidden="true">
              <HugeiconsIcon icon={ArrowDown01Icon} size={20} strokeWidth={1.5} />
            </span>
          </li>
          <li className={styles.agentArchitectureFlowStep}>
            {renderAgentFlowNode(agentArchitecture[1])}
            <span className={styles.agentArchitectureFlowConnector} aria-hidden="true">
              <HugeiconsIcon icon={ArrowDown01Icon} size={20} strokeWidth={1.5} />
            </span>
          </li>
          <li className={styles.agentArchitectureFlowStep}>
            {renderAgentFlowNode(agentArchitecture[2])}
            <span className={styles.agentArchitectureFlowConnector} aria-hidden="true">
              <HugeiconsIcon icon={ArrowDown01Icon} size={20} strokeWidth={1.5} />
            </span>
          </li>
          <li className={styles.agentArchitectureParallelStep}>
            <span className={styles.agentArchitectureParallelLabel}>
              {isChinese ? "阶段 05 · 按依赖顺序执行" : "Stage 05 · Run in dependency order"}
            </span>
            <ol
              className={styles.agentArchitectureParallelNodes}
              data-agent-flow="parallel"
              aria-label={isChinese ? "文案生成、独立审核、视觉生成按依赖顺序执行" : "Content generation, independent review, and visual generation run in dependency order"}
            >
              {[agentArchitecture[3], agentArchitecture[4], agentArchitecture[5]].map((agent) => (
                <li key={agent.id}>{renderAgentFlowNode(agent)}</li>
              ))}
            </ol>
            <div className={styles.agentArchitectureMerge}>
              <strong>{isChinese ? "Proposal 汇合" : "Merge proposals"}</strong>
              <span>
                {isChinese
                  ? "确定性核心验证 · 自动 QA"
                  : "Deterministic core validation · automatic QA"}
              </span>
            </div>
            <span className={styles.agentArchitectureFlowConnector} aria-hidden="true">
              <HugeiconsIcon icon={ArrowDown01Icon} size={20} strokeWidth={1.5} />
            </span>
          </li>
          <li className={styles.agentArchitectureFlowStep}>
            {renderAgentFlowNode(agentArchitecture[6])}
          </li>
        </ol>

        <section
          className={styles.agentArchitectureCards}
          aria-label={isChinese ? "Agent 职责与 Skill 映射" : "Agent responsibilities and Skill mapping"}
        >
          {agentArchitecture.map((agent) => (
            <details key={agent.id} className={styles.agentArchitectureCard}>
              <summary className={styles.agentArchitectureSummary}>
                <span className={styles.agentArchitectureIcon}>
                  <HugeiconsIcon
                    icon={agent.icon}
                    size={22}
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <span>AGENT {agent.index} · {agent.role}</span>
                  <h5>{agent.name}</h5>
                  <code>{agent.id}</code>
                </div>
                <small>{isChinese ? "阶段" : "Stage"} {agent.stage}</small>
                <HugeiconsIcon
                  className={styles.agentArchitectureChevron}
                  icon={WORKFLOW_ICONS.chevron}
                  size={12}
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
              </summary>
              <div className={styles.agentArchitectureBody}>
                <p>{agent.responsibility}</p>
                <div className={styles.agentSkillList}>
                  <span>Skills</span>
                  <div>{agent.skills.map((skill) => <code key={skill}>{skill}</code>)}</div>
                </div>
                <dl className={styles.agentArchitectureDetails}>
                  <div><dt>{isChinese ? "输入" : "Input"}</dt><dd>{agent.input}</dd></div>
                  <div><dt>Proposal</dt><dd>{agent.output}</dd></div>
                  <div><dt>{isChinese ? "不允许做什么" : "Must not"}</dt><dd>{agent.boundary}</dd></div>
                </dl>
              </div>
            </details>
          ))}
        </section>

        <aside className={styles.agentCoreAuthority}>
          <header>
            <span>DETERMINISTIC TYPESCRIPT CORE</span>
            <h4>{isChinese ? "核心才是最终规则权威" : "The core is the final rule authority"}</h4>
            <p>
              {isChinese
                ? "Agent 的 Proposal 不能直接成为页面结果；每一步都必须回到同一个核心状态机验证。"
                : "An Agent proposal never becomes page output directly; every step returns to the same core state machine for validation."}
            </p>
          </header>
          <ul>{coreResponsibilities.map((item) => <li key={item}>{item}</li>)}</ul>
          <footer>
            <span>{isChinese ? "编译产物" : "Compiled artifacts"}</span>
            <code>ExecutionPlan → ProductSelectionResult → PagePlan → ContentSpec → AssetManifest → GenerationSpec → QAReport → ReviewPackage</code>
          </footer>
        </aside>
      </div>
      <dialog
        ref={intentHelpDialog}
        className={styles.intentHelpDialog}
        aria-labelledby="intent-help-title"
        aria-describedby="intent-help-description"
        onClick={(event) => {
          if (event.target === event.currentTarget) intentHelpDialog.current?.close();
        }}
      >
        <div className={styles.intentHelpDrawer}>
          <header className={styles.intentHelpHeader}>
            <div>
              <span>{isChinese ? "步骤 02 · 解析规则说明" : "Step 02 · Interpretation rules"}</span>
              <h3 id="intent-help-title">
                {isChinese ? "系统如何理解主题词与购物意图" : "How the system interprets the topic and shopping intent"}
              </h3>
            </div>
            <button
              type="button"
              className={styles.intentHelpClose}
              aria-label={isChinese ? "关闭说明" : "Close explanation"}
              onClick={() => intentHelpDialog.current?.close()}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </header>
          <div className={styles.intentHelpBody}>
            <p id="intent-help-description" className={styles.intentHelpIntro}>
              {isChinese
                ? "目录事实与 Agent 语义建议分开处理。CatalogSnapshot 记录 Yami 品牌、目录分类与完整商品证据；配置了 Topic Strategy Agent 时，Workbench 会请求 semantic-proposal/v2 根据当前主题重新组织用户可理解的分类与使用场景，再由确定性 Module 校验目录 ID、唯一归属和完整覆盖。Agent 缺失、失败或提案越权时回退到已验证目录分类，不会阻止选品。Wikipedia 不参与商品归属判断。"
                : "Catalog facts and Agent semantic suggestions are handled separately. CatalogSnapshot records verified Yami brand, catalog-category, and complete product evidence. When a Topic Strategy Agent is configured, Workbench requests a semantic-proposal/v2 to reorganize shopper-facing categories and usage scenarios for the current topic, then deterministic Modules validate category IDs, unique ownership, and complete coverage. A missing, failed, or overreaching Agent falls back to verified catalog categories without blocking selection. Wikipedia never decides product membership."}
            </p>
            <section className={styles.intentHelpSection}>
              <span>01</span>
              <h4>{isChinese ? "输入" : "Input"}</h4>
              <ul>
                <li>{isChinese ? "读取用户关键词；当前只去除首尾空格，并校验长度为 2–80 个字符。" : "Read the user's keyword; currently only trim surrounding whitespace and validate a length of 2–80 characters."}</li>
                <li>{isChinese ? "销售站点固定为美国站 site=us；当前运行不推断 locale 或 currency。" : "Fix the sales site to site=us; the current run does not infer locale or currency."}</li>
                <li>{isChinese ? "先调用结构化目录 Adapter 读取 brandAgg、categoryAgg、tagAgg 与可售商品；失败后才使用公开搜索 Adapter，并保存每次尝试。" : "Try the structured catalog Adapter for brandAgg, categoryAgg, tagAgg, and available products first; use the public-search Adapter only after failure and retain every attempt."}</li>
                <li>{isChinese ? "配置了 Topic Strategy Agent 时，Workbench 自动请求 semantic-proposal/v2；CLI 和其他调用方也可显式附加同一契约。每个 Shortcuts 提案可引用一个或多个当前目录叶子分类 ID，并结合完整商品证据按购物心智合并相近分类；不能伪造目录 ID、跨组复用分类或覆盖精确品牌、属性与商品事实。商品归属、数量、排序与去重仍由系统校验。" : "When a Topic Strategy Agent is configured, Workbench automatically requests semantic-proposal/v2; the CLI and other callers may attach the same contract explicitly. Each Shortcuts proposal may reference one or more current catalog leaf category IDs and combine related categories using complete product evidence and shopper intent; it cannot invent IDs, reuse a category across groups, or override exact brand, attribute, or product facts. The system still validates product membership, counts, ordering, and deduplication."}</li>
              </ul>
            </section>
            <section className={styles.intentHelpSection}>
              <span>02</span>
              <h4>{isChinese ? "处理" : "Process"}</h4>
              <dl className={styles.intentHelpFields}>
                <div>
                  <dt>
                    <span>01</span>
                  </dt>
                  <dd>
                    <p><strong>{isChinese ? "识别核心实体与修饰条件" : "Identify the core entity and modifiers"}</strong></p>
                    <ul>
                      <li>{isChinese ? "品牌实体：关键词精确命中 brandAgg 的中英文品牌名。" : "Brand entity: the keyword exactly matches a Chinese or English brand name in brandAgg."}</li>
                      <li>{isChinese ? "品类实体：关键词精确命中 categoryAgg 的真实目录节点；未精确命中时只形成目录候选，并按商品覆盖、路径和证据强度参与竞争。" : "Category entity: the keyword exactly matches a real categoryAgg node; without an exact match, catalog categories remain candidates ranked by product coverage, path, and evidence strength."}</li>
                      <li>{isChinese ? "属性与场景：属性必须命中 tagAgg；收纳、补给、节日、季节等场景词按可审阅词表识别。当前 catalog-v1 尚不验证配料、营养、尺寸等商品详情字段。" : "Attributes and scenarios: attributes must match tagAgg; storage, restock, occasion, and season terms use a reviewable vocabulary. catalog-v1 does not yet verify ingredient, nutrition, or dimension details."}</li>
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>
                    <span>02</span>
                  </dt>
                  <dd>
                    <p>
                      <strong>{isChinese ? "理解购物意图：" : "Interpret shopping intent: "}</strong>
                      {isChinese ? "把关键词补全为可执行购物目标，并明确核心实体、购物动作、条件与限制。" : "Turn the keyword into an actionable shopping goal with a core entity, shopper action, conditions, and constraints."}
                    </p>
                    <ul>
                      <li>{isChinese ? "核心实体：entityType 与 canonicalEntity 说明主题围绕品牌、分类、属性还是场景。" : "Core entity: entityType and canonicalEntity identify whether the topic centers on a brand, category, attribute, or scenario."}</li>
                      <li>{isChinese ? "购物动作：shoppingIntent 与 shopperAction 区分浏览、寻找、筛选、补给、组合或送礼。" : "Shopper action: shoppingIntent and shopperAction distinguish browsing, finding, filtering, replenishing, bundling, or gifting."}</li>
                      <li>{isChinese ? "条件与限制：conditions 保存尚未成为商品事实的修饰词，constraints 逐项记录 verified、unverified 或 rejected。" : "Conditions and constraints: conditions retain modifiers not yet verified as product facts, while constraints record verified, unverified, or rejected status per item."}</li>
                      <li>{isChinese ? "主题类型：brand 浏览品牌商品，product 寻找品类或属性商品，activity 围绕场景组合多个真实分类。" : "Topic type: brand browses brand products, product finds category or attribute products, and activity assembles multiple real categories around a scenario."}</li>
                      <li>{isChinese ? "基线仍有歧义时可提交场景提案；精确品牌或品类也可根据完整商品池，把一个或多个真实叶子分类组织成用户可理解的展示分类，但不能改写核心实体或目录事实。每个使用场景必须由至少两个真实目录分类支撑。" : "A caller may submit a scenario proposal when the baseline remains ambiguous, or organize one or more real leaf categories into shopper-facing display groups for an exact brand or category using the complete product pool, but it cannot rewrite the core entity or catalog facts. Every usage scenario requires at least two real catalog categories."}</li>
                      <li>{isChinese ? "精确品牌或分类一旦确认，第二阶段商品证据只能补充覆盖度；若核心身份冲突则保留原实体并进入待确认。" : "Once an exact brand or category is resolved, second-stage product evidence may update coverage only; an identity conflict preserves the original entity and requires review."}</li>
                      <li>{isChinese ? "决策状态为 resolved、ambiguous、needs-review；只有 resolved 可以继续页面路由，其余状态必须复核或补充输入。" : "Decision status is resolved, ambiguous, or needs-review; only resolved may continue to page routing, while the others require review or more input."}</li>
                      <li>{isChinese ? "语义提案字段记录为 accepted、partially-accepted 或 rejected；最终只保留一个主实体。" : "Semantic proposal fields are recorded as accepted, partially accepted, or rejected; the final intent keeps one primary entity."}</li>
                      <li>{isChinese ? "证据等级由命中类型决定：精确目录命中高于标签或场景命中，网页回退最低；未校准的规则分数不作为真实正确率展示。" : "Evidence level follows match quality: exact catalog matches rank above tag or scenario matches, while web fallback is lowest; uncalibrated rule scores are not presented as real accuracy."}</li>
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>
                    <span>03</span>
                  </dt>
                  <dd>
                    <p><strong>{isChinese ? "形成商品检索约束" : "Build product retrieval constraints"}</strong></p>
                    <ul>
                      <li>{isChinese ? "mustInclude：按主题类型保留已验证的品牌、分类或属性；场景主题可以为空。mustExclude 当前不自动生成。" : "mustInclude retains verified brands, categories, or attributes according to topic type and may be empty for scenarios. mustExclude is not generated automatically."}</li>
                      <li>{isChinese ? "searchTerms：由原关键词、规范实体与已支持的分类或属性组成；系统不凭空生成别名。" : "searchTerms combines the original keyword, canonical entity, and supported categories or attributes; the system does not invent aliases."}</li>
                      <li>{isChinese ? "两阶段检索：先宽搜形成 CatalogSnapshot 并解析目录基线；精确品牌按品牌 ID 读取全部分页，非品牌主题按已确认分类读取全部分页并依据 ThemeIntent 二次过滤。每个主题展示 4–16 件是后续页面规则，不会截断商品池；精确检索失败时保留首轮快照。" : "Two-stage retrieval: broad search first forms CatalogSnapshot and a catalog baseline; exact brands then load every page by brand ID, while non-brand topics load every page for verified categories and apply a ThemeIntent filter. The four-to-sixteen items per theme rule affects later display only and does not truncate the product pool; the first snapshot remains available if exact retrieval fails."}</li>
                      <li>{isChinese ? "精确分类只扩展该节点及其后代；标题碰巧包含关键词的其他目录分支不能进入 ThemeIntent 或主主题商品池。" : "An exact category expands only that node and its descendants; unrelated catalog branches whose titles happen to contain the keyword cannot enter ThemeIntent or the primary theme pool."}</li>
                      <li>{isChinese ? "Schema 版本固定为 catalog-v1；需要商品详情属性后再升级版本。" : "The schema version is catalog-v1; upgrade it when product-detail attributes are available."}</li>
                    </ul>
                  </dd>
                </div>
                <div>
                  <dt>
                    <span>04</span>
                  </dt>
                  <dd>
                    <p>
                      <strong>{isChinese ? "映射主题类型：" : "Map the topic type: "}</strong>
                      {isChinese ? "按主题语义映射为以下类型：" : "Map the topic semantics to one of these types:"}
                    </p>
                    <ul>
                      <li><code>brand</code>{isChinese ? "：围绕一个品牌浏览商品。" : ": browse products around one brand."}</li>
                      <li><code>product</code>{isChinese ? "：寻找或比较具体商品、品类或领域属性。" : ": find or compare a specific product, category, or domain attribute."}</li>
                      <li><code>activity</code>{isChinese ? "：围绕节日、季节或场景组合商品。" : ": assemble products around an occasion, season, or scenario."}</li>
                      <li>{isChinese ? "说明：成分、功效、口味、材质、尺寸、规格等都属于领域属性，不新增主题类型，通常路由到 product。" : "Note: ingredients, benefits, flavor, material, dimensions, and size are domain attributes rather than new topic types, and usually map to product."}</li>
                    </ul>
                  </dd>
                </div>
              </dl>
            </section>
            <section className={styles.intentHelpSection}>
              <span>03</span>
              <h4>{isChinese ? "主题理解示例" : "Topic interpretation examples"}</h4>
              <div className={styles.intentHelpExamples}>
                <table>
                  <thead>
                    <tr>
                      <th>{isChinese ? "主题词" : "Topic"}</th>
                      <th>{isChinese ? "实体与修饰条件" : "Entity and modifiers"}</th>
                      <th>{isChinese ? "购物意图" : "Shopping intent"}</th>
                      <th>{isChinese ? "检索约束" : "Search constraints"}</th>
                      <th>{isChinese ? "主题类型" : "Topic type"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>ANUA</strong></td>
                      <td>{isChinese ? "品牌实体" : "Brand entity"}</td>
                      <td>{isChinese ? "浏览 ANUA 的代表商品" : "Browse representative ANUA products"}</td>
                      <td>{isChinese ? "必须属于 ANUA；召回核心系列与代表商品" : "Must belong to ANUA; recall core lines and representative products"}</td>
                      <td><code>brand</code></td>
                    </tr>
                    <tr>
                      <td><strong>Coffee</strong></td>
                      <td>{isChinese ? "精确父分类" : "Exact parent category"}</td>
                      <td>{isChinese ? "浏览 Coffee 目录下有足够商品证据的子分类" : "Browse supported child categories under Coffee"}</td>
                      <td>{isChinese ? "只扩展 Coffee 及其后代；其他目录分支中的 coffee 标题不进入主主题" : "Expand only Coffee and its descendants; coffee titles in other branches stay outside primary themes"}</td>
                      <td><code>product</code></td>
                    </tr>
                    <tr>
                      <td><strong>{isChinese ? "鱼腥草爽肤水" : "Heartleaf toner"}</strong></td>
                      <td>{isChinese ? "成分 + 品类" : "Ingredient + category"}</td>
                      <td>{isChinese ? "在最强目录分类中寻找匹配鱼腥草爽肤水关键词的商品" : "Find products matching the heartleaf toner keyword in the strongest catalog category"}</td>
                      <td>{isChinese ? "保留原关键词与真实分类；当前不把标题中的鱼腥草当作已验证成分" : "Keep the original keyword and real category; do not treat heartleaf in a title as a verified ingredient"}</td>
                      <td><code>product</code></td>
                    </tr>
                    <tr>
                      <td><strong>{isChinese ? "无糖抹茶零食" : "Sugar-free matcha snacks"}</strong></td>
                      <td>{isChinese ? "食品口味 + 营养限制" : "Food flavor + dietary constraint"}</td>
                      <td>{isChinese ? "寻找抹茶零食，并单独验证无糖条件" : "Find matcha snacks and verify the sugar-free condition separately"}</td>
                      <td>{isChinese ? "只有 tagAgg 支持时才验证标签；否则无糖保持 unverified，配料与过敏原仍需商品详情接口" : "Verify the tag only when tagAgg supports it; otherwise sugar-free remains unverified, while ingredients and allergens still require product-detail data"}</td>
                      <td><code>product</code></td>
                    </tr>
                    <tr>
                      <td><strong>{isChinese ? "小户型厨房收纳" : "Small-kitchen organization"}</strong></td>
                      <td>{isChinese ? "家居空间 + 使用场景" : "Home space + usage scenario"}</td>
                      <td>{isChinese ? "组合宽搜结果覆盖的厨房收纳真实分类；证据不足时待确认" : "Assemble real kitchen-storage categories covered by broad search; require review when evidence is weak"}</td>
                      <td>{isChinese ? "按候选分类 ID 二次检索；尺寸、材质与承重保持 unverified" : "Requery by candidate category IDs; dimensions, materials, and load capacity remain unverified"}</td>
                      <td><code>activity</code></td>
                    </tr>
                    <tr>
                      <td><strong>{isChinese ? "洗衣日用补给" : "Laundry restock"}</strong></td>
                      <td>{isChinese ? "日用功能 + 补给场景" : "Daily function + restock scenario"}</td>
                      <td>{isChinese ? "按补给场景组织当前检索覆盖的洗衣相关分类" : "Organize laundry-related categories covered by the current search as a restock scenario"}</td>
                      <td>{isChinese ? "按真实分类二次检索；功能、规格与香型仍需商品详情证据" : "Requery real categories; function, size, and scent still require product-detail evidence"}</td>
                      <td><code>activity</code></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
            <section className={styles.intentHelpSection}>
              <span>04</span>
              <h4>{isChinese ? "输出 ThemeIntent" : "Output ThemeIntent"}</h4>
              <ul>
                <li><strong>{isChinese ? "主题分类：" : "Topic classification: "}</strong>themeType、catalogDomain、attributeSchemaVersion</li>
                <li><strong>{isChinese ? "规范化实体：" : "Canonical entity: "}</strong>entityType、canonicalEntity</li>
                <li><strong>{isChinese ? "购物意图：" : "Shopping intent: "}</strong>shoppingIntent、shopperAction、shoppingGoal、needs、conditions</li>
                <li><strong>{isChinese ? "检索约束：" : "Search constraints: "}</strong>mustInclude、mustExclude、searchTerms、constraints</li>
                <li><strong>{isChinese ? "语义组织：" : "Semantic organization: "}</strong>categoryHypotheses、scenarioHypotheses（semantic-proposal/v2 {isChinese ? "通过校验后生成" : "after validation"}）</li>
                <li><strong>{isChinese ? "判断说明：" : "Decision explanation: "}</strong>candidates、decision.status、decision.evidenceLevel、decision.selectedCandidateMargin、reason</li>
                <li>
                  <strong>{isChinese ? "运行审计：" : "Run review: "}</strong>
                  {isChinese
                    ? "Adapter attempts、proposalReview；CLI 可选输出带 SHA-256 的 Run Artifacts"
                    : "Adapter attempts, proposalReview; the CLI can optionally output SHA-256 Run Artifacts"}
                </li>
              </ul>
            </section>
            <section className={styles.intentHelpSection}>
              <span>05</span>
              <h4>{isChinese ? "页面路由边界" : "Page routing boundary"}</h4>
              <ul>
                <li>{isChinese ? "只有 decision.status=resolved 的 ThemeIntent 才能生成 LandingPageExecutionPlan。" : "Only ThemeIntent with decision.status=resolved may create LandingPageExecutionPlan."}</li>
                <li>{isChinese ? "执行计划只确认 pageTypeRef、selectionStrategyRef 与 templateRef 等注册引用。" : "The execution plan confirms registered refs such as pageTypeRef, selectionStrategyRef, and templateRef."}</li>
                <li>{isChinese ? "阶段 02 不决定模块显隐、顺序或具体商品槽位；商品池属于阶段 03，模块与槽位属于阶段 04。" : "Stage 02 does not decide module visibility, order, or specific product slots; product pools belong to stage 03, while modules and slots belong to stage 04."}</li>
              </ul>
            </section>
            <div className={styles.intentHelpOutput}>
              <span>{isChinese ? "当前实现状态" : "Current implementation"}</span>
              <strong>
                {plan
                  ? `${plan.intent.themeType} · ${plan.intent.canonicalEntity?.label ?? (isChinese ? "待确认实体" : "Unresolved entity")}`
                  : isChinese ? "等待生成本次 ThemeIntent" : "Waiting to generate this run's ThemeIntent"}
              </strong>
              {plan ? (
                <>
                  <p>{displayIntent?.shoppingGoal}</p>
                  <ul>
                    <li>
                      {isChinese ? "证据来源：" : "Evidence source: "}
                      {plan.intent.source === "catalog-evidence"
                        ? isChinese ? "Yami 商品目录接口" : "Yami catalog interface"
                        : isChinese ? "公开搜索页回退" : "Public search fallback"}
                    </li>
                    <li>
                      {isChinese ? "规范实体：" : "Canonical entity: "}
                      {plan.intent.entityType} · {plan.intent.canonicalEntity?.id ?? "—"}
                    </li>
                    <li>
                      {isChinese ? "必须包含：" : "Must include: "}
                      {plan.intent.mustInclude.join("、") || "—"}
                    </li>
                    <li>
                      {isChinese ? "候选分类：" : "Candidate categories: "}
                      {plan.intent.categories.map((category) => category.label).join("、") || "—"}
                    </li>
                    <li>
                      {isChinese ? "分类组织：" : "Category organization: "}
                      {plan.intent.categoryHypotheses?.map((hypothesis) => `${hypothesis.label} (${hypothesis.role})`).join("、") || "—"}
                    </li>
                    <li>
                      {isChinese ? "使用场景：" : "Usage scenarios: "}
                      {plan.intent.scenarioHypotheses?.map((hypothesis) => hypothesis.name).join("、") || "—"}
                    </li>
                    <li>
                      {isChinese ? "判断依据：" : "Reason: "}
                      {displayIntent?.reason} · {evidenceLevelLabel(plan, uiLanguage)} · {plan.intent.decision.status}
                    </li>
                  </ul>
                </>
              ) : (
                <p>
                  {isChinese
                    ? "生成页面后，这里会展示本次真实主题实体、购物目标、检索约束、目录分类与判断依据。"
                    : "After generation, this area shows the run's entity, shopping goal, retrieval constraints, catalog categories, and evidence."}
                </p>
              )}
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function RulesView({
  plan,
  uiLanguage,
  automation,
}: {
  plan: TopicPagePlan;
  uiLanguage: ContentLanguage;
  automation: TopicPageAutomationRun | null;
}) {
  const zh = uiLanguage === "zh";
  const intentCopy = themeIntentDisplayCopy(plan.intent, plan.keyword, uiLanguage);
  const moduleDecisions = automation?.plan?.modules ?? plan.modules;

  return (
    <div className={styles.rulesView}>
      <section>
        <header className={styles.viewHeading}>
          <div><span>02 · ThemeIntent</span><h3>{plan.intent.canonicalEntity?.label ?? plan.keyword}</h3></div>
          <p>{intentCopy.shoppingGoal}</p>
        </header>
        <div className={styles.decisionList}>
          <article>
            <span className={styles.decisionIndex}>01</span>
            <div>
              <strong>{zh ? "主题与购物意图" : "Topic and shopping intent"}</strong>
              <p>{plan.intent.themeType} · {plan.intent.entityType} · {plan.intent.shoppingIntent}</p>
            </div>
            <span className={styles.isVisible}>{evidenceLevelLabel(plan, uiLanguage)}</span>
          </article>
          <article>
            <span className={styles.decisionIndex}>02</span>
            <div>
              <strong>{zh ? "检索约束" : "Retrieval constraints"}</strong>
              <p>{plan.intent.mustInclude.join(" · ") || plan.intent.searchTerms.join(" · ")}</p>
            </div>
            <span className={styles.isVisible}>{plan.intent.source}</span>
          </article>
          <article>
            <span className={styles.decisionIndex}>03</span>
            <div>
              <strong>{zh ? "目录证据" : "Catalog evidence"}</strong>
              <p>{plan.intent.categories.map((category) => `${category.label} (${category.evidenceCount})`).join(" · ") || plan.intent.reason}</p>
            </div>
            <span className={styles.isVisible}>{plan.intent.catalogDomain}</span>
          </article>
        </div>
      </section>
      {plan.selectionStrategy.id === "category-role" && (
        <section>
          <header className={styles.viewHeading}>
            <div>
              <span>03 · Category selection</span>
              <h3>{zh ? "候选分类与角色" : "Candidate categories and roles"}</h3>
            </div>
            <p>
              {zh
                ? "使用经 taxonomy artifact 验证的 Yami 目录分类；目标配比为 5 core / 3 pairing / 2 accessory。"
                : "Uses Yami catalog categories validated against the taxonomy artifact and a 5:3:2 role target."}
            </p>
          </header>
          <div className={styles.decisionList}>
            {plan.selectedCategories.map((category, index) => (
              <article key={category.id}>
                <span className={styles.decisionIndex}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <strong>{category.label}</strong>
                  <p>
                    {category.reason} · {productCountLabel(category.productIds.length, uiLanguage)}
                  </p>
                </div>
                <span className={styles.isVisible}>{category.role}</span>
              </article>
            ))}
          </div>
        </section>
      )}
      <section>
        <header className={styles.viewHeading}>
          <div>
            <span>04 · {automation?.plan ? "PagePlan v2" : "PagePlan"}</span>
            <h3>{zh ? "模块决策" : "Module decisions"}</h3>
          </div>
          <p>{zh ? "可选模块必须具备足够证据才会显示。" : "Optional modules must earn their place."}</p>
        </header>
        <div className={styles.decisionList}>
          {moduleDecisions.map((module, index) => (
            <article key={module.id}>
              <span className={styles.decisionIndex}>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{"label" in module ? module.label : module.component}</strong>
                <p>{module.reason}</p>
              </div>
              <span className={module.visible ? styles.isVisible : styles.isHidden}>
                {module.visible ? (zh ? "显示" : "Visible") : (zh ? "隐藏" : "Hidden")}
              </span>
            </article>
          ))}
        </div>
      </section>
      {automation ? (
        <section className={styles.qaPanel}>
          <header>
            <span>06 · {zh ? "真实自动 QA" : "Actual automatic QA"}</span>
            <strong>
              {automation.status === "ready"
                ? zh ? "通过" : "Passed"
                : zh ? "已阻止" : "Blocked"}
            </strong>
          </header>
          {automation.qaReport ? (
            <>
              <p>
                {zh
                  ? `QAReport 已绑定 PageGenerationSpec；共 ${automation.qaReport.issues.length} 项问题。`
                  : `QAReport is bound to PageGenerationSpec with ${automation.qaReport.issues.length} issues.`}
              </p>
              <ul>
                {automation.qaReport.checks.map((check) => (
                  <li key={check.id}>
                    {check.id} · {check.status} · {check.issueCount}
                  </li>
                ))}
                {automation.qaReport.issues.map((issue) => <li key={issue}>{issue}</li>)}
              </ul>
            </>
          ) : (
            <>
              <p>{zh ? "自动化在生成 QAReport 前被阻止。" : "Automation was blocked before QAReport."}</p>
              <ul>{automation.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>
            </>
          )}
        </section>
      ) : (
        <section className={styles.qaPanel}>
          <header>
            <span>06 · {zh ? "旧版方案检查" : "Legacy plan checks"}</span>
            <strong>{planStatusLabel(plan, uiLanguage)}</strong>
          </header>
          <p>{plan.statusReason}</p>
          <ul>{plan.qualityNotes.map((note) => <li key={note}>{note}</li>)}</ul>
        </section>
      )}
    </div>
  );
}

export function TopicGenerator({
  PagePreviewRenderer,
  managedRunApiBase,
}: TopicGeneratorProps = {}) {
  const [keyword, setKeyword] = useState("ANUA");
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [uiLanguage, setUiLanguage] = useState<ContentLanguage>("zh");
  const [strategy, setStrategy] = useState<ProductSelectionStrategy>("relevance");
  const [plans, setPlans] = useState<TopicPlanMatrix | null>(null);
  const [selectionRuns, setSelectionRuns] = useState<SelectionRuns | null>(null);
  const [categoryRoleRuntime, setCategoryRoleRuntime] =
    useState<CategoryRoleRuntimeEvidence | null>(null);
  const [backgroundEvidence, setBackgroundEvidence] =
    useState<TopicBackgroundEvidenceBundle | null>(null);
  const [automation, setAutomation] = useState<TopicPageAutomationRun | null>(null);
  const [pagePreviewTypeRef, setPagePreviewTypeRef] = useState<LandingPageTypeRef | null>(null);
  const [heroSelection, setHeroSelection] = useState<HeroSelectionRun | null>(null);
  const [shortcutSelection, setShortcutSelection] = useState<ShortcutSelectionRun | null>(null);
  const [startHereSelection, setStartHereSelection] = useState<StartHereSelectionRun | null>(null);
  const [localizedAutomationCache, setLocalizedAutomationCache] =
    useState<LocalizedAutomationCache | null>(null);
  const [capabilityArtifacts, setCapabilityArtifacts] =
    useState<CapabilityArtifacts | null>(null);
  const [contentSpec, setContentSpec] = useState<TopicPageContentSpec | null>(null);
  const [capabilityContentReview, setCapabilityContentReview] =
    useState<TopicPageContentReviewDecision | null>(null);
  const [visualGenerationSpec, setVisualGenerationSpec] =
    useState<TopicPageGenerationSpec | null>(null);
  const [view, setView] = useState<ResultView>("preview");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("page");
  const [activeMode, setActiveMode] = useState<CapabilityMode>("page");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeneratorError | null>(null);
  const [sourceMode, setSourceMode] = useState<TopicSourceMode>("input");
  const [currentRun, setCurrentRun] = useState<TopicGeneratorRunSummary | null>(null);
  const [currentDetail, setCurrentDetail] = useState<TopicGeneratorAnyRunDetail | null>(null);
  const [managedRunPickerOpen, setManagedRunPickerOpen] = useState(false);
  const [managedRunOptions, setManagedRunOptions] = useState<TopicGeneratorRunSummary[]>([]);
  const [selectedManagedRunId, setSelectedManagedRunId] = useState<string | null>(null);
  const [managedRunPickerBusy, setManagedRunPickerBusy] = useState(false);
  const [managedRunPickerError, setManagedRunPickerError] = useState<string | null>(null);
  const [pendingRunDeletion, setPendingRunDeletion] =
    useState<TopicGeneratorRunSummary | null>(null);
  const [runDeleteBusy, setRunDeleteBusy] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const directoryInputRef = useRef<HTMLInputElement>(null);
  const managedRunDialogRef = useRef<HTMLDialogElement>(null);
  const managedRunTriggerRef = useRef<HTMLButtonElement>(null);
  const managedRunsUrl = managedRunApiBase ? `${managedRunApiBase}/runs` : null;
  const managedImportsUrl = managedRunApiBase ? `${managedRunApiBase}/imports` : null;
  const selectedManagedRun = managedRunOptions.find(
    ({ runId }) => runId === selectedManagedRunId,
  ) ?? null;
  const managedHistoryReady = Boolean(managedRunApiBase && currentRun?.continuable);
  const managedActionUnavailable = Boolean(managedRunApiBase && (
    (sourceMode === "load" && currentRun === null) ||
    (currentRun !== null && !currentRun.continuable)
  ));
  const plan = plans?.[uiLanguage]?.[strategy] ?? null;
  const resolvedHeroSelection = heroSelection ?? heroSelectionFromAutomation(
    automation?.status === "ready" ? automation : null,
    plan,
  );
  const resolvedShortcutSelection = shortcutSelection ?? shortcutSelectionFromAutomation(
    automation?.status === "ready" ? automation : null,
  );
  const resolvedStartHereSelection = startHereSelection ?? startHereSelectionFromAutomation(
    automation?.status === "ready" ? automation : null,
    plan,
  );
  const shortcutsRequireReview = Boolean(
    plan?.modules.find(({ id }) => id === "shortcuts")?.visible,
  );
  const startHereRequiresReview = Boolean(
    plan?.modules.find(({ id }) => id === "start-here")?.visible,
  );
  const moduleSelectionStatus = resolvedHeroSelection?.status === "fallback" ||
      resolvedShortcutSelection?.status === "fallback" ||
      resolvedStartHereSelection?.status === "fallback"
    ? "fallback"
    : resolvedHeroSelection?.status === "ready" &&
        (!shortcutsRequireReview || resolvedShortcutSelection?.status === "ready") &&
        (!startHereRequiresReview || resolvedStartHereSelection?.status === "ready")
      ? "ready"
      : "pending";
  const runError = selectionRunError(selectionRuns?.[strategy], uiLanguage);
  const copy = UI_COPY[uiLanguage];
  const targetLocale = resultLocaleLabel(uiLanguage);
  const strategyLabel = STRATEGY_OPTIONS[uiLanguage].find(
    (option) => option.value === strategy,
  )?.label ?? strategy;
  const poolCoverage = view === "pools" ? plan?.catalogCoverage : undefined;
  const poolCoverageInStock = poolCoverage
    ? poolCoverage.groups.yami.inStock + poolCoverage.groups.thirdParty.inStock
    : 0;
  const poolCoverageOutOfStock = poolCoverage
    ? poolCoverage.groups.yami.outOfStock + poolCoverage.groups.thirdParty.outOfStock
    : 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedLanguage = params.get("content-language");
    const requestedStrategy = params.get("selection-strategy");
    if (requestedLanguage === "en" || requestedLanguage === "zh") {
      setUiLanguage(requestedLanguage);
    }
    if (requestedStrategy === "relevance" || requestedStrategy === "category-role") {
      setStrategy(requestedStrategy);
    }
  }, []);

  useEffect(() => {
    const dialog = managedRunDialogRef.current;
    if (!dialog) return;
    if (managedRunPickerOpen && !dialog.open) dialog.showModal();
    if (!managedRunPickerOpen && dialog.open) dialog.close();
  }, [managedRunPickerOpen]);

  async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
    const response = await fetch(url, init);
    const payload = await response.json() as T & { error?: string; message?: string };
    if (!response.ok) {
      throw {
        message: payload.error ?? payload.message ?? "TOPIC GENERATOR request failed.",
      } satisfies GeneratorError;
    }
    return payload;
  }

  function applyManagedDetail(detail: TopicGeneratorAnyRunDetail) {
    setCurrentDetail(detail);
    setCurrentRun(detail.summary);
    setKeyword(detail.summary.keyword);
    setUiLanguage(detail.summary.language);
    setStrategy(detail.summary.strategy);
    setCategoryRoleRuntime(null);
    setHeroSelection(null);
    setShortcutSelection(null);
    setStartHereSelection(null);
    setLocalizedAutomationCache(null);
    if (!isManagedV2Detail(detail)) {
      const legacyPlans = detail.artifacts["page-plans.json"] as
        { plans?: TopicPlanMatrix } | undefined;
      setPlans(legacyPlans?.plans ?? null);
      setSelectionRuns(null);
      setBackgroundEvidence(null);
      setAutomation(null);
      setPagePreviewTypeRef(null);
      setCapabilityArtifacts(null);
      setContentSpec(null);
      setCapabilityContentReview(null);
      setVisualGenerationSpec(null);
      setView(legacyPlans?.plans ? "preview" : "analysis");
      setPreviewMode("distribution");
      setActiveMode("selection");
      setError(detail.diagnostics.length > 0
        ? { message: detail.diagnostics.join(" ") }
        : null);
      return;
    }
    const intent = detail.stageResults["topic-intent"] as TopicIntentStageOutput | undefined;
    const background = detail.stageResults["background-evidence"] as
      BackgroundEvidenceStageOutput | undefined;
    const selection = detail.stageResults["product-selection"] as
      ProductSelectionStageOutput | undefined;
    const merchandising = detail.stageResults["module-merchandising"] as
      ModuleMerchandisingStageOutput | undefined;
    const content = detail.stageResults["content-review"] as ContentReviewStageOutput | undefined;
    const page = detail.stageResults["page-generation"] as PageGenerationStageOutput | undefined;
    const nextPlans = merchandising?.plans ?? selection?.plans ?? intent?.plans ?? null;
    setPlans(nextPlans);
    setSelectionRuns(selection
      ? { [detail.manifest.request.strategy]: selection.selectionRun }
      : null);
    setBackgroundEvidence(background?.backgroundEvidence ?? null);
    setPagePreviewTypeRef(selection?.executionPlan.pageTypeRef ?? null);
    setCapabilityArtifacts(intent && selection && merchandising
      ? {
          intent: intent.analysis.intent,
          selection: selection.selection,
          plan: merchandising.plan,
          pageTypeRef: selection.executionPlan.pageTypeRef,
          ...(background ? { backgroundEvidence: background.backgroundEvidence } : {}),
        }
      : null);
    setContentSpec(content?.contentSpec ?? null);
    setCapabilityContentReview(content?.contentReview ?? null);
    setVisualGenerationSpec(page?.generationSpec ?? null);
    const nextAutomation = managedAutomation(detail);
    setAutomation(nextAutomation);
    setLocalizedAutomationCache(nextAutomation
      ? {
          requestKey: automationRequestKey(detail.summary.keyword, detail.summary.strategy),
          sourceSignature: automationSourceSignature(nextAutomation),
          runs: {
            [nextAutomation.generationSpec.language]: nextAutomation,
          },
        }
      : null);
    const hasDraft = detail.state.deliverables.some(
      ({ name, status }) => name === "page-draft.html" && status === "ready",
    );
    setView(hasDraft || page ? "preview" : nextPlans ? "analysis" : "workflow");
    setPreviewMode(hasDraft || page ? "page" : "distribution");
    setActiveMode(nextAutomation ? "page" : page ? "visual" : content ? "content" : "selection");
    const issues = [...detail.diagnostics, ...detail.state.issues];
    setError(issues.length > 0 ? { message: issues.join(" ") } : null);
  }

  function clearManagedRunState() {
    setCurrentRun(null);
    setCurrentDetail(null);
    setPlans(null);
    setSelectionRuns(null);
    setCategoryRoleRuntime(null);
    setBackgroundEvidence(null);
    setAutomation(null);
    setPagePreviewTypeRef(null);
    setHeroSelection(null);
    setShortcutSelection(null);
    setStartHereSelection(null);
    setLocalizedAutomationCache(null);
    setCapabilityArtifacts(null);
    setContentSpec(null);
    setCapabilityContentReview(null);
    setVisualGenerationSpec(null);
    setView("preview");
    setPreviewMode("page");
    setActiveMode("page");
    setError(null);
  }

  async function loadManagedRun(runId: string) {
    if (!managedRunsUrl) return false;
    setLoading(true);
    setError(null);
    try {
      const detail = await requestJson<TopicGeneratorAnyRunDetail>(
        `${managedRunsUrl}/${encodeURIComponent(runId)}`,
      );
      applyManagedDetail(detail);
      setSourceMode("load");
      return true;
    } catch (caught) {
      setError(caught as GeneratorError);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function openManagedRunPicker() {
    if (!managedRunsUrl) return;
    setPendingRunDeletion(null);
    setManagedRunPickerOpen(true);
    setManagedRunPickerBusy(true);
    setManagedRunPickerError(null);
    try {
      const response = await requestJson<{
        schemaVersion: "topic-generator-run-list/v1";
        items: TopicGeneratorRunSummary[];
        nextCursor: string | null;
      }>(`${managedRunsUrl}?limit=100`);
      setManagedRunOptions(response.items);
      setSelectedManagedRunId((selected) => {
        if (selected && response.items.some(({ runId }) => runId === selected)) return selected;
        if (currentRun && response.items.some(({ runId }) => runId === currentRun.runId)) {
          return currentRun.runId;
        }
        return response.items[0]?.runId ?? null;
      });
    } catch (caught) {
      const issue = caught as GeneratorError;
      setManagedRunOptions([]);
      setSelectedManagedRunId(null);
      setManagedRunPickerError(issue.message);
    } finally {
      setManagedRunPickerBusy(false);
    }
  }

  function closeManagedRunPicker() {
    if (importBusy || runDeleteBusy) return;
    if (pendingImport) void cancelImport();
    setPendingRunDeletion(null);
    setManagedRunPickerOpen(false);
  }

  async function loadSelectedManagedRun() {
    if (!selectedManagedRunId) return;
    if (await loadManagedRun(selectedManagedRunId)) setManagedRunPickerOpen(false);
  }

  async function deleteSelectedManagedRun() {
    if (!managedRunsUrl || !pendingRunDeletion) return;
    const deleting = pendingRunDeletion;
    setRunDeleteBusy(true);
    setManagedRunPickerError(null);
    try {
      await requestJson<TopicGeneratorRunDeletion>(
        `${managedRunsUrl}/${encodeURIComponent(deleting.runId)}`,
        { method: "DELETE" },
      );
      const remaining = managedRunOptions.filter(({ runId }) => runId !== deleting.runId);
      setManagedRunOptions(remaining);
      setSelectedManagedRunId(
        remaining.find(({ runId }) => runId === currentRun?.runId)?.runId ??
          remaining[0]?.runId ??
          null,
      );
      setPendingRunDeletion(null);
      if (currentRun?.runId === deleting.runId) {
        clearManagedRunState();
      }
    } catch (caught) {
      setManagedRunPickerError((caught as GeneratorError).message);
    } finally {
      setRunDeleteBusy(false);
    }
  }

  async function createManagedRun(goal: TopicGeneratorRunGoal) {
    if (!managedRunsUrl) throw { message: "Managed run API is not configured." };
    const runRequest = {
      keyword: keyword.trim(),
      site: "us" as const,
      language: uiLanguage,
      strategy,
      goal,
    };
    const created = await requestJson<{ manifest: { runId: string } }>(
      managedRunsUrl,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ request: runRequest }),
      },
    );
    return created.manifest.runId;
  }

  async function ensureV2Run(runId: string) {
    if (!managedRunsUrl) throw { message: "Managed run API is not configured." };
    const detail = await requestJson<TopicGeneratorAnyRunDetail>(
      `${managedRunsUrl}/${encodeURIComponent(runId)}`,
    );
    if (isManagedV2Detail(detail)) return detail;
    const migrated = await requestJson<{ manifest: { runId: string } }>(
      `${managedRunsUrl}/${encodeURIComponent(runId)}/derive`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ origin: "legacy-migration" }),
      },
    );
    return requestJson<Extract<TopicGeneratorAnyRunDetail, {
      schemaVersion: "topic-generator-run-detail/v1";
    }>>(`${managedRunsUrl}/${encodeURIComponent(migrated.manifest.runId)}`);
  }

  async function advanceManaged(goal: TopicGeneratorRunGoal) {
    if (keyword.trim().length < 2) return;
    setActiveMode(goal);
    setLoading(true);
    setError(null);
    try {
      const sourceRunId = currentRun?.runId ?? null;
      let runId = sourceRunId ?? await createManagedRun(goal);
      let detail = await ensureV2Run(runId);
      runId = detail.manifest.runId;
      const targetStage = MANAGED_MILESTONE[goal];
      const targetState = detail.state.stages.find(({ id }) => id === targetStage);
      const strategyChanged = strategy !== detail.manifest.request.strategy;
      const shouldRegenerate = sourceRunId === detail.manifest.runId && (
        targetState?.status === "completed" || detail.state.status === "blocked"
      );
      if (strategyChanged || shouldRegenerate) {
        const requestedRollback = strategyChanged
          ? "product-selection"
          : MANAGED_REGENERATION_STAGE[goal];
        const requestedRollbackIndex = MANAGED_STAGE_ORDER.indexOf(requestedRollback);
        const nextStageIndex = detail.state.nextStage
          ? MANAGED_STAGE_ORDER.indexOf(detail.state.nextStage)
          : -1;
        const rollbackStage = nextStageIndex >= 0 && nextStageIndex < requestedRollbackIndex
          ? detail.state.nextStage!
          : requestedRollback;
        const child = await requestJson<{ manifest: { runId: string } }>(
          `${managedRunsUrl}/${encodeURIComponent(runId)}/derive`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              origin: "derived",
              rollbackStage,
              ...(strategyChanged ? { request: { strategy } } : {}),
            }),
          },
        );
        runId = child.manifest.runId;
        detail = await requestJson<Extract<TopicGeneratorAnyRunDetail, {
          schemaVersion: "topic-generator-run-detail/v1";
        }>>(`${managedRunsUrl}/${encodeURIComponent(runId)}`);
      }
      applyManagedDetail(detail);
      setSourceMode("load");
      setActiveMode(goal);
      const targetIndex = MANAGED_STAGE_ORDER.indexOf(targetStage);
      let advanced = false;
      while (detail.state.nextStage) {
        const nextIndex = MANAGED_STAGE_ORDER.indexOf(detail.state.nextStage);
        if (nextIndex < 0 || nextIndex > targetIndex ||
            detail.state.status === "awaiting-approval" ||
            detail.state.status === "completed" ||
            (detail.state.status === "blocked" && advanced)) break;
        const response = await requestJson<{
          detail: Extract<TopicGeneratorAnyRunDetail, {
            schemaVersion: "topic-generator-run-detail/v1";
          }>;
        }>(`${managedRunsUrl}/${encodeURIComponent(runId)}/advance`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ requestId: crypto.randomUUID() }),
        });
        detail = response.detail;
        advanced = true;
        applyManagedDetail(detail);
        setActiveMode(goal);
        if (detail.state.status === "blocked") break;
      }
    } catch (caught) {
      setError(caught as GeneratorError);
    } finally {
      setLoading(false);
    }
  }

  async function approveManagedRun() {
    if (!managedRunsUrl || !currentRun || !currentDetail || !isManagedV2Detail(currentDetail) ||
        !currentDetail.state.review) return;
    setLoading(true);
    setError(null);
    try {
      await requestJson(
        `${managedRunsUrl}/${encodeURIComponent(currentRun.runId)}/review`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            decision: "approve",
            packageDigest: currentDetail.state.review.packageDigest,
          }),
        },
      );
      await loadManagedRun(currentRun.runId);
    } catch (caught) {
      setError(caught as GeneratorError);
    } finally {
      setLoading(false);
    }
  }

  async function startDirectoryImport(files: Array<{ file: File; path: string }>) {
    if (!managedImportsUrl) return;
    setImportBusy(true);
    setError(null);
    try {
      const normalized = normalizedBrowserFiles(files);
      const prepared = await Promise.all(normalized.map(async ({ file, path }) => ({
        file,
        path,
        sha256: await fileDigest(file),
      })));
      const manifests = await Promise.all(prepared
        .filter(({ path }) => path === "run.json" || /^[^/]+\/run\.json$/.test(path))
        .map(async ({ file, path }) => ({ path, contents: await file.text() })));
      const session = await requestJson<{
        id: string;
        candidates: ImportCandidate[];
        limits: { maxChunkBytes: number };
      }>(`${managedImportsUrl}/start`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          files: prepared.map(({ path, file, sha256 }) => ({
            path,
            size: file.size,
            sha256,
          })),
          manifests,
        }),
      });
      const defaultCandidateId = session.candidates.find(({ valid }) => valid)?.id;
      setPendingImport({
        sessionId: session.id,
        files: prepared,
        candidates: session.candidates,
        selectedIds: defaultCandidateId ? [defaultCandidateId] : [],
        maxChunkBytes: session.limits.maxChunkBytes,
      });
    } catch (caught) {
      setError(caught as GeneratorError);
    } finally {
      setImportBusy(false);
    }
  }

  async function chooseImportDirectory() {
    const picker = (window as unknown as {
      showDirectoryPicker?: () => Promise<BrowserDirectoryHandle>;
    }).showDirectoryPicker;
    if (picker) {
      try {
        const directory = await picker();
        await startDirectoryImport(await filesFromDirectory(directory));
        return;
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
      }
    }
    directoryInputRef.current?.click();
  }

  async function chooseExternalImportDirectory() {
    await chooseImportDirectory();
  }

  function handleDirectoryInput(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])].map((file) => ({
      file,
      path: file.webkitRelativePath || file.name,
    }));
    event.target.value = "";
    if (files.length > 0) void startDirectoryImport(files);
  }

  async function cancelImport() {
    if (!managedImportsUrl || !pendingImport) return;
    const sessionId = pendingImport.sessionId;
    setPendingImport(null);
    try {
      await fetch(`${managedImportsUrl}/${encodeURIComponent(sessionId)}`, {
        method: "DELETE",
      });
    } catch {
      // The server expires abandoned import sessions independently.
    }
  }

  async function commitImport() {
    if (!managedImportsUrl || !pendingImport || pendingImport.selectedIds.length === 0) return;
    setImportBusy(true);
    setError(null);
    try {
      const selected = pendingImport.candidates.filter(({ id }) =>
        pendingImport.selectedIds.includes(id)
      );
      const files = pendingImport.files.filter(({ path }) => selected.some((candidate) =>
        candidate.sourceRoot === "" || path.startsWith(`${candidate.sourceRoot}/`)
      ));
      for (const { file, path } of files) {
        let offset = 0;
        let sentEmptyFile = false;
        while (offset < file.size || (file.size === 0 && !sentEmptyFile)) {
          const chunk = file.slice(offset, Math.min(file.size, offset + pendingImport.maxChunkBytes));
          const response = await fetch(
            `${managedImportsUrl}/${encodeURIComponent(pendingImport.sessionId)}/files?path=${encodeURIComponent(path)}`,
            {
              method: "PUT",
              headers: { "x-file-offset": String(offset) },
              body: chunk,
            },
          );
          if (!response.ok) {
            const payload = await response.json() as { error?: string };
            throw { message: payload.error ?? `Could not upload ${path}.` };
          }
          offset += chunk.size;
          sentEmptyFile = true;
        }
      }
      const committed = await requestJson<{
        results: Array<{ runId: string }>;
      }>(`${managedImportsUrl}/${encodeURIComponent(pendingImport.sessionId)}/commit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ candidateIds: pendingImport.selectedIds }),
      });
      setPendingImport(null);
      const first = committed.results[0];
      if (first && await loadManagedRun(first.runId)) setManagedRunPickerOpen(false);
    } catch (caught) {
      setError(caught as GeneratorError);
    } finally {
      setImportBusy(false);
    }
  }

  async function generate(
    mode: TopicGenerationMode,
    requestedLanguage: ContentLanguage = uiLanguage,
    options: { preserveLocalizedCache?: boolean } = {},
  ) {
    const normalizedKeyword = keyword.trim();
    if (normalizedKeyword.length < 2) return;
    const requestKey = automationRequestKey(normalizedKeyword, strategy);

    setActiveMode(mode);
    setLoading(true);
    setError(null);
    setCategoryRoleRuntime(null);
    setBackgroundEvidence(null);
    setAutomation(null);
    setPagePreviewTypeRef(null);
    setHeroSelection(null);
    setShortcutSelection(null);
    setStartHereSelection(null);
    setCapabilityArtifacts(null);
    setContentSpec(null);
    setCapabilityContentReview(null);
    setVisualGenerationSpec(null);
    if (!options.preserveLocalizedCache) setLocalizedAutomationCache(null);
    setView("preview");
    setPreviewMode("distribution");

    try {
      const response = await fetch("/api/topic-generator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          keyword: normalizedKeyword,
          mode,
          strategy,
          language: requestedLanguage,
        }),
      });
      const payload = (await response.json()) as {
        plans?: TopicPlanMatrix;
        selectionRuns?: SelectionRuns;
        runtime?: {
          categoryRole?: CategoryRoleRuntimeEvidence;
        };
        heroSelection?: HeroSelectionRun;
        shortcutSelection?: ShortcutSelectionRun;
        startHereSelection?: StartHereSelectionRun;
        automation?: TopicPageAutomationRun;
        pagePreview?: { pageTypeRef: LandingPageTypeRef };
        capabilityArtifacts?: CapabilityArtifacts;
        backgroundEvidence?: TopicBackgroundEvidenceBundle;
        error?: GeneratorError;
      };

      if (!response.ok || !payload.plans) {
        throw payload.error ?? { message: "The generator returned an invalid response." };
      }

      setPlans(payload.plans);
      setSelectionRuns(payload.selectionRuns ?? null);
      setCategoryRoleRuntime(payload.runtime?.categoryRole ?? null);
      setBackgroundEvidence(payload.backgroundEvidence ?? null);
      setHeroSelection(payload.heroSelection ?? null);
      setShortcutSelection(payload.shortcutSelection ?? null);
      setStartHereSelection(payload.startHereSelection ?? null);
      setPagePreviewTypeRef(payload.pagePreview?.pageTypeRef ?? null);
      setCapabilityArtifacts(payload.capabilityArtifacts ?? null);
      const nextAutomation = payload.automation ?? null;
      setAutomation(nextAutomation);
      if (mode === "page" && nextAutomation?.status === "ready") {
        const sourceSignature = automationSourceSignature(nextAutomation);
        setLocalizedAutomationCache((current) => {
          if (options.preserveLocalizedCache &&
              current?.requestKey === requestKey &&
              current.sourceSignature !== sourceSignature) {
            return current;
          }
          const canMerge = options.preserveLocalizedCache &&
            current?.requestKey === requestKey &&
            current.sourceSignature === sourceSignature;
          return {
            requestKey,
            sourceSignature,
            runs: {
              ...(canMerge ? current.runs : {}),
              [requestedLanguage]: nextAutomation,
            },
          };
        });
      }
      setView("preview");
      setPreviewMode(
        mode === "page" && nextAutomation?.status === "ready"
          ? "page"
          : "distribution",
      );
    } catch (caught) {
      const generatorError = caught as GeneratorError;
      setPreviewMode("distribution");
      setError({
        code: generatorError.code,
        message: generatorError.message || "The topic page could not be generated.",
        sourceUrl: generatorError.sourceUrl,
      });
    } finally {
      setLoading(false);
    }
  }

  async function generateCapability(mode: "content" | "visual") {
    if (!capabilityArtifacts ||
        (mode === "visual" && (!contentSpec || !capabilityContentReview))) return;
    setActiveMode(mode);
    setLoading(true);
    setError(null);
    if (mode === "content") {
      setContentSpec(null);
      setCapabilityContentReview(null);
      setVisualGenerationSpec(null);
    } else {
      setVisualGenerationSpec(null);
    }
    setView("preview");
    setPreviewMode("page");
    try {
      const response = await fetch("/api/topic-generator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          language: uiLanguage,
          artifacts: capabilityArtifacts,
          ...(mode === "visual"
            ? { contentSpec, contentReview: capabilityContentReview }
            : {}),
        }),
      });
      const payload = await response.json() as {
        contentSpec?: TopicPageContentSpec;
        contentReview?: TopicPageContentReviewDecision;
        backgroundEvidence?: TopicBackgroundEvidenceBundle;
        generationSpec?: TopicPageGenerationSpec;
        error?: GeneratorError;
      };
      if (!response.ok || !payload.contentSpec) {
        throw payload.error ?? { message: "The capability returned an invalid response." };
      }
      setContentSpec(payload.contentSpec);
      setCapabilityContentReview(payload.contentReview ?? null);
      if (payload.backgroundEvidence) {
        setBackgroundEvidence(payload.backgroundEvidence);
        setCapabilityArtifacts((current) => current
          ? { ...current, backgroundEvidence: payload.backgroundEvidence }
          : current);
      }
      if (mode === "visual") {
        if (!payload.generationSpec) {
          throw { message: "Visual generation returned no page generation spec." };
        }
        setVisualGenerationSpec(payload.generationSpec);
      }
    } catch (caught) {
      const generatorError = caught as GeneratorError;
      setError({
        code: generatorError.code,
        message: generatorError.message || "The capability could not be completed.",
        sourceUrl: generatorError.sourceUrl,
      });
    } finally {
      setLoading(false);
    }
  }

  function changeLanguage(value: string) {
    const requestedLanguage = value as ContentLanguage;
    if (requestedLanguage === uiLanguage) return;
    if (sourceMode === "load" && currentDetail && isManagedV2Detail(currentDetail)) {
      const content = currentDetail.stageResults["content-review"] as
        ContentReviewStageOutput | undefined;
      const localizedContent = managedContentForLanguage(content, requestedLanguage);
      if (localizedContent) {
        const nextAutomation = managedAutomation(currentDetail);
        const page = currentDetail.stageResults["page-generation"] as
          PageGenerationStageOutput | undefined;
        const hasGeneratedPage = nextAutomation?.generationSpec.language === requestedLanguage;
        setUiLanguage(requestedLanguage);
        setContentSpec(localizedContent.contentSpec);
        setCapabilityContentReview(localizedContent.contentReview);
        setAutomation(hasGeneratedPage ? nextAutomation : null);
        setVisualGenerationSpec(hasGeneratedPage ? page?.generationSpec ?? null : null);
        setView("preview");
        setPreviewMode("page");
        setActiveMode(hasGeneratedPage ? "page" : "content");
        setError(null);
        return;
      }
    }
    if (sourceMode === "load" && currentDetail &&
        requestedLanguage === currentDetail.summary.language) {
      applyManagedDetail(currentDetail);
      return;
    }

    const requestKey = automationRequestKey(keyword.trim(), strategy);
    const activeCache = localizedAutomationCache?.requestKey === requestKey
      ? localizedAutomationCache
      : null;
    const cachedAutomation = activeCache?.runs[requestedLanguage];
    const shouldResolvePage = activeCache !== null &&
      view === "preview" && previewMode === "page";
    setUiLanguage(requestedLanguage);
    setError(null);

    if (plans !== null && capabilityArtifacts !== null && activeMode !== "page") {
      setActiveMode("selection");
      setContentSpec(null);
      setCapabilityContentReview(null);
      setVisualGenerationSpec(null);
      setAutomation(null);
      return;
    }

    if (plans !== null && activeMode === "selection") return;

    setHeroSelection(null);
    setShortcutSelection(null);
    setStartHereSelection(null);

    if (cachedAutomation) {
      setAutomation(cachedAutomation);
    } else if (shouldResolvePage) {
      void generate("page", requestedLanguage, { preserveLocalizedCache: true });
    } else {
      setAutomation(null);
    }
  }

  return (
    <main
      className={styles.generatorShell}
      lang={uiLanguage === "zh" ? "zh-CN" : "en"}
    >
      <header className={styles.generatorHeader}>
        <div className={styles.brandLockup}>
          <strong>TOPIC GENERATOR</strong>
        </div>
        <div className={styles.headerLanguage}>
          <SegmentedControl
            label={copy.interfaceLanguage}
            options={LANGUAGE_OPTIONS}
            value={uiLanguage}
            onValueChange={changeLanguage}
            name="ui-language"
            disabled={loading}
          />
        </div>
      </header>

      <section className={styles.generatorGrid}>
        <aside className={styles.generatorControls}>
          <form
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              if (managedRunApiBase) void advanceManaged("page");
              else void generate("page");
            }}
            className={styles.generatorForm}
          >
          {managedRunApiBase && (
            <>
          <section
            className={styles.runLibrary}
            aria-label={uiLanguage === "zh" ? "主题来源" : "Topic source"}
          >
            <SegmentedControl
              label={uiLanguage === "zh" ? "主题来源" : "Topic source"}
              options={[{
                value: "input",
                label: uiLanguage === "zh" ? "输入" : "Input",
              }, {
                value: "load",
                label: uiLanguage === "zh" ? "加载" : "Load",
              }]}
              value={sourceMode}
              name="topic-source"
              disabled={loading}
              onValueChange={(nextMode) => {
                const mode = nextMode as TopicSourceMode;
                if (mode === "input" && sourceMode !== "input") {
                  clearManagedRunState();
                }
                setSourceMode(mode);
              }}
            />
            {sourceMode === "load" && (
              <div
                id="topic-source-load-panel"
                className={styles.sourceLoadPanel}
              >
                <div className={currentRun
                  ? styles.loadedTopicField
                  : styles.runLibraryActions}
                >
                  {currentRun && (
                    <WorkbenchTextField
                      label={copy.loadedKeywordLabel}
                      value={currentRun.keyword}
                      disabled
                    />
                  )}
                  <WorkbenchButton
                    type="button"
                    variant="secondary"
                    className={currentRun ? styles.changeTopicButton : undefined}
                    onClick={(event) => {
                      managedRunTriggerRef.current = event.currentTarget;
                      void openManagedRunPicker();
                    }}
                    disabled={loading || importBusy || managedRunPickerBusy}
                    aria-expanded={managedRunPickerOpen}
                    aria-controls="topic-generator-managed-run-picker"
                    aria-haspopup="dialog"
                  >
                    {managedRunPickerBusy
                      ? uiLanguage === "zh" ? "正在读取…" : "Reading…"
                      : importBusy
                        ? uiLanguage === "zh" ? "正在导入…" : "Importing…"
                        : currentRun
                          ? uiLanguage === "zh" ? "更换主题" : "Change topic"
                          : uiLanguage === "zh" ? "加载主题" : "Load topic"}
                  </WorkbenchButton>
                </div>
                {currentRun && (
                  <WorkbenchSelect
                    label={copy.strategyLabel}
                    options={STRATEGY_OPTIONS[uiLanguage]}
                    value={strategy}
                    onValueChange={(value) => {
                      setStrategy(value as ProductSelectionStrategy);
                    }}
                    name="selection-strategy"
                    disabled={loading}
                  />
                )}
              </div>
            )}
              <input
                ref={directoryInputRef}
                className={styles.hiddenDirectoryInput}
                type="file"
                multiple
                onChange={handleDirectoryInput}
                {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
              />
            <dialog
              ref={managedRunDialogRef}
              id="topic-generator-managed-run-picker"
              className={styles.managedRunDialog}
              aria-labelledby="managed-run-dialog-title"
              onClose={() => {
                setManagedRunPickerOpen(false);
                setPendingRunDeletion(null);
                managedRunTriggerRef.current?.focus();
              }}
              onCancel={(event) => {
                event.preventDefault();
                closeManagedRunPicker();
              }}
              onClick={(event) => {
                if (event.target === event.currentTarget) closeManagedRunPicker();
              }}
            >
              {managedRunPickerOpen && (
                <div className={styles.managedRunDialogPanel}>
                  <header className={styles.managedRunDialogHeader}>
                    <div>
                      <span>{uiLanguage === "zh" ? "主题存储" : "Topic storage"}</span>
                      <h2 id="managed-run-dialog-title">
                        {pendingRunDeletion
                          ? uiLanguage === "zh" ? "删除已存主题" : "Delete saved topic"
                          : pendingImport
                          ? uiLanguage === "zh" ? "选择一个要导入的运行" : "Choose one run to import"
                          : managedRunPickerBusy
                          ? uiLanguage === "zh" ? "选择已存主题" : "Choose a saved topic"
                          : uiLanguage === "zh"
                            ? `选择已存主题（${managedRunOptions.length}）`
                            : `Choose a saved topic (${managedRunOptions.length})`}
                      </h2>
                    </div>
                    <button
                      type="button"
                      className={styles.managedRunDialogClose}
                      aria-label={uiLanguage === "zh" ? "关闭主题列表" : "Close topic list"}
                      disabled={importBusy || runDeleteBusy}
                      onClick={closeManagedRunPicker}
                    >
                      <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  </header>
                  <div className={styles.managedRunDialogBody} aria-live="polite">
                    {pendingRunDeletion ? (
                      <div className={styles.managedRunDeleteConfirmation}>
                        <p>
                          {uiLanguage === "zh"
                            ? "将删除受管目录中的主题副本："
                            : "This removes the managed copy of the topic:"}
                        </p>
                        <strong>{pendingRunDeletion.keyword}</strong>
                        <code>{pendingRunDeletion.runId}</code>
                        <p>
                          {uiLanguage === "zh"
                            ? "删除后会从主题列表移除并移入回收区；外部导入源不会被修改。"
                            : "It will leave this list and move to recoverable trash. The external import source will not be changed."}
                        </p>
                        {managedRunPickerError && (
                          <p role="alert">{managedRunPickerError}</p>
                        )}
                      </div>
                    ) : pendingImport ? (
                      <div className={styles.importCandidates}>
                        {pendingImport.candidates.map((candidate) => (
                          <label
                            key={candidate.id}
                            data-selected={pendingImport.selectedIds.includes(candidate.id)
                              ? ""
                              : undefined}
                          >
                            <input
                              type="radio"
                              name="topic-generator-import-candidate"
                              checked={pendingImport.selectedIds.includes(candidate.id)}
                              disabled={!candidate.valid || importBusy}
                              onChange={(event) => setPendingImport((current) => current
                                ? {
                                    ...current,
                                    selectedIds: event.target.checked ? [candidate.id] : [],
                                  }
                                : current)}
                            />
                            <span>
                              <b>{candidate.keyword || candidate.runId}</b>
                              <small>{candidate.schemaVersion} · {candidate.valid ? "READY" : "INVALID"}</small>
                              {candidate.issues.map((issue) => <small key={issue}>{issue}</small>)}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : managedRunPickerBusy ? (
                      <p>{uiLanguage === "zh" ? "正在读取受管目录…" : "Reading managed storage…"}</p>
                    ) : managedRunPickerError ? (
                      <p role="alert">{managedRunPickerError}</p>
                    ) : managedRunOptions.length > 0 ? (
                      <div
                        className={styles.managedRunOptions}
                        role="radiogroup"
                        aria-label={uiLanguage === "zh" ? "已存主题" : "Saved topics"}
                      >
                        {managedRunOptions.map((run) => (
                          <label
                            className={styles.managedRunOption}
                            key={run.runId}
                            data-selected={selectedManagedRunId === run.runId ? "" : undefined}
                          >
                            <input
                              type="radio"
                              name="topic-generator-managed-run"
                              checked={selectedManagedRunId === run.runId}
                              disabled={loading}
                              onChange={() => setSelectedManagedRunId(run.runId)}
                            />
                            <span className={styles.managedRunOptionContent}>
                              <b>{run.keyword}</b>
                              <small className={styles.managedRunOptionMeta}>
                                <time dateTime={run.updatedAt}>{run.updatedAt.slice(0, 10)}</time>
                                <span aria-hidden="true">·</span>
                                <code title={run.runId}>{run.runId}</code>
                              </small>
                            </span>
                            <small className={styles.managedRunOptionStatus}>
                              {MANAGED_RUN_STATUS_LABELS[uiLanguage][run.status]}
                            </small>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p>{uiLanguage === "zh" ? "受管目录中还没有主题。" : "No saved topics yet."}</p>
                    )}
                  </div>
                  <footer className={styles.managedRunDialogFooter}>
                    {pendingImport || pendingRunDeletion ? <span aria-hidden="true" /> : (
                      <WorkbenchButton
                        type="button"
                        variant="secondary"
                        size="default"
                        disabled={loading || importBusy || runDeleteBusy}
                        onClick={() => void chooseExternalImportDirectory()}
                      >
                        {uiLanguage === "zh" ? "导入" : "Import"}
                      </WorkbenchButton>
                    )}
                    <div className={styles.managedRunDialogFooterActions}>
                      {!pendingImport && !pendingRunDeletion && (
                        <WorkbenchButton
                          type="button"
                          variant="secondary"
                          size="default"
                          className={styles.managedRunDeleteButton}
                          disabled={loading || runDeleteBusy || !selectedManagedRun}
                          onClick={() => setPendingRunDeletion(selectedManagedRun)}
                        >
                          {uiLanguage === "zh" ? "删除" : "Delete"}
                        </WorkbenchButton>
                      )}
                      {(pendingImport || pendingRunDeletion) && (
                        <WorkbenchButton
                          type="button"
                          variant="secondary"
                          size="default"
                          disabled={importBusy || runDeleteBusy}
                          onClick={() => pendingRunDeletion
                            ? setPendingRunDeletion(null)
                            : void cancelImport()}
                        >
                          {uiLanguage === "zh" ? "取消" : "Cancel"}
                        </WorkbenchButton>
                      )}
                      {pendingRunDeletion ? (
                        <WorkbenchButton
                          type="button"
                          variant="emphasis"
                          size="default"
                          disabled={runDeleteBusy}
                          onClick={() => void deleteSelectedManagedRun()}
                        >
                          {runDeleteBusy
                            ? uiLanguage === "zh" ? "正在删除…" : "Deleting…"
                            : uiLanguage === "zh" ? "确认删除" : "Confirm delete"}
                        </WorkbenchButton>
                      ) : (
                        <WorkbenchButton
                          type="button"
                          variant="emphasis"
                          size="default"
                          disabled={pendingImport
                            ? importBusy || pendingImport.selectedIds.length === 0
                            : loading || managedRunPickerBusy || !selectedManagedRunId}
                          onClick={() => pendingImport
                            ? void commitImport()
                            : void loadSelectedManagedRun()}
                        >
                          {pendingImport
                            ? uiLanguage === "zh" ? "导入运行" : "Import run"
                            : uiLanguage === "zh" ? "加载" : "Load"}
                        </WorkbenchButton>
                      )}
                    </div>
                  </footer>
                </div>
              )}
            </dialog>
          </section>
            </>
          )}
          {(!managedRunApiBase || sourceMode === "input") && (
            <div
              id={managedRunApiBase ? "topic-source-input-panel" : undefined}
              className={styles.sourceInputPanel}
            >
            <div
              className={styles.keywordControl}
              onBlurCapture={(event) => {
                const nextTarget = event.relatedTarget;
                if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
                  setExamplesOpen(false);
                }
              }}
            >
              <WorkbenchTextField
                label={copy.keywordLabel}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                minLength={2}
                maxLength={80}
                placeholder={copy.keywordPlaceholder}
                autoComplete="off"
                disabled={loading}
                onPointerDown={() => setExamplesOpen(true)}
                aria-expanded={examplesOpen}
                aria-controls="topic-keyword-examples"
              />
              {examplesOpen ? (
                <div
                  id="topic-keyword-examples"
                  className={styles.examples}
                  aria-label={copy.examplesLabel}
                >
                  {EXAMPLE_KEYWORDS.map((example) => (
                    <WorkbenchButton
                      key={example}
                      type="button"
                      onClick={() => {
                        setKeyword(example);
                        setExamplesOpen(false);
                      }}
                    >
                      {example}
                    </WorkbenchButton>
                  ))}
                </div>
              ) : null}
            </div>
            <WorkbenchSelect
              label={copy.strategyLabel}
              options={STRATEGY_OPTIONS[uiLanguage]}
              value={strategy}
              onValueChange={(value) => setStrategy(value as ProductSelectionStrategy)}
              name="selection-strategy"
              disabled={loading}
            />
            </div>
          )}
            <div className={styles.generatorActions}>
              <WorkbenchButton
                className={styles.generateButton}
                type="submit"
                variant="emphasis"
                size="default"
                disabled={loading || keyword.trim().length < 2 || managedActionUnavailable}
              >
                {loading && activeMode === "page"
                  ? copy.generatingPage
                  : copy.generatePage}
              </WorkbenchButton>
              <WorkbenchButton
                className={styles.selectionButton}
                type="button"
                variant="secondary"
                size="default"
                disabled={loading || keyword.trim().length < 2 || managedActionUnavailable}
                onClick={() => {
                  if (managedRunApiBase) void advanceManaged("selection");
                  else void generate("selection");
                }}
              >
                {loading && activeMode === "selection"
                  ? copy.selectingProducts
                  : copy.selectProducts}
              </WorkbenchButton>
              <div className={styles.capabilityActions}>
                <WorkbenchButton
                  type="button"
                  variant="secondary"
                  size="default"
                  disabled={loading || managedActionUnavailable ||
                    (!managedHistoryReady && !capabilityArtifacts)}
                  onClick={() => {
                    if (managedRunApiBase) void advanceManaged("content");
                    else void generateCapability("content");
                  }}
                >
                  {loading && activeMode === "content"
                    ? copy.generatingContent
                    : copy.generateContent}
                </WorkbenchButton>
                <WorkbenchButton
                  type="button"
                  variant="secondary"
                  size="default"
                  disabled={loading || managedActionUnavailable ||
                    (!managedHistoryReady && (
                      !capabilityArtifacts || !contentSpec || !capabilityContentReview
                    ))}
                  onClick={() => {
                    if (managedRunApiBase) void advanceManaged("visual");
                    else void generateCapability("visual");
                  }}
                >
                  {loading && activeMode === "visual"
                    ? copy.generatingVisuals
                    : copy.generateVisuals}
                </WorkbenchButton>
              </div>
            </div>
            {currentRun && (
              <section
                className={styles.managedRunOutput}
                aria-label={uiLanguage === "zh" ? "生成内容" : "Generated content"}
              >
                {currentRun.status === "awaiting-approval" && (
                  <WorkbenchButton
                    type="button"
                    variant="secondary"
                    disabled={loading}
                    onClick={() => void approveManagedRun()}
                  >
                    {uiLanguage === "zh" ? "批准最终页面" : "Approve final page"}
                  </WorkbenchButton>
                )}
                {currentRun.deliverables.some(({ status }) => status === "ready") && (
                  <div className={styles.deliverableLinks}>
                    <a
                      className={styles.topicPackageDownload}
                      href={`${managedRunsUrl}/${encodeURIComponent(currentRun.runId)}/archive`}
                      download={`${currentRun.runId}.zip`}
                    >
                      <HugeiconsIcon
                        icon={ArchiveArrowDownIcon}
                        size={16}
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                      <span>
                        {uiLanguage === "zh" ? "下载主题包" : "Download topic package"}
                      </span>
                    </a>
                  </div>
                )}
              </section>
            )}
          </form>

        </aside>

        <section className={styles.previewStage} aria-label={copy.previewLabel}>
          <div className={styles.stageBar}>
            <WorkbenchTabs<ResultView>
              className={styles.stageTabs}
              label={copy.resultViewsLabel}
              options={(["preview", "workflow", "analysis", "pools", "rules"] as const)
                .map((tab) => ({
                  value: tab,
                  label: copy.tabs[tab],
                  disabled:
                    (tab !== "workflow" && tab !== "preview" && !plan) ||
                    (tab !== "workflow" && tab !== "preview" && loading) ||
                    (plan?.generationMode === "selection" && tab === "rules"),
                }))}
              value={view}
              onValueChange={setView}
              variant="stage"
            />
              <span className={styles.stageMeta}>
                {plan
                ? `${plan.site.toUpperCase()} · ${targetLocale} · ${strategyLabel.toUpperCase()} · ${planStatusLabel(plan, uiLanguage).toUpperCase()}`
                : `1440 PX · LIGHT · ${targetLocale}`}
              </span>
          </div>

          <div className={`${styles.deviceMat} ${styles.generatorMat}`}>
            <div
              className={`${styles.previewFrameWrap} ${styles.generatorFrame}`}
              style={{ width: "min(100%, 1440px)" }}
            >
              <div className={styles.frameViewport}>
                {view === "workflow" ? (
                  <div className={`${styles.resultBody} ${styles.workflowResultBody}`}>
                    <WorkflowView
                      uiLanguage={uiLanguage}
                      plan={plan}
                      categoryRoleRuntime={strategy === "category-role" ? categoryRoleRuntime : null}
                      automation={automation}
                    />
                  </div>
                ) : view === "analysis" && plan && !loading ? (
                  <TopicAnalysisView
                    plan={plan}
                    uiLanguage={uiLanguage}
                    backgroundEvidence={backgroundEvidence}
                  />
                ) : loading ? (
                  <LoadingState
                    keyword={keyword.trim()}
                    language={uiLanguage}
                    mode={activeMode}
                    strategy={strategy}
                  />
                ) : error || runError ? (
                  <ErrorState
                    error={error ?? runError!}
                    language={uiLanguage}
                  />
                ) : !plan ? (
                  <EmptyState language={uiLanguage} />
                ) : (
                  <>
                    <header className={styles.runHeader}>
                      <div>
                        <span>
                          {plan.generationMode === "selection"
                            ? moduleSelectionStatus === "ready"
                              ? uiLanguage === "zh"
                                ? "已完成中文选品与模块组合复核"
                                : "English selection and module review complete"
                              : moduleSelectionStatus === "fallback"
                                ? uiLanguage === "zh"
                                  ? capabilityArtifacts
                                    ? "已完成中文选品与规则模块方案"
                                    : "已完成中文选品；页面模块方案未就绪"
                                  : capabilityArtifacts
                                    ? "English selection and rule-based module plan complete"
                                    : "English selection complete; page module plan is not ready"
                                : copy.selectedPlan
                            : copy.generatedPlan}
                          {` · ${plan.site.toUpperCase()} · ${strategyLabel}`}
                        </span>
                        <h2>{plan.keyword}</h2>
                        <p>{plan.statusReason}</p>
                      </div>
                      <div className={styles.runMeta}>
                        <span className={styles[plan.status]}>{planStatusLabel(plan, uiLanguage)}</span>
                        <WorkbenchLink
                          href={plan.source.searchUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {copy.sourceLink}
                        </WorkbenchLink>
                      </div>
                    </header>

                    <div
                      className={styles.statBar}
                      aria-label={poolCoverage
                        ? uiLanguage === "zh" ? "商品池统计" : "Product pool statistics"
                        : uiLanguage === "zh" ? "运行统计" : "Run statistics"}
                    >
                      {poolCoverage ? (
                        <>
                          <div><span>{uiLanguage === "zh" ? "目录商品" : "Catalog products"}</span><strong>{poolCoverage.totalCount}</strong></div>
                          <div><span>{uiLanguage === "zh" ? "在售商品" : "In-stock products"}</span><strong>{poolCoverageInStock}</strong></div>
                          <div><span>{uiLanguage === "zh" ? "缺货商品" : "Out-of-stock products"}</span><strong>{poolCoverageOutOfStock}</strong></div>
                          <div><span>{uiLanguage === "zh" ? "排序方式" : "Sort order"}</span><strong>{uiLanguage === "zh" ? "周销量降序" : "Weekly sales descending"}</strong></div>
                        </>
                      ) : (
                        <>
                          {plan.selectionStrategy.id === "category-role" ? (
                            <>
                              <div><span>{uiLanguage === "zh" ? "模块商品池" : "Module product pool"}</span><strong>{plan.pools.primaryIds.length}</strong></div>
                              <div><span>{uiLanguage === "zh" ? "已选分类" : "Selected categories"}</span><strong>{plan.selectedCategories.length}</strong></div>
                            </>
                          ) : (
                            <>
                              <div><span>{uiLanguage === "zh" ? "主商品池" : "PrimaryPool"}</span><strong>{plan.pools.primaryIds.length}</strong></div>
                              <div><span>{uiLanguage === "zh" ? "相关商品池" : "RelatedPool"}</span><strong>{plan.pools.relatedIds.length}</strong></div>
                            </>
                          )}
                          <div>
                            <span>{copy.visibleModules}</span>
                            <strong>
                              {automation?.status === "ready"
                                ? automation.generationSpec.modules.length
                                : plan.modules.filter((module) => module.visible).length}
                            </strong>
                          </div>
                          <div>
                            {capabilityContentReview ? (
                              <>
                                <span>{uiLanguage === "zh" ? "文案审核" : "Content review"}</span>
                                <strong>{uiLanguage === "zh" ? "已通过" : "Approved"}</strong>
                              </>
                            ) : plan.generationMode === "selection" ? (
                              <>
                                <span>{uiLanguage === "zh" ? "模块选品" : "Module selection"}</span>
                                <strong>
                                  {moduleSelectionStatus === "ready"
                                    ? uiLanguage === "zh" ? "Agent 已复核" : "Agent reviewed"
                                    : moduleSelectionStatus === "fallback"
                                      ? uiLanguage === "zh" ? "规则预选" : "Rule fallback"
                                      : uiLanguage === "zh" ? "等待复核" : "Awaiting review"}
                                </strong>
                              </>
                            ) : (
                              <>
                                <span>{copy.assetMode}</span>
                                <strong>
                                  {automation?.status === "ready"
                                    ? uiLanguage === "zh" ? "生成图片" : "Generated assets"
                                    : copy.sourceImages}
                                </strong>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {view === "preview" && (
                      <WorkbenchTabs<PreviewMode>
                        label={copy.previewModesLabel}
                        options={(["distribution", "page"] as const).map((mode) => ({
                          value: mode,
                          label: copy.previewModes[mode],
                          id: `preview-${mode}-tab`,
                          controls: `preview-${mode}-panel`,
                        }))}
                        value={previewMode}
                        onValueChange={setPreviewMode}
                        variant="inset"
                      />
                    )}

                    <div
                      id={view === "preview" ? `preview-${previewMode}-panel` : undefined}
                      role={view === "preview" ? "tabpanel" : undefined}
                      aria-labelledby={view === "preview" ? `preview-${previewMode}-tab` : undefined}
                      className={`${styles.resultBody} ${
                        view === "pools" ? styles.poolResultBody : ""
                      } ${
                        view === "preview" && previewMode === "page"
                          ? styles.pagePreviewResultBody
                          : ""
                      }`}
                    >
                      {view === "preview" && (
                        previewMode === "distribution"
                          ? <PreviewView
                              plan={plan}
                              heroSelection={resolvedHeroSelection}
                              shortcutSelection={resolvedShortcutSelection}
                              startHereSelection={resolvedStartHereSelection}
                            />
                          : automation?.status === "ready"
                            ? PagePreviewRenderer
                              ? (
                                  <PagePreviewRenderer
                                    mode="generated"
                                    pageTypeRef={automation.executionPlan.pageTypeRef}
                                    generationSpec={automation.generationSpec}
                                  />
                                )
                              : <PageGenerationPreview spec={automation.generationSpec} />
                            : visualGenerationSpec && PagePreviewRenderer && capabilityArtifacts
                              ? (
                                  <PagePreviewRenderer
                                    mode="visual"
                                    pageTypeRef={capabilityArtifacts.pageTypeRef}
                                    generationSpec={visualGenerationSpec}
                                  />
                                )
                              : contentSpec && PagePreviewRenderer && capabilityArtifacts
                                ? (
                                    <PagePreviewRenderer
                                      mode="content"
                                      pageTypeRef={capabilityArtifacts.pageTypeRef}
                                      plan={plan}
                                      contentSpec={contentSpec}
                                    />
                                  )
                            : PagePreviewRenderer && pagePreviewTypeRef
                              ? (
                                  <PagePreviewRenderer
                                    mode="selection"
                                    pageTypeRef={pagePreviewTypeRef}
                                    plan={plan}
                                  />
                                )
                              : <SelectionPagePreview plan={plan} />
                      )}
                      {view === "pools" && <PoolsView plan={plan} uiLanguage={uiLanguage} />}
                      {view === "rules" && (
                        <RulesView
                          plan={plan}
                          uiLanguage={uiLanguage}
                          automation={automation}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
