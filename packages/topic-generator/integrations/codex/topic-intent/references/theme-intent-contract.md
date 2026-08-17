# TOPIC GENERATOR ThemeIntent contract

The CLI emits `schemaVersion: theme-intent/v2`.

| Field | Meaning |
| --- | --- |
| `themeType` | `brand`, `product`, `activity`, or `uncertain` |
| `catalogDomain` | Catalog domain inferred from the matched evidence |
| `attributeSchemaVersion` | Version of the domain attribute interpretation |
| `entityType` | Core entity kind: brand, category, attribute, scenario, or unknown |
| `canonicalEntity` | Verified catalog entity ID and display label, otherwise `null` |
| `shoppingIntent` | Browse a brand, find a product, assemble a scenario, or clarify |
| `shopperAction` | Primary user action: browse, find, compare, filter, replenish, bundle, gift, or clarify |
| `shoppingGoal` | Human-readable task the shopper wants to complete |
| `needs` | Problems or needs the products should address |
| `conditions` | Modifiers and usage conditions separated from the core entity |
| `mustInclude` | Required brands, categories, or attributes |
| `mustExclude` | Explicit exclusions inferred from the keyword |
| `searchTerms` | Terms used to retrieve supporting catalog evidence |
| `categories` | Matched catalog category IDs, paths, and evidence counts |
| `constraints` | Every retrieval constraint with verified, unverified, or rejected status and evidence IDs |
| `evidenceRefs` | Structured catalog or fallback evidence referenced by constraints and candidates |
| `candidates` | Ranked alternative interpretations retained for review |
| `decision` | Selected candidate, evidence level, candidate margin, and Agent-review requirement |
| `reason` | Concise evidence-based explanation of the classification |
| `confidence` | Legacy rule score retained for compatibility; never present it as calibrated accuracy |

`evidence.provider` is normally `yami-catalog-search`. `yami-web-search` means the structured catalog was unavailable and the result used the public search-page fallback.

`evidence.attempts` records every CatalogSnapshot Adapter in execution order. `proposalReview` records whether an optional Agent Semantic Proposal was accepted, partially accepted, rejected, or not provided. Neither field changes the meaning of catalog evidence.
