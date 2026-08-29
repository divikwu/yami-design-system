# Card — Usage

## When to use

- **Grouping related content** — product summary, account settings block, order item
- **Visual separation** — sections on a scrollable page need clear boundaries
- **Interactive surfaces** — clickable product tiles, list items → `as="a"` or `as="button"`

## When NOT to use

- **Page-level containers** — no Card on the outermost layout. Cards go inside `<main>`, not around it.
- **Small badges / chips** — use `<Badge>`, not a Card with tiny radius.
- **Modal / dialog** — use the dedicated `<Dialog>` component. Don't simulate modal depth with Card.

## Default behavior (rule: `card-no-border`)

Cards ship with:
- `--surface-primary` background (white)
- `--radius-surface-default` (12px)
- `padding='md'` (16px interior)
- **No border** (rule `card-no-border`)
- **No shadow** (Figma currently provides no elevation token source)

Opt into `bordered` only in dense listing grids where cards are tightly packed and hairline separation improves scanability.

## Interaction

Interactive cards **must not** add or bump shadow on hover. The `interactive` prop (auto-set when `as="button"` or `as="a"` + href) changes the **background** color.

Right:
```tsx
<Card as="button" interactive>   {/* hover → surface-secondary bg */}
  ...
</Card>
```

Wrong (manually attempted):
```tsx
<Card className="hover:shadow-lg">   {/* ✗ tailwind-ism, bumps shadow */}
```

## Polymorphic `as`

Preserve semantics by choosing the right element:

```tsx
<Card as="div">             {/* static info */}
<Card as="a" href="/...">   {/* navigation; full card clickable */}
<Card as="button" onClick={...}>  {/* button action (rare; prefer button inside card) */}
```

When wrapping the entire card in `<a>`, the label should be rich enough for screen readers. For card tiles with mixed actions (primary click + secondary button), use `<div>` and put buttons inside.

## Common patterns

### Product card container

```tsx
<Card padding="none">
  <img src={product.image} alt="" />
  <div style={{ padding: 'var(--space-200)' }}>
    {/* brand / title / price / button */}
  </div>
</Card>
```

`padding="none"` so the image is edge-to-edge. Inner padding is added below the image for text content.

### List item card (dense grid, bordered)

```tsx
<Card bordered padding="sm">
  <OrderSummary order={order} />
</Card>
```

### Link card — full-card clickable

```tsx
<Card as="a" href={`/product/${product.id}`} padding="none">
  {/* ... */}
</Card>
```

### Inverse surface — for dark-theme sections

```tsx
<Card surface="inverse" padding="lg">
  <h2>On-dark hero</h2>
</Card>
```

Text color auto-flips to `--text-primary-inverse`; child components using tokens inherit correctly.

## Anti-patterns

### ✗ Custom radius

```tsx
<Card style={{ borderRadius: 8 }}>    {/* breaks no-custom-radii */}
```

If you need a different radius, it's likely a different component (use `<Surface>` or propose new variant via ADR).

### ✗ Default border on product cards

```tsx
<Card bordered>                        {/* breaks card-no-border on non-dense grids */}
```

### ✗ Card shadow + interactive hover shadow

```tsx
<Card style={{ boxShadow: '0 8px 16px rgba(0,0,0,.16)' }}>  {/* not from Figma tokens */}
```

### ✗ Stacking Cards as full-page layout

```tsx
<Card>       {/* outer page */}
  <Card>     {/* section */}
    <Card>   {/* list item */}
    </Card>
  </Card>
</Card>
```

Nested cards make the layout visually noisy. Use `<section>` / `<div>` for structural grouping; reserve Card for real content cards.

## Related

- Rules `card-no-border`, `no-custom-radii`, `elevation-on-press`, `focus-style` — `../../design.md`
- Pairs frequently with `<Badge>`, `<Button>`, `<Divider>`
- Composes into `<ProductCard>` (see that component's meta.json)
