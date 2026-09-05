import { useLayoutEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { RailNavigation } from "../Button/RailNavigation";
import { ProductCard } from "../ProductCard";
import {
  createProductListProducts,
  type ProductListLocale,
} from "../ProductList/fixtures";

import { HorizontalScrollList } from "./HorizontalScrollList";
import storyStyles from "./HorizontalScrollList.stories.module.css";
import { useHorizontalScrollList } from "./useHorizontalScrollList";

const meta = {
  title: "YAMI/Components/Commerce/Product List/Horizontal Scroll List",
  component: HorizontalScrollList,
  decorators: [
    (Story, context) => (
      <div
        className={storyStyles.canvas}
        data-slot="horizontal-scroll-list-canvas"
        data-surface={context.args.surface ?? "plain"}
      >
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Polymorphic finite horizontal list with native scrolling, hidden scrollbars, item snapping, and a shared controller hook for paging controls.",
      },
    },
  },
  args: {
    as: "ul",
    enabled: true,
    surface: "plain",
  },
  argTypes: {
    as: {
      options: ["div", "ul", "ol"],
      control: { type: "select" },
    },
    enabled: { control: "boolean" },
    surface: {
      options: ["card", "plain"],
      control: { type: "inline-radio" },
    },
    children: { control: false },
  },
} satisfies Meta<typeof HorizontalScrollList>;

export default meta;
type Story = StoryObj<typeof meta>;

function Example({
  enabled = true,
  locale,
  surface,
  navigation = "top",
}: {
  navigation?: "top" | "sides";
  enabled?: boolean;
  locale: ProductListLocale;
  surface: "card" | "plain";
}) {
  const products = createProductListProducts(locale);
  const previousLabel = locale === "en" ? "Previous products" : "上一组商品";
  const nextLabel = locale === "en" ? "Next products" : "下一组商品";
  const { listRef, state, updateState, scrollByPage } =
    useHorizontalScrollList({
      enabled,
      itemCount: products.length,
      minimumPageDistance: 152,
    });

  const frameRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const media = frame?.querySelector<HTMLElement>('[data-slot="product-card-media"]');
    if (!frame || !media || navigation !== "sides") return;
    const update = () => {
      const image = media.getBoundingClientRect();
      frame.style.setProperty("--navigation-top", `${image.top - frame.getBoundingClientRect().top + image.height / 2}px`);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frame);
    observer.observe(media);
    return () => observer.disconnect();
  }, [navigation]);

  return (
    <div
      ref={frameRef}
      data-navigation={navigation}
      className={storyStyles.frame}
      data-slot="horizontal-scroll-list-frame"
      data-surface={surface}
    >
      <div
        className={storyStyles.toolbar}
        data-slot="horizontal-scroll-list-toolbar"
      >
        <RailNavigation
          previousLabel={previousLabel}
          nextLabel={nextLabel}
          previousDisabled={state.atStart}
          nextDisabled={state.atEnd}
          onPrevious={() => scrollByPage(-1)}
          onNext={() => scrollByPage(1)}
        />
      </div>
      <HorizontalScrollList
        as="ul"
        ref={listRef}
        enabled={enabled}
        surface={surface}
        className={storyStyles.list}
        data-slot="horizontal-scroll-list"
        aria-label={locale === "en" ? "Featured products" : "精选商品"}
        onScroll={updateState}
      >
        {products.map(({ id, ...product }) => (
          <li key={id} className={storyStyles.item}>
            <ProductCard
              {...product}
              presentation="rich"
              surface={surface}
              onAddToCart={() => {}}
            />
          </li>
        ))}
      </HorizontalScrollList>
    </div>
  );
}

