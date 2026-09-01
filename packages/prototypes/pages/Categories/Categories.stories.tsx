import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { EcommerceHomeTemplate } from "../EcommerceHome/EcommerceHome";
import { createEcommerceHomeFixture } from "../EcommerceHome/fixtures";

const meta = {
  title: "YAMI/Pages/Categories",
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "PC category navigation in the shared Header. V1 Text uses text lists; V2 Images adds a three-column image grid for the third level, based on Figma 951:24797. Both examples start collapsed. Hover a mapped category shortcut to preview its branch, or click Categories to browse the full tree; then hover, click or use the keyboard to explore two or three levels. Escape or the scrim closes the menu. Each column scrolls independently. Separate English and Chinese snapshots come from the Yami category_nav/template API, including seasonal departments, full child lists, images, configured colors and real destination links. Third-level images use the original API CDN URLs. Mobile navigation is unchanged.",
      },
    },
  },
  globals: {
    theme: "light",
    viewport: { value: "yamiDesktopXl", isRotated: false },
  },
  render: (_args, { globals }) => (
    <EcommerceHomeTemplate {...createEcommerceHomeFixture(globals.locale === "en" ? "en" : "zh")} />
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const PcV1Text: Story = {
  name: "PC — V1 Text",
  play: async ({ canvasElement }) => {
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
        snackCategory.getBoundingClientRect().left,
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
  },
};

const renderImages: Story['render'] = (_args, { globals }) => {
  const fixture = createEcommerceHomeFixture(globals.locale === 'en' ? 'en' : 'zh');
  fixture.header.categoryMenu = { ...fixture.header.categoryMenu!, presentation: 'images' };
  return <EcommerceHomeTemplate {...fixture} />;
};

export const PcV2Images: Story = {
  ...PcV1Text,
  name: 'PC — V2 Images',
  render: renderImages,
};
