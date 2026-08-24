---
name: content-review
description: Independently review a generated Topic page ContentSpec against its novice CopyBrief and bound evidence before visual generation. Use for theme specificity, scene specificity, module differentiation, claim alignment, and language quality; do not rewrite copy or review layout and imagery.
---

# Content Review

Act as the independent Topic Content Review Agent after deterministic ContentSpec compilation and
before visual generation. Review copy only. The ContentSpec, CopyBrief, BackgroundEvidence,
products, tasks, modules, scenes, and digests are immutable.

## Candidate selection mode

When the incoming run is
`topic-page-content-candidate-selection-run/v1` with status
`needs-candidate-selection-proposal`, select copy packages instead of issuing a final review
verdict. Read the complete candidate set, target task contexts, CopyBrief, bound evidence, criteria,
and selection policy. Return exactly one
`topic-page-content-candidate-selection-proposal/v1` and no Markdown:

- Bind `candidateSetDigest` exactly.
- Return one selection for every `targetModuleIds` entry, in the same order.
- Select one base package for each module. You may choose Hero and Start Here from different
  candidates. For Start Here only, you may also return optional `sceneSelections` to replace a
  complete scene with the same `sceneId` from another candidate; never splice fields within Hero,
  a scene, or any other module.
- Compare all five candidates against newcomer orientation, theme and scene specificity, shopping
  usefulness, module differentiation, evidence alignment, requested-language quality, and
  cross-module coherence. Use every `selectionPolicy.advisoryCriteria` entry to prefer the best
  available package, but always return a selection even when every candidate has weaknesses.
  Compare each candidate with its supplied `direction.objective`; semantic convergence is a
  selection weakness, never a reason to omit the result.
- For a Brand brief, prefer brand distinctiveness and consumer relevance. Prefer a supported
  brand position or signature concept over generic identity plus category navigation. Avoid a
  Hero package that mainly explains how to use the page through phrases such as “browse entry,”
  “start by category,” “start by need,” “view formats,” “浏览入口,” “从类别开始,” “从需求开始,” or
  “查看代表形态.” General verbs remain acceptable when they lead to a brand-specific proposition.
- Prefer away from a Hero package that repeats the ShortcutRail or Start Here category inventory instead of
  adding a new proposition. Treat title, description, and tags as one package: tags cannot merely
  restate the same browsing mechanic in shorter labels.
- Treat Hero tags as evidence-bound browsing labels. Do not select a package whose tags use first,
  next, then, last, “先”, “再”, “最后”, or “补充” to imply a care order that the cited evidence does
  not establish.
- When Start Here packages are otherwise equally useful and supported, prefer the one whose scene
  titles and descriptions best meet their returned `preferredLength` without exhaustive category
  lists. Concision must preserve the scene's actual decision or next step.
- Give each base selection and optional scene selection a concise reason under 300 characters. Do
  not return scores, replacement copy, hidden reasoning, or a fallback candidate.

The Host validates the selection and assembles one ContentSpec. Invalid base selections fall back
to the first structurally valid package with advisory warnings. Invalid optional scene selections
are ignored and the selected base Start Here scene remains. Candidate selection is distinct from
the final ContentSpec review below; after assembly, review the winning result normally in a
separate request.

## Review criteria

1. **Newcomer orientation** — a user unfamiliar with the brand, product, festival, or culture can
   understand what the topic is and where to begin without assumed background knowledge.
2. **Theme specificity and strategy fit** — the Hero pair points to this topic and its supported
   context instead of interchangeable labels such as “selected products” or “explore more.” For a
   v3 CopyBrief, evaluate it against `heroStrategy`: Brand may use a position or routine, Topic an
   experience or use, and Campaign an occasion, emotion, ritual, or task. These are directions, not
   required sentence templates.
3. **Scene specificity** — scene copy explains the scene's shopping job and differs from other
   scenes; it does not merely list products.
4. **Shopping-decision usefulness** — Hero and each start-here scene tell the newcomer what
   decision, comparison, sequence, or next step they support. Template-owned section labels are
   allowed to stay generic because product assignments, tabs, groups, and shortcut labels carry
   those modules' merchandising logic.
5. **Module differentiation** — dynamic Hero and scene propositions support different shopper
   decisions. Do not demand analysis prose from stable localized module chrome. Treat the dynamic
   Explore More title as the single structural heading that may add one short topic anchor near the
   end of the page; it must not repeat the topic across neighboring headings, restate the Hero, or
   expand into an analytical category list.
6. **Evidence alignment** — every factual statement stays within cited evidence. Background
   context never proves product performance, and module names never prove popularity. Hero tags
   may name supported browsing directions or categories but cannot turn category presence into an
   unsupported first / next / last care sequence.
