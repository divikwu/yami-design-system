---
slug: deliver-publish
title: Deliver and publish a page
description: "Hand off an approved, reproducible page, distinguish saving and merging from deployment, and record accurate release evidence."
group: collaboration
order: 130
keywords: ["handoff", "release", "deployment", "review", "SHA"]
updatedAt: "2026-08-31"
sourceRefs:
  - docs/deployment/vercel-protection.md
  - docs/adr/003-public-production-and-manual-deployments.md
  - docs/adr/007-evaluation-first-live-prototypes.md
  - apps/storybook/vercel.json
  - .github/workflows/ci.yml
---

Delivery hands a reproducible result and outstanding work to its next owner. Publishing deploys a specified version to an approved environment. A completed handoff does not always require immediate publication.

Business-specific pages stay in your project. Shared improvements follow [Contribute selectively upstream](/en/docs/contribute-upstream); do not merge an entire business branch into the core library.

## Before you start

- You have completed the agreed self-checks from the [Shared checklist](/en/docs/review-checklist).
- A [Review record](/en/docs/review-preview) identifies the approver, code SHA, and data version.
- Known issues, deferred items, and excluded features are listed.
- The recipient is confirmed; deployment also requires a release owner and target environment.

Without deployment access or an environment, you can still hand off code and assets. Do not describe waiting for release as unsaved work or a completed handoff as a live deployment.

## State the current status

| Status | What you can report | What it does not prove |
| --- | --- | --- |
| Saved locally | Files and required drafts are saved at a specified location | Others can already open them |
| Committed and pushed to your fork | Authorized colleagues can fetch the specified branch and SHA | The page is deployed |
| Review approved | Named people approved a specified version | Later versions are automatically approved |
| Code merged | The pull request and target branch are confirmed | The hosted environment was updated |
| Deployed and spot-checked | A specified environment serves a specified version and key paths were checked | Every scenario has been verified |

Fork main is for upstream synchronization, not the default business release branch. If a business PR is needed, use the team's agreed integration branch; a delivery record may also point directly to the approved task SHA.

## Prepare the handoff

Collect the essential information in one handoff record:

```text
Task / sender / recipient:
User task and included scope:
Fork / task branch / code SHA:
Page or Story entry point / startup instructions:
Snapshot, Scenarios, or static content files:
Required exports and asset locations:
Target languages / themes / screens:
Review decision / approver / record link:
Checks performed and results / unverified scope:
Known issues / next owner:
Current status: handoff only / awaiting deployment approval / deployed and spot-checked
```

Ask the recipient to confirm they can obtain the required files and open the result in their own authorized environment. Screenshots help explain the page but do not replace code, data, and instructions.

If a commit or push is required, your collaborator should inspect the working tree and specific diff first, then act only on this task's files with your explicit authorization. Do not stage the whole repository or clean up someone else's work for handoff.

## Approve deployment separately

Enter this process only when publication is explicitly required:

1. Specify the project, environment, domain, and allowed audience.
2. Confirm the release SHA matches the reviewed version; if it changed, verify the affected scope again.
3. Confirm the data mode, asset rights, and access controls; do not silently replace Snapshot with Live.
4. Have the owner check relevant CI and verification results and explicitly approve this deployment.
5. An authorized person runs the configured deployment process and records its identifier and source SHA.
6. Open the actual target URL and check key paths, resources, languages, and themes.
7. Record the result; on failure, follow the agreed recovery plan rather than force-pushing or deleting history.

Before a first deployment, the owner must also configure and approve hosting, access controls, and recovery. This tutorial does not assume that every fork automatically has preview or production hosting.

The repository's existing deployment configuration disables automatic Git deployments; a push or merge is not publication. Check the behavior of any new team environment rather than assuming it works like another project.

## What you should see

For a handoff only, the recipient can reproduce the specified version and knows who owns outstanding work. For deployment, the target environment, code SHA, spot-check result, and release time are recorded.

If only the build passed or an HTTP 200 was received, report that limited result rather than claiming the full experience is verified. The [Page review checklist](/en/docs/review-checklist) remains the shared standard.

Keep review and version records after delivery. Later upstream improvements require another synchronization and verification cycle; they do not automatically reach an already delivered page.

## When something goes wrong

- **No publishing account or project exists**: ask the owner to arrange an environment and report “handoff complete; deployment not performed.”
- **The link shows an old version**: check the deployment's source SHA and URL rather than making unrelated commits to trigger a refresh.
- **Code is accessible but the page is not**: check repository authorization and preview access controls separately.
- **A problem appears after release**: record the impact and contact the release owner; use the approved recovery plan rather than overwriting shared history.

## Next step

Close the task and record the next owner. For shared updates, read [Sync upstream and handle conflicts](/en/docs/sync-upstream). Core library maintainers should also read [Maintain upstream releases](/en/docs/maintain-releases).
