"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type HorizontalScrollListState = {
  atStart: boolean;
  atEnd: boolean;
  canScroll: boolean;
};

export type UseHorizontalScrollListOptions = {
  enabled?: boolean;
  itemCount: number;
  minimumPageDistance: number;
};

function getPageDistance(list: HTMLElement) {
  const [firstItem, secondItem] = Array.from(list.children) as HTMLElement[];
  const itemStep =
    firstItem && secondItem ? secondItem.offsetLeft - firstItem.offsetLeft : 0;

  if (!firstItem || itemStep <= 0) return list.clientWidth;

  const gap = Math.max(0, itemStep - firstItem.offsetWidth);
  const visibleItems = Math.max(
    1,
    Math.floor((list.clientWidth + gap) / itemStep),
  );
  return visibleItems * itemStep;
}

/**
 * Shared horizontal-list behavior for finite, item-snapping rails. Callers
 * own item geometry; this hook owns edge state, resize observation, page
 * distance, reduced motion, and scrolling.
 */
export function useHorizontalScrollList({
  enabled = true,
  itemCount,
  minimumPageDistance,
}: UseHorizontalScrollListOptions) {
  const listRef = useRef<HTMLElement>(null);
  const [state, setState] = useState<HorizontalScrollListState>({
    atStart: true,
    atEnd: true,
    canScroll: false,
  });

  const updateState = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const maxScrollLeft = Math.max(0, list.scrollWidth - list.clientWidth);
    setState({
      atStart: list.scrollLeft <= 1,
      atEnd: list.scrollLeft >= maxScrollLeft - 1,
      canScroll: maxScrollLeft > 1,
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    updateState();
    const list = listRef.current;
    if (!list || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateState);
    observer.observe(list);
    return () => observer.disconnect();
  }, [enabled, itemCount, updateState]);

  const scrollByPage = useCallback(
    (direction: -1 | 1) => {
      if (!enabled) return;
      const list = listRef.current;
      if (!list) return;
      const reduceMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const distance =
        direction * Math.max(getPageDistance(list), minimumPageDistance);

      if (typeof list.scrollBy === "function") {
        list.scrollBy({
          left: distance,
          behavior: reduceMotion ? "auto" : "smooth",
        });
      } else {
        list.scrollLeft += distance;
        updateState();
      }
    },
    [enabled, minimumPageDistance, updateState],
  );

  return {
    listRef,
    state,
    updateState,
    scrollByPage,
  };
}
