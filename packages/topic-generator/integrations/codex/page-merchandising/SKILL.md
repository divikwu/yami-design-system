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
   Category-role templates require four to six validated source scenes. Relevance templates may
   expose theme groups without accepting page scenes; the returned module rules are authoritative.
3. Use the exact caller-supplied versioned template. The PageOrchestration Module owns routing from
   ThemeIntent and SelectionStrategyConfig; this stage must not substitute a different template.
   Stop for `uncertain` or unresolved intent.

## Request the bounded task

Rerun the command that produced the ready ProductSelectionResult and add the template:

```bash
pnpm topic-generator:analyze -- --keyword "<keyword>" \
  --selection-strategy category-role/landing-page-agent@1 \
  --taxonomy "<taxonomy.json>" \
  --category-proposal "<categories.json>" \
  --candidate-snapshot "<candidates.json>" \
  --scene-proposal "<scenes.json>" \
  --page-template topic-landing/topic@2 \
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
- Add `scenes` and assignment `sceneId` only when that exact returned module rule includes
  `sceneRange`. When `sceneRange` is absent, return `scenes: []` and omit every assignment
  `sceneId`, even when ProductSelection contains themes or the module ID is `start-here`.
- Use only product IDs in `context.products`; preserve their pool and role constraints.
- Treat `shoppingGoal` as planning metadata, not final customer-facing copy.
- For a category-role `@2` task, copy the complete ordered assignments from each returned
  `selectionModules` entry into StartHere, Popular Picks, Brand Spotlight, and Explore More. Do not
  truncate, reorder, or move those products.
- For a scene-bearing category-role task, preserve every returned source scene exactly once and in
  order. A reshaped page scene may change its ID and planning text, but it must copy every ordered
  product from both source groups.
- For a proposal-owned relevance task, prefer distinct products across modules. If a product is
  intentionally used again, add a concise `reuseReason` to every assignment after its first module;
  a reason is required even when the repeated product is eligible for both modules.
- Hero and Shortcuts may reference only products already owned by a selection module. Explain the
  later cross-module reference with `reuseReason`; it is audit metadata and never permits reuse
  between ProductSelection-owned modules.
- Compose Hero from one to three eligible core products. Treat `weeklySalesLabel` as ranking
  evidence, not an absolute order: keep a strong high-selling anchor, then use the returned title,
  category, brand, and source image to avoid obvious duplicate variants and create a representative
  visual set. Products may share a brand or category when that is the truthful catalog shape. A
  lower-ranked product needs a concise merchandising reason; never invent a product-family ID or
  claim that the catalog marks two products as variants when it does not.
- Hide an optional module when evidence is absent. In particular, do not invent reviews, ratings,
  claims, brands, products, or image concepts.

Write the proposal to a new caller-approved path. Do not overwrite ProductSelection artifacts.

## Compile the plan

Rerun the same command with:

```bash
--page-template topic-landing/topic@2 \
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
