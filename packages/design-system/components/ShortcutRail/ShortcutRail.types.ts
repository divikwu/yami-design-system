import type {
  HTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from "react";

import type { SectionDividerProps } from "../sectionDivider.types";
import type { ImageLoadingStrategy, ImageSource } from "../image.types";

export type ShortcutRailSurface = "card" | "plain";
export type ShortcutRailPresentation = "compact" | "image-card";

export interface ShortcutRailItem {
  /** Stable identity for React and analytics hooks. */
  id: string;
  /** Visible localized label. */
  label: ReactNode;
  /** Decorative icon source. The visible label names the destination. */
  iconSrc: ImageSource;
  /** Image treatment inside the circular surface. Full bleed fills and crops the entire circle. */
  imagePresentation?: "icon" | "full-bleed";
  /** Destination for the shortcut. */
  href: string;
  /** Optional navigation handler for page-level shortcut behavior. */
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

export interface ShortcutRailProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "title">,
    SectionDividerProps {
  /** Ordered shortcut destinations. */
  items: ShortcutRailItem[];
  /** Section surface. Card is inset and rounded; plain spans the available width. */
  surface?: ShortcutRailSurface;
  /** Visual treatment. Image card expands up to six PC entries into equal media tiles and falls back to compact PC entries for larger sets; mobile keeps its compact treatment. */
  presentation?: ShortcutRailPresentation;
  /** Optional visible section title. When present, the rail uses the titled gray-surface treatment. */
  title?: ReactNode;
  /** Localized accessible name for the navigation region. */
  ariaLabel?: string;
  /** Localized label for the previous-page control. */
  previousLabel?: string;
  /** Localized label for the next-page control. */
  nextLabel?: string;
  /**
   * Rows the mobile rail flows into below 1024px — Figma `3183:34141`,
   * `Property 1=1 Line` / `2 Lines`. Two rows page horizontally as a block, so
   * a long list stays one swipe deep. PC always renders a single row.
   */
  lines?: 1 | 2;
  /** Opt-in horizontal image request window. Defaults to native loading. */
  imageLoadingStrategy?: ImageLoadingStrategy;
}
