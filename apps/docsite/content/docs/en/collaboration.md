---
slug: collaboration
title: Collaborate as a team
description: "Understand the upstream project, authorized forks, and task branches so members can work independently and contribute reusable improvements."
group: collaboration
order: 80
keywords: ["team", "collaboration", "fork", "upstream", "responsibilities"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/package.json
  - packages/prototypes/package.json
  - docs/adr/003-public-production-and-manual-deployments.md
---

The team's collaboration model uses a private upstream project for shared components. Authorized members build pages in their own forks, contribute verified reusable improvements through focused pull requests, and actively sync accepted updates.

This is a workflow for the team to put into practice, not an already configured collaboration platform. This guide does not change repository permissions, create forks, share previews, or deploy pages automatically.

## Before you start

Ask the project owner to confirm three conditions:

- The upstream repository, organization policy, and member permissions support private forks.
- You know who owns the requirements, implementation, review, and release; one person may hold several roles.
- The team has identified approved data and assets, and who may access previews.

If access is not ready, review examples or prepare the brief. Do not upload internal content to an unapproved repository.

## Understand the three places

| Place | What belongs here | What to avoid |
| --- | --- | --- |
| Upstream project | Stable rules, shared components, reusable page patterns, and their checks | Collecting every campaign's complete business implementation |
| Your fork | Code, task branches, and review records for independent work | Merging your entire repository back upstream |
| Task branch | One page or one clearly scoped change | Making page changes directly on the synchronization branch |

Keep your fork's `main` clean so it can receive approved upstream updates. Page content and business-specific changes belong on task branches.

A task branch records a direction of work; a commit is a recoverable checkpoint; a preview link shows a result identified by its version. None replaces the others.

## Assign responsibilities

| Role | Information or decisions to provide |
| --- | --- |
| Requirements owner | User task, content sources, business constraints, and acceptance goals |
| Page creator | Implementation, change scope, fixed version, and a runnable result |
| Reviewer | Reproducible issues, priorities, and an approval decision |
| Core library maintainer | Reuse boundaries, contribution review, and upstream release maintenance |
| Release owner | Target environment, access controls, approval, and post-release checks |

Colleagues unfamiliar with Git can ask Codex or an engineering partner to perform operations, but scope confirmation still matters. AI executes and supplies evidence; people decide business requirements, access, and release approval.

## Follow one collaboration cycle

1. Start a task in your authorized fork from a confirmed upstream baseline.
2. Give AI the reference page, requirements, and approved assets, with a clear change boundary.
3. Save a checkpoint and complete the [shared review checklist](/en/docs/review-checklist).
4. Share an accessible preview with fixed code and data versions for review.
5. Deliver business-specific work within your project; raise shared component gaps separately.
6. Extract reusable improvements into a focused pull request without campaign copy, confidential data, or unrelated business code.
7. After upstream acceptance and verification, other members sync, check, and refresh previews at an appropriate point in their own work.

You can give AI this agreement:

```text
I am building a page in a team-authorized fork.
First confirm the directory, branch, uncommitted changes, and upstream source.
Do not edit the synchronization branch main; handle only the agreed task.
Explain shared component gaps before expanding the change scope.
Wait for explicit authorization to commit, push, contribute a PR, or deploy.
```

## What you should see

Each task has an owner, an independent workspace, a recoverable version, and a review entry point. A colleague should not have to wait for you to stop editing the same folder before starting work.

Reusable improvements can return upstream gradually, but they do not automatically change every fork. An upstream merge does not refresh everyone's preview or production page.

The packages are currently consumed as workspace source. This workflow is not a completed standalone package installer, automatic upgrade service, or task board. Versioned distribution would need its own installation and upgrade guide.

## When something goes wrong

- **Unsure whether to change the page or component**: record the gap and read [Report a component gap](/en/docs/component-gaps).
- **Two people plan to change the same capability**: choose an implementation owner and assign review or separate work to the other person.
- **A colleague cannot open the result**: check preview access; do not expose the internal repository as a workaround.
- **Unsure what can go upstream**: show the maintainer the smallest relevant diff, not the entire business branch.

## Next step

New team members should complete [Getting Started](/en/docs/fork-project). If your working copy is ready, [Start and manage a task](/en/docs/manage-tasks).
