# TOPIC GENERATOR architecture

## Outcome

TOPIC GENERATOR uses one constrained Orchestrator Agent plus six specialist Agents around
evidence-validated, deterministic Modules. The Orchestrator chooses only a registered page type,
selection strategy, template, and workflow. The Strategy Agent interprets topic, category, scene,
and merchandising semantics; Background Evidence, Content, Content Review, Visual, and Experience
Review have separate downstream responsibilities.
No Agent replaces catalog identity, artifact validation, retrieval, frozen selection boundaries,
state transitions, hard QA, or the publish gate.

```text
Theme Keyword + optional page/strategy request
  │
  ├─> CatalogSnapshot Adapters ─> TopicIntent Module ─> ThemeIntent
  │                                 ▲
  │                                 └─ optional SemanticProposal
  │
  ├─> Resolved ThemeIntent + AudienceContext
  │                └─ Background Evidence Agent ─> BackgroundEvidence Module
  │
  └─> PageOrchestration Registry <─ Orchestrator Agent proposal
                 │
                 ▼
       LandingPageExecutionPlan
                 │
                 ▼
       ProductSelection Module <──────── SelectionStrategyConfig
        │          ▲
        │          ├─ Strategy Agent: CategoryRoleProposal + SceneProposal
        │          ├─ CatalogTaxonomySnapshot
        │          └─ Candidate Adapter ─> CatalogCandidateSnapshot
        ▼
  ProductSelectionResult ─> PageMerchandising Module
                               ▲        │
                               │        └─ Strategy Agent: ModuleMerchandisingProposal
                               ▼
  TopicPagePlan v2 + BackgroundEvidence ─> CopyBrief ─> PageContent Module <─ Content Agent proposal
                              │
                              ▼
                     TopicPageContentSpec ─> Content Review Module <─ Content Review Agent
                                                       │ approved
                                                       ▼
                                             PageVisual Module <─ Visual Agent
                                                   │               media + proposal
                                                   ▼
                                        TopicPageAssetManifest ─> AssetStore
                                                   │                    │
                                                   └──────────> PageGenerationSpec
                                                                        │
                                                                        ▼
                                                                  hard QA
                                                                        │
                                                                        ▼
                                           Review Agent proposal ─> ExperienceReviewDecision
                                                                        │
                                                                        ▼
                                                                  ReviewPackage
```

Codex and Kiro discover the same nine canonical Skills: `page-orchestration`, `topic-intent`,
`background-evidence`, `product-selection`, `page-merchandising`, `content-writing`,
`content-review`, `visual-generation`, and `page-review`. They map to seven logical Agents:
Orchestrator, Strategy, Background Evidence, Content, Content Review, Visual, and Experience Review.
Skills define task and evidence conventions; none is a second business-rule implementation. The
automatic HTTP Adapter reuses the same proposal contracts and logical Agent IDs without moving
validation into prompts or the remote service.

## Modules and Interfaces

### PageOrchestration Module

`advanceLandingPageOrchestrationRun(...)` returns a bounded planning context containing only
registered `LandingPageTypeConfig`, `ProductSelectionStrategyConfig`, and page templates. It accepts
one `landing-page-execution-plan-proposal/v1` and rejects unknown refs, incompatible theme types,
unregistered strategy-template routes, identity drift, or changed
ThemeIntent digests before compiling `landing-page-execution-plan/v1`.

The built-in registry currently exposes one automatic route per resolved ThemeIntent type: Brand
for `brand`, Topic for `product`, and Campaign for `activity`. Unresolved or ambiguous intent remains
blocked. The execution plan freezes the eight deterministic execution stages after planning,
actor ownership, single-attempt policy, and the only Review rollback targets:
`module-merchandising`, `content-writing`, and `visual-generation`. Adding a future page type or
selection logic therefore requires a registered route and a core implementation, not a prompt-only
branch.

`runLandingPageOrchestratorAgentWorkflow(...)` injects the constrained Orchestrator Agent. The Agent
may propose a registered route and a concise reason; the TypeScript Module owns acceptance,
digests, workflow order, and downstream execution.

### TopicIntent Module

`resolveTopicIntent(snapshot, proposal?)` ranks catalog-backed interpretations, separates entity, shopper action, and constraints, and validates every proposed field. Exact catalog evidence cannot be overridden by a SemanticProposal.

`runTopicIntentAgentWorkflow(request)` is the optional automatic semantic Adapter used by the Web
Host. It sends the baseline ThemeIntent, verified catalog categories, and the complete current product
evidence to the Topic Strategy Agent's `topic-intent` stage. The returned `semantic-proposal/v2` is
parsed and reviewed by the same deterministic TopicIntent Module. Missing, failed, invalid, or fully
rejected proposals retain the verified catalog grouping and publish explicit fallback evidence.

