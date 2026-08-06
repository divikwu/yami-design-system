import type { Meta, StoryObj } from "@storybook/react-vite";

import { HeroBanner } from "./HeroBanner";
import { HeroBannerImageOnlyCard } from "./HeroBannerImageOnlyCard";
import { HeroBannerImageTextCard } from "./HeroBannerImageTextCard";
import { HeroBannerImageTextProductsCard } from "./HeroBannerImageTextProductsCard";
import { HeroBannerProductsOnlyCard } from "./HeroBannerProductsOnlyCard";
import type {
  HeroBannerImageOnlyItem,
  HeroBannerImageTextItem,
  HeroBannerImageTextProductsItem,
  HeroBannerItem,
  HeroBannerProductsOnlyItem,
} from "./HeroBanner.types";
import {
  createBackToSchoolItem,
  createGlowItem,
  createHeroBannerItems,
  createJapaneseSummerFestivalItem,
  createKeepShoppingItem,
} from "./fixtures";
import storyStyles from "./HeroBanner.stories.module.css";

const midnightStreetFood = new URL(
  "./assets/midnight-street-food.webp",
  import.meta.url,
).href;
const trendingSummer = new URL(
  "./assets/trending-summer.webp",
  import.meta.url,
).href;
const imageTextCampaignImage =
  "https://cdn.yamibuy.net/mkpl/0f94615a3c540269037bf32bb081cc4b_0x0.png?imgScale=1.13";
const imageTextProductsCampaignImage = new URL(
  "./assets/yuzu-chicken-ramen.webp",
  import.meta.url,
).href;
const freshippoFavorites = new URL(
  "./assets/freshippo-favorites.webp",
  import.meta.url,
).href;
const summerSkinCoolDown = new URL(
  "./assets/summer-skin-cool-down.webp",
  import.meta.url,
).href;
const imageTextProducts = [
  "https://cdn.yamibuy.net/item/06dd0cb48fe11d559e68a2ef40df18ea_542x542.webp",
  "https://cdn.yamibuy.net/item/e669174148231478a49d609a23daaaa8_542x542.webp",
  "https://cdn.yamibuy.net/item/436aa4bd5fe37fba8d44ad5166e479f9_757x757.webp",
] as const;
const saleImage = new URL("./assets/sale-image.webp", import.meta.url).href;
const greenTea = new URL("./assets/green-tea.webp", import.meta.url).href;
const buldakSnack = new URL("./assets/buldak-snack.webp", import.meta.url).href;
const turtleChips = new URL("./assets/turtle-chips.webp", import.meta.url).href;
const skinCare = new URL("./assets/skin-care.webp", import.meta.url).href;
const summerSnack = new URL(
  "./assets/summer-snack.webp",
  import.meta.url,
).href;
const summerDrink = new URL(
  "./assets/summer-drink.webp",
  import.meta.url,
).href;

const copy = {
  zh: {
    ariaLabel: "精选活动",
    previousLabel: "上一组活动",
    nextLabel: "下一组活动",
    items: [
      ["午夜街头美食", "探索亚洲夜市风味"],
      ["今夏人气精选", "发现你的夏日新宠"],
      ["亚米季节限定优惠", ""],
      ["盒马人气同款", "国货好味 一站购齐"],
      ["夏日肌肤清补凉", "护肤×个护 降温计划 7折起"],
    ],
  },
  en: {
    ariaLabel: "Featured promotions",
    previousLabel: "Previous promotions",
    nextLabel: "Next promotions",
    items: [
      ["Midnight Street Food", "Explore Asian night bites"],
      ["Trending this Summer", "Discover your new summer favorites"],
      ["YAMI seasonal sale", ""],
      ["Freshippo Favorites", "Chinese flavors, all in one place"],
      ["Summer Skin Cool-Down", "Skin care × personal care, 30% off and up"],
    ],
  },
} as const;

type HeroLocale = keyof typeof copy;

function localeFromGlobals(value: unknown): HeroLocale {
  return value === "en" ? "en" : "zh";
}

