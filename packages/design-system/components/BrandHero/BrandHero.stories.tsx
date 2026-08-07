import type { Meta, StoryObj } from "@storybook/react-vite";

import { BrandHero } from "./BrandHero";
import { createBrandHeroProps } from "./fixtures";

const meta = {
  title: "YAMI/Components/Commerce/BrandHero",
  component: BrandHero,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A brand storytelling hero with selectable copy, a primary action and campaign artwork repeated as a blurred atmosphere. Designed from English Site Optimization 2026 node 1877:43111 and informed by the W Concept brand visual module.",
      },
    },
  },
  args: createBrandHeroProps(),
} satisfies Meta<typeof BrandHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  play: async ({ canvasElement }) => {
    const hero = canvasElement.querySelector<HTMLElement>(
      '[data-slot="brand-hero"]',
    );
    const copy = canvasElement.querySelector<HTMLElement>(
      '[data-slot="brand-hero-copy"]',
    );
    const image = canvasElement.querySelector<HTMLImageElement>(
      '[data-slot="brand-hero-media"] img',
    );
    const button = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="brand-hero"] [data-slot="button"]',
    );

    if (!hero || !copy || !image || !button) {
      throw new Error("BrandHero did not render its copy, artwork and CTA");
    }
    if (!copy.textContent?.includes("Gentle yet Effective")) {
      throw new Error("BrandHero must keep selectable brand copy");
    }
    if (!image.alt.trim()) {
      throw new Error("BrandHero foreground artwork requires meaningful alt text");
    }
    if (button.textContent?.trim() !== "Shop All Anua") {
      throw new Error("BrandHero must expose its primary action");
    }

    await new Promise<void>((resolve) => {
      if (image.complete) return resolve();
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });
    if (image.naturalWidth !== 1672 || image.naturalHeight !== 941) {
      throw new Error(
        `BrandHero must retain the Figma artwork, received ${image.naturalWidth}x${image.naturalHeight}`,
      );
    }

    if (window.innerWidth >= 1024) {
      const heroBox = hero.getBoundingClientRect();
      const contentBox = copy.parentElement?.getBoundingClientRect();
      if (Math.abs(heroBox.height - 448) > 1) {
        throw new Error(`Desktop BrandHero must be 448px tall, got ${heroBox.height}px`);
      }
      if (!contentBox || contentBox.width > 1441) {
        throw new Error("Desktop BrandHero content must cap at 1440px");
      }
    }
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "yamiMobile", isRotated: false } },
};
