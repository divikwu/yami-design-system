"use client";

import { useEffect, useState, type RefObject } from "react";

import { extractImageBottomColor } from "./imageColor";

export function useImageBottomColor(
  src: string,
  fallback?: string,
  enabled = true,
  imageRef?: RefObject<HTMLImageElement | null>,
): string | undefined {
  const [color, setColor] = useState(fallback);

  useEffect(() => {
    let active = true;
    setColor(fallback);

    if (!enabled) return () => {
      active = false;
    };

    void extractImageBottomColor(src, imageRef?.current ?? undefined).then((nextColor) => {
      if (active && nextColor) setColor(nextColor);
    });

    return () => {
      active = false;
    };
  }, [enabled, fallback, imageRef, src]);

  return color;
}