function createPage(locale: HeroLocale): [
  HeroBannerImageTextProductsItem,
  HeroBannerImageTextProductsItem,
  HeroBannerImageOnlyItem,
  HeroBannerImageTextItem,
  HeroBannerImageTextProductsItem,
  HeroBannerImageTextProductsItem,
] {
  const localeCopy = copy[locale];
  const products = [
    { src: greenTea, alt: locale === "zh" ? "瓶装绿茶" : "Bottled green tea" },
    { src: buldakSnack, alt: locale === "zh" ? "火鸡味零食" : "Spicy snack" },
    { src: turtleChips, alt: locale === "zh" ? "乌龟玉米脆片" : "Corn chips" },
  ];

  return [
    {
      id: "midnight-street-food",
      href: "/campaigns/midnight-street-food",
      image: {
        src: midnightStreetFood,
        alt:
          locale === "zh"
            ? "亚洲夜市食品与饮料"
            : "Asian street food and drinks",
      },
      title: localeCopy.items[0][0],
      description: localeCopy.items[0][1],
      backgroundColor: "#FFD4B4",
      products,
    },
    {
      id: "trending-summer",
      href: "/campaigns/trending-summer",
      image: {
        src: trendingSummer,
        alt:
          locale === "zh"
            ? "夏日饮品与零食"
            : "Summer drinks and snacks",
      },
      title: localeCopy.items[1][0],
      description: localeCopy.items[1][1],
      backgroundColor: "#E6E2FB",
      products: [
        { src: skinCare, alt: locale === "zh" ? "夏日护肤品" : "Summer skin care" },
        {
          src: summerSnack,
          alt: locale === "zh" ? "夏日限定零食" : "Summer snack",
        },
        {
          src: summerDrink,
          alt: locale === "zh" ? "水果饮料" : "Fruit drink",
        },
      ],
    },
    {
      id: "seasonal-sale",
      href: "/campaigns/seasonal-sale",
      image: {
        src: saleImage,
        alt: localeCopy.items[2][0],
      },
    },
    createBackToSchoolItem(locale, "/campaigns/back-to-school"),
    createGlowItem(locale, "/campaigns/glow-skin-like-makeup"),
    createJapaneseSummerFestivalItem(locale, "/campaigns/japanese-summer-festival"),
  ];
}

/**
 * Shared with the EcommerceHome page — one lineup, so the Showcase and the page
 * template cannot drift. `createVariantItems` below stays local: it is the card
 * *catalogue* the four single-card stories index into, not a rail anyone ships.
 */
function createItems(locale: HeroLocale): HeroBannerItem[] {
  return createHeroBannerItems(locale, (slug) =>
    slug === "keep-shopping" ? "/collections/keep-shopping" : `/campaigns/${slug}`,
  );
}

function createVariantItems(locale: HeroLocale): [
  HeroBannerImageOnlyItem,
  HeroBannerImageTextItem,
  HeroBannerImageTextProductsItem,
  HeroBannerProductsOnlyItem,
  HeroBannerImageTextItem,
  HeroBannerImageTextProductsItem,
  HeroBannerImageTextProductsItem,
] {
  const page = createPage(locale);
  const { products: _textProducts, ...imageTextBase } = page[1];
  const imageText = {
    ...imageTextBase,
    image: {
      src: imageTextCampaignImage,
      alt:
        locale === "zh"
          ? "Trip.com 与 YAMI 夏日旅行活动"
          : "Trip.com and YAMI summer travel campaign",
    },
  };
  const imageTextProductsItem = {
    ...page[0],
    image: {
      src: imageTextProductsCampaignImage,
      alt:
        locale === "zh"
          ? "柚子鸡拉面、苹果醋饮品与巧克力零食"
          : "Yuzu chicken ramen, apple cider vinegar drink, and chocolate snacks",
    },
    products: imageTextProducts.map((src, index) => ({
      src,
      alt:
        index === 0
          ? locale === "zh"
            ? "面乐日式豚骨拉面"
            : "Menraku Japanese tonkotsu ramen"
          : index === 1
            ? locale === "zh"
              ? "苹果芒果味木糖醇无糖糖果"
              : "Apple mango xylitol sugar-free candy"
            : locale === "zh"
              ? "八女抹茶拿铁"
              : "Yame matcha latte",
    })),
  };
  const productsOnly = createKeepShoppingItem(
    locale,
    "/collections/keep-shopping",
  );

  // page[3..5] are authored campaigns mirrored from production rather than
  // derived from a products card, so they carry their own artwork and copy.
  return [
    page[2],
    imageText,
    imageTextProductsItem,
    productsOnly,
    page[3],
    page[4],
    page[5],
  ];
}

