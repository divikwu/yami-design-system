import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("Canvas workbench has no serious or critical axe violations", async ({ page }) => {
  await page.goto("/?path=%2F&direction=current&locale=zh&theme=light&viewport=1440");
  await expect(page.getByRole("region", { name: "原型预览区" })).toBeVisible();
  await expect(page.locator("aside")).toHaveCSS("opacity", "1");
  const results = await new AxeBuilder({ page }).exclude("iframe").analyze();
  expect(results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);
});
