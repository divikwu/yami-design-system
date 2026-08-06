# YAMI Decision History

**M2 project memory** — the "why" behind major design decisions. Paired with `design.md` (what the rules are) and `CHANGELOG.md` (what changed when), this file answers "why did we decide this / what were we thinking".

Read `docs/guides/writing-decision-records.md` for when to add an entry here vs an ADR vs a CHANGELOG note.

## Format

Each decision uses a structured block:

```markdown
<!-- decision-id: YYYY-MM-<slug> -->
## <Short title>
- **Date**: YYYY-MM-DD
- **Decision**: <one-line summary>
- **Context**: <what triggered this / what problem>
- **Trade-offs**: <what we gave up>
- **Related rule-id(s)**: <design.md rule-ids this affects>
- **Related ADR(s)**: <docs/adr/ filenames if applicable>
```

---

<!-- decision-id: 2026-07-dark-theme-polarity -->
## Dark theme uses selector contexts; inverse remains an independent polarity axis

- **Date**: 2026-07-22
- **Decision**: Emit Light semantic colors under `:root` and a complete, key-parity Dark override under `.dark`. Keep component `inverse` APIs unchanged and define them as opposite surface polarity within the active Theme. Do not add component-level `dark` props.
- **Context**: The earlier docs described inverse aliases as Dark mode and the build pipeline only understood root/media contexts. That conflated two independent concerns and made Dark × Inverse impossible to express correctly.
- **Trade-offs**:
  - ✅ One `.dark` class switches ordinary components automatically without prop plumbing.
  - ✅ Light/Dark × Default/Inverse produces all four combinations using existing semantic aliases.
  - ✅ Primitive ramps remain stable and semantic key parity prevents partial themes.
  - ⚠️ Every semantic color change must now be reviewed in both Light and Dark source files.
  - ⚠️ Dark operational colors are not mechanical Light swaps; critical pairs require contrast validation.
- **Related rule-id(s)**: `semantic-color-only`, `red-usage`, `focus-style`, `no-opacity-disabled`
- **Related ADR(s)**: ADR-010 (DTCG-only token consumption)

---

<!-- decision-id: 2026-04-initial-principles -->
## Initial 15 design principles (Phase 0)

- **Date**: 2026-04-20
- **Decision**: Start with 15 rules extracted from the original Claude Design export, grouped into Color (3) / Typography (2) / Spacing-radii-depth (3) / Focus-borders (2) / Components (2) / Accessibility (1) / Imagery-patterns (2).
- **Context**: Need a minimum viable `design.md` to validate the three-way sync mechanism (design.md ↔ principles.ts ↔ validators/). 15 rules is enough to:
  1. Cover all visual pillars (color, type, space, radii, depth, interaction, a11y)
  2. Include one rule from each "problem class" (forbidden use like `no-gradient`, count limit like `emphasis-limit`, required property like `tap-target`, semantic-only like `no-opacity-disabled`)
  3. Stress-test the validator patterns without overwhelming Phase 6.5 implementation
- **Trade-offs**: Fewer rules than a mature system (Polaris ~60, Spectrum ~80). We expect to add rules as eval harness failure-gallery accumulates real generation errors (M3 feedback loop per ADR-0016).
- **Related rule-id(s)**: all 15
- **Related ADR(s)**: docs/adr/0010-three-tier-asset-classification.md (these rules are T1 — language-independent, survive framework migration)

---

<!-- decision-id: 2026-04-bilingual-parity -->
## Bilingual CN+EN parity (not "Chinese as translation")

- **Date**: 2026-04-20
- **Decision**: CN and EN on every customer-facing surface say the same thing. Neither is the "primary" or the "translation" — both are first-class.
- **Context**: YAMI serves Chinese-American consumers; monolingual CN feels dated, monolingual EN loses cultural anchoring. Competitors that treat Chinese as "added on top" lose brand identity.
- **Trade-offs**: 2× content work, space constraints in small UI (e.g. mobile bottom tab bar → we compress but keep both, see `copy-patterns.md`).
- **Related rule-id(s)**: n/a (this is a content-tier rule; see `content/bilingual.md`)

