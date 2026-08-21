# Topic page content proposal contract

## State boundary

```text
ThemeIntent + BackgroundEvidence + AudienceContext + ready ProductSelectionResult
  + ready TopicPagePlan v2 + language
  -> TopicPageContentContext
  -> TopicPageCopyBrief v2
  -> TopicPageContentProposal
  -> deterministic review
  -> TopicPageContentSpec
  -> independent Content Review
  -> approved | one bounded rewrite -> independent Content Review
```

The context contains only visible PagePlan content tasks, the assigned products needed by each
task, PagePlan scenes, eligible ThemeIntent and BackgroundEvidence IDs, selected categories, the
novice audience contract, a digest-bound CopyBrief, and the applicable copy policy. A proposal cannot
add tasks, switch components, expose hidden modules, reallocate products, rename scenes, or change
any digest.

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

Each proposal serves exactly one requested language. `language: "en"` requires English in every
generated copy slot, while `language: "zh"` requires Simplified Chinese; immutable brand and
product names are the only expected cross-language exceptions. Generate and validate a separate
proposal when both locales are needed.

Newcomer contexts for active `topic-landing/brand@2`, `topic-landing/topic@2`, and
`topic-landing/campaign@2` templates declare
`copyPolicyRef: "topic-page-copy/novice-guided@2"`. Their deterministic review checks text script,
character limits, narrowed evidence scope, and CopyBrief bindings. Older active runs remain
replayable under `topic-page-copy/evidence-bound@1`; legacy `@1` templates remain replayable under
`topic-page-copy/legacy@1` without applying these new text restrictions to old proposals.

`background:<claim-id>` may cite only IDs in `eligibleBackgroundEvidenceClaimIds`. It supports
newcomer orientation and topic context only. It cannot authorize ingredient, benefit, efficacy,
popularity, inventory, discount, rating, or customer-outcome claims.

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
      "taskId": "content-shortcuts",
      "moduleId": "shortcuts",
      "component": "ShortcutRail",
      "copy": {
        "title": {
          "text": "按品类快速浏览",
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

Attach at least one reference to every copy segment. References make the claim reviewable; they do
not authorize facts absent from the referenced artifact.

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
