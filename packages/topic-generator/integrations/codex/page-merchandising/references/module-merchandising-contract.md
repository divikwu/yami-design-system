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
template ref, requested output language, both upstream digests, module order, module rules, deterministic selection-stage
module evidence, source scenes, and frozen candidate products. A proposal cannot add catalog facts
or change a product's pool or role.

When `previousProposalIssues` is present, this is the second and final bounded attempt. It lists the
deterministic review failures from the first proposal; the replacement must correct every issue
without changing immutable inputs.

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
  "visualReview": {
    "schemaVersion": "module-merchandising-visual-review/v1",
    "inspectedProductIds": ["product-1", "product-2"],
    "duplicateGroups": [
      {
        "productIds": ["product-1", "product-2"],
        "reason": "The images and returned identity fields show the same product, size, and pack."
      }
    ]
  },
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
      "reason": "Three core products represent the frozen selection.",
      "scenes": [],
      "assignments": [
        { "productId": "product-1", "selectionReason": "Strong sales anchor." },
        { "productId": "product-2", "selectionReason": "Adds a distinct product type." },
        { "productId": "product-3", "selectionReason": "Completes representative coverage." }
      ]
    },
    {
      "id": "shortcuts",
      "visible": true,
      "shoppingGoal": "Help shoppers enter the topic through verified categories",
      "reason": "Each frozen semantic group has one distinct representative.",
      "scenes": [],
      "assignments": [
        {
          "groupId": "shortcut-cleansing",
          "productId": "product-1",
          "selectionReason": "销量领先的洁面代表商品。",
          "reuseReason": "Shortcuts references the ProductSelection-owned assortment."
        }
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
          "targetProductCount": 4,
          "shoppingGoal": "Build a morning ritual",
          "reason": "The source scene contains the required core and pairing products."
        },
        {
          "id": "evening-ritual",
          "sourceSceneId": "source-scene-2",
          "targetProductCount": 4,
          "shoppingGoal": "Build an evening ritual",
          "reason": "The second source scene supports a distinct evening shopping task."
        }
      ],
      "assignments": [
        { "productId": "product-3", "sceneId": "morning-ritual" },
        { "productId": "product-4", "sceneId": "morning-ritual" },
        { "productId": "product-5", "sceneId": "morning-ritual" },
        { "productId": "product-6", "sceneId": "morning-ritual" },
        { "productId": "product-7", "sceneId": "evening-ritual" },
        { "productId": "product-8", "sceneId": "evening-ritual" },
        { "productId": "product-9", "sceneId": "evening-ritual" },
        { "productId": "product-10", "sceneId": "evening-ritual" }
      ]
    }
  ]
}
```

Omit `visualReview` during the initial text-only pass. When
`context.visualReviewTask.schemaVersion` is
`module-merchandising-visual-review-task/v1`, return the complete corrected proposal and add
`visualReview`. Copy every `context.visualReviewTask.inspectedProductIds` entry exactly once and in
the same order. `duplicateGroups` contains only visually confirmed duplicate listings from those
images; use an empty array when none are confirmed. Each group requires two or more unique product
IDs from one verified brand and a concise evidence reason. Do not group distinct sizes, formulas,
or multipacks. The Runner deterministically retains the highest `soldCount` member of a confirmed
group, falling back to the lowest `sourceRank`, and rejects groups outside the shortlist.

The scene-bearing `start-here` example applies only when that exact returned module rule contains
`sceneRange`. A real proposal must contain every module in the exact returned order and satisfy any
returned scene range, including hidden optional modules. When `sceneRange` is absent, use
`scenes: []` and omit `sceneId` from every assignment even if ProductSelection contains themes. A
hidden module uses empty `scenes` and `assignments`, an empty `shoppingGoal`, and a non-empty
reviewable `reason`.

When a returned rule also contains `productsPerSceneRange`, every visible scene must satisfy that
per-scene product count. Current relevance templates accept two to six scenes with four to sixteen
products each; normally choose three to five when that many distinct, evidence-backed shopper goals
are available. Use four products for focused tasks, six to ten for standard multi-step routines, and
twelve to sixteen only when the source evidence supports broader roles or meaningful choice. Do not
pad a scene with near-duplicates. Current relevance source scenes expose
`minimumRecommendedProducts` and `maximumProducts`; every page scene must declare an integer
`targetProductCount` in that range and assign exactly that many products. Source scenes must be
unique and remain in ProductSelection order.

## Validation rules

- Match `keyword`, `site`, `strategyRef`, `templateRef`, `themeIntentDigest`, and
  `productSelectionDigest` exactly.
- Satisfy each rule's required visibility, product count, allowed pools, allowed roles, and optional
  scene and per-scene product counts.
- For category-role `@2`, visible StartHere, Popular Picks, Brand Spotlight, and Explore More must
  copy the corresponding `selectionModules[].productIds` exactly and in order.
- When ProductSelection supplies Brand Spotlight, an empty group list requires the module to stay
  hidden. Otherwise it contains two to six brand groups with exactly three products each; the
  proposal must make the module visible, copy every product in group order, and set each
  assignment's `groupId` to the exact ProductSelection brand-group ID.
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
- Hero composition is an Agent judgment within those hard constraints. Select three to five
  eligible products when the evidence contains at least three, and assign every selected product to
  Hero. Use `weeklySalesLabel` as ranking evidence and compare the returned title, category, brand,
  and image URL for representative and visual diversity. Do not require different categories when
  the truthful pool is concentrated, and do not infer an undocumented product-family relationship.
  Explain any lower-ranked choice in the module reason.
- Hero assignments must resolve to distinct source image URLs after URL query and fragment removal.
  Repeating the same source image blocks the proposal even when the product IDs differ.
- Every Hero assignment requires a concise `selectionReason` grounded in the returned product
  evidence and written in the task `language`. It explains why that individual product belongs in
  the composition; the module reason explains why the complete set works together.
- When the returned `selectionModules` contains Shortcuts groups, visible Shortcuts must contain
  exactly one assignment for every group, in group order. Each assignment must copy that group's
  exact `id` into `groupId`, choose `productId` from that group's `productIds`, and provide a concise
  `selectionReason` in the task `language`. The deterministic reviewer rejects missing, unknown,
  duplicate, or reordered group IDs, products outside their group, and repeated source image URLs.
  These assignments choose representatives only; they cannot change group labels, membership, or
  order. The complete accepted group sequence also defines the comprehensive-recommendation tabs;
  do not truncate either surface to a fixed display count.
- Keep `shoppingGoal`, module `reason`, scene `reason`, `selectionReason`, and `reuseReason` concise and reviewable.
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
