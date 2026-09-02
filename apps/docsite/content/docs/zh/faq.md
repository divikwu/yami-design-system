---
slug: faq
title: 常见问题
description: "解决环境、组件复用、预览、版本同步和交付过程中最常见的问题。"
group: resources
order: 190
keywords: ["常见问题","启动","预览","同步","故障"]
updatedAt: "2026-08-31"
sourceRefs:
  - package.json
  - apps/storybook/package.json
  - apps/canvas/app/lib/drafts.ts
  - docs/deployment/vercel-protection.md
  - packages/design-system/package.json
---

排查前先记下当前目录、分支、代码版本、启动命令和完整报错。不确定哪个进程或文件属于其他任务时，停止覆盖或清理，先确认负责人。

## 只想看组件，需要安装项目吗

不需要。直接打开 [Storybook](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--showcase)。如果入口要求授权，联系维护者。只有需要修改或创建页面时才准备 Fork 和本地环境。

## 页面显示拒绝连接，怎么办

通常意味着对应地址没有服务在监听，也可能是端口或主机地址不一致。确认终端仍在运行正确应用，并使用终端实际输出的地址。

在仓库根目录使用 `pnpm dev:storybook` 启动 Storybook，文档站使用 `pnpm dev:docsite`。它们是不同服务；文档站可以打开，不代表 Storybook 已启动。首次安装与启动见[快速开始](/zh/docs/fork-project)。

端口被占用时先确认占用者，不要让 AI 批量结束 Node 进程。服务启动后，还要检查页面真实渲染和浏览器错误，不能只看 HTTP 状态。

## AI 没用公共组件，怎么办

先让 AI 列出当前页面的导入路径与复用来源。要求重新读取 `packages/design-system/SKILL.md`，对照 Catalog、组件用法和最接近的维护页面。

如果现有组件能满足需求，改回公开导入；确实缺能力时，先[反馈组件能力缺口](/zh/docs/component-gaps)，不要复制公共组件再隐藏地改一份。

## Controls 的改动为什么没有保存

Controls 只改变示例的当前参数，并不把修改写回业务页面。需要保留时，让 AI 在自己的任务 Story 或数据文件中保存配置，具体见[继续调整页面](/zh/docs/choose-starting-point#continue-refining-a-page)。

Canvas 的本地草稿也不是团队云端协作记录。需要共享时，保存约定的文件、代码版本和评审材料；不要把本机浏览器中的状态当作同事可以恢复的版本。

## 同事打不开我的预览

`localhost` 指向访问者自己的电脑。把本地地址发给同事，不会把你的服务共享出去。

请按[共享预览与评审](/zh/docs/review-preview)申请团队可访问的预览或约定本地复现。仓库访问权限与预览站点权限分别检查。尚未配置预览时，可先提供截图与录屏供静态讨论，但交互验收仍待完成。

## 同步后自己的页面发生变化

先记录同步前后的上游与项目版本，确认变化来自数据、页面组合还是公共组件。按[同步上游与处理冲突](/zh/docs/sync-upstream)在独立任务分支处理，重新跑共用验收清单。

不要直接强制覆盖工作分支，也不要未经确认退回整个共享仓库。将无法判断的公共行为变化交给维护者，必要时保留更新前的评审版本继续工作。

## 找不到 npm 安装或自动升级入口

当前入门路径是获取仓库 Fork，使用 monorepo 中的 workspace 源码包。不要把 `@yami/design-system` 当作已经公开发布的 npm 包安装，也不要把 Registry 元数据当作已经配置好的远程安装服务。

按[快速开始](/zh/docs/fork-project)建立自己的工作副本即可。需要独立仓库消费发布包时，先与维护者确认分发方式和兼容性约定。

## 检查通过、PR 合并后就上线了吗

没有。自动检查、同事评审、代码合并和站点部署是不同事件。具体命令通过只证明其覆盖范围内的检查；没有执行的浏览器或主题组合测试不能写成通过。

发布必须有明确目标、授权人、代码版本和部署后验证，参见[页面交付与发布](/zh/docs/deliver-publish)。私密仓库也不自动使预览站点私密。

## 仍然无法解决时提供什么

复制[修改反馈模板](/zh/docs/templates#change-feedback)，附上完整报错、复现步骤、预期结果、具体代码版本，以及已经尝试的方法。移除密钥和敏感数据，再交给负责人或维护者。
