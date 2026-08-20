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
| `categoryHypotheses` | Array of `{ label, role, categoryIds, reason }`; role is `core`, `pairing`, or `accessory`; `categoryIds` must contain one or more current non-empty catalog leaf category IDs, each owned by only one hypothesis |
| `scenarioHypotheses` | Array of `{ name, shoppingGoal, categoryIds, reason }`; every scenario must reference at least two current catalog category IDs |

The Agent task context includes `language: "en" | "zh"`. Write every Agent-owned
`categoryHypotheses[].label`, category reason, scenario name, shopping goal, and scenario reason in
that requested language. Immutable brand names and catalog product names are the only expected
cross-language exceptions. The runtime must request a new proposal when the user changes language;
it does not translate or reuse a proposal created for another language.

The Agent receives every current catalog product in `context.representativeProducts` (the legacy field
name is retained for protocol compatibility) plus verified category paths and counts. Catalog leaves
are evidence rather than final navigation. The Agent may combine closely related leaves into one
shopper-facing category when that grouping matches the topic and product set; unrelated shopping goals
must remain separate. There is no fixed display-count cap for category navigation. The label may
localize or summarize the verified categories, and the reason must explain the shopper-facing
classification rather than representative-product selection. Omitted categories
remain a review warning and are restored as verified catalog groups by deterministic ProductSelection
rather than disappearing from navigation.
It accepts at most six scenario hypotheses because StartHere remains a bounded editorial module.
Normally propose three to five distinct shopper goals when catalog evidence supports them; two is
the minimum usable set. Scenario names and shopping goals must be unique, and each later scenario
must add at least one verified catalog category not already exhausted by earlier scenarios. Shared
categories are allowed only when the scenario still contributes distinct evidence and enough
products remain for deterministic allocation.
The runtime recomputes category paths, evidence counts, search terms, and evidence references from
CatalogSnapshot. Agent labels, roles, goals, and reasons remain semantic suggestions; they do not
prove product efficacy or change product-to-category membership.

Use a proposal only when deterministic rules leave a real ambiguity or when a resolved core entity
needs reviewable catalog organization. Exact catalog brand and category identity has priority over a
conflicting proposal. Every v1 list value must already appear in the Theme Keyword, product titles,
brand evidence, category evidence, or attribute evidence.

The TopicIntent Module reports field-level results in `proposalReview`. Unknown category IDs,
duplicate category ownership, excess scenario hypotheses, and unsupported
fields are rejected. An Agent must not present `rejectedFields` as accepted conclusions.
