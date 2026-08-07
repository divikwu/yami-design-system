import type { BrandHeroProps } from "./BrandHero.types";

const anuaHero = new URL("./assets/anua-hero.png", import.meta.url).href;

export function createBrandHeroProps(): BrandHeroProps {
  return {
    title: "Anua: Gentle yet Effective Korean Skincare",
    description:
      "Anua pairs skin-friendly natural ingredients with focused actives to create straightforward formulas for everyday skin concerns.\nExplore cleansers, toners, serums, moisturizers, and more—designed to calm, hydrate, brighten, and support a healthy-looking skin barrier.",
    image: {
      src: anuaHero,
      alt: "Anua Korean skincare products displayed on a clear circular stand",
      width: 1672,
      height: 941,
    },
    cta: { label: "Shop All Anua" },
    imageLoading: "eager",
  };
}
