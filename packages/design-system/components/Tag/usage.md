# Tag

`Tag` is a static, full-pill label for short keywords that explain nearby
content. It is deliberately larger and more editorial than the 20px `Badge`.

## When to use

- Summarize a campaign, brand, ingredient, benefit, or content theme.
- Overlay short keywords on photography or other mixed backgrounds.
- Use `dark` or `dark-outline` on light or mixed imagery.
- Use `light` or `light-outline` on dark imagery.
- Choose a filled tone for stronger separation and an outline tone for a lighter
  visual presence.

## When not to use

- Product status, promotion, price, or counts → use `Badge`.
- Filters, navigation, dismissal, or any other action → use the corresponding
  interactive component such as `Button` or `Tabs`.
- Sentences or wrapping copy → use regular body text.

## Size and content

- Fixed 28px height, 12px inline padding, and a full-pill radius.
- Keep labels on one line and preferably to three words or fewer.
- Use a consistent tone within one tag group.

```tsx
<Tag tone="dark">Heartleaf Botanical</Tag>
<Tag tone="light">Targeted Active Care</Tag>
<Tag tone="dark-outline">Gentle Daily Formulas</Tag>
<Tag tone="light-outline">Barrier Support</Tag>
```

## Accessibility

`Tag` renders a native `span` with no focus or click behavior. Choose the tone
that keeps the label legible against its actual background. Outline tones have
no fill, so both their text and 1px stroke rely directly on the surface behind
them for contrast.
