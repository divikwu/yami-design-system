# Casing, Punctuation, Numerals

Mechanical rules for the surface layer of copy.

## English casing

- **Title Case** for:
  - Section headings ("Shop by Category")
  - Button labels ("Add to Cart", not "Add to cart")
  - Navigation items ("My Orders")
  - Badge labels ("Best Seller", "Limited Time")
- **Sentence case** for:
  - Body paragraphs
  - Error / empty state messages
  - Helper text / captions
- **ALL CAPS** reserved for:
  - Very short badges (`NEW`, `SALE`)
  - Hero banner emphasis word (rare, use sparingly)
- **Never**:
  - ~~camelCase~~ or ~~snake_case~~ in user-facing copy
  - First-letter-only ("Add to cart." vs "Add to Cart")

## Chinese casing

- Chinese doesn't have case, but analogous emphasis uses:
  - 全角字号加大 for headings (instead of caps)
  - Separate line for emphasis (instead of bold-case)

## Punctuation

### English
- **Sentence end**: period (.), exclamation only for celebratory contexts ("Order placed!")
- **Lists**: no trailing period in bullet points under 4 words; use period for complete-sentence bullets
- **Quotes**: curly double quotes `"..."` in copy, straight `"..."` in code
- **Apostrophes**: curly `'`, never straight
- **Em dash**: unspaced — used for interruptions (not en dash, not hyphen pair `--`)

### Chinese
- **Full-width punctuation**: 。 ， ！ ？ ： ； "" '' 、 —— （）
- **Never mix half-width in CN context**: ~~"新春,优惠"~~ is wrong; use ~~"新春，优惠"~~

### Bilingual pairings (middle dot)
- Use center dot ` · ` (U+00B7) — not hyphen, not em dash
- Surrounded by single half-width spaces: `Coupon · 优惠券`

## Numerals

**All digits in GT Walsheim, always, everywhere**. Even inside Chinese text:

- ✅ `有 3 件商品` (3 in GT Walsheim, rest in PingFang)
- ❌ `有3件商品` (3 in PingFang — wrong unless you want arabic numerals to match CJK weight)

Implementation note: CSS uses `font-family` fallback where numerals resolve first to GT Walsheim, then PingFang for remaining CJK glyphs. Token `--font-brand` already handles this via `font-family: 'GT Walsheim', 'PingFang SC', sans-serif`.

## Prices

Format: `$12.99` (USD symbol first, no space).

Strike-through original follows:
- Inline: `$12.99  $19.99` (current red, strike grey, two spaces between)
- Stacked: `$12.99` above, `$19.99 (strike)` below, for dense lists

Use `--text-emphasis` color on the current price.

## Dates and times

- **English**: `Apr 20, 2026` or `April 20, 2026` (never `4/20/2026` — ambiguous for non-US users)
- **Chinese**: `2026年4月20日`
- **Times**: 12-hour format with `a.m.` / `p.m.` for en, 24-hour for zh-CN context

## Phone numbers

- US: `(555) 123-4567` or `555-123-4567` (no space after area code parentheses either way, be consistent per surface)
- CN: `138-1234-5678` or `+86 138 1234 5678` if international

## Addresses, names

Follow the user's own formatting (as entered). Do NOT auto-correct customer-provided data in UI display.
