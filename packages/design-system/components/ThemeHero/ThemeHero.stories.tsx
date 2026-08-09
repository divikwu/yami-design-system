import type { Meta, StoryObj } from "@storybook/react-vite";

import { ThemeHero } from "./ThemeHero";
import { createThemeHeroProps } from "./fixtures";

const meta = {
  title: "YAMI/Components/Commerce/Theme Hero",
  component: ThemeHero,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "A theme storytelling hero with selectable copy, a primary action and campaign artwork repeated as a blurred atmosphere. Designed from English Site Optimization 2026 node 1877:43111 and informed by the W Concept visual module.",
      },
      source: {
        language: "tsx",
        code: `import { ThemeHero } from "@yami/design-system";
import { createThemeHeroProps } from "@yami/design-system/components/ThemeHero/fixtures";

<ThemeHero {...createThemeHeroProps()} />`,
      },
    },
  },
  args: createThemeHeroProps(),
} satisfies Meta<typeof ThemeHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  play: async ({ canvasElement }) => {
    const hero = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-hero"]',
    );
    const copy = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-hero-copy"]',
    );
    const title = copy?.querySelector<HTMLElement>("h2");
    const description = copy?.querySelector<HTMLElement>("div");
    const media = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-hero-media"]',
    );
    const image = canvasElement.querySelector<HTMLImageElement>(
      '[data-slot="theme-hero-media"] img',
    );
    const button = canvasElement.querySelector<HTMLButtonElement>(
      '[data-slot="theme-hero"] [data-slot="button"]',
    );

    if (!hero || !copy || !title || !description || !media || !image || !button) {
      throw new Error("ThemeHero did not render its copy, artwork and CTA");
    }
    const titleStyle = getComputedStyle(title);
    if (!titleStyle.fontFamily.includes("Source Serif 4") || titleStyle.fontWeight !== "600") {
      throw new Error("ThemeHero display title must use the Source Serif 4 600 contract");
    }
    if (getComputedStyle(description).fontWeight !== "400") {
      throw new Error("ThemeHero description must remain regular at weight 400");
    }
    if (!copy.textContent?.includes("Gentle yet Effective")) {
      throw new Error("ThemeHero must keep selectable theme copy");
    }
    if (!image.alt.trim()) {
      throw new Error("ThemeHero foreground artwork requires meaningful alt text");
    }
    if (button.textContent?.trim() !== "Shop All Anua") {
      throw new Error("ThemeHero must expose its primary action");
    }

    await new Promise<void>((resolve) => {
      if (image.complete) return resolve();
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });
    if (image.naturalWidth !== 1672 || image.naturalHeight !== 941) {
      throw new Error(
        `ThemeHero must retain the Figma artwork, received ${image.naturalWidth}x${image.naturalHeight}`,
      );
    }

    if (window.innerWidth >= 1024) {
      const heroBox = hero.getBoundingClientRect();
      const content = copy.parentElement;
      const contentBox = content?.getBoundingClientRect();
      const mediaBox = media.getBoundingClientRect();
      const imageBox = image.getBoundingClientRect();
      if (Math.abs(heroBox.height - 448) > 1) {
        throw new Error(`Desktop ThemeHero must be 448px tall, got ${heroBox.height}px`);
      }
      if (!contentBox || contentBox.width > 1441) {
        throw new Error("Desktop ThemeHero content must cap at 1440px");
      }
      const heroStyle = getComputedStyle(hero);
      if (
        heroStyle.display !== "flex" ||
        heroStyle.alignItems !== "center" ||
        heroStyle.justifyContent !== "center" ||
        heroStyle.paddingTop !== "0px" ||
        heroStyle.paddingRight !== "0px" ||
        heroStyle.paddingBottom !== "0px" ||
        heroStyle.paddingLeft !== "0px"
      ) {
        throw new Error("Desktop ThemeHero must keep its outer band flush");
      }
      if (!content) throw new Error("ThemeHero content container did not render");
      const contentStyle = getComputedStyle(content);
      if (
        contentStyle.paddingTop !== "0px" ||
        contentStyle.paddingRight !== "48px" ||
        contentStyle.paddingBottom !== "0px" ||
        contentStyle.paddingLeft !== "48px" ||
        contentStyle.marginRight !== "0px" ||
        contentStyle.marginLeft !== "0px"
      ) {
        throw new Error(
          "Desktop ThemeHero content must be flush vertically with 48px inline insets",
        );
      }
      const centeredOffset =
        heroBox.left + (heroBox.width - contentBox.width) / 2;
      if (Math.abs(contentBox.left - centeredOffset) > 1) {
        throw new Error("Desktop ThemeHero content must be centered in the full-bleed band");
      }
      const mediaStyle = getComputedStyle(media);
      const imageStyle = getComputedStyle(image);
      if (mediaStyle.maxHeight !== "400px" || mediaStyle.overflow !== "hidden") {
        throw new Error("Desktop ThemeHero media must cap its height and hide overflow");
      }
      if (imageStyle.borderRadius !== "8px") {
        throw new Error("Desktop ThemeHero artwork must use an 8px radius");
      }
      const contentHorizontalPadding =
        Number.parseFloat(contentStyle.paddingLeft) +
        Number.parseFloat(contentStyle.paddingRight);
      const gridGap = Number.parseFloat(mediaStyle.columnGap || contentStyle.columnGap);
      const availableWidth = (contentBox?.width ?? 0) - contentHorizontalPadding;
      const maxMediaWidth = availableWidth / 2 - gridGap / 2;
      if (mediaBox.width > maxMediaWidth + 1 || mediaBox.height > 400 + 1) {
        throw new Error("Desktop ThemeHero media must fit half the content width and 400px height");
      }
      const mediaCenter = mediaBox.top + mediaBox.height / 2;
      const imageCenter = imageBox.top + imageBox.height / 2;
      if (Math.abs(mediaCenter - imageCenter) > 1) {
        throw new Error("Desktop ThemeHero artwork must be vertically centered in its media container");
      }
    }
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "yamiMobile", isRotated: false } },
  play: async ({ canvasElement }) => {
    const hero = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-hero"]',
    );
    const copy = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-hero-copy"]',
    );
    const title = copy?.querySelector<HTMLElement>("h2");
    const description = copy?.querySelector<HTMLElement>("div");
    const media = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-hero-media"]',
    );
    const image = media?.querySelector<HTMLImageElement>("img");
    const atmosphere = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-hero-atmosphere"]',
    );
    const scrim = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-hero-scrim"]',
    );
    const cta = copy?.querySelector<HTMLElement>("div:last-child");

    if (
      !hero ||
      !copy ||
      !title ||
      !description ||
      !media ||
      !image ||
      !atmosphere ||
      !scrim ||
      !cta
    ) {
      throw new Error("Mobile ThemeHero did not render its visual layers");
    }

    const heroBox = hero.getBoundingClientRect();
    const mediaBox = media.getBoundingClientRect();
    const copyStyles = getComputedStyle(copy);
    const titleStyles = getComputedStyle(title);
    const descriptionStyles = getComputedStyle(description);
    const mediaStyles = getComputedStyle(media);
    const imageStyles = getComputedStyle(image);
    const scrimStyles = getComputedStyle(scrim);

    if (
      heroBox.height < 359 ||
      heroBox.height > 401 ||
      Math.abs(mediaBox.width - heroBox.width) > 1 ||
      Math.abs(mediaBox.height - heroBox.height) > 1 ||
      copyStyles.position !== "absolute" ||
      copyStyles.justifyContent !== "flex-end" ||
      titleStyles.fontSize !== "24px" ||
      descriptionStyles.webkitLineClamp !== "3" ||
      mediaStyles.position !== "absolute" ||
      imageStyles.objectFit !== "cover" ||
      getComputedStyle(atmosphere).display !== "none" ||
      !scrimStyles.backgroundImage.includes("linear-gradient") ||
      getComputedStyle(cta).paddingTop !== "0px"
    ) {
      throw new Error(
        "Mobile ThemeHero must use a full-bleed image with bottom-aligned copy and a contrast scrim",
      );
    }
  },
};
