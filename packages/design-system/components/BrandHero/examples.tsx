import { BrandHero } from "./BrandHero";
import { createBrandHeroProps } from "./fixtures";

export function BrandHeroExample() {
  return <BrandHero {...createBrandHeroProps()} />;
}
