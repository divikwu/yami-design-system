---
version: 0.5.0-alpha.1
updated: 2026-07-22
audience: human-designer
projection: compact
---

# YAMI — Style Reference (Compact)

> YAMI should feel like a clean, product-first Asian grocery on a high-contrast neutral canvas: dense enough for shopping, calm enough to scan.
>
> **中文**：YAMI 的界面应像干净、高效的亚洲食品电商：用白色画布承载高密度商品信息，浏览时保持清爽、有秩序。
>
> Red is reserved for operational emphasis: price, primary purchase CTA, promotion / urgency, and error states. Everything else uses near-black type, neutral structure, and measured spacing.
>
> **中文**：红色只用于操作强调：价格、主购买按钮、促销 / 紧急信息与错误状态；其余界面依靠近黑文字、中性色结构和稳定间距建立秩序。

**Surface:** web · **Category:** E-Commerce — Chinese-American Asian grocery, U.S. market · **Voice:** bilingual CN + EN, CN-primary · **Mode:** Light + Dark
**载体**：Web · **品类**：电商——华人亚洲食品，面向美国市场 · **语言**：中英双语，中文为主 · **主题**：浅色 + 深色

**EN.** YAMI uses a white canvas with near-black ink in Light, and neutral-950/900 surfaces with light ink in Dark. One operational red ramp carries emphasis. No decorative gradients; ProductList campaign transitions and skeleton shimmer are functional exceptions. No shadows that grow on hover. ProductCard media may zoom within fixed card geometry. No emoji in product UI. Numerals — every digit, every price — render in GT Walsheim; CN body text uses PingFang SC. Theme and `inverse` are independent: inverse means the opposite surface polarity inside either Theme.

**中文。** 浅色主题使用纯白画布与近黑文字；深色主题使用 neutral-950/900 表面与浅色文字。操作红色阶承担强调语义。主题与 `inverse` 相互独立：inverse 表示当前主题内的反向表面，而不是深色模式。无渐变、悬浮不放大阴影、产品 UI 内不用 emoji。**所有数字都用 GT Walsheim**——价格、计数、SKU 无一例外；中文正文用苹方 (PingFang SC)。

---

## Color — two reds, never mixed

| Slot | Hex | Use |
|---|---|---|
| Brand red | `#FF0000` | **Logo only.** Brand mark, primary brand signals. |
| Operational red (red.500) | `#E00000` | Emphasis CTA (Buy Now / Add to Cart), promotion / urgency, error. |
| Ink | `rgba(0,0,0,0.87)` | All text, primary buttons, focus ring. |
| Canvas | `#FFFFFF` | Page + card surface (no separation needed). |
| Cream wash | `#FBF1EF` (`--brand-tertiary`) | Branded promotional backgrounds; not product-image placeholders. |

Beyond these five anchors: a 50→950 neutral ramp (`#FAFAFA → #0A0A0A`) for chrome, and a 6-color **badge-only** palette (red / blue / green / purple / yellow / neutral) for status and promo tags. Decorative blue / green / purple / yellow is **not allowed** outside that palette.

---

## Typography — 4 levels, GT Walsheim numerals

- **GT Walsheim** — every digit, every price, every Latin character. Weights 400 / 500 / 700.
- **PingFang SC** (iOS / web) / **Noto Sans SC** (Android) — CJK body. Mixed strings keep digits and Latin in GT Walsheim.
- **Max 4 levels per page**: display / heading / body / caption (or equivalent). If you need a 5th, the page has a hierarchy problem.

Mini scale (mobile baseline → ≥1440 desktop): display 32 → 40, heading 18 → 20, body 14, caption 12 → 14, **price 20 → 24**.

Price format: `$12.99` (USD-leading). Discount: `$12.99  $19.99` (current red, original struck-through grey).

---

## Spacing, radii, depth

- **Base unit** 8px. Scale `4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80`.
- **5 semantic radii — nothing else**: tag `4px`, component `8px`, emphasis-button `8px`, surface (card / modal) `12px`, pill button `9999px`. Never raw values, never primitive `--radius-sm/md/lg/xl` (they exist but are not consumed by components).
- **No local elevation scale.** Figma provides no YAMI elevation tokens; hover / press never changes `box-shadow`, only `background-color`.

