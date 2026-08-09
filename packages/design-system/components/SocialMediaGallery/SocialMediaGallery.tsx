"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { RailNavigation } from "../Button/RailNavigation";
import { SectionHeading } from "../SectionHeading";

import styles from "./SocialMediaGallery.module.css";
import type { SocialMediaGalleryProps } from "./SocialMediaGallery.types";
import { SocialVideoCard } from "./SocialVideoCard";

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

export function SocialMediaGallery({
  title,
  mobileTitle,
  cards,
  viewAllHref,
  viewAllLabel = "See all",
  previousLabel = "Previous social videos",
  nextLabel = "Next social videos",
  className,
  ...rest
}: SocialMediaGalleryProps) {
  const titleId = useId();
  const railRef = useRef<HTMLUListElement>(null);
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

  useEffect(() => {
    updateEdges();
    const rail = railRef.current;
    if (!rail || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [cards.length, updateEdges]);

  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const distance = Math.max(getPageDistance(rail), rail.clientWidth / 2);

    rail.scrollBy({
      left: direction * distance,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  return (
    <section
      {...rest}
      className={cx(styles.root, className)}
      data-slot="social-media-gallery"
      aria-labelledby={titleId}
    >
      <div className={styles.container} data-slot="social-media-gallery-container">
        <SectionHeading
          id={titleId}
          title={title}
          mobileTitle={mobileTitle ?? title}
          className={styles.heading}
          actionsClassName={styles.actions}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
          actions={
            <RailNavigation
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
          className={styles.list}
          data-slot="social-media-gallery-list"
          onScroll={updateEdges}
        >
          {cards.map((card) => (
            <li key={card.id} className={styles.item}>
              <SocialVideoCard {...card} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
