"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { RailNavigation } from "../Button/RailNavigation";
import { SectionHeading } from "../SectionHeading";

import styles from "./ReviewList.module.css";
import type { ReviewListProps } from "./ReviewList.types";
import { ReviewCard } from "./ReviewCard";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getPageDistance(rail: HTMLUListElement) {
  const [firstItem, secondItem] = Array.from(rail.children) as HTMLElement[];
  const itemStep =
    firstItem && secondItem ? secondItem.offsetLeft - firstItem.offsetLeft : 0;

  if (!firstItem || itemStep <= 0) return rail.clientWidth;

  const gap = Math.max(0, itemStep - firstItem.offsetWidth);
  const visibleItems = Math.max(
    1,
    Math.floor((rail.clientWidth + gap) / itemStep),
  );
  return visibleItems * itemStep;
}

export function ReviewList({
  title,
  mobileTitle,
  reviews,
  viewAllHref,
  viewAllLabel = "See all",
  previousLabel = "Previous reviews",
  nextLabel = "Next reviews",
  dividerPosition = "top",
  dividerVariant = "gray",
  className,
  ...rest
}: ReviewListProps) {
  const titleId = useId();
  const railRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({
    atStart: true,
    atEnd: true,
    canScroll: false,
  });

  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
    setEdges({
      atStart: rail.scrollLeft <= 1,
      atEnd: rail.scrollLeft >= maxScrollLeft - 1,
      canScroll: maxScrollLeft > 1,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    const rail = railRef.current;
    if (!rail || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [reviews.length, updateEdges]);

  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = direction * Math.max(getPageDistance(rail), 150);

    if (typeof rail.scrollBy === "function") {
      rail.scrollBy({
        left,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    } else {
      rail.scrollLeft += left;
      updateEdges();
    }
  }

  return (
    <section
      {...rest}
      className={cx(styles.root, className)}
      data-slot="review-list"
      data-divider-position={dividerPosition}
      data-divider-variant={dividerVariant}
      aria-labelledby={titleId}
    >
      <div className={styles.container} data-slot="review-list-container">
        <SectionHeading
          id={titleId}
          title={title}
          mobileTitle={mobileTitle ?? title}
          slot="review-list"
          className={styles.heading}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
          actions={edges.canScroll ? (
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
          ) : null}
        />

        <ul
          ref={railRef}
          className={styles.list}
          data-slot="review-list-items"
          onScroll={updateEdges}
        >
          {reviews.map((review) => (
            <li key={review.id} className={styles.item}>
              <ReviewCard {...review} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
