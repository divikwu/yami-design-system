---
version: 0.5.0-alpha.1
updated: 2026-09-02
audience: ai-agent
roles: [spec, rules-ssot]
name: YAMI
category: e-commerce
surface: web
mode: light-dark
voice: bilingual-cn-en
brand:
  anchor_red: "#FF0000" # Logo only
  operational_red: "#E00000" # CTA / promo / error
  ink: "rgba(0,0,0,0.87)"
  canvas: "#FFFFFF"
  cream_wash: "#FBF1EF"
typography:
  brand: "GT Walsheim"
  cn_ios: "PingFang SC"
  cn_android: "Noto Sans SC"
  serif_en: "Source Serif 4 Variable"
  serif_cn: "Noto Serif SC"
  weights: [400, 500, 600] # normal 400; emphasis EN 500 / CN 600; serif 600 preserved
status:
  success: "#27812B" # emerald-700 — WCAG-AA on white
  warning: "#9E4303" # amber-700  — WCAG-AA on white
  info: "#0066EB" # blue-600
  error: "#E00000" # red-500
spacing:
  base: 8
  scale: [2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80]
radii:
  tag: 4
  component: 8
  emphasis_button: 8
  surface: 12
  pill: 9999
rules_source: ./DESIGN.md
tokens_source: ./tokens.css
---

# YAMI — Style Reference

> YAMI should feel like a clean, product-first Asian grocery on a white canvas: dense enough for shopping, calm enough to scan. Red is reserved for operational emphasis — price, primary purchase CTA, promotion / urgency, and error states — while the rest of the interface relies on near-black type, neutral structure, and measured spacing.

**Surface:** web · **Category:** E-Commerce — Chinese-American Asian grocery, U.S. market · **Voice:** bilingual CN + EN, CN-primary · **Mode:** Light + Dark

In Light, YAMI's product surfaces sit on a pure white canvas (`#FFFFFF`) with near-black ink. In Dark, page and component surfaces use neutral-950/900 with light reading colors. The operational red ramp carries action, promotion, and error semantics in both themes; brand red (`#FF0000`) remains Logo-only. **No box-shadow growth on hover.** **No emoji in product UI.** Numerals — every price, every count, every SKU — always render in **GT Walsheim**; CJK body text is **PingFang SC** on iOS / web and **Noto Sans SC** on Android, with embedded digits and Latin characters staying in GT Walsheim. The rhythm is dense but never noisy: an 8px base grid, five semantic radius slots (`4 / 8 / 8 / 12 / 9999`) covering every container, and a hard cap of **one emphasis button per screen** keeping conversion priority unambiguous.

> **Two-file projection model**: this file (`DESIGN.md`) is the comprehensive spec + rules SSOT. For a 30-second brand entry (designers / PMs / stakeholders), read [`DESIGN.compact.md`](./DESIGN.compact.md) instead. Repository CI validates the migrated sources with `pnpm test`, `pnpm check:generated`, and `pnpm check:boundaries`.

---

## Tokens — Colors

<!-- rule-id: red-usage -->
<!-- rule-id: semantic-color-only -->

