# YAMI CHANGELOG

> **2026-08-06 — Migrated into YAMI Canvas.** This package is the canonical
> workspace source for the Canvas and Storybook applications. The immutable
> Design Labs snapshot remains migration provenance only.
> Historical paths and commands below are retained as provenance; use
> `README.md` for current maintenance commands.

Tier 1 asset breaking changes only. Component / recipe / validator changes are tracked in the root `.changeset/` flow.

See `docs/guides/writing-decision-records.md` for:
- What belongs here vs in `decisions.md`
- What belongs in root `.changeset/` vs here
- When to write an ADR instead

## 0.5.0-alpha.1 — 2026-07-22

**Selection controls.**

- Added Figma-grounded `Checkbox` and `RadioGroup` component bundles with Storybook showcases, Code Connect mappings, catalog metadata, usage guidance, and registry delivery.
- Reused Base UI for checkbox/radio keyboard behavior, ARIA state, exclusive selection, and native form participation; YAMI CSS owns the visual layer.
- Added Light/Dark semantic styling without adding theme props or conflating `inverse` with Dark mode. Selected states remain neutral ink rather than operational red.

## 0.4.0-alpha.1 — 2026-07-22

**Dark theme and orthogonal inverse polarity.**

- Added a complete 92-token Dark semantic color map in `tokens/themes/dark.tokens.json`; primitives remain theme-invariant.
- The token contract now carries selector contexts and emits `.dark` overrides through the DTCG → `tokens.json` → `tokens.css` pipeline.
- Added exact Light/Dark semantic key parity and WCAG AA checks for critical default, inverse, button, and badge foreground/background pairs.
- Storybook now exposes a Light/Dark toolbar. YAMI color docs switch their displayed source aliases with the selected theme.
- Clarified that `inverse` is opposite surface polarity inside either Theme: Light × Inverse is generally dark; Dark × Inverse is generally light.
- Input now preserves keyboard focus when moving to its clear action and safely shrinks below its 320px design width in narrow containers.

## 0.3.0 — 2026-06-01

**Token pipeline overhaul — full composite tokens.css regeneration + value-parity drift gate (per ADR-010 v0.3.0 milestone 1).**

- **One-command rebuild**: `pnpm build:tokens` (root) regenerates the full composite `tokens.css` + `tokens.flat.json` + `tokens.ts` + `tokens.md` directly under `design-systems/yami/`. No more manual splice. Internally runs `tools-tokens build --ds yami --commit && ds:sync yami`.
- **`tools-tokens build --commit`** (new) emits the full curated `tokens.css` (file-header + `styles/fonts.css` splice + sectioned `:root` + `@media (min-width: 1024px)` + `@media (min-width: 1440px)` + `styles/base.css` splice) via the new `emitTokensCss` (`packages/tools-tokens/src/emit.ts`). The default `tools-tokens build` (no flag) continues to write a bare `:root` to `<ds>/generated/` for dry-run inspection; `--commit` and `--out` are mutually exclusive.
- **`tokens.css :root + @media` value-parity drift gate** — `check:tokens-flat-sync` upgrades from key-parity to full value parity (supersedes v0.2.0 line 40 below). The resolver now exposes `resolveTokensFull` returning a separate `cssDeclarations` layer that preserves CSS-authored shape: `rgba()` colors pass through verbatim, color aliases stay as `var(--primitive)` literals (other-typed aliases resolve to scalars), font-family arrays serialize with quotes around space-bearing names, etc. `parseCssResponsiveRootBlocks` extends drift detection into both `@media` buckets via brace-scanner traversal.
- **`check:tokens-md`** is the 5th tier of `pnpm check:yami` (supersedes v0.2.0 line 39 below — "4 checks" is now 5). Wraps `scripts/sync-design-system.mjs --check`.
- **Unit coverage**: `packages/tools-tokens/tests/check.test.ts` adds 7 scenarios (main :root value mismatch / color alias mismatch / 1024px @media mismatch / 1440px @media mismatch / missing var / extra var / unknown @media block). Resolver+emit oracle in `tests/resolve.test.ts` asserts byte-level equivalence with committed `tokens.css`.
- **Postamble realigned with `styles/base.css`**: the composite emitter splices `styles/base.css` directly, so legacy aliases and element baselines stay structurally in sync with the committed CSS source.