---

<!-- decision-id: 2026-04-red-scope -->
## Red — two reds, scope strictly limited

- **Date**: 2026-04-20 (initial), 2026-05-10 (split brand red from operational red)
- **Decision**: YAMI has **two reds**, not one. **Brand red `#FF0000` (`--color-brand-red`)** is the Figma brand mark color, used **only for Logo / primary brand signals**. **Operational red `#E00000` (`--color-red-500`)** covers (1) emphasis CTAs (Buy Now / Add to Cart / checkout), (2) promo/urgency (price, sale badges, countdowns), (3) error state. Never decorative.
- **Context**: Originally `--color-brand-red` aliased to `{color.red.500}` (#E00000), so brand mark + CTA + promo + error all shared one hex. The actual Figma brand-mark export uses `#FF0000` (slightly brighter, pure-red), and the design team wants the Logo to match the Figma source verbatim. Operational red stays at `#E00000` because the existing red ramp (red-400 → red-500 → red-600) is tuned around `#E00000` for hover/pressed/dark variants — moving the ramp would break button-emphasis-active and badge contrast.
- **Trade-offs**: Two reds in one system creates a slight perceptual inconsistency (Logo vs. CTA on the same screen), but the difference is small enough that most users will not notice, while preserving Figma fidelity AND the existing operational ramp. Designers must remember: brand-red token is for Logo only — CTAs use red-500.
- **Related rule-id(s)**: red-usage, semantic-color-only

---

<!-- decision-id: 2026-04-no-gradient -->
## No decorative gradients

- **Date**: 2026-04-20 (amended 2026-07-25)
- **Decision**: No decorative linear / radial / conic gradients. ProductList may use a bottom-edge gradient to transition supplied campaign artwork into its precomputed dominant background color, and loading skeletons may use a shimmer gradient. The modal scrim `rgba(0,0,0,0.68)` remains the only graduated darkness overlay.
- **Context**: Gradients are trendy in AI-generated UI patterns (the "generic startup look"), which is exactly what we want to avoid. YAMI's visual signal is "clean, direct, honest" — no decorative tricks. ProductList campaign transitions prevent a hard seam between independently supplied artwork and its surface; skeleton shimmer communicates loading state.
- **Trade-offs**: The ProductList CSS requires a narrowly documented validator pragma because the static rule cannot distinguish decorative gradients from these functional transitions. Other hero, promo, and content surfaces continue to use solid semantic colors.
- **Related rule-id(s)**: no-gradient, no-decorative-media

---

<!-- decision-id: 2026-04-pragma-is-runner-level -->
## Validator pragma is honored at the runner, not in each validator

- **Date**: 2026-04-21
- **Decision**: The `/* yami-validate-disable: rule-id */` file-level pragma is processed once by the `validateDesign` runner (`principles/index.ts:44`). Individual validators don't call `hasFilePragma` themselves.
- **Context**: During a live code review, running `validator.check(code)` directly (bypassing the runner) reported violations that were actually suppressed by an existing pragma. First diagnosis was "the pragma mechanism is broken." It was actually a test-driver bug — the audit script used the low-level API instead of the public `validateDesign`. Real-world consumers (`validate_design` MCP tool, harness `validate-design` scorer, `check:principles-sync`) all go through the runner, so the mechanism works correctly for them.
- **Trade-offs**:
  - ✅ DRY — one place to maintain pragma parsing logic.
  - ✅ Validators stay pure: `check(code)` always returns "what the rule literally says about this code," independent of author intent. Useful for retros and audits that want the raw signal.
  - ⚠️ Documentation failure mode: the `hasFilePragma` helper lives in `validators/_shared.ts`, which suggests validators might call it — they don't. `checkPrinciple(ruleId, code)` also short-circuits on pragma, but individual `validator.check()` does not. An API docblock noting "use `validateDesign`, not `validator.check`, for pragma-aware validation" would help.
- **Related rule-id(s)**: all (pragma is infrastructure, not rule-specific)
- **Related ADR(s)**: n/a

---

<!-- decision-id: 2026-04-type-hierarchy-commerce-exception -->
## `type-hierarchy` rule needs commerce-page recognition (observation)

- **Date**: 2026-04-21
- **Decision**: Accept per-file pragma on e-commerce product templates (Cart, ProductDetail) for now. Document the observation that the 4-level ceiling is calibrated for content pages, not product pages.
- **Context**: E-commerce product pages legitimately need 6-7 distinct font-size tokens:
  1. brand/vendor label (caption-md)
  2. product title (heading-2xl or heading-xl)
  3. current price (price-md — larger than heading-md for emphasis)
  4. original price (strike-md)
  5. quantity label / meta (body-md)
  6. section heading (heading-md)
  7. page heading (heading-xl)

  Flattening any pair breaks a documented design goal: price must be the most emphasized number on the screen, distinct from both title and captions. Both Cart.tsx and ProductDetail.tsx tripped the rule; they currently carry `/* yami-validate-disable: type-hierarchy */` with rationale comments.
- **Trade-offs** considered:
  - Option A (current): per-file pragma. Works but each new commerce template will need it. Anti-DRY.
  - Option B: lower `maxLevels` to 6 globally. Too permissive for content pages.
  - Option C: add a `pageType` hint to `ValidationContext` and make `type-hierarchy` respect it (`pageType: 'commerce'` → 7 levels allowed, `pageType: 'content'` → 4). **Preferred long-term**; requires a `design.md` amendment and a validator refactor.
  - Option D: introduce a dedicated `pdp-scale` token family that aliases existing tokens so templates reference 4 "logical" sizes. Loses information (why have both title and price-current if they alias to the same thing?).
- **Outcome**: Track as non-blocking debt. Revisit when a third commerce template needs the same pragma — that will be the trigger to implement Option C.
- **Related rule-id(s)**: type-hierarchy
- **Related ADR(s)**: n/a yet; candidate for a future ADR-0017

---

<!-- decision-id: 2026-04-tap-target-self-contradiction -->
## `tap-target` warning on `size="sm" iconOnly` is self-contradictory (observation)

- **Date**: 2026-04-21
- **Decision**: Accept per-file pragma for now. Flag for rule-refactor when tap-target visual validation ships (Phase 8.5 Playwright).
- **Context**: The `tap-target` validator warns on `<Button size="sm" iconOnly>` but its own suggestion text says: *"No action needed if the button is in normal flow. Component padding provides adequate hit area (~56×32 visible → ≥44pt), but nested scroll containers can shrink it."* A warning that immediately tells the reader "this is probably fine" is not useful signal — it trains callers to ignore the rule, degrading signal quality for real violations.
- **Trade-offs** considered:
  - Option A: downgrade severity to `info` — "FYI, double-check this." Preserves the hint without contributing to the scorer penalty.
  - Option B: require additional context (e.g. "inside an `aria-label="stepper"` container") before firing. Complex regex.
  - Option C: Remove the static check entirely; wait for Phase 8.5 visual scorer to do real rendered-dimension validation.
- **Outcome**: Option C is the long-term right answer — this is a visual question that regex can't answer. Keep the rule as-is for now; revisit when Playwright scorer lands.
- **Related rule-id(s)**: tap-target
- **Related ADR(s)**: ADR-0013 (static vs runtime evaluation — this is a canonical example)

---

<!-- decision-id: 2026-06-token-pipeline-automation -->
<!-- decision-id: 2026-06-design-md-consolidation -->
## DESIGN.md projection consolidation: 3 → 2 files (v0.2.0-alpha.2)

- **Date**: 2026-05-31
- **Decision**: Merge `DESIGN.extended.md` into `DESIGN.md`. The combined `DESIGN.md` is the single comprehensive spec, with all 16 `<!-- rule-id: X -->` markers inline by topic (under the section each rule governs) plus a bilingual Hard Rules summary table for navigation. `DESIGN.compact.md` stays unchanged as the 30-second brand entry for designers / PMs / stakeholders. Bump version `0.2.0-alpha.1` → `0.2.0-alpha.2`.
- **Context**: v0.2.0-alpha.1 shipped three DESIGN files claiming "audience-targeted projections" but in practice the split was over-engineered. The "rules SSOT" role was an internal engineering concern that didn't justify being a separate file — it should live *inside* the spec doc as inline markers. Additionally, the Web UI's `Compact / Extended` tabs were row-truncation views of a single file, not file-switching views, so the three-file split was invisible to users and confusingly redundant for AI agents reading the docs.
- **Trade-offs**:
  - ✅ **Matches refero.design "1 source + N views" pattern.** Borrows Stitch's frontmatter convention for anchor metadata but keeps DTCG JSON as the actual token source (Stitch's full-frontmatter SSOT would require rewriting the `tools-tokens` resolver — bad ROI for a mid-maturity project).
  - ✅ **Web UI can now 1:1 map Compact / Extended tabs to physical files** via `design-system.meta.json.docs.{spec, compact}`. UI change in follow-up commit.
  - ✅ **Rule markers inline by topic improves readability.** Reading "Tokens — Colors" section, you encounter `red-usage` / `no-gradient` / `semantic-color-only` markers right where they apply, not in a wall-of-rules at the end. The bilingual summary table at the end is now a navigation lookup, not the primary prose location.
  - ✅ **Single SSOT for rules**: `principles/check-sync.ts` keeps reading `DESIGN.md`. No validator changes beyond `check-components-in-doc.ts`.
  - ⚠️ **`DESIGN.md` grew from 276 → 860 lines**. Acceptable trade for "one comprehensive file" — refero.design's Extended is similar size. The Compact remains brief (110 lines) for fast onboarding.
  - ⚠️ **`design-system.meta.json.docs` field renamed**: `{rulesSsot, compact, extended}` → `{spec, compact}`. No external consumers of these field names yet, so no migration burden.
