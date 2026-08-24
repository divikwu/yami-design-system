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
   `zh`, use Simplified Chinese except immutable proper nouns. When both locales are requested,
   reuse the same frozen ThemeIntent, ProductSelectionResult, and PagePlan in two locale-bound runs.
   Preserve the same proposition and evidence boundaries, but adapt each version naturally instead
   of translating word for word.
   The managed Web Host may schedule both locale-bound runs concurrently as one user action, but
   each Agent request and response still contains exactly one language and one proposal.
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
the returned tasks and `copySlots`, and obey the returned `claimPolicy`. For the newcomer flow,
require `copyPolicyRef: topic-page-copy/novice-guided@3`; treat every returned
`copyRules[].preferredLength` as a concise writing target and every `maxCharacters` as a
recommended layout ceiling. Both are advisory: copy outside either target remains valid and must
not be blocked or truncated by length alone. Cite
only IDs listed by `eligibleThemeIntentEvidenceIds` and
`eligibleBackgroundEvidenceClaimIds`. Older replay contexts may still use
`topic-page-copy/novice-guided@2` or `topic-page-copy/evidence-bound@1`.

When `context.candidateGeneration` is present, use candidate-generation mode instead of returning
a single `topic-page-content-proposal/v1`. Return one complete
`topic-page-content-candidate-set-proposal/v1` for the requested language:

- Copy every non-target task exactly once into `sharedTasks` in PagePlan task order.
- Copy `candidateGeneration.targetModuleIds` exactly into `targetModuleIds`.
- Return exactly five `candidates`, in the exact order of `candidateGeneration.directions`. Each
  candidate must copy its requested `id` into both `id` and `directionId`, and contain one complete
  task package for every target module in target-module order. Do not include shared tasks inside a
  candidate.
- Make each Hero plus Start Here package a genuinely different execution of its supplied `focus`;
  varying punctuation or synonyms is not a distinct candidate. Keep every package within the same
  frozen PagePlan, CopyBrief, language, evidence scope, copy rules, and immutable template values.
- Read both `focus` and `objective` for every direction. For a Brand brief, the five requested
  frames deliberately separate brand position, signature concept, routine role, need-led choice,
  and editorial discovery. Do not collapse them back into five versions of category browsing,
  routine navigation, or “find your entry point.” When eligible evidence contains a supported
  brand-defined idea or meaning, use it in the position or signature-concept package instead of
  defaulting to identity plus assortment navigation.
- Keep Hero copy customer-facing. Interface architecture is not a proposition: do not use the
  headline or tags to explain a “browse entry,” “start by category,” “start by need,” “view
  formats,” “浏览入口,” “从类别开始,” “从需求开始,” or “查看代表形态.” General verbs such as find,
  choose, and discover remain valid when their object is a supported brand idea, experience, use,
  or decision rather than the page itself.
- Within each Start Here package, make scene titles compact decision phrases and descriptions one
  short sentence. Do not consume the recommended ceiling by enumerating every category already
  visible in the product row; aim for the returned scene `preferredLength` before submission.
- Treat each candidate as if it will be compiled independently. Every required copy slot and
  evidence reference must therefore be complete and valid; never leave selection placeholders.

The Host deterministically validates all five packages, then sends the accepted set to the
independent Content Review Agent. That Agent selects one base package for each target module and
may choose complete Start Here scenes from other candidates by matching `sceneId`. The Host
assembles those selections with `sharedTasks` and exposes only one final ContentSpec; do not choose
or rank your own candidates in the response. Exact duplicate or semantically convergent candidates
produce advisory warnings and weaker selection preference, not generation failure.

## Compose customer-facing copy

When `context.proposalRevision` is present, the first proposal failed deterministic validation and
this is the automatic Host's second and final proposal attempt. Start from
`proposalRevision.previousProposal`, address every item in `proposalRevision.issues`, and return one
complete replacement proposal. Preserve every valid task, field, binding, and evidence reference;
replace only the invalid values with IDs and copy allowed by the returned context. Never remove or
invent evidence merely to silence validation. If `context.candidateGeneration` is also present,
the replacement must remain one complete five-candidate set proposal—not a single content proposal.

When `context.revision` is present, this is the automatic Host's second and final Content Agent
attempt. Start from `revision.previousContentSpec`, address every error in
`revision.review.issues`, and return one complete replacement proposal. Change only the cited copy
fields unless another field must change to keep the module coherent; preserve unaffected copy,
task order, evidence references, products, scenes, language, and every digest. Do not reinterpret
the theme or broaden the page plan. Before returning, compare every field named by an error with
its previous value. If an error requests a wording change and that field is unchanged, the revision
is not complete; rewrite it before submission.

When `revision.localizationReference` is present, use the reference ContentSpec as the semantic
anchor for the other locale. Match module IDs and scene IDs, preserving the same shopper need,
brand proposition, and decision while writing natural target-locale copy. Do not translate
literally, but do not replace a specific concern such as blemish care or hydration and brightening
with a broader or different scenario.

Before writing, use the returned digest-bound `copyBrief`:

