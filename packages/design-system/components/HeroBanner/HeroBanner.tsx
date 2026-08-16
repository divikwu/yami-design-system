"use client";

import type { RefObject } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { RailNavigation } from "../Button/RailNavigation";

import styles from "./HeroBanner.module.css";
import { HeroBannerImageOnlyCard } from "./HeroBannerImageOnlyCard";
import { HeroBannerImageTextCard } from "./HeroBannerImageTextCard";
import { HeroBannerImageTextProductsCard } from "./HeroBannerImageTextProductsCard";
import { HeroBannerProductsOnlyCard } from "./HeroBannerProductsOnlyCard";
import type { HeroBannerImageOnlyItem, HeroBannerItem, HeroBannerProps } from "./HeroBanner.types";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getPageMetrics(rail: HTMLDivElement) {
  const [firstItem, secondItem] = Array.from(rail.children) as HTMLElement[];
  const itemStep =
    firstItem && secondItem ? secondItem.offsetLeft - firstItem.offsetLeft : 0;

  if (!firstItem || itemStep <= 0) {
    const pageDistance = Math.max(rail.clientWidth, 1);
    return {
      itemStep: pageDistance,
      pageDistance,
      visibleItems: 1,
    };
  }

  const gap = Math.max(0, itemStep - firstItem.offsetWidth);
  const visibleItems = Math.max(
    1,
    Math.floor((rail.clientWidth + gap) / itemStep),
  );
  const pageDistance = visibleItems * itemStep;

  return {
    itemStep,
    pageDistance,
    visibleItems,
  };
}

function getActiveSurfaceColor(rail: HTMLDivElement) {
  const railRect = rail.getBoundingClientRect();
  const activeItem = Array.from(rail.children)
    .filter(
      (item): item is HTMLElement =>
        item instanceof HTMLElement &&
        getComputedStyle(item).display !== "none",
    )
    .reduce<HTMLElement | undefined>((mostVisible, item) => {
      if (!mostVisible) return item;
      const itemRect = item.getBoundingClientRect();
      const mostVisibleRect = mostVisible.getBoundingClientRect();
      const visibleWidth = Math.max(
        0,
        Math.min(itemRect.right, railRect.right) -
          Math.max(itemRect.left, railRect.left),
      );
      const mostVisibleWidth = Math.max(
        0,
        Math.min(mostVisibleRect.right, railRect.right) -
          Math.max(mostVisibleRect.left, railRect.left),
      );
      return visibleWidth > mostVisibleWidth ? item : mostVisible;
    }, undefined);
  const card = activeItem?.querySelector<HTMLElement>(
    '[data-slot="hero-banner-item"]',
  );
  const copy = card?.querySelector<HTMLElement>(
    '[data-slot="hero-banner-copy"]',
  );
  const surface = copy?.parentElement ?? card;
  return surface ? getComputedStyle(surface).backgroundColor : undefined;
}

type BorrowedSurface = { imageSrc?: string; color?: string };

/**
 * Surfaces available to borrow from — siblings that actually paint one.
 *
 * The artwork travels, not the declared hex: a card samples its own artwork and
 * paints the sampled result, so a declared value would land on a colour no card
 * on screen actually shows. Image-only cards are excluded for the same reason —
 * they carry artwork but render no surface behind it, so borrowing from one
 * would again produce a colour with no match in the rail.
 */
function siblingPalette(
  items: HeroBannerItem[],
  item: HeroBannerItem,
): BorrowedSurface[] {
  return items
    .filter(
      (other) =>
        other.id !== item.id && other.image && other.title !== undefined,
    )
    .map((other) => ({
      imageSrc: other.image?.src,
      color: other.backgroundColor,
    }));
}

/** Stable pick, derived from the item id. Used for the server render. */
function paletteByItemId(
  palette: BorrowedSurface[],
  id: string,
): BorrowedSurface | undefined {
  if (palette.length === 0) return undefined;
  let hash = 0;
  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }
  return palette[hash % palette.length];
}

