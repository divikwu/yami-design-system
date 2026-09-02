---
slug: browse-components
title: 查找与试用组件
description: "在 Storybook 中确认组件的用法、状态和适用场景，把可靠的参考带回页面任务。"
group: start
order: 20
keywords: ["Storybook","组件","Controls","规范","主题"]
updatedAt: "2026-08-31"
sourceRefs:
  - apps/storybook/.storybook/preview.tsx
  - apps/storybook/.storybook/component-docs.tsx
  - packages/design-system/components/Button/Button.stories.tsx
  - packages/design-system/color.stories.tsx
  - packages/design-system/responsive.stories.tsx
---

适合需要找组件、确认交互或提供设计参考的同事。准备好一个具体问题，例如“哪种按钮适合提交表单？”；只浏览时不需要安装开发环境。

## 找到一个组件

1. 打开 [Button 示例](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--showcase)。
2. 在左侧搜索框输入组件名称，例如 Button、ProductCard 或 Sheet。名称不确定时，可以先从相近的页面示例寻找。
3. 展开组件目录，查看 Docs、Showcase 和具体状态示例。不同组件的 Story 名称可能不同。
4. 记录地址栏中的具体链接，而不是只分享 Storybook 首页。

Story 是一个可以运行的示例。Showcase 通常集中展示组件的常用形态；Docs 汇总参数与用法。不是每个组件都支持相同参数，实际公开属性和说明优先。

## 调整参数，理解边界

以 Button 为例，在 [Playground](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--playground) 的 Controls 中分别试用尺寸、层级和禁用状态。一次只改一个参数，观察样式与行为的变化。

然后查看 [Loading](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--loading) 和 [Disabled](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--disabled)，比较加载、不可用与普通状态。

- Controls 是试用参数的面板，不是业务数据编辑器。
- 参数变化不等于源码已修改；刷新或重置后可能回到默认示例。
- 不要把示例中的点击反馈理解为真实下单、付款或保存。
- 没有展示的业务结果，需要在页面任务中单独说明和实现。

## 主题与屏幕尺寸

使用工具栏的语言、主题和视口选项检查同一个示例：

1. 切换中文和英文，比较标题、按钮、长文本与数字。
2. 切换浅色和深色，检查文字、背景、边框及状态是否仍然可辨。
3. 查看窄屏和桌面尺寸，确认内容顺序、换行与滚动行为。
4. 对交互元素用 Tab 移动焦点，再尝试 Enter、Space 或组件说明中的方向键操作。

主题与视口选择不会自动证明全部组合都通过测试。记录你实际检查的组合，完整标准见[检查与修正页面](/zh/docs/review-checklist)。

## 设计规范

规范值和视觉展示以对应 Storybook 页面为入口：

| 想确认什么 | 打开哪里 |
| --- | --- |
| 颜色、状态与表面 | [色彩](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-color--overview) |
| 字体、数字与文字层级 | [排版](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-typography--overview) |
| 间距与页面结构 | [布局](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-layout--overview) |
| 圆角 | [圆角规范](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-rounded--overview) |
| 响应式检查范围 | [响应式](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-responsive--overview) |

文档站不再复制整份 Token 表。无障碍、动效和双语仍是页面验收要求，不能仅凭某个视觉规范页判断合格。

## 带回任务的参考

给同事或 AI 的记录应包含：组件具体链接、选用的形态、语言和视口、预期交互，以及尚不满足的需求。例如：

```text
参考：Button / Playground
链接：https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--playground
用途：提交页面中的筛选条件，不进行真实支付。
形态：primary，文字按钮；请求期间显示 loading。
验收：键盘可操作，加载时不能重复提交，中英文都不截断。
尚需页面实现：点击后的本地演示反馈与错误状态。
```

## 常见问题与下一步

找不到组件时，先用英文组件名或所属页面查找。线上示例与自己的 Fork 不一致时，核对代码基线和部署版本，不要直接覆盖本地实现。入口打不开时，请维护者确认地址和访问权限。

准备搭页时，先完成[准备工作环境](/zh/docs/prepare-environment)，再[选择页面示例](/zh/docs/choose-starting-point)。现有组件仍无法满足真实需求时，使用[能力缺口反馈](/zh/docs/component-gaps)。
