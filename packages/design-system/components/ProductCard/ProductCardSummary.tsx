import type { ReactNode } from "react";

import { Badge } from "../Badge";

import styles from "./ProductCard.module.css";

interface ProductCardSummaryProps {
  brand?: ReactNode;
  brandHref?: string;
  title: ReactNode;
  href?: string;
  ranking?: ReactNode;
  rating?: number;
  ratingCount?: ReactNode;
  soldCount?: ReactNode;
}

function ArrowRightIcon() {
  return (
    <svg
      className={styles.arrowIcon}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4.25 2.25 8 6 4.25 9.75"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProductCardSummary({
  brand,
  brandHref,
  title,
  href,
  ranking,
  rating,
  ratingCount,
  soldCount,
}: ProductCardSummaryProps) {
  const brandContent = brand && (
    <>
      <span>{brand}</span>
      {brandHref && <ArrowRightIcon />}
    </>
  );

  return (
    <div className={styles.summary} data-slot="product-card-summary">
      <div className={styles.productInfo}>
        {brand &&
          (brandHref ? (
            <a
              className={styles.brand}
              href={brandHref}
              data-slot="product-card-brand"
            >
              {brandContent}
            </a>
          ) : (
            <p className={styles.brand} data-slot="product-card-brand">
              {brandContent}
            </p>
          ))}

        <p className={styles.title}>
          {href ? (
            <a className={styles.cardLink} href={href}>
              <span className={styles.titleLinkText}>{title}</span>
            </a>
          ) : (
            title
          )}
        </p>
      </div>

      {(ranking || typeof rating === "number" || soldCount) && (
        <div className={styles.signals} data-slot="product-card-signals">
          {ranking && (
            <div className={styles.ranking} data-slot="product-card-ranking">
              <Badge
                color="yellow"
                emphasis="secondary"
                className={styles.rankingBadge}
              >
                <span>{ranking}</span>
                <ArrowRightIcon />
              </Badge>
            </div>
          )}

          {(typeof rating === "number" || soldCount) && (
            <div
              className={styles.ratingSoldRow}
              data-slot="product-card-rating-sold"
            >
              {typeof rating === "number" && (
                <div
                  className={styles.ratingRow}
                  data-slot="product-card-rating"
                  role="img"
                  aria-label={`Rating ${rating.toFixed(1)} out of 5${ratingCount ? `, ${ratingCount} reviews` : ""}`}
                >
                  <span aria-hidden="true">{rating.toFixed(1)}</span>
                  <svg
                    className={styles.ratingStar}
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                  >
                    <path
                      d="m6 1 1.55 3.14 3.45.5-2.5 2.43.59 3.43L6 8.88 2.91 10.5l.59-3.43L1 4.64l3.45-.5L6 1Z"
                      fill="currentColor"
                    />
                  </svg>
                  {ratingCount && (
                    <span className={styles.ratingCount} aria-hidden="true">
                      ({ratingCount})
                    </span>
                  )}
                </div>
              )}
              {soldCount && (
                <span className={styles.sold} data-slot="product-card-sold">
                  {typeof rating === "number" && (
                    <span aria-hidden="true">·</span>
                  )}
                  {soldCount}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
