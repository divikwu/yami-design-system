# TOPIC GENERATOR

TOPIC GENERATOR 是一个从购物主题词生成可审阅 `ThemeIntent`、Topic 页面计划、证据绑定
文案规范与图片资产清单的独立产品。`packages/topic-generator` 是可复用核心，
`apps/topic-generator` 是独立 Web 与 HTTP 宿主；Canvas 不参与它的运行时。

## 当前产品边界

```text
Theme keyword ─> CatalogSnapshot ─> TopicIntent analysis ─> ThemeIntent
                                       │
                                       └─ unresolved scenario only:
                                          public context ─> optional SemanticProposal
                                                                      │
ThemeIntent + registered constraints ─> Topic Page Orchestrator Agent proposal
                                               │
                                               ▼
                        PageOrchestration ─> LandingPageExecutionPlan
                                               │
                                               ▼
Catalog + taxonomy ─> Topic Strategy Agent ─> ProductSelection ─> PagePlan v2
                                                                      │
                                                                      ▼
                       Topic Content Agent ─> PageContent ─> ContentSpec
                                                                      │
                                                                      ▼
                    Topic Visual Agent ─> PageVisual ─> AssetManifest
                                                                      │
                                                                      ▼
                            AssetStore ─> PageGenerationSpec ─> hard QA
                                                                      │
                                                                      ▼
                 Topic Review Agent ─> ExperienceReviewDecision ─> ReviewPackage
```

- Core：`src`，负责 CatalogSnapshot、ThemeIntent、版本化 ProductSelection、PageMerchandising、
  PageContent、PageVisual、PageAutomation、PageGenerationSpec、真实图片 QA、HTTP handler、页面规划与 Run Artifacts。
- CLI：`topic-generator`，输出可被其他项目消费的 `theme-intent/v2` JSON；可接收 Agent 提案并显式保存运行产物。
- Eval：`topic-intent-eval`，用稳定的语义期望对比实时 Yami 目录分析，不复制或冻结商品库存。
- Web：`web`，提供可被 Next.js 宿主加载的产品界面。
- Host：`apps/topic-generator`，独立暴露 `/` 与 `/api/topic-generator`，默认端口 3300。
- Codex：`.agents/skills/*` 暴露 `page-orchestration`、`topic-intent`、
  `product-selection`、`page-merchandising`、`content-writing`、`visual-generation` 与
  `page-review` 七个阶段 Skill。
- Kiro：`.kiro/agents/topic-page-orchestrator.json`、`topic-strategy.json`、
  `topic-content.json`、`topic-visual.json` 与 `topic-review.json` 暴露五个逻辑 Agent；
  `.kiro/skills/*` 指向相同 canonical Skill。旧 `topic-generator` Agent 仅作为兼容入口。
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

1. Topic Page Orchestrator Agent 只选择注册过的页面类型与策略—模板路由；Topic Strategy
   Agent 负责主题、选品与页面陈列语义；Content、Visual、Review Agent 各自独立。七个 Skill
   只负责阶段调用约定，不承载运行时业务逻辑。
2. TopicIntent 使用两轴分类：`themeType` 表示品牌、商品导购或活动场景，`entityType` 表示品牌、品类、属性、场景或未知实体。它先生成 Yami 目录规则基线；场景主题或仍需复核的主题才按需读取公开背景资料。精确品牌或品类不允许 Agent 改写核心实体，但可通过 `semantic-proposal/v2` 提议目录分类组织与使用场景。
3. 未被目录证据覆盖的核心修饰词会让基线保持 `needs-review`。`semantic-proposal/v2` 会同时收到完整商品证据与目录分类参考；每个 Shortcuts 分类提案可引用一个或多个当前非空目录叶子分类，按主题购物心智合并相近分类，并应覆盖全部非空目录分类。目录分类不能跨组重复；遗漏项会形成可见警告，再由 ProductSelection 按目录事实补齐。每个使用场景仍必须由至少两个真实分类支持。提案会与目录候选统一审查，不能伪造商品归属或数量，也不能覆盖更强目录证据。`semantic-proposal/v1` 继续用于历史回放。
   配置了 `TOPIC_GENERATOR_PAGE_AGENT_ENDPOINT` 时，Workbench 的精准匹配会通过 Topic Strategy
   Agent 的 `topic-intent` stage 自动请求 v2 提案；缺失、失败、无效或完全被拒绝的提案会记录在
   `runtime.topicIntent` 并回退到已验证目录分类，不阻止选品。
