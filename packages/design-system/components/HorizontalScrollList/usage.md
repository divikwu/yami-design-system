# Horizontal Scroll List — Usage

`HorizontalScrollList` supplies the shared finite horizontal-rail surface:
native horizontal scrolling, contained overscroll, mandatory item snapping,
hidden scrollbars, touch momentum, and keyboard focusability. Callers retain
their semantic element, item width, gap, and padding. Use `surface="card"` for
the square surface and 8px item/edge spacing over the caller-provided background,
or keep the default `surface="plain"` for a transparent rail. Both surfaces use
8px item and edge spacing on mobile. Plain desktop item geometry stays caller-owned.

```tsx
<HorizontalScrollList
  as="ul"
  aria-label="Featured products"
  className={styles.list}
>
  {products.map((product) => (
    <li key={product.id} className={styles.item}>
      <ProductCard {...product} />
    </li>
  ))}
</HorizontalScrollList>
```

## Paging controls

Use `useHorizontalScrollList` when the section also renders previous/next
controls. Pass the returned `listRef` and `updateState` to the list, then bind
`state` and `scrollByPage` to `RailNavigation`.

The controller measures a full visible item page, observes list resizing,
tracks the start/end edges, respects reduced-motion preferences, and falls back
to direct `scrollLeft` updates where `scrollBy` is unavailable.

## Responsibilities

- The list owns horizontal scrolling and focusability.
- The optional `card` surface remains transparent and square, and owns 8px
  item/edge spacing; its caller owns the visible background.
- The `plain` surface owns its 8px mobile item/edge spacing; desktop gap and padding
  remain caller-owned.
- Each child owns `scroll-snap-align` and its fixed or responsive width.
- The caller owns `aria-label`, item semantics, gap, and edge padding.
- Set `enabled={false}` when reusing the same markup for a non-rail layout.

Do not use this finite-list controller for looping or auto-advancing carousels.
Hero banners and other looping rails require a different paging strategy.
