---
slug: choose-starting-point
title: Choose a page example
description: "Find the closest maintained example before deciding whether to change content, compose modules, or request a component extension."
group: ai
order: 45
keywords: ["Page examples","Reuse","Prototypes","Landing page"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/prototypes/pages/EcommerceHome/EcommerceHome.stories.tsx
  - packages/prototypes/pages/SearchResultsPage/SearchResultsPage.stories.tsx
  - packages/prototypes/pages/TopicLandingPage/TopicLandingPage.stories.tsx
  - packages/design-system/SKILL.md
---

For teammates who have a page goal and are ready to brief AI. Start with a requirement, screenshot, or reference page. Explain what the user needs to accomplish rather than only asking for visual similarity.

## Find the closest page

| Task | Reference | What to inspect |
| --- | --- | --- |
| Storefront home and discovery | [Ecommerce Home](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-ecommerce-home--pc) | Product modules, navigation, and content order |
| Search and filtering | [Search Results](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-search-results--results) | Filters, empty results, and the product list |
| Product details | [Product Detail](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-product-detail-beauty--pdp) | Product information, options, and detail interactions |
| Brand campaigns and editorial topics | [Topic Landing Page](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-topic-landing-page-brand--pc) | Hero, categories, and product collections |

These are maintained compositions, not business projects ready for launch. Check imagery, destinations, prices, and interaction feedback against your task. Hosted Storybook and local source may differ; record your source baseline before building.

## Choose the level of change

| Requirement | Prefer | Avoid |
| --- | --- | --- |
| Different products, images, or copy | Task-specific data or Story using the existing page | Overwriting the default fixture and changing other examples |
| Different module order or selection | An independent composition using public components | Maintaining multiple copied implementations of the entire page |
| One missing reusable component state | Report the gap and agree on a variant | Changing every page's defaults for a single campaign |
| A different user goal and information structure | Define a new page task and reuse suitable modules | Forcing the task into an unsuitable page type |

A fixture stores example data; a Story runs a particular configuration. Reusing public components does not require copying the implementation of the reference page.

## Separate content ownership

Your project owns products, business destinations, copy, and state. Public components own their documented interaction, styling, theme, and accessibility behavior.

For example, a page may supply product data and handlers to ProductCard. It should not create a copied ProductCard for a campaign or change shared tokens to affect unrelated pages.

Keep project-specific work in your Fork. Once an improvement is reusable across tasks and has usage guidance and verification, propose a focused PR through [Contribute upstream](/en/docs/contribute-upstream).

## Write a page brief

Use this outline before starting:

```text
Target user and task:
Reference: Specific Storybook URL or screenshot
Structure to preserve:
Content to change:
Required interactions:
Languages and viewport range:
Asset sources, usage permissions, and data version:
Out of scope:
Reviewer and acceptance criteria:
```

Mark unknowns as “needs confirmation.” Do not let AI invent prices, product claims, licensing information, or button behavior the page cannot deliver.

## Check that the starting point fits

Open the reference at your target viewport and follow its main path. Can its structure express the requirement? Is the change about data, composition, or the component itself? Is a key interaction missing altogether?

When uncertain, ask AI to separate “reuse directly / implement in the page / confirm with a maintainer” before proceeding. More generated files are not a substitute for this decision.

## Next step

With a brief ready, go to [Build your first page](/en/docs/first-page). If setup is incomplete, [prepare your environment](/en/docs/prepare-environment) first. For a genuine missing capability, [report a component gap](/en/docs/component-gaps).
