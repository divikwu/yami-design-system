# Badge — Usage

## When to use

- **Product status** — NEW, BESTSELLER, OUT OF STOCK
- **Promotion/sale** — SALE, –30%, FLASH DEAL, 限时 Limited
- **Tags** — categories, filters, cuisine labels (softer use → `emphasis="secondary"`)
- **Counts** — notification counts on icons, cart quantity

## When NOT to use

- **Interactive elements** → use `<Button size="sm">` instead. Badge is a display primitive with no click affordance.
- **Long sentences** → if content is > 15 chars, it's probably not a badge. Use `<Alert>` or inline text.
- **Emoji-only content** → breaks `no-emoji` rule.

## Colors

Map to semantic meaning, not decoration. **Red is reserved for promotion/urgency** (rule: `red-usage`).

| Color | Primary use | Example |
|---|---|---|
| `red` | Promotion, sale, urgency | `SALE`, `–30%`, `限时 Limited` |
| `blue` | Information, neutral tag | `NEW`, `BESTSELLER`, `Official` |
| `green` | Success, positive state | `IN STOCK`, `AUTHENTIC`, `FAST SHIP` |
| `purple` | Premium, featured | `PREMIUM`, `EDITOR'S PICK` |
| `yellow` | Warning, attention | `LOW STOCK`, `ENDING SOON` |
| `neutral` | Default tag, category | `Snacks`, `Beauty`, category pills |

### ⚠️ `red-usage` rule

```tsx
<Badge color="red">–30%</Badge>             ✓ promotion
<Badge color="red">NEW</Badge>              ✗ use blue or neutral for "new"
<Badge color="red">categories</Badge>       ✗ use neutral
```

Red is a scarce visual resource. Using it for non-promotional state dilutes its meaning at the places where it matters (checkout CTA, final price).

## Emphasis

| Emphasis | When to use |
|---|---|
| `primary` | Attention-grabbing, sparse use (1-2 per product card), solid background |
| `secondary` | Denser contexts (filter lists, tag clouds), softer tinted look |

## Type — Figma semantic shortcut

`type` is a shortcut that mirrors Figma's named Badge variants. Each value resolves to a (color, emphasis) preset matching the Figma design.

The plain tinted shortcuts `sale`, `low-price`, `discount`, `new`, and `hot` use `--text-primary` neutral ink. `exclusive`, `choice`, and `best-sellers` retain their color-specific foregrounds.

| `type` | Resolves to | Figma Type | Typical text |
|---|---|---|---|
| `price` | neutral · primary | `Type=Price` | $9.99 |
| `sale` | red · secondary | `Type=Sale` | SALE |
| `low-price` | red · secondary | `Type=Low price` | Low Price |
| `discount` | red · secondary | `Type=Discount` | –30% OFF |
| `new` | purple · secondary | `Type=New` | NEW |
| `hot` | purple · secondary | `Type=Hot` | HOT |
| `exclusive` | purple · secondary | `Type=Exclusive` | Exclusive · auto-renders purple flag prefix from [`assets/badges/flag-cap-purple.svg`](../../assets/badges/flag-cap-purple.svg) |
| `choice` | blue · secondary | `Type=Choice` | Choice · auto-renders blue flag prefix from [`assets/badges/flag-cap-blue.svg`](../../assets/badges/flag-cap-blue.svg) |
| `best-sellers` | yellow · secondary | `Type=Best Sellers` | Best Sellers |

```tsx
<Badge type="sale">SALE</Badge>                  {/* same as color="red" emphasis="secondary" */}
<Badge type="low-price">Low Price</Badge>
```

Explicit `color` / `emphasis` win over `type` — pass both when you need a one-off override without changing your type vocabulary.

## Sizes

Badge has one responsive size and type scale: 20px height with `12px / 16px` text on Mobile/Tablet, and 24px height with `14px / 20px` text on PC (`min-width: 1024px`). All Badge text uses `font-weight: 400`, matching the Figma text style.

## Common patterns

### Product card — single primary badge

```tsx
<div className="product-card">
  <Badge color="red">SALE</Badge>
  {/* …rest of card… */}
</div>
```

### Multi-state product badge stack

Max 2 badges per card. If there are more signals, rotate — don't stack all at once.

```tsx
<div className="badge-stack">
  <Badge color="red">–30%</Badge>
  <Badge color="blue" emphasis="secondary">NEW</Badge>
</div>
```

### Filter pill row (secondary emphasis)

```tsx
{categories.map(c => (
  <Badge key={c} color="neutral" emphasis="secondary">{c}</Badge>
))}
```

### Cart quantity on icon

```tsx
<button aria-label="Cart">
  <CartIcon />
  {count > 0 && <Badge color="red">{count}</Badge>}
</button>
```

## Anti-patterns

### ✗ Emoji in badge text

```tsx
<Badge>🔥 HOT</Badge>              {/* breaks no-emoji */}
```

Use the badge text alone; do not create ad-hoc icon-bearing badge types.

### ✗ Decorative red

```tsx
<Badge color="red">Drinks</Badge>   {/* breaks red-usage */}
```

### ✗ Too many badges on one card

```tsx
<Badge color="red">SALE</Badge>
<Badge color="blue">NEW</Badge>
<Badge color="yellow">LIMITED</Badge>
<Badge color="purple">PREMIUM</Badge>
<Badge color="green">AUTHENTIC</Badge>
```

Maximum 2 badges per card. Every badge claims visual attention; overuse flattens hierarchy.

### ✗ Interactive badges

```tsx
<Badge onClick={...}>Remove</Badge>   {/* not interactive — use Button */}
```

## Related

- Rule `red-usage` / `semantic-color-only` / `no-emoji` / `numerals-font` — `../../design.md`
- Token reference — `meta.json` → `tokens[]`
- Copy reference — `labels.meta` / `labels.sale` in `../../../copy-library/ui/labels.i18n.json`