- **Related rule-id(s)**: all 16 (markers relocated to inline-by-topic positions; bilingual prose moved to summary table)
- **Related ADR(s)**: ADR-010 (DTCG-only consumption) — Consumers + drift-gate path updated to reflect the new file set.
- **Supersedes**: `2026-05-design-md-triprojection` decision below (the three-projection design that v0.2.0-alpha.1 shipped).

---

<!-- decision-id: 2026-06-token-pipeline-automation -->
## Token pipeline automation — four-tier drift gate + husky + v0.2.0 bump (GHA deferred)

- **Date**: 2026-05-31
- **Decision**: Lock the YAMI token pipeline behind a four-tier drift gate (`check:principles-sync` + `check:tokens-in-docs` + `check:components-in-doc` + `check:tokens-flat-sync`), wire it to local husky pre-commit, and formalize "DTCG is the only token SSOT" + "components consume only semantic aliases" as policy (ADR-010). Bump `package.json` to `0.2.0-alpha.1`. **Remote GitHub Actions workflow was added at merge time then removed** — the account's Actions billing was not configured and jobs were rejected before runner start. Re-introduce `.github/workflows/check.yml` when billing is sorted; the workflow YAML is small and well-documented in ADR-010.
- **Context**: Token chain audit (2026-05-31) found 4 silent gaps: (1) `tools-tokens check` existed but had no caller; (2) `tokens.css` was hand-curated despite a header claiming auto-gen; (3) `styles/base.css` had hand-written legacy aliases and one hardcoded `font-size: 13px`; (4) `ProductCard.module.css` referenced `--color-amber-500` primitive directly. All 4 are corrected in v0.2.0; the drift gate now catches regression.
- **Trade-offs**:
  - ✅ **DTCG-only is enforced, not aspired.** AI generators inventing fake tokens fail `check:tokens-flat-sync` at commit time.
  - ✅ **Historical local token additions were superseded by Figma-first import.** ProductCard keeps a scoped primitive rating-star exception; code/.mono and h1 bold remain local element baselines in `styles/base.css`, not Figma tokens.
  - ✅ **Drift gate covers tokens.flat.json + tokens.ts + tokens.css `:root` + `@media` full value parity** (v0.3.0). `check:tokens-flat-sync` now compares CSS-authored values directly via the new `cssDeclarations` resolver layer (which preserves `rgba()` colors, `var(--primitive)` semantic alias literals, quoted font-family entries). `check:tokens-md` is the 5th tier, covering DTCG ↔ `tokens.md` drift.
  - ✅ **Scope restored in v0.3.0.** The resolver+emit refactor originally deferred for v0.2.0 landed: `resolveTokensFull` + `emitTokensCss` preserve `rgba()` colors, single-quoted font-family entries, `var(--primitive)` alias chains, `@font-face` prepend, `@media` overrides, and `base.css` concat. Oracle test asserts byte-level equivalence with the committed `tokens.css`.
  - ✅ **Manual splice eliminated via `--commit` mode** (v0.3.0). `pnpm build:tokens` runs `tools-tokens build --ds yami --commit && ds:sync yami`, regenerating tokens.css + tokens.flat.json + tokens.ts + tokens.md directly under `<ds>/`. Default (no flag) still writes a bare `:root` to `<ds>/generated/` for inspection. Runbook in `README.md ## Changing tokens`.
  - ⚠️ **`styles/base.css` legacy aliases deferred**, not removed. v0.2.0 marks `--font-brand` / `--font-cn-ios` / `--font-cn-android` / `--font-mono` with `@deprecated` comments + v0.3.0 removal target. Existing apps still compile; new code should reach for `--font-family-*` DTCG aliases directly.
