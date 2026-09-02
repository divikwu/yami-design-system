---
slug: typography
title: Typography
description: "Use GT Walsheim, a Chinese fallback stack, and four visual levels for a clear and stable reading experience."
group: foundations
order: 110
keywords: ["font", "typography", "GT Walsheim", "numerals", "hierarchy"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/styles/fonts.css
  - packages/design-system/content/casing-numerals.md
---

YAMI typography must account for Latin text, Chinese, and numerals. All text uses approved font stacks and semantic type tokens. Do not register extra decorative fonts.

## Font responsibilities

- GT Walsheim renders Latin characters and all numerals.
- Chinese body copy uses PingFang SC on the web, with Noto Sans SC and system fallbacks.
- Approved serif headings use `var(--font-family-serif)` and cannot be replaced with another serif.

Applications declare the correct language on the root element so `var(--font-weight-emphasize)` resolves by language: 500 for English and 600 for Chinese.

## Four visual levels

Each page uses at most four visual type-size levels:

1. Page or display title.
2. Section heading.
3. Body copy.
4. Metadata or supporting text.

A common mapping is:

| Role | Size token | Line-height token |
| --- | --- | --- |
| Page title | `var(--font-size-heading-4xl)` | `var(--line-height-heading-4xl)` |
| Section heading | `var(--font-size-heading-xl)` | `var(--line-height-heading-xl)` |
| Body | `var(--font-size-body-xl)` | `var(--line-height-body-xl)` |
| Metadata | `var(--font-size-caption-sm)` | `var(--line-height-caption-sm)` |

Components can use other existing roles defined by their contract, but a page should not introduce a new size for every minor distinction.

## Numerals and mixed scripts

Numbers, prices, dates, counts, and SKUs use GT Walsheim, including numerals inside Chinese text.

```css
.content {
  font-family: var(--font-family-ios);
}
```

Chinese uses full-width punctuation; English uses half-width punctuation. Technical terms without an established translation can remain in English, but ordinary interface copy should not mix languages without reason.

## Weight

Body copy uses `var(--font-weight-normal)`, and ordinary emphasis uses `var(--font-weight-emphasize)`. Do not substitute 700 for normal emphasis. Approved serif headings may use `var(--font-weight-semibold)`.

Long-form documentation keeps a stable line length and uses headings, paragraphs, lists, and tables for structure instead of adding more font sizes.
