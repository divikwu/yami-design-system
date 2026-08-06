"use client";

import type { CSSProperties } from "react";

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
  const imageColor = useImageBottomColor(
    item.image.src,
    item.backgroundColor,
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
      <img
        className={styles.image}
        src={item.image.src}
        alt={item.image.alt}
        loading={priority ? "eager" : imageLoading}
        fetchPriority={priority ? "high" : "auto"}
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
                key={`${product.src}-${productIndex}`}
                className={styles.product}
                data-slot="hero-banner-product"
                data-empty={product.src ? undefined : "true"}
              >
                {product.src && (
                  <img src={product.src} alt={product.alt} loading="lazy" />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </a>
  );
}
