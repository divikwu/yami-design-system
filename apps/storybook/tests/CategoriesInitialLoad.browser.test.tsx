import { composeStories } from "@storybook/react-vite";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { page } from "vitest/browser";
import { userEvent, waitFor } from "storybook/test";

import "@yami/design-system/styles/fonts.css";
import "@yami/design-system/tokens.css";
import "@yami/design-system/styles/base.css";
import * as stories from "../../../packages/prototypes/pages/Categories/Categories.stories";

const { PcV1Text, PcV2Images } = composeStories(stories);

test.each([{ name: "V1 Text", Story: PcV1Text }, { name: "V2 Images", Story: PcV2Images }])("$name stays collapsed until the user interacts", async ({ Story }) => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const insertedMenus: Element[] = [];
  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches('[data-slot="header-category-menu"]')) insertedMenus.push(node);
        insertedMenus.push(...node.querySelectorAll('[data-slot="header-category-menu"]'));
      }
    }
  });
  try {
    await page.viewport(1920, 1080);
    observer.observe(container, { childList: true, subtree: true });
    flushSync(() => root.render(<Story />));
    await Story.play?.({ canvasElement: container });
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(insertedMenus).toHaveLength(0);
    expect(container.querySelector('[data-slot="header-category-menu"]')).toBeNull();
    observer.disconnect();
    await exerciseCategoryNavigation(container);
  } finally {
    observer.disconnect();
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});

async function exerciseCategoryNavigation(canvasElement: HTMLElement) {
  const trigger = canvasElement.querySelector<HTMLButtonElement>('[data-category-trigger]')!;
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(canvasElement.querySelector('[data-slot="header-category-menu"]')).toBeNull();
  const artwork = canvasElement.querySelector<HTMLImageElement>(
    '[data-slot="header-category"] img[data-image-state]',
  );
  if (!artwork) throw new Error("Header category artwork did not render");
  await waitFor(() => expect(artwork).toHaveAttribute("data-image-state", "loaded"), {
    timeout: 5000,
  });
  const artworkMedia = artwork.parentElement;
  if (
    getComputedStyle(artwork).backgroundColor !== "rgba(0, 0, 0, 0)" ||
    !artworkMedia ||
    getComputedStyle(artworkMedia).backgroundColor !== "rgba(0, 0, 0, 0)"
  ) {
    throw new Error("Loaded header category artwork must preserve its transparent background");
  }

  const summerCategory = canvasElement.querySelector<HTMLElement>(
    '[data-category-id="summer-picks"]',
  );
  if (!summerCategory) throw new Error("Summer category shortcut did not render");
  const menuItemId = summerCategory.dataset.categoryMenuItem;
  if (!menuItemId) throw new Error("Summer category shortcut must map to its menu item");

  await userEvent.hover(summerCategory);
  let openMenu: Element | null = null;
  await waitFor(() => {
    openMenu = canvasElement.querySelector('[data-slot="header-category-menu"]');
    expect(openMenu).toBeInTheDocument();
    expect(
      openMenu?.querySelector(
        `[data-level="0"] [data-item-id="${menuItemId}"][data-active]`,
      ),
    ).toBeInTheDocument();
    const rootIds = new Set(
      [...(openMenu?.querySelectorAll<HTMLElement>('[data-level="0"] [data-item-id]') ?? [])].map(
        (item) => item.dataset.itemId,
      ),
    );
    const missingMapping = [...canvasElement.querySelectorAll<HTMLElement>(
      '[data-category-menu-item]',
    )].find((category) => !rootIds.has(category.dataset.categoryMenuItem));
    expect(missingMapping).toBeUndefined();
  });
  await expect(summerCategory).toHaveAttribute("aria-expanded", "true");

  const snackCategory = canvasElement.querySelector<HTMLElement>(
    '[data-category-id="snack"]',
  );
  const snackMenuItemId = snackCategory?.dataset.categoryMenuItem;
  if (!snackCategory || !snackMenuItemId) {
    throw new Error("Snack category shortcut must map to its menu item");
  }
  await userEvent.hover(snackCategory);
  await waitFor(() => {
    const currentMenu = canvasElement.querySelector('[data-slot="header-category-menu"]');
    expect(currentMenu).toBe(openMenu);
    expect(currentMenu?.getBoundingClientRect().left).toBeCloseTo(
      trigger.getBoundingClientRect().left,
      1,
    );
    expect(
      currentMenu?.querySelector(
        `[data-level="0"] [data-item-id="${snackMenuItemId}"][data-active]`,
      ),
    ).toBeInTheDocument();
  });
  await expect(summerCategory).toHaveAttribute("aria-expanded", "false");
  await expect(snackCategory).toHaveAttribute("aria-expanded", "true");

  await userEvent.unhover(snackCategory);
  await waitFor(() => {
    expect(canvasElement.querySelector('[data-slot="header-category-menu"]')).toBeNull();
  });

  summerCategory.focus();
  await userEvent.keyboard("{ArrowDown}");
  await waitFor(() => {
    const menu = canvasElement.querySelector('[data-slot="header-category-menu"]');
    expect(menu).toBeInTheDocument();
    expect(menu?.contains(document.activeElement)).toBe(true);
    expect(
      menu?.querySelector(`[data-level="0"] [data-item-id="${menuItemId}"][data-active]`),
    ).toBeInTheDocument();
  });
  await userEvent.keyboard("{Escape}");
  await waitFor(() => {
    expect(canvasElement.querySelector('[data-slot="header-category-menu"]')).toBeNull();
    expect(document.activeElement).toBe(summerCategory);
  });
  await expect(summerCategory).toHaveAttribute("href", "#category-summer-picks");
}
