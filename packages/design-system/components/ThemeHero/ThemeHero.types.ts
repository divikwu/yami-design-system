import type {
  HTMLAttributes,
  ImgHTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from "react";

import type { BadgeSize, BadgeTone } from "../Badge";

export interface ThemeHeroImage {
  /** Image source for both the primary artwork and, by default, the atmosphere. */
  src: string;
  /** Meaningful description of the foreground brand artwork. */
  alt: string;
  /** Intrinsic width used to reserve the foreground image ratio. */
  width: number;
  /** Intrinsic height used to reserve the foreground image ratio. */
  height: number;
}

export interface ThemeHeroCta {
  label: string;
  ariaLabel?: string;
  /** ID of the section controlled by this action. */
  controls?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

export interface ThemeHeroProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "title"> {
  title: ReactNode;
  description: ReactNode;
  /** Localized label for expanding an overflowing two-line description. */
  descriptionExpandLabel?: ReactNode;
  /** Localized label for collapsing an expanded description. */
  descriptionCollapseLabel?: ReactNode;
  /** Optional short descriptive keywords rendered as non-interactive Badges. */
  tags?: readonly string[];
  /**
   * Preferred Badge geometry tier. ThemeHero compacts tags to sm below 1024px.
   * Defaults to sm.
   */
  tagSize?: BadgeSize;
  /** Translucent Badge polarity. Defaults to dark. */
  tagTone?: BadgeTone;
  image: ThemeHeroImage;
  /** Optional alternate source for the blurred decorative atmosphere. */
  backgroundImageSrc?: string;
  /** Pre-sampled bottom-edge color used by the adaptive mobile scrim. */
  backgroundColor?: string;
  /** Primary action rendered as the high-emphasis inverse button. */
  cta?: ThemeHeroCta;
  /** Optional lower-emphasis companion action. */
  secondaryCta?: ThemeHeroCta;
  imageLoading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
}
