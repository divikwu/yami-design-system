import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ThemeProductList, type ThemeProductListProps } from "../components/ThemeProductList";

describe("YAMI ThemeProductList", () => {
  it("does not render an empty description paragraph", () => {
    const markup = renderToStaticMarkup(createElement(ThemeProductList, {
      title: "Build Your Routine",
      products: [],
      content: {
        image: { src: "/routine.webp", alt: "Daily routine" },
        title: "Daily Routine",
        description: undefined,
      },
    }));

    expect(markup).not.toMatch(/<p[^>]*><\/p>/);
  });
});

describe("YAMI ThemeProductList scene loading", () => {
  let container: HTMLDivElement;
  let root: Root;
  const themes = ["Cleanse", "Calm", "Hydrate"].map((label) => ({
    value: label,
    label,
    content: {
      image: { src: `/${label}.webp`, alt: `${label} scene` },
      title: label,
      description: `${label} routine`,
    },
    products: [],
  })) satisfies NonNullable<ThemeProductListProps["themes"]>;

  const sceneImages = () => Array.from(container.querySelectorAll<HTMLImageElement>(
    '[data-slot="theme-product-list-content"] img',
  ));

  async function selectTheme(label: string) {
    const trigger = Array.from(container.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      .find((tab) => tab.textContent === label)!;
    await act(async () => trigger.click());
  }

  beforeEach(async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(createElement(ThemeProductList, {
      title: "Build Your Routine",
      content: themes[0]!.content,
      themes,
      products: [],
    })));
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the next scene pending until its own image has loaded and decoded", async () => {
    await act(async () => {
      sceneImages().forEach((image) => image.dispatchEvent(new Event("load")));
    });
    expect(sceneImages().every((image) => image.dataset.imageState === "loaded")).toBe(true);

    await selectTheme("Calm");

    const images = sceneImages();
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(image.getAttribute("src")).toBe("/Calm.webp");
      expect(image.dataset.imageState).toBe("pending");
      expect(image.parentElement?.textContent).toContain("Calm routine");
    }

    const resolveDecode: Array<() => void> = [];
    for (const image of images) {
      vi.spyOn(image, "decode").mockReturnValue(new Promise<void>((resolve) => {
        resolveDecode.push(resolve);
      }));
    }
    await act(async () => {
      images.forEach((image) => image.dispatchEvent(new Event("load")));
    });
    expect(images.every((image) => image.dataset.imageState === "pending")).toBe(true);

    await act(async () => resolveDecode.forEach((resolve) => resolve()));
    expect(images.every((image) => image.dataset.imageState === "loaded")).toBe(true);
  });

  it.each(["resolve", "reject"] as const)(
    "ignores an old decode that %ss after rapidly switching away and back",
    async (settlement) => {
      let settleDecode!: () => void;
      const oldDecode = new Promise<void>((resolve, reject) => {
        settleDecode = settlement === "resolve" ? resolve : () => reject(new Error("Decode aborted"));
      });
      for (const image of sceneImages()) {
        vi.spyOn(image, "decode").mockReturnValue(oldDecode);
      }
      await act(async () => {
        sceneImages().forEach((image) => image.dispatchEvent(new Event("load")));
      });

      await selectTheme("Calm");
      await selectTheme("Hydrate");
      await selectTheme("Cleanse");
      await act(async () => settleDecode());

      const images = sceneImages();
      for (const image of images) {
        expect(image.getAttribute("src")).toBe("/Cleanse.webp");
        expect(image.dataset.imageState).toBe("pending");
      }
      await act(async () => {
        images.forEach((image) => image.dispatchEvent(new Event("load")));
      });
      expect(images.every((image) => image.dataset.imageState === "loaded")).toBe(true);
    },
  );

  it("recovers from a failed scene image when selecting another theme", async () => {
    await selectTheme("Calm");
    await act(async () => {
      sceneImages().forEach((image) => image.dispatchEvent(new Event("error")));
    });
    expect(sceneImages().every((image) => image.dataset.imageState === "error")).toBe(true);

    await selectTheme("Hydrate");
    expect(sceneImages().every((image) => image.dataset.imageState === "pending")).toBe(true);
    await act(async () => {
      sceneImages().forEach((image) => image.dispatchEvent(new Event("load")));
    });
    expect(sceneImages().every((image) => image.dataset.imageState === "loaded")).toBe(true);
  });
});
