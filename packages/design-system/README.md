---
name: '@yami/design-system'
displayName: YAMI
version: 0.5.0-alpha.1
figma: 6oOAy72DBff4P6NzJYc2hi
skill: yami-design-system
license: ./fonts/LICENSE.txt
---

# YAMI

The design system package for **YAMI 亚米** — a Chinese-American Asian grocery e-commerce brand serving U.S. customers. Products cover Mobile (iOS/Android) and Web storefronts.

**Primary signal**: pure red + bold high-contrast type on clean neutral surfaces, with GT Walsheim Latin type paired with PingFang SC / Noto Sans SC for CJK. Light and Dark themes are both supported.

中文简介：YAMI 亚米设计体系服务于面向美国用户的华人亚洲食品电商品牌，覆盖移动端（iOS/Android）与 Web 商城体验。

中文视觉信号：以纯红与粗黑文字建立品牌识别，在干净白色画布上组织商品、价格、促销和双语内容；拉丁文字使用 GT Walsheim，中文搭配 PingFang SC / Noto Sans SC。

## Brand identity

- **Name**: YAMI / 亚米 — reads as "yummy" and "rice (米)". Marketing often pairs both in the wordmark
- **Product**: E-commerce (Asian groceries, snacks, beauty, home). Heavy use of product cards, prices, strike-through originals, coupons, loyalty rewards
- **Platforms**: iOS, Android, Web (PC + mobile web). Mobile is the primary surface
- **Visual identity**: Two reds — brand red `#FF0000` (`--color-brand-red`, Logo only) and operational red (`--color-red-*`, CTA / promo / error). Light uses black-on-white content chrome; Dark uses light text on neutral-950/900 surfaces. No heavy shadows or decorative flourishes

## What's in this package

| Dir / File | Purpose |
|---|---|
| `DESIGN.md` | Comprehensive spec + rules SSOT (AI / engineer / CI validator) — full token tables, component anatomy, `<!-- rule-id -->` markers inline by topic, Agent Prompt Guide, Quick Start CSS |
| `DESIGN.compact.md` | 30-second brand entry point (designers / PMs / stakeholders) |
| `decisions.md` | Decision history (why) |
| `tokens.json` | Unified token contract generated from DTCG source; downstream artifacts derive from this file |
| `tokens.css` | All CSS custom properties, including `.dark` semantic overrides (import in every artifact) |
| `tokens/` | DTCG JSON source |
| `fonts/` | GT Walsheim Regular / Medium / Bold (woff2) |
| `assets/icons/` | 22 line SVG icons |
| `assets/logos/` | YAMI wordmark placeholders |
| `content/` | Brand writing standards |
| `motion/` | Motion/animation spec |
| `components/` | React components with 6-part metadata |
| `pages/templates/` | Reference page implementations |
| `pages/recipes/` | Slot-based compositions for AI to consume |
| `principles/` | Rule validators (AST checkers) |
| `preview/` | HTML specification cards |
| `ui_kits/` | JSX prototypes (app + web) |

## How to read this DS

YAMI's design spec ships in **two physical files** — one comprehensive spec for AI agents + CI validators, one brief for designers / stakeholders. Pick by role:

| If you are… | Read | Why |
|---|---|---|
| **Designer / PM / stakeholder** | [`DESIGN.compact.md`](./DESIGN.compact.md) (~110 lines) | Brand essence in 30 seconds: 5-color anchor, type hierarchy, 5 radii, component list, hard rules one-liner. CN+EN bilingual intro. |
| **AI agent, engineer implementing UI, or CI validator** | [`DESIGN.md`](./DESIGN.md) (~860 lines) | Full token tables, semantic alias map, component anatomy, **rule markers inline by topic** (validator-linked), Agent Prompt Guide, Known AI Failure Gallery, Quick Start CSS + Tailwind blocks. |

Four CI checks run on every change (via husky pre-commit; remote CI deferred — see [ADR-010](../../docs/decisions/ADR-010-dtcg-only-token-consumption.md)):

