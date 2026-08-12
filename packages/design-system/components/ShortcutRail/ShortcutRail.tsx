"use client";

import type { CSSProperties } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { RailNavigationButton } from "../Button/RailNavigation";
import {
  handleProgressiveImageError,
  handleProgressiveImageLoad,
  prepareProgressiveImage,
} from "../progressiveImage";

import styles from "./ShortcutRail.module.css";
import type { ShortcutRailProps } from "./ShortcutRail.types";

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

export function ShortcutRail({
  items,
  surface = "plain",
  title,
  ariaLabel = "Featured shortcuts",
  previousLabel = "Previous shortcuts",
  nextLabel = "Next shortcuts",
  lines = 1,
  dividerPosition = "none",
  dividerVariant = "gray",
  className,
  style,
  ...rest
}: ShortcutRailProps) {
  const titleId = useId();
  const railRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });
  const imagePresentation =
    items.length > 0 &&
    items.every((item) => item.imagePresentation === "full-bleed")
      ? "full-bleed"
      : "icon";

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
  }, [items.length, updateEdges]);

  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const distance = Math.max(getPageDistance(rail), rail.clientWidth / 2);

    if (typeof rail.scrollBy === "function") {
      rail.scrollBy({
        left: direction * distance,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    } else {
      rail.scrollLeft += direction * distance;
      updateEdges();
    }
  }

  return (
    <nav
      {...rest}
      className={cx(styles.root, className)}
      aria-label={title ? undefined : ariaLabel}
      aria-labelledby={title ? titleId : undefined}
      data-slot="shortcut-rail"
      data-lines={lines}
      data-rail-presentation={imagePresentation}
      data-has-title={title ? "true" : undefined}
      data-surface={surface}
      data-divider-position={dividerPosition}
      data-divider-variant={dividerVariant}
      style={
        {
          ...style,
          "--shortcut-rail-lines": lines,
        } as CSSProperties
      }
    >
      <div className={styles.surface} data-slot="shortcut-rail-surface">
        <div
          className={styles.container}
          data-slot="shortcut-rail-container"
        >
          {title && (
            <h2
              id={titleId}
              className={styles.title}
              data-slot="shortcut-rail-title"
            >
              {title}
            </h2>
          )}

          <div className={styles.railBody} data-slot="shortcut-rail-body">
            <ul
              ref={railRef}
              className={styles.list}
              data-slot="shortcut-rail-list"
              onScroll={updateEdges}
            >
              {items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <a
                    className={styles.link}
                    href={item.href}
                    onClick={item.onClick}
                    data-slot="shortcut-rail-link"
                  >
                    <span
                      className={styles.iconSurface}
                      data-image-presentation={
                        item.imagePresentation ?? "icon"
                      }
                      aria-hidden="true"
                    >
                      <img
                        ref={prepareProgressiveImage}
                        className={styles.icon}
                        src={item.iconSrc}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        onLoad={handleProgressiveImageLoad}
                        onError={handleProgressiveImageError}
                      />
                    </span>
                    <span
                      className={styles.label}
                      data-slot="shortcut-rail-label"
                    >
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>

            {!edges.atStart && (
              <span
                className={cx(styles.edge, styles.edgePrevious)}
                data-slot="shortcut-rail-edge"
                data-direction="previous"
              >
                <span className={styles.mask} aria-hidden="true" />
                <RailNavigationButton
                  className={styles.control}
                  direction="left"
                  label={previousLabel}
                  onClick={() => scrollRail(-1)}
                />
              </span>
            )}

            {!edges.atEnd && (
              <span
                className={cx(styles.edge, styles.edgeNext)}
                data-slot="shortcut-rail-edge"
                data-direction="next"
              >
                <span className={styles.mask} aria-hidden="true" />
                <RailNavigationButton
                  className={styles.control}
                  direction="right"
                  label={nextLabel}
                  onClick={() => scrollRail(1)}
                />
              </span>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}
