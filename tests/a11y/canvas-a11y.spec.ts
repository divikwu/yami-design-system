import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("Canvas workbench has no serious or critical axe violations", async ({ page }) => {
  await page.goto("/workbench?path=%2F&direction=current&locale=zh&theme=light&viewport=1440");
  await expect(page.getByRole("region", { name: "原型预览区" })).toBeVisible();
  await expect(page.locator("aside")).toHaveCSS("opacity", "1");
  const results = await new AxeBuilder({ page }).exclude("iframe").analyze();
  expect(results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious")).toEqual([]);
});

for (const locale of ["zh", "en"] as const) {
  for (const theme of ["light", "dark"] as const) {
    test(`Ecommerce Home has no serious or critical axe violations in ${locale}/${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(`/preview?path=%2F&direction=current&locale=${locale}&theme=${theme}&viewport=1440&transition=none`);
      await expect(page.getByRole("main")).toBeVisible();
      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations
        .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
        .map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          nodes: violation.nodes.length,
          firstTarget: violation.nodes[0]?.target,
          firstHtml: violation.nodes[0]?.html,
        }));
      expect(blocking).toEqual([]);
    });
  }
}

test("Anua Topic Landing Page has no serious or critical axe violations", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/preview?path=%2Fbrands%2Fanua&direction=current&locale=zh&theme=light&viewport=1440&transition=none");
  await expect(page.locator('[data-slot="topic-landing-page"]')).toBeVisible();
  await expect(page.locator('[data-slot="topic-landing-main"]')).toHaveAttribute("data-motion-ready", "reduced");

  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations
    .filter((violation) => violation.impact === "critical" || violation.impact === "serious")
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
      firstTarget: violation.nodes[0]?.target,
      firstHtml: violation.nodes[0]?.html,
    }));
  expect(blocking).toEqual([]);
});
