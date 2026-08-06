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
      href: "/collections/trending",
    },
  ]}
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
