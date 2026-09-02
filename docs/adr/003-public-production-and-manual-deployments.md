# ADR 003 — Public Production and deployment policies

## Status

Accepted by the repository owner on 2026-08-07. Extended to the Docsite target
on 2026-08-29 as part of the approved phase-one implementation plan, then
updated on 2026-09-02 to enable automatic Git deployments for Docsite.

## Context

ADR 001 originally limited Vercel to protected Preview deployments because the
Hobby plan does not protect Production aliases. The owner subsequently chose a
public repository and public hosted environments without a paid-plan upgrade.

The deployed application does not call an AI provider and stores no server-side
drafts, so public hosting does not introduce an AI key, account or database
boundary. The migrated fonts, brand marks and product photography remain a
separate rights boundary.

## Decision

- Canvas, Storybook and Docsite may run as separate public Vercel Production
  deployments.
- Automatic Git deployments remain disabled for Canvas and Storybook. Docsite
  enables Git deployments.
- The Vercel projects are linked to `divikwu/yami-design-system` for repository
  provenance and monorepo source selection. For Docsite, pull requests create
  Preview deployments and updates to `main` create Production deployments.
- Canvas and Storybook Preview and Production deployments remain manual and
  require separate user authorization.
- Vercel must identify the source commit. Changes merged to `main` must pass the
  repository's required CI checks.
- None of the Vercel projects receives `OPENAI_API_KEY` or another model-provider
  secret. Direction manifests are generated in Codex or Kiro and imported by
  the user.
- Public availability is not asset-rights clearance. The restrictions in
  `docs/migration/asset-rights.csv` and asset-specific notices remain active.
- Docsite uses the Vercel project name `yami-design-system-docsite` with Root
  Directory `apps/docsite` and the public Production alias
  `yami-design-system-docsite.vercel.app`.

## Unresolved release risk

The public repository and current Production artifacts expose assets recorded
for private protected distribution only. The long-term release must use one of
these paths:

1. replace restricted assets with redistributable equivalents;
2. remove restricted assets from the public repository and deployment and load
   them only from an approved private source; or
3. record explicit public-distribution clearance from the rights holder.

Until one path is completed, CI and successful deployment prove technical
quality only; they do not prove asset-rights compliance.
