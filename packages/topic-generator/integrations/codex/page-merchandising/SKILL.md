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
   Category-role templates require four to six validated source scenes. Current relevance templates
   expose two to six catalog-backed source scenes when evidence supports Start Here; the returned
   module rules remain authoritative.
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

On a second bounded attempt, `context.previousProposalIssues` contains the exact deterministic
validation failures from the first proposal. Correct every listed issue while preserving all frozen
inputs and digests. Do not repeat the rejected proposal or change upstream evidence.

## Create one proposal

Create exactly one `module-merchandising-proposal/v1` bound to the returned keyword, site,
strategy, template, `themeIntentDigest`, and `productSelectionDigest`.

- Preserve `moduleOrder` and define exactly one module for each returned rule.
- Treat each returned `component` as immutable template ownership; never substitute another UI
  component in the proposal.
- Add `scenes` and assignment `sceneId` only when that exact returned module rule includes
  `sceneRange`. When `sceneRange` is absent, return `scenes: []` and omit every assignment
  `sceneId`, even when ProductSelection contains themes or the module ID is `start-here`.
- For a scene-bearing relevance Start Here, normally keep three to five distinct source scenes while
  respecting the returned two-to-six hard range. Preserve source-scene order, use each selected
  source scene at most once, and assign four to sixteen products from that exact source scene. Do
  not default every scene to the four-product minimum: use four for a focused one- or two-step task,
  six to ten for a standard multi-step routine, and twelve to sixteen only for a broad,
  evidence-rich scenario where the additional products add distinct roles or meaningful choice.
  Every returned source scene provides `minimumRecommendedProducts` and `maximumProducts`; declare
  an integer `targetProductCount` inside each current relevance page scene, keep it inside that
  evidence-sized range, and assign exactly that many products. Never pad with near-duplicates to
  reach a larger count. The Runner executes this as two bounded passes. First create the complete
  proposal from text evidence without images. When `context.visualReviewTask` is present, treat its
  `textProposal` as that first-pass shortlist, inspect every attached `product:<id>` image, and
  return a corrected complete proposal rather than restarting the assortment from the full pool.
  Do not place two visually identical listings of the same brand, product, size, and pack count in
  one scene; confirm the image judgment with the returned title and keep distinct sizes, formulas,
  and multipacks separate. For confirmed duplicate listings, retain the product with the higher
  `soldCount`; when sales are missing or tied, retain the lower `sourceRank`. The visual pass must
  also include the required `visualReview` receipt defined in the proposal contract. Keep the
  source scene's shopper goal and evidence reason unless a clearer planning-only phrasing is needed
  in the requested language.
- Use only product IDs in `context.products`; preserve their pool and role constraints.
- Treat `shoppingGoal` as planning metadata, not final customer-facing copy.
- For a category-role `@2` task, copy the complete ordered assignments from each returned
  `selectionModules` entry into StartHere, Popular Picks, Brand Spotlight, and Explore More. Do not
  truncate, reorder, or move those products.
- For a current relevance `@2` task, Popular Picks and Explore More are also frozen
  ProductSelection-owned modules. In the shared Agent workflow, keep both modules present with
  their planning metadata and return `assignments: []`; the deterministic host materializes every
  ordered assignment from `selectionModules` after the proposal. For a direct CLI proposal, copy
  those complete assignments yourself. Never truncate, reorder, move, or reselect those products.
  The Agent may still review Hero, Shortcuts, and the scene composition of Start Here.
- Whenever `context.selectionModules` contains Brand Spotlight, keep it hidden when its groups are
  empty. When it contains two to six brand groups, make the module visible and copy every group in
  order with exactly three products. Add the exact group ID to each assignment; do not drop a
  brand, mix brands, substitute products, or collapse the result to one dominant brand.
- For a scene-bearing category-role task, preserve every returned source scene exactly once and in
  order. A reshaped page scene may change its ID and planning text, but it must copy every ordered
  product from both source groups.
- For a proposal-owned relevance task, prefer distinct products across modules. If a product is
  intentionally used again, add a concise `reuseReason` to every assignment after its first module;
  a reason is required even when the repeated product is eligible for both modules.
- Hero and Shortcuts may reference only products already owned by a selection module. Explain the
  later cross-module reference with `reuseReason`; it is audit metadata and never permits reuse
  between ProductSelection-owned modules.
- Compose Hero from three to five eligible core products when the returned evidence contains at
  least three; use every selected product in the Hero. Smaller pools may use the returned minimum.
  Treat `weeklySalesLabel` as ranking evidence, not an absolute order: keep a strong high-selling
  anchor, then use the returned title, category, brand, and source image to avoid obvious duplicate
  variants and create a representative visual set. Products may share a brand or category when that
  is the truthful catalog shape. A lower-ranked product needs a concise merchandising reason; never
  invent a product-family ID or claim that the catalog marks two products as variants when it does
  not.
- Add a concise `selectionReason` to every Hero assignment. Explain that product's role in the
  composition using only returned ranking, category, brand, title, availability, and image
  evidence. Write it in the returned task `language`. A module-level reason does not replace the
  per-product rationale.
- Use distinct source image URLs for every Hero assignment. The deterministic reviewer rejects an
  accepted proposal when two assigned products resolve to the same source image.
- When `context.selectionModules` contains a visible `shortcuts` module with groups, add exactly one
  Shortcuts assignment for each group in the returned group order. Copy the exact group ID into
  `groupId`, choose `productId` only from that group's `productIds`, and add a concise
  `selectionReason` in the returned task `language`. Use distinct source image URLs across the
  chosen representatives. Do not rename, merge, reorder, add, remove, or truncate ProductSelection
  groups. Shortcuts is the directory for the same ordered category tabs in the comprehensive
  recommendation module, so a fixed display-count cap is not authoritative.
- Hide an optional module when evidence is absent. In particular, do not invent reviews, ratings,
  claims, brands, products, or image concepts.
- Before returning, verify that every visible scene-bearing module satisfies both `sceneRange` and
  `productsPerSceneRange`, every assignment has the required scene/group metadata, and every reused
  product after its first module has `reuseReason`.

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
Preserve its `digest`, `contentTaskId`, and `assetTaskIds`; use the `page-copywriting` Skill for
content tasks and do not fill either task type in this Skill.

## Architecture boundary

The shared TOPIC GENERATOR Agent supplies semantic judgment through this Skill. The
`@yami/topic-generator` PageMerchandising Module owns template rules, schema validation, product
membership checks, reuse policy, task IDs, and deterministic PagePlan compilation. Programmatic
hosts may inject the same capability with `runPageMerchandisingAgentWorkflow` or route a
`topic-page-agent-request/v1` `module-merchandising` stage to it; this does not create a second
business-rule engine.

The standalone `selection` request runs this Agent stage after ProductSelection and returns the
accepted Hero assignments, group-bound Shortcuts representatives, and reviewed Start Here scenes as
the formal selection result. If the Agent or its proposal is unavailable, the response must label
each affected module as an explicit deterministic fallback: code keeps the PrimaryPool lead,
prefers additional verified product types, preserves one representative per frozen Shortcuts group,
retains catalog-backed Start Here candidates, removes repeated source images, and exposes the
blocking issues. Never present that fallback as Agent-reviewed output.
