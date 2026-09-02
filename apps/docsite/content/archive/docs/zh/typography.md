---
slug: typography
title: 字体与排版
description: "用 GT Walsheim、中文回退栈和四级层次建立清楚、稳定的阅读体验。"
group: foundations
order: 110
keywords: ["字体", "排版", "GT Walsheim", "数字", "层级"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/styles/fonts.css
  - packages/design-system/content/casing-numerals.md
---

YAMI 排版必须同时处理拉丁文字、中文和数字。所有文字通过批准的字体栈与语义字号 Token 输出，不得注册额外装饰字体。

## 字体职责

- GT Walsheim 负责拉丁字符和所有数字。
- 中文正文在 Web 使用 PingFang SC，并以 Noto Sans SC 等系统字体回退。
- 已批准的衬线标题必须使用 `var(--font-family-serif)`，不能替换为其他衬线字体。

应用必须在根元素声明正确语言，使 `var(--font-weight-emphasize)` 可以按语言解析：英文为 500，中文为 600。

## 四级层次

每个页面最多使用四个视觉字号层级：

1. 页面标题或展示标题。
2. 区块标题。
3. 正文。
4. 元数据或说明文字。

常用映射：

| 角色 | 字号 Token | 行高 Token |
| --- | --- | --- |
| 页面标题 | `var(--font-size-heading-4xl)` | `var(--line-height-heading-4xl)` |
| 区块标题 | `var(--font-size-heading-xl)` | `var(--line-height-heading-xl)` |
| 正文 | `var(--font-size-body-xl)` | `var(--line-height-body-xl)` |
| 元数据 | `var(--font-size-caption-sm)` | `var(--line-height-caption-sm)` |

组件可以根据自身契约使用其他现有角色，但一个页面不得通过连续新增字号表达每个细微层级。

## 数字与混排

数字、价格、日期、计数和 SKU 必须优先使用 GT Walsheim。中文字符串中的数字也不能切换到中文字体。

```css
.content {
  font-family: var(--font-family-ios);
}
```

中文使用全角标点，英文使用半角标点。技术名词没有稳定中文译名时可以保留英文，但不能把普通界面文案写成中英混杂句。

## 字重

普通正文使用 `var(--font-weight-normal)`，普通强调使用 `var(--font-weight-emphasize)`。不得用 700 代替普通强调；批准的衬线标题可以使用 `var(--font-weight-semibold)`。

长篇文档必须保持正文宽度和行长稳定，并使用标题、段落、列表和表格建立信息结构，而不是依靠更多字号。
