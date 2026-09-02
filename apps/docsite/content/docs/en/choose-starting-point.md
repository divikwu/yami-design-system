---
slug: choose-starting-point
title: Create a page
description: "Use the page goal and available references to reuse the closest maintained example or compose a new page from existing components."
group: ai
order: 50
keywords: ["Page examples","Reuse","Prototypes","Landing page"]
updatedAt: "2026-09-02"
sourceRefs:
  - packages/prototypes/pages/EcommerceHome/EcommerceHome.stories.tsx
  - packages/prototypes/pages/SearchResultsPage/SearchResultsPage.stories.tsx
  - packages/prototypes/pages/TopicLandingPage/TopicLandingPage.stories.tsx
  - packages/design-system/SKILL.md
---

Use this workflow when the page goal is clear and the task is ready for AI implementation. First check whether a page reference exists, then use the matching prompt and define the structure, content ownership, reuse scope, and acceptance requirements.

## Check the available references

| Available input | Page starting point |
| --- | --- |
| A close YAMI Page Story | Reuse its structure, types, and public components; replace content in the task's own Story and fixture |
| Component references only | List page modules from the user task, then compose the smallest page from existing components |
| A design, screenshot, or webpage | Separate structure, content, components, responsive behavior, and interaction; do not treat visual similarity as the full requirement |
| No page or component reference | Start from the user task and content hierarchy, search YAMI Pages and Components, then propose a new structure |

Always state what the user needs to accomplish. A reference determines where to begin; it does not replace real content, interaction, or acceptance criteria.

## Copy a page prompt

### With a page reference

```text
Create an independent page version in the current YAMI project.

Page goal: <task the page needs to support>
Target users: <people who will ultimately use the page>
Page reference: <Page Story, design, screenshot, or approved webpage>
Content and assets: <bilingual copy, products, images, data, and sources>
Preserve: <reference structure, components, or interactions>
Change: <specific changes for this page>
Required interactions: <buttons, links, filters, dialogs, or submission results>
Acceptance criteria: <locales, themes, viewports, states, and interactions to verify>
Optional context: <asset permissions, data version, and out-of-scope items; use “to confirm” when unknown>

Inspect the closest pages and components. Explain what can be reused directly,
what belongs in the page, and what requires a new capability before creating it.
Handle only this requirement. Do not overwrite defaults or change unrelated files.
For an external reference, use only approved structure, content, and assets.

Verify the real page and primary interactions in Storybook.
Report how the reference was used, changed files, Story URL,
verification results, and open issues. Do not commit, push, or publish.
```

### Without a page reference

```text
Create a page in the current YAMI project.

Page goal: <task the page needs to support>
Target users: <people who will ultimately use the page>
Content and assets: <bilingual copy, products, images, data, and sources>
Required interactions: <buttons, links, filters, dialogs, or submission results>
Acceptance criteria: <locales, themes, viewports, states, and interactions to verify>
Optional context: <asset permissions, data version, and out-of-scope items; use “to confirm” when unknown>

Search the existing pages and components and list the closest starting points.
Reuse a suitable structure; propose the smallest new page structure only when none fits.
Handle only this requirement. Do not change unrelated files or invent prices,
inventory, claims, or missing business rules.

Verify real content, responsive behavior, and primary interactions in Storybook.
Report the selected page structure, component list, changed files, Story URL,
verification results, and open questions. Do not commit, push, or publish.
```

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

## Continue refining a page

Use this prompt when an existing page needs another revision:

```text
Continue refining the current page.

Change: <specific content, layout, or interaction>
Preserve: <structure, content, and behavior that must remain unchanged>
Acceptance criteria: <locales, themes, viewports, states, and interactions to recheck>

Confirm the change scope first. Handle only this revision and do not change unrelated files.
Recheck the page in Storybook, then report changed files, the Story URL, verification results, and open issues.
Do not commit, push, or publish.
```

## Check that the starting point fits

Open the reference at your target viewport and follow its main path. Can its structure express the requirement? Is the change about data, composition, or the component itself? Is a key interaction missing altogether?

When uncertain, ask AI to separate “reuse directly / implement in the page / confirm with a maintainer” before proceeding. More generated files are not a substitute for this decision.

## Check the page result

Confirm that AI reports:

1. Which Pages, Components, Stories, and rules it inspected.
2. Why it reused a page, recomposed one, or created a new page structure.
3. Which Stories, fixtures, assets, and implementation files changed, and whether shared components were affected.
4. Which page Story was actually opened in Storybook.
5. Which locales, themes, viewports, states, and primary interactions were checked.
6. Which commands passed, were skipped, or failed, plus remaining questions.

## Next step

After completing the page, continue to [Check the page](/en/docs/review-checklist). If the task type or prompt is still unclear, return to [Start creating](/en/docs/prepare-environment). For a genuine missing capability, [report a component gap](/en/docs/component-gaps).
