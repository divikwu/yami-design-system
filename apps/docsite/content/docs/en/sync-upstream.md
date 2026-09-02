---
slug: sync-upstream
title: Sync upstream and handle conflicts
description: "Receive shared improvements without losing business work, update the fork baseline and task branch separately, then verify the page."
group: collaboration
order: 120
keywords: ["sync", "upstream", "fork", "conflicts", "upgrade"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/design-system/package.json
  - package.json
  - .github/workflows/ci.yml
  - docs/adr/007-evaluation-first-live-prototypes.md
  - docs/deployment/vercel-protection.md
---

An upstream component merge does not automatically update your fork, working page, or deployed preview. Choose when to sync, receive the update, and check that your page still behaves correctly.

Synchronization has two stages: update the clean fork `main`, then bring the confirmed update into a task branch. Do not merge business work into main just to remove differences.

## Before you start

Confirm these details before syncing:

- Which changes in the upstream release or merge notes affect your page.
- The upstream SHA you intend to receive, not simply “the latest code.”
- Your saved task checkpoint SHA and anything still uncommitted or unexported.
- Whether a page under review or delivery must remain unchanged; if so, use a separate integration branch for verification.

Ask your collaborator to run read-only checks first:

```bash
git status --short --branch
git remote -v
git rev-parse HEAD
```

If unexplained changes exist, confirm ownership and preserve them safely. Do not prepare for synchronization through forced overwrites, `reset --hard`, or staging the whole repository.

## Update the fork baseline

1. Confirm that `upstream` is the team project and `origin` is your fork.
2. Open your fork on GitHub, select the synchronization branch `main`, and inspect upstream changes.
3. Confirm it contains no business-specific commits and the upstream branch head still matches the approved SHA before using **Sync fork → Update branch**. This button follows the upstream branch head; it does not pin a historical version. If upstream has advanced, have your collaborator integrate the approved SHA instead of clicking sync.
4. If you see conflicts, divergence, or a warning about discarded commits, stop and ask your collaborator to explain; do not force the sync.
5. After updating the remote, have your collaborator fetch it and fast-forward local main only when the working directory is clean.
6. Record the received SHA and compare it with the intended upstream version.

GitHub's sync action updates the remote fork; the local copy still needs to fetch updates. Command-line operations must also distinguish local and remote state. One being current does not prove both are. See [GitHub's fork synchronization guide](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/syncing-a-fork).

If main contains unique commits, first check whether business work was added there. Preserve those commits and request a plan rather than deleting them to make the branch clean.

## Bring updates into the task

This stage affects the page you are making. Explicitly authorize which upstream update your collaborator may merge:

```text
First inspect my task branch, working directory, and uncommitted changes.
Task version: <task branch and checkpoint SHA>
Incoming version: <confirmed upstream SHA>
Explain the impact and preservation plan, then merge into a separate integration branch.
Pause on conflicts and list affected files. Do not force-push, hard-reset, or overwrite others' work.
Check the page with the original review data and report changes and verification results.
Do not push, merge other branches, or deploy without separate authorization.
```

Replace the placeholders before using the prompt. Do not combine synchronization with a business-page rewrite and a new visual direction; it becomes difficult to identify why the result changed.

## Handle conflicts

1. Ask your collaborator to list conflict files, the intent of each side, and affected pages.
2. Have the business owner decide content conflicts and involve a component maintainer for shared contract conflicts.
3. Decide what to retain or combine for each conflict; do not accept all “ours” or all “theirs.”
4. For generated files, resolve sources first, regenerate with repository commands, and inspect the differences.
5. Review the complete diff after resolution and rerun relevant checks.

If the right choice is unclear, keep the original checkpoint and integration branch and pause the upgrade. Git reporting no conflicts does not prove there are no semantic or visual changes.

## Verify and record the result

Use the same Snapshot, language, theme, and viewport as before, following the [Page review checklist](/en/docs/review-checklist). Ask your collaborator to run checks proportionate to the changes and state what was not run.

Record task SHAs before and after synchronization, the upstream SHA, affected pages, resolved conflicts, and outstanding issues. Decide whether to use the integrated result for the original task or release only after verification.

You should have the intended shared update, preserved business content, and a page that still supports the original user task. If the preview was not refreshed, explicitly say it still shows the older version.

## When something goes wrong

- **The fork is synced but the page looks unchanged**: check whether the local task branch or deployed preview still uses the old version.
- **Tests fail after synchronization**: keep the failure evidence and distinguish upstream changes from local adaptation issues; do not skip checks and publish.
- **A page changes during review**: use the recorded review entry point or checkpoint and schedule separate integration verification; do not rewrite shared history.
- **You urgently need one shared fix**: ask the maintainer to assess dependencies rather than copying a few files as a substitute for synchronization.

## Next step

If colleagues need to confirm the update, [Share a new preview for review](/en/docs/review-preview). For a reusable fix, follow [Contribute selectively upstream](/en/docs/contribute-upstream).
