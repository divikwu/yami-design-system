"use client";

import { useId, useMemo, useState, type ReactNode } from "react";

import { Button } from "../Button";
import { FilterChip, FilterChipGroup, FilterChipMenu } from "../FilterChip";

import styles from "./ProductReviewSection.module.css";
import type {
  ProductReviewFilter,
  ProductReviewItem,
  ProductReviewSectionProps,
} from "./ProductReviewSection.types";

const dropdownIcon = new URL(
  "../../assets/icons/system/arrow-down.svg",
  import.meta.url,
).href;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clampRating(value: number) {
  return Math.max(0, Math.min(5, Number.isFinite(value) ? value : 0));
}

function clampPercentage(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function accessibleText(value: ReactNode, fallback: string) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : fallback;
}

function StarRating({ rating }: { rating: number }) {
  const safeRating = clampRating(rating);

  return (
    <div
      className={styles.rating}
      data-product-review-rating={safeRating.toFixed(1)}
      role="img"
      aria-label={`Rating ${safeRating.toFixed(1)} out of 5`}
    >
      {Array.from({ length: 5 }, (_, index) => {
        const remainder = safeRating - index;
        const state = remainder >= 1 ? "filled" : remainder > 0 ? "half" : "empty";

        return <span key={index} className={styles.star} data-star-state={state} />;
      })}
    </div>
  );
}

