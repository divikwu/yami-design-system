import type {
  MouseEventHandler,
  ReactNode,
} from "react";

import styles from "./ProductCard.module.css";
import { ProductCardAddButton } from "./ProductCardAddButton";
import type { ProductCardPromotion } from "./ProductCard.types";

interface ProductCardOfferProps {
  priceCurrent: ReactNode;
  priceOriginal?: ReactNode;
  unitPrice?: ReactNode;
  promotions?: ProductCardPromotion[];
  countdown?: ReactNode;
  onAddToCart?: MouseEventHandler<HTMLButtonElement>;
  addButtonAriaLabel?: string;
}

export function ProductCardOffer({
  priceCurrent,
  priceOriginal,
  unitPrice,
  promotions,
  countdown,
  onAddToCart,
  addButtonAriaLabel = "Add to cart",
}: ProductCardOfferProps) {
  const price = (
    <div className={styles.priceRow} data-slot="product-card-price">
      <span
        className={priceOriginal ? styles.priceSale : styles.priceCurrent}
      >
        {priceCurrent}
      </span>
      {priceOriginal && (
        <span className={styles.priceOriginal}>{priceOriginal}</span>
      )}
    </div>
  );

  return (
    <div className={styles.offer} data-slot="product-card-offer">
      <div className={styles.priceBlock}>
        {onAddToCart ? (
          <div
            className={styles.priceActionRow}
            data-slot="product-card-price-action-row"
          >
            {price}
            <span
              className={styles.compactQuickAdd}
              data-slot="product-card-quick-add"
            >
              <ProductCardAddButton
                aria-label={addButtonAriaLabel}
                onClick={onAddToCart}
              />
            </span>
          </div>
        ) : (
          price
        )}
        {unitPrice && (
          <p className={styles.unitPrice} data-slot="product-card-unit-price">
            {unitPrice}
          </p>
        )}
      </div>

      {promotions && promotions.length > 0 && (
        <div className={styles.promotions} data-slot="product-card-promotions">
          {promotions.map((promotion, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: campaign rows are ordered display slots.
              key={index}
              className={styles.promotion}
              data-slot="product-card-promotion"
              data-tone={promotion.tone ?? "default"}
            >
              <span className={styles.campaignBadge}>{promotion.badge}</span>
              {promotion.label && <span>{promotion.label}</span>}
              <span className={styles.promotionValue}>{promotion.value}</span>
            </div>
          ))}
        </div>
      )}

      {countdown && (
        <p className={styles.countdown} data-slot="product-card-countdown">
          {countdown}
        </p>
      )}
    </div>
  );
}
