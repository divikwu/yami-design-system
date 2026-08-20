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

Do not use this component for editorial carousels, campaign banners, video
playlists, or ProductCard media. ProductCard retains its own fixed media
contract.
