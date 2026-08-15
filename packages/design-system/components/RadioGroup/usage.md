# RadioGroup — Usage

Use `RadioGroup` when a person must choose one value from two or more mutually exclusive options. Use `Checkbox` for independent or multi-select choices.

```tsx
<RadioGroup name="payment-method" defaultValue="card">
  <label>
    <RadioGroupItem value="card" />
    Card · 银行卡
  </label>
  <label>
    <RadioGroupItem value="apple-pay" />
    Apple Pay
  </label>
</RadioGroup>
```

## Anatomy and states

The individual Radio Button is a 20px outer circle with a 12px selected dot and a transparent 24px pointer target. Code adds `RadioGroup` because exclusive selection and roving keyboard focus are group behavior.

- Unselected uses the current theme's primary background and subtle `--border-default` outline (8% black in Light theme).
- Hover uses `--surface-secondary`.
- Selected outline and dot use `--text-primary`; selection is deliberately neutral, not YAMI red.
- Disabled uses `--fill-disabled`, not CSS opacity.

Dark theme is automatic through semantic aliases. RadioGroup has no `dark` prop and no `inverse` prop because the current Figma component does not define an inverse variant.

## Accessibility

- Base UI supplies `radiogroup`/`radio` roles, exclusive state, native form inputs, and roving focus.
- Arrow keys move focus and selection; Tab enters/leaves the group.
- Give the group an accessible name with a visible field legend or `aria-label`.
- Wrap each default `RadioGroupItem` in a visible `<label>`, or pass `aria-label` when no visible label is rendered. Use Base UI's native-button pattern for sibling labels.
- Put `name`, `required`, `value`, `defaultValue`, `onValueChange`, and group-level `disabled` on `RadioGroup`.
- The rendered component is 20×20px. A transparent 2px extension on every side creates the 24×24px pointer target without changing layout. In option lists, the enclosing native `<label>` keeps the full row clickable.
