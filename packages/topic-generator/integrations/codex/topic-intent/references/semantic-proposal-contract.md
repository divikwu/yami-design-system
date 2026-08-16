# TOPIC GENERATOR Semantic Proposal contract

`semantic-proposal/v1` is optional, untrusted Agent input for ambiguous shopping language. It is never a catalog fact or final ThemeIntent.

Required fields:

| Field | Allowed value |
| --- | --- |
| `schemaVersion` | `semantic-proposal/v1` |
| `themeType` | `brand`, `product`, `activity`, or `uncertain` |
| `entityType` | `brand`, `category`, `attribute`, `scenario`, or `unknown` |
| `canonicalEntity` | `null` or an object with a non-empty `label` and optional `id` |
| `shoppingIntent` | `browse-brand`, `find-product`, `assemble-scenario`, or `clarify` |
| `needs` | String array |
| `mustInclude` | String array |
| `mustExclude` | String array |
| `searchTerms` | String array |

Use a proposal only when deterministic rules leave a real ambiguity. Every proposed list value must already appear in the Theme Keyword, product titles, brand evidence, category evidence, or attribute evidence.

The TopicIntent Module reports field-level results in `proposalReview`. An Agent must not present `rejectedFields` as accepted conclusions. Exact catalog brand and category evidence has priority over conflicting proposals.
