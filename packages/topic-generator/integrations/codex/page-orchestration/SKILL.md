---
name: page-orchestration
description: This skill should be used when the user asks to "orchestrate a landing page", "choose a landing page type", "route a selection strategy", "create a LandingPageExecutionPlan", "support multiple landing page types", or coordinate Strategy, Content, Visual, and Review Agents. Do not use it to select products, write copy, generate images, or approve publication.
---

# Page Orchestration

Create one constrained execution-plan proposal from a `landing-page-orchestration-run/v1`
task. Keep routing judgment in the Orchestrator Agent and keep workflow authority in
`@yami/topic-generator`.

## Workflow

1. Require `status: needs-execution-plan-proposal`. Stop on `blocked` or any other state.
2. Read the complete `context.themeIntent`, caller constraints, `pageTypes`, selection strategies,
   and templates.
3. Select exactly one registered page type compatible with `ThemeIntent.themeType`.
4. Preserve `requestedPageTypeRef` and `requestedSelectionStrategyRef` exactly. Treat non-null
   values as hard caller constraints.
5. Select exactly one route declared by the chosen page type. Copy its
   `selectionStrategyRef` and `templateRef` without modification.
6. Return one `landing-page-execution-plan-proposal/v1` bound to the task keyword, site,
   language, and ThemeIntent digest.
7. Submit the proposal to the deterministic runtime. Accept the result only when the runtime
   returns `status: ready` with `landing-page-execution-plan/v1`.
8. Report every rejected field or blocker. Do not silently select a different route after
   validation fails.

For automatic HTTP execution, respond through `topic-page-agent-response/v1` with
`stage: workflow-planning` and place the proposal in `proposal`.

## Routing rules

- Use only page types, strategies, templates, and routes included in the task context.
- Require an explicit matching `requestedPageTypeRef` for configurations marked
  `requiresExplicitRequest`.
- Treat the execution-plan stage graph, retry limits, and allowed review rollback stages as
  deterministic output owned by the runtime. Do not place them in the proposal.
- Prefer a route that satisfies caller constraints and the resolved ThemeIntent. Do not optimize
  for model preference, novelty, or an unregistered future capability.
- Stop when ThemeIntent is unresolved. Do not reinterpret intent inside this Skill.

## Boundaries

- Do not retrieve products, infer categories, assign product pools, or create shopping scenes.
- Do not create or edit PagePlan modules.
- Do not write page copy, prompts, alt text, or image metadata.
- Do not invoke Content, Visual, or Review work before the runtime validates the execution plan.
- Do not change artifact digests, stage order, retry limits, or rollback policy.
- Do not retry indefinitely or route to an undeclared Agent.
- Do not approve review or publication.

## Additional resources

Read [execution-plan contract](references/execution-plan-contract.md) before producing a proposal
or interpreting a rejected route.
