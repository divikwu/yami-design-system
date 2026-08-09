import type { SyntheticEvent } from "react";

function revealImageAfterDecode(image: HTMLImageElement) {
  const markLoaded = () => {
    if (image.isConnected) image.dataset.imageState = "loaded";
  };

  if (typeof image.decode === "function") {
    void image.decode().then(markLoaded, markLoaded);
    return;
  }

  markLoaded();
}

export function prepareProgressiveImage(image: HTMLImageElement | null) {
  if (!image) return;

  if (image.complete) {
    if (image.naturalWidth > 0) revealImageAfterDecode(image);
    else image.dataset.imageState = "error";
    return;
  }

  image.dataset.imageState = "pending";
}

export function handleProgressiveImageLoad(
  event: SyntheticEvent<HTMLImageElement>,
) {
  revealImageAfterDecode(event.currentTarget);
}

export function handleProgressiveImageError(
  event: SyntheticEvent<HTMLImageElement>,
) {
  event.currentTarget.dataset.imageState = "error";
}
