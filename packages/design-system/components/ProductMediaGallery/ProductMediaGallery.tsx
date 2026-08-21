"use client";

import {
  type HTMLAttributes,
  type ImgHTMLAttributes,
  useRef,
  useState,
} from "react";

import { RailNavigationButton } from "../Button/RailNavigation";
import type { ImageSource } from "../image.types";
import { ResponsiveImage } from "../ResponsiveImage";

import styles from "./ProductMediaGallery.module.css";

export interface ProductMediaGalleryItem {
  id: string;
  src: ImageSource;
  alt: string;
}

export interface ProductMediaGalleryProps
  extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  images: readonly ProductMediaGalleryItem[];
  defaultIndex?: number;
  galleryLabel?: string;
  thumbnailsLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  imageLoading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
  onIndexChange?: (index: number) => void;
}

function clampIndex(index: number, length: number) {
  return Math.max(0, Math.min(index, Math.max(0, length - 1)));
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const SWIPE_THRESHOLD_PX = 40;

export function ProductMediaGallery({
  images,
  defaultIndex = 0,
  galleryLabel = "Product images",
  thumbnailsLabel = "Choose product image",
  previousLabel = "Previous image",
  nextLabel = "Next image",
  imageLoading = "eager",
  onIndexChange,
  className,
  ...rest
}: ProductMediaGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(() =>
    clampIndex(defaultIndex, images.length),
  );
  const touchStartX = useRef<number | null>(null);
  const activeImage = images[activeIndex];

  if (!activeImage) return null;

  function selectImage(index: number) {
    const nextIndex = clampIndex(index, images.length);
    setActiveIndex(nextIndex);
    onIndexChange?.(nextIndex);
  }

  function move(step: number) {
    const nextIndex =
      (activeIndex + step + images.length) % images.length;
    selectImage(nextIndex);
  }

  return (
    <section
      {...rest}
      className={cx(styles.root, className)}
      aria-label={galleryLabel}
      data-slot="product-media-gallery"
      data-active-index={activeIndex}
      tabIndex={rest.tabIndex ?? 0}
      onKeyDown={(event) => {
        rest.onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
      }}
      onTouchStart={(event) => {
        rest.onTouchStart?.(event);
        if (event.defaultPrevented) return;
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        rest.onTouchEnd?.(event);
        const startX = touchStartX.current;
        const endX = event.changedTouches[0]?.clientX;
        touchStartX.current = null;
        if (
          event.defaultPrevented ||
          startX === null ||
          endX === undefined ||
          Math.abs(endX - startX) < SWIPE_THRESHOLD_PX
        ) {
          return;
        }
        move(endX < startX ? 1 : -1);
      }}
      onTouchCancel={(event) => {
        rest.onTouchCancel?.(event);
        touchStartX.current = null;
      }}
    >
      <div
        className={styles.thumbnails}
        role="group"
        aria-label={thumbnailsLabel}
        data-slot="product-media-gallery-thumbnails"
      >
        {images.map((image, index) => (
          <button
            key={image.id}
            className={styles.thumbnailButton}
            type="button"
            aria-label={`View image ${index + 1} of ${images.length}: ${image.alt}`}
            aria-pressed={index === activeIndex}
            onClick={() => selectImage(index)}
            data-slot="product-media-gallery-thumbnail"
            data-selected={index === activeIndex ? "true" : undefined}
          >
            <ResponsiveImage
              className={styles.thumbnailImage}
              source={image.src}
              alt=""
              fallbackWidth={72}
              fallbackHeight={72}
              loading="lazy"
              revealOnLoad={false}
            />
          </button>
        ))}
      </div>

      <div className={styles.stage} data-slot="product-media-gallery-stage">
        <ResponsiveImage
          key={activeImage.id}
          className={styles.mainImage}
          source={activeImage.src}
          alt={activeImage.alt}
          fallbackWidth={757}
          fallbackHeight={757}
          loading={imageLoading}
          fetchPriority={activeIndex === defaultIndex ? "high" : "auto"}
          revealOnLoad={false}
          data-slot="product-media-gallery-image"
        />

        {images.length > 1 ? (
          <>
            <RailNavigationButton
              className={cx(styles.navigationButton, styles.previousButton)}
              direction="left"
              label={previousLabel}
              onClick={() => move(-1)}
            />
            <RailNavigationButton
              className={cx(styles.navigationButton, styles.nextButton)}
              direction="right"
              label={nextLabel}
              onClick={() => move(1)}
            />
            <span
              className={styles.counter}
              aria-live="polite"
              data-slot="product-media-gallery-counter"
            >
              {activeIndex + 1} / {images.length}
            </span>
          </>
        ) : null}
      </div>
    </section>
  );
}