function createAdditionalVariantItems(
  locale: HeroLocale,
): HeroBannerImageTextProductsItem[] {
  const localeCopy = copy[locale];

  return [
    {
      id: "freshippo-favorites",
      href: "/campaigns/freshippo-favorites",
      image: {
        src: freshippoFavorites,
        alt:
          locale === "zh"
            ? "盒马低 GI 零食与饼干组合"
            : "Freshippo low-GI snacks and biscuits",
      },
      title: localeCopy.items[3][0],
      description: localeCopy.items[3][1],
      backgroundColor: "#BFEAFF",
      products: [
        {
          src: "https://cdn.yamibuy.net/item/b62f84cc24083390bb8ed6a7794e5ba0_542x542.webp",
          alt:
            locale === "zh"
              ? "盒马南瓜籽酥"
              : "Freshippo pumpkin seed crisps",
        },
        {
          src: "https://cdn.yamibuy.net/item/709e81859b013026dff46b0ff1aef79b_542x542.webp",
          alt:
            locale === "zh"
              ? "盒马泡椒脆笋尖"
              : "Freshippo bamboo shoots with pickled pepper",
        },
        {
          src: "https://cdn.yamibuy.net/item/5a1ed9f189bd4881c0b09014d664f9a5_542x542.webp",
          alt:
            locale === "zh" ? "100% 椰子水" : "100% coconut water",
        },
      ],
    },
    {
      id: "summer-skin-cool-down",
      href: "/campaigns/summer-skin-cool-down",
      image: {
        src: summerSkinCoolDown,
        alt:
          locale === "zh"
            ? "夏日防晒与护肤产品组合"
            : "Summer sunscreen and skin care collection",
      },
      title: localeCopy.items[4][0],
      description: localeCopy.items[4][1],
      backgroundColor: "#FFF1C2",
      products: [
        {
          src: "https://cdn.yamibuy.net/item/73839fa5d48dbad015e4d937a3190971_542x542.webp",
          alt:
            locale === "zh"
              ? "绿色舒缓紧致精华爽肤水"
              : "Green soothing and firming essence toner",
        },
        {
          src: "https://cdn.yamibuy.net/item/938625d20bc36705ca9fd1cf49250598_542x542.webp",
          alt:
            locale === "zh"
              ? "灰绿色泵装柔顺 SPA 洗发水"
              : "Sage green smoothing spa shampoo",
        },
        {
          src: "https://cdn.yamibuy.net/item/8482ead2ec474d193221450d79a36bf6_542x542.webp",
          alt:
            locale === "zh"
              ? "黄色泵装清爽沐浴清洁产品"
              : "Yellow pump bottle refreshing body cleanser",
        },
      ],
    },
  ];
}

