# TOPIC GENERATOR core

TOPIC GENERATOR 的可复用核心包，提供主题词购物意图分析、版本化选品、Yami 商品目录检索、
Topic 页面规划、证据绑定文案规范与图片资产清单。它不依赖模型或图片 Provider SDK。

## Public Interfaces

```ts
import {
  advancePageMerchandisingRun,
  advanceLandingPageOrchestrationRun,
  advanceTopicPageContentRun,
  advanceTopicPageExperienceReviewRun,
  advanceTopicPageVisualRun,
  analyzeTopicIntent,
  evaluateTopicIntentCases,
  loadCatalogSnapshot,
  resolveTopicIntent,
  runProductSelectionAgentWorkflow,
  runProductSelectionWorkflow,
  runTopicPageAutomationWorkflow,
  type ProductSelectionResult,
} from "@yami/topic-generator";

const analysis = await analyzeTopicIntent("ANUA");
declare const readyCategoryRoleSelection: ProductSelectionResult;
const pageTask = advancePageMerchandisingRun({
  intent: analysis.intent,
  selection: readyCategoryRoleSelection,
  templateRef: "topic-landing/topic@2",
});
if (pageTask.status === "ready") {
  const contentTask = advanceTopicPageContentRun({
    intent: analysis.intent,
    selection: readyCategoryRoleSelection,
    plan: pageTask.plan,
    language: "zh",
  });
  if (contentTask.status === "ready") {
    const visualTask = advanceTopicPageVisualRun({
      intent: analysis.intent,
      selection: readyCategoryRoleSelection,
      plan: pageTask.plan,
      contentSpec: contentTask.spec,
    });
  }
}
```

`loadCatalogSnapshot` 是商品来源 Seam。默认依次尝试结构化 Yami Adapter 与公开搜索 Adapter，并返回完整 `attempts`。Yami 接口和公开网页都可能在空搜索时展示通用推荐：结构化普通拉丁商品查询会按标题、品牌与商品分类字段过滤，网页 fallback 会按标题和品牌过滤；没有任何相关商品时返回 `no_products`，不能用推荐商品填充页面。两个 Adapter 都按商品 ID 稳定去重，并通过 `snapshot.quality` 暴露观测、接收、拒绝、截断数量以及字段缺失、不可售、重复和关键词不匹配原因。聚合返回的 `resultCount` 保留为来源检索规模，`productCount` 则始终按最终去重和过滤后的 Snapshot 商品池计算。中文与场景查询继续由目录别名、属性和场景证据规则解释，避免用英文标题字面匹配误删跨语言证据。

`resolveTopicIntent` 是深层语义 Module。它先生成目录规则基线，再对可选 `SemanticProposal` 做字段级证据校验；不受支持的 Agent 结论不会进入 ThemeIntent。

确定性基线使用版本化中英目录等价词归一化用户表达（例如“爽肤水”与目录 `Toners`），并把未被目录证据覆盖的剩余词保留为 `unverified` 条件。多个分类共享 `Drinks` 等通用别名时，当前 CatalogSnapshot 的商品覆盖量优先于分类名称长度。未验证的核心实体或修饰词会使非场景基线进入 `needs-review`；已识别场景可以完成主题解释，但场景条件仍单独保持 `unverified`，供后续商品详情验证。场景证据分为两级：分类路径、中英文别名或商品分类字段命中核心词/有效上下文词时属于功能性支持，至少两个功能性分类才可自动确认；仅商品标题或品牌命中时属于主题性线索，只保留低证据场景候选并进入复核。`summer`、`winter`、`small` 等通用修饰词不能单独成为分类证据。场景词首次检索覆盖过低时，Adapter 会尝试可审阅的收窄检索词，最终实际使用的词记录在 `snapshot.retrievalTerms`。

`analyzeTopicIntent` 组合这些 Interface。它先生成目录基线；精确品牌或品类直接结束，场景主题
或仍需复核的主题才读取 `BackgroundEvidence`，并且只有基线仍需复核且多个真实分类有证据时才调用可选
`TopicIntentAgent`。语义提案和目录候选使用同一排序与差值规则；提案未拉开候选差距时继续返回
`ambiguous`，不能以 Agent 结论绕过更强目录证据。Agent 失败或返回无效提案时保留需复核的目录基线，不让非必需 AI 阻断
整次分析。返回值包含 `intent`、商品证据 `snapshot`、`fallbackUsed`、`attempts`、
`proposalReview` 与 `backgroundEvidence`；HTTP Host 将这份完整证据原样提供给 Workbench。

