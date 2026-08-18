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
task, PagePlan scenes, verified ThemeIntent evidence, and selected categories. A proposal cannot
add tasks, switch components, expose hidden modules, reallocate products, rename scenes, or change
any digest.

Each proposal serves exactly one requested language. `language: "en"` requires English in every
generated copy slot, while `language: "zh"` requires Simplified Chinese; immutable brand and
product names are the only expected cross-language exceptions. Generate and validate a separate
proposal when both locales are needed.

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

- `theme-intent:<evidence-id>` — require an exact ID from `themeIntent.evidenceRefs`.
- `selected-category:<category-id>` — require an exact returned selected-category ID.
- `product:<assigned-product-id>` — require an assignment in the current module. Item labels may
  cite only the product in their own slot; scene copy may cite only products in that scene.
- `scene:<module-scene-id>` — require a PagePlan scene in the current module. Scene fields may cite
  only their own scene.

Attach at least one reference to every copy segment. References make the claim reviewable; they do
not authorize facts absent from the referenced artifact.

## Ready output

`topic-page-content-spec/v1` preserves the accepted tasks and all three upstream digests, adds the
requested language, and computes its own SHA-256 digest. The Visual Agent and later QA stages must
bind to the PagePlan and ContentSpec digests instead of rewriting copy or interpreting upstream
intent.
