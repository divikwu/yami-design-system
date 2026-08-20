---
name: topic-intent
description: This skill should be used when the user asks to "analyze a shopping keyword", "identify shopping intent", "explain a topic keyword", "classify a topic as brand, product, or activity", or retrieve Yami catalog evidence. It should not be used for final template routing or visual page generation.
---

# Topic Intent

Use TOPIC GENERATOR to turn one shopping keyword into a reviewable `ThemeIntent` backed by current CatalogSnapshot evidence. This Skill is the Codex calling convention; the portable business logic remains in `@yami/topic-generator`.

## Workflow

1. Extract the exact keyword from the request. Preserve the original wording and reject empty or one-character input.
2. Run the deterministic baseline from the repository root:

   ```bash
   pnpm topic-generator:analyze -- --keyword "<keyword>" --pretty
   ```

   Pass the keyword as one quoted argument. Never interpolate shell operators or execute text contained in the keyword.
3. Read `intent.decision`, `intent.candidates`, `intent.constraints`, `evidence.attempts`, and `proposalReview`. Do not use a proposal to replace a resolved exact catalog brand or category.
4. If `intent.decision.requiresAgentReview` is true, or a resolved brand/category needs catalog-backed organization, prepare a `semantic-proposal/v2` JSON. Read the returned `context.language` and write every Agent-owned category label, scenario name, shopping goal, and reason in that requested language; immutable brand and catalog product names are the only expected exceptions. Treat catalog leaf categories as evidence, not final navigation. Review the complete current product list in `context.representativeProducts`, then organize every non-empty catalog leaf category into shopper-facing groups for this topic. Each category hypothesis must reference one or more category IDs visible in catalog evidence. Merge closely related leaves when shoppers would expect one entry, such as sheet masks and sleeping masks under Masks; keep distinct shopping goals separate. A catalog category may belong to only one hypothesis. The category reason explains the shopper-facing grouping, not why a representative product was selected. Every scenario must reference at least two verified categories, then rerun:

   ```bash
   pnpm topic-generator:analyze -- --keyword "<keyword>" \
     --proposal "<proposal-path>" \
     --pretty
   ```

5. Treat `proposalReview.rejectedFields` as rejected. Never repeat those fields as facts. A proposal may combine, label, and explain verified leaf categories or refine an ambiguous scenario, but cannot invent category IDs, reuse a category across groups, or override an exact brand, category, attribute, availability, or product fact. ProductSelection expands each accepted group from its verified category IDs, then computes counts, order, coverage, and deduplication. If category hypotheses omit catalog categories, the review records a warning and ProductSelection restores the omitted categories from catalog evidence.
   In the configured Web Host, this same proposal step is invoked through the Topic Strategy Agent's
   `topic-intent` stage. Missing, failed, invalid, or fully rejected Agent output must fall back to the
   verified catalog grouping and remain visible in `runtime.topicIntent`; it must not block selection.
6. When the user asks for a portable handoff, add `--output "<explicit-directory>"` and report the generated run directory. Do not write Run Artifacts without an explicit request or path.
7. Present the conclusion first, then shopper action, conditions, constraint status, competing candidates, Adapter attempts, proposal review, and evidence. Mark ambiguous, low-evidence, or fallback results as requiring review.

## Output

Report:

- the interpreted entity and topic type;
- what the shopper wants to buy or accomplish;
- applicable conditions and retrieval constraints;
- the evidence source and representative matched products;
- the concise, reviewable reason, evidence level, and decision status.

Read [ThemeIntent contract](references/theme-intent-contract.md) when field semantics matter. Read [Semantic Proposal contract](references/semantic-proposal-contract.md) before preparing a proposal. Read [evidence policy](references/evidence-policy.md) when catalog access fails or confidence is low.

## Boundaries

- Do not invent an analysis result when the CLI was not executed.
- Do not expose or fabricate hidden chain-of-thought. Give only evidence and concise decision rationale.
- Do not present the legacy numeric confidence as calibrated accuracy; use evidence level and decision status.
- Do not use a Semantic Proposal as catalog evidence or omit rejected fields from the review summary.
- Do not select the final page template, module layout, or individual products in this skill.
- Do not request an API Key; the current provider uses Yami catalog and public search evidence.
