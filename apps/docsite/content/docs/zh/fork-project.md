---
slug: fork-project
title: 创建自己的 Fork
description: "在管理员确认权限后创建团队 Fork，连接独立的本地工作副本，并核对上游来源。"
group: collaboration
order: 90
keywords: ["Fork", "权限", "工作副本", "origin", "upstream"]
updatedAt: "2026-08-31"
sourceRefs:
  - README.md
  - packages/design-system/package.json
  - docs/adr/003-public-production-and-manual-deployments.md
  - docs/deployment/vercel-protection.md
---

Fork 是与你有权访问的上游项目保持关联的独立仓库。本地工作副本则是下载到电脑上的文件夹；创建 Fork 后，仍需要准备这个文件夹。

本页以团队已批准的“私密上游 + 授权 Fork”方案为前提，不表示管理员已经完成设置。请从负责人提供的入口开始，不使用搜索到的其他同名项目。

## 开始前

先向管理员获取：

- 已确认的上游仓库链接，以及你应该使用的 GitHub 账号。
- Fork 应归属的个人账号或组织；不要自行选择存放位置。
- 允许访问代码和素材的团队范围，以及出现权限问题时的联系人。

私密 Fork 的可用性和权限受上游、组织及账号方案影响。私密 Fork 也不是只有创建者可见的个人保险箱；使用前需管理员核实继承的访问范围。参见 [GitHub Fork 权限说明](https://docs.github.com/en/pull-requests/reference/forks)。

没有 Fork 按钮或目标组织不可选时，先停下来确认策略，不要复制成另一个公开仓库绕过限制。

## 创建团队 Fork

1. 用指定账号打开上游链接，核对仓库拥有者和名称。
2. 确认页面上的可见性标记符合管理员批准的私密方案。
3. 选择 **Fork**，在 **Owner** 中选择已批准的位置。
4. 按团队约定命名；首次开始通常只需要默认分支 `main`。
5. 创建后，确认仓库页面显示它来自正确的上游项目。
6. 把自己的 Fork 链接记录到任务说明，不要把它当作页面预览链接。

界面细节以 [GitHub 创建 Fork 指南](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/fork-a-repo)为准。若可见性与团队约定不一致，不要上传业务素材。

## 连接本地工作副本

你可以请 Codex 或工程协作者完成这一步：

```text
请帮助我连接团队授权的 Fork。
上游地址：<管理员提供的地址>
我的 Fork：<已创建的地址>
本地位置：<专属于我的新工作目录>
先检查目录是否已有文件或 Git 改动，不覆盖现有内容。
确认 origin 指向我的 Fork，upstream 指向上游。
本次只准备连接，不修改业务文件、不提交、不推送、不部署。
```

把占位内容换成真实地址和目录，不把访问令牌或密码写进提示词。GitHub 登录和访问授权通过团队批准的方式完成。

已有工作目录时，先确认它属于哪个项目。不要把别人的目录当作自己的 Fork，也不要为了“重新开始”清空已有文件。

`origin` 是你的远程 Fork；`upstream` 是接收公共更新的来源。名称本身不证明地址正确，必须核对实际拥有者与仓库名。

## 核对准备结果

让协作者展示以下只读检查的结论即可，不需要在群聊中贴出含凭证的终端记录：

```bash
git status --short --branch
git remote -v
git rev-parse HEAD
```

预期结果是：当前文件夹正确、没有来历不明的改动、远程地址正确，并记录本次起点的提交 SHA。

如果检查发现已有工作，先确认归属和保留方式。未确认前，不切换或覆盖分支。

完成本页不代表页面已能运行，也不代表已拥有共享预览环境；依赖安装与启动见[准备环境](/zh/docs/prepare-environment)。

## 遇到问题时

- **能看上游，但不能 Fork**：请管理员检查 Fork 策略与目标归属，不擅自改变权限。
- **Fork 创建成功，但本地没有文件**：还需要克隆到独立目录。
- **origin 指向上游**：暂停推送，让协作者确认并修正远程配置。
- **同事无法访问 Fork**：由管理员核对授权；预览访问还需要单独检查。
- **要更换账号或离开团队**：联系负责人安排交接和本地资料处理，不依赖远程权限变化自动清理电脑文件。

## 下一步

继续[准备环境](/zh/docs/prepare-environment)，或在环境已可用时[开始与管理一个任务](/zh/docs/manage-tasks)。
