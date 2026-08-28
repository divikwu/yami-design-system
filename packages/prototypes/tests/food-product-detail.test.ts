import { describe, expect, it } from "vitest";

import { createProductDetailPageFixture } from "../pages/ProductDetailPage/fixtures";
import { createFoodProductDetailPageFixture, foodProductSource } from "../pages/ProductDetailPage/food-fixtures";

describe("Food product detail fixture", () => {
  it.each(["en", "zh"] as const)("keeps the %s food snapshot independent of beauty content", (locale) => {
    const fixture = createFoodProductDetailPageFixture(locale);
    expect(foodProductSource.itemNumber).toBe("1020065241");
    expect(fixture.brand).toBe("TSUJIRI");
    expect(fixture.discountLabel).toBe(locale === "zh" ? "89折" : "11% off");
    expect(fixture.title).toContain("40");
    expect(fixture.images).toHaveLength(9);
    expect(new Set(fixture.images.map((image) => image.src)).size).toBe(9);
    expect(fixture.images.every((image) => image.alt.includes("TSUJIRI"))).toBe(true);
    expect(fixture.optionGroups).toEqual([]);
    expect(fixture.skus).toBeUndefined();
    expect(fixture.brandSection).toBeUndefined();
    expect(fixture.recentlyViewed).toBeUndefined();
    expect(fixture.region?.value).toBe(locale === "zh" ? "日本" : "Japan");
    expect(fixture.reviewSection?.reviewCount).toBe(33);
    expect(fixture.reviewSection?.reviews).toHaveLength(4);
    expect(fixture.reviewSection?.ratingDistribution.reduce((sum, row) => sum + row.percentage, 0)).toBe(100);
    expect(fixture.reviewSection?.reviews.every((review) => String(review.showOriginalHref).startsWith(foodProductSource.url))).toBe(true);
    expect(JSON.stringify([fixture.images, fixture.highlights, fixture.specifications, fixture.recommendations, fixture.reviewSection]))
      .not.toMatch(/Torriden|hyaluronic|面膜|玻尿酸|skincare/i);
  });

  it.each(["en", "zh"] as const)("uses eight source-linked food recommendations in %s", (locale) => {
    const { recommendations } = createFoodProductDetailPageFixture(locale);
    expect(recommendations).toHaveLength(8);
    expect(new Set(recommendations.map((product) => product.id)).size).toBe(8);
    for (const product of recommendations) {
      expect(product.href).toContain(`https://www.yami.com/us/${locale}/p/`);
      expect(product.href).toContain(product.id);
      expect(product.brandHref).toContain(`https://www.yami.com/us/${locale}/b/`);
      expect(product.image).toMatch(/^https:\/\/cdn\.yamibuy\.net\/item\//);
      expect(product.priceCurrent).toMatch(/^\$\d+\.\d{2}$/);
      expect(product.title).toMatch(locale === "zh" ? /抹茶/ : /matcha/i);
    }
  });

  it("does not mutate the existing beauty fixture", () => {
    const before = createProductDetailPageFixture("en");
    const snapshot = JSON.stringify(before);
    createFoodProductDetailPageFixture("en");
    createFoodProductDetailPageFixture("zh");
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(JSON.stringify(createProductDetailPageFixture("en"))).toBe(snapshot);
    expect(before.brand).toBe("Torriden");
    expect(before.optionGroups).toHaveLength(2);
  });
});
