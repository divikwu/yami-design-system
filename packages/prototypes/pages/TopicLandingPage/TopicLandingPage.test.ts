/* @vitest-environment happy-dom */

import { afterEach, describe, expect, it } from "vitest";

import {
  getTopicLandingActivationLine,
  resolveTopicLandingScrollRoot,
} from "./TopicLandingPage";

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
