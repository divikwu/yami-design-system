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
          "A theme storytelling hero with selectable copy, optional primary and secondary actions, and campaign artwork repeated as a blurred atmosphere. Designed from English Site Optimization 2026 node 1877:43111 and informed by the W Concept visual module.",
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
    const description = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-description"]',
    );
    const tagList = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-tags"]',
    );
    const badges = tagList?.querySelectorAll<HTMLElement>('[data-slot="badge"]');
    const actions = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-actions"]',
    );
    const primaryButton = actions?.querySelector<HTMLButtonElement>(
      '[data-action="primary"]',
    );
    const secondaryButton = actions?.querySelector<HTMLButtonElement>(
      '[data-action="secondary"]',
    );
    const media = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-hero-media"]',
    );
    const image = canvasElement.querySelector<HTMLImageElement>(
      '[data-slot="theme-hero-media"] img',
    );
    if (
      !hero ||
      !copy ||
      !title ||
      !description ||
      !tagList ||
      badges?.length !== 3 ||
      !actions ||
      !primaryButton ||
      !secondaryButton ||
      !media ||
      !image
    ) {
      throw new Error("ThemeHero did not render its copy, badges, artwork and actions");
    }
    const titleStyle = getComputedStyle(title);
    if (!titleStyle.fontFamily.includes("Source Serif 4") || titleStyle.fontWeight !== "600") {
      throw new Error("ThemeHero display title must use the Source Serif 4 600 contract");
    }
    const descriptionStyle = getComputedStyle(description);
    if (
      descriptionStyle.fontSize !== "16px" ||
      descriptionStyle.lineHeight !== "20px" ||
      descriptionStyle.fontWeight !== "400"
    ) {
      throw new Error(
        "ThemeHero description must use the regular 16/20 supporting-copy contract",
      );
    }
    const tagListStyle = getComputedStyle(tagList);
    if (
      tagListStyle.paddingTop !== "8px" ||
      tagListStyle.paddingRight !== "0px" ||
      tagListStyle.paddingBottom !== "8px" ||
      tagListStyle.paddingLeft !== "0px"
    ) {
      throw new Error("ThemeHero tag list must use 8px block padding only");
    }
    if (
      Array.from(badges).some((badge) => {
        const style = getComputedStyle(badge);
        return (
          badge.dataset.tone !== "dark" ||
          badge.dataset.size !== "sm" ||
          style.height !== "20px" ||
          style.borderRadius !== "4px" ||
          style.fontSize !== "12px" ||
          style.lineHeight !== "16px"
        );
      })
    ) {
      throw new Error(
        "ThemeHero keywords must default to compact sm Badge tones",
      );
    }
    if (!copy.textContent?.includes("Gentle yet Effective")) {
      throw new Error("ThemeHero must keep selectable theme copy");
    }
    if (!image.alt.trim()) {
      throw new Error("ThemeHero foreground artwork requires meaningful alt text");
    }
    const primaryStyle = getComputedStyle(primaryButton);
    const secondaryStyle = getComputedStyle(secondaryButton);
    const actionsStyle = getComputedStyle(actions);
    const actionsBox = actions.getBoundingClientRect();
    const primaryBox = primaryButton.getBoundingClientRect();
    const secondaryBox = secondaryButton.getBoundingClientRect();
    if (
      primaryButton.textContent?.trim() !== "Shop Products" ||
      secondaryButton.textContent?.trim() !== "Explore More" ||
      actions.dataset.actionCount !== "2" ||
      actionsStyle.display !== "flex" ||
      actionsStyle.paddingTop !== "16px" ||
      actionsStyle.paddingBottom !== "16px" ||
      Math.abs(actionsBox.width - primaryBox.width - secondaryBox.width - 8) > 1 ||
      actionsBox.width >= copy.getBoundingClientRect().width ||
      primaryStyle.backgroundColor !== "rgb(255, 255, 255)" ||
      primaryStyle.borderRadius !== "9999px" ||
      secondaryStyle.borderTopWidth !== "1px" ||
      secondaryStyle.borderTopStyle !== "solid" ||
      secondaryStyle.borderRadius !== "9999px"
    ) {
      throw new Error(
        "ThemeHero must expose content-width full-round actions with 16px block padding, a white primary and outlined secondary",
      );
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
  args: { tagSize: "md" },
  play: async ({ canvasElement }) => {
    const hero = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-hero"]',
    );
    const copy = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-hero-copy"]',
    );
    const title = copy?.querySelector<HTMLElement>("h2");
    const description = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-description"]',
    );
    const tagList = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-tags"]',
    );
    const badges = tagList?.querySelectorAll<HTMLElement>('[data-slot="badge"]');
    const actions = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-actions"]',
    );
    const primaryButton = actions?.querySelector<HTMLButtonElement>(
      '[data-action="primary"]',
    );
    const secondaryButton = actions?.querySelector<HTMLButtonElement>(
      '[data-action="secondary"]',
    );
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
    if (
      !hero ||
      !copy ||
      !title ||
      !description ||
      !tagList ||
      badges?.length !== 3 ||
      !actions ||
      !primaryButton ||
      !secondaryButton ||
      !media ||
      !image ||
      !atmosphere ||
      !scrim
    ) {
      throw new Error("Mobile ThemeHero did not render its visual layers");
    }

    const heroBox = hero.getBoundingClientRect();
    const mediaBox = media.getBoundingClientRect();
    const copyStyles = getComputedStyle(copy);
    const titleStyles = getComputedStyle(title);
    const descriptionStyles = getComputedStyle(description);
    const tagListStyles = getComputedStyle(tagList);
    const badgeStyles = Array.from(badges, (badge) => getComputedStyle(badge));
    const actionsStyles = getComputedStyle(actions);
    const actionsBox = actions.getBoundingClientRect();
    const primaryButtonStyles = getComputedStyle(primaryButton);
    const secondaryButtonStyles = getComputedStyle(secondaryButton);
    const mediaStyles = getComputedStyle(media);
    const imageStyles = getComputedStyle(image);
    const scrimStyles = getComputedStyle(scrim);
    const copyContentWidth =
      copy.getBoundingClientRect().width -
      Number.parseFloat(copyStyles.paddingLeft) -
      Number.parseFloat(copyStyles.paddingRight);

    if (
      heroBox.height < 359 ||
      heroBox.height > 401 ||
      Math.abs(mediaBox.width - heroBox.width) > 1 ||
      Math.abs(mediaBox.height - heroBox.height) > 1 ||
      copyStyles.position !== "absolute" ||
      copyStyles.justifyContent !== "flex-end" ||
      titleStyles.fontSize !== "24px" ||
      descriptionStyles.fontSize !== "14px" ||
      descriptionStyles.lineHeight !== "20px" ||
      descriptionStyles.webkitLineClamp !== "3" ||
      tagListStyles.paddingTop !== "8px" ||
      tagListStyles.paddingBottom !== "8px" ||
      badgeStyles.some(
        (style) =>
          style.height !== "20px" ||
          style.borderRadius !== "4px" ||
          style.fontSize !== "12px" ||
          style.lineHeight !== "16px",
      ) ||
      Array.from(badges).some((badge) => badge.dataset.size !== "md") ||
      actionsStyles.paddingTop !== "8px" ||
      actionsStyles.paddingBottom !== "8px" ||
      actionsStyles.display !== "flex" ||
      actionsStyles.flexWrap !== "nowrap" ||
      Math.abs(actionsBox.width - copyContentWidth) > 1 ||
      primaryButtonStyles.flexGrow !== "1" ||
      secondaryButtonStyles.flexGrow !== "1" ||
      primaryButtonStyles.borderRadius !== "9999px" ||
      secondaryButtonStyles.borderRadius !== "9999px" ||
      mediaStyles.position !== "absolute" ||
      imageStyles.objectFit !== "cover" ||
      getComputedStyle(atmosphere).display !== "none" ||
      !scrimStyles.backgroundImage.includes("linear-gradient")
    ) {
      throw new Error(
        "Mobile ThemeHero must use a full-bleed image with bottom-aligned copy, 8px-padded full-width distributed actions and a contrast scrim",
      );
    }
  },
};
