# TOPIC GENERATOR

TOPIC GENERATOR 是一个从购物主题词生成可审阅 `ThemeIntent` 与 Topic 页面计划的独立产品。`packages/topic-generator` 是可复用核心，`apps/topic-generator` 是独立 Web 与 HTTP 宿主；Canvas 不参与它的运行时。

## 当前产品边界

```text
Codex / Kiro Product Agent ── optional semantic proposals ──────────┐
CLI / standalone Web Host ──────────────────────────────────────────┤
                                                                   ▼
CatalogSnapshot Adapters ─> TopicIntent ────────┐       ProductSelection
                                                │              │
Taxonomy artifact + Candidate Adapter ──────────┴──────────────┤
                                                               ▼
                                                ProductSelectionResult ─> PagePlan
```

- Core：`src`，负责 CatalogSnapshot、ThemeIntent、版本化 ProductSelection、HTTP handler、页面规划与 Run Artifacts。
- CLI：`topic-generator`，输出可被其他项目消费的 `theme-intent/v2` JSON；可接收 Agent 提案并显式保存运行产物。
- Eval：`topic-intent-eval`，用稳定的语义期望对比实时 Yami 目录分析，不复制或冻结商品库存。
- Web：`web`，提供可被 Next.js 宿主加载的产品界面。
- Host：`apps/topic-generator`，独立暴露 `/` 与 `/api/topic-generator`，默认端口 3300。
- Codex：`.agents/skills/product-selection` 暴露共享 ProductSelection Skill。
- Kiro：`.kiro/skills/product-selection` 暴露同一个 Skill，`.kiro/agents/topic-generator.json`
  注册受限的工作区 Agent；没有第二份选品提示词。
- Canvas：独立的设计系统与原型产品，不依赖 Topic Generator 包。

## 运行

```bash
pnpm topic-generator:analyze -- --keyword "ANUA" --pretty
pnpm topic-generator:evaluate -- --limit 5 --pretty
pnpm topic-generator:analyze -- --keyword "movie night" \
  --proposal ./proposal.json \
  --output ./topic-generator-runs \
  --pretty
pnpm topic-generator:analyze -- --keyword "Matcha" \
  --selection-strategy category-role/landing-page-agent@1 \
  --taxonomy-tsv ./categories.tsv \
  --pretty
pnpm dev:topic-generator
```

Web 页面：`http://127.0.0.1:3300/`

## 实现原则

1. 一个 Product Agent 负责歧义语言、分类语义与购物场景；Skill 只负责调用约定，不承载运行时业务逻辑。
2. Agent 可提交 `semantic-proposal/v1`，但 TopicIntent Module 会按 CatalogSnapshot 接受、缩窄或拒绝字段。Agent 不能声明品牌、品类、属性、可售或库存事实。
3. Yami 结构化 Adapter 提供品牌、品类、属性与商品证据；失败后才尝试公开搜索 Adapter，且每次尝试都会记录。
4. `reason` 只给可审阅依据，不暴露或伪造模型隐藏思考过程；界面展示证据等级与歧义状态，不把未校准规则分数呈现为正确率。
5. ProductSelection 配置以 `<id>@<version>` 共享；PagePlan 只消费 ready 的 ProductSelectionResult，不重新选品或推断分类角色。
6. 分类角色要求 SHA-256 绑定的完整 taxonomy artifact；不从搜索商品推断，也不复制目标仓库的数据库访问。
7. 每次候选召回产生独立的质量报告；空分类、低覆盖、归属错误、分类标题语义异常和重复商品会显式提示，但不会由 Agent 静默修复。
8. `--output` 才会写入带版本与 SHA-256 的 Run Artifacts，默认不持久化。
9. 当前 Codex/Kiro 交互式运行不使用模型 SDK、Provider Key 或服务端草稿存储；未来 HTTP
   Agent 继续复用相同提案契约。
10. ThemeIntent 同时保存核心实体、购物动作、修饰条件、逐项约束状态和候选解释；候选接近时进入 `ambiguous`，不隐藏冲突。

## Product Agent 接入

