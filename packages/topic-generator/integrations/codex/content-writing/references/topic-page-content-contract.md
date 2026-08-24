# Topic page content proposal contract

## State boundary

```text
ThemeIntent + BackgroundEvidence + AudienceContext + ready ProductSelectionResult
  + ready TopicPagePlan v2 + language
  -> TopicPageContentContext
  -> TopicPageCopyBrief v3
  -> TopicPageContentProposal
  -> deterministic review
  -> TopicPageContentSpec
  -> independent Content Review
  -> approved | one bounded rewrite -> independent Content Review
```

For an automatic first content pass that includes Hero or Start Here, the Host uses this bounded
variant before ContentSpec compilation:

```text
TopicPageContentContext + candidateGeneration(count=5, targets=[hero,start-here])
  -> one CandidateSetProposal (shared non-target tasks + five target-module packages)
  -> deterministic validation of every complete candidate
  -> independent module-package selection
  -> one TopicPageContentProposal
  -> TopicPageContentSpec
```

Candidate generation does not create five pages or change PagePlan. One Agent response contains
five alternative packages only for the declared target modules. Non-target tasks are generated
once and preserved. The selector may choose Hero and Start Here from different candidates and may
replace a complete Start Here scene with the same `sceneId` from another candidate. It may not
splice fields inside Hero, a scene, or any other module package.

The context contains only visible PagePlan content tasks, the assigned products needed by each
task, PagePlan scenes, eligible ThemeIntent and BackgroundEvidence IDs, selected categories, the
novice audience contract, a digest-bound CopyBrief, and the applicable copy policy. Current v3
briefs add a template-resolved `heroStrategy`, preferred context-only `topicSignature`, and
`localizationStrategy`; v2 briefs remain valid replay inputs. A proposal cannot
add tasks, switch components, expose hidden modules, reallocate products, rename scenes, or change
any digest.

Some tasks also contain localized `templateCopy`. Those values are stable module chrome owned by
the Topic template. The Content Agent must copy them verbatim into the matching slots; it generates
only the remaining task copy.

When an automatic Host receives an invalid first proposal, the same frozen context adds
`proposalRevision: topic-page-content-proposal-revision/v1`. It contains that proposal and the
exact deterministic validation issues. The Content Agent gets one final proposal attempt and must
replace only invalid values with IDs and copy allowed by the returned context. A second invalid
proposal remains blocked. In candidate-generation mode the previous proposal and replacement are
both complete candidate-set proposals, and all five candidates are validated again before
selection.

On the automatic Host's second and final content attempt, the same context adds
`revision: topic-page-content-revision/v1`. It contains the previous digest-valid ContentSpec and
the exact blocking review issues. The Content Agent must return a complete replacement proposal,
but should change only the cited copy fields and preserve unaffected copy. Product selection,
PagePlan, BackgroundEvidence, CopyBrief, language, and all input digests remain frozen.

When `revision.localizationReference` is present, it contains the already-reviewed primary-locale
ContentSpec. Matching module IDs and scene IDs must preserve the same shopper need, proposition,
and decision in natural target-locale writing. This is semantic alignment rather than literal
translation.

The context also carries a machine-readable `claimPolicy`. It states that every claim must be
explicit in the cited artifact, evidence references authorize scope only, and planning goals do
not authorize claims. Ingredient, benefit, efficacy, popularity, inventory, discount, rating, and
customer-outcome claims therefore require explicit upstream evidence; attaching an in-scope ID is
not enough by itself.

Each proposal serves exactly one requested language. `language: "en"` requires natural English in
every generated copy slot, while `language: "zh"` requires Simplified Chinese; immutable brand and
product names are the only expected cross-language exceptions. Generate and validate a separate
proposal when both locales are needed. Both runs preserve the same ThemeIntent, ProductSelection,
PagePlan, proposition, and evidence boundaries, while wording is adapted naturally for each locale
rather than translated word for word.

The managed Web Host requests both locales during one content milestone and stores the two
independently reviewed results under `contentByLanguage`. This orchestration does not change the
single-language proposal contract or permit mixed-language copy.

Newcomer contexts for active `topic-landing/brand@2`, `topic-landing/topic@2`, and
`topic-landing/campaign@2` templates declare
`copyPolicyRef: "topic-page-copy/novice-guided@3"`. Their deterministic review checks text script,
character limits, narrowed evidence scope, and CopyBrief bindings. Older active runs remain
replayable under `topic-page-copy/novice-guided@2` or `topic-page-copy/evidence-bound@1`; legacy
`@1` templates remain replayable under `topic-page-copy/legacy@1` without applying these new text
restrictions to old proposals.

