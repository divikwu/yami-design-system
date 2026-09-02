---
slug: fork-project
title: 快速开始
description: "将主项目 Fork 为自己的下游仓库，建立独立的本地副本，并验证 Storybook 可以真实渲染。"
group: start
order: 10
keywords: ["GitHub", "Fork", "下游项目", "origin", "upstream", "Storybook"]
updatedAt: "2026-09-02"
sourceRefs:
  - README.md
  - package.json
  - apps/storybook/package.json
  - packages/design-system/SKILL.md
---

第一次在本地使用 YAMI 时，可以让 Codex 或 Kiro 协助完成 Fork、克隆、依赖安装和 Storybook 验证。整个过程应使用独立目录，不影响主项目、已有文件或其他任务的服务。

## 选择使用方式

| 你的目标 | 怎么开始 | 是否需要下载项目 |
| --- | --- | --- |
| 查看组件、规范或页面示例 | 打开团队提供的 Storybook | 不需要 |
| 使用 AI 创建或修改页面 | 完成下面的一次性准备 | 需要 |

以下流程面向需要在本地搭建页面的用户。环境准备完成后，不需要为每个新任务重复 Fork 和安装项目。

## 开始前准备

准备好三项信息：

- YAMI 主项目地址：`https://github.com/divikwu/yami-design-system`。
- 你获准使用的 GitHub 账号或组织。
- 一个新的本地目录完整路径，例如 `/Users/<你的名字>/workspace/yami-design-system`。

不要把 GitHub 密码、访问令牌或其他密钥写进提示词。登录与授权应通过 GitHub 或团队批准的方式完成。如果没有 Fork 权限或目标组织不可选，先联系管理员，不要创建公开副本绕过限制。

## 复制提示词

将下面的 `<新的本地目录完整路径>` 替换为你准备使用的位置，再发送给 Codex 或 Kiro：

```text
请将下面的 YAMI Design System 主项目 Fork 为我的下游项目：

https://github.com/divikwu/yami-design-system

新的本地目录：<新的本地目录完整路径>

请完成：

1. 确认当前登录的 GitHub 账号，但不要显示访问令牌或其他凭证。
2. Fork 该仓库到我的 GitHub 账号下，不修改项目名称。
3. 如果 Fork 已经存在，不要重复创建。
4. 将我的 Fork 克隆到指定的新本地目录，不覆盖已有目录。
5. 确认我的 Fork 是 origin，原始主项目是 upstream。
6. 安装项目依赖，不删除或改写锁文件来绕过错误。
7. 运行 pnpm generate。
8. 只启动 Storybook，不启动 Canvas、Docsite 或其他应用。
9. 在浏览器中打开 Storybook，并验证页面和真实组件正常渲染，而不只是返回 HTTP 200。
10. 不修改与本次任务无关的文件，不提交、不推送、不发布。

完成后告诉我：

- 下游 GitHub 仓库地址
- 本地项目完整路径
- origin 和 upstream 地址
- Storybook 地址
- 后续启动 Storybook 的命令
- 实际打开的 Story 或组件
- 页面渲染和浏览器控制台的验证结果

如果遇到已有 Fork、目录冲突、权限问题、依赖错误或端口占用，请先说明。
不要覆盖或删除文件，也不要停止来源不明或属于其他任务的服务。
```

本地目录必须明确写出。不要只写“下载到项目目录”或“放到桌面”，否则 AI 无法可靠判断是否会覆盖已有工作。

## 检查完成结果

不要只接受“服务正常”、HTTP 200 或一个 Storybook 地址。完成报告应包含：

| 检查项 | 应确认的结果 |
| --- | --- |
| GitHub | 当前账号、Fork 地址，以及 Fork 来自正确的主项目 |
| 本地副本 | 新目录的完整路径、起点提交和未提交修改状态 |
| 远程仓库 | `origin` 指向你的 Fork，`upstream` 指向 `divikwu/yami-design-system` |
| 生成结果 | `pnpm generate` 成功，未通过删除锁文件绕过错误 |
| Storybook | 实际监听地址和以后使用的启动命令 |
| 浏览器 | 打开具体的 YAMI Story，预览内容真实渲染且没有阻止使用的错误 |

还应确认 Storybook 监听进程属于刚克隆的目录，而不是另一个工作副本。以后可以在仓库根目录运行：

```bash
pnpm dev:storybook
```

这些结果只证明环境已经可用，不表示代码已经评审、提交、合并或发布。

## 遇到问题与下一步

- **Fork 已存在**：复用并核对上游来源，不重复创建。
- **目标目录已存在**：停止并报告路径，不覆盖、清空或自行更换目录。
- **权限或依赖失败**：保留原始错误，检查账号、仓库策略以及项目要求的 Node.js、pnpm 和锁文件。
- **端口被占用**：先确认进程所属目录，不停止其他任务的服务。
- **页面空白或组件未渲染**：检查 Storybook 预览区域、资源请求和浏览器控制台，不把 HTTP 200 当作完成。

完成后先阅读[Storybook 入门](/zh/docs/getting-started)，再[查看组件与页面](/zh/docs/browse-components)。准备创建组件或页面时，从[开始创建](/zh/docs/prepare-environment)选择对应流程。
