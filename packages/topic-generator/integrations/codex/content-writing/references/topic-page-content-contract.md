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

On the automatic Host's second and final content attempt, the same context adds
`revision: topic-page-content-revision/v1`. It contains the previous digest-valid ContentSpec and
the exact blocking review issues. The Content Agent must return a complete replacement proposal,
but should change only the cited copy fields and preserve unaffected copy. Product selection,
PagePlan, BackgroundEvidence, CopyBrief, language, and all input digests remain frozen.

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
the complete Hero remains specific. Definitions, history, and shopping breadth usually work better
in the description, but may enter a natural, useful headline. Use the description to add identity,
context, use value, and supported shopping range without simple repetition; prefer one sentence and
allow two when clarity needs them. A fourth tag is allowed when it adds a distinct supported
direction. Sensory, quality, efficacy, outcome, origin, and cultural claims remain evidence-bound.

Structural headings stay generic by default. `shortcuts`, `popular-picks`, and `brand-spotlight`
titles remain template-owned. Only `explore-more.title`, which appears near the end of the page,
may add one short locale-native topic anchor such as “更多抹茶选择” or “Explore More Matcha.” Do not
repeat the topic across neighboring headings, repeat the Hero, or turn this title into a category
list. Use a concise generic title when the anchor would read unnaturally.

`topicSignature.primaryClaimId` and its optional supporting claim identify preferred context, not
required wording. They may improve specificity, but their context-only scope never proves every
product's origin, performance, or positioning.

The active policy returns locale-specific Hero guidance in the Hero task's `copyRules`:

| Locale | Slot | Preferred length | Hard `maxCharacters` |
| --- | --- | --- | --- |
| `zh` | title | 8–18 characters | 24 |
| `zh` | description | 28–50 characters | 80 |
| `en` | title | 4–8 words and preferably no more than 48 characters | 60 |
| `en` | description | 14–24 words and preferably no more than 140 characters | 180 |

`preferredLength` guides concise generation and review but is not a deterministic rejection by
itself. `maxCharacters` is the hard boundary and counts Unicode characters, not encoded bytes.
When Chinese copy includes an immutable Latin brand name, judge the preferred range by rendered
footprint as well as raw count, while still obeying the hard maximum. The generated Explore More
title targets 4–12 Chinese characters with a hard maximum of 20, or 2–5 English words and
preferably no more than 40 characters with a hard maximum of 48. Other module titles remain at 64;
non-Hero descriptions at 180; Hero tags, shortcut labels, and scene labels at 32; scene titles at
72. The runtime returns these rules with the task and binds them into the CopyBrief so Agents do
not need a private copy of this table.

These slots map to the maintained Topic Landing Page component props. Product titles and brand
names are catalog identities, not generated copy. Hero and scene image alt text belongs to the
independent Visual Agent contract rather than this proposal.

## Proposal shape

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
generation. Agent transport failures, invalid review output, binding drift, or a second failed
review remain blocked and are reported with their owning stage.

## Ready output

`topic-page-content-spec/v1` preserves the accepted tasks and all three upstream digests, adds the
requested language, and computes its own SHA-256 digest. The Visual Agent and later QA stages must
bind to the PagePlan and ContentSpec digests instead of rewriting copy or interpreting upstream
intent.
