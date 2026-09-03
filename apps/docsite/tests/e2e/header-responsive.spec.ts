import { expect, test } from "@playwright/test";

for (const locale of ["zh", "en"]) {
  for (const width of [320, 375, 750, 768, 769, 1023, 1024, 1280]) {
    test(`${locale} header preserves its tools and reference geometry at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 850 });
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
      await page.goto(`/${locale}/docs/browse-components`);
      const header = page.getByTestId("site-header");
      await expect(header).toBeVisible();
      await expect(header.getByRole("link", { name: locale === "zh" ? "开始构建" : "Start Building", exact: true })).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);

      const compact = width <= 768;
      const menu = header.getByRole("button", { name: locale === "zh" ? "菜单" : "Menu", exact: true });
      const navigation = header.getByRole("navigation");
      const logo = header.locator("img:visible");
      await expect(logo).toHaveCount(1);
      await expect(logo).toHaveAttribute("src", /yami-ui-en-mobile-fill/);
      await expect(logo).toHaveCSS("height", compact ? "24px" : "32px");
      if (compact) {
        await expect(menu).toBeVisible();
        await expect(menu).toHaveText("");
        await expect(menu.locator("svg")).toBeVisible();
        await expect(navigation).toBeHidden();
      } else {
        await expect(menu).toBeHidden();
        await expect(navigation).toBeVisible();
      }

      for (const control of [
        header.getByRole("button", { name: locale === "zh" ? "搜索" : "Search", exact: true }),
        header.getByRole("link", { name: locale === "zh" ? "English" : "中文", exact: true }),
        header.getByTestId("theme-toggle"),
        header.getByRole("link", { name: "GitHub", exact: true }),
        ...(compact ? [menu] : []),
      ]) {
        await expect(control).toBeVisible();
        const box = await control.boundingBox();
        expect(box!.height).toBe(32);
        expect(box!.y).toBe(8);
        expect(box!.x).toBeGreaterThanOrEqual(0);
        expect(box!.x + box!.width).toBeLessThanOrEqual(width);
        const hitArea = await control.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          const before = getComputedStyle(element, "::before");
          return {
            width: Math.max(rect.width, parseFloat(before.width) || 0),
            height: Math.max(rect.height, parseFloat(before.height) || 0),
          };
        });
        expect(hitArea.width).toBeGreaterThanOrEqual(44);
        expect(hitArea.height).toBeGreaterThanOrEqual(44);
      }

      const brandBox = await header.getByRole("link", { name: "YAMI Design System" }).boundingBox();
      const toolsBox = await header.getByRole("button", { name: locale === "zh" ? "搜索" : "Search", exact: true }).boundingBox();
      expect(brandBox!.x + brandBox!.width).toBeLessThanOrEqual(toolsBox!.x);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
      if (width <= 1024) {
        await expect(breadcrumb).toBeHidden();
        expect((await page.locator("h1").boundingBox())!.y).toBe(120);
      } else {
        await expect(breadcrumb).toBeVisible();
      }
      await page.screenshot({ path: testInfo.outputPath("header.png") });
    });
  }
}

test("compact header theme and language tools work without opening navigation", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.goto("/zh/docs/browse-components#design-standards");
  const header = page.getByTestId("site-header");
  await header.getByRole("button", { name: "主题: 深色", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(header.locator("img:visible")).toHaveCount(1);
  await header.getByRole("link", { name: "English", exact: true }).click();
  await expect(page).toHaveURL(/\/en\/docs\/browse-components#design-standards$/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(header.getByRole("button", { name: "Menu", exact: true })).toHaveAttribute("aria-expanded", "false");
  await header.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Menu", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(header.getByRole("button", { name: "Menu", exact: true })).toBeFocused();
});