> **Rules governing this section** — `red-usage` (two reds, never mixed), `semantic-color-only` (non-red hues only in status + badge palette). Full bilingual prose: [Hard Rules summary](#hard-rules-validator-linked).

### Theme and surface polarity

- Light semantic aliases are defined in `tokens/semantic/colors.tokens.json` and emitted under `:root`.
- Dark semantic aliases are defined in `tokens/themes/dark.tokens.json` and emitted under `.dark`. Apply `.dark` to `html` or any subtree; primitives do not change.
- Theme and polarity are independent axes. `inverse` means “opposite surface polarity within the current Theme,” not “Dark mode.” Therefore Light × Inverse is typically a dark surface, while Dark × Inverse is typically a light surface.
- Components must not add a `dark` prop. They consume default semantic tokens automatically and expose `inverse` only when they support placement on the opposite-polarity surface.

### Brand anchors

| Name 名称                        | Value              | Token                                              | Role (EN)                                                                                                               | 用途（中文）                                                           |
| -------------------------------- | ------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Brand Red 品牌红                 | `#FF0000`          | `--color-brand-red`                                | **Logo only.** Brand mark, primary brand signals — never a button, never a badge, never decorative.                     | **仅用于 Logo**。品牌标识与品牌信号——不得用作按钮、徽章或装饰。        |
| Operational Red 操作红 (red.500) | `#E00000`          | `--color-red-500`                                  | The page's one permission-to-act color: emphasis CTA fill, promotion / urgency surfaces, error state, attention border. | 全站唯一的"允许操作"色：强调 CTA 填充、促销/限时、错误状态、警示边框。 |
| Ink 墨色 (black.900)             | `rgba(0,0,0,0.87)` | `--color-black-900`                                | All primary text, primary button fill, focus ring color.                                                                | 所有主要文字、主按钮填充、focus 描边色。                               |
| Canvas 画布                      | `#FFFFFF`          | `--color-white-1000`                               | Page background **and** card surface — separation comes from radius + spacing, not from a different fill.               | 页面背景**与**卡片表面——靠圆角和间距分层，不靠另一种填充。             |
| Cream Wash 奶油粉                | `#FBF1EF`          | `--color-red-50` _(aliased to `--brand-tertiary`)_ | Branded promotional background blocks.                                                                                  | 品牌促销背景块。                                                       |

### Red ramp (used by semantic aliases)

| Token             | Value     | Used by                                                                                                          |
| ----------------- | --------- | ---------------------------------------------------------------------------------------------------------------- |
| `--color-red-50`  | `#FBF1EF` | `--brand-tertiary`, `--fill-error-secondary`, `--fill-promotion-secondary`                                       |
| `--color-red-500` | `#E00000` | `--text-emphasis`, `--button-emphasis`, `--fill-error-primary`, `--fill-promotion-primary`, `--border-attention` |
| `--color-red-600` | `#C40009` | `--button-emphasis-active` (pressed state of CTAs)                                                               |
| `--color-red-700` | `#9B000D` | `--badge-fg-secondary-red`                                                                                       |

### Neutrals (50 → 950)

| Token                 | Value     | Common role                                                             |
| --------------------- | --------- | ----------------------------------------------------------------------- |
| `--color-neutral-50`  | `#FAFAFA` | `--fill-tertiary` — image placeholder, skeleton background              |
| `--color-neutral-100` | `#F5F5F5` | `--background-secondary`, `--surface-secondary`, tertiary neutral badge |
| `--color-neutral-200` | `#EBEBEB` | `--button-disabled`                                                     |
| `--color-neutral-300` | `#D4D4D4` | `--fill-disabled`                                                       |
| `--color-neutral-900` | `#222222` | `--brand-secondary`, `--surface-inverse`, `--fill-inverse`              |
| `--color-neutral-950` | `#0A0A0A` | reserved for darkest accents                                            |

### Black / White alpha (the chrome system)

| Token                | Value              | Role                                                                              |
| -------------------- | ------------------ | --------------------------------------------------------------------------------- |
| `--color-black-200`  | `rgba(0,0,0,0.08)` | `--border-default`, `--divider-default` — almost hairline                         |
| `--color-black-400`  | `rgba(0,0,0,0.29)` | `--text-disabled`, `--divider-subtle`                                             |
| `--color-black-600`  | `rgba(0,0,0,0.55)` | `--text-secondary`                                                                |
| `--color-black-700`  | `rgba(0,0,0,0.68)` | `--overlay-scrim` _(modal backdrop — the only gradient-adjacent surface allowed)_ |
| `--color-black-900`  | `rgba(0,0,0,0.87)` | `--text-primary`, `--border-focus`, `--divider-emphasis`, `--button-primary`      |
| `--color-black-1000` | `#000000`          | `--button-primary-active` (pressed state of dark button)                          |

### Status semantics (single-value anchors)

| Concept     | Token                                               | Value                             | Where used                                                                                    |
| ----------- | --------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------- |
| Success     | `--color-emerald-500` / `-600` / `-700`             | `#3DC24F` / `#33A33D` / `#27812B` | `--fill-success-primary` (.500) / `--badge-bg-primary-green` (.600) / `--text-success` (.700) |
| Warning     | `--color-yellow-500` / `--color-amber-600` / `-700` | `#FABD05` / `#D26204` / `#9E4303` | `--fill-warning-primary` / `--badge-bg-primary-yellow` (.600) / secondary foreground (.700)   |
| Info        | `--color-blue-500` / `-600`                         | `#3383FF` / `#0066EB`             | `--text-info`, `--fill-info-primary` / `--badge-bg-primary-blue`                              |
| Highlight   | `--color-yellow-500`                                | `#FABD05`                         | `--fill-highlight` — marketing recommendation banner                                          |
| Rating star | `--text-emphasis`                                   | `#E00000`                         | ProductCard rating star follows the current Figma desktop component.                          |

### Badge palette (6 colors — the only place non-red hues are allowed outside neutrals)

| Color   | Primary BG token                                  | Secondary BG token                        | Foreground (on secondary)                 |
| ------- | ------------------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| Red     | `--badge-bg-primary-red` (`#E00000`)              | `--badge-bg-secondary-red` (`#FBF1EF`)    | `--badge-fg-secondary-red` (`#9B000D`)    |
| Blue    | `--badge-bg-primary-blue` (`#0066EB`)             | `--badge-bg-secondary-blue` (`#F0F3FA`)   | `--badge-fg-secondary-blue` (`#005CC2`)   |
| Green   | `--badge-bg-primary-green` (`#33A33D`)            | `--badge-bg-secondary-green` (`#ECF9F0`)  | `--badge-fg-secondary-green` (`#27812B`)  |
| Purple  | `--badge-bg-primary-purple` (`#6C30F7`)           | `--badge-bg-secondary-purple` (`#F7F0FF`) | `--badge-fg-secondary-purple` (`#531EE3`) |
| Yellow  | `--badge-bg-primary-yellow` (`#D26204`)           | `--badge-bg-secondary-yellow` (`#FEF7E6`) | `--badge-fg-secondary-yellow` (`#9E4303`) |
| Neutral | `--badge-bg-primary-neutral` (`rgba(0,0,0,0.87)`) | `--badge-bg-tertiary-neutral` (`#F5F5F5`) | `--badge-fg-default` (`rgba(0,0,0,0.87)`) |

---

## Tokens — Typography

<!-- rule-id: numerals-font -->
<!-- rule-id: type-hierarchy -->

> **Rules governing this section** — `numerals-font` (all digits in GT Walsheim, even inside CN strings), `type-hierarchy` (max 4 type levels per page). Full bilingual prose: [Hard Rules summary](#hard-rules-validator-linked).

### Families

| Token                   | Value                          | Use                                                                    |
| ----------------------- | ------------------------------ | ---------------------------------------------------------------------- |
| `--font-family-ios`     | `GT Walsheim` + `Noto Sans SC` | Brand Latin, numerals, prices, and CN fallback for iOS / web surfaces. |
| `--font-family-android` | `GT Walsheim` + `Noto Sans SC` | Android typography stack from Figma.                                   |
| `--font-family-win`     | `GT Walsheim` + `Noto Sans SC` | Windows typography stack from Figma.                                   |
| `--font-family-serif`   | `Source Serif 4 Variable` + `Noto Serif SC` | Approved editorial display and heading variants only; Latin uses optical sizing; never body or functional text. |

### Weights

| Token                     | Value | Use                                            |
| ------------------------- | ----- | ---------------------------------------------- |
| `--font-weight-normal`    | `400` | Body, captions, default reading.               |
| `--font-weight-emphasize` | EN `500` / CN `600` | Headings, prices, short titles, button labels; resolved from inherited `lang`. |
| `--font-weight-semibold` | `600` | Explicit serif heading weight; independent of language. |

Use `--font-weight-emphasize` for all ordinary emphasis, including `strong` and
`b`. The generated token CSS matches inherited `lang="zh"` (including `zh-CN`)
and `lang="en"` (including `en-US`) on both desktop and mobile. Nested language
changes reset the token. Callers must declare the content language; mixed-language
emphasized elements need their own `lang` and must consume the emphasis token.
Regular text stays 400. Shared sans section headings use 20px/400 by default on
mobile; the 16px option uses the language-aware emphasis weight. Explicit serif
titles retain their existing weight.

GT Walsheim Medium covers CSS weights 500–600 so Latin letters and numerals in a
Chinese emphasis run still render the approved Medium glyphs. A separately tagged
English run computes to 500; Chinese computes to 600. Do not use 700 for ordinary
emphasis, or replace the literal serif token with the language-aware token.

### Type Scale (Desktop = Desktop-LG; separate authored modes)

| Role        | Size    | Line height | Token (size)              | Notes                                                                                         |
| ----------- | ------- | ----------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| display-xl  | 32      | 40          | `--font-size-display-xl`  | Hero / first-screen marketing                                                                 |
| display-md  | 28      | 36          | `--font-size-display-md`  | `h1` baseline                                                                                 |
| display-sm  | 24      | 32          | `--font-size-display-sm`  | sub-hero                                                                                      |
| heading-4xl | 40      | 48          | `--font-size-heading-4xl` | Page main title                                                                               |
| heading-3xl | 32      | 40          | `--font-size-heading-3xl` | Page-level section title                                                                      |
| heading-2xl | 28      | 36          | `--font-size-heading-2xl` |                                                                                               |
| heading-xl  | 20      | 28          | `--font-size-heading-xl`  | `h2` baseline                                                                                 |
| heading-md  | 18      | 24          | `--font-size-heading-md`  | `h3` baseline                                                                                 |
| heading-sm  | 16      | 20          | `--font-size-heading-sm`  | `h4` baseline                                                                                 |
| heading-xs  | 14      | 20          | `--font-size-heading-xs`  | Compact heading / label emphasis                                                              |
| body-xl     | 16      | 20          | `--font-size-body-xl`     | Long-form reading, lg button label                                                            |
| body-md     | 14      | 20          | `--font-size-body-md`     | **Default body.** sm/md button label                                                          |
| caption-md  | 14      | 20          | `--font-size-caption-md`  | Rating row in ProductCard                                                                     |
| caption-sm  | 12      | 14          | `--font-size-caption-sm`  | ProductCard brand row, smallest legal text and helper labels                                  |
| link-xl     | 16      | 20          | `--font-size-link-xl`     | Large inline link / link button                                                               |
| link-md     | 14      | 20          | `--font-size-link-md`     | Inline link                                                                                   |
| link-sm     | 12      | 16          | `--font-size-link-sm`     | Compact link                                                                                  |
| price-md    | 24      | 32          | `--font-size-price-md`    | Primary price on PDP                                                                          |
| price-sm    | 18      | 24          | `--font-size-price-sm`    | Price in ProductCard                                                                          |
| strike-md   | 14      | 20          | `--font-size-strike-md`   | Original price (line-through)                                                                 |
| strike-sm   | 12      | 16          | `--font-size-strike-sm`   | Compact original price                                                                        |

`html, body` defaults: font-family `--font-family-ios`, color `--text-primary`, background `--background-primary`.

Desktop and Desktop-LG remain separate authored token modes, but every
`font-size` and `line-height` value is aligned between them. Components must not
swap typography roles in a `1440px` media query; when a component truly needs
another density, expose a semantic presentation variant or respond to its own
container instead of the global viewport.

### Letter spacing

| Token                     | Value  | Use                                                 |
| ------------------------- | ------ | --------------------------------------------------- |
| `--letter-spacing-normal` | `0`    | Default for body, captions, most headings.          |
| `--letter-spacing-tight`  | `-1px` | Large display sizes (`h1`-baseline uses `-0.01em`). |

---

## Tokens — Spacing & Layout

<!-- rule-id: no-custom-radii -->
<!-- rule-id: elevation-on-press -->
<!-- rule-id: no-opacity-disabled -->

> **Rules governing this section** — `no-custom-radii` (only the 5 semantic radius tokens; never raw `16px` or primitives like `--radius-xl`), `elevation-on-press` (hover/press changes color, never shadow), `no-opacity-disabled` (use `--button-disabled` + `--text-disabled`, never CSS `opacity`). Full bilingual prose: [Hard Rules summary](#hard-rules-validator-linked).

### Spacing scale (base 8px)

| Token          | Value  | Common use                                                             |
| -------------- | ------ | ---------------------------------------------------------------------- |
| `--space-0`    | `0`    | Edge-aligned layouts                                                   |
| `--space-025`  | `2px`  | Icon-to-text micro gap                                                 |
| `--space-050`  | `4px`  | Tight inline gap, sm badge padding-inline                              |
| `--space-100`  | `8px`  | Default tight padding, button label↔icon gap, md badge padding         |
| `--space-150`  | `12px` | Form item gap, sm button padding-inline                                |
| `--space-200`  | `16px` | **Default content padding**, md button padding-inline, Card padding md |
| `--space-250`  | `20px` | Comfortable section gap, lg button padding-inline                      |
| `--space-300`  | `24px` | Card / module internal layering, Card padding lg                       |
| `--space-400`  | `32px` | Module-level gutter                                                    |
| `--space-500`  | `40px` | Section separation                                                     |
| `--space-600`  | `48px` | Large container breathing room                                         |
| `--space-800`  | `64px` | Page-level major rhythm                                                |
| `--space-1000` | `80px` | First-screen / hero anchor                                             |

### Radii — **only these 5 slots**

| Token                        | Value    | Use                                                           |
| ---------------------------- | -------- | ------------------------------------------------------------- |
| `--radius-tag-primary`       | `4px`    | Badges, tags, status chips                                    |
| `--radius-component-default` | `8px`    | Inputs, selects, search bar                                   |
| `--radius-button-emphasis`   | `8px`    | Emphasis CTA (Buy Now / Submit) — square-ish for high gravity |
| `--radius-surface-default`   | `12px`   | Cards, modals, floating panels                                |
| `--radius-button-primary`    | `9999px` | Primary / secondary / tertiary pill buttons                   |

> **Hard rule:** the 5 semantic slots above are the **only** sanctioned consumption surface. Never raw values like `8.5px` / `16px` / `50%`, and **never** primitive tokens like `--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-xl` (they exist in tokens.css as building blocks for the semantic slots but components must reach for the semantic name).

### Depth — no local elevation scale

Figma currently does not provide a YAMI elevation token collection. Components must not invent local elevation CSS variables. Use color, spacing, radius, and optional `--border-default` hairlines for separation.

### Breakpoints

| Token                      | Value    | Note                                                                   |
| -------------------------- | -------- | ---------------------------------------------------------------------- |
| `--breakpoints-mobile`     | `402px`  | iPhone SE width baseline                                               |
| `--breakpoints-tablet`     | `768px`  | Reserved — no current `@media` emissions                               |
| `--breakpoints-desktop`    | `1024px` | **Layout overrides apply.** Page margins jump to 48px.                 |
| `--breakpoints-desktop-lg` | `1440px` | Desktop-LG layout mode; typography remains aligned with Desktop.      |
| `--breakpoints-desktop-xl` | `1920px` | Reserved                                                               |

Storybook validates mobile layouts at 360px (supported floor), 375px (primary
design target), and 402px (supplemental Figma target). These are verification
viewports, not CSS `min-width` constraints.

### Layout

| Token                          | Mobile | ≥ 1024px | Use                                  |
| ------------------------------ | ------ | -------- | ------------------------------------ |
| `--layout-page-margin-default` | `16px` | `48px`   | Default page side margin             |
| `--layout-page-margin-card`    | `8px`  | `48px`   | Card-heavy listing (PLP) side margin |

---

## Tokens — Semantic Aliases

<!-- rule-id: border-strength -->
<!-- rule-id: focus-style -->

> **Rules governing this section** — `border-strength` (3 strengths only: default 8% / focus 87% / attention red), `focus-style` (2px `--border-focus` outline at 2px offset; never blue). Full bilingual prose: [Hard Rules summary](#hard-rules-validator-linked).

The aliases below are the **only** identifiers a component should reference. If you find yourself reaching for a raw `--color-*-500` outside an alias definition, you're probably outside the system.

### Brand & text

| Alias                                              | → Raw token           | Use                                                        |
| -------------------------------------------------- | --------------------- | ---------------------------------------------------------- |
| `--brand-primary`                                  | `--color-brand-red`   | Brand mark, logo strokes. **No buttons.**                  |
| `--brand-secondary`                                | `--color-neutral-900` | Dark brand surfaces                                        |
| `--brand-tertiary`                                 | `--color-red-50`      | Cream-wash branded and promotional blocks                  |
| `--brand-inverse`                                  | `--color-white-1000`  | Brand mark on inverse-polarity surface (dark in Light)     |
| `--text-primary`                                   | `--color-black-900`   | Default reading text                                       |
| `--text-secondary`                                 | `--color-black-600`   | Captions, supporting copy                                  |
| `--text-disabled`                                  | `--color-black-400`   | Disabled labels — **never** opacity-faded text             |
| `--text-emphasis`                                  | `--color-red-500`     | Prices, urgency callouts, the single allowed red text role |
| `--text-success` / `-warning` / `-error` / `-info` | semantic ramps        | Status text only                                           |

### Surfaces

| Alias                    | →                     | Use                                                  |
| ------------------------ | --------------------- | ---------------------------------------------------- |
| `--background-primary`   | `--color-white-1000`  | Page canvas                                          |
| `--background-secondary` | `--color-neutral-100` | Sectional zone background                            |
| `--surface-primary`      | `--color-white-1000`  | Card, list, module                                   |
| `--surface-secondary`    | `--color-neutral-100` | Nested container surface, **interactive Card hover** |
| `--surface-inverse`      | `--color-neutral-900` | Dark card variant                                    |

### Fills

| Alias                                               | →                     | Use                                                                                               |
| --------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| `--fill-primary` / `-secondary` / `-tertiary`       | white → neutral-50    | Layered fill                                                                                      |
| `--fill-disabled`                                   | `--color-neutral-300` | Disabled control fill                                                                             |
| `--fill-skeleton`                                   | `--color-black-200`   | Loading placeholder shimmer base                                                                  |
| `--fill-success-primary`                            | `--color-emerald-500` | Success block                                                                                     |
| `--fill-error-primary` / `--fill-promotion-primary` | `--color-red-500`     | Error state / promo banner (note: **two semantic roles share one color** — context disambiguates) |
| `--fill-highlight`                                  | `--color-yellow-500`  | Marketing recommendation banner                                                                   |

### Borders & dividers — **3 strengths only**

| Role      | Token                                    | Value              | Use                                          |
| --------- | ---------------------------------------- | ------------------ | -------------------------------------------- |
| Default   | `--border-default` / `--divider-default` | `rgba(0,0,0,0.08)` | Hairline structure                           |
| Subtle    | `--divider-subtle`                       | `rgba(0,0,0,0.29)` | Decorative low-weight separation             |
| Focus     | `--border-focus`                         | `rgba(0,0,0,0.87)` | **2px focus ring, 2px offset — never blue.** |
| Attention | `--border-attention`                     | `--color-red-500`  | Error / risk border                          |
| Emphasis  | `--divider-emphasis`                     | `rgba(0,0,0,0.87)` | Major module separator                       |

### Buttons

| Alias                       | →                               | State                                                          |
| --------------------------- | ------------------------------- | -------------------------------------------------------------- |
| `--button-emphasis`         | `--color-red-500`               | Default — CTAs                                                 |
| `--button-emphasis-active`  | `--color-red-600`               | Hover / pressed                                                |
| `--text-on-emphasis`        | `--color-white-1000`            | Label / icon on operational-red CTAs                           |
| `--button-primary`          | `--color-black-900`             | Dark default button                                            |
| `--button-primary-active`   | `--color-black-1000`            | Hover / pressed                                                |
| `--button-secondary`        | `--color-black-100` (8% black)  | Soft secondary                                                 |
| `--button-secondary-active` | `--color-black-200` (17% black) | Hover / pressed                                                |
| `--button-tertiary`         | `--color-white-1000`            | Ghost / inline                                                 |
| `--button-tertiary-active`  | `--color-neutral-100`           | Hover / pressed                                                |
| `--button-disabled`         | `--color-neutral-200`           | Disabled bg — **paired with `--text-disabled`, never opacity** |

### Overlays

| Alias               | →                               | Use                                                                     |
| ------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| `--overlay-default` | `--color-black-300` (17% black) | Light dimming, non-blocking                                             |
| `--overlay-scrim`   | `--color-black-700` (68% black) | Modal backdrop — **the one and only allowed gradient-adjacent surface** |

---

## Components

<!-- rule-id: emphasis-limit -->
<!-- rule-id: card-no-border -->
<!-- rule-id: tap-target -->

> **Rules governing this section** — `emphasis-limit` (1 emphasis Button per screen), `card-no-border` (Cards default to no border), `tap-target` (iOS 44pt / Android 48dp minimum). Full bilingual prose: [Hard Rules summary](#hard-rules-validator-linked).

YAMI's current inventory is generated in [`generated/catalog.json`](./generated/catalog.json). Full anatomy, props, and `tokenBindings` live in each component's `meta.json` and `usage.md` under `components/<name>/`. Below is the canonical at-a-glance map.

### Button — `components/Button/`

|                |                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **Variants**   | `emphasis` · `primary` · `secondary` · `tertiary`                                                |
| **Sizes**      | `sm` (32) · `md` (40) · `lg` (48)                                                                |
| **States**     | default · hover · active · disabled · loading · focus-visible                                    |
| **Radius**     | `form=full` → `--radius-component-default` (8px) · `form=inline` → `--radius-button-primary` (pill) · `form=icon` keeps hierarchy-specific radius |
| **Typography** | `--font-family-ios` + `--font-weight-emphasize` (EN 500 / CN 600); sm/md `body-md`, lg `body-xl`; desktop (≥1024px) text-bearing lg uses `--font-size-button-lg-desktop` (18px), retaining 20px line-height. |
| **Tap target** | All sizes pad to ≥ 44pt internal hit area (rule `tap-target`)                                    |
| **Rate limit** | **`emphasis` = 1 per screen.** No exceptions. (rule `emphasis-limit`)                            |
| **Disabled**   | `--button-disabled` bg + `--text-disabled` fg. **Never `opacity`.** (rule `no-opacity-disabled`) |
| **Focus**      | 2px `--border-focus` outline, 2px offset. (rule `focus-style`)                                   |
| **Icon-only**  | Requires `aria-label`; dev-time console warning if missing.                                      |

### Tabs — `components/Tabs/`

|                         |                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------- |
| **Variants**            | `primary` · `secondary` · `tertiary`                                                                    |
| **Primary styles**      | `styleVariant="a"` underline tabs · `styleVariant="b"` segmented tabs                                   |
| **Surfaces**            | default · inverse                                                                                       |
| **States**              | active · inactive · disabled · focus-visible · skeleton                                                 |
| **Responsive behavior** | Filled Primary Style B and Tertiary selection surfaces are 32px below `1024px` and 36px from the shared Desktop breakpoint. Secondary keeps its underline treatment. |
| **Typography**          | Primary Style A uses `heading-md` on mobile and `body-xl` on WEB; compact tabs use `body-md`.           |
| **Tap target**          | Tertiary keeps a 48px trigger/hit target; its centered pill visual is 32px on Mobile/Tablet and 36px on Desktop. (rule `tap-target`) |
| **Focus**               | 2px `--border-focus` outline; inverse uses `--border-focus-inverse`.                                    |
| **ARIA**                | Compound `tablist` / `tab` / `tabpanel`; arrow keys, Home/End, controlled and uncontrolled state.       |

### Card — `components/Card/`

|                 |                                                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Padding**     | `none` · `sm` (12) · `md` (16) · `lg` (24)                                                                                                                         |
| **Surface**     | `primary` · `secondary` · `inverse`                                                                                                                                |
| **Border**      | **none by default** (rule `card-no-border`). `bordered={true}` only for dense listing grids.                                                                       |
| **Radius**      | `--radius-surface-default` (12px)                                                                                                                                  |
| **Interactive** | Auto-inferred when `as="button"` or `as="a" + href`. Hover changes `--surface-primary` → `--surface-secondary`. **Never adds shadow.** (rule `elevation-on-press`) |
| **Focus**       | Same 2px black ring at 2px offset                                                                                                                                  |

### Badge — `components/Badge/`

|                |                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------ |
| **Colors**     | `red` · `blue` · `green` · `purple` · `yellow` · `neutral` (6 only — rule `semantic-color-only`) |
| **Emphasis**   | `primary` (solid) · `secondary` (tinted)                                                         |
| **Size**       | One responsive size: Mobile/Tablet 20px height; PC 24px height (`min-width: 1024px`)             |
| **Red usage**  | `color="red"` is **promotion / urgency / sale only** (rule `red-usage`). Never decorative.       |
| **Radius**     | `--radius-tag-primary` (4px)                                                                     |
| **Typography** | `--font-family-ios` + weight 400; Mobile/Tablet `12/16`, PC `14/20`                              |
| **Constraint** | ProductCard renders **max 2** badges; extras truncate silently.                                  |

### Tag — `components/Tag/`

Static full-pill label for short descriptive keywords. Its three independent color axes are placement `context` (`content` or `overlay`), surface `mode` (`light` or `dark`), and container `variant` (`filled` or `outline`). M remains 28px on mobile and PC; L is 32px on mobile and 36px on PC, switching at 1024px. Optional leading artwork follows Search geometry: a 2px leading inset, 4px label gap, an image slot 4px smaller than the Tag, and artwork 8px smaller. Filled uses transparent black at 4% with dark text in light mode and transparent white at 8% with light text in dark mode. Outline remains transparent with an 8% black stroke in light mode or 8% white stroke in dark mode. Tag is display-only and never substitutes for an interactive FilterChip.

### Input — `components/Input/`

|              |                                                                              |
| ------------ | ---------------------------------------------------------------------------- |
| **States**   | default · hover · focus · error · disabled                                   |
| **Radius**   | `--radius-component-default` (8px)                                           |
| **Border**   | `--border-default` → `--border-focus` (focus) → `--border-attention` (error) |
| **Focus**    | 2px black, 2px offset. **Never blue.**                                       |
| **Disabled** | `--button-disabled` bg, `--text-disabled` fg                                 |

### FilterChip — `components/FilterChip/`

Interactive filter-pill family with filled and outlined treatments, selected state, optional icons, and single-, multiple-, or hierarchical selection. Groups retain native horizontal overflow on narrow surfaces and expose selection through accessible pressed-state controls.

### Sheet — `components/Sheet/`

Shared modal shell for PDP details and search filters. Mobile uses a bottom sheet with content or full-height sizing; desktop uses a centered 560px dialog. The token-backed header, close/back action, modal focus behavior, scroll lock, independent content scrolling, and optional fixed footer are shared. Child views reuse one shell and backdrop; callers retain business state and restore the parent entry on return. Desktop quick-filter menus remain anchored Popovers.

### Dialog — `components/Dialog/`

Centered modal for confirmation, alerts, and short tasks on mobile and desktop. The confirmation variant centers its title and uses explicit footer actions without a close button; the default variant keeps a close action. Irreversible destructive confirmations use `alertdialog` and one red `emphasis` action, while ordinary confirmations keep the black `primary` action. Mobile keeps 16px side margins, content height is intrinsic up to the safe viewport limit, and overflowing body content scrolls between a fixed header and optional footer. Use `Sheet` for filters, details, child views, and long mobile content.

### Checkbox — `components/Checkbox/`

|                |                                                                                                                                |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **States**     | default · hover · selected · disabled-selected · disabled-unselected · focus-visible · indeterminate (code-only)               |
| **Geometry**   | 24px frame · 20px visible square · 4px `--radius-tag-primary`                                                                  |
| **Color**      | Neutral selection: `--text-primary`, never brand or operational red.                                                           |
| **Disabled**   | `--fill-disabled`; never CSS opacity.                                                                                          |
| **Behavior**   | Base UI checkbox with controlled/uncontrolled state, hidden native form input, Space-key toggle, and ARIA checked/mixed state. |
| **Tap target** | Pseudo-element expands the 24px frame to at least 44px without changing layout.                                                |

### RadioGroup — `components/RadioGroup/`

|                |                                                                                                                                   |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **States**     | default · hover · selected · disabled-selected · disabled-unselected · focus-visible                                              |
| **Geometry**   | 24px frame · 20px outer circle · 12px selected dot                                                                                |
| **Color**      | Neutral selection: `--text-primary`, never brand or operational red.                                                              |
| **Disabled**   | `--fill-disabled`; never CSS opacity.                                                                                             |
| **Behavior**   | Base UI radiogroup/radio composition with exclusive selection, roving focus, arrow-key navigation, and hidden native form inputs. |
| **Tap target** | Each 24px item expands to at least 44px without changing group layout.                                                            |

### Divider — `components/Divider/`

|               |                                                                      |
| ------------- | -------------------------------------------------------------------- |
| **Strengths** | `default` (8% black) · `subtle` (29% black) · `emphasis` (87% black) |
| **Stroke**    | `--stroke-default` (1px) or `--stroke-thick` (2px)                   |

### AspectRatio — `components/AspectRatio/`

|                       |                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Purpose**           | Style-neutral layout primitive that preserves a caller-provided width-to-height ratio.                                       |
| **API**               | Required numeric `ratio`; `1` is square, `16 / 9` is landscape.                                                              |
| **Responsibility**    | Geometry only. Media semantics, cropping, loading states, backgrounds, radii, and overlays belong to the consumer.           |
| **ProductCard usage** | The image area composes `AspectRatio ratio={1}` while retaining ProductCard-specific image, placeholder, and Badge behavior. |

### HorizontalScrollList — `components/HorizontalScrollList/`

Style-neutral finite horizontal list with native scrolling, hidden scrollbars, item snapping, keyboard focus, and a shared controller for YAMI rail navigation. Consumers own card anatomy and section presentation.

### ProductCard — `components/ProductCard/` _(composite: composes Card + AspectRatio + Badge + ProductCardAddButton)_

Canonical YAMI product tile. Anatomy (top → bottom):

| Slot            | Token / spec                                                                                                                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Media**       | Internal `ProductCardMedia`: `AspectRatio ratio={1}` with theme-aware neutral `--fill-tertiary` fallback. The media link shares the product `href` with the title link in every presentation. Up to 2 horizontal secondary `Badge`s at `--space-050`, restricted to Sale / Low Price / Discount / New / Hot / Exclusive / Choice; rich and minimal presentations overlay `ProductCardAddButton` bottom-right. |
| **Presentation** | `rich` is the compatibility default. `minimal` keeps image, price badge, and quick add. `compact` arranges a 118px image beside identity and pricing as a standalone horizontal product row, with quick add aligned to the right of price.                                                                                                 |
| **Brand row**   | Internal `ProductCardSummary`: `caption-sm` (12/14) at every viewport, GT Walsheim 400, `--text-primary`; when brand is present, its destination is required and includes a trailing arrow.                                                                                                  |
| **Title**       | Required product link sharing the media destination; `body-md`, PingFang SC (CN) / GT Walsheim (EN), 2-line ellipsis clamp, `--text-primary`                                                                                                                                                 |
| **Signals**     | Optional ranking Badge, rating + review count, and sold count. Rating star follows Figma `--text-emphasis`.                                                                                                                                                                                 |
| **Offer**       | Internal `ProductCardOffer`: `price-sm` current price; red only when discounted, `strike-sm` original price, unit/bundle price, campaign rows, and countdown.                                                                                                                               |
| **Add button**  | Dedicated public `ProductCardAddButton`; rich and minimal cards position it above the media link, while compact rows position it beside price. It remains independent from product navigation, stops propagation, and requires `aria-label`.                                                                                                                |
| **Type levels** | Exactly **4** — brand caption / title body / price / rating caption. Hits cap (rule `type-hierarchy`).                                                                                                                                                                                      |

### ProductList — `components/ProductList/` _(composite: composes ProductCard + Tabs + Button)_

Data-driven product collection for homepage, campaign, and discovery surfaces.

| Axis | Contract |
| --- | --- |
| **Layout** | `rail` and `waterfall` default to rich cards. `presentation` can override the shared ProductCard anatomy for composed patterns; one collection never mixes presentations. |
| **Responsive geometry** | Waterfall uses two columns on mobile. Rail cards are 152px mobile; PC shows 4 cards at 1024px and increases to 8 cards at 1920px. |
| **Rail** | Mobile uses native horizontal overflow and scroll snap. PC clips overflow and pages only through YAMI icon Buttons, which advance one visible page and disable at boundaries. Reduced motion uses immediate scrolling. |
| **Tabs** | Composes tertiary `Tabs`; only selection is reported. Filtering remains the caller's responsibility. |
| **Appearance** | `standard` uses the primary surface; `themed` requires a semantic banner; `atmospheric` uses decorative CSS artwork while retaining primary product-card surfaces. |
| **Loading** | Layout-specific skeleton geometry consumes `--fill-skeleton`. The section sets `aria-busy`; skeletons are `aria-hidden`; localized loading copy remains available to assistive technology. |
| **Structure** | The visible heading labels the section. Product containers use `list` / `listitem`; product navigation and quick add remain independent controls. |

### ThemeProductList — `components/ThemeProductList/`

Theme storytelling composition built on the standard product rail. It places an image-led content panel and description before the shared ProductCard collection while preserving ProductList paging, tokens, and accessibility contracts.

### ProductMediaGallery — `components/ProductMediaGallery/`

Accessible PDP gallery with one square viewing window, thumbnail selection, shared previous/next rail controls, an active-image counter, and responsive thumbnail placement. Only one product image is presented as active at a time.

### ProductReviewSection — `components/ProductReviewSection/`

Full PDP review composition with aggregate score, five-star distribution, filters, native sorting, review metadata, responsive review cards, and progressive disclosure. It uses YAMI Button and FilterChip primitives and semantic typography tokens.

### ReviewList — `components/ReviewList/`

Responsive curated-review rail that composes ReviewCard children with the shared section heading and horizontal-list behavior. Use it for compact recommendations or editorial review highlights, not as a substitute for the full PDP review section.

### Billboard — `components/Billboard/` _(composite)_

Full-bleed promotional band whose entire content is one campaign image.

| Axis | Contract |
| --- | --- |
| **Composition** | One link wraps one `picture`. There is no text layer: the offer, its styling and its call to action are drawn into the artwork, which is what lets campaign teams ship a finished image instead of a copy deck. |
| **Geometry** | The band spans the page and its artwork stops at 1440px behind the standard 48px gutter — narrower than the page's 1920px content box, because one strip of artwork stretched edge to edge reads as a banner ad. Below 1024px the band becomes one of the page's cards, taking `--layout-page-margin-card` and `--radius-surface-default` like ProductList and ShortcutRail. |
| **Responsive behavior** | `image.mobile` swaps artwork below 1024px, for campaigns whose desktop lettering is unreadable at phone widths. Each artwork carries its intrinsic `width`/`height`, which reserve the band's height before it loads — the band has nothing else to establish a ratio from. |
| **Structure** | A labelled region wrapping a single anchor, `label` naming both. Naming only the region leaves the link nameless: a link takes its name from its content, and the content is artwork whose `alt` is empty because it would only repeat that label. |

### BrandProductRail — `components/BrandProductRail/` _(composite: composes ProductList + ProductCard + Button)_

Brand-led commerce rail for homepage trend and discovery sections.

| Axis | Contract |
| --- | --- |
| **Composition** | Every brand panel is an existing themed `ProductList`; its three rows are existing `ProductCard`s with the `compact` presentation. |
| **Geometry** | Desktop uses 48px page padding, four equal campaign panels with 16px gaps, 160px brand banners, and 108px product media. |
| **Responsive behavior** | Desktop paging composes shared rail Buttons. Narrow layouts retain native horizontal overflow and scroll snap with one campaign panel emphasized at a time. |
| **Content** | Campaign and product data are consumer-provided. Landscape brand art remains semantic; brand text sits over a token-backed bottom scrim, and the optional partnership badge may be decorative or explicitly labelled. |
| **Structure** | The visible heading labels a list of brand campaigns. Each panel contains a labelled ProductList and independent campaign, product, quick-add, and view-all controls. |

### ThemeHero — `components/ThemeHero/` _(composite: composes Button)_

Full-width theme storytelling module for a curated landing page.

| Axis | Contract |
| --- | --- |
| **Composition** | Selectable heading and supporting copy sit beside semantic campaign artwork; the same source may repeat behind the module as a blurred decorative atmosphere. |
| **Geometry** | Desktop is a flush 448px full-bleed band. Its centered 1440px two-column content container is flush vertically with 48px inline insets; the grid gap is excluded from each half-width track. |
| **Responsive behavior** | Below 1024px, copy and artwork stack in DOM order while keeping the foreground image's intrinsic ratio. |
| **Action** | One optional primary inverse Button follows the copy. The component does not introduce secondary actions or navigation chrome. |
| **Structure** | A section with an `h2`, selectable description, meaningful foreground image and optional native button. The blurred duplicate is decorative. |

### HeroBanner — `components/HeroBanner/` _(composite: composes Button)_

Responsive homepage campaign rail shared by PC and Mobile.

| Axis | Contract |
| --- | --- |
| **Responsive geometry** | Mobile uses fixed `320 × 360` cards with an 8px swipe gap and page margin. PC keeps the 8:9 ratio and fills two cards at 1024px, three at 1200px, and four from 1440px. |
| **Content** | `HeroBanner` delegates each item to one of four public cards: image only, image with text, image with text and products, or products only. Three thumbnails form a strip; four form a 2 × 2 grid. |
| **Campaign surface** | Image variants sample the artwork's bottom-edge dominant color and use it for the content surface and Figma-specified functional 24px fade. Caller-provided `backgroundColor` is the loading and cross-origin fallback. |
| **Paging** | Mobile uses native overflow and scroll snap. PC composes 36px YAMI icon Buttons, pages one visible group, reports progress, and disables controls at boundaries. |
| **Structure** | The region contains a semantic list of campaign links. Image variants require meaningful alt text; image-only cards use that alt as the link name. Products-only cards require visible campaign copy and render no empty media placeholder. |

### Header — `components/Header/`

PC global navigation band. **PC only** — the mobile header is a separate component and is not yet shipped. Geometry and token bindings are reconciled against the production storefront header; sanctioned-value substitutions are tabled in the component's `usage.md`.

| Axis | Contract |
| --- | --- |
| **Geometry** | One band, two rows, 130.6px: a 64px utility row (brand lockup · hall switcher · deliver-to · search · account · locale · cart) closed by a 1px rule, then a 63.6px category rail closed by a `--stroke-thick` `--divider-emphasis` rule. Page margin is `--space-600` on both rows; the brand lockup is the 52px PC logo; the band caps at 1920px. |
| **Category entries** | Artwork, not icon components. Each entry renders `categories[].image` as a 24px `<img>` above a `caption-sm` label capped at 76px, so campaign teams reskin categories without a component release. Omitting the image yields the built-in grid glyph, reserved for the leading Categories entry. `startsGroup` opens the regional block with one 1px × 32px divider. |
| **Halls** | `All \| Beauty` switches the **storefront**, not the search query, so it sits in the brand group as an exclusive `radiogroup` and reports through `onHallChange`. **EN-only** — the CN storefront ships no hall switcher, and the lockup is separated from deliver-to by a rule instead. The two locales are separate CMS feeds, so their rails differ in count, labels, order, and some artwork. |
| **Promotion badges** | Optional per-category counts and promotion flags in `--text-emphasis`, stacked above the artwork and clipped to one line so a multi-badge entry cannot change the row height. This is the **only** red permitted in the chrome, and only for promotions (rule `red-usage`). |
| **Search** | 40px pill (`--radius-button-primary`) with an embedded 52 × 32 submit, deliberately **not** composed from `Input` (8px labelled form field). Hot-search rotation through the placeholder is a data concern. |
| **Rail paging** | 36px controls overlaid on the rail edges, ringed with `--border-default` rather than a shadow (rule `elevation-on-press`). They page one viewport minus a single anchor entry and **unmount** at the boundaries, matching production's `display: none`, so no dead control sits in the chrome. |
| **Structure** | `banner` landmark containing a `search` landmark and a `nav` region wrapping a list of category links. The account control shows its label visibly; the cart is icon-only and folds its item count into `aria-label`, since the chrome renders no visible count. |

### ActivityPageHeader — `components/ActivityPageHeader/`

Compact mobile navigation for campaign and editorial landing pages. It combines the approved YAMI lockup, visible page title, and independent search and cart actions without reusing the PC-only global Header geometry.

### Footer — `components/Footer/`

PC global site footer. **PC only** — the mobile footer stacks differently and is a separate component, not yet shipped. Geometry and token bindings are reconciled against the production storefront footer; sanctioned-value substitutions are tabled in the component's `usage.md`.

| Axis | Contract |
| --- | --- |
| **Geometry** | Three bands inside one `contentinfo` landmark. The masthead is a fixed **50/50** grid parted by a full-height `--stroke-default` `--divider-subtle` rule: link columns on `--surface-secondary` (padded `--space-050` / `--space-600` / `--space-600`) against the newsletter and app bands on `--surface-primary` (each padded `--space-400` block, `--space-600` inline-start). The closing bar is `--surface-inverse` at `--space-600`. The landmark caps at 1920px. |
| **Link columns** | Production packs five titled groups into three visual columns, so a column owns an **ordered list of groups** rather than one. Columns are **equal-width with no gap** — a 214px column on a 214/215px pitch at 1480px — so the pitch holds at every width instead of drifting with label length. Group titles are real `h3`s, making the footer navigable by heading. Stacked groups are parted by `--space-400`. |
| **Destinations** | Every `href` is optional, matching Header: the footer is CMS-routed, so the DS hardcodes no destination and an entry without `href` renders as a plain unlinked label. An unconfigured footer therefore exposes no empty links. |
| **Optional bands** | `subscribe`, `socialLinks`, `appTitle`, and `appLinks` are each independently optional — a links-only footer is a supported configuration. The keep-in-touch band closes with a `--stroke-default` `--divider-subtle` rule only when it renders — the same weight and color as the masthead split, so the two never read as mismatched. |
| **Newsletter** | The only stateful slot in the landmark, and deliberately **validation-free**: it fires `onSubmit` and renders the caller's `error`, wiring `aria-invalid` and `aria-describedby` itself. Its 246 × 40 field uses `--radius-component-default`; field and submit share `link-md` so the pair cannot drift, and both center on the row. The submit is text-only in `--text-emphasis` and is the **only** red in the landmark (rule `red-usage`). |
| **App buttons** | 246 × 40 `--surface-inverse` pills exported standalone as `FooterAppButton`, so app-download modules outside the footer reuse the control without lifting the landmark. Badge artwork is a **caller-supplied** image slot — the Apple and Google marks are licensed and stay out of the DS bundle. |
| **Structure** | Social glyphs are decorative (empty alt) and their anchors name themselves; payment marks carry the scheme name as alt because no visible label repeats it. Legal entries may override their accessible name via `ariaLabel` where the visible label under-describes the target. Column links and social glyphs keep production's visual size and gain transparent 44px hit areas rather than growing their rows (rule `tap-target`). |

### ShortcutRail — `components/ShortcutRail/` _(composite: composes Button)_

Responsive shortcut navigation for homepage and discovery surfaces.

| Axis | Contract |
| --- | --- |
| **Geometry** | Every entry keeps a 64px `--surface-secondary` icon circle and a 32px image slot. Labels use `caption-md` (14/20) on PC and `caption-sm` (12/14) below 1024px. Page padding follows `--layout-page-margin-default`. |
| **Surface** | `plain` spans the available width. `card` uses `--layout-page-margin-card`, `--radius-surface-default`, and `--surface-primary` with no border or shadow; Ecommerce Home uses the card surface while discovery pages may remain plain. |
| **Responsive behavior** | Mobile uses compact icon geometry with `caption-sm`; PC uses desktop geometry with `caption-md`. Touch and trackpad users retain native horizontal scrolling without progress chrome; desktop adds edge controls only when content overflows. |
| **Paging** | Each edge composes the shared YAMI `RailNavigationButton`. A functional `--surface-primary` to transparent mask sits behind the control so clipped content remains legible without adding a shadow. |
| **Structure** | A labelled `nav` contains a semantic list of destination links. Visible labels name the links; icon artwork is decorative and uses empty alt text. |

### SocialMediaGallery — `components/SocialMediaGallery/` _(composite: composes Button)_

Responsive social video discovery rail for homepage and editorial surfaces.

| Axis | Contract |
| --- | --- |
| **Composition** | The gallery delegates every entry to the exported `SocialVideoCard` child component. Cards support pure-video, single-product, and multi-product variants on both PC and mobile. |
| **PC geometry** | The section uses a 1px `--divider-default` top rule, 48px inline and 32px block padding, and six equal cards per viewport. Each card crops a 9:16 source into a 3:4 media area and adds a 72px footer. |
| **Mobile geometry** | The section becomes a rounded surface. Cards are fixed at 240px in a native horizontal rail; media is 240 × 320 and the footer is 68px. |
| **Content** | Creator identity and captions are caller-provided. One product renders image plus copy, multiple products render image tiles and an optional more count, and omission renders the caption in a text-only footer. |
| **Structure** | The visible heading labels a semantic list of article cards. Video, product, view-all, and paging destinations remain independent controls; desktop paging composes shared rail Buttons. |

### TrendingSearches — `components/TrendingSearches/` _(composite: composes ProductCard + SectionHeading + RailNavigation)_

Ranked search terms with the results behind each one.

| Axis | Contract |
| --- | --- |
| **Composition** | One tree serves both breakpoints. Each term carries its search destination, a tagline, a mobile-only thumbnail, and the products it returns; the products render as `ProductCard`. |
| **PC geometry** | 48px inline and 32px block padding, 24px below the heading, then a keyword-card rail on BrandProductRail's per-view ladder — two cards at 1024, three from 1025, four from 1440, each rung filling the row exactly on a 16px gap. At 1920 that lands on the 444px card the frame was drawn at. |
| **Mobile geometry** | The section becomes one of the page's rounded white cards, on SocialMediaGallery's sequence: the card pads once at 8px and nothing inside pads again. Terms stack as 56px rows of a fixed 24px rank column, a 40px thumbnail tile and the term on a 1px divider. The tile composites like ProductCard's media — the fill behind, the shot multiplied onto it — so a catalogue photo's white ground takes the grey instead of covering it, each row taking 4px of its own inline padding; the open row adds a tinted tagline, a result rail that bleeds to the card's edges so a card can scroll flush, and a full-width 44px search CTA. |
| **Content** | Give each term three or more products. Desktop previews the leading two and mobile scrolls the set, so a term with exactly two leaves the mobile rail nothing to scroll. Taglines hold exactly two lines on desktop — reserved so every card's results start on the same line, clamped so a third line clips rather than pushing the products out; the mobile pill hugs its copy, having nothing beside it to align to. |
| **Structure** | Below 1024px each row is a button with `aria-expanded` and `aria-controls`; above it the rows are gone and each card carries a link instead. Each is `display: none` at the other breakpoint, so only one structure reaches the accessibility tree. Rank numbers are `aria-hidden` — list order already carries them. One term is open at a time on mobile; every card is open on desktop. |

---

## Motion System

Functional, not decorative. State feedback uses **color shift first** (the `-active` token); motion is secondary. Never block input. Always respect `prefers-reduced-motion`.

> **Note**: Motion values are inline **literal numbers**, not CSS variables. YAMI does not yet expose `--duration-*` / `--ease-*` tokens in [tokens.css](./tokens.css) — no `tokens/motion/` DTCG source. Promotion to real tokens is tracked in [decisions.md](./decisions.md).

**Tier summary** (full spec is in [`motion/patterns.md`](./motion/patterns.md), durations in [`motion/durations.md`](./motion/durations.md), easings in [`motion/easing.md`](./motion/easing.md)):

| Tier   | Value                       | Where                                         |
| ------ | --------------------------- | --------------------------------------------- |
| Fast   | `100ms` + default easing    | Button / Card hover & press (color flip only) |
| Base   | `150ms` + enter/exit easing | Modal / dropdown / toast in & out             |
| Slow   | `300ms` + default easing    | Page transition fade                          |
| Linear | `1000ms` / `1500ms` linear  | Spinner rotation, skeleton shimmer            |

**Hard motion rules**:

- Hover feedback must be declared inside `@media (hover: hover) and (pointer: fine)`, never inferred from viewport width. Touch devices keep `:active`, `:focus-visible`, and semantic selected/checked states without a sticky Hover state.
- Hover / press changes `background-color` only — no scale, no shadow, no rotation. ProductCard media is the sole scale exception: the image may zoom to `1.03` while its card geometry remains fixed. (per `elevation-on-press` rule.)
- We **do not animate** `height`, `width`, `flex-direction`, `border-width`, `font-size`, or grid reflow card positions. Let them snap.
- `prefers-reduced-motion: reduce` → all `transition-duration` / `animation-duration` go to `0ms`. Exception: essential loading spinners still rotate at reduced speed.

---

## Imagery

<!-- rule-id: no-emoji -->
<!-- rule-id: no-decorative-media -->

> **Rules governing this section** — `no-emoji` (no emoji in product UI; UGC excepted), `no-decorative-media` (no glassmorphism / hand-drawn / unregistered serif or decorative fonts / patterns / pastels / colored-left-border alerts; approved serif typography uses `--font-family-serif`). Full bilingual prose: [Hard Rules summary](#hard-rules-validator-linked).

- **Product photography** — naturalistic, warm, product-forward. Pure white or a neutral gray background; avoid branded pink behind catalog imagery.
- **No moody, no stylized, no hand-drawn.** Food photography that looks like a real product, not a magazine cover.
- **Missing image fallback** — `--fill-tertiary` neutral gray with a quiet, compact 8px-spaced diagonal SVG pattern; no icon, text, or spinner.
- **No decorative illustration** in the chrome. Empty states are short copy + a single product hint, not a mascot.

---

## Tone & Voice

YAMI is **bilingual**: CN is primary, EN is the polite parallel — neither is a translation of the other. Default UI language follows user locale. CN uses `你` (informal you) except in checkout receipts; EN uses sentence case, no marketing filler, imperative on buttons. **No emoji in any product UI** (UGC excepted).

Full specifications:

- [`content/voice.md`](./content/voice.md) — tone, personality, voice attributes
- [`content/bilingual.md`](./content/bilingual.md) — CN-EN parity rules, language fallback
- [`content/copy-patterns.md`](./content/copy-patterns.md) — labelled patterns (CTA, error, empty state, etc.)
- [`content/casing-numerals.md`](./content/casing-numerals.md) — title case rules, price / count formatting
- [`content/writing-standards.md`](./content/writing-standards.md) — house style guide

Copy library: [`copy/`](./copy/) (UI strings indexed by feature).

---

## Page Prototypes

Maintained page compositions and their interaction stories live in [`../prototypes/pages/`](../prototypes/pages/). Before creating a YAMI page, inspect the closest existing Ecommerce Home, Search Results, Product Detail, Topic Landing, or email composition and reuse its public components, fixture shapes, and page-width strategy. A page type without a maintained prototype is a system gap to flag rather than an invitation to invent a recipe path.

---

## Storybook and generated contracts

Storybook stories are the maintained visual and interaction reference. [`generated/catalog.json`](./generated/catalog.json) records the active component inventory, while [`generated/registry.json`](./generated/registry.json) and [`generated/registry-items/`](./generated/registry-items/) define installable source contracts. Browser verification remains necessary for layout, responsive, and computed-style behavior that static validators cannot observe.

---

## Hard Rules (validator-linked)

These rules are the canonical source-of-truth for this design system. Each `<!-- rule-id: X -->` marker above in its governing section is wired to [`principles/principles.ts`](./principles/principles.ts) and an AST validator at [`principles/validators/<rule-id>.ts`](./principles/validators/). CI's `pnpm check:principles-sync` enforces three-way consistency.

For the **why** behind each rule (trade-offs, history, edge cases), see [`decisions.md`](./decisions.md).

> **Versioning convention**: 15 rules are currently active. Rule additions and retirements—including the retired `no-gradient` rule—are recorded in [`decisions.md`](./decisions.md). Any rule added in a later release will be tagged inline as `(since v0.x.y)`.

<!-- rule-id: token-exists -->

| Rule                      | EN                                                                                                                                                                                        | 中文                                                                                                                                       |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **`red-usage`**           | Two reds, never mixed. `--color-brand-red` is **Logo only**. `--color-red-500` is the **only** red allowed on buttons, badges, promo, and error.                                          | 双红互斥。`--color-brand-red` 只用于 Logo；`--color-red-500` 是唯一可出现在按钮、徽章、促销、错误状态上的红。                              |
| **`semantic-color-only`** | Blue / green / purple / yellow live in (1) semantic status (info / success / warning / promotion), (2) the 6-color Badge palette. Nowhere else.                                           | 蓝/绿/紫/黄只能用于 (1) 语义状态（信息/成功/警示/促销），(2) 6 色徽章调色板。其他场景一律禁用。                                            |
| **`numerals-font`**       | Every digit renders in GT Walsheim, including inside mixed CN strings.                                                                                                                    | 所有数字一律 GT Walsheim——包括中文字符串中嵌入的数字与拉丁字符。                                                                           |
| **`type-hierarchy`**      | Max 4 type levels per page. If you need a 5th, the page has a hierarchy problem.                                                                                                          | 每页最多 4 个字号层级。若需要第 5 级，是页面层级有问题，不是字号问题。                                                                     |
| **`no-custom-radii`**     | Only the 5 semantic radius tokens. Never raw `8.5px` / `16px` / `50%`, never primitives like `--radius-sm` / `--radius-md` / `--radius-lg` / `--radius-xl`.                               | 仅 5 个语义圆角槽位。不得用 `8.5px` / `16px` / `50%` 等裸值，也不得用 `--radius-sm` / `-md` / `-lg` / `-xl` 这类原子 token。               |
| **`elevation-on-press`**  | Hover / press changes `background-color` (the `-active` token). **Never `box-shadow`.**                                                                                                   | 悬浮/按压用 `background-color`（`-active` token）变化反馈，**绝不**修改 `box-shadow`。                                                     |
| **`no-opacity-disabled`** | Disabled states use `--button-disabled` + `--text-disabled`. Never CSS `opacity`.                                                                                                         | 禁用态用 `--button-disabled` + `--text-disabled` 一对 token，不得用 CSS `opacity` 降透明度。                                               |
| **`focus-style`**         | 2px `--border-focus` outline, 2px offset. **Never blue.**                                                                                                                                 | 2px `--border-focus` 外描边、2px 偏移。**绝不**用蓝色 focus ring。                                                                         |
| **`border-strength`**     | Borders use 3 strengths only: default 8% black, focus 87% black, attention red.                                                                                                           | 边框只允许 3 档强度：默认 8% 黑、focus 87% 黑、attention 操作红。                                                                          |
| **`emphasis-limit`**      | 1 emphasis Button per screen. No exceptions.                                                                                                                                              | 每屏最多 1 个强调按钮。无例外。                                                                                                            |
| **`card-no-border`**      | Cards default to no border. Opt-in `bordered` only for dense listing grids.                                                                                                               | 卡片默认无边框。仅在密集列表网格中可显式 `bordered`。                                                                                      |
| **`tap-target`**          | iOS 44pt, Android 48dp minimum hit area. Padding-expand the touch region without growing the visible affordance.                                                                          | 触屏可点击区域：iOS 44pt / Android 48dp。用 padding 扩大命中区，不要放大可见尺寸。                                                         |
| **`no-emoji`**            | No emoji in product UI (buttons, nav, status, empty states). UGC excepted.                                                                                                                | 产品 UI 内禁用 emoji（按钮、导航、状态、空态）。UGC 内容例外。                                                                             |
| **`no-decorative-media`** | No glassmorphism, hand-drawn illustration, unregistered serif/decorative fonts, patterns / noise / grain, pastel palettes, colored-left-border alert cards. Approved serif typography must use `--font-family-serif`. | 不用毛玻璃、手绘插画、未注册的衬线/装饰字体、纹理/噪点/颗粒、粉彩色板、左侧色条警示卡；批准的衬线样式必须使用 `--font-family-serif`。 |
| **`token-exists`**        | Every `var(--name)` reference must exist in `tokens.css`. AI generators commonly fabricate plausible-but-fake tokens; CI's `check:tokens-in-docs` catches this on the documentation side. | 每个 `var(--name)` 引用必须真实存在于 `tokens.css`。AI 常见错误是捏造看似合理的 token；CI 的 `check:tokens-in-docs` 在文档层拦截这类问题。 |

Decisions of note (selected):

- [`2026-04-red-scope`](./decisions.md) — Why two reds, not one.
- [`2026-09-gradients-permitted`](./decisions.md) — Why gradients are no longer a prohibited medium.
- [`2026-04-type-hierarchy-commerce-exception`](./decisions.md) — Why commerce templates (Cart / PDP) get a per-file pragma.
- [`2026-04-tap-target-self-contradiction`](./decisions.md) — Why the tap-target validator's warning text is itself unsatisfying.

### How to add a new rule

1. Add a new `<!-- rule-id: <kebab-name> -->` marker in the topic section it governs (Colors / Typography / etc.).
2. Add a row in this Hard Rules summary table (EN + 中文 prose).
3. Add corresponding entry to [`principles/principles.ts`](./principles/principles.ts).
4. Create AST validator at `principles/validators/<kebab-name>.ts`.
5. CI `pnpm check:principles-sync` will flag any 3-way inconsistency.

Design rule authoring is open to designers / PMs / brand owners — write natural Markdown. Engineers implement the validator after the rule is stable.

### Author syntax for anti-pattern examples

CI's `check:tokens-in-docs` scans every `var(--x)` / inline-backtick `--x` reference in this file (and `DESIGN.compact.md` / `content/**/*.md`) against the real token set in `tokens.css`. When you need to **show** a fake / wrong token name in a doc (to teach what _not_ to do), use one of these three escape hatches — otherwise CI will fail.

1. **Block wrapper** (preferred for multi-line examples). Surround the bad code with HTML comment markers:
   - Opening: `<!-- anti-pattern -->`
   - Closing: `<!-- /anti-pattern -->`
   - Inside the wrapper you can put any number of lines, including fenced code blocks. Validator erases everything between the markers (newlines preserved for line accuracy).

2. **Inline wrapper** (single occurrence in prose). Place the open + close markers on the same line, around the bad token: `... use --your-token, not --fake-token ...`. Same `<!-- anti-pattern -->` / `<!-- /anti-pattern -->` syntax works inline.

3. **`✗` line prefix** (single-line bullet examples). Start the line with `✗` or `❌` and the whole line is skipped from token scanning. Useful for short one-line examples in lists.

Placeholder names (`--x`, `--name`, `--your-token`, `--foo`, etc.) in the PLACEHOLDERS set inside `principles/check-tokens-in-docs.ts` are always skipped — extend that set if a new pedagogical placeholder becomes common.

---

## Known AI Failure Gallery

Observed failures from real `validate_design` runs + audit findings in [`decisions.md`](./decisions.md). Each entry: the failure, why AI does it, the fix. Use these as prompt-injection material when briefing a new agent.

### F1. Fabricated size token in a real scale family

<!-- anti-pattern -->

**What AI wrote**: `font-size: var(--font-size-heading-lg);`
**Why**: The scale has `-sm` / `-md` / `-xl` / `-2xl` etc.; the agent extrapolates a "missing" `-lg` step.
<!-- /anti-pattern -->

**Why it's wrong**: The `-lg` step doesn't exist in `tokens.css`. YAMI's heading scale is `-sm` (16) / `-md` (18) / `-xl` (20) / `-2xl` (28) / `-3xl` (32) / `-4xl` (40) — no `-lg` step.
**Fix**: `font-size: var(--font-size-heading-xl);` (or call `list_tokens` MCP to enumerate the real scale).
**Catch**: `pnpm check:tokens-in-docs` on docs; `principles/validators/token-exists.ts` on code.

### F2. CSS `opacity` for disabled state

<!-- anti-pattern -->

**What AI wrote**:

```css
.button[disabled] {
  opacity: 0.5;
}
```

<!-- /anti-pattern -->

**Why**: It's the "intuitive" web default since 1995. Most frameworks demo it this way.
**Why it's wrong**: `opacity` produces a low-contrast result that fails WCAG AA on real backgrounds; it also dims everything uniformly (icon, label, background) which destroys the semantic "this is unavailable" signal. (rule `no-opacity-disabled`)
**Fix**: `background: var(--button-disabled); color: var(--text-disabled);` — semantic tokens with calibrated contrast.

### F3. Box-shadow growth on hover

<!-- anti-pattern -->

**What AI wrote**:

```css
.card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}
```

<!-- /anti-pattern -->

**Why**: Material Design grammar; "elevation increase signals interactivity".
**Why it's wrong**: Figma currently provides no YAMI elevation token source. Hover changes `background-color`, never shadow (rule `elevation-on-press`).
**Fix**: `background: var(--surface-secondary);` on hover. Keep Card shadow-free.

### F4. Blue focus ring

<!-- anti-pattern -->

**What AI wrote**: `outline: 2px solid #0066ff;` for focus.
<!-- /anti-pattern -->

**Why**: Web platform default; Chrome's user-agent stylesheet does exactly this.
**Why it's wrong**: Blue ≠ YAMI. YAMI's focus indicator is **2px black at 2px offset** (rule `focus-style`). Blue conflicts with the `semantic-color-only` constraint (blue lives in badges, not chrome).
**Fix**: `outline: 2px solid var(--border-focus); outline-offset: 2px;`

### F5. Emoji in commerce UI

<!-- anti-pattern -->

**What AI wrote**: `<button>🛒 Add to Cart</button>` or 🎉 in a success toast.
<!-- /anti-pattern -->

**Why**: Modern UI vibes; emoji are seen as "friendly" in many design systems.
**Why it's wrong**: YAMI's positioning is "calm, disciplined, content-forward" — emoji clash with the brand's restraint discipline (rule `no-emoji`). The cart icon should be a proper SVG from `assets/icons/`, rendered consistently across platforms (emoji render differently iOS vs Android vs Windows).
**Fix**: SVG icon component, or remove and rely on label-only.

> **How to extend this gallery**: when `validate_design` MCP catches a recurring violation pattern in production, capture: (a) the exact code AI produced, (b) one-sentence "why" for AI's mistake, (c) the rule violated, (d) the canonical fix. Append as a new F# entry. A future `pnpm gen:failure-gallery` script will aggregate from `principles/runtime/` logs.

---

## Agent Prompt Guide

### Quick color reference

```
Page background:    #FFFFFF                (--background-primary)
Card surface:       #FFFFFF                (--surface-primary)
Primary text:       rgba(0,0,0,0.87)       (--text-primary)
Secondary text:     rgba(0,0,0,0.55)       (--text-secondary)
Disabled text:      rgba(0,0,0,0.29)       (--text-disabled)
Emphasis text:      #E00000                (--text-emphasis)         ← prices, urgency
Hairline border:    rgba(0,0,0,0.08)       (--border-default)
Focus ring:         rgba(0,0,0,0.87)       (--border-focus)          ← 2px, 2px offset
Brand cream wash:   #FBF1EF                (--brand-tertiary)
Logo red:           #FF0000                (--color-brand-red)        ← Logo ONLY
CTA / promo red:    #E00000                (--button-emphasis)        ← Buy Now / sale
Rating star:        #FA8005                (--color-amber-500)
```

### Example component prompts

**Hero section (Home / Category landing)**

> Full-width band, background `--background-primary` (`#FFFFFF`). Centered eyebrow caption in GT Walsheim 500, `--text-secondary`. Display-xl headline in PingFang SC for CN / GT Walsheim for EN, `--text-primary`. Single emphasis CTA below at 48px height, fill `--button-emphasis`, text `--text-on-emphasis`, radius `--radius-button-emphasis`. **Exactly one CTA.**

**Product card (PLP grid)**

> 8px component radius on `--surface-primary`, **no border**, no shadow. Image area uses theme-aware neutral `--fill-tertiary` when missing. Top-left badges are horizontal at `--space-050`, max 2. Title clamps to 2 lines. Price uses `--text-emphasis` only when discounted. Rating star follows `--text-emphasis`. `ProductCardAddButton` overlays bottom-right with `aria-label="Add to cart"`.

**Promo banner (limited-time sale)**

> Full-width, background `--fill-promotion-secondary` (`#FBF1EF`). Heading in GT Walsheim 500 `--font-size-heading-xl`, text `--text-emphasis` (red). Body in PingFang SC 400 `--font-size-body-md` `--text-primary`. Countdown digits in GT Walsheim 500 `--font-size-price-md` `--text-emphasis`. **No decorative pattern.** CTA: emphasis button.

**Form field (with error)**

> Input height `--space-500` (40px), radius `--radius-component-default` (8px), border `--border-default`. Focus: outline 2px `--border-focus`, offset 2px. Error: border `--border-attention` (`#E00000`), helper text in `--text-error`. **Never use placeholder text in lieu of a label.** Tap target padding-expanded to 44pt min.

**Modal**

> Backdrop: `--overlay-scrim` (`rgba(0,0,0,0.68)`) full-screen. Modal surface: `--surface-primary`, radius `--radius-surface-default` (12px), padding `--space-300`. Header: heading-md, `--text-primary`. Body: body-md. Footer: action row right-aligned, secondary button + emphasis button (≤ 1 emphasis).

### Anti-patterns AI agents repeatedly produce — refuse these

<!-- anti-pattern -->

| EN — refuse this                                         | 中文 — 拒绝输出               | Violates              |
| -------------------------------------------------------- | ----------------------------- | --------------------- |
| `opacity: 0.5` on a disabled button                      | 用 `opacity` 让禁用按钮变透明 | `no-opacity-disabled` |
| A second emphasis button on the same screen              | 同一屏 2 个强调按钮           | `emphasis-limit`      |
| `box-shadow: 0 8px 24px rgba(0,0,0,0.2)` on `:hover`     | 悬浮时放大 `box-shadow`       | `elevation-on-press`  |
| `outline: 2px solid #0066ff` for focus                   | 蓝色 focus ring               | `focus-style`         |
| 🛒 emoji on Add-to-Cart                                  | 按钮里加 emoji（🛒/❤️）       | `no-emoji`            |
| `var(--font-size-heading-lg)` (doesn't exist; use `-xl`) | 捏造形似真但不存在的 token    | `token-exists`        |

<!-- /anti-pattern -->

### When in doubt

1. **Reach for an alias, not a raw token.** Use `--text-primary`, not `--color-black-900`.
2. **No new colors. No new radii.** If you need one, it's a system gap — flag it, don't invent it.
3. **One red rule** — if it's not Logo, it's `--color-red-500`.
4. **One emphasis CTA per screen** — if you want two, restructure the page.

---

## Quick Start

### CSS Custom Properties

```css
:root {
  /* === Brand anchors === */
  --color-brand-red: #ff0000; /* Logo ONLY */
  --color-red-500: #e00000; /* CTA / promo / error */
  --color-red-600: #c40009; /* CTA pressed */
  --color-red-50: #fbf1ef; /* Cream wash */
  --color-white-1000: #ffffff;
  --color-black-900: rgba(0, 0, 0, 0.87);
  --color-black-600: rgba(0, 0, 0, 0.55);
  --color-black-400: rgba(0, 0, 0, 0.29);
  --color-black-200: rgba(0, 0, 0, 0.08);
  --color-black-700: rgba(0, 0, 0, 0.68);

  /* === Neutral ramp === */
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #ebebeb;
  --color-neutral-900: #222222;

  /* === Status === */
  --color-amber-500: #fa8005;
  --color-emerald-500: #3dc24f;
  --color-yellow-500: #fabd05;
  --color-blue-500: #3383ff;

  /* === Semantic aliases === */
  --brand-primary: var(--color-brand-red);
  --brand-tertiary: var(--color-red-50);
  --text-primary: var(--color-black-900);
  --text-secondary: var(--color-black-600);
  --text-disabled: var(--color-black-400);
  --text-emphasis: var(--color-red-500);
  --background-primary: var(--color-white-1000);
  --surface-primary: var(--color-white-1000);
  --surface-secondary: var(--color-neutral-100);
  --button-emphasis: var(--color-red-500);
  --button-emphasis-active: var(--color-red-600);
  --button-primary: var(--color-black-900);
  --button-disabled: var(--color-neutral-200);
  --border-default: var(--color-black-200);
  --border-focus: var(--color-black-900);
  --border-attention: var(--color-red-500);
  --overlay-scrim: var(--color-black-700);

  /* === Typography families === */
  --font-family-ios: "GT Walsheim", "Noto Sans SC", sans-serif;
  --font-family-android: "GT Walsheim", "Noto Sans SC", sans-serif;
  --font-family-win: "GT Walsheim", "Noto Sans SC", sans-serif;
  --font-weight-normal: 400;
  --font-weight-emphasize: 500;

  /* === Type scale (mobile baseline) === */
  --font-size-display-xl: 32px;
  --font-size-display-md: 28px;
  --font-size-display-sm: 24px;
  --font-size-heading-4xl: 40px;
  --font-size-heading-3xl: 32px;
  --font-size-heading-xl: 20px;
  --font-size-heading-md: 18px;
  --font-size-heading-xs: 14px;
  --font-size-body-md: 14px;
  --font-size-caption-md: 14px;
  --font-size-link-md: 14px;
  --font-size-price-md: 24px;
  --font-size-price-sm: 18px;
  --font-size-strike-md: 14px;

  /* === Spacing scale (base 8px) === */
  --space-050: 4px;
  --space-100: 8px;
  --space-150: 12px;
  --space-200: 16px;
  --space-250: 20px;
  --space-300: 24px;
  --space-400: 32px;
  --space-500: 40px;
  --space-600: 48px;
  --space-800: 64px;
  --space-1000: 80px;

  /* === Radii (5 slots — never invent more) === */
  --radius-tag-primary: 4px;
  --radius-component-default: 8px;
  --radius-button-emphasis: 8px;
  --radius-surface-default: 12px;
  --radius-button-primary: 9999px;

  /* === Layout === */
  --layout-page-margin-default: 16px;
  --layout-page-margin-card: 8px;
}

@media (min-width: 1024px) {
  :root {
    --layout-page-margin-default: 48px;
    --layout-page-margin-card: 48px;
  }
}

```

### Tailwind v4 `@theme`

> **Note**: token names below match YAMI's canonical [tokens.css](./tokens.css) namespace verbatim — `--space-*` (not Tailwind's default `--spacing-*`), `--radius-*-primary` / `--radius-*-default` (full names, not the short <!-- anti-pattern -->`--radius-tag`<!-- /anti-pattern --> etc). This ensures any `tw-merge` / class lookup stays consistent with the runtime CSS variables.

```css
@theme {
  /* Colors */
  --color-brand-red: #ff0000;
  --color-red-500: #e00000;
  --color-red-600: #c40009;
  --color-red-50: #fbf1ef;
  --color-neutral-50: #fafafa;
  --color-neutral-100: #f5f5f5;
  --color-neutral-200: #ebebeb;
  --color-neutral-900: #222222;
  --color-amber-500: #fa8005;
  --color-emerald-500: #3dc24f;
  --color-blue-500: #3383ff;

  /* Font families — full token names */
  --font-family-ios:
    "GT Walsheim", "Noto Sans SC", ui-sans-serif, system-ui, sans-serif;
  --font-family-android:
    "GT Walsheim", "Noto Sans SC", ui-sans-serif, system-ui, sans-serif;
  --font-family-win:
    "GT Walsheim", "Noto Sans SC", ui-sans-serif, system-ui, sans-serif;

  /* Type scale */
  --font-size-display-xl: 32px;
  --font-size-heading-xl: 20px;
  --font-size-body-md: 14px;
  --font-size-caption-md: 14px;
  --font-size-price-md: 24px;

  /* Spacing (YAMI namespace: --space-*, not Tailwind default --spacing-*) */
  --space-050: 4px;
  --space-100: 8px;
  --space-200: 16px;
  --space-300: 24px;
  --space-500: 40px;

  /* Radii — semantic slots, full token names */
  --radius-tag-primary: 4px;
  --radius-component-default: 8px;
  --radius-button-emphasis: 8px;
  --radius-surface-default: 12px;
  --radius-button-primary: 9999px;
}
```

Full canonical token surface: [`tokens.css`](./tokens.css), DTCG JSON sources: [`tokens/`](./tokens/).

---

## Similar Brands (reference, not aspiration)

- **MUJI** — White-canvas-with-photography, restrained type ramp, zero decorative color. YAMI inherits the canvas philosophy; departs in keeping numerals geometric (GT Walsheim) rather than humanist.
- **Lawson / Don Quijote (Japan grocery)** — Dense information, hardworking type, single bright sale red. YAMI matches the density discipline and the one-red-only emphasis grammar.
- **Apple product pages** — Zero box-shadow depth, single permission-to-act color, sticky dual-nav pattern. YAMI takes the no-shadow interaction grammar and the one-CTA-per-screen rule.
- **Sayweee (direct competitor — Asian grocery US)** — Same category, **louder** visual language; YAMI's brief explicitly is "a calmer, more disciplined Sayweee."

---

> **For 30-second brand entry** → [`DESIGN.compact.md`](./DESIGN.compact.md)
> **For canonical token values** → [`tokens.css`](./tokens.css), DTCG sources in [`tokens/`](./tokens/)
