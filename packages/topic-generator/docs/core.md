# TOPIC GENERATOR core

TOPIC GENERATOR 的可复用核心包，提供主题词购物意图分析、Yami 商品目录检索与 Topic 页面规划。它不依赖模型 SDK 或 API Key。

## Public Interfaces

```ts
import {
  analyzeTopicIntent,
  buildTopicPagePlanMatrix,
  loadCatalogSnapshot,
  resolveTopicIntent,
} from "@yami/topic-generator";

const analysis = await analyzeTopicIntent("ANUA");
const plans = buildTopicPagePlanMatrix(analysis.snapshot);
```

`loadCatalogSnapshot` 是商品来源 Seam。默认依次尝试结构化 Yami Adapter 与公开搜索 Adapter，并返回完整 `attempts`。

`resolveTopicIntent` 是深层语义 Module。它先生成目录规则基线，再对可选 `SemanticProposal` 做字段级证据校验；不受支持的 Agent 结论不会进入 ThemeIntent。

`analyzeTopicIntent` 组合这两个 Interface。返回值包含 `intent`、商品证据 `snapshot`、`fallbackUsed`、`attempts` 与 `proposalReview`。

## CLI

```bash
pnpm topic-generator:analyze -- --keyword "ANUA" --pretty
pnpm topic-generator:analyze -- --keyword "movie night" \
  --proposal packages/topic-generator/docs/semantic-proposal.example.json \
  --output /tmp/topic-generator-runs \
  --pretty
```

CLI 输出版本化的 `theme-intent/v1` JSON，包含结论、原因、置信度、Adapter 尝试、提案审查、候选商品数量与前五条商品证据。

`--proposal` 读取可选 `semantic-proposal/v1` JSON；它是 Agent 的不可信输入。`--output` 是唯一会写文件的开关，生成一个独立 run 目录，其中包含：

- `theme-intent.json`
- `catalog-snapshot.json`
- `page-plans.json`
- `run.json`（版本、来源引用与 SHA-256）

## Runtime boundary

部署应用不执行模型推理，也不读取模型 Provider Key。Codex/Kiro Agent 在外部生成可选提案，Canvas 的 HTTP handler 只调用目录 Adapter、TopicIntent 与 PagePlan Modules。详见产品内的 [`architecture.md`](architecture.md)；仓库治理决策记录在 ADR 004。

## Validate

```bash
pnpm --filter @yami/topic-generator test
pnpm --filter @yami/topic-generator typecheck
pnpm --filter @yami/topic-generator build
```
