import styles from "./HeroBanner.module.css";
import type { HeroBannerImageOnlyCardProps } from "./HeroBanner.types";

export function HeroBannerImageOnlyCard({
  item,
  imageLoading = "lazy",
  priority = false,
}: HeroBannerImageOnlyCardProps) {
  return (
    <a
      className={styles.card}
      href={item.href}
      data-slot="hero-banner-item"
      data-hero-banner-content="image-only"
      data-product-layout="none"
      aria-label={item.image.alt}
    >
      <img
        className={styles.image}
        src={item.image.src}
        alt={item.image.alt}
        loading={priority ? "eager" : imageLoading}
        fetchPriority={priority ? "high" : "auto"}
      />
    </a>
  );
}