**Deprecations carried forward (v0.3.0 milestones 2 & 3, tracked separately):**

- `styles/base.css` `--font-brand` / `--font-cn-ios` / `--font-cn-android` / `--font-mono` legacy aliases — still flagged for removal, requires consumer migration (grep across `components/`, `pages/templates/`, `ui_kits/`).
- Dark-mode theme overlay in `tokens/themes/dark.tokens.json` — placeholder remains.

## 0.2.0-alpha.2 — 2026-05-31

**DESIGN.md projection consolidation: 3 → 2 files (per `decisions.md → 2026-06-design-md-consolidation`).**

The previous v0.2.0-alpha.1 shipped three DESIGN files — this release merges them into two cleaner physical files matching industry pattern (refero.design "1 spec + 1 brief") and the Web UI's Compact/Extended tab assumption:

- **Merged**: `DESIGN.extended.md` (793 lines) absorbed into `DESIGN.md` (now 860 lines). `DESIGN.md` is the comprehensive spec + rules SSOT in one file. `<!-- rule-id: X -->` markers now live inline by topic (under the section each rule governs) plus a bilingual Hard Rules summary table at the end for navigation lookup. Frontmatter `roles: [spec, rules-ssot]` replaces the previous `projection: rules-ssot`.
- **Untouched**: `DESIGN.compact.md` remains the 30-second brief (CN+EN bilingual intro, 110 lines, audience: human-designer).
- **Deleted**: `DESIGN.extended.md` — content fully absorbed.
- **Code**: `principles/check-components-in-doc.ts` `DESIGN_EXTENDED` → `DESIGN_SPEC` (reads `DESIGN.md`). `check-sync.ts` unchanged (markers still in `DESIGN.md`). `check-tokens-in-docs.ts` regex auto-adapts (one fewer file scanned).
- **`design-system.meta.json` `docs` field**: `{rulesSsot, compact, extended}` → `{spec, compact}` — cleaner schema with 2 entries instead of 3.
- **Cross-doc**: README.md "How to read" table simplified to 2 rows; SKILL.md merged "Implementation read" + "Hard rules" sections; ADR-010 Consumers + drift-gate references updated; DESIGN.compact.md footer link refreshed.

Verification: `pnpm check:yami` 4 lines green; `grep -c "^<!-- rule-id: " DESIGN.md` = 16; `apps/web` isolation invariant preserved (no apps/web changes in this DS-only release; Web UI awareness coming in a follow-up).

## 0.2.0-alpha.1 — 2026-05-31

**Documentation — tri-projection DESIGN.md + token-reality CI护栏 + DTCG-only pipeline (ADR-010).**

**New tokens (non-breaking; minor bump):**

- `--icon-rating-star` (semantic, `tokens/semantic/colors.tokens.json` → `{color.amber.500}`) — replaces ProductCard's historical `var(--color-amber-500)` primitive reference; removes the `yami-validate-disable: semantic-color-only` pragma on `ProductCard.module.css`.
- Local code/.mono element baseline — kept in `styles/base.css`; not part of the Figma token projection.
- Local h1 bold compatibility alias — kept in `styles/base.css`; new code should use `--font-weight-emphasize` from Figma.

**Pipeline / CI (per ADR-010 — DTCG-only token consumption + four-tier drift gate):**

