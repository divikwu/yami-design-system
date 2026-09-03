---
slug: prepare-environment
title: 开始创建
description: "先选择要创建组件还是页面，再进入对应流程准备参考、提示词和验收要求。"
group: ai
order: 40
keywords: ["创建组件", "创建页面", "参考", "提示词", "AI", "验收"]
updatedAt: "2026-09-02"
sourceRefs:
  - docs/ai-workflow.md
  - packages/design-system/SKILL.md
  - packages/design-system/generated/catalog.json
  - packages/prototypes/pages/TopicLandingPage/TopicLandingPage.stories.tsx
---

这里是“用 AI 创建”的分流入口。先判断任务需要公共组件还是完整页面，再进入对应页面准备参考、提示词和验收要求。仓库、依赖和 Storybook 尚未准备好时，先完成[快速开始](/zh/docs/fork-project)。

首次使用 AI 搭建时，先按[Skill](/zh/docs/using-yami-with-ai)确认它能读取项目规范。

## 选择创建对象

| 目标 | 什么时候选择 | 下一步 |
| --- | --- | --- |
| 创建组件 | 需要一个职责明确、可被多个页面复用的交互或展示能力 | 进入[创建组件](/zh/docs/create-components) |
| 创建页面 | 需要完成一个用户任务，并组合内容、数据和多个组件 | 进入[创建页面](/zh/docs/choose-starting-point) |

如果需求只是替换某个页面的文案、商品、图片或模块顺序，它通常属于页面任务，不需要新建公共组件。现有组件缺少可复用能力时，先记录[组件能力缺口](/zh/docs/create-components#report-a-component-issue)。

## 进入对应流程

- **创建组件：** 在[创建组件](/zh/docs/create-components)中判断是否有参考，选择提示词，并完成组件契约、Story 与验证。
- **创建页面：** 在[创建页面](/zh/docs/choose-starting-point)中判断是否有参考，填写提示词，并完成实现与验证。

参考可以是 Storybook 示例、现有代码、设计稿、截图或已获准使用的网页。没有参考时，也应先搜索现有 Components 与 Pages，而不是从空白随意生成。

## 开始前

只向 AI 提供任务所需的内容和已获授权的素材，不要提供密码、访问令牌或客户隐私。组件和页面各自需要的输入、提示词与完成检查都放在对应页面中。
