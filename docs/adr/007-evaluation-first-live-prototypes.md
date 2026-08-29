# ADR 007 — Evaluation-first live prototypes

## Status

Accepted by the repository owner on 2026-08-29.

## Context

Canvas prototypes need realistic catalog density, current search results, categories,
prices, and failure states without turning page prototypes into production clients.
Live data alone is unsuitable for formal design comparison because it changes between
reviews and cannot reliably reproduce empty, dense, delayed, or invalid states.

Topic Generator already owns a `CatalogSnapshot` evidence Seam, but ADR 005 keeps its
runtime independent from Canvas. Reusing that product Module from Canvas would mix
prototype evaluation with ThemeIntent and ProductSelection responsibilities.

## Decision

- Add a deep `CommerceCatalog` Module under `packages/commerce-catalog` with a small
  search and category-tree Interface.
- Put three Adapters at that Seam:
  - `ScenarioCatalogAdapter` for named, controlled EvaluationScenarios.
  - `SnapshotCatalogAdapter` for versioned PrototypeCatalogSnapshots.
  - `YamiLiveCatalogAdapter` for current server-side Yami catalog reads.
- Keep `packages/prototypes` prop-driven and runtime-independent. It must not fetch
  catalog data or import Next.js.
- Canvas Preview routes select an Adapter, map normalized catalog data into prototype
  props, and own URL state, loading, and explicit error presentation.
- Storybook and automated visual tests use scenarios or snapshots. They never require
  the live Yami network.
- Formal design reviews default to a PrototypeCatalogSnapshot. Live mode is used to
  evaluate data drift and runtime resilience, not as the only source of truth.
- Static page structure, marketing content, tokens, and unaffected modules remain
  static. Live capability is added only to data slots whose freshness changes the
  evaluated experience.
- Canvas does not import `@yami/topic-generator`. Topic Generator may later place an
  Adapter over CommerceCatalog for generic retrieval while retaining CatalogSnapshot,
  ThemeIntent, ProductSelection, and PagePlan semantics in its own Module.
- The first implementation exposes no public catalog HTTP Interface. Public Live mode
  requires an explicit review of rate limiting, timeouts, caching, and abuse monitoring.
- Canvas enables Live only in development or when the host explicitly sets
  `CANVAS_LIVE_CATALOG_ENABLED=true`; Production therefore fails closed by default.
- Search Results exposes a small optional controlled interaction Interface. Canvas uses
  it only for Live mode to persist query, sort, category, and page state in the URL;
  Storybook, scenarios, and snapshots retain deterministic local interaction.

## Consequences

Designers can compare variants against the same realistic data, intentionally exercise
edge states, and separately check current catalog drift. The shared Interface creates
Leverage across multiple Preview routes while upstream response knowledge stays local
to one Implementation.

The Search Results page remains runtime-independent: its controlled interaction Interface
reports normalized intent, while the Canvas Adapter owns Next.js navigation and server-
backed retrieval. Snapshot request matching includes query, locale, sort, categories,
page, and page size, so one digest-bearing artifact cannot silently represent two reviews.
