---
slug: faq
title: 常见问题
description: "遇到页面打不开、修改未保存或预览无法分享等问题时，让 AI 帮你检查和处理。"
group: resources
order: 190
keywords: ["常见问题","启动","预览","同步","故障"]
updatedAt: "2026-09-03"
sourceRefs:
  - package.json
  - apps/storybook/package.json
  - apps/storybook/vercel.json
  - docs/deployment/vercel-protection.md
  - packages/design-system/package.json
---

遇到问题时，把页面链接、报错或截图交给 AI，说明你刚才做了什么、希望得到什么结果。项目位置、版本和运行状态由 AI 查明，无需自己整理技术记录。

## 只想看组件和页面，需要安装项目吗

不需要。直接打开 [Storybook](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--showcase) 就能浏览和试用组件与页面示例。需要自己创建或修改时，再按[快速开始](/zh/docs/fork-project)准备本地项目。

## 本地页面打不开，怎么办

把打不开的地址和报错截图交给 AI，让它检查对应项目是否已启动、地址是否正确，再打开页面验证。文档站和 Storybook 是分别启动的，能打开其中一个不代表另一个也已启动。

如果提示端口被占用，让 AI 确认是哪个项目在使用，并选择可用地址，避免关闭其他任务。首次启动见[快速开始](/zh/docs/fork-project)。

## AI 做出的页面没有复用现有组件，怎么办

把你希望使用的组件或页面示例链接交给 AI，让它对照项目规范检查复用情况，优先使用已有能力，并保留已经确认的内容。

如果现有组件确实不能满足需求，按[反馈组件问题](/zh/docs/create-components#report-a-component-issue)说明场景，再决定是否扩展或新建组件。你不需要自己检查代码导入路径。

## 在 Controls 中调整后，为什么没有保存

Storybook 的 Controls 用来临时试用参数，不会把调整自动保存到你的页面。把希望保留的效果或截图交给 AI，让它应用到自己的项目并保存。

具体操作见[继续调整页面](/zh/docs/choose-starting-point#continue-refining-a-page)。需要分享保存后的结果时，再按[部署与交付](/zh/docs/deliver-publish)生成在线链接。

## 团队成员打不开我的预览，怎么办

先看链接是否包含 `localhost` 或 `127.0.0.1`：这类地址只能用于本机，不能直接发给团队成员访问。按[部署与交付](/zh/docs/deliver-publish)取得在线预览链接。

如果已经是在线链接，让 AI 检查部署是否成功、链接是否正确，以及团队成员是否有访问权限。GitHub 仓库权限和网站访问权限需要分别检查，不要为了让链接能打开就直接改成公开。

## 更新后自己的页面变了，怎么办

把变化前后的截图或页面位置交给 AI，说明哪些效果需要保留。让 AI 比较更新前后的版本，在独立分支中处理差异，不覆盖当前工作。

不需要为了保持“最新”而更新正在评审的页面。需要新组件、页面示例或修复时，再按[更新组件与页面](/zh/docs/sync-upstream)处理；无法判断的变化交给维护者确认。

## 检查通过或 PR 合并，就代表上线了吗

不一定。检查通过说明完成了相应验证；PR 是代码修改申请，合并后是否部署取决于目标分支和项目配置。

已接入自动部署的项目，非生产分支通常更新预览，生产分支更新会触发正式部署。让 AI 确认部署成功，并打开正式地址检查对应版本，才能确认本次发布完成。具体流程见[部署与交付](/zh/docs/deliver-publish)。
