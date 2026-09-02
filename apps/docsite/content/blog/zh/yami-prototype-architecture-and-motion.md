---
slug: yami-prototype-architecture-and-motion
title: YAMI 原型的技术架构与设计实现
description: "拆解 YAMI 原型如何用 React、Storybook、Canvas、设计 Token 与克制的动效体系连接组件开发、页面组合与可重复验证。"
date: "2026-09-01"
category: engineering
authors: ["YAMI Design System Team"]
tags: ["Architecture", "Prototyping", "Motion", "Testing"]
relatedDocs: ["prepare-environment", "browse-components", "create-components"]
cover:
  src: "/images/blog/prototype-architecture.webp"
coverAlt: "YAMI 原型技术架构"
---

YAMI 的原型不是一组脱离代码的静态页面，也不是把所有能力都塞进同一个应用。它由三层相互独立又可以组合的结构构成：React 原型负责页面本身，Storybook 负责查看和验证，Canvas 负责切换路径、设备、语言、主题与设计方向。

这种拆分让同一个页面既能作为可操作原型使用，也能进入组件评审和自动化测试。页面不需要知道自己运行在 Storybook 还是 Canvas 中，设计系统也不需要依赖具体应用框架。

## 三层结构，各自解决一个问题

第一层是 `@yami/prototypes`。这里存放 Ecommerce Home、Topic Landing Page、Search Results、Product Detail 等页面原型。它直接使用 React、YAMI Design System 和共享数据契约，但不依赖 Next.js 或动效框架。

第二层是 Storybook。它读取设计系统组件和原型页面的 Story，在独立环境中提供属性控制、双语、亮暗主题和多个设备视口。组件文档、无障碍检查和浏览器测试也在这里运行。

第三层是 Canvas。它是使用 Next.js 构建的原型工作台，负责页面管理、路由预览、设备宽度、语言、主题和设计方向切换。Canvas 消费原型，而不是拥有原型；因此工作台的状态管理不会进入可交付页面。

| 层级 | 主要职责 | 核心技术 |
| --- | --- | --- |
| Prototypes | 页面结构、组件组合与可序列化方向 | React、TypeScript、CSS Modules |
| Storybook | 独立查看、文档、交互与无障碍验证 | Storybook、Vite、Vitest、Playwright |
| Canvas | 路由、设备、语言、主题与方向预览 | Next.js、React、Motion |

## React 负责页面，设计系统负责规则

原型页面基于 React 19 和 TypeScript 6。页面通过 props 接收内容、状态和导航行为，再组合 `@yami/design-system` 中的真实组件。共享的数据结构放在 `@yami/contracts` 中，避免每个页面重新定义一套相似接口。

视觉样式使用 CSS Modules，不使用 Tailwind、styled-components 或 Emotion。颜色、字体、间距、圆角和响应式值来自 DTCG Token 生成的 CSS Custom Properties。页面可以决定组件怎样排列，但不能绕过组件重新发明视觉规则。

Checkbox、RadioGroup 和部分弹出交互使用 Base UI 提供的无样式行为基础。Base UI 负责键盘路径、焦点和 ARIA 等底层语义；YAMI 组件继续拥有自己的结构、Token 和视觉状态。

这种依赖关系保持了清晰边界：

- 原型可以使用设计系统，但设计系统不能反向依赖原型。
- 设计系统不依赖 Next.js、Canvas 或 Motion。
- 页面可以替换数据与导航实现，不需要复制组件代码。
- Storybook 和 Canvas 都消费同一份原型，而不是维护两个版本。

## Storybook 是原型的验证环境

YAMI 使用 Storybook 10 和 React Vite 渲染组件与页面。全局工具栏提供中文、英文、亮色、暗色以及从 360px 到 1920px 的预设视口，让同一个 Story 可以在稳定条件下重复检查。

