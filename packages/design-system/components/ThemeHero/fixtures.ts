import type { ThemeHeroProps } from "./ThemeHero.types";

const anuaHero = new URL("./assets/anua-hero.webp", import.meta.url).href;
const anuaHeroAtmosphere = new URL(
  "./assets/anua-hero-atmosphere.webp",
  import.meta.url,
).href;

export function createThemeHeroProps(): ThemeHeroProps {
  return {
    title: "Anua: Gentle yet Effective Korean Skincare",
    description:
      "Anua pairs skin-friendly natural ingredients with focused actives to create straightforward formulas for everyday skin concerns.\nExplore cleansers, toners, serums, moisturizers, and more—designed to calm, hydrate, brighten, and support a healthy-looking skin barrier.",
    tags: [
      "Heartleaf Botanical",
      "Gentle Daily Formulas",
      "Targeted Active Care",
    ],
    tagSize: "sm",
    image: {
      src: anuaHero,
      alt: "Anua Korean skincare products displayed on a clear circular stand",
      width: 1672,
      height: 941,
    },
    backgroundImageSrc: anuaHeroAtmosphere,
    cta: { label: "Shop Products" },
    secondaryCta: { label: "Explore More" },
    imageLoading: "eager",
  };
}
