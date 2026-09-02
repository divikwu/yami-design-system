---
slug: prepare-environment
title: Start creating
description: "Choose whether to create a component or a page, then prepare references, prompts, and acceptance criteria in the matching workflow."
group: ai
order: 40
keywords: ["create component", "create page", "reference", "prompt", "AI", "acceptance"]
updatedAt: "2026-09-02"
sourceRefs:
  - docs/ai-workflow.md
  - packages/design-system/SKILL.md
  - packages/design-system/generated/catalog.json
  - packages/prototypes/pages/TopicLandingPage/TopicLandingPage.stories.tsx
---

This is the routing page for “Create with AI.” Decide whether the task needs a shared component or a complete page, then continue to the matching workflow for references, prompts, and acceptance criteria. Complete [Getting Started](/en/docs/fork-project) first if the repository, dependencies, or Storybook are not ready.

## Choose what to create

| Goal | When to choose it | Next step |
| --- | --- | --- |
| Create a component | You need a focused interaction or display capability that multiple pages can reuse | Go to [Create a component](/en/docs/create-components) |
| Create a page | You need to complete a user task by combining content, data, and multiple components | Go to [Create a page](/en/docs/choose-starting-point) |

Replacing copy, products, images, or module order in one page is usually page work, not a new shared component. When an existing component lacks a reusable capability, [report the component gap](/en/docs/component-gaps) first.

## Continue to the matching workflow

- **Create a component:** Use [Create a component](/en/docs/create-components) to check references, choose a prompt, and complete the contract, Story, and verification.
- **Create a page:** Use [Create a page](/en/docs/choose-starting-point) to check references, fill in a prompt, and complete implementation and verification.

A reference may be a Storybook example, existing code, a design, a screenshot, or an approved webpage. Without one, AI should still search existing Components and Pages rather than generate freely from a blank canvas.

## Before starting

Give AI only the task content and approved assets it needs. Do not provide passwords, access tokens, or customer information. Each workflow contains its own inputs, prompts, and completion checks.
