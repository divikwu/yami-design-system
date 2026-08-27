import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { page } from "vitest/browser";

import { ProductReviewSection } from "@yami/design-system/components/ProductReviewSection";
import meta from "../../../packages/design-system/components/ProductReviewSection/ProductReviewSection.stories";
import "@yami/design-system/tokens.css";

test.each([375, 1440])("keeps summary photo frames stable during hover at %ipx", async (width) => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  try {
    await page.viewport(width, 900);
    flushSync(() => root.render(<ProductReviewSection {...meta.args} />));
    for (const image of container.querySelectorAll<HTMLImageElement>(
      '[data-slot="product-review-summary-photo-list"] img, [data-slot="product-review-content"] img',
    )) {
      const radius = width < 1024 && image.closest('[data-slot="product-review-summary-photo-list"]')
        ? "8px"
        : "4px";
      expect(getComputedStyle(image).borderRadius).toBe(radius);
      expect(getComputedStyle(image.parentElement!).borderRadius).toBe(radius);
    }
    const photo = container.querySelector<HTMLImageElement>(
      '[data-slot="product-review-summary-photo-list"] img',
    )!;
    const frame = photo.parentElement!;
    const expectedSize = width < 1024 ? 80 : 96;
    const before = frame.getBoundingClientRect();
    expect(before.width).toBe(expectedSize);
    expect(before.height).toBe(expectedSize);

    // Re-hover after any asynchronous layout change while waiting for the transition.
    await expect.poll(async () => {
      await page.elementLocator(photo).hover();
      return getComputedStyle(photo).transform;
    }).toBe(width < 1024 ? "none" : "matrix(1.12, 0, 0, 1.12, 0, 0)");
    expect(frame.getBoundingClientRect().toJSON()).toEqual(before.toJSON());

    await page.elementLocator(photo).unhover();
    await expect.poll(() => getComputedStyle(photo).transform).toBe("none");
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});
