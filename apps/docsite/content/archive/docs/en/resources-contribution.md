---
slug: resources-contribution
title: Resources & Contribution
description: "Find guidance, Catalog, Storybook, and contribution paths while understanding asset boundaries before public release."
group: guides
order: 220
keywords: ["resources", "contribution", "Storybook", "Catalog", "release"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/README.md
  - packages/design-system/generated/catalog.json
  - packages/design-system/CHANGELOG.md
  - docs/adr/003-public-production-and-manual-deployments.md
  - docs/migration/asset-rights.csv
---

YAMI guidance, code, and validation live in one repository but have different responsibilities. Choose the correct entry point before contributing so the project does not gain a second source of truth.

## Resource map

| Resource | Purpose |
| --- | --- |
| Docsite | Understand system principles, foundations, and collaboration workflows |
| Storybook | Inspect component props, states, examples, and interactions |
| Catalog | Read the machine-readable component list and maturity |
| Registry | Consume component delivery and dependency metadata |
| GitHub | Review source, decisions, changes, and contributions |

Storybook exclusively owns component reference pages. Docsite links there instead of maintaining a second API description.

## Submit a change

Start at the closest source of truth: change source JSON for tokens, source and metadata for components, and the corresponding language Markdown for documentation. Update generated files only through commands.

Keep each change focused and include the tests it needs. Do not reformat or refactor unrelated areas.

## Validation order

1. Run type and unit checks for the affected package.
2. Run generated-drift and design-principle checks.
3. Inspect the real interaction in Storybook or an application.
4. Run repository-level `pnpm validate`.
5. Record the commit SHA, CI, and manual sample before release.

## Assets and release

Local availability does not establish public distribution rights. Fonts, logos, icons, and images require a clear status in the asset-rights inventory. Confirm source and license before adding third-party material.

Canvas, Storybook, Topic Generator, and Docsite are independent deployment targets. Releasing Docsite does not replace or alter another application's domain or release flow.
