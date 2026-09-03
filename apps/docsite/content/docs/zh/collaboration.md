---
slug: collaboration
title: 多人协作方式
description: "你说明需求并确认效果，AI 处理搭建与版本记录，团队通过预览完成评审和交付。"
group: collaboration
order: 80
keywords: ["团队", "协作", "Fork", "上游", "职责"]
updatedAt: "2026-09-03"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/package.json
  - packages/prototypes/package.json
  - docs/adr/003-public-production-and-manual-deployments.md
---

团队采用的协作方案是：私密上游维护公共组件，获得授权的成员在自己的 Fork 中制作页面；验证稳定的公共能力通过小范围 PR 回到上游，其他成员再主动同步。

## 先了解三个位置

| 位置 | 可以怎样理解 | 由谁处理 |
| --- | --- | --- |
| 上游主项目 | 团队共享的规范、组件和页面示例 | 维护者接收经过评审的公共改进 |
| 你的 Fork | 用于独立制作的项目副本 | AI 帮你准备和更新，你确认要做的内容 |
| 任务分支 | 一次页面或组件任务的独立版本 | AI 创建并记录，方便修改、评审和恢复 |

Fork 只需准备一次，每个新任务单独开始。当前约定是让 Fork 的 `main` 用于接收上游更新，业务工作放在任务分支。你不需要手动记住分支命令，让 AI 在任务记录中写清位置即可。

## 按这条流程协作

| 你现在要做什么 | 你需要提供什么 | 继续阅读 |
| --- | --- | --- |
| 开始搭建 | 目标、参考、内容和希望保留的部分 | [开始创建](/zh/docs/prepare-environment) |
| 请同事看效果 | 自己的仓库、Vercel 项目和具体页面 | [部署与交付](/zh/docs/deliver-publish) |
| 完成工作或上线 | 接收人，以及是否需要更新正式网站 | [部署与交付](/zh/docs/deliver-publish) |
| 使用新的共享组件或页面 | 要更新的任务或遇到的问题 | [更新组件与页面](/zh/docs/sync-upstream) |

同一页面后续修改，继续原任务；与它无关的新需求，建立新任务。两个人同时制作时，让 AI 使用不同工作目录和端口，避免互相覆盖。

## 组件与页面怎样共享

业务文案、商品和活动页面留在自己的项目中。遇到公共组件不能满足的需求，请 AI 说明缺口，再按[反馈组件能力缺口](/zh/docs/create-components#report-a-component-issue)交给维护者。

经过验证、其他人也能复用的能力，可以通过[分享组件与页面](/zh/docs/contribute-upstream)单独提交。上游接受后，其他成员再选择同步时机；不会自动改写各自正在制作的页面。

## 下一步

还没有本地项目，先完成[快速开始](/zh/docs/fork-project)。已经准备好，直接[开始创建](/zh/docs/prepare-environment)。
