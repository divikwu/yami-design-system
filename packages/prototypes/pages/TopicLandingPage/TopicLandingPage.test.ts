/* @vitest-environment happy-dom */

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getTopicLandingActivationLine,
  resolveTopicLandingScrollRoot,
  TopicLandingPage,
} from "./TopicLandingPage";
import { createTopicLandingPageFixture } from "./fixtures";

describe("TopicLandingPage scroll root", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("uses the nearest nested scroll container and falls back to window", () => {
    const scrollContainer = document.createElement("div");
    scrollContainer.style.overflowY = "auto";
    const page = document.createElement("div");
    const tabs = document.createElement("div");
    page.append(tabs);
    scrollContainer.append(page);
    document.body.append(scrollContainer);

    expect(resolveTopicLandingScrollRoot(tabs)).toBe(scrollContainer);

    scrollContainer.style.overflowY = "visible";
    expect(resolveTopicLandingScrollRoot(tabs)).toBe(window);
  });

  it("includes a nested scroll container border in the activation line", () => {
    const scrollContainer = document.createElement("div");
    Object.defineProperty(scrollContainer, "clientTop", { value: 1 });
    scrollContainer.getBoundingClientRect = () =>
      ({ top: 116 }) as DOMRect;

    expect(getTopicLandingActivationLine(scrollContainer, 56)).toBe(174);
    expect(getTopicLandingActivationLine(window, 56)).toBe(57);
  });
});

describe("TopicLandingPage Explore More pagination", () => {
  let container: HTMLDivElement;
  let root: Root;
  const fixture = createTopicLandingPageFixture("en");
  const products = (count: number) => Array.from({ length: count }, (_, index) => ({
    ...fixture.waterfall.products[0]!,
    id: `product-${index}`,
    title: `Product ${index}`,
  }));
  const visibleCount = () => container.querySelectorAll(
    '[data-page-slot="topic-landing-waterfall"] [data-slot="product-card"]',
  ).length;
  const loadMore = () => container.querySelector<HTMLButtonElement>(
    '[data-page-slot="topic-landing-waterfall"] [data-slot="product-list-load-more"] button',
  );

  async function renderProducts(count: number) {
    const items = products(count);
    await act(async () => root.render(createElement(TopicLandingPage, {
      ...fixture,
      showChrome: false,
      hiddenModules: ["hero", "shortcuts", "start-here", "popular-picks", "reviews"],
      waterfall: {
        ...fixture.waterfall,
        products: items,
        productsByTab: { all: items, category: products(63) },
        tabs: [{ value: "all", label: "All" }, { value: "category", label: "Category" }],
      },
    })));
  }

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    window.history.replaceState(null, "", "/");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("initially shows at most 60 products and offers remaining products", async () => {
    await renderProducts(61);
    expect(visibleCount()).toBe(60);
    expect(loadMore()).not.toBeNull();
  });

  it.each([0, 55, 60])("shows all %i products without a redundant Load more button", async (count) => {
    await renderProducts(count);
    expect(visibleCount()).toBe(count);
    expect(loadMore()).toBeNull();
  });

  it("adds 60 products at a time and removes Load more after the last batch", async () => {
    await renderProducts(121);
    expect(visibleCount()).toBe(60);

    await act(async () => loadMore()!.click());
    expect(visibleCount()).toBe(120);
    expect(loadMore()).not.toBeNull();

    await act(async () => loadMore()!.click());
    expect(visibleCount()).toBe(121);
    expect(loadMore()).toBeNull();
    const titles = Array.from(container.querySelectorAll(
      '[data-page-slot="topic-landing-waterfall"] [data-slot="product-card-summary"] p a',
    )).map((title) => title.textContent);
    expect(titles).toEqual(products(121).map(({ title }) => title));
  });

  it("keeps each category's pagination independent when switching tabs", async () => {
    await renderProducts(121);
    await act(async () => loadMore()!.click());

    const selectTab = async (label: string) => {
      const trigger = Array.from(container.querySelectorAll<HTMLButtonElement>(
        '[data-page-slot="topic-landing-waterfall"] [role="tab"]',
      )).find((tab) => tab.textContent === label)!;
      await act(async () => trigger.click());
    };

    await selectTab("Category");
    expect(visibleCount()).toBe(60);
    expect(loadMore()).not.toBeNull();
    await act(async () => loadMore()!.click());
    expect(visibleCount()).toBe(63);
    expect(loadMore()).toBeNull();

    await selectTab("All");
    expect(visibleCount()).toBe(120);
    expect(loadMore()).not.toBeNull();
  });
});