4. Yami 结构化 Adapter 提供品牌、品类、属性与商品证据；共享同一通用别名的分类按当前商品覆盖量优先。首轮搜索用于解析目录基线；精确品牌随后读取公开品牌页全部分页，并把销售方、库存状态与可用的周销量标签保存为 `catalogCoverage`。覆盖层保留自营/第三方与在售/缺货四组，全量按周销量数值下限降序；同档位保持 Yami 原始顺序，没有周销量的商品排在有数据商品之后。只有在售商品进入 CatalogSnapshot 与后续 ProductSelection，缺货商品仅用于目录审计。品牌页不可解析时回退到按销量排序的结构化 `brand_ids` 分页。非品牌主题按已确认分类读取全部分页并依据 ThemeIntent 二次过滤。每个主题展示 4–8 件是页面分配规则，不截断 CatalogSnapshot 或主商品池。普通拉丁商品查询会先按标题、品牌和商品分类字段过滤接口可能返回的通用推荐。两个 Adapter 都按商品 ID 稳定去重，并在 `snapshot.quality` 记录观测、接收、拒绝、截断数量及字段缺失、不可售、重复和关键词不匹配原因；分类 `productCount` 始终按最终去重商品池重算。场景分类必须由分类路径、中英文别名或商品分类字段支撑场景核心词，至少两个功能性分类才能自动确认；仅商品标题命中时保留为低证据候选并进入复核。分类数量或季节等通用修饰词不能单独成为场景证据。失败后才尝试公开搜索 Adapter，且每次尝试都会记录；网页 fallback 只保留标题或品牌命中关键词的可售商品，零相关结果按 `no_products` 失败。公开背景资料只辅助场景理解和文案事实，不进入商品或库存证据。
5. `reason` 只给可审阅依据，不暴露或伪造模型隐藏思考过程；界面分别展示主题解释状态和商品条件验证状态。`confidence` 仅为兼容规则分数，审阅应使用 `decision.status`、`evidenceLevel`、候选差值、约束状态和证据来源。
6. ProductSelection 配置以 `<id>@<version>` 共享；分类角色的 PageMerchandising `@2` 模板
   完整继承 ready ProductSelectionResult 的模块商品、顺序、场景分组与全局去重，只补充展示
   语义以及 Hero/Shortcuts 引用，不重新选品或推断分类角色。
7. 分类角色要求 SHA-256 绑定的完整 taxonomy artifact；不从搜索商品推断，也不复制目标仓库的数据库访问。
8. 每次候选召回产生独立的质量报告；请求失败、缺失请求或商品引用缺失等高风险错误会阻止自动选品，低覆盖、分类标题语义异常和重复商品等中风险问题保持可见但不会由 Agent 静默修复。场景提案中的商品 ID 必须全局唯一，不能跨场景或商品组重复使用。
9. CLI 只有显式 `--output` 才写入带版本与 SHA-256 的 Run Artifacts；Web 本地执行模式则按 ADR 007 保存私有 Execution Task、状态、日志和资产。
10. Codex/Kiro 交互式运行与自动 HTTP Agent 共用相同提案契约；核心不绑定模型 SDK 或
   Provider Key，宿主只通过 server-only Endpoint/Token 接入执行器。
11. ThemeIntent 同时保存核心实体、购物动作、修饰条件、逐项约束状态和候选解释；候选接近时进入 `ambiguous`，不隐藏冲突。`resolved` 只表示主题解释已确定，不代表其中所有 `unverified` 商品条件已经成为事实。

## Agent 与 Skill 接入

Topic Page Orchestrator 只加载 `page-orchestration`，并从运行时返回的注册表选择一个
`pageTypeRef + selectionStrategyRef + templateRef` 路由。Topic Strategy Agent 按阶段加载
`topic-intent`、`product-selection` 或 `page-merchandising` canonical Skill。选品 Skill 只生成
`CategoryRoleProposal` 与 `SceneProposal`；页面 Skill 只生成 `ModuleMerchandisingProposal`。
独立 Topic Content Agent 只加载 `content-writing`，生成 `TopicPageContentProposal`；独立
Topic Visual Agent 只加载 `visual-generation`，按冻结视觉模式使用宿主图片生成器或 Yami
来源商品图的确定性合成，并生成 `TopicPageVisualProposal`；独立 Topic Review Agent 只加载 `page-review`，在硬 QA 通过后生成
只读 `TopicPageExperienceReviewProposal`。所有提案都会回到同一 TypeScript 运行时校验。