`background:<claim-id>` may cite only IDs in `eligibleBackgroundEvidenceClaimIds`. It supports
newcomer orientation and topic context only. It cannot authorize ingredient, benefit, efficacy,
popularity, inventory, discount, rating, or customer-outcome claims.

## Component copy slots

| Module | Maintained component | Required generated copy |
| --- | --- | --- |
| `hero` | `ThemeHero` | `title`, `description`, 2–4 `tags` |
| `shortcuts` | `ShortcutRail` | template-owned `title`; one generated `items[].label` per assignment slot |
| `start-here` | `ThemeProductList` | generated whole-topic `title`; generated `label`, `title`, and `description` for every PagePlan scene |
| `popular-picks` | `ProductList` | template-owned `title`; one locale-native `groups[].label` per returned frozen group |
| `brand-spotlight` | `BrandProductRail` | template-owned `title`; campaign brand identity remains catalog-derived |
| `reviews` | `ReviewList` | unavailable unless a future upstream contract supplies verified review records |
| `explore-more` | `ProductList` | one generated compact `title`; template-owned `description`; one locale-native `groups[].label` per returned frozen group |

Within the returned limits, Hero copy targets one clear, user-facing proposition and preferably
2–3 short tags. Follow the returned strategy without forcing a sentence template: Brand may use a
position, idea, distinction, or routine; Topic may use an experience, use, way to enjoy, or shopping
inspiration; Campaign may use an occasion's atmosphere, emotion, ritual, or concrete task. A title
may be a positioning line, statement, action, emotion, or question and may use a general verb when
the complete Hero remains specific. Brand headlines normally include the canonical brand name once
when that treatment is natural and concise; Topic and Campaign Heroes keep a natural keyword or
locale-specific topic anchor visible across the headline-description pair when useful. These are
candidate-selection preferences, not deterministic rejection rules. Definitions, history, and shopping breadth usually work better
in the description, but may enter a natural, useful headline. Use the description to add identity,
context, use value, and supported shopping range without simple repetition; prefer one sentence and
allow two when clarity needs them. A fourth tag is allowed when it adds a distinct supported
direction. Sensory, quality, efficacy, outcome, origin, and cultural claims remain evidence-bound.
Hero tags are browsing directions or category labels, not an inferred routine order. Do not use
first, next, then, last, “先”, “再”, “最后”, or “补充” to imply a sequence unless the cited evidence
explicitly establishes it.

For Brand category orientation, prefer the most precise truthful level supported by the bound
evidence. When one precise category clearly represents the brand, prefer it in the headline. For a
multi-category brand, do not falsely narrow it to one category; use the narrowest accurate supported
umbrella category or identity. If no umbrella identity is supported, keep the brand and distinction
in the headline and use the description, tags, and category navigation for a few representative
categories. Never turn the headline into a full taxonomy. This preference guides candidate
generation and selection only; omission or a broader natural treatment is never a structural gate.

For an unfamiliar Brand audience, the `brand-position` candidate should form a compact
brand-positioning capsule across the Hero pair: canonical brand name, supported category or identity
context, one evidence-backed distinction, and useful shopper value. This is a preferred execution,
not a required colon construction or deterministic gate. A comparably supported positioning pair
should rank above a more abstract concept when it orients the newcomer more clearly. The
brand-position candidate should normally let the headline itself name the brand, category or identity, and distinction when
that reads naturally; do not substitute abstract wrapper labels such as brand promise, concept,
approach, “主张,” “构思,” or “视角” for the actual distinction. Chinese positioning headlines may
prefer a colon when it prevents stacked analytical nouns, but the punctuation remains optional.
Use the description for two or three supported shopper needs or choice benefits rather than a
category inventory. Brand tags
prefer distinct supported axes such as signature ingredient or concept, formulation or position,
and shopper need or category. `Effective` / “有效” and similar quality or efficacy language requires
explicit evidence; absent that evidence, use neutral targeted or need-led wording rather than
blocking generation.

Structural headings stay generic by default. `shortcuts`, `popular-picks`, and `brand-spotlight`
titles remain template-owned. Only `explore-more.title`, which appears near the end of the page,
may add one short locale-native topic anchor such as “更多抹茶选择” or “Explore More Matcha.” Do not
repeat the topic across neighboring headings, repeat the Hero, or turn this title into a category
list. Use a concise generic title when the anchor would read unnaturally.

`topicSignature.primaryClaimId` and its optional supporting claim identify preferred context, not
required wording. They may improve specificity, but their context-only scope never proves every
product's origin, performance, or positioning.

The active policy returns locale-specific Hero guidance in the Hero task's `copyRules`:

| Locale | Slot | Preferred length | Recommended `maxCharacters` ceiling |
| --- | --- | --- | --- |
| `zh` | title | 8–18 characters | 24 |
| `zh` | description | 28–50 characters | 80 |
| `en` | title | 4–8 words and preferably no more than 48 characters | 60 |
| `en` | description | 14–24 words and preferably no more than 140 characters | 180 |

`preferredLength` and `maxCharacters` guide concise generation and review but are not deterministic
rejection rules. `maxCharacters` is a recommended layout ceiling and counts Unicode characters,
not encoded bytes. When Chinese copy includes an immutable Latin brand name, judge the preferred
range by rendered footprint as well as raw count. The generated Explore More title targets 4–12
Chinese characters with a recommended ceiling of 20, or 2–5 English words and preferably no more
than 40 characters with a recommended ceiling of 48.

The active policy also returns card-fit Start Here scene guidance:

| Locale | Slot | Preferred length | Recommended `maxCharacters` ceiling |
| --- | --- | --- | --- |
| `zh` | scene title | 4–10 characters | 12 |
| `zh` | scene description | 14–28 characters | 40 |
| `en` | scene title | 3–4 words and preferably no more than 26 characters | 30 |
| `en` | scene description | 8–12 words and preferably no more than 72 characters | 84 |

Use the scene title for one compact decision phrase and the description for one short sentence
that adds the key comparison or next step. Do not enumerate every category already visible in the
product row merely because the recommended ceiling has room. Other module titles remain at 64;
other generic descriptions at 180; Hero tags, shortcut labels, and scene labels at 32. The runtime
returns these rules with the task and binds them into the CopyBrief so Agents do not need a private
copy of this table.

These slots map to the maintained Topic Landing Page component props. Product titles and brand
names are catalog identities, not generated copy. Hero and scene image alt text belongs to the
independent Visual Agent contract rather than this proposal.

## Proposal shape

When `context.candidateGeneration` is present, return this outer shape instead of the single
proposal shown below. The abbreviated `tasks` arrays must contain complete task proposals:

```json
{
  "schemaVersion": "topic-page-content-candidate-set-proposal/v1",
  "keyword": "Matcha",
  "site": "us",
  "language": "zh",
  "topicPagePlanDigest": "sha256:...",
  "themeIntentDigest": "sha256:...",
  "productSelectionDigest": "sha256:...",
  "targetModuleIds": ["hero", "start-here"],
  "sharedTasks": [
    { "taskId": "content-shortcuts", "moduleId": "shortcuts", "component": "ShortcutRail", "copy": {} }
  ],
  "candidates": [
    {
      "id": "candidate-1",
      "directionId": "candidate-1",
      "tasks": [
        { "taskId": "content-hero", "moduleId": "hero", "component": "ThemeHero", "copy": {} },
        { "taskId": "content-start-here", "moduleId": "start-here", "component": "ThemeProductList", "copy": {} }
      ]
    }
  ]
}
```

Return exactly the five requested candidate IDs and directions in order. Each candidate contains
every target module exactly once; `sharedTasks` contains every non-target task exactly once. The
Host rejects missing, extra, misordered, digest-drifted, mixed-language, or evidence-invalid
packages before the selector sees them. Exact duplicate packages remain usable but receive an
advisory warning and weaker selection preference.

Every returned direction includes a machine-readable `focus` and a plain-language `objective`.
Execute both. Brand directions intentionally cover five different frames: brand position,
signature concept, routine role, need-led choice, and editorial discovery. Do not turn those into
five synonymous versions of category browsing. When natural and concise, each Brand candidate
normally includes the canonical brand name once in its Hero headline; omission remains advisory
and never invalidates a structurally sound package. The Brand position direction should execute the
brand-positioning capsule described above, while signature concept may use an explicitly supported
signature ingredient or brand term. Hero copy must remain customer-facing rather than
describing page entry points or information architecture, and it must not repeat the complete
ShortcutRail or Start Here inventory.

