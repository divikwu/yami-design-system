# ADR 005 — TOPIC GENERATOR standalone host

## Status

Accepted by the repository owner on 2026-08-17.

## Context

ADR 004 established `packages/topic-generator` as the portable product Module,
but Canvas still owned its Web page and catalog-only HTTP route. That made
Canvas a runtime prerequisite and allowed a missing workspace package build to
break Canvas itself.

TOPIC GENERATOR and Canvas are separate products. They may share design-system
packages, but neither product should host the other's runtime.

## Decision

- `packages/topic-generator` remains the reusable TopicIntent, PagePlan, CLI,
  Web source, Skill, Agent integration, and evaluation boundary.
- `apps/topic-generator` is the standalone Topic Generator Host Adapter. It
  owns the root Web page and `/api/topic-generator` Route Handler and runs on
  port 3300 in local development.
- Canvas no longer imports, builds, transpiles, or exposes
  `@yami/topic-generator`.
- The repository boundary check rejects future Topic Generator imports from
  `apps/canvas`.
- The CI build check builds both hosts independently.

## Consequences

Canvas can build and run without Topic Generator, while Topic Generator can be
opened, tested, and later deployed or packaged as its own product. Shared
behavior remains in one portable Module, so the standalone Host does not create
a second implementation.
