---
slug: getting-started
title: Storybook basics
description: "Understand what Storybook is, what it contains, and where its responsibilities end before exploring components and pages."
group: start
order: 20
keywords: ["Getting started","Component library","Storybook","AI","Fork"]
updatedAt: "2026-09-02"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/README.md
  - packages/design-system/generated/catalog.json
  - apps/storybook/.storybook/preview.tsx
  - docs/ai-workflow.md
---

Storybook is the entry point for inspecting YAMI's real components, page patterns, and usage rules. It runs the actual implementation in a browser, so teammates who do not edit code can still find references, try states, and check behavior across viewport sizes.

You do not need to download the project just to browse. [Open YAMI Storybook](https://yami-design-system-storybook.vercel.app/) directly. Complete [Getting Started](/en/docs/fork-project) and use your own local copy when you need to save changes, add a Story, or run validation.

## What Storybook is

Storybook presents components and pages as isolated, runnable examples. Each Story records a specific state or scenario, such as default, Loading, Disabled, a narrow viewport, or English content.

It supports four common tasks:

- **Find:** Locate design rules, brand assets, components, or complete pages.
- **Understand:** Inspect purpose, parameters, states, interactions, and usage boundaries.
- **Compare:** Check the same implementation across languages, themes, and viewport sizes.
- **Verify:** Exercise real interactions and share an exact Story URL for review.

Storybook is not a production site or a business-data editor. Changing Controls only affects the current preview; it does not automatically save or publish a new version.

## Why start with Storybook

| What you need to confirm | Static design | Storybook |
| --- | --- | --- |
| Component states | Requires separate frames or written notes | Lets you try Hover, Focus, Loading, and Disabled directly |
| Responsive behavior | Depends on several frames and annotations | Shows layout and content changes at real widths |
| Locales and themes | Often covers only one combination | Lets you switch and compare within the same example |
| Interaction | Requires prototype links or verbal explanation | Lets you operate real components and pages |
| Collaboration | Feedback may point only to a screenshot location | A URL can identify a specific component, state, or page |

The tools are complementary. Figma remains useful for open exploration, visual directions, and early critique. Storybook is better suited to confirming real components, interactions, and implementation boundaries once the direction has converged.

## What is in Storybook

| Section | What it contains | Use it to |
| --- | --- | --- |
| [Foundations](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-color--overview) | Color, typography, layout, radius, and responsive rules | Confirm the foundational rules an interface should follow |
| [Primitives](https://yami-design-system-storybook.vercel.app/?path=/story/yami-primitives-color-primitives--overview) | Base values for dimensions, color, and typography | Perform advanced standards checks, not ordinary page building |
| [Assets](https://yami-design-system-storybook.vercel.app/?path=/story/yami-assets-logos--overview) | Reusable brand assets such as logos and icons | Select the right version and confirm color, size, and background requirements |
| [Components](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--showcase) | Real components such as Button, Header, ProductCard, and ProductList | Inspect component states, interactions, parameters, and usage |
| [Pages](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-ecommerce-home--pc) | Complete pages such as home, topic, search, and product detail | Find references for page structure and module composition |

When building a page, start in Pages with the closest complete page, then move to Components to confirm the states and usage of the components it contains.

## Know the three workspaces

| Place | Use it for | What it does not mean |
| --- | --- | --- |
| Docsite | Learn workflows, standards, and acceptance criteria | It does not show every component state and API |
| Storybook | Inspect, try, and verify real components and page examples | Controls do not save or publish a new version |
| Local project | Edit content, compose pages, run checks, and save code | A working local result is not review or release approval |

Storybook is for inspection, understanding, and verification. Save new content, page compositions, and component capabilities in your own local project before they enter code review and release workflows.

## Choose your next step

| What you need to do | Continue with |
| --- | --- |
| Find a component, inspect its states, or explore a complete page | [Explore components and pages](/en/docs/browse-components) |
| Create a component or page with AI | [Start creating](/en/docs/prepare-environment) |
| An existing component cannot meet a real requirement | [Report a component gap](/en/docs/create-components#report-a-component-issue) |

The next guide owns the detailed methods for finding, reading, checking, and sharing components and pages.
