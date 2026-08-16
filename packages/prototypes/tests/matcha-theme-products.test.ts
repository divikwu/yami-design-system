import { describe, expect, it } from "vitest";

import {
  createMatchaProductsByCategory,
  createMatchaThemes,
  matchaWaterfallValues,
} from "../pages/TopicLandingPage/matcha.fixture";

describe("Matcha topic theme products", () => {
  it.each(["en", "zh"] as const)(
    "keeps the %s theme rails relevant and capped at six products",
    (locale) => {
      const themes = createMatchaThemes(locale);

      expect(themes).toHaveLength(3);
      expect(themes.map((theme) => theme.value)).toEqual([
        "pure-matcha",
        "matcha-drinks",
        "matcha-treats",
      ]);
      expect(
        themes.every(
          (theme) =>
            new Set(theme.products.map((product) => product.id)).size ===
            theme.products.length,
        ),
      ).toBe(true);
      expect(
        themes.every(
          (theme) => theme.products.length > 0 && theme.products.length <= 6,
        ),
      ).toBe(true);
    },
  );

  it.each(["en", "zh"] as const)(
    "includes a linked brand for every %s topic product",
    (locale) => {
      const productsByCategory = createMatchaProductsByCategory(locale);
      const products = matchaWaterfallValues.flatMap(
        (value) => productsByCategory[value],
      );

      expect(products.length).toBeGreaterThan(0);
      expect(
        products.every(
          (product) =>
            Boolean(product.brand) &&
            product.brandHref?.startsWith(`https://www.yami.com/us/${locale}/b/`),
        ),
      ).toBe(true);
    },
  );
});
