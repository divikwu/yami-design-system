---
slug: review-preview
title: Share a preview for review
description: "Share an accessible page with reproducible code and data versions, then track feedback and verification in one review record."
group: collaboration
order: 110
keywords: ["preview", "review", "snapshot", "SHA", "access"]
updatedAt: "2026-08-31"
sourceRefs:
  - docs/adr/007-evaluation-first-live-prototypes.md
  - docs/ai-workflow.md
  - docs/deployment/vercel-protection.md
  - apps/storybook/.storybook/preview.tsx
---

A shared preview lets colleagues see the same page version and reproduce the issue you want to discuss. A repository link, screenshot, or local address does not accomplish this on its own.

This page explains how to invite others to review. Use the [Page review checklist](/en/docs/review-checklist) for the checks to perform on the page itself.

## Before you start

- You have saved a recoverable task version and identified anything still uncommitted or unexported.
- You have completed a self-check and can name the questions reviewers should answer.
- The release owner has confirmed an available preview environment, its audience, and permitted assets.

A private repository does not make a preview website private. Before the first share, test access with an intended reviewer's account and verify unauthorized access is blocked where the environment requires it.

If no approved preview environment exists, do not assume permission to create a service or deploy publicly. Request one first. Meanwhile, use screen sharing or an agreed local reproduction and record those limitations.

## Freeze the review version

Formal reviews of data-driven pages default to a fixed Snapshot, not changing Live results. Record the snapshot identifier or file path and digest so code and data can be reproduced together.

1. Choose this round's code SHA and export any necessary browser drafts.
2. Fix the sources for products, prices, categories, and copy; select Snapshot for pages with data-mode support.
3. Use specified Scenarios for additional empty, loading, or error states, recording their names and configuration.
4. If Snapshot is not integrated, have a collaborator save reproducible data files first; do not label changing API results a snapshot.
5. For static pages, state that content files are fixed with the code and no live product requests are involved.
6. Record the language, theme, viewport, and starting state, then create or update the approved preview.

Use Live separately to examine data drift and runtime failures, not as the sole basis for comparing designs. Until the inputs are fixed, call the session exploratory rather than a reproducible formal comparison.

## Send a review invitation

Keep this record beside the clickable preview rather than sending only the Storybook homepage:

```text
Task / creator / reviewer:
Questions for this review:
Preview URL / specific Story or page path:
Access method and expiry:
Fork / branch / code SHA:
Snapshot identifier or path and digest / additional Scenarios:
Language / theme / viewport:
Starting state and steps:
Completed self-checks / known issues:
Requested feedback date:
```

Specify viewport widths such as `375px` or `1440px`, not just “mobile” and “desktop.” If the URL does not preserve toolbar settings, explain how to select them.

Do not put credentials in preview URLs. If sign-in is required, name the approved account system rather than sharing passwords in the review record.

## Record feedback and verify fixes

1. Reviewers confirm the code and data versions match the invitation before checking the page.
2. Use the [Shared checklist](/en/docs/review-checklist) and address this round's questions.
3. For each issue, record the location, steps, actual result, expected result, and priority; screenshots are supporting evidence.
4. The creator confirms which issues belong in this round before asking AI to edit. Suggestions are not automatically approved requirements.
5. After editing, record the new SHA, update the preview and change summary, and request verification of the affected issues.
6. Record who approved which version and which issues were explicitly deferred.

If a preview URL is updated during review, tell participants that its version changed. Otherwise, two comments may refer to different pages.

## What you should see

A reviewer can independently open the specified entry point, see the agreed content and state, and reproduce issues. Approval or rejection points to a specific SHA and data version.

“Screenshot reviewed,” “opens locally,” and “shared preview approved” describe different outcomes. Report what was actually verified instead of using a vague “done.”

## When something goes wrong

- **A colleague cannot open localhost**: it refers to their own computer. Use an approved shared preview or agree on local reproduction.
- **They see different content**: check the SHA, data, language, and cache before concluding the implementation is wrong.
- **Access requirements conflict with confidentiality**: stop widening access and involve the environment owner; do not disable controls yourself.
- **The same issue keeps returning**: add stable reproduction steps and a minimal example before involving AI or the component maintainer.

## Next step

After approval, continue to [Deliver and publish a page](/en/docs/deliver-publish). Raise any library support needs separately through [Report a component gap](/en/docs/component-gaps).
