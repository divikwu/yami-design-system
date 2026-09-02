"use client";

import { useEffect, useState } from "react";
import type { ContentHeading } from "../lib/content";

/** Desktop and compact TOCs track the same reading line, including hash/back navigation. */
export function useActiveHeading(headings: ContentHeading[]) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "");

  useEffect(() => {
    const targets = headings.map(({ id }) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
      let current = targets[0];
      for (const target of targets) {
        if (target.getBoundingClientRect().top > offset + 2) break;
        current = target;
      }
      setActiveId(current?.id ?? "");
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    const article = document.querySelector("article");
    if (article) observer.observe(article);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    window.addEventListener("popstate", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("popstate", schedule);
    };
  }, [headings]);

  return activeId;
}
