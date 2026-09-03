---
slug: getting-started
title: Storybook 入门
description: "了解 Storybook 的作用、内容结构和使用边界，再进入组件与页面。"
group: start
order: 20
keywords: ["入门","组件库","Storybook","AI","Fork"]
updatedAt: "2026-09-02"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/README.md
  - packages/design-system/generated/catalog.json
  - apps/storybook/.storybook/preview.tsx
  - docs/ai-workflow.md
---

Storybook 是 YAMI 查看真实组件、页面模式和使用规则的入口。它在浏览器中运行真实实现；不会编辑代码的同事，也可以用它查找参考、体验状态并检查多端表现。

只查看时不需要下载项目。可以直接[打开 YAMI Storybook](https://yds-storybook.vercel.app/)；需要保存修改、新建 Story 或运行验证时，再完成[快速开始](/zh/docs/fork-project)并使用自己的本地副本。

## Storybook 是什么

Storybook 把组件和页面以独立、可运行的示例展示出来。每个 Story 记录一种具体状态或场景，例如默认、Loading、Disabled、窄屏或英文内容。

它适合完成四类任务：

- **找到：** 定位设计规则、品牌资产、组件或完整页面。
- **理解：** 查看用途、参数、状态、交互和使用边界。
- **比较：** 在不同语言、主题和屏幕尺寸下检查同一实现。
- **验证：** 操作真实交互，并把准确的 Story 链接交给同事评审。

Storybook 不是生产站点，也不是业务数据管理工具。在 Controls 中调整参数只会改变当前预览，不会自动保存或发布新版本。

## 为什么先看 Storybook

| 需要确认 | 静态设计稿 | Storybook |
| --- | --- | --- |
| 组件状态 | 需要逐张补充或文字说明 | 可以直接体验 Hover、Focus、Loading 和 Disabled |
| 响应式 | 依赖多个画板与标注 | 可以在真实宽度下检查布局和内容变化 |
| 中英文与主题 | 容易只覆盖一个组合 | 可以在同一示例切换并比较 |
| 交互 | 需要原型连线或口头说明 | 可以直接操作真实组件和页面 |
| 协作 | 反馈容易停留在截图位置 | 链接可以对应具体组件、状态或页面 |

两者不是二选一。Figma 适合自由探索、视觉发散和早期评议；Storybook 更适合在方向收敛后，确认真实组件、交互和实现边界。

## Storybook 里有什么

| 目录 | 包含内容 | 适合用来做什么 |
| --- | --- | --- |
| [Foundations](https://yds-storybook.vercel.app/?path=/story/yami-foundations-color--overview) | 颜色、字体、布局、圆角和响应式规则 | 确认界面应呈现的基础规则 |
| [Primitives](https://yds-storybook.vercel.app/?path=/story/yami-primitives-color-primitives--overview) | 尺寸、颜色和字体的底层值 | 进行进阶规范检查，不作为普通搭页的起点 |
| [Assets](https://yds-storybook.vercel.app/?path=/story/yami-assets-logos--overview) | Logo、图标等可复用品牌资产 | 选择正确版本，并确认颜色、尺寸和背景要求 |
| [Components](https://yds-storybook.vercel.app/?path=/story/yami-components-actions-button--showcase) | Button、Header、ProductCard、ProductList 等真实组件 | 查看组件状态、交互、参数和用法 |
| [Pages](https://yds-storybook.vercel.app/?path=/story/yami-pages-ecommerce-home--pc) | 首页、专题页、搜索页和商品详情页等完整页面 | 寻找页面结构和模块组合的参考 |

目标是搭建页面时，先从 Pages 找最接近的完整页面，再进入 Components 确认其中组件的状态和用法。

## 认识三个工作入口

| 入口 | 用它做什么 | 不代表什么 |
| --- | --- | --- |
| 文档站 | 了解工作步骤、规范和验收要求 | 不展示每个组件的全部状态和 API |
| Storybook | 查看、试用和验证真实组件及页面示例 | 调整 Controls 不会保存或发布新版本 |
| 本地项目 | 修改内容、组合页面、运行检查并保存代码 | 本地可用不代表已经评审或发布 |

Storybook 负责查看、理解和验证。需要保存新的内容、页面组合或组件能力时，在自己的本地项目中完成，再进入代码评审和发布流程。

## 选择下一步

| 你要做什么 | 继续阅读 |
| --- | --- |
| 查找组件、确认状态或查看完整页面 | [查看组件与页面](/zh/docs/browse-components) |
| 使用 AI 创建组件或页面 | [开始创建](/zh/docs/prepare-environment) |
| 现有组件不能满足真实需求 | [反馈组件能力缺口](/zh/docs/create-components#report-a-component-issue) |

组件和页面的具体寻找、阅读、检查与分享方法，统一放在下一篇文档。
