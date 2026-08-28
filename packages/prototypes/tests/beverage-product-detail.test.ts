import { describe, expect, it } from "vitest";

import { beverageProductSource, createBeverageProductDetailPageFixture } from "../pages/ProductDetailPage/beverage-fixtures";
import { createProductDetailPageFixture } from "../pages/ProductDetailPage/fixtures";
import { createFoodProductDetailPageFixture } from "../pages/ProductDetailPage/food-fixtures";

describe("Beverage product detail fixture", () => {
  it.each(["en", "zh"] as const)("keeps the %s banana drink independent of other products", (locale) => {
    const fixture = createBeverageProductDetailPageFixture(locale);
    expect(beverageProductSource.itemNumber).toBe("1020002371");
    expect(fixture.brand).toBe("BINGGRAE");
    expect(fixture.title).toContain("200");
    expect(fixture.images).toHaveLength(11);
    expect(new Set(fixture.images.map((image) => image.src)).size).toBe(11);
    expect(fixture.images.every((image) => image.alt.includes("BINGGRAE") && typeof image.src === "string" && image.src.includes("/item/"))).toBe(true);
    expect(fixture.optionGroups).toEqual([]);
    expect(fixture.skus).toBeUndefined();
    expect(fixture.ranking).toBe("");
    expect(fixture.brandSection).toBeUndefined();
    expect(fixture.recentlyViewed).toBeUndefined();
    expect(fixture.region?.value).toBe(locale === "zh" ? "韩国" : "Korea");
    expect(fixture.priceCurrent).toBe("$6.89");
    expect(fixture.priceOriginal).toBe("$8.89");
    expect(fixture.discountLabel).toBe(locale === "zh" ? "78折" : "22% off");
    expect(fixture.reviewSection?.reviewCount).toBe(539);
    expect(fixture.reviewSection?.reviews).toHaveLength(4);
    expect(fixture.reviewSection?.ratingDistribution.reduce((sum, row) => sum + row.percentage, 0)).toBe(100);
    expect(fixture.reviewSection?.reviews.every((review) => String(review.showOriginalHref).startsWith(beverageProductSource.url))).toBe(true);
    expect(JSON.stringify([fixture.images, fixture.highlights, fixture.specifications, fixture.recommendations, fixture.reviewSection]))
      .not.toMatch(/Torriden|TSUJIRI|matcha|抹茶|面膜|玻尿酸/i);
    expect(fixture.ingredients?.allergens).toBe(locale === "zh" ? "含牛奶。" : "Contains milk.");
    expect(fixture.specifications).toContainEqual({ label: locale === "zh" ? "储存方式" : "Storage", value: locale === "zh" ? "开封后冷藏" : "Refrigerate after opening" });
    expect(fixture.ingredients?.body).toContain("0.32%");
    expect(fixture.specifications.some((item) => item.label === (locale === "zh" ? "配料" : "Ingredients"))).toBe(false);
  });

  it.each(["en", "zh"] as const)("uses source-linked beverage recommendations in %s", (locale) => {
    const { recommendations } = createBeverageProductDetailPageFixture(locale);
    expect(recommendations).toHaveLength(8);
    expect(new Set(recommendations.map((product) => product.id)).size).toBe(8);
    for (const product of recommendations) {
      expect(product.href).toContain(`https://www.yami.com/us/${locale}/p/`);
      expect(product.href).toContain(product.id);
      expect(product.brandHref).toContain(`https://www.yami.com/us/${locale}/b/`);
      expect(product.image).toMatch(/^https:\/\/cdn\.yamibuy\.net\/item\//);
      expect(product.priceCurrent).toMatch(/^\$\d+\.\d{2}$/);
    }
    expect(recommendations.find((product) => product.id === "1020098591")?.priceOriginal).toBeUndefined();
    expect(recommendations.find((product) => product.id === "1020090011")?.priceOriginal).toBeUndefined();
  });

  it("preserves the existing beauty and food fixtures", () => {
    const before = [createProductDetailPageFixture(), createFoodProductDetailPageFixture()];
    const snapshot = JSON.stringify(before);
    createBeverageProductDetailPageFixture("en");
    createBeverageProductDetailPageFixture("zh");
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(JSON.stringify([createProductDetailPageFixture(), createFoodProductDetailPageFixture()])).toBe(snapshot);
    expect(before.map((fixture) => fixture.brand)).toEqual(["Torriden", "TSUJIRI"]);
    expect(before.every((fixture) => !fixture.nutrition && !fixture.ingredients)).toBe(true);
  });

  it.each(["en", "zh"] as const)("uses one identified packaging label for %s nutrition, without filling missing values", (locale) => {
    const { nutrition, ingredients } = createBeverageProductDetailPageFixture(locale);
    expect(nutrition?.sourceHref).toBe(beverageProductSource.labelImage);
    expect(ingredients?.sourceHref).toBe(beverageProductSource.labelImage);
    expect(nutrition?.servingSize).toContain("200");
    expect(nutrition?.servingsPerContainer).toContain("6");
    expect(nutrition?.calories.value).toBe("160");
    expect(nutrition?.rows.map(({ amount, dailyValue }) => [amount, dailyValue])).toEqual([
      ["5.5g", "8%"], ["2.7g", "14%"], ["0g", undefined], ["20mg", "6%"],
      ["85mg", "4%"], ["22g", "7%"], ["0g", "0%"], ["21g", undefined], ["5.2g", undefined],
      [undefined, "2%"], [undefined, "4%"], [undefined, "18%"], [undefined, "1%"],
    ]);
    expect(nutrition?.rows.filter((row) => row.indented).map((row) => row.amount)).toEqual(["2.7g", "0g", "0g", "21g"]);
    expect(nutrition?.rows.filter((row) => row.groupStart).map((row) => row.dailyValue)).toEqual(["2%"]);
    expect(nutrition?.note).toBe(locale === "zh"
      ? "本信息由 AI 辅助从商品标签中提取。为获取准确、最新的信息，请以实物包装为准。"
      : "This information was extracted from the product label with AI assistance. Please refer to the actual product packaging for the most accurate and up-to-date information.");
  });
});
