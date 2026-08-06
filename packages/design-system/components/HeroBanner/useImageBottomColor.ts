"use client";

import { useEffect, useState } from "react";

import { extractImageBottomColor } from "./imageColor";

export function useImageBottomColor(
  src: string,
  fallback?: string,
): string | undefined {
  const [color, setColor] = useState(fallback);

  useEffect(() => {
    let active = true;
    setColor(fallback);

    void extractImageBottomColor(src).then((nextColor) => {
      if (active && nextColor) setColor(nextColor);
    });

    return () => {
      active = false;
    };
  }, [fallback, src]);

  return color;
}
