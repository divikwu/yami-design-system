import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ThemeProductList } from "../components/ThemeProductList";

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
