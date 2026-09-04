# M3.5 agent-readiness report

Date: 2026-09-04

Contract implementation baseline: `8bafeb54f1ff4e2d03316b04502193fb9787357e`

Client and lifecycle rehearsal baseline: `bda915d8cecc05785bbec7ef816de611186addf9`

Decision: **conditionally ready; not yet cleared for the M4 pilot**

M3.5 establishes deterministic, locally verifiable contracts for agents. It does not add a CLI,
MCP product, shadcn output, npm release, hosted deployment, or evidence of team adoption.

## Implemented capability

| Area | Result at the contract implementation baseline |
| --- | --- |
| Component contract | 30/30 component metadata files validate against the 2020-12 schema. All 14 stable components pass exact public-export and `Showcase` checks plus Usage, Registry, source, strict SemVer, token-binding, rule, and interaction-evidence checks. |
| Registry v2 | 31 deterministic internal source items use one unified shape, including the base item, and expose source/target files, exports, dependencies, documentation, design rules and tokens, quality evidence, and SHA-256 content digests. Repeated generation is byte-identical. |
| Page validation | 7/7 maintained page families are declared: five Core and two Smoke. Repository-scoped sources, stories, exact fixture exports, App Router routes, and test references are checked. |
| Skill evaluation | 12/12 bilingual offline cases pass using the real rule validator and local component, page, token, rule, Registry, and named Story-export references. CI does not call a model API. |
| Skill contract | English and Chinese manifests are versioned `0.6.0-alpha.1` and describe Registry v2 as an internal source contract, not shadcn compatibility. |
| Release record | A minor Changeset exists for `@yami/design-system` and `@yami/prototypes`; no version bump, package publication, merge, or deployment was performed. |

## Fixed-commit client rehearsal

Both clients received the same read-only prompt at the earlier rehearsal baseline. They were forbidden
from editing, using network sources, running generation, or claiming checks they had not executed.

```text
Evaluate button-selection, ecommerce-home-start, product-detail-maturity,
fabricated-token-reject, and preserve-confirmed-ui. Return the starting points,
outcome, required rules, validation commands, and limits. Use only maintained
local YAMI sources. Do not fabricate a component, token, rule, Registry entry,
or evidence. Do not claim CLI, MCP, shadcn compatibility, publication, or deployment.
```

| Client | Version and model | Button | Home | PDP maturity | Fake token | Preserve UI | Corrections |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Codex | CLI `0.144.6`; `gpt-5.6-sol`, medium, read-only | pass | pass | needs-review | reject | needs-review | 1 |
| Kiro | CLI `2.21.0`; configured local client model | pass | pass | needs-review | reject | needs-review | 0 |

The single Codex correction changed the PDP result from `pass` to `needs-review`; its source selection
and maturity disclosure were already accurate. The corrected result names experimental
`ProductMediaGallery` and beta `RadioGroup`. Kiro returned the expected outcome on its first attempt.
Both clients rejected `--font-size-heading-lg`, verified the real heading scale, and avoided invented
components, tokens, rules, and Registry entries. Both limited the UI-preservation task to the Button
`size` prop and requested the missing target instance and desired size instead of guessing.

The clients prescribed `pnpm validate` and relevant targeted commands but did not run them. Their
output is selection and reasoning evidence, not test-execution evidence. Codex could verify the Git
revision; Kiro's read-only tool policy denied the Git command, so its commit field records the supplied
fixed baseline rather than an independent revision check.

## Clean-tree lifecycle rehearsal

A disposable detached worktree at the earlier rehearsal baseline exercised the complete lifecycle:

1. Discovery selected the stable `button` Registry item at digest
   `6a59430379d9f247a4610293ecf5a4428a02cb8b7c33f35fee678f74cd9be4d4`.
2. Implementation added one temporary attribute to the maintained FullWidth Button example.
3. Contract validation still passed, while Registry check correctly failed on the root and Button item.
4. Regenerating Registry v2 changed the digest to
   `e70e20b9043b8001499caf3d3d0eb7a8b31ce0669d2e34f8969ac3c0843fb145`; updating the migration
   map then made all generated checks and the digest unit tests pass.
5. The exact temporary change was removed, generated artifacts were rebuilt, the original digest was
   restored, and `git status --porcelain` returned empty before the worktree was removed.

This proves detection, update, and rollback behavior without retaining the rehearsal change or touching
the user's main checkout.

## Verification gates

The implementation must be checked with these repository-owned commands before an M4 pilot decision:

```bash
pnpm check:design-system-contracts
pnpm check:generated
pnpm evaluate:design-system-skill
pnpm test:storybook
pnpm test:a11y
pnpm test:e2e
pnpm test:visual
pnpm check:docsite-content
pnpm test:docsite
pnpm validate
```

Current results from this worktree:

| Command or gate | Result |
| --- | --- |
| `pnpm validate` | pass; includes lint, paired Docsite content, typecheck, 15 principle sync, 400 Token references, 30 components, 7 pages, 31 Registry items, 12/12 Skill cases, boundaries, tooling, and all workspace unit tests |
| Contract negative fixtures | pass; escaped Usage, import-only public export, fabricated Token binding, invalid SemVer, missing `Showcase`, repository escape, and route/source mismatch all fail as required |
| `pnpm test:a11y` | 6/6 pass |
| `pnpm test:e2e` | 13/13 pass |
| `pnpm check:docsite-content` | pass; 13 paired documents, 6 paired Blog posts, and 400 generated Tokens |
| `pnpm test:docsite` | 20/20 pass |
| `pnpm test:storybook` | **fail**; 306/306 main Storybook tests pass, but ProductMediaGallery browser tests are 3/4 because the touch thumbnail rail stays at 5px instead of scrolling beyond 85px; one isolated rerun reproduced it |
| `pnpm test:visual` | command exits successfully on macOS but 16/16 tests are intentionally skipped; this is not a visual pass |

The failing ProductMediaGallery test and its runtime implementation are unchanged from `origin/main`;
this branch changes only its metadata schema reference. The failure remains a real project gate and is
reported rather than hidden or fixed as unrelated scope. An omitted or locally skipped command is not
a pass.

## Known limits and remaining gate

- The existing 12-case EcommerceHome visual matrix remains unchanged. Search and Topic add only the
  requested pairwise mobile Chinese/light and desktop English/dark cases.
- The four new visual cases require Linux-generated Playwright baselines. This macOS host has no
  Docker, Podman, Colima, or Lima runtime, and the repository intentionally rejects non-Linux baseline
  generation. Until the Linux baselines are created and the visual suite passes in that environment,
  the M3.5 exit gate remains open.
- The existing ProductMediaGallery mobile thumbnail touch-scroll browser assertion currently fails
  twice on this baseline. It is independent of the M3.5 changes, but `pnpm test:storybook` must be green
  before M4 entry.
- ProductDetailPage and MobileSearchPage keep Story play, Storybook accessibility, and manual evidence;
  M3.5 does not invent duplicate Canvas routes. Categories and EmailTemplates remain Smoke scope.
- The rehearsal proves that two clients can select or refuse correctly for five fixed tasks. It does not
  prove multi-user adoption, production correctness, remote distribution, or an automatic upgrade path.

## M4 entry decision

Enter a 2-3 person, 1-2 task M4 pilot only after every command above has a current result and the Linux
visual-baseline gate is green. Measure actual discovery, correction, verification, update, and rollback
friction. CLI or MCP priority must follow repeated pilot evidence, not the existence of Registry v2.
