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
  "templateRef": "topic-landing/topic@2",
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

The scene-bearing `start-here` example applies only when that exact returned module rule contains
`sceneRange`. A real proposal must contain every module in the exact returned order and satisfy any
returned scene range, including hidden optional modules. When `sceneRange` is absent, use
`scenes: []` and omit `sceneId` from every assignment even if ProductSelection contains themes. A
hidden module uses empty `scenes` and `assignments`, an empty `shoppingGoal`, and a non-empty
reviewable `reason`.

## Validation rules

- Match `keyword`, `site`, `strategyRef`, `templateRef`, `themeIntentDigest`, and
  `productSelectionDigest` exactly.
- Satisfy each rule's required visibility, product count, allowed pools, allowed roles, and optional
  scene count.
- For category-role `@2`, visible StartHere, Popular Picks, Brand Spotlight, and Explore More must
  copy the corresponding `selectionModules[].productIds` exactly and in order.
- Treat the returned rule as the sole scene capability signal. Supply `sceneId` only when the rule
  contains `sceneRange`; module names such as `start-here` never imply scene support. Every
  assignment in a scene-based module must reference a
  proposed scene whose `sourceSceneId` contains the same product. Category-role `@2` must preserve
  every source scene exactly once and copy the complete ordered products from both source groups.
- In a proposal-owned relevance task, prefer distinct products across modules. When reuse is
  intentional, every assignment after that product's first module requires a concise
  `reuseReason`.
- Hero and Shortcuts may reference only products already owned by a ProductSelection module. Include
  a concise `reuseReason` on the later reference. ProductSelection-owned modules may never reuse a
  product; `reuseReason` does not grant permission.
- Hero composition is an Agent judgment within those hard constraints. Use `weeklySalesLabel` as
  ranking evidence and compare the returned title, category, brand, and image URL for representative
  and visual diversity. Do not require different categories when the truthful pool is concentrated,
  and do not infer an undocumented product-family relationship. Explain any lower-ranked choice in
  the module reason.
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
