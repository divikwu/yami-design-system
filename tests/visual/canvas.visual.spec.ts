import { expect, test, type Page } from "@playwright/test";

test.skip(!process.env.CI, "Visual baselines are generated and compared only in the locked Linux CI image.");

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
});

async function waitForStablePreview(page: Page) {
  const preview = page.frameLocator('iframe[title="YAMI 原型预览"]');
  await expect(preview.getByRole("main")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await preview.locator("body").evaluate(async () => {
    await document.fonts.ready;
    const visibleImages = Array.from(document.images)
      .filter((image) => {
        const bounds = image.getBoundingClientRect();
        return (
          bounds.width > 0 &&
          bounds.height > 0 &&
          bounds.bottom >= 0 &&
          bounds.top <= window.innerHeight
        );
      })
      .map((image) => {
        if (image.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        });
      });
    await Promise.race([
      Promise.all(visibleImages),
      new Promise<void>((resolve) => window.setTimeout(resolve, 3_000)),
    ]);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
  });
}

async function waitForDirectPreview(page: Page, selector: string) {
  await expect(page.locator(selector)).toBeVisible();
  await page.locator("body").evaluate(async () => {
    await document.fonts.ready;
    const visibleImages = Array.from(document.images)
      .filter((image) => {
        const bounds = image.getBoundingClientRect();
        return bounds.width > 0 && bounds.height > 0 && bounds.bottom >= 0 && bounds.top <= window.innerHeight;
      })
      .map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      }));
    await Promise.race([
      Promise.all(visibleImages),
      new Promise<void>((resolve) => window.setTimeout(resolve, 3_000)),
    ]);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

async function materializeTopicPage(page: Page) {
  await page.addStyleTag({
    content: `
      [data-slot="topic-landing-standard-rail"],
      [data-slot="topic-landing-brand-rail"],
      [data-slot="topic-landing-review-list"],
      [data-slot="topic-landing-waterfall-section"] {
        content-visibility: visible !important;
        contain-intrinsic-size: none !important;
      }
    `,
  });
  await page.evaluate(async () => {
    const settle = () => new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    for (let offset = 0; offset < document.documentElement.scrollHeight; offset += Math.max(window.innerHeight * 0.8, 600)) {
      window.scrollTo(0, offset);
      await settle();
    }
    window.scrollTo(0, 0);
    await Promise.race([
      Promise.all(Array.from(document.images).map((image) => image.complete ? Promise.resolve() : new Promise<void>((resolve) => {
        image.addEventListener("load", () => resolve(), { once: true });
        image.addEventListener("error", () => resolve(), { once: true });
      }))),
      new Promise<void>((resolve) => window.setTimeout(resolve, 5_000)),
    ]);
    await settle();
  });
}

test.describe("ecommerce-home-full-matrix", () => {
  for (const locale of ["zh", "en"] as const) {
    for (const theme of ["light", "dark"] as const) {
      for (const viewport of ["402", "768", "1440"] as const) {
        test(`current in ${locale}/${theme} at ${viewport}px`, async ({ page }) => {
          await page.setViewportSize({ width: viewport === "1440" ? 1920 : 1440, height: 1100 });
          await page.goto(`/workbench?path=%2F&direction=current&locale=${locale}&theme=${theme}&viewport=${viewport}`);
          await waitForStablePreview(page);
          await expect(page).toHaveScreenshot(`current-${locale}-${theme}-${viewport}.png`, { fullPage: true });
        });
      }
    }
  }
});

const pairwisePageCases = [
  {
    id: "search-zh-light-402",
    url: "/preview/search?data=snapshot&locale=zh&theme=light",
    selector: '[data-slot="search-results-page"]',
    width: 402,
  },
  {
    id: "search-en-dark-1440",
    url: "/preview/search?data=snapshot&locale=en&theme=dark",
    selector: '[data-slot="search-results-page"]',
    width: 1440,
  },
  {
    id: "topic-zh-light-402",
    url: "/preview?path=%2Fbrands%2Fanua&direction=current&locale=zh&theme=light&transition=none",
    selector: '[data-slot="topic-landing-page"]',
    width: 402,
  },
  {
    id: "topic-en-dark-1440",
    url: "/preview?path=%2Fbrands%2Fanua&direction=current&locale=en&theme=dark&transition=none",
    selector: '[data-slot="topic-landing-page"]',
    width: 1440,
  },
] as const;

test.describe("pairwise-page-contracts", () => {
  for (const visualCase of pairwisePageCases) {
    test(visualCase.id, async ({ page }) => {
      await page.setViewportSize({ width: visualCase.width, height: 1100 });
      await page.goto(visualCase.url);
      await waitForDirectPreview(page, visualCase.selector);
      if (visualCase.id.startsWith("topic-")) await materializeTopicPage(page);
      await expect(page).toHaveScreenshot(`${visualCase.id}.png`, { fullPage: true });
    });
  }
});
