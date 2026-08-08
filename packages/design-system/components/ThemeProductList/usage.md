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
exactly two product-card widths plus one gap. At smaller widths the content
panel becomes a full-width row below the tabs, and the horizontal product rail
starts on the following row. The panel remains keyboard reachable when
`content.href` is supplied.

## Mobile surface

`mobileSurface="card"` is the default and keeps the inset rounded section. Use
`mobileSurface="plain"` to reuse ProductList's full-bleed mobile surface: square
outer corners, 16px content alignment, full-width tabs and product scrolling,
and mobile top/bottom divider support. The image-led content panel remains
stacked above the product rail in both modes. The inner product rail always uses
the `Without Background` surface, and its ProductCard children always use the
plain 0px-padding surface; `mobileSurface` changes only the outer section.

## Accessibility

The panel image is semantic and requires alt text. The overlay copy remains
selectable DOM text. When `content.href` is supplied, the panel is a native link
with the shared focus token and the surrounding products remain independently
reachable.
