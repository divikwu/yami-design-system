import type { Meta, StoryObj } from "@storybook/react-vite";

import { SocialMediaGallery } from "./SocialMediaGallery";
import styles from "./SocialMediaGallery.stories.module.css";
import { SocialVideoCard } from "./SocialVideoCard";
import {
  createSocialMediaGalleryFixture,
  createSocialVideoCards,
  type SocialMediaGalleryLocale,
} from "./fixtures";

function localeFromGlobals(value: unknown): SocialMediaGalleryLocale {
  return value === "en" ? "en" : "zh";
}

const meta = {
  title: "YAMI/Components/Commerce/Social Media Gallery",
  component: SocialMediaGallery,
  decorators: [
    (Story) => (
      <div className={styles.canvas}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Responsive YAMI social video gallery. It composes the exported SocialVideoCard child, supports text-only, single-product, and multiple-product footers on PC and mobile, and provides native scrolling plus desktop pagination controls.",
      },
    },
  },
  args: createSocialMediaGalleryFixture("en"),
} satisfies Meta<typeof SocialMediaGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: (_args, { globals }) => (
    <SocialMediaGallery
      {...createSocialMediaGalleryFixture(localeFromGlobals(globals.locale))}
    />
  ),
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="social-media-gallery"]',
    );
    if (!root) throw new Error("Social media gallery did not render");

    const cards = Array.from(
      root.querySelectorAll<HTMLElement>('[data-slot="social-video-card"]'),
    );
    if (cards.length !== 8) {
      throw new Error(`Expected 8 social video cards, got ${cards.length}`);
    }
    const footerModes = new Set(
      cards.map(
        (card) =>
          card.querySelector<HTMLElement>(
            '[data-slot="social-video-card-products"]',
          )?.dataset.footerMode,
      ),
    );
    for (const mode of ["text", "single", "multiple"]) {
      if (!footerModes.has(mode)) {
        throw new Error(`Gallery must demonstrate the ${mode} footer mode`);
      }
    }

    const multipleFooter = root.querySelector<HTMLElement>(
      '[data-footer-mode="multiple"]',
    );
    if (!multipleFooter) throw new Error("Multiple-product footer did not render");
    const multipleProductImages = multipleFooter.querySelectorAll("img");
    if (multipleProductImages.length < 3) {
      throw new Error("Multiple-product footer must show at least three images");
    }
    // A multi-product footer renders both a three- and a two-thumbnail row and
    // a container query shows one, so the hidden row's images measure 0 and
    // only the rendered ones are the subject here.
    const productImages = Array.from(
      root.querySelectorAll<HTMLImageElement>(
        '[data-footer-mode="single"] img, [data-footer-mode="multiple"] img',
      ),
    ).filter((image) => image.offsetParent !== null);
    if (
      productImages.length === 0 ||
      productImages.some((image) => {
        const rect = image.getBoundingClientRect();
        return Math.abs(rect.width - 56) > 1 || Math.abs(rect.height - 56) > 1;
      })
    ) {
      throw new Error(
        "All product images must render at 56 by 56 pixels",
      );
    }
    // A multi-product footer carries a three- and a two-thumbnail row and a
    // container query renders one. Each row states its own overflow, so the
    // two must account for the same catalogue — that consistency is the whole
    // reason both rows exist instead of one row with a thumbnail hidden in
    // CSS, which would leave the count reading one short.
    const rows = Array.from(
      multipleFooter.querySelectorAll<HTMLElement>("[data-product-row]"),
    );
    const totals = rows.map(
      (row) =>
        row.querySelectorAll("a").length +
        Number(
          row.querySelector(":scope > span")?.textContent?.replace("+", "") ?? 0,
        ),
    );
    if (rows.length !== 2 || new Set(totals).size !== 1) {
      throw new Error(
        `Both thumbnail rows must account for the same products, got ${totals.join(" and ")}`,
      );
    }

    const renderedRow = rows.find(
      (row) => getComputedStyle(row).display !== "none",
    );
    if (!renderedRow) {
      throw new Error("Multi-product footer rendered no thumbnail row");
    }
    const moreProducts = renderedRow.querySelector<HTMLElement>(":scope > span");
    if (
      !moreProducts ||
      Math.abs(moreProducts.getBoundingClientRect().height - 56) > 1
    ) {
      throw new Error("Product count indicator must be 56px high");
    }
    const footerRect = multipleFooter.getBoundingClientRect();
    const countRect = moreProducts.getBoundingClientRect();
    if (Math.abs(countRect.right - (footerRect.right - 8)) > 1) {
      throw new Error("Product count must fill the remaining width");
    }

    const textFooter = root.querySelector<HTMLElement>(
      '[data-footer-mode="text"]',
    );
    const footerText = textFooter?.querySelector<HTMLElement>("p");
    if (
      !footerText ||
      getComputedStyle(footerText).getPropertyValue("-webkit-line-clamp") !== "2"
    ) {
      throw new Error("Text-only footer must clamp the description to two lines");
    }
    if (
      getComputedStyle(multipleFooter).backgroundColor !==
      getComputedStyle(cards[0]).backgroundColor
    ) {
      throw new Error("Social card footers must use the default gray surface");
    }
    const singleProductTitle = root.querySelector<HTMLElement>(
      '[data-footer-mode="single"] span',
    );
    if (
      (document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark")) &&
      (!singleProductTitle ||
        getComputedStyle(singleProductTitle).color !== "rgb(255, 255, 255)")
    ) {
      throw new Error("Single-product title must use white text in dark mode");
    }

    const firstCard = cards[0];
    // Desktop fits a whole number of cards per view: 4 from 1024, 5 from 1280,
    // 6 from 1440. Asserting the count rather than a minimum width, because the
    // width is derived from the count — every one of these lands under the
    // 240px floor this used to require.
    if (window.innerWidth >= 1024) {
      const rail = canvasElement.querySelector<HTMLElement>(
        '[data-slot="social-media-gallery-list"]',
      );
      if (!rail) throw new Error("Gallery rail did not render");
      const perView =
        window.innerWidth >= 1440 ? 6 : window.innerWidth >= 1280 ? 5 : 4;
      const gap = Number.parseFloat(getComputedStyle(rail).columnGap);
      const cardWidth = firstCard.getBoundingClientRect().width;
      const spanned = cardWidth * perView + gap * (perView - 1);
      if (Math.abs(spanned - rail.clientWidth) > 1) {
        throw new Error(
          `At ${window.innerWidth}px the rail must fit exactly ${perView} cards, got ${(rail.clientWidth + gap) / (cardWidth + gap)}`,
        );
      }
    }
    const firstMedia = firstCard.querySelector<HTMLElement>(
      '[data-slot="social-video-card-media"]',
    );
    const firstProducts = firstCard.querySelector<HTMLElement>(
      '[data-slot="social-video-card-products"]',
    );
    if (!firstMedia || !firstProducts) {
      throw new Error("Product social video card is incomplete");
    }

    const rootStyle = getComputedStyle(root);
    const mediaStyle = getComputedStyle(firstMedia);
    const productsStyle = getComputedStyle(firstProducts);
    if (window.innerWidth >= 1024) {
      if (rootStyle.borderTopWidth !== "1px") {
        throw new Error("Desktop gallery must have a 1px top divider");
      }
      if (mediaStyle.aspectRatio !== "3 / 4") {
        throw new Error(
          `Desktop product card media must use 3:4, got ${mediaStyle.aspectRatio}`,
        );
      }
      if (productsStyle.display === "none" || productsStyle.height !== "72px") {
        throw new Error("Desktop product card must show its 72px product footer");
      }
    }
  },
};

