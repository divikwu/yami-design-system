# TOPIC GENERATOR architecture

## Outcome

TOPIC GENERATOR uses one constrained Orchestrator Agent plus four specialist Agents around
evidence-validated, deterministic Modules. The Orchestrator chooses only a registered page type,
selection strategy, template, and workflow. The Strategy Agent interprets topic, category, scene,
and merchandising semantics; Content, Visual, and Review have separate downstream responsibilities.
No Agent replaces catalog identity, artifact validation, retrieval, frozen selection boundaries,
state transitions, hard QA, or the publish gate.

```text
Theme Keyword + optional page/strategy request
  │
  ├─> CatalogSnapshot Adapters ─> TopicIntent Module ─> ThemeIntent
  │                                 ▲
  │                                 └─ optional SemanticProposal
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
  TopicPagePlan v2 ─> PageContent Module <─ Content Agent proposal
                              │
                              ▼
                     TopicPageContentSpec ─> PageVisual Module <─ Visual Agent
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

Codex and Kiro discover the same seven canonical Skills: `page-orchestration`, `topic-intent`,
`product-selection`, `page-merchandising`, `content-writing`, `visual-generation`, and
`page-review`. They map to five logical Agents: Orchestrator, Strategy, Content, Visual, and Review.
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

### CatalogSnapshot Seam

`loadCatalogSnapshot(keyword, { adapters })` normalizes product and intent evidence. The default order is structured Yami catalog followed by public Yami search, and every attempt is retained.

### ProductSelection Module

`runProductSelectionWorkflow(request)` advances one versioned strategy and returns a resumable `ProductSelectionRun`. `relevance/default@1` is deterministic and immediately ready. `category-role/landing-page-agent@1` requires taxonomy, category proposal, candidate evidence, and scene proposal before returning a ready `ProductSelectionResult`.

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

`runPageMerchandisingAgentWorkflow` injects the PageMerchandising capability of the Strategy Agent.
The Agent proposes module shopping goals, scene reshaping, and assignments; the
Module owns validation, task IDs, and compilation. Legacy PagePlan v1 remains available for current
Web compatibility and is not silently upgraded.

The versioned refs `topic-landing/brand@1`, `topic-landing/topic@1`, and
`topic-landing/campaign@1` map directly to the maintained Storybook variants under
`YAMI/Pages/Topic Landing Page`. The corresponding page type is inferred only from a resolved
ThemeIntent; Campaign therefore requires `activity` rather than a product or brand guess.
`topic-landing/relevance@1` is the no-scene fallback for
`relevance/default@1`; it hides scene-dependent modules rather than inventing source scenes.

### PageContent Module

`advanceTopicPageContentRun({ intent, selection, plan, language, proposal? })` first validates the
PagePlan and both upstream digests, then emits only visible `contentTaskId` tasks with their real
component copy slots and assigned evidence. It accepts one localized
`topic-page-content-proposal/v1`, rejects undeclared tasks, component or language drift, missing
copy fields, and out-of-scope ThemeIntent/category/product/scene evidence before compiling a
digest-bound `topic-page-content-spec/v1`.

`runTopicContentAgentWorkflow` injects the independent Content Agent. The Agent writes copy; the
Module owns task membership, evidence scope, validation, and compilation. Review copy remains
blocked until an upstream contract supplies verified review records. Image prompts and assets stay
outside this Module.

### PageVisual Module

`advanceTopicPageVisualRun({ intent, selection, plan, contentSpec, proposal? })` revalidates the
PagePlan and ready ContentSpec, then derives only the image slots declared by each module's
`assetTaskIds`. The context contains exact component ratios, minimum dimensions, alt-text mode,
assigned products, relevant scene, accepted content task, and scoped evidence namespaces.

An accepted `topic-page-visual-proposal/v1` must preserve task order and all upstream digests. The
Module rejects undeclared tasks, component/product drift, out-of-scope evidence, unsafe paths,
MIME/extension mismatches, undersized or incorrectly cropped images, invalid SHA-256 metadata,
invalid focal points, missing background colors, and alt-text mode drift before compiling a
digest-bound `topic-page-asset-manifest/v1`.

`runTopicVisualAgentWorkflow` injects the independent Visual Agent. The Agent needs a host-provided
image generator and creates actual media plus metadata; the core package contains no provider SDK.
Automatic HTTP output uses `topic-page-visual-agent-output/v1` to keep the proposal separate from
base64 image bodies. The manifest status is `asset-manifest-ready`; it does not yet trust the bytes.

### PageAutomation, generation, QA, and Review

`runTopicPageAutomationWorkflow` is the deterministic coordinator. It first validates the execution
plan against the ThemeIntent, selected strategy, language, registered workflow order, and digest.
It then invokes Strategy merchandising, Content, and Visual in order, stops on the first rejected
proposal, validates every returned image body before any store write, persists accepted media,
compiles `topic-page-generation-spec/v1`, and runs the final hard QA gates.

`PageGenerationSpec` freezes the visible module order, component, accepted copy, exact assigned
products, scene records, asset URLs, and all upstream digests. `runTopicPageQa` reads persisted PNG,
JPEG, or WebP bytes and independently checks SHA-256, MIME magic, dimensions, bindings, module/order,
content presence, and alt-text structure.

Only after hard QA passes may `runTopicPageReviewAgentWorkflow(...)` invoke the read-only Review
Agent. The `page-review` Module binds its proposal to the execution-plan, generation-spec, and QA
digests; restricts evidence to generated modules, products, assets, QA, and preview refs; and requires
every blocking issue to name one allowed rollback stage. `request-revision` blocks automation and
returns the findings. Only a validated `recommend-approval` decision can compile a
`topic-page-review-package/v1`. User approval and publishing remain outside automation and require
separate authority.

### RunArtifact and Evaluation Modules

`buildTopicGeneratorRunArtifacts` writes versioned, hashed output only when a CLI caller supplies an explicit directory. `evaluateTopicIntentCases` keeps live catalog failures separate from semantic mismatches. ProductSelection contracts use deterministic fixtures for rule coverage; eight brand, category, and scenario golden cases check stable strategy invariants and per-group quotas without pinning live product IDs.

## Agent and Skill roles

- Topic Page Orchestrator loads only `page-orchestration`; it proposes one registered execution
  route and cannot run stages, retry itself, change state, or publish.
- Topic Strategy loads `topic-intent`, `product-selection`, and `page-merchandising`; it may create
  only the semantic, category-role, scene, and module proposals requested by the current state.
- Topic Content loads only `content-writing` and may create copy for the declared PagePlan tasks and
  language.
- Topic Visual loads only `visual-generation`, requires a host image generator, and may create media
  plus metadata for declared asset tasks.
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
- The Host response includes the accepted execution plan, taxonomy/Agent readiness, nine automation
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
