# Product-semantic proposal contract

Create exactly one `product-semantic-proposal/v1` only when ProductSelection returns
`needs-product-semantic-proposal` for `relevance/intent-themes@5`.

```json
{
  "schemaVersion": "product-semantic-proposal/v1",
  "keyword": "Matcha",
  "strategyRef": "relevance/intent-themes@5",
  "groups": [
    {
      "id": "matcha-powders",
      "label": "Matcha powders",
      "productIds": ["product-1", "product-2"],
      "reason": "Products sold as matcha powder for whisking or recipes."
    },
    {
      "id": "matcha-snacks",
      "label": "Matcha snacks",
      "productIds": ["product-3", "product-4"],
      "reason": "Ready-to-eat snacks whose primary flavor is matcha."
    }
  ],
  "scenes": [
    {
      "id": "prepare-matcha",
      "name": "Prepare matcha at home",
      "shoppingGoal": "Choose matcha powder and complementary preparation products.",
      "groupIds": ["matcha-powders"],
      "reason": "The referenced products form one coherent preparation task."
    },
    {
      "id": "matcha-treats",
      "name": "Matcha treats",
      "shoppingGoal": "Browse ready-to-eat matcha snacks and sweets.",
      "groupIds": ["matcha-snacks"],
      "reason": "The referenced products serve an immediate snacking goal."
    }
  ]
}
```

## Rules

- Copy `keyword` and `strategyRef` exactly from the requested run.
- Use only product IDs present in `context.products`; classify every returned product exactly once.
- Create at least two materially distinct groups. Do not split one product type only to satisfy the
  minimum, and do not use packaging size or minor flavor variants as the sole distinction.
- Keep labels, shopping goals, and reasons in `context.language`. Product and brand names may remain
  unchanged.
- Preserve facts and source order. The runtime, not the Agent, sorts products by `sourceRank`.
- Create two to six shopping scenes. Each scene must reference known group IDs providing at least
  four distinct products. Groups may contain more than 16 products: the runtime sorts candidates by
  sourceRank and displays at most 16 per scene. Do not split coherent groups for this display limit
  or reuse the same group across scenes.
- This stage uses complete textual product evidence. Image and product URLs are omitted and aliases
  already present in title, brand, or category fields are deduplicated; no products are sampled away.
  Image comparison belongs to the later bounded duplicate-review step after textual candidate narrowing.
- Do not retrieve products, invent IDs or catalog facts, replace a weak candidate, or emit page copy.
- The runtime removes accidental repeated assignments from later groups and retains unassigned
  verified products in a visible More to Explore group, recording both corrections as review
  warnings. Unknown IDs, invalid group identity, and invalid scenes still reject the proposal.
- In automatic mode, a rejected proposal may be returned once in `context.repair`. Use its exact
  issues to create one complete replacement proposal; do not return a patch or a third attempt.