/**
 * Re-rolls each borrowed surface once per mount, so a reload varies the rail.
 *
 * The roll happens in an effect rather than during render: this component is
 * server-rendered, and `Math.random()` in the render path would paint a
 * different colour on the server than on the client and fail hydration. The
 * first paint therefore uses the id-derived pick, which the roll then replaces.
 */
function useBorrowedBackgrounds(items: HeroBannerItem[]) {
  const borrowers = items.filter(
    (item) => item.image === undefined && item.backgroundColor === undefined,
  );
  const initial: Record<string, BorrowedSurface | undefined> = {};
  for (const item of borrowers) {
    initial[item.id] = paletteByItemId(siblingPalette(items, item), item.id);
  }

  const [borrowed, setBorrowed] = useState(initial);
  const signature = borrowers.map((item) => item.id).join("|");

  useEffect(() => {
    const rolled: Record<string, BorrowedSurface | undefined> = {};
    for (const item of borrowers) {
      const palette = siblingPalette(items, item);
      rolled[item.id] =
        palette.length === 0
          ? undefined
          : palette[Math.floor(Math.random() * palette.length)];
    }
    setBorrowed(rolled);
    // `signature` stands in for the borrower list: re-roll when it changes, not
    // on every parent render.
  }, [signature]);

  return borrowed;
}

/**
 * Pins the products-only card to the last slot of the first view, measured once
 * per list.
 *
 * The slot is a snapshot, not a live media query: it is taken from how many
 * cards actually fit at mount, and deliberately survives a resize. Narrowing the
 * window therefore reshuffles nothing — only a reload re-measures. That is why
 * this is flex `order` set from a measurement rather than CSS breakpoints.
 *
 * Returns `null` while unmeasured, and when the card is absent or hidden (below
 * 1024px it is `display: none`), in which case the authored DOM order stands.
 */
function useTailSlotOrder(
  items: HeroBannerItem[],
  railRef: RefObject<HTMLDivElement | null>,
) {
  const [order, setOrder] = useState<Record<string, number> | null>(null);
  const signature = items.map((item) => item.id).join("|");

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const tailIndex = items.findIndex((item) => item.image === undefined);
    const tailElement = rail.children[tailIndex] as HTMLElement | undefined;
    if (
      tailIndex === -1 ||
      !tailElement ||
      getComputedStyle(tailElement).display === "none"
    ) {
      setOrder(null);
      return;
    }

    // `flex-basis` divides the rail exactly, so n cards plus n-1 gaps fill it:
    // n = (width + gap) / step is a whole number, and rounding absorbs the
    // sub-pixel error either way. Measured from fractional rects rather than
    // `getPageMetrics`, which reads integer `offsetLeft` / `offsetWidth` — at
    // 1024px that rounds a 314.67px step up to 315 and loses the third card.
    const gap = Number.parseFloat(getComputedStyle(rail).columnGap) || 0;
    const step =
      (rail.children[0] as HTMLElement).getBoundingClientRect().width + gap;
    const visibleItems =
      step > 0 ? Math.max(1, Math.round((rail.clientWidth + gap) / step)) : 1;
    const slot = Math.max(0, visibleItems - 1);
    const rest = items.filter((_, index) => index !== tailIndex);
    const sequence = [
      ...rest.slice(0, slot),
      items[tailIndex],
      ...rest.slice(slot),
    ];

    const next: Record<string, number> = {};
    sequence.forEach((item, index) => {
      next[item.id] = index + 1;
    });
    setOrder(next);
    // Measured once per list. Resizing must not re-run this — holding the slot
    // across a resize is the point.
  }, [signature]);

  return order;
}

