---
slug: manage-tasks
title: Start and manage a task
description: "Give each page task an independent workspace, a clear change boundary, and recoverable checkpoints for iteration and handoff."
group: collaboration
order: 100
keywords: ["task", "branch", "workspace", "version", "checkpoint"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/design-system/SKILL.md
  - docs/ai-workflow.md
  - packages/contracts/src/manifest.ts
  - docs/adr/007-evaluation-first-live-prototypes.md
---

A task has a specific page goal, not a request to improve the whole project. You should be able to explain what changes, what stays, and who will review the result.

Task branches and independent directories isolate work; they are not an automatic task management system. Keep the following record in the location agreed by your team.

## Before you start

- You have [Created your fork](/en/docs/fork-project) and [Prepared your environment](/en/docs/prepare-environment).
- You have found the [closest page example](/en/docs/choose-starting-point).
- You have confirmed the requirements owner, asset sources, and allowed change scope.
- You know your project directory and are not sharing an actively edited working copy with a colleague.

Several tasks may run on one computer. For parallel work, have your collaborator prepare separate working copies or worktrees and assign non-conflicting service ports.

## Create a task record

Complete a short record before asking AI to begin:

```text
Task name:
Owner / reviewer:
What the user needs to accomplish:
Reference page or Story:
What changes / what must stay:
Allowed directories or files:
Copy, image, and product sources:
Target languages, themes, and screens:
Working directory / fork / task branch:
Upstream baseline SHA / current checkpoint SHA:
Current status / next action:
```

A SHA identifies a specific Git commit: it tells others which code version you mean. It does not prove that unexported browser drafts are saved or that the work has passed review.

## Start independent work

1. Ask your collaborator to check the directory, branch, remote source, and uncommitted changes first.
2. For a new business task, create a task branch from a clean, synchronized fork `main`, for example `codex/project-summer`.
3. To continue an existing page, start from its confirmed task version; do not blindly rebuild it from main.
4. Use separate directories for parallel tasks and record each port so you do not open another task's result.
5. Ask AI to name the files it plans to change, confirm the scope, then inspect the actual result.

Do not build pages directly on the `main` branch reserved for upstream synchronization. If another person's changes appear, confirm ownership rather than committing or deleting them.

## Save a recoverable checkpoint

Save a checkpoint when the first version runs, before requesting review, or before handoff. Explicitly tell your collaborator whether you authorize a Git commit or a push to your fork.

```text
First summarize this task's changed files and verification results, including anything not saved.
If there are Canvas browser drafts, export them and confirm where they are saved.
After I confirm the scope, commit only this task's files; do not stage the whole repository.
Do not push, merge, or deploy without separate authorization.
Report the checkpoint SHA, remaining uncommitted content, and how to continue.
```

Canvas browser drafts live in local storage. Changing browsers, computers, or forks does not carry them over automatically; export them through the project's workflow and include the files in your handoff.

Before committing, check images, exported files, and configuration for unauthorized content. Credentials, personal data, and temporary debugging material do not belong in a checkpoint.

## Resume or hand off the task

When resuming, provide the task record and latest checkpoint, and ask AI to inspect the current state before editing. Do not rely only on “continue where we left off” or assume every draft is in Git.

For another colleague, provide the fork, branch, SHA, required content files, startup entry point, and unresolved issues. They should reproduce it in their own authorized workspace rather than take over your active directory.

You should now know where the result is, which version can be reviewed, and what remains unfinished. Work can continue without relying on the original creator's chat history.

## When something goes wrong

- **The wrong page opens**: check the address, port, and service's working directory; do not stop another task's service.
- **AI edits files outside the scope**: pause and inspect the diff; address only this task's changes rather than rolling back the whole repository.
- **A branch switch is blocked**: preserve uncommitted work and ask for a safe saving plan; do not force the switch.
- **Several versions have similar names**: identify them by SHA and preview entry point instead of calling each one “latest.”

## Next step

Continue with [Your first page](/en/docs/first-page), or move to [Share a preview for review](/en/docs/review-preview) after completing self-checks.
