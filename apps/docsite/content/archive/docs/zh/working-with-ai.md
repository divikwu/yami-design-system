---
slug: working-with-ai
title: 与 AI 协作
description: "让 Agent 先读取契约、复用公共组件，并用可复现证据完成设计系统工作。"
group: guides
order: 210
keywords: ["AI", "Agent", "Skill", "验证", "证据"]
updatedAt: "2026-08-29"
sourceRefs:
  - .agents/skills/yami-design-system/SKILL.md
  - packages/design-system/SKILL.md
  - docs/ai-workflow.md
  - packages/design-system/generated/catalog.json
---

AI 可以加快检索、组合和验证，但不能替代设计系统的来源与评审。Agent 的输出必须能够追溯到公共组件、Token、内容规范和实际测试。

## 先读取，再实现

YAMI 任务开始时，Agent 必须按 Skill 中的顺序读取设计规范与相关组件文档。只有与任务相关的组件文档需要打开，但 `DESIGN.md` 与包级契约不可跳过。

在写代码前确认：

- 用户要完成的任务与页面边界。
- Catalog 中是否已有合适组件。
- 组件状态是 stable、beta 还是 experimental。
- 目标页面涉及哪些主题、语言和断点。

## 使用公共边界

应用从 `@yami/design-system` 公共入口导入组件和样式。不要复制组件源码、引用内部文件或在页面层覆盖组件状态。

如果现有组件不满足需求，应先描述缺口和最小契约；不能静默创建一个相似但不兼容的版本。

## 证据链

一次完整交付应包含四类证据：

1. 来源：使用了哪些 Token、组件文档和决策记录。
2. 静态检查：类型、lint、原则和生成漂移。
3. 运行验证：真实页面、键盘路径、浏览器日志与网络状态。
4. 发布证明：明确 commit SHA、CI 状态、目标环境和抽查结果。

HTTP 200 或本地构建通过不能单独证明界面完成。

## 人类负责的决定

Agent 不应虚构业务结果、用户反馈、采用率或实验结论。品牌资产权限、内容审校、设计取舍和生产发布仍由明确责任人确认。

当来源冲突或请求超出既有契约时，Agent 应暴露差异并请求决定，而不是选择最方便的实现。
