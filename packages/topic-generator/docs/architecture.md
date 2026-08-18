# TOPIC GENERATOR architecture

## Outcome

TOPIC GENERATOR uses one Product Agent around evidence-validated, deterministic Modules. The Agent interprets ambiguous language, category meaning, and shopping scenes; it never replaces catalog identity, artifact validation, retrieval, allocation, deduplication, or PagePlan rules.

```text
Theme Keyword
  │
  ├─> CatalogSnapshot Adapters ─> TopicIntent Module ─> ThemeIntent
  │                                 ▲
  │                                 └─ optional SemanticProposal
  │
  └─> ProductSelection Module <──────── SelectionStrategyConfig
        │          ▲
        │          ├─ optional CategoryRoleProposal + SceneProposal
        │          ├─ CatalogTaxonomySnapshot
        │          └─ Candidate Adapter ─> CatalogCandidateSnapshot
        ▼
  ProductSelectionResult ─> PagePlan Module ─> optional RunArtifact Module
```

Codex and Kiro discover the same ProductSelection Skill and call these Interfaces through the CLI.
They do not contain a second implementation. The HTTP Agent Adapter is a future host mode, not a
requirement for the current interactive workflow.

## Modules and Interfaces

### TopicIntent Module

`resolveTopicIntent(snapshot, proposal?)` ranks catalog-backed interpretations, separates entity, shopper action, and constraints, and validates every proposed field. Exact catalog evidence cannot be overridden by a SemanticProposal.

### CatalogSnapshot Seam

`loadCatalogSnapshot(keyword, { adapters })` normalizes product and intent evidence. The default order is structured Yami catalog followed by public Yami search, and every attempt is retained.

### ProductSelection Module

`runProductSelectionWorkflow(request)` advances one versioned strategy and returns a resumable `ProductSelectionRun`. `relevance/default@1` is deterministic and immediately ready. `category-role/landing-page-agent@1` requires taxonomy, category proposal, candidate evidence, and scene proposal before returning a ready `ProductSelectionResult`.

`runProductSelectionAgentWorkflow(request)` is the optional orchestration adapter. It injects one
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

`buildTopicPagePlanFromProductSelection(snapshot, result)` adds localized presentation metadata to one ready ProductSelectionResult. The result remains the reusable source of truth for selected categories, roles, pools, module product IDs, and Scene/category/brand group boundaries. `buildTopicPagePlan(snapshot, "category-role")` is intentionally rejected because legacy title inference is disabled.

### RunArtifact and Evaluation Modules

`buildTopicGeneratorRunArtifacts` writes versioned, hashed output only when a CLI caller supplies an explicit directory. `evaluateTopicIntentCases` keeps live catalog failures separate from semantic mismatches. ProductSelection contracts use deterministic fixtures for rule coverage; eight brand, category, and scenario golden cases check stable strategy invariants and per-group quotas without pinning live product IDs.

## Agent and Skill roles

- One Product Agent may create `SemanticProposal`, `CategoryRoleProposal`, and `SceneProposal` only at the states that request them.
- The `topic-intent` and `product-selection` Skills define calling and evidence conventions; Codex
  and Kiro load the same canonical files through workspace discovery links.
- TypeScript Modules validate proposals and own all catalog facts and deterministic business rules.
- A proposal reason is concise review rationale, not hidden chain-of-thought or evidence.

## Runtime constraints

- No model-provider key, model SDK, or deployed model inference.
- No direct database access or credentials.
- No implicit server-side draft persistence.
- The standalone Host returns explicit blocked or needs-input states and only emits PagePlans for ready strategies.
- The Host response includes taxonomy/Agent readiness, five execution stages, candidate-attempt totals,
  candidate-quality warnings, role distribution, and scene count without exposing the Agent token or hidden reasoning.
- Public catalog access requires host-level rate limiting, timeout, and abuse monitoring before production exposure.

## Reference project

[`StoneNan/LandingPageAgent`](https://github.com/StoneNan/LandingPageAgent) remains workflow research. This implementation reproduces its documented category-role behavior through new typed contracts and tests, but does not copy its unlicensed code, direct-database pattern, credentials, or generated artifacts.
