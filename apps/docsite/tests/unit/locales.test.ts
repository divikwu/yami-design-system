import { describe, expect, it } from "vitest";

import { htmlLanguage, isLocale, localizedPath, swapLocalePathname } from "../../lib/locales";

describe("locale routing", () => {
  it("accepts only supported locales", () => {
    expect(isLocale("zh")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale("")).toBe(false);
  });

  it("builds localized paths without duplicate separators", () => {
    expect(localizedPath("zh")).toBe("/zh");
    expect(localizedPath("en", "/docs/color")).toBe("/en/docs/color");
    expect(localizedPath("zh", "blog")).toBe("/zh/blog");
  });

  it("preserves the resource and anchor when switching language", () => {
    expect(swapLocalePathname("/zh/docs/color#dark-theme", "en")).toBe(
      "/en/docs/color#dark-theme",
    );
    expect(swapLocalePathname("/en/blog/introducing-yami-design-system", "zh")).toBe(
      "/zh/blog/introducing-yami-design-system",
    );
  });

  it("maps locales to valid HTML language tags", () => {
    expect(htmlLanguage).toEqual({ zh: "zh-CN", en: "en-US" });
  });
});
