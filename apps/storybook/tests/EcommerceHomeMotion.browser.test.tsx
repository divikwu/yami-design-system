import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test } from "vitest";

import "@yami/design-system/styles/fonts.css";
import "@yami/design-system/tokens.css";
import "@yami/design-system/styles/base.css";
import {
  createEcommerceHomeFixture,
  EcommerceHomeTemplate,
} from "@yami/prototypes/ecommerce-home";

async function settleScroll() {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
  await new Promise((resolve) => window.setTimeout(resolve, 50));
}

afterEach(async () => {
  window.scrollTo({ top: 0, behavior: "auto" });
  await settleScroll();
});

test("reveals homepage sections only while scrolling down", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  try {
    flushSync(() => {
      root.render(<EcommerceHomeTemplate {...createEcommerceHomeFixture("zh")} />);
    });
    await settleScroll();

    const revealTarget = Array.from(
      container.querySelectorAll<HTMLElement>('[data-motion-reveal="scroll"]'),
    ).find((target) => {
      const documentTop = target.getBoundingClientRect().top + window.scrollY;
      return documentTop > window.innerHeight + 100;
    });
    expect(revealTarget).toBeDefined();

    const documentTop =
      revealTarget!.getBoundingClientRect().top + window.scrollY;
    const revealHeight = revealTarget!.getBoundingClientRect().height;
    const maxScrollY =
      document.documentElement.scrollHeight - window.innerHeight;

    window.scrollTo({
      top: Math.min(
        maxScrollY,
        Math.max(0, documentTop - window.innerHeight + 120),
      ),
      behavior: "auto",
    });
    await settleScroll();

    expect(revealTarget!.dataset.motionState).toBe("visible");
    expect(revealTarget!.dataset.motionDirection).toBe("down");
    expect(getComputedStyle(revealTarget!).transitionDuration).toBe(
      "0.32s, 0.32s",
    );

    window.scrollTo({
      top: Math.min(maxScrollY, documentTop + revealHeight + 80),
      behavior: "auto",
    });
    await settleScroll();
    expect(revealTarget!.dataset.motionState).toBeUndefined();

    window.scrollTo({
      top: Math.min(
        maxScrollY,
        Math.max(0, documentTop + revealHeight - 120),
      ),
      behavior: "auto",
    });
    await settleScroll();

    expect(revealTarget!.dataset.motionState).toBe("visible");
    expect(revealTarget!.dataset.motionDirection).toBe("up");
    expect(getComputedStyle(revealTarget!).transitionDuration).toBe("0s");
    expect(getComputedStyle(revealTarget!).opacity).toBe("1");
    expect(getComputedStyle(revealTarget!).transform).toBe(
      "matrix(1, 0, 0, 1, 0, 0)",
    );
  } finally {
    root.unmount();
    container.remove();
  }
});
