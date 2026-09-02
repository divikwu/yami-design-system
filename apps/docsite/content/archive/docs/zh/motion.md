---
slug: motion
title: 动效
description: "让动效解释状态变化并尊重用户偏好，不用动画替代清楚的信息结构。"
group: foundations
order: 160
keywords: ["动效", "过渡", "reduced-motion", "hover", "状态"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/components/Sheet/Sheet.module.css
  - packages/design-system/components/Button/Button.module.css
---

YAMI 动效只承担反馈与方向说明。界面即使完全关闭动画，也必须保持任务、状态和层级可理解。

## 允许的用途

- 控件 hover、pressed 和 focus 的短暂状态过渡。
- Sheet、Dialog 等表面的进入与退出。
- 展开、收起或滚动定位时说明空间关系。
- 加载状态中明确告知系统正在处理。

动效不得用于无功能装饰、自动轮播或持续吸引注意力。

## 反馈而非抬升

Card 和按钮的 hover 状态使用语义背景变化。不得通过悬浮阴影、缩放或大幅位移制造抬升效果。

pressed 状态可以使用批准的轻量位移，但必须来自组件契约，页面不能重复实现。

## 时长与节奏

当前生成 Token 尚未发布 duration 或 easing 变量。应用不应自行建立一套动效值；优先复用共享组件已经验证的过渡。若确有页面级需求，先在 Token 来源和规范中定义，再进入应用。

相同交互在不同页面应保持相同节奏。动画时长应足以被理解，但不能阻碍连续操作；页面中不得留下新的任意毫秒值。

## Reduced motion

任何非必要动画都必须响应 `prefers-reduced-motion: reduce`。锚点跳转改为即时定位，进入动画缩短或取消；状态变化和焦点仍需可见。

```css
@media (prefers-reduced-motion: reduce) {
  .content {
    scroll-behavior: auto;
  }
}
```

测试时不能只检查“没有动画”，还要确认取消动画后不会丢失内容、焦点或完成反馈。
