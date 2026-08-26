import type { HTMLAttributes, MouseEventHandler } from "react";

export type ActivityPageHeaderLocale = "en" | "zh";

export interface ActivityPageHeaderProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "title"> {
  /** Short page or campaign title. Truncates to one line between the fixed actions. */
  title: string;
  /** Content locale. Mobile navigation keeps the English YAMI lockup in every locale. */
  locale?: ActivityPageHeaderLocale;
  /** Destination for the brand lockup. Omit while home navigation is not configured. */
  homeHref?: string;
  searchLabel?: string;
  cartLabel?: string;
  onSearch?: MouseEventHandler<HTMLButtonElement>;
  onCart?: MouseEventHandler<HTMLButtonElement>;
}