Storybook 同时接入三类官方能力：Docs 从组件和 Story 生成说明；Accessibility 对常见无障碍规则进行检查；Vitest 将 Story 转为浏览器中可运行的组件测试。底层由 Vite 构建，Playwright 在 Chromium 中执行交互和浏览器测试。

这使 Story 不只是展示入口。一个稳定的 Story 可以同时用于人工评审、交互断言、无障碍检查和回归验证。组件状态、测试输入和文档示例也更不容易彼此偏离。

## 动效以原生 CSS 为主

原型页面和设计系统组件没有直接依赖 Motion、GSAP、Lottie 或 react-spring。日常反馈主要通过 CSS `transition`、`@keyframes`、原生平滑滚动和少量 `requestAnimationFrame` 完成。

YAMI 的动效原则是功能优先：先用颜色说明状态变化，再用运动补充方向和连续性。高频交互保持快速，低频页面变化可以稍慢，但不能阻挡输入。

当前使用的节奏包括：

- 100–150ms：按钮、卡片、菜单等高频状态变化。
- 150ms：弹层和下拉菜单进入或离开。
- 300ms：页面或主要内容区域淡入。
- 1000–1500ms 线性循环：加载 Spinner 和 Skeleton shimmer。

Hover 和 Press 不放大组件，也不改变阴影，只调整背景色。ProductCard 图片可以在固定卡片几何内放大到 `1.03`，但卡片和网格位置保持不动。高度、宽度、字体大小、边框宽度和网格重排不会参与动画，以避免布局抖动。

所有非必要动效都需要响应 `prefers-reduced-motion`。当用户开启“减少动态效果”时，过渡和装饰性动画会立即完成；必要的加载反馈仍然保留。

## Motion 只存在于 Canvas 外壳

Canvas 使用 `motion/react` 处理工作台自身的过渡，而不是把它注入设计系统。左侧控制面板进入时使用透明度和 8px 位移；切换页面路径时，预览内容从 8px 下方淡入，持续 300ms；切换设计方向时只进行 200ms 淡入。

这些过渡由 URL 参数控制，并通过 `useReducedMotion` 自动响应系统偏好。它们帮助用户理解“预览上下文发生了变化”，但不会改变原型页面自己的组件行为。

将 Motion 留在 Canvas 有两个好处：可交付组件不会承担额外运行时依赖，Storybook 看到的仍然是页面真实的基础行为；同时工作台可以拥有必要的上下文切换反馈，而不影响下游使用原型的方式。

## 测试覆盖不同层级

Vitest 负责组件、数据转换和页面逻辑的快速测试。Storybook Test 在浏览器中运行 Story；Playwright 验证真实渲染、键盘交互和响应式表现；Axe 补充自动化无障碍检查。

仓库级校验还会检查 TypeScript、包边界、组件目录、生成文件、Token 引用和设计原则。这样的目标不是让单一工具证明所有事情，而是让每种风险在最合适的层级被发现。

视觉评审仍然不可省略。测试可以证明元素存在、操作成功和规则没有被违反，但双语换行、图片裁切、内容密度与页面节奏仍需要在目标视口中观察。Storybook 提供稳定输入，Canvas 提供连续体验，两者共同让人工判断可以复现。

## 克制依赖，让原型保持可迁移

当前原型刻意没有引入 Tailwind、CSS-in-JS、GSAP、Lottie 和弹簧动画库。不是这些工具不能使用，而是现阶段 React、CSS Modules、设计 Token 和原生浏览器能力已经能覆盖主要需求。

当新能力确实需要更复杂的时间线或状态驱动动效时，可以先判断它属于页面、组件还是工作台，再把依赖放到最小的拥有者中。这样能避免为了一个局部效果，让整个设计系统承担不必要的运行时成本。

YAMI 原型架构的重点不是技术数量，而是边界清楚：React 页面保持可复用，设计系统保持独立，Storybook 提供可验证状态，Canvas 提供连续预览，动效只在需要说明变化时出现。
