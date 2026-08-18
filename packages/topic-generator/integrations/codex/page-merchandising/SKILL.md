---
name: page-merchandising
description: This skill should be used when the user asks to "plan Topic page modules", "generate module themes and shopping scenes", "assign selected products to page modules", "create a ModuleMerchandisingProposal", "compile PagePlan v2", or continue from a ready ProductSelectionResult into page strategy. Do not use for selecting new products, writing final page copy, or generating images.
---

# Page Merchandising

Use the package CLI as the deterministic runtime. Act as the PageMerchandising stage of the shared
TOPIC GENERATOR Agent: propose module goals, reshape validated shopping scenes, and assign frozen
products. Never reproduce validation or PagePlan compilation in prose or ad hoc code.

## Prepare the handoff

1. Complete the `product-selection` Skill until `productSelection.run.status` is `ready`.
2. Preserve the accepted ThemeIntent plus the complete taxonomy, category proposal, candidate
   snapshot, and scene proposal used by that ready run. The CLI reconstructs and validates both
   upstream artifacts on every call.
   Brand, Topic, and Campaign `@1` templates require four to six validated source scenes; use the
   category-role strategy for those templates. Use `topic-landing/relevance@1` for a ready
   `relevance/default@1` result: its rules hide scene-dependent modules and never permit invented
   source scenes.
3. Use a caller-supplied versioned template. If none is supplied, map only a resolved ThemeIntent:
   `relevance/default@1` to `topic-landing/relevance@1`, `brand` to
   `topic-landing/brand@1`, and `product` or `activity` to
   `topic-landing/topic@1`. `topic-landing/campaign@1` requires an explicit caller choice or campaign
   brief; never infer a Campaign page from the Topic alone. Stop for `uncertain` or unresolved intent.

## Request the bounded task

Rerun the command that produced the ready ProductSelectionResult and add the template:

```bash
pnpm topic-generator:analyze -- --keyword "<keyword>" \
  --selection-strategy category-role/landing-page-agent@1 \
  --taxonomy "<taxonomy.json>" \
  --category-proposal "<categories.json>" \
  --candidate-snapshot "<candidates.json>" \
  --scene-proposal "<scenes.json>" \
  --page-template topic-landing/topic@1 \
  --pretty
```

Expect `pageMerchandising.status` to be `needs-module-proposal`. Read the complete returned
`context`, then read [the proposal contract](references/module-merchandising-contract.md) before
creating JSON.

## Create one proposal

Create exactly one `module-merchandising-proposal/v1` bound to the returned keyword, site,
strategy, template, `themeIntentDigest`, and `productSelectionDigest`.

- Preserve `moduleOrder` and define exactly one module for each returned rule.
- Treat each returned `component` as immutable template ownership; never substitute another UI
  component in the proposal.
- Use only product IDs in `context.products`; preserve their pool and role constraints.
- Treat `shoppingGoal` as planning metadata, not final customer-facing copy.
- Reshape a scene only through a returned `sourceSceneId`. Assign only products already contained
  in that source scene.
- Explain every cross-module product reuse with `reuseReason`. Never duplicate a product inside one
  scene.
- Hide an optional module when evidence is absent. In particular, do not invent reviews, ratings,
  claims, brands, products, or image concepts.

Write the proposal to a new caller-approved path. Do not overwrite ProductSelection artifacts.

## Compile the plan

Rerun the same command with:

```bash
--page-template topic-landing/topic@1 \
--module-proposal "<module-merchandising-proposal.json>"
```

Accept the result only when `pageMerchandising.status` is `ready`. On `blocked`, report every issue
and revise only the proposal; never patch the frozen ProductSelectionResult or its digest.

The ready `topic-page-plan/v2` is the handoff to the independent Content and later Visual stages.
Preserve its `digest`, `contentTaskId`, and `assetTaskIds`; use the `content-writing` Skill for
content tasks and do not fill either task type in this Skill.

## Architecture boundary

The shared TOPIC GENERATOR Agent supplies semantic judgment through this Skill. The
`@yami/topic-generator` PageMerchandising Module owns template rules, schema validation, product
membership checks, reuse policy, task IDs, and deterministic PagePlan compilation. Programmatic
hosts may inject the same capability with `runPageMerchandisingAgentWorkflow` or route a
`topic-page-agent-request/v1` `module-merchandising` stage to it; this does not create a second
business-rule engine.
