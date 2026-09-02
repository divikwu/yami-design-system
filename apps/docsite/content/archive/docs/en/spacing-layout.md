---
slug: spacing-layout
title: Spacing & Layout
description: "Organize information with one spacing scale, deliberate content widths, and responsive rules instead of page-specific dimensions."
group: foundations
order: 120
keywords: ["spacing", "layout", "responsive", "tap target", "breakpoint"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/tokens/primitives/spacing.tokens.json
  - packages/design-system/tokens/primitives/layout.tokens.json
  - packages/design-system/tokens/primitives/breakpoints.tokens.json
---

Spacing communicates relationships before it creates empty space. Closely related content sits closer together; sections with different responsibilities receive more separation. Pages consume generated spacing and layout tokens only.

## Spacing scale

Use the `var(--space-*)` scale from icon insets through section spacing. Choose a value based on the relationship it represents, not by adding an arbitrary pixel value that looks close.

```css
.section {
  display: grid;
  gap: var(--space-300);
  padding-block: var(--space-600);
}
```

Lists, cards, or form fields at the same level share one gap. A local exception needs a component-state reason rather than a one-off screenshot alignment.

## Page containers

Containers control line length and safe space. Long-form copy uses a narrower measure, while card grids and commerce areas can use a wider container. Width is a layout responsibility; do not shrink type to fit more content.

Page layouts can declare a small number of explicit constants, such as documentation column widths and a responsive breakpoint. Visual properties—color, spacing, border, and radius—still come from tokens.

## Responsive strategy

Begin with a single-column reading order and progressively enhance it into multiple columns. At every breakpoint:

- Content order and semantics remain stable.
- The primary action stays discoverable.
- Information does not require hover.
- Horizontal scrolling is limited to explicitly supported rails or tables.

Below 1024px, Docsite moves the documentation navigation into a Sheet. This is an information-architecture change, not a smaller desktop layout.

## Tap and focus areas

Interactive targets are at least 44px. A visible icon may be smaller, but its button or link container cannot be. Leave enough separation between adjacent targets to prevent touch errors.

Keyboard focus uses the shared 2px black outline with a 2px offset. Focus space is part of layout and cannot be clipped by `overflow: hidden`.