### BackgroundEvidence Module

`runTopicBackgroundEvidenceAgentWorkflow(...)` starts only from a resolved ThemeIntent and a fixed
`topic-audience-context/v1`. Brand topics require the official brand site for `ready`; Wikipedia is
secondary neutral context. Cultural topics use a named authoritative institution or Wikipedia.
The deterministic Module accepts only opened HTTPS sources and `identity`, `origin`, `meaning`,
`tradition`, or `terminology` claims with `context-only` usage. Research failure compiles an explicit
`unavailable` bundle so product selection can continue without silently filling facts from memory.

### CatalogSnapshot Seam

`loadCatalogSnapshot(keyword, { adapters })` normalizes product and intent evidence. The default order is structured Yami catalog followed by public Yami search, and every attempt is retained. For the active relevance strategy, the first structured response is discovery evidence: ThemeIntent reads its category, brand, tag, and paging metadata, then the server fetches the resolved categories independently and follows their real page metadata until each candidate theme has enough products or is exhausted. Exact category intents restrict this expansion to the canonical category branch; keyword matches from unrelated branches remain outside ThemeIntent and ProductSelection.

### ProductSelection Module

`runProductSelectionWorkflow(request)` advances one versioned strategy and returns a resumable `ProductSelectionRun`. `relevance/default@1` remains the fixed-rank legacy replay strategy, `relevance/intent-themes@2` retains direct catalog-category grouping for replay, and `relevance/intent-themes@3` preserves the previous four-to-eight StartHere contract. The active `relevance/intent-themes@4` accepts one or more verified catalog leaf categories per ThemeIntent Shortcuts hypothesis and reuses that complete shopper-facing group sequence for the matching comprehensive-recommendation tabs, while multi-category scenario hypotheses organize StartHere. The Agent decides which verified leaves form one theme category; the deterministic Module validates category ownership, expands product membership, keeps proposal order, removes cross-group duplicates, retains valid one-product groups, restores Agent-omitted catalog categories, and places otherwise unassigned primary products in a stable More to Explore group. Every primary product must belong to exactly one Shortcuts group; there is no fixed category display cap. StartHere preserves the accepted scene name, shopping goal, reason, and source category IDs, balances membership across those categories, and freezes two to six candidate scenes with four to sixteen products each. `category-role/landing-page-agent@1` requires taxonomy, category proposal, candidate evidence, and scene proposal before returning a ready `ProductSelectionResult`.

`runProductSelectionAgentWorkflow(request)` is the optional automatic strategy adapter. It injects one
`ProductSelectionAgent`, asks it only for the two proposal contracts requested by the state machine,
and stops on the first deterministic rejection. It does not add a model SDK or a second rule engine.

`createHttpProductSelectionAgent(options)` is the portable remote-Agent seam. The Next.js Host
constructs it from server-only environment values and caches the validated taxonomy/runtime per
process. Automatic mode ignores browser-supplied taxonomy and proposals, preventing clients from
replacing server evidence or Agent provenance.

The server contract also supports explicit interactive handoff for external Codex/Kiro and debugging
tools. One `product-selection-handoff-task/v1` is paired with one same-stage
`product-selection-handoff-response/v1`. The Workbench does not expose this developer control; normal
page requests always use the automatic server path and the core state machine remains authoritative.

The category-role engine implements the reference workflow's 5:3:2 taxonomy roles, exact query sizes and sort modes, Scene/Popular/Brand/Explore allocation, and global deduplication. Contract tests own these rules; prompts do not.

### Taxonomy and candidate seams

`CatalogTaxonomySnapshot` is a canonical JSON, SHA-256-bound artifact supplied by an approved HTTP Adapter or imported source. The deployed runtime does not query a production database or infer a taxonomy from search results.

`createLandingPageAgentTaxonomySnapshot` imports the reference repository's five-column TSV
contract and reconstructs full parent paths. As in the reference tree builder, a row whose parent is
absent from the export becomes a root; cyclic parent chains are rejected before digesting it.

`CatalogCandidateAdapter` accepts portable `{ keyword, site, categoryId?, limit, sort }` queries. The default Yami Adapter maps these to `getItemList`; tests and other projects can inject another Adapter without changing the engine.

Every candidate snapshot also produces a separate `catalog-candidate-quality-report/v1` artifact.
It reports request completeness, empty or low-coverage categories, category membership mismatches,
low-coverage category/title semantic anomalies, and duplicate assignment. The analyzer is read-only:
it never repairs Agent proposals or catalog evidence.

