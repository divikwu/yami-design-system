import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { expect, test } from "vitest";
import { page } from "vitest/browser";

import "@yami/design-system/styles/fonts.css";
import "@yami/design-system/tokens.css";
import "@yami/design-system/styles/base.css";
import { TopicLandingPage } from "../../../packages/prototypes/pages/TopicLandingPage/TopicLandingPage";
import { createTopicLandingPageFixture } from "../../../packages/prototypes/pages/TopicLandingPage/fixtures";
import { createTopicKeywordLandingPageFixture } from "../../../packages/prototypes/pages/TopicLandingPage/topic.fixtures";
import { createCampaignTopicLandingPageFixture } from "../../../packages/prototypes/pages/TopicLandingPage/campaign.fixtures";

const fixtures = [
  ["Brand", createTopicLandingPageFixture],
  ["Topic", createTopicKeywordLandingPageFixture],
  ["Campaign", createCampaignTopicLandingPageFixture],
] as const;

test.each(fixtures.flatMap(([name, createFixture]) => [
  [name, false, createFixture] as const,
  [name, true, createFixture] as const,
]))("keeps the %s PC header above sticky tabs and anchor destinations (nested: %s)", async (_name, nested, createFixture) => {
  const originalViewport = { width: window.innerWidth, height: window.innerHeight };
  const originalUrl = window.location.href;
  const container = document.createElement("div");
  if (nested) container.style.cssText = "height: 600px; overflow-y: auto; border: 1px solid; margin-top: 24px";
  document.body.append(container);
  const root = createRoot(container);
  const fixture = createFixture("en");

  try {
    await page.viewport(1280, 900);
    flushSync(() => root.render(<TopicLandingPage {...fixture} />));
    await document.fonts.ready;
    const header = container.querySelector<HTMLElement>('[data-slot="topic-landing-global-header"]')!;
    const tabs = container.querySelector<HTMLElement>('[data-slot="topic-landing-tabs"]')!;
    const target = document.getElementById(fixture.primaryTabs.items[1]!.targetId)!;
    const triggers = tabs.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const headerHeight = () => header.getBoundingClientRect().height;
    await expect.poll(() => parseFloat(getComputedStyle(tabs).top)).toBeCloseTo(headerHeight(), 1);

    await page.getByRole("tab", { name: fixture.primaryTabs.items[1]!.label, exact: true }).click();
    await expect.poll(() => Math.abs(target.getBoundingClientRect().top - tabs.getBoundingClientRect().bottom)).toBeLessThan(2);
    const scrollTop = nested ? container.getBoundingClientRect().top + container.clientTop : 0;
    expect(header.getBoundingClientRect().top).toBeCloseTo(scrollTop, 1);
    expect(tabs.getBoundingClientRect().top).toBeCloseTo(scrollTop + headerHeight(), 1);
    expect(Number(getComputedStyle(header).zIndex)).toBeGreaterThan(Number(getComputedStyle(tabs).zIndex));
    expect(triggers[1]!.getAttribute("data-state")).toBe("active");

    // Native scrolling must update the highlighted tab using both sticky bars.
    const nextTarget = document.getElementById(fixture.primaryTabs.items[2]!.targetId)!;
    nextTarget.scrollIntoView({ block: "start", behavior: "instant" });
    await expect.poll(() => triggers[2]!.getAttribute("data-state")).toBe("active");
    expect(Math.abs(nextTarget.getBoundingClientRect().top - tabs.getBoundingClientRect().bottom)).toBeLessThan(2);

    // Both the breakpoint and chrome-free embeds must clear the PC offset.
    await page.viewport(375, 812);
    await expect.poll(() => getComputedStyle(tabs).top).toBe("0px");
    const mobileHeader = container.querySelector<HTMLElement>('[data-slot="topic-landing-activity-header"]')!;
    expect(getComputedStyle(header).display).toBe("none");
    expect(getComputedStyle(mobileHeader).position).toBe("static");
    await page.viewport(1024, 900);
    await expect.poll(() => parseFloat(getComputedStyle(tabs).top)).toBeCloseTo(headerHeight(), 1);

    flushSync(() => root.render(<TopicLandingPage {...fixture} showChrome={false} />));
    await expect.poll(() => getComputedStyle(tabs).top).toBe("0px");
    expect(container.querySelector('[data-slot="topic-landing-global-header"]')).toBeNull();
  } finally {
    root.unmount();
    container.remove();
    window.history.replaceState(null, "", originalUrl);
    window.scrollTo({ top: 0, behavior: "instant" });
    await page.viewport(originalViewport.width, originalViewport.height);
  }
});
