import { useState, type CSSProperties } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, waitFor } from "storybook/test";

import {
  FilterChip,
  FilterChipGroup,
  FilterChipMenu,
} from "./FilterChip";

const arrowDownUrl = new URL(
  "../../assets/icons/system/arrow-down.svg",
  import.meta.url,
).href;
const filterUrl = new URL(
  "../../assets/icons/action/filter.svg",
  import.meta.url,
).href;
const yamiLogoUrl = new URL(
  "../../assets/logos/yami-icon-fill.svg",
  import.meta.url,
).href;

const meta = {
  title: "YAMI/Components/Forms/FilterChip",
  component: FilterChip,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Interactive 36px filter pills with filled and outlined treatments, optional leading/trailing icons, custom popup menus, and a horizontally scrollable group.",
      },
    },
  },
  argTypes: {
    variant: { control: "inline-radio", options: ["filled", "outlined"] },
    selected: { control: "boolean" },
  },
  args: {
    children: "Category",
    variant: "outlined",
    selected: false,
  },
} satisfies Meta<typeof FilterChip>;

export default meta;
type Story = StoryObj<typeof meta>;

const stackStyle: CSSProperties = {
  display: "grid",
  gap: "var(--space-300)",
  width: "min(960px, 100%)",
  fontFamily: "var(--font-family-ios)",
};

const icon12 = <img src={arrowDownUrl} alt="" width={12} height={12} />;

function PopularFilterDemo() {
  const [selected, setSelected] = useState(false);

  return (
    <FilterChip
      data-demo="popular"
      variant="filled"
      selected={selected}
      onClick={() => setSelected((current) => !current)}
      leftIcon={<img src={yamiLogoUrl} alt="" width={16} height={16} />}
    >
      Hot
    </FilterChip>
  );
}

function ProductFilterDemo() {
  const [selected, setSelected] = useState(false);

  return (
    <FilterChip
      data-demo="product-filter"
      selected={selected}
      onClick={() => setSelected((current) => !current)}
    >
      In Stock
    </FilterChip>
  );
}

function ProductFilterGroupDemo() {
  const [sort, setSort] = useState("featured");

  return (
    <FilterChipGroup aria-label="Product filters">
      <FilterChip
        leftIcon={<img src={filterUrl} alt="" width={16} height={16} />}
      >
        Filters
      </FilterChip>
      <FilterChipMenu
        label="Sort by"
        popupAriaLabel="Product sort options"
        selectionMode="single"
        value={sort}
        onValueChange={setSort}
        rightIcon={icon12}
        options={[
          { label: "Sort by", value: "featured" },
          { label: "Price: Low to high", value: "price-low" },
        ]}
      />
      <FilterChip rightIcon={icon12}>Category</FilterChip>
      <ProductFilterDemo />
    </FilterChipGroup>
  );
}

function MenuDemo() {
  const [sort, setSort] = useState("featured");
  const [services, setServices] = useState<string[]>([]);

  return (
    <FilterChipGroup aria-label="Popup filters">
      <FilterChipMenu
        label="Sort by"
        popupAriaLabel="Sort results"
        selectionMode="single"
        value={sort}
        onValueChange={setSort}
        rightIcon={icon12}
        options={[
          { label: "Featured", value: "featured" },
          { label: "Best Seller", value: "best-seller" },
          { label: "Popularity", value: "popularity" },
          { label: "Most Reviews", value: "reviews" },
          { label: "Most Ratings", value: "ratings" },
          { label: "Newest", value: "newest" },
          { label: "Price: high to low", value: "price-high" },
          { label: "Price: low to high", value: "price-low" },
        ]}
      />
      <FilterChipMenu
        label="Offers"
        popupAriaLabel="Offer filters"
        selectionMode="multiple"
        value={services}
        onValueChange={setServices}
        clearLabel="Clear"
        applyLabel={`Show ${services.length || 2} results`}
        rightIcon={icon12}
        options={[
          { label: "On Sale", value: "sale" },
          { label: "VVIP Price", value: "vvip" },
        ]}
      />
    </FilterChipGroup>
  );
}

