import type { HTMLAttributes, ImgHTMLAttributes } from "react";

export interface BillboardArtwork {
  /** Artwork source. */
  src: string;
  /**
   * Intrinsic pixel dimensions. Supplying them reserves the band's height
   * before the artwork arrives — the component has no content of its own to
   * establish a ratio, so without them the band is a strip of padding until
   * the image lands and then jumps to its full height.
   */
  width?: number;
  height?: number;
}

export interface BillboardImage extends BillboardArtwork {
  /**
   * Localized alt text. Empty when the artwork repeats the campaign name the
   * link already carries — the band then announces itself once, through
   * `label`, rather than twice.
   */
  alt: string;
  /**
   * Narrow-screen artwork, carrying its own dimensions: portrait campaign
   * assets rarely share the wide one's ratio, and a placeholder reserved at
   * the wrong ratio shifts the page just as surely as reserving none.
   */
  mobile?: BillboardArtwork;
}

export interface BillboardProps
  extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /**
   * The whole band is one piece of artwork — every word of the offer is drawn
   * into it. There is no text layer to compose, which is the point: campaign
   * teams ship a finished image rather than a copy deck.
   */
  image: BillboardImage;
  /** Destination for the band. */
  href: string;
  /**
   * Localized accessible name. It goes on the link, not just the band: a
   * reader listing links hears the band's own name there, and a band whose
   * alt text is empty otherwise reaches them as an unnamed link.
   */
  label: string;
  /** Artwork loading strategy; eager for a band above the fold. */
  imageLoading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
}