- `pnpm check:yami` (root) → `pnpm validate` (yami) — chains 4 checks: `principles-sync` + `tokens-in-docs` + `components-in-doc` + `tokens-flat-sync` (new).
- `tools-tokens check --ds yami` extended: was `tokens.flat.json` value oracle only; now also verifies `tokens.ts` value parity + `tokens.css :root` block key parity. Implementation: `packages/tools-tokens/src/cli.ts`.
- husky v9 pre-commit (`.husky/pre-commit`) runs `pnpm check:yami` on every commit; root `package.json` gains `husky` devDep + `prepare: "husky"` script.
- ~~GitHub Actions workflow~~ — added in `0750b47` then **removed** post-merge: account-level Actions billing was not configured, jobs were rejected before runner start. Decision: defer remote CI until billing is sorted; husky pre-commit is the sole automated gate for now. The workflow can be re-added with a single file when ready (see ADR-010).
- `.gitignore` adds `design-systems/*/generated/` (dry-run artifact dir from `tools-tokens build`).

**Deprecations (slated for v0.3.0 removal per ADR-010):**

- `styles/base.css` legacy aliases `--font-brand` / `--font-cn-ios` / `--font-cn-android` / `--font-mono` marked `@deprecated v0.2.0`; consumers should migrate to `--font-family-*` DTCG aliases (and `--font-mono` is promoted to a DTCG candidate).

**Documentation — tri-projection DESIGN.md + author-syntax for anti-patterns:**

- **New: `DESIGN.compact.md`** (~120 lines) — 30-second brand entry point for designers / PMs / stakeholders. EN + CN parity intro, 5-color anchor, type hierarchy, components-at-a-glance, hard rules one-liner. Frontmatter `audience: human-designer`.
- **New: `DESIGN.extended.md`** (~800 lines) — AI implementation handbook. Full token tables (colors / typography / spacing / radii / elevation / semantic aliases), component anatomy, motion summary, **Agent Prompt Guide** with 5 ready-to-paste component prompts + anti-pattern reject list, Known AI Failure Gallery, Quick Start CSS + Tailwind v4 blocks. Frontmatter `audience: ai-agent`.
- **New: `SKILL.md`** (~150 lines) — AI skill manifest. Routes AI agents to the right doc by task: 8 sections including "When to use", "First read", "Implementation read", "Components catalog", "Validate output", "Isolation", "Quick start".
- `DESIGN.md` (rules SSOT) updated: frontmatter `audience: ci-validator`, `--strike` typo fixed → `.strike`, `no-custom-radii` wording clarified (ban includes primitives `--radius-sm/md/lg/xl`, not only raw values), added `## Author syntax for anti-pattern examples` documenting the 3 exclusion mechanisms for `check:tokens-in-docs`.
- Bilingual parity added to Compact intro + Extended Color anchors / Hard Rules / Anti-patterns tables (per `decisions.md → 2026-04-bilingual-parity`).
- Tokens / components / recipes / preview / decisions are cross-linked from Extended as a documentation hub. Tone & Voice + Motion sections delegate to `content/` and `motion/` for full specs.
- README adds `## How to read this DS` three-projection reader guide and `## Changing tokens` runbook for the DTCG-edit → build → splice → check workflow.
- Scaffold: new `templates/project-scaffolds/design-system-init/` with 4 `.md.template` skeletons + README for spinning up future brand design systems following the tri-projection pattern.
- `design-system.meta.json` registers `skill.entryDoc: SKILL.md` and `docs.{rulesSsot,compact,extended}` paths.

## 2026-05-10

**Breaking — brand red split into two colours.**