Kiro 可在仓库根目录运行 `kiro-cli --agent topic-page-orchestrator`、
`topic-strategy`、`topic-content`、`topic-visual` 或 `topic-review`；Codex 会从
`.agents/skills` 自动发现同一组 Skill。直接在 Codex App 或 Kiro IDE 中使用时，不要求电脑
额外安装 `codex` 或 `kiro-cli`：宿主可原生加载 Skill，并通过 Host tool/API 提供待处理上下文
和提案校验。项目 CLI 只是仓库内可选的确定性运行时适配器，不是 Agent 的必需入口。
Web 默认把生成请求交给本地 Execution Task，由配置的 Codex 或 Kiro CLI Adapter 顺序执行
同一套提案契约；HTTP Agent Endpoint 仍是显式可选模式。

`runProductSelectionAgentWorkflow` 接收可注入的 `ProductSelectionAgent` 与
`CatalogCandidateAdapter`。Agent 只在 `needs-category-proposal` 和
`needs-scene-proposal` 两个状态被调用；提案随后仍由 ProductSelection 状态机校验。
部署方可以接入任意模型或人工审批实现，核心包不绑定模型 SDK。

候选快照同时生成 `catalog-candidate-quality-report/v1`。报告只读证据，统计请求失败、
空/低覆盖分类、商品分类归属错误与分类内/跨分类重复；`error` 会阻止自动选品，
`warning` 保持可见但不改写候选。结构与场景商品唯一性仍由状态机校验。
`evals/product-selection-golden-cases.json` 保存 8 个品牌、品类和场景主题的稳定验收约束
（5:3:2、11 次召回、场景、模块组数/每组商品配额、全局去重），不固定会随目录变化的商品 ID。

底层 API 保留显式交接契约：`product-selection-handoff-task/v1` 只接受同阶段的
`product-selection-handoff-response/v1`，导入后的提案继续经过相同状态机校验。Workbench
不暴露该开发者入口，页面始终使用自动 Agent；外部 Codex/Kiro 与调试工具仍可复用契约。

目标仓库导出的 `category_id/category_name/category_ename/parent_category_id/level`
TSV 可通过 `--taxonomy-tsv` 导入；CLI 使用文件修改时间作为稳定的 `fetchedAt`，
因此同一未修改工件跨多次提案运行保持相同 digest。

### Web Host 自动运行

仓库内提供 `@yami/topic-generator-agent` 本地 Runner，同时覆盖 Page Agent 与 ProductSelection
Agent 的 HTTP 协议。它按注册 stage 动态加载现有 Agent/Skill，并通过已认证的 Codex 或 Kiro
CLI 生成受限 proposal；商品事实、成员关系、排序、配额、digest 与 QA 仍由
`@yami/topic-generator` 校验。开发环境可直接运行：

```bash
pnpm dev:topic-generator-stack
```

Runner 默认监听 `127.0.0.1:4400`，提供 `/topic-page`、`/product-selection` 与 `/health`。
视觉或预览能力不可用时必须显式阻塞，不会生成占位资产或伪造 Review。

需要 API 化时，独立 Host 可通过 server-only 环境变量注册 taxonomy 与 HTTP Product Agent：

```bash
TOPIC_GENERATOR_TAXONOMY_PATH=/absolute/path/categories.tsv
TOPIC_GENERATOR_TAXONOMY_SOURCE_REF=yami-us/categories.tsv
TOPIC_GENERATOR_AGENT_ENDPOINT=https://agent.example.com/product-selection
TOPIC_GENERATOR_AGENT_ID=topic-product-agent
TOPIC_GENERATOR_AGENT_TOKEN=server-only-token
TOPIC_GENERATOR_AGENT_TIMEOUT_MS=330000
TOPIC_GENERATOR_PAGE_AGENT_ENDPOINT=https://agent.example.com/topic-page
TOPIC_GENERATOR_PAGE_AGENT_ID=topic-page-agent
TOPIC_GENERATOR_TOPIC_INTENT_AGENT_ID=topic-strategy
TOPIC_GENERATOR_ORCHESTRATOR_AGENT_ID=topic-page-orchestrator
TOPIC_GENERATOR_STRATEGY_AGENT_ID=topic-strategy
TOPIC_GENERATOR_CONTENT_AGENT_ID=topic-content
TOPIC_GENERATOR_VISUAL_AGENT_ID=topic-visual
TOPIC_GENERATOR_REVIEW_AGENT_ID=topic-review
TOPIC_GENERATOR_PAGE_AGENT_TOKEN=server-only-token
TOPIC_GENERATOR_PAGE_AGENT_TIMEOUT_MS=330000
TOPIC_GENERATOR_ASSET_ROOT=/absolute/path/topic-page-assets
TOPIC_GENERATOR_PREVIEW_ORIGIN=http://127.0.0.1:3300
```

