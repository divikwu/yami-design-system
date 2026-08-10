import { forwardRef, type HTMLAttributes } from "react";

import styles from "./Tag.module.css";

export type TagTone =
  | "dark"
  | "light"
  | "dark-outline"
  | "light-outline";

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Filled or outlined visual polarity.
   * Use dark variants on light or mixed backgrounds and light variants on dark backgrounds.
   */
  tone?: TagTone;
}

/**
 * Static, pill-shaped label for short descriptive keywords.
 * Tag is intentionally non-interactive; use a Button or Tabs for actions.
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag(
  { tone = "dark", className, children, ...rest },
  ref,
) {
  return (
    <span
      {...rest}
      ref={ref}
      className={[styles.tag, className].filter(Boolean).join(" ")}
      data-slot="tag"
      data-tone={tone}
    >
      {children}
    </span>
  );
});
