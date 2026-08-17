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
3. Read `intent.decision`, `intent.candidates`, `intent.constraints`, `evidence.attempts`, and `proposalReview`. Do not create a proposal for a resolved exact catalog brand or category.
4. If `intent.decision.requiresAgentReview` is true and the phrase expresses a compound shopping scenario, prepare a `semantic-proposal/v1` JSON. Use only the user's wording and labels visible in the returned catalog evidence, then rerun:

   ```bash
   pnpm topic-generator:analyze -- --keyword "<keyword>" \
     --proposal "<proposal-path>" \
     --pretty
   ```

5. Treat `proposalReview.rejectedFields` as rejected. Never repeat those fields as facts. A proposal may refine an ambiguous scenario, but cannot override an exact brand, category, attribute, availability, or product fact.
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
