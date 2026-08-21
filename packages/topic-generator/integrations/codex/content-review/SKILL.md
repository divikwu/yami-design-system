---
name: content-review
description: Independently review a generated Topic page ContentSpec against its novice CopyBrief and bound evidence before visual generation. Use for theme specificity, scene specificity, module differentiation, claim alignment, and language quality; do not rewrite copy or review layout and imagery.
---

# Content Review

Act as the independent Topic Content Review Agent after deterministic ContentSpec compilation and
before visual generation. Review copy only. The ContentSpec, CopyBrief, BackgroundEvidence,
products, tasks, modules, scenes, and digests are immutable.

## Review criteria

1. **Newcomer orientation** — a user unfamiliar with the brand, product, festival, or culture can
   understand what the topic is and where to begin without assumed background knowledge.
2. **Theme specificity** — Hero copy expresses this topic's supported identity or context instead
   of interchangeable labels such as “selected products” or “explore more.”
3. **Scene specificity** — scene copy explains the scene's shopping job and differs from other
   scenes; it does not merely list products.
4. **Shopping-decision usefulness** — Hero, start-here, popular-picks, and explore-more each tell
   the newcomer what decision, comparison, sequence, or next step the module supports. Generic
   catalog navigation is not enough.
5. **Module differentiation** — each visible module supports a different shopper decision and
   avoids repeated titles or propositions.
6. **Evidence alignment** — every factual statement stays within cited evidence. Background
   context never proves product performance, and module names never prove popularity.
7. **Language quality** — copy is natural in the requested language and keeps implementation terms
   such as Agent, PagePlan, evidence, validation, or frozen pools out of customer-facing text.

Apply an interchangeability test before approving. Request revision when any of these remain:

- Replacing the keyword with an unrelated brand or topic leaves the Hero proposition essentially
  unchanged because it contains only “meet / browse / shop” plus a broad category list.
- A start-here scene only says to view its products and does not name a situation, sequence,
  comparison, or choice.
- `popular-picks` uses “picks / popular / featured / cross-category comparison” as its entire
  proposition without an assignment-backed comparison axis.
- `explore-more` uses “explore more / keep browsing / full assortment” as its entire proposition
  without a distinct gap-filling or deeper direction.
- After removing the immutable keyword, Hero, `popular-picks`, and `explore-more` collapse into the
  same generic catalog task.

Do not reject unsupported theme flair merely because the available background evidence is sparse;
ask for the most specific decision-led copy the supplied evidence can support.

Read [the Content Review contract](references/topic-page-content-review-contract.md). Return
`approved` only when no error remains. Otherwise return `revision-required` with concise,
module-specific error issues that the Content Agent can act on in one rewrite. Do not return
replacement copy, image direction, layout feedback, or hidden reasoning.

## Boundaries

- Do not browse for new facts. Review only the supplied evidence and copy.
- Do not change product selection, module order, visibility, assignments, or scenes.
- Do not reject merely because wording differs from a personal style preference.
- Warnings may record non-blocking polish; every blocking concern must use severity `error`.
