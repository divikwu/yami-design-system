export type PreviewTransition = "none" | "direction" | "path";

export function getPreviewMotion(transition: PreviewTransition, reduced: boolean) {
  const initial = transition === "path"
    ? { opacity: 0, y: reduced ? 0 : 8 }
    : transition === "direction"
      ? { opacity: 0 }
      : false;
  const duration = reduced ? 0 : transition === "path" ? 0.3 : transition === "direction" ? 0.2 : 0;
  return { initial, duration } as const;
}
