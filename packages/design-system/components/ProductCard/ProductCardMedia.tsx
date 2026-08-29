import {
  type ImgHTMLAttributes,
  type MouseEventHandler,
  type ReactNode,
  useId,
} from "react";

import { AspectRatio } from "../AspectRatio";
import { Badge } from "../Badge";
import type { ImageSource } from "../image.types";
import {
  handleProgressiveImageError,
  handleProgressiveImageLoad,
  prepareProgressiveImage,
} from "../progressiveImage";
import { ResponsiveImage } from "../ResponsiveImage";

import styles from "./ProductCard.module.css";
import { ProductCardAddButton } from "./ProductCardAddButton";
import type { ProductBadge } from "./ProductCard.types";

const PRODUCT_IMAGE_BADGE_TYPES: readonly ProductBadge["type"][] = [
  "sale",
  "low-price",
  "discount",
  "new",
  "hot",
  "exclusive",
  "choice",
];

interface ProductCardMediaProps {
  image?: ImageSource;
  imageAlt?: string;
  imageLoading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
  imageFetchPriority?: ImgHTMLAttributes<HTMLImageElement>["fetchPriority"];
  badges?: ProductBadge[];
  onAddToCart?: MouseEventHandler<HTMLButtonElement>;
  addButtonAriaLabel: string;
  priceBadge?: ReactNode;
  href?: string;
  linkLabel?: ReactNode;
}

export function ProductCardMedia({
  image,
  imageAlt,
  imageLoading,
  imageFetchPriority,
  badges,
  onAddToCart,
  addButtonAriaLabel,
  priceBadge,
  href,
  linkLabel,
}: ProductCardMediaProps) {
  const visibleBadges = badges
    ?.filter((badge) => PRODUCT_IMAGE_BADGE_TYPES.includes(badge.type))
    .slice(0, 2);
  const placeholderPatternId = `product-card-lines-${useId().replace(/:/g, "")}`;

  return (
    <div className={styles.media} data-slot="product-card-media">
      <AspectRatio
        ratio={1}
        className={styles.imageWrap}
        data-slot="product-card-image"
      >
        {image ? (
          <ResponsiveImage
            ref={prepareProgressiveImage}
            source={image}
            alt={imageAlt ?? ""}
            fallbackWidth={1}
            fallbackHeight={1}
            loading={imageLoading}
            fetchPriority={imageFetchPriority}
            revealOnLoad={false}
            className={styles.image}
            onLoad={handleProgressiveImageLoad}
            onError={handleProgressiveImageError}
          />
        ) : (
          <span
            className={styles.imagePlaceholder}
            data-slot="product-card-image-placeholder"
            aria-hidden="true"
          >
            <svg
              className={styles.placeholderPattern}
              data-slot="product-card-placeholder-pattern"
              aria-hidden="true"
              focusable="false"
            >
              <defs>
                <pattern
                  id={placeholderPatternId}
                  width="8"
                  height="8"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="8"
                    stroke="currentColor"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                fill={`url(#${placeholderPatternId})`}
              />
            </svg>
          </span>
        )}

        {visibleBadges && visibleBadges.length > 0 && (
          <div className={styles.badgeStack} data-slot="product-card-badges">
            {visibleBadges.map((badge, index) => (
              <Badge
                // biome-ignore lint/suspicious/noArrayIndexKey: badges are positional slots (max 2).
                key={index}
                color={badge.color}
                emphasis={badge.emphasis ?? "secondary"}
                type={badge.type}
              >
                {badge.label}
              </Badge>
            ))}
          </div>
        )}

        {priceBadge && (
          <span
            className={styles.priceBadge}
            data-slot="product-card-price-badge"
          >
            <Badge type="price">{priceBadge}</Badge>
          </span>
        )}

        {href && linkLabel && (
          <a
            className={styles.mediaLink}
            href={href}
            data-slot="product-card-media-link"
          >
            <span className={styles.mediaLinkLabel}>{linkLabel}</span>
          </a>
        )}

        {onAddToCart && (
          <span className={styles.quickAdd} data-slot="product-card-quick-add">
            <ProductCardAddButton
              aria-label={addButtonAriaLabel}
              onClick={onAddToCart}
            />
          </span>
        )}
      </AspectRatio>
    </div>
  );
}
