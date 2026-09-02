---
slug: introducing-yami-design-system
title: Introducing YAMI Design System
description: "How YAMI connects brand rules, tokens, components, prototypes, and verification into one traceable delivery chain."
date: "2026-08-29"
category: update
authors: ["YAMI Design System Team"]
tags: ["Design System", "Token", "Storybook", "Workflow"]
relatedDocs: ["getting-started", "collaboration", "contribute-upstream"]
coverAlt: "YAMI Design System mark with the Update category"
---

YAMI Design System supports Asian food commerce experiences and the designers, developers, and agent-assisted collaborators who build them. Its purpose is not to provide a loose set of visual materials. It keeps brand rules, code implementation, and delivery evidence aligned.

The first Docsite release adds an explanatory layer: why the system works this way, how applications should consume it, and what verification completes a change. Storybook remains the source for component APIs and interactive examples.

## From a static guide to executable contracts

Traditional guidelines often drift across design files, documentation, and code. YAMI separates responsibilities into connected sources:

- `DESIGN.md` records hard rules for brand, visual design, content, and interaction.
- DTCG JSON stores primitive tokens, semantic aliases, and theme overrides.
- Public components implement props, states, accessibility, and token bindings.
- Catalog and Registry turn component status and dependencies into machine-readable data.
- Storybook renders real components, while application prototypes verify business composition.
- CI checks generated drift, package boundaries, design principles, types, and tests.

This structure makes a change traceable: where the source moved, why an output changed, which pages are affected, and what evidence confirmed the result.

## YAMI visual language is not a decoration set

YAMI starts with neutral canvases, clear hierarchy, and restrained feedback. Brand red belongs to the official logo. Operational red communicates a specific action, price, promotion, urgent message, or error.

Pages do not use gradients, glass effects, decorative illustration, or hover shadows to compensate for weak information structure. Cards are borderless and shadowless by default, and hover uses semantic background change. Each screen keeps one emphasis action so task priority is immediately clear.

These limits do not remove expression. They keep the brand recognizable across applications, languages, and themes—and keep agent-generated pages inside verifiable boundaries.

## The roles of Docsite and Storybook

Docsite phase one includes the system overview, foundations, collaboration guides, and Blog. It helps readers answer three questions:

1. How do YAMI principles and tokens work?
2. How does a new application integrate correctly?
3. How is a design or code change verified and released?

Storybook continues to own the component catalog. Button variants, Input states, Sheet focus behavior, and component maturity are authoritative there and in the generated Catalog. Docsite links to those sources instead of copying APIs and creating a second truth.

## Bilingual content and themes are first-class

Chinese and English share stable slugs while maintaining equivalent information. Switching language preserves the current document, Blog post, and anchor. Content checks compare order, category, dates, sources, and related links; human review still owns language quality.

The theme follows the system on a first visit and persists an explicit user choice. Light and dark modes share semantic tokens rather than component-level dark props. The official logo changes as a complete lockup for the surface it occupies.

## What counts as complete

Opening a local page is only a starting point. A YAMI delivery needs traceable sources, passing static checks, operable real interactions, and a confirmable target environment and commit SHA.

Docsite follows the same rule. Phase one moves to an independent preview only after content, types, unit tests, production build, keyboard paths, accessibility, and repository validation pass. Production release still requires explicit authorization and manual sampling.

YAMI will continue to evolve, but each change begins at the source and leaves reproducible evidence. That matters more than adding pages quickly.
