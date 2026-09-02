---
slug: bilingual-commerce-by-design
title: Designing Bilingual Commerce from the Start
description: "Bilingual support is not a translation step after the interface is finished; information architecture, type, components, and verification share the responsibility."
date: "2026-08-29"
category: design
authors: ["YAMI Design System Team"]
tags: ["Bilingual", "Content", "Typography", "Accessibility"]
relatedDocs: ["choose-starting-point", "browse-components", "review-checklist"]
coverAlt: "YAMI Design System mark with the Design category"
draft: true
---

Asian food commerce naturally combines product names, brands, specifications, numerals, and cultural context from multiple languages. Replacing interface strings shortly before release usually leaves lost routes, overflow, unequal actions, and mismatched screen-reader names.

YAMI treats Chinese and English as system capabilities. Information architecture establishes stable identifiers, content is expressed for each language, components allow responsible expansion, and verification covers both semantics and real layout.

## Establish shared meaning first

A bilingual page needs stable objects rather than equal sentence length. Document slugs, content IDs, component props, categories, and analytics events use shared English identifiers. Display titles, descriptions, and action copy are localized.

That structure lets language switching preserve the object a person is viewing. Switching the Chinese Color document to English keeps the `color` document and current anchor instead of resetting to the English homepage.

Facts and outcomes stay aligned: dates, order, category, prices, constraints, related links, and what happens after an action. Syntax, word order, and length follow each language naturally.

## Typography must truly support both languages

YAMI uses GT Walsheim for Latin text and numerals and an approved system fallback stack for Chinese body copy. Numerals inside Chinese sentences still use GT Walsheim, keeping prices, specifications, and dates stable across languages.

Weight is language-aware too: ordinary emphasis is 500 in English and 600 in Chinese. Applications declare the correct root language instead of guessing through local font overrides.

Layouts do not hardcode Chinese character counts or English word counts. Buttons, Tabs, card titles, and filters are checked with real copy for wrapping and minimum tap targets. A longer translation cannot hide a critical action.

## Not line-by-line translation

Chinese favors direct, complete, actionable phrasing. English favors short sentences, active voice, and sentence case. Product names, APIs, and terms without an established translation can remain in English, but ordinary copy does not mix languages without purpose.

Machine translation can help produce a draft; it is not a completed review. Content review asks:

- Do both languages promise the same outcome?
- Do numbers, units, time, and constraints match?
- Do CTAs describe the same action rather than merely similar words?
- Do errors and empty states offer equally actionable next steps?
- Do accessible names align with visible copy?

## Components and pages share responsibility

Components own expandable structure, correct semantics, and state feedback. Pages own content order and context. The design system does not create separate components per language, and business pages do not reduce font size to fix overflow.

When copy exceeds a reasonable length, first ask whether it can be more direct. Then ask whether the component lacks support for a real use case. This order prevents a content issue from becoming permanent layout complexity.

## Structural checks protect alignment

Docsite content checks require one-to-one Chinese and English files and compare slugs, categories, order, dates, sources, and semantic links. A missing language or mismatched field fails the check.

Automation cannot decide whether a voice feels natural or whether a translation serves a local audience. Completion still requires human language review and real-page checks at 1440, 768, and 402 widths.

Starting with bilingual design does not mean making two interfaces look identical. It means giving people in both languages a clear path through the same task.
