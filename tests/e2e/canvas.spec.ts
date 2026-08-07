import { expect, test, type Page } from "@playwright/test";

async function expectCanvasPath(page: Page, path: string) {
  await expect.poll(() => new URL(page.url()).searchParams.get("path")).toBe(path);
}

test("renders Ecommerce Home and routes iframe links through parent history", async ({ page }) => {
  await page.goto("/workbench?path=%2F&direction=current&locale=zh&theme=light&viewport=1440");
  const preview = page.frameLocator('iframe[title="YAMI 原型预览"]');
  await expect(preview.getByRole("heading", { name: "热销榜单" })).toBeVisible();
  await preview.getByRole("link", { name: /护肤精华露/ }).click();
  await expect(page).toHaveURL(/path=%2Fproducts%2Fproduct-featured-1/);
  await expect(preview.getByText("YAMI PROTOTYPE ROUTE")).toBeVisible();
  await page.evaluate(() => history.back());
  await expectCanvasPath(page, "/");
});

test("switches direction without losing path, locale, theme or viewport", async ({ page }) => {
  await page.goto("/workbench?path=%2F&direction=current&locale=zh&theme=dark&viewport=360");
  await page.getByLabel("设计方向").selectOption("editorial-market");
  await expect(page).toHaveURL(/direction=editorial-market/);
  await expect(page).toHaveURL(/theme=dark/);
  await expect(page).toHaveURL(/viewport=360/);
  await expect(page.frameLocator('iframe[title="YAMI 原型预览"]').getByRole("heading", { name: "编辑精选" })).toBeVisible();

  await page.getByLabel("设计方向").selectOption("current");
  await page.getByLabel("设计方向").selectOption("editorial-market");
  await expect(page.getByLabel("设计方向")).toHaveValue("editorial-market");
  await expect(page).toHaveURL(/direction=editorial-market/);
  await expect(page).toHaveURL(/theme=dark/);
});

test("routes cart, category, account and search destinations into prototype shells", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1000 });
  await page.goto("/workbench?path=%2F&direction=current&locale=zh&theme=light&viewport=1440");
  const preview = page.frameLocator('iframe[title="YAMI 原型预览"]');

  await preview.locator('a[href="/cart"]:visible').click();
  await expect(page).toHaveURL(/path=%2Fcart/);
  await expect(preview.getByText("YAMI PROTOTYPE ROUTE")).toBeVisible();
  await page.getByRole("button", { name: "返回上一步" }).click();
  await expectCanvasPath(page, "/");

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

test("migrates drafts from the former yami-canvas storage key", async ({ page }) => {
  const draft = {
    schemaVersion: 1,
    id: "legacy-review",
    name: "Legacy Review",
    extends: "current",
    pages: { home: {} },
  };
  await page.addInitScript((legacyDraft) => {
    if (window.top === window) {
      localStorage.setItem("yami-canvas:drafts:v1", JSON.stringify([legacyDraft]));
    }
  }, draft);

  await page.goto("/workbench?path=%2F&direction=legacy-review&locale=en&theme=light&viewport=1440");
  await expect(page.getByLabel("设计方向")).toHaveValue("legacy-review");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("yami-design-system:drafts:v1"))).toContain("legacy-review");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("yami-canvas:drafts:v1"))).toBeNull();
});

test("imports, exports, renames and deletes a validated local direction", async ({ page }) => {
  await page.goto("/workbench?path=%2F&direction=current&locale=en&theme=dark&viewport=768");
  const manifest = {
    schemaVersion: 1,
    id: "team-review",
    name: "Team Review",
    extends: "current",
    pages: { home: { sections: [{ id: "trending-products", kind: "products", props: { title: "Team Selection" } }] } },
  };
  await page.locator('input[type="file"]').setInputFiles({ name: "team-review.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(manifest)) });
  await expect(page.getByLabel("设计方向")).toHaveValue("team-review");
  await expect(page.frameLocator('iframe[title="YAMI 原型预览"]').getByRole("heading", { name: "Team Selection" })).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("yami-design-system:drafts:v1"))).toContain("team-review");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("team-review.json");

  page.once("dialog", (dialog) => dialog.accept("Team Approved"));
  await page.getByRole("button", { name: "重命名" }).click();
  await expect(page.getByLabel("设计方向").locator('option[value="team-review"]')).toHaveText("Team Approved");

  await page.getByRole("button", { name: "删除" }).click();
  await expect(page.getByLabel("设计方向")).toHaveValue("current");
  await expect.poll(() => page.evaluate(() => localStorage.getItem("yami-design-system:drafts:v1"))).toBe("[]");

  await page.locator('input[type="file"]').setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from('{"schemaVersion":1}') });
  await expect(page.getByRole("status")).toHaveText("JSON 不符合 Direction Manifest V1");
  await expect(page.getByLabel("设计方向")).toHaveValue("current");
});

test("uses the complete iframe state on first render and after deep-link refresh", async ({ page }) => {
  await page.goto("/workbench?path=%2F&direction=editorial-market&locale=en&theme=dark&viewport=768");
  await expect(page.getByText("768 PX · DARK · EN")).toBeVisible();
  const preview = page.frameLocator('iframe[title="YAMI 原型预览"]');
  await expect(preview.locator(".prototype-root")).toHaveAttribute("data-theme", "dark");
  await expect(preview.getByRole("heading", { name: "编辑精选" })).toBeVisible();

  await page.goto("/workbench?path=%2Fcart&direction=editorial-market&locale=en&theme=dark&viewport=768");
  await page.reload();
  await expect(page.getByText("/cart", { exact: true })).toBeVisible();
  await expect(preview.getByText("YAMI PROTOTYPE ROUTE")).toBeVisible();
});