- **Related rule-id(s)**: `red-usage`, `semantic-color-only`, `token-exists`, `no-decorative-media`
- **Related ADR(s)**: ADR-010 (DTCG-only token consumption — the policy this decision implements)
- **Files added/changed (v0.2.0)**:
  - **Superseded local tokens**: the Figma-first token import removed the previous local-only rating-star, code, and bold token projections from the active token set.
  - **Refactored**: `components/ProductCard/ProductCard.module.css` + `meta.json` keep the scoped rating-star primitive exception; `styles/base.css` owns code/.mono and h1 bold as local element baselines.
  - **New CI**: `packages/tools-tokens/src/cli.ts` `check` extended to verify all 3 artifacts; `design-systems/yami/package.json` adds `check:tokens-flat-sync` to validate chain.
  - **New infra**: `.husky/pre-commit` (runs `pnpm check:yami`); root `package.json` adds `husky` devDep + `prepare` script. *(`.github/workflows/check.yml` was added in commit 0750b47 then removed post-merge — see Decision context above.)*
  - **Docs**: `README.md` adds `## Changing tokens` runbook; `decisions.md` adds this entry; `docs/decisions/ADR-010-dtcg-only-token-consumption.md` adds the policy ADR.

---

<!-- decision-id: 2026-05-design-md-triprojection -->
## DESIGN.md tri-projection (Compact / Extended / Rules-SSOT) + token-reality CI

