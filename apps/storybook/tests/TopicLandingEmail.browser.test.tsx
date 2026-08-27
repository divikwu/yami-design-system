import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { page } from "vitest/browser";

import "@yami/design-system/styles/fonts.css";
import "@yami/design-system/tokens.css";
import "@yami/design-system/styles/base.css";
import { TopicLandingEmail } from "../../../packages/prototypes/pages/EmailTemplates/TopicLandingEmail";
import emailStory from "../../../packages/prototypes/pages/EmailTemplates/TopicLandingEmail.stories";

test.each([375, 680, 767, 768, 1280])("keeps email products in three vertical-card columns at %ipx", async (width) => {
  const originalViewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  try {
    await page.viewport(width, 900);
    flushSync(() => root.render(<TopicLandingEmail {...emailStory.args} />));
    await document.fonts.ready;
    const section = container.querySelector<HTMLElement>('[data-slot="topic-landing-email-products"]')!;
    const grid = section.querySelector<HTMLElement>("ul")!;
    const items = Array.from(grid.querySelectorAll("li"));

    expect(items).toHaveLength(6);
    expect(getComputedStyle(grid).gridTemplateColumns.split(" ")).toHaveLength(3);
    const positions = items.map((item) => item.getBoundingClientRect());
    expect(new Set(positions.map(({ top }) => top)).size).toBe(2);
    expect(new Set(positions.map(({ left }) => left)).size).toBe(3);
    for (const item of items) {
      const image = item.querySelector("img")!.getBoundingClientRect();
      const brand = item.querySelector('[data-slot="topic-landing-email-product-brand"]')!.getBoundingClientRect();
      expect(image.width).toBeGreaterThan(0);
      expect(Math.abs(image.width - image.height)).toBeLessThan(1);
      expect(brand.top).toBeGreaterThanOrEqual(image.bottom);
      expect(Math.abs(brand.left - image.left)).toBeLessThan(1);
    }
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(originalViewport.width, originalViewport.height);
  }
});
