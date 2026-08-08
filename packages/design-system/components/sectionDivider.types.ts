export type SectionDividerPosition = "top" | "bottom" | "none";

/**
 * Visual treatment for section boundaries.
 *
 * `gray` preserves the existing 1px structural separator. `black` uses the
 * theme-aware emphasis divider token at 2px.
 */
export type SectionDividerVariant = "gray" | "black";

export interface SectionDividerProps {
  /** Boundary edge. Individual components define whether it is available on mobile. */
  dividerPosition?: SectionDividerPosition;
  /** Coupled color and width treatment. Default: gray (1px). */
  dividerVariant?: SectionDividerVariant;
}
