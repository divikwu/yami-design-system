import { describe, expect, it } from "vitest";

import type { ImageSource } from "@yami/design-system";

import { createEcommerceHomeFixture } from "../pages/EcommerceHome/fixtures";

function expectResponsive(source: ImageSource, widths: number[]) {
  expect(typeof source).not.toBe("string");
  if (typeof source === "string") return;
  expect(source.width).toBeGreaterThanOrEqual(widths.at(-1) ?? 0);
  expect(source.height).toBeGreaterThan(0);
  expect(source.candidates.map((candidate) => candidate.width)).toEqual(widths);
  expect(source.sizes).toBeTruthy();
}

describe.each(["en", "zh"] as const)(
  "Ecommerce Home responsive images (%s)",
  (locale) => {
    it("sets the page language on the prototype root", () => {
      expect(createEcommerceHomeFixture(locale).lang).toBe(locale);
    });

    it("opts only the horizontal homepage surfaces into windowed loading", () => {
      const fixture = createEcommerceHomeFixture(locale);
      expect(fixture.header.imageLoadingStrategy).toBe("windowed");
      expect(fixture.hero.imageLoadingStrategy).toBe("windowed");
      expect(fixture.hero.imageLoading).toBeUndefined();
      expect(fixture.shortcutRail.imageLoadingStrategy).toBe("windowed");
      expect(fixture.footer.imageLoading).toBe("lazy");

      const horizontalKinds = fixture.sections
        .filter((section) => section.kind !== "billboard")
        .map((section) => [section.id, section.props.imageLoadingStrategy]);
      expect(horizontalKinds).toEqual([
        ["trending-products", "windowed"],
        ["featured-brands", "windowed"],
        ["social-media", "windowed"],
        ["trending-searches", "windowed"],
        ["summer-stock-up", "windowed"],
        ["for-you", undefined],
      ]);

      const billboard = fixture.sections.find(
        (section) => section.kind === "billboard",
      );
      if (!billboard || billboard.kind !== "billboard") {
        throw new Error("Expected the homepage billboard");
      }
      expect(billboard.props.revealOnLoad).toBe(true);
    });

    it("uses generated 1x/2x artwork and verified 600px product candidates", () => {
      const fixture = createEcommerceHomeFixture(locale);
      const firstHeroImage = fixture.hero.items.find(
        (item) => "image" in item && item.image,
      );
      if (!firstHeroImage || !("image" in firstHeroImage) || !firstHeroImage.image) {
        throw new Error("Expected a campaign image");
      }
      expectResponsive(firstHeroImage.image.src, [480, 960]);

      const shortcuts = fixture.shortcutRail.items;
      expect(shortcuts).toHaveLength(23);
      shortcuts.forEach((item) => expectResponsive(item.iconSrc, [48, 96]));

      const products = fixture.sections.find(
        (section) => section.id === "trending-products",
      );
      if (!products || products.kind !== "products") {
        throw new Error("Expected the trending product rail");
      }
      products.props.products.slice(0, 6).forEach((product) => {
        if (!product.image) throw new Error("Expected a product image");
        expectResponsive(product.image, [300, 600]);
        expect(
          typeof product.image === "string" ? product.image : product.image.src,
        ).toContain("_600x600.webp");
      });
    });
  },
);
