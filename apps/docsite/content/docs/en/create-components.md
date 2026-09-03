---
slug: create-components
title: Create a component
description: "Decide whether to reuse, extend, or create a component, then complete its implementation, contract, Storybook examples, and checks."
group: ai
order: 45
keywords: ["create components", "variants", "meta", "Storybook", "public exports"]
updatedAt: "2026-09-03"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/DESIGN.md
  - packages/design-system/components/AspectRatio/meta.json
  - packages/design-system/components/AspectRatio/AspectRatio.stories.tsx
  - packages/design-system/components/index.ts
  - packages/design-system/package.json
  - tooling/catalog/build.mjs
  - tooling/registry/build.mjs
  - package.json
---

Use this workflow to reuse, extend, or create a shared component. First check whether a component reference exists, then use the matching prompt and follow the implementation, Storybook, and acceptance requirements below. If the shared-component need is unclear, [report the gap first](/en/docs/create-components#report-a-component-issue).

## Check the component reference

| Available input | What AI should do first |
| --- | --- |
| A YAMI component or code reference | Inspect its Story, `meta.json`, `usage.md`, source, and tests; decide whether to reuse or extend it |
| A design, screenshot, or webpage | Extract responsibility, structure, states, and interaction; do not copy comment markers, temporary state, third-party branding, or restricted assets |
| No component reference | Search the YAMI Catalog, Components, and Storybook from the user task; propose a new component only after confirming no suitable capability exists |

“No reference” does not mean generating freely from a blank canvas. List reusable or composable capabilities before deciding that a shared component is necessary.

## Copy a component prompt

### With a component reference

```text
Create or extend a component in the current YAMI project.

Component goal: <problem to solve>
Target users: <people who will ultimately see or operate it>
Usage context: <pages or flows where it appears>
Required behavior: <states, content, and interactions>
Component reference: <Storybook URL, component name, design, or screenshot>

- Inspect the existing capabilities and reference. Explain whether to reuse, extend, or create a component before implementing it.
- Handle only this requirement. Do not duplicate a component or change unrelated files.
- Verify real rendering and interaction in Storybook.
- Report the final decision, changed files, Story URL, verification results, and open issues.
- Do not commit, push, or publish.
```

### Without a component reference

```text
Handle this component requirement in the current YAMI project:

Component goal: <problem to solve>
Target users: <people who will ultimately see or operate it>
Usage context: <pages or flows where it appears>
Required behavior: <states, content, and interactions>

- Search the existing components and list candidates that can be reused or composed.
- Do not create a component when an existing capability is sufficient. Create one only when it has a distinct, reusable responsibility that existing composition lacks.
- Handle only this requirement. Do not change unrelated files or invent missing design values or business data.
- Verify real rendering and interaction in Storybook.
- Report the search results, final decision, changed files, Story URL, verification results, and open issues.
- Do not commit, push, or publish.
```

## Fill in the component task

Prepare at least the following before copying a prompt. Mark missing information as “to confirm”:

- Component goal: what problem it needs to solve.
- Target users: who will ultimately see or operate it.
- Responsibility boundary: what the component owns and explicitly does not own.
- Usage contexts: which pages or flows should reuse it.
- Inputs and states: props, content, interaction outcomes, and applicable loading, empty, error, and disabled states.
- Reference scope: what to follow, what to preserve, and what must not be copied.
- Change scope: allowed changes, compatibility requirements, and files or behavior that must remain untouched.
- Acceptance scope: Story, locales, themes, viewports, keyboard behavior, and primary interactions.

Do not provide passwords, access tokens, customer information, or unapproved assets to AI.

## Choose the smallest extension

| Approach | When it fits | Boundary to preserve |
| --- | --- | --- |
| Compose existing components | The change concerns module order, content, or page layout | The page owns composition without changing primitive defaults. |
| Extend an existing variant | One responsibility needs a reusable presentation or state | Use clear semantics and keep existing calls predictable. |
| Create a component | The capability has a distinct responsibility that existing composition cannot reasonably express | Define inputs, outputs, interactions, and exclusions. |

Record the choice and reasoning in the task. Do not copy a shared component merely because one page needs a different appearance.

## Report a component issue

If a component behaves unexpectedly or lacks a capability you need, ask AI to investigate the scenario first. You do not need to decide whether it is a usage issue, a defect, or a new component requirement.

```text
Investigate this component issue and prepare feedback for the maintainer.
Page or component: <Story URL, component name, or project location>
Observed behavior: <what I did and what happened>
Expected result: <what should happen>
Reference: <screenshot or recording, optional>

- Inspect existing usage and props, then reproduce with the same content and viewport.
- Explain whether existing props or composition can solve it; propose improvements only for a real defect or missing capability.
- Fill in the version, reproduction steps, attempted approaches, and impact on this task.
- Prepare a short report for me to share with the maintainer.
- Do not create a component or submit a ticket automatically.
```

If an existing capability is sufficient, continue with the usage AI explains. Agree on the direction with a maintainer before changing a shared component. After implementation and verification, [Share components and pages](/en/docs/contribute-upstream).

## Check the delivery

- The report explains the search results and the decision to reuse, extend, or create a component.
- Real rendering and primary interactions were verified in a specific Story.
- Changed files, verification results, and open issues are listed.
- No unrelated files, project data, secrets, or unapproved assets were added.

## Next step

After local completion, continue to [Share components and pages](/en/docs/contribute-upstream). Passing checks does not automatically authorize committing, merging, or publishing.
