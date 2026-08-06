# Divider — Usage

## When to use

- **Between list items** when a card wrapper is overkill
- **Between sections** of a form or settings page
- **Vertical separation** inside dense toolbar rows or inline info strings

## When NOT to use

- **Between cards** — spacing alone (e.g. `gap: var(--space-300)`) reads cleaner
- **Decorative** — dividers are semantic (`<hr>` = separator). Don't use for visual texture.
- **Thick separation** — reach for a new Card or section, not a thicker line. Thickness is fixed at 1px.

## Strength selection (rule: `border-strength`)

Only 3 tiers; pick by contrast need, not by personal taste.

| Strength | Opacity | Use when |
|---|---|---|
| `default` | 8% | **Default.** Between list items, form field groups |
| `subtle` | 29% | Heavier context — dividing subsections inside a Card |
| `emphasis` | 87% | Rare. Headers of dense data tables, strong section breaks |

### Inverse variants

On the active theme's opposite-polarity surface (`surface="inverse"` Card), use the `-inverse` suffix. This surface is dark in Light and light in Dark:
`default-inverse`, `subtle-inverse`, `emphasis-inverse`. Same opacity, flipped base color.

## Orientation

```tsx
<Divider orientation="horizontal" />    {/* renders <hr> */}
<Divider orientation="vertical" />      {/* renders <span role="separator"> */}
```

Vertical dividers need a flex / grid parent with explicit height (they `align-self: stretch` to container).

## Common patterns

### List items with inline dividers

```tsx
<ul>
  {orders.map((o, i) => (
    <li key={o.id}>
      {i > 0 && <Divider />}
      <OrderRow {...o} />
    </li>
  ))}
</ul>
```

### Vertical divider in inline meta strip

```tsx
<div style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-100)' }}>
  <span>4.8 ★</span>
  <Divider orientation="vertical" />
  <span>1.2k reviews</span>
  <Divider orientation="vertical" />
  <span>Ships free</span>
</div>
```

### Settings page sections

```tsx
<section>
  <h2>Profile</h2>
  {/* fields */}
</section>
<Divider strength="subtle" />
<section>
  <h2>Notifications</h2>
  {/* fields */}
</section>
```

## Anti-patterns

### ✗ Arbitrary opacity

```tsx
<div style={{ borderTop: '1px solid rgba(0,0,0,0.15)' }} />   {/* breaks border-strength */}
```

Use `<Divider strength="default" />` (8%) or `<Divider strength="subtle" />` (29%). If neither fits, the UI density is off.

### ✗ Thick dividers

```css
.my-divider { border-top: 2px solid ...; }   /* don't — bump to section/Card if heavier */
```

### ✗ Decorative dashed / dotted lines

No dashed / dotted divider styling. Use solid only — matches elsewhere in the system.

## Related

- Rule `border-strength` — `../../design.md`
- Token reference — `--divider-*` family in `../../tokens/semantic/colors.tokens.json`