const meta = {
  title: "YAMI/Components/Commerce/Hero Banner",
  component: HeroBanner,
  subcomponents: {
    HeroBannerImageOnlyCard,
    HeroBannerImageTextCard,
    HeroBannerImageTextProductsCard,
    HeroBannerProductsOnlyCard,
  },
  decorators: [
    (Story) => (
      <div className={storyStyles.canvas}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "One responsive YAMI campaign banner. Mobile uses fixed 320×360 cards in a native swipe rail; PC pages two, three, or four equal 8:9 cards according to the viewport.",
      },
    },
  },
  argTypes: {
    dividerPosition: {
      options: ["top", "bottom", "none"],
      control: { type: "radio" },
      description: "Desktop-only section divider edge; ignored below 1024px.",
    },
    dividerVariant: {
      options: ["gray", "black"],
      control: { type: "radio" },
      description: "Gray renders at 1px; black emphasis renders at 2px.",
    },
  },
  args: {
    items: createItems("en"),
    ariaLabel: "Featured promotions",
    previousLabel: "Previous promotions",
    nextLabel: "Next promotions",
    dividerPosition: "none",
    dividerVariant: "gray",
  },
} satisfies Meta<typeof HeroBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Showcase: Story = {
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <HeroBanner
        {...args}
        items={createItems(locale)}
        ariaLabel={copy[locale].ariaLabel}
        previousLabel={copy[locale].previousLabel}
        nextLabel={copy[locale].nextLabel}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const copyRegion = canvasElement.querySelector<HTMLElement>(
      '[data-hero-banner-content="products-only"] [data-slot="hero-banner-copy"]',
    );
    if (!copyRegion) {
      throw new Error("Products Only copy region did not render");
    }

    const style = getComputedStyle(copyRegion);
    if (style.flexGrow !== "1" || style.justifyContent !== "center") {
      throw new Error(
        "Products Only copy region must fill its available height and center the title vertically",
      );
    }
    if (
      Number.parseFloat(style.paddingTop) -
        Number.parseFloat(style.paddingBottom) !==
      4
    ) {
      throw new Error("Products Only copy region must add 4px of top padding");
    }

    const title = copyRegion.querySelector<HTMLElement>("span");
    if (!title) {
      throw new Error("Products Only title did not render");
    }
    const copyRect = copyRegion.getBoundingClientRect();
    const titleRect = title.getBoundingClientRect();
    const centerOffset =
      titleRect.top +
      titleRect.height / 2 -
      (copyRect.top + copyRect.height / 2);
    if (Math.abs(centerOffset - 2) > 1) {
      throw new Error("Products Only title is not vertically centered");
    }

    const lightCard = canvasElement.querySelector<HTMLElement>(
      '[data-slot="hero-banner-item"][data-foreground="light"]',
    );
    const lightSurface = lightCard
      ?.querySelector<HTMLElement>('[data-slot="hero-banner-copy"]')
      ?.parentElement;
    if (
      !lightCard ||
      !lightSurface ||
      getComputedStyle(lightCard).color !== "rgb(255, 255, 255)"
    ) {
      throw new Error("Light Hero Banner campaigns must render white copy");
    }

    const serializedSurface = getComputedStyle(lightSurface).backgroundColor;
    const channels = serializedSurface
      .match(/[\d.]+/g)
      ?.slice(0, 3)
      .map(Number);
    if (!channels || channels.length !== 3) {
      throw new Error("Light Hero Banner surface color could not be measured");
    }
    const normalizedChannels = serializedSurface.startsWith("color(srgb")
      ? channels
      : channels.map((channel) => channel / 255);
    const luminance = normalizedChannels
      .map((channel) =>
        channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4,
      )
      .reduce(
        (sum, channel, index) =>
          sum + channel * [0.2126, 0.7152, 0.0722][index],
        0,
      );
    const contrast = 1.05 / (luminance + 0.05);
    if (contrast < 4.5) {
      throw new Error(
        `Light Hero Banner copy must retain 4.5:1 contrast, measured ${contrast.toFixed(2)}:1`,
      );
    }
  },
};

export const BlackBottomDivider: Story = {
  args: {
    dividerPosition: "bottom",
    dividerVariant: "black",
  },
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <HeroBanner
        {...args}
        items={createItems(locale)}
        ariaLabel={copy[locale].ariaLabel}
        previousLabel={copy[locale].previousLabel}
        nextLabel={copy[locale].nextLabel}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="hero-banner"]',
    );
    if (!root) throw new Error("Hero Banner did not render");
    const style = getComputedStyle(root);
    if (style.borderBottomWidth !== "2px" || style.borderTopWidth !== "0px") {
      throw new Error("Hero Banner black divider must render 2px on the bottom only");
    }
  },
};

export const MobileDividerDisabled: Story = {
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  args: {
    dividerPosition: "bottom",
    dividerVariant: "black",
  },
  render: BlackBottomDivider.render,
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="hero-banner"]',
    );
    if (!root) throw new Error("Hero Banner did not render");
    const style = getComputedStyle(root);
    if (style.borderBottomWidth !== "0px" || style.borderTopWidth !== "0px") {
      throw new Error("Hero Banner must not render dividers below 1024px");
    }
  },
};

