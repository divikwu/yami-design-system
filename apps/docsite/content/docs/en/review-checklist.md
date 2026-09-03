---
slug: review-checklist
title: Check the page
description: "Give AI the page goal and URL, verify rendered behavior and relevant checks, and report anything left uncovered."
group: ai
order: 70
keywords: ["acceptance", "checklist", "responsive", "accessibility", "bilingual", "tests"]
updatedAt: "2026-09-03"
sourceRefs:
  - package.json
  - apps/storybook/package.json
  - apps/storybook/.storybook/preview.tsx
  - packages/prototypes/tsconfig.json
  - docs/adr/007-evaluation-first-live-prototypes.md
  - packages/design-system/DESIGN.md
---

Give AI the page or Story URL, its goal, and the areas that matter most. AI checks the rendered result, responsive behavior, interactions, and relevant technical evidence, fixes issues within this task's scope, and reports anything left uncovered. The responsible teammate still decides whether to hand off or publish.

## Copy the page-check prompt

Complete the first four fields, then send the full prompt to Codex or Kiro:

```text
Check whether the page in the current task is ready for handoff.

Page or Story: <specific URL>
Page goal: <what the user needs to accomplish>
Focus areas: <content, visuals, responsive behavior, interactions, or a specific issue>
Optional conditions: <locale, theme, screen size, data, or known limitations; use "decide automatically" if none>

- First confirm that the page and running service belong to the current project and task. Inspect the rendered result instead of checking only the HTTP status.
- Check content and data, Chinese and English, light and dark themes, narrow and wide screens, primary interactions and states, keyboard and accessibility behavior, and browser errors. Run validations relevant to this change; do not run unrelated commands.
- When you find a problem, explain its cause and impact, fix only issues within this task's scope, and check again. If a shared component must change or the scope must expand, explain the impact and wait for confirmation.
- Report: conclusion, fixes, changed files, actual conditions checked, command results, uncovered areas, and remaining issues.
- Do not commit, push, or publish.
```

Describe the page goal as a task the user needs to complete, not simply “match the screenshot.” If no locale, theme, or size is specified, let AI choose representative combinations based on the page's risks.

## Read the result

AI should give a clear conclusion together with the actual conditions checked and any uncovered areas:

| Result | Meaning | Next step |
| --- | --- | --- |
| Ready for handoff | No issue blocks the page goal | Continue to peer review or handoff |
| Needs fixes | A specific content, visual, interaction, or technical issue remains | Fix it and recheck the affected areas |
| Needs input | Missing content, data, access, or a business decision prevents a conclusion | Supply the missing information and continue checking |

“The page opens,” “automated tests pass,” “review approved,” and “published” are different results. AI must state what it actually opened and operated; an HTTP response or passing command is not a substitute for page verification.

## Change feedback

For a specific issue, attach the page link or an annotated screenshot and describe the current and expected behavior:

```text
Fix this page issue.
Page or screenshot: <link or annotated screenshot>
Current issue: <what is wrong and how to reproduce it>
Expected result: <what it should do or look like>

- Check the cause and fix only this issue, preserving other content and existing work.
- Verify with the same steps, then report the result and unresolved issues.
```

Focus each report on one issue and include the full error when available. AI identifies and adds the version and check records.

## Next step

After checking the page, use [Deploy and hand off](/en/docs/deliver-publish) to create a preview, transfer the work, or publish an approved version. A successful check does not grant permission to merge or publish.
