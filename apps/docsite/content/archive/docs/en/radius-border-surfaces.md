---
slug: radius-border-surfaces
title: Radius, Border & Surfaces
description: "Create hierarchy with approved radii, border strengths, and semantic surfaces instead of shadows and decorative outlines."
group: foundations
order: 130
keywords: ["radius", "border", "surface", "Card", "hierarchy"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/tokens/semantic/radius.tokens.json
  - packages/design-system/tokens/semantic/colors.tokens.json
  - packages/design-system/components/Card/usage.md
---

YAMI uses a small set of radii and neutral surfaces to establish a stable product language. Components do not create polish through isolated radii, hover shadows, or stacked outlines.

## Approved radii

Use only three semantics: small, medium, and fully round. Implement them with existing radius tokens.

- Small radius is for controls and compact containers.
- Medium radius is for Cards, Sheet sections, and primary surfaces.
- Fully round is reserved for avatars, circular icon buttons, or explicit pill controls.

The same component does not change its radius between pages.

## Border strength

`var(--border-default)` provides light structural separation. Focus and attention states use their matching semantic tokens rather than an arbitrary darker color.

Borders do not replace spacing. When every section has a border, hierarchy collapses and all content appears equally important.

## Semantic surfaces

The page canvas, secondary content bands, and opposite-polarity areas use primary, secondary, and inverse surfaces. Keep nested surfaces to two or three clear levels. If more are required, reorganize the content structure.

```css
.panel {
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
}
```

## Card rules

Cards are borderless and shadowless by default. Background, spacing, and radius separate them from the page. Interactive Cards change semantic background on hover and press; they do not lift or scale.

Use an approved weak border only when a Card genuinely disappears against a same-color surface. Resolve that decision in the component rather than overriding it on each page.
