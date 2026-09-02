---
slug: getting-started
title: Getting Started
description: "Load YAMI tokens, fonts, and public components in the workspace, then verify the result with shared commands."
group: start
order: 10
keywords: ["installation", "tokens", "components", "validation"]
updatedAt: "2026-08-29"
sourceRefs:
  - packages/design-system/README.md
  - packages/design-system/SKILL.md
  - packages/design-system/package.json
---

The smallest YAMI integration includes styles, tokens, and public components. Workspace applications must use the public exports from `@yami/design-system`. Do not copy component source or handwrite brand values.

## Use the workspace package

The design system is currently a private package in this monorepo. Declare it in the application's `package.json`:

```json
{
  "dependencies": {
    "@yami/design-system": "workspace:*"
  }
}
```

After installing repository dependencies, load the styles from public entry points:

```tsx
import "@yami/design-system/styles/base.css";
import "@yami/design-system/styles/fonts.css";
import "@yami/design-system/tokens.css";
```

Tokens must be active before application styles. Application CSS consumes semantic variables such as `var(--text-primary)`, `var(--background-primary)`, and `var(--space-200)`.

## Use public components

Import components from the package root. The application owns content and page structure; components own interaction states, accessibility, and token bindings.

```tsx
import { Button, Card, Input } from "@yami/design-system";

export function Example() {
  return (
    <Card padding="lg" surface="secondary">
      <Input label="Search" placeholder="Enter a keyword" />
      <Button variant="primary">Submit</Button>
    </Card>
  );
}
```

Use links for navigation. `Button` handles actions and does not replace an `<a>` element or framework link.

## Read the contracts first

Confirm three sources before implementation:

1. `SKILL.md` defines the reading and validation sequence for agents.
2. `DESIGN.md` defines tokens, component rules, and prohibited patterns.
3. `generated/catalog.json` records current components, status, and public exports.

Storybook is the source for component visuals and interactions. Docsite explains rules without duplicating component reference pages.

## Validate the delivery

Run this command from the repository root:

```bash
pnpm validate
```

Validation covers lint, types, design principles, generated-file drift, package boundaries, and tests. A passing command proves technical contracts only. Public release still requires a rights review for fonts, brand marks, and images.
