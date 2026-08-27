import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test, vi } from "vitest";
import { cdp, page } from "vitest/browser";
import type {} from "@vitest/browser-playwright";
import { ProductMediaGallery } from "@yami/design-system/components/ProductMediaGallery";
import meta from "../../../packages/design-system/components/ProductMediaGallery/ProductMediaGallery.stories";
import "@yami/design-system/tokens.css";

const images = meta.args!.images!;

test("native touch snaps images without blocking vertical scrolling", async () => {
  const viewport = { width: innerWidth, height: innerHeight };
  const container = document.createElement("div");
  container.style.cssText = "width: 100%; height: 2000px";
  document.body.append(container);
  const root = createRoot(container);
  const changed = vi.fn();
  const session = cdp();
  try {
    await page.viewport(656, 900);
    await session.send("Emulation.setTouchEmulationEnabled", { enabled: true });
    flushSync(() => root.render(<ProductMediaGallery images={images} onIndexChange={changed} />));
    const gallery = container.querySelector<HTMLElement>('[data-slot="product-media-gallery"]')!;
    const rail = container.querySelector<HTMLElement>('[data-slot="product-media-gallery-rail"]')!;
    const box = rail.getBoundingClientRect();
    expect(box.width).toBe(container.clientWidth);
    expect(box.left - gallery.getBoundingClientRect().left).toBe(0);
    expect(box.top - gallery.getBoundingClientRect().top).toBe(8);
    expect(box.height).toBe(440);
    const slides = rail.querySelectorAll('[data-slot="product-media-gallery-slide"]');
    expect(slides[0].getBoundingClientRect().left - box.left).toBe(8);
    expect(getComputedStyle(rail).scrollPaddingInline).toBe("8px");
    expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
    expect(slides[0].getBoundingClientRect().width).toBe(440);
    expect(slides[0].getBoundingClientRect().height).toBe(440);
    expect(slides[1].getBoundingClientRect().left - slides[0].getBoundingClientRect().right).toBe(8);
    expect(getComputedStyle(slides[0]).borderRadius).toBe("8px");
    expect(slides[1].getBoundingClientRect().left).toBeLessThan(box.right);
    const swipe = async (xDistance: number, yDistance = 0) => {
      const rect = rail.getBoundingClientRect();
      await session.send("Input.synthesizeScrollGesture", {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        xDistance, yDistance, gestureSourceType: "touch", speed: 600,
      });
    };
    await swipe(-300);
    await expect.poll(() => gallery.dataset.activeIndex).toBe("1");
    await expect.poll(() => rail.scrollLeft).toBeCloseTo(448, 0);
    expect(changed).toHaveBeenLastCalledWith(1);
    expect(container.querySelector('[data-slot="product-media-gallery-counter"]')?.textContent).toBe("2 / 4");
    await swipe(300);
    await expect.poll(() => rail.scrollLeft).toBe(0);
    await expect.poll(() => gallery.dataset.activeIndex).toBe("0");
    await swipe(300);
    expect(gallery.dataset.activeIndex).toBe("0");
    const start = rail.getBoundingClientRect();
    const point = { x: start.left + 100, y: start.top + 300, id: 0 };
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    for (let step = 1; step <= 10; step++) {
      await session.send("Input.dispatchTouchEvent", {
        type: "touchMove", touchPoints: [{ ...point, y: point.y - step * 16 }],
      });
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => window.scrollY).toBeGreaterThan(60);
    expect(gallery.dataset.activeIndex).toBe("0");
  } finally {
    await session.send("Emulation.setTouchEmulationEnabled", { enabled: false });
    root.unmount();
    container.remove();
    window.scrollTo(0, 0);
    await page.viewport(viewport.width, viewport.height);
  }
});

test("preserves selection across resizing and handles single or empty galleries", async () => {
  const viewport = { width: innerWidth, height: innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  try {
    await page.viewport(375, 900);
    flushSync(() => root.render(<ProductMediaGallery images={images} defaultIndex={2} />));
    const gallery = container.querySelector<HTMLElement>('[data-slot="product-media-gallery"]')!;
    const rail = container.querySelector<HTMLElement>('[data-slot="product-media-gallery-rail"]')!;
    await expect.poll(() => rail.scrollLeft).toBeCloseTo(rail.clientWidth * 2, 0);
    expect(gallery.dataset.activeIndex).toBe("2");
    const thumbnails = container.querySelectorAll<HTMLButtonElement>('[data-slot="product-media-gallery-thumbnail"]');
    await page.elementLocator(thumbnails[3]!).click();
    await expect.poll(() => rail.scrollLeft).toBeCloseTo(rail.scrollWidth - rail.clientWidth, 0);
    rail.scrollTo({ left: 10000, behavior: "instant" });
    await expect.poll(() => rail.scrollLeft).toBeCloseTo(rail.scrollWidth - rail.clientWidth, 0);
    for (const width of [440, 441, 656, 923, 1023, 1024, 375]) {
      await page.viewport(width, 900);
      await expect.poll(() => rail.scrollLeft).toBeCloseTo(width < 1024 ? rail.scrollWidth - rail.clientWidth : 0, 0);
      expect(gallery.dataset.activeIndex).toBe("3");
      const inset = width > 440 && width < 1024 ? "8px" : "0px";
      expect(getComputedStyle(gallery).paddingTop).toBe(inset);
      expect(getComputedStyle(gallery).paddingLeft).toBe(inset);
      expect(getComputedStyle(gallery).paddingRight).toBe(inset);
      expect(getComputedStyle(gallery).paddingBottom).toBe("0px");
      if (width < 1024) {
        const gap = width > 440 ? 8 : 0;
        const imageWidth = width > 440 ? Math.min(rail.clientWidth - 48, 440) : rail.clientWidth;
        expect(rail.firstElementChild!.getBoundingClientRect().width).toBeCloseTo(imageWidth, 0);
        expect(rail.firstElementChild!.getBoundingClientRect().height).toBeCloseTo(imageWidth, 0);
        expect(getComputedStyle(rail).columnGap).toBe(`${gap}px`);
        expect(rail.scrollWidth).toBeCloseTo(imageWidth * images.length + gap * (images.length - 1) + gap * 2, 0);
        expect(rail.lastElementChild!.getBoundingClientRect().right).toBeCloseTo(rail.getBoundingClientRect().right - gap, 0);
        expect(rail.getBoundingClientRect().left).toBe(gallery.getBoundingClientRect().left);
        expect(rail.getBoundingClientRect().right).toBe(gallery.getBoundingClientRect().right);
        expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
        expect(container.querySelector('[data-slot="product-media-gallery-counter"]')?.textContent).toBe("4 / 4");
      }
    }
    await page.viewport(923, 900);
    await page.elementLocator(thumbnails[0]!).click();
    await expect.poll(() => gallery.dataset.activeIndex).toBe("0");
    rail.scrollTo({ left: 10000, behavior: "instant" });
    await expect.poll(() => gallery.dataset.activeIndex).toBe("3");
    expect(rail.lastElementChild!.getBoundingClientRect().right).toBeCloseTo(rail.getBoundingClientRect().right - 8, 0);
    flushSync(() => root.render(<ProductMediaGallery images={images.slice(0, 1)} />));
    await expect.poll(() => gallery.dataset.activeIndex).toBe("0");
    expect(rail.scrollWidth).toBe(rail.clientWidth);
    expect(container.querySelector('[data-slot="product-media-gallery-counter"]')).toBeNull();
    flushSync(() => root.render(<ProductMediaGallery images={[]} />));
    expect(container.querySelector('[data-slot="product-media-gallery"]')).toBeNull();
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});
