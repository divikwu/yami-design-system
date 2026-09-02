---
slug: bilingual-content
title: Bilingual Content
description: "Maintain Chinese and English experiences through equivalent information, stable identifiers, and language-specific review."
group: guides
order: 200
keywords: ["bilingual", "Chinese", "English", "localization", "slug"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/content/bilingual.md
  - packages/design-system/content/writing-standards.md
  - packages/design-system/content/voice.md
  - packages/design-system/content/casing-numerals.md
---

YAMI bilingual content is not line-by-line replacement. It expresses the same task naturally in two languages. Information, actions, and limits stay equivalent while syntax and rhythm can change.

## Stable identifiers

Route slugs, content IDs, component props, and analytics events use stable English identifiers. Display titles and descriptions are localized. Switching language preserves the current resource and anchor instead of returning home.

Chinese and English documents and Blog posts are paired one to one. These fields remain aligned:

- Slug and content type.
- Category, order, and publication date.
- Related documents and internal semantic links.
- Sources and constraints.

## Chinese writing

Chinese copy uses direct, complete, actionable sentences. Avoid translation syntax, long noun stacks, and unnecessary English. Product names, tokens, APIs, and technical terms without an established translation can remain in English.

Use full-width punctuation. Numerals still render in GT Walsheim.

## English writing

English favors short sentences, active voice, and sentence case. Buttons use clear verbs, and headings do not use all caps. Do not remove necessary qualifiers just to match Chinese character count.

## Content pairing workflow

1. Confirm source facts and the user task.
2. Draft each language independently; machine translation is not a finished review.
3. Compare numbers, constraints, links, and action outcomes.
4. Ask someone familiar with the language and product to review.
5. Check wrapping, overflow, and accessible names in the real layout.

Content CI checks structural pairing. Human review still owns language quality.
