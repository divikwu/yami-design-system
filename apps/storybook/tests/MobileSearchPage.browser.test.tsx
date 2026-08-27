import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { page } from "vitest/browser";

import "@yami/design-system/styles/fonts.css";
import "@yami/design-system/tokens.css";
import "@yami/design-system/styles/base.css";
import { MobileSearchPage } from "../../../packages/prototypes/pages/MobileSearchPage/MobileSearchPage";
import { recentSearches } from "../../../packages/prototypes/pages/MobileSearchPage/fixtures";

test.each([360, 375, 402])("collapses recent searches to two rows and expands all at %ipx", async (width) => {
  const originalViewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  try {
    await page.viewport(width, 812);
    flushSync(() => root.render(<MobileSearchPage />));
    await document.fonts.ready;
    const recent = () => container.querySelector<HTMLElement>("main > section")!;
    const rows = () => new Set(Array.from(recent().querySelectorAll("a"), (link) => link.getBoundingClientRect().top)).size;
    const more = page.getByRole("button", { name: "More recent searches", exact: true });

    await expect.poll(rows).toBe(2);
    if (width === 402) {
      await expect.element(more).not.toBeInTheDocument();
      expect(recent().querySelectorAll("a")).toHaveLength(recentSearches.length);
      await page.viewport(375, 812);
    }
    await expect.element(more).toHaveAttribute("aria-expanded", "false");
    const collapsedCount = recent().querySelectorAll("a").length;
    expect(collapsedCount).toBeLessThan(recentSearches.length);
    const button = recent().querySelector<HTMLButtonElement>('[aria-expanded="false"]')!;
    const last = recent().querySelectorAll("a")[collapsedCount - 1]!;
    expect(button.getBoundingClientRect().top).toBe(last.getBoundingClientRect().top);

    await more.click();
    expect(Array.from(recent().querySelectorAll("a"), (link) => link.textContent)).toEqual(recentSearches.map((item) => item.label));
    const less = page.getByRole("button", { name: "Fewer recent searches", exact: true });
    await expect.element(less).toHaveAttribute("aria-expanded", "true");
    await less.click();
    await expect.poll(rows).toBe(2);
    expect(recent().querySelectorAll("a")).toHaveLength(collapsedCount);

    // Recompute the two-row capacity when the available width changes.
    await page.viewport(599, 812);
    await expect.element(more).not.toBeInTheDocument();
    expect(recent().querySelectorAll("a")).toHaveLength(recentSearches.length);
    await page.viewport(Math.min(width, 375), 812);
    await expect.element(more).toBeVisible();
    await expect.poll(rows).toBe(2);

    await page.getByRole("searchbox", { name: "Search", exact: true }).fill("Coffee");
    await page.getByRole("button", { name: "Clear search", exact: true }).click();
    await expect.element(more).toBeVisible();
    await expect.poll(rows).toBe(2);
    await page.getByRole("button", { name: "Clear recent searches", exact: true }).click();
    await expect.element(page.getByRole("heading", { name: "Recent Searches", exact: true })).not.toBeInTheDocument();
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(originalViewport.width, originalViewport.height);
  }
});
