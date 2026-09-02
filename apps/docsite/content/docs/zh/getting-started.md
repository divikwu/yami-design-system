---
slug: getting-started
title: 如何使用组件库
description: "从查看组件开始，使用 AI 搭建页面，再与同事一起评审、交付和维护。"
group: start
order: 10
keywords: ["入门","组件库","Storybook","AI","Fork"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/README.md
  - apps/storybook/.storybook/preview.tsx
  - docs/ai-workflow.md
---

这份指南帮助设计师、产品同事和开发者使用 YAMI 组件库，完成一个可以展示、操作和评审的页面。你不必先学会整个项目的代码结构。

YAMI 提供设计规范、公共组件和页面示例。你负责说明目标、准备内容和确认结果；AI 可以协助查找组件、编写页面和运行检查。

## 选择你的路径

| 你想做什么 | 从哪里开始 | 完成后得到什么 |
| --- | --- | --- |
| 查看组件、规范和页面效果 | [查找与试用组件](/zh/docs/browse-components) | 确认可复用的组件和参考链接 |
| 用 AI 制作自己的页面 | [准备工作环境](/zh/docs/prepare-environment) → [选择页面示例](/zh/docs/choose-starting-point) → [创建第一个页面](/zh/docs/first-page) | 一个独立、可操作的页面练习版本 |
| 与同事共同制作和评审 | [多人协作方式](/zh/docs/collaboration) | 明确的任务分工、预览和反馈记录 |
| 把通用能力贡献给团队 | [反馈组件能力缺口](/zh/docs/component-gaps) | 范围清楚、可以评审的公共能力提案 |

只查看组件不需要下载项目。需要搭页时，再准备自己的工作环境。

## 第一次搭页的清单

1. **只做一次：** 获取项目访问权限，按照[创建自己的 Fork](/zh/docs/fork-project)建立独立副本并关联上游。
2. **只做一次：** 按[准备工作环境](/zh/docs/prepare-environment)启动 Storybook，确认示例可见、可操作。
3. **每个任务：** 按[选择页面示例](/zh/docs/choose-starting-point)确定参考，再在[开始与管理一个任务](/zh/docs/manage-tasks)中确认目标、允许修改的范围和负责人。
4. **跟着完成：** 用[创建第一个页面](/zh/docs/first-page)的素材与提示词制作一个练习版本。
5. **交给同事前：** 完成[自查](/zh/docs/review-checklist)，保存版本，并按[共享预览与评审](/zh/docs/review-preview)提供结果。

团队协作按私密上游与授权 Fork 设计。管理员需要先确认相关权限；这份教程不会自动配置仓库或预览的访问控制。

## 三个工具，各有职责

| 入口 | 用它做什么 | 不代表什么 |
| --- | --- | --- |
| 文档站 | 学习步骤、复制提示词、查看验收清单 | 不重复维护每个组件的 API |
| Storybook | 查看、理解、试用和验证真实组件及页面示例 | 调整 Controls 不会保存或发布业务页面 |
| 本地项目与 AI 工具 | 修改内容、组合页面、运行检查并保存代码 | AI 说完成不等于已经评审或上线 |

直接打开 [组件](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--showcase)、[设计规范](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-color--overview)或[页面示例](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-ecommerce-home--pc)。如果团队入口要求登录，请向维护者申请访问，不要自行公开副本。

## 先复用，再调整

先找最接近的页面，再确认它用到哪些组件。优先替换文案、商品和图片，其次调整模块组合；只有真实需求无法满足时才扩展公共组件。

AI 必须读取项目的 `packages/design-system/SKILL.md`，并按其中的顺序查阅规范、组件契约和页面示例。不要让 AI 通过截图重新手写已经存在的组件。

## 怎样算完成

你应该能够说明页面保存在哪里、如何打开、哪些内容被修改，以及用什么检查确认结果。同事应能在约定的语言、主题、屏幕尺寸和数据版本下复现页面。

自查、同事评审与负责人发布是三个不同环节。代码合并或本地预览成功，不代表已经部署。需要实际交付时，继续阅读[页面交付与发布](/zh/docs/deliver-publish)。

## 下一步

想先了解可用组件？进入[查找与试用组件](/zh/docs/browse-components)。准备开始搭页？先[准备工作环境](/zh/docs/prepare-environment)，再[选择页面示例](/zh/docs/choose-starting-point)。
