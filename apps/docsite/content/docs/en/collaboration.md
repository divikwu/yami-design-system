---
slug: collaboration
title: Working together
description: "Describe the task and review the result while AI handles building and version records, and the team reviews and delivers through previews."
group: collaboration
order: 80
keywords: ["team", "collaboration", "fork", "upstream", "responsibilities"]
updatedAt: "2026-09-03"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/package.json
  - packages/prototypes/package.json
  - docs/adr/003-public-production-and-manual-deployments.md
---

The team model uses a private upstream for shared components and authorized member forks for page work. Stable shared improvements return through focused pull requests, and other members choose when to sync them.

## Understand the three locations

| Location | How to think about it | Who handles it |
| --- | --- | --- |
| Upstream project | Shared guidelines, components, and page examples | Maintainers accept reviewed improvements |
| Your fork | Your project copy for independent work | AI prepares and updates it; you choose what to build |
| Task branch | A separate version for one page or component task | AI creates and records it for editing, review, and recovery |

Prepare your fork once and start each new task separately. The current convention reserves fork `main` for upstream updates and keeps business work on task branches. Ask AI to record these locations; you do not need to memorize branch commands.

## Follow this workflow

| What you want to do | What you provide | Continue here |
| --- | --- | --- |
| Start building | Goal, references, content, and what to preserve | [Start creating](/en/docs/prepare-environment) |
| Ask colleagues to review | Your repository, Vercel project, and specific page | [Deploy and hand off](/en/docs/deliver-publish) |
| Hand off or go live | Recipient and whether the live site should change | [Deploy and hand off](/en/docs/deliver-publish) |
| Receive shared improvements | The task to update or problem to resolve | [Update components and pages](/en/docs/sync-upstream) |

Continue the original task when adjusting the same page; start a new task for unrelated work. For parallel work, ask AI to use separate directories and ports so collaborators do not overwrite each other.

## Share components and pages

Business copy, products, and campaign pages stay in your project. If a shared component cannot meet the task, ask AI to explain the gap and follow [Report a component gap](/en/docs/create-components#report-a-component-issue).

Verified improvements that others can reuse can be submitted separately through [Share components and pages](/en/docs/contribute-upstream). After acceptance, members choose when to sync; upstream changes do not rewrite their work automatically.

## Next step

If you have no local project, complete [Getting Started](/en/docs/fork-project). Otherwise, [start creating](/en/docs/prepare-environment).
