import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  createTopicLandingPageFixture,
  type TopicLandingPageLocale,
} from "../TopicLandingPage/fixtures";

import {
  TopicLandingEmail,
  type TopicLandingEmailLocale,
} from "./TopicLandingEmail";

function localeFromGlobals(value: unknown): TopicLandingEmailLocale {
  return value === "zh" ? "zh" : "en";
}

function keywordFromHeroTitle(title: unknown) {
  return String(title).split(/[:：]/, 1)[0].trim();
}

const themeImages = [
  new URL("../TopicLandingPage/assets/start-here/scene-cleanse-v2.webp", import.meta.url)
    .href,
  new URL("../TopicLandingPage/assets/start-here/scene-calm-v2.webp", import.meta.url)
    .href,
  new URL("../TopicLandingPage/assets/start-here/scene-brighten-v2.webp", import.meta.url)
    .href,
  new URL("../TopicLandingPage/assets/start-here/scene-hydrate-v2.webp", import.meta.url)
    .href,
] as const;

const themeTitles = {
  zh: ["温和清洁", "舒缓调理", "淡斑提亮", "补水修护"],
  en: ["Gentle Cleansing", "Soothing Care", "Brightening", "Hydration Support"],
} as const;

function createTopicLandingEmailProps(locale: TopicLandingPageLocale) {
  const page = createTopicLandingPageFixture(locale);
  const heroImage = page.hero.image;
  const landingPageHref = `https://www.yami.com/us/${locale}/b/anua/11712`;

  return {
    locale,
    keyword: keywordFromHeroTitle(page.hero.title),
    title: String(page.hero.title),
    description: String(page.hero.description),
    tags: page.hero.tags ?? [],
    hero: {
      src: heroImage.src,
      alt: heroImage.alt,
    },
    categories: page.shortcutRail.items.map((item) => ({
      id: item.id,
      image: item.iconSrc,
      label: String(item.label),
      href: `${landingPageHref}${item.href}`,
    })),
    themes: themeImages.map((image, index) => ({
      id: `email-theme-${index + 1}`,
      image,
      imageAlt: themeTitles[locale][index],
      title: themeTitles[locale][index],
      href: landingPageHref,
    })),
    products: page.productRail.products.map((product) => ({
      id: product.id,
      image: String(product.image),
      imageAlt: String(product.imageAlt ?? product.title),
      brand: String(product.brand ?? "ANUA"),
      title: String(product.title),
      href: product.href,
    })),
    landingPageHref,
  };
}

