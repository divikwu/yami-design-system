import { expect, test } from "@playwright/test";

const sites = [
  {
    name: "Docsite", base: "http://127.0.0.1:3402", entry: "/zh/docs/using-yami-with-ai",
    protectedPaths: ["/zh", "/en/docs/faq", "/zh/yami-skill.md", "/yami-skill.md", "/api/search", "/zh?_rsc=test", "/_next/static/chunks/test.js"],
  },
  {
    name: "Storybook", base: "http://127.0.0.1:6007", entry: "/?path=/story/yami-components-actions-button--playground",
    protectedPaths: ["/", "/index.json", "/iframe.html?id=yami-components-actions-button--playground", "/assets/fonts/GT-Walsheim-Regular.woff2", "/email/topic-landing"],
  },
];

for (const site of sites) {
  test(`${site.name}: appearance controls follow system, persist and switch language`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("console", message => { if (message.text().includes("Content Security Policy")) errors.push(message.text()); });
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto(site.base + "/__access/login?next=%2Fzh&lang=zh");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.getByRole("button", { name: "切换到亮色模式", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByRole("link", { name: "English", exact: true }).click();
    await expect(page.getByRole("heading", { name: site.name === "Docsite" ? "YAMI Design System" : "YAMI Storybook" })).toBeVisible();
    expect(new URL(page.url()).searchParams.get("next")).toBe("/zh");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await page.getByRole("button", { name: "Switch to dark mode", exact: true }).click();
    await page.getByLabel("Access password", { exact: true }).fill("incorrect-password");
    await page.getByRole("button", { name: "Enter site", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.setViewportSize({ width: 375, height: 812 });
    const tools = await page.getByRole("navigation", { name: "Display settings" }).boundingBox();
    expect(tools).not.toBeNull();
    expect(tools!.y).toBeLessThan(20);
    expect(tools!.x + tools!.width).toBeLessThanOrEqual(375);
    expect(tools!.x).toBeGreaterThan(250);
    await expect(page.locator("footer")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test(`${site.name}: protected content, real login, interaction and logout`, async ({ page, context }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const path of site.protectedPaths) {
      const result = await context.request.get(site.base + path, { headers: { accept: "*/*" } });
      expect(result.status(), path).toBe(401);
      expect(await result.text(), path).toBe("");
    }
    // A browser must not be able to bypass Proxy with an internal framework header.
    expect((await context.request.get(site.base + site.entry, {
      headers: { "x-middleware-subrequest": "proxy:proxy:proxy:proxy:proxy", accept: "*/*" },
    })).status()).toBe(401);

    await page.goto(site.base + site.entry);
    await expect(page.getByRole("heading", { name: site.name === "Docsite" ? "YAMI 设计系统" : "YAMI Storybook" })).toBeVisible();
    await page.getByLabel("访问密码", { exact: true }).fill("incorrect-password");
    await page.getByRole("button", { name: "进入网站" }).click();
    await expect(page.getByRole("alert")).toHaveText("密码不正确，请重新输入。");
    await page.getByLabel("访问密码", { exact: true }).fill("yami-local-preview-only");
    await page.getByRole("button", { name: "进入网站" }).click();
    await page.waitForURL(site.base + site.entry);

    if (site.name === "Docsite") {
      await expect(page.getByRole("heading", { name: "Skill", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "搜索", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      expect((await context.request.get(site.base + "/zh/yami-skill.md")).status()).toBe(200);
      await expect(page.getByRole("link", { name: "退出访问", exact: true })).toHaveCount(0);
      await page.goto(site.base + "/__access/logout?lang=zh");
    } else {
      const frame = page.frameLocator("#storybook-preview-iframe");
      await expect(frame.getByRole("button").first()).toBeVisible();
      await frame.getByRole("button").first().click();
      await expect(page.getByRole("tab", { name: /Controls/ }).first()).toBeVisible();
      expect((await context.request.get(site.base + "/index.json")).status()).toBe(200);
      await expect(page.getByRole("button", { name: "退出 / Sign out", exact: true })).toHaveCount(0);
      await page.goto(site.base + "/__access/logout?lang=zh");
    }
    const authenticated = await context.request.get(site.base + "/");
    expect(authenticated.headers()["cache-control"]).toContain("no-store");
    await page.getByRole("button", { name: "退出访问", exact: true }).click();
    const afterLogout = await context.request.get(site.base + site.protectedPaths[1], { headers: { accept: "*/*" } });
    expect(afterLogout.status()).toBe(401);
    expect(errors).toEqual([]);
  });

  test(`${site.name}: Chinese and English forms fit mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(site.base + "/__access/login?lang=en");
    await expect(page.getByRole("heading", { name: site.name === "Docsite" ? "YAMI Design System" : "YAMI Storybook" })).toBeVisible();
    await expect(page.getByLabel("Access password", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("link", { name: "中文", exact: true }).click();
    await expect(page.getByRole("heading", { name: site.name === "Docsite" ? "YAMI 设计系统" : "YAMI Storybook" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
