/* @vitest-environment happy-dom */

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createSearchResultsFixture } from "./fixtures";
import { SearchResultsPage } from "./SearchResultsPage";
import type { SearchResultsRequestState } from "./SearchResultsPage.types";

describe("SearchResultsPage controlled interaction Interface", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  it("reports search and pagination changes without owning host routing", async () => {
    const fixture = createSearchResultsFixture("en");
    const request: SearchResultsRequestState = {
      query: "matcha powder",
      page: 1,
      sort: "featured",
      categoryIds: [],
    };
    const onRequestChange = vi.fn();
    await act(async () => root.render(
      <SearchResultsPage
        {...fixture}
        footer={undefined}
        interaction={{ request, pageCount: 67, onRequestChange }}
      />,
    ));

    const mobileSearch = container.querySelector<HTMLFormElement>(
      '[data-slot="search-results-mobile-header"] form[role="search"]',
    )!;
    const input = mobileSearch.querySelector<HTMLInputElement>('input[type="search"]')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, "ramen");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () => {
      mobileSearch.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(onRequestChange).toHaveBeenLastCalledWith({
      ...request,
      query: "ramen",
      page: 1,
    });

    const pageTwo = Array.from(container.querySelectorAll<HTMLButtonElement>(
      '[data-slot="search-results-pagination"] button',
    )).find((button) => button.textContent === "2")!;
    await act(async () => pageTwo.click());

    expect(onRequestChange).toHaveBeenLastCalledWith({ ...request, page: 2 });
  });
});
