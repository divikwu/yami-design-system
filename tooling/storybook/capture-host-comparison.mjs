import { promises as fs } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const outputDir = path.resolve("docs/migration/visual-comparison");
const story = "iframe.html?id=yami-pages-ecommerce-home--pc&viewMode=story&globals=locale:zh;theme:light";
const hosts = [
  ["dl-source", process.env.DL_STORYBOOK_URL ?? "http://localhost:6006"],
  ["yami-design-system", process.env.YAMI_STORYBOOK_URL ?? "http://localhost:6007"],
];

await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [name, baseUrl] of hosts) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    await page.goto(`${baseUrl}/${story}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.locator('[data-slot="ecommerce-home"]').waitFor({ state: "visible", timeout: 30_000 });
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}" });
    await page.waitForTimeout(2_000);
    await page.screenshot({ path: path.join(outputDir, `${name}-ecommerce-home-zh-light-1440.png`), fullPage: true });
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(`Captured ${hosts.length} host screenshots in ${path.relative(process.cwd(), outputDir)}.`);
