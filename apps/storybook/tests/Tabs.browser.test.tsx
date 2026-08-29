import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { page } from "vitest/browser";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@yami/design-system/components/Tabs";
import "@yami/design-system/tokens.css";

function visibleBackgroundHeight(trigger: HTMLElement) {
  const triggerHeight = trigger.getBoundingClientRect().height;
  const background = getComputedStyle(trigger, "::before");
  return (
    triggerHeight -
    Number.parseFloat(background.top) -
    Number.parseFloat(background.bottom)
  );
}

test("switches filled Tab density at the shared 1024px desktop breakpoint", async () => {
  const viewport = { width: innerWidth, height: innerHeight };
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);

  try {
    flushSync(() =>
      root.render(
        <div>
          <Tabs defaultValue="one">
            <TabsList variant="primary" styleVariant="b">
              <TabsTrigger value="one">One</TabsTrigger>
              <TabsTrigger value="two">Two</TabsTrigger>
            </TabsList>
            <TabsContent value="one">One</TabsContent>
            <TabsContent value="two">Two</TabsContent>
          </Tabs>
          <Tabs defaultValue="one">
            <TabsList variant="tertiary">
              <TabsTrigger value="one">One</TabsTrigger>
              <TabsTrigger value="two">Two</TabsTrigger>
            </TabsList>
            <TabsContent value="one">One</TabsContent>
            <TabsContent value="two">Two</TabsContent>
          </Tabs>
        </div>,
      ),
    );

    const activeTriggers = container.querySelectorAll<HTMLElement>(
      '[role="tab"][data-state="active"]',
    );
    expect(activeTriggers).toHaveLength(2);

    for (const [width, expectedHeight] of [
      [375, 32],
      [768, 32],
      [1024, 36],
    ] as const) {
      await page.viewport(width, 812);
      expect(
        Array.from(activeTriggers, visibleBackgroundHeight),
        `${width}px viewport`,
      ).toEqual([expectedHeight, expectedHeight]);
    }
  } finally {
    root.unmount();
    container.remove();
    await page.viewport(viewport.width, viewport.height);
  }
});
