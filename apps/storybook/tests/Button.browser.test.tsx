import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { expect, test, vi } from "vitest";
import { page } from "vitest/browser";

import { Button } from "@yami/design-system/components/Button";
import "@yami/design-system/tokens.css";

test("warns when an icon button has no accessible label in the Vite browser runtime", () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  try {
    flushSync(() => {
      root.render(
        <Button form="icon">
          <span aria-hidden="true">+</span>
        </Button>,
      );
    });

    expect(warning).toHaveBeenCalledWith(expect.stringContaining("rendered without aria-label"));
  } finally {
    root.unmount();
    container.remove();
    warning.mockRestore();
  }
});

test.each([375, 1023, 1024, 1440, 1920])(
  "keeps Button size and typography contracts at %ipx",
  async (width) => {
    const originalViewport = { width: window.innerWidth, height: window.innerHeight };
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);

    try {
      await page.viewport(width, 900);
      flushSync(() => {
        root.render(
          <>
            {(["emphasis", "primary", "secondary", "tertiary"] as const).flatMap((variant) =>
              (["full", "inline", "icon"] as const).flatMap((form) =>
                (["sm", "md", "lg"] as const).flatMap((size) =>
                  [false, true].map((inverse) => (
                    <Button
                      key={`${variant}-${form}-${size}-${inverse}`}
                      variant={variant}
                      form={form}
                      size={size}
                      inverse={inverse}
                      aria-label={form === "icon" ? "Favorite" : undefined}
                      data-size={size}
                      data-form={form}
                    >
                      {form === "icon" ? <span aria-hidden="true">+</span> : "加入购物车 / Add to Cart"}
                    </Button>
                  )),
                ),
              ),
            )}
          </>,
        );
      });

      for (const button of container.querySelectorAll<HTMLButtonElement>("button")) {
        const large = button.dataset.size === "lg";
        const desktopTextLarge = large && button.dataset.form !== "icon" && width >= 1024;
        const styles = getComputedStyle(button);
        expect(styles.height).toBe(large ? (desktopTextLarge ? "56px" : "48px") : button.dataset.size === "sm" ? "32px" : "40px");
        expect(styles.fontSize).toBe(large ? (desktopTextLarge ? "18px" : "16px") : "14px");
        expect(styles.lineHeight).toBe("20px");
      }
    } finally {
      root.unmount();
      container.remove();
      await page.viewport(originalViewport.width, originalViewport.height);
    }
  },
);
