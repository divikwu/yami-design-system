import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, waitFor } from "storybook/test";

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
    const previous = canvasElement.querySelector<HTMLButtonElement>(
      '[data-rail-navigation-button="true"][data-direction="left"]',
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
    const counter = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery-counter"]',
    );
    if (
      !gallery ||
      !previous ||
      !next ||
      !thumbnailRail ||
      !stage ||
      !counter ||
      thumbnails.length !== images.length
    ) {
      throw new Error("Product media gallery did not render its controls");
    }
    const counterStyle = getComputedStyle(counter);
    const thumbnailRailStyle = getComputedStyle(thumbnailRail);
    if (
      counterStyle.right !== "8px" ||
      counterStyle.bottom !== "8px" ||
      counter.getBoundingClientRect().height !== 24 ||
      counterStyle.borderWidth !== "1px" ||
      counterStyle.borderStyle !== "solid" ||
      counterStyle.borderColor !== "rgba(0, 0, 0, 0.08)" ||
      counterStyle.backdropFilter !== "blur(4px)" ||
      counterStyle.backgroundColor !== "rgba(255, 255, 255, 0.87)" ||
      counterStyle.color !== "rgba(0, 0, 0, 0.87)"
    ) {
      throw new Error(
        "Product media gallery counter must share the quick-add surface and border, use a 24px outer height, and keep an 8px stage inset",
      );
    }
    if (
      thumbnailRailStyle.paddingTop !== "12px" ||
      thumbnailRailStyle.paddingRight !== "0px" ||
      thumbnailRailStyle.paddingBottom !== "12px" ||
      thumbnailRailStyle.paddingLeft !== "0px" ||
      thumbnailRailStyle.scrollPaddingInline !== "0px"
    ) {
      throw new Error(
        "Product media gallery thumbnail rail must use 12px vertical padding with no inline inset",
      );
    }
    if (
      getComputedStyle(previous).visibility !== "hidden" ||
      getComputedStyle(next).visibility !== "hidden"
    ) {
      throw new Error(
        "Desktop gallery navigation must wait for image hover or keyboard focus",
      );
    }
    gallery.focus();
    if (
      getComputedStyle(previous).visibility !== "visible" ||
      getComputedStyle(next).visibility !== "visible"
    ) {
      throw new Error(
        "Keyboard focus must reveal both gallery navigation controls",
      );
    }
    for (const thumbnail of thumbnails) {
      const { paddingTop, paddingRight, paddingBottom, paddingLeft } =
        getComputedStyle(thumbnail);
      if (
        paddingTop !== "0px" ||
        paddingRight !== "0px" ||
        paddingBottom !== "0px" ||
        paddingLeft !== "0px"
      ) {
        throw new Error("Product media gallery thumbnails must not have padding");
      }
    }
    if (
      Math.abs(
        thumbnailRail.getBoundingClientRect().top -
          stage.getBoundingClientRect().bottom,
      ) > 0.5 ||
      getComputedStyle(thumbnailRail).flexDirection !== "row"
    ) {
      throw new Error(
        "Product media gallery thumbnails must sit in a horizontal rail with no grid gap below the main image",
      );
    }
    if (
      image()?.alt !== images[0].alt ||
      gallery.dataset.activeIndex !== "0" ||
      getComputedStyle(thumbnails[0]).borderWidth !== "2px" ||
      getComputedStyle(thumbnails[1]).borderWidth !== "1px"
    ) {
      throw new Error(
        "Product media gallery must open with a 2px selected thumbnail border",
      );
    }
    await userEvent.click(next);
    if (
      image()?.alt !== images[1].alt ||
      gallery.dataset.activeIndex !== "1"
    ) {
      throw new Error("Next must advance the active product image");
    }
    await userEvent.click(thumbnails[3]);
    if (
      image()?.alt !== images[3].alt ||
      thumbnails[3].getAttribute("aria-pressed") !== "true" ||
      getComputedStyle(thumbnails[3]).borderWidth !== "2px" ||
      getComputedStyle(thumbnails[0]).borderWidth !== "1px"
    ) {
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
  play: async ({ canvasElement }) => {
    const gallery = canvasElement.querySelector<HTMLElement>(
      '[data-slot="product-media-gallery"]',
    );
    const image = () =>
      canvasElement.querySelector<HTMLImageElement>(
        '[data-slot="product-media-gallery-image"]',
      );
    const navigationButtons = canvasElement.querySelectorAll<HTMLButtonElement>(
      '[data-rail-navigation-button="true"]',
    );
    if (
      !gallery ||
      navigationButtons.length !== 2 ||
      Array.from(navigationButtons).some(
        (button) => getComputedStyle(button).display !== "none",
      )
    ) {
      throw new Error(
        "Mobile gallery navigation buttons must stay hidden",
      );
    }

    const rail = canvasElement.querySelector<HTMLElement>('[data-slot="product-media-gallery-rail"]')!;
    const counter = canvasElement.querySelector<HTMLElement>('[data-slot="product-media-gallery-counter"]')!;
    const counterStyle = getComputedStyle(counter);
    if (
      counter.getBoundingClientRect().height !== 24 ||
      counterStyle.borderWidth !== "1px" ||
      counterStyle.borderColor !== "rgba(0, 0, 0, 0.08)" ||
      counterStyle.backgroundColor !== "rgba(255, 255, 255, 0.87)" ||
      counterStyle.backdropFilter !== "blur(4px)"
    ) {
      throw new Error("Mobile counter must keep the same 24px height and quick-add surface and border as desktop");
    }
    const slides = rail.querySelectorAll<HTMLElement>('[data-slot="product-media-gallery-slide"]');
    const wideMobile = window.innerWidth > 440;
    const gap = wideMobile ? 8 : 0;
    const imageWidth = wideMobile ? Math.min(rail.clientWidth - 48, 440) : rail.clientWidth;
    if (
      getComputedStyle(rail).overflowX !== "auto" ||
      getComputedStyle(rail).scrollSnapType !== "x mandatory" ||
      getComputedStyle(rail).touchAction !== "auto" ||
      getComputedStyle(rail).columnGap !== `${gap}px` ||
      slides.length !== images.length ||
      Array.from(slides).some((slide) =>
        Math.abs(slide.getBoundingClientRect().width - imageWidth) > 1 ||
        Math.abs(slide.getBoundingClientRect().height - slide.getBoundingClientRect().width) > 1 ||
        getComputedStyle(slide).borderRadius !== (wideMobile ? "8px" : "0px") ||
        getComputedStyle(slide).borderWidth !== "0px" ||
        getComputedStyle(slide).boxShadow !== "none")
    ) {
      throw new Error("Mobile images must form horizontal pages capped at 440px without blocking vertical gestures");
    }
    rail.scrollTo({ left: slides[0].getBoundingClientRect().width + gap, behavior: "instant" });
    await waitFor(() => {
      if (gallery.dataset.activeIndex !== "1" || image()?.alt !== images[1].alt) {
        throw new Error("Native horizontal scrolling must advance the active image");
      }
    });
    rail.scrollTo({ left: 0, behavior: "instant" });
    await waitFor(() => {
      if (gallery.dataset.activeIndex !== "0" || image()?.alt !== images[0].alt) {
        throw new Error("Scrolling back must restore the previous image");
      }
    });
  },
};