1. Read `audienceContext`, `copyBrief.pageProposition`, `newcomerQuestions`, and every
   `moduleObjectives` entry. Assume no prior brand, product, or cultural knowledge. The page must
   answer what the topic is and where a first-time shopper should begin.
2. Read `themeIntent.themeType`, `canonicalEntity`, `shoppingIntent`, `shopperAction`, verified
   constraints, needs, conditions, and evidence. Use them to support the returned proposition.
3. For a `topic-page-copy-brief/v3`, follow `copyBrief.heroStrategy` instead of inferring a page type
   from the keyword. A Brand strategy may express an evidence-supported position, idea, distinction,
   or routine; a Topic strategy may express an experience, use, way to enjoy, or shopping
   inspiration; a Campaign strategy may express an occasion's atmosphere, emotion, ritual, or
   concrete task. These are creative directions, not required sentence templates. Older v2 replay
   contexts may fall back to `templateRef` and `themeIntent.themeType`.
4. For each task, use only its `shoppingGoal`, scenes, assigned products, and selected categories.
   Copy every returned `templateCopy` value verbatim; it is stable localized module chrome, not a
   prompt to generate a more analytical heading. Give the remaining dynamic copy slots a distinct
   customer decision to support.
5. Write natural copy for the requested locale. Follow `copyBrief.localizationStrategy` when
   present: one proposal serves one locale, and a paired locale uses native adaptation rather than
   literal translation. Prefer concise, specific shopping language over generic labels or full
   catalog product titles. Before returning the proposal, scan every copy segment and rewrite
   accidental mixed-language output. Treat
   `languagePolicy.immutableProperNouns` as the complete exception list: do not shorten a listed
   product title into a new English label or introduce terms such as `K-Beauty`, `Heartleaf`,
   `skincare`, `routine`, `serum`, or `toner` unless that exact value appears in the list. For
   `zh`, after mentally removing the listed values, no Latin letters may remain; for `en`, no CJK
   or Korean characters may remain.
6. Keep implementation language out of the page. Do not mention Agent, PagePlan, evidence,
   validation, catalog internals, frozen pools, or phrases such as "已验证的商品池" in customer copy.
7. Use multiple relevant evidence inputs when the slot warrants it: the Hero proposition should
   reflect ThemeIntent plus assigned product or category evidence; scene copy should reflect its
   declared scene and products.
8. Treat `themeIntent.evidenceRefs` as the complete catalog audit record, not an automatic content
   allowlist. Only `eligibleThemeIntentEvidenceIds` may support generated catalog claims. When the
   context contains a ready or partial `backgroundEvidence` bundle, use only its eligible claim IDs
   through `background:<claim-id>`. The Hero title or description must cite at least one eligible
   background claim. Background context may explain identity, origin, meaning, tradition, or
   terminology; it never proves product performance.
9. For a v3 brief, consider `copyBrief.topicSignature.primaryClaimId` first and its supporting claim
   second when they add useful identity or context. They are preferred topic signals, not mandatory
   wording. Their `context-only` scope never turns a cultural association into every product's
   origin, or a brand position into product efficacy.
10. Give the Hero one clear, user-facing proposition. A headline may be a positioning line,
    statement, action, emotion, or question; it may use find, discover, choose, or no verb at all.
    Do not force the keyword or a particular grammar when the page context makes the topic clear.
    Definitions, history, and shopping breadth usually work better in the description, but may
    appear in the headline when they form a natural, useful proposition rather than a taxonomy
    label. Judge the result, not the construction. Never turn the Hero into instructions for using
    the page or name the page's information architecture. A Brand Hero should answer what is worth
    understanding about this brand before it explains where to browse.
11. Use the Hero description to add useful identity, context, use value, and supported shopping
    range that the headline leaves unsaid. Prefer one sentence and allow two when clarity requires
    it; avoid simple repetition. Prefer 2–3 short tags and use a fourth when it adds a genuinely
    distinct evidence-supported direction. Keep Hero tags as browsing directions or category
    labels; do not use first, next, then, last, “先”, “再”, “最后”, or “补充” to imply a care order
    unless the cited evidence explicitly establishes that order. Use the Hero task's locale-specific
    `copyRules` to aim for its preferred title and description range before returning. For Chinese
    copy containing an immutable Latin brand name, judge the preferred range by rendered footprint
    as well as raw count; the Unicode `maxCharacters` value remains advisory. Do not repeat the
    complete ShortcutRail or Start Here taxonomy in the Hero description; use at most the few range
    examples needed to connect the proposition to the visible assortment.

Before returning, run a decision-usefulness check:

- For the Hero, evaluate the headline and description as one pair. Ask whether the pair naturally
  communicates what this page offers and whether an unrelated brand, product, or festival could use
  it unchanged. If it remains empty navigation such as “explore more” or “find your choice,” add an
  evidence-supported position, experience, occasion, identity, or shopping frame. Do not rewrite a
  useful title merely because it uses a general verb, a colon, a question, or omits the literal
  keyword when context is unambiguous.
