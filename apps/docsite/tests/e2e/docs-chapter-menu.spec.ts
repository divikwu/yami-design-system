import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("chapter menu uses an anchored list with a neutral selected state", async ({ page }) => {
  await page.setViewportSize({ width: 733, height: 900 });
  await page.goto("/zh/docs/getting-started");
  const trigger = page.getByRole("combobox", { name: "本页内容" });
  await trigger.click();
  const list = page.getByRole("listbox", { name: "本页内容" });
  await expect(list).toBeVisible();
  await expect(list.getByRole("option", { selected: true })).toHaveText("Storybook 是什么");
  await expect(list.getByRole("option").first()).toHaveCSS("font-size", "14px");
  await list.getByRole("option", { name: "Storybook 里有什么", exact: true }).click();
  await expect(list).not.toBeVisible();
  await expect(page).toHaveURL(/#what-is-in-storybook$/);
});

for (const locale of ["zh", "en"]) {
  for (const width of [375, 558, 733, 1024]) {
    test(`${locale} chapter menu geometry and navigation at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/docs/getting-started`);
      await page.evaluate(() => document.fonts.ready);
      const label = locale === "zh" ? "本页内容" : "On This Page";
      const trigger = page.getByRole("combobox", { name: label });
      await expect(trigger).toHaveAttribute("data-value", "what-storybook-is");
      await trigger.click();
      const list = page.getByRole("listbox", { name: label });
      await expect(list).toBeVisible();
      const popup = list.locator("..");
      await expect(popup).toHaveCSS("border-radius", "12px");
      await expect(popup).toHaveCSS("box-shadow", "rgba(0, 0, 0, 0.24) 0px 8px 16px -8px");
      await expect(list.getByRole("option")).toHaveCount(5);
      const triggerBox = (await trigger.boundingBox())!;
      const popupBox = (await popup.boundingBox())!;
      expect(popupBox.width).toBeCloseTo(triggerBox.width, 0);
      expect(popupBox.x).toBeCloseTo(triggerBox.x, 0);
      expect(triggerBox.height).toBe(44);
      const selected = list.getByRole("option", { selected: true });
      expect((await selected.boundingBox())!.height).toBeCloseTo(32, 2);
      await expect(selected).toHaveCSS("font-size", "14px");
      await expect(selected.locator("svg")).toHaveCount(1);
      await expect(selected).toHaveCSS("outline-style", "none");
      const neutral = await selected.evaluate((el) => {
        const color = getComputedStyle(el).backgroundColor;
        // The popup's selected row must use the same semantic neutral as the site.
        const probe = document.createElement("div");
        probe.style.background = "var(--surface-secondary)";
        el.appendChild(probe);
        const expected = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return { color, expected };
      });
      expect(neutral.color).toBe(neutral.expected);
      await page.screenshot({ path: testInfo.outputPath("chapter-menu.png"), animations: "disabled" });

      await list.getByRole("option").nth(2).click();
      await expect(list).not.toBeVisible();
      await expect(page).toHaveURL(/#what-is-in-storybook$/);
      await expect.poll(async () => Math.round((await page.locator("#what-is-in-storybook").boundingBox())!.y)).toBe(113);
      await expect(trigger).toHaveAttribute("data-value", "what-is-in-storybook");
      // Use the visible sticky hit target; locator.click's pre-scroll can move
      // the article before it clicks a sticky element in Chromium.
      const stickyBox = (await trigger.boundingBox())!;
      await page.mouse.click(stickyBox.x + stickyBox.width / 2, stickyBox.y + stickyBox.height / 2);
      await expect(list.getByRole("option", { selected: true })).toHaveAttribute("data-value", "what-is-in-storybook");
      await expect.poll(async () => Math.round((await page.locator("#what-is-in-storybook").boundingBox())!.y)).toBe(113);
      await page.setViewportSize({ width: 1280, height: 900 });
      await expect(list).not.toBeVisible();
      await expect(trigger).toBeHidden();
      await expect(page.getByRole("navigation", { name: label })).toBeVisible();
    });
  }
}

test("chapter menu supports keyboard navigation, typeahead, Escape, and outside dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 733, height: 900 });
  await page.goto("/en/docs/getting-started");
  const trigger = page.getByRole("combobox", { name: "On This Page" });
  const list = page.getByRole("listbox", { name: "On This Page" });
  await trigger.focus();
  await page.keyboard.press("Space");
  await expect(list).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(list.locator("[data-highlighted]")).toHaveAttribute("data-value", "why-start-with-storybook");
  await expect(list.locator("[data-highlighted]")).toHaveCSS("outline-width", "2px");
  await page.keyboard.press("End");
  await expect(list.locator("[data-highlighted]")).toHaveAttribute("data-value", "choose-your-next-step");
  await page.keyboard.press("Home");
  await expect(list.locator("[data-highlighted]")).toHaveAttribute("data-value", "what-storybook-is");
  await page.keyboard.type("Why");
  await expect(list.locator("[data-highlighted]")).toHaveAttribute("data-value", "why-start-with-storybook");
  // Moving through options must not scroll the article until committed.
  await expect(page).not.toHaveURL(/#/);
  await page.keyboard.press("Enter");
  await expect(list).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await expect(page).toHaveURL(/#why-start-with-storybook$/);

  await trigger.click();
  await expect(list).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(list).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await expect(list).toBeVisible();
  await page.getByRole("heading", { name: "Why start with Storybook", exact: true }).click();
  await expect(list).not.toBeVisible();
  await trigger.focus();
  await trigger.press("Space");
  await expect(list).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(list).not.toBeVisible();
  expect(await page.evaluate(() => document.activeElement?.hasAttribute("data-base-ui-focus-guard"))).toBe(false);
});

for (const theme of ["light", "dark"] as const) {
  test(`short touch viewport chapter menu is scrollable and accessible in ${theme}`, async ({ browser }, testInfo) => {
    const context = await browser.newContext({ viewport: { width: 375, height: 320 }, hasTouch: true, colorScheme: theme, reducedMotion: "reduce", storageState: testInfo.project.use.storageState });
    const page = await context.newPage();
    await page.goto("/en/docs/choose-starting-point");
    const trigger = page.getByRole("combobox", { name: "On This Page" });
    // Bring the chapter control to its sticky reading position before opening.
    await trigger.evaluate((el) => el.scrollIntoView());
    const triggerBox = (await trigger.boundingBox())!;
    await page.touchscreen.tap(triggerBox.x + triggerBox.width / 2, triggerBox.y + triggerBox.height / 2);
    const list = page.getByRole("listbox", { name: "On This Page" });
    await expect(list).toBeVisible();
    expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    await expect(list.locator("..")).toHaveCSS("transition-duration", "0s");
    const listBox = (await list.boundingBox())!;
    expect(listBox.y).toBeGreaterThanOrEqual(16);
    expect(listBox.y + listBox.height).toBeLessThanOrEqual(304);
    // Base UI's hidden sentinels immediately redirect focus to real controls;
    // keyboard traversal is verified above. Keep all content in the axe scan.
    const accessibility = await new AxeBuilder({ page }).exclude("[data-base-ui-focus-guard]").analyze();
    expect(accessibility.violations).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath("chapter-menu-touch.png") });
    const lastOption = list.getByRole("option").last();
    const target = await lastOption.getAttribute("data-value");
    await lastOption.tap();
    await expect(list).not.toBeVisible();
    await expect(trigger).toHaveAttribute("data-value", target!);
    await context.close();
  });
}