function HeroBannerItemCard({
  item,
  imageLoading,
  priority,
  borrowedSurface,
}: {
  item: HeroBannerItem;
  imageLoading: HeroBannerProps["imageLoading"];
  priority: boolean;
  borrowedSurface: BorrowedSurface | undefined;
}) {
  if (item.image === undefined) {
    return (
      <HeroBannerProductsOnlyCard item={item} borrowedSurface={borrowedSurface} />
    );
  }

  if (item.products !== undefined) {
    return (
      <HeroBannerImageTextProductsCard
        item={item}
        imageLoading={imageLoading}
        priority={priority}
      />
    );
  }

  if (item.title !== undefined) {
    return (
      <HeroBannerImageTextCard
        item={item}
        imageLoading={imageLoading}
        priority={priority}
      />
    );
  }

  return (
    <HeroBannerImageOnlyCard
      item={item as HeroBannerImageOnlyItem}
      imageLoading={imageLoading}
      priority={priority}
    />
  );
}

export function HeroBanner({
  items,
  ariaLabel = "Featured promotions",
  previousLabel = "Previous promotions",
  nextLabel = "Next promotions",
  imageLoading = "lazy",
  dividerPosition = "none",
  dividerVariant = "gray",
  autoAdvance = true,
  autoAdvanceInterval = 5,
  onActiveSurfaceColorChange,
  className,
  ...rest
}: HeroBannerProps) {
  const borrowedBackgrounds = useBorrowedBackgrounds(items);
  const rootRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const tailOrder = useTailSlotOrder(items, railRef);
  /* Looping rides with auto-advance: a rail that moves on its own has to have
   * somewhere to go at the end, while a static one is a plain scroller and
   * should not pay for a duplicated card set. */
  const looping = autoAdvance && items.length > 1;
  const firstImageIndex = items.findIndex((item) => item.image !== undefined);
  const [railState, setRailState] = useState({
    atStart: true,
    atEnd: items.length <= 1,
    currentItem: 1,
  });

  const updateRailState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const { itemStep } = getPageMetrics(rail);
    // The counter reports the card at the left edge — where the reader is in
    // the list — rather than the last one they can see, which moved in steps
    // of a whole view and sat at the total for the entire final page. The
    // modulo covers the moment a looping rail is inside the second copy but
    // has not rebased yet: the ninth card there is the second one again.
    const currentItem =
      (Math.max(0, Math.round(rail.scrollLeft / itemStep)) % items.length) + 1;
    setRailState({
      // A looping rail has no ends to disable against, and the reader is
      // always somewhere inside the first copy once a scroll has settled.
      atStart: looping ? false : rail.scrollLeft <= 1,
      atEnd: looping ? false : rail.scrollLeft >= maxScrollLeft - 1,
      currentItem,
    });
  }, [items.length, looping]);

  const syncActiveSurfaceColor = useCallback(() => {
    const rail = railRef.current;
    if (!rail || !onActiveSurfaceColorChange) return;
    const color = getActiveSurfaceColor(rail);
    if (color) onActiveSurfaceColorChange(color);
  }, [onActiveSurfaceColorChange]);

  const handleRailScroll = useCallback(() => {
    updateRailState();
    syncActiveSurfaceColor();
  }, [syncActiveSurfaceColor, updateRailState]);

  useEffect(() => {
    updateRailState();
    const rail = railRef.current;
    if (!rail || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateRailState);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [items.length, updateRailState]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !onActiveSurfaceColorChange) return;

    syncActiveSurfaceColor();

    const observer = new MutationObserver(syncActiveSurfaceColor);
    observer.observe(rail, {
      attributes: true,
      attributeFilter: ["style"],
      subtree: true,
    });
    return () => observer.disconnect();
  }, [onActiveSurfaceColorChange, syncActiveSurfaceColor]);

  /* One banner per press, matching the auto-advance and the "N / 7" the
   * counter shows. Paging a whole view instead would step the counter by
   * three or four at a time and skip campaigns the reader never saw, and
   * `scroll-snap-stop: always` would cap the jump at one card regardless. */
  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const { itemStep } = getPageMetrics(rail);

    if (typeof rail.scrollBy === "function") {
      rail.scrollBy({
        left: direction * itemStep,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    } else {
      rail.scrollLeft += direction * itemStep;
      updateRailState();
    }
  }

  /* One card per tick.
   *
   * The list loops by rendering a second copy of the cards after the first
   * and sliding back one copy's width once the scroll has settled past it.
   * The reader sees the first card follow the last, because by then it is the
   * clone being shown and the jump lands on the identical position — no
   * rewind. Rotating the items instead would fight the flex `order` that pins
   * the products-only card to the tail slot of the first view.
   *
   * Paused while the pointer is over the rail or something inside holds
   * focus, so it cannot move out from under a reader or a keyboard user, and
   * while the banner or browser tab is not visible, so the timer does no work
   * off screen. Left off entirely for reduced motion — an auto-advancing
   * carousel is exactly the moving content that setting asks to stop. */
  const advanceOneCard = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const { itemStep } = getPageMetrics(rail);
    if (itemStep <= 0) return;

    // Each tick starts from a card boundary rather than from wherever the
    // previous scroll happens to be: the rounding re-aligns a tick that fired
    // while the last one was still animating, so the rail cannot drift a
    // fraction of a card per advance.
    let from = Math.round(rail.scrollLeft / itemStep) * itemStep;

    // Rebase here as well as on settle. Settling is the usual path, but a
    // short interval can keep the rail in continuous motion, and then the
    // scroll never quiets down long enough to rebase and would eventually run
    // off the end of the second copy.
    const setWidth = itemStep * items.length;
    if (looping && setWidth > 0 && from >= setWidth) {
      from -= setWidth;
      rail.scrollLeft = from;
    }

    rail.scrollTo({ left: from + itemStep, behavior: "smooth" });
  }, [looping, items.length]);

  /* Runs once the scroll settles rather than mid-flight: rewriting scrollLeft
   * during a smooth scroll cancels it, which would strand an advance halfway
   * across a card. */
  const normaliseLoop = useCallback(() => {
    const rail = railRef.current;
    if (!looping || !rail) return;
    const { itemStep } = getPageMetrics(rail);
    const setWidth = itemStep * items.length;
    if (setWidth > 0 && rail.scrollLeft >= setWidth) {
      rail.scrollLeft -= setWidth;
      syncActiveSurfaceColor();
    }
  }, [looping, items.length, syncActiveSurfaceColor]);

  useEffect(() => {
    const rail = railRef.current;
    if (!looping || !rail) return;
    // `scrollend` fires after both a gesture and a smooth programmatic scroll;
    // the timeout covers engines that do not have it yet.
    let settle: number | undefined;
    const onScroll = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(normaliseLoop, 150);
    };
    rail.addEventListener("scrollend", normaliseLoop);
    rail.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(settle);
      rail.removeEventListener("scrollend", normaliseLoop);
      rail.removeEventListener("scroll", onScroll);
    };
  }, [looping, normaliseLoop]);

  useEffect(() => {
    if (!autoAdvance || items.length <= 1) return;
    const root = rootRef.current;
    const rail = railRef.current;
    if (!root || !rail) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: number | undefined;
    let pausedByInteraction = false;
    const supportsViewportObservation =
      typeof IntersectionObserver !== "undefined";
    let inViewport = !supportsViewportObservation;

    const stopTimer = () => {
      window.clearInterval(timer);
      timer = undefined;
    };
    const startTimer = () => {
      if (timer !== undefined) return;
      timer = window.setInterval(() => {
        if (!pausedByInteraction && inViewport && !document.hidden) {
          advanceOneCard();
        }
      }, autoAdvanceInterval * 1000);
    };
    const syncTimer = () => {
      if (pausedByInteraction || !inViewport || document.hidden) {
        stopTimer();
      } else {
        startTimer();
      }
    };
    const pause = () => {
      pausedByInteraction = true;
      syncTimer();
    };
    const resume = () => {
      pausedByInteraction = false;
      syncTimer();
    };

    rail.addEventListener("pointerenter", pause);
    rail.addEventListener("pointerleave", resume);
    rail.addEventListener("focusin", pause);
    rail.addEventListener("focusout", resume);
    document.addEventListener("visibilitychange", syncTimer);

    const observer = supportsViewportObservation
      ? new IntersectionObserver(([entry]) => {
            inViewport = entry?.isIntersecting ?? false;
            syncTimer();
          })
      : undefined;
    observer?.observe(root);
    syncTimer();

    return () => {
      stopTimer();
      observer?.disconnect();
      rail.removeEventListener("pointerenter", pause);
      rail.removeEventListener("pointerleave", resume);
      rail.removeEventListener("focusin", pause);
      rail.removeEventListener("focusout", resume);
      document.removeEventListener("visibilitychange", syncTimer);
    };
  }, [autoAdvance, autoAdvanceInterval, advanceOneCard, items.length]);

  return (
    <section
      {...rest}
      ref={rootRef}
      className={cx(styles.root, className)}
      data-slot="hero-banner"
      data-divider-position={dividerPosition}
      data-divider-variant={dividerVariant}
      aria-label={ariaLabel}
    >
      <div
        ref={railRef}
        className={styles.list}
        data-slot="hero-banner-list"
        role="list"
        tabIndex={0}
        onScroll={handleRailScroll}
      >
        {items.map((item, index) => (
          <div
            key={item.id}
            className={cx(
              styles.item,
              item.image === undefined && styles.productsOnlyItem,
            )}
            role="listitem"
            style={tailOrder ? { order: tailOrder[item.id] } : undefined}
          >
            <HeroBannerItemCard
              item={item}
              imageLoading={imageLoading}
              priority={index === firstImageIndex}
              borrowedSurface={borrowedBackgrounds[item.id]}
            />
          </div>
        ))}

        {/* The second copy that makes the loop seamless. It is scenery, not
         * content: `inert` takes the whole subtree out of both the
         * accessibility tree and the tab order, so each card is announced and
         * reachable exactly once — aria-hidden alone would leave focusable
         * links inside a region screen readers are told to ignore. Its order
         * continues the first copy's so the two stay in step whether or not
         * the tail slot has reordered them. */}
        {looping &&
          items.map((item) => (
            <div
              key={`${item.id}-loop`}
              className={cx(
                styles.item,
                item.image === undefined && styles.productsOnlyItem,
              )}
              inert
              data-loop-clone="true"
              style={
                tailOrder
                  ? { order: tailOrder[item.id] + items.length }
                  : undefined
              }
            >
              <HeroBannerItemCard
                item={item}
                imageLoading="lazy"
                priority={false}
                borrowedSurface={borrowedBackgrounds[item.id]}
              />
            </div>
          ))}
      </div>

      {items.length > 1 && (
        <div className={styles.controls}>
          <span
            className={styles.progressLine}
            role="progressbar"
            aria-label="Banner progress"
            aria-valuemin={1}
            aria-valuemax={items.length}
            aria-valuenow={railState.currentItem}
          >
            <span
              className={styles.progressFill}
              data-slot="hero-banner-progress-fill"
              style={{
                width: `${((railState.currentItem / items.length) * 100).toFixed(4)}%`,
              }}
            />
          </span>
          <span
            className={styles.progress}
            data-slot="hero-banner-progress"
            aria-live="polite"
          >
            {railState.currentItem} / {items.length}
          </span>
          <RailNavigation
            className={styles.actions}
            previousLabel={previousLabel}
            nextLabel={nextLabel}
            previousDisabled={railState.atStart}
            nextDisabled={railState.atEnd}
            onPrevious={() => scrollRail(-1)}
            onNext={() => scrollRail(1)}
          />
        </div>
      )}
    </section>
  );
}
