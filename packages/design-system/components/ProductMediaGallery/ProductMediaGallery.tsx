"use client";

import {
  type HTMLAttributes,
  type ImgHTMLAttributes,
  useLayoutEffect,
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

function pageStep(rail: HTMLDivElement) {
  const width = rail.firstElementChild?.getBoundingClientRect().width || rail.clientWidth;
  return width + (parseFloat(getComputedStyle(rail).columnGap) || 0);
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

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
  const [selectedIndex, setActiveIndex] = useState(() =>
    clampIndex(defaultIndex, images.length),
  );
  const activeIndex = clampIndex(selectedIndex, images.length);
  const railRef = useRef<HTMLDivElement>(null);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

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
  }, [images.length]);
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
            </div>
          ))}
        </div>

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
