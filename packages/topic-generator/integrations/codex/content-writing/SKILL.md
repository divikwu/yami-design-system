---
name: content-writing
description: This skill should be used when the user asks to "write Topic page copy", "create localized module copy", "complete contentTaskId tasks", "create a TopicPageContentProposal", "compile a TopicPageContentSpec", or continue from a ready TopicPagePlan v2 into evidence-bound copy. Do not use for topic analysis, product selection, module or scene allocation, review fabrication, or image generation.
---

# Content Writing

Act as the independent Topic Content Agent. Write localized customer-facing copy only for the
content tasks declared by a ready PagePlan. Treat all returned products, scenes, components, task
IDs, and digests as immutable.

Use whichever deterministic runtime the caller provides:

- In a repository checkout with Node and pnpm, use the package CLI shown below.
- In Codex App or Kiro IDE, load this Skill natively; installing `codex` or `kiro-cli` is not a
  prerequisite. Use the Host tool or API when it provides the pending content context and proposal
  validation.
- In automatic Web mode, respond through the configured HTTP Agent Endpoint.

If neither the package CLI nor an equivalent Host validator is available, stop after an explicitly
marked unverified proposal draft. Never claim that a ContentSpec is ready without deterministic
review.

## Prepare the handoff

1. Complete the `page-merchandising` Skill until `pageMerchandising.status` is `ready`.
2. Preserve the exact inputs that reconstructed ThemeIntent, ProductSelectionResult, and PagePlan.
3. Select exactly one requested language, `en` or `zh`. Run the stage separately for a second
   language; never mix languages in one proposal. For `en`, write every generated title,
   description, tag, item label, and scene label in English except immutable proper nouns. For
   `zh`, use Simplified Chinese except immutable proper nouns.
4. Stop when the PagePlan is absent, blocked, or digest-invalid. Never repair upstream artifacts in
   this Skill.

## Request the bounded tasks

Rerun the command that produced the ready PagePlan and add the language:

```bash
pnpm topic-generator:analyze -- --keyword "<keyword>" \
  --selection-strategy category-role/landing-page-agent@1 \
  --taxonomy "<taxonomy.json>" \
  --category-proposal "<categories.json>" \
  --candidate-snapshot "<candidates.json>" \
  --scene-proposal "<scenes.json>" \
  --page-template topic-landing/topic@2 \
  --module-proposal "<modules.json>" \
  --content-language zh \
  --pretty
```

Expect `pageContent.status` to be `needs-content-proposal`. Read the complete returned `context`,
then read [the content proposal contract](references/topic-page-content-contract.md). Process only
the returned tasks and `copySlots`. For active `@2` templates, require
`copyPolicyRef: topic-page-copy/evidence-bound@1`; obey every returned `copyRules` character limit
and cite only IDs listed by `eligibleThemeIntentEvidenceIds`.

## Compose customer-facing copy

Before writing, build a compact copy brief from the returned context:

1. Read `themeIntent.themeType`, `canonicalEntity`, `shoppingIntent`, `shopperAction`, verified
   constraints, needs, conditions, and evidence. Use them to determine the page proposition.
2. Read `templateRef` to distinguish Brand, Topic, and Campaign copy. Brand copy should clarify the
   brand's available product breadth; Topic copy should help shoppers compare or discover; Campaign
   copy should organize the declared occasion or shopping action.
3. For each task, use only its `shoppingGoal`, scenes, assigned products, and selected categories.
   Give every visible module a distinct customer decision to support.
4. Write natural copy for the requested locale. Prefer concise, specific shopping language over
   generic labels or full catalog product titles. Before returning the proposal, scan every copy
   segment and rewrite accidental mixed-language output; brand and product names are the only
   expected exceptions.
5. Keep implementation language out of the page. Do not mention Agent, PagePlan, evidence,
   validation, catalog internals, frozen pools, or phrases such as "已验证的商品池" in customer copy.
6. Use multiple relevant evidence inputs when the slot warrants it: the Hero proposition should
   reflect ThemeIntent plus assigned product or category evidence; scene copy should reflect its
   declared scene and products.
7. Treat `themeIntent.evidenceRefs` as the complete audit record, not an automatic content
   allowlist. Only `eligibleThemeIntentEvidenceIds` may support generated claims. Wikipedia or
   other public background text is unavailable unless the runtime later declares a separate,
   digest-bound background evidence namespace.

Planning goals guide tone and structure but never authorize ingredient, benefit, efficacy,
popularity, inventory, discount, rating, or customer-outcome claims.

## Create one proposal

Create exactly one `topic-page-content-proposal/v1` bound to the returned keyword, site, language,
`topicPagePlanDigest`, `themeIntentDigest`, and `productSelectionDigest`.

- Preserve task order and repeat each `taskId`, `moduleId`, and `component` exactly.
- For `shortcuts`, preserve assignment order and copy each exact `assignments[].slotId` into the
  matching `copy.items[].slotId`; never omit, renumber, or invent a slot ID.
- Populate only the returned copy slots. Keep ProductList product names, brands, prices, links, and
  other catalog identities outside generated copy.
- Attach at least one valid evidence reference to every title, description, tag, item label, and
  scene label. Use only the namespaces returned by the runtime.
- Cite a product only inside the module where PagePlan assigned it. Within scene copy, cite only
  products assigned to that scene.
- Keep claims no broader than their evidence. Treat planning goals as direction, not proof of
  ingredients, benefits, popularity, ratings, inventory, discounts, or customer outcomes.
- Keep module copy differentiated. Do not reuse the same generic "精选 / 探索更多" proposition for
  the Hero, shortcuts, product rail, and waterfall when their shopping goals differ.
- Keep every segment in the requested language except immutable keyword, brand, product, and
  category names, and keep its character count at or below the matching returned `copyRules`
  limit.
- Keep review copy absent when verified review records are unavailable. Do not paraphrase or invent
  reviews.
- Exclude image prompts, art direction, alt text, and asset decisions. Hand the ready ContentSpec
  to the independent `visual-generation` Skill.

Write the proposal to a new caller-approved path. Do not overwrite ThemeIntent, ProductSelection,
PagePlan, or image artifacts.

## Compile the ContentSpec

Rerun the same command with:

```bash
--content-language zh \
--content-proposal "<topic-page-content-proposal.json>"
```

Accept the result only when `pageContent.status` is `ready`. Preserve the returned
`topic-page-content-spec/v1` digest for the Visual and QA stages. On `blocked`, report every issue
and follow `rollbackStage`: revise only the content proposal for `content-writing`, but return to
PageMerchandising for `module-merchandising`. When a `topic-page-content-attempt/v1` is available,
preserve it with the rejected proposal; a resume must reuse its PagePlan, ThemeIntent,
ProductSelection, and language bindings and must not silently invoke a second Agent attempt.

In automatic Host mode, accept only a `topic-page-agent-request/v1` whose stage is
`content-writing`, and return the proposal inside `topic-page-agent-response/v1` with the same
stage. Do not persist drafts or return image data from this stage.

## Architecture boundary

Keep the Topic Content Agent independent from the TOPIC GENERATOR Agent. Let TOPIC GENERATOR own
ThemeIntent, selected products, module visibility, scenes, assignments, and PagePlan task creation.
Let the `@yami/topic-generator` PageContent Module own digest checks, field validation, evidence
scope, and ContentSpec compilation. Use `runTopicContentAgentWorkflow` only as an injection seam;
never duplicate those rules in prompts or another service.
