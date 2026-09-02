import { expect, test } from "@playwright/test";

const pages = [
  { name: "home", path: "" },
  { name: "docs", path: "/docs/getting-started" },
  { name: "blog-detail", path: "/blog/introducing-yami-design-system" },
];

const scenarios = [
  { name: "desktop-zh-light", locale: "zh", theme: "light", width: 1440, height: 900 },
  { name: "desktop-en-light", locale: "en", theme: "light", width: 1440, height: 900 },
  { name: "tablet-en-dark", locale: "en", theme: "dark", width: 768, height: 1024 },
  { name: "mobile-zh-dark", locale: "zh", theme: "dark", width: 402, height: 844 },
] as const;

for (const target of pages) {
  for (const scenario of scenarios) {
    test(`captures ${target.name} ${scenario.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: scenario.width, height: scenario.height });
      await page.emulateMedia({ colorScheme: scenario.theme, reducedMotion: "reduce" });
      await page.addInitScript((theme) => {
        window.localStorage.setItem("yami-docsite-theme", theme);
      }, scenario.theme);
      await page.goto(`/${scenario.locale}${target.path}`);
      await page.evaluate(() => document.fonts.ready);

      const footer = page.getByRole("contentinfo");
      const resources = footer.getByRole("navigation");
      const version = footer.locator("p").first();
      await expect(footer.getByRole("img", { name: "YAMI", exact: true })).toHaveCount(0);
      await expect(footer.locator("strong")).toHaveCount(0);
      await expect(resources).toHaveCSS("justify-content", "flex-start");
      await expect(version).toHaveCSS("text-align", "start");
      const resourcesBox = (await resources.boundingBox())!;
      const versionBox = (await version.boundingBox())!;
      expect(versionBox.x).toBeCloseTo(resourcesBox.x, 0);

      if (target.name === "home") {
        const main = page.locator("main");
        const hero = main.locator("section").first();
        const heroHeading = page.getByRole("heading", { name: "YAMI DESIGN SYSTEM", exact: true });
        const showcase = page.locator("[data-home-showcase]");
        const [mainBackground, heroBackground] = await Promise.all([
          main.evaluate(element => getComputedStyle(element).backgroundColor),
          hero.evaluate(element => getComputedStyle(element).backgroundColor),
        ]);
        expect(mainBackground).toBe(heroBackground);
        await expect(heroHeading).toHaveCSS("font-family", /Source Serif 4/);
        await expect(heroHeading).toHaveCSS("font-weight", "400");
        await expect(heroHeading).toHaveCSS("font-size", scenario.width >= 1024 ? "56px" : "32px");
        await expect(heroHeading).toHaveCSS("line-height", scenario.width >= 1024 ? "64px" : "40px");
        await expect(showcase).toHaveCSS("border-radius", "32px 32px 0px 0px");
        await expect(showcase).toHaveCSS("overflow", "hidden");
        const about = page.locator('section[aria-labelledby="about-title"]');
        const homeContainer = about.locator(":scope > div");
        const aboutGrid = homeContainer.locator(":scope > div");
        const aboutIntro = aboutGrid.locator(":scope > div").first();
        const aboutColumns = aboutGrid.locator(":scope > div").nth(1);
        const aboutItems = aboutColumns.locator(":scope > article");
        const widthOffset = scenario.width < 768 ? 32 : scenario.width < 1024 ? 48 : 64;
        const expectedHomeContainerWidth = Math.min(scenario.width - widthOffset, 1200);
        const homeContainerBox = (await homeContainer.boundingBox())!;
        expect(homeContainerBox.x).toBeCloseTo((scenario.width - expectedHomeContainerWidth) / 2, 0);
        expect(homeContainerBox.width).toBeCloseTo(expectedHomeContainerWidth, 0);
        const [aboutIntroBox, aboutColumnsBox] = await Promise.all([
          aboutIntro.boundingBox(),
          aboutColumns.boundingBox(),
        ]);
        expect(aboutColumnsBox!.y).toBeGreaterThanOrEqual(aboutIntroBox!.y + aboutIntroBox!.height);
        if (scenario.width < 900) {
          expect(aboutColumnsBox!.x).toBeCloseTo(0, 0);
          expect(aboutColumnsBox!.x + aboutColumnsBox!.width).toBeCloseTo(scenario.width, 0);
        }
        await expect(aboutGrid).toHaveCSS("gap", scenario.width < 900 ? "24px" : "32px");
        await expect(about).toHaveCSS("padding-top", "64px");
        await expect(about).toHaveCSS("padding-bottom", scenario.width < 768 ? "40px" : "56px");
        await expect(aboutIntro).toHaveCSS("gap", "8px");
        await expect(aboutIntro.getByRole("heading")).toHaveCSS(
          "font-size",
          scenario.width < 768 ? "24px" : scenario.width < 1024 ? "28px" : "32px",
        );
        await expect(aboutIntro.getByRole("heading")).toHaveCSS("font-family", /Source Serif 4/);
        await expect(aboutIntro.getByRole("heading")).toHaveCSS("font-weight", "400");
        await expect(aboutColumns).toHaveCSS("gap", scenario.width < 900 ? "8px" : "16px");
        await expect(aboutColumns).toHaveCSS("overflow-x", scenario.width < 900 ? "auto" : "visible");
        await expect(aboutColumns).toHaveCSS("scroll-snap-type", scenario.width < 900 ? "x mandatory" : "none");
        const aboutColumnsMetrics = await aboutColumns.evaluate(element => ({
          clientWidth: element.clientWidth,
          scrollWidth: element.scrollWidth,
        }));
        if (scenario.width < 900) {
          expect(aboutColumnsMetrics.scrollWidth).toBeGreaterThan(aboutColumnsMetrics.clientWidth);
        } else {
          expect(aboutColumnsMetrics.scrollWidth).toBe(aboutColumnsMetrics.clientWidth);
        }
        await expect(aboutItems).toHaveCount(3);
        for (const aboutItem of await aboutItems.all()) {
          const aboutItemBox = (await aboutItem.boundingBox())!;
          if (scenario.width < 900) {
            expect(aboutItemBox.width).toBeCloseTo(Math.min(scenario.width * 0.8, 360), 0);
          }
          const aboutItemCopy = aboutItem.locator(":scope > div");
          const aboutItemText = aboutItemCopy.locator(":scope > div");
          await expect(aboutItemCopy).toHaveCount(1);
          await expect(aboutItemText).toHaveCount(1);
          await expect(aboutItemText.locator(":scope > h3")).toHaveCount(1);
          await expect(aboutItemText.locator(":scope > p")).toHaveCount(1);
          await expect(aboutItemText).toHaveCSS("gap", "4px");
          await expect(aboutItemCopy.locator(":scope > a")).toHaveCount(1);
          await expect(aboutItemCopy).toHaveCSS("padding-top", "8px");
          await expect(aboutItemCopy).toHaveCSS("row-gap", "16px");
    await expect(aboutItemText).toHaveCSS("align-content", "start");
          if (scenario.width < 900) {
            expect(aboutItemBox.height).toBeCloseTo(aboutItemBox.width * 2 / 3, 0);
          } else {
            expect(aboutItemBox.height).toBeCloseTo(aboutItemBox.width, 0);
          }
          const aboutItemCopyBox = (await aboutItemCopy.boundingBox())!;
          const aboutItemTextBox = (await aboutItemText.boundingBox())!;
          expect(aboutItemTextBox.height).toBeGreaterThan(48);
          expect(aboutItemCopyBox.y + aboutItemCopyBox.height).toBeCloseTo(
            aboutItemBox.y + aboutItemBox.height - (scenario.width < 900 ? 16 : 24),
            0,
          );
          await expect(aboutItem).toHaveCSS(
            "background-color",
            scenario.theme === "dark" ? "rgb(57, 57, 57)" : "rgb(245, 245, 245)",
          );
          await expect(aboutItem).toHaveCSS("padding", scenario.width < 900 ? "16px" : "24px");
          await expect(aboutItem).toHaveCSS("border-radius", "12px");
          await expect(aboutItem.getByRole("heading")).toHaveCSS("font-size", scenario.width >= 1024 ? "20px" : "16px");
          await expect(aboutItem.getByRole("heading")).toHaveCSS("line-height", scenario.width >= 1024 ? "28px" : "20px");
          await expect(aboutItem.getByRole("heading")).toHaveCSS("font-weight", "400");
          const icon = aboutItem.locator(":scope > svg");
          await expect(icon).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
          const iconBox = (await icon.boundingBox())!;
          expect(iconBox.width).toBe(32);
          expect(iconBox.height).toBe(32);
          const learnMore = aboutItem.getByRole("link");
          await expect(learnMore).toHaveCSS("height", "20px");
          await expect(learnMore).toHaveCSS("font-weight", "400");
          const learnMoreIcon = learnMore.locator(":scope > svg");
          await expect(learnMoreIcon).toHaveCount(1);
          const learnMoreIconBox = (await learnMoreIcon.boundingBox())!;
          expect(learnMoreIconBox.width).toBe(16);
          expect(learnMoreIconBox.height).toBe(16);
          await expect(learnMoreIcon).toHaveAttribute("stroke-width", "1.5");
          expect(await learnMore.evaluate(element => getComputedStyle(element, "::before").height)).toBe("48px");
          if (scenario.width >= 1024) {
            const [aboutItemCopyBox, learnMoreBox] = await Promise.all([
              aboutItemCopy.boundingBox(),
              learnMore.boundingBox(),
            ]);
            const aboutItemTextBox = (await aboutItemText.boundingBox())!;
            expect(learnMoreBox!.y - (aboutItemTextBox.y + aboutItemTextBox.height)).toBeCloseTo(16, 0);
            expect(learnMoreBox!.y + learnMoreBox!.height).toBeCloseTo(
              aboutItemCopyBox!.y + aboutItemCopyBox!.height,
              0,
            );
          }
        }
        const latest = page.locator('section[aria-labelledby="latest-title"]');
        const latestHeading = page.getByRole("heading", { name: scenario.locale === "zh" ? "最新文章" : "Latest from the Blog" });
        const latestAction = page.getByRole("link", { name: scenario.locale === "zh" ? "查看全部" : "View All Posts", exact: true });
        const blogGrid = latest.locator("article").first().locator("..");
        const blogTitle = latest.locator("article").first().getByRole("heading");
        const blogCover = latest.locator("article").first().locator("a > div").first();
        await expect(latestHeading.locator("..")).toHaveCSS("align-items", "center");
        await expect(latestHeading).toHaveCSS(
          "font-size",
          scenario.width < 768 ? "24px" : scenario.width < 1024 ? "28px" : "32px",
        );
        await expect(latestHeading).toHaveCSS("font-family", /Source Serif 4/);
        await expect(latestHeading).toHaveCSS("font-weight", "400");
        await expect(latestAction).toHaveCSS("font-weight", "400");
        await expect(blogTitle).toHaveCSS("font-weight", "400");
        await expect(latestAction).toHaveCSS("height", "20px");
        expect(await latestAction.evaluate(element => getComputedStyle(element, "::before").height)).toBe("48px");
        await expect(latestAction.locator("img, svg")).toHaveCount(0);
        await expect(latest.getByText(scenario.locale === "zh" ? "工程" : "Engineering", { exact: true })).toHaveCount(0);
        await expect(blogCover).toHaveCSS("border-radius", "12px");
        await expect(blogGrid).toHaveCSS("column-gap", "16px");
        await expect(blogGrid).toHaveCSS("row-gap", scenario.width < 768 ? "24px" : "16px");
        const discoverHeading = page.getByRole("heading", { name: scenario.locale === "zh" ? "探索完整的 YAMI 设计系统" : "Discover the full YAMI Design System" });
        await expect(discoverHeading).toHaveCSS("font-family", /Source Serif 4/);
        await expect(discoverHeading).toHaveCSS("font-weight", "400");
        await expect(discoverHeading.locator("img")).toHaveCount(0);
        await expect(discoverHeading.locator("..")).toHaveCSS("gap", "8px");
        await expect(discoverHeading.locator("..").locator("..").locator("..").locator(":scope > *")).toHaveCount(1);
        expect(await hero.evaluate(element => getComputedStyle(element, "::after").content)).toBe("none");

      }

      const hasHorizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(hasHorizontalOverflow).toBe(false);
      await page.screenshot({
        path: testInfo.outputPath(`${target.name}-${scenario.name}.png`),
        fullPage: true,
        caret: "initial",
      });
    });
  }
}

test("switches About directly between the mobile rail and three-column layout", async ({ page }) => {
  await page.setViewportSize({ width: 979, height: 1257 });
  await page.goto("/zh");

  const about = page.locator('section[aria-labelledby="about-title"]');
  const columns = about.locator("article").first().locator("..");
  const items = columns.locator(":scope > article");
  const desktopColumns = await columns.evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" "));
  expect(desktopColumns).toHaveLength(3);
  await expect(columns).toHaveCSS("overflow-x", "visible");
  await expect(about.getByRole("heading", { level: 2 })).toHaveCSS("text-align", "left");
  const desktopIconBox = (await items.first().locator(":scope > svg").boundingBox())!;
  expect(desktopIconBox.width).toBe(32);
  expect(desktopIconBox.height).toBe(32);
  for (const item of await items.all()) {
    const box = (await item.boundingBox())!;
    expect(box.height).toBeCloseTo(box.width, 0);
  }

  await page.setViewportSize({ width: 768, height: 1024 });
  await expect(columns).toHaveCSS("overflow-x", "auto");
  const mobileMetrics = await columns.evaluate(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(mobileMetrics.scrollWidth).toBeGreaterThan(mobileMetrics.clientWidth);
  const mobileItemBox = (await items.first().boundingBox())!;
  expect(mobileItemBox.width / mobileItemBox.height).toBeCloseTo(3 / 2, 1);
  const mobileIconBox = (await items.first().locator(":scope > svg").boundingBox())!;
  expect(mobileIconBox.width).toBe(32);
  expect(mobileIconBox.height).toBe(32);

  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
