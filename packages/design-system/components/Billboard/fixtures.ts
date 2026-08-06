import type { BillboardProps } from "./Billboard.types";

export type BillboardLocale = "zh" | "en";

/* Locale-specific desktop artwork from the production homepage. The narrow
 * artwork remains borrowed from ProductList for now, so changing the Chinese
 * desktop campaign does not replace the mobile source. */
const artworkEnDesktop = new URL(
  "./assets/new-user-offer.png",
  import.meta.url,
).href;
const artworkZhDesktop = new URL(
  "./assets/weekly-picks-zh-desktop.png",
  import.meta.url,
).href;
const artworkMobile = new URL(
  "../ProductList/assets/campaign-banner-mobile.png",
  import.meta.url,
).href;

/* The label is what a reader gets instead of the artwork, so it has to say
 * what the artwork says. Swapping the image without rewriting this is how a
 * band ends up announcing an offer it no longer shows. */
export const billboardCopy = {
  zh: {
    label: "本周好物推荐站，解锁生活新灵感，立即购买",
    alt: "",
  },
  en: {
    label:
      "New customer offer: 10% off with code WELCOME. Free shipping on $49+ orders, ships from the U.S., same-day delivery",
    alt: "",
  },
} as const;

export function createBillboardProps(
  locale: BillboardLocale,
  href: string,
): BillboardProps {
  const desktopArtwork =
    locale === "zh"
      ? { src: artworkZhDesktop, width: 3170, height: 320 }
      : { src: artworkEnDesktop, width: 1585, height: 160 };

  return {
    image: {
      ...desktopArtwork,
      mobile: { src: artworkMobile, width: 1158, height: 264 },
      // The artwork's every word is in the label already; repeating it here
      // would have a reader hear the offer twice.
      alt: billboardCopy[locale].alt,
    },
    href,
    label: billboardCopy[locale].label,
  };
}
