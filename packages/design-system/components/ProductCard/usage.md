# ProductCard — Usage

## When to use

- **Product grids** on Home / Category / Search result pages
- **Horizontal scroll rails** — "Just for You", "Today's Deals", cross-sell carousels
- **PDP recommendations** — "Customers also bought" strips

## When NOT to use

- **Cart line items** — those have quantity controls and pricing math; use a dedicated `<CartLineItem>` (future)
- **Order history entries** — dedicated `<OrderSummary>` component (future)
- **PDP main image block** — the PDP hero needs much more real estate and structure

## Anatomy

```
┌─────────────────────┐
│ New  -10%          │  ← ProductCardMedia: badges, max 2
│   [product image]   │  ← AspectRatio ratio={1}
│                [+] │  ← ProductCardAddButton overlay, bottom-right
├─────────────────────┤
│ Brand ›             │  ← ProductCardSummary
│ Product title       │  ← title: body-md, 2-line clamp
│ up to two lines...  │
│ #1 ranking          │
│ 4.8 ★ (1.2k) · sold │
│ $12.99   $19.99     │  ← ProductCardOffer
│ unit price · pack   │
│ VVIP campaign price │
│ Ends in 2d…         │
└─────────────────────┘
```

### Internal component boundary

- `ProductCardMedia` owns image geometry and overlays.
- `ProductCardSummary` owns product identity and behavioral proof.
- `ProductCardOffer` owns pricing, campaigns, and urgency.
- These anatomy components are intentionally internal. Consumers use one coherent `ProductCard` API; only the independently interactive `ProductCardAddButton` is publicly exported.

When no image is available, `ProductCardMedia` renders a quiet, compact 8px-spaced diagonal line pattern instead of an icon. The SVG pattern uses semantic neutral tokens, contains no gradient, and is decorative (`aria-hidden`) because the adjacent product title already provides the accessible identity.

## Presentations

`presentation="rich"` remains the default and preserves the original
ProductCard DOM and interaction contract.

| Presentation | Use |
|---|---|
| `rich` | Full commerce information in grids, rails, and waterfall layouts |
| `minimal` | Image-first grid with a price badge and optional quick add |
| `compact` | Standalone horizontal row with 132×132 media, flexible right-side product information, and quick add beside price |

ProductList chooses these presentations from its layout. Pass
`presentation` directly only when ProductCard is used outside ProductList.

## Surfaces

Use `surface="card"` when the product card sits on a visible background; it
keeps 2px outer padding. Use `surface="plain"` for a background-free list; it
removes the outer padding. `card` remains the default for standalone cards.

## Props

### Required

- `href` — product destination used by the title link
- `title` — product title, will be clamped to 2 lines
- `priceCurrent` — display string (format upstream, e.g. `formatPrice(product.price)`)

### Common optional

- `image` + `imageAlt` — paired contract; when image is provided, alt is required for a11y
- `imageLoading` + `imageFetchPriority` — defaults to lazy/auto; use eager/high only for an above-fold LCP image
- `brand` + `brandHref` — paired contract for the clickable trailing-arrow brand row
- `priceOriginal` — only when discounted
- `unitPrice` — unit/bundle price and pack information
- `ranking` — ranking badge copy
- `rating` + `ratingCount` — when product has reviews
- `soldCount` — sales proof shown alongside rating metadata
- `promotions` — loyalty and campaign rows
- `countdown` — campaign ending copy
- `badges` — 0-2 product-image badges; only `sale`, `low-price`, `discount`, `new`, `hot`, `exclusive`, and `choice`
- `onAddToCart` — callback; omit to hide the button

### ProductCardAddButton child

`ProductCardAddButton` is the dedicated quick-add action from Figma `Button / add to cart` (node `2410:30647`). ProductCard renders it over the bottom-right of `ProductCardMedia` for rich and minimal presentations. Compact rows place the same action to the right of the price. It is also exported for ProductCard compositions that need to position the action independently.

- Mobile: 40×40 visual control with a 22px cart-add icon
- PC: 42×42 visual control with a 24px icon
- Pointer target: at least 44×44
- PC hover/pressed: YAMI emphasis red with a white icon
- Its image-overlay surface is independent of light/dark theme and is not an `inverse` alias

## Badge strategy (max 2)

