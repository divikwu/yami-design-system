---
slug: radius-border-surfaces
title: 圆角、边框与表面
description: "通过批准的圆角、边框强度和语义表面建立层级，避免阴影与装饰性描边。"
group: foundations
order: 130
keywords: ["圆角", "边框", "表面", "Card", "层级"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/tokens/semantic/radius.tokens.json
  - packages/design-system/tokens/semantic/colors.tokens.json
  - packages/design-system/components/Card/usage.md
---

YAMI 使用少量圆角和中性表面建立稳定的产品语言。组件不能通过独立圆角、悬浮阴影或多重描边制造“精致感”。

## 合法圆角

只使用三种语义：小圆角、中圆角和完全圆形。对应实现必须消费已有 radius Token。

- 小圆角用于控件和紧凑容器。
- 中圆角用于 Card、Sheet 内部区块和主要表面。
- 完全圆形只用于头像、圆形图标按钮或明确的胶囊控件。

同一组件在不同页面不能改变自身圆角。

## 边框强度

`var(--border-default)` 用于轻量结构分隔。焦点与注意状态分别使用对应的 focus 与 attention 语义 Token，不能通过加深任意颜色模拟。

边框不能替代间距。页面中每个区块都带边框会降低层级，使内容看起来同等重要。

## 语义表面

页面主画布、次级内容带和反色区域分别消费 primary、secondary 和 inverse 表面。嵌套表面最多保持清楚的两到三级关系；如果需要更多层级，应重新整理内容结构。

```css
.panel {
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
}
```

## Card 规则

Card 默认无边框、无阴影。它通过背景、间距和圆角与页面分离。可点击 Card 的 hover 与 pressed 状态改变语义背景，不抬升、不缩放。

当 Card 位于同色表面且边界确实无法识别时，才可使用批准的弱边框。这个决定应在组件层解决，不能由每个页面分别覆盖。
