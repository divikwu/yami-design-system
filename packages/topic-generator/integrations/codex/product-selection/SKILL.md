---
name: product-selection
description: This skill should be used when the user asks to "select products", "configure a selection strategy", "run 精准匹配", "run 分类角色", "create a ProductSemanticProposal, CategoryRoleProposal, or SceneProposal", "inspect product pools", or "reproduce the LandingPageAgent category-role workflow" with reviewable Yami catalog evidence. Do not use for ThemeIntent-only analysis or visual page design.
---

# Product Selection

Use the package CLI as the deterministic runtime. Act as the Product Agent only when a returned state requests a bounded semantic proposal; never reproduce retrieval, ordering, validation, or deduplication in prose or ad hoc code.

## Choose a host mode

- In Codex or Kiro, run the resumable CLI workflow below and create proposal JSON only when the
  returned state requests it. Treat this shared Skill as the current Product Agent implementation.
- Do not claim that the standalone Web page can invoke an interactive Codex or Kiro session. Use
  the CLI workflow from the workspace instead.
- Use `createHttpProductSelectionAgent` only for the automatic API Host. Keep its proposal contracts
  identical to the interactive workflow so moving hosts does not change selection rules.
- Never replace an unavailable Agent with fixture, inferred, or hard-coded proposals outside tests.

## Choose a strategy

- Use `relevance/intent-themes@5` for current keyword and brand relevance. Each accepted TopicIntent
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
  its separate two-to-six-group, four-to-sixteen-product limits. Brand Spotlight is derived from
  frozen PrimaryPool brand evidence: keep two to six eligible brands and exactly three ordered
  products per brand; return the module empty when fewer than two brands each have three products.
- When those verified leaves produce fewer than two useful groups, `@5` returns
  `needs-product-semantic-proposal`. Review the complete frozen PrimaryPool and regroup its products
  by distinct shopper intent inside the leaf. This is a text-first classification step: use product
  titles, catalog identity, category evidence, and ordering; do not fetch replacement products or
  use image similarity as the primary classifier. Read
  [product-semantic contract](references/product-semantic-contract.md) before writing the proposal.
- Use `relevance/intent-themes@2` only to replay artifacts that grouped directly by verified catalog
  categories, `relevance/intent-themes@3` to replay the previous four-to-eight StartHere contract,
  `relevance/intent-themes@4` to replay the previous catalog-leaf-only contract, and
  `relevance/default@1` only for fixed-rank legacy replay.
- Use `category-role/landing-page-agent@1` when the user requests the target repository's category-role workflow.
- Treat the versioned config ref as part of every artifact. Do not silently substitute another strategy.

## Relevance workflow

Run from the repository root:

```bash
pnpm topic-generator:analyze -- --keyword "<keyword>" \
  --selection-strategy relevance/intent-themes@5 \
  --selection-language zh \
  --pretty
```

Read `productSelection.run`. If it requests `needs-product-semantic-proposal`, create exactly one
proposal from the returned context and rerun with
`--product-semantic-proposal "<proposal-path>"`. Report a result only when its status is `ready`.
An automatic Host may return one repair request containing the rejected proposal and deterministic
review issues. Correct only those issues and return a full replacement proposal; there is no third
attempt.

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

Use the task's exact stage (`product-semantic-proposal`, `category-role-proposal`, or
`scene-proposal`) and place the constrained
proposal in `proposal`. Do not edit the exported run. The caller must submit the response through the
same deterministic validation used by the CLI and HTTP Agent modes. The Workbench does not expose
this developer-only flow.

Do not use the handoff envelope for an automatic `product-selection-agent-request/v1`. In that mode,
return the requested proposal object directly or wrap it in
`product-selection-agent-response/v1`, exactly as the Host execution contract requests.

## Review gates

- Stop on `blocked`; report every issue without repairing evidence silently.
- On `needs-product-semantic-proposal`, classify every returned PrimaryPool product exactly once,
  keep the requested language, and do not invent, replace, or reorder product IDs.
- Treat `context.repair` as validator feedback, not new catalog evidence. Recheck the full
  replacement proposal for duplicate, missing, and unknown IDs before returning it.
- On `needs-category-proposal`, do not fetch products yet.
- On `needs-scene-proposal`, bind the proposal to the exact returned `candidateSnapshotDigest`.
- Treat proposal reasons as review rationale, not hidden reasoning or catalog facts.
- Do not ask the Agent to invent or merge Brand Spotlight groups. Brand identity, the two-to-six
  brand range, three products per brand, ranking, and module hiding are deterministic runtime rules.
- Do not edit IDs, roles, product identity, digests, or strategy refs after validation.
- Report the selected config ref, status, category-role distribution, Adapter attempts, module counts, and any empty modules.
- Report `candidateQualityReport.status`, issue codes, and category coverage. Never hide a quality
  warning by editing candidate evidence or asking the Agent to invent replacement products.
- For Matcha regression checks, evaluate stable Golden Case invariants; never pin live product IDs.

## Architecture boundary

The TOPIC GENERATOR Agent decides shopper-facing category semantics, in-leaf product grouping, catalog-category grouping, and source shopping scenes. The Skill provides
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
