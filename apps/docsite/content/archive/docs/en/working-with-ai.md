---
slug: working-with-ai
title: Working with AI
description: "Make agents read contracts first, reuse public components, and complete design-system work with reproducible evidence."
group: guides
order: 210
keywords: ["AI", "agent", "skill", "validation", "evidence"]
updatedAt: "2026-08-29"
sourceRefs:
  - .agents/skills/yami-design-system/SKILL.md
  - packages/design-system/SKILL.md
  - docs/ai-workflow.md
  - packages/design-system/generated/catalog.json
---

AI can accelerate retrieval, composition, and verification, but it does not replace design-system sources or review. Agent output remains traceable to public components, tokens, content standards, and actual tests.

## Read before implementation

At the start of a YAMI task, an agent follows the reading order in the skill and opens relevant component documentation. Only task-relevant component docs are required, but `DESIGN.md` and the package contract are not optional.

Before writing code, confirm:

- The user task and page boundary.
- Whether the Catalog already contains an appropriate component.
- Whether that component is stable, beta, or experimental.
- Which themes, languages, and breakpoints are in scope.

## Use public boundaries

Applications import components and styles from the public `@yami/design-system` entry points. Do not copy component source, import internal files, or override component states at page level.

When an existing component cannot meet the requirement, describe the gap and smallest contract first. Do not silently create a similar but incompatible version.

## Evidence chain

A complete delivery includes four kinds of evidence:

1. Sources: the tokens, component docs, and decisions used.
2. Static checks: types, lint, principles, and generated drift.
3. Runtime verification: the rendered page, keyboard path, browser logs, and network state.
4. Release proof: the commit SHA, CI state, target environment, and sampled pages.

An HTTP 200 response or local build alone does not prove the interface is complete.

## Decisions that remain human-owned

Agents do not invent business results, user feedback, adoption, or experiment conclusions. Brand-asset rights, language review, design judgment, and production release still require an explicit owner.

When sources conflict or a request exceeds an existing contract, the agent exposes the difference and asks for a decision instead of choosing the easiest implementation.
