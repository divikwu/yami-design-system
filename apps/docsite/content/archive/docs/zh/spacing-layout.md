---
slug: spacing-layout
title: 间距与布局
description: "使用统一间距阶梯、内容宽度和响应式规则组织信息，而不是为单个页面发明尺寸。"
group: foundations
order: 120
keywords: ["间距", "布局", "响应式", "点击区域", "断点"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/tokens/primitives/spacing.tokens.json
  - packages/design-system/tokens/primitives/layout.tokens.json
  - packages/design-system/tokens/primitives/breakpoints.tokens.json
---

间距首先表达关系，其次才是空白。相邻内容越相关，间距越紧；区块职责不同，间距越大。页面只能消费已生成的间距和布局 Token。

## 间距阶梯

从最小的图标内距到页面区块间距，使用 `var(--space-*)` 系列。选择值时先确认语义关系，不根据“看起来差不多”新增任意像素。

```css
.section {
  display: grid;
  gap: var(--space-300);
  padding-block: var(--space-600);
}
```

同一层级的列表、卡片或表单字段应共享一个 gap。局部例外必须来自可解释的组件状态，而不是为了对齐某张截图。

## 页面容器

内容容器负责控制阅读长度和左右安全区。长篇正文保持较窄行长；卡片网格和商品区域可以使用更宽容器。容器宽度属于布局职责，不应通过字体缩小来容纳更多内容。

页面级布局可以声明少量明确常量，例如文档三栏的列宽与响应断点；颜色、间距、边框和圆角仍必须来自 Token。

## 响应式策略

先为窄屏建立单列阅读顺序，再逐步增强为多栏。断点变化必须保持：

- 内容顺序和语义不变。
- 主要操作仍然可见。
- 不依赖 hover 才能发现信息。
- 水平滚动只用于明确允许的轨道或表格。

Docsite 在 1024px 以下将文档侧栏移入 Sheet，这是信息架构变化，不是缩小桌面布局。

## 点击与焦点区域

交互目标至少 44px。视觉图标可以更小，但按钮或链接的可点击容器不能小于这个范围。相邻目标必须有足够间隔，避免触控误操作。

键盘焦点使用统一 2px 黑色外轮廓和 2px offset。焦点空间属于布局的一部分，不能被 `overflow: hidden` 裁掉。
