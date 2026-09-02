---
slug: overview
title: 系统概览
description: "理解 YAMI 如何连接品牌规则、DTCG Token、组件、原型、Storybook 与 Agent 契约。"
group: start
order: 20
keywords: ["架构", "Catalog", "Registry", "Storybook"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/generated/catalog.json
  - docs/adr/001-architecture-and-migration-contract.md
---

YAMI 把设计规范转换为可以被代码和工具共同消费的契约。系统不依赖一份静态样式说明，而是让来源、生成物、组件和验证保持可追踪关系。

## 五个层次

| 层次 | 负责内容 | 事实来源 |
| --- | --- | --- |
| 品牌规则 | 颜色、排版、间距、圆角、内容与禁止模式 | `DESIGN.md` |
| Token | 原始值、语义别名和主题覆盖 | `tokens/**/*.tokens.json` |
| 组件 | 属性、状态、可访问性和 Token 绑定 | `components/*` |
| 页面原型 | 已维护的业务组合与响应式策略 | `packages/prototypes/pages` |
| 交付契约 | Catalog、Registry、Skill 和 CI | `generated/*` 与验证脚本 |

应用必须从语义层向下消费，不能绕过语义别名直接绑定任意颜色或尺寸。

## 当前组件范围

生成后的 Catalog 当前记录 30 个组件：14 个 stable、5 个 beta、11 个 experimental。状态描述成熟度，不改变公共导入方式。

- stable 可以作为默认生产选择。
- beta 已有明确契约，但仍需要关注变更记录。
- experimental 可以用于受控场景，调用方必须验证交互和响应式表现。

组件详情、示例和交互以 Storybook 为准。Docsite 第一期只覆盖系统指南与基础规范。

## 单一事实来源

Token 的来源是 DTCG JSON，`generated/tokens.css` 是生成结果。Catalog 和 Registry 也由组件元数据生成。任何生成文件都不得手动编辑。

正确流程：

1. 修改来源文件。
2. 运行对应生成命令。
3. 检查生成差异。
4. 运行仓库验证。

## 应用边界

`packages/design-system` 必须保持与 Next.js、业务数据和 Agent 运行时解耦。Canvas、Storybook、Topic Generator 和 Docsite 都是消费者，不得把应用依赖反向引入设计系统包。

这个边界使组件可以在多个宿主中复用，也让验证失败能够定位到来源层，而不是由应用覆盖掩盖问题。
