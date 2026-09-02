---
slug: create-components
title: Extend or create components
description: "Define the responsibility, then ship implementation, contracts, Storybook examples, and checks that other pages can rely on."
group: maintenance
order: 150
keywords: ["create components", "variants", "meta", "Storybook", "public exports"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/DESIGN.md
  - packages/design-system/components/AspectRatio/meta.json
  - packages/design-system/components/AspectRatio/AspectRatio.stories.tsx
  - packages/design-system/components/index.ts
  - packages/design-system/package.json
  - tooling/catalog/build.mjs
  - tooling/registry/build.mjs
  - package.json
---

For component authors and maintainers. Start with an agreed capability gap, owner, reproducible scenario, and acceptance criteria. If the shared-component need is unclear, [report the gap first](/en/docs/component-gaps).

## Choose the smallest extension

| Approach | When it fits | Boundary to preserve |
| --- | --- | --- |
| Compose existing components | The change concerns module order, content, or page layout | The page owns composition without changing primitive defaults. |
| Extend an existing variant | One responsibility needs a reusable presentation or state | Use clear semantics and keep existing calls predictable. |
| Create a component | The capability has a distinct responsibility that existing composition cannot reasonably express | Define inputs, outputs, interactions, and exclusions. |

Record the choice and reasoning in the task. Do not copy a shared component merely because one page needs a different appearance.

## Read the implementation sources

1. Read `packages/design-system/SKILL.md` and the full `DESIGN.md`.
2. Inspect the closest component's implementation, `meta.json`, `usage.md`, Story, and tests.
3. Check `generated/catalog.json` and public package exports for the currently available capabilities.
4. List props, defaults, required states, and the impact on existing calls before implementing.

For example, the [AspectRatio Storybook example](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-layout-aspectratio--showcase) is the `Showcase` export under `YAMI/Components/Layout/AspectRatio`. It illustrates a focused primitive, not a mandatory file template for every component.

## Complete the component bundle

Follow a nearby component's existing structure under `packages/design-system/components/<Name>/`:

- Component source and styles: consume semantic tokens and implement the agreed states and accessibility behavior.
- `meta.json`: document props, status, version, dependencies, token bindings, and accessibility contracts accurately.
- `usage.md`: explain when to use it, what it does not own, a minimal example, and common misuse.
- Story: maintain a `Showcase`; add prop exploration, edge states, and interaction cases as needed.
- Examples and tests: cover defaults, the new capability, and compatibility with existing calls.
- The component's `index.ts`: export the public component and types without exposing implementation details.

A new component also needs a root export in `packages/design-system/components/index.ts`. A directory-level `index.ts` alone does not guarantee a package-root import.

Verify the public entry from a real consumer, following the existing import pattern:

```tsx
import { AspectRatio } from "@yami/design-system";
```

Update Figma references when a real design mapping exists. Do not invent node IDs or design links to satisfy a check.

## Keep the shared package independent

Shared components receive consumer-provided data and callbacks. Business APIs, authentication, project routing, campaign copy, and assets remain with the consumer.

Do not introduce Next.js, Motion, Zod, Design Labs, or Astryx runtimes into `packages/design-system`. Keep page composition in the appropriate page or prototype layer rather than copying application dependencies into the component package.

Token sources live in `tokens/**/*.tokens.json`. Scripts update generated tokens, Catalog, and Registry. Do not edit generated files by hand or treat registry metadata as an already deployed remote installation service.

## Generate and verify

Run these commands from the repository root. Generation updates affected derived files, so inspect their changes as part of the work:

```bash
pnpm generate
pnpm validate
pnpm test:storybook
pnpm --filter @yami/storybook build
pnpm check:docgen
git diff --check
```

`pnpm validate` covers static and unit checks but does not replace the separate Storybook browser tests or visual inspection. After the Storybook build, `check:docgen` checks stories, documentation, and the index.

Open Storybook and inspect relevant Chinese and English content, light and dark themes, keyboard interaction, and viewport sizes. Record combinations actually tested; one default example does not prove every state.

## Check the delivery

- Implementation, types, `meta.json`, Usage, and Story describe the same capability.
- The package root exports the component and types; existing pages do not require newly mandatory props to work.
- New or changed interactions have tests, with defined behavior for long content and empty data.
- Generated files are current, and verification results and limits are recorded.
- Shared content contains no project data, secrets, or unapproved assets.

The output is reusable source, a usage contract, examples, and verification evidence—not only a screenshot.

## Common questions

**It works in the page but is missing from Storybook.** Check the Story title, exports, collection scope, and build output rather than changing only a navigation label.

**Generated-file checks fail.** Inspect the source metadata, regenerate, and review the diff. Do not patch the Catalog by hand or disable the check.

**Existing props or defaults must change.** Describe affected consumers and migration steps first. Ask the maintainer to agree on compatibility before implementation.

## Next step

After local completion, continue to [Contribute shared capabilities upstream](/en/docs/contribute-upstream). Passing checks does not automatically authorize committing, merging, or publishing.
