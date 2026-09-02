---
slug: light-dark-mode
title: 亮暗模式
description: "让同一套语义 Token 在亮暗主题中稳定工作，并避免首屏闪烁和组件级主题分叉。"
group: foundations
order: 140
keywords: ["亮色", "暗色", "主题", "dark", "系统设置"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/tokens/themes/dark.tokens.json
  - packages/design-system/generated/tokens.css
  - packages/design-system/assets/logos/README.md
---

YAMI 的暗色模式由根元素上的 `.dark` 类切换。组件始终消费同名语义变量，不接受独立 `dark` 属性，也不维护第二套业务色值。

## 主题来源

首次访问跟随系统 `prefers-color-scheme`。用户显式选择后，保存 `light` 或 `dark`；此后以用户选择为准。只有在没有保存值时，系统主题变化才应实时影响页面。

这个优先级必须在所有应用中保持一致：

1. 用户已保存的选择。
2. 当前系统设置。
3. 无法读取系统设置时使用亮色。

## 防止首屏闪烁

主题类必须在 React 水合前写入 `<html>`。内联脚本只读取受控的主题键，并同步 `color-scheme`。主题控件完成水合后再显示当前状态。

```js
const saved = localStorage.getItem("yami-docsite-theme");
const dark = saved ? saved === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
document.documentElement.classList.toggle("dark", dark);
```

## 语义映射

暗色覆盖定义在 Token 来源中。页面只写 `var(--text-primary)`、`var(--surface-primary)` 等语义变量；不能在应用 CSS 中创建 `.dark .component` 色值分支。

inverse 表面表示“当前主题的相反极性”，不等于固定黑色。反色区域中的文字、焦点和 Logo 必须使用对应 inverse 资源与 Token。

## 验证清单

- 刷新后没有亮色闪帧。
- 保存选择后再次访问仍保持主题。
- 未保存选择时跟随系统变化。
- Logo 在暗色背景使用官方 inverse 锁定版。
- 焦点、禁用态、表格和代码块都保持可读对比度。
