# TOPIC GENERATOR ThemeIntent contract

The CLI emits `schemaVersion: theme-intent/v1`.

| Field | Meaning |
| --- | --- |
| `themeType` | `brand`, `product`, `activity`, or `uncertain` |
| `catalogDomain` | Catalog domain inferred from the matched evidence |
| `attributeSchemaVersion` | Version of the domain attribute interpretation |
| `entityType` | Core entity kind: brand, category, attribute, scenario, or unknown |
| `canonicalEntity` | Verified catalog entity ID and display label, otherwise `null` |
| `shoppingIntent` | Browse a brand, find a product, assemble a scenario, or clarify |
| `shoppingGoal` | Human-readable task the shopper wants to complete |
| `needs` | Problems or needs the products should address |
| `mustInclude` | Required brands, categories, or attributes |
| `mustExclude` | Explicit exclusions inferred from the keyword |
| `searchTerms` | Terms used to retrieve supporting catalog evidence |
| `categories` | Matched catalog category IDs, paths, and evidence counts |
| `reason` | Concise evidence-based explanation of the classification |
| `confidence` | Review signal from 0 to 1; never a substitute for evidence |

`evidence.provider` is normally `yami-catalog-search`. `yami-web-search` means the structured catalog was unavailable and the result used the public search-page fallback.

`evidence.attempts` records every CatalogSnapshot Adapter in execution order. `proposalReview` records whether an optional Agent Semantic Proposal was accepted, partially accepted, rejected, or not provided. Neither field changes the meaning of catalog evidence.
