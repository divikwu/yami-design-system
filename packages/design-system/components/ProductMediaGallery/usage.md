# ProductMediaGallery

Use `ProductMediaGallery` for a PDP media region when several product images
share one bounded viewing window. It keeps one identity image visible at a time
and offers thumbnail, previous/next, and keyboard ArrowLeft/ArrowRight
navigation.

Provide a stable `id`, source, and meaningful product `alt` for every image.
The active image is product identity content, so empty alt text is not valid.
Thumbnail images are decorative because their buttons already announce the
full image position and alt text.

The thumbnail rail sits under the square stage at every viewport and scrolls
horizontally when it exceeds the available width. The component consumes
YAMI surface, border, focus, radius, typography, and spacing tokens; callers
control only the image data and localized labels.

The non-interactive image counter is 24px tall including its border at every
breakpoint. It shares ProductCardAddButton's translucent surface, 1px border,
and 4px backdrop blur, with an 8px inset from the content edges.

Previous and next buttons are PC controls and appear from 1024px.
On hover-capable desktops, reveal them only while the image stage is hovered
or the gallery contains visible keyboard focus. Mouse-click focus alone must
not keep the arrows visible after the pointer leaves the image.
Below that breakpoint, keep the buttons hidden and use a native horizontal image rail with
mandatory page snapping. At widths up to and including 440px, show one full-width
square image with no gap or next-image peek, no top or side padding, and only
the stage's original rounded bottom corners.
Above 440px and below 1024px, each square image is capped at 440 × 440px with
an 8px radius and an 8px gap, without borders or shadows. Reserve 32px for the
gap and a 24px peek when the container is narrow; a single image uses the full
available width up to 440px. This range keeps an 8px top inset and aligns the
first and last images 8px inside the content edges. The scrolling window bleeds
through the side insets to the gallery's outer edges, clipping images there
without introducing page-level horizontal scrolling. No bottom padding is added.
Desktop keeps its existing layout.
Touch and trackpad gestures move the
images directly, and the counter and thumbnail selection follow the visible page.
Vertical page scrolling and pinch zoom remain available. Swiping stops at the
first and last images, with no extra scrollable spacer beyond the trailing inset.
At the end, the counter identifies the final image.
Thumbnail, arrow, and keyboard navigation remain supported.
Resizing keeps the active image aligned; empty galleries render nothing.

Set `desktopPreview` on PDPs to open the selected image in a full-viewport
preview from 1024px. Provide localized `openPreviewLabel` and `closePreviewLabel`.
The preview uses the primary surface, a centered contained image, a scrollable
left thumbnail column with previous/next controls, and a top-right close button.
The gallery and preview share selection. Arrow keys switch images; Escape or
the close button dismisses the native modal and restores trigger focus and page
scroll. Set `mobilePreview` to also enable tap-to-preview below 1024px: a white
primary surface, centered contained image, top-right close button, and one
horizontal thumbnail row at the bottom. Swipe the large image horizontally to
move between images with native page snapping; the first and last images do not
wrap. Thumbnail selection and keyboard navigation keep the large image aligned,
and the active thumbnail follows swipes. The row scrolls with touch or trackpad
gestures and keeps the selected thumbnail in view. Safe-area insets protect
the close button and bottom rail. Native gallery swiping does not open a preview.
When both preview props are enabled, resizing adapts the open dialog; crossing
into a disabled breakpoint dismisses it. If image selection hides the original
mobile trigger, closing restores focus to the gallery instead. This is an image
preview, not a video player or zoom editor.

Related PDP source links can use a `ProductMediaGalleryHandle` ref and call
`openPreview(imageId)` to select and preview a specific gallery image. It returns
`false` for unknown IDs or a preview disabled at the current breakpoint, without changing selection.
Only prevent the source link's normal navigation when it returns `true`; preserve
modified clicks and the original source URL. Closing restores focus to that link.

Do not use this component for editorial carousels, campaign banners, video
playlists, or ProductCard media. ProductCard retains its own fixed media
contract.
