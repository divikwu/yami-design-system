---
slug: brand-principles
title: Brand & Principles
description: "Build YAMI product interfaces with restrained, direct, and verifiable rules."
group: start
order: 30
keywords: ["brand", "principles", "red", "hierarchy"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.compact.md
  - packages/design-system/DESIGN.md
  - packages/design-system/content/voice.md
---

YAMI interfaces should feel like a clean, efficient Asian food commerce experience: dense enough to support shopping while remaining quiet and scannable. The brand earns recognition through clear hierarchy and stable rules, not decoration.

## Product first

A page answers what the user needs to complete before choosing a visual treatment. Every section needs a function: explain, compare, select, or act.

- Do not add copy that exists only to create atmosphere.
- Do not use decorative gradients, glass effects, textures, or hand-drawn illustrations.
- Do not create hierarchy with hover shadows or scale.
- Do not use emoji in product interfaces.

## Two reds

Brand red and operational red are separate:

- `var(--brand-primary)` is reserved for the official logo and brand marks.
- `var(--button-emphasis)` is for the single highest-priority action.
- `var(--text-emphasis)` is limited to prices, urgency, promotions, or errors.

Ordinary navigation selection, headings, and decoration do not use red.

## One action priority

Each screen can contain at most one emphasis button. A second action steps down to primary, secondary, or a normal link.

This is a decision limit, not a component count. When two actions appear equally strong, reorganize the task hierarchy.

## Neutral structure

YAMI relies on near-black text, white or dark canvases, and neutral surfaces. Cards are borderless and shadowless by default. Interaction feedback uses semantic background changes.

## Verify before claiming support

New values enter token sources before generated outputs. New components require metadata, documentation, Storybook, and Registry contracts before the Catalog can describe them as supported.

Design review covers the rendered result, keyboard path, screen-reader semantics, light and dark themes, and equivalent Chinese and English information.