Host 在进程内缓存已校验的 taxonomy 与 Agent Adapter。未配置或工件无效时，
`category-role` 返回可操作的 `blocked`，不会接受浏览器提交的 taxonomy 或 Agent 提案。
`relevance/default@1`、`relevance/intent-themes@2` 和 `relevance/intent-themes@3` 都不依赖
category-role 的 taxonomy 配置。`default@1` 保留固定排序的旧任务回放，`intent-themes@2`
保留按目录分类直接成组的历史回放；当前默认的 `intent-themes@3` 会先用首轮 YAMI 聚合解析
ThemeIntent，再接受可选的 Agent 分类与场景语义提案。商品归属、顺序、去重和每组 4–8 件
的约束仍由确定性模块校验；提案不足时回退到已验证的目录分类。

Agent Endpoint 接收 `product-selection-agent-request/v1`，并返回：

```json
{
  "schemaVersion": "product-selection-agent-response/v1",
  "proposal": {}
}
```

请求中的 `stage` 仅为 `category-role-proposal` 或 `scene-proposal`，`run` 是对应的
状态机上下文。Agent 不执行目录召回、配额、模块分配或去重。

页面自动化 Endpoint 共用 `topic-page-agent-request/v1` / `topic-page-agent-response/v1`，按
`topic-intent`、`workflow-planning`、`module-merchandising`、`content-writing`、
`visual-generation` 与 `experience-review` 六个 stage 路由到五个逻辑 Agent；其中
`topic-intent` 与 `module-merchandising` 默认共用 Topic Strategy Agent。
Visual 响应除提案外必须返回每个任务的 `taskId/ref/mimeType/dataBase64`。Host 先校验全部
图片的任务绑定、完整像素解码、真实 MIME、像素尺寸与 SHA-256，再一次性写入
`TOPIC_GENERATOR_ASSET_ROOT`；落盘后 hard QA 会重新读取并再次完整解码。
配置缺失、Agent 拒绝、图片不匹配或 QA 失败都会返回显式 `topic-page-automation-run/v1`
`blocked`，不会回退成看似完成的旧页面预览。

## PageMerchandising 纵向切片

选品结果 ready 后，增加版本化模板参数即可请求受约束的页面策略任务：

Brand、Topic、Campaign 三个 `@2` 模板要求已验证来源场景。分类角色流程使用
`category-role/landing-page-agent@1`；当前默认的 `relevance/intent-themes@3` 优先把已接受的
ThemeIntent 分类提案完整编译为 Shortcuts 与底部综合推荐的同源分类 Tab，不设置固定展示
数量上限；场景提案编译为 2–6 个 StartHere 主题，每个主题冻结 4–8 件商品。没有足够提案时
使用已验证的 YAMI 分类。随后分别路由到
`topic-landing/brand-relevance@1`、`topic-landing/topic-relevance@1` 与
`topic-landing/campaign-relevance@1`。这些模板会用冻结的相关性商品生成 Hero、快捷入口、
主题化 StartHere、热门与探索模块；Topic 与 Campaign 在商品证据足够时还可显示品牌模块。
Reviews 仍保持关闭，因为当前选品结果不包含经过验证的评论记录。

新的分类角色运行使用 Brand、Topic、Campaign `@2` 模板。它们以 ProductSelection 为商品
分配 authority；对应 `@1` 以及通用 `topic-landing/relevance@1` 只用于历史任务回放，不再
出现在新的 Agent 任务注册表中。

```bash
pnpm topic-generator:analyze -- --keyword "Matcha" \
  --selection-strategy category-role/landing-page-agent@1 \
  --taxonomy ./taxonomy.json \
  --category-proposal ./categories.json \
  --candidate-snapshot ./candidates.json \
  --scene-proposal ./scenes.json \
  --page-template topic-landing/topic@2 \
  --pretty
```

首次返回 `page-merchandising-run/v1` 的 `needs-module-proposal`；同一命令增加
`--module-proposal ./modules.json` 后，由确定性校验器生成带 digest、内容任务 ID 与图片任务
ID 的 `topic-page-plan/v2`。该阶段只决定模块目标、场景与冻结商品分配，不撰写最终文案，
也不生成图片。

