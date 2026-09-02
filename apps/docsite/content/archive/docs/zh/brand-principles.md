---
slug: brand-principles
title: 品牌与设计原则
description: "用克制、直接和可验证的规则建立 YAMI 的产品界面。"
group: start
order: 30
keywords: ["品牌", "原则", "红色", "层级"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.compact.md
  - packages/design-system/DESIGN.md
  - packages/design-system/content/voice.md
---

YAMI 的界面必须像干净、高效的亚洲食品电商：信息密度足以支持购物，结构仍然安静、易扫读。品牌依靠清楚的层级和稳定规则建立辨识度，不依赖装饰。

## 产品优先

页面必须先回答用户要完成什么，再决定视觉表达。每个区块都需要明确功能：解释、比较、选择或执行。

- 不为“氛围”添加无功能文案。
- 不使用装饰性渐变、毛玻璃、纹理或手绘插画。
- 不通过悬浮阴影或缩放制造层级。
- 不在产品界面中使用 emoji。

## 两种红色

品牌红与操作红不得混用：

- `var(--brand-primary)` 只用于官方 Logo 和品牌标识。
- `var(--button-emphasis)` 用于单一高优先级操作。
- `var(--text-emphasis)` 只承担价格、紧急信息、促销或错误语义。

普通导航选中、标题和装饰不得使用红色。

## 单一操作重点

每个屏幕最多出现一个 emphasis 按钮。第二个动作必须降为 primary、secondary 或普通链接。

这个限制不是组件数量限制，而是用户决策限制。页面出现两个同等强烈的操作时，必须重新整理任务层级。

## 中性结构

YAMI 主要使用近黑文字、白色或深色画布和中性表面建立层级。Card 默认无边框、无阴影；交互反馈通过语义背景变化表达。

## 可验证优先

任何新值都必须先进入 Token 来源，再进入生成物。任何新组件都必须具备元数据、文档、Storybook 和 Registry 契约后，才能被描述为 Catalog 支持。

设计评审必须同时检查视觉结果、键盘路径、屏幕阅读器语义、亮暗主题和中英文信息对等。
