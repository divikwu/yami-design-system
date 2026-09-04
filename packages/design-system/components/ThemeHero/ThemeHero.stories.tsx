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
    const descriptionText = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-description-text"]',
    );
    const descriptionCopy = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-description-copy"]',
    );
    const descriptionToggle = copy?.querySelector<HTMLButtonElement>(
      '[data-slot="theme-hero-description-toggle"]',
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
    const mobileScrim = canvasElement.querySelector<HTMLElement>(
      '[data-slot="theme-hero-scrim"]',
    );
    if (
      !hero ||
      !copy ||
      !title ||
      !description ||
      !descriptionText ||
      !descriptionCopy ||
      !descriptionToggle ||
      !tagList ||
      badges?.length !== 3 ||
      !actions ||
      !primaryButton ||
      !secondaryButton ||
      !media ||
      !image ||
      !mobileScrim
    ) {
      throw new Error("ThemeHero did not render its copy, badges, artwork and actions");
    }
    const copyStyle = getComputedStyle(copy);
    const titleStyle = getComputedStyle(title);
    if (copyStyle.rowGap !== "12px") {
      throw new Error("Desktop ThemeHero copy must use a 12px vertical gap");
    }
    if (!titleStyle.fontFamily.includes("Source Serif 4 Variable") || titleStyle.fontWeight !== "600") {
      throw new Error("ThemeHero display title must use the Source Serif 4 Variable 600 contract");
    }
    const descriptionStyle = getComputedStyle(description);
    const descriptionTextStyle = getComputedStyle(descriptionText);
    const descriptionToggleStyle = getComputedStyle(descriptionToggle);
    const descriptionRange = document.createRange();
    descriptionRange.selectNodeContents(descriptionCopy);
    const descriptionLineRects = Array.from(descriptionRange.getClientRects());
    const descriptionLastLine = descriptionLineRects.at(-1);
    const descriptionToggleRect = descriptionToggle.getBoundingClientRect();
    if (
      descriptionStyle.fontSize !== "16px" ||
      descriptionStyle.lineHeight !== "20px" ||
      descriptionStyle.fontWeight !== "400" ||
      descriptionTextStyle.webkitLineClamp !== "3" ||
      descriptionText.getBoundingClientRect().height > 61 ||
      descriptionToggle.textContent?.trim() !== "More" ||
      descriptionToggleStyle.backgroundImage !== "none" ||
      descriptionToggleStyle.fontWeight !== "400" ||
      !descriptionLastLine ||
      Math.abs(descriptionToggleRect.top - descriptionLastLine.top) > 2 ||
      descriptionToggleRect.left < descriptionLastLine.right - 1 ||
      descriptionToggleRect.left - descriptionLastLine.right > 8
    ) {
      throw new Error(
        "Desktop ThemeHero description must use the regular 16/20 three-line contract with a plain-text expansion action",
      );
    }
    descriptionToggle.click();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (
      descriptionToggle.getAttribute("aria-expanded") !== "true" ||
      descriptionToggle.textContent?.trim() !== "Less" ||
      getComputedStyle(descriptionText).webkitLineClamp !== "none"
    ) {
      throw new Error("Desktop ThemeHero description must reveal its full content");
    }
    descriptionToggle.click();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
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
    if (getComputedStyle(mobileScrim).display !== "none") {
      throw new Error("Desktop ThemeHero must not render the mobile copy scrim");
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
      const tokenProbe = document.createElement("span");
      tokenProbe.style.backgroundColor = "var(--fill-tertiary)";
      document.body.append(tokenProbe);
      const placeholderColor = getComputedStyle(tokenProbe).backgroundColor;
      tokenProbe.remove();
      const originalImageState = image.dataset.imageState;
      image.dataset.imageState = "pending";
      const pendingMediaColor = getComputedStyle(media).backgroundColor;
      if (originalImageState) image.dataset.imageState = originalImageState;
      else delete image.dataset.imageState;
      if (pendingMediaColor !== placeholderColor) {
        throw new Error(
          "Desktop ThemeHero media must show the tertiary gray fill while artwork is pending",
        );
      }
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
    const copyContent = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-copy-content"]',
    );
    const title = copy?.querySelector<HTMLElement>("h2");
    const description = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-description"]',
    );
    const descriptionText = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-description-text"]',
    );
    const descriptionCopy = copy?.querySelector<HTMLElement>(
      '[data-slot="theme-hero-description-copy"]',
    );
    const descriptionToggle = copy?.querySelector<HTMLButtonElement>(
      '[data-slot="theme-hero-description-toggle"]',
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
      !copyContent ||
      !title ||
      !description ||
      !descriptionText ||
      !descriptionCopy ||
      !descriptionToggle ||
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
    const copyContentStyles = getComputedStyle(copyContent);
    const copyContentBox = copyContent.getBoundingClientRect();
    const titleStyles = getComputedStyle(title);
    const descriptionStyles = getComputedStyle(description);
    const descriptionTextStyles = getComputedStyle(descriptionText);
    const descriptionRange = document.createRange();
    descriptionRange.selectNodeContents(descriptionCopy);
    const descriptionLineRects = Array.from(descriptionRange.getClientRects());
    const descriptionLastLine = descriptionLineRects.at(-1);
    const descriptionToggleRect = descriptionToggle.getBoundingClientRect();
    const tagListStyles = getComputedStyle(tagList);
    const tagListBox = tagList.getBoundingClientRect();
    const mobileHeroBox = hero.getBoundingClientRect();
    const badgeStyles = Array.from(badges, (badge) => getComputedStyle(badge));
    const actionsStyles = getComputedStyle(actions);
    const actionsBox = actions.getBoundingClientRect();
    const primaryButtonStyles = getComputedStyle(primaryButton);
    const secondaryButtonStyles = getComputedStyle(secondaryButton);
    const mediaStyles = getComputedStyle(media);
    const imageStyles = getComputedStyle(image);
    const imageBox = image.getBoundingClientRect();
    const scrimStyles = getComputedStyle(scrim);
    const scrimBox = scrim.getBoundingClientRect();
    const copyContentWidth =
      copyContentBox.width -
      Number.parseFloat(copyContentStyles.paddingLeft) -
      Number.parseFloat(copyContentStyles.paddingRight);
    const originalImageState = image.dataset.imageState;
    image.dataset.imageState = "pending";
    const pendingMediaColor = getComputedStyle(media).backgroundColor;
    if (originalImageState) image.dataset.imageState = originalImageState;
    else delete image.dataset.imageState;

    if (
      heroBox.height < 359 ||
      heroBox.height > 401 ||
      Math.abs(mediaBox.width - heroBox.width) > 1 ||
      Math.abs(mediaBox.height - heroBox.height) > 1 ||
      copyStyles.position !== "absolute" ||
      copyStyles.justifyContent !== "flex-end" ||
      copyContentStyles.position !== "relative" ||
      copyContentStyles.rowGap !== "8px" ||
      copyContentStyles.paddingTop !== "40px" ||
      copyContentStyles.paddingRight !== "16px" ||
      copyContentStyles.paddingBottom !== "16px" ||
      copyContentStyles.paddingLeft !== "16px" ||
      titleStyles.fontSize !== "24px" ||
      titleStyles.lineHeight !== "32px" ||
      descriptionStyles.fontSize !== "14px" ||
      descriptionStyles.lineHeight !== "20px" ||
      descriptionTextStyles.webkitLineClamp !== "2" ||
      descriptionText.getBoundingClientRect().height > 41 ||
      descriptionToggle.textContent?.trim() !== "More" ||
      descriptionToggle.getAttribute("aria-expanded") !== "false" ||
      descriptionToggle.getAttribute("aria-controls") !== descriptionCopy.id ||
      getComputedStyle(descriptionToggle).backgroundImage !== "none" ||
      getComputedStyle(descriptionToggle).fontWeight !== "400" ||
      !descriptionLastLine ||
      Math.abs(descriptionToggleRect.top - descriptionLastLine.top) > 2 ||
      descriptionToggleRect.left < descriptionLastLine.right - 1 ||
      descriptionToggleRect.left - descriptionLastLine.right > 8 ||
      tagListStyles.flexWrap !== "nowrap" ||
      tagListStyles.rowGap !== "4px" ||
      tagListStyles.columnGap !== "4px" ||
      tagListStyles.paddingTop !== "4px" ||
      tagListStyles.paddingBottom !== "4px" ||
      tagListStyles.overflowX !== "auto" ||
      Math.abs(tagListBox.left - mobileHeroBox.left) > 1 ||
      Math.abs(tagListBox.right - mobileHeroBox.right) > 1 ||
      tagList.scrollWidth <= tagList.clientWidth ||
      Math.max(...Array.from(badges, (badge) => badge.offsetTop)) !==
        Math.min(...Array.from(badges, (badge) => badge.offsetTop)) ||
      Array.from(badges).some((badge) => {
        const style = getComputedStyle(badge);
        return (
          style.whiteSpace !== "nowrap" ||
          style.textOverflow !== "clip" ||
          badge.scrollWidth > badge.clientWidth
        );
      }) ||
      badgeStyles.some(
        (style) =>
          style.height !== "20px" ||
          style.borderRadius !== "4px" ||
          style.fontSize !== "12px" ||
          style.lineHeight !== "16px" ||
          style.color !== "rgb(0, 0, 0)" ||
          style.backgroundColor !== "rgba(255, 255, 255, 0.68)",
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
      pendingMediaColor !== "rgba(0, 0, 0, 0)" ||
      mediaStyles.position !== "absolute" ||
      imageStyles.position !== "absolute" ||
      imageStyles.top !== "-40px" ||
      imageStyles.objectFit !== "cover" ||
      Math.abs(imageBox.top - (heroBox.top - 40)) > 1 ||
      Math.abs(imageBox.height - (heroBox.height + 40)) > 1 ||
      Math.abs(imageBox.bottom - heroBox.bottom) > 1 ||
      getComputedStyle(atmosphere).display !== "none" ||
      hero.dataset.mobileForeground !== "dark" ||
      getComputedStyle(hero).color !== "rgba(0, 0, 0, 0.87)" ||
      scrim.dataset.adaptiveImageScrim !== "true" ||
      scrim.parentElement !== copyContent ||
      Math.abs(scrimBox.width - copyContentBox.width) > 1 ||
      Math.abs(scrimBox.height - copyContentBox.height) > 1 ||
      scrimBox.height >= heroBox.height ||
      Math.abs(scrimBox.bottom - heroBox.bottom) > 1 ||
      !scrimStyles.backgroundImage.includes("linear-gradient") ||
      !scrimStyles.backgroundImage.includes("/ 0.8") ||
      !scrimStyles.backgroundImage.includes("0px") ||
      !scrimStyles.backgroundImage.includes("64px") ||
      scrimStyles.backgroundImage.includes("20%") ||
      scrimStyles.backgroundImage.includes("60%") ||
      scrimStyles.backdropFilter !== "blur(16px)" ||
      !scrimStyles.maskImage.includes("linear-gradient") ||
      !scrimStyles.maskImage.includes("0px") ||
      !scrimStyles.maskImage.includes("64px") ||
      scrimStyles.maskImage.includes("20%") ||
      scrimStyles.maskImage.includes("60%")
    ) {
      throw new Error(
        "Mobile ThemeHero must use a 24/32 title and a single horizontally scrollable 4px-gap tag row over a full-bleed image with bottom-aligned copy, 8px-padded full-width distributed actions and an adaptive bottom-masked 16px frosted scrim",
      );
    }

    const collapsedScrimHeight = scrim.getBoundingClientRect().height;
    descriptionToggle.click();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const expandedScrimHeight = scrim.getBoundingClientRect().height;
    if (
      descriptionToggle.getAttribute("aria-expanded") !== "true" ||
      descriptionToggle.textContent?.trim() !== "Less" ||
      getComputedStyle(descriptionText).webkitLineClamp !== "none" ||
      descriptionText.scrollHeight !== descriptionText.clientHeight ||
      expandedScrimHeight <= collapsedScrimHeight ||
      Math.abs(
        expandedScrimHeight - copyContent.getBoundingClientRect().height,
      ) > 1
    ) {
      throw new Error(
        "Mobile ThemeHero description must reveal its full content and grow its content-bound scrim",
      );
    }

    descriptionToggle.click();
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (
      descriptionToggle.getAttribute("aria-expanded") !== "false" ||
      Math.abs(
        scrim.getBoundingClientRect().height - collapsedScrimHeight,
      ) > 1
    ) {
      throw new Error("Mobile ThemeHero description must collapse again");
    }

    tagList.focus();
    if (
      tagList.tabIndex !== 0 ||
      getComputedStyle(tagList).outlineStyle === "none"
    ) {
      throw new Error(
        "Scrollable mobile ThemeHero tags must be keyboard focusable with a visible focus style",
      );
    }
  },
};
