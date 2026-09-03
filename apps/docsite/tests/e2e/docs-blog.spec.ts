import { expect, test } from "@playwright/test";

test("renders the desktop documentation shell, stable table of contents, and pagination", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/zh/docs/getting-started");

  const articleTitle = page.getByRole("heading", { level: 1, name: "Storybook 入门" });
  await expect(articleTitle).toHaveCSS("font-family", /Source Serif 4/);
  await expect(articleTitle).toHaveCSS("font-weight", "400");
  await expect(page.getByRole("navigation", { name: "YAMI 文档", exact: true })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "本页内容" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Storybook 入门", exact: true }).last()).toHaveAttribute(
    "aria-current",
    "page",
  );

  await page.getByRole("navigation", { name: "本页内容" }).getByRole("link", { name: "Storybook 是什么" }).click();
  await expect(page).toHaveURL(/#what-storybook-is$/);
  await expect(page.locator("#what-storybook-is")).toBeVisible();

  await page.getByRole("navigation", { name: "文档翻页" }).getByRole("link").last().click();
  await expect(page).toHaveURL(/\/zh\/docs\/browse-components$/);
  await expect(page.getByRole("heading", { level: 1, name: "查看组件与页面" })).toBeVisible();
});

test("uses the global mobile menu for documentation and keeps a single sticky page jump", async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 844 });
  await page.goto("/zh/docs/browse-components");

  await expect(page.getByRole("button", { name: "文档目录", exact: true })).toHaveCount(0);
  const menu = page.getByRole("button", { name: "菜单", exact: true });
  await expect(menu).toBeVisible();
  await menu.click();
  const dialog = page.getByRole("dialog", { name: "菜单", exact: true });
  await expect(dialog.getByRole("link", { name: "查看组件与页面" })).toHaveAttribute("aria-current", "page");
  await expect(dialog.getByRole("navigation", { name: "YAMI 文档", exact: true }).getByRole("heading", { level: 2 })).toHaveCount(4);
  await dialog.getByRole("button", { name: "关闭" }).click();
  await expect(dialog).not.toBeAttached();

  await page.getByRole("combobox", { name: "本页内容" }).click();
  await page.getByRole("option", { name: "设计规范", exact: true }).click();
  await expect(page).toHaveURL(/#design-standards$/);
  await expect(page.locator("#design-standards")).toContainText("设计规范");
});

test("copies a fenced code block", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/en/docs/choose-starting-point");

  const copyButton = page.locator("pre").first().locator("..").getByRole("button");
  await copyButton.click();

  await expect(copyButton).toHaveAccessibleName("Copied");
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("Target users:");
});