独立 Content Agent 只消费 `contentTaskId` 和 PagePlan/上游 digests，不修改模块、场景或商品
分配。独立 Visual Agent 只消费 `assetTaskIds`、ready ContentSpec 与任务内商品图片引用；
PageVisual 会校验产物元数据和全部 digests。最终文件读取、组件渲染与视觉 QA 仍属于 Stage 06。

## PageContent 纵向切片

在生成 ready PagePlan 的同一命令上增加 `--content-language en|zh`，首次得到
`topic-page-content-run/v1` 的 `needs-content-proposal`。再增加
`--content-proposal ./content.zh.json` 后，确定性校验器逐项检查任务、组件文案槽位、语言、
证据引用范围与全部 digests，成功时输出 `topic-page-content-spec/v1`。

每个标题、描述、标签、快捷入口标签与场景文案都必须引用 ThemeIntent evidence、已选分类、
当前模块商品或当前场景。没有已验证评论记录时，`ReviewList` 不能进入 Content 任务。该阶段
不生成图片、图片提示词或 alt text。

新的分类角色 `@2` 模板使用 `topic-page-copy/evidence-bound@1`：Content context 会返回每个
槽位的字符上限和可用 ThemeIntent evidence ID；确定性校验器拒绝混合语言、超长文案、竞争
候选 evidence，以及不属于当前模块商品的分类 evidence。旧 `@1` proposal 仍按 legacy policy
回放。Wikipedia 尚未进入 PageContent evidence namespace，不能作为商品事实引用。

PageContent 的 blocked 结果会区分 `upstream-invalid` 与 `proposal-invalid`，并给出明确的
`rollbackStage`。自动流程保留 `topic-page-content-attempt/v1`（Agent ID、语言、三组输入
digest、被拒 proposal 与 review）；相同绑定下可显式提交修订 proposal，从
`content-writing` 定点恢复，不会自动再次调用 Agent。任一 digest 或语言漂移都会退回
`module-merchandising`。

## PageVisual 纵向切片

在生成 ready ContentSpec 的同一命令上增加 `--visual`，首次得到
`topic-page-visual-run/v1` 的 `needs-visual-proposal`。通过 `--visual-production-mode` 冻结
`generated-images` 或 `source-product-images`；独立 Visual Agent 使用对应宿主能力逐项完成
Hero、快捷入口、场景与品牌横幅任务，再增加
`--visual-proposal ./visual.zh.json`。确定性校验器会检查任务/组件、证据作用域、安全相对路径、
MIME、尺寸与比例、SHA-256、焦点、背景色和 alt text 模式，成功时输出
`topic-page-asset-manifest/v1`。

核心包不内置模型、图片 Provider SDK 或来源图合成器。若宿主没有当前模式要求的媒体能力，
Visual Agent 必须停止，不能伪造图片或元数据。场景任务会给出非阻断的构图建议，帮助避让
底部叠加文案，但不会因偏离建议而单独阻断。自动 Host 会继续读取图片本体、编译 `topic-page-generation-spec/v1`，并
执行来源绑定、模块、文案、图片字节和可访问性结构硬 QA。硬 QA 通过后，Review Agent 只能
建议进入用户 Review 或输出带回退阶段的问题；只有 `review-recommended` 才生成
`topic-page-review-package/v1` `review-ready`。07 用户审批会绑定当前任务与 ReviewPackage
摘要；要求修改会创建新任务并重新执行下游 QA。08 只确认本地发布门禁，外部发布仍需要明确
Adapter 与授权。

## Agent 提案

清晰的精确品牌或品类不需要 Agent 提案。歧义的复合主题可以使用
[`semantic-proposal.example.json`](docs/semantic-proposal.example.json) 作为输入格式；即使提案格式正确，不受目录证据支持的字段也会出现在 `proposalReview.rejectedFields`，不会进入最终 ThemeIntent。

`evidence.attempts` 说明每个 CatalogSnapshot Adapter 是否成功；`proposalReview` 说明 Agent 提案是否为 `accepted`、`partially-accepted`、`rejected` 或 `not-provided`。

## 独立打包路线

当前 Web 运行时已经独立于 Canvas。若后续需要发送到工作区之外，继续完成两项分发工作即可：

1. 将核心包的 `private` 改为 `false`，补齐许可证与发布元数据。
2. 为独立 App 增加目标环境的部署配置与访问控制。

`product.manifest.json` 记录当前可迁移状态；`standalone-host` 表示完整 Web 运行时由 `apps/topic-generator` 提供。
