import { expect, test } from "@playwright/test";

for (const locale of ["zh", "en"]) {
  for (const width of [375, 733, 1169, 1440]) {
    test(`${locale} pagination fills single-card rows and preserves paired cards at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      for (const { slug, directions, destinations } of [
        { slug: "fork-project", directions: ["next"], destinations: ["getting-started"] },
        { slug: "getting-started", directions: ["prev", "next"], destinations: ["fork-project", "browse-components"] },
        { slug: "browse-components", directions: ["prev", "next"], destinations: ["getting-started", "prepare-environment"] },
        { slug: "faq", directions: ["prev"], destinations: ["templates"] },
      ]) {
        await page.goto(`/${locale}/docs/${slug}`);
        const pagination = page.getByRole("navigation", { name: locale === "zh" ? "文档翻页" : "Documentation Pagination", exact: true });
        const links = pagination.getByRole("link");
        await expect(links).toHaveCount(directions.length);
        await pagination.scrollIntoViewIfNeeded();
        const updated = page.locator("article time");
        await expect(updated).toHaveText(locale === "zh" ? /更新于/ : /Updated/);
        expect(await updated.evaluate((element) => element.closest("header"))).toBeNull();
        const sources = page.locator("article section[aria-labelledby='source-references']");
        const sourcesBox = (await sources.boundingBox())!;
        const updatedBox = (await updated.boundingBox())!;
        expect(updatedBox.y).toBeGreaterThan(sourcesBox.y + sourcesBox.height);
        await expect(updated).toHaveCSS("text-align", "start");
        const paginationBox = (await pagination.boundingBox())!;
        expect(paginationBox.y).toBeGreaterThan(updatedBox.y + updatedBox.height);
        expect(paginationBox.y - (updatedBox.y + updatedBox.height)).toBeCloseTo(16, 0);
        const container = (await pagination.boundingBox())!;
        const gap = await pagination.evaluate(element => Number.parseFloat(getComputedStyle(element).columnGap));
        const cardWidth = directions.length === 1 ? container.width : (container.width - gap) / 2;
        for (const [index, direction] of directions.entries()) {
          const link = links.nth(index);
          const card = (await link.boundingBox())!;
          expect(card.width).toBeCloseTo(cardWidth, 0);
          expect(card.x).toBeCloseTo(container.x + index * (cardWidth + gap), 0);
          await expect(link).toHaveAttribute("href", `/${locale}/docs/${destinations[index]}`);
          await expect(link).toHaveAttribute("rel", direction);
          await expect(link).toHaveCSS("text-align", direction === "next" ? "end" : "start");
          await expect(link.locator("strong")).toHaveCSS("font-size", "14px");
        }
        await expect(pagination.locator(":scope > span")).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await pagination.screenshot({ path: testInfo.outputPath(`${slug}.png`) });
      }
    });
  }
}
