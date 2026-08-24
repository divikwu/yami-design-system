---
name: page-review
description: This skill should be used when the user asks to "review a generated landing page", "audit landing page consistency", "create a PageReviewDecision", "check content and visual coherence", "recommend a rollback stage", or run the read-only Review Agent after automatic QA. Do not use it for deterministic QA, direct fixes, user approval, or publication.
---

# Page Review

Perform a read-only experience review after deterministic hard QA has passed. Return one
evidence-bound recommendation; leave all repair, retry, approval, and publication decisions to
the Orchestrator, deterministic runtime, and user.

## Workflow

1. Require `topic-page-experience-review-run/v1` with `status: needs-review-proposal`.
2. Confirm that the context contains a passed QAReport, a bound PageGenerationSpec, desktop and
   mobile preview references, allowed evidence references, and allowed rollback stages.
3. Inspect content, visual assets, module intent, product-page coherence, desktop/mobile behavior,
   and overall shopper experience using only the supplied artifacts and accessible previews. Inspect
   both full-page screenshots and the dedicated desktop/mobile Hero crops when attached. Apply each
   `visualPolicy.assets` entry literally: Hero is `hero-composite` with locked real source products,
   Shortcut is `source-product-fidelity` with one primary source product, and Scene/Brand assets are
   scene- and module-theme-first with assigned products as references.
4. Honor `qualityPolicy: advisory-never-block-generation`: report experience findings as warnings
   and return `recommend-approval` so generation can continue to human review. Treat this as a
   recommendation, never as approval.
5. Do not use `request-revision` for copy polish, visual composition, merchandising, or responsive
   quality. Stop only when required evidence, preview access, or hard-QA bindings are unavailable.
6. Cite only evidence references exposed by the task. Use module, product, asset, QA, and preview
   references rather than unsupported observations.
7. Submit the proposal to the deterministic runtime. Preserve the accepted decision and its digest.
8. Stop on rejected evidence, stale bindings, unavailable previews, or hard-QA drift.

For automatic HTTP execution, respond through `topic-page-agent-response/v1` with
`stage: experience-review` and place the proposal in `proposal`.

## Review scopes

- `merchandising`: module intent, order, product grouping, or shopping-scene coherence.
- `content`: titles, descriptions, labels, CTA meaning, claims, or content-to-product coherence.
- `visual`: image composition, product representation, brand treatment, asset-to-copy coherence,
  or crop quality. A packshot, product grid, or montage used as a semantic scene; an image that does
  not match its module theme or copy; or generated/altered visible packaging should be recorded as
  an evidence-bound warning for human review. For a Hero, also flag source-product overlap, an
  obscured primary product, floating contact, a product apparently landing on a wall or other
  vertical face, bottom-safe-area intrusion, or a background product placeholder/product-shaped
  ghost shadow. Natural scene shadows are not ghost-product shadows.
- `experience`: cross-stage or responsive experience issues.

## Boundaries

- Do not repair generated output or edit any upstream artifact.
- Do not rerun another Agent directly.
- Do not perform byte, MIME, dimension, digest, product-membership, or accessibility-structure QA;
  rely on the passed deterministic QAReport for those facts.
- Do not invent catalog, review, performance, accessibility, or brand evidence.
- Do not use an evidence reference absent from `allowedEvidenceRefs`.
- Do not turn subjective experience findings into generation blockers.
- Do not approve publication or claim that Stage 07 user review is complete.

## Additional resources

Read [experience-review contract](references/experience-review-contract.md) before creating issues,
choosing severity, or selecting a rollback stage.
