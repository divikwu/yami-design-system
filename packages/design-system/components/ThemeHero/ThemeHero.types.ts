import type {
  HTMLAttributes,
  ImgHTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from "react";

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
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
}

export interface ThemeHeroProps
  extends Omit<HTMLAttributes<HTMLElement>, "children" | "title"> {
  title: ReactNode;
  description: ReactNode;
  image: ThemeHeroImage;
  /** Optional alternate source for the blurred decorative atmosphere. */
  backgroundImageSrc?: string;
  cta?: ThemeHeroCta;
  imageLoading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
}
