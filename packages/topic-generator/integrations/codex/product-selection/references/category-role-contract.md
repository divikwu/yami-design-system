# Category-role proposal contract

Create exactly one `category-role-proposal/v1` for `category-role/landing-page-agent@1`.

```json
{
  "schemaVersion": "category-role-proposal/v1",
  "keyword": "Matcha",
  "strategyRef": "category-role/landing-page-agent@1",
  "taxonomyDigest": "sha256:...",
  "categories": [
    {
      "categoryId": "1691",
      "role": "core",
      "reason": "Direct leaf category for shoppers seeking matcha products."
    }
  ]
}
```

## Role semantics

- `core`: products the shopper primarily intends to buy for the keyword.
- `pairing`: products consumed or used together with the core purchase in the same shopping scenario.
- `accessory`: tools, vessels, or supporting goods that enable or improve use of the core purchase.

Select 10 unique enabled taxonomy categories. Prefer level-3 leaf categories and avoid selecting both a parent and its selected child.

Target `core:pairing:accessory` is `5:3:2`. The runtime also accepts only these target-repository elastic distributions:

- `4:4:2`
- `3:4:3`
- `5:4:1`
- `6:3:1`
- `3:3:4`
- `6:4:0`

Order categories as core, then pairing, then accessory. Downstream Popular Picks and Explore More preserve this category order.

## Evidence rules

- Read the entire enabled taxonomy context before selecting.
- Copy category IDs exactly; names in the reason are explanatory only.
- Bind `taxonomyDigest` to the runtime-provided value.
- Do not create categories, use product-title heuristics, or use ThemeIntent categories as a substitute for the full taxonomy.
- Keep each reason concise and externally reviewable. Do not provide chain-of-thought.
