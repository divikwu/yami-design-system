"use client";

import {
  type HTMLAttributes,
  type ImgHTMLAttributes,
  forwardRef,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { RailNavigationButton } from "../Button/RailNavigation";
import type { ImageSource } from "../image.types";
import { ResponsiveImage } from "../ResponsiveImage";
import { ProductMediaPreview } from "./ProductMediaPreview";

import styles from "./ProductMediaGallery.module.css";

export interface ProductMediaGalleryItem {
  id: string;
  src: ImageSource;
  alt: string;
}

export interface ProductMediaGalleryHandle {
  openPreview: (imageId: string) => boolean;
}

export interface ProductMediaGalleryProps
  extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  images: readonly ProductMediaGalleryItem[];
  defaultIndex?: number;
  galleryLabel?: string;
  thumbnailsLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  desktopPreview?: boolean;
  mobilePreview?: boolean;
  openPreviewLabel?: string;
  closePreviewLabel?: string;
  imageLoading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
  onIndexChange?: (index: number) => void;
}

function clampIndex(index: number, length: number) {
  return Math.max(0, Math.min(index, Math.max(0, length - 1)));
}

function pageStep(rail: HTMLDivElement) {
  const width = rail.firstElementChild?.getBoundingClientRect().width || rail.clientWidth;
  return width + (parseFloat(getComputedStyle(rail).columnGap) || 0);
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const ProductMediaGallery = forwardRef<ProductMediaGalleryHandle, ProductMediaGalleryProps>(function ProductMediaGallery({
  images,
  defaultIndex = 0,
  galleryLabel = "Product images",
  thumbnailsLabel = "Choose product image",
  previousLabel = "Previous image",
  nextLabel = "Next image",
  desktopPreview = false,
  mobilePreview = false,
  openPreviewLabel = "Open image preview",
  closePreviewLabel = "Close image preview",
  imageLoading = "eager",
  onIndexChange,
  className,
  ...rest
}, ref) {
  const [pointerFocus, setPointerFocus] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedIndex, setActiveIndex] = useState(() =>
    clampIndex(defaultIndex, images.length),
  );
  const activeIndex = clampIndex(selectedIndex, images.length);
  const railRef = useRef<HTMLDivElement>(null);
  const previewPointer = useRef<{ x: number; y: number } | null>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  useImperativeHandle(ref, () => ({
    openPreview(imageId) {
      const index = images.findIndex((image) => image.id === imageId);
      const enabled = window.matchMedia("(min-width: 1024px)").matches ? desktopPreview : mobilePreview;
      if (!enabled || index < 0) return false;
      selectImage(index);
      setPreviewOpen(true);
      return true;
    },
  }));

  // Keep a full page aligned when mounting, resizing, or crossing the PC breakpoint.
  useLayoutEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const alignImage = () => {
      rail.scrollTo({
        left: getComputedStyle(rail).overflowX === "auto"
          ? pageStep(rail) * activeIndexRef.current : 0,
        behavior: "instant",
      });
    };
    alignImage();
    const observer = new ResizeObserver(alignImage);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [images.length, previewOpen]);
  const activeImage = images[activeIndex];

  if (!activeImage) return null;

  function selectImage(index: number) {
    const nextIndex = clampIndex(index, images.length);
    const rail = railRef.current;
    if (rail && getComputedStyle(rail).overflowX === "auto") {
      rail.scrollTo({ left: pageStep(rail) * nextIndex, behavior: "instant" });
    }
    if (nextIndex === activeIndexRef.current) return;
    activeIndexRef.current = nextIndex;
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
      data-pointer-focus={pointerFocus || undefined}
      tabIndex={rest.tabIndex ?? 0}
      onPointerDown={(event) => {
        rest.onPointerDown?.(event);
        setPointerFocus(true);
      }}
      onBlur={(event) => {
        rest.onBlur?.(event);
        if (!event.currentTarget.contains(event.relatedTarget)) setPointerFocus(false);
      }}
      onKeyDown={(event) => {
        rest.onKeyDown?.(event);
        if (event.defaultPrevented) return;
        setPointerFocus(false);
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          move(-1);
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          move(1);
        }
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
        <div
          ref={railRef}
          className={styles.imageRail}
          data-slot="product-media-gallery-rail"
          onScroll={(event) => {
            if (previewOpen) return;
            const rail = event.currentTarget;
            if (!rail.clientWidth || getComputedStyle(rail).overflowX !== "auto") return;
            const maxScroll = rail.scrollWidth - rail.clientWidth;
            const atEnd = maxScroll > 0 && rail.scrollLeft >= maxScroll - 1;
            const index = atEnd ? images.length - 1
              : clampIndex(Math.round(rail.scrollLeft / pageStep(rail)), images.length);
            if (index === activeIndexRef.current) return;
            activeIndexRef.current = index;
            setActiveIndex(index);
            onIndexChange?.(index);
          }}
        >
          {images.map((image, index) => (
            <div
              key={image.id}
              className={styles.slide}
              data-active={index === activeIndex}
              data-slot="product-media-gallery-slide"
              aria-hidden={index !== activeIndex}
            >
              <ResponsiveImage
                className={styles.mainImage}
                source={image.src}
                alt={image.alt}
                fallbackWidth={757}
                fallbackHeight={757}
                loading={index === activeIndex ? imageLoading : "lazy"}
                fetchPriority={index === defaultIndex ? "high" : "auto"}
                revealOnLoad={false}
                draggable={false}
                data-slot={index === activeIndex ? "product-media-gallery-image" : "product-media-gallery-inactive-image"}
              />
              {mobilePreview && (
                <button
                  type="button"
                  className={cx(styles.previewTrigger, styles.mobilePreviewTrigger)}
                  aria-label={openPreviewLabel}
                  aria-haspopup="dialog"
                  tabIndex={index === activeIndex ? 0 : -1}
                  data-slot="product-media-mobile-preview-trigger"
                  onPointerDown={(event) => { previewPointer.current = { x: event.clientX, y: event.clientY }; }}
                  onPointerCancel={() => { previewPointer.current = null; }}
                  onClick={(event) => {
                    const start = previewPointer.current;
                    previewPointer.current = null;
                    if (event.detail !== 0 && (!start || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8)) return;
                    selectImage(index);
                    setPreviewOpen(true);
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {desktopPreview && (
          <button
            type="button"
            className={cx(styles.previewTrigger, styles.desktopPreviewTrigger)}
            aria-label={openPreviewLabel}
            aria-haspopup="dialog"
            data-slot="product-media-preview-trigger"
            onClick={() => {
              if (window.matchMedia("(min-width: 1024px)").matches) setPreviewOpen(true);
            }}
          />
        )}

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
      {(desktopPreview || mobilePreview) && previewOpen && (
        <ProductMediaPreview
          desktopPreview={desktopPreview}
          mobilePreview={mobilePreview}
          images={images}
          activeIndex={activeIndex}
          galleryLabel={galleryLabel}
          thumbnailsLabel={thumbnailsLabel}
          previousLabel={previousLabel}
          nextLabel={nextLabel}
          closeLabel={closePreviewLabel}
          onSelect={selectImage}
          onClose={() => setPreviewOpen(false)}
        />
      )}
    </section>
  );
});