function assertResponsiveProductRail(
  canvasElement: HTMLElement,
  surface: "card" | "plain",
) {
  const list = canvasElement.querySelector<HTMLElement>(
    '[data-slot="horizontal-scroll-list"]',
  );
  const toolbar = canvasElement.querySelector<HTMLElement>(
    '[data-slot="horizontal-scroll-list-toolbar"]',
  );
  const storyCanvas = canvasElement.querySelector<HTMLElement>(
    '[data-slot="horizontal-scroll-list-canvas"]',
  );
  const frame = canvasElement.querySelector<HTMLElement>(
    '[data-slot="horizontal-scroll-list-frame"]',
  );
  const firstItem = list?.firstElementChild as HTMLElement | null;
  const firstCardContent = list?.querySelector<HTMLElement>(
    '[data-slot="product-card-content"]',
  );
  const firstCardImage = list?.querySelector<HTMLElement>(
    '[data-slot="product-card-image"]',
  );
  if (
    !list ||
    !toolbar ||
    !storyCanvas ||
    !frame ||
    !firstItem ||
    !firstCardContent ||
    !firstCardImage
  ) {
    throw new Error("Horizontal Scroll List did not render");
  }
  if (list.querySelectorAll('[data-slot="product-card"]').length !== 18) {
    throw new Error("Horizontal Scroll List must render the shared ProductCard fixture");
  }

  const listStyle = getComputedStyle(list);
  const toolbarStyle = getComputedStyle(toolbar);
  const canvasStyle = getComputedStyle(storyCanvas);
  const frameStyle = getComputedStyle(frame);
  const cardContentStyle = getComputedStyle(firstCardContent);
  const cardImageStyle = getComputedStyle(firstCardImage);
  const desktop = window.innerWidth >= 1024;
  if (
    list.dataset.horizontalScrollList !== "true" ||
    listStyle.overflowX !== "auto" ||
    listStyle.scrollbarWidth !== "none" ||
    list.tabIndex !== 0 ||
    list.scrollWidth <= list.clientWidth
  ) {
    throw new Error(
      "Horizontal Scroll List must expose the native, snapping scroll contract",
    );
  }

  const transparent = listStyle.backgroundColor === "rgba(0, 0, 0, 0)";
  if (
    list.dataset.surface !== surface ||
    (surface === "card" &&
      (!transparent || listStyle.borderRadius !== "0px")) ||
    (surface === "plain" &&
      (!transparent || listStyle.borderRadius !== "0px"))
  ) {
    throw new Error(`Horizontal Scroll List did not render the ${surface} surface`);
  }
  if (
    frameStyle.backgroundColor !== "rgba(0, 0, 0, 0)" ||
    frameStyle.borderRadius !== "0px"
  ) {
    throw new Error(
      "Horizontal Scroll List frame must not paint an outer panel",
    );
  }
  if (cardContentStyle.backgroundColor !== "rgba(0, 0, 0, 0)") {
    throw new Error("ProductCard content must remain transparent inside the rail");
  }
  if (
    surface === "card" &&
    cardImageStyle.backgroundColor !== "rgb(255, 255, 255)"
  ) {
    throw new Error("Background rail ProductCard images must render on white");
  }
  if (
    surface === "plain" &&
    canvasStyle.backgroundColor !== getComputedStyle(document.body).backgroundColor
  ) {
    throw new Error("Plain Horizontal Scroll List must render on the page background");
  }
  if (
    surface === "card" &&
    canvasStyle.backgroundColor === "rgba(0, 0, 0, 0)"
  ) {
    throw new Error(
      "Background Horizontal Scroll List must use its caller-provided canvas background",
    );
  }

  if (desktop) {
    const expectedPadding = surface === "card" ? "8px" : "0px";
    if (
      toolbarStyle.display !== "flex" ||
      listStyle.columnGap !== "8px" ||
      listStyle.paddingTop !== expectedPadding ||
      listStyle.paddingRight !== expectedPadding ||
      listStyle.paddingBottom !== expectedPadding ||
      listStyle.paddingLeft !== expectedPadding ||
      firstItem.getBoundingClientRect().width <= 152
    ) {
      throw new Error(
        "PC Horizontal Scroll List must show paging controls and use the responsive card-width ladder",
      );
    }
    return;
  }

  const expectedMobileGap = "8px";
  const expectedMobileBlockPadding = "8px";
  const expectedMobileInlinePadding = "8px";
  if (
    toolbarStyle.display !== "none" ||
    listStyle.columnGap !== expectedMobileGap ||
    listStyle.paddingTop !== expectedMobileBlockPadding ||
    listStyle.paddingRight !== expectedMobileInlinePadding ||
    listStyle.paddingBottom !== expectedMobileBlockPadding ||
    listStyle.paddingLeft !== expectedMobileInlinePadding ||
    firstItem.getBoundingClientRect().width !== 152
  ) {
    throw new Error(
      "Mobile Horizontal Scroll List must use touch scrolling, 152px cards, and 8px spacing",
    );
  }
}

