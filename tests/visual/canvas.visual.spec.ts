import { expect, test } from "@playwright/test";

test.skip(!process.env.CI, "Visual baselines are generated and compared only in the locked Linux CI image.");

for (const direction of ["current", "editorial-market"] as const) {
  for (const viewport of ["360", "1440"] as const) {
    test(`${direction} at ${viewport}px`, async ({ page }) => {
      await page.setViewportSize({ width: 1600, height: 1100 });
      await page.goto(`/?path=%2F&direction=${direction}&locale=zh&theme=light&viewport=${viewport}`);
      await expect(page.frameLocator('iframe[title="YAMI 原型预览"]').getByRole("main")).toBeVisible();
      await expect(page).toHaveScreenshot(`${direction}-${viewport}.png`, { fullPage: true });
    });
  }
}
