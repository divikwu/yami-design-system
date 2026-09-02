import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const width of [320, 375, 733, 768]) {
  test(`navigation drawer matches the reference panel at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/zh/docs/browse-components#design-standards");
    const trigger = page.getByRole("button", { name: "菜单", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "菜单", exact: true });
    const panel = dialog.locator("[data-navigation-panel]");
    await expect(panel).toBeVisible();
    await expect(panel).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
    const box = await panel.boundingBox();
    expect(box!.x).toBe(width - 320);
    expect(box!.width).toBe(320);
    expect(box!.y).toBe(0);
    expect(box!.height).toBe(900);
    await expect(dialog.getByRole("img", { name: "YAMI", exact: true })).toHaveCSS("height", "24px");
    const close = dialog.getByRole("button", { name: "关闭", exact: true });
    await expect(close).toHaveCSS("height", "32px");
    await expect(dialog.getByRole("link", { name: "首页", exact: true })).toHaveCSS("height", "32px");
    const docs = dialog.getByRole("navigation", { name: "YAMI 文档", exact: true });
    await expect(docs.getByRole("link", { name: "查看组件与页面", exact: true })).toHaveAttribute("aria-current", "page");
    const group = docs.getByRole("button", { name: "用 AI 创建", exact: true });
    await group.click();
    await expect(group).toHaveAttribute("aria-expanded", "false");
    await expect(docs.getByRole("link", { name: "开始创建", exact: true })).toBeHidden();
    await group.click();
    await expect(docs.getByRole("link", { name: "开始创建", exact: true })).toBeVisible();

    const backdrop = await dialog.evaluate(e => getComputedStyle(e, "::backdrop").backdropFilter);
    expect(backdrop).toBe("blur(2px)");
    await page.mouse.move(0, 400);
    await page.screenshot({ path: testInfo.outputPath("navigation-drawer.png") });
    const scrollBefore = await page.evaluate(() => scrollY);
    await dialog.getByRole("link", { name: "GitHub", exact: true }).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
    await expect(close).toBeInViewport();
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeAttached();
    await expect(trigger).toBeFocused();
    expect(await page.evaluate(() => scrollY)).toBe(scrollBefore);
    await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  });
}

test("drawer enters and exits from the right before releasing its modal lock", async ({ page }) => {
  await page.setViewportSize({ width: 733, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en/docs/browse-components");
  const trigger = page.getByRole("button", { name: "Menu", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Menu", exact: true });
  const panel = dialog.locator("[data-navigation-panel]");
  await expect(panel).toHaveCSS("animation-duration", "0.41s");
  await expect(panel).toHaveCSS("animation-timing-function", "cubic-bezier(0.24, 1, 0.4, 1)");
  const entry = await panel.evaluate(async element => {
    const animation = element.getAnimations()[0];
    animation.pause();
    animation.currentTime = 0;
    await new Promise(requestAnimationFrame);
    const start = element.getBoundingClientRect().x;
    animation.currentTime = 205;
    await new Promise(requestAnimationFrame);
    const middle = element.getBoundingClientRect().x;
    animation.finish();
    return { start, middle };
  });
  expect(entry.start).toBe(733);
  expect(entry.middle).toBeGreaterThan(413);
  expect(entry.middle).toBeLessThan(733);
  await page.evaluate(() => Promise.all(document.getAnimations().map(animation => animation.finished)));
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toHaveAttribute("data-state", "closing");
  await expect(page.locator("html")).toHaveCSS("overflow", "hidden");
  const frames = await panel.evaluate(e => (e.getAnimations()[0].effect as KeyframeEffect).getKeyframes());
  expect(frames[0].transform).toBe("translateX(0px)");
  expect(frames.at(-1)!.transform).toBe("translateX(100%)");
  await expect(dialog).not.toBeAttached();
  await expect(trigger).toBeFocused();
});

test("drawer traps keyboard focus, closes from the backdrop, and dismisses on desktop resize", async ({ page }) => {
  await page.setViewportSize({ width: 733, height: 700 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/zh/docs/browse-components");
  const trigger = page.getByRole("button", { name: "菜单", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "菜单", exact: true });
  await dialog.getByRole("link", { name: "YAMI Design System", exact: true }).focus();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("link", { name: "GitHub", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("link", { name: "YAMI Design System", exact: true })).toBeFocused();
  await page.mouse.click(100, 100);
  await expect(dialog).not.toBeAttached();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.setViewportSize({ width: 769, height: 700 });
  await expect(dialog).not.toBeAttached();
  await expect(page.locator("html")).not.toHaveCSS("overflow", "hidden");
  await page.setViewportSize({ width: 733, height: 700 });
  await trigger.click();
  await dialog.getByRole("link", { name: "创建页面", exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/docs\/choose-starting-point$/);
  await expect(dialog).not.toBeAttached();
});

for (const colorScheme of ["light", "dark"] as const) {
  test(`drawer is accessible in ${colorScheme} with reduced motion`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 850 });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme });
    await page.goto("/en/docs/browse-components");
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Menu", exact: true });
    await expect(dialog.locator("[data-navigation-panel]")).toHaveCSS("animation-duration", "0s");
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeAttached();
  });
}
