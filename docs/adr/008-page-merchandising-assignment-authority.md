# ADR 008 — PageMerchandising assignment authority

## Status

Accepted for implementation on 2026-08-19. This ADR preserves ADR 006's ProductSelection ownership
and keeps the legacy `@1` page templates addressable for artifact replay.

## Context

ADR 006 makes category-role product retrieval, module allocation, ordering, grouping, and global
deduplication deterministic. PageMerchandising `@1` nevertheless accepted any frozen-pool product
that satisfied a module's pool and role rules. A Strategy Agent could therefore move products across
StartHere, Popular Picks, Brand Spotlight, and Explore More, truncate validated scenes, or authorize
cross-module duplication with a free-text reason.

Relevance selection is different: its ProductSelectionResult intentionally has no module
assignments, so PageMerchandising must continue assigning its frozen products and support a sparse
single-product result.

## Decision

- Add active `topic-landing/brand@2`, `topic-landing/topic@2`, and
  `topic-landing/campaign@2` templates with `assignmentAuthority: product-selection`.
- Add active `landing-page/brand@2`, `landing-page/topic@2`, and `landing-page/campaign@2` routes to
  those templates. Keep all `@1` page types and templates addressable but omit them from new Agent
  task registries.
- For category-role `@2`, require visible StartHere, Popular Picks, Brand Spotlight, and Explore More
  assignments to equal the corresponding ProductSelection module IDs in the same order.
- Require StartHere to preserve every validated source scene exactly once and to copy the complete,
  ordered products from both role-correct source groups.
- Treat Hero and Shortcuts as reference modules: they may reference only products already owned by a
  ProductSelection module. A reuse reason remains audit metadata; it cannot authorize duplication
  between ProductSelection-owned modules.
- Run the same ownership and capacity checks before requesting Agent work.
- Keep `topic-landing/relevance@1` on proposal-owned assignment semantics for compatibility with its
  evidence-backed sparse-product fallback.

## Consequences

New category-role automation preserves the deterministic selection artifact through PagePlan v2,
including sold order, brand grouping, scene completeness, and global deduplication. Old execution
plans remain replayable through their `@1` refs. Adding another assignment policy requires a new
versioned template rather than prompt-only behavior or an in-place contract change.
