---
slug: build-test-document-components-with-storybook
title: 用 Storybook 构建、测试和记录组件
description: "把每个 UI 状态保存为可复用的 Story，让同一份示例同时服务组件开发、测试、文档与团队协作。"
date: "2026-09-01"
category: engineering
authors: ["YAMI Design System Team"]
tags: ["Storybook", "Components", "Testing", "Documentation"]
relatedDocs: ["browse-components", "create-components", "review-checklist"]
cover:
  src: "/images/blog/storybook-workbench.webp"
coverAlt: "YAMI Storybook 组件工作台"
---

Storybook 是一个用于独立构建 UI 组件和页面的前端工作台。无需启动完整应用，也不必先进入某条业务流程，就能直接查看组件的默认状态、边界情况和难以触达的交互。它开源且免费，被广泛用于 UI 开发、测试和文档编写。

Storybook 的核心不是把组件排成一个展览页，而是把每种有意义的 UI 状态保存为一个 **Story**。同一份 Story 可以在开发时用于调试，在评审时用于确认视觉和行为，在测试中成为可执行的用例，也可以自动进入组件文档。官方将这种方式概括为：写一次 Story，在不同工作流中重复使用。

## Story 是组件状态的可复现记录

一个组件通常不只有“默认效果”。按钮可能处于加载、禁用或聚焦状态；表单可能显示校验错误；弹层可能打开并等待键盘操作；页面也可能遇到空数据、长文案或网络失败。

Story 使用参数和模拟数据描述其中一个明确状态。它不复制组件实现，而是调用真实组件，并补齐渲染该状态所需的上下文。因此，团队不必反复操作完整应用来制造边界场景，也不需要依赖一张无法操作的截图。

```tsx
export const Disabled = {
  args: {
    children: "提交",
    disabled: true,
  },
};
```

当 `Disabled` 成为一个命名清楚的 Story，这个状态就拥有了稳定入口。设计师、开发者和测试人员打开同一个链接，看到的是同一份真实实现与相同条件。

## 在独立环境中构建组件

Storybook 在与应用业务逻辑相对隔离的环境中渲染组件。开发者可以通过 props、模拟数据和事件准备特定变化，再把基础组件逐步组合成复杂组件和页面。

这种方式适合从小处开始：先确认组件的结构与公共属性，再覆盖重要状态，然后检查组件组合后的结果，最后接入真实数据和业务逻辑。隔离并不代表脱离真实产品；它的作用是先减少干扰，让问题能被准确定位。

在 YAMI Storybook 中，可以按内容层级寻找入口：

1. **Foundations**：查看颜色、字体、间距和尺寸等基础规则。
2. **Components**：查看真实组件的变体、状态和公共属性。
3. **Pages**：在页面组合中检查组件如何共同工作。

以 Button 为例，可以先打开 [Showcase](https://yds-storybook.vercel.app/?path=/story/yami-components-actions-button--showcase) 浏览主要变体，再进入 [Playground](https://yds-storybook.vercel.app/?path=/story/yami-components-actions-button--playground) 调整属性。需要长期复查的状态，应保存为单独的 Story，而不是只停留在一次临时调整中。

## 把 Story 变成测试用例

每个能够成功渲染的 Story，首先是一项基础渲染检查。在此之上，可以通过 `play` 函数模拟用户操作，并断言界面中可以观察到的结果。例如：打开菜单后选项是否出现，提交表单后错误信息是否与字段关联，关闭弹层后焦点是否回到触发按钮。

Storybook 官方将组件测试定义为三者的结合：在浏览器中真实渲染组件、模拟接近端到端测试的用户操作，同时保持组件级测试便于准备数据和隔离依赖的特点。围绕同一批 Story，还可以继续进行：

- **交互测试**：验证点击、输入、键盘路径和状态变化。
- **无障碍测试**：检查可访问名称、语义、对比度和常见规则问题。
- **视觉测试**：把当前渲染与已确认的基准图进行比较。
- **覆盖率检查**：发现仍未被 Story 和测试触达的代码分支。

自动化测试不能替代人工判断。中文与英文的换行、图像裁切、主题层级和复杂页面节奏，仍需要在目标视口中查看；但 Story 能固定输入条件，让这些判断可以被下一位协作者重复。

## 从 Story 自动形成组件文档

Storybook 可以分析组件和 Story，为属性、参数与示例生成文档。文档不再只描述组件“应该怎样工作”，而是把说明与可操作的真实实现放在一起。组件发生变化时，Story、测试和文档也围绕同一份实现更新，减少示例与代码逐渐失真的风险。

发布后的 Storybook 还可以提供稳定链接，让开发者、设计师、产品经理和其他评审者无需搭建本地环境就能查看进行中的实现。分享时应链接到具体 Story，而不是只发送 Storybook 首页，并同时记录语言、主题、视口和检查过的交互。

## 在 YAMI 中怎样使用 Storybook

YAMI 将 Storybook 作为组件与页面原型的可操作规格，但它不是唯一的交付依据：

- **Docsite** 解释设计原则、组件使用方法和协作流程。
- **Storybook** 展示真实组件、状态、交互与页面组合。
- **自动化检查** 验证类型、设计规则、包边界和回归测试。
- **业务页面** 验证真实数据、路由和上下文中的最终表现。

一次有效的组件检查可以从四步开始：

1. 找到与任务最接近的 Story，并确认它使用的是真实组件。
2. 查看默认状态，再逐项检查关键状态、双语内容、主题和响应式表现。
3. 用键盘或指针完成核心交互，核对用户能够观察到的结果。
4. 保存具体 Story 链接，记录已检查条件、未覆盖场景和已知限制。

如果现有 Story 已经覆盖需求，优先复用它；如果缺少稳定状态，再新增 Story，并让实现、测试和使用说明一起更新。这样，Storybook 才不只是组件目录，而是团队可以共同构建、验证和复用 UI 的工作台。

进一步了解 Storybook 的设计与能力，可以阅读官方的 [Get started](https://storybook.js.org/docs)、[Why Storybook](https://storybook.js.org/docs/get-started/why-storybook)、[UI testing](https://storybook.js.org/docs/writing-tests) 和 [Sharing](https://storybook.js.org/docs/sharing) 文档。
