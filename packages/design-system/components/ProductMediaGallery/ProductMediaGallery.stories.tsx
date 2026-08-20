import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent } from "storybook/test";

import { ProductMediaGallery } from "./ProductMediaGallery";

const images = [
  {
    id: "front",
    src: "https://cdn.yamibuy.net/item/22f1eabda8bc0200d050ebcb1ebdb469_757x757.webp",
    alt: "Torriden Dive In Low Molecule Hyaluronic Acid Mask box, front view",
  },
  {
    id: "packaging",
    src: "https://cdn.yamibuy.net/item/c635ba73e529d262e7b2e25d3a7fb89c_757x757.webp",
    alt: "Torriden Dive In mask packaging and individual sheet",
  },
  {
    id: "sheet",
    src: "https://cdn.yamibuy.net/item/f743668cac11a24b973ff93050844c06_757x757.webp",
    alt: "Torriden Dive In sheet mask texture detail",
  },
  {
    id: "benefits",
    src: "https://cdn.yamibuy.net/item/1923d15747c92c8d0654f5fa2126e8a0_757x757.webp",
    alt: "Torriden Dive In mask hydration benefits",
  },
] as const;

const meta = {
  title: "YAMI/Components/Commerce/Product Media Gallery",
  component: ProductMediaGallery,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Responsive PDP gallery that keeps product imagery inside one viewing window and provides thumbnail, arrow-button, and keyboard switching.",
      },
    },
  },
  args: {
    images,
  },
  decorators: [
    (Story) => (
      <div style={{ width: "min(760px, 92vw)" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductMediaGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  play: async ({ canvasElement }) => {
    const gallery = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery"]',
    );
    const image = () =>
      canvasElement.querySelector<HTMLImageElement>(
        '[data-slot="product-media-gallery-image"]',
      );
    const next = canvasElement.querySelector<HTMLButtonElement>(
      '[data-rail-navigation-button="true"][data-direction="right"]',
    );
    const thumbnails = canvasElement.querySelectorAll<HTMLButtonElement>(
      '[data-slot="product-media-gallery-thumbnail"]',
    );
    const thumbnailRail = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery-thumbnails"]',
    );
    const stage = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery-stage"]',
    );
    if (!gallery || !next || !thumbnailRail || !stage || thumbnails.length !== images.length) {
      throw new Error("Product media gallery did not render its controls");
    }
    if (
      thumbnailRail.getBoundingClientRect().top < stage.getBoundingClientRect().bottom ||
      getComputedStyle(thumbnailRail).flexDirection !== "row"
    ) {
      throw new Error("Product media gallery thumbnails must sit in a horizontal rail below the main image");
    }
    if (image()?.alt !== images[0].alt || gallery.dataset.activeIndex !== "0") {
      throw new Error("Product media gallery must open on the first image");
    }
    await userEvent.click(next);
    if (image()?.alt !== images[1].alt || gallery.dataset.activeIndex !== "1") {
      throw new Error("Next must advance the active product image");
    }
    await userEvent.click(thumbnails[3]);
    if (image()?.alt !== images[3].alt || thumbnails[3].getAttribute("aria-pressed") !== "true") {
      throw new Error("Thumbnail selection must update the active image");
    }
    gallery.focus();
    await userEvent.keyboard("{ArrowRight}");
    if (image()?.alt !== images[0].alt) {
      throw new Error("ArrowRight must wrap the gallery from last to first");
    }
  },
};

export const Mobile: Story = {
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
};