function ReviewCard({
  review,
  copy,
}: {
  review: ProductReviewItem;
  copy: ProductReviewSectionProps["copy"];
}) {
  const reviewerText = typeof review.reviewer === "string" ? review.reviewer : "";
  const initial = reviewerText.trim().charAt(0).toUpperCase() || "?";

  return (
    <article
      className={styles.card}
      data-slot="product-review-card"
      data-review-id={review.id}
      data-review-rating={clampRating(review.rating).toFixed(1)}
    >
      <header className={styles.cardHeader}>
        {review.avatar ? (
          <img
            className={styles.avatar}
            src={review.avatar.src}
            alt={review.avatar.alt}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className={styles.avatarFallback} aria-hidden="true">
            {initial}
          </span>
        )}
        <div className={styles.reviewerIdentity}>
          <div className={styles.reviewerLine}>
            <strong>{review.reviewer}</strong>
            {review.verifiedPurchase ? (
              <span className={styles.verified}>{copy.verifiedPurchase}</span>
            ) : null}
          </div>
          {review.reviewedAt || review.locale ? (
            <p className={styles.reviewMeta}>
              {review.reviewedAt}
              {review.reviewedAt && review.locale ? " · " : null}
              {review.locale}
            </p>
          ) : null}
        </div>
        {review.currentItem ? (
          <span className={styles.currentItem}>{copy.currentItem}</span>
        ) : null}
      </header>

      <div className={styles.ratingRow}>
        <StarRating rating={review.rating} />
        {review.variant ? <span className={styles.variant}>{review.variant}</span> : null}
      </div>

      {review.title ? <h3 className={styles.reviewTitle}>{review.title}</h3> : null}
      <div className={styles.reviewBody}>{review.body}</div>

      {review.photos?.length ? (
        <div
          className={styles.photos}
          role="group"
          aria-label={accessibleText(copy.photos, "Review photos")}
        >
          {review.photos.map((photo) => (
            <img
              key={`${review.id}-${photo.src}`}
              className={styles.photo}
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      ) : null}

      <footer className={styles.cardFooter}>
        {review.showOriginalHref ? (
          <a className={styles.originalLink} href={review.showOriginalHref}>
            {copy.showOriginal}
          </a>
        ) : (
          <span />
        )}
        <div className={styles.feedback}>
          <span aria-label={`${copy.helpful}: ${review.helpfulCount ?? 0}`}>
            {copy.helpful} {review.helpfulCount ?? 0}
          </span>
          <span aria-label={`${copy.comments}: ${review.commentCount ?? 0}`}>
            {copy.comments} {review.commentCount ?? 0}
          </span>
        </div>
      </footer>
    </article>
  );
}

export function ProductReviewSection({
  title,
  reviewCount,
  averageRating,
  ratingDistribution,
  reviews,
  copy,
  sortOptions,
  filter,
  defaultFilter = "all",
  onFilterChange,
  sortValue,
  defaultSortValue,
  onSortChange,
  initialVisibleCount = 6,
  viewMoreIncrement = 3,
  onWriteReview,
  className,
  ...rest
}: ProductReviewSectionProps) {
  const titleId = useId();
  const [internalFilter, setInternalFilter] = useState(defaultFilter);
  const [internalSort, setInternalSort] = useState(
    defaultSortValue ?? sortOptions[0]?.value ?? "",
  );
  const [visibleCount, setVisibleCount] = useState(Math.max(1, initialVisibleCount));
  const activeFilter = filter ?? internalFilter;
  const activeSort = sortValue ?? internalSort;
  const safeAverage = clampRating(averageRating);
  const starsLabel = copy.stars ?? "Stars";

  const distribution = useMemo(
    () =>
      ([5, 4, 3, 2, 1] as const).map((stars) => {
        const match = ratingDistribution.find((item) => item.stars === stars);
        return {
          stars,
          percentage: clampPercentage(match?.percentage ?? 0),
          count: match?.count,
        };
      }),
    [ratingDistribution],
  );

  const visibleReviews = useMemo(() => {
    const filtered = reviews.filter((review) => {
      if (activeFilter === "purchased") return review.verifiedPurchase;
      if (activeFilter === "photos") return Boolean(review.photos?.length);
      return true;
    });
    const comparator = sortOptions.find((option) => option.value === activeSort)?.compare;
    const sorted = comparator ? [...filtered].sort(comparator) : filtered;
    return {
      total: sorted.length,
      items: sorted.slice(0, visibleCount),
    };
  }, [activeFilter, activeSort, reviews, sortOptions, visibleCount]);

  const selectFilter = (nextFilter: ProductReviewFilter) => {
    if (filter === undefined) setInternalFilter(nextFilter);
    onFilterChange?.(nextFilter);
  };

  const selectSort = (nextSort: string) => {
    if (sortValue === undefined) setInternalSort(nextSort);
    onSortChange?.(nextSort);
  };

  const filters: Array<{ value: ProductReviewFilter; label: typeof copy.all }> = [
    { value: "all", label: copy.all },
    { value: "purchased", label: copy.purchased },
    { value: "photos", label: copy.photos },
  ];

  return (
    <section
      {...rest}
      className={cx(styles.root, className)}
      data-slot="product-review-section"
      data-active-filter={activeFilter}
      data-sort-value={activeSort}
      aria-labelledby={titleId}
    >
      <div className={styles.container} data-slot="product-review-section-container">
        <h2 id={titleId} className={styles.heading}>
          {title} <span>({reviewCount})</span>
        </h2>

        <div className={styles.summary} data-slot="product-review-summary">
          <div className={styles.summaryContent} data-slot="product-review-summary-content">
            <div className={styles.score}>
              <div className={styles.scoreSummary} data-slot="product-review-score-summary">
                <strong className={styles.average}>{safeAverage.toFixed(1)}</strong>
                <StarRating rating={safeAverage} />
                <span className={styles.reviewCount}>
                  {reviewCount} {copy.reviewsLabel}
                </span>
              </div>
              <Button
                className={styles.writeReview}
                variant="primary"
                size="md"
                onClick={onWriteReview}
                data-product-review-action="write-review"
              >
                {copy.writeReview}
              </Button>
            </div>

            <div className={styles.distribution} data-slot="product-review-distribution">
              {distribution.map((item) => (
                <div className={styles.distributionRow} key={item.stars}>
                  <span className={styles.distributionLabel}>
                    {item.stars} {starsLabel}
                  </span>
                  <div
                    className={styles.meter}
                    role="meter"
                    aria-label={`${item.stars} ${starsLabel}: ${item.percentage}%`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={item.percentage}
                    data-stars={item.stars}
                  >
                    <span
                      className={styles.meterFill}
                      style={{ inlineSize: `${item.percentage}%` }}
                    />
                  </div>
                  <span className={styles.percentage}>{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.toolbar}>
          <FilterChipGroup
            className={styles.filters}
            role="group"
            aria-label={accessibleText(copy.reviewsLabel, "Review filters")}
            data-product-review-filters="true"
          >
            {filters.map((item) => (
              <FilterChip
                key={item.value}
                variant={activeFilter === item.value ? "outlined" : "filled"}
                selected={activeFilter === item.value}
                onClick={() => selectFilter(item.value)}
                data-review-filter={item.value}
              >
                {item.label}
              </FilterChip>
            ))}
          </FilterChipGroup>

          <div className={styles.sort} data-product-review-sort="true">
            <FilterChipMenu
              label={copy.sortBy}
              popupAriaLabel={copy.sortBy}
              selectionMode="single"
              value={activeSort}
              onValueChange={selectSort}
              options={sortOptions.map((option) => ({
                value: option.value,
                label: accessibleText(option.label, option.value),
              }))}
              rightIcon={<img src={dropdownIcon} alt="" width={12} height={12} />}
            />
          </div>
        </div>

        {visibleReviews.items.length ? (
          <div className={styles.grid} data-slot="product-review-grid">
            {visibleReviews.items.map((review) => (
              <ReviewCard key={review.id} review={review} copy={copy} />
            ))}
          </div>
        ) : (
          <div className={styles.empty} role="status">
            <p>{copy.noReviews}</p>
            {activeFilter !== "all" ? (
              <Button variant="tertiary" onClick={() => selectFilter("all")}>
                {copy.resetFilter ?? copy.all}
              </Button>
            ) : null}
          </div>
        )}

        {visibleReviews.items.length < visibleReviews.total ? (
          <div className={styles.viewMoreRow}>
            <Button
              variant="tertiary"
              onClick={() =>
                setVisibleCount((current) => current + Math.max(1, viewMoreIncrement))
              }
              data-product-review-action="view-more"
            >
              {copy.viewMore}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
