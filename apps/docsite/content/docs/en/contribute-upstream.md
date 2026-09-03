---
slug: contribute-upstream
title: Share components and pages
description: "Ask AI to prepare verified components, page examples, and improvements for review in the shared repository."
group: collaboration
order: 140
keywords: ["component", "page", "improvement", "sharing", "upstream", "PR"]
updatedAt: "2026-09-03"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/prototypes/package.json
  - tooling/migration/check-boundaries.mjs
  - .github/workflows/ci.yml
  - docs/maintainers/zh/maintain-releases.md
  - docs/maintainers/en/maintain-releases.md
---

If you create a reusable component or page, or improve an existing example, you can submit it to the shared repository. Explain its purpose; AI extracts the files, verifies the result, and prepares it for review.

Keep each submission focused on one component, page, or clearly scoped improvement so the team can review and reuse it. To let another team member continue unfinished work, use [Deploy and hand off](/en/docs/deliver-publish#hand-off-to-a-team-member).

## Which improvements to share

- Components or new states that multiple pages can use.
- Reusable complete pages, page templates, and structural or interaction improvements to existing page examples.
- General interaction, responsive behavior, or accessibility fixes.
- Examples and usage guidance that help the team use components and pages correctly.

When sharing a page, include its reusable layout, module composition, and interactions, with approved example copy, images, and data. Campaign-specific content, private APIs, and account configuration stay in your project. If the need for a component change is unclear, ask AI to [investigate the component issue](/en/docs/create-components#report-a-component-issue), then agree on the direction with a maintainer.

## Ask AI to prepare and submit it

After agreeing on the direction, fill in these details. A pull request (PR) proposes a change to the shared repository; a maintainer reviews it and decides whether to accept it.

```text
Prepare this component or page and submit it to the shared repository for review.
Project location: <local directory>
Target shared repository: <GitHub repository URL>
Contribution: <component or page to share and its purpose>

- Use a separate directory and branch, extract only this contribution, and preserve existing project changes.
- Follow the target repository's conventions, include dependencies, examples, and usage guidance, and ensure it works independently without private data.
- Run checks and open the result; report unclear scope, an uncertain submission target, or failed checks before proceeding.
- Once checks pass, you are authorized to push to my fork and open a PR against the target repository, describing changes, check results, and known issues.
- Return the PR and result links.
- Do not merge or deploy.
```

You do not need to list code files or enter version identifiers manually; AI fills them in from the actual changes. If the PR includes many unrelated pages or business files, ask AI to extract only this improvement again.

## Continue after review

The maintainer checks whether the component or page belongs in the shared repository, affects existing consumers, or needs changes. Give clear review feedback to AI, continue in the same PR, and recheck the result.

After acceptance, ask AI to record the merged version and [update components and pages](/en/docs/sync-upstream) in your project. Other projects must also adopt the update explicitly. A merged PR does not mean every project or hosted site has updated.

Improvements not yet accepted can stay in your project with their reasons and limits recorded.

## Check the result

- Submitted for review: the PR contains only this improvement, with a visible result and verification notes.
- Accepted: AI identifies the merged version and explains whether the original project has adopted it.

## Maintainer reference

Team members responsible for review, version records, and releases can read [Maintain upstream versions](https://github.com/divikwu/yami-design-system/blob/main/docs/maintainers/en/maintain-releases.md) in the repository. Regular building tasks do not need to follow those maintenance steps.
