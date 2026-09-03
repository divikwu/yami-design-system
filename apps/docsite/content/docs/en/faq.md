---
slug: faq
title: Frequently asked questions
description: "Ask AI to help with pages that will not open, unsaved changes, preview access, and other common issues."
group: resources
order: 190
keywords: ["FAQ","Startup","Preview","Sync","Troubleshooting"]
updatedAt: "2026-09-03"
sourceRefs:
  - package.json
  - apps/storybook/package.json
  - apps/storybook/vercel.json
  - docs/deployment/vercel-protection.md
  - packages/design-system/package.json
---

When something goes wrong, give AI the page link, error, or screenshot and explain what you just did and what you expected. AI identifies the project, version, and running state; you do not need to assemble technical records yourself.

## Do I need to install the project to browse components and pages

No. Open [Storybook](https://yami-design-system-storybook.vercel.app/?path=/story/yami-components-actions-button--showcase) to browse and try components and page examples. Follow [Getting Started](/en/docs/fork-project) to prepare a local project when you want to create or edit your own.

## What if a local page will not open

Give AI the failing URL and an error screenshot. Ask it to check whether the correct project is running, verify the address, and open the page to confirm it works. Docsite and Storybook run separately; one being available does not mean the other has started.

If a port is occupied, ask AI to identify the project using it and choose an available address without stopping other tasks. See [Getting Started](/en/docs/fork-project) for the first startup.

## What if AI did not reuse existing components

Give AI the component or page example you want to use. Ask it to check reuse against the project guidelines, prefer existing capabilities, and preserve accepted content.

If an existing component cannot meet the need, [report the component issue](/en/docs/create-components#report-a-component-issue) with the scenario before deciding whether to extend or create a component. You do not need to inspect code import paths yourself.

## Why were my Controls changes not saved

Storybook Controls let you try parameters temporarily; they do not save those changes to your page. Give AI the desired result or a screenshot and ask it to apply and save the changes in your project.

See [Continue refining a page](/en/docs/choose-starting-point#continue-refining-a-page). To share the saved result, use [Deploy and hand off](/en/docs/deliver-publish) to create an online link.

## Why can a team member not open my preview

First check whether the link contains `localhost` or `127.0.0.1`. These addresses refer to the local computer and cannot directly share your preview with a team member. Use [Deploy and hand off](/en/docs/deliver-publish) to get an online preview link.

For an online link, ask AI to check deployment success, the URL, and the team member's access. GitHub repository access and website access are separate; do not simply make the site public to resolve an access problem.

## What if my page changes after an update

Give AI before-and-after screenshots or the affected page location and explain which behavior to preserve. Ask it to compare versions and handle differences on a separate branch without overwriting current work.

You do not need to update a page under review just to stay current. Use [Update components and pages](/en/docs/sync-upstream) when you need a new component, page example, or fix. Ask a maintainer about changes you cannot confidently assess.

## Does passing checks or merging a PR mean it is live

Not necessarily. Passing checks means the relevant validation was completed. A PR proposes code changes; whether merging it triggers deployment depends on the target branch and project settings.

With automatic deployments connected, non-production branches usually update previews, while production-branch updates trigger a production deployment. Ask AI to confirm deployment succeeded and open the live URL to check the corresponding version before calling the release complete. See [Deploy and hand off](/en/docs/deliver-publish).
