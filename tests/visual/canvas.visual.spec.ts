import { expect, test } from "@playwright/test";

test.skip(!process.env.CI, "Visual baselines are generated and compared only in the locked Linux CI image.");

for (const locale of ["zh", "en"] as const) {
  for (const theme of ["light", "dark"] as const) {
    for (const viewport of ["360", "768", "1440"] as const) {
      test(`current in ${locale}/${theme} at ${viewport}px`, async ({ page }) => {
        await page.setViewportSize({ width: viewport === "1440" ? 1920 : 1440, height: 1100 });
        await page.goto(`/workbench?path=%2F&direction=current&locale=${locale}&theme=${theme}&viewport=${viewport}`);
        await expect(page.frameLocator('iframe[title="YAMI 原型预览"]').getByRole("main")).toBeVisible();
        await expect(page).toHaveScreenshot(`current-${locale}-${theme}-${viewport}.png`, { fullPage: true });
      });
    }
  }
}

for (const viewport of ["360", "1440"] as const) {
  test(`fixed direction at ${viewport}px`, async ({ page }) => {
    await page.setViewportSize({ width: viewport === "1440" ? 1920 : 1440, height: 1100 });
    await page.goto(`/workbench?path=%2F&direction=editorial-market&locale=zh&theme=light&viewport=${viewport}`);
    await expect(page.frameLocator('iframe[title="YAMI 原型预览"]').getByRole("main")).toBeVisible();
    await expect(page).toHaveScreenshot(`editorial-market-${viewport}.png`, { fullPage: true });
  });
}
