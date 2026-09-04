# M3.5 Agent-ready 就绪报告

日期：2026-09-04

契约实施基线：`8bafeb54f1ff4e2d03316b04502193fb9787357e`

客户端及生命周期彩排基线：`bda915d8cecc05785bbec7ef816de611186addf9`

结论：**有条件就绪，尚未放行进入 M4 试用**

M3.5 建立的是确定性、可在本地校验的 Agent 契约；它没有增加 CLI、MCP 产品、shadcn
产物、npm 发布或托管部署，也不能证明团队已经采用。

## 已实现能力

| 范围 | 契约实施基线结果 |
| --- | --- |
| 组件契约 | 30/30 组件元数据通过 JSON Schema 2020-12。14 个 Stable 组件全部通过精确公共导出与 `Showcase` 检查，以及 Usage、Registry、源码、严格 SemVer、Token binding、规则与交互证据检查。 |
| Registry v2 | 共 31 个确定性的内部源码项采用同一形状（含 base），记录源文件与目标文件、导出、依赖、文档、设计规则与 Token、质量证据及 SHA-256 内容摘要；连续生成字节一致。 |
| 页面验证 | 7/7 页面族进入清单：5 个 Core、2 个 Smoke；仓库范围内的源码、Story、精确 fixture 导出、App Router 路由及测试引用均由检查器验证。 |
| Skill 评测 | 12/12 中英文离线用例通过，使用真实规则校验器与本地组件、页面、Token、Rule、Registry 和具名 Story 导出引用；CI 不调用模型 API。 |
| Skill 契约 | 中英文清单同步升级为 `0.6.0-alpha.1`，将 Registry v2 准确描述为内部源码契约，不宣称兼容 shadcn。 |
| 发布记录 | 已为 `@yami/design-system`、`@yami/prototypes` 增加 minor Changeset；未升版本、未发包、未合并、未部署。 |

## 固定提交客户端彩排

两个客户端在同一较早的彩排基线上收到相同的只读 Prompt；禁止修改文件、使用网络来源、运行生成，
也禁止宣称执行过实际未运行的检查。

```text
评估 button-selection、ecommerce-home-start、product-detail-maturity、
fabricated-token-reject、preserve-confirmed-ui。返回起点、结果、必要规则、
验证命令与限制。只使用本地已维护的 YAMI 来源；不得伪造组件、Token、规则、
Registry 条目或证据；不得宣称 CLI、MCP、shadcn 兼容、发布或部署。
```

| 客户端 | 版本与模型 | Button | 首页 | PDP 成熟度 | 假 Token | 保留 UI | 纠正次数 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Codex | CLI `0.144.6`；`gpt-5.6-sol`、medium、只读 | pass | pass | needs-review | reject | needs-review | 1 |
| Kiro | CLI `2.21.0`；客户端当前配置模型 | pass | pass | needs-review | reject | needs-review | 0 |

Codex 唯一一次纠正把 PDP 结果由 `pass` 改为 `needs-review`；首轮的起点和成熟度说明本身
已经正确。纠正后明确指出 Experimental 的 `ProductMediaGallery` 和 Beta 的 `RadioGroup`。
Kiro 首轮即返回预期结果。两个客户端都拒绝 `--font-size-heading-lg`，核实了真实字号
Token，并且没有伪造组件、Token、规则或 Registry 条目。对“只改按钮尺寸”的任务，二者
都把变化限制在 Button `size` 属性，并在缺少目标实例和目标尺寸时选择询问而不是猜测。

客户端列出了 `pnpm validate` 及相关定向命令，但没有执行。因此这些输出只能证明选择与
推理，不能作为测试通过证据。Codex 能独立确认 Git 提交；Kiro 的只读工具策略拒绝执行
Git 命令，所以其提交字段来自固定基线 Prompt，而非独立校验。

## 干净工作树生命周期演练

在较早的彩排基线创建一次性 detached worktree，完整执行了以下流程：

1. 发现并选择 Stable 的 `button` Registry 项，初始摘要为
   `6a59430379d9f247a4610293ecf5a4428a02cb8b7c33f35fee678f74cd9be4d4`。
