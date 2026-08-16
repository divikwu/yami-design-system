# Checkbox — Usage

Use `Checkbox` when people may select zero, one, or several independent options. Use `RadioGroup` when exactly one option must be chosen from a set.

## Anatomy

The component supplies a 20px visible square with a transparent 24px pointer target. Compose its accessible label with a native `<label htmlFor>` or an equivalent field primitive.

```tsx
<label htmlFor="save-payment">
  <Checkbox id="save-payment" name="preferences" value="save-payment" />
  Save payment method · 保存付款方式
</label>
```

## States

- Unselected uses the current theme's primary background and subtle `--border-default` outline (8% black in Light theme).
- Hover uses `--surface-secondary`.
- Selected uses `--text-primary`; it is deliberately neutral, not YAMI red.
- Disabled uses `--fill-disabled` and never CSS opacity.
- `indeterminate` is a code-side accessibility extension for parent/group selection; it is not a separate Figma variant.

Dark theme is automatic through semantic aliases. Checkbox has no `dark` prop and no `inverse` prop because the current Figma component does not define an inverse surface variant.

## Accessibility

- Base UI supplies the checkbox role, `aria-checked`, hidden native form input, and Space-key behavior.
- A visible `<label>` is preferred. If no visible label is rendered, pass `aria-label`.
- Use native `disabled`, `required`, `name`, `value`, and `form` props.
- The rendered component is 20×20px with a 4px radius. A transparent 2px extension on every side creates the 24×24px pointer target without changing layout. In option lists, wrap it with a native `<label>` so the full row can remain clickable.
