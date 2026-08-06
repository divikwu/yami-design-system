# ADR 002 — Public source repository visibility

## Status

Accepted by the repository owner on 2026-08-06.

## Decision

`divikwu/yami-canvas` is a public GitHub repository so GitHub Free can enforce
rulesets and required CI checks on `main`. The packages remain private, Vercel
automatic Git deployments remain disabled, and production deployment remains
prohibited by ADR 001.

Repository visibility does not change the rights recorded in
`docs/migration/asset-rights.csv` or any asset-specific license notice. In
particular, `packages/design-system/assets/fonts/LICENSE.txt` says the bundled
GT Walsheim files may not be redistributed publicly. The owner accepted public
visibility with that known conflict; CI completion must not be represented as
asset-rights clearance. History sanitization or a private asset split remains
required if the license owner does not separately approve this repository.

## Consequences

- Source, Git history, Actions logs and downloadable repository archives are
  visible to everyone.
- Public forks and mirrors are technically possible but are not granted asset
  reuse rights by this repository.
- GitHub rulesets can require the named CI jobs without a paid plan.
- Package publication and Vercel deployment remain separate authorization
  boundaries.
