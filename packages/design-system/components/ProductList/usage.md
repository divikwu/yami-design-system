# ProductList — Usage

## When to use

Use `ProductList` for a titled, data-driven collection of commerce products:

- Homepage recommendation and campaign rails
- Waterfall collections with a load-more action

Use a dedicated cart, order, or comparison component when rows need quantity,
fulfillment, or multi-product selection controls.

## Layouts

`ProductList` keeps every card in one collection visually consistent. The
component chooses the matching `ProductCard` presentation; callers cannot mix
presentations inside a list.

| `layout` | Card presentation | Behavior |
|---|---|---|
| `rail` | `rich` | Mobile swipe rail; paginated PC rail with 4–8 cards |
| `waterfall` | `rich` | Two columns on mobile, responsive grid on desktop |

```tsx
<ProductList
  title="精选商品"
  products={products}
  layout="rail"
  onAddToCart={(productId) => addToCart(productId)}
/>
```

Each product must have a stable `id`; all remaining fields are standard
`ProductCard` data. The list passes the clicked product ID to
`onAddToCart` while preserving ProductCard's independent navigation links.

## Section divider

The list keeps its existing top gray divider by default. `dividerPosition`
accepts `top`, `bottom`, or `none`. `dividerVariant="gray"` renders the 1px
structural line; `dividerVariant="black"` renders the theme-aware 2px emphasis
line. Desktop always honors this configuration. On mobile it is available only
when `mobileSurface="plain"`; the default card surface ignores mobile dividers.

Themed and atmospheric desktop lists are intended to sit inside an outer frame
with `32px` vertical and `48px` horizontal padding. The component keeps its
own denser internal content padding; consumers should apply the outer frame at
the page or composition layer. Themed rails use the shared
`HorizontalScrollList` card surface; standard and atmospheric rails retain the
plain surface.

```tsx
<ProductList
  title="New Arrivals"
  products={products}
  dividerPosition="bottom"
  dividerVariant="black"
/>
```

## Mobile surface

`mobileSurface="card"` is the default and preserves the inset rounded section.
Use `mobileSurface="plain"` when the collection needs to meet both screen edges.
The plain surface removes the outer 8px inset, removes the section radius, and
increases the component content padding from 8px to 16px. It also enables the
same top/bottom divider configuration used on desktop. In the waterfall layout,
the card surface keeps an 8px grid gap; the plain surface uses a 16px grid gap
and square outer corners.

```tsx
<ProductList
  title="New Arrivals"
  products={products}
  mobileSurface="plain"
  dividerPosition="bottom"
  dividerVariant="black"
/>
```

## Tabs

Tabs reuse the YAMI tertiary pill treatment. Selection is reported to the
caller; `ProductList` does not filter products internally.

```tsx
<ProductList
  title="New Arrivals"
  products={visibleProducts}
  tabs={[
    { value: "all", label: "All" },
    { value: "beauty", label: "Beauty" },
    { value: "sold-out", label: "Sold out", disabled: true },
  ]}
  value={category}
  onValueChange={setCategory}
/>
```

Omit `value` and use `defaultValue` for uncontrolled selection.

## Appearance

- `standard` uses the primary page surface.
- `themed` requires `banner={{ src, alt }}`. Add `mobileSrc` when the campaign
  has mobile-specific art direction; it is used below 1024px and falls back to
  `src` when omitted. Write alt text that communicates the shared campaign
  represented by both images. Add a precomputed
  `backgroundColor` to carry the banner's dominant color into the content
  surface. When `mobileSrc` has a different bottom-edge color, add
  `mobileBackgroundColor`; it is used below 1024px and falls back to
  `backgroundColor` when omitted. The component falls back to
  `--surface-secondary` when neither color is provided.
- `atmospheric` accepts a precomputed bottom-edge `backgroundColor` for the
  campaign surface and image-to-surface gradient, `backgroundImage` for
  desktop decorative artwork, and an optional
  `backgroundImageMobile` for mobile and tablet. The mobile image falls back
  to `backgroundImage` when omitted. Decorative artwork adds no duplicate
  accessible image content.

```tsx
<ProductList
  title="Summer Refresh"
  products={products}
  appearance="themed"
  banner={{
    src: campaignBanner,
    mobileSrc: campaignBannerMobile,
    alt: "Summer Refresh beauty event",
    backgroundColor: "#E4E5F0",
    mobileBackgroundColor: "#F9EAF3",
  }}
/>
```

Extract `backgroundColor` and `mobileBackgroundColor` when campaign artwork is
uploaded or built. Avoid runtime canvas sampling: remote image CORS, loading
latency, and hydration can otherwise make the surface color unreliable.

The themed banner uses the same color for a decorative overlay that fades from
transparent at the top to fully opaque at the bottom, visually connecting the
artwork with the content surface.

```tsx
<ProductList
  title="Popular This Week"
  products={products}
  appearance="atmospheric"
  backgroundColor="#FFF8EB"
  backgroundImage={atmosphericDesktop}
  backgroundImageMobile={atmosphericMobile}
/>
```

Keep text and product cards readable over atmospheric artwork. The component
places cards on `--surface-primary`; artwork should remain low contrast. Sample
the bottom strip of each campaign asset when preparing it and use that color
for `backgroundColor`. The component fades the lower half of the responsive
artwork into the supplied color.

## Loading

Set `loading` to hide product data and render a layout-specific skeleton. The
section exposes `aria-busy`; `loadingLabel` is announced while the visual
skeleton remains hidden from assistive technology.

```tsx
<ProductList
  title="精选商品"
  products={[]}
  layout="waterfall"
  loading
  loadingLabel="Loading products"
  skeletonCount={4}
/>
```

Skeleton geometry follows the actual layout rather than the Figma skeleton
specimen. Shimmer is disabled when reduced motion is requested.

## Rail behavior

On mobile, Rail uses native horizontal overflow and scroll snap. On PC
(`1024px`–`1920px`), overflow is clipped and products can only be paged with
the arrow buttons. The visible count increases with viewport width: four cards
at `1024px`, then five, six, and seven cards, up to eight cards at `1920px`.
Each arrow advances one complete visible page and disables at its boundary.

## Waterfall load more

The load-more action only appears when `layout="waterfall"` and `hasMore` are
both set.

```tsx
<ProductList
  title="More to Explore"
  products={products}
  layout="waterfall"
  hasMore={pageInfo.hasNextPage}
  onLoadMore={loadNextPage}
/>
```

## Accessibility

- The section is labelled by its visible heading.
- Product containers use `list` / `listitem` semantics.
- Banner alt text is required for themed appearance.
- Localize `viewAllLabel`, `loadMoreLabel`, and `loadingLabel`.
- Product links and quick-add buttons remain independent controls.

## Related

- Composes: `<ProductCard>`, `<Tabs>`, `<Button>`
- Product anatomy and badge rules: `../ProductCard/usage.md`
- Rules: `red-usage`, `tap-target`, `focus-style`, `no-custom-radii`
