import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const locale of ["zh", "en"]) {
  for (const width of [375, 733, 1024, 1440]) {
    for (const colorScheme of ["light", "dark"] as const) {
      test(`${locale} documentation table in ${colorScheme} at ${width}px`, async ({ page }, testInfo) => {
        await page.setViewportSize({ width, height: 900 });
        await page.emulateMedia({ colorScheme, reducedMotion: "reduce" });
        await page.goto(`/${locale}/docs/browse-components#design-standards`);
        await page.evaluate(() => document.fonts.ready);
        const table = page.getByRole("table");
        const wrapper = table.locator("..");
        const header = table.getByRole("columnheader").first();
        const cell = table.getByRole("cell").first();
        await expect(header).toHaveCSS("font-size", "16px");
        await expect(header).toHaveCSS("line-height", "20px");
        await expect(header).toHaveCSS("font-weight", locale === "zh" ? "600" : "500");
        await expect(header).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        await expect(cell).toHaveCSS("font-size", "14px");
        await expect(cell).toHaveCSS("line-height", "24px");
        const bodyFont = await page.locator("article p").first().evaluate(el => getComputedStyle(el).fontFamily);
        await expect(cell).toHaveCSS("font-family", bodyFont);
        await expect(table.getByRole("link").first()).toHaveCSS("font-size", "14px");
        for (const item of [header, cell]) {
          await expect(item).toHaveCSS("padding", "12px 16px");
          await expect(item).toHaveCSS("border-left-width", "0px");
          await expect(item).toHaveCSS("border-right-width", "0px");
          await expect(item).toHaveCSS("border-bottom-width", "1px");
        }
        await expect(table.locator("tbody tr:last-child td").first()).toHaveCSS("border-bottom-width", "0px");
        await expect(wrapper).toHaveCSS("border-radius", "12px");
        await expect(wrapper).toHaveCSS("border-width", "1px");
        await expect(table).toHaveCSS("table-layout", "fixed");
        await expect(header).toHaveCSS("color", colorScheme === "light" ? "rgba(0, 0, 0, 0.55)" : "rgba(255, 255, 255, 0.55)");
        await expect(wrapper).toHaveCSS("background-color", colorScheme === "light" ? "rgb(255, 255, 255)" : "rgb(34, 34, 34)");
        await expect(table.getByRole("columnheader")).toHaveCount(2);
        await expect(table.getByRole("row")).toHaveCount(6);
        for (const link of await table.getByRole("link").all()) {
          await expect(link).toHaveAttribute("href", /storybook\.vercel\.app/);
        }
        const size = await wrapper.evaluate(el => ({ client: el.clientWidth, scroll: el.scrollWidth }));
        if (width === 375) {
          expect(size.scroll).toBeGreaterThan(size.client);
          await wrapper.focus();
          await page.keyboard.press("ArrowRight");
          await expect.poll(() => wrapper.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
        } else {
          expect(size.scroll).toBe(size.client);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath("docs-table.png") });
        if (width === 375) {
          expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
        }
      });
    }
  }
}

for (const locale of ["zh", "en"]) {
  test(`${locale} long three-column tables wrap within the scroll container`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(`/${locale}/docs/edit-pages`);
    const table = page.getByRole("table").first();
    await expect(table.getByRole("columnheader")).toHaveCount(3);
    const overflow = await table.locator("th, td").evaluateAll(cells => cells.some(el => el.scrollWidth > el.clientWidth + 1));
    expect(overflow).toBe(false);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
