---
slug: choose-starting-point
title: 选择页面示例
description: "先找最接近的维护示例，再决定替换内容、调整组合，还是提出新的组件需求。"
group: ai
order: 45
keywords: ["页面示例","复用","原型","专题页"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/prototypes/pages/EcommerceHome/EcommerceHome.stories.tsx
  - packages/prototypes/pages/SearchResultsPage/SearchResultsPage.stories.tsx
  - packages/prototypes/pages/TopicLandingPage/TopicLandingPage.stories.tsx
  - packages/design-system/SKILL.md
---

适合已经有页面目标、准备交给 AI 实现的同事。输入可以是一份需求、一张截图或一个参考页面；先写清用户要完成什么，不要只说“做得像这张图”。

## 找最接近的页面

| 任务 | 参考入口 | 重点观察 |
| --- | --- | --- |
| 电商首页和内容发现 | [Ecommerce Home](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-ecommerce-home--pc) | 商品模块、导航和内容顺序 |
| 搜索与筛选 | [Search Results](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-search-results--results) | 筛选、空结果和结果列表 |
| 商品详情 | [Product Detail](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-product-detail-beauty--pdp) | 商品信息、规格和详情交互 |
| 品牌活动与内容专题 | [Topic Landing Page](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-topic-landing-page-brand--pc) | 主视觉、分类和商品集合 |

这些是维护中的页面组合，不是可以直接发布的业务项目。图片、链接、价格和交互反馈需要按任务核对。线上 Storybook 与本地版本也可能不同，制作前记录采用的代码基线。

## 判断改动层级

| 需求变化 | 优先做法 | 避免 |
| --- | --- | --- |
| 只改商品、图片、文案 | 新建任务数据或 Story，复用原页面 | 覆盖默认 fixture，让其他示例也变化 |
| 调整模块顺序、增减模块 | 在独立页面组合中使用公开组件 | 把整页实现复制成多个长期分叉 |
| 现有组件少一个通用状态 | 先反馈缺口，确认是否增加变体 | 为单个活动修改所有页面的默认样式 |
| 用户目标和信息结构完全不同 | 定义新页面任务，复用可用模块 | 强行塞进不合适的页面类型 |

fixture 是保存示例内容的数据文件，Story 是运行某个组合的展示入口。使用公开组件，并不代表要把整个参考页面的源码复制一份。

## 明确内容归属

页面的商品、业务链接、文案与状态由自己的项目负责。公共组件负责约定的交互、样式、主题和可访问性。

例如，页面可以向 ProductCard 传入商品信息和点击处理；不能为了某次活动复制一套 ProductCard，或直接改公共 Token 改变其他页面。

团队协作中，先把项目内容留在自己的 Fork。一个能力在多个任务中都能复用、并补齐用法与验证后，再按[贡献公共能力到上游](/zh/docs/contribute-upstream)提出独立 PR。

## 写好页面简报

开始前用下面的提纲约束任务：

```text
目标用户与任务：
页面参考：具体 Storybook 链接或截图
需要保留的结构：
需要改变的内容：
必须实现的交互：
语言与屏幕范围：
素材来源、使用权限和数据版本：
不在本次范围内的内容：
验收人与完成标准：
```

给不确定项写“待确认”，不要让 AI 生成虚构价格、商品功效、授权信息或无法兑现的按钮行为。

## 检查起点是否合适

打开参考示例，在目标屏幕上走一遍主要路径。能否用现有结构表达需求？需要变化的是数据、组合还是组件本身？是否有某个关键交互根本不存在？

拿不准时，先让 AI 列出“可以直接复用 / 需要页面实现 / 需要维护者确认”三类，再决定下一步。不要以生成更多文件替代这个判断。

## 下一步

准备好简报后进入[创建第一个页面](/zh/docs/first-page)。环境尚未准备好则先看[准备工作环境](/zh/docs/prepare-environment)。组件存在真实缺口时，先[反馈组件能力缺口](/zh/docs/component-gaps)。
