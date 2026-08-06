# Bilingual CN + EN Parity

YAMI is bilingual at every surface. CN and EN are both first-class — never "primary + translation".

## Core rule

**On every customer-facing surface, both languages carry the same information with equal prominence**.

Wrong:
- 大号 English heading with tiny 中文 subtitle
- Product page in English only because "EN is universal"
- Error message in Chinese only because "the user's locale is zh-CN"

Right:
- "Coupon · 优惠券" — inline pairing with middle dot
- "立即购买 · Buy Now" — both languages same type weight
- Separate but equal lines at the top of hero banners: "Lunar New Year Sale / 新春优惠"

## Pairing patterns

### Inline with middle dot (•  or · )

Short labels, typically bilingual buttons and tabs:
- `Coupon · 优惠券`
- `Shop · 购物`
- `My Account · 我的账户`

### Stacked pairs (small labels)

Navigation and tab bars where horizontal space is tight:
- Line 1: "Home"
- Line 2: "首页"

Or compact inline: `Home / 首页`

### Side-by-side (hero banners)

Promo copy where both languages can breathe:
- "Lunar New Year Sale"
- "新春优惠"
- (same font size, one immediately below the other)

### Descriptions and long content

Short CN + short EN sections alternating, or dual columns. Never translate one into the other as a footnote.

## Numerals and punctuation

- **Numerals**: always GT Walsheim (never switch to PingFang for digits inside CN copy)
- **CN punctuation**: full-width (`，。！？`) in Chinese context
- **EN punctuation**: half-width in English context
- **Mixed strings**: retain the script's native punctuation per segment

## What NOT to do

- **Never machine-translate** one to the other and ship without human review
- **Never use Google-translate-ese**: "点击此处以继续" is not how we write, even though it's grammatically correct CN
- **Never drop one language** because the target audience is assumed bilingual — users pick the language that's easier in the moment

## Exceptions

- Technical terms that have no accepted CN: keep EN ("SKU", "API", brand names like "GT Walsheim")
- Machine-generated metadata (tracking numbers, timestamps): language-neutral
- Third-party service labels we can't control (payment provider names, shipping carriers): keep vendor's original

## Reference

Examples of in-brand bilingual copy:
- `copy-patterns.md` — signature UI copy patterns

Examples of actual i18n keys:
- `../../copy-library/ui/*.i18n.json`
