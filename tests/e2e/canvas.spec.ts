import { expect, test, type Page } from "@playwright/test";

async function expectCanvasPath(page: Page, path: string) {
  await expect.poll(() => new URL(page.url()).searchParams.get("path")).toBe(path);
}

function workbenchSelect(page: Page, label: string) {
  return page.getByRole("combobox", { name: label });
}

async function expectWorkbenchSelectValue(page: Page, label: string, value: string) {
  await expect(workbenchSelect(page, label)).toHaveAttribute("data-value", value);
}

async function chooseWorkbenchOption(page: Page, label: string, option: string) {
  await workbenchSelect(page, label).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

async function seedTestDirection(page: Page) {
  await page.addInitScript((direction) => {
    if (window.top === window) {
      localStorage.setItem("yami-design-system:drafts:v1", JSON.stringify([direction]));
    }
  }, {
    schemaVersion: 1,
    id: "test-direction",
    name: "Test Direction",
    extends: "current",
    pages: {
      home: {
        sections: [{ id: "trending-products", kind: "products", props: { title: "Test Selection" } }],
        tokenOverrides: { "--surface-secondary": "#f2eee6" },
      },
    },
  });
}

test("renders Ecommerce Home and routes iframe links through parent history", async ({ page }) => {
  await page.goto("/workbench?path=%2F&direction=current&locale=zh&theme=light&viewport=1440");
  await expect(page.getByText("PROTOTYPE", { exact: true })).toBeVisible();
  await expect(page.getByText("LIVE PROTOTYPE", { exact: true })).toHaveCount(0);
  await expect(page.getByText("AI 设计工作台", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("img", { name: "Yami" })).toHaveCount(0);
  await expect(page.locator(".canvas-header")).toHaveCSS("height", "56px");
  await expect(page.locator(".control-panel")).toHaveCSS("background-color", "rgb(250, 250, 250)");
  await expect(page.locator(".preview-stage")).toHaveCSS("background-color", "rgb(235, 235, 235)");
  await expect(page.locator(".canvas-header").getByRole("button", { name: "返回上一步" })).toHaveCount(0);
  const backButton = page.getByRole("button", { name: "返回上一步" });
  await expect(backButton).toHaveCount(0);
  await expect(page.locator(".path-readout")).toHaveCSS("border-left-color", "rgb(34, 34, 34)");
  const importButton = page.locator(".canvas-header").getByRole("button", { name: "导入", exact: true });
  await expect(importButton).toBeVisible();
  const storybookLink = page.getByRole("link", { name: "Storybook ↗", exact: true });
  const controlStyles = async (locator: typeof importButton) => locator.evaluate((element) => {
    const styles = getComputedStyle(element);
    return {
      height: styles.height,
      padding: styles.padding,
      border: styles.border,
      borderRadius: styles.borderRadius,
      background: styles.backgroundColor,
      color: styles.color,
      fontSize: styles.fontSize,
      fontWeight: styles.fontWeight,
      lineHeight: styles.lineHeight,
    };
  });
  expect(await controlStyles(storybookLink)).toEqual(await controlStyles(importButton));
  await expect(page.locator(".control-panel").getByRole("button", { name: "导入", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "导入 AI 方案", exact: true })).toHaveCount(0);
  await expect(page.getByText("AI 设计工作流", { exact: true })).toHaveCount(0);
  await expect(workbenchSelect(page, "设计方案")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "导出" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "重命名" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "删除" })).toHaveCount(0);
  const preview = page.frameLocator('iframe[title="YAMI 原型预览"]');
  await expect(preview.getByRole("heading", { name: "热销榜单" })).toBeVisible();
  await preview.getByRole("link", { name: /护肤精华露/ }).click();
  await expect(page).toHaveURL(/path=%2Fproducts%2Fproduct-featured-1/);
  await expect(backButton).toBeVisible();
  await expect(preview.getByText("YAMI PROTOTYPE ROUTE")).toBeVisible();
  await page.evaluate(() => history.back());
  await expectCanvasPath(page, "/");
  await expect(backButton).toHaveCount(0);
});

