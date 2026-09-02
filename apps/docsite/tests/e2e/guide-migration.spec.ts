import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import legacyDocRedirects from "../../lib/legacy-doc-redirects.json" with { type: "json" };

test("keeps entry links above four visible groups and three direct Storybook links", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/zh/docs/getting-started");
  const nav = page.getByRole("navigation", { name: "YAMI 文档", exact: true });
  await expect(nav.getByRole("heading", { name: "使用组件库", exact: true })).toHaveCSS("clip", "rect(0px, 0px, 0px, 0px)");
  await expect(nav.getByRole("region", { name: "使用组件库", exact: true }).getByRole("link")).toHaveText([
    "如何使用组件库",
    "查找与试用组件",
  ]);
  for (const name of ["用 AI 搭建页面", "多人协作", "扩展与维护", "资源与帮助"]) {
    await expect(nav.getByRole("button", { name, exact: true })).toHaveAttribute("aria-expanded", "true");
  }
  await expect(nav.getByRole("link")).toHaveCount(22);
  for (const name of ["浏览组件", "查看设计规范", "查看页面示例"]) {
    const link = nav.getByRole("link", { name, exact: true });
    await expect(link).toHaveAttribute("href", /storybook\.vercel\.app\/\?path=\/story\/yami-/);
    await expect(link).toHaveAttribute("target", "_blank");
  }
  await nav.getByRole("button", { name: "多人协作", exact: true }).click();
  await expect(nav.getByRole("link", { name: "多人协作方式", exact: true })).toBeHidden();
  await nav.getByRole("button", { name: "多人协作", exact: true }).click();
  await nav.getByRole("link", { name: "多人协作方式", exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/docs\/collaboration$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("多人协作方式");
});

for (const locale of ["zh", "en"] as const) {
  const labels = locale === "zh"
    ? { nav: "YAMI 文档", menu: "菜单", ai: "用 AI 搭建页面", start: "使用组件库", title: "选择页面示例", prepare: "准备工作环境", first: "创建第一个页面", pagination: "文档翻页" }
    : { nav: "YAMI Docs", menu: "Menu", ai: "Build with AI", start: "Use the library", title: "Choose a page example", prepare: "Prepare your environment", first: "Create your first page", pagination: "Documentation Pagination" };

  for (const width of [375, 733, 1440]) {
    test(`${locale} guide groups the page example under AI at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/${locale}/docs/choose-starting-point`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(labels.title);
      if (width < 769) await page.getByRole("button", { name: labels.menu, exact: true }).click();
      const nav = page.getByRole("navigation", { name: labels.nav, exact: true });
      const entry = nav.getByRole("region", { name: labels.start, exact: true });
      await expect(entry.getByRole("link")).toHaveCount(2);
      await expect(entry.getByRole("heading")).toHaveCSS("clip", "rect(0px, 0px, 0px, 0px)");
      const ai = nav.getByRole("group", { name: labels.ai, exact: true });
      await expect(ai.getByRole("link").nth(0)).toHaveText(labels.prepare);
      await expect(ai.getByRole("link").nth(1)).toHaveText(labels.title);
      await expect(ai.getByRole("link").nth(2)).toHaveText(labels.first);
      await expect(ai.getByRole("link", { name: labels.title, exact: true })).toHaveAttribute("aria-current", "page");
      const toggle = nav.getByRole("button", { name: labels.ai, exact: true });
      await toggle.click();
      await expect(nav.getByRole("link", { name: labels.title, exact: true })).toBeHidden();
      await expect(entry.getByRole("link").first()).toBeVisible();
      await toggle.click();
      await nav.getByRole("link", { name: labels.title, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/docs/choose-starting-point$`));
      if (width < 769) await expect(page.getByRole("dialog", { name: labels.menu, exact: true })).not.toBeAttached();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }

  test(`${locale} pagination follows setup, example selection, then the first page`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/docs/browse-components`);
    const pagination = page.getByRole("navigation", { name: labels.pagination, exact: true });
    for (const [slug, title] of [["prepare-environment", labels.prepare], ["choose-starting-point", labels.title], ["first-page", labels.first]]) {
      const next = pagination.getByRole("link").last();
      await expect(next).toHaveAttribute("href", `/${locale}/docs/${slug}`);
      await next.click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title!);
    }
    const previous = pagination.getByRole("link").first();
    await expect(previous).toHaveAttribute("href", `/${locale}/docs/choose-starting-point`);
    await expect(previous).toContainText(labels.title);
  });
}

test("redirects every old route to its new localized or Storybook destination", async ({ request }) => {
  for (const locale of ["zh", "en"]) {
    for (const [slug, destination] of Object.entries(legacyDocRedirects)) {
      const response = await request.get(`/${locale}/docs/${slug}`, { maxRedirects: 0 });
      expect(response.status()).toBe(308);
      const location = response.headers().location ?? "";
      expect(location).toBe(destination.startsWith("https://") ? destination : `/${locale}${destination}`);
    }
  }
});

test("mobile tutorial navigation stays accessible with the expanded guide", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/zh/docs/first-page");
  await page.getByRole("button", { name: "菜单", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "菜单", exact: true });
  await expect(dialog.getByRole("navigation", { name: "YAMI 文档", exact: true }).getByRole("link")).toHaveCount(22);
  await expect(dialog.getByRole("link", { name: "创建第一个页面", exact: true })).toHaveAttribute("aria-current", "page");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await dialog.getByRole("link", { name: "常见问题", exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/docs\/faq$/);
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
