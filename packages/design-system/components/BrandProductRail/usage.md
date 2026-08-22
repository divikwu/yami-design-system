# BrandProductRail — Usage

Use `BrandProductRail` for a homepage commerce section that groups compact
products under image-led brand campaigns.

```tsx
<BrandProductRail
  title="美护调理 流行趋势"
  mobileTitle="品牌官方合作"
  campaigns={campaigns}
  tabs={categoryTabs}
  viewAllHref="/collections/beauty-trends"
  viewAllLabel="查看全部"
/>
```

## Composition

- Each brand campaign is rendered with the existing `ProductList`.
- Each product row is rendered with the existing compact `ProductCard`.
- The campaign heading owns brand context, so product rows omit the duplicate
  ProductCard brand line even when incoming product data includes it.
- Mobile category navigation reuses the existing tertiary `Tabs`.
- Previous and next controls reuse the shared YAMI rail navigation buttons.

Provide one landscape campaign image and three products per campaign to match
the reference density. Localize the section title, view-all label, and control
labels. Product and campaign destinations remain normal links supplied by the
consumer.

## Section divider

The rail keeps its existing top gray divider by default. Set
`dividerPosition` to `top`, `bottom`, or `none`. `dividerVariant="gray"`
renders the 1px structural line; `dividerVariant="black"` renders the
theme-aware 2px emphasis line. Card-style mobile ignores this divider;
plain-style mobile preserves it.

On mobile, `mobileSurface="card"` is the default and preserves the inset,
rounded section. Use `mobileSurface="plain"` for a square full-bleed section
with 16px content padding. As with `ProductList`, mobile dividers are available
only on the plain surface.

```tsx
<BrandProductRail
  title="Beauty Brands to Try"
  campaigns={campaigns}
  mobileSurface="plain"
  dividerPosition="top"
/>
```

```tsx
<BrandProductRail
  title="Beauty Brands to Try"
  campaigns={campaigns}
  dividerPosition="bottom"
  dividerVariant="black"
/>
```

At widths below 1024px, the component follows the Figma
`brand-mobile / campaign` composition: a mobile-specific title, horizontally
scrollable tertiary tabs, 312px brand panels, 160px campaign art, and the
existing 96px compact ProductCard rows.

Desktop density is breakpoint-driven: exactly 1024px shows two complete brand
panels, 1025–1439px shows three, and widths from 1440px show four.
Desktop product rows span the panel width: the first row has no leading divider,
while each following divider runs edge to edge. Their compact cards and brand
panels use the existing 12px spacing and surface-radius tokens. Compact product
image surfaces stay white in both color themes so transparent and opaque source
assets share one visual background. Brand names rendered over campaign artwork
also stay white instead of changing with the surrounding page theme.
