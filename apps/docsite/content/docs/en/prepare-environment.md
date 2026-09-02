---
slug: prepare-environment
title: Prepare your environment
description: "Start Storybook in your own working copy, give AI the project rules, and confirm that the preview is usable."
group: ai
order: 40
keywords: ["environment", "Node", "pnpm", "Storybook", "AI", "preview"]
updatedAt: "2026-08-31"
sourceRefs:
  - package.json
  - apps/storybook/package.json
  - apps/storybook/.storybook/preview.tsx
  - packages/design-system/SKILL.md
  - packages/design-system/package.json
---

For teammates building their first page with AI. You do not need to understand the whole architecture first. You do need an authorized working copy and an AI coding tool that can read and edit local files.

## Before you start

Complete [Create your Fork](/en/docs/fork-project) to obtain your own local copy. Run the commands below at the root of your repository, not in a teammate's directory or an individual component folder. Once setup works, [start and manage a task](/en/docs/manage-tasks). This chapter prepares the environment without changing a page.

| Requirement | How to confirm it |
| --- | --- |
| Project access | You can access the authorized repository; confirm the team's actual private-repository, Fork, and preview permissions |
| Local working copy | The directory opened by AI contains the root `package.json`, `apps/`, and `packages/` |
| Task scope | You know which page to build and which shared content must remain unchanged |
| Assets | Copy, images, and sample data are approved for this review; do not include secrets or customer information |

## Check runtime versions

The current root `package.json` requires Node.js 24.x and specifies pnpm 11.20.0. Run:

```bash
node --version
pnpm --version
```

Expect `v24.x.x` and `11.20.0`, respectively. After updating the project, use the `engines` and `packageManager` fields from that revision. Do not change them just to make installation pass.

If versions differ, ask AI or an engineering teammate to help prepare the required versions, then run both checks again. Do not delete the lockfile to work around a runtime mismatch.

## Install dependencies and open a preview

For the first setup, or when an upstream update changes dependencies, run:

```bash
pnpm install --frozen-lockfile
pnpm dev:storybook
```

Storybook uses `http://localhost:6006` by default. Keep its terminal running and open that address in a browser. A successful startup message is not enough: open an actual component or page and confirm that the canvas, text, and images render.

This tutorial starts in Storybook; you do not need every application running. To view the local usage guide as well, run this in another terminal:

```bash
pnpm dev:docsite
```

The documentation site uses `http://localhost:3400/en`; it is not the preview URL for your page Story. Saving a local file does not update the team's hosted Storybook.

If a port is already occupied, first check whether it belongs to your existing project instance. Do not stop an unknown process or a teammate's preview. Ask AI or an engineering teammate to identify it, or choose an unused port and record the actual address.

## Give AI the project rules

Send this prompt to an AI tool with access to the repository:

```text
I am preparing an isolated page exercise in this YAMI repository.
First confirm the working directory, branch, uncommitted changes,
and Node / pnpm versions. Read the applicable AGENTS.md files and
packages/design-system/SKILL.md. Follow the Skill's reading order
and find the closest maintained page, Story, and fixture.
For now, check the environment only. Do not change components,
upgrade dependencies, or delete the lockfile.
Check whether Storybook is already running. Do not take over a port
or terminate another task's service.
Report the actual preview URL, page opened, rendering errors, and next step.
```

The project Skill defines reading and validation requirements. It does not automatically connect AI to business data or publish a page. Have AI confirm applicable rules whenever you change repositories, start a task, or lose context.

## Confirm readiness

Start building only after confirming all of the following:

1. Storybook renders an actual component or page, not just an empty shell.
2. Locale, theme, and viewport tools work; when the Story does not lock an option, changing it updates the canvas correctly.
3. AI can identify the source files it will reuse, rather than inventing another set of similarly named components.
4. Changes belong to your task; shared references and teammates' work remain intact.

If a later browser test reports that Chromium is missing, run `pnpm exec playwright install chromium`. This downloads the test browser; it does not replace dependency installation.

## Troubleshooting and next step

| Symptom | What to do |
| --- | --- |
| `node` or `pnpm` is not found | Prepare the required versions, reopen the terminal, and check again |
| The lockfile check fails | Confirm that branch and dependency files are intact; give AI the original error rather than immediately changing the lockfile |
| The browser refuses the connection | Check that the server is still running and the URL matches its actual port |
| Images or fonts are missing | Inspect resource requests and console errors; confirm local files exist before substituting external URLs |
| The page opens but your edit is missing | Confirm the local Story, branch, and working directory are the ones you changed |

Once the environment is ready, [choose a page example](/en/docs/choose-starting-point) to identify a reusable reference and define the scope of your changes.
