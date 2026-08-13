import { type CSSProperties, useState } from "react";

import { getImageSourceUrl, ResponsiveImage } from "../ResponsiveImage";

import styles from "./HeroBanner.module.css";
import type { HeroBannerProductsOnlyCardProps } from "./HeroBanner.types";
import { heroBannerPalette } from "./imageColor";
import { useImageBottomColor } from "./useImageBottomColor";

export function HeroBannerProductsOnlyCard({
  item,
  borrowedSurface,
}: HeroBannerProductsOnlyCardProps) {
  const products = item.products.slice(0, 4);
  const productLayout = products.length === 4 ? "grid" : "strip";
  const [canSampleImage, setCanSampleImage] = useState(false);
  // Sampling the borrowed artwork lands on the exact colour that sibling paints.
  const borrowedColor = useImageBottomColor(
    borrowedSurface?.imageSrc
      ? getImageSourceUrl(borrowedSurface.imageSrc)
      : "",
    borrowedSurface?.color,
    canSampleImage,
  );
  const surfaceColor = item.backgroundColor ?? borrowedColor;
  const palette = heroBannerPalette(surfaceColor);
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
      data-hero-banner-content="products-only"
      data-product-layout={productLayout}
      data-foreground={palette.foreground}
    >
      <div className={styles.productsOnlySurface}>
        <div className={styles.copy} data-slot="hero-banner-copy">
          <span className={styles.title}>{item.title}</span>
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
            >
              <ResponsiveImage
                source={product.src}
                alt={product.alt}
                loading="lazy"
                onActivated={() => setCanSampleImage(true)}
              />
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
