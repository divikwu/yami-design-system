import { describe, expect, it } from "vitest";

import { matchaCategoryValues } from "./matcha.fixture";
import { createTopicKeywordLandingPageFixture } from "./topic.fixtures";

describe("Matcha Topic popular picks", () => {
  it.each(["en", "zh"] as const)(
    "provides distinct product data for every %s tab",
    (locale) => {
      const productRail = createTopicKeywordLandingPageFixture(locale).productRail;
      const expectedValues = ["popular-all", ...matchaCategoryValues];
      const productsByTab: Record<string, typeof productRail.products> =
        productRail.productsByTab ?? {};

      expect(productRail.tabs?.map(({ value }) => value)).toEqual(expectedValues);
      expect(Object.keys(productsByTab)).toEqual(expectedValues);
      expect(productsByTab["popular-all"]?.map(({ id }) => id)).toEqual(
        productRail.products.map(({ id }) => id),
      );

      const expectedCounts = {
        powder: 5,
        latte: 4,
        snacks: 4,
        chocolate: 4,
        sweets: 4,
        tools: 8,
      } as const;

      for (const value of matchaCategoryValues) {
        const productIds = productsByTab[value]?.map(({ id }) => id);
        expect(productIds).toHaveLength(expectedCounts[value]);
        expect(new Set(productIds).size).toBe(expectedCounts[value]);
      }

      expect(productsByTab.tools?.map(({ id }) => id)).toEqual([
        "matcha-5029290231",
        "matcha-1029313261",
        "matcha-1029215511",
        "matcha-5029205111",
        "matcha-1029217101",
        "matcha-1029217111",
        "matcha-1029040641",
        "matcha-3029302901",
      ]);
    },
  );
});