test("renders accessible workbench controls and switches device by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto("/workbench?path=%2F&direction=current&locale=en&theme=light&viewport=360");
  await expect(page).toHaveURL(/viewport=402/);
  await expect(page.getByText("402 PX · LIGHT · EN")).toBeVisible();
  await expect(page.locator(".canvas-header").getByRole("button", { name: "导入", exact: true })).toBeVisible();

  await expectWorkbenchSelectValue(page, "页面", "/");
  await expectWorkbenchSelectValue(page, "语言", "en");
  await expectWorkbenchSelectValue(page, "主题", "light");
  await expect(workbenchSelect(page, "页面")).toHaveCSS("height", "36px");
  await expect(workbenchSelect(page, "页面")).toHaveCSS("border-radius", "0px");

  await workbenchSelect(page, "页面").click();
  await expect(workbenchSelect(page, "页面")).toHaveCSS("outline-style", "none");
  const selectPopup = page.locator('[data-slot="workbench-select-popup"]');
  await expect(selectPopup).toBeVisible();
  await expect(selectPopup).toHaveCSS("border-radius", "0px");
  await expect(selectPopup).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page.getByRole("option", { name: "Ecommerce Home", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("option", { name: "Ecommerce Home", exact: true })).toHaveCSS("min-height", "32px");
  await expect(page.getByRole("option", { name: "Ecommerce Home", exact: true })).toHaveCSS("border-radius", "0px");
  await page.keyboard.press("Escape");
  await workbenchSelect(page, "页面").focus();
  await page.keyboard.press("Tab");
  await expect(workbenchSelect(page, "语言")).toBeFocused();
  await expect(workbenchSelect(page, "语言")).toHaveCSS("outline-width", "2px");

  const fieldLabels = page.locator('[data-slot="workbench-field-label"]');
  await expect(fieldLabels).toHaveCount(4);
  for (const fieldLabel of await fieldLabels.all()) {
    await expect(fieldLabel).toHaveCSS("font-size", "12px");
    await expect(fieldLabel).toHaveCSS("line-height", "16px");
  }

  const selectIcons = page.locator('[data-slot="workbench-select-icon"]');
  await expect(selectIcons).toHaveCount(3);
  const selectBounds = await workbenchSelect(page, "页面").boundingBox();
  const iconBounds = await selectIcons.first().boundingBox();
  expect(selectBounds).not.toBeNull();
  expect(iconBounds).not.toBeNull();
  expect(iconBounds?.width).toBe(12);
  expect(iconBounds?.height).toBe(12);
  expect(Math.round((selectBounds?.x ?? 0) + (selectBounds?.width ?? 0) - (iconBounds?.x ?? 0) - (iconBounds?.width ?? 0))).toBe(8);

  await workbenchSelect(page, "主题").focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expectWorkbenchSelectValue(page, "主题", "dark");
  await expect(page).toHaveURL(/theme=dark/);

  const deviceGroup = page.getByRole("group", { name: "设备" });
  const mobile = page.getByRole("radio", { name: "手机" });
  const tablet = page.getByRole("radio", { name: "平板" });
  const desktop = page.getByRole("radio", { name: "桌面" });
  await expect(deviceGroup).toBeVisible();
  await expect(mobile).toBeChecked();
  const deviceTabs = deviceGroup.locator("div").first();
  const mobileTab = mobile.locator("..").locator("span");
  await expect(deviceTabs).toHaveCSS("background-color", "rgb(245, 245, 245)");
  await expect(deviceTabs).toHaveCSS("border-top-width", "0px");
  await expect(deviceTabs).toHaveCSS("border-radius", "0px");
  await expect(deviceTabs).toHaveCSS("box-shadow", "none");
  await expect(mobileTab).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(mobileTab).toHaveCSS("border-radius", "0px");
  await expect(mobileTab).toHaveCSS("box-shadow", "none");

  await mobile.focus();
  await page.keyboard.press("ArrowRight");
  await expect(tablet).toBeChecked();
  await expect(deviceTabs).toHaveCSS("outline-width", "2px");
  await expect(tablet.locator("..").locator("span")).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(page).toHaveURL(/viewport=768/);
  await expect(page.getByText("768 PX · DARK · EN")).toBeVisible();

  await desktop.click();
  await expect(desktop).toBeChecked();
  await expect(page).toHaveURL(/viewport=1440/);

  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("opens the localized Anua Topic Landing Page from the Canvas page control", async ({ page }) => {
  await page.goto("/workbench?path=%2F&direction=current&locale=zh&theme=light&viewport=1440");
  const preview = page.frameLocator('iframe[title="YAMI 原型预览"]');
  await expect(preview.getByRole("heading", { name: "热销榜单" })).toBeVisible();

  await chooseWorkbenchOption(page, "页面", "Anua Topic Landing");
  await expectCanvasPath(page, "/brands/anua");

  await expect(preview.locator('[data-slot="topic-landing-page"]')).toBeVisible();
  await expect(preview.getByRole("heading", { name: "Anua：温和有效的韩系护肤" })).toBeVisible();

  await preview.locator('a[href="#explore-more-cleanse-peel"]').click();
  await expect.poll(() => page.frames().find((frame) => frame.url().includes("/preview?"))?.url()).toContain("#explore-more-cleanse-peel");
  await expectCanvasPath(page, "/brands/anua");

  await chooseWorkbenchOption(page, "语言", "English");
  await expect(preview.getByRole("heading", { name: "Anua: Gentle yet Effective Korean Skincare" })).toBeVisible();
});

test("renders the Anua Topic Landing Page for its storefront brand deep link", async ({ page }) => {
  await page.goto("/workbench?path=%2Fbrands%2F11712&direction=current&locale=en&theme=light&viewport=1440");

  const preview = page.frameLocator('iframe[title="YAMI 原型预览"]');
  await expect(preview.locator('[data-slot="topic-landing-page"]')).toBeVisible();
  await expect(preview.getByRole("heading", { name: "Anua: Gentle yet Effective Korean Skincare" })).toBeVisible();
});

test("scopes Ecommerce Home direction colors to Ecommerce Home", async ({ page }) => {
  await seedTestDirection(page);
  await page.setViewportSize({ width: 402, height: 800 });
  await page.goto("/preview?path=%2F&direction=test-direction&locale=en&theme=light&viewport=402&transition=none");
  await expect(page.locator(".prototype-root")).toHaveCSS("--surface-secondary", "#f2eee6");

  await page.goto("/preview?path=%2Fbrands%2Fanua&direction=test-direction&locale=en&theme=light&viewport=402&transition=none");

  const shortcutSurface = page.locator('[data-slot="shortcut-rail-surface"]');
  await expect(shortcutSurface).toBeVisible();
  await expect(shortcutSurface).toHaveCSS("background-color", "rgb(245, 245, 245)");
});

test("preserves a legacy direction deep link without exposing direction controls", async ({ page }) => {
  await seedTestDirection(page);
  await page.goto("/workbench?path=%2F&direction=test-direction&locale=zh&theme=dark&viewport=402");
  await expect(page).toHaveURL(/direction=test-direction/);
  await expect(page).toHaveURL(/theme=dark/);
  await expect(page).toHaveURL(/viewport=402/);
  await expect(page.frameLocator('iframe[title="YAMI 原型预览"]').getByRole("heading", { name: "Test Selection" })).toBeVisible();
  await expect(workbenchSelect(page, "设计方案")).toHaveCount(0);
});

test("routes cart, category, account and search destinations into prototype shells", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto("/workbench?path=%2F&direction=current&locale=zh&theme=light&viewport=1440");
  const preview = page.frameLocator('iframe[title="YAMI 原型预览"]');

  await preview.locator('a[href="/cart"]:visible').click();
  await expect(page).toHaveURL(/path=%2Fcart/);
  await expect(preview.getByText("YAMI PROTOTYPE ROUTE")).toBeVisible();
  const backButton = page.getByRole("button", { name: "返回上一步" });
  await expect(backButton).toBeVisible();
  await backButton.click();
  await expectCanvasPath(page, "/");
  await expect(backButton).toHaveCount(0);

  await preview.locator('a[href^="/categories/"]:visible').first().click();
  await expect(page).toHaveURL(/path=%2Fcategories%2F/);
  await expect(preview.getByText("YAMI PROTOTYPE ROUTE")).toBeVisible();
  await page.evaluate(() => history.back());
  await expectCanvasPath(page, "/");
  await expect(preview.getByRole("heading", { name: "热销榜单" })).toBeVisible();

  await preview.locator('a[href="/account"]:visible').click();
  await expect(page).toHaveURL(/path=%2Faccount/);
  await expect(preview.getByText("YAMI PROTOTYPE ROUTE")).toBeVisible();
  await page.evaluate(() => history.back());
  await expectCanvasPath(page, "/");
  await expect(preview.getByRole("heading", { name: "热销榜单" })).toBeVisible();

  const search = preview.locator('input[type="search"]:visible').first();
  await search.fill("matcha powder");
  await search.press("Enter");
  await expect(page).toHaveURL(/path=%2Fsearch%2Fmatcha%2520powder/);
  await page.reload();
  await expect(preview.getByText("YAMI PROTOTYPE ROUTE")).toBeVisible();
});

test("rejects rogue and unknown messages while rapid iframe navigation settles safely", async ({ page }) => {
  await page.goto("/workbench?path=%2F&direction=current&locale=zh&theme=light&viewport=1440");
  const initialUrl = page.url();

  await page.evaluate(() => window.postMessage({ type: "yami-design-system:v1:navigate", path: "/cart" }, window.location.origin));
  await page.waitForTimeout(100);
  expect(page.url()).toBe(initialUrl);

  await page.evaluate(() => new Promise<void>((resolve) => {
    const rogue = document.createElement("iframe");
    rogue.src = `data:text/html,${encodeURIComponent("<script>parent.postMessage({type:'yami-design-system:v1:navigate',path:'/account'},'*')</script>")}`;
    rogue.onload = () => setTimeout(() => { rogue.remove(); resolve(); }, 50);
    document.body.append(rogue);
  }));
  expect(page.url()).toBe(initialUrl);

  const previewFrame = page.frames().find((frame) => frame.url().includes("/preview?"));
  if (!previewFrame) throw new Error("Preview frame not found");
  await previewFrame.evaluate(() => {
    window.parent.postMessage({ type: "yami-design-system:v0:navigate", path: "/account" }, window.location.origin);
    window.parent.postMessage({ type: "yami-design-system:v1:navigate", path: "/products/first" }, window.location.origin);
    window.parent.postMessage({ type: "yami-design-system:v1:navigate", path: "/products/second" }, window.location.origin);
  });
  await expect(page).toHaveURL(/path=%2Fproducts%2Fsecond/);
  await page.goBack();
  await expectCanvasPath(page, "/");
});

test("imports a page from the Storybook page index", async ({ page }) => {
  await page.route("http://localhost:6006/index.json", (route) => route.fulfill({
    contentType: "application/json",
    headers: { "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify({
      v: 5,
      entries: {
        "yami-pages-ecommerce-home--pc": { id: "yami-pages-ecommerce-home--pc", type: "story", title: "YAMI/Pages/Ecommerce Home", name: "PC" },
        "yami-pages-ecommerce-home--mobile": { id: "yami-pages-ecommerce-home--mobile", type: "story", title: "YAMI/Pages/Ecommerce Home", name: "Mobile" },
        "yami-pages-topic-landing-page-topic--pc": { id: "yami-pages-topic-landing-page-topic--pc", type: "story", title: "YAMI/Pages/Topic Landing Page/Topic", name: "Topic — PC" },
        "yami-components-button--primary": { id: "yami-components-button--primary", type: "story", title: "YAMI/Components/Button", name: "Primary" },
      },
    }),
  }));
  await page.route("http://localhost:6006/iframe.html*", (route) => route.fulfill({
    contentType: "text/html",
    body: "<!doctype html><html><body><main><h1>Imported Topic Page</h1></main></body></html>",
  }));

  await page.goto("/workbench?path=%2F&direction=current&locale=en&theme=light&viewport=402");
  await page.getByRole("button", { name: "导入", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "从 Storybook 导入页面" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Ecommerce Home", exact: true })).toHaveCount(1);
  await expect(dialog.getByRole("button", { name: "Topic Landing Page / Topic", exact: true })).toHaveCount(1);
  await expect(dialog.getByText("YAMI/Components/Button", { exact: true })).toHaveCount(0);

  await dialog.getByRole("button", { name: "Topic Landing Page / Topic", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect.poll(() => new URL(page.url()).searchParams.get("story")).toBe("yami-pages-topic-landing-page-topic--pc");
  await expect.poll(() => new URL(page.url()).searchParams.get("path")).toBeNull();
  await expectWorkbenchSelectValue(page, "页面", "storybook:yami-pages-topic-landing-page-topic--pc");
  await expect(page.getByText("yami-pages-topic-landing-page-topic--pc", { exact: true })).toBeVisible();
  await expect(page.frameLocator('iframe[title="YAMI 原型预览"]').getByRole("heading", { name: "Imported Topic Page" })).toBeVisible();

  await chooseWorkbenchOption(page, "页面", "Ecommerce Home");
  await expectCanvasPath(page, "/");
  await expect.poll(() => new URL(page.url()).searchParams.get("story")).toBeNull();
});

test("uses the complete iframe state on first render and after deep-link refresh", async ({ page }) => {
  await seedTestDirection(page);
  await page.goto("/workbench?path=%2F&direction=test-direction&locale=en&theme=dark&viewport=768");
  await expect(page.getByText("768 PX · DARK · EN")).toBeVisible();
  const preview = page.frameLocator('iframe[title="YAMI 原型预览"]');
  await expect(preview.locator(".prototype-root")).toHaveAttribute("data-theme", "dark");
  await expect(preview.getByRole("heading", { name: "Test Selection" })).toBeVisible();

  await page.goto("/workbench?path=%2Fcart&direction=test-direction&locale=en&theme=dark&viewport=768");
  await page.reload();
  await expect(page.getByText("/cart", { exact: true })).toBeVisible();
  await expect(preview.getByText("YAMI PROTOTYPE ROUTE")).toBeVisible();
});
