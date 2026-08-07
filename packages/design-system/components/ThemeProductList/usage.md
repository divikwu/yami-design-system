# ThemeProductList

An editorial product rail that reserves the first two product-card slots for
an image-led theme link, then continues with the shared ProductCard rail.

## When to use

Use it when a themed landing page needs a short visual entry point beside a
curated product collection. The component keeps the ProductList heading, tabs,
rail navigation and quick-add behavior, while the content panel owns its image
alt text, contrast overlay and description.

## Content

- Provide a meaningful `content.image.alt` for the theme artwork.
- Keep `content.title` short enough for the bottom overlay and use the
  description for one concise supporting sentence.
- Add `content.href` when the panel should link to the theme destination.
- Reuse the ProductList fixture catalogue or pass the same product data shape.

## Responsive behavior

At desktop widths the inner list is capped at 1440px and the content panel is
exactly two product-card widths plus one gap. At smaller widths the panel keeps
that two-slot relationship inside the horizontal rail and remains keyboard
reachable when `content.href` is supplied.

## Accessibility

The panel image is semantic and requires alt text. The overlay copy remains
selectable DOM text. When `content.href` is supplied, the panel is a native link
with the shared focus token and the surrounding products remain independently
reachable.
