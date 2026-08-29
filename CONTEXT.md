# TOPIC GENERATOR Context

This context defines the language used to turn a shopping theme keyword into a
reviewable, evidence-backed page plan. It keeps Agent interpretation distinct
from catalog evidence and deterministic page construction.

## Language

**Theme Keyword**:
The original phrase supplied by the user; one Theme Keyword starts one analysis run.
_Avoid_: Search query, prompt

**Semantic Proposal**:
An optional, untrusted interpretation produced by the product Agent when a Theme Keyword is ambiguous. It must be accepted, narrowed, or rejected against the CatalogSnapshot before it can affect ThemeIntent.
_Avoid_: Model result, final intent

**CatalogSnapshot**:
An immutable record of products, brands, categories, attributes, source, and retrieval attempts observed for one Theme Keyword and site. One CatalogSnapshot may support one ThemeIntent and many PagePlans.
_Avoid_: Live catalog, search response

**CommerceCatalog**:
The normalized read Interface used by prototype Hosts for search and category data. Its Adapters may read a controlled EvaluationScenario, a PrototypeCatalogSnapshot, or the current Yami catalog. CommerceCatalog does not contain page composition, React props, ThemeIntent, or ProductSelection rules.
_Avoid_: CatalogSnapshot, page fixture, public data proxy

**PrototypeCatalogSnapshot**:
A versioned, immutable capture of one normalized CommerceCatalog request and result used to reproduce a design evaluation. It records its source and capture time but is not Topic Generator evidence and cannot be used as a CatalogSnapshot without that Module's validation.
_Avoid_: CatalogSnapshot, live response, cache

**EvaluationScenario**:
A named, deterministic prototype-data condition such as baseline, empty, dense, delayed, or partial failure. It exists to evaluate an experience predictably and may use curated data rather than current catalog facts.
_Avoid_: Live mode, production state

**ThemeIntent**:
The validated contract that states the topic entity, shopping goal, constraints, reason, and confidence supported by a CatalogSnapshot. One ThemeIntent is the semantic input to page planning.
_Avoid_: Semantic Proposal, route decision

**SelectionStrategyConfig**:
A versioned, immutable configuration that names one ProductSelection engine and its deterministic retrieval, quota, allocation, and deduplication rules. Callers reference it by `<id>@<version>` and do not copy its implementation.
_Avoid_: Agent prompt, UI option label

**CatalogTaxonomySnapshot**:
A digest-bearing artifact containing the complete catalog hierarchy available to a category-role run, including each category's `parentId`, level, path, aliases, and enabled state. It is supplied through an approved Adapter or imported artifact and cannot be inferred from search products.
_Avoid_: ThemeIntent categories, search aggregation

**CategoryRoleProposal**:
An untrusted Product Agent proposal assigning 10 taxonomy categories to `core`, `pairing`, or `accessory`. The ProductSelection Module validates IDs, taxonomy digest, reasons, uniqueness, core-to-accessory order, parent-child overlap, and allowed role distribution before product retrieval.
_Avoid_: Selected products, final category facts

**CatalogCandidateSnapshot**:
An immutable, digest-bearing record of the per-category and discovery-pool product queries used by a category-role run. It contains normalized products and Adapter attempts but no Agent-selected scenes.
_Avoid_: CatalogSnapshot, ProductSelectionResult

**SceneProposal**:
An untrusted Product Agent proposal of 4–6 shopping scenes bound to one CatalogCandidateSnapshot digest. Product IDs must exist in the candidate evidence and occupy their validated category roles.
_Avoid_: Page module allocation, generated page copy

**ProductSelectionRun**:
The resumable state-machine response for one SelectionStrategyConfig. It is `blocked`, requests the next proposal or snapshot, or is `ready` with a ProductSelectionResult.
_Avoid_: Background job, hidden Agent state

**ProductSelectionResult**:
The ready, deterministic selection output containing selected categories, products, pools, scenes, and module assignments. PagePlan consumes it without re-selecting or reclassifying products.
_Avoid_: Candidate snapshot, PagePlan

**PrimaryPool**:
The products selected for use by PagePlan modules. Category roles do not map to pool names; core, pairing, and accessory products may all belong to PrimaryPool after deterministic allocation.
_Avoid_: Main results, selected products

**RelatedPool**:
The evidence-backed products that complement the PrimaryPool without replacing the ThemeIntent.
_Avoid_: Recommendations, secondary results

**PagePlan**:
The deterministic presentation plan compiled from one ready ProductSelectionResult for a language. It may add content and module visibility metadata, but it does not select, reclassify, or deduplicate products.
_Avoid_: Page, template route

**PageGenerationSpec**:
The frozen, versioned input used by page generation after a PagePlan has passed review gates.
_Avoid_: PagePlan, runtime state

**ReviewPackage**:
The evidence, PageGenerationSpec, and quality findings presented together for an approval decision.
_Avoid_: QA report, generated page

**Run Artifact**:
A versioned file that records one stage of a run, its source references, and a content hash. A run may contain ThemeIntent, CatalogSnapshot, PagePlan, PageGenerationSpec, and ReviewPackage artifacts.
_Avoid_: Cache, log

**Topic Generator Host**:
The standalone Web and HTTP Adapter under `apps/topic-generator`. It exposes the reusable TopicIntent and PagePlan Modules from `packages/topic-generator` without making Canvas part of their runtime.
_Avoid_: Canvas route, TopicIntent Module

## Flagged ambiguities

**AI analysis**:
In this repository, AI analysis means the Agent may prepare a Semantic Proposal; it does not mean the model can declare catalog facts or bypass ThemeIntent validation.
_Avoid_: Using AI analysis to describe CatalogSnapshot retrieval or deterministic planning

## Example dialogue

**Developer**: “小户型厨房收纳”没有精确目录实体，Agent 可以直接把它判为 activity 吗？

**Domain expert**: Agent 可以提交一个 `activity` Semantic Proposal，但 TopicIntent 只有在 CatalogSnapshot 覆盖多个相关品类后才接受它。通过后，PrimaryPool 放直接支持厨房收纳的商品，RelatedPool 放互补商品，再由同一份证据生成 PagePlans。

**Developer**: 如果查询降级到公开搜索页呢？

**Domain expert**: CatalogSnapshot 要记录降级尝试；ThemeIntent 降低 confidence 并要求复核。后续 Run Artifacts 仍保存来源和哈希，不能把降级结果伪装成结构化目录证据。
