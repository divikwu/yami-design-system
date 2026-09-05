# Tabs - Usage

## When to use

- Use `variant="primary"` for major content sections within a page.
- Use `variant="primary" styleVariant="b"` for compact segmented switching on mobile surfaces.
- Use `variant="secondary"` for sub-sections under a primary page or module.
- Use `variant="tertiary"` for low-level category filters or compact chips.

## Anatomy

```tsx
<Tabs defaultValue="snacks">
  <TabsList variant="primary" styleVariant="a">
    <TabsTrigger value="snacks">Snacks</TabsTrigger>
    <TabsTrigger value="beauty">Beauty</TabsTrigger>
  </TabsList>
  <TabsContent value="snacks">Snacks content</TabsContent>
  <TabsContent value="beauty">Beauty content</TabsContent>
</Tabs>
```

`Tabs` owns selected state. Use `defaultValue` for uncontrolled state or `value` + `onValueChange` for controlled state.

## Variants

| Variant | Figma source | Use |
|---|---|---|
| `primary` + `styleVariant="a"` | Mobile Primary Style A / WEB Primary | High-level content navigation with underline marker |
| `primary` + `styleVariant="b"` | Mobile Primary Style B | Segmented mobile navigation |
| `secondary` | Mobile Secondary / WEB Secondary | Sub-section navigation with the same underline treatment on mobile and PC |
| `tertiary` | Mobile Tertiary | Compact category or filter pills |

Primary Style B and Tertiary keep their compact 32px selected surface throughout Mobile and Tablet widths. At the shared Desktop breakpoint (`min-width: 1024px`), only the visible selected surface grows to 36px; the underlying trigger and hit-target heights do not change.

## Inverse

Use `TabsList inverse` only on `--surface-inverse` or another opposite-polarity YAMI surface. It is dark in Light and light in Dark.

```tsx
<div style={{ background: "var(--surface-inverse)" }}>
  <Tabs defaultValue="all">
    <TabsList variant="tertiary" inverse>
      <TabsTrigger value="all">All</TabsTrigger>
      <TabsTrigger value="popular">Popular</TabsTrigger>
    </TabsList>
  </Tabs>
</div>
```

## Keyboard and ARIA

- Root renders a compound WAI-ARIA tabs pattern: `tablist`, `tab`, `tabpanel`.
- Arrow keys move focus. With the default `activationMode="automatic"`, arrow keys also select the focused tab.
- `Home` and `End` jump to the first/last enabled tab.
- Disabled tabs set `aria-disabled="true"`, are not tabbable, and are skipped by arrow navigation.

## Icons

Figma's WEB tab buttons include optional icon properties, but the reference Tabs examples keep icons off. If product needs an icon tab, pass `leftIcon` or `rightIcon` to `TabsTrigger` and use currentColor SVG assets from `packages/design-system/assets/icons`.

```tsx
<TabsTrigger value="search" leftIcon={<SearchIcon />}>
  Search
</TabsTrigger>
```

## Skeleton

Use `TabsList skeleton` while the tab model is loading. Skeleton lists are `aria-hidden` and non-interactive.

```tsx
<Tabs defaultValue="loading">
  <TabsList variant="primary" styleVariant="a" skeleton />
</Tabs>
```

## Anti-patterns

- Do not use Tabs as page-level global navigation; use the site navigation component instead.
- Do not mix Primary, Secondary, and Tertiary tabs inside the same `TabsList`.
- Do not place long sentence labels in tabs. Keep labels short enough to scan and scroll horizontally on mobile.
- Do not use decorative icons or emoji. Icon slots must use YAMI SVG assets and should clarify the label.

## Scrollable section navigation

Use `<TabsList fullWidth centerActiveTab align="center" edgePadding>` for a full-width navigation strip. `align="center"` centers items when they fit and falls back to start alignment on overflow. `edgePadding` adds 16px leading/trailing gutters. `centerActiveTab` also reveals controlled selection changes (for example, page scroll tracking), respecting reduced motion and scroll boundaries. These options are opt-in; existing layouts retain their defaults.

Keep horizontal scrolling on TabsList itself. Pages own vertical section navigation and active-section tracking; avoid a second horizontal scroll container around TabsList.
