---
slug: color
title: 色彩
description: "使用语义颜色表达文字、表面、操作和状态，不直接消费原始色阶。"
group: foundations
order: 100
keywords: ["颜色", "语义色", "品牌红", "操作红", "暗色"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/tokens/semantic/colors.tokens.json
  - packages/design-system/tokens/themes/dark.tokens.json
---

YAMI 的色彩系统以中性画布为主，红色只承担品牌或明确操作语义。组件和页面必须使用语义别名，不得直接选择原始色阶。

## 核心语义

| 角色 | Token | 用途 |
| --- | --- | --- |
| 页面背景 | `var(--background-primary)` | 页面主画布 |
| 次级背景 | `var(--background-secondary)` | 分区和内容带 |
| 主要文字 | `var(--text-primary)` | 标题与正文 |
| 次要文字 | `var(--text-secondary)` | 描述与元数据 |
| 默认边框 | `var(--border-default)` | 轻量结构分隔 |
| 操作强调 | `var(--button-emphasis)` | 每屏唯一强调 CTA |

语义 Token 可以在不改变组件代码的情况下切换主题。原始 `--color-*` 变量只用于定义语义层，不是应用消费接口。

## 双红规则

`var(--brand-primary)` 对应 Logo 品牌红。它不得用于按钮、普通文字、Badge 或装饰背景。

操作红通过 `var(--button-emphasis)`、`var(--text-emphasis)`、`var(--border-attention)` 等语义入口使用，只能表达操作、价格、促销、紧急信息或错误。

## 状态色

蓝、绿、紫、黄只能出现在明确状态或 Badge 调色板中。普通布局、导航和内容卡不得把这些颜色当装饰。

状态信息不能只依靠颜色。必须同时提供文字、图标或结构信号，使色觉差异用户也能理解结果。

## 表面与层级

页面使用 `var(--surface-primary)` 和 `var(--surface-secondary)` 建立内容层次。Card 默认不靠边框或阴影分离；优先使用间距、表面变化和合法圆角。

相反极性的内容使用 `var(--surface-inverse)`，并配套消费 inverse 文字、按钮和焦点 Token。inverse 是当前主题中的相反表面，不等于暗色模式。

## 暗色主题

`.dark` 会覆盖语义别名。组件不得增加独立 dark 属性，也不得在应用中复制一组暗色色值。

检查暗色主题时必须验证：正文对比度、嵌套表面、焦点环、禁用态、操作红和 inverse 区域。