`advanceLandingPageOrchestrationRun` 是受约束的编排 Interface。它先返回版本化页面类型、选品
策略与模板注册表，只接受一个 `landing-page-execution-plan-proposal/v1`。确定性核心会拒绝
未知 ref、未注册策略—模板组合、主题类型不兼容、身份或 ThemeIntent digest
漂移，并生成 `landing-page-execution-plan/v1`。Agent 不能自定义步骤、重试或回退策略。
内置注册表将已解析的 `brand`、`product`、`activity` 分别约束到 Brand、Topic、Campaign；
`ambiguous` 或 `needs-review` 仍会被阻止。

`runLandingPageOrchestratorAgentWorkflow` 可注入独立 `LandingPageOrchestratorAgent`；Agent 只
提议已注册路线，TypeScript 核心冻结执行顺序、actor、最大尝试次数与 Review 可回退阶段。

`runProductSelectionWorkflow` 是选品 Interface。每次运行引用一个不可变的 `<id>@<version>` 配置。`relevance/default@1` 不需要 Agent；`category-role/landing-page-agent@1` 通过 `ProductSelectionRun` 明确请求 taxonomy、分类提案、候选快照或场景提案，并只在全部校验通过后返回 `ProductSelectionResult`。

`runProductSelectionAgentWorkflow` 是可选的自动编排 Interface。调用方注入
`ProductSelectionAgent` 和 `CatalogCandidateAdapter` 后，它只自动完成状态机明确请求的
两次语义提案与一次候选召回；提案校验、配额、分组和去重仍由确定性 Module 拥有。
Agent 提案被拒绝时立即返回 `blocked`，不会继续召回或静默修复。

`analyzeCatalogCandidateQuality` 为每份候选快照生成独立、确定性的质量报告。请求失败、
缺失请求或商品引用缺失等高风险问题会让工作流返回 `blocked`；低覆盖、空分类、归属异常
与重复等中风险警告保持可见。报告不改写候选商品，也不替代
`reviewCatalogCandidateSnapshot` 的结构阻断规则。`SceneProposal` 还会独立校验所有场景与
商品组的商品 ID 全局唯一。

`createHttpProductSelectionAgent` 是可复用的服务端 Adapter。它通过
`product-selection-agent-request/v1` 发送当前 `ProductSelectionRun`，要求远端返回
`product-selection-agent-response/v1` 包装的单个 `proposal`。Adapter 支持 Bearer Token、
超时与带 Agent/stage/HTTP status 的操作错误；Token 由 Host 注入，不属于核心配置或页面响应。

`buildTopicPagePlanFromProductSelection` 是兼容现有 Web 的 PagePlan v1 Interface；它只消费
ready 的 ProductSelectionResult，不根据标题推断分类角色，也不重新分配商品。

`advancePageMerchandisingRun` 是 PagePlan v2 Interface。第一次调用返回完整且受限的
`needs-module-proposal` context；第二次传入 `ModuleMerchandisingProposal` 后，确定性校验器只
允许冻结商品池内、符合模块 pool/role/scene 规则的分配，并生成 `topic-page-plan/v2`。
分类角色的 Brand、Topic、Campaign `@2` 模板还会完整继承 ProductSelection 已确定的
StartHere、Popular、Brand、Explore 商品、顺序与场景分组；Hero 和 Shortcuts 只能引用这些
上游已拥有的商品。旧 `@1` 模板仅保留给历史任务回放。

`runPageMerchandisingAgentWorkflow` 可注入 Topic Strategy Agent 的页面陈列能力，
但 Agent 只生成 Proposal。模板规则、成员校验、商品复用策略、下游任务 ID 与 digest 都由
核心 Module 拥有。