- `check:principles-sync` — DESIGN.md `<!-- rule-id -->` markers ↔ principles.ts ↔ validators/ three-way consistency
- `check:tokens-in-docs` — every `var(--x)` in any DESIGN doc must exist in `tokens.css`
- `check:components-in-doc` — DESIGN.md Components section ↔ `components/<Name>/meta.json` two-way consistency
- `check:tokens-flat-sync` — DTCG (`tokens/*.tokens.json`) ↔ `tokens.json` ↔ `tokens.flat.json` + `tokens.ts` + `tokens.css :root + @media` full value parity
- `check:tokens-md` — `tokens.json` ↔ `tokens.md` (sync-design-system.mjs `--check`)

## Changing tokens

The **only** sanctioned upstream source of truth for token values is the DTCG JSON tree under `tokens/`. Light semantic aliases live in `tokens/semantic/colors.tokens.json`; Dark overrides live in `tokens/themes/dark.tokens.json`. `tokens.json` is the generated unified middle contract; never hand-edit `tokens.json` / `tokens.css` / `tokens.ts` / `tokens.flat.json` / `tokens.md` for value changes — they're regenerated artifacts.

**Workflow** (v0.3.0 onward — one command regenerates all four artifacts):

```bash
# 1. Edit the DTCG JSON (primitives / semantic / typography)
$EDITOR packages/design-system/tokens/primitives/colors.tokens.json

# 2. Regenerate tokens, catalog, registry and migration provenance.
pnpm generate

# 3. Verify
pnpm check:generated
pnpm check:boundaries

# 4. Visual regression: run Storybook interactions locally. Linux visual
#    baselines are compared in CI.
pnpm test:storybook

# 5. Commit source tokens and regenerated outputs together.
git add packages/design-system/tokens packages/design-system/generated
git commit
```

**Behind the scenes.** `tooling/tokens/build.mjs` reads only the DTCG tree and
emits deterministic JSON, CSS, TypeScript, flat JSON, Markdown and digest files
under `packages/design-system/generated/`.

Adding a new token = minor version bump (`0.x.0`); renaming / removing = major bump (`x.0.0`). See [ADR-010](../../docs/decisions/ADR-010-dtcg-only-token-consumption.md) for the semver policy.

## Voice quick-reference

- **Direct, action-oriented, commerce-native**. CTAs are verbs first: 立即购买 / Buy Now, 加入购物车 / Add to Cart
- **Bilingual parity**. Chinese and English say the same thing; neither is a "secondary translation". Labels often paired: "Coupon · 优惠券"
- **Spec-led**. Writing rules mandate "必须 / 不得 / 可以" — avoid soft words like "尽量" or "建议"
- **Low cuteness, zero emoji** in the product UI
- **Title Case** for English headings and CTAs

Full voice / bilingual / casing / copy patterns specs in `content/`.

## Visual foundations (condensed)

Full specs in `design.md` (with rule-ids).

- **Color**: red + white + black, zero decorative color. Red only for brand / emphasis CTAs / promo (see `design.md#red-usage`)
- **Type**: GT Walsheim display/heading/body, PingFang SC for CJK. Max 4 type levels per page
- **Spacing**: 8pt grid (`--space-100` = 8px)
- **Radii**: 12px cards, 8px full-form buttons/components, 9999 pill for inline buttons, 4px tags. Never custom
- **Depth**: no local elevation scale; hover/press changes color, not shadow
- **Borders**: 8% default, 87% focus (black, not blue), 100% red attention
- **Motion**: 150-200ms state changes, 300ms page transitions, `cubic-bezier(0.2, 0, 0, 1)`. No bounces, no parallax

## What this brand is NOT

- ❌ Glassmorphism / heavy blur
- ❌ Rounded-corner + colored-left-border "alert" cards
- ❌ Emoji-driven UI (emoji appear only in authoring docs as ✅ ❌ markers)
- ❌ Soft pastel palettes
- ❌ Serif display fonts / quirky scripts

## Iconography quick-reference

- 24pt baseline, 1.5px stroke, round joins, no caps
- Line icons default; **filled** variants reserved for selected/active states (typically bottom tab bar)
- Icons inherit `--text-primary` unless explicitly themed
- Tap target: iOS 44×44, Android 48×48 regardless of visible size

Full rules in `design.md` (rule-ids: `tap-target`, `icon-line-vs-filled`).

## For AI consumers

See `SKILL.md` (Claude Design / Claude Code) and `../../../AGENTS.md` (repo root).

## License

Proprietary to YAMI. GT Walsheim commercial license in `fonts/LICENSE.txt`.
