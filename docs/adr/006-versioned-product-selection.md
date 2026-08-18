# ADR 006 — Versioned ProductSelection and category-role parity

## Status

Accepted for implementation on 2026-08-18. This ADR refines ADR 004's planning boundary; ADR 005's standalone-host decision remains unchanged.

## Context

TOPIC GENERATOR needs more than one reusable product-selection strategy. The existing planner mixed selection, inferred category roles from product titles, localized presentation, and module planning. That made a strategy difficult to version or share and did not match the reference `StoneNan/LandingPageAgent` workflow, where an Agent selects taxonomy categories before deterministic catalog retrieval and module cleanup.

The reference workflow also separates semantic and deterministic work: category and scene choices need language understanding, while HTTP queries, sorting, quotas, brand grouping, fallback, and global deduplication are rule-bound. Its direct production-database category script and unlicensed implementation cannot be copied into this runtime.

## Decision

- Add a standalone `ProductSelection` Module between `CatalogSnapshot`/`ThemeIntent` and `PagePlan`.
- Represent every strategy as an immutable `SelectionStrategyConfig` referenced by `<id>@<version>`. Built-in refs are `relevance/default@1` and `category-role/landing-page-agent@1`.
- Keep one Product Agent. A Codex Skill or Kiro Agent is the calling convention; it is not the strategy implementation.
- For category-role, the Agent may create only two untrusted semantic inputs: `CategoryRoleProposal` and `SceneProposal`.
- Require a complete, digest-bearing `CatalogTaxonomySnapshot`. Product titles, search aggregations, and ThemeIntent categories cannot substitute for taxonomy evidence. Approved HTTP or imported artifacts may provide it; direct database credentials remain prohibited.
- Advance category-role through a resumable `ProductSelectionRun`: taxonomy required → category proposal required → candidate snapshot required → scene proposal required → ready result. Every proposal and snapshot is schema- and digest-validated.
- Reproduce the reference category-role rules in deterministic code:
  - 10 categories ordered core → pairing → accessory, with no selected parent-child overlap, a 5:3:2 target, and the documented elastic distributions;
  - 10 category queries at `limit=100`, `featured`, plus one discovery query at `limit=200`, `sold`;
  - 4–6 scenes with two role-correct groups each;
  - Popular Picks from the first five core categories, up to 10 sold products each;
  - Brand Spotlight targeting 3 core, 2 pairing, and 1 accessory brands, three products per real brand ID, with role-priority shortage fill;
  - Explore More targeting 3 pairing and 2 accessory categories, preferring discovery results and falling back only when a discovery category is absent, up to 18 products each;
  - global deduplication priority Scene → Popular Picks → Brand Spotlight → Explore More.
- Let `PagePlan` compile a ready `ProductSelectionResult` into language and presentation metadata. It must not reselect or reclassify products.
- Return only ready strategies in the PagePlan matrix. A strategy waiting for evidence remains visible as its explicit ProductSelectionRun status instead of a fabricated plan.
- Expose the same Module through package API, standalone HTTP Host, CLI, Codex Skill, and Kiro Agent so other projects reuse behavior without copying prompts or algorithms.

## Consequences

Adding strategies now requires a versioned config and engine implementation with contract tests, not new branches in PagePlan or UI. Agent prompts can evolve independently because the Module accepts only validated proposal contracts. Category-role runs are intentionally blocked until a valid taxonomy artifact exists, and the Web Host can show that state honestly.

The implementation retains workflow parity with the reference repository without importing its code, database access, credentials, or runtime assumptions. Relevance remains available with no Agent proposal, while category-role can be resumed across processes using canonical JSON and SHA-256-bound artifacts.
