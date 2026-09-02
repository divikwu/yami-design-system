---
slug: edit-pages
title: Edit page content and layout
description: "Identify whether a change belongs to copy, products, page composition, or shared capabilities, then iterate within a clear task scope."
group: ai
order: 60
keywords: ["editing", "copy", "products", "images", "layout", "feedback"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/prototypes/pages/TopicLandingPage/TopicLandingPage.types.ts
  - packages/prototypes/pages/TopicLandingPage/topic.fixtures.ts
  - packages/prototypes/pages/TopicLandingPage/matcha.fixture.ts
  - packages/design-system/components/ProductList/usage.md
  - packages/design-system/content/bilingual.md
  - docs/adr/007-evaluation-first-live-prototypes.md
---

For teammates who already have a working page. If you do not yet have your own version, complete [Create your first page](/en/docs/first-page). Every revision should explain what changes, what stays, and how you will know it works.

## Identify the layer to change

| What you need | Start here | Avoid unrelated changes |
| --- | --- | --- |
| New headline, description, or button copy | Task-owned bilingual content or Story overrides | Rewriting a shared component's default copy |
| Different products, images, or ordering | Task-owned fixtures, data mapping, and asset references | Editing the shared baseline or inventing product information |
| Module visibility or order | The page's public composition options; discuss a task-specific composition when insufficient | Hiding focusable content only with CSS or overriding component internals casually |
| A capability missing across similar pages | First record a [component capability gap](/en/docs/component-gaps) | Quietly changing shared behavior for every page in a single task |

Not every page supports arbitrary ordering. Have AI inspect the actual page types and usage before choosing existing parameters or a scoped page version.

## Keep copy changes bilingual

In the first exercise, lasting copy lives in `practiceCopy` inside the new Story, not the original `topic.fixtures.ts`. Naming the field and desired text produces a more comparable result than asking AI to “improve everything.”

Check Chinese meaning, natural English, longer-text wrapping, image alternatives, and accessible button names together. Do not update visible Chinese while leaving outdated English behind.

```text
Target: hero.description in this task's MatchaPractice Story.
Chinese: 选一款抹茶，搭配喜欢的小点，给周末留一点轻松。
English: Pick your matcha, add a favorite treat, and make time to unwind.
Keep: headline, products, images, module order, typography, and theme rules.
Check: both languages remain complete at 375px and 1440px without crowding
the content below. Edit only task-owned files.
Report the changes and actual verification results.
```

## Replace products and images

Prepare product IDs, names in both languages, images, destination URLs, and sourced pricing fields first. Omit unprovided or unverified information, or explicitly label it as demonstration data. Do not let AI invent offers, sales figures, or product benefits.

The matcha exercise's existing `matcha.fixture.ts` references local product assets. Keep using it for a small copy exercise. For independent project content, organize data in a task-owned fixture rather than editing the shared source.

Check four relationships when replacing content:

1. The image, title destination, and product ID identify the same product.
2. Image paths work, dimensions and cropping fit the existing card, and missing images use supported fallbacks.
3. Categories, tabs, and associated data such as `productsByTab` are updated together, not only the default product list.
4. Product counts, ordering, and price copy are consistent; remove totals and campaign claims that no longer apply.

Store new assets in a task-specific directory and record their source and allowed use. Follow the repository's asset-reference pattern. Do not copy temporary webpage image URLs or embed private access tokens in source.

## Specify the target layout

Describe the issue instead of prescribing a fixed height or an arbitrary breakpoint. For example: “The description and product section feel crowded at 375px; keep the spacing at 1440px unchanged.” Ask AI to identify the existing container and component behavior before making a minimal change.

`TopicLandingPage` currently exposes options including `hiddenModules` and `contentMaxWidth`; these are not an arbitrary drag-and-drop page builder. After changing visibility, confirm that navigation and anchors still point to visible content.

If the overall structure must change, preserve the baseline and create a task-owned composition. For changes to shared component dimensions, behavior, or semantics, follow [Extend or create components](/en/docs/create-components) and identify affected consumers.

## Complete one focused feedback cycle

Include the page URL, locale, theme, viewport, actual behavior, expected result, and boundaries in each request. Screenshots help locate issues; annotation boxes, comment markers, and temporary browser attributes do not belong in the implementation.

```text
Version: latest task preview, English, light theme, 375px.
Issue: the hero description wraps too much and pushes the product section
below the first screen.
Expected: propose two shorter English descriptions first, preserving the
Chinese meaning. Wait for confirmation in chat before editing.
Do not change: hero image, font size, container width, products, or other modules.
After approval and editing: recheck both languages on narrow and desktop views.
```

When feedback asks for options first, AI should discuss them before editing. Once a change is explicitly requested, apply it within the agreed scope. Retain the diff and a previous comparison version instead of mixing unrelated experiments into one revision.

## Check and continue review

Reuse the [shared acceptance checklist](/en/docs/review-checklist) and update the same task record. Broader changes require broader rechecking; do not verify only the area circled in the screenshot.

A local save does not mean teammates can see the new version. Follow [Share previews and review](/en/docs/review-preview) to update an accessible preview and its version record, identifying which version it replaces and what limitations remain.
