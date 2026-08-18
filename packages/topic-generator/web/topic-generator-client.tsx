"use client";

import {
  AiBrain01Icon,
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
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
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
import type { ProductSelectionRun } from "../src/product-selection/contracts";
import {
  SegmentedControl,
  WorkbenchButton,
  WorkbenchLink,
  WorkbenchSelect,
  WorkbenchTextField,
} from "./workbench-controls";
import { TopicAnalysisView } from "./topic-analysis-view";
import { themeIntentDisplayCopy } from "./theme-intent-copy";
import styles from "./topic-generator.module.css";

type ResultView = "preview" | "pools" | "workflow" | "analysis" | "rules";
type WorkflowMode = "diagram" | "details";
type SelectionRuns = Partial<Record<ProductSelectionStrategy, ProductSelectionRun>>;

interface GeneratorError {
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
    keywordLabel: "Search keyword",
    keywordPlaceholder: "e.g. ANUA, ramen",
    examplesLabel: "Example keywords",
    interfaceLanguage: "Language",
    searching: "SEARCHING YAMI…",
    strategyLabel: "Product selection strategy",
    selectProducts: "Select products",
    selectingProducts: "Selecting…",
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
    generatedPlan: "Generated English page plan",
    selectedPlan: "Selected English product pools",
    sourceLink: "View Yami source ↗",
    visibleModules: "Visible modules",
    assetMode: "Asset mode",
    sourceImages: "Source images",
  },
  zh: {
    keywordLabel: "搜索关键词",
    keywordPlaceholder: "例如 ANUA、ramen",
    examplesLabel: "示例关键词",
    interfaceLanguage: "语言",
    searching: "正在搜索 YAMI…",
    strategyLabel: "选品策略",
    selectProducts: "选品",
    selectingProducts: "选品中…",
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
    generatedPlan: "已生成中文页面方案",
    selectedPlan: "已生成中文商品池",
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
    popular: "Popular picks",
    explore: "Explore more",
    running: "Run in progress",
    building: (keyword: string) => `Building “${keyword}”`,
    selecting: (keyword: string) => `Selecting products for “${keyword}”`,
    loadingSteps: [
      "Searching the Yami United States catalog",
      "Running the selected versioned product strategy",
      "Assigning products to eligible modules",
      "Composing copy and page preview",
    ],
    blocked: "RUN BLOCKED",
    errorTitle: "Yami search could not be converted into a page plan.",
    sourceLink: "Open the source search ↗",
  },
  zh: {
    ready: "主题页生成器",
    headline: <>从主题词到<br />可审阅的主题页</>,
    description: "先完成主题识别与选品，再生成标题、描述和商品图片。",
    blueprintLabel: "规划中的 Topic Landing Page 模块",
    hero: "主题 Hero",
    categories: "精选分类",
    popular: "热门精选",
    explore: "探索更多",
    running: "正在生成",
    building: (keyword: string) => `正在生成“${keyword}”`,
    selecting: (keyword: string) => `正在为“${keyword}”选品`,
    loadingSteps: [
      "搜索 Yami 美国站商品目录",
      "执行所选的版本化选品策略",
      "将商品分配给符合条件的模块",
      "生成文案与页面预览",
    ],
    blocked: "生成已阻止",
    errorTitle: "Yami 搜索结果无法转换为页面方案。",
    sourceLink: "打开来源搜索 ↗",
  },
} satisfies Record<ContentLanguage, {
  ready: string;
  headline: ReactNode;
  description: string;
  blueprintLabel: string;
  hero: string;
  categories: string;
  popular: string;
  explore: string;
  running: string;
  building(keyword: string): string;
  selecting(keyword: string): string;
  loadingSteps: string[];
  blocked: string;
  errorTitle: string;
  sourceLink: string;
}>;

function ProductCard({ product }: { product: TopicProduct }) {
  return (
    <a
      className={styles.productCard}
      href={product.productUrl}
      target="_blank"
      rel="noreferrer"
    >
      <span className={styles.productImageWrap}>
        <img
          src={product.imageUrl}
          alt={product.title}
          width={750}
          height={750}
          loading="lazy"
        />
        <span className={styles.rank}>#{product.sourceRank}</span>
      </span>
      <span className={styles.productMeta}>
        <span className={styles.productBrand}>{product.brand}</span>
        <strong>{product.title}</strong>
      </span>
    </a>
  );
}