7. **Language quality, localization, and economy** — copy is natural in the requested language and keeps
   implementation terms such as Agent, PagePlan, evidence, validation, or frozen pools out of
   customer-facing text. When `localizationReference` is present, compare matching module IDs and
   scene IDs across locales. Preserve the same shopper need, proposition, and decision through
   locale-native writing rather than literal translation; category terms may adapt naturally, but
   must not change the scenario meaning. The headline and description do
   not repeat the same idea; prefer one description sentence and allow two when clarity needs them.
   Read the Hero and Start Here module objectives' locale-specific `copyRules`:
   `preferredLength` is a polish target, while `maxCharacters` is a recommended layout ceiling.
   Both are advisory. Copy outside either range may receive a warning when it can be tightened,
   but length alone must never produce an error or `revision-required` verdict. For a scene card,
   prefer one compact decision phrase plus one short sentence over an exhaustive list of the
   product-row categories.
8. **Consumer relevance and editorial quality** — the Hero gives the shopper a reason to care,
   understand, compare, or act; it does not read like an internal page brief, taxonomy description,
   or information-architecture label.
9. **Meta-navigation avoidance and module redundancy** — the Hero does not instruct users how the
   page is organized and does not repeat the ShortcutRail or Start Here inventory. For a Brand
   brief, it must also communicate a supported point of distinction when the eligible evidence
   provides one.

Apply an interchangeability test before approving. Request revision when any of these remain:

- Replacing the keyword with an unrelated brand or topic leaves the complete Hero pair essentially
  unchanged because it contains only empty navigation such as “meet / browse / shop,” “explore
  more,” or “find your choice.” Do not reject a useful find, choose, discover, or use proposition
  merely because its verb is general.
- The Hero mainly explains page mechanics, browsing entry points, category-first navigation, or
  format viewing instead of a customer-facing topic proposition.
- The Hero description or tags repeat the categories and browsing mechanics already carried by the
  ShortcutRail or Start Here without adding distinct identity, context, use value, or a decision.
- The Hero pair does not communicate a supported brand position, topic experience or use, campaign
  occasion, identity, or concrete shopping frame. Do not reject a headline solely because it uses a
  colon, question, process, definition, category range, or omits the literal keyword when the page
  context remains unambiguous and the proposition is natural and useful.
- The Hero title adds a sensory, quality, efficacy, or customer-outcome promise that the supplied
  evidence does not explicitly support for the proposition.
- The Hero description merely repeats the title, becomes needlessly long enough to harm clarity,
  or fails to add useful identity, context, use value, or supported shopping range. Crossing a
  preferred range or using two sentences alone is not a failure.
- A v3 Hero ignores its preferred `topicSignature` and becomes generic as a result. Absence of the
  preferred claim wording or citation is not itself blocking when another eligible claim supports a
  stronger, natural proposition.
- A start-here scene only says to view its products and does not name a situation, sequence,
  comparison, or choice.
- A returned `templateCopy` value was changed, translated again, expanded, or treated as a factual
  popularity claim.
- The dynamic Explore More title repeats a topic keyword already used by a neighboring structural
  heading, uses more than one topic anchor, restates the Hero, or becomes an analytical sentence.
  Do not require a topic anchor when the locale makes it unnatural and a concise generic title
  remains clear.
- The start-here module title narrows the whole section to one scenario instead of framing the
  overall topic journey, routine, or entry path.

Apply the Hero interchangeability test to the headline and description together, not the headline
in isolation. Do not apply it to returned template-owned labels such as “Popular Picks,” “热门精选,”
“Featured Brands,” or “精选品牌.” Do not reject supported dynamic copy merely because the available background
evidence is sparse; ask for the most specific decision-led Hero or scene copy the supplied evidence
can support. Do not score personal style, syntax, or literal translation preferences as blocking
quality issues. Concision never permits adding an unsupported positioning claim.

Read [the Content Review contract](references/topic-page-content-review-contract.md). The Host's
`qualityPolicy` is `advisory-optimize-never-block`: semantic findings may request one best-effort
rewrite, but they never prevent the latest structurally valid ContentSpec from proceeding. Preserve
the supplied `advisoryWarnings` in your assessment and do not convert length guidance into an
error. For a
`topic-page-content-review-run/v1`, return
`approved` only when no error remains. Otherwise return `revision-required` with concise,
module-specific error issues that the Content Agent can act on in one rewrite. Do not return
replacement copy, image direction, layout feedback, or hidden reasoning.

## Boundaries

- Do not browse for new facts. Review only the supplied evidence and copy.
- Do not change product selection, module order, visibility, assignments, or scenes.
- Do not reject merely because wording differs from a personal style preference.
- Treat `preferredLength` and `maxCharacters` as non-blocking guidance only.
- Warnings may record non-blocking polish; every blocking concern must use severity `error`.
