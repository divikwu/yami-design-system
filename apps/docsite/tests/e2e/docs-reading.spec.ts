import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

for (const locale of ["zh", "en"]) {
  for (const width of [375, 1024, 1280]) {
    test(`${locale} docs anchor and reading state at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/docs/choose-starting-point`);
      await page.evaluate(() => document.fonts.ready);
      const headings = page.locator("article > div h2[id]");
      const ids = await headings.evaluateAll((els) => els.map((el) => el.id));
      const label = locale === "zh" ? "本页内容" : "On This Page";
      const compact = width < 1280;
      const target = page.locator(`#${ids[3]}`);
      if (compact) {
        await page.getByRole("combobox", { name: label }).click();
        await page.getByRole("option").and(page.locator(`[data-value="${ids[3]}"]`)).click();
      }
      else await page.getByRole("navigation", { name: label }).locator(`a[href="#${ids[3]}"]`).click();
      await expect.poll(async () => Math.round((await target.boundingBox())!.y)).toBe(compact ? 113 : 64);
      if (compact) {
        const bar = page.getByRole("combobox", { name: label }).locator("../..");
        const barBox = await bar.boundingBox();
        expect(barBox!.y).toBe(48);
        expect(barBox!.height).toBe(49);
        expect((await target.boundingBox())!.y - (barBox!.y + barBox!.height)).toBeCloseTo(16, 0);
      }
      if (compact) await expect(page.getByRole("combobox", { name: label })).toHaveAttribute("data-value", ids[3]);
      else {
        const active = page.getByRole("navigation", { name: label }).locator('[aria-current="location"]');
        await expect(active).toHaveAttribute("href", `#${ids[3]}`);
        // The indicator belongs to the actual link, so wrapped earlier rows cannot offset it.
        const geometry = await active.evaluate((el) => ({
          height: el.getBoundingClientRect().height,
          indicatorHeight: Number.parseFloat(getComputedStyle(el, "::before").height),
          top: getComputedStyle(el, "::before").top,
        }));
        expect(geometry.indicatorHeight).toBe(geometry.height);
        expect(geometry.top).toBe("0px");
      }
      await page.locator(`#${ids[1]}`).evaluate((el) => el.scrollIntoView());
      if (compact) await expect(page.getByRole("combobox", { name: label })).toHaveAttribute("data-value", ids[1]);
      else await expect(page.getByRole("navigation", { name: label }).locator('[aria-current="location"]')).toHaveAttribute("href", `#${ids[1]}`);

      await page.goto(`/${locale}/docs/choose-starting-point#${ids[3]}`);
      await expect.poll(async () => Math.round((await target.boundingBox())!.y)).toBe(compact ? 113 : 64);
    });
  }
}

test("wrapped TOC links stay aligned after resizing and back navigation", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en/docs/choose-starting-point");
  const toc = page.getByRole("navigation", { name: "On This Page" });
  await toc.getByRole("link", { name: "Check that the starting point fits" }).click();
  const active = toc.locator('[aria-current="location"]');
  await expect(active).toHaveText("Check that the starting point fits");
  await page.setViewportSize({ width: 1440, height: 900 });
  await toc.getByRole("link", { name: "Continue refining a page" }).click();
  await page.goBack();
  await expect(active).toHaveText("Check that the starting point fits");
});

test("code copy has feedback; prompts wrap without changing source", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/en/docs/choose-starting-point");
  const prompt = page.locator('div[data-wrap="true"]').first();
  const original = await prompt.locator("code").textContent();
  await expect(prompt.locator("code")).toHaveCSS("font-family", /monospace/);
  await expect(prompt.locator("pre")).toHaveCSS("white-space", "pre-wrap");
  expect(await prompt.locator("pre").evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  await prompt.getByRole("button", { name: "Copy", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(original);
  await expect(page.getByRole("button", { name: /Copy link to/ })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("clipboard rejection is announced without false success", async ({ page }) => {
  await page.goto("/en/docs/choose-starting-point");
  await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error("Denied for test"); }; });
  const block = page.locator('div[data-wrap="true"]').first();
  await block.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(block.getByRole("status")).toHaveText("Copy failed. Retry or copy manually.");
  await expect(block.getByRole("button")).toHaveAccessibleName("Copy");
});

for (const width of [375, 1440]) {
  for (const theme of ["light", "dark"] as const) {
    test(`docs ${theme} accessibility and overflow at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto("/zh/docs/choose-starting-point");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const result = await new AxeBuilder({ page }).analyze();
      expect(result.violations).toEqual([]);
      await page.screenshot({ path: testInfo.outputPath("docs-theme.png") });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    });
  }
}
