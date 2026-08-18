# ModuleMerchandising proposal contract

## State boundary

```text
ThemeIntent + ready ProductSelectionResult + PageTemplate
  -> PageMerchandisingTaskContext
  -> ModuleMerchandisingProposal
  -> deterministic review
  -> TopicPagePlan v2
```

The context is immutable input. It contains the complete ThemeIntent, selected categories, exact
template ref, both upstream digests, module order, module rules, deterministic selection-stage
module evidence, source scenes, and frozen candidate products. A proposal cannot add catalog facts
or change a product's pool or role.

Each module rule also names its maintained YAMI component: `ThemeHero`, `ShortcutRail`,
`ThemeProductList`, `ProductList`, `BrandProductRail`, or `ReviewList`. The proposal does not repeat
or override this field; the compiler copies it into PagePlan v2.

## Proposal shape

```json
{
  "schemaVersion": "module-merchandising-proposal/v1",
  "keyword": "Matcha",
  "site": "us",
  "strategyRef": "category-role/landing-page-agent@1",
  "templateRef": "topic-landing/topic@1",
  "themeIntentDigest": "sha256:...",
  "productSelectionDigest": "sha256:...",
  "moduleOrder": [
    "hero",
    "shortcuts",
    "start-here",
    "popular-picks",
    "brand-spotlight",
    "reviews",
    "explore-more"
  ],
  "modules": [
    {
      "id": "hero",
      "visible": true,
      "shoppingGoal": "Introduce the strongest verified topic proposition",
      "reason": "Two core products represent the frozen selection.",
      "scenes": [],
      "assignments": [
        { "productId": "product-1" },
        { "productId": "product-2" }
      ]
    },
    {
      "id": "start-here",
      "visible": true,
      "shoppingGoal": "Help shoppers assemble a complete occasion",
      "reason": "The validated source scene supports this shopper task.",
      "scenes": [
        {
          "id": "morning-ritual",
          "sourceSceneId": "source-scene-1",
          "shoppingGoal": "Build a morning ritual",
          "reason": "The source scene contains the required core and pairing products."
        }
      ],
      "assignments": [
        { "productId": "product-3", "sceneId": "morning-ritual" },
        { "productId": "product-4", "sceneId": "morning-ritual" }
      ]
    }
  ]
}
```

The example abbreviates both `modules` and the scene list. A real proposal must contain every module
in the exact returned order and satisfy the returned scene range, including hidden optional
modules. A hidden module uses empty `scenes` and `assignments`, an empty `shoppingGoal`, and a
non-empty reviewable `reason`.

## Validation rules

- Match `keyword`, `site`, `strategyRef`, `templateRef`, `themeIntentDigest`, and
  `productSelectionDigest` exactly.
- Satisfy each rule's required visibility, product count, allowed pools, allowed roles, and optional
  scene count.
- Supply `sceneId` only in a scene-based module. Every assignment in that module must reference a
  proposed scene whose `sourceSceneId` contains the same product.
- Use each product at most once inside a scene. When a product appears in another module, include a
  concise `reuseReason` on the later assignment.
- Keep `shoppingGoal`, module `reason`, scene `reason`, and `reuseReason` concise and reviewable.
  They are planning rationale, not hidden reasoning or final marketing copy.

## Ready output

`topic-page-plan/v2` copies accepted goals and assignments, records the frozen pool and role for
each slot, and creates stable downstream task IDs:

- `content-<module-id>` for every visible module;
- `asset-<module-id>` for module-level imagery;
- `asset-<module-id>-<scene-id>` for scene imagery;
- `asset-<module-id>-<index>` for per-assignment imagery or one banner per unique assigned brand.

The plan records both upstream digests, and its own digest binds the entire downstream handoff.
The PageContent stage must refer to those digests and content task IDs; the later Visual stage must
do the same for asset task IDs. Neither may reinterpret the Topic or reallocate products.
