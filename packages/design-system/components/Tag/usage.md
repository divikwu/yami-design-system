# Tag

`Tag` is a static, full-pill label for short keywords that explain nearby
content. It is deliberately larger and more editorial than the 20px `Badge`.

## Configuration

The three configuration axes describe different concerns:

- `context="content" | "overlay"` describes whether the Tag sits in ordinary
  content or over imagery, gradients, or other visual backgrounds.
- `mode="light" | "dark"` describes the light or dark surface behind the Tag.
- `variant="filled" | "outline"` selects a filled or outlined container.

Size and image are content-presentation options, not additional color axes:

- `size="m" | "l"` selects the responsive geometry.
- `image={{ src, alt }}` adds optional leading artwork.

Filled variants use transparent color tokens: black at 4% in light mode and
white at 8% in dark mode. Outline variants remain transparent and use an 8%
black or white stroke.

## When to use

- Summarize a campaign, brand, ingredient, benefit, or content theme.
- Use `context="content"` in ordinary page or card content.
- Use `context="overlay"` over photography, gradients, or colored visuals.
- Use light mode on light backgrounds and dark mode on dark backgrounds.

## When not to use

- Product status, promotion, price, or counts → use `Badge`.
- Filters, navigation, dismissal, or any other action → use the corresponding
  interactive component such as `Button` or `Tabs`.
- Sentences or wrapping copy → use regular body text.

## Size and content

- M is 28px on mobile and PC; L is 32px on mobile and 36px on PC.
- PC starts at 1024px. Both sizes use 12px inline padding and a full-pill radius.
- With an image, the leading inset is 2px and the label gap is 4px. The image
  slot is 4px smaller than the Tag and the artwork is 8px smaller, matching the
  Search tag treatment.
- Keep labels on one line and preferably to three words or fewer.
- Use a consistent context, mode, and variant within one tag group.

```tsx
<Tag context="content" mode="light" variant="filled">
  Heartleaf Botanical
</Tag>
<Tag context="content" mode="light" variant="outline">
  Gentle Daily Formulas
</Tag>

<Tag
  context="content"
  mode="light"
  size="l"
  variant="filled"
  image={{ src: matchaImage, alt: "" }}
>
  Matcha
</Tag>

<Tag context="overlay" mode="dark" variant="filled">
  Targeted Active Care
</Tag>
<Tag context="overlay" mode="dark" variant="outline">
  Barrier Support
</Tag>
```

## Accessibility

`Tag` renders a native `span` with no focus or click behavior. Select the mode
that keeps the label legible against its actual background. Outline variants
have no fill, so their text and stroke rely directly on the surface behind them
for contrast.
