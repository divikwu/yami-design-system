---
slug: templates
title: Task and prompt templates
description: "Share one context with teammates and AI using templates for requirements, building, feedback, review, and contributions."
group: resources
order: 180
keywords: ["Templates","Prompts","Requirements","Review","AI"]
updatedAt: "2026-08-31"
sourceRefs:
  - packages/design-system/SKILL.md
  - docs/ai-workflow.md
  - docs/adr/007-evaluation-first-live-prototypes.md
---

Fill in the brackets before sharing a template with AI or a teammate. Remove irrelevant fields and mark unknowns as “needs confirmation.” Never include secrets, personal information, or business material you are not authorized to share.

## Page brief

```text
Task name: [Name and task ID]
Owner / reviewer: [Names]
Target user and job: [One main goal]
Reference: [Specific Storybook URL or screenshot]
Preserve: [Structure and interactions to reuse]
Change: [Copy, products, imagery, modules]
Inputs: [Sources, usage permissions, fixed data version]
Languages / themes / viewports: [Supported scope]
Interaction outcomes: [What each main action does]
Out of scope: [Real transactions, payments, API integration, etc.]
Acceptance criteria: [Verifiable outcomes]
```

Agree on the brief, then [start and manage a task](/en/docs/manage-tasks) to save context and create an independent task version.

## First AI build

```text
Complete this page task in the current YAMI Fork: [Paste the agreed brief].

Check the branch, uncommitted changes, and task directory first.
Do not overwrite other work. Read packages/design-system/SKILL.md,
then follow its directions for standards, component contracts,
and the closest maintained page. Report your reuse plan and file scope first.

Use public components and existing data shapes. Do not copy component
implementations, hard-code brand values, or overwrite default fixtures
with my business content. Create an independent practice version.
Keep Chinese and English information equivalent.
Flag missing assets, data, permissions, or interaction requirements.

Open or reuse this task's preview, inspect rendering and behavior,
run relevant checks, and report file paths, opening instructions,
results, and known issues.
Do not commit, push, merge, or deploy unless I separately request it.
```

For your first attempt, follow [Build your first page](/en/docs/first-page) instead of asking AI to guess component paths in an empty project.

## Change feedback

```text
Version: [Branch and commit SHA, or explicitly uncommitted draft]
Page / Story: [Specific URL]
Conditions: [Language, theme, viewport, data snapshot]
Location: [Module, element, or annotated screenshot]
Actual behavior: [What happens and steps to reproduce]
Expected behavior: [Observable result after the change]
Keep unchanged: [Other areas, copy, interactions]
Allowed scope: [Task files or module]

Identify the cause and scope first, then fix only this issue.
Verify under the same conditions and check adjacent states for regressions.
```

Prefer one verifiable issue per feedback item. “Make it more polished” or “optimize it” does not define a reliable change scope.

## Review and handoff record

```text
Task / owner / reviewer:
Fork, working branch, commit SHA, upstream baseline:
Preview URL and access method:
Specific page / Story:
Language, theme, viewport:
Scenario / Snapshot / Live:
Fixed data version and asset version:
Changes and exclusions:
Shared acceptance checklist: [Results, evidence, or not-applicable reason]
Validation commands and results:
Known issues, blockers, and open decisions:
Review decision: [Pending / changes requested / approved]
Release status: [Not deployed / authorized by whom, deployed where]
Rollback version:
```

Use the [shared acceptance checklist](/en/docs/review-checklist#use-the-shared-acceptance-checklist) rather than maintaining a competing standard. Label screenshots alone as “static review material,” not a completed interaction review. Prefer a fixed Snapshot for formal review and record its identifier.

## Shared capability contribution

```text
Shared problem:
Affected pages / components and reproduction steps:
Reuse approaches already tried:
Why this is not only a project-specific requirement:
Smallest capability to contribute:
Business content staying in the Fork:
Behavior, API, or default changes:
Compatibility impact and migration notes:
Story, usage docs, metadata, public exports, and tests:
Upstream baseline and isolated contribution branch:
Decisions needed from maintainers:
```

Prepare a focused PR using [Contribute upstream](/en/docs/contribute-upstream). A proposal or passing checks does not authorize merging or deployment.

## Before sharing

Check that recipients can open the links, data and screenshots reveal no sensitive material, and verified results are distinct from open questions. For workflow problems, consult [Frequently asked questions](/en/docs/faq).