- `--color-brand-red` is now `#FF0000` (was `#E00000`), decoupled from `{color.red.500}`. Brand-mark / Logo only. Matches the Figma export verbatim.
- `--color-red-500` stays `#E00000` and continues to drive emphasis CTAs, promotion / urgency, and error state. The full red ramp (red-400 → red-500 → red-600) is unchanged.
- `--button-emphasis` re-pointed from `{color.brand.red}` to `{color.red.500}` so hover (`red-600` `#C40009`) and dark-mode (`red-500`) form a continuous ramp; resting CTA stays `#E00000`.
- Logo SVGs added at `assets/logos/yami-icon-*.svg` (2 variants) and `assets/logos/yami-ui-*.svg` (8 variants), exported from Figma node `2651:6535 品牌 Brand`. Wordmark (`logo-text`) and vertical lockup (`logo-vertical`) not yet exported.
- Badge marks moved out of `assets/logos/` to a new `assets/badges/` (Y monogram on flag-shape container, blue / purple, used for tier / category badges — distinct from canonical brand logos).
- DESIGN.md `red-usage` rule rewritten as a two-colour table; `decisions.md` extended with the split rationale; `principles/principles.ts` description updated. `red-usage` validator already detected both `#E00000` and `#FF0000`, no code change needed.
- Build pipeline gained a `stripMeta` SD parser hook (`packages/design-tokens/src/style-dictionary-config.ts`) that strips top-level `$schema` / `$description` from each source `*.tokens.json` before SD merge. Eliminates 11 spurious "Token collision" warnings without losing source-file documentation.

## 0.2.0 — 2026-04-21

Phases 1-10 feature complete. T1 assets filled in.

- **Tokens**: 410 CSS custom properties generated from DTCG sources (`tokens/primitives/`, `tokens/semantic/`, `tokens/typography/`, `tokens/themes/`). Style Dictionary 4.x pipeline.
- **Components**: 6 components shipped as 6-part bundles (Badge, Button, Card, Divider, Input, ProductCard). Each has `.tsx` / `.module.css` / `meta.json` / `usage.md` / `examples.tsx` / `index.ts` + `.figma.tsx` Code Connect binding.
- **Page recipes**: 4 recipes wired (product-list, product-detail, cart, checkout) with JSON-schema `data`, `contextQuestions`, and `slots` definitions. Each recipe exported at `@yami/design-system/recipes`.
- **Page templates**: 4 web templates under `pages/templates/web/`.
- **Principles**: 15 planned validators + 1 added from live M3 capture (`token-exists`) = 16 total. Three-way consistency (design.md ↔ principles.ts ↔ validators/) CI-enforced.
- **Icons**: 107 SVG icons + `icons.meta.json`.
- **Fonts**: GT Walsheim registered via `styles/fonts.css`.
- **Content**: `content/` filled with voice, bilingual, writing-standards, casing-numerals, copy-patterns guides.
- **Motion**: `motion/` with easing / durations / patterns docs.
- **Preview**: 2 HTML spec cards (button.html, product-card.html) generated by `next export`; more to come when docs pages expand.

Pragma `/* yami-validate-disable: rule-id */` is now honored by the `validateDesign` runner (`principles/index.ts:44`). Two templates (Cart, ProductDetail) use documented pragmas for e-commerce type-hierarchy + tap-target patterns (see `decisions.md` 2026-04-pragma-is-runner-level).

Exports map additions: `./recipes`, `./components`, `./components/*`, `./pages`, `./principles`, `./tokens`, `./tokens.flat.json`.

## 0.1.0 — 2026-04-20

Initial release — Phase 0 scaffold.

- 15 design rules defined in `design.md` (rule-ids: red-usage, no-gradient, semantic-color-only, numerals-font, type-hierarchy, no-custom-radii, elevation-on-press, no-opacity-disabled, focus-style, border-strength, emphasis-limit, card-no-border, tap-target, no-emoji, no-decorative-media)
- Skeleton directory structure for tokens / fonts / assets / content / motion / principles / components / pages / ui_kits / preview
- Brand meta registered (`design-system.meta.json`): platforms=["web"], skills.managed=[yami-design-system, yami-content, yami-copy-library]
- Figma source registered (`figma.meta.json`): file key 6oOAy72DBff4P6NzJYc2hi, last sync pending (Phase 1)

No token values, no components, no recipes, no validators implemented yet — all Phase 1+.
