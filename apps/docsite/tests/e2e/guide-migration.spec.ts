import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import legacyDocRedirects from "../../lib/legacy-doc-redirects.json" with { type: "json" };

test("keeps Quick Start above four visible groups and three direct Storybook links", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/zh/docs/getting-started");
  const nav = page.getByRole("navigation", { name: "YAMI 文档", exact: true });
  await expect(nav.getByRole("link", { name: "快速开始", exact: true })).toBeVisible();
  await expect(nav.getByRole("group", { name: "使用组件库", exact: true }).getByRole("link")).toHaveText([
    "Storybook 入门",
    "查看组件与页面",
  ]);
  for (const name of ["使用组件库", "用 AI 创建", "多人协作", "资源与帮助"]) {
    await expect(nav.getByRole("button", { name, exact: true })).toHaveAttribute("aria-expanded", "true");
  }
  await expect(nav.getByRole("button", { name: "扩展与维护", exact: true })).toHaveCount(0);
  await expect(nav.getByRole("group", { name: "多人协作", exact: true }).getByRole("link", { name: "分享组件与页面", exact: true })).toBeVisible();
  await expect(nav.getByRole("link")).toHaveCount(16);
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
    ? { nav: "YAMI 文档", menu: "菜单", ai: "用 AI 创建", start: "使用组件库", title: "创建页面", prepare: "开始创建", component: "创建组件", check: "检查页面", pagination: "文档翻页" }
    : { nav: "YAMI Docs", menu: "Menu", ai: "Create with AI", start: "Use the library", title: "Create a page", prepare: "Start creating", component: "Create a component", check: "Check the page", pagination: "Documentation Pagination" };

  for (const width of [375, 733, 1440]) {
    test(`${locale} guide groups page creation under AI at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/${locale}/docs/choose-starting-point`);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(labels.title);
      if (width < 769) await page.getByRole("button", { name: labels.menu, exact: true }).click();
      const nav = page.getByRole("navigation", { name: labels.nav, exact: true });
      const entry = nav.getByRole("group", { name: labels.start, exact: true });
      await expect(entry.getByRole("link")).toHaveCount(2);
      const ai = nav.getByRole("group", { name: labels.ai, exact: true });
      await expect(ai.getByRole("link").nth(0)).toHaveText("Skill");
      await expect(ai.getByRole("link").nth(1)).toHaveText(labels.prepare);
      await expect(ai.getByRole("link").nth(2)).toHaveText(labels.component);
      await expect(ai.getByRole("link").nth(3)).toHaveText(labels.title);
      await expect(ai.getByRole("link").nth(4)).toHaveText(labels.check);
      await expect(ai.getByRole("link", { name: labels.title, exact: true })).toHaveAttribute("aria-current", "page");
      const toggle = nav.getByRole("button", { name: labels.ai, exact: true });
      await toggle.click();
      await expect(nav.getByRole("link", { name: labels.title, exact: true })).toBeHidden();
      await expect(nav.getByRole("link", { name: locale === "zh" ? "快速开始" : "Getting Started", exact: true })).toBeVisible();
      await toggle.click();
      await nav.getByRole("link", { name: labels.title, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`/${locale}/docs/choose-starting-point$`));
      if (width < 769) await expect(page.getByRole("dialog", { name: labels.menu, exact: true })).not.toBeAttached();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }

  test(`${locale} pagination follows setup, creation, then page checks`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/${locale}/docs/browse-components`);
    const pagination = page.getByRole("navigation", { name: labels.pagination, exact: true });
    for (const [slug, title] of [["using-yami-with-ai", "Skill"], ["prepare-environment", labels.prepare], ["create-components", labels.component], ["choose-starting-point", labels.title], ["review-checklist", labels.check]]) {
      const next = pagination.getByRole("link").last();
      await expect(next).toHaveAttribute("href", `/${locale}/docs/${slug}`);
      await next.click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(title!);
    }
    const previous = pagination.getByRole("link").first();
    await expect(previous).toHaveAttribute("href", `/${locale}/docs/choose-starting-point`);
    await expect(previous).toContainText(labels.title);
  });

  test(`${locale} routes prompts from the start page into component and page workflows`, async ({ page }) => {
    const copy = locale === "zh"
      ? {
          startSection: "进入对应流程",
          componentSection: "复制组件提示词",
          componentPrompts: ["有组件参考", "没有组件参考"],
          targetUsers: "目标用户",
          deliverySection: "交付前检查",
          deliveryEvidence: "修改文件、验证结果和未解决项",
          removedComponentSections: ["先读实现依据", "补齐组件交付内容", "保持公共包独立", "生成并验证", "常见问题"],
          pageSection: "复制页面提示词",
          pagePrompts: ["有页面参考", "没有页面参考"],
          pageRequiredFields: ["目标用户", "验收标准"],
          removedPageSections: ["写好页面简报"],
          refinementSection: "继续调整页面",
        }
      : {
          startSection: "Continue to the matching workflow",
          componentSection: "Copy a component prompt",
          componentPrompts: ["With a component reference", "Without a component reference"],
          targetUsers: "Target users",
          deliverySection: "Check the delivery",
          deliveryEvidence: "Changed files, verification results, and open issues",
          removedComponentSections: ["Read the implementation sources", "Complete the component bundle", "Keep the shared package independent", "Generate and verify", "Common questions"],
          pageSection: "Copy a page prompt",
          pagePrompts: ["With a page reference", "Without a page reference"],
          pageRequiredFields: ["Target users", "Acceptance criteria"],
          removedPageSections: ["Write a page brief"],
          refinementSection: "Continue refining a page",
        };

    await page.goto(`/${locale}/docs/prepare-environment`);
    const startArticle = page.locator("article");
    await expect(startArticle.getByRole("heading", { level: 2, name: copy.startSection, exact: true })).toBeVisible();
    await expect(startArticle.locator("pre")).toHaveCount(0);

    await page.goto(`/${locale}/docs/create-components`);
    const componentArticle = page.locator("article");
    await expect(componentArticle.getByRole("heading", { level: 2, name: copy.componentSection, exact: true })).toBeVisible();
    for (const prompt of copy.componentPrompts) {
      await expect(componentArticle.getByRole("heading", { level: 3, name: prompt, exact: true })).toBeVisible();
    }
    const componentPrompts = componentArticle.locator("pre");
    await expect(componentPrompts).toHaveCount(3);
    for (const prompt of (await componentPrompts.all()).slice(0, 2)) {
      await expect(prompt).not.toContainText(/AGENTS\.md|SKILL\.md|generated\/catalog\.json|meta\.json|usage\.md/);
      await expect(prompt).toContainText(copy.targetUsers);
    }
    await expect(componentArticle.locator("#report-a-component-issue")).toHaveText(locale === "zh" ? "反馈组件问题" : "Report a component issue");
    await expect(componentPrompts.last()).toContainText(locale === "zh" ? "复现" : "reproduce");
    await expect(componentPrompts.first()).toContainText(locale === "zh" ? "最终决定" : "final decision");
    await expect(componentArticle.getByRole("heading", { level: 2, name: copy.deliverySection, exact: true })).toBeVisible();
    await expect(componentArticle).toContainText(copy.deliveryEvidence);
    for (const section of copy.removedComponentSections) {
      await expect(componentArticle.getByRole("heading", { level: 2, name: section, exact: true })).toHaveCount(0);
    }

    await page.goto(`/${locale}/docs/choose-starting-point`);
    const pageArticle = page.locator("article");
    await expect(pageArticle.getByRole("heading", { level: 2, name: copy.pageSection, exact: true })).toBeVisible();
    for (const prompt of copy.pagePrompts) {
      await expect(pageArticle.getByRole("heading", { level: 3, name: prompt, exact: true })).toBeVisible();
    }
    const pagePrompts = pageArticle.locator("pre");
    for (const index of [0, 1]) {
      await expect(pagePrompts.nth(index)).not.toContainText(/AGENTS\.md|SKILL\.md|generated\/catalog\.json|meta\.json|usage\.md/);
      await expect(pagePrompts.nth(index)).toContainText(locale === "zh" ? "验证结果" : "verification results");
      for (const field of copy.pageRequiredFields) {
        await expect(pagePrompts.nth(index)).toContainText(field);
      }
    }
    for (const section of copy.removedPageSections) {
      await expect(pageArticle.getByRole("heading", { level: 2, name: section, exact: true })).toHaveCount(0);
    }
    await expect(pageArticle.getByRole("heading", { level: 2, name: copy.refinementSection, exact: true })).toBeVisible();
    await expect(pagePrompts).toHaveCount(3);
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

test("mobile creation navigation stays accessible with the compact guide", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/zh/docs/choose-starting-point");
  await page.getByRole("button", { name: "菜单", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "菜单", exact: true });
  await expect(dialog.getByRole("navigation", { name: "YAMI 文档", exact: true }).getByRole("link")).toHaveCount(16);
  await expect(dialog.getByRole("link", { name: "创建页面", exact: true })).toHaveAttribute("aria-current", "page");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await dialog.getByRole("link", { name: "常见问题", exact: true }).click();
  await expect(page).toHaveURL(/\/zh\/docs\/faq$/);
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
