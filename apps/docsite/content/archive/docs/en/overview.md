---
slug: overview
title: Overview
description: "Understand how YAMI connects brand rules, DTCG tokens, components, prototypes, Storybook, and agent contracts."
group: start
order: 20
keywords: ["architecture", "Catalog", "Registry", "Storybook"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/generated/catalog.json
  - docs/adr/001-architecture-and-migration-contract.md
---

YAMI turns design guidance into contracts that code and tools can consume together. It does not depend on one static style guide; sources, generated outputs, components, and validation remain traceable.

## Five layers

| Layer | Responsibility | Source of truth |
| --- | --- | --- |
| Brand rules | Color, type, spacing, radius, content, and prohibited patterns | `DESIGN.md` |
| Tokens | Primitives, semantic aliases, and theme overrides | `tokens/**/*.tokens.json` |
| Components | Props, states, accessibility, and token bindings | `components/*` |
| Page prototypes | Maintained business compositions and responsive strategies | `packages/prototypes/pages` |
| Delivery contracts | Catalog, Registry, skills, and CI | `generated/*` and validation scripts |

Applications consume downward from the semantic layer. They must not bypass semantic aliases to bind arbitrary colors or dimensions.

## Current component scope

The generated Catalog currently records 30 components: 14 stable, 5 beta, and 11 experimental. Status describes maturity without changing the public import path.

- Stable components are the default production choice.
- Beta components have an explicit contract, with changes still requiring attention.
- Experimental components are for controlled contexts and require interaction and responsive verification by the consumer.

Storybook owns component details, examples, and interactions. Docsite phase one covers system guidance and foundations only.

## One source of truth

DTCG JSON is the token source, and `generated/tokens.css` is an output. Catalog and Registry files are also generated from component metadata. Never edit generated files manually.

The correct flow is:

1. Change the source file.
2. Run the matching generation command.
3. Review generated differences.
4. Run repository validation.

## Application boundaries

`packages/design-system` stays independent of Next.js, business data, and agent runtimes. Canvas, Storybook, Topic Generator, and Docsite are consumers and must not introduce application dependencies back into the package.

This boundary keeps components reusable across hosts and makes validation failures traceable to their source instead of hidden behind application overrides.
