import type {
  HTMLAttributes,
  ImgHTMLAttributes,
  ReactNode,
} from "react";

import type { SectionDividerProps } from "../sectionDivider.types";

export interface HeroBannerImage {
  src: string;
  alt: string;
}

export interface HeroBannerProduct {
  src: string;
  alt: string;
}

interface HeroBannerItemBase {
  id: string;
  href: string;
  backgroundColor?: string;
}

export interface HeroBannerImageOnlyItem extends HeroBannerItemBase {
  image: HeroBannerImage;
  title?: never;
  description?: never;
  products?: never;
}

export interface HeroBannerImageTextItem extends HeroBannerItemBase {
  image: HeroBannerImage;
  title: ReactNode;
  description?: ReactNode;
  products?: never;
}

export interface HeroBannerImageTextProductsItem extends HeroBannerItemBase {
  image: HeroBannerImage;
  title: ReactNode;
  description?: ReactNode;
  products: HeroBannerProduct[];
}

export interface HeroBannerProductsOnlyItem extends HeroBannerItemBase {
  image?: never;
  title: ReactNode;
  description?: never;
  products: HeroBannerProduct[];
}

export type HeroBannerItem =
  | HeroBannerImageOnlyItem
  | HeroBannerImageTextItem
  | HeroBannerImageTextProductsItem
  | HeroBannerProductsOnlyItem;

interface HeroBannerCardProps<TItem extends HeroBannerItem> {
  item: TItem;
}

export interface HeroBannerImageOnlyCardProps
  extends HeroBannerCardProps<HeroBannerImageOnlyItem> {
  imageLoading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
  priority?: boolean;
}

export interface HeroBannerImageTextCardProps
  extends HeroBannerCardProps<HeroBannerImageTextItem> {
  imageLoading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
  priority?: boolean;
}

export interface HeroBannerImageTextProductsCardProps
  extends HeroBannerCardProps<HeroBannerImageTextProductsItem> {
  imageLoading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
  priority?: boolean;
}

export interface HeroBannerProductsOnlyCardProps
  extends HeroBannerCardProps<HeroBannerProductsOnlyItem> {
  /**
   * Surface borrowed from a sibling when the card declares none of its own.
   * Supplied by `HeroBanner`, which owns the list and therefore the palette.
   *
   * `imageSrc` is the sibling's artwork, not its colour: sibling cards sample
   * their own artwork and paint the sampled result, so borrowing the declared
   * hex would land on a colour no card actually shows. Sampling the same image
   * reproduces the sibling's surface exactly. `color` is the sibling's declared
   * value, used until sampling resolves. `item.backgroundColor` always wins.
   */
  borrowedSurface?: { imageSrc?: string; color?: string };
}

export interface HeroBannerProps
  extends Omit<HTMLAttributes<HTMLElement>, "children">,
    SectionDividerProps {
  items: HeroBannerItem[];
  ariaLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  imageLoading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
  /**
   * Advances one card on an interval and wraps at the end. Pauses while the
   * banner is outside the viewport, the tab is hidden, the rail is hovered,
   * or focus is held inside it. Stays off for readers who ask for reduced
   * motion.
   */
  autoAdvance?: boolean;
  /** Seconds between automatic advances. */
  autoAdvanceInterval?: number;
  /** Reports the rendered surface color beneath the active banner copy. */
  onActiveSurfaceColorChange?: (color: string) => void;
}
