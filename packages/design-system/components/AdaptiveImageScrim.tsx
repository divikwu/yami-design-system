import type { HTMLAttributes } from "react";

import styles from "./AdaptiveImageScrim.module.css";

type AdaptiveImageScrimProps = HTMLAttributes<HTMLDivElement>;

export function AdaptiveImageScrim({
  className,
  ...props
}: AdaptiveImageScrimProps) {
  return (
    <div
      {...props}
      className={[styles.root, className].filter(Boolean).join(" ")}
      data-adaptive-image-scrim="true"
      aria-hidden="true"
    />
  );
}
