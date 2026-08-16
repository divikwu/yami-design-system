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
  ContentLanguage,
  ProductSelectionStrategy,
  TopicModulePlan,
  TopicPagePlan,
  TopicPlanMatrix,
  TopicProduct,
} from "@/app/lib/topic-generator/types";
import {
  SegmentedControl,
  WorkbenchButton,
  WorkbenchLink,
  WorkbenchSelect,
  WorkbenchTextField,
} from "@/app/ui/workbench-controls";
import styles from "./topic-generator.module.css";

type ResultView = "preview" | "pools" | "workflow" | "rules";
type WorkflowMode = "diagram" | "details";

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
const STRATEGY_OPTIONS = [
  { value: "relevance", label: "精准匹配" },
  { value: "category-role", label: "分类角色" },
] as const;
const PREVIEW_COPY = {
  en: {
    ready: "Generator ready",
    headline: <>One keyword.<br />One reviewable page plan.</>,
    description: "Search live Yami inventory, freeze a small product pool, then assign only the modules that have enough evidence to render.",
    blueprintLabel: "Planned Topic Landing Page modules",
    hero: "Theme Hero",
    categories: "Featured categories",
    popular: "Popular picks",
    explore: "Explore more · PrimaryPool only",
    running: "Run in progress",
    building: (keyword: string) => `Building “${keyword}”`,
    loadingSteps: [
      "Searching the Yami United States catalog",
      "Freezing one candidate snapshot for both strategies and languages",
      "Assigning products to eligible modules",
      "Composing copy and page preview",
    ],
    blocked: "RUN BLOCKED",
    errorTitle: "Yami search could not be converted into a page plan.",
    sourceLink: "Open the source search ↗",
  },
  zh: {
    ready: "生成器已就绪",
    headline: <>一个关键词。<br />一份可审阅的<br />页面方案。</>,
    description: "搜索 Yami 实时商品，冻结精简商品池，并只装配具备足够证据的页面模块。",
    blueprintLabel: "规划中的 Topic Landing Page 模块",
    hero: "主题 Hero",
    categories: "精选分类",
    popular: "热门精选",
    explore: "探索更多 · 仅使用 PrimaryPool",
    running: "正在生成",
    building: (keyword: string) => `正在生成“${keyword}”`,
    loadingSteps: [
      "搜索 Yami 美国站商品目录",
      "为两套策略和两种语言冻结同一候选快照",
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
  loadingSteps: string[];
  blocked: string;
  errorTitle: string;
  sourceLink: string;
}>;

function ProductCard({
  product,
  showReason = false,
}: {
  product: TopicProduct;
  showReason?: boolean;
}) {
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
        {showReason && (
          <span className={styles.selectionReason}>{product.selectionReason}</span>
        )}
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
}: {
  keyword: string;
  language: ContentLanguage;
}) {
  const copy = PREVIEW_COPY[language];

  return (
    <section className={styles.loadingState} aria-live="polite">
      <div className={styles.loadingMark}><span /></div>
      <span className={styles.kicker}>{copy.running}</span>
      <h2>{copy.building(keyword)}</h2>
      <ol>
        {copy.loadingSteps.map((step, index) => (
          <li key={step}>
            <span>{String(index + 1).padStart(2, "0")}</span> {step}
          </li>
        ))}
      </ol>
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

function PreviewView({ plan }: { plan: TopicPagePlan }) {
  const productUnit = plan.language === "zh" ? "件商品" : "products";
  const itemUnit = plan.language === "zh" ? "件" : "items";
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
                  <span><strong>{group.label}</strong>{group.productIds.length} {productUnit}</span>
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
                  <span>{group.productIds.length} {itemUnit}</span>
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

function PoolsView({ plan }: { plan: TopicPagePlan }) {
  const primary = plan.products.filter((product) => product.pool === "primary");
  const related = plan.products.filter((product) => product.pool === "related");
  const primaryDescription = plan.selectionStrategy.id === "category-role"
    ? "selected by category role for module assignment"
    : "eligible for core modules";

  return (
    <div className={styles.poolView}>
      <section>
        <header className={styles.viewHeading}>
          <div><span>03 · Product pool</span><h3>PrimaryPool</h3></div>
          <p>{primary.length} products · {primaryDescription}</p>
        </header>
        <div className={styles.poolGrid}>
          {primary.map((product) => (
            <ProductCard key={product.id} product={product} showReason />
          ))}
        </div>
      </section>
      <section>
        <header className={styles.viewHeading}>
          <div><span>Fallback only</span><h3>RelatedPool</h3></div>
          <p>{related.length} products · never used to fill core modules</p>
        </header>
        {related.length > 0 ? (
          <div className={styles.poolGrid}>
            {related.map((product) => (
              <ProductCard key={product.id} product={product} showReason />
            ))}
          </div>
        ) : (
          <p className={styles.noRelated}>No related candidates were needed for this run.</p>
        )}
      </section>
    </div>
  );
}

function WorkflowView({ language }: { language: ContentLanguage }) {
  const isChinese = language === "zh";
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
        ? "美国站（固定）、内容语言（用户选择）、选品策略（用户选择）"
        : "US site (fixed), content language (user selected), selection strategy (user selected)",
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
        ? "theme_keyword、raw_keyword、site=us、content_language、selection_strategy、source_scope、site_config_version、run_id 与 brief_hash；确认主题路由输入、固定站点、生成配置和证据边界"
        : "theme_keyword, raw_keyword, site=us, content_language, selection_strategy, source_scope, site_config_version, run_id, and brief_hash; confirm the routing input, fixed site, generation settings, and evidence boundary",
      action: isChinese
        ? "解析主题意图，匹配页面模板，并加载组件与商品槽位规则"
        : "Interpret the topic intent, match a page template, and load component and product slot rules",
      actionGroups: isChinese
        ? [
            {
              title: "AI 理解主题与购物意图",
              items: [
                "解析主题实体、修饰条件、购物目标和场景",
                "生成候选 ThemeIntent",
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
              title: "AI interprets the topic and shopping intent",
              items: [
                "Parse the topic entity, modifiers, shopping goal, and scenarios",
                "Create a candidate ThemeIntent",
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
      action: isChinese ? "生成所选语言文案、绑定来源商品图、生成所需资产并装配组件" : "Generate localized copy, bind source product imagery, create required assets, and assemble modules",
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
                {isChinese ? "AI 如何理解主题词与购物意图" : "How AI interprets the topic and shopping intent"}
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
                ? "这里展示可审阅的结构化解析规则，不展示模型的隐藏思考过程，也不会在尚未执行时伪造本次解析结果。"
                : "This shows reviewable structured interpretation rules, not hidden model reasoning or fabricated results before a run."}
            </p>
            <section className={styles.intentHelpSection}>
              <span>01</span>
              <h4>{isChinese ? "读取生成配置" : "Read generation settings"}</h4>
              <ul>
                <li>{isChinese ? "主题输入：theme_keyword 与 raw_keyword" : "Topic input: theme_keyword and raw_keyword"}</li>
                <li>{isChinese ? "销售站点：固定为美国站 site=us" : "Sales site: fixed to site=us"}</li>
                <li>{isChinese ? "运行配置：内容语言、选品策略与证据边界" : "Run settings: content language, selection strategy, and evidence boundary"}</li>
              </ul>
            </section>
            <section className={styles.intentHelpSection}>
              <span>02</span>
              <h4>{isChinese ? "生成候选 ThemeIntent" : "Create a candidate ThemeIntent"}</h4>
              <dl className={styles.intentHelpFields}>
                <div>
                  <dt>{isChinese ? "主题实体" : "Topic entity"}</dt>
                  <dd>{isChinese ? "用户要找的品牌、商品或活动" : "The brand, product, or activity the user seeks"}</dd>
                </div>
                <div>
                  <dt>{isChinese ? "修饰条件" : "Modifiers"}</dt>
                  <dd>{isChinese ? "功效、口味、材质、规格或适用对象" : "Benefits, flavor, material, size, or intended user"}</dd>
                </div>
                <div>
                  <dt>{isChinese ? "购物目标" : "Shopping goal"}</dt>
                  <dd>{isChinese ? "浏览品牌、寻找商品、搭配购买或解决需求" : "Browse a brand, find a product, pair purchases, or solve a need"}</dd>
                </div>
                <div>
                  <dt>{isChinese ? "使用场景" : "Scenario"}</dt>
                  <dd>{isChinese ? "使用时机、空间、节日、流程或人群" : "Timing, space, occasion, routine, or audience"}</dd>
                </div>
                <div>
                  <dt>{isChinese ? "主题类型" : "Topic type"}</dt>
                  <dd>brand / product / activity</dd>
                </div>
              </dl>
            </section>
            <div className={styles.intentHelpOutput}>
              <span>{isChinese ? "输出" : "Output"}</span>
              <strong>ThemeIntent</strong>
              <p>
                {isChinese
                  ? "当前入口仅说明通用解析规则；接入真实 ThemeIntent 后，再展示本次主题实体、购物意图、检索约束与证据摘要。"
                  : "This entry currently explains the generic interpretation rules. Once real ThemeIntent data is connected, it can show the run-specific topic entity, shopping intent, search constraints, and evidence summary."}
              </p>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function RulesView({ plan }: { plan: TopicPagePlan }) {
  return (
    <div className={styles.rulesView}>
      {plan.selectionStrategy.id === "category-role" && (
        <section>
          <header className={styles.viewHeading}>
            <div>
              <span>03 · Category selection</span>
              <h3>{plan.language === "zh" ? "候选分类与角色" : "Candidate categories and roles"}</h3>
            </div>
            <p>
              {plan.language === "zh"
                ? "由当前商品快照推断；目标配比为 5 core / 3 pairing / 2 accessory。"
                : "Inferred from the current product snapshot against a 5:3:2 role target."}
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
                    {category.reason} · {category.productIds.length}{" "}
                    {plan.language === "zh" ? "件商品" : "products"}
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
          <div><span>04 · PagePlan</span><h3>Module decisions</h3></div>
          <p>Optional modules must earn their place.</p>
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
                {module.visible ? "Visible" : "Hidden"}
              </span>
            </article>
          ))}
        </div>
      </section>
      <section className={styles.qaPanel}>
        <header>
          <span>06 · Automatic QA</span>
          <strong>{plan.status}</strong>
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
  const [language, setLanguage] = useState<ContentLanguage>("zh");
  const [strategy, setStrategy] = useState<ProductSelectionStrategy>("relevance");
  const [plans, setPlans] = useState<TopicPlanMatrix | null>(null);
  const [view, setView] = useState<ResultView>("workflow");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<GeneratorError | null>(null);
  const plan = plans?.[language]?.[strategy] ?? null;

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedKeyword = keyword.trim();
    if (normalizedKeyword.length < 2) return;

    setLoading(true);
    setError(null);
    setView("preview");

    try {
      const response = await fetch("/api/topic-generator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword: normalizedKeyword }),
      });
      const payload = (await response.json()) as {
        plans?: TopicPlanMatrix;
        error?: GeneratorError;
      };

      if (!response.ok || !payload.plans) {
        throw payload.error ?? { message: "The generator returned an invalid response." };
      }

      setPlans(payload.plans);
      setView("preview");
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
    <main className={`canvas-shell ${styles.generatorShell}`}>
      <header className="canvas-header">
        <div className="brand-lockup">
          <strong>PROTOTYPE</strong>
          <span className={styles.headerContext}>/ TOPIC GENERATOR</span>
        </div>
      </header>

      <section className="canvas-grid">
        <aside className={`control-panel ${styles.generatorControls}`}>
          <form onSubmit={generate} className={styles.generatorForm}>
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
                label="搜索关键词"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                minLength={2}
                maxLength={80}
                placeholder="例如 ANUA、ramen"
                autoComplete="off"
                onPointerDown={() => setExamplesOpen(true)}
                aria-expanded={examplesOpen}
                aria-controls="topic-keyword-examples"
              />
              {examplesOpen ? (
                <div
                  id="topic-keyword-examples"
                  className={styles.examples}
                  aria-label="示例关键词"
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
            <div className={styles.languageTabs}>
              <SegmentedControl
                label="内容语言"
                options={LANGUAGE_OPTIONS}
                value={language}
                onValueChange={(value) => setLanguage(value as ContentLanguage)}
                name="content-language"
                disabled={loading}
              />
            </div>
            <WorkbenchSelect
              label="选品策略"
              options={STRATEGY_OPTIONS}
              value={strategy}
              onValueChange={(value) => setStrategy(value as ProductSelectionStrategy)}
              name="selection-strategy"
              disabled={loading}
            />
            <WorkbenchButton
              className={styles.generateButton}
              type="submit"
              variant="emphasis"
              size="default"
              disabled={loading || keyword.trim().length < 2}
            >
              {loading ? "正在生成…" : "生成 Topic 页面"}
            </WorkbenchButton>
          </form>

          <div className="path-readout">
            <span>当前运行</span>
            <code>
              {loading
                ? "SEARCHING YAMI…"
                : plan
                  ? `${plan.site.toUpperCase()} · ${plan.language.toUpperCase()} · ${plan.selectionStrategy.id.toUpperCase()} · ${plan.status.toUpperCase()}`
                  : "等待输入"}
            </code>
          </div>

        </aside>

        <section className="preview-stage" aria-label="Topic 页面生成预览区">
          <div className="stage-bar">
            <nav className={styles.stageViews} aria-label="生成结果视图">
              {(["workflow", "preview", "pools", "rules"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  disabled={tab !== "workflow" && (!plan || loading)}
                  aria-current={view === tab ? "page" : undefined}
                  onClick={() => setView(tab)}
                >
                  {tab === "workflow"
                    ? "自动化流程"
                    : tab === "preview"
                      ? "页面预览"
                      : tab === "pools"
                        ? "商品池"
                        : "规则与 QA"}
                </button>
              ))}
            </nav>
            <span className="stage-meta">
              {plan
                ? `${plan.language.toUpperCase()} · ${plan.selectionStrategy.label.toUpperCase()} · ${plan.status.toUpperCase()}`
                : `1440 PX · LIGHT · ${language.toUpperCase()}`}
            </span>
          </div>

          <div className={`device-mat ${styles.generatorMat}`}>
            <div
              className={`preview-frame-wrap ${styles.generatorFrame}`}
              style={{ width: "min(100%, 1440px)" }}
            >
              <div className={styles.frameViewport}>
                {view === "workflow" ? (
                  <div className={`${styles.resultBody} ${styles.workflowResultBody}`}>
                    <WorkflowView language={language} />
                  </div>
                ) : loading ? (
                  <LoadingState keyword={keyword.trim()} language={language} />
                ) : error ? (
                  <ErrorState error={error} language={language} />
                ) : !plan ? (
                  <EmptyState language={language} />
                ) : (
                  <>
                    <header className={styles.runHeader}>
                      <div>
                        <span>
                          {plan.language === "zh" ? "已生成页面方案" : "Generated plan"}
                          {` · ${plan.site.toUpperCase()} · ${plan.selectionStrategy.label}`}
                        </span>
                        <h2>{plan.keyword}</h2>
                        <p>{plan.statusReason}</p>
                      </div>
                      <div className={styles.runMeta}>
                        <span className={styles[plan.status]}>{plan.status}</span>
                        <WorkbenchLink
                          href={plan.source.searchUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          查看 Yami 来源 ↗
                        </WorkbenchLink>
                      </div>
                    </header>

                    <div className={styles.statBar}>
                      <div><span>PrimaryPool</span><strong>{plan.pools.primaryIds.length}</strong></div>
                      <div><span>RelatedPool</span><strong>{plan.pools.relatedIds.length}</strong></div>
                      <div>
                        <span>{plan.language === "zh" ? "显示模块" : "Visible modules"}</span>
                        <strong>{plan.modules.filter((module) => module.visible).length}</strong>
                      </div>
                      <div>
                        <span>{plan.language === "zh" ? "图片模式" : "Asset mode"}</span>
                        <strong>{plan.language === "zh" ? "来源商品图" : "Source images"}</strong>
                      </div>
                    </div>

                    <div className={styles.resultBody}>
                      {view === "preview" && <PreviewView plan={plan} />}
                      {view === "pools" && <PoolsView plan={plan} />}
                      {view === "rules" && <RulesView plan={plan} />}
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