export const ContentVariants: Story = {
  render: (_args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <HeroBanner
        items={[
          ...createVariantItems(locale),
          ...createAdditionalVariantItems(locale),
        ]}
        ariaLabel={copy[locale].ariaLabel}
        previousLabel={copy[locale].previousLabel}
        nextLabel={copy[locale].nextLabel}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const root = canvasElement.querySelector<HTMLElement>(
      '[data-slot="hero-banner"]',
    );
    const list = canvasElement.querySelector<HTMLElement>(
      '[data-slot="hero-banner-list"]',
    );
    if (!root || !list) {
      throw new Error("Hero Banner mobile rail did not render");
    }

    const viewportWidth =
      canvasElement.ownerDocument.defaultView?.innerWidth ?? 0;
    if (viewportWidth >= 1024) return;

    const rootRect = root.getBoundingClientRect();
    const listRect = list.getBoundingClientRect();
    if (
      Math.abs(listRect.left - rootRect.left) > 1 ||
      Math.abs(listRect.right - rootRect.right) > 1
    ) {
      throw new Error(
        "Hero Banner mobile rail must extend to both component edges without clipping",
      );
    }

    const productsOnly = canvasElement.querySelector<HTMLElement>(
      '[data-hero-banner-content="products-only"]',
    );
    if (
      !productsOnly ||
      getComputedStyle(productsOnly.parentElement!).display !== "none"
    ) {
      throw new Error(
        "Products Only Hero Banner must be hidden on mobile",
      );
    }
  },
};

export const ImageOnlyCard: Story = {
  name: "Image Only",
  render: (_args, { globals }) => {
    const [item] = createVariantItems(localeFromGlobals(globals.locale));
    return (
      <div className={storyStyles.cardPreview}>
        <HeroBannerImageOnlyCard item={item} priority />
      </div>
    );
  },
};

export const ImageTextCard: Story = {
  name: "Image with Text",
  render: (_args, { globals }) => {
    const [, item] = createVariantItems(localeFromGlobals(globals.locale));
    return (
      <div className={storyStyles.cardPreview}>
        <HeroBannerImageTextCard item={item} priority />
      </div>
    );
  },
};

export const ImageTextProductsCard: Story = {
  name: "Image with Text and Products",
  render: (_args, { globals }) => {
    const [, , item] = createVariantItems(
      localeFromGlobals(globals.locale),
    );
    return (
      <div className={storyStyles.cardPreview}>
        <HeroBannerImageTextProductsCard item={item} priority />
      </div>
    );
  },
};

export const ProductsOnlyCard: Story = {
  name: "Products Only",
  parameters: {
    docs: {
      description: {
        story:
          'This card declares no surface of its own — inside `HeroBanner` it borrows a sibling\'s artwork and samples it, landing on exactly the colour that sibling paints. Rendered standalone there is no list to borrow from, so the story supplies a flat colour instead.',
      },
    },
  },
  render: (_args, { globals }) => {
    const [, , , item] = createVariantItems(
      localeFromGlobals(globals.locale),
    );
    return (
      <div className={storyStyles.cardPreview}>
        <HeroBannerProductsOnlyCard item={item} borrowedSurface={{ color: "#E8F1D8" }} />
      </div>
    );
  },
};

/* Verifies the auto-advance loop. The interval is dialled down from the 5s
 * default so the assertion does not sit waiting, and the story stays out of
 * the sidebar: a rail that jumps every 300ms is a test rig, not something to
 * browse. */
