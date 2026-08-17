# TOPIC GENERATOR core

TOPIC GENERATOR 的可复用核心包，提供主题词购物意图分析、Yami 商品目录检索与 Topic 页面规划。它不依赖模型 SDK 或 API Key。

## Public Interfaces

```ts
import {
  analyzeTopicIntent,
  buildTopicPagePlanMatrix,
  evaluateTopicIntentCases,
  loadCatalogSnapshot,
  resolveTopicIntent,
} from "@yami/topic-generator";

const analysis = await analyzeTopicIntent("ANUA");
const plans = buildTopicPagePlanMatrix(analysis.snapshot);
```

`loadCatalogSnapshot` 是商品来源 Seam。默认依次尝试结构化 Yami Adapter 与公开搜索 Adapter，并返回完整 `attempts`。

`resolveTopicIntent` 是深层语义 Module。它先生成目录规则基线，再对可选 `SemanticProposal` 做字段级证据校验；不受支持的 Agent 结论不会进入 ThemeIntent。

确定性基线使用版本化中英目录等价词归一化用户表达（例如“爽肤水”与目录 `Toners`），并把未被目录证据覆盖的剩余词保留为 `unverified` 条件。场景词首次检索覆盖过低时，Adapter 会尝试可审阅的收窄检索词，最终实际使用的词记录在 `snapshot.retrievalTerms`。

`analyzeTopicIntent` 组合这两个 Interface。返回值包含 `intent`、商品证据 `snapshot`、`fallbackUsed`、`attempts` 与 `proposalReview`。

## CLI

```bash
pnpm topic-generator:analyze -- --keyword "ANUA" --pretty
pnpm topic-generator:analyze -- --keyword "movie night" \
  --proposal packages/topic-generator/docs/semantic-proposal.example.json \
  --output /tmp/topic-generator-runs \
  --pretty
```

CLI 输出版本化的 `theme-intent/v2` JSON，包含核心实体、购物动作、条件、逐项约束状态、候选解释、证据等级、Adapter 尝试与提案审查。

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

## Runtime boundary

部署应用不执行模型推理，也不读取模型 Provider Key。Codex/Kiro Agent 在外部生成可选提案，独立 Topic Generator Host 的 HTTP handler 只调用目录 Adapter、TopicIntent 与 PagePlan Modules。详见产品内的 [`architecture.md`](architecture.md)；仓库治理决策记录在 ADR 004 与 ADR 005。

## Validate

```bash
pnpm --filter @yami/topic-generator test
pnpm --filter @yami/topic-generator typecheck
pnpm --filter @yami/topic-generator build
pnpm --filter @yami/topic-generator-app build
```
