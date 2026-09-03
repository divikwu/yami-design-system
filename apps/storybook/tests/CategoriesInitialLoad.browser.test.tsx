import { composeStories } from "@storybook/react-vite";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { page } from "vitest/browser";

import "@yami/design-system/styles/fonts.css";
import "@yami/design-system/tokens.css";
import "@yami/design-system/styles/base.css";
import * as stories from "../../../packages/prototypes/pages/Categories/Categories.stories";

const { PcV1Text, PcV2Images } = composeStories(stories);

test.each([{ name: "V1 Text", Story: PcV1Text }, { name: "V2 Images", Story: PcV2Images }])("$name stays collapsed until the user interacts", async ({ Story }) => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const insertedMenus: Element[] = [];
  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches('[data-slot="header-category-menu"]')) insertedMenus.push(node);
        insertedMenus.push(...node.querySelectorAll('[data-slot="header-category-menu"]'));
      }
    }
  });
  try {
    await page.viewport(1920, 1080);
    observer.observe(container, { childList: true, subtree: true });
    flushSync(() => root.render(<Story />));
    await Story.play?.({ canvasElement: container });
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(insertedMenus).toHaveLength(0);
    expect(container.querySelector('[data-slot="header-category-menu"]')).toBeNull();
    observer.disconnect();
  } finally {
    observer.disconnect();
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});

