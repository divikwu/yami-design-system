# TOPIC GENERATOR architecture

## Outcome

TOPIC GENERATOR uses one product Agent around deep, deterministic Modules. The Agent improves ambiguous language interpretation; it never replaces catalog identity, availability, evidence, or PagePlan rules.

```text
Codex Skill / Kiro Agent
          │
          ├─ clear keyword ──────────────────────────────┐
          └─ ambiguous keyword ─> SemanticProposal ─────┤
                                                        ▼
CatalogSnapshot Adapters ─> CatalogSnapshot ─> TopicIntent Module
                                                 │
                                                 ├─> ThemeIntent
                                                 ├─> PagePlan Module
                                                 └─> optional RunArtifact Module
```

## Modules and Interfaces

### TopicIntent Module

`resolveTopicIntent(snapshot, proposal?)` is the semantic Interface. It derives ranked catalog-backed candidates, separates the core entity from shopper action and conditions, records constraint verification, and validates every proposed field. Close candidates remain `ambiguous`; exact catalog brand and category evidence cannot be overridden by a SemanticProposal.

### CatalogSnapshot Seam

`loadCatalogSnapshot(keyword, { adapters })` is the catalog Interface. An Adapter returns normalized products and evidence only; it does not choose a ThemeIntent. The default order is structured Yami catalog, then public Yami search. Every attempt is retained.

### PagePlan Module

`buildTopicPagePlanMatrix(snapshot)` deterministically derives language and selection-strategy variants from one validated ThemeIntent and CatalogSnapshot. It does not call an Agent.

### RunArtifact Module

`buildTopicGeneratorRunArtifacts` creates versioned artifact payloads and SHA-256 descriptors. `writeTopicGeneratorRunArtifacts` writes them only to an explicit CLI output directory; there is no implicit server draft store.

### Evaluation Module

`evaluateTopicIntentCases` compares stable semantic expectations with live catalog analysis. Evaluation cases do not store product inventory; deterministic unit fixtures cover rule mechanics while the evaluation CLI separately reports semantic mismatches and live Adapter failures.

## Agent and Skill roles

- The Codex `topic-intent` Skill is a calling convention and evidence policy, not the implementation.
- The Kiro `topic-generator` Agent runs the baseline, creates a SemanticProposal only for genuine ambiguity, reruns validation, and reports rejected fields.
- Codex or another compatible Agent can follow the same Skill and JSON contract. No model SDK is embedded in the package.

## Runtime constraints

- No model-provider key, model SDK, or deployed model inference.
- No direct database access or credentials.
- No server-side draft persistence.
- The Canvas host may expose the catalog-only HTTP handler; a public host must add rate limiting and abuse monitoring.
- Product facts come from the CatalogSnapshot; proposal prose and confidence are never evidence.

## Reference project

`StoneNan/LandingPageAgent` is useful as workflow research: it demonstrates staged Agent handoffs and the Yami catalog query shape. TOPIC GENERATOR does not copy its implementation or depend on it because the reviewed repository has no detected license, lacks contract tests, and includes a direct-database credential pattern that must not be reproduced. Catalog access here remains behind approved HTTP Adapters.
