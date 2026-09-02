---
slug: browse-components
title: Find and try components
description: "Check component usage, states, and fit in Storybook, then bring a reliable reference into your page task."
group: start
order: 20
keywords: ["Storybook","Components","Controls","Standards","Themes"]
updatedAt: "2026-08-31"
sourceRefs:
  - apps/storybook/.storybook/preview.tsx
  - apps/storybook/.storybook/component-docs.tsx
  - packages/design-system/components/Button/Button.stories.tsx
  - packages/design-system/color.stories.tsx
  - packages/design-system/responsive.stories.tsx
---

For teammates finding a component, checking behavior, or providing a design reference. Start with a specific question, such as “Which button should submit this form?” Browsing does not require a development environment.

## Find a component

1. Open the [Button example](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--showcase).
2. Search the left sidebar for Button, ProductCard, or Sheet. If you do not know the name, start from a related page example.
3. Expand its directory and inspect Docs, Showcase, and individual state examples. Story names vary by component.
4. Record the specific address-bar URL instead of sharing only the Storybook homepage.

A Story is a runnable example. Showcase usually presents common configurations; Docs collects parameters and usage guidance. Components do not all support the same options: follow their actual public API and documentation.

## Try parameters and understand limits

In the [Button Playground](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--playground), use Controls to try size, hierarchy, and disabled state. Change one parameter at a time and observe the result.

Then inspect [Loading](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--loading) and [Disabled](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--disabled) to compare pending, unavailable, and ordinary states.

- Controls are for trying parameters, not editing business data.
- A parameter change does not modify source code; refreshing or resetting may restore defaults.
- A demonstrated click response is not a real order, payment, or save.
- Business outcomes absent from the example must be specified and implemented in the page task.

## Themes and viewports

Use the language, theme, and viewport toolbar options to inspect the same example:

1. Switch between Chinese and English; compare headings, buttons, long text, and numbers.
2. Switch light and dark themes; check text, surfaces, borders, and states.
3. Inspect narrow and desktop widths; check reading order, wrapping, and scrolling.
4. Tab through interactive elements, then try Enter, Space, or the arrow-key behavior documented for the component.

Theme and viewport controls do not prove all combinations have passed tests. Record the combinations you actually checked. The full criteria live in [Check and fix a page](/en/docs/review-checklist).

## Design standards

Use the corresponding Storybook page for specification values and visual examples:

| What to check | Where to go |
| --- | --- |
| Colors, states, and surfaces | [Color](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-color--overview) |
| Fonts, numerals, and text hierarchy | [Typography](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-typography--overview) |
| Spacing and page structure | [Layout](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-layout--overview) |
| Corner radii | [Rounded](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-rounded--overview) |
| Responsive verification ranges | [Responsive](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-responsive--overview) |

Docsite does not duplicate full token tables. Accessibility, motion, and bilingual behavior remain page acceptance requirements; a visual standards example alone does not prove conformance.

## Bring a reference into your task

Give your teammate or AI the specific component URL, chosen configuration, language and viewport, expected behavior, and any unmet requirement. For example:

```text
Reference: Button / Playground
URL: https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--playground
Purpose: Submit page filters; no real payment.
Configuration: primary text button; loading while a request is pending.
Acceptance: Keyboard operable, no duplicate submission while loading,
and no truncated labels in Chinese or English.
Still needed in the page: Local demo feedback and an error state.
```

## Troubleshooting and next step

If you cannot find a component, search its English name or a related page. If the hosted example differs from your Fork, check the source baseline and deployment version before replacing code. Ask a maintainer to verify the address and access policy if the entry point is unavailable.

When you are ready to build, [prepare your environment](/en/docs/prepare-environment), then [choose a page example](/en/docs/choose-starting-point). If the existing component cannot meet a real requirement, [report a component gap](/en/docs/component-gaps).
