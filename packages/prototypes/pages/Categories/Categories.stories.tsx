import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

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
          "PC category navigation in the shared Header. V1 Text uses text lists; V2 Images adds a three-column image grid for the third level, based on Figma 951:24797. Both examples start collapsed. Hover or click Categories, then hover, click or use the keyboard to explore two or three levels. Escape or the scrim closes the menu. Each column scrolls independently. Separate English and Chinese snapshots come from the Yami category_nav/template API, including seasonal departments, full child lists, images, configured colors and real destination links. Third-level images use the original API CDN URLs. Mobile navigation is unchanged.",
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
