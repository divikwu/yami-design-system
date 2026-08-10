import {
  handleProgressiveImageError,
  handleProgressiveImageLoad,
  prepareProgressiveImage,
} from "../progressiveImage";

import styles from "./ReviewList.module.css";
import type { ReviewCardProps } from "./ReviewList.types";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getStarState(rating: number, index: number) {
  const value = Math.max(0, Math.min(5, Number.isFinite(rating) ? rating : 0));
  const remainder = value - index;

  if (remainder >= 1) return "filled";
  if (remainder > 0) return "half";
  return "empty";
}

function StarRating({ rating }: { rating: number }) {
  const safeRating = Math.max(
    0,
    Math.min(5, Number.isFinite(rating) ? rating : 0),
  );

  return (
    <div
      className={styles.rating}
      data-slot="review-card-rating"
      role="img"
      aria-label={`Rating ${safeRating.toFixed(1)} out of 5`}
    >
      <span className={styles.stars} aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            // The five positions are fixed visual anatomy, not data records.
            key={index}
            className={styles.star}
            data-star-state={getStarState(safeRating, index)}
          />
        ))}
      </span>
    </div>
  );
}

export function ReviewCard({
  id,
  rating,
  review,
  reviewer,
  product,
  className,
  ...rest
}: ReviewCardProps) {
  const productContent = (
    <>
      <img
        ref={prepareProgressiveImage}
        className={styles.productImage}
        src={product.imageSrc}
        alt={product.imageAlt}
        loading="lazy"
        decoding="async"
        onLoad={handleProgressiveImageLoad}
        onError={handleProgressiveImageError}
      />
      <div className={styles.productContent}>
        <div className={styles.productBrand}>
          <span className={styles.productBrandName}>{product.brand}</span>
          <span className={styles.productArrow} aria-hidden="true" />
        </div>
        <p className={styles.productName}>{product.name}</p>
      </div>
    </>
  );

  return (
    <article
      {...rest}
      className={cx(styles.card, className)}
      data-slot="review-card"
      data-review-id={id}
    >
      <StarRating rating={rating} />
      <p className={styles.review} data-slot="review-card-content">
        {review}
      </p>
      <div className={styles.reviewer} data-slot="review-card-reviewer">
        {reviewer}
      </div>
      {product.href ? (
        <a
          className={styles.product}
          href={product.href}
          data-slot="review-card-product"
        >
          {productContent}
        </a>
      ) : (
        <div className={styles.product} data-slot="review-card-product">
          {productContent}
        </div>
      )}
    </article>
  );
}
