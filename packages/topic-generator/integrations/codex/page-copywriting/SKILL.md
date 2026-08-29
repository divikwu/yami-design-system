---
name: page-copywriting
description: Write or rewrite evidence-bound customer-facing copy for web pages and localized modules. Use for headlines, descriptions, CTAs, labels, structured copy proposals, or the Topic Generator content-writing stage. Do not use for research, page structure, product selection, review fabrication, image prompts, or visual generation.
---

# Page Copywriting

Turn a fixed page brief and fixed page structure into useful, locale-native
customer-facing copy. Work on the words only: preserve the caller's modules,
identities, order, data, and factual boundaries.

## Choose the mode

- **Topic Generator mode:** when the request contains a `content-writing`
  stage, ready `TopicPagePlan`, `contentTaskId`,
  `TopicPageContentProposal`, or `TopicPageContentSpec`, read and follow both
  [the Topic Page workflow](references/topic-page-workflow.md) and
  [the Topic Page proposal contract](references/topic-page-content-contract.md).
  Those rules override the general mode where they are more specific.
- **General page mode:** use the workflow below for any other page, campaign,
  landing page, product surface, or reusable module copy request.

When a caller uses the maintained commerce-page module IDs, also read
[the shared page module copy contract](references/page-module-copy-contract.md).
It preserves the same module meanings and copy slots used by Topic Generator
without making those modules mandatory for unrelated pages.

## General page mode

### Freeze the writing brief

Before writing, identify the available:

- page goal, audience, proposition, locale, and desired action;
- module and slot structure, including stable IDs and order;
- verified facts, allowed claims, source or evidence IDs, and immutable values;
- voice guidance, template-owned copy, and length or formatting constraints.

Do not silently invent a missing business fact. If a missing choice changes the
core proposition, audience, or locale, ask for it. Otherwise state the smallest
reasonable assumption and return an explicitly marked draft.

Treat product names, prices, URLs, identifiers, legal copy, supplied facts,
template-owned text, and module structure as immutable unless the caller
explicitly asks to change them. A writing request does not authorize research,
merchandising, layout changes, publication, or edits to source data.

### Map and write the requested slots

1. Process only the requested modules and slots, in caller order. Never add a
   slot merely because the page could contain one.
2. Give the page one clear proposition. Make each module support a distinct
   shopper question, decision, or action instead of repeating the Hero.
3. Write for the requested locale. For a second locale, create a separate
   proposal that preserves meaning and structure but adapts naturally instead
   of translating word for word.
4. Keep implementation language out of customer copy. Do not mention prompts,
   agents, schemas, evidence, validation, internal taxonomies, or workflow
   stages.
5. Use concise, specific language. Treat preferred lengths and character
   targets as guidance unless the caller explicitly marks them as hard limits;
   never truncate or distort natural copy just to hit a target.
6. Make CTAs name a clear action or outcome. Do not imply inventory, savings,
   urgency, ratings, efficacy, popularity, or customer results without supplied
   evidence.
7. Keep template-owned copy verbatim. Write review quotes, testimonials,
   discounts, compliance claims, or performance claims only from verified
   caller-supplied records.

For every factual segment, bind only the source or evidence IDs allowed by the
caller. UI labels and purely navigational copy do not need invented citations.
If the caller provides no evidence mechanism, keep claims within supplied facts
and list any unsupported request as a warning instead of fabricating support.

### Review before returning

Check the complete page copy as one experience:

- **Usefulness:** does the Hero explain why the page matters, and does each
  module help the reader make a different decision?
- **Specificity:** could an unrelated page reuse the copy unchanged? If so,
  add a supported proposition, context, or action.
- **Coherence:** do headings, descriptions, labels, and CTAs agree without
  repeating the same idea?
- **Locale quality:** is the writing native to the requested locale, with only
  immutable proper nouns left untranslated?
- **Truthfulness:** can every factual claim be traced to supplied facts or an
  allowed evidence reference?
- **Structural fidelity:** are all requested IDs, slots, immutable values, and
  ordering preserved exactly?

Revise only the failing copy fields. Do not repair upstream data or redesign
the page from inside this Skill.

## Return contract

Follow a caller-provided schema exactly. If no schema is provided, return plain
copy for a single unambiguous slot. For multiple modules or machine reuse, read
and follow [the general proposal contract](references/page-copy-proposal-contract.md),
then return one `page-copy-proposal/v1` object. Its ordered `bindings` preserve
the exact field path, repeated-entry identity, and position needed to reconstruct
the caller's page without flattening nested modules.

```json
{
  "schemaVersion": "page-copy-proposal/v1",
  "pageId": "caller-page-id",
  "locale": "zh-CN",
  "status": "draft",
  "assumptions": [],
  "modules": [
    {
      "moduleId": "hero",
      "bindings": [
        {
          "fieldPath": "title",
          "text": "页面标题",
          "evidenceRefs": []
        },
        {
          "fieldPath": "tags[]",
          "position": 0,
          "text": "浏览方向",
          "evidenceRefs": []
        }
      ]
    }
  ],
  "warnings": []
}
```

Use `status: "ready-for-review"` only when every requested slot is complete,
immutable bindings are preserved, and factual claims fit the supplied evidence.
Otherwise use `draft` and make assumptions or warnings explicit. Never claim
that generic copy is published, approved, or deterministically validated unless
the caller's runtime actually proves it.

Do not create image prompts, art direction, or alt text unless the caller lists
them as explicit writing slots. Write files only to a caller-approved path and
never overwrite page plans, source evidence, product data, or visual artifacts.
