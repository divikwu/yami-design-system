# HeroBanner — Usage

## When to use

Use `HeroBanner` for the homepage campaign rail shown directly below primary
navigation. The same component owns both responsive presentations:

- Below `1024px`, cards are fixed at `320 × 360`, separated by `8px`, and use
  native horizontal scrolling with `8px` page margins.
- From `1024px`, cards retain the `8:9` ratio and fill two, three, or four
  columns. The desktop controls page one complete visible group at a time.

```tsx
<HeroBanner
  items={promotions}
  ariaLabel="Featured promotions"
  previousLabel="Previous promotions"
  nextLabel="Next promotions"
/>
```

Do not create separate PC and Mobile components. Responsive CSS changes card
count and interaction without changing the content model or DOM order.

## Section divider

`HeroBanner` has no divider by default. Set `dividerPosition` to `top` or
`bottom` when the page composition needs a section boundary; choose `none` to
remove it. `dividerVariant="gray"` uses the existing 1px structural line, while
`dividerVariant="black"` uses the theme-aware 2px emphasis line.
Divider configuration is desktop-only and is ignored below 1024px.

```tsx
<HeroBanner
  items={promotions}
  dividerPosition="bottom"
  dividerVariant="black"
/>
```

## Card subcomponents

`HeroBanner` selects one of four public card subcomponents from the supplied
content:

- `HeroBannerImageOnlyCard` — campaign image only.
- `HeroBannerImageTextCard` — image with title and optional description.
- `HeroBannerImageTextProductsCard` — image, copy, and up to four products.
- `HeroBannerProductsOnlyCard` — title and products without a campaign image or description.

Every item needs a stable `id` and destination `href`. Image variants require
semantic campaign alt text. Product-only variants require a title and at least
one product.

```tsx
{
  id: "street-food",
  href: "/campaigns/street-food",
  image: {
    src: streetFoodArtwork,
    alt: "Asian street food and drinks",
  },
  title: "Midnight Street Food",
  description: "Explore Asian night bites",
  backgroundColor: "#FFD4B4",
  products: [
    { src: bottledTea, alt: "Bottled green tea" },
    { src: spicySnack, alt: "Spicy snack" },
    { src: cornChips, alt: "Corn chips" },
  ],
}
```

One to three thumbnails use the horizontal strip from Figma. Four thumbnails
use the `2 × 2` product grid. More than four are intentionally ignored; add
another campaign item instead.

An image-only item remains a normal campaign link. Its image `alt` becomes the
link's accessible name, so describe the destination rather than visual texture.
Product-only cards do not render an empty image placeholder; their campaign
surface and product tiles fill the full card.

## Interaction

Mobile uses native touch scrolling and scroll snap. Desktop arrow buttons use
the same `36px` YAMI rail-navigation control as ProductList and disable at the
first/last page. `prefers-reduced-motion` changes programmatic paging from
smooth to immediate.

The desktop progress track reports how many banners have been revealed through
the current viewport against the total banner count. A four-column rail starts
at `4 / 12`, and the final viewport ends at `12 / 12`. Localize `ariaLabel`,
`previousLabel`, and `nextLabel`.

## Campaign color

Image-and-copy cards sample the dominant color from the artwork's lower edge
after the image loads. The component uses that color for both the content
surface and the functional `24px` image-to-surface fade required by the Figma
component. `backgroundColor` remains the loading and cross-origin fallback; it
is campaign content supplied by the CMS, not a reusable design token.

Copy color is derived from the sampled campaign surface and does not follow the
page's light or dark theme. Bright artwork uses fixed black copy. Dark artwork
uses fixed white copy; when necessary, the sampled surface is darkened just
enough to retain at least `4.5:1` contrast for body-size text.

## Related

- Composes: `<Button>`
- PC Figma: `3053:7724`
- Mobile Figma: `3056:37111`
- Mobile page placement: `6962:102970`