Follow the hierarchy from design.md:

1. **Promotional badge first** (red) — `Sale`, `Low Price`, or a `discount` value such as `–30%`
2. **Status badge second** — `New`, `Hot`, `Exclusive`, or `Choice`

```tsx
<ProductCard
  // ...
  badges={[
    { label: "–30%", type: "discount" }, // promotional
    { label: "NEW", type: "new" }, // status
  ]}
/>
```

`Best Sellers` and `price` badges belong outside the product-image overlay. Don't stack all eligible signals—pick the 2 most decision-relevant for that context.

## Price formatting

`priceCurrent` and `priceOriginal` are `ReactNode` — the component doesn't format prices. Format in the caller using `new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(...)` or equivalent.

```tsx
<ProductCard
  href="/product/example"
  title="Example product"
  priceCurrent="$12.99"
  priceOriginal="$19.99"
/>
```

For multi-currency stores, format based on user locale before passing in.

## Link vs click behavior

### Product title link

```tsx
<ProductCard
  href={`/product/${product.id}`}
  // ...
/>
```

The required title link navigates to the PDP without covering the rating, price, promotion, or countdown content. The brand link and Add button remain independent sibling interactions.

## Common patterns

### Basic grid cell

```tsx
{
  products.map((p) => (
    <ProductCard
      key={p.id}
      href={`/product/${p.id}`}
      image={p.image}
      imageAlt={p.title}
      brand={p.brand}
      brandHref={`/brands/${p.brandSlug}`}
      title={p.title}
      priceCurrent={formatPrice(p.price)}
      priceOriginal={p.originalPrice ? formatPrice(p.originalPrice) : undefined}
      rating={p.rating}
      ratingCount={formatCount(p.reviewCount)}
      badges={p.badges}
      onAddToCart={() => addToCart(p.id)}
    />
  ));
}
```

### Minimal (no ratings, no badges)

```tsx
<ProductCard
  presentation="minimal"
  href={`/product/${p.id}`}
  image={p.image}
  imageAlt={p.title}
  title={p.title}
  priceCurrent={formatPrice(p.price)}
  onAddToCart={() => addToCart(p.id)}
/>
```

### Compact horizontal row

```tsx
<ProductCard
  presentation="compact"
  href={`/product/${p.id}`}
  image={p.image}
  imageAlt={p.title}
  brand={p.brand}
  brandHref={`/brands/${p.brandSlug}`}
  title={p.title}
  priceCurrent={formatPrice(p.price)}
  onAddToCart={() => addToCart(p.id)}
/>
```

### Navigation-only (no Add button)

```tsx
<ProductCard
  href={`/product/${p.id}`}
  image={p.image}
  imageAlt={p.title}
  title={p.title}
  priceCurrent={formatPrice(p.price)}
  // no onAddToCart → + button hidden
/>
```

## Anti-patterns

### ✗ More than 2 badges

```tsx
badges={[
  { label: 'New', type: 'new' },
  { label: 'Sale', type: 'sale' },
  { label: 'Hot', type: 'hot' }, {/* silently dropped */}
]}
```

Component truncates to 2 automatically. Pick the 2 most relevant.

### ✗ Missing alt

```tsx
<ProductCard
  href="/product/snack"
  image={url}
  title="Snack"
  priceCurrent="$3.99"
/> {/* type error: imageAlt is required with image */}
```

Pass `imageAlt={title}` for product images, or `imageAlt=""` only if the title fully describes the product for screen readers.

### ✗ Nested links

```tsx
<a href="...">
  <ProductCard href="...">...</ProductCard> {/* <a> inside <a>; HTML invalid */}
</a>
```

### ✗ Using ProductCard for non-product content

ProductCard is a product tile. Don't use it for blog posts, articles, or generic content cards — build or reach for a more appropriate component (future `<ContentCard>`, `<ArticleCard>`).

## Related

- Composes: `<Card>`, `<AspectRatio>`, `<Badge>`, `<ProductCardAddButton>`
- Rules: `red-usage`, `numerals-font`, `card-no-border`, `type-hierarchy` — `../../design.md`
- Copy spec — `../../content/copy-patterns.md#product-card-pattern`
- Labels — `../../../copy-library/ui/labels.i18n.json` (meta.new, meta.sale, meta.bestseller)
