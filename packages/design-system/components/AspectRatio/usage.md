# AspectRatio — Usage

## When to use

Use `AspectRatio` when a responsive container must preserve a stable width-to-height ratio while its width changes. Typical consumers include product media, editorial images, video previews, and banners.

```tsx
<AspectRatio ratio={16 / 9}>
  <img src={src} alt={alt} className={styles.media} />
</AspectRatio>
```

Use `ratio={1}` for a square:

```tsx
<AspectRatio ratio={1}>...</AspectRatio>
```

## Responsibility

AspectRatio controls geometry only. The consumer remains responsible for:

- image or video semantics
- `object-fit` and cropping
- loading and error states
- background, radius, and overflow
- overlays such as badges or actions

Do not add ProductCard-specific image, badge, or placeholder props to this component.
