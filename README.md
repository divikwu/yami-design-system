# YAMI Canvas

由 AI 驱动的 YAMI 设计系统与原型制作平台。

## Local development

```bash
corepack pnpm install
pnpm generate
pnpm dev
pnpm dev:storybook
```

## AI workflow

YAMI Canvas does not call a model at runtime. Generate a `DirectionManifestV1`
JSON file in Codex or Kiro, then import it from the Canvas control panel. The
browser validates the schema before saving the direction to local storage.

No API key, login, or database is required.

See [`docs/ai-workflow.md`](docs/ai-workflow.md) for the reusable agent prompt
and import contract.

- Canvas: http://localhost:3200
- Storybook: http://localhost:6006

The source repository is public so GitHub Free can enforce CI rules on `main`.
Packages remain private and Vercel remains preview-only and protected. Public
repository visibility does not grant reuse or redistribution rights for the
licensed fonts, brand marks or product photography; review the asset notices
before forking, mirroring or packaging static assets.