`advanceTopicPageContentRun` 是 PageContent Interface。第一次调用只返回 PagePlan 已声明的
可见 `contentTaskId`、真实组件文案槽位和当前任务可引用的证据；第二次传入
`TopicPageContentProposal` 后，校验语言、任务/组件一致性、逐段 evidenceRefs 与三层 digest，
并生成 `topic-page-content-spec/v1`。它不接受商品重分配、图片提示词或无证据评论。

`runTopicContentAgentWorkflow` 可注入独立 `TopicContentAgent`，但 Agent 只生成文案 Proposal；
任务边界、字段完整性、证据范围和 ContentSpec digest 都由核心 Module 拥有。

`advanceTopicPageVisualRun` 是 PageVisual Interface。第一次调用重新校验 ready PagePlan 与
ContentSpec，只返回 `assetTaskIds` 声明的 Hero、快捷入口、场景和品牌横幅任务；第二次传入
`TopicPageVisualProposal` 后，校验任务、证据作用域、安全路径、MIME、尺寸比例、SHA-256、
焦点、背景色、alt text 模式及冻结的视觉生产模式，并生成 `topic-page-asset-manifest/v1`。
场景图任务可携带非阻断的构图建议，用于避让底部叠加文案。

`runTopicVisualAgentWorkflow` 可注入独立 `TopicVisualAgent`。Agent 按 `generated-images` 或
`source-product-images` 使用宿主媒体能力生成真实媒体与 Proposal；任务派生、元数据校验、证据范围与 Asset Manifest digest 仍由核心
Module 拥有。`asset-manifest-ready` 不等于资产文件和页面渲染硬 QA 已通过。

`runTopicPageAutomationWorkflow` 必须消费已校验的 `LandingPageExecutionPlan`。它按注册顺序
执行选品完成确认、模块陈列、文案、视觉、资产持久化、页面规范编译、硬 QA 与体验 Review；
任何拒绝、图片字节不匹配、QA 失败或 Review 修订请求都会停在明确 stage，不会静默回退。

`advanceTopicPageExperienceReviewRun` 只接受硬 QA 已通过的 GenerationSpec。它把 Review Agent
提案绑定到 execution plan、generation spec 与 QA 三个 digest，只允许引用生成模块、商品、
资产、QA 和 preview 证据；blocking issue 必须指向 `module-merchandising`、`content-writing`
或 `visual-generation`。Review Agent 只读且不能修复或发布。只有
`review-recommended` 决策才能编译 `topic-page-review-package/v1`。

## CLI

```bash
pnpm topic-generator:analyze -- --keyword "ANUA" --pretty
pnpm topic-generator:analyze -- --keyword "movie night" \
  --proposal packages/topic-generator/docs/semantic-proposal.example.json \
  --output /tmp/topic-generator-runs \
  --pretty
pnpm topic-generator:analyze -- --keyword "Matcha" \
  --selection-strategy category-role/landing-page-agent@1 \
  --taxonomy-tsv /path/to/categories.tsv \
  --category-proposal /path/to/categories.json \
  --pretty
pnpm topic-generator:analyze -- --keyword "Matcha" \
  --selection-strategy category-role/landing-page-agent@1 \
  --taxonomy /path/to/taxonomy.json \
  --category-proposal /path/to/categories.json \
  --candidate-snapshot /path/to/candidates.json \
  --scene-proposal /path/to/scenes.json \
  --page-template topic-landing/topic@2 \
  --module-proposal /path/to/modules.json \
  --content-language zh \
  --content-proposal /path/to/content.zh.json \
  --visual \
  --visual-proposal /path/to/visual.zh.json \
  --pretty
```

CLI 默认输出版本化的 `theme-intent/v2` 报告。显式传入 `--selection-strategy` 后，额外输出
`product-selection-run/v1`、本次新生成的候选 artifact，并在 ready 时输出 PagePlans。增加
`--page-template` 时输出 `page-merchandising-run/v1`；再增加 `--module-proposal` 才可能生成
ready 的 PagePlan v2。
增加 `--content-language en|zh` 后，ready PagePlan 会输出 `topic-page-content-run/v1`；再增加
`--content-proposal` 才可能生成 ready 的 `topic-page-content-spec/v1`。
增加 `--visual` 后，ready ContentSpec 会输出 `topic-page-visual-run/v1`；再增加
`--visual-proposal` 才可能生成 ready 的 `topic-page-asset-manifest/v1`。