test("filters Blog categories and opens a complete article", async ({ page }) => {
  await page.goto("/zh/blog");
  const blogHeading = page.getByRole("heading", { level: 1, name: "文章" });
  await expect(blogHeading).toHaveCSS("font-family", /Source Serif 4/);
  await expect(blogHeading).toHaveCSS("font-weight", "400");
  const tabs = page.getByRole("tablist");
  await expect(tabs.getByRole("tab")).toHaveCount(3);
  await expect(tabs.getByRole("tab", { name: "更新", exact: true })).toHaveCount(0);
  await tabs.getByRole("tab", { name: "设计", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("暂无文章，可以看看其他分类");
  await tabs.getByRole("tab", { name: "工程" }).click();
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.locator("article:visible")).toHaveCount(3);
  await page.getByRole("link", { name: /用 Storybook 构建、测试和记录组件/ }).click();

  await expect(page).toHaveURL(/\/zh\/blog\/build-test-document-components-with-storybook$/);
  const articleTitle = page.getByRole("heading", { level: 1, name: "用 Storybook 构建、测试和记录组件" });
  await expect(articleTitle).toBeVisible();
  await expect(articleTitle).toHaveCSS("font-family", /Source Serif 4/);
  await expect(articleTitle).toHaveCSS("font-weight", "400");
  await expect(page.getByText("YAMI Design System Team", { exact: true })).toHaveCount(0);
  const cover = page.locator("article > div").first();
  await expect(cover).toHaveText("");
  const coverBox = await cover.boundingBox();
  expect(coverBox).not.toBeNull();
  expect(coverBox!.width / coverBox!.height).toBeCloseTo(16 / 9, 2);
  await expect(page.getByRole("heading", { level: 2, name: "关联文档" })).toBeVisible();

  const articleHeader = page.locator("article > header");
  await expect(articleHeader.getByText("工程", { exact: true })).toHaveCount(1);
  await expect(articleHeader.locator("hr")).toHaveCount(1);

  const description = articleHeader.locator("p");
  await expect(description).toHaveCSS("font-size", "16px");
  await expect(description).toHaveCSS("line-height", "28px");

  const breadcrumbLink = page.getByRole("navigation", { name: "面包屑导航" }).getByRole("link");
  const breadcrumbLinkBox = await breadcrumbLink.boundingBox();
  expect(breadcrumbLinkBox).not.toBeNull();
  expect(breadcrumbLinkBox!.height).toBeGreaterThanOrEqual(44);

  const firstSectionHeading = page.getByRole("heading", { level: 2, name: "Story 是组件状态的可复现记录" });
  await expect(firstSectionHeading).toHaveCSS("font-size", "20px");
  await expect(firstSectionHeading).toHaveCSS("line-height", "28px");
  await expect(page.getByRole("button", { name: "复制“Story 是组件状态的可复现记录”链接" })).toHaveCount(0);

  const articleTags = page.locator('[aria-label="标签"] [data-slot="tag"]');
  await expect(articleTags).toHaveCount(4);
  for (const tag of await articleTags.all()) {
    await expect(tag).toHaveAttribute("data-size", "m");
    await expect(tag).toHaveCSS("height", "28px");
    await expect(tag).toHaveCSS("background-color", "rgba(0, 0, 0, 0.04)");
  }

  await expect(page.getByRole("navigation", { name: "Blog 翻页" })).toHaveCount(0);
  const related = page.locator("section[aria-labelledby='related-docs']");
  await expect(related.getByRole("link")).toHaveCount(3);
  await expect(related.locator("svg")).toHaveCount(3);
  const relatedGrid = related.locator(":scope > div");
  await expect(relatedGrid).toHaveCSS("grid-template-columns", "372px 372px");
});

test("keeps BlogCard title weight consistent and matches homepage typography on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1325, height: 1257 });
  await page.goto("/zh/blog");

  const cards = page.locator('[role="tabpanel"]:visible article');
  await expect(cards).toHaveCount(3);
  for (const card of await cards.all()) {
    await expect(card.getByRole("heading")).toHaveCSS("font-weight", "400");
  }

  await page.setViewportSize({ width: 541, height: 1257 });

  for (const card of await cards.all()) {
    await expect(card.getByRole("heading")).toHaveCSS("font-size", "16px");
    await expect(card.getByRole("heading")).toHaveCSS("font-weight", "400");
    await expect(card.getByRole("heading")).toHaveCSS("line-height", "20px");
    await expect(card.locator("p").first()).toHaveCSS("font-size", "14px");
    await expect(card.locator("p").first()).toHaveCSS("line-height", "20px");
  }

  const featureByline = cards.first().locator("div").last();
  await expect(featureByline).toHaveCSS("font-size", "12px");
  await expect(featureByline).toHaveCSS("line-height", "14px");
});

test("serves localized RSS, sitemap, robots, and not-found responses", async ({ page, request }) => {
  const rss = await request.get("/zh/rss.xml");
  expect(rss.ok()).toBe(true);
  expect(rss.headers()["content-type"]).toContain("application/rss+xml");
  expect((await rss.text()).match(/<item>/g)).toHaveLength(3);

  expect((await request.get("/sitemap.xml")).ok()).toBe(true);
  expect((await request.get("/robots.txt")).ok()).toBe(true);

  const response = await page.goto("/zh/docs/not-a-real-page");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/页面不存在|404/);

  const englishResponse = await page.goto("/en/blog/not-a-real-post");
  expect(englishResponse?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Page Not Found|404/);

  expect((await request.get("/fr")).status()).toBe(404);
});
