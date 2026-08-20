---
name: product-selection
description: This skill should be used when the user asks to "select products", "configure a selection strategy", "run 精准匹配", "run 分类角色", "create a CategoryRoleProposal or SceneProposal", "inspect product pools", or "reproduce the LandingPageAgent category-role workflow" with reviewable Yami catalog evidence. Do not use for ThemeIntent-only analysis or visual page design.
---

# Product Selection

Use the package CLI as the deterministic runtime. Act as the Product Agent only for the two semantic proposals required by `category-role/landing-page-agent@1`; never reproduce retrieval, allocation, or deduplication in prose or ad hoc code.

## Choose a host mode

- In Codex or Kiro, run the resumable CLI workflow below and create proposal JSON only when the
  returned state requests it. Treat this shared Skill as the current Product Agent implementation.
- Do not claim that the standalone Web page can invoke an interactive Codex or Kiro session. Use
  the CLI workflow from the workspace instead.
- Use `createHttpProductSelectionAgent` only for the automatic API Host. Keep its proposal contracts
  identical to the interactive workflow so moving hosts does not change selection rules.
- Never replace an unavailable Agent with fixture, inferred, or hard-coded proposals outside tests.

## Choose a strategy

- Use `relevance/intent-themes@3` for current keyword and brand relevance. Each accepted TopicIntent
  category hypothesis binds one or more verified catalog leaf categories to one shopper-facing
  Shortcut and the matching comprehensive-recommendation tab. The Agent may merge closely related
  leaf categories according to the topic and complete product evidence; catalog leaves remain the
  membership facts. Scenario hypotheses organize StartHere. Deterministic code expands every accepted
  category group, retains product ordering, and enforces deduplication. Do not truncate valid category
  navigation to a fixed display count or a four-product editorial minimum: one-product verified
  categories remain valid when the Agent keeps them distinct. Agent-omitted catalog categories are
  restored, otherwise unassigned primary products are placed in a deterministic
  More to Explore group, and requires every primary product to appear in exactly one Shortcuts group.
  Shortcuts and recommendation tabs preserve that same complete group ID sequence. StartHere keeps
  its separate two-to-six-group, four-to-eight-product limits.
- Use `relevance/intent-themes@2` only to replay artifacts that grouped directly by verified catalog
  categories, and `relevance/default@1` only for fixed-rank legacy replay.
- Use `category-role/landing-page-agent@1` when the user requests the target repository's category-role workflow.
- Treat the versioned config ref as part of every artifact. Do not silently substitute another strategy.

## Relevance workflow

Run from the repository root:

```bash
pnpm topic-generator:analyze -- --keyword "<keyword>" \
  --selection-strategy relevance/intent-themes@3 \
  --pretty
```

Read `productSelection.run`. Report a result only when its status is `ready`.

## Category-role workflow

1. Obtain a valid `catalog-taxonomy-snapshot/v1` artifact for Yami US, or the complete five-column TSV exported by the target repository. Do not infer the full taxonomy from search results, product titles, or ThemeIntent evidence.
2. Run the CLI with `--taxonomy`. Expect `needs-category-proposal`:

   ```bash
   pnpm topic-generator:analyze -- --keyword "<keyword>" \
     --selection-strategy category-role/landing-page-agent@1 \
     --taxonomy "<taxonomy.json>" \
     --pretty
   ```

   For the target repository TSV, replace `--taxonomy` with
   `--taxonomy-tsv "<categories.tsv>"`. The CLI reconstructs and validates the hierarchy before
   exposing any categories to the Agent.

3. Read the complete `productSelection.run.context.categories`, then create one `category-role-proposal/v1`. Read [category-role contract](references/category-role-contract.md) before writing it. Use only taxonomy category IDs and give a concise, reviewable reason for each role.
4. Rerun with `--category-proposal`. The runtime validates the proposal and, if accepted, executes the 10 category queries and one discovery query. Expect `needs-scene-proposal` plus `productSelection.artifacts.candidateSnapshot`.
5. Preserve that candidate snapshot exactly. Create one `scene-proposal/v1` from the returned role-tagged products. Read [artifact and scene contracts](references/artifact-contracts.md) before writing or passing artifacts.
6. Rerun with the same `--taxonomy` or `--taxonomy-tsv` and `--category-proposal`, plus
   `--candidate-snapshot` and `--scene-proposal`. The final state still validates the complete
   evidence chain; omitting the original taxonomy or accepted category proposal returns `blocked`.
   Accept the output only when `productSelection.run.status` is `ready`.

Use an explicit temporary directory for intermediate Agent files. Never overwrite a caller-owned artifact. Use `--output` only when the user explicitly requests persistent Run Artifacts.

## External handoff workflow

When an API or debugging caller provides a complete `product-selection-handoff-task/v1`, create only
the proposal requested by its `stage`, then return:

```json
{
  "schemaVersion": "product-selection-handoff-response/v1",
  "stage": "category-role-proposal",
  "proposal": {}
}
```

Use the task's exact stage (`category-role-proposal` or `scene-proposal`) and place the constrained
proposal in `proposal`. Do not edit the exported run. The caller must submit the response through the
same deterministic validation used by the CLI and HTTP Agent modes. The Workbench does not expose
this developer-only flow.

## Review gates

- Stop on `blocked`; report every issue without repairing evidence silently.
- On `needs-category-proposal`, do not fetch products yet.
- On `needs-scene-proposal`, bind the proposal to the exact returned `candidateSnapshotDigest`.
- Treat proposal reasons as review rationale, not hidden reasoning or catalog facts.
- Do not edit IDs, roles, product identity, digests, or strategy refs after validation.
- Report the selected config ref, status, category-role distribution, Adapter attempts, module counts, and any empty modules.
- Report `candidateQualityReport.status`, issue codes, and category coverage. Never hide a quality
  warning by editing candidate evidence or asking the Agent to invent replacement products.
- For Matcha regression checks, evaluate stable Golden Case invariants; never pin live product IDs.

## Architecture boundary

The TOPIC GENERATOR Agent decides shopper-facing category semantics, catalog-category grouping, and source shopping scenes. The Skill provides
the calling convention. `@yami/topic-generator` owns schema validation, Yami requests, sorting,
role quotas, selection-stage candidate grouping, and global deduplication. The later
`page-merchandising` Skill may propose final PagePlan v2 module visibility and assignments only
inside this frozen result; it cannot retrieve or replace products.

Programmatic hosts may inject the same Product Agent through
`runProductSelectionAgentWorkflow`; this only collapses the resumable calls and does not move any
selection rule into the Agent or Skill.

Remote hosts may use `createHttpProductSelectionAgent`. The endpoint must return one
`product-selection-agent-response/v1` containing only the proposal requested by `stage`. Never send
or persist Provider credentials in a proposal, taxonomy artifact, candidate snapshot, or browser response.
