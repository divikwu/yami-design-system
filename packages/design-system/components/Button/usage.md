# Button — Usage

## When to use

Use `<Button>` for any interactive action that is **not navigation between pages**. Form submission, add-to-cart, confirmation dialogs, modal actions, filter chips — all `<Button>`.

## When NOT to use

- **Navigation to a different URL** → use `<a>` with button-like styling, not a Button. Semantic `<a>` survives JS-off, supports middle-click, and screen readers announce it correctly.
- **Inline text action inside a sentence** → use `<a>` styled as `.link`. ("Have an account? <a>Sign in</a>.")
- **Toggling a boolean state** → consider `<Switch>` or `<Checkbox>` instead. Button doesn't convey on/off to assistive tech.

## Variants

| Variant | Background | Shape | When to use |
|---|---|---|---|
| `emphasis` | `--button-emphasis` (operational red) + `--text-on-emphasis` (white) | 8px | Buy Now / Add to Cart / Place Order — the **one** high-priority CTA on the screen |
| `primary` | `--button-primary` (black) | pill | Generic primary actions, form submits, non-emphasis CTAs |
| `secondary` | `--button-secondary` (grey) | pill | Secondary actions paired with a primary (Cancel / Back / Skip) |
| `tertiary` | `--button-tertiary` (white) | pill | Low-emphasis actions; lightweight card-level actions |

### ⚠️ `emphasis-limit` rule (design.md)

**Max one emphasis button per rendered screen.** Multiple emphasis buttons compete for attention and destroy the CTA hierarchy. If you need two prominent actions, make the primary action `emphasis` and the secondary action `primary` or `secondary`.

Right:
```tsx
<Button variant="emphasis">Place Order</Button>
<Button variant="secondary">Review Cart</Button>
```

Wrong — two red emphasis buttons on the same screen:
```tsx
<Button variant="emphasis">Buy Now</Button>
<Button variant="emphasis">Apply Coupon</Button>  {/* ✗ breaks emphasis-limit */}
```

## Sizes

| Size | Mobile | Desktop (≥1024px) | Use when |
|---|---|---|---|
| `sm` | 32px | 32px | Inline table actions, filter chips, compact contexts. **Icon form only** in Figma; YAMI product extends it to text buttons. |
| `md` | 40px | 40px | **Default.** Most buttons in the product |
| `lg` | 48px | **56px** (text) · 48px (icon) | Hero CTAs, mobile primary action at the bottom of the screen, full-width sheet actions. Text-bearing `lg` bumps to 56 at ≥1024px to match PC Figma; icon-only `lg` stays 48×48. |

All sizes meet the `tap-target` rule (≥44pt iOS / 48dp Android) via internal padding even when visible height is shorter.

## Form

The `form` prop mirrors the Figma Form axis (Mobile v2 + PC v2). It controls layout, not visual weight.

| Form | Layout | When to use |
|---|---|---|
| `inline` | Content-width, sits in a row | **Default.** Most buttons |
| `full` | Stretches to container width; always uses `--radius-sm` (4px) | Page-level CTAs (checkout, sheet footer, mobile bottom-fixed action) |
| `icon` | Square (1:1), no label | Compact actions where the icon alone communicates the verb. **Requires `aria-label`.** |

```tsx
<Button form="full" variant="emphasis">Checkout</Button>
<Button form="icon" variant="secondary" aria-label="Favorite"><HeartIcon /></Button>
```

The legacy booleans `fullWidth` and `iconOnly` are `@deprecated` but still work — they map to `form="full"` / `form="icon"`. New code should use `form`.

## Inverse

`inverse={true}` swaps every variant to its `*-inverse` token alias for placement on the active theme's opposite-polarity surface (`--surface-inverse`). In Light this surface is dark; in Dark it is light. The focus ring follows `--border-focus-inverse`.

```tsx
<div style={{ background: 'var(--surface-inverse)', padding: 'var(--space-300)' }}>
  <Button variant="emphasis" inverse>Place Order</Button>
  <Button variant="secondary" inverse>Cancel</Button>
</div>
```

Inverse mirrors Figma's `<Form> - Inverse` component sets — every Form × Hierarchy has a matching dark-surface variant.

## Icons

Prefer SVGs from `@ds/icons/` (under `assets/icons/`). They're normalized to use `fill="currentColor"` so they inherit the button's text color automatically. See `../../assets/icons/icons.meta.json`.

```tsx
import CartAdd from '@ds/icons/action/cart-add.svg?component'
// …
<Button variant="emphasis" leftIcon={<CartAdd />}>Add to Cart</Button>
```

Icon-only buttons (`form="icon"`) **require** `aria-label`:

```tsx
<Button form="icon" aria-label="Close dialog">
  <Close />
</Button>
```

Without `aria-label`, screen readers announce "button" with no context. The component warns in dev mode.

## Loading state

Set `loading` when the action is in-flight. The button:
1. Hides its visual content (icons + label) behind a centered spinner
2. Announces `aria-busy="true"` to screen readers
3. Stays focusable but click-disabled

```tsx
const [saving, setSaving] = useState(false)
// …
<Button loading={saving} onClick={async () => {
  setSaving(true)
  await save()
  setSaving(false)
}}>Save</Button>
```

Don't layer `loading={true} disabled={true}` — loading is enough, and makes the intent clearer.

## Disabled state

Uses `--button-disabled` background + `--text-disabled` foreground. **Never** use CSS `opacity` to imply disabled (rule: `no-opacity-disabled`) — it wrecks contrast unpredictably and may fail WCAG AA with dark backgrounds.

```tsx
<Button disabled={!canSubmit}>Submit</Button>
```

## Common patterns

### Checkout CTA row (mobile bottom sheet)

```tsx
<div style={{ display: 'flex', gap: 'var(--space-200)' }}>
  <Button variant="secondary" size="lg" form="full">Continue Shopping</Button>
  <Button variant="emphasis" size="lg" form="full">Place Order</Button>
</div>
```

### Form actions (modal / sheet footer)

```tsx
<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-100)' }}>
  <Button variant="secondary">Cancel</Button>
  <Button variant="primary" htmlType="submit">Save</Button>
</div>
```

### Product card "+" button

Small icon-only pill for compact product cards:

```tsx
<Button variant="primary" size="sm" form="icon" aria-label="Add to cart">
  <Add />
</Button>
```

## Anti-patterns

### ✗ Custom radii

```tsx
<Button style={{ borderRadius: 16 }}>...</Button>   {/* breaks no-custom-radii */}
```

Use variants. If none fit, that's an ADR + design conversation, not an inline override.

### ✗ Full-width `emphasis` buttons stacked vertically

```tsx
<Button variant="emphasis" form="full">Apply</Button>
<Button variant="emphasis" form="full">Continue</Button>   {/* two emphasis CTAs */}
```

### ✗ Emoji inside buttons

```tsx
<Button>🛒 Add to Cart</Button>   {/* breaks no-emoji rule */}
```

Use an icon component from `@ds/icons/action/cart-add.svg` as `leftIcon`.

### ✗ Button inside Button

Nested interactive elements — confuses focus order and screen readers. Split into sibling buttons, or rethink the layout.

## Related

- Design rules: `design.md` (emphasis-limit, tap-target, no-opacity-disabled, focus-style, no-custom-radii, no-emoji)
- Tokens referenced: `meta.json` → `tokens[]`
- Icons: `../../assets/icons/icons.meta.json`
- Copy: `../../../copy-library/ui/buttons.i18n.json` (canonical button labels in CN + EN)
