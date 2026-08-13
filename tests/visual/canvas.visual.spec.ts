import { expect, test, type Page } from "@playwright/test";

test.skip(!process.env.CI, "Visual baselines are generated and compared only in the locked Linux CI image.");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
});

async function waitForStablePreview(page: Page) {
  const preview = page.frameLocator('iframe[title="YAMI 原型预览"]');
  await expect(preview.getByRole("main")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await preview.locator("body").evaluate(async () => {
    await document.fonts.ready;
    const visibleImages = Array.from(document.images)
      .filter((image) => {
        const bounds = image.getBoundingClientRect();
        return (
          bounds.width > 0 &&
          bounds.height > 0 &&
          bounds.bottom >= 0 &&
          bounds.top <= window.innerHeight
        );
      })
      .map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
      });
    await Promise.race([
      Promise.all(visibleImages),
      new Promise<void>((resolve) => window.setTimeout(resolve, 3_000)),
    ]);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
}

for (const locale of ["zh", "en"] as const) {
  for (const theme of ["light", "dark"] as const) {
    for (const viewport of ["402", "768", "1440"] as const) {
      test(`current in ${locale}/${theme} at ${viewport}px`, async ({ page }) => {
        await page.setViewportSize({ width: viewport === "1440" ? 1920 : 1440, height: 1100 });
        await page.goto(`/workbench?path=%2F&direction=current&locale=${locale}&theme=${theme}&viewport=${viewport}`);
        await waitForStablePreview(page);
        await expect(page).toHaveScreenshot(`current-${locale}-${theme}-${viewport}.png`, { fullPage: true });
      });
    }
  }
}