- Ask whether the Hero explains why the topic or brand matters to the shopper, or merely explains
  how this page is organized. Rewrite page-navigation instructions and any Hero that restates the
  ShortcutRail's category list instead of adding a distinct proposition.
- For `start-here`, make the module title describe the whole topic journey, routine, or entry path
  instead of one scenario. Make every scene answer a specific shopper situation, comparison
  sequence, or choice. Keep each scene title compact and let one short description sentence add
  only the key comparison or next step. “View the products in this scene” is not a scene
  proposition, and a list of every visible category is not a concise substitute for one.
- Treat `shortcuts`, `popular-picks`, and `brand-spotlight` titles, plus the `explore-more`
  description, as template-owned copy. Their assigned products and group identities carry the
  module-specific merchandising logic; do not rewrite those stable structures into analysis prose.
  Generate one locale-native label for every returned `popular-picks` and `explore-more` group,
  preserving each group ID, order, product membership, and category scope exactly.
  `explore-more.title` is the only dynamic structural heading: prefer one short,
  locale-native topic anchor because it appears near the end of the page, but use a concise generic
  heading when adding the topic reads unnaturally. Do not repeat the topic across neighboring
  headings, restate the Hero, or list categories in this title.
- Apply the interchangeability test to Hero and dynamic scene copy, not to the returned localized
  template labels.

Planning goals guide tone and structure but never authorize ingredient, benefit, efficacy,
popularity, inventory, discount, rating, or customer-outcome claims.

## Create the requested proposal

Without `context.candidateGeneration`, create exactly one `topic-page-content-proposal/v1`. With
candidate-generation mode, create exactly one `topic-page-content-candidate-set-proposal/v1` using
the shared-task and five-package rules above. Bind either response to the returned keyword, site,
language, `topicPagePlanDigest`, `themeIntentDigest`, and `productSelectionDigest`.

- Preserve task order and repeat each `taskId`, `moduleId`, and `component` exactly.
- For `shortcuts`, preserve assignment order and copy each exact `assignments[].slotId` into the
  matching `copy.items[].slotId`; never omit, renumber, or invent a slot ID.
- For every returned product group, preserve order and copy each exact `groups[].id` into the
  matching `copy.groups[].groupId`; generate only its locale-native `label` and never change the
  group's product IDs or category scope.
- Populate only the returned copy slots. Keep ProductList product names, brands, prices, links, and
  other catalog identities outside generated copy.
- Copy every `templateCopy.title` and `templateCopy.description` exactly into the matching slot.
  Do not translate, expand, or personalize it. Keep an in-scope evidence reference on the segment
  as a module binding; the template label itself is not a factual product claim.
- Attach at least one valid evidence reference to every title, description, tag, item label, and
  scene label. Use only the namespaces returned by the runtime.
- Cite a product only inside the module where PagePlan assigned it. Within scene copy, cite only
  products assigned to that scene.
- Keep claims no broader than their evidence. Treat planning goals as direction, not proof of
  ingredients, benefits, popularity, ratings, inventory, discounts, or customer outcomes.
- Keep dynamic Hero, scene, and Explore More title copy differentiated. Stable template labels such
  as "热门精选" and "精选品牌" are intentional UI chrome and do not need to encode the module's full
  analysis. Keep the dynamic Explore More title to one light topic anchor at most.
- Keep every segment in the requested language except immutable keyword, brand, product, and
  category names. Aim for any matching `copyRules[].preferredLength`, but do not pad, truncate, or
  distort natural copy merely to enter that range. Treat `maxCharacters` as a recommended ceiling,
  never as a validity gate.
- Keep review copy absent when verified review records are unavailable. Do not paraphrase or invent
  reviews.
- Exclude image prompts, art direction, alt text, and asset decisions. Hand the ready ContentSpec
  to the independent Content Review stage; visual generation starts only after approval.

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
ProductSelection, and language bindings. Caller-managed resume supplies its revised proposal and
does not invoke the Agent. Automatic Host mode may invoke one bounded issue-guided proposal repair
using `context.proposalRevision`, or one bounded content-quality rewrite using `context.revision`.
If that optional rewrite or semantic review remains imperfect or unavailable, the Host keeps the
latest structurally valid ContentSpec, records advisory warnings, and continues. Digest drift and
missing immutable structure remain invalid because no trustworthy ContentSpec can be compiled from
them.

In automatic Host mode, accept only a `topic-page-agent-request/v1` whose stage is
`content-writing`, and return the proposal inside `topic-page-agent-response/v1` with the same
stage. Do not persist drafts or return image data from this stage.

## Architecture boundary

Keep the Topic Content Agent independent from the TOPIC GENERATOR Agent. Let TOPIC GENERATOR own
ThemeIntent, selected products, module visibility, scenes, assignments, and PagePlan task creation.
Let the `@yami/topic-generator` PageContent Module own digest checks, field validation, evidence
scope, and ContentSpec compilation. Use `runTopicContentAgentWorkflow` only as an injection seam;
never duplicate those rules in prompts or another service.
