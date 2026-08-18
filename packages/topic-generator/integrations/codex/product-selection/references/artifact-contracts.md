# Product-selection artifacts and SceneProposal

## State sequence

```text
CatalogTaxonomySnapshot
  -> CategoryRoleProposal
  -> CatalogCandidateSnapshot
  -> SceneProposal
  -> ProductSelectionResult
  -> PagePlan
```

Every snapshot is immutable and SHA-256 bound. If the parser reports a digest mismatch, discard the changed copy and return to the owning stage.

Each `catalog-taxonomy-snapshot/v1` category includes `id`, `parentId` (a category ID or `null`), `label`, `aliases`, `path`, `level`, and `enabled`. The runtime rejects missing parents, cyclic hierarchies, and CategoryRole proposals that select both an ancestor and its descendant.

The target repository TSV importer requires the columns `category_id`, `category_name`,
`category_ename`, `parent_category_id`, and `level`. Parent `0` becomes `null`; matching the target
tree builder, a missing parent also promotes that row to a root. English names are canonical labels
and distinct local names become aliases. Do not pass partial TSV excerpts.

## Candidate retrieval

After a CategoryRoleProposal is accepted, the runtime—not the Agent—executes:

- 10 selected-category queries, each `limit=100`, `sort=featured`;
- one keyword discovery query, `limit=200`, `sort=sold`.

The returned `catalog-candidate-snapshot/v1` contains Adapter attempts, category product IDs, discovery product IDs, normalized products, and its digest. Preserve the whole object for the next CLI call.

## SceneProposal

Create 4–6 scenes with exactly two product groups per scene:

```json
{
  "schemaVersion": "scene-proposal/v1",
  "keyword": "Matcha",
  "strategyRef": "category-role/landing-page-agent@1",
  "candidateSnapshotDigest": "sha256:...",
  "scenes": [
    {
      "id": "daily-ritual",
      "name": "Daily ritual",
      "title": "Build a daily matcha ritual",
      "description": "A concise, shopper-facing scene description.",
      "productGroups": [
        {
          "core": "core-product-id",
          "pairing": "pairing-product-id",
          "accessory": "accessory-product-id"
        },
        {
          "core": "another-core-id",
          "pairing": null,
          "accessory": null
        }
      ]
    }
  ]
}
```

Each group requires `core`; `pairing` and `accessory` may be `null`. Use only returned candidate IDs, and place each product in its validated role. Scene names, titles, and descriptions must be non-empty and shopper-facing.

## Deterministic selection-stage output rules

The runtime applies the target repository's rules after Scene acceptance:

- Popular Picks: first five core categories, up to 10 sold products each.
- Brand Spotlight: target 3 core, 2 pairing, 1 accessory brands; 3 products per real `brandId`; fill shortages by role priority.
- Explore More: target 3 pairing and 2 accessory categories; prefer discovery-pool products and fall back to the category pool only when a discovery category is absent; up to 18 products per category.
- Global dedupe priority: Scene, Popular Picks, Brand Spotlight, Explore More.

Do not implement these rules in the ProductSelection proposal. Treat these groups as deterministic,
deduplicated selection evidence. A later PageMerchandising proposal may arrange frozen products into
the final PagePlan v2 modules, but it cannot retrieve replacements or change roles and pools.
