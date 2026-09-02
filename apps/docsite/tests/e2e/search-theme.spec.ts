import { expect, test } from "@playwright/test";

test("opens search with the keyboard and supports full keyboard selection", async ({ page }) => {
  await page.goto("/zh");
  const trigger = page.getByRole("button", { name: "搜索" });

  await trigger.focus();
  await page.keyboard.press("Control+K");
  const dialog = page.getByRole("dialog", { name: "搜索" });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-slot="sheet-footer"] > div')).toBeVisible();

  const input = dialog.getByRole("combobox", { name: "搜索" });
  await expect(input).toBeFocused();
  await input.fill("创建页面");
  await expect(dialog.getByRole("option").first()).toContainText("创建页面");
  await input.press("Enter");
  await expect(page).toHaveURL(/\/zh\/docs\/choose-starting-point$/);

  await page.getByRole("button", { name: "搜索" }).click();
  await dialog.getByRole("combobox", { name: "搜索" }).fill("没有这个结果");
  await expect(dialog.getByRole("status")).toContainText("未找到结果");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "搜索" })).toBeFocused();
});

test("keeps mobile search dismissible and the keyboard selection in view", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 420 });
  await page.goto("/zh");

  const trigger = page.getByRole("button", { name: "搜索", exact: true });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "搜索" });
  await expect(dialog.locator('[data-slot="sheet-footer"] > div')).toBeHidden();
  const close = dialog.getByRole("button", { name: "关闭", exact: true });
  await expect(close).toBeVisible();

  const input = dialog.getByRole("combobox", { name: "搜索" });
  const options = dialog.getByRole("option");
  const optionCount = await options.count();
  expect(optionCount).toBeGreaterThan(1);
  for (let index = 1; index < optionCount; index += 1) {
    await input.press("ArrowDown");
  }

  const selected = dialog.locator('[role="option"][aria-selected="true"]');
  await expect(selected).toHaveCount(1);
  await expect.poll(() => selected.evaluate((element) => {
    const listbox = element.closest('[role="listbox"]');
    if (!listbox) return false;
    const optionBounds = element.getBoundingClientRect();
    const listBounds = listbox.getBoundingClientRect();
    return optionBounds.top >= listBounds.top && optionBounds.bottom <= listBounds.bottom;
  })).toBe(true);

  await close.click();
  await expect(trigger).toBeFocused();
});

test("follows the system initially and persists an explicit theme choice", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/zh");
  const root = page.locator("html");
  await expect(root).toHaveClass(/dark/);
  await expect(root).toHaveAttribute("data-theme", "dark");

  const toggle = page.locator('[data-testid="theme-toggle"]:visible');
  await expect(toggle).toHaveAccessibleName("主题: 浅色");
  await toggle.click();
  await expect(root).not.toHaveClass(/dark/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("yami-docsite-theme"))).toBe("light");

  await page.reload();
  await expect(root).toHaveAttribute("data-theme", "light");
  await expect(root).not.toHaveClass(/dark/);
});

test("puts the no-flash theme resolver before body content", async ({ page }) => {
  await page.goto("/en");
  const resolverIndex = await page.evaluate(() => document.documentElement.innerHTML.indexOf("yami-docsite-theme"));
  const bodyIndex = await page.evaluate(() => document.documentElement.innerHTML.indexOf("<body"));
  expect(resolverIndex).toBeGreaterThanOrEqual(0);
  expect(resolverIndex).toBeLessThan(bodyIndex);
});

test("continues following system changes until a choice is stored", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/en");
  await expect(page.locator("html")).not.toHaveClass(/dark/);

  await page.emulateMedia({ colorScheme: "dark" });
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem("yami-docsite-theme"))).toBeNull();
});