export const Showcase: Story = {
  render: (args, { globals }) => (
    <Example
      enabled={args.enabled}
      locale={globals.locale === "en" ? "en" : "zh"}
      surface={args.surface}
    />
  ),
  play: async ({ args, canvasElement }) => {
    assertResponsiveProductRail(canvasElement, args.surface);
  },
};

export const WithBackground: Story = {
  name: "With Background",
  args: { surface: "card" },
  render: Showcase.render,
  play: Showcase.play,
};

export const WithoutBackground: Story = {
  name: "Without Background",
  args: { surface: "plain" },
  render: Showcase.render,
  play: Showcase.play,
};

export const PC: Story = {
  name: "PC · Top right navigation",
  globals: {
    viewport: { value: "yamiDesktopMd", isRotated: false },
  },
  render: Showcase.render,
  play: Showcase.play,
};

export const Mobile: Story = {
  globals: {
    viewport: { value: "yamiMobile", isRotated: false },
  },
  render: Showcase.render,
  play: Showcase.play,
};

export const Disabled: Story = {
  args: { enabled: false },
  render: (args, { globals }) => (
    <Example
      enabled={args.enabled}
      locale={globals.locale === "en" ? "en" : "zh"}
      surface={args.surface}
    />
  ),
  play: async ({ canvasElement }) => {
    const list = canvasElement.querySelector<HTMLElement>(
      '[data-slot="horizontal-scroll-list"]',
    );
    if (!list) throw new Error("Horizontal Scroll List did not render");
    if (
      list.dataset.horizontalScrollList !== "false" ||
      getComputedStyle(list).overflowX === "auto"
    ) {
      throw new Error("Disabled Horizontal Scroll List must not own scrolling");
    }
  },
};

export const PCSideNavigation: Story = {
  name: "PC · Side navigation",
  globals: PC.globals,
  render: (args, { globals }) => (
    <Example enabled={args.enabled} locale={globals.locale === "en" ? "en" : "zh"} surface={args.surface} navigation="sides" />
  ),
  play: async ({ args, canvasElement }) => {
    assertResponsiveProductRail(canvasElement, args.surface);
    const image = canvasElement.querySelector<HTMLElement>('[data-slot="product-card-media"]')!;
    const buttons = canvasElement.querySelectorAll<HTMLButtonElement>('[data-slot="horizontal-scroll-list-toolbar"] button');
    const rect = image.getBoundingClientRect();
    for (const button of buttons) {
      const bounds = button.getBoundingClientRect();
      if (Math.abs(bounds.top + bounds.height / 2 - rect.top - rect.height / 2) > 1) {
        throw new Error("Side navigation must align with the product image center");
      }
    }
    if (buttons[0].getAttribute("aria-disabled") !== "true") throw new Error("Previous must start disabled");
    buttons[1].click();
    await new Promise((resolve) => setTimeout(resolve, 500));
    const list = canvasElement.querySelector<HTMLElement>('[data-slot="horizontal-scroll-list"]')!;
    if (list.scrollLeft <= 0) throw new Error("Next must scroll the product rail");
  },
};
