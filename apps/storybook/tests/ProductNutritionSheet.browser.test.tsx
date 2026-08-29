import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { page, userEvent } from "vitest/browser";
import { ProductDetailPage } from "../../../packages/prototypes/pages/ProductDetailPage/ProductDetailPage";
import { createBeverageProductDetailPageFixture } from "../../../packages/prototypes/pages/ProductDetailPage/beverage-fixtures";
import "@yami/design-system/tokens.css";

test("Mobile nutrition reuses the table, traps focus, scrolls independently and restores the PC disclosure", async () => {
  const viewport = { width: innerWidth, height: innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const fixture = createBeverageProductDetailPageFixture("en");
  const originalOverflow = document.documentElement.style.overflow;
  try {
    await page.viewport(375, 812);
    flushSync(() => root.render(<ProductDetailPage {...fixture} />));
    for (const width of [360, 375, 402]) {
      await page.viewport(width, 812);
      await page.getByRole("button", { name: "Nutrition Facts", exact: true }).click();
      const sheet = container.querySelector<HTMLDialogElement>('[data-slot="product-nutrition-sheet"]')!;
      expect(sheet.matches(":modal")).toBe(true);
      expect(sheet.getBoundingClientRect().width).toBe(width);
      expect(sheet.getBoundingClientRect().top).toBe(48);
      expect(sheet.getBoundingClientRect().bottom).toBe(innerHeight);
      expect(sheet.scrollWidth).toBe(sheet.clientWidth);
      const label = sheet.querySelector("table")!.parentElement!;
      expect(getComputedStyle(label).marginLeft).toBe("2px");
      expect(getComputedStyle(label).marginRight).toBe("2px");
      expect(label.parentElement!.getBoundingClientRect().width - label.getBoundingClientRect().width).toBe(4);
      const close = sheet.querySelector("button")!;
      const closeRect = close.getBoundingClientRect();
      const closeIconRect = close.querySelector("img")!.getBoundingClientRect();
      expect(closeRect.width).toBe(32);
      expect(closeRect.height).toBe(32);
      expect(getComputedStyle(close, "::before").width).toBe("44px");
      expect(getComputedStyle(close, "::before").height).toBe("44px");
      expect(sheet.getBoundingClientRect().right - closeRect.right).toBe(12);
      expect(closeRect.top - sheet.getBoundingClientRect().top).toBe(8);
      expect(closeIconRect.width).toBe(20);
      expect(closeIconRect.height).toBe(20);
      expect(sheet.getBoundingClientRect().right - closeIconRect.right).toBe(18);
      expect(closeIconRect.top - sheet.getBoundingClientRect().top).toBe(14);
      await page.getByRole("button", { name: "Close nutrition facts" }).hover();
      await expect.poll(() => getComputedStyle(close).backgroundColor).toBe("rgba(0, 0, 0, 0)");
      const language = sheet.querySelector("select")!;
      for (const value of ["zh", "en"]) {
        await userEvent.selectOptions(language, value);
        const display = sheet.querySelector<HTMLElement>('[data-slot="nutrition-language-value"]')!;
        expect(display.textContent).toBe(value === "zh" ? "中文" : "English");
        const textRect = display.querySelector("span")!.getBoundingClientRect();
        const iconRect = display.querySelector("img")!.getBoundingClientRect();
        const selectRect = language.getBoundingClientRect();
        expect(iconRect.left - textRect.right).toBe(4);
        expect(iconRect.width).toBe(16);
        expect(Math.abs((textRect.left + iconRect.right) / 2 - (selectRect.left + selectRect.right) / 2)).toBeLessThan(1);
      }
      close.focus();
      expect(document.activeElement).toBe(close);
      await userEvent.tab({ shift: true });
      expect(document.activeElement).toBe(language);
      await userEvent.tab();
      expect(document.activeElement).toBe(close);
      expect(close.matches(":focus-visible")).toBe(true);
      expect(getComputedStyle(close).outlineStyle).toBe("solid");
      const content = sheet.querySelector<HTMLElement>('[data-slot="product-nutrition-sheet-content"]')!;
      const heading = sheet.querySelector("h2")!;
      const top = heading.getBoundingClientRect().top;
      const pageScroll = window.scrollY;
      content.scrollTop = content.scrollHeight;
      await expect.poll(() => content.scrollTop).toBeGreaterThan(100);
      expect(window.scrollY).toBe(pageScroll);
      expect(heading.getBoundingClientRect().top).toBe(top);
      expect(getComputedStyle(document.documentElement).overflow).toBe("hidden");
      await page.getByRole("button", { name: "Close nutrition facts" }).click();
      await expect.poll(() => container.querySelector('[data-slot="product-nutrition-sheet"]')).toBeNull();
      expect(document.activeElement?.textContent).toBe("Nutrition Facts");
      expect(window.scrollY).toBe(pageScroll);
      expect(document.documentElement.style.overflow).toBe(originalOverflow);
      expect(getComputedStyle(document.documentElement).overflow).not.toBe("hidden");
    }

    await page.getByRole("button", { name: "Nutrition Facts", exact: true }).click();
    await page.getByRole("link", { name: "View original label" }).click();
    const gallery = container.querySelector<HTMLDialogElement>('[data-slot="product-media-preview"]')!;
    expect(gallery.matches(":modal")).toBe(true);
    expect(gallery.querySelector('[data-slot="product-media-preview-image"]')?.getAttribute("src")).toBe(fixture.nutrition!.sourceHref);
    // Resizing while the gallery is above the sheet must not leave the page locked.
    await page.viewport(1024, 900);
    await expect.poll(() => container.querySelector('[data-slot="product-nutrition-sheet"]')).toBeNull();
    await page.getByRole("button", { name: fixture.copy.closeImagePreview }).click();
    await expect.poll(() => container.querySelector("dialog")).toBeNull();
    expect(document.documentElement.style.overflow).toBe(originalOverflow);
    expect(getComputedStyle(document.documentElement).overflow).not.toBe("hidden");
    const desktopTrigger = page.getByRole("button", { name: "Nutrition Facts", exact: true });
    await expect.element(desktopTrigger).toHaveAttribute("aria-expanded", "true");
    await desktopTrigger.click();
    await expect.element(desktopTrigger).toHaveAttribute("aria-expanded", "false");
    await desktopTrigger.click();
    await expect.element(page.getByRole("table", { name: "Nutrition Facts" })).toBeVisible();
    expect(container.querySelector("dialog")).toBeNull();
    const desktopLabel = container.querySelector("#product-nutrition-content table")!.parentElement!;
    expect(getComputedStyle(desktopLabel).marginLeft).toBe("0px");
    expect(getComputedStyle(desktopLabel).marginRight).toBe("0px");
  } finally {
    root.unmount();
    container.remove();
    window.scrollTo(0, 0);
    await page.viewport(viewport.width, viewport.height);
  }
}, 60_000);
