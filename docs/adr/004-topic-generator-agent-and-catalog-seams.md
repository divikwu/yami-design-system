# ADR 004 — TOPIC GENERATOR Agent and catalog seams

## Status

Accepted by the repository owner on 2026-08-17.

## Context

TOPIC GENERATOR needs reusable shopping-intent analysis for Codex, Kiro, their
CLI clients, and the Canvas host. ADR 001 correctly keeps model-provider code,
provider keys, and server-side drafts out of the deployed application, but its
blanket prohibition on an API route predates the product's catalog-only HTTP
entrypoint.

Shopping intent has two different kinds of work. Ambiguous language may benefit
from an Agent, while catalog identity, availability, evidence, and page planning
must remain testable and deterministic. Treating either side as the whole system
would make results either too shallow or insufficiently trustworthy.

## Decision

- TOPIC GENERATOR is one portable product under `packages/topic-generator`.
- Codex or Kiro runs one product Agent. The Agent may create an optional,
  untrusted `SemanticProposal`; it does not declare catalog facts.
- A deep `TopicIntent` Module validates the proposal against an immutable
  `CatalogSnapshot` and returns a reviewable `ThemeIntent`.
- A `CatalogSnapshot` Seam owns retrieval. The default structured Yami Adapter
  is tried first and the public Yami search Adapter is an explicit fallback.
  Each attempt and failure code is retained for review.
- A deterministic planning Module derives `PrimaryPool`, `RelatedPool`, and
  `PagePlan` from the validated intent and snapshot.
- Optional `RunArtifact` output records versioned intermediate files and hashes
  only when a CLI caller supplies an output directory. There is no implicit
  server-side draft database.
- The Canvas host may expose the package's catalog-only HTTP handler. This
  supersedes only ADR 001's statement that Canvas has no API route. The handler
  contains no model SDK, model inference, provider key, or draft persistence.
- Public deployment of the catalog handler requires host-level rate limiting,
  timeout and abuse monitoring. Until those controls are reviewed, this route
  is a development and explicitly approved host capability, not a general
  public data proxy.
- Catalog access uses approved HTTP Interfaces. Direct database credentials are
  prohibited in source, prompts, Agent configuration, and Run Artifacts.

## Consequences

The product can be reused from Codex CLI, Kiro CLI, a Web host, or another
project without copying its intent rules. Agent quality can improve independently
of the catalog and planning contracts, while unsupported model claims are
rejected at the evidence Seam. Additional retailers require new CatalogSnapshot
Adapters rather than changes to TopicIntent or PagePlan consumers.

The reference `StoneNan/LandingPageAgent` repository remains useful as workflow
research only. Its staged Agent organization and Yami query shape inform this
decision, but it is not imported as a runtime dependency or copied wholesale.