2. 在已维护的 FullWidth Button 示例上增加一个临时属性，代表最小实现。
3. 组件契约仍然通过，Registry 检查准确捕获根索引及 Button 单项漂移。
4. 重新生成 Registry v2 后摘要变为
   `e70e20b9043b8001499caf3d3d0eb7a8b31ce0669d2e34f8969ac3c0843fb145`；同步迁移映射后，
   生成物检查及摘要单元测试全部通过。
5. 精确移除临时变化并重新生成，原摘要恢复；`git status --porcelain` 为空后删除演练工作树。

这证明了发现、更新与回滚行为；没有保留演练代码，也没有触碰用户的主工作树。

## 验证门槛

进入 M4 决策前必须执行以下仓库命令：

```bash
pnpm check:design-system-contracts
pnpm check:generated
pnpm evaluate:design-system-skill
pnpm test:storybook
pnpm test:a11y
pnpm test:e2e
pnpm test:visual
pnpm check:docsite-content
pnpm test:docsite
pnpm validate
```

当前工作树的实际结果如下：

| 命令或门槛 | 结果 |
| --- | --- |
| `pnpm validate` | 通过；包含 lint、Docsite 双语内容、类型、15 条原则同步、400 Token 引用、30 个组件、7 个页面、31 个 Registry 项、12/12 Skill 用例、边界、工具层及全仓单元测试 |
| 契约负例夹具 | 通过；越界 Usage、仅 import 的公共导出、伪造 Token binding、非法 SemVer、缺失 `Showcase`、仓库越界和路由/源码不匹配均按要求失败 |
| `pnpm test:a11y` | 6/6 通过 |
| `pnpm test:e2e` | 13/13 通过 |
| `pnpm check:docsite-content` | 通过；13 对文档、6 对 Blog、400 个生成 Token |
| `pnpm test:docsite` | 20/20 通过 |
| `pnpm test:storybook` | **失败**；Storybook 主套件 306/306 通过，但 ProductMediaGallery 浏览器套件为 3/4：触摸缩略图轨道停在 5px，没有超过 85px；单独重跑一次仍复现 |
| `pnpm test:visual` | macOS 命令正常退出，但 16/16 用例按仓库约束全部跳过；这不计作视觉通过 |

失败的 ProductMediaGallery 测试及其运行时实现与 `origin/main` 一致；本分支只修改了对应元数据
的 schema 引用。该问题不在本轮范围内，因此如实保留为项目门槛，不隐藏也不顺手扩大修复。
未执行或本机跳过的命令不计为通过。

## 已知限制与剩余门槛

- EcommerceHome 既有 12 项视觉矩阵保持不变；Search 与 Topic 只增加要求的移动端中文浅色、
  桌面端英文深色成对覆盖，没有扩张为无意义的笛卡尔积。
- 新增 4 个视觉用例必须由 Linux Playwright 生成基线。本机 macOS 没有 Docker、Podman、
  Colima 或 Lima 运行时，仓库也会拒绝非 Linux 基线生成。Linux 基线尚未生成且对应视觉套件
  尚未通过前，M3.5 退出门槛仍然开放。
- 现有 ProductMediaGallery 移动端缩略图触摸滚动断言在当前基线上连续两次失败。虽然与本轮
  M3.5 改动无关，进入 M4 前仍需让 `pnpm test:storybook` 转绿。
- ProductDetailPage、MobileSearchPage 保留 Story play、Storybook a11y 和人工证据，不人为
  添加重复 Canvas 路由；Categories、EmailTemplates 仍为 Smoke 范围。
- 彩排只证明两个客户端能在 5 个固定任务中正确选择或拒绝，不能证明多人采用、生产正确性、
  远程分发或自动升级能力。

## M4 进入条件

只有上述命令都形成当前结果，且 Linux 视觉基线门槛转绿后，才进入 2–3 人、1–2 个真实任务
的 M4 小范围试用。试用中记录发现、纠正、验证、更新和回滚的真实摩擦；CLI/MCP 优先级由
重复出现的试用证据决定，不能因为已有 Registry v2 就提前产品化。
