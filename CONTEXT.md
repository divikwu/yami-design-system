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

**ThemeIntent**:
The validated contract that states the topic entity, shopping goal, constraints, reason, and confidence supported by a CatalogSnapshot. One ThemeIntent is the semantic input to page planning.
_Avoid_: Semantic Proposal, route decision

**PrimaryPool**:
The products that directly satisfy the ThemeIntent and anchor the generated page.
_Avoid_: Main results, selected products

**RelatedPool**:
The evidence-backed products that complement the PrimaryPool without replacing the ThemeIntent.
_Avoid_: Recommendations, secondary results

**PagePlan**:
The deterministic selection of pools, product roles, content, and module visibility for one language and selection strategy. Many PagePlans may be derived from one ThemeIntent and CatalogSnapshot.
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