const meta = {
  title: "YAMI/Pages/Email Templates/Topic Landing Push",
  component: TopicLandingEmail,
  parameters: {
    layout: "fullscreen",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "A reusable email shell for pushing any maintained Topic Landing Page. The current Storybook example is fed by the Anua brand fixture; future brand or topic pages can supply the same hero, copy, tags, products, and landing-page destination.",
      },
      story: { inline: false, height: "1200px" },
    },
  },
  globals: {
    theme: "light",
    viewport: { value: "yamiDesktopMd", isRotated: false },
  },
  args: createTopicLandingEmailProps("en"),
  render: (args, { globals }) => (
    <TopicLandingEmail
      {...args}
      {...createTopicLandingEmailProps(localeFromGlobals(globals.locale))}
    />
  ),
} satisfies Meta<typeof TopicLandingEmail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BrandExample: Story = {
  name: "Brand example",
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email"]',
    );
    if (!root) throw new Error("Topic Landing email did not render");
    if (
      root.dataset.locale === "zh" &&
      (root.querySelector('[data-slot="topic-landing-email-eyebrow"]')?.textContent?.trim() !==
        "专题精选" ||
        root
          .querySelector('[data-slot="topic-landing-email-themes"] h2')
          ?.textContent?.trim() !== "按功效探索")
    ) {
      throw new Error("Chinese Topic Landing email must use purpose-led section copy");
    }
    if (
      root.dataset.locale === "en" &&
      (root.querySelector('[data-slot="topic-landing-email-eyebrow"]')?.textContent?.trim() !==
        "Topic Feature" ||
        root
          .querySelector('[data-slot="topic-landing-email-categories"] h2')
          ?.textContent?.trim() !== "Featured Categories" ||
        root
          .querySelector('[data-slot="topic-landing-email-products"] h2')
          ?.textContent?.trim() !== "Popular Picks")
    ) {
      throw new Error("English Topic Landing email headings must use title case");
    }
    if (root.querySelector('[data-slot="email-preview-label"]')) {
      throw new Error("Topic Landing email must not render a preview label");
    }
    if (!root.querySelector('[data-slot="topic-landing-email-hero"] img')) {
      throw new Error("Anua landing email is missing the hero artwork");
    }
    const categorySection = root.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email-categories"]',
    );
    const categoryGrid = root.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email-category-grid"]',
    );
    if (
      !categorySection ||
      !categoryGrid ||
      categoryGrid.querySelectorAll("li").length !== 7 ||
      getComputedStyle(categorySection).backgroundColor ===
        "rgb(255, 255, 255)" ||
      getComputedStyle(categoryGrid).display !== "flex" ||
      getComputedStyle(categoryGrid).flexWrap !== "wrap" ||
      getComputedStyle(categoryGrid).justifyContent !== "center" ||
      getComputedStyle(categoryGrid).columnGap !== "12px" ||
      getComputedStyle(categoryGrid).rowGap !== "20px"
    ) {
      throw new Error(
        "Topic Landing email categories must use a gray centered four-item layout",
      );
    }
    const categoryHeading = categorySection.querySelector<HTMLElement>("h2");
    if (
      !categoryHeading ||
      getComputedStyle(categoryHeading).fontSize !== "16px" ||
      !getComputedStyle(categoryHeading).color.includes("255, 0, 0") ||
      getComputedStyle(categoryHeading).textAlign !== "center"
    ) {
      throw new Error("Topic Landing email category heading must use brand red type");
    }
    const categoryImage = categoryGrid.querySelector<HTMLImageElement>("img");
    const categoryMedia = categoryImage?.parentElement;
    const categoryLink = categoryMedia?.parentElement;
    const categoryLabel = categoryGrid.querySelector<HTMLElement>(
      "li div span:last-child",
    );
    const categoryMediaRect = categoryMedia?.getBoundingClientRect();
    const categoryLinkRect = categoryLink?.getBoundingClientRect();
    if (
      !categoryImage ||
      !categoryMedia ||
      !categoryLink ||
      !categoryMediaRect ||
      !categoryLinkRect ||
      !categoryLabel ||
      getComputedStyle(categoryMedia).maxWidth !== "120px" ||
      categoryMediaRect.width > 120 ||
      Math.abs(
        categoryMediaRect.left + categoryMediaRect.width / 2 -
          (categoryLinkRect.left + categoryLinkRect.width / 2),
      ) > 0.5 ||
      getComputedStyle(categoryLabel).fontSize !== "16px"
    ) {
      throw new Error(
        "Topic Landing email categories must include centered square images up to 120px and 16px labels",
      );
    }
    const themesSection = root.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email-themes"]',
    );
    const themeCards = themesSection?.querySelectorAll("li") ?? [];
    const themeGrid = themesSection?.querySelector<HTMLElement>("ul");
    const themeImage = themesSection?.querySelector<HTMLImageElement>("img");
    const themeTitle = themesSection?.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email-theme-title"]',
    );
    if (
      !themesSection ||
      categorySection.nextElementSibling !== themesSection ||
      themeCards.length !== 4 ||
      !themeGrid ||
      getComputedStyle(themeGrid).alignItems !== "start" ||
      getComputedStyle(themeGrid).rowGap !== "12px" ||
      getComputedStyle(themeGrid).columnGap !== "12px" ||
      !themeImage ||
      getComputedStyle(themeImage).objectPosition !== "50% calc(50% + 32px)" ||
      !themeTitle ||
      getComputedStyle(themeTitle).position !== "absolute" ||
      themeTitle.parentElement?.children.length !== 2 ||
      getComputedStyle(themesSection).paddingTop !== "32px" ||
      getComputedStyle(themesSection).paddingRight !== "24px"
    ) {
      throw new Error(
        "Topic Landing email must place up to four compact top-aligned themes below categories",
      );
    }
    const categoryImageRect = categoryImage.getBoundingClientRect();
    if (
      Math.abs(categoryImageRect.width - categoryImageRect.height) > 0.5 ||
      categoryImageRect.width <= 64
    ) {
      throw new Error(
        "Topic Landing email category images must be square and responsive",
      );
    }
    const productsSection = root.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email-products"]',
    );
    const productsHeading = productsSection?.querySelector<HTMLElement>("h2");
    const productGrid = productsSection?.querySelector<HTMLElement>("ul");
    const productsCta = productsSection?.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email-products-cta"]',
    );
    const productCard = productsSection?.querySelector<HTMLElement>("ul > li > div");
    const productBrand = productCard?.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email-product-brand"]',
    );
    const productTitle = productCard?.lastElementChild as HTMLElement | null;
    const productsStyle = productsSection
      ? getComputedStyle(productsSection)
      : null;
    if (
      !productsSection ||
      productsSection.querySelectorAll("ul > li").length !== 6 ||
      productsSection.querySelectorAll(
        '[data-slot="topic-landing-email-product-brand"]',
      ).length !== 6 ||
      productsSection.querySelector("p") ||
      productsSection.querySelector("del") ||
      productsSection.textContent?.includes("$") ||
      !productGrid ||
      getComputedStyle(productGrid).rowGap !== "24px" ||
      getComputedStyle(productGrid).columnGap !== "12px" ||
      !productsCta ||
      productsCta.textContent?.trim() !== "查看更多" ||
      getComputedStyle(productsCta).minWidth !== "136px" ||
      getComputedStyle(productsCta).minHeight !== "56px" ||
      getComputedStyle(productsCta).fontSize !== "18px" ||
      getComputedStyle(productsCta).borderRadius !== "8px" ||
      getComputedStyle(productsCta).backgroundColor === "rgba(0, 0, 0, 0)" ||
      getComputedStyle(productsCta).backgroundColor === "rgb(255, 255, 255)" ||
      !productCard ||
      getComputedStyle(productCard).paddingTop !== "0px" ||
      getComputedStyle(productCard).paddingRight !== "0px" ||
      getComputedStyle(productCard).paddingBottom !== "0px" ||
      getComputedStyle(productCard).paddingLeft !== "0px" ||
      getComputedStyle(productCard).backgroundColor !== "rgba(0, 0, 0, 0)" ||
      !productBrand ||
      getComputedStyle(productBrand).fontSize !== "16px" ||
      !productTitle ||
      getComputedStyle(productTitle).fontSize !== "16px" ||
      getComputedStyle(productTitle).overflow !== "hidden" ||
      getComputedStyle(productTitle).textOverflow !== "ellipsis" ||
      getComputedStyle(productTitle).webkitLineClamp !== "3" ||
      !productsHeading ||
      productsHeading.textContent?.trim() !== "热门精选" ||
      getComputedStyle(productsHeading).fontSize !== "16px" ||
      getComputedStyle(productsHeading).textAlign !== "center" ||
      !getComputedStyle(productsHeading).color.includes("255, 0, 0") ||
      productsStyle?.backgroundColor !== "rgb(255, 255, 255)" ||
      productsStyle?.borderTopWidth !== "1px" ||
      productsStyle?.borderBottomWidth !== "1px"
    ) {
      throw new Error(
        "Topic Landing email must show six popular picks in a divided white module",
      );
    }
    const appDownload = root.querySelector<HTMLElement>(
      '[data-slot="email-app-download"]',
    );
    const appButtons = appDownload?.querySelectorAll<HTMLElement>(
      '[data-slot="email-app-download-button"]',
    ) ?? [];
    const firstAppButton = appButtons[0];
    const emailFooter = root.querySelector<HTMLElement>(
      '[data-slot="email-legal-footer"]',
    );
    const footerSocialLinks =
      emailFooter?.querySelectorAll('[data-slot="email-social-item"]') ?? [];
    const footerSections = emailFooter?.querySelectorAll("section") ?? [];
    const recipientCopy = footerSections[1]?.querySelector("p")?.textContent?.trim();
    const legalNav = footerSections[1]?.querySelector("nav");
    const isChineseEmail = root.dataset.locale === "zh";
    const expectedAppHeading = isChineseEmail
      ? "下载YAMI App"
      : "Collect Points and Earn Rewards";
    const expectedAppDescription = isChineseEmail
      ? "体验最优专属购物体验和最低优惠"
      : "Order in the app to earn free rewards, get exclusive offers, and track your points.";
    const expectedSocialHeading = isChineseEmail
      ? "关注我们 随时随地获得最新资讯"
      : "Follow Us On";
    if (
      !appDownload ||
      productsSection.nextElementSibling !== appDownload ||
      getComputedStyle(appDownload).height !== "382px" ||
      !getComputedStyle(appDownload).backgroundColor.includes("237, 0, 0") ||
      appDownload.querySelector("h2")?.textContent?.trim() !== expectedAppHeading ||
      appDownload.querySelector("p")?.textContent?.replace(/\s+/g, "").trim() !==
        expectedAppDescription.replace(/\s+/g, "") ||
      getComputedStyle(appDownload.querySelector("h2")!).fontWeight !== (isChineseEmail ? "600" : "500") ||
      getComputedStyle(appDownload.querySelector("p")!).fontWeight !== "400" ||
      appButtons.length !== 2 ||
      !firstAppButton ||
      getComputedStyle(firstAppButton).height !== "40px" ||
      getComputedStyle(firstAppButton).width !== "246px" ||
      getComputedStyle(firstAppButton).borderRadius !== "8px" ||
      getComputedStyle(firstAppButton).fontSize !== "14px" ||
      !emailFooter ||
      appDownload.nextElementSibling !== emailFooter ||
      footerSections.length !== 2 ||
      getComputedStyle(footerSections[0]).height !== "225px" ||
      getComputedStyle(footerSections[1]).minHeight !== "0px" ||
      footerSections[1].scrollHeight !== footerSections[1].clientHeight ||
      getComputedStyle(footerSections[1]).paddingTop !== "32px" ||
      getComputedStyle(footerSections[1]).paddingRight !== "24px" ||
      getComputedStyle(footerSections[1]).paddingBottom !== "32px" ||
      getComputedStyle(footerSections[1]).paddingLeft !== "24px" ||
      getComputedStyle(footerSections[1]).fontWeight !== "400" ||
      !legalNav ||
      getComputedStyle(legalNav).fontSize !== "14px" ||
      recipientCopy !== "This message was sent to divik.wu@yami.com." ||
      footerSections[0]?.querySelector("h2")?.textContent?.trim() !==
        expectedSocialHeading ||
      getComputedStyle(footerSections[0]).borderTopWidth !== "1px" ||
      getComputedStyle(footerSections[0]).borderBottomWidth !== "1px" ||
      footerSocialLinks.length !== (isChineseEmail ? 5 : 4)
    ) {
      throw new Error(
        "Topic Landing email must use the standalone Figma app download and legal footer modules",
      );
    }
    if (root.querySelector("a")) {
      throw new Error("Topic Landing email must not render links");
    }
    if (isChineseEmail) {
      const redbookLink = Array.from(footerSocialLinks).find(
        (link) => link.getAttribute("aria-label") === "小红书",
      );
      const redbookIcon = redbookLink?.querySelector("img");
      if (
        !redbookLink ||
        !redbookIcon ||
        Math.abs(redbookLink.getBoundingClientRect().width - 62.84) > 0.1 ||
        Math.abs(redbookLink.getBoundingClientRect().height - 48) > 0.1 ||
        Math.abs(redbookIcon.getBoundingClientRect().width - 62.84) > 0.1 ||
        Math.abs(redbookIcon.getBoundingClientRect().height - 48) > 0.1
      ) {
        throw new Error(
          "Chinese Topic Landing email must use the full-size Redbook social mark",
        );
      }
    }
    const header = root.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email-header"]',
    );
    const logo = root.querySelector<HTMLImageElement>(
      '[data-slot="topic-landing-email-logo"]',
    );
    if (!header || getComputedStyle(header).height !== "120px") {
      throw new Error("Topic Landing email header must be 120px tall");
    }
    if (getComputedStyle(header).borderBottomWidth !== "1px") {
      throw new Error("Topic Landing email header must have a bottom divider");
    }
    if (
      getComputedStyle(header).justifyContent !== "center" ||
      header.querySelectorAll("span").length !== 1
    ) {
      throw new Error("Topic Landing email logo must be centered without a header label");
    }
    const frame = root.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email-frame"]',
    );
    if (!frame || getComputedStyle(frame).borderRadius !== "0px") {
      throw new Error("Topic Landing email frame must have square corners");
    }
    const content = root.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email-content"]',
    );
    const tags = content?.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email-tags"]',
    ) ?? null;
    if (!content || getComputedStyle(content).textAlign !== "center") {
      throw new Error("Topic Landing email content must be centered");
    }
    const paddedModules = [
      header,
      content,
      categorySection,
      themesSection,
      productsSection,
    ];
    if (
      paddedModules.some((module) => {
        if (!module) return true;
        const style = getComputedStyle(module);
        return (
          style.paddingTop !== "32px" ||
          style.paddingRight !== "24px" ||
          style.paddingBottom !== "32px" ||
          style.paddingLeft !== "24px"
        );
      })
    ) {
      throw new Error("Email modules must use 32px vertical and 24px horizontal padding");
    }
    const title = content.querySelector<HTMLHeadingElement>("h1");
    const eyebrow = content.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email-eyebrow"]',
    );
    const lede = content.querySelector<HTMLElement>(
      '[data-slot="topic-landing-email-lede"]',
    );
    if (!title || getComputedStyle(title).fontSize !== "40px") {
      throw new Error("Topic Landing email title must use 40px type");
    }
    if (!lede || getComputedStyle(lede).fontSize !== "20px") {
      throw new Error("Topic Landing email description must use 20px type");
    }
    if (
      !eyebrow ||
      getComputedStyle(eyebrow).fontSize !== "16px" ||
      !getComputedStyle(eyebrow).color.includes("255, 0, 0")
    ) {
      throw new Error("Topic Landing email eyebrow must use 16px brand red type");
    }
    if (tags && getComputedStyle(tags).justifyContent !== "center") {
      throw new Error("Topic Landing email tags must be centered");
    }
    const tag = tags?.querySelector<HTMLElement>("li");
    if (
      !tag ||
      getComputedStyle(tag).fontSize !== "14px" ||
      getComputedStyle(tag).borderRadius !== "9999px"
    ) {
      throw new Error("Topic Landing email tags must use 14px pill styling");
    }
    if (!logo || getComputedStyle(logo).height !== "48px") {
      throw new Error("Topic Landing email logo must be 48px tall");
    }
    if (root.querySelectorAll('[data-email-cta="true"]').length !== 1) {
      throw new Error("Topic Landing email must expose exactly one primary CTA");
    }
    const cta = root.querySelector<HTMLElement>('[data-email-cta="true"]');
    const expectedCta = root.dataset.locale === "zh" ? "探索 Anua" : "Explore Anua";
    if (!cta || cta.textContent?.trim() !== expectedCta) {
      throw new Error(`Topic Landing email CTA must read ${expectedCta}`);
    }
    if (!getComputedStyle(cta).backgroundColor.includes("0, 0, 0")) {
      throw new Error("Topic Landing email CTA must use a black background");
    }
    if (
      getComputedStyle(cta).minHeight !== "56px" ||
      getComputedStyle(cta).minWidth !== "136px" ||
      getComputedStyle(cta).fontSize !== "18px"
    ) {
      throw new Error(
        "Topic Landing email CTA must use 136px minimum width, 56px height, and 18px type",
      );
    }
    if (root.querySelectorAll('[data-slot="topic-landing-email-products"] li').length !== 6) {
      throw new Error("Topic Landing email must show six popular picks");
    }
  },
};
