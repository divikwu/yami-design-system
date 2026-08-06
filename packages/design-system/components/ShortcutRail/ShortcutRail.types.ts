import type { HTMLAttributes, ReactNode } from "react";

export interface ShortcutRailItem {
  /** Stable identity for React and analytics hooks. */
  id: string;
  /** Visible localized label. */
  label: ReactNode;
  /** Decorative icon source. The visible label names the destination. */
  iconSrc: string;
  /** Destination for the shortcut. */
  href: string;
}

export interface ShortcutRailProps
  extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** Ordered shortcut destinations. */
  items: ShortcutRailItem[];
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
}
