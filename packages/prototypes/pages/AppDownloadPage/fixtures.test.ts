import { describe, expect, it } from "vitest";
import { calculateSavings, campaignProducts, featuredProducts } from "./fixtures";

describe("app-download campaign calculation", () => {
  it("includes the hidden 10% perk with the $10 welcome discount", () => {
    expect(calculateSavings("welcome", 30)).toMatchObject({ discount: 13, shipping: 5.99, total: 22.99 });
    expect(calculateSavings("welcome", 12)).toMatchObject({ discount: 11.2, total: 6.79 });
  });
  it("uses the discounted subtotal for the $49 free-shipping threshold", () => {
    expect(calculateSavings("welcome", 65)).toMatchObject({ freeShipping: false, total: 54.49 });
    expect(calculateSavings("welcome", 66)).toMatchObject({ freeShipping: true, total: 49.4 });
    expect(calculateSavings("welcome", 100).total).toBe(80);
  });
  it("charges nothing with no selected items and sums actual app prices", () => {
    expect(calculateSavings("app", 0)).toMatchObject({ subtotal: 0, shipping: 0, total: 0 });
    expect(calculateSavings("app", 0, [featuredProducts[0]])).toMatchObject({ subtotal: 738.58, discount: 73.86, total: 664.72, saved: 79.85 });
    const bottle = featuredProducts.find((p) => p.sku === "1029335121")!;
    const containers = featuredProducts.find((p) => p.sku === "1029225801")!;
    expect(calculateSavings("app", 0, [bottle])).toMatchObject({ shipping: 5.99, total: 50.08 });
    expect(calculateSavings("app", 0, [bottle, containers])).toMatchObject({ shipping: 0, total: 80.08 });
  });
  it("preserves the complete captured catalog and unique featured products", () => {
    expect(campaignProducts).toHaveLength(75);
    expect(new Set(campaignProducts.map((p) => p.sku)).size).toBe(75);
    expect(featuredProducts).toHaveLength(12);
  });
});
