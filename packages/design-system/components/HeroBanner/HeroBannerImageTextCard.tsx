"use client";

import type { CSSProperties } from "react";
import { useRef, useState } from "react";

import { getImageSourceUrl, ResponsiveImage } from "../ResponsiveImage";

import styles from "./HeroBanner.module.css";
import type { HeroBannerImageTextCardProps } from "./HeroBanner.types";
import { heroBannerPalette } from "./imageColor";
import { useImageBottomColor } from "./useImageBottomColor";

export function HeroBannerImageTextCard({
  item,
  imageLoading = "lazy",
  priority = false,
}: HeroBannerImageTextCardProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [canSampleImage, setCanSampleImage] = useState(priority);
  const imageColor = useImageBottomColor(
    getImageSourceUrl(item.image.src),
    item.backgroundColor,
    canSampleImage,
    imageRef,
  );
  const palette = heroBannerPalette(imageColor);
  const style = palette.surfaceColor
    ? ({
        "--hero-banner-item-color": palette.surfaceColor,
      } as CSSProperties)
    : undefined;

  return (
    <a
      className={styles.card}
      href={item.href}
      style={style}
      data-slot="hero-banner-item"
      data-hero-banner-content="image-text"
      data-product-layout="none"
      data-foreground={palette.foreground}
    >
      <ResponsiveImage
        ref={imageRef}
        className={styles.image}
        source={item.image.src}
        alt={item.image.alt}
        loading={priority ? "eager" : imageLoading}
        fetchPriority={priority ? "high" : "auto"}
        crossOrigin="anonymous"
        activateImmediately={priority}
        onActivated={() => setCanSampleImage(true)}
      />
      <div className={styles.content}>
        <span className={styles.gradient} aria-hidden="true" />
        <div className={styles.surface}>
          <div className={styles.copy} data-slot="hero-banner-copy">
            <span className={styles.title}>{item.title}</span>
            {item.description !== undefined && (
              <span className={styles.description}>{item.description}</span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}