### PagePlan Module

`buildTopicPagePlanFromProductSelection(snapshot, result)` is the legacy PagePlan v1 compiler. It
adds localized presentation metadata to one ready ProductSelectionResult and preserves that result's
selection-stage module groups. `buildTopicPagePlan(snapshot, "category-role")` is intentionally
rejected because legacy title inference is disabled.

`advancePageMerchandisingRun({ intent, selection, templateRef, proposal? })` is the PagePlan v2
path. It first emits a bounded `needs-module-proposal` context containing the immutable ThemeIntent,
selected categories, template rules, frozen products, and validated source scenes. It then rejects
ThemeIntent or ProductSelection digest drift, unknown products, pool/role violations, source-scene
drift, invalid module capacity, and unexplained cross-module reuse before compiling a digest-bound
`topic-page-plan/v2`.

The active category-role templates `topic-landing/brand@2`, `topic-landing/topic@2`, and
`topic-landing/campaign@2` give ProductSelection assignment authority. StartHere, Popular Picks,
Brand Spotlight, and Explore More must preserve the upstream module IDs and order; StartHere also
preserves every source scene and both role-correct groups. Hero and Shortcuts may reference only
products already owned by those modules. `reuseReason` is audit metadata and cannot authorize reuse
between ProductSelection-owned modules. Preflight applies the same ownership and capacity rules
before Agent work.

`runPageMerchandisingAgentWorkflow` injects the PageMerchandising capability of the Strategy Agent.
The Agent proposes module shopping goals, scene reshaping, and assignments; the
Module owns validation, task IDs, and compilation. Legacy PagePlan v1 remains available for current
Web compatibility and is not silently upgraded.

For the active relevance templates, PageMerchandising formally reviews StartHere inside the frozen
ProductSelection scenes and pools. The hard contract allows two to six visible scenes and four to
eight products per scene; the Skill asks for three to five when evidence supports that range. Source
scene order, source membership, distinct scene references, and counts are deterministic checks. The
accepted result is the only result labeled Agent-reviewed and is applied to both the structural preview
and the downstream PagePlan. A deterministically rejected first proposal may be revised once with the
exact validation issues attached to the bounded task; a failed second attempt or unavailable Agent
remains an explicit catalog-rule fallback.

The active versioned refs `topic-landing/brand@2`, `topic-landing/topic@2`, and
`topic-landing/campaign@2` map directly to the maintained Storybook variants under
`YAMI/Pages/Topic Landing Page`. The corresponding page type is inferred only from a resolved
ThemeIntent; Campaign therefore requires `activity` rather than a product or brand guess.
The active page-specific `brand-relevance@2`, `topic-relevance@2`, and `campaign-relevance@2`
routes consume `relevance/intent-themes@4`. ProductSelection supplies module-owned, verified
Shortcuts category groups and StartHere scenario groups; Reviews remain hidden until verified review evidence exists. Brand hides Brand
Spotlight, while Topic and Campaign may show it when the frozen catalog pool supports it.
The generic `topic-landing/relevance@1` and category-role `@1` templates remain addressable only for
old execution-plan replay and are not listed in new Agent task contexts.

### PageContent Module

`advanceTopicPageContentRun({ intent, selection, plan, language, audienceContext?, backgroundEvidence?, proposal? })` first validates the
PagePlan and both upstream digests, then emits only visible `contentTaskId` tasks with their real
component copy slots and assigned evidence. It accepts one localized
`topic-page-content-proposal/v1`, rejects undeclared tasks, component or language drift, missing
copy fields, and out-of-scope ThemeIntent/category/product/scene evidence before compiling a
digest-bound `topic-page-content-spec/v1`.

The automatic novice path selects `topic-page-copy/novice-guided@3` and compiles a digest-bound
`topic-page-copy-brief/v3` from AudienceContext, the resolved Brand / Topic / Campaign template,
module shopping goals, scenes, and the optional BackgroundEvidence bundle. V3 adds a flexible Hero
strategy, one preferred plus at most one supporting context-only topic signal, and a locale strategy
for separate Simplified Chinese and English proposals with native adaptation rather than literal
translation. The current policy also returns locale-specific preferred Hero lengths plus hard
Unicode character limits, and binds those rules into the CopyBrief for independent review. A
preferred range is non-blocking guidance; only the hard maximum is deterministically rejected.
Copy policy `novice-guided@2` and CopyBrief v2 remain accepted for saved-run replay. The same policy registry derives Agent-facing `copySlots`/`copyRules`
and deterministic proposal review. Background claims enter only as `background:<claim-id>` and stay
`context-only`; they cannot prove product claims. Legacy calls retain `evidence-bound@1` or
`topic-page-copy/legacy@1` replay behavior.

