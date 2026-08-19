# Topic page content proposal contract

## State boundary

```text
ThemeIntent + ready ProductSelectionResult + ready TopicPagePlan v2 + language
  -> TopicPageContentContext
  -> TopicPageContentProposal
  -> deterministic review
  -> TopicPageContentSpec
```

The context contains only visible PagePlan content tasks, the assigned products needed by each
task, PagePlan scenes, eligible ThemeIntent evidence IDs, selected categories, and the applicable
copy policy. A proposal cannot
add tasks, switch components, expose hidden modules, reallocate products, rename scenes, or change
any digest.

Each proposal serves exactly one requested language. `language: "en"` requires English in every
generated copy slot, while `language: "zh"` requires Simplified Chinese; immutable brand and
product names are the only expected cross-language exceptions. Generate and validate a separate
proposal when both locales are needed.

Active `topic-landing/brand@2`, `topic-landing/topic@2`, and
`topic-landing/campaign@2` contexts declare
`copyPolicyRef: "topic-page-copy/evidence-bound@1"`. Their deterministic review checks text script,
character limits, and narrowed evidence scope. Legacy `@1` templates remain replayable under
`topic-page-copy/legacy@1` without applying these new text restrictions to old proposals.

## Component copy slots

| Module | Maintained component | Required generated copy |
| --- | --- | --- |
| `hero` | `ThemeHero` | `title`, `description`, 2–4 `tags` |
| `shortcuts` | `ShortcutRail` | `title`, one `items[].label` per assignment slot |
| `start-here` | `ThemeProductList` | module `title`; `label`, `title`, and `description` for every PagePlan scene |
| `popular-picks` | `ProductList` | `title` |
| `brand-spotlight` | `BrandProductRail` | `title`; campaign brand identity remains catalog-derived |
| `reviews` | `ReviewList` | unavailable unless a future upstream contract supplies verified review records |
| `explore-more` | `ProductList` | `title`, `description` |

The active policy returns these maximum character counts in each task's `copyRules`: module titles
64; descriptions 180; Hero tags, shortcut labels, and scene labels 32; scene titles 72. Count
Unicode characters, not encoded bytes. The runtime returns the rules with the task so an Agent does
not need to copy this table into its own implementation.

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
          "text": "开启你的抹茶日常",
          "evidenceRefs": ["theme-intent:scenario:matcha"]
        },
        "description": {
          "text": "从抹茶到茶具，按已选商品搭配日常所需。",
          "evidenceRefs": ["product:matcha-1", "product:whisk-1"]
        },
        "tags": [
          {
            "text": "日常抹茶",
            "evidenceRefs": ["theme-intent:scenario:matcha"]
          },
          {
            "text": "冲泡搭配",
            "evidenceRefs": ["selected-category:tea-tools"]
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

The example abbreviates the task and scene arrays. A real proposal must contain every returned
task in exact PagePlan order and every required item or scene in exact assignment/scene order.

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

Attach at least one reference to every copy segment. References make the claim reviewable; they do
not authorize facts absent from the referenced artifact.

Wikipedia and other public background sources are not part of this v1 Interface. A future
integration must provide an independent digest-bearing namespace that authorizes conceptual
background only; it must not authorize product, inventory, price, efficacy, rating, or availability
claims.

## Failure and resume contract

A blocked content run classifies deterministic failures instead of requiring callers to parse issue
text:

- `upstream-invalid` rolls back to `module-merchandising`; do not call the Content Agent.
- `proposal-invalid` rolls back only to `content-writing`; preserve the rejected proposal and its
  review in `topic-page-content-attempt/v1`.
- `agent-failed` belongs to the Agent Adapter workflow rather than the deterministic content run;
  its attempt still records the Agent ID, language, and all three input digests.

Resume is explicit and never spends another Agent attempt automatically. Supply the preserved
attempt plus one revised proposal. The Module rechecks the PagePlan, ThemeIntent,
ProductSelection, and language bindings before reviewing the revision. Any binding drift changes
the result to `upstream-invalid`; matching bindings skip the Agent and continue from
`content-writing`.

## Ready output

`topic-page-content-spec/v1` preserves the accepted tasks and all three upstream digests, adds the
requested language, and computes its own SHA-256 digest. The Visual Agent and later QA stages must
bind to the PagePlan and ContentSpec digests instead of rewriting copy or interpreting upstream
intent.
