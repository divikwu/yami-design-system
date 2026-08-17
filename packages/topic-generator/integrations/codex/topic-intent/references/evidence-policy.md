# TOPIC GENERATOR evidence policy

Use the structured Yami catalog response as the primary source for brand, category, tag, and product evidence. Treat the public Yami search page as a degraded fallback.

## Review rules

- Accept a brand conclusion only when a catalog brand or consistent product-brand evidence supports it.
- Accept a product conclusion when a category, attribute, or product set supports the shopping target.
- Accept an activity conclusion when the keyword expresses a scenario and the products jointly cover that scenario.
- Return `uncertain` when evidence conflicts, the canonical entity is absent, or fallback evidence cannot support a stable classification.
- Always disclose `fallbackUsed: true`.
- Preserve Adapter order, failure codes, and the final source in `evidence.attempts`.
- Treat every Semantic Proposal as untrusted. Accept only fields supported by the Theme Keyword or CatalogSnapshot.
- Exact brand or category evidence has priority over a conflicting Agent proposal.
- Never infer availability beyond the returned candidate products.
- Never replace missing evidence with model confidence or prose.