```json
{
  "schemaVersion": "topic-page-content-proposal/v1",
  "keyword": "Matcha",
  "site": "us",
  "language": "zh",
  "topicPagePlanDigest": "sha256:...",
  "themeIntentDigest": "sha256:...",
  "productSelectionDigest": "sha256:...",
  "tasks": [
    {
      "taskId": "content-hero",
      "moduleId": "hero",
      "component": "ThemeHero",
      "copy": {
        "title": {
          "text": "找到你的抹茶享用方式",
          "evidenceRefs": ["theme-intent:scenario:matcha", "product:matcha-1"]
        },
        "description": {
          "text": "抹茶是细磨绿茶粉，从传统点茶、便捷冲饮到料理用粉，可按形态与用途比较不同选择。",
          "evidenceRefs": ["background:claim:matcha-identity", "product:matcha-1", "product:culinary-matcha-1"]
        },
        "tags": [
          {
            "text": "纯抹茶粉",
            "evidenceRefs": ["product:matcha-1"]
          },
          {
            "text": "冲饮选择",
            "evidenceRefs": ["product:matcha-drink-1"]
          },
          {
            "text": "烘焙料理",
            "evidenceRefs": ["product:culinary-matcha-1"]
          }
        ]
      }
    },
    {
      "taskId": "content-shortcuts",
      "moduleId": "shortcuts",
      "component": "ShortcutRail",
      "copy": {
        "title": {
          "text": "精选分类",
          "evidenceRefs": ["selected-category:tea"]
        },
        "items": [
          {
            "slotId": "shortcuts-1",
            "label": {
              "text": "抹茶粉",
              "evidenceRefs": ["product:matcha-1"]
            }
          }
        ]
      }
    },
    {
      "taskId": "content-start-here",
      "moduleId": "start-here",
      "component": "ThemeProductList",
      "copy": {
        "title": {
          "text": "从这里开始搭配",
          "evidenceRefs": ["scene:morning-ritual"]
        },
        "scenes": [
          {
            "sceneId": "morning-ritual",
            "label": {
              "text": "晨间仪式",
              "evidenceRefs": ["scene:morning-ritual"]
            },
            "title": {
              "text": "一套配齐晨间抹茶",
              "evidenceRefs": ["scene:morning-ritual", "product:matcha-1"]
            },
            "description": {
              "text": "按场景中的茶粉、搭配和茶具完成冲泡。",
              "evidenceRefs": ["scene:morning-ritual", "product:whisk-1"]
            }
          }
        ]
      }
    }
  ]
}
```

The example abbreviates the task, item, and scene arrays. A real proposal must contain every
returned task in exact PagePlan order and every required item or scene in exact assignment/scene
order. Every shortcut item must copy the exact `slotId` from the matching PagePlan assignment;
array position alone is not a slot binding.

## Evidence namespaces and scope

- `theme-intent:<evidence-id>` — require an exact ID from
  `eligibleThemeIntentEvidenceIds`. For the active policy this is limited to the selected
  ThemeIntent candidate and verified constraints; another ID may exist in the full audit record
  without being eligible for content claims.
- `selected-category:<category-id>` — require an exact selected-category ID represented by an
  assigned product in the current module under the active policy.
- `product:<assigned-product-id>` — require an assignment in the current module. Item labels may
  cite only the product in their own slot; scene copy may cite only products in that scene.
- `scene:<module-scene-id>` — require a PagePlan scene in the current module. Scene fields may cite
  only their own scene.

Attach at least one reference to every copy segment. For template-owned copy, the reference binds
the label to its visible module rather than proving a factual claim. References make generated
claims reviewable; they do not authorize facts absent from the referenced artifact.

Public background sources enter only through the independent digest-bound BackgroundEvidence
bundle. Brand topics prioritize the official brand site and may use Wikipedia only as a secondary
neutral source; cultural topics require a named authoritative institution or Wikipedia. These
sources authorize conceptual background only and never product, inventory, price, efficacy,
rating, or availability claims.

## Failure and resume contract

A blocked content run classifies deterministic failures instead of requiring callers to parse issue
text:

- `upstream-invalid` rolls back to `module-merchandising`; do not call the Content Agent.
- `proposal-invalid` rolls back only to `content-writing`; preserve the rejected proposal and its
  review in `topic-page-content-attempt/v1`.
- `agent-failed` belongs to the Agent Adapter workflow rather than the deterministic content run;
  its attempt still records the Agent ID, language, and all three input digests.

An explicit CLI or caller-managed resume still supplies the preserved attempt plus one revised
proposal. The Module rechecks the PagePlan, ThemeIntent, ProductSelection, and language bindings;
matching bindings skip the Agent and continue from `content-writing`.

The automatic Host may spend exactly one additional Content Agent attempt when the independent
review returns `content-quality` / `revision-required`. It passes the previous ContentSpec and
structured review issues through `context.revision`, then reviews the replacement once more. It
does not rerun ThemeIntent, BackgroundEvidence, product selection, PageMerchandising, or visual
generation. A failed optional rewrite, invalid semantic review output, Agent review transport
failure, or a second failed review is downgraded to advisory warnings and the latest structurally
valid ContentSpec continues. Digest or immutable binding drift remains blocked because the Host can
no longer prove which upstream artifacts the content belongs to.

## Ready output

`topic-page-content-spec/v1` preserves the accepted tasks and all three upstream digests, adds the
requested language, and computes its own SHA-256 digest. The Visual Agent and later QA stages must
bind to the PagePlan and ContentSpec digests instead of rewriting copy or interpreting upstream
intent.
