---
slug: browse-components
title: 查看组件与页面
description: "在 Storybook 中找到、读懂并检查真实组件和页面，再分享准确参考。"
group: start
order: 30
keywords: ["Storybook","组件","Controls","规范","主题"]
updatedAt: "2026-09-02"
sourceRefs:
  - apps/storybook/.storybook/preview.tsx
  - apps/storybook/.storybook/component-docs.tsx
  - packages/design-system/color-primitives.stories.tsx
  - packages/design-system/logos.stories.tsx
  - packages/design-system/components/Button/Button.stories.tsx
  - packages/design-system/color.stories.tsx
  - packages/design-system/responsive.stories.tsx
  - packages/prototypes/pages/EcommerceHome/EcommerceHome.stories.tsx
---

## 找到组件或页面

1. 直接[打开 YAMI Storybook](https://yami-design-system-storybook.vercel.app/)。
2. 要查看完整用户流程或搭建新页面时，先进入 [Pages](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-ecommerce-home--pc)；只确认局部能力时，进入 [Components](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--showcase)。
3. 在左侧搜索框输入英文名称或业务场景，例如 Product Detail、Button、ProductCard 或 Search。
4. 展开目标并选择一个具体 Story。名称不确定时，先从相近的 Page 反查它使用的组件。
5. 保留地址栏中的具体 Story 链接，不要只记录 Storybook 首页。

## 看懂 Story 与 Docs

| 入口 | 用它查看什么 |
| --- | --- |
| Story | 可以直接操作的真实状态或页面场景 |
| Docs | 说明、主示例、Controls、Usage 与其他 Stories |
| Controls | 临时改变当前示例的公开参数 |
| Showcase | 集中比较常用形态、变体或状态 |
| Usage | 理解何时使用、何时避免以及常见边界 |

不是每个页面或组件都有完全相同的 Docs、Usage 和 Stories。某一栏不存在时，结合现有说明和可运行示例判断。

## 如何读懂一个组件

不要从代码属性开始。先确认组件解决的问题，再检查结构、内容、状态、响应式和使用边界。

| Dimension | 需要回答的问题 | 优先查看 |
| --- | --- | --- |
| Purpose | 它解决什么问题？什么时候使用或避免使用？ | 说明与 Usage |
| Anatomy & Content | 由哪些区域组成？文案、图片和图标有什么限制？ | 主 Story 与 Usage |
| Variants & States | 有哪些尺寸、层级、默认状态和交互状态？ | Controls 与 Stories |
| Responsive | 移动端与桌面端是否改变结构、尺寸或交互？ | Viewport 与相关 Stories |
| Locale & Theme | 中英文、浅色和深色是否完整可用？ | Toolbar 与实际预览 |
| Accessibility | 键盘、焦点、标签是否正确？有哪些常见误用？ | Usage 与实际交互 |

不要用外观相似的组件替代不同的用户任务或交互语义。例如，链接和按钮可能外观相似，但承担的语义和键盘行为不同。

以 Button 为例，可以在 [Playground](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--playground) 的 Controls 中一次改变一个参数，再查看 [Loading](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--loading) 和 [Disabled](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--disabled) 比较状态。

## 如何查看一个页面

1. **先确认用户任务：** 这个页面帮助用户完成什么？不要先从组件数量开始。
2. **阅读信息结构：** 记录 Header、Hero、导航、内容区、列表和 Footer 的顺序与职责。
3. **识别页面模块：** 区分可直接复用的组件、页面内组合和还不满足的能力。
4. **检查内容与状态：** 确认文案、图片、数据、Loading、空、错误和交互反馈。
5. **比较多端表现：** 切换移动端和桌面端，观察模块顺序、换行、裁切、滚动和操作变化。

Page Story 是维护中的页面示例，不等于可直接发布的业务项目。商品、价格、链接、素材权限和真实业务结果都需要在页面任务中另行确认。

## 调整环境并验证

1. 切换中文和英文，比较标题、按钮、长文本与数字。
2. 切换浅色和深色，检查文字、背景、边框及状态是否仍然可辨。
3. 查看窄屏和桌面尺寸，确认内容顺序、换行、裁切与滚动行为。
4. 对交互元素用 Tab 移动焦点，再尝试 Enter、Space 或说明中的方向键。
5. 走一遍主要任务，确认页面不只是显示出来，关键操作也能完成。

工具栏选中某个语言、主题或视口，不会自动证明全部组合都已通过。只记录实际检查过的组合，完整标准见[检查页面](/zh/docs/review-checklist)。

## 设计规范

检查组件和页面时，同时对照对应的 Foundations 示例：

| 想确认什么 | 打开哪里 |
| --- | --- |
| 颜色、状态与表面 | [色彩](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-color--overview) |
| 字体、数字与文字层级 | [排版](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-typography--overview) |
| 间距与页面结构 | [布局](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-layout--overview) |
| 圆角 | [圆角规范](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-rounded--overview) |
| 响应式检查范围 | [响应式](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-responsive--overview) |

视觉规范不代替无障碍、动效、内容和真实交互检查。

## 记录并分享参考

给同事或 AI 的记录应包含参考类型、具体 Story、链接、用途、实际检查过的环境，以及尚不满足的需求：

```text
参考类型：Page / Component
Story：<具体 Story 名称>
链接：<具体 Story 地址>
用途：<这次任务怎样使用它>
选用状态或调整范围：<需要保留和修改什么>
已检查：<语言、主题、屏幕尺寸和交互>
尚未满足：<仍需在页面任务中实现的内容>
```

## 常见问题与下一步

找不到页面或组件时，先用英文名称或所属业务场景查找。线上示例与自己的 Fork 不一致时，核对代码基线和部署版本，不要直接覆盖本地实现。入口打不开时，请维护者确认地址和访问权限。

只提供设计参考时，分享具体 Story 链接和实际检查结果。准备开始制作时，进入[开始创建](/zh/docs/prepare-environment)；现有组件仍无法满足真实需求时，使用[能力缺口反馈](/zh/docs/create-components#report-a-component-issue)。
