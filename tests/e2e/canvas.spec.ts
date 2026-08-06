import { expect, test } from "@playwright/test";

test("renders Ecommerce Home and routes iframe links through parent history", async ({ page }) => {
  await page.goto("/?path=%2F&direction=current&locale=zh&theme=light&viewport=1440");
  const preview = page.frameLocator('iframe[title="YAMI 原型预览"]');
  await expect(preview.getByRole("heading", { name: "热销榜单" })).toBeVisible();
  await preview.getByRole("link", { name: /护肤精华露/ }).click();
  await expect(page).toHaveURL(/path=%2Fproducts%2Fproduct-featured-1/);
  await expect(preview.getByText("YAMI PROTOTYPE ROUTE")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/path=%2F/);
});

test("switches direction without losing path, locale, theme or viewport", async ({ page }) => {
  await page.goto("/?path=%2F&direction=current&locale=zh&theme=dark&viewport=360");
  await page.getByLabel("设计方向").selectOption("editorial-market");
  await expect(page).toHaveURL(/direction=editorial-market/);
  await expect(page).toHaveURL(/theme=dark/);
  await expect(page).toHaveURL(/viewport=360/);
  await expect(page.frameLocator('iframe[title="YAMI 原型预览"]').getByRole("heading", { name: "编辑精选" })).toBeVisible();
});
