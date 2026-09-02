import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("redirects to Chinese and exposes exactly three primary navigation links", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/zh$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");

  const navigation = page.getByRole("navigation", { name: "YAMI 文档站导航" });
  await expect(navigation.getByRole("link")).toHaveCount(3);
  await expect(navigation.getByRole("link", { name: "首页" })).toHaveAttribute("aria-current", "page");

  await navigation.getByRole("link", { name: "文档" }).click();
  await expect(page).toHaveURL(/\/zh\/docs\/getting-started$/);
  await expect(page.getByRole("heading", { level: 1, name: "Storybook 入门" })).toBeVisible();
});

test("switches language without losing the document or stable anchor", async ({ page }) => {
  await page.goto("/zh/docs/browse-components#design-standards");
  await expect(page.locator("#design-standards")).toContainText("设计规范");

  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL(/\/en\/docs\/browse-components#design-standards$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en-US");
  await expect(page.locator("#design-standards")).toContainText("Design standards");
});

test("mobile menu uses a Sheet, has three primary links, and restores focus", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 844 });
  await page.goto("/zh");

  const trigger = page.getByRole("button", { name: "菜单" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "菜单" });
  await expect(dialog).toBeVisible();
  const navigation = dialog.getByRole("navigation", { name: "YAMI 文档站导航" });
  await expect(navigation.getByRole("link")).toHaveCount(3);

  await dialog.getByRole("button", { name: "关闭" }).click();
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByRole("link", { name: "Blog" }).click();
  await expect(page).toHaveURL(/\/zh\/blog$/);
});

test("header controls retain at least a 44 pixel pointer target", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 844 });
  await page.goto("/zh");
  for (const control of [
    page.getByRole("button", { name: "搜索" }),
    page.getByRole("button", { name: "菜单" }),
  ]) {
    const target = await control.evaluate((element) => {
      const box = element.getBoundingClientRect();
      const extender = getComputedStyle(element, "::before");
      return {
        width: Math.max(box.width, Number.parseFloat(extender.width) || 0),
        height: Math.max(box.height, Number.parseFloat(extender.height) || 0),
      };
    });
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
  }
});