当前 Product Agent 由 Codex 或 Kiro 交互式会话承担。两者加载同一份
`product-selection` Skill，并按 `ProductSelectionRun` 的状态分三次调用 CLI；Skill 只生成
`CategoryRoleProposal` 与 `SceneProposal`，不会复制确定性选品逻辑。

Kiro 可在仓库根目录运行 `kiro-cli --agent topic-generator`；Codex 会从
`.agents/skills/product-selection` 自动发现同一 Skill。交互式 Agent 不会被 Web 页面同步调用。

`runProductSelectionAgentWorkflow` 接收可注入的 `ProductSelectionAgent` 与
`CatalogCandidateAdapter`。Agent 只在 `needs-category-proposal` 和
`needs-scene-proposal` 两个状态被调用；提案随后仍由 ProductSelection 状态机校验。
部署方可以接入任意模型或人工审批实现，核心包不绑定模型 SDK。

候选快照同时生成 `catalog-candidate-quality-report/v1`。报告只读证据，统计请求失败、
空/低覆盖分类、商品分类归属错误与分类内/跨分类重复；结构校验仍由状态机决定是否阻断。
`evals/product-selection-golden-cases.json` 保存 8 个品牌、品类和场景主题的稳定验收约束
（5:3:2、11 次召回、场景、模块组数/每组商品配额、全局去重），不固定会随目录变化的商品 ID。

底层 API 保留显式交接契约：`product-selection-handoff-task/v1` 只接受同阶段的
`product-selection-handoff-response/v1`，导入后的提案继续经过相同状态机校验。Workbench
不暴露该开发者入口，页面始终使用自动 Agent；外部 Codex/Kiro 与调试工具仍可复用契约。

目标仓库导出的 `category_id/category_name/category_ename/parent_category_id/level`
TSV 可通过 `--taxonomy-tsv` 导入；CLI 使用文件修改时间作为稳定的 `fetchedAt`，
因此同一未修改工件跨多次提案运行保持相同 digest。

### 未来 Web Host 自动运行

需要 API 化时，独立 Host 可通过 server-only 环境变量注册 taxonomy 与 HTTP Product Agent：

```bash
TOPIC_GENERATOR_TAXONOMY_PATH=/absolute/path/categories.tsv
TOPIC_GENERATOR_TAXONOMY_SOURCE_REF=yami-us/categories.tsv
TOPIC_GENERATOR_AGENT_ENDPOINT=https://agent.example.com/product-selection
TOPIC_GENERATOR_AGENT_ID=topic-product-agent
TOPIC_GENERATOR_AGENT_TOKEN=server-only-token
TOPIC_GENERATOR_AGENT_TIMEOUT_MS=30000
```

Host 在进程内缓存已校验的 taxonomy 与 Agent Adapter。未配置或工件无效时，
`category-role` 返回可操作的 `blocked`，不会接受浏览器提交的 taxonomy 或 Agent 提案。
`relevance/default@1` 不依赖这些配置。

Agent Endpoint 接收 `product-selection-agent-request/v1`，并返回：

```json
{
  "schemaVersion": "product-selection-agent-response/v1",
  "proposal": {}
}
```

请求中的 `stage` 仅为 `category-role-proposal` 或 `scene-proposal`，`run` 是对应的
状态机上下文。Agent 不执行目录召回、配额、模块分配或去重。

## Agent 提案

清晰的精确品牌或品类不需要 Agent 提案。歧义的复合主题可以使用
[`semantic-proposal.example.json`](docs/semantic-proposal.example.json) 作为输入格式；即使提案格式正确，不受目录证据支持的字段也会出现在 `proposalReview.rejectedFields`，不会进入最终 ThemeIntent。

`evidence.attempts` 说明每个 CatalogSnapshot Adapter 是否成功；`proposalReview` 说明 Agent 提案是否为 `accepted`、`partially-accepted`、`rejected` 或 `not-provided`。

## 独立打包路线

当前 Web 运行时已经独立于 Canvas。若后续需要发送到工作区之外，继续完成两项分发工作即可：

1. 将核心包的 `private` 改为 `false`，补齐许可证与发布元数据。
2. 为独立 App 增加目标环境的部署配置与访问控制。

`product.manifest.json` 记录当前可迁移状态；`standalone-host` 表示完整 Web 运行时由 `apps/topic-generator` 提供。
