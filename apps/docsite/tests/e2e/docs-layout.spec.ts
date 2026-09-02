import { expect, test } from "@playwright/test";

for (const locale of ["zh", "en"]) {
  for (const width of [360, 375, 390, 768, 769, 1023, 1024, 1025, 1279, 1280, 1440, 1920]) {
    test(`${locale} docs keep the reference reading width at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/docs/first-page`);
      const article = page.getByRole("article");
      await expect(article.getByRole("heading", { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);

      const desktop = width >= 1280;
      const sidebar = width >= 1024;
      // Reference: fixed 260px sidebar, 800px article cap (24px insets),
      // then a 32px gap and 232px TOC; center that group after the sidebar.
      const articleWidth = Math.min(800, width - (sidebar ? 260 : 0) - (desktop ? 264 : 0));
      const articleLeft = (sidebar ? 260 : 0) + Math.max(0, (width - (sidebar ? 260 : 0) - 800 - (desktop ? 264 : 0)) / 2);
      const box = await article.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeCloseTo(articleWidth, 0);
      expect(box!.x).toBeCloseTo(articleLeft, 0);

      const titleBox = await article.getByRole("heading", { level: 1 }).boundingBox();
      expect(titleBox!.width).toBeCloseTo(articleWidth - 48, 0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.getByRole("button", { name: locale === "zh" ? "文档目录" : "Docs Menu", exact: true })).toHaveCount(0);
      const select = page.getByRole("combobox", { name: locale === "zh" ? "本页内容" : "On This Page", exact: true });

      if (desktop) {
        await expect(select).toBeHidden();
        const toc = page.getByRole("complementary", { name: locale === "zh" ? "本页内容" : "On This Page", exact: true });
        await expect(toc).toBeVisible();
        const tocBox = await toc.boundingBox();
        expect(tocBox!.x).toBeCloseTo(articleLeft + articleWidth + 32, 0);
        expect(tocBox!.width).toBeCloseTo(232, 0);
        expect(await toc.evaluate((element) => element.parentElement?.querySelector(":scope > article") !== null)).toBe(true);
      } else {
        await expect(select).toBeVisible();
        const selectBox = await select.boundingBox();
        expect(selectBox!.x).toBeCloseTo(articleLeft + 24, 0);
        expect(selectBox!.width).toBeCloseTo(articleWidth - 48, 0);
        expect(selectBox!.height).toBe(44);
        const surfaceHeight = await select.evaluate(el => getComputedStyle(el.parentElement!, "::before").height);
        expect(surfaceHeight).toBe("32px");
      }

      await expect(article.locator("h1")).toHaveCSS("font-size", "40px");
      await expect(article.locator("p").first()).toHaveCSS("font-size", "16px");
      await expect(article.locator("p").first()).toHaveCSS("line-height", "28px");
      await expect(article.locator("p").nth(1)).toHaveCSS("font-size", "16px");
      await expect(article.locator("p").nth(1)).toHaveCSS("line-height", "28px");
      await expect(article.locator("h2").first()).toHaveCSS("font-size", "24px");
      await expect(article.locator("h2").first()).toHaveCSS("line-height", "32px");
      await page.screenshot({ path: testInfo.outputPath("docs-layout.png"), fullPage: false });
    });
  }
}
