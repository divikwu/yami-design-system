import { ThemeHero } from "./ThemeHero";
import { createThemeHeroProps } from "./fixtures";

export function ThemeHeroExample() {
  return <ThemeHero {...createThemeHeroProps()} />;
}
