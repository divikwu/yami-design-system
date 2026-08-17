# TOPIC GENERATOR

TOPIC GENERATOR 是一个从购物主题词生成可审阅 `ThemeIntent` 与 Topic 页面计划的独立产品包。核心、CLI、Web、测试、文档与 Agent 集成都以本目录为唯一可编辑源；Canvas 目前仅托管 `/topic-generator` 路由和目录查询入口。

## 当前产品边界

```text
Codex / Kiro product Agent ── optional SemanticProposal ─┐
CLI / Web / Canvas ──────────────────────────────────────┼─> TopicIntent Module
                                                        │         │
Yami structured Adapter ──┐                              │         ├─> PagePlan
Yami public-search Adapter ├─> CatalogSnapshot Seam ─────┘         └─> Run Artifacts
test / future Adapter ─────┘
```

- Core：`src`，负责 CatalogSnapshot、受证据约束的 ThemeIntent、HTTP handler、页面规划与 Run Artifacts。
- CLI：`topic-generator`，输出可被其他项目消费的 `theme-intent/v2` JSON；可接收 Agent 提案并显式保存运行产物。
- Eval：`topic-intent-eval`，用稳定的语义期望对比实时 Yami 目录分析，不复制或冻结商品库存。
- Web：`web`，提供可被 Next.js 宿主加载的产品界面。
- Codex：`integrations/codex/topic-intent`，根目录以发现链接暴露该 Skill。
- Kiro：`integrations/kiro/topic-generator.json`，根目录以发现链接暴露该 Agent。
- Canvas：只保留页面和 API 两个兼容入口，不保存产品实现。

## 运行

```bash
pnpm topic-generator:analyze -- --keyword "ANUA" --pretty
pnpm topic-generator:evaluate -- --limit 5 --pretty
pnpm topic-generator:analyze -- --keyword "movie night" \
  --proposal ./proposal.json \
  --output ./topic-generator-runs \
  --pretty
pnpm dev
```

Web 页面：`http://127.0.0.1:3200/topic-generator`

## 实现原则

1. 一个产品 Agent 负责歧义语言；Skill 只负责教 Codex 如何调用，不承载运行时业务逻辑。
2. Agent 可提交 `semantic-proposal/v1`，但 TopicIntent Module 会按 CatalogSnapshot 接受、缩窄或拒绝字段。Agent 不能声明品牌、品类、属性、可售或库存事实。
3. Yami 结构化 Adapter 提供品牌、品类、属性与商品证据；失败后才尝试公开搜索 Adapter，且每次尝试都会记录。
4. `reason` 只给可审阅依据，不暴露或伪造模型隐藏思考过程；界面展示证据等级与歧义状态，不把未校准规则分数呈现为正确率。
5. PagePlan 是确定性结果；`--output` 才会写入带版本与 SHA-256 的 Run Artifacts，默认不持久化。
6. 部署运行时不使用模型 SDK、Provider Key 或服务端草稿存储。
7. ThemeIntent 同时保存核心实体、购物动作、修饰条件、逐项约束状态和候选解释；候选接近时进入 `ambiguous`，不隐藏冲突。

## Agent 提案

清晰的精确品牌或品类不需要 Agent 提案。歧义的复合主题可以使用
[`semantic-proposal.example.json`](docs/semantic-proposal.example.json) 作为输入格式；即使提案格式正确，不受目录证据支持的字段也会出现在 `proposalReview.rejectedFields`，不会进入最终 ThemeIntent。

`evidence.attempts` 说明每个 CatalogSnapshot Adapter 是否成功；`proposalReview` 说明 Agent 提案是否为 `accepted`、`partially-accepted`、`rejected` 或 `not-provided`。

## 独立打包路线

本目录已具备 `pnpm pack --dry-run` 可审阅边界。若后续需要单独发送完整 Web 应用，按以下顺序继续，避免形成两个实现：

1. 新建独立宿主 App，只消费 `@yami/topic-generator` 的公开入口。
2. 将包的 `private` 改为 `false`，补齐许可证与发布元数据。
3. 为新站点实现 `CatalogSnapshotAdapter`，复用现有 TopicIntent 与 PagePlan Modules。

`product.manifest.json` 记录当前可迁移状态；`canvas-hosted` 表示产品 UI 已独立、但完整 Web 运行时仍由 Canvas 提供。