The managed Web Host schedules both locale-bound proposals in the same content milestone. It
reuses the frozen ThemeIntent, ProductSelectionResult, and PagePlan, produces localized
BackgroundEvidence as needed, and stores both approved results under `contentByLanguage`. Each
proposal and review remains independently digest-bound; the request language is only the primary
preview and downstream visual locale, not a request to omit the paired copy locale.

`runTopicContentAgentWorkflow` injects the independent Content Agent. The Agent writes copy; the
Module owns task membership, evidence scope, validation, and compilation. Review copy remains
blocked until an upstream contract supplies verified review records. Image prompts and assets stay
outside this Module.

For novice-guided runs, nearby structural module chrome is template-owned and localized before the
Agent call: `shortcuts`, `popular-picks`, and `brand-spotlight` expose exact title values, while
`explore-more` exposes an exact generic description. The Agent preserves those values verbatim.
Only the distant `explore-more` title may add one compact locale-native topic anchor; its
locale-specific preferred and hard limits keep that variation short. Deterministic review rejects
replacement of template copy, while independent Content Review rejects repeated anchors, Hero
restatement, or analytical headings.

`runTopicPageContentReviewAgentWorkflow(...)` independently reviews the compiled ContentSpec against
its CopyBrief and bound evidence for newcomer orientation, theme and scene specificity, module
differentiation, evidence alignment, and language quality. A `revision-required` decision rolls back
to `content-writing`. The automatic Host freezes ThemeIntent, BackgroundEvidence, selection,
PagePlan, CopyBrief, language, and digests, then gives the Content Agent the previous ContentSpec
plus structured review issues for one bounded rewrite and one final review. Automation cannot
invoke the Visual Agent until review is approved; a second failure remains blocked and the managed
stage cannot be executed again. A successful rewrite preserves its digest-bound attempt and the
first review's structured issues in the content-review stage output.

Blocked PageContent runs expose `faultKind` and `rollbackStage`: upstream drift returns to
PageMerchandising, while rejected copy stays in PageContent. The Agent workflow records a
digest-bound `topic-page-content-attempt/v1`; Automation preserves that attempt and the rejected
run. An explicit caller-managed resume provides the preserved attempt and revised proposal,
revalidates all three upstream digests plus language, and skips PageMerchandising and the Content
Agent only when they still match. The automatic bounded rewrite is a separate Host policy and is
available only for `content-quality`; Agent transport failure is classified at the Agent Adapter
Seam rather than inside the deterministic PageContent Module.

### PageVisual Module

`advanceTopicPageVisualRun({ intent, selection, plan, contentSpec, productionMode?, proposal? })` revalidates the
PagePlan and ready ContentSpec, then derives only the image slots declared by each module's
`assetTaskIds`. The context contains exact component ratios, minimum dimensions, alt-text mode,
assigned products, relevant scene, accepted content task, and scoped evidence namespaces.
The context freezes `generated-images` or `source-product-images`; accepted proposals and manifests
preserve that mode. Scene tasks also expose non-blocking composition guidance for layouts whose copy
overlays the lower image area.
Shortcut tasks use a `product-first` / `primary-subject` brief with exactly one representative product;
the native Runner attaches its approved source image and requests a centered product-led lifestyle
composition. ThemeHero uses `scene-first` / `reference-only`: the Runner attaches all available
assigned product images as flexible references and asks the Agent to regenerate one complete 16:9
multi-product lifestyle scene. Products and environment are generated together; referenced products
may appear as a natural subset, and any packaging shown should follow the source as faithfully as the
model allows. Theme-scene and brand tasks also use `scene-first` / `reference-only`.

An accepted `topic-page-visual-proposal/v1` must preserve task order and all upstream digests. The
Module rejects undeclared tasks, component/product drift, out-of-scope evidence, unsafe paths,
MIME/extension mismatches, undersized or incorrectly cropped images, invalid SHA-256 metadata,
invalid focal points, missing background colors, and alt-text mode drift before compiling a
digest-bound `topic-page-asset-manifest/v1`.

`runTopicVisualAgentWorkflow` injects the independent Visual Agent. The host supplies either image
generation or deterministic source-product composition according to the frozen production mode; the
core package contains no provider SDK.
Automatic HTTP output uses `topic-page-visual-agent-output/v1` to keep the proposal separate from
base64 image bodies. The manifest status is `asset-manifest-ready`; it does not yet trust the bytes.

### PageAutomation, generation, QA, and Review

