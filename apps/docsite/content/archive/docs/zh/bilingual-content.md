---
slug: bilingual-content
title: 中英双语内容
description: "用对等信息、稳定标识和语言审校维护中文与英文体验。"
group: guides
order: 200
keywords: ["双语", "中文", "英文", "本地化", "slug"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/content/bilingual.md
  - packages/design-system/content/writing-standards.md
  - packages/design-system/content/voice.md
  - packages/design-system/content/casing-numerals.md
---

YAMI 的双语内容不是逐句替换，而是同一任务在两种语言中的对等表达。信息、操作和限制必须一致，句法与节奏可以按语言自然调整。

## 稳定标识

路由 slug、内容 ID、组件属性和分析事件使用稳定英文标识。显示标题与说明分别本地化。语言切换时保留当前资源和锚点，而不是返回首页。

文档和 Blog 的两种语言必须一一配对，并保持以下字段一致：

- slug 与内容类型。
- 分类、排序和发布日期。
- 相关文档与内部语义链接。
- 事实来源与约束。

## 中文写作

中文使用直接、完整、可执行的句子。避免翻译腔、连续名词堆叠和无意义英文夹杂。产品名、Token、API 与没有稳定译名的技术术语可以保留英文。

标点使用全角形式；数字仍由 GT Walsheim 渲染。

## 英文写作

英文优先短句、主动语态和 sentence case。按钮使用清楚动词，标题不使用全大写。不要为了与中文字符数接近而删掉必要限定。

## 内容配对流程

1. 先确认来源事实与用户任务。
2. 分别起草两种语言，不把机器直译当完成稿。
3. 对照检查数字、限制、链接和操作结果。
4. 由熟悉该语言与产品的人审校。
5. 在真实布局中检查换行、溢出与可访问名称。

语言对等检查属于内容 CI 的结构层；语言质量仍需要人工评审。
