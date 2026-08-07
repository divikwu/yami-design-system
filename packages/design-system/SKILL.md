---
name: yami-design-system
version: 0.5.0-alpha.1
updated: 2026-07-22
audience: ai-agent
purpose: Entry point for AI agents producing UI under the YAMI brand.
---

# Yami Design System — AI Skill Manifest

This file tells an AI agent (Claude Code, Cursor, OpenAI Codex, etc.) **how to use YAMI to produce production-grade UI** without violating brand or system rules. It is the canonical entry point — read this first, then follow its links.

---

## When to use this skill

Trigger this skill when the user asks to:

- Generate any UI artifact (page, component, mockup HTML, JSX) "for YAMI", "in the YAMI style", "for 亚米", or "for the Asian grocery brand".
- Implement a specific YAMI page: product list (PLP), product detail (PDP), cart, hero / promo banner, account, search results, etc.
- Build or update a single component matching the YAMI catalog (Button, Card, Badge, Input, Checkbox, RadioGroup, Divider, AspectRatio, ProductCard, ProductList, HeroBanner, Tabs).
- Validate that an existing artifact conforms to YAMI rules.

Do **not** trigger when the request is for a different brand, a system-agnostic prototype, or content authoring that doesn't produce UI.

---

## First read — brand context (≤ 30 seconds)

Open [`DESIGN.compact.md`](./DESIGN.compact.md) (~120 lines).

It tells you in one screen:
- The two reds (`#FF0000` brand vs `#E00000` operational), what each is allowed on.
- The 5 radius slots, the 8px spacing grid.
- The font story (GT Walsheim for numerals, PingFang SC for CN body).
- The 10 components and what they do.
- The 16 hard rules as one-liners.

Stop after this if the user just wants a description or onboarding answer.

---

## Implementation read — full spec + rules (when actually generating code)

Open [`DESIGN.md`](./DESIGN.md) (~860 lines). It is the **comprehensive spec + rules SSOT** in a single file (v0.2.0-alpha.2 consolidated the prior `DESIGN.extended.md` and rules-only `DESIGN.md` into one). It contains:

- **Full token tables** — colors, typography, spacing, radii, breakpoints, semantic aliases — every value tied to a real CSS variable from `tokens.css`.
- **Component anatomy** for all 10 components with `tokenBindings` summaries.
- **Rules inline by topic** — each `<!-- rule-id: X -->` marker sits in the section it governs (Colors / Typography / Spacing / Components / Imagery). Plus a **bilingual Hard Rules summary table** at the end for navigation.
- **Page Recipes** — 3 recipes (PLP / PDP / cart) under [`pages/recipes/`](./pages/recipes/) — **consult these first when generating a page**.
- **Visual Previews** — `preview/*.html` reference cards.
- **Agent Prompt Guide** — quick color reference + 5 ready-to-paste component prompts (Hero / ProductCard / Promo banner / Form field / Modal).
- **Known AI Failure Gallery** — 5 documented cases of AI generators repeatedly producing bad output, with the canonical fix.
- **Anti-patterns table** — bilingual list of refuse-on-sight code patterns (e.g. `opacity` for disabled, `box-shadow` on hover, 🛒 emoji on Add-to-Cart, fabricated tokens).
- **Quick Start** — copy-paste `:root {}` CSS Custom Properties + Tailwind v4 `@theme {}` blocks.

---

## Hard rules (the 16 that fail CI)

Rule markers live inline in `DESIGN.md` topic sections; full bilingual prose is in the Hard Rules summary table. Each `<!-- rule-id: X -->` marker is wired to [`principles/principles.ts`](./principles/principles.ts) and an AST validator at `principles/validators/X.ts`. The rule names alone:

`red-usage`, `no-gradient`, `semantic-color-only`, `numerals-font`, `type-hierarchy`, `no-custom-radii`, `elevation-on-press`, `no-opacity-disabled`, `focus-style`, `border-strength`, `emphasis-limit`, `card-no-border`, `tap-target`, `no-emoji`, `no-decorative-media`, `token-exists`.