function ModuleHeading({ module }: { module: TopicModulePlan }) {
  return (
    <header className={styles.moduleHeading}>
      <div>
        <span>{module.label}</span>
        <h3>{module.heading}</h3>
      </div>
      <p>{module.description}</p>
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
  mode: TopicGenerationMode;
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
      ]
    : [
        "Load and validate the complete taxonomy",
        "Request the category-role proposal from the Product Agent",
        "Run ten category queries and one discovery query",
        "Request the shopping-scene proposal from the Product Agent",
        "Allocate modules and deduplicate deterministically",
      ];
  const steps = strategy === "category-role" ? categoryRoleSteps : copy.loadingSteps;

  return (
    <section className={styles.loadingState} aria-live="polite">
      <div className={styles.loadingMark}><span /></div>
      <span className={styles.kicker}>{copy.running}</span>
      <h2>{mode === "selection" ? copy.selecting(keyword) : copy.building(keyword)}</h2>
      <ol>
        {steps.slice(0, mode === "selection" ? 4 : undefined).map((step, index) => (
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

  return (
    <section className={styles.errorState} role="alert">
      <span className={styles.errorCode}>{copy.blocked}</span>
      <h2>{copy.errorTitle}</h2>
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

function PreviewView({ plan }: { plan: TopicPagePlan }) {
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
  const heroProducts = productsFor("hero");
  const shortcutModule = moduleMap.get("shortcuts");
  const startHereModule = moduleMap.get("start-here");
  const popularModule = moduleMap.get("popular-picks");
  const brandModule = moduleMap.get("brand-spotlight");
  const exploreModule = moduleMap.get("explore-more");
  const shortcutProductIds = new Set(shortcutModule?.productIds ?? []);
  const shortcutGroups = plan.groups.filter((group) =>
    group.productIds.some((id) => shortcutProductIds.has(id)),
  );
  const exploreProductIds = new Set(exploreModule?.productIds ?? []);
  const exploreGroups = plan.groups.flatMap((group) => {
    const productIds = group.productIds.filter((id) => exploreProductIds.has(id));
    return productIds.length > 0 ? [{ ...group, productIds }] : [];
  });

  return (
    <div className={styles.pagePreview}>
      <section className={styles.topicHero}>
        <div className={styles.heroCopy}>
          <span>{plan.content.eyebrow}</span>
          <h1>{plan.content.headline}</h1>
          <p>{plan.content.description}</p>
          <ul>
            {plan.content.tags.map((tag) => <li key={tag}>{tag}</li>)}
          </ul>
        </div>
        <div className={styles.heroProducts}>
          {heroProducts.map((product, index) => (
            <a
              key={product.id}
              href={product.productUrl}
              target="_blank"
              rel="noreferrer"
              className={index === 0 ? styles.heroProductLead : undefined}
            >
              <img
                src={product.imageUrl}
                alt={product.title}
                width={750}
                height={750}
              />
              <span>{String(index + 1).padStart(2, "0")} · {product.brand}</span>
            </a>
          ))}
        </div>
      </section>

      {shortcutModule?.visible && (
        <section className={styles.previewModule}>
          <ModuleHeading module={shortcutModule} />
          <div className={styles.shortcutGrid}>
            {shortcutGroups.slice(0, 6).map((group) => {
              const product = productMap.get(group.productIds[0]);
              if (!product) return null;
              return (
                <a key={group.id} href={`#group-${group.id}`}>
                  <img src={product.imageUrl} alt="" width={750} height={750} loading="lazy" />
                  <span><strong>{group.label}</strong>{productCountLabel(group.productIds.length, plan.language)}</span>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {startHereModule?.visible && (
        <section className={styles.previewModule}>
          <ModuleHeading module={startHereModule} />
          <div className={styles.productGridCompact}>
            {productsFor("start-here").map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {popularModule?.visible && (
        <section className={styles.previewModule}>
          <ModuleHeading module={popularModule} />
          <div className={styles.productGrid}>
            {productsFor("popular-picks").map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {brandModule?.visible && (
        <section className={`${styles.previewModule} ${styles.brandModule}`}>
          <ModuleHeading module={brandModule} />
          <div className={styles.brandProducts}>
            {productsFor("brand-spotlight").map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {exploreModule?.visible && (
        <section className={styles.previewModule}>
          <ModuleHeading module={exploreModule} />
          <div className={styles.exploreGroups}>
            {exploreGroups.map((group) => (
              <section key={group.id} id={`group-${group.id}`} className={styles.exploreGroup}>
                <header>
                  <h4>{group.label}</h4>
                  <span>{itemCountLabel(group.productIds.length, plan.language)}</span>
                </header>
                <div className={styles.exploreRow}>
                  {group.productIds.map((id) => {
                    const product = productMap.get(id);
                    return product ? <ProductCard key={id} product={product} /> : null;
                  })}
                </div>
              </section>
            ))}
          </div>
        </section>
      )}
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
  const primary = plan.products.filter((product) => product.pool === "primary");
  const related = plan.products.filter((product) => product.pool === "related");
  const primaryDescription = plan.selectionStrategy.id === "category-role"
    ? zh ? "按分类角色选择，用于模块分配" : "selected by category role for module assignment"
    : zh ? "可用于核心模块" : "eligible for core modules";
  const relatedSelectionReason = zh
    ? "未进入主商品池的 Yami 相关候选，保留原始搜索顺序。"
    : "Related Yami candidates outside the primary pool, preserving original search order.";

  return (
    <div className={styles.poolView}>
      <section>
        <header className={styles.viewHeading}>
          <div>
            <span>03 · {zh ? "商品池" : "Product pool"}</span>
            <h3>{zh ? "主商品池" : "PrimaryPool"}</h3>
            <p className={styles.poolSelectionReason}>
              <strong>{zh ? "选品依据" : "Selection rationale"}</strong>
              {plan.selectionStrategy.description}
            </p>
          </div>
          <p>{productCountLabel(primary.length, uiLanguage)} · {primaryDescription}</p>
        </header>
        <div className={styles.poolGrid}>
          {primary.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
      <section>
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
      </section>
    </div>
  );
}

function WorkflowView({
  uiLanguage,
  plan,
  categoryRoleRuntime,
}: {
  uiLanguage: ContentLanguage;
  plan: TopicPagePlan | null;
  categoryRoleRuntime: CategoryRoleRuntimeEvidence | null;
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
      label: isChinese ? "识别主题并匹配模板" : "Interpret the topic and match a template",
      output: isChinese
        ? "确定购物意图、模板、组件契约与商品槽位规则"
        : "Resolve shopping intent, template, component contracts, and product slot rules",
      input: "GenerationBrief",
      read: isChinese
        ? "theme_keyword、raw_keyword、site=us、target_locale=zh-CN、selection_strategy、source_scope、site_config_version、run_id 与 brief_hash；确认主题路由输入、目标页面语言、生成配置和证据边界"
        : "theme_keyword, raw_keyword, site=us, target_locale=en-US, selection_strategy, source_scope, site_config_version, run_id, and brief_hash; confirm the routing input, target page language, generation settings, and evidence boundary",
      action: isChinese
        ? "解析主题意图，匹配页面模板，并加载组件与商品槽位规则"
        : "Interpret the topic intent, match a page template, and load component and product slot rules",
      actionGroups: isChinese
        ? [
            {
              title: "目录证据驱动的主题理解",
              items: [
                "读取商品接口返回的品牌、分类、标签与可售商品",
                "解析主题实体、修饰条件、购物目标和场景并生成 ThemeIntent",
                "此阶段不直接选择商品",
              ],
            },
            {
              title: "系统校验并生成可执行路由",
              items: [
                "校验 ThemeIntent 的字段、实体证据和主题类型",
                "只读检查目录覆盖度，不冻结商品池或具体 SKU",
                "匹配页面模板，加载组件契约与商品槽位规则",
                "生成 TemplateRoute",
              ],
            },
          ]
        : [
            {
              title: "Catalog-evidenced topic interpretation",
              items: [
                "Read brands, categories, tags, and available products from the catalog interface",
                "Interpret the entity, modifiers, shopping goal, and scenarios as ThemeIntent",
                "Do not select products at this stage",
              ],
            },
            {
              title: "The system validates and creates an executable route",
              items: [
                "Validate ThemeIntent fields, entity evidence, and topic type",
                "Check catalog coverage read-only without freezing product pools or specific SKUs",
                "Match the page template and load component contracts and product slot rules",
                "Create TemplateRoute",
              ],
            },
          ],
      result: "ThemeIntent + TemplateRoute",
      rollback: isChinese ? "主题或模板无法确定时返回 01 补充输入" : "Return to 01 when the topic or template cannot be resolved",
      state: "automatic",
    },
    {
      stage: "03",
      icon: WORKFLOW_ICONS.search,
      label: isChinese ? "获取商品并构建双层商品池" : "Fetch products and build two-layer pools",
      output: isChinese
        ? "搜索 Yami 美国站，验证商品并冻结 PrimaryPool 与 RelatedPool"
        : "Search Yami US, validate products, and freeze PrimaryPool and RelatedPool",
      input: "GenerationBrief + ThemeIntent + TemplateRoute",
      action: isChinese ? "读取商品身份、图片与可售状态，校验相关性并按用途分层" : "Read identity, imagery, and availability, validate relevance, and assign pool roles",
      result: "CatalogSnapshot + ProductPools",
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
      input: isChinese ? "模板规则与双层商品池" : "Template rules and product pools",
      action: isChinese ? "判断模块资格、排序并分配商品槽位" : "Resolve module eligibility, order, and product slots",
      result: "PagePlan",
      rollback: isChinese ? "商品槽位不足返回 03；模块配置问题留在 04 修复" : "Return slot shortages to 03; repair module configuration in 04",
      state: "automatic",
    },
    {
      stage: "05",
      icon: WORKFLOW_ICONS.content,
      label: isChinese ? "生成内容、图片并装配页面" : "Generate content and imagery, then assemble the page",
      output: isChinese
        ? "并行生成文案与视觉资产，汇合后确定性装配页面"
        : "Generate copy and visual assets in parallel, then assemble the page deterministically",
      input: isChinese ? "PagePlan + 来源证据" : "PagePlan + source evidence",
      action: isChinese ? "生成中文页面文案、绑定来源商品图、生成所需资产并装配组件" : "Generate English page copy, bind source product imagery, create required assets, and assemble modules",
      result: "PageGenerationSpec + Preview + AssetManifest",
      rollback: isChinese ? "文案或图片问题只重跑 05 的受影响节点" : "Rerun only the affected copy or image nodes in 05",
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

  return (
    <div className={styles.workflowView}>
      <div className={`${styles.viewHeading} ${styles.workflowHeader}`}>
        <div>
          <span>01–08 · Target automation workflow</span>
          <h3>{isChinese ? "理想的 Topic 页面生成流程" : "Ideal Topic page generation workflow"}</h3>
        </div>
        <p>
          {isChinese
            ? "阶段门控、局部回退；这是目标流程契约，不代表当前 MVP 已接通全部执行器。"
            : "Stage-gated with local rollback. This is the target contract, not proof that every MVP runner is connected."}
        </p>
      </div>
      {categoryRoleRuntime && (
        <CategoryRoleRuntimePanel
          evidence={categoryRoleRuntime}
          language={uiLanguage}
        />
      )}
      <div
        className={styles.workflowModeTabs}
        role="tablist"
        aria-label={isChinese ? "流程展示方式" : "Workflow display mode"}
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
                {isChinese ? "AI 如何理解主题词与购物意图" : "How AI and the system interpret the topic and shopping intent"}
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
                ? "当前实现把语义建议与商品事实分开：Product Agent 只提交受限语义提案；CatalogSnapshot 记录 Yami 目录证据；确定性 Module 逐字段接受或拒绝提案。Web Host 通过服务端配置调用外部 Agent，不向浏览器暴露令牌。"
                : "The implementation separates semantic suggestions from product facts: a Product Agent submits only bounded semantic proposals; CatalogSnapshot records Yami evidence; deterministic Modules accept or reject proposal fields. The Web Host calls an external Agent through server-only configuration without exposing its token to the browser."}
            </p>
            <section className={styles.intentHelpSection}>
              <span>01</span>
              <h4>{isChinese ? "输入" : "Input"}</h4>
              <ul>
                <li>{isChinese ? "读取用户关键词；当前只去除首尾空格，并校验长度为 2–80 个字符。" : "Read the user's keyword; currently only trim surrounding whitespace and validate a length of 2–80 characters."}</li>
                <li>{isChinese ? "销售站点固定为美国站 site=us；当前运行不推断 locale 或 currency。" : "Fix the sales site to site=us; the current run does not infer locale or currency."}</li>
                <li>{isChinese ? "先调用结构化目录 Adapter 读取 brandAgg、categoryAgg、tagAgg 与可售商品；失败后才使用公开搜索 Adapter，并保存每次尝试。" : "Try the structured catalog Adapter for brandAgg, categoryAgg, tagAgg, and available products first; use the public-search Adapter only after failure and retain every attempt."}</li>
                <li>{isChinese ? "Codex/Kiro CLI 可为歧义词附加 semantic-proposal/v1；分类角色策略可由 Web Host 的外部 Product Agent 自动提交两类受限提案。" : "Codex/Kiro CLI may attach semantic-proposal/v1 for an ambiguous phrase; the Web Host's external Product Agent may automatically submit the two bounded category-role proposals."}</li>
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
                      <li>{isChinese ? "品类实体：关键词精确命中 categoryAgg 的真实目录节点；否则使用可售商品覆盖最多的三级分类作为候选。" : "Category entity: the keyword exactly matches a real categoryAgg node; otherwise use the level-three category covering the most available products."}</li>
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
                      {isChinese ? "把关键词补全为可执行的购物目标，重点回答三个维度：" : "Complete the keyword as an actionable shopping goal across three dimensions:"}
                    </p>
                    <ul>
                      <li>{isChinese ? "系统先生成目录规则基线：brand 浏览品牌商品，product 寻找品类或属性商品，activity 围绕场景组合多个真实分类。" : "The system first builds a catalog-rule baseline: brand browses brand products, product finds category or attribute products, and activity assembles multiple real categories around a scenario."}</li>
                      <li>{isChinese ? "只有基线仍有歧义时，Agent 才可建议场景解释；提案必须由多个目录分类支撑，且不能覆盖精确品牌或品类。" : "Only when the baseline remains ambiguous may the Agent suggest a scenario interpretation; multiple catalog categories must support it, and it cannot override an exact brand or category."}</li>
                      <li>{isChinese ? "每个提案字段会记录为 accepted、partially-accepted 或 rejected；最终只保留一个主实体。" : "Each proposal field is recorded as accepted, partially accepted, or rejected; the final intent keeps one primary entity."}</li>
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
                      <li>{isChinese ? "must_include：保留规范品牌、品类、原关键词或已命中的目录标签；当前版本不自动生成 must_exclude。" : "must_include retains the canonical brand, category, original keyword, or matched catalog tags; the current version does not generate must_exclude automatically."}</li>
                      <li>{isChinese ? "search_terms：由原关键词、规范实体、标签和候选分类组成；当前版本不凭空生成别名。" : "search_terms combines the original keyword, canonical entity, tags, and candidate categories; the current version does not invent aliases."}</li>
                      <li>{isChinese ? "两阶段检索：先宽搜形成 CatalogSnapshot 证据，再用候选分类 ID 重搜商品；第二次检索失败时保留首轮快照，之后才解析 ThemeIntent。" : "Two-stage retrieval: broad search first forms CatalogSnapshot evidence, then candidate category IDs narrow the product search; the first snapshot remains usable if narrowing fails, and ThemeIntent is resolved afterward."}</li>
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
                      <td>{isChinese ? "浏览并购买 ANUA 的代表商品" : "Browse and buy representative ANUA products"}</td>
                      <td>{isChinese ? "必须属于 ANUA；召回核心系列与代表商品" : "Must belong to ANUA; recall core lines and representative products"}</td>
                      <td><code>brand</code></td>
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
                      <td>{isChinese ? "寻找同时命中 Sugar Free 与 Matcha 目录标签的零食" : "Find snacks matching both Sugar Free and Matcha catalog tags"}</td>
                      <td>{isChinese ? "使用 tagAgg 与真实分类作为证据；配料、糖分和过敏原仍需商品详情接口" : "Use tagAgg and real categories as evidence; ingredients, sugar, and allergens still require product-detail data"}</td>
                      <td><code>product</code></td>
                    </tr>
                    <tr>
                      <td><strong>{isChinese ? "小户型厨房收纳" : "Small-kitchen organization"}</strong></td>
                      <td>{isChinese ? "家居空间 + 使用场景" : "Home space + usage scenario"}</td>
                      <td>{isChinese ? "组合宽搜结果覆盖的厨房收纳真实分类" : "Assemble real kitchen-storage categories covered by broad search"}</td>
                      <td>{isChinese ? "按候选分类 ID 二次检索；尺寸、材质与承重尚未验证" : "Requery by candidate category IDs; dimensions, materials, and load capacity remain unverified"}</td>
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
                <li><strong>{isChinese ? "主题分类：" : "Topic classification: "}</strong>theme_type、catalog_domain、attribute_schema_version</li>
                <li><strong>{isChinese ? "规范化实体：" : "Canonical entity: "}</strong>entity_type、canonical_entity</li>
                <li><strong>{isChinese ? "购物意图：" : "Shopping intent: "}</strong>shopping_intent、shopping_goal、needs</li>
                <li><strong>{isChinese ? "检索约束：" : "Search constraints: "}</strong>must_include、must_exclude、search_terms</li>
                <li><strong>{isChinese ? "判断说明：" : "Decision explanation: "}</strong>reason、decision、evidenceLevel</li>
                <li>
                  <strong>{isChinese ? "运行审计：" : "Run review: "}</strong>
                  {isChinese
                    ? "Adapter attempts、proposalReview；CLI 可选输出带 SHA-256 的 Run Artifacts"
                    : "Adapter attempts, proposalReview; the CLI can optionally output SHA-256 Run Artifacts"}
                </li>
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
}: {
  plan: TopicPagePlan;
  uiLanguage: ContentLanguage;
}) {
  const zh = uiLanguage === "zh";
  const intentCopy = themeIntentDisplayCopy(plan.intent, plan.keyword, uiLanguage);

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
          <div><span>04 · PagePlan</span><h3>{zh ? "模块决策" : "Module decisions"}</h3></div>
          <p>{zh ? "可选模块必须具备足够证据才会显示。" : "Optional modules must earn their place."}</p>
        </header>
        <div className={styles.decisionList}>
          {plan.modules.map((module, index) => (
            <article key={module.id}>
              <span className={styles.decisionIndex}>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{module.label}</strong>
                <p>{module.reason}</p>
              </div>
              <span className={module.visible ? styles.isVisible : styles.isHidden}>
                {module.visible ? (zh ? "显示" : "Visible") : (zh ? "隐藏" : "Hidden")}
              </span>
            </article>
          ))}
        </div>
      </section>
      <section className={styles.qaPanel}>
        <header>
          <span>06 · {zh ? "自动 QA" : "Automatic QA"}</span>
          <strong>{planStatusLabel(plan, uiLanguage)}</strong>
        </header>
        <p>{plan.statusReason}</p>
        <ul>{plan.qualityNotes.map((note) => <li key={note}>{note}</li>)}</ul>
      </section>
    </div>
  );
}

export function TopicGenerator() {
  const [keyword, setKeyword] = useState("ANUA");
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [uiLanguage, setUiLanguage] = useState<ContentLanguage>("zh");
  const [strategy, setStrategy] = useState<ProductSelectionStrategy>("relevance");
  const [plans, setPlans] = useState<TopicPlanMatrix | null>(null);
  const [selectionRuns, setSelectionRuns] = useState<SelectionRuns | null>(null);
  const [categoryRoleRuntime, setCategoryRoleRuntime] =
    useState<CategoryRoleRuntimeEvidence | null>(null);
  const [view, setView] = useState<ResultView>("preview");
  const [activeMode, setActiveMode] = useState<TopicGenerationMode>("page");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeneratorError | null>(null);
  const plan = plans?.[uiLanguage]?.[strategy] ?? null;
  const runError = selectionRunError(selectionRuns?.[strategy], uiLanguage);
  const copy = UI_COPY[uiLanguage];
  const targetLocale = resultLocaleLabel(uiLanguage);
  const strategyLabel = STRATEGY_OPTIONS[uiLanguage].find(
    (option) => option.value === strategy,
  )?.label ?? strategy;

  async function generate(mode: TopicGenerationMode) {
    const normalizedKeyword = keyword.trim();
    if (normalizedKeyword.length < 2) return;

    setActiveMode(mode);
    setLoading(true);
    setError(null);
    setCategoryRoleRuntime(null);
    setView(mode === "selection" ? "pools" : "preview");

    try {
      const response = await fetch("/api/topic-generator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          keyword: normalizedKeyword,
          mode,
          strategy,
        }),
      });
      const payload = (await response.json()) as {
        plans?: TopicPlanMatrix;
        selectionRuns?: SelectionRuns;
        runtime?: { categoryRole?: CategoryRoleRuntimeEvidence };
        error?: GeneratorError;
      };

      if (!response.ok || !payload.plans) {
        throw payload.error ?? { message: "The generator returned an invalid response." };
      }

      setPlans(payload.plans);
      setSelectionRuns(payload.selectionRuns ?? null);
      setCategoryRoleRuntime(payload.runtime?.categoryRole ?? null);
      setView(mode === "selection" ? "pools" : "preview");
    } catch (caught) {
      const generatorError = caught as GeneratorError;
      setError({
        message: generatorError.message || "The topic page could not be generated.",
        sourceUrl: generatorError.sourceUrl,
      });
    } finally {
      setLoading(false);
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
            onValueChange={(value) => setUiLanguage(value as ContentLanguage)}
            name="ui-language"
          />
        </div>
      </header>

      <section className={styles.generatorGrid}>
        <aside className={styles.generatorControls}>
          <form
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              void generate("page");
            }}
            className={styles.generatorForm}
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
            <div className={styles.generatorActions}>
              <WorkbenchButton
                className={styles.generateButton}
                type="submit"
                variant="emphasis"
                size="default"
                disabled={loading || keyword.trim().length < 2}
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
                disabled={loading || keyword.trim().length < 2}
                onClick={() => void generate("selection")}
              >
                {loading && activeMode === "selection"
                  ? copy.selectingProducts
                  : copy.selectProducts}
              </WorkbenchButton>
            </div>
          </form>

          <div className={styles.pathReadout}>
            <span>{copy.currentRun}</span>
            <code>
              {loading
                ? copy.searching
                : plan
                  ? `${plan.site.toUpperCase()} · ${targetLocale} · ${strategyLabel.toUpperCase()} · ${planStatusLabel(plan, uiLanguage).toUpperCase()}`
                  : copy.waiting}
            </code>
          </div>

        </aside>

        <section className={styles.previewStage} aria-label={copy.previewLabel}>
          <div className={styles.stageBar}>
            <nav className={styles.stageViews} aria-label={copy.resultViewsLabel}>
              {(["preview", "workflow", "analysis", "pools", "rules"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  disabled={
                    (tab !== "workflow" && tab !== "preview" && !plan) ||
                    (tab !== "workflow" && loading) ||
                    (plan?.generationMode === "selection" && (tab === "preview" || tab === "rules"))
                  }
                  aria-current={view === tab ? "page" : undefined}
                  onClick={() => setView(tab)}
                >
                  {copy.tabs[tab]}
                </button>
              ))}
            </nav>
            <span className={styles.stageMeta}>
              {plan
                ? `${targetLocale} · ${strategyLabel.toUpperCase()} · ${planStatusLabel(plan, uiLanguage).toUpperCase()}`
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
                      categoryRoleRuntime={categoryRoleRuntime}
                    />
                  </div>
                ) : view === "analysis" && plan && !loading ? (
                  <TopicAnalysisView plan={plan} uiLanguage={uiLanguage} />
                ) : loading ? (
                  <LoadingState
                    keyword={keyword.trim()}
                    language={uiLanguage}
                    mode={activeMode}
                    strategy={strategy}
                  />
                ) : error || runError ? (
                  <ErrorState error={error ?? runError!} language={uiLanguage} />
                ) : !plan ? (
                  <EmptyState language={uiLanguage} />
                ) : (
                  <>
                    <header className={styles.runHeader}>
                      <div>
                        <span>
                          {plan.generationMode === "selection"
                            ? copy.selectedPlan
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

                    <div className={styles.statBar}>
                      <div><span>{uiLanguage === "zh" ? "主商品池" : "PrimaryPool"}</span><strong>{plan.pools.primaryIds.length}</strong></div>
                      <div><span>{uiLanguage === "zh" ? "相关商品池" : "RelatedPool"}</span><strong>{plan.pools.relatedIds.length}</strong></div>
                      <div>
                        <span>{copy.visibleModules}</span>
                        <strong>{plan.modules.filter((module) => module.visible).length}</strong>
                      </div>
                      <div>
                        <span>{copy.assetMode}</span>
                        <strong>{copy.sourceImages}</strong>
                      </div>
                    </div>

                    <div className={`${styles.resultBody} ${view === "pools" ? styles.poolResultBody : ""}`}>
                      {view === "preview" && plan.generationMode === "page" && (
                        <PreviewView plan={plan} />
                      )}
                      {view === "pools" && <PoolsView plan={plan} uiLanguage={uiLanguage} />}
                      {view === "rules" && <RulesView plan={plan} uiLanguage={uiLanguage} />}
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
