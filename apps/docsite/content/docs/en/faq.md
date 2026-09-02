---
slug: faq
title: Frequently asked questions
description: "Resolve common issues with setup, reuse, previews, synchronization, and delivery."
group: resources
order: 190
keywords: ["FAQ","Startup","Preview","Sync","Troubleshooting"]
updatedAt: "2026-08-31"
sourceRefs:
  - package.json
  - apps/storybook/package.json
  - apps/canvas/app/lib/drafts.ts
  - docs/deployment/vercel-protection.md
  - packages/design-system/package.json
---

Before investigating, record the directory, branch, code version, startup command, and full error. If a process or file may belong to another task, confirm ownership before overwriting or cleaning it up.

## Do I need to install the project to browse components

No. Open [Storybook](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--showcase). Request access from a maintainer if required. Prepare a Fork and local environment only when you need to edit or create a page.

## What if the page says connection refused

It usually means no service is listening at that address, although a mismatched port or hostname may also be responsible. Confirm the correct app is still running in the terminal and use the address it actually reports.

From the repository root, `pnpm dev:storybook` starts Storybook and `pnpm dev:docsite` starts Docsite. They are separate services: a working Docsite does not mean Storybook is running. See [Getting Started](/en/docs/fork-project) for initial installation and startup.

If a port is busy, identify its owner first. Do not ask AI to stop every Node process. After startup, inspect actual rendering and browser errors rather than relying only on an HTTP response.

## What if AI did not use public components

Ask AI to list the page's import paths and reuse sources. Have it reread `packages/design-system/SKILL.md` and compare the implementation with the catalog, usage documentation, and closest maintained page.

If a public component fits, use its public import. If a capability is genuinely missing, [report the gap](/en/docs/component-gaps) rather than hiding a modified copy of the shared component in your project.

## Why were my Controls changes not saved

Controls change the current example parameters, not business-page source. To keep the configuration, ask AI to save it in your task Story or data file. See [Continue refining a page](/en/docs/choose-starting-point#continue-refining-a-page).

Local Canvas drafts are not a team cloud record either. Share agreed files, code versions, and review material instead of assuming a teammate can restore state held only in your browser.

## Why can a teammate not open my preview

`localhost` refers to the viewer's own computer. Sending that address does not share the service running on yours.

Use [Share a preview and review](/en/docs/review-preview) to arrange a team-accessible preview or agreed local reproduction. Check repository and preview-site access separately. If hosting is not configured, screenshots and recordings can support static discussion, but interaction acceptance remains incomplete.

## Why did my page change after synchronizing

Record upstream and project versions before and after the update, then identify whether data, composition, or a shared component caused the change. Follow [Sync upstream and resolve conflicts](/en/docs/sync-upstream) on an isolated task branch and rerun the shared acceptance checklist.

Do not force-overwrite the working branch or roll back an entire shared repository without agreement. Ask a maintainer about ambiguous shared behavior changes. Keep the previous review version available when needed.

## Where are npm installation and automatic upgrades

The current onboarding path uses a repository Fork and workspace source packages inside the monorepo. Do not assume `@yami/design-system` is a publicly published npm package or that registry metadata provides a configured remote installation service.

Follow [Getting Started](/en/docs/fork-project) to create your own working copy. If another repository needs a published package, agree on distribution and compatibility with maintainers first.

## Does passing checks or merging a PR mean it is live

No. Automated checks, teammate review, code merge, and site deployment are separate events. A successful command proves only the checks it covers. Browser or theme combinations not actually tested must not be marked as passed.

A release needs an explicit target, authorization, code version, and post-deployment verification. See [Deliver and publish a page](/en/docs/deliver-publish). A private repository does not automatically make its preview site private.

## What should I provide if I am still blocked

Copy the [change feedback template](/en/docs/templates#change-feedback). Include the full error, reproduction steps, expected result, code version, and what you already tried. Remove secrets and sensitive data before sending it to an owner or maintainer.
