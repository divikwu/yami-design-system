# ADR 003 — Public Production and manual deployments

## Status

Accepted by the repository owner on 2026-08-07.

## Context

ADR 001 originally limited Vercel to protected Preview deployments because the
Hobby plan does not protect Production aliases. The owner subsequently chose a
public repository and public hosted environments without a paid-plan upgrade.

The deployed application does not call an AI provider and stores no server-side
drafts, so public hosting does not introduce an AI key, account or database
boundary. The migrated fonts, brand marks and product photography remain a
separate rights boundary.

## Decision

- Canvas and Storybook may run as public Vercel Production deployments.
- Automatic Git deployments remain disabled.
- The Vercel projects remain unlinked from GitHub; deployments are manual and
  require separate user authorization.
- A deployment must identify the source commit and pass the repository CI suite.
- Neither Vercel project receives `OPENAI_API_KEY` or another model-provider
  secret. Direction manifests are generated in Codex or Kiro and imported by
  the user.
- Public availability is not asset-rights clearance. The restrictions in
  `docs/migration/asset-rights.csv` and asset-specific notices remain active.

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
