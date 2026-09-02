---
slug: review-checklist
title: Check and fix your page
description: "Use one acceptance checklist for self-checks, peer review, and handoff, with clear limits on automated evidence."
group: ai
order: 70
keywords: ["acceptance", "checklist", "responsive", "accessibility", "bilingual", "tests"]
updatedAt: "2026-08-31"
sourceRefs:
  - package.json
  - apps/storybook/package.json
  - apps/storybook/.storybook/preview.tsx
  - packages/prototypes/tsconfig.json
  - docs/adr/007-evaluation-first-live-prototypes.md
  - packages/design-system/DESIGN.md
---

This is the shared acceptance checklist for page self-checks, peer review, and handoff. Update one task record instead of maintaining three similar lists. AI can assist with checks; the responsible teammate confirms the page's purpose and release decision.

## Fix the version under review

Record the task, branch, commit or description of uncommitted changes, Story or page URL, and data source before checking. Prefer a fixed Snapshot for formal reviews. For a local fixture exercise, record its file path and Git commit. A branch name alone does not guarantee the same result next time.

Distinguish three data modes: Scenario reproduces a controlled state, Snapshot fixes a captured data sample, and Live helps inspect current data changes. Do not mix live prices with fixed sample data in one before-and-after comparison.

## Use the shared acceptance checklist

Mark each item Pass, Needs a fix, or Not applicable in the task record, with screenshots, reproduction steps, or test output. Explain every Not applicable result. An unchecked item is not a pass.

| Check | Acceptance criteria |
| --- | --- |
| Purpose and scope | The page fulfills the agreed task without quietly changing shared components, reference examples, or unrelated pages |
| Copy and products | Titles, descriptions, product counts, and ordering match the brief; prices, offers, reviews, and availability have not been invented |
| Images and links | Images load and crop correctly, alternative text is accurate, and destinations are understandable; demo actions are not presented as real purchases |
| Shared capabilities | Existing pages and public components are reused; color, typography, and spacing consume real semantic tokens |
| Chinese and English | Both languages convey complete equivalent information; longer English text preserves essential content; accessible names are localized too |
| Light and dark | Text, surfaces, borders, focus, and disabled states remain readable; image backgrounds and transparency are appropriate |
| Narrow and wide screens | Check at least 360, 375, 402, 768, 1024, and 1440px; add 1920px for affected extra-wide layouts; avoid page-level horizontal overflow and blocked controls |
| Interaction and state | Changed buttons, tabs, filters, sorting, dialogs, and return paths have clear outcomes; refresh behavior matches the brief |
| Keyboard and accessibility | Tab order is understandable and focus is visible; check Enter, Space, arrow keys, and Escape where required; dialogs restore focus and do not trap the keyboard |
| Loading, empty, and error states | Check loading, empty lists, long content, missing images, and request failures where relevant; mark network errors not applicable for a static exercise without requests |
| Motion and browser errors | Reduced-motion preferences work; no motion blocks interaction, and no console errors or required resource failures remain |
| Evidence and coverage | Record the actual locales, themes, sizes, data, and commands checked; make gaps and known issues visible |

These viewports are verification samples, not instructions to add a CSS breakpoint for each width. Cover combinations according to the change's risk. Checking only the default Chinese light desktop view does not justify claiming that every combination passed.

## Run technical checks

Ask AI to run these at the repository root and retain the results:

```bash
pnpm validate
pnpm test:storybook
pnpm --filter @yami/storybook build
git diff --check
```

| Command | What it confirms |
| --- | --- |
| `pnpm validate` | Configured lint, documentation, types, principle and generated contracts, package boundaries, and tests; it does not include the separate root Storybook browser-test script |
| `pnpm test:storybook` | Runs authored Storybook and browser tests, including checks attached to Stories; unauthored scenarios are not implicitly covered |
| `pnpm --filter @yami/storybook build` | Storybook can produce its static output; it does not mean the page is deployed or replace visual and interaction review |
| `git diff --check` | The diff has no whitespace errors; it does not check design or business correctness |

Ordinary typechecking does not cover every Story: the current prototypes TypeScript configuration excludes `*.stories.tsx`. Validate new Stories with a Storybook build, browser tests, and a rendered preview as well.

Run `pnpm generate` under the relevant rules only when the task changes tokens, component metadata, or other generation inputs. Inspect generated changes before validating. Do not rewrite generated files, remove assertions, or update visual baselines just to hide unrelated failures.

## Give AI reproducible feedback

Address one connected set of problems at a time and preserve what already works:

```text
Target: this task's MatchaPractice Story, English, light theme, 375px.
Reproduce: open the page and scroll to Popular Matcha Picks.
Actual: a product title in the second row overlaps its price; screenshot attached.
Expected: keep the products and their order, and fix this narrow-screen issue.
Scope: diagnose first. Do not change other sizes or shared component contracts.
If a shared component must change, explain the impact and wait for confirmation.
Then recheck this item and any affected items. Report files, results, and gaps.
```

After fixing the issue, update the same review record. If the change has a wider impact, recheck the relevant combinations rather than capturing only the originally broken area.

## Record results and open issues

```text
Task / owner:
Commit / uncommitted changes:
Story or page URL:
Data mode / fixture path / snapshot ID:
Locales, themes, and viewports checked:
Checklist results and screenshots:
Technical commands, results, and reasons for skipped checks:
Known issues, impact, and next owner:
Self-check: pending / needs fixes / ready for review
Review: pending / changes requested / approved
Release: not requested / awaiting authorization / published and verified
```

Record demo behavior, unconnected services, and untested devices as open limitations. Do not combine “opens successfully,” “tests pass,” “review approved,” and “published” into a single completion status.

## Next step

After self-checks, follow [Share previews and review](/en/docs/review-preview) to provide a version teammates can access. After review, follow [Deliver and publish a page](/en/docs/deliver-publish) for handoff and authorization. This checklist does not grant permission to merge or publish.