---

## Components — 9 primitives, 2 composites

| Component | Variants | Note |
|---|---|---|
| **Button** | emphasis / primary / secondary / tertiary × sm/md/lg | Emphasis is **rate-limited to 1 per screen**. Pill for primary, 8px-rounded square for emphasis. |
| **Tabs** | primary / secondary / tertiary | Responsive tab navigation; Theme and inverse surface polarity remain independent. |
| **Card** | padding × surface primary/secondary/inverse | **No border and no shadow by default.** Interactive cards change `background-color`, not shadow. |
| **Badge** | 6 colors × primary (solid) / secondary (tinted) × sm/md | Sole place blue/green/purple/yellow is allowed. Max 2 badges per ProductCard. |
| **Input** | default / focus / error / disabled | 2px black focus ring at 2px offset. Never blue. |
| **Checkbox** | default / hover / selected / disabled / mixed | Neutral multi-select control. Selected state is ink, never red. |
| **RadioGroup** | default / hover / selected / disabled | Exclusive selection with arrow-key navigation. Selected state is ink, never red. |
| **Divider** | default / subtle / emphasis | 3 strengths only: `8% / 29% / 87%` black. |
| **AspectRatio** | required numeric ratio | Style-neutral geometry primitive for responsive media. |
| **ProductCard** *(composite)* | internal Media + Summary + Offer; composes Card + AspectRatio + Badge + ProductCardAddButton | image overlays · identity · behavioral signals · price/campaign/countdown. Exactly 4 type levels. |
| **ProductList** *(composite)* | standard / themed / atmospheric × rail / waterfall | Data-driven responsive collection; layout forces a consistent ProductCard presentation and owns tabs, rail controls, load more, and layout-specific skeletons. |

---

## Hard rules at a glance

These have validators; violations fail `validate_design`. Full reasoning lives in [DESIGN.md](./DESIGN.md):

1. **red-usage** — two reds, never interchanged.
2. **no-gradient** — exceptions are ProductList campaign artwork transitions, skeleton shimmer, and modal scrim `rgba(0,0,0,0.68)`.
3. **semantic-color-only** — non-red hues live in badge palette only.
4. **numerals-font** — every digit in GT Walsheim.
5. **type-hierarchy** — max 4 levels per page.
6. **no-custom-radii** — use the 5 semantic slots, no raw values like `8.5px` / `16px` / `50%`, no primitive `--radius-sm/md/lg/xl`.
7. **elevation-on-press** — color shift, not shadow.
8. **no-opacity-disabled** — use `--button-disabled` + `--text-disabled`, never CSS `opacity`.
9. **focus-style** — 2px black outline, 2px offset.
10. **border-strength** — 3 strengths only (default 8% / focus 87% / attention red).
11. **emphasis-limit** — 1 emphasis button per screen.
12. **card-no-border** — opt-in border only for dense grids.
13. **tap-target** — iOS 44pt / Android 48dp minimum.
14. **no-emoji** — none in product UI (UGC excepted).
15. **no-decorative-media** — no glassmorphism, gradients, hand-drawn illustration, pastels, alert-bar cards.
16. **token-exists** — every `var(--x)` reference must exist in `tokens.css`.

---

## Three don'ts that get violated the most

- **Don't** use brand red `#FF0000` on a button. The button takes `#E00000` (operational red).
- **Don't** shrink a disabled button via `opacity`. Use `--button-disabled` for bg, `--text-disabled` for label.
- **Don't** add card shadow on hover. Move to `--surface-secondary` instead.

---

## Reference brands

- **Lawson / Don Quijote (Japan grocery)** — dense info, hardworking type, single sale red.
- **MUJI** — white-canvas-with-photography, restrained type ramp, no decorative color.
- **Sayweee** — same Asian-grocery US category, but louder; YAMI's brief is "calmer Sayweee."
- **Apple product pages** — for the "one CTA per screen + zero box-shadow" depth grammar.

---

> **Want the full token table, semantic alias map, motion spec, agent prompt guide, and validator-linked rule source-of-truth?** See [DESIGN.md](./DESIGN.md) — the comprehensive spec (v0.2.0-alpha.2 merged the prior `DESIGN.extended.md` and rules-only files into one).