export const SingleProduct: Story = {
  name: "Single Product",
  render: (_args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    const card = createSocialVideoCards(locale).find(
      (item) => item.products?.length === 1,
    );
    if (!card) return null;
    return (
      <div className={styles.cardCanvas}>
        <SocialVideoCard {...card} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector<HTMLElement>(
      '[data-slot="social-video-card"]',
    );
    const platformIcon = canvasElement.querySelector<HTMLImageElement>(
      '[data-slot="social-video-card"] img[aria-hidden="true"]',
    );
    const platformStyle = platformIcon && getComputedStyle(platformIcon);
    if (
      !platformIcon ||
      !platformStyle ||
      platformStyle.backgroundColor !== "rgb(255, 255, 255)" ||
      Number.parseFloat(platformStyle.borderRadius) <
        platformIcon.getBoundingClientRect().height / 2
    ) {
      throw new Error(
        "Social platform icon must use a fully rounded white background",
      );
    }
    if (
      window.innerWidth < 1024 &&
      (!card || Math.abs(card.getBoundingClientRect().width - 240) > 1)
    ) {
      throw new Error("Mobile social video card must be 240px wide");
    }
  },
};

export const MultipleProducts: Story = {
  name: "Multiple Products",
  render: (_args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    const card = createSocialVideoCards(locale).find(
      (item) => (item.products?.length ?? 0) > 1,
    );
    if (!card) return null;
    return (
      <div className={styles.cardCanvas}>
        <SocialVideoCard {...card} />
      </div>
    );
  },
};

export const WithoutProducts: Story = {
  render: (_args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    const card = createSocialVideoCards(locale).find(
      (item) => (item.products?.length ?? 0) === 0,
    );
    if (!card) return null;
    return (
      <div className={styles.cardCanvas}>
        <SocialVideoCard {...card} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const handle = canvasElement.querySelector<HTMLElement>(
      '[data-slot="social-video-card-media"] span',
    );
    const footerText = canvasElement.querySelector<HTMLElement>(
      '[data-footer-mode="text"] p',
    );
    if (!handle || getComputedStyle(handle).color !== "rgb(255, 255, 255)") {
      throw new Error("Social account text must remain white over video media");
    }
    if (
      (document.documentElement.classList.contains("dark") ||
        document.body.classList.contains("dark")) &&
      (!footerText ||
        getComputedStyle(footerText).color !== "rgb(255, 255, 255)")
    ) {
      throw new Error("Text-only card footer must use white text in dark mode");
    }
  },
};

export const MobileSingleProduct: Story = {
  ...SingleProduct,
  name: "Mobile Single Product",
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
};

export const MobileMultipleProducts: Story = {
  ...MultipleProducts,
  name: "Mobile Multiple Products",
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
};

export const MobileWithoutProducts: Story = {
  ...WithoutProducts,
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
};
