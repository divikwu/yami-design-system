---
slug: contribute-upstream
title: 分享组件与页面
description: "把验证过的组件、页面示例及其改进交给 AI 整理，提交到共享仓库供团队评审。"
group: collaboration
order: 140
keywords: ["组件", "页面", "改进", "分享", "上游", "PR"]
updatedAt: "2026-09-03"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/prototypes/package.json
  - tooling/migration/check-boundaries.mjs
  - .github/workflows/ci.yml
  - docs/maintainers/zh/maintain-releases.md
  - docs/maintainers/en/maintain-releases.md
---

你在自己的项目中创建了可复用的组件或页面，或改进了已有示例，都可以提交到共享仓库。你说明它的用途，AI 负责提取文件、验证和准备评审。

每次围绕一个组件、页面或明确的改进提交，方便团队评审和复用。未完成任务交给其他团队成员继续，使用[部署与交付](/zh/docs/deliver-publish#hand-off-to-a-team-member)。

## 哪些改进适合分享

- 多个页面都能使用的组件或新状态。
- 可复用的完整页面、页面模板，以及已有页面示例的结构和交互改进。
- 通用的交互、响应式或无障碍问题修复。
- 帮助团队正确使用组件与页面的示例和用法说明。

分享页面时，保留可复用的布局、模块组合和交互，并附上允许共享的示例文案、图片及数据。活动专属内容、私有接口和账号配置留在自己的项目中。不确定是否需要改组件时，先让 AI [检查组件问题](/zh/docs/create-components#report-a-component-issue)，再与维护者确认方向。

## 让 AI 准备并提交改进

确认方向后，填写下面的信息。这里的 PR 是向共享仓库提出的一份修改申请，由维护者评审后决定是否接收。

```text
请把这个组件或页面整理并提交到共享仓库评审。
项目位置：<本地目录>
目标共享仓库：<GitHub 仓库地址>
分享内容：<要分享的组件或页面，以及它的用途>

- 在独立目录和分支中整理，只提取本次内容，保留原项目的已有改动。
- 按目标仓库规范补齐依赖、示例和用法，确保可以独立使用，不带入私有数据。
- 完成检查并打开效果；范围、提交目标不明确或检查失败时，先告诉我。
- 检查通过后，授权你推送到我的 Fork，并向目标仓库创建 PR，说明变化、检查结果和已知问题。
- 返回 PR 和效果链接。
- 不合并或发布。
```

你不需要手工列出代码文件或填写版本编号，AI 应根据实际改动补全。若 PR 出现大量无关页面和业务文件，让 AI 重新提取本次范围。

## 评审后怎么继续

维护者会确认组件或页面是否适合共享、是否影响现有使用方，以及是否需要修改。把明确的评审意见交给 AI，继续在同一份 PR 中调整并重新检查。

合并后，让 AI 记录接收的版本，再按[更新组件与页面](/zh/docs/sync-upstream)把改进带回自己的项目。其他项目也需要主动接收更新；PR 已合并，不代表所有项目或线上网站都已更新。

暂未被接收的改进可以留在项目中，记录原因和限制。

## 怎么判断完成

- 提交评审时：PR 只包含这项改进，有可查看的效果和验证说明。
- 被接收后：AI 能指出合并版本，并说明原项目是否已接收更新。

## 维护者参考

负责审核、版本记录和发布的团队成员，可查看仓库中的[维护上游版本](https://github.com/divikwu/yami-design-system/blob/main/docs/maintainers/zh/maintain-releases.md)。普通搭建任务无需执行其中的维护步骤。
