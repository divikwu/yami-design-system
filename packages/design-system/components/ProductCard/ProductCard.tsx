/** ProductCard — Figma-backed YAMI desktop product tile. */

import { Card } from "../Card";

import styles from "./ProductCard.module.css";
import { ProductCardMedia } from "./ProductCardMedia";
import { ProductCardOffer } from "./ProductCardOffer";
import { ProductCardSummary } from "./ProductCardSummary";
import type { ProductCardProps } from "./ProductCard.types";

export type {
  ProductBadge,
  ProductCardPresentation,
  ProductCardPromotion,
  ProductCardProps,
} from "./ProductCard.types";

export function ProductCard({
  presentation = "rich",
  image,
  imageAlt,
  imageLoading = "lazy",
  imageFetchPriority,
  brand,
  brandHref,
  title,
  priceCurrent,
  priceOriginal,
  unitPrice,
  ranking,
  rating,
  ratingCount,
  soldCount,
  promotions,
  countdown,
  badges,
  onAddToCart,
  addButtonAriaLabel = "Add to cart",
  href,
}: ProductCardProps) {
  return (
    <Card
      as="article"
      padding="none"
      interactive={false}
      className={styles.card}
    >
      <div
        className={styles.root}
        data-slot="product-card"
        data-presentation={presentation}
      >
        <ProductCardMedia
          image={image}
          imageAlt={imageAlt}
          imageLoading={imageLoading}
          imageFetchPriority={imageFetchPriority}
          badges={presentation === "rich" ? badges : undefined}
          onAddToCart={
            presentation === "compact" ? undefined : onAddToCart
          }
          addButtonAriaLabel={addButtonAriaLabel}
          priceBadge={presentation === "minimal" ? priceCurrent : undefined}
          href={presentation === "minimal" ? href : undefined}
          linkLabel={presentation === "minimal" ? title : undefined}
        />
        {presentation !== "minimal" && (
          <div className={styles.content} data-slot="product-card-content">
            <ProductCardSummary
              brand={brand}
              brandHref={brandHref}
              title={title}
              href={href}
              ranking={presentation === "rich" ? ranking : undefined}
              rating={presentation === "rich" ? rating : undefined}
              ratingCount={presentation === "rich" ? ratingCount : undefined}
              soldCount={presentation === "rich" ? soldCount : undefined}
            />
            <ProductCardOffer
              priceCurrent={priceCurrent}
              priceOriginal={priceOriginal}
              unitPrice={unitPrice}
              promotions={presentation === "rich" ? promotions : undefined}
              countdown={presentation === "rich" ? countdown : undefined}
              onAddToCart={
                presentation === "compact" ? onAddToCart : undefined
              }
              addButtonAriaLabel={addButtonAriaLabel}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
