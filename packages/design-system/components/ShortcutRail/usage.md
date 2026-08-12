# ShortcutRail — Usage

Use `ShortcutRail` for a compact row of image-led destinations such as seasonal
collections, editorial shortcuts, or homepage discovery entrances.

```tsx
<ShortcutRail
  ariaLabel="Featured shortcuts"
  items={[
    {
      id: "trending",
      label: "Trending",
      iconSrc: trendingIcon,
      imagePresentation: "icon",
      href: "/collections/trending",
    },
  ]}
/>
```

Set an entry to `full-bleed` when its image should fill and crop to the entire
circular surface:

```tsx
{
  id: "seasonal",
  label: "Seasonal picks",
  iconSrc: seasonalImage,
  imagePresentation: "full-bleed",
  href: "/collections/seasonal",
}
```

Add a visible title to use the left-aligned gray-surface treatment:

```tsx
<ShortcutRail
  title="Featured shortcuts"
  items={items}
/>
```

The full-width surface around the 1920px content container can draw a section
divider on either edge using the shared section-divider contract:

```tsx
<ShortcutRail
  title="Featured shortcuts"
  items={items}
  dividerPosition="bottom"
  dividerVariant="gray"
/>
```

## Content guidance

- Use a stable `id` and a real destination for every item.
- Supply square, transparent icon artwork designed for the 32px icon slot.
- Keep labels short enough to remain useful when truncated to one line.
- Localize the navigation region and previous/next control labels.

The component keeps icon and label sizes stable at narrow widths. Touch and
trackpad users scroll the native rail without progress chrome; desktop users
also receive token-backed paging controls when content overflows.

`surface="plain"` is the default and spans the available width. Use
`surface="card"` when the rail belongs to a card-stacked page such as Ecommerce
Home. The card surface uses the shared page inset, surface radius and primary
background without a border or shadow.

```tsx
<ShortcutRail
  items={shortcuts}
  surface="card"
  ariaLabel="Featured shortcuts"
/>
```
