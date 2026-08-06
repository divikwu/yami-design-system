# SocialMediaGallery

Use `SocialMediaGallery` for a horizontally paged collection of social video
posters. Each entry is rendered by the exported `SocialVideoCard` child
component and supports exactly three footer treatments: no products renders the
video description, one product renders its square image and title, and multiple
products render three 56px square image slots plus an optional 56px-high
overflow count that fills the remaining width. The count represents every
product not rendered in those three slots. The footer uses the default gray surface while
product image slots remain white.

```tsx
<SocialMediaGallery
  title="Real People, Real Reviews"
  mobileTitle="Real People, Real Reviews"
  cards={cards}
  viewAllHref="/social"
/>
```

## Responsive contract

- At 1024px and above, the gallery has a subtle top divider, 48px inline and
  32px block padding, and six equal cards in the viewport. Each card crops a
  9:16 source into a 3:4 media area and uses a 72px footer.
- Below 1024px, the gallery becomes a rounded mobile surface with 240px cards
  in a native horizontal rail. Each card uses a 240×320 media area.
- PC and mobile both support cards with or without product images. Omit
  `products` for a text-only footer; pass one product for a 56px image-and-title
  footer, or multiple products for 56px thumbnails and an optional more count.

Use a concise `posterAlt`, stable IDs, real destinations, and localized labels.
The image is the video poster; playback behavior belongs to the consuming
application rather than this catalog surface.