**Three rules cause most AI failures**:
- `emphasis-limit` — 1 emphasis Button per screen. Output 2 → instant fail.
- `no-opacity-disabled` — disabled buttons use `--button-disabled` + `--text-disabled`. Never CSS `opacity`.
- `token-exists` — fabricating size tokens (e.g. a `heading-lg` size that doesn't exist — only `-md` / `-xl` / `-2xl` do). CI's `check:tokens-in-docs` catches docs; `check:design` (Phase 6.5) catches code.

---

## Components catalog

Twelve components ship as source-owned bundles under [`components/`](./components/): `.tsx` + `.module.css` + `meta.json` + `usage.md` + `examples.tsx` + `index.ts`; Figma-backed components also include `.figma.tsx` Code Connect mappings.

| Name | Category | When to use |
|---|---|---|
| [`Button`](./components/Button/meta.json) | action | Any CTA. **Emphasis variant = 1 per screen.** |
| [`Card`](./components/Card/meta.json) | layout | Surface primitive. No border by default. |
| [`Badge`](./components/Badge/meta.json) | display | Status / promo labels. Sole place blue / green / purple / yellow are allowed. |
| [`Input`](./components/Input/meta.json) | form | Text input. 2px black focus ring, never blue. |
| [`Checkbox`](./components/Checkbox/meta.json) | form | Independent or multi-select choice. Neutral selected state. |
| [`RadioGroup`](./components/RadioGroup/meta.json) | form | Exclusive selection with arrow-key navigation. |
| [`Divider`](./components/Divider/meta.json) | layout | 3 strengths only (default / subtle / emphasis). |
| [`AspectRatio`](./components/AspectRatio/meta.json) | layout | Style-neutral ratio constraint for responsive media. |
| [`ProductCard`](./components/ProductCard/meta.json) | composite | Canonical product tile. Composes Card + AspectRatio + Badge + ProductCardAddButton. |
| [`ProductList`](./components/ProductList/meta.json) | composite | Responsive product collection with rail and waterfall layouts. |
| [`HeroBanner`](./components/HeroBanner/meta.json) | composite | Responsive homepage campaign rail shared by PC and Mobile. |
| [`Tabs`](./components/Tabs/meta.json) | navigation | Compound tab navigation. Triggers must sit inside `TabsList`. |

Each `meta.json` declares props, variants, `tokenBindings` (which property of which selector reads which token), rules consumed, and a11y profile.

## Storybook + registry consumption contract

For AI prototype generation, Storybook is the maintained visual source of truth
and the local registry is the shadcn-compatible distribution contract.

- First consume the injected `Storybook Catalog Source of Truth` section. Its
  titles and canonical exports tell you which YAMI assets/components are
  actively maintained for generation.
- Then consume [`registry.json`](./registry.json) and
  [`registry-items/`](./registry-items/) for installable item names, file
  targets, dependencies, and the design-system base package.
- Only claim catalog-backed output for components that have both a catalog
  contract and a maintained Storybook story. Components documented in
  `DESIGN.md` but not yet listed in Storybook are available as design guidance,
  not as primary recipe targets.
- Activation checks require used catalog components to be backed by a local
  registry item that includes their Storybook `Showcase`; otherwise the output
  remains a draft with `registry_story_missing:<Component>`.
- Prefer `renderRecipeArtifact` for catalog-backed delivery. Free-form HTML is
  reference-only and must say why it is not componentized.

---

## Validate your output

After generating, run from the Yami Design System repository root:

```bash
pnpm check:generated && pnpm check:boundaries && pnpm test
```

These commands verify generated tokens and catalog data, package boundaries, and
the migrated component test suite. Principle validators remain available from
[`principles/index.ts`](./principles/index.ts) without a Design Labs runtime.

---

## Isolation

`packages/design-system/` is a workspace source package consumed by Canvas,
Storybook, and prototypes. It must remain independent from application runtimes:

- Do not import Next.js, Motion, Zod, Design Labs, or Astryx runtime modules.
- Do not copy token values into an application-specific stylesheet.
- Keep `tokens/**/*.tokens.json` as the token source of truth.

Canvas and Storybook consume the package through its public exports; prototypes
own page composition and serializable direction resolution.

---

## Quick start for code generation

When the user asks for a YAMI page or component:

1. **Match request to a recipe.** If the request is "PLP / PDP / cart" → use [`pages/recipes/<slug>.recipe.ts`](./pages/recipes/) as the slot manifest, [`pages/templates/web/<Title>.tsx`](./pages/templates/web/) as the structural reference.
2. **Match component-level requests to the catalog.** "Add a button / badge / card" → wrap [`components/<Name>/meta.json`](./components/) `props`. Never re-declare `tokenBindings`; the component already encodes them.
3. **Reach for semantic aliases, not raw tokens.** Use `--text-emphasis` (not `--color-red-500`), `--button-primary` (not `--color-black-900`). Component-side aliasing is in `tokens.css` under `/* Semantic Aliases */`.
4. **Copy the Quick Start CSS / Tailwind v4 block** from [`DESIGN.md → Quick Start`](./DESIGN.md) into a fresh project if you need a standalone consumption surface.
5. **Refuse the Anti-patterns** in [`DESIGN.md → Anti-patterns AI agents repeatedly produce`](./DESIGN.md). When in doubt: refuse and explain.
6. **Final step:** run `pnpm validate`. Output must be four green ✓ lines before declaring done.

---

## Cross-references

| Document | Role |
|---|---|
| [`README.md`](./README.md) | Package overview, dir inventory, voice quick-reference |
| [`DESIGN.md`](./DESIGN.md) | Comprehensive spec + rules SSOT (AI / engineer / CI validator) |
| [`DESIGN.compact.md`](./DESIGN.compact.md) | 30-second brand entry (designer / PM / stakeholder) |
| [`decisions.md`](./decisions.md) | "Why" behind every rule / decision |
| [`CHANGELOG.md`](./CHANGELOG.md) | Version history (tokens / components / documentation) |
| [`content/`](./content/) | Voice, bilingual rules, copy patterns |
| [`motion/`](./motion/) | Motion patterns / durations / easings |
| [`tokens.css`](./tokens.css) | Auto-generated CSS Custom Properties (source: `tokens/*.tokens.json` DTCG JSON) |
| [`principles/`](./principles/) | AST validators + sync checks |
| [`pages/recipes/`](./pages/recipes/) | Slot-based page compositions |
| [`pages/templates/`](./pages/templates/) | Reference page implementations |
| [`preview/`](./preview/) | HTML spec cards per component |
| [`ui_kits/`](./ui_kits/) | JSX prototypes (web + app) |
