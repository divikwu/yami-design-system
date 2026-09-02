---
slug: contribute-upstream
title: Contribute shared capabilities upstream
description: "Extract a stable, business-independent capability from a project Fork and contribute it through a focused upstream PR."
group: maintenance
order: 160
keywords: ["upstream", "Fork", "contribution", "PR", "reuse"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/components/index.ts
  - tooling/migration/check-boundaries.mjs
  - .github/workflows/ci.yml
  - .changeset/config.json
  - package.json
---

For contributors who have verified a shared capability in their own Fork. This workflow assumes a private upstream and authorized team Forks. Repository and preview access must actually be configured by the owner; this guide does not enable them.

## Agree on the contribution scope

Confirm the problem, its value to other pages, and the maintenance scope with the upstream maintainer first.

Suitable contributions include reusable components or variants, general interaction and accessibility fixes, clear usage documentation, and page patterns with business coupling removed.

One-off campaign copy, product data, private APIs, project routes, and unverified experiments stay in the Fork by default. Contribute one stable capability at a time; do not wait for the entire business project or submit its whole branch upstream.

## Prepare a separate contribution branch

1. Save current project work and confirm that no uncommitted content will be overwritten.
2. Follow [Sync upstream and resolve conflicts](/en/docs/sync-upstream) to obtain the agreed upstream baseline and record its commit.
3. Create a separate contribution branch or worktree from that baseline, not a PR from a branch mixed with business changes.
4. Bring over only the implementation, documentation, tests, and generated files needed for this capability.
5. Inspect the diff again for unrelated tasks and personal environment configuration.

Colleagues unfamiliar with Git can ask AI or an engineer to perform these steps. Name the target repository, baseline, permitted files, and protected scope explicitly.

```text
Prepare a separate branch for an upstream contribution.
Upstream and baseline: [repository and commit]
Shared capability: [agreed scope]
Source task: [project branch or saved revision]
Extract only required implementation, usage, examples, tests, and generated files.
Keep business content, APIs, routes, and other tasks unchanged.
List the proposed diff first. Do not automatically push, open a PR, merge, or deploy.
```

## Remove business coupling

Replace business data with approved fixed examples. Keep APIs and authentication in the consumer, expressing component needs through props and callbacks.

Check that the component package does not depend on an application or prototype layer. Page patterns remain in the appropriate composition layer; upstream contribution does not mean everything moves into `packages/design-system`.

Verify that the example runs outside the original project context. If it requires private environment variables or a project-specific API, the contribution is not yet independent.

## Verify and describe compatibility

Verify the final contribution-branch diff rather than reusing results from the original business branch:

```bash
pnpm validate
pnpm test:storybook
git diff --check
```

For Storybook documentation or component-directory changes, also build Storybook and run `pnpm check:docgen`. For new metadata or tokens, run `pnpm generate` first and inspect the generated diff.

Explain changes to props, defaults, interactions, visual dimensions, or token meaning. A page can change visually or behaviorally even when TypeScript reports no errors.

For shared-package changes, agree on the Changeset entry and change level with the maintainer. This does not authorize a release.

## Submit and review the PR

After receiving submission authorization, push the separate contribution branch to your Fork and open a PR against the agreed upstream baseline. Verify the source, target, and file diff.

Include the problem and scope, upstream baseline, related task, before-and-after evidence, Storybook or preview entry, verification results, compatibility impact, migration instructions, and known limits.

Keep review changes within the contribution scope. If upstream has moved, reconcile and reverify. Do not hide conflicts with force overwrites or include unrelated new business features.

The upstream maintainer reviews design, API, tests, asset permissions, and CI before deciding whether to merge. A contribution is a proposal for review, not a guaranteed upstream change.

## Finish after the merge

- Record the actual upstream merge commit and connect it to the original task.
- Let the original project adopt upstream through normal synchronization, resolving duplicated local implementation or conflicts.
- Tell other Fork owners what is available, whether migration is needed, and how to verify it.
- Distinguish “merged” from “deployed to Storybook or another site”; deployment follows a separate workflow.

## Common questions

**The PR contains many business files.** Pause submission and extract the smallest capability from a clean upstream baseline. Do not ask maintainers to guess which parts of a whole project to merge.

**Why have other Forks not updated immediately?** They must synchronize explicitly, integrate the changes into their project branches, and check their pages.

**Upstream is not accepting the capability yet.** Keep it project-scoped and record the reason and limitations. Do not label it as a maintained shared component.

## Next step

Maintainers can continue to [Maintain upstream versions](/en/docs/maintain-releases). Page owners can [sync upstream and resolve conflicts](/en/docs/sync-upstream) to adopt merged capabilities.
