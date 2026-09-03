---
slug: sync-upstream
title: Update components and pages
description: "Ask AI to pull the latest upstream version or check whether local content matches GitHub."
group: collaboration
order: 130
keywords: ["component", "page", "sync", "upstream", "fork", "conflicts", "upgrade"]
updatedAt: "2026-09-03"
sourceRefs:
  - packages/design-system/package.json
  - packages/prototypes/package.json
  - package.json
  - .github/workflows/ci.yml
  - docs/adr/007-evaluation-first-live-prototypes.md
  - docs/deployment/vercel-protection.md
---

When upstream adds components, publishes page examples, or fixes a problem, ask AI to bring the update into your project. Pages under review or close to release do not need an immediate upgrade; preserve the confirmed version first.

## Decide when to update

- Before a new task, you want the team's confirmed components and page examples.
- A maintainer identifies a fix relevant to your page.
- An existing task needs a new shared capability.

Do not interrupt a review merely to make your fork appear up to date. Continue the current task when there is no specific update need.

## Pull the latest upstream version

Use this to bring the shared repository's latest content into your local project. Upstream is the team's shared repository, not your fork. AI can identify the repository and branch from existing configuration.

```text
Update my local YAMI project with the latest upstream version.
Local project: <directory>
Upstream repository: <GitHub URL; identify it if already configured>

- Verify the upstream repository and update branch, using its default branch if none is specified; ask me if the target is uncertain.
- Fetch that branch's latest commit, preserve existing local changes, and merge the update on a separate branch without force-overwriting my content.
- Run relevant checks and open the page; explain conflicts that would change accepted behavior before asking me to decide.
- Return the incoming upstream version, changes, and check results, stating whether the original task has been updated.
- Do not push or publish.
```

AI should check whether copied or customized pages need adaptation. Updating code does not automatically update your GitHub fork or deployed site. Verify the result before adopting it through the steps below.

## Check whether local and GitHub versions match

Use this to identify remote updates missing locally, local commits not yet pushed, or file changes not yet committed. Choose your fork to compare your own remote progress, or the shared repository to compare with upstream.

```text
Check whether my local project matches the version on GitHub.
Local project: <directory>
Comparison target: <GitHub repository and branch; identify them from an existing tracking relationship if configured>

- Verify the repository, local branch, and remote branch being compared, then fetch fresh remote records; ask me if the target is unclear.
- Compare commits and file contents, including uncommitted changes and untracked files, but exclude ignored dependencies and build outputs from source differences.
- Explain whether they match, what is ahead or behind locally, whether both sides have changes, and what to do next.
- Only inspect and report. Do not edit working files, commit, merge, push, or publish.
```

Matching commits do not rule out uncommitted local changes. AI should report commit equality and file-content equality separately. If fresh remote records cannot be fetched, report the comparison as incomplete rather than treating cached records as current.

## Decide what to do with conflicts

A conflict means the same part has two different changes. You do not need to edit conflicting code; ask AI to explain the effect on the page first.

| Conflicting content | Who decides | What AI should provide |
| --- | --- | --- |
| Copy, images, or module order | Requirements owner or creator | How the page would look before and after |
| Approved visuals or interactions | Creator and reviewer | Affected areas, choices, and a preview |
| Shared component or page rules and interfaces | Relevant maintainer | Intent, impact, and compatible options |

AI handles technical merges with clear intent. You decide when a change affects an approved experience or requires a business choice. If the right result is unclear, keep the original version and defer the update.

## Return the verified update to the task

1. AI opens the updated page and checks the original content, languages, themes, and screen sizes.
2. You review the experience and decide whether to adopt it.
3. After approval, AI merges the verified result into the original task branch and records both versions.
4. For further review, push the task branch within existing authorization and wait for the new preview.
5. AI checks the preview version, updates the task record, and asks reviewers to inspect affected areas.

If someone else updated the original task, AI should inspect those differences before merging. Ordinary pages can reuse the same example data; dynamic pages retain the agreed snapshot. See [Review a page](/en/docs/review-checklist) for the checks.

## Check the result

The required shared improvement is in the specified task, business content is preserved, and the original interactions still work. AI has recorded versions and checks and stated whether the shared preview was updated.

If only the fork baseline changed, report that limit. Updating code also does not mean the live site has changed.

## Troubleshooting and next step

If the page looks unchanged, ask AI to inspect the task branch and deployment version. If checks fail, preserve the result and distinguish upstream changes from local adaptation; do not skip checks and publish.

For further review, [Deploy and hand off](/en/docs/deliver-publish). For a fix others can reuse, [Share components and pages](/en/docs/contribute-upstream).
