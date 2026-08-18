# TOPIC GENERATOR evidence policy

Use the structured Yami catalog response as the primary source for brand, category, tag, and product evidence. Treat the public Yami search page as a degraded fallback.

## Review rules

- Accept a brand conclusion only when a catalog brand or consistent product-brand evidence supports it.
- Accept a product conclusion when a category, attribute, or product set supports the shopping target.
- When multiple categories share a generic alias, prefer the category with stronger product coverage in the current CatalogSnapshot before using path depth or label length.
- Accept an activity conclusion automatically only when the keyword expresses a scenario and at least two categories have functional support through category paths, product category fields, or approved bilingual aliases. Product-title or brand matches alone remain low-evidence thematic leads that require semantic review. Category count alone and generic modifiers such as season or size are insufficient.
- Return `uncertain` when evidence conflicts, the canonical entity is absent, or fallback evidence cannot support a stable classification.
- Always disclose `fallbackUsed: true`.
- Reject generic structured recommendations for ordinary Latin-script product queries when title, brand, and product-category fields do not cover enough normalized keyword terms.
- Accept public-search fallback products only when their title or brand matches a normalized keyword term. Treat a zero-match page as `no_products`, not as generic catalog evidence.
- Preserve Adapter order, failure codes, and the final source in `evidence.attempts`.
- Review `snapshot.quality` before using product evidence. Treat duplicate IDs, rejected products, missing required fields, or keyword mismatches as source-quality facts; never repair them in an Agent proposal.
- Treat every Semantic Proposal as untrusted. Accept only fields supported by the Theme Keyword or CatalogSnapshot.
- Exact brand or category evidence has priority over a conflicting Agent proposal.
- Rank an accepted scenario proposal with the catalog candidates. Keep the result ambiguous when the leading margin remains below the decision threshold.
- Treat Wikipedia and other public background sources as separate semantic context. Their URLs and Adapter attempts are review evidence, but they never verify a Yami product condition.
- Never infer availability beyond the returned candidate products.
- Never replace missing evidence with model confidence or prose.
