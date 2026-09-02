---
slug: color
title: Color
description: "Use semantic colors for text, surfaces, actions, and states instead of consuming primitive scales directly."
group: foundations
order: 100
keywords: ["color", "semantic color", "brand red", "operational red", "dark mode"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/tokens/semantic/colors.tokens.json
  - packages/design-system/tokens/themes/dark.tokens.json
---

YAMI uses a neutral canvas. Red is reserved for brand identity or explicit operational meaning. Components and pages consume semantic aliases rather than primitive color scales.

## Core semantics

| Role | Token | Use |
| --- | --- | --- |
| Page background | `var(--background-primary)` | Main page canvas |
| Secondary background | `var(--background-secondary)` | Sections and content bands |
| Primary text | `var(--text-primary)` | Headings and body copy |
| Secondary text | `var(--text-secondary)` | Descriptions and metadata |
| Default border | `var(--border-default)` | Lightweight structural separation |
| Action emphasis | `var(--button-emphasis)` | The single emphasis CTA per screen |

Semantic tokens allow a theme to change without component code changes. Primitive `--color-*` variables define the semantic layer and are not an application interface.

## The two-red rule

`var(--brand-primary)` represents logo red. It is not used for buttons, ordinary text, badges, or decorative backgrounds.

Operational red enters through semantic tokens such as `var(--button-emphasis)`, `var(--text-emphasis)`, and `var(--border-attention)`. It only communicates actions, prices, promotions, urgency, or errors.

## State colors

Blue, green, purple, and yellow appear only in explicit states or the approved Badge palette. Layout, navigation, and content cards do not use these colors as decoration.

Color cannot be the only state signal. Pair it with text, an icon, or structure so people with color-vision differences can understand the result.

## Surfaces and hierarchy

Use `var(--surface-primary)` and `var(--surface-secondary)` to establish content layers. Cards do not rely on borders or shadows by default; prefer spacing, surface changes, and approved radius values.

Opposite-polarity content uses `var(--surface-inverse)` with matching inverse text, button, and focus tokens. Inverse means the opposite surface within the current theme, not dark mode.

## Dark theme

The `.dark` class overrides semantic aliases. Components do not add a separate dark prop, and applications do not duplicate a second set of color values.

Verify body-copy contrast, nested surfaces, focus rings, disabled states, operational red, and inverse areas in dark mode.
