---
slug: getting-started
title: How to use the library
description: "Find reusable components, build a page with AI, then review, deliver, and maintain it with your team."
group: start
order: 10
keywords: ["Getting started","Component library","Storybook","AI","Fork"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/README.md
  - apps/storybook/.storybook/preview.tsx
  - docs/ai-workflow.md
---

This guide helps designers, product teammates, and developers use YAMI to create a page they can demonstrate, interact with, and review. You do not need to understand the entire repository before starting.

YAMI provides design standards, public components, and page examples. You define the goal, supply content, and approve the result; AI can help find components, compose pages, and run checks.

## Choose your path

| Your goal | Start here | What you leave with |
| --- | --- | --- |
| Explore components, standards, and page behavior | [Find and try components](/en/docs/browse-components) | Reusable components and reference links |
| Build your own page with AI | [Prepare your environment](/en/docs/prepare-environment) → [Choose a page example](/en/docs/choose-starting-point) → [Create your first page](/en/docs/first-page) | An independent, interactive practice version |
| Create and review work with teammates | [Team collaboration](/en/docs/collaboration) | Task ownership, a preview, and recorded feedback |
| Contribute reusable improvements | [Report a component gap](/en/docs/component-gaps) | A focused proposal the team can review |

You can browse components without downloading the project. Prepare a local environment when you are ready to build.

## Your first-page checklist

1. **Once:** Get project access, [create your own Fork](/en/docs/fork-project), and connect it to upstream.
2. **Once:** [Prepare your environment](/en/docs/prepare-environment), start Storybook, and check that an example renders and responds.
3. **For each task:** [Choose a page example](/en/docs/choose-starting-point) as your reference, then [start and manage a task](/en/docs/manage-tasks), recording its goal, change scope, and owner.
4. **Follow along:** Use the content and prompts in [Build your first page](/en/docs/first-page).
5. **Before sharing:** Complete the [self-check](/en/docs/review-checklist), save your version, and follow [Share a preview and review](/en/docs/review-preview).

The collaboration model assumes a private upstream with authorized Forks. An administrator must confirm permissions first; this guide does not configure repository or preview access automatically.

## Three tools, three responsibilities

| Place | Use it for | What it does not mean |
| --- | --- | --- |
| Docsite | Learn workflows, copy prompts, and use acceptance checklists | It does not duplicate every component API |
| Storybook | Inspect, understand, try, and verify real components and page examples | Controls do not save or publish business pages |
| Local project and AI tool | Edit content, compose pages, run checks, and save code | An AI completion message is not review or launch approval |

Open [components](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--showcase), [design standards](https://yami-design-system-storybook.vercel.app/?path=/story/yami-foundations-color--overview), or [page examples](https://yami-design-system-storybook.vercel.app/?path=/story/yami-pages-ecommerce-home--pc). If your team's entry point requires sign-in, request access from a maintainer rather than making a public copy.

## Reuse before changing

Find the closest page first, then identify its components. Prefer replacing copy, products, and images before changing module composition. Extend a public component only when an actual requirement cannot be met.

Ask AI to read `packages/design-system/SKILL.md` and follow its reading order for standards, component contracts, and page examples. Do not ask it to recreate existing components from a screenshot.

## What counts as finished

You should be able to explain where the page is saved, how to open it, what changed, and which checks support the result. A teammate should be able to reproduce it with the agreed language, theme, viewport, and data version.

Self-checking, teammate review, and authorized release are separate steps. A merge or working local preview does not mean the page is deployed. For delivery, continue to [Deliver and publish a page](/en/docs/deliver-publish).

## Next step

Want to explore available components? [Find and try components](/en/docs/browse-components). Ready to build? [Prepare your environment](/en/docs/prepare-environment), then [choose a page example](/en/docs/choose-starting-point).
