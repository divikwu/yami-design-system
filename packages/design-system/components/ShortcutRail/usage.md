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
trackpad users scroll the native rail; desktop users also receive token-backed
paging controls when content overflows.

On mobile, ShortcutRail always uses the full-width `plain` surface. It does not
provide an inset card treatment.
