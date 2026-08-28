import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test, vi } from "vitest";
import { cdp, page, userEvent } from "vitest/browser";
import type {} from "@vitest/browser-playwright";
import { ProductMediaGallery } from "@yami/design-system/components/ProductMediaGallery";
import meta from "../../../packages/design-system/components/ProductMediaGallery/ProductMediaGallery.stories";
import "@yami/design-system/tokens.css";

const images = meta.args!.images!;

test("desktop arrows hide after mouse clicks and remain available for keyboard focus", async () => {
  const viewport = { width: innerWidth, height: innerHeight };
  const container = document.createElement("div");
  container.style.width = "480px";
  document.body.append(container);
  const root = createRoot(container);
  try {
    await page.viewport(1440, 900);
    flushSync(() => root.render(<><button>Outside gallery</button><ProductMediaGallery images={images} /></>));
    const gallery = container.querySelector<HTMLElement>('[data-slot="product-media-gallery"]')!;
    const stage = container.querySelector<HTMLElement>('[data-slot="product-media-gallery-stage"]')!;
    const arrows = Array.from(stage.querySelectorAll<HTMLButtonElement>('[data-rail-navigation-button]'));
    const outside = page.getByRole("button", { name: "Outside gallery" });
    await outside.click();
    for (const arrow of arrows) {
      await page.elementLocator(stage).hover();
      await expect.poll(() => getComputedStyle(arrow).visibility).toBe("visible");
      await page.elementLocator(arrow).click();
      expect(arrow.matches(":focus-visible")).toBe(false);
      await outside.hover();
      await expect.poll(() => getComputedStyle(arrow).visibility).toBe("hidden");
    }
    await outside.click();
    await userEvent.tab();
    expect(document.activeElement).toBe(gallery);
    for (const arrow of arrows) expect(getComputedStyle(arrow).visibility).toBe("visible");
    await userEvent.keyboard("{ArrowRight}");
    expect(gallery.dataset.activeIndex).toBe("1");
    await userEvent.tab();
    expect(gallery.contains(document.activeElement)).toBe(true);
    for (const arrow of arrows) expect(getComputedStyle(arrow).visibility).toBe("visible");
    await outside.click();
    for (const arrow of arrows) expect(getComputedStyle(arrow).visibility).toBe("hidden");
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});

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
    flushSync(() => root.render(<ProductMediaGallery images={images} mobilePreview onIndexChange={changed} />));
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
    // CDP uses top-page coordinates; Vitest scales its test iframe on CI.
    const swipe = async (xDistance: number, yDistance = 0) => {
      const rect = rail.getBoundingClientRect();
      const frame = window.frameElement!.getBoundingClientRect();
      const scale = frame.width / innerWidth;
      const point = {
        x: frame.left + (rect.left + rect.width / 2) * scale,
        y: frame.top + (rect.top + rect.height / 2) * scale,
        id: 0,
      };
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
      for (let step = 1; step <= 16; step++) {
        await session.send("Input.dispatchTouchEvent", {
          type: "touchMove",
          touchPoints: [{ ...point, x: point.x + xDistance * scale * step / 16,
            y: point.y + yDistance * scale * step / 16 }],
        });
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    };
    await swipe(-300);
    await expect.poll(() => gallery.dataset.activeIndex).toBe("1");
    expect(container.querySelector("dialog[open]")).toBeNull();
    await expect.poll(() => rail.scrollLeft).toBeCloseTo(448, 0);
    expect(changed).toHaveBeenLastCalledWith(1);
    expect(container.querySelector('[data-slot="product-media-gallery-counter"]')?.textContent).toBe("2 / 4");
    await swipe(300);
    await expect.poll(() => rail.scrollLeft).toBe(0);
    await expect.poll(() => gallery.dataset.activeIndex).toBe("0");
    await swipe(300);
    expect(gallery.dataset.activeIndex).toBe("0");
    await swipe(0, -160);
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

test("mobile preview opens the selected image and supports a single touch-scrollable bottom thumbnail row", async () => {
  const viewport = { width: innerWidth, height: innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const session = cdp();
  const manyImages = Array.from({ length: 11 }, (_, index) => ({ ...images[index % images.length], id: `image-${index}` }));
  const originalOverflow = document.documentElement.style.overflow;
  try {
    await page.viewport(375, 812);
    await session.send("Emulation.setTouchEmulationEnabled", { enabled: true });
    flushSync(() => root.render(<ProductMediaGallery images={manyImages} defaultIndex={2} desktopPreview mobilePreview />));
    await page.getByRole("button", { name: "Open image preview" }).click();
    const dialog = container.querySelector<HTMLDialogElement>("dialog")!;
    expect(dialog.open).toBe(true);
    expect(dialog.matches(":modal")).toBe(true);
    expect(getComputedStyle(dialog).backgroundColor).toBe("rgb(255, 255, 255)");
    expect(dialog.getBoundingClientRect().width).toBe(innerWidth);
    expect(dialog.getBoundingClientRect().height).toBe(innerHeight);
    expect(dialog.querySelector('[data-slot="product-media-preview-image"]')?.getAttribute("alt")).toBe(manyImages[2].alt);
    const rail = dialog.querySelector<HTMLElement>('[data-slot="product-media-preview-thumbnails"]')!;
    const thumbnails = Array.from(rail.querySelectorAll("button"));
    expect(thumbnails).toHaveLength(11);
    expect(new Set(thumbnails.map((button) => button.getBoundingClientRect().top)).size).toBe(1);
    expect(rail.scrollWidth).toBeGreaterThan(rail.clientWidth);
    expect(rail.getBoundingClientRect().bottom).toBeLessThanOrEqual(innerHeight);
    expect(getComputedStyle(rail).overflowX).toBe("auto");
    expect(document.documentElement.style.overflow).toBe("hidden");
    const stage = dialog.querySelector<HTMLElement>('[data-slot="product-media-preview-stage"]')!;
    const swipeImage = async (direction: -1 | 1) => {
      const rect = stage.getBoundingClientRect();
      const frame = window.frameElement!.getBoundingClientRect();
      const scale = frame.width / innerWidth;
      // Cross the snap midpoint without relying on platform-dependent fling velocity.
      const distance = rect.width * 0.6 * direction;
      const point = { x: frame.left + (rect.left + rect.width * (direction < 0 ? 0.8 : 0.2)) * scale,
        y: frame.top + (rect.top + rect.height / 2) * scale, id: 0 };
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
      for (let step = 1; step <= 16; step++) {
        await session.send("Input.dispatchTouchEvent", { type: "touchMove",
          touchPoints: [{ ...point, x: point.x + distance * scale * step / 16 }] });
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    };
    const selectedImage = () => dialog.querySelector('[data-slot="product-media-preview-image"]');
    const imageRail = dialog.querySelector<HTMLElement>('[data-slot="product-media-preview-rail"]')!;
    await swipeImage(-1);
    await expect.poll(() => thumbnails[3].getAttribute("aria-pressed")).toBe("true");
    await expect.poll(() => imageRail.scrollLeft).toBe(imageRail.clientWidth * 3);
    expect(selectedImage()?.getAttribute("alt")).toBe(manyImages[3].alt);
    await swipeImage(1);
    await expect.poll(() => thumbnails[2].getAttribute("aria-pressed")).toBe("true");
    await expect.poll(() => imageRail.scrollLeft).toBe(imageRail.clientWidth * 2);
    await page.elementLocator(thumbnails[0]).click();
    await expect.poll(() => thumbnails[0].getAttribute("aria-pressed")).toBe("true");
    await expect.poll(() => dialog.querySelector('[data-slot="product-media-preview-rail"]')!.scrollLeft).toBe(0);
    await swipeImage(1);
    expect(thumbnails[0].getAttribute("aria-pressed")).toBe("true");
    await page.elementLocator(thumbnails[10]).click();
    await swipeImage(-1);
    expect(thumbnails[10].getAttribute("aria-pressed")).toBe("true");
    await page.elementLocator(thumbnails[2]).click();
    expect(selectedImage()?.getAttribute("alt")).toBe(manyImages[2].alt);
    const rect = rail.getBoundingClientRect();
    const frame = window.frameElement!.getBoundingClientRect();
    const scale = frame.width / innerWidth;
    const point = { x: frame.left + (rect.left + rect.width * 0.8) * scale,
      y: frame.top + (rect.top + rect.height / 2) * scale, id: 0 };
    const beforeScroll = rail.scrollLeft;
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
    for (let step = 1; step <= 16; step++) {
      await session.send("Input.dispatchTouchEvent", { type: "touchMove",
        touchPoints: [{ ...point, x: point.x - 200 * scale * step / 16 }] });
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect.poll(() => rail.scrollLeft).toBeGreaterThan(beforeScroll + 80);
    await page.elementLocator(thumbnails[10]).click();
    expect(dialog.querySelector('[data-slot="product-media-preview-image"]')?.getAttribute("alt")).toBe(manyImages[10].alt);
    expect(thumbnails[10].getAttribute("aria-pressed")).toBe("true");
    await page.viewport(1440, 900);
    expect(dialog.open).toBe(true);
    expect(getComputedStyle(rail).flexDirection).toBe("column");
    await page.viewport(375, 812);
    expect(getComputedStyle(rail).flexDirection).toBe("row");
    await page.getByRole("button", { name: "Close image preview" }).click();
    await expect.poll(() => container.querySelector("dialog")).toBeNull();
    expect(document.documentElement.style.overflow).toBe(originalOverflow);
    const gallery = container.querySelector<HTMLElement>('[data-slot="product-media-gallery"]')!;
    expect(gallery.dataset.activeIndex).toBe("10");
    expect(document.activeElement).toBe(gallery);
    await page.getByRole("button", { name: "Open image preview" }).click();
    await userEvent.keyboard("{Escape}");
    await expect.poll(() => container.querySelector("dialog")).toBeNull();
  } finally {
    await session.send("Emulation.setTouchEmulationEnabled", { enabled: false });
    root.unmount();
    container.remove();
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
