import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { ProductDetailPage } from "../../../packages/prototypes/pages/ProductDetailPage/ProductDetailPage";
import { createProductDetailPageFixture } from "../../../packages/prototypes/pages/ProductDetailPage/fixtures";
import { createFoodProductDetailPageFixture } from "../../../packages/prototypes/pages/ProductDetailPage/food-fixtures";
import { createBeverageProductDetailPageFixture } from "../../../packages/prototypes/pages/ProductDetailPage/beverage-fixtures";
import "@yami/design-system/tokens.css";

test("Mobile highlights stay expanded and other details open sheets; PC remains collapsible", async () => {
  const viewport = { width: innerWidth, height: innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    for (const createFixture of [createProductDetailPageFixture, createFoodProductDetailPageFixture, createBeverageProductDetailPageFixture]) {
      for (const locale of ["en", "zh"] as const) {
        const fixture = createFixture(locale);
        await page.viewport(375, 812);
        flushSync(() => root.render(<ProductDetailPage key={`${fixture.title}-${locale}`} {...fixture} />));
        const highlights = container.querySelector<HTMLElement>('[data-pdp-detail-module="highlights"]')!;
        const content = highlights.querySelector<HTMLElement>('[data-slot="product-detail-disclosure-content"]')!;
        await expect.poll(() => highlights.querySelector("button")).toBeNull();
        expect(highlights.querySelector('[data-slot="product-detail-disclosure-arrow"]')).toBeNull();
        expect(content.hidden).toBe(false);
        const title = page.getByRole("heading", { name: fixture.copy.productHighlights, exact: true });
        await title.click();
        await userEvent.keyboard("{Enter}{Space}");
        expect(content.hidden).toBe(false);
        const sheetTitles = [fixture.copy.specifications, fixture.copy.disclaimer];
        if (fixture.ingredients) sheetTitles.push(fixture.ingredients.title);
        for (const sheetTitle of sheetTitles) {
          const trigger = page.getByRole("button", { name: sheetTitle, exact: true });
          await expect.element(trigger).toHaveAttribute("aria-haspopup", "dialog");
          await expect.element(trigger).not.toHaveAttribute("aria-expanded");
          await trigger.click();
          const sheet = container.querySelector<HTMLDialogElement>("dialog")!;
          expect(sheet.matches(":modal")).toBe(true);
          expect(sheet.querySelector("h2")!.textContent).toBe(sheetTitle);
          expect(sheet.getBoundingClientRect().top).toBe(48);
          expect(getComputedStyle(document.documentElement).overflow).toBe("hidden");
          const close = sheet.querySelector("button")!;
          const last = sheet.querySelector("a") ?? close;
          expect(document.activeElement).toBe(close);
          await userEvent.tab({ shift: true });
          expect(document.activeElement).toBe(last);
          await userEvent.tab();
          expect(document.activeElement).toBe(close);
          await userEvent.keyboard("{Escape}");
          await expect.poll(() => container.querySelector("dialog")).toBeNull();
          expect(document.activeElement?.textContent).toBe(sheetTitle);
          expect(getComputedStyle(document.documentElement).overflow).not.toBe("hidden");
        }

        await page.viewport(1024, 900);
        const desktopToggle = page.getByRole("button", { name: fixture.copy.productHighlights, exact: true });
        await expect.element(desktopToggle).toHaveAttribute("aria-expanded", "true");
        await desktopToggle.click();
        expect(content.hidden).toBe(true);
        await page.viewport(375, 812);
        await expect.poll(() => content.hidden).toBe(false);
        expect(highlights.querySelector("button")).toBeNull();
        await page.viewport(1024, 900);
        await expect.element(desktopToggle).toHaveAttribute("aria-expanded", "false");
      }
    }
  } finally {
    root.unmount();
    container.remove();
    window.scrollTo(0, 0);
    await page.viewport(viewport.width, viewport.height);
  }
}, 60_000);
