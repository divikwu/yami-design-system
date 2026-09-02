import { expect, test } from "@playwright/test";

for (const locale of ["zh", "en"] as const) {
  for (const width of [402, 768, 1023]) {
    test(`${locale} hero hides its component preview at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
      await page.goto(`/${locale}`);
      await page.evaluate(() => document.fonts.ready);

      const hero = page.locator("main > section").first();
      const heroFrame = hero.locator(":scope > div").first();
      const heroCenter = page.getByRole("heading", { level: 1 }).locator("..");
      const demoLabel = locale === "zh" ? "YAMI 组件首帧预览" : "YAMI component frame preview";
      const demos = hero.getByLabel(demoLabel);

      await expect(demos).toBeHidden();
      await expect(heroFrame).toHaveCSS("min-height", "0px");
      await expect(heroCenter).toHaveCSS("padding-top", "0px");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }

  test(`${locale} hero keeps its component preview on desktop`, async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 844 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await page.goto(`/${locale}`);

    const demoLabel = locale === "zh" ? "YAMI 组件首帧预览" : "YAMI component frame preview";
    const demos = page.getByLabel(demoLabel);
    const heroCenter = page.getByRole("heading", { level: 1 }).locator("..");
    await expect(demos).toBeVisible();
    await expect(heroCenter).toHaveCSS("padding-top", "80px");

    const promptCopy = locale === "zh" ? "我可以帮你什么？" : "How can I help?";
    const promptControls = demos
      .getByText(promptCopy, { exact: true })
      .locator("..")
      .locator("span[aria-hidden='true']");
    const [addButtonBox, actionButtonBox] = await Promise.all([
      promptControls.nth(0).boundingBox(),
      promptControls.nth(1).boundingBox(),
    ]);
    expect(actionButtonBox!.width).toBe(addButtonBox!.width);
    expect(actionButtonBox!.height).toBe(addButtonBox!.height);

    const heroFrame = page.locator("main > section > div").first();
    const showcase = page.locator("[data-home-showcase]");
    const [heroFrameBox, showcaseBox] = await Promise.all([
      heroFrame.boundingBox(),
      showcase.boundingBox(),
    ]);
    expect(heroFrameBox!.y + heroFrameBox!.height - showcaseBox!.y).toBe(32);
  });
}