`--taxonomy` 接收规范化 `catalog-taxonomy-snapshot/v1` JSON；`--taxonomy-tsv`
直接接收目标仓库的分类 TSV 导出格式，并在本地转换成同一份摘要绑定契约。

`--proposal` 读取可选 `semantic-proposal/v1` JSON；它是 Agent 的不可信输入。`--output` 是唯一会写文件的开关，生成一个独立 run 目录，其中包含：

- `theme-intent.json`
- `catalog-snapshot.json`
- `page-plans.json`
- `run.json`（版本、来源引用与 SHA-256）

## Semantic-contract evaluation

```bash
pnpm topic-generator:evaluate -- --pretty
pnpm topic-generator:evaluate -- --limit 5 --pretty
```

`evals/topic-intent-cases.json` 只保存关键词与人工期望语义；商品、分类覆盖和可售状态仍在运行时从 Yami 获取。评测报告将语义不匹配与目录访问错误分开统计。

`evals/product-selection-golden-cases.json` 保存 CategoryRole 的稳定不变量，不保存商品 ID。
`evaluateProductSelectionGoldenCase` 检查角色配比、候选请求、质量状态、场景数量、模块分组
与每组商品配额、RelatedPool 与跨模块重复。矩阵覆盖品牌、品类、场景 8 个主题，目录商品
变化不会无故使基线失效。

底层 API 可显式运行 Codex/Kiro 交接契约。task 只包含当前待处理的 `ProductSelectionRun`；
响应必须声明相同 stage，之后仍由确定性 Module 校验 proposal、digest 和目录证据。
Workbench 不显示该开发者入口，页面请求始终使用自动 HTTP Agent。

## Runtime boundary

核心包不执行模型或图片推理，也不读取 Provider Key。Codex/Kiro 或 HTTP Agent 在外部生成
提案和图片，独立 Topic Generator Host/CLI 调用目录 Adapter、TopicIntent、ProductSelection、
PageMerchandising/PagePlan、PageContent、PageVisual、PageGeneration 与 QA Modules。分类目录来自通过摘要校验的
approved HTTP 或 imported artifact，不复制目标仓库的生产数据库访问。详见
[`architecture.md`](architecture.md)；治理决策记录在 ADR 004、ADR 005 与 ADR 006。

当前 Codex/Kiro 通过共享 `page-orchestration`、`topic-intent`、`product-selection`、
`page-merchandising`、`content-writing`、`visual-generation` 与 `page-review` 七个 Skill 驱动
同一状态机。逻辑上拆为 Topic Page Orchestrator、Topic Strategy、Topic Content、Topic
Visual 与 Topic Review 五个 Agent；交互式 Agent 不由 Web 页面同步调用。独立 Next.js Host
使用 `TOPIC_GENERATOR_TAXONOMY_PATH`、
`TOPIC_GENERATOR_AGENT_ENDPOINT`、`TOPIC_GENERATOR_PAGE_AGENT_ENDPOINT` 与
`TOPIC_GENERATOR_ASSET_ROOT` 开启完整 API 自动链路。配置只在 Node.js Route Handler
读取；浏览器提交的 taxonomy、candidate snapshot 或 Agent proposal 不会覆盖自动 Host 的证据。

自动页面请求按统一 HTTP 契约完成编排、模块策划、文案、独立 Visual 与只读 Review stage。
Visual 返回的图片本体会在落盘前由 Host 解码器完成完整像素解码，并校验任务绑定、MIME、
真实尺寸和 SHA-256；落盘后 QA 会重新读取并再次解码。只有通过
`topic-page-qa-report/v1` 且 Review Agent 给出经核心验证的 `recommend-approval`，才会生成
`topic-page-review-package/v1`。用户审批和发布不在自动请求授权范围内。

## Validate

```bash
pnpm --filter @yami/topic-generator test
pnpm --filter @yami/topic-generator typecheck
pnpm --filter @yami/topic-generator build
pnpm --filter @yami/topic-generator-app build
```
