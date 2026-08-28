import { useLayoutEffect, useRef } from "react";

import { Button } from "../Button";
import { RailNavigationButton } from "../Button/RailNavigation";
import { ResponsiveImage } from "../ResponsiveImage";
import type { ProductMediaGalleryItem } from "./ProductMediaGallery";
import styles from "./ProductMediaGallery.module.css";

const closeIcon = new URL("../../assets/icons/system/close.svg", import.meta.url).href;

interface ProductMediaPreviewProps {
  desktopPreview: boolean;
  mobilePreview: boolean;
  images: readonly ProductMediaGalleryItem[];
  activeIndex: number;
  galleryLabel: string;
  thumbnailsLabel: string;
  previousLabel: string;
  nextLabel: string;
  closeLabel: string;
  onSelect: (index: number) => void;
  onClose: () => void;
}

export function ProductMediaPreview({
  desktopPreview, mobilePreview,
  images, activeIndex, galleryLabel, thumbnailsLabel, previousLabel, nextLabel,
  closeLabel, onSelect, onClose,
}: ProductMediaPreviewProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const railWidthRef = useRef(0);
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  useLayoutEffect(() => {
    const dialog = dialogRef.current!;
    const document = dialog.ownerDocument;
    const desktop = document.defaultView!.matchMedia("(min-width: 1024px)");
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const overflow = root.style.overflow;
    dialog.showModal();
    root.style.overflow = "hidden";
    const closeWhenDisabled = () => { if (!(desktop.matches ? desktopPreview : mobilePreview)) dialog.close(); };
    desktop.addEventListener("change", closeWhenDisabled);
    closeWhenDisabled();
    return () => {
      desktop.removeEventListener("change", closeWhenDisabled);
      dialog.close();
      root.style.overflow = overflow;
      // Restore after React removes the dialog and the browser restores native focus.
      queueMicrotask(() => {
        if (!opener?.isConnected) return;
        const target = opener.closest('[aria-hidden="true"]')
          ? opener.closest<HTMLElement>('[data-slot="product-media-gallery"]') : opener;
        target?.focus({ preventScroll: true });
      });
    };
  }, [desktopPreview, mobilePreview]);

  useLayoutEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    const rail = railRef.current!;
    // Let native swipe momentum finish; only jump for a different selected page.
    if (getComputedStyle(rail).overflowX === "auto" && Math.round(rail.scrollLeft / rail.clientWidth) !== activeIndex) {
      rail.scrollTo({ left: rail.clientWidth * activeIndex, behavior: "instant" });
    }
  }, [activeIndex]);

  useLayoutEffect(() => {
    const rail = railRef.current!;
    const alignImage = () => {
      railWidthRef.current = rail.clientWidth;
      rail.scrollTo({ left: getComputedStyle(rail).overflowX === "auto"
        ? rail.clientWidth * activeIndexRef.current : 0, behavior: "instant" });
    };
    alignImage();
    const observer = new ResizeObserver(alignImage);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [images.length]);

  function selectImage(index: number) {
    const rail = railRef.current!;
    if (getComputedStyle(rail).overflowX === "auto") {
      rail.scrollTo({ left: rail.clientWidth * index, behavior: "instant" });
    }
    onSelect(index);
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.preview}
      aria-label={galleryLabel}
      data-slot="product-media-preview"
      onClose={() => { if (!dialogRef.current?.open) onClose(); }}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          event.preventDefault();
          dialogRef.current?.close();
          return;
        }
        const step = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1
          : event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : 0;
        if (step) {
          event.preventDefault();
          selectImage((activeIndex + step + images.length) % images.length);
        }
      }}
    >
      <Button
        className={styles.previewClose}
        variant="tertiary"
        form="icon"
        size="lg"
        aria-label={closeLabel}
        onClick={() => dialogRef.current?.close()}
      >
        <img src={closeIcon} alt="" width={24} height={24} />
      </Button>
      <div className={styles.previewStage} data-slot="product-media-preview-stage">
        <div
          ref={railRef}
          className={styles.previewImageRail}
          data-slot="product-media-preview-rail"
          onScroll={(event) => {
            const rail = event.currentTarget;
            if (!rail.clientWidth || rail.clientWidth !== railWidthRef.current || getComputedStyle(rail).overflowX !== "auto") return;
            const index = Math.max(0, Math.min(images.length - 1, Math.round(rail.scrollLeft / rail.clientWidth)));
            if (index !== activeIndexRef.current) onSelect(index);
          }}
        >
          {images.map((image, index) => (
            <div key={image.id} className={styles.previewSlide} data-active={index === activeIndex} aria-hidden={index !== activeIndex}>
              <ResponsiveImage
                className={styles.mainImage}
                source={image.src}
                alt={image.alt}
                fallbackWidth={1500}
                fallbackHeight={1500}
                loading={index === activeIndex ? "eager" : "lazy"}
                draggable={false}
                revealOnLoad={false}
                data-slot={index === activeIndex ? "product-media-preview-image" : "product-media-preview-inactive-image"}
              />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.previewSidebar}>
        <RailNavigationButton
          className={styles.previewNavigation}
          direction="left"
          label={previousLabel}
          disabled={activeIndex === 0}
          onClick={() => selectImage(activeIndex - 1)}
        />
        <div className={styles.previewThumbnails} role="group" aria-label={thumbnailsLabel} data-slot="product-media-preview-thumbnails">
          {images.map((image, index) => (
            <button
              key={image.id}
              ref={index === activeIndex ? selectedRef : undefined}
              className={styles.thumbnailButton}
              type="button"
              aria-label={`${index + 1} / ${images.length}: ${image.alt}`}
              aria-pressed={index === activeIndex}
              data-selected={index === activeIndex ? "true" : undefined}
              onClick={() => selectImage(index)}
            >
              <ResponsiveImage
                className={styles.thumbnailImage}
                source={image.src}
                alt=""
                fallbackWidth={64}
                fallbackHeight={64}
                loading="lazy"
                revealOnLoad={false}
              />
            </button>
          ))}
        </div>
        <RailNavigationButton
          className={styles.previewNavigation}
          direction="right"
          label={nextLabel}
          disabled={activeIndex === images.length - 1}
          onClick={() => selectImage(activeIndex + 1)}
        />
        <span className={styles.previewCounter} aria-live="polite">{activeIndex + 1} / {images.length}</span>
      </div>
    </dialog>
  );
}
