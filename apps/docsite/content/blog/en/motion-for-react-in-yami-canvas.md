---
slug: motion-for-react-in-yami-canvas
title: "Controllable motion: from Motion references to prototype implementation"
description: "Use Motion as a library of animation patterns, then choose native CSS or Motion for React according to prototype complexity to build interactions that are controllable, reducible, and verifiable."
date: "2026-09-01"
category: engineering
authors: ["YAMI Design System Team"]
tags: ["Motion", "Prototyping", "Accessibility", "Workflow"]
relatedDocs: ["browse-components", "create-components", "review-checklist"]
cover:
  src: "/images/blog/motion-for-react.webp"
coverAlt: "Motion reference and prototype implementation article cover"
---

A static page explains layout but cannot fully explain state changes. Where an overlay enters, whether content changes feel continuous, and how completion is acknowledged all affect whether a prototype resembles a real product. Without a shared reference, animation easily becomes decoration added by instinct.

YAMI treats the [Motion example library](https://motion.dev/examples) as a reference for animation patterns and implementation methods. The team studies the intent, state relationships, and implementation in comparable examples, then chooses native CSS, browser APIs, or Motion for React. An example is not a specification to copy, and Motion is not the default dependency for every effect.

The repository currently has one direct dedicated animation dependency, `motion@13.1.0`, imported from `motion/react` in Canvas. Design-system components and prototype pages still prefer native capabilities. Motion becomes an option when a new requirement clearly exceeds what CSS can express.

## Why an animation reference library helps

A reference library shifts the conversation from “make an attractive animation” to “choose a pattern that explains change.” Enter, exit, layout, gesture, and scroll examples provide comparable starting points.

- Find a pattern close to the current interaction instead of designing from zero.
- Observe how states connect rather than reviewing only a final screenshot.
- Compare timing, easing, distance, and interruption behavior.
- Read the implementation and decide whether native CSS is already sufficient.
- See responsive, performance, and accessibility costs early.

Motion belongs in a page only when it helps explain an action result, navigation direction, or content hierarchy.

## What Motion can provide as a reference

The [Motion for React documentation](https://motion.dev/docs/react) covers enter and exit transitions, layout animation, hover and press gestures, scroll, dragging, springs, and Motion Values. The examples include patterns for buttons, overlays, lists, navigation, loading, and page transitions.

Search by problem: use Dialog or Overlay references for overlay hierarchy, Layout Animation for reordered content, and Page Transition for changed page context. Do not add a visually striking example to a page that does not share its purpose.

`initial`, `animate`, `exit`, and `transition` describe state changes, `AnimatePresence` coordinates exit phases, and `useReducedMotion` follows user preferences. These concepts clarify a specification even when the final implementation uses CSS.

## How to read a Motion example

Do not record only “fade in” or “bounce.” Break a reference into reviewable information:

| Dimension | Question to answer |
| --- | --- |
| Purpose | Does it explain state, direction, hierarchy, or an action result? |
| Trigger | Is it caused by click, scroll, hover, mount, or data change? |
| Properties | Does it change opacity, position, scale, rotation, or layout? |
| Rhythm | Is it frequent feedback or an occasional page change? |
| Interruption | Does another action continue, reverse, or reset it? |
| Final state | Is content complete and operable when animation is disabled? |
| Accessibility | What should reduced-motion mode remove and retain? |

The reference supplies intent and motion relationships. Color, distance, timing, and code must be adapted to the current page.

## From a reference to a YAMI prototype

1. Identify the state change the prototype needs to explain.
2. Find one to three comparable Motion examples.
3. Record triggers, properties, timing, final state, and interruption behavior.
4. Remove decorative movement unrelated to the task.
5. Decide whether native CSS expresses the effect completely.
6. Reimplement with YAMI tokens, distances, and timing.
7. Design the reduced-motion path at the same time.
8. Test the interaction in Storybook or Canvas.
9. Save a reproducible Story, route, and review conclusion.

This separates inspiration from dependency adoption. A team can reference Motion's state model and implement it with CSS.

## When to use native implementation

Frequent, local, and fixed state changes default to native CSS or browser APIs:

- Color and short movement for hover, focus, and press.
- Spinners and skeleton shimmer.
- A slight ProductCard image zoom within fixed geometry.
- Smooth scrolling for horizontal rails and anchors.
- Elements that remain mounted and switch among a few fixed styles.

Common tools include CSS `transition`, `@keyframes`, smooth scrolling, `requestAnimationFrame`, and `IntersectionObserver`. If `transition: opacity 150ms` completely describes the effect, keep it in CSS rather than adding Motion to match a reference's technology.

## When to use Motion for React

Consider Motion when an effect depends on React state and lifecycle and native implementation begins accumulating temporary classes, timers, or cleanup logic:

- Mount, enter, and exit need coordination.
- Multiple elements must respond to one state in sync.
- A transition must be interrupted, reversed, or redirected.
- Gestures, dragging, or layout changes are tied to React state.
- A page or application shell must explain a context change.

YAMI Canvas currently uses `motion` and `useReducedMotion` for control-panel entry and preview changes. This is the existing direct use, not a permanent restriction. New prototypes may use Motion after the boundary is clear, the need is justified, and verification is complete.

## Translating a reference into YAMI rules

- Use 100–150ms for frequent feedback in buttons, cards, and menus.
- Keep overlay and dropdown entry or exit near 150ms.
- Use about 200–300ms for page or major-content transitions.
- Limit directional movement to 4–8px.
- Prefer opacity and transforms; avoid animating dimensions, font size, and grid structure.
- Do not scale an entire component or add decorative shadows on hover and press.
- Never let animation block clicks, input, scrolling, or keyboard focus.

These ranges promote consistency without forcing every effect into the same movement.

## Reduced motion must be designed at the same time

The [Motion accessibility guide](https://motion.dev/docs/react-accessibility) recommends respecting reduced-motion settings. Every reference needs a parallel decision about what movement can be removed and what information must remain.

| Normal mode | Reduced-motion mode |
| --- | --- |
| Move and fade in | Show immediately, or retain only a brief fade |
| Spring scale | Confirm state with color or opacity |
| Automatic scroll or playback | Stop and give control to the user |
| Decorative looping animation | Stop |
| Necessary loading feedback | Preserve state while reducing movement |

Use `prefers-reduced-motion` in CSS and [`useReducedMotion`](https://motion.dev/docs/react-use-reduced-motion) in Motion. Reduced motion is a second implementation path defined alongside normal mode.

## How one reference enters a prototype

Suppose a content panel needs to appear. The team reviews a comparable panel or overlay and concludes that the purpose is to explain hierarchy and entry direction. After reduction, only opacity and an 8px offset remain.

If the panel stays mounted and has one state change, use CSS. If it must mount, retain an exit phase, and reverse during rapid interaction, use Motion:

```tsx
import { motion, useReducedMotion } from "motion/react";

export function PreviewPanel() {
  const reduced = useReducedMotion();
  return (
    <motion.aside
      initial={{ opacity: 0, x: reduced ? 0 : -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reduced ? 0 : 0.18 }}
    />
  );
}
```

Normal mode retains direction; reduced-motion mode removes movement and enters the final state immediately.

## How to verify prototype motion

1. Confirm movement helps explain state, direction, or hierarchy.
2. Test normal and reduced-motion modes.
3. Repeat actions quickly and check interruption and settling.
4. Confirm final content, layout, and focus are equivalent.
5. Ensure animation never blocks clicks, input, or scrolling.
6. Observe mobile, desktop, and lower-powered devices.
7. Save component states in Storybook and verify page context in Canvas.
8. Record timing, properties, triggers, tested scope, and limitations.

Automation can verify state branches, but whether an effect improves understanding still needs real interaction and visual review.

## Common mistakes

- Copying official code without stating what the animation explains.
- Adding Motion for a simple hover or color change.
- Mimicking appearance without handling mount, exit, and interruption.
- Using unrelated timing and easing across neighboring components.
- Applying springs, scale, or parallax to every page.
- Setting duration to zero while leaving a flash of the initial state.
- Letting animation determine height, focus, or necessary information.
- Treating a reference as a specification without adapting content, devices, and brand boundaries.

## Let references serve the real experience

Motion is a reference library and optional implementation tool for YAMI. The team uses official examples to understand animation patterns, then chooses native CSS, browser APIs, or Motion for React according to prototype needs, implementing the effect in the lightest, clearest, and most verifiable way.

The goal is not to make prototypes move more. It is to make state changes easier to understand, implementations reproducible, and the experience equally complete for people who prefer less motion.
