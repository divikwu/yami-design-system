---
slug: accessibility
title: 无障碍
description: "把键盘、语义、焦点、对比度和触控目标作为组件与页面的完成条件。"
group: foundations
order: 150
keywords: ["无障碍", "键盘", "焦点", "ARIA", "对比度"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/components/Sheet/usage.md
  - packages/design-system/components/Input/usage.md
  - packages/design-system/principles/validators/focus-style.ts
  - packages/design-system/principles/validators/tap-target.ts
---

无障碍不是发布前的修补项。组件的语义与键盘行为、页面的标题结构和内容可读性必须在设计阶段一起确定。

## 使用原生语义

页面跳转使用链接，动作使用按钮，表单字段必须有可见 label。一级导航使用 `<nav>` 和链接；Tabs 只用于同页内容切换。

ARIA 只补足原生语义无法表达的状态。不要用 `role="button"` 重建按钮，也不要为了“通过检查”添加重复标签。

## 键盘路径

所有交互必须支持 Tab、Shift+Tab、Enter 或 Space。弹层还必须支持 Esc 关闭、焦点约束和关闭后恢复。

搜索面板需要支持上下键移动结果、Enter 打开、Esc 关闭，并把焦点还给打开它的控件。移动菜单遵循同样原则。

## 焦点可见

交互元素使用统一 2px 黑色外轮廓和 2px offset。焦点不能只改变颜色，也不能因圆角或 overflow 被裁掉。

`focus-visible` 用于键盘焦点反馈；不要全局移除 outline。

## 对比与状态

正文、次要文字、操作和边框必须在亮暗模式中满足目标对比度。错误、成功、选中和禁用状态不能只依赖颜色。

禁用态使用专用背景、文字和边框 Token。降低整个元素 opacity 会让内容和焦点状态不可预测，因此禁止使用。

## 验证方式

自动 axe 检查可以发现结构问题，但不能替代人工操作。每次交付至少完成：

1. 只用键盘走通核心任务。
2. 检查屏幕阅读器可读名称和状态。
3. 验证 200% 缩放和 402px 窄屏。
4. 在亮暗主题下检查对比度与焦点。
5. 开启 reduced-motion 后确认内容仍可理解。
