---
slug: browse-components
title: Explore components and pages
description: "Find, understand, and check real components and pages in Storybook, then share an exact reference."
group: start
order: 30
keywords: ["Storybook","Components","Controls","Standards","Themes"]
updatedAt: "2026-09-02"
sourceRefs:
  - apps/storybook/.storybook/preview.tsx
  - apps/storybook/.storybook/component-docs.tsx
  - packages/design-system/color-primitives.stories.tsx
  - packages/design-system/logos.stories.tsx
  - packages/design-system/components/Button/Button.stories.tsx
  - packages/design-system/color.stories.tsx
  - packages/design-system/responsive.stories.tsx
  - packages/prototypes/pages/EcommerceHome/EcommerceHome.stories.tsx
---

## Find a component or page

1. [Open YAMI Storybook](https://yami-design-system-storybook.vercel.app/) directly.
2. To inspect a complete user flow or build a new page, start in [Pages](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-ecommerce-home--pc). To inspect a local capability, start in [Components](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--showcase).
3. Search the sidebar by English name or business context, such as Product Detail, Button, ProductCard, or Search.
4. Expand the target and select a specific Story. If you do not know a component name, begin with a related Page and work backward from its composition.
5. Keep the exact Story URL from the address bar instead of recording only the Storybook homepage.

## Understand Story and Docs

| Entry | What to inspect |
| --- | --- |
| Story | A real state or page scenario you can operate directly |
| Docs | Guidance, the primary example, Controls, Usage, and other Stories |
| Controls | Public parameters you can change temporarily for the current example |
| Showcase | Common forms, variants, or states presented together |
| Usage | When to use or avoid the capability and its common boundaries |

Not every page or component provides the same Docs, Usage, and Stories. When a section is absent, combine the available guidance with the runnable examples.

## How to understand a component

Do not begin with code properties. First confirm the problem the component solves, then inspect its structure, content, states, responsive behavior, and usage boundaries.

| Dimension | Question to answer | Check first |
| --- | --- | --- |
| Purpose | What problem does it solve? When should you use or avoid it? | Description and Usage |
| Structure and content | Which regions make it up? What limits apply to copy, images, and icons? | Primary Story and Usage |
| Variants and states | Which sizes, hierarchies, default states, and interactive states exist? | Controls and Stories |
| Responsive behavior | Does mobile or desktop change its structure, size, or interaction? | Viewport and relevant Stories |
| Locale and theme | Are Chinese, English, Light, and Dark complete and usable? | Toolbar and rendered preview |
| Accessibility and boundaries | Do keyboard, focus, and labels work? What are the common misuses? | Usage and direct interaction |

Do not substitute a visually similar component when it serves a different user task or interaction meaning. A link and a button may look similar while carrying different semantics and keyboard behavior.

For Button, change one parameter at a time in [Playground](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--playground), then compare [Loading](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--loading) and [Disabled](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--disabled).

## How to inspect a page

1. **Confirm the user task:** What does the page help the user accomplish? Do not begin with the number of components.
2. **Read the information structure:** Record the order and responsibility of the Header, Hero, navigation, content areas, lists, and Footer.
3. **Identify page modules:** Separate reusable components, page-owned compositions, and capabilities that are still missing.
4. **Check content and states:** Confirm copy, images, data, Loading, empty, error, and interaction feedback.
5. **Compare viewport behavior:** Switch between mobile and desktop and observe changes to module order, wrapping, cropping, scrolling, and controls.

A Page Story is a maintained page example, not a business project ready to publish. Products, prices, links, asset permissions, and real business outcomes must be confirmed separately in the page task.

## Adjust the environment and verify

1. Switch between Chinese and English. Compare headings, buttons, long copy, and numbers.
2. Switch between light and dark. Check whether text, backgrounds, borders, and states remain distinct.
3. Compare narrow and desktop widths. Confirm content order, wrapping, cropping, and scrolling behavior.
4. Move focus with Tab, then try Enter, Space, or documented arrow-key behavior.
5. Complete the primary task so the page proves more than visible rendering.

Selecting a locale, theme, or viewport does not prove that every combination passed. Record only the combinations you actually checked. See [Check the page](/en/docs/review-checklist) for the full standard.

## Design standards

Check components and pages against the corresponding Foundations examples:

| What to check | Where to go |
| --- | --- |
| Colors, states, and surfaces | [Color](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-color--overview) |
| Fonts, numerals, and text hierarchy | [Typography](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-typography--overview) |
| Spacing and page structure | [Layout](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-layout--overview) |
| Corner radii | [Rounded](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-rounded--overview) |
| Responsive verification ranges | [Responsive](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-responsive--overview) |

Visual standards do not replace accessibility, motion, content, and real-interaction checks.

## Record and share the reference

Give your teammate or AI the reference type, specific Story, URL, intended use, environments you checked, and any unmet requirement:

```text
Reference type: Page / Component
Story: <specific Story name>
URL: <specific Story URL>
Purpose: <how this task will use it>
Selected state or change scope: <what to preserve and change>
Checked: <locale, theme, viewport, and interaction>
Still needed: <what the page task must implement>
```

## Troubleshooting and next step

If you cannot find a page or component, search its English name or related business scenario. If the hosted example differs from your Fork, check the source baseline and deployment version before replacing code. Ask a maintainer to verify the address and access policy if the entry point is unavailable.

If you only need to provide a design reference, share the specific Story URL and the checks you performed. When you are ready to build, [start creating](/en/docs/prepare-environment). If the existing component cannot meet a real requirement, [report a component gap](/en/docs/component-gaps).
