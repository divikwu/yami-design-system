---
slug: component-gaps
title: Report component gaps
description: "Turn a page limitation into a reproducible request so maintainers can decide whether to reuse, fix, or extend a component."
group: maintenance
order: 140
keywords: ["component gaps", "feedback", "reproduction", "reuse"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/design-system/SKILL.md
  - packages/design-system/generated/catalog.json
  - packages/design-system/components/AspectRatio/usage.md
---

For page creators, designers, and component maintainers. You do not need to implement a component first. The goal is for someone else to understand and reproduce the problem.

## Start with a concrete scenario

Prepare a preview or screenshot, the component name, the current code revision, and the user action you want to support.

Describe the behavioral difference before prescribing a solution. “A long title covers the action on narrow screens” is easier to investigate than “add a custom-height prop.”

Colleagues without code access can supply an accessible preview and reproduction steps; the task owner can add revision information.

## Check the existing capabilities

1. Look for a related component in the [Storybook component catalog](https://yami-design-system-storybook.vercel.app).
2. Read its Usage and Controls to confirm the relevant props, states, and supported scope.
3. Reproduce with the same copy, data, and viewport; do not compare a default example with an unrelated business case.
4. Ask AI to check the component's `meta.json`, `usage.md`, Story, and public exports, then list the approaches already tried.

For example, `AspectRatio` controls geometry only. Cropping, loading states, and backgrounds belong to its consumer and should not automatically become new props.

If existing props or a composition of public components solves the issue, record the usage instead of adding a capability.

## Submit reproducible feedback

Send the following information to your team's task owner or component maintainer. Use the team's agreed channel; an automated issue system is not assumed to exist.

```text
Page and task:
Owner:
Component and Storybook page:
Code revision or commit:
Locale / theme / viewport:
Data mode and snapshot identifier:
Reproduction steps:
Current behavior:
Expected behavior:
Props or compositions already tried:
Other affected scenarios:
Preview, screenshots, or minimal example:
Does this block the current task?
```

Mark the affected area in screenshots and include the action sequence for interaction issues. Use fixed data for formal review so changing product content does not prevent reproduction.

Remove personal information, access tokens, and unnecessary business data before sharing. A private repository does not make every dataset appropriate to share.

## Agree on a resolution

| Finding | Next action |
| --- | --- |
| The capability exists but its usage is unclear | Correct the page call and improve the example. |
| Behavior contradicts the existing contract | Add a failing test, fix the issue, and check other consumers. |
| The same component needs a reusable presentation | Define the variant and default behavior before extending it. |
| A distinct interaction responsibility appears repeatedly | Evaluate a new component's boundary, data, and states. |
| The requirement serves one campaign or project | Keep it in the project rather than automatically adding it to the library. |

Agree on ownership, acceptance criteria, and the impact on the current task before changing shared code. Document any temporary workaround's scope, limits, and follow-up owner.

## Check that the report is actionable

- Another colleague can follow the steps and observe the same result.
- Expected behavior has a pass-or-fail condition, not only “make it look better.”
- The maintainer has confirmed a direction and an owner.
- The current task knows whether to continue, wait for a fix, or use an agreed workaround.

The output is an agreed problem record, not a promise that a new component must be created.

## Common questions

**AI already wrote a component. Should we merge it?** Check it against the current components and their contracts first. Working code is not proof that the implementation belongs in the shared library.

**Can I build something only my page needs?** Yes, within the project. Avoid changing shared defaults and label it as project-specific rather than a maintained public capability.

**The maintainer cannot reproduce it.** Add the revision, input data, viewport, and action sequence. Align the environment before debating visual or behavioral differences.

## Next step

Once the direction is agreed, continue to [Create a component](/en/docs/create-components). Use the prompts in [Start creating](/en/docs/prepare-environment) to prepare the request.