export const Showcase: Story = {
  render: () => (
    <div style={stackStyle}>
      <FilterChipGroup aria-label="Popular filters">
        <PopularFilterDemo />
        <FilterChip variant="filled" selected={false}>
          Tea Drinks
        </FilterChip>
      </FilterChipGroup>

      <ProductFilterGroupDemo />

      <MenuDemo />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const popular = canvasElement.querySelector<HTMLButtonElement>(
      '[data-demo="popular"]',
    );
    const productFilter = canvasElement.querySelector<HTMLButtonElement>(
      '[data-demo="product-filter"]',
    );
    const groups = canvasElement.querySelectorAll(
      '[data-slot="filter-chip-group"]',
    );
    const chips = canvasElement.querySelectorAll<HTMLElement>(
      '[data-slot="filter-chip"]',
    );

    if (
      !popular ||
      !productFilter ||
      canvasElement.querySelector("select") ||
      groups.length !== 3 ||
      chips.length !== 8
    ) {
      throw new Error("FilterChip Showcase did not render its full family");
    }

    for (const group of groups) {
      const style = getComputedStyle(group);
      if (
        style.paddingTop !== "4px" ||
        style.paddingBottom !== "4px" ||
        style.marginTop !== "-4px" ||
        style.marginBottom !== "-4px"
      ) {
        throw new Error("FilterChipGroup does not reserve focus-ring space");
      }
    }

    for (const chip of chips) {
      const style = getComputedStyle(chip);
      if (style.height !== "36px" || style.borderRadius !== "9999px") {
        throw new Error("FilterChip must retain its 36px pill geometry");
      }
    }

    await document.fonts.ready;
    const beforeRect = popular.getBoundingClientRect();
    const beforeLabelRect = popular
      .querySelector<HTMLElement>("span:last-child")
      ?.getBoundingClientRect();
    const beforeLabelOffset = beforeLabelRect
      ? {
          x: beforeLabelRect.x - beforeRect.x,
          y: beforeLabelRect.y - beforeRect.y,
        }
      : undefined;
    await userEvent.click(popular);
    await userEvent.unhover(popular);
    await waitFor(() => {
      const style = getComputedStyle(popular);
      const afterRect = popular.getBoundingClientRect();
      const afterLabelRect = popular
        .querySelector<HTMLElement>("span:last-child")
        ?.getBoundingClientRect();
      if (
        popular.getAttribute("aria-pressed") !== "true" ||
        style.backgroundColor !== "rgb(255, 255, 255)" ||
        style.borderWidth !== "1px" ||
        style.borderColor !== "rgba(0, 0, 0, 0)" ||
        style.boxShadow !== "rgba(0, 0, 0, 0.87) 0px 0px 0px 1px inset" ||
        afterRect.width !== beforeRect.width ||
        afterRect.height !== beforeRect.height ||
        Math.abs(
          (afterLabelRect ? afterLabelRect.x - afterRect.x : 0) -
            (beforeLabelOffset?.x ?? 0),
        ) > 0.01 ||
        Math.abs(
          (afterLabelRect ? afterLabelRect.y - afterRect.y : 0) -
            (beforeLabelOffset?.y ?? 0),
        ) > 0.01
      ) {
        throw new Error("FilterChip selected state shifts its content");
      }
    });

    await userEvent.click(productFilter);
    await userEvent.unhover(productFilter);
    await waitFor(() => {
      const style = getComputedStyle(productFilter);
      if (
        productFilter.getAttribute("aria-pressed") !== "true" ||
        style.backgroundColor !== "rgb(255, 255, 255)" ||
        style.boxShadow !== "rgba(0, 0, 0, 0.87) 0px 0px 0px 1px inset"
      ) {
        throw new Error("Outlined FilterChip selected state is not outlined");
      }
    });
  },
};

export const Playground: Story = {};

export const PopupMenus: Story = {
  render: () => <MenuDemo />,
  play: async ({ canvasElement }) => {
    const document = canvasElement.ownerDocument;
    const sortTrigger = [...canvasElement.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Sort by",
    );
    const offersTrigger = [...canvasElement.querySelectorAll("button")].find(
      (button) => button.textContent?.trim() === "Offers",
    );

    if (!sortTrigger || !offersTrigger) {
      throw new Error("FilterChip popup triggers did not render");
    }

    await userEvent.click(sortTrigger);
    await waitFor(() => {
      const popup = document.querySelector<HTMLElement>(
        '[data-slot="filter-chip-menu"][data-selection-mode="single"]',
      );
      if (!popup || getComputedStyle(popup).width !== "290px") {
        throw new Error("Single-select popup does not match the Figma width");
      }

      const optionList = popup.querySelector<HTMLElement>(
        '[data-filter-chip-menu-options="true"]',
      );
      if (!optionList) {
        throw new Error("Single-select popup option list did not render");
      }

      const optionListStyle = getComputedStyle(optionList);
      if (
        optionListStyle.fontSize !== "14px" ||
        optionListStyle.paddingTop !== "8px" ||
        optionListStyle.paddingRight !== "8px" ||
        optionListStyle.paddingBottom !== "8px" ||
        optionListStyle.paddingLeft !== "8px"
      ) {
        throw new Error("FilterChip popup option list density is incorrect");
      }
    });

    const bestSeller = [...document.querySelectorAll("label")].find(
      (label) => label.textContent?.trim() === "Best Seller",
    );
    if (!bestSeller) throw new Error("Single-select options did not render");
    await userEvent.click(bestSeller);
    await waitFor(() => {
      if (sortTrigger.getAttribute("aria-expanded") !== "false") {
        throw new Error("Single-select popup did not close after selection");
      }
    });

    await userEvent.click(offersTrigger);
    const onSale = await waitFor(() => {
      const popup = document.querySelector<HTMLElement>(
        '[data-slot="filter-chip-menu"][data-selection-mode="multiple"]',
      );
      const optionList = popup?.querySelector<HTMLElement>(
        '[data-filter-chip-menu-options="true"]',
      );
      if (!optionList || getComputedStyle(optionList).fontSize !== "14px") {
        throw new Error("Multiple-select popup option typography is incorrect");
      }

      const option = [...document.querySelectorAll("label")].find(
        (label) => label.textContent?.trim() === "On Sale",
      );
      if (!option) throw new Error("Multiple-select options did not render");
      return option;
    });
    await userEvent.click(onSale);
    const apply = [...document.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("Show"),
    );
    if (!apply) throw new Error("Multiple-select footer did not render");
    const footer = apply.closest<HTMLElement>('[data-filter-chip-menu-footer="true"]');
    const footerStyle = footer ? getComputedStyle(footer) : undefined;
    if (
      getComputedStyle(apply).height !== "40px" ||
      getComputedStyle(apply).flexGrow !== "0" ||
      footerStyle?.justifyContent !== "space-between" ||
      footerStyle?.paddingTop !== "8px" ||
      footerStyle.paddingBottom !== "8px"
    ) {
      throw new Error("Multiple-select footer sizing is incorrect");
    }
    await userEvent.click(apply);
    await waitFor(() => {
      if (
        offersTrigger.getAttribute("aria-expanded") !== "false" ||
        offersTrigger.getAttribute("aria-pressed") !== "true"
      ) {
        throw new Error("Multiple-select value was not committed");
      }
    });
  },
};
