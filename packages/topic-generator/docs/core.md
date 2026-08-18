# TOPIC GENERATOR core

TOPIC GENERATOR 的可复用核心包，提供主题词购物意图分析、版本化选品、Yami 商品目录检索与 Topic 页面规划。它不依赖模型 SDK 或 API Key。

## Public Interfaces

```ts
import {
  analyzeTopicIntent,
  buildTopicPagePlanFromProductSelection,
  evaluateTopicIntentCases,
  loadCatalogSnapshot,
  resolveTopicIntent,
  runProductSelectionAgentWorkflow,
  runProductSelectionWorkflow,
} from "@yami/topic-generator";

const analysis = await analyzeTopicIntent("ANUA");
const selection = await runProductSelectionWorkflow({
  snapshot: analysis.snapshot,
  strategyRef: "relevance/default@1",
});
if (selection.run.status === "ready") {
  const plan = buildTopicPagePlanFromProductSelection(
    analysis.snapshot,
    selection.run.result,
  );
}
```

`loadCatalogSnapshot` 是商品来源 Seam。默认依次尝试结构化 Yami Adapter 与公开搜索 Adapter，并返回完整 `attempts`。

`resolveTopicIntent` 是深层语义 Module。它先生成目录规则基线，再对可选 `SemanticProposal` 做字段级证据校验；不受支持的 Agent 结论不会进入 ThemeIntent。

确定性基线使用版本化中英目录等价词归一化用户表达（例如“爽肤水”与目录 `Toners`），并把未被目录证据覆盖的剩余词保留为 `unverified` 条件。场景词首次检索覆盖过低时，Adapter 会尝试可审阅的收窄检索词，最终实际使用的词记录在 `snapshot.retrievalTerms`。

`analyzeTopicIntent` 组合这两个 Interface。返回值包含 `intent`、商品证据 `snapshot`、`fallbackUsed`、`attempts` 与 `proposalReview`。

`runProductSelectionWorkflow` 是选品 Interface。每次运行引用一个不可变的 `<id>@<version>` 配置。`relevance/default@1` 不需要 Agent；`category-role/landing-page-agent@1` 通过 `ProductSelectionRun` 明确请求 taxonomy、分类提案、候选快照或场景提案，并只在全部校验通过后返回 `ProductSelectionResult`。

`runProductSelectionAgentWorkflow` 是可选的自动编排 Interface。调用方注入
`ProductSelectionAgent` 和 `CatalogCandidateAdapter` 后，它只自动完成状态机明确请求的
两次语义提案与一次候选召回；提案校验、配额、分组和去重仍由确定性 Module 拥有。
Agent 提案被拒绝时立即返回 `blocked`，不会继续召回或静默修复。

`analyzeCatalogCandidateQuality` 为每份候选快照生成独立、确定性的质量报告。高风险问题
（请求失败、空分类、商品归属错误、跨分类重复）与低覆盖警告保持可见；报告不改写候选
商品，也不替代 `reviewCatalogCandidateSnapshot` 的结构阻断规则。

`createHttpProductSelectionAgent` 是可复用的服务端 Adapter。它通过
`product-selection-agent-request/v1` 发送当前 `ProductSelectionRun`，要求远端返回
`product-selection-agent-response/v1` 包装的单个 `proposal`。Adapter 支持 Bearer Token、
超时与带 Agent/stage/HTTP status 的操作错误；Token 由 Host 注入，不属于核心配置或页面响应。

`buildTopicPagePlanFromProductSelection` 只消费 ready 的 ProductSelectionResult。PagePlan 不再根据标题推断分类角色，也不重新分配商品。

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
```

CLI 默认输出版本化的 `theme-intent/v2` 报告。显式传入 `--selection-strategy` 后，额外输出 `product-selection-run/v1`、本次新生成的候选 artifact，并在 ready 时输出 PagePlans。

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

部署应用不执行模型推理，也不读取模型 Provider Key。Codex/Kiro Agent 在外部生成可选提案，独立 Topic Generator Host 只调用目录 Adapter、TopicIntent、ProductSelection 与 PagePlan Modules。分类目录来自通过摘要校验的 approved HTTP 或 imported artifact，不复制目标仓库的生产数据库访问。详见 [`architecture.md`](architecture.md)；治理决策记录在 ADR 004、ADR 005 与 ADR 006。

当前 Codex/Kiro 通过共享 `product-selection` Skill 驱动 CLI 状态机；交互式 Agent 不由 Web
页面同步调用。未来独立 Next.js Host 可使用 `TOPIC_GENERATOR_TAXONOMY_PATH` 与
`TOPIC_GENERATOR_AGENT_ENDPOINT` 开启 API 自动 CategoryRole。配置只在 Node.js Route Handler
读取；浏览器提交的 taxonomy、candidate snapshot 或 Agent proposal 不会覆盖自动 Host 的证据。

## Validate

```bash
pnpm --filter @yami/topic-generator test
pnpm --filter @yami/topic-generator typecheck
pnpm --filter @yami/topic-generator build
pnpm --filter @yami/topic-generator-app build
```