- **Date**: 2026-05-31
- **Decision**: Ship YAMI design spec as three projections of the same brand: a 30-second `DESIGN.compact.md` (audience: human designer), a 750-line `DESIGN.extended.md` (audience: AI agent / engineer), and the existing `DESIGN.md` (audience: CI validator / `validate_design` runner). Wire three checks under `pnpm validate`: `check:principles-sync` (long-cited but previously unimplemented), `check:tokens-in-docs` (new), `check:components-in-doc` (new).
- **Context**: Inspired by refero.design's two-tab Compact/Extended pattern and Google Stitch's YAML-frontmatter + Markdown-body model. Existing `DESIGN.md` is a rules SSOT linked to `principles/principles.ts` + `validators/*.ts` via a three-way CI consistency check — but that check (`check:principles-sync`) was *cited* in `DESIGN.md` text and never actually existed as a runnable script. Meanwhile, AI agents fabricating plausible-but-fake tokens (e.g. `--font-size-heading-lg` in a scale that only has `-md` / `-xl`) was a recurring silent failure mode.
- **Trade-offs**:
  - ✅ Audience-targeted reads: designers no longer scroll through 750 lines of token tables; AI agents get a single canonical entry (SKILL.md) that points them to the right surface; CI gets a single rule SSOT untouched by presentation churn.
  - ✅ Token-reality CI is now real, fail-fast, and catches the AI fabrication failure mode at PR time instead of in production.
  - ✅ The three checks under `pnpm validate` are now first-class entry points (`pnpm check:yami` from root delegates).
  - ⚠️ Documentation footprint roughly tripled (3 files instead of 1). Maintenance discipline required: when rules change, update DESIGN.md first, then Compact/Extended; never the reverse. Captured in CHANGELOG `## Documentation` section and SKILL.md.
  - ⚠️ Some rules-as-prose (notably `no-custom-radii`) needed wording sharpening — old text "No `16px`" conflicted with the existence of `--radius-xl: 16px` as a primitive. Resolved by clarifying that primitives exist as DTCG building blocks but components must reach for the 5 semantic slots.
