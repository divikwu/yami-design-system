"use client";

import { useCallback, useId, useRef, useState } from "react";

import { RailNavigation } from "../Button/RailNavigation";
import { ProductCard, type ProductCardProps } from "../ProductCard";
import { SectionHeading } from "../SectionHeading";

import styles from "./TrendingSearches.module.css";
import type { TrendingSearchesProps } from "./TrendingSearches.types";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function SparkleIcon() {
  return (
    <svg
      className={styles.sparkle}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 1.5 9.3 5.3 13 6.6 9.3 7.9 8 11.7 6.7 7.9 3 6.6 6.7 5.3 8 1.5Z"
        fill="currentColor"
      />
      <path
        d="M13 10.4 13.6 12.1 15.2 12.7 13.6 13.3 13 15 12.4 13.3 10.8 12.7 12.4 12.1 13 10.4Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChevronIcon({ direction }: { direction: "down" | "right" }) {
  return (
    <svg
      className={cx(styles.chevron, direction === "down" && styles.chevronDown)}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={direction === "down" ? "m3 6 5 5 5-5" : "m6 3 5 5-5 5"}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The terms shoppers are searching for, each with the results behind it.
 *
 * The two breakpoints are different components in everything but data. Desktop
 * is a rail of keyword cards, all open, because a wide row has space to show
 * four terms and their leading results at once. Mobile is a ranked accordion:
 * six terms fit in a screen only as a list, and the results for one of them
 * are worth a scroll. The shared markup renders both and CSS hides the half
 * that does not apply — `display: none` also takes it out of the
 * accessibility tree, so a reader meets one structure, never both.
 */
export function TrendingSearches({
  title,
  mobileTitle,
  keywords,
  seeAllLabel = "See all",
  previousLabel = "Previous searches",
  nextLabel = "Next searches",
  expandLabel = (keyword) => `Show results for ${keyword}`,
  defaultExpandedId,
  onAddToCart,
  className,
  ...rest
}: TrendingSearchesProps) {
  const titleId = useId();
  const panelId = useId();
  const railRef = useRef<HTMLUListElement>(null);
  const [expandedId, setExpandedId] = useState<string | null>(
    defaultExpandedId ?? keywords[0]?.id ?? null,
  );
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
    setEdges({
      atStart: rail.scrollLeft <= 1,
      atEnd: rail.scrollLeft >= maxScrollLeft - 1,
    });
  }, []);

  const scrollRail = useCallback((direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const [first, second] = Array.from(rail.children) as HTMLElement[];
    // One card per press. The cards are wide enough that a page of them is
    // most of the viewport, and landing mid-card reads as a mistake.
    const step =
      first && second
        ? second.offsetLeft - first.offsetLeft
        : rail.clientWidth;
    rail.scrollBy({ left: direction * step, behavior: "smooth" });
  }, []);

  return (
    <section
      {...rest}
      className={cx(styles.root, className)}
      data-slot="trending-searches"
      aria-labelledby={titleId}
    >
      <div className={styles.container} data-slot="trending-searches-container">
        <SectionHeading
          id={titleId}
          title={title}
          mobileTitle={mobileTitle ?? title}
          slot="trending-searches"
          className={styles.heading}
          actionsClassName={styles.actions}
          actions={
            <RailNavigation
              className={styles.railActions}
              previousLabel={previousLabel}
              nextLabel={nextLabel}
              previousDisabled={edges.atStart}
              nextDisabled={edges.atEnd}
              onPrevious={() => scrollRail(-1)}
              onNext={() => scrollRail(1)}
              buttonClassName={styles.railButton}
            />
          }
        />

        <ul
          ref={railRef}
          className={styles.rail}
          data-slot="trending-searches-list"
          onScroll={updateEdges}
        >
          {keywords.map((entry, index) => {
            const expanded = entry.id === expandedId;
            const entryPanelId = `${panelId}-${entry.id}`;

            return (
              <li
                key={entry.id}
                className={styles.item}
                data-slot="trending-searches-item"
                data-expanded={expanded}
              >
                {/* Mobile: the whole row is the toggle. Desktop hides it
                 * outright rather than leaving a control that does nothing. */}
                <button
                  type="button"
                  className={styles.toggle}
                  data-slot="trending-searches-toggle"
                  aria-expanded={expanded}
                  aria-controls={entryPanelId}
                  aria-label={expandLabel(entry.keyword)}
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                >
                  <span className={styles.rank} aria-hidden="true">
                    {index + 1}
                  </span>
                  {entry.thumbnail && (
                    /* Tile and image are separate elements on purpose: the
                     * image multiplies onto the tile, and an element cannot
                     * blend with its own background. Same split ProductCard
                     * uses for product media. */
                    <span className={styles.thumbnail}>
                      <img
                        className={styles.thumbnailImage}
                        src={entry.thumbnail.src}
                        alt={entry.thumbnail.alt}
                        width="40"
                        height="40"
                        loading="lazy"
                        decoding="async"
                      />
                    </span>
                  )}
                  <span className={styles.keyword}>{entry.keyword}</span>
                  <ChevronIcon direction="down" />
                </button>

                <div
                  id={entryPanelId}
                  className={styles.panel}
                  data-slot="trending-searches-panel"
                >
                  {/* Title and description are one block. The header is inside
                   * the panel rather than beside it because the tagline has to
                   * stay in the region the mobile toggle controls — grouping
                   * them the other way would have the description appear and
                   * disappear outside what `aria-controls` names. On mobile the
                   * header itself is display: none; the row above is the
                   * heading there. */}
                  <div className={styles.cardTop}>
                    <div className={styles.cardHeader}>
                      <span className={styles.rank} aria-hidden="true">
                        {index + 1}
                      </span>
                      <span
                        className={styles.keyword}
                        data-slot="trending-searches-keyword"
                      >
                        {entry.keyword}
                      </span>
                      <a
                        className={styles.seeAll}
                        href={entry.href}
                        data-slot="trending-searches-see-all"
                      >
                        {seeAllLabel}
                        <span className={styles.srOnly}> {entry.keyword}</span>
                      </a>
                    </div>

                    {entry.tagline && (
                      <p className={styles.tagline}>
                        <SparkleIcon />
                        <span className={styles.taglineText}>
                          {entry.tagline}
                        </span>
                      </p>
                    )}
                  </div>

                  <ul className={styles.products}>
                    {entry.products.map((product) => (
                      <li key={product.id} className={styles.product}>
                        <ProductCard
                          {...(product as ProductCardProps)}
                          onAddToCart={
                            onAddToCart
                              ? () => onAddToCart(product.id)
                              : undefined
                          }
                        />
                      </li>
                    ))}
                  </ul>

                  <a className={styles.explore} href={entry.href}>
                    {entry.exploreLabel ?? seeAllLabel}
                    <ChevronIcon direction="right" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
