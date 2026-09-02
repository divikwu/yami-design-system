---
slug: motion
title: Motion
description: "Use motion to explain state changes and respect user preferences, never to replace clear information structure."
group: foundations
order: 160
keywords: ["motion", "transition", "reduced motion", "hover", "state"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/DESIGN.md
  - packages/design-system/components/Sheet/Sheet.module.css
  - packages/design-system/components/Button/Button.module.css
---

YAMI motion communicates feedback and direction. Tasks, states, and hierarchy must remain understandable when all animation is disabled.

## Approved uses

- Short hover, pressed, and focus transitions on controls.
- Entry and exit for surfaces such as Sheet and Dialog.
- Expansion, collapse, or scroll positioning that explains spatial relationships.
- Loading states that clearly say the system is processing.

Do not use motion for decorative loops, automatic carousels, or persistent attention capture.

## Feedback without lift

Cards and buttons use semantic background changes on hover. Do not create lift with hover shadows, scaling, or large movement.

A pressed state may use an approved small displacement when it is part of the component contract. Pages do not reimplement it.

## Duration and rhythm

The generated token set does not currently publish duration or easing variables. Applications do not invent a separate motion scale; reuse transitions already verified in shared components. When a page-level need is real, define it in the token source and guidance before it enters application code.

The same interaction keeps the same rhythm across pages. A transition should be long enough to understand and short enough not to block repeated actions. Do not leave a new arbitrary millisecond value in page CSS.

## Reduced motion

Every nonessential animation responds to `prefers-reduced-motion: reduce`. Anchor navigation becomes immediate, and entry animation is shortened or removed. State and focus remain visible.

```css
@media (prefers-reduced-motion: reduce) {
  .content {
    scroll-behavior: auto;
  }
}
```

Testing does more than confirm that animation stopped. Ensure cancellation does not hide content, move focus, or remove completion feedback.