- **Related rule-id(s)**: `token-exists` (now enforced on docs too via `check:tokens-in-docs`), `no-custom-radii` (wording sharpened)
- **Related ADR(s)**: n/a (extension of catalog-as-contract / ADR-008 — DS still ships as a standalone package; docs are part of the catalog surface)
- **Files added/changed**:
  - New: `DESIGN.compact.md`, `DESIGN.extended.md`, `SKILL.md`, `principles/check-sync.ts`, `principles/check-tokens-in-docs.ts`, `principles/check-components-in-doc.ts`
  - Modified: `DESIGN.md` (`--strike` bug fix + author-syntax section + frontmatter), `README.md` (three-projection reader guide), `package.json` (scripts), root `package.json` (`check:yami`), `design-system.meta.json` (`skill.entryDoc`, `docs.*`), `CHANGELOG.md`

---

## Future entries

New decisions are appended below. Each gets a unique `decision-id` and timestamped block. Do not edit historical decisions — if a decision is superseded, add a new entry referencing the old one and mark the old one with `SUPERSEDED BY <new-id>`.

---

<!-- decision-id: 2026-04-mcp-cwd-unsupported -->
## Claude Code's `.mcp.json` stdio spawn does not honor `cwd` field

- **Date**: 2026-04-21
- **Decision**: For stdio MCP servers in `.mcp.json`, never rely on the `cwd` field to anchor relative `args`. Always make paths in `args` resolve from the project root (the workspace directory Claude Code is opened in) — either as absolute paths or as relative paths from that root.
- **Context**: While integrating the external `figcraft` MCP server (for Figma token sync), the initial config used `cwd` to pin resolution:
  ```json
  "figcraft": {
    "command": "node",
    "args": ["dist/mcp-server/index.js"],
    "cwd": "/Users/divikwu/diw/workspace/projects/figcraft"
  }
  ```
  `claude mcp list` reported `✗ Failed to connect`, but running the exact command line manually (same cwd, same args, same env) succeeded — the server started, spawned a relay on :3055, joined channel `design-2`, and emitted `[FigCraft mcp] MCP server running (stdio)`. Root cause: Claude Code's stdio spawn ignores the `cwd` field. With `args` left as a relative path and no cwd applied, node couldn't find `dist/mcp-server/index.js` under the yami-design-system root.

  Fix that works:
  ```json
  "figcraft": {
    "type": "stdio",
    "command": "node",
    "args": ["../figcraft/dist/mcp-server/index.js"],
    "env": { "FIGCRAFT_CHANNEL": "design-2" }
  }
  ```
  Relative path now resolves from the project root (yami-design-system → ../figcraft/...), `cwd` field omitted entirely, `env` field honored as expected.
- **Trade-offs**:
  - ✅ Portable across team members as long as figcraft is cloned as a sibling directory of yami-design-system (matches the monorepo conventions of our workspace layout).
  - ⚠️ The `cwd`-doesn't-work behavior is undocumented by Claude Code; future versions may add support. Check `claude mcp list` output each time before assuming failure is elsewhere.
  - ⚠️ MCP protocol diagnostics are weak — `claude mcp list` only returns `✓ Connected` / `✗ Failed to connect` without stderr pass-through. Always cross-verify with a manual `node <path>` spawn to isolate "Claude Code config problem" vs "MCP server itself broken."
- **Related ADR(s)**: ADR-0005 (figcraft external integration — this is the operational footnote to that decision).
- **Related CHANGELOG**: root `CHANGELOG.md` v0.2.1 (figcraft integration).
