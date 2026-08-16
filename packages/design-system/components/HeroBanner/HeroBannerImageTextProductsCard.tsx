"use client";

import { type CSSProperties, useRef, useState } from "react";

import { getImageSourceUrl, ResponsiveImage } from "../ResponsiveImage";

import styles from "./HeroBanner.module.css";
import type { HeroBannerImageTextProductsCardProps } from "./HeroBanner.types";
import { heroBannerPalette } from "./imageColor";
import { useImageBottomColor } from "./useImageBottomColor";

export function HeroBannerImageTextProductsCard({
  item,
  imageLoading = "lazy",
  priority = false,
}: HeroBannerImageTextProductsCardProps) {
  const products = item.products.slice(0, 4);
  const productLayout = products.length === 4 ? "grid" : "strip";
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
      data-hero-banner-content="image-text-products"
      data-product-layout={productLayout}
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
          <div
            className={styles.products}
            data-layout={productLayout}
            data-slot="hero-banner-products"
            aria-hidden="true"
          >
            {products.map((product, productIndex) => (
              <span
                key={`${getImageSourceUrl(product.src)}-${productIndex}`}
                className={styles.product}
                data-slot="hero-banner-product"
                data-empty={getImageSourceUrl(product.src) ? undefined : "true"}
              >
                {getImageSourceUrl(product.src) && (
                  <ResponsiveImage
                    source={product.src}
                    alt={product.alt}
                    loading="lazy"
                  />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </a>
  );
}
