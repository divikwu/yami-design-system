# TOPIC GENERATOR Semantic Proposal contract

`semantic-proposal/v2` is optional, untrusted Agent input for ambiguous shopping language or
catalog-backed organization of a resolved brand/category. It is never catalog evidence, product
membership, or a final ThemeIntent. The runtime continues to accept `semantic-proposal/v1` for replay.

Shared required fields:

| Field | Allowed value |
| --- | --- |
| `schemaVersion` | `semantic-proposal/v2` (`v1` remains replay-compatible) |
| `themeType` | `brand`, `product`, `activity`, or `uncertain` |
| `entityType` | `brand`, `category`, `attribute`, `scenario`, or `unknown` |
| `canonicalEntity` | `null` or an object with a non-empty `label` and optional `id` |
| `shoppingIntent` | `browse-brand`, `find-product`, `assemble-scenario`, or `clarify` |
| `needs` | String array |
| `mustInclude` | String array |
| `mustExclude` | String array |
| `searchTerms` | String array |

Version 2 also requires:

| Field | Contract |
| --- | --- |
| `categoryHypotheses` | Array of `{ label, role, categoryIds, reason }`; role is `core`, `pairing`, or `accessory`; every category ID must exist in current catalog evidence and may be owned by only one hypothesis |
| `scenarioHypotheses` | Array of `{ name, shoppingGoal, categoryIds, reason }`; every scenario must reference at least two current catalog category IDs |

The runtime accepts at most six category hypotheses and six scenario hypotheses. It recomputes
category paths, evidence counts, search terms, and evidence references from CatalogSnapshot. Agent
labels, roles, goals, and reasons remain semantic suggestions; they do not prove product efficacy or
change product-to-category membership.

Use a proposal only when deterministic rules leave a real ambiguity or when a resolved core entity
needs reviewable catalog organization. Exact catalog brand and category identity has priority over a
conflicting proposal. Every v1 list value must already appear in the Theme Keyword, product titles,
brand evidence, category evidence, or attribute evidence.

The TopicIntent Module reports field-level results in `proposalReview`. Unknown category IDs,
duplicate category ownership, excess hypotheses, and unsupported fields are rejected. An Agent must
not present `rejectedFields` as accepted conclusions.