`runTopicPageAutomationWorkflow` is the deterministic coordinator. It first validates the execution
plan against the ThemeIntent, selected strategy, language, registered workflow order, and digest.
It then invokes Strategy merchandising, Content, Content Review, and Visual in order, stops on the first rejected
proposal, validates every returned image body before any store write, persists accepted media,
compiles `topic-page-generation-spec/v1`, and runs the final hard QA gates.

`PageGenerationSpec` freezes the visible module order, component, accepted copy, exact assigned
products, scene records, asset URLs, and all upstream digests. Before any store write, the Host image
decoder must fully decode every PNG, JPEG, or WebP body. `runTopicPageQa` then rereads the persisted
bytes and independently repeats full decoding plus SHA-256, MIME, dimensions, bindings, module/order,
content presence, and alt-text structure.

Only after integrity QA completes may `runTopicPageReviewAgentWorkflow(...)` invoke the optional
read-only Review Agent. The `page-review` Module binds its proposal to the execution-plan,
generation-spec, and QA digests and restricts evidence to generated modules, products, assets, QA,
and preview refs. Its `advisory-never-block-generation` policy normalizes experience quality
findings, unavailable review capability, and invalid review proposals to warnings. The deterministic
runtime then writes `page-final.html` with an automatic-completion record. Invalid source, product,
module, or asset bindings and hard-QA drift still stop finalization. External publishing remains
outside Topic Generator automation and requires separate authority.

### RunArtifact and Evaluation Modules

`buildTopicGeneratorRunArtifacts` writes versioned, hashed output only when a CLI caller supplies an explicit directory. `evaluateTopicIntentCases` keeps live catalog failures separate from semantic mismatches. ProductSelection contracts use deterministic fixtures for rule coverage; eight brand, category, and scenario golden cases check stable strategy invariants and per-group quotas without pinning live product IDs.

## Agent and Skill roles

- Topic Page Orchestrator loads only `page-orchestration`; it proposes one registered execution
  route and cannot run stages, retry itself, change state, or publish.
- Topic Strategy loads `topic-intent`, `product-selection`, and `page-merchandising`; it may create
  only the semantic, category-role, scene, and module proposals requested by the current state.
- Topic Background Evidence loads only `background-evidence`, opens official or authoritative
  sources, and may create context-only claims for the resolved intent.
- Topic Content loads only `page-copywriting` and may create copy for the declared PagePlan tasks and
  language from the bound CopyBrief and scoped evidence.
- Topic Content Review loads only `content-review`, cannot rewrite copy or browse for facts, and
  must approve the compiled ContentSpec before visual generation.
- Topic Visual loads only `visual-generation`, requires the host media capability named by the
  frozen production mode, and may create media plus metadata for declared asset tasks.
- Topic Review loads only `page-review`, reads only hard-QA-passed output, and may recommend approval
  or request a revision to one allowed upstream stage. It cannot repair output or publish.
- TypeScript Modules validate every proposal and own catalog facts, workflow state, digests, retry and
  rollback policy, deterministic business rules, QA, and the publish boundary.
- A proposal reason is concise review rationale, not hidden chain-of-thought or evidence.

Content writing, image generation, and experience review remain separate downstream executor
boundaries because they have different tools and evidence scopes. All bind to immutable task IDs or
digests; hard QA remains a system boundary before Review.

## Runtime constraints

- No model-provider key or model SDK inside the core package; server-only Host configuration points
  to external Product/Page Agent endpoints.
- No direct database access or credentials.
- No implicit server-side draft persistence.
- The standalone Host returns explicit blocked or needs-input states and only emits review-ready
  automation after real asset QA.
- The Host response includes the accepted execution plan, taxonomy/Agent readiness, eleven automation
  stages, candidate-attempt totals, candidate-quality warnings, role distribution, scene count, QA,
  and experience-review evidence without exposing Agent tokens or hidden reasoning.
- Public catalog access requires host-level rate limiting, timeout, and abuse monitoring before production exposure.

## Reference project

[`StoneNan/LandingPageAgent`](https://github.com/StoneNan/LandingPageAgent) remains workflow research. This implementation reproduces its documented category-role behavior through new typed contracts and tests, but does not copy its unlicensed code, direct-database pattern, credentials, or generated artifacts.

Its separate [`lp_image` Agent](https://github.com/StoneNan/LandingPageAgent/blob/main/.kiro/agents/lp_image.json)
confirms the image executor boundary, but that implementation shells into a project-specific
`gen-image` script and rewrites a shared final JSON file. Topic Visual instead accepts any injected
host generator, emits one digest-bound proposal, and leaves upstream PagePlan and ContentSpec
immutable.
