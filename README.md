# Yami Design System

由 AI 驱动的 Yami 设计系统与原型制作平台。

## Local development

```bash
corepack pnpm install
pnpm generate
pnpm dev
pnpm dev:storybook
pnpm dev:docsite
```

## AI workflow

Yami Design System does not call a model at runtime. Generate a `DirectionManifestV1`
JSON file in Codex or Kiro, then import it from the Canvas control panel. The
browser validates the schema before saving the direction to local storage.

No API key, login, or database is required.

See [`docs/ai-workflow.md`](docs/ai-workflow.md) for the reusable agent prompt
and import contract.

- Canvas Workbench: http://localhost:3200/workbench
- Canvas Preview: http://localhost:3200/preview?locale=en
- Storybook: http://localhost:6006
- Docsite: http://localhost:3400/zh

## Hosted environments

- Canvas Workbench: https://yds-prototype.vercel.app/workbench
- Canvas Preview: https://yds-prototype.vercel.app/preview?locale=en
- Storybook: https://yds-storybook.vercel.app
- Docsite: https://yds-docsite.vercel.app/zh

Docsite is a separate Vercel target at `apps/docsite`. Pull requests create
Preview deployments and updates to `main` create Production deployments.

The source repository and Vercel Production deployments are public. Canvas,
Storybook and Docsite all configure automatic Git deployments. The configuration
takes effect when it reaches the connected repository; verify the resulting
deployment before reporting a site update.
No Vercel project receives an AI secret. See
[`ADR 003`](docs/adr/003-public-production-and-manual-deployments.md) for the
current release policy.

Public availability does not grant reuse or redistribution rights for the
licensed fonts, brand marks or product photography. The asset-rights conflict
is recorded but not cleared; review the asset notices before forking, mirroring
or packaging static assets.