export const AutoAdvanceLoop: Story = {
  tags: ["!dev", "!autodocs"],
  args: { autoAdvanceInterval: 0.3 },
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <HeroBanner
        {...args}
        items={createItems(locale)}
        ariaLabel={copy[locale].ariaLabel}
        previousLabel={copy[locale].previousLabel}
        nextLabel={copy[locale].nextLabel}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const rail = canvasElement.querySelector<HTMLElement>(
      '[data-slot="hero-banner-list"]',
    );
    if (!rail) throw new Error("Hero Banner rail did not render");
    if (document.hidden) {
      throw new Error(
        "Auto-advance is suppressed on a hidden page, so this cannot be verified here",
      );
    }

    const [first, second] = Array.from(rail.children) as HTMLElement[];
    const itemStep = second.offsetLeft - first.offsetLeft;
    const originalCards = Array.from(rail.children).filter(
      (child) => !(child as HTMLElement).dataset.loopClone,
    ).length;
    const settle = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    // One card per tick, not a whole page.
    rail.scrollTo({ left: 0, behavior: "instant" });
    await settle(600);
    const advanced = rail.scrollLeft;
    if (Math.abs(advanced - itemStep) > itemStep * 0.5) {
      throw new Error(
        `Auto-advance must move one card (${itemStep}px), moved ${advanced}px`,
      );
    }

    // The loop is seamless, not a rewind: a second copy of the cards follows
    // the first, and once a scroll settles past that copy's start the rail
    // slides back by exactly its width, landing on the identical position.
    // Parking one card short of the copy boundary and letting one tick carry
    // it across must therefore leave the rail near the start, having travelled
    // forwards the whole time.
    const setWidth = itemStep * originalCards;
    if (rail.scrollWidth < setWidth * 1.5) {
      throw new Error(
        `Looping rail must render a second copy of the cards, scrollWidth ${rail.scrollWidth}px vs a set of ${setWidth}px`,
      );
    }
    rail.scrollTo({ left: setWidth - itemStep, behavior: "instant" });
    await settle(1200);
    if (rail.scrollLeft >= setWidth - itemStep) {
      throw new Error(
        `Crossing the copy boundary must rebase to the first copy, sat at ${rail.scrollLeft}px of a ${setWidth}px set`,
      );
    }

    // Hovering holds it still — a card must not slide out from under a reader.
    // The tolerance is half a card rather than a pixel: the wrap above is
    // still settling here, and what matters is that no advance happens.
    rail.dispatchEvent(new PointerEvent("pointerenter", { bubbles: false }));
    rail.scrollTo({ left: 0, behavior: "instant" });
    await settle(700);
    if (rail.scrollLeft > itemStep * 0.5) {
      throw new Error(
        `Auto-advance must pause while hovered, moved to ${rail.scrollLeft}px`,
      );
    }
    rail.dispatchEvent(new PointerEvent("pointerleave", { bubbles: false }));
  },
};

/* The counter names where the reader is in the list, so it has to follow the
 * card at the left edge. Auto-advance is off here: nothing should move except
 * the scrolls this asserts on. Hidden from the sidebar — it is a test rig. */
export const CounterTracksLeftmostCard: Story = {
  tags: ["!dev", "!autodocs"],
  args: { autoAdvance: false },
  render: (args, { globals }) => {
    const locale = localeFromGlobals(globals.locale);
    return (
      <HeroBanner
        {...args}
        items={createItems(locale)}
        ariaLabel={copy[locale].ariaLabel}
        previousLabel={copy[locale].previousLabel}
        nextLabel={copy[locale].nextLabel}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const rail = canvasElement.querySelector<HTMLElement>(
      '[data-slot="hero-banner-list"]',
    );
    const counter = canvasElement.querySelector<HTMLElement>(
      '[data-slot="hero-banner-progress"]',
    );
    const fill = canvasElement.querySelector<HTMLElement>(
      '[data-slot="hero-banner-progress-fill"]',
    );
    if (!rail || !counter || !fill) {
      throw new Error("Hero Banner rail or counter did not render");
    }

    const [first, second] = Array.from(rail.children) as HTMLElement[];
    const itemStep = second.offsetLeft - first.offsetLeft;
    const total = rail.children.length;
    const settle = () =>
      new Promise((resolve) => setTimeout(resolve, 120));

    for (const index of [0, 1, 2, 4]) {
      rail.scrollTo({ left: index * itemStep, behavior: "instant" });
      await settle();
      const expected = `${index + 1} / ${total}`;
      if (counter.textContent?.trim() !== expected) {
        throw new Error(
          `Card ${index + 1} at the left edge must read "${expected}", read "${counter.textContent?.trim()}"`,
        );
      }
      const expectedFill = `${(((index + 1) / total) * 100).toFixed(4)}%`;
      if (fill.style.width !== expectedFill) {
        throw new Error(
          `Progress fill must track the counter at ${expectedFill}, was ${fill.style.width}`,
        );
      }
    }
  },
};
