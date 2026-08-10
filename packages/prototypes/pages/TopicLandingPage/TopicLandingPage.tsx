"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";

import {
  ActivityPageHeader,
  Footer,
  Header,
  ProductList,
  ReviewList,
  ShortcutRail,
  Tabs,
  TabsList,
  TabsTrigger,
  ThemeHero,
  ThemeProductList,
} from "@yami/design-system";

import styles from "./TopicLandingPage.module.css";
import type { TopicLandingPageProps } from "./TopicLandingPage.types";

const SECTION_REVEAL_ROOT_MARGIN = "0px 0px -40px 0px";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function TopicLandingPage({
  contentMaxWidth = 1440,
  titleFontFamily = "serif",
  activityHeader,
  header,
  hero,
  primaryTabs,
  shortcutRail,
  standardRail,
  reviewList,
  productRail,
  waterfall,
  footer,
  className,
  ...rest
}: TopicLandingPageProps) {
  const mainRef = useRef<HTMLElement>(null);
  const contentMaxWidthValue =
    typeof contentMaxWidth === "number"
      ? `${contentMaxWidth}px`
      : contentMaxWidth;

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const revealSections = Array.from(
      main.querySelectorAll<HTMLElement>('[data-motion-reveal="scroll"]'),
    );
    const initialReveal = main.querySelector<HTMLElement>(
      '[data-motion-reveal="initial"]',
    );
    const waterfall = main.querySelector<HTMLElement>(
      '[data-page-slot="topic-landing-waterfall"]',
    );
    const waterfallHeading = waterfall?.querySelector<HTMLElement>(
      '[data-slot="product-list-heading"]',
    );
    const waterfallTabs = waterfall?.querySelector<HTMLElement>(
      '[data-slot="product-list-container"] > [data-slot="tabs"]',
    );
    const waterfallItems = Array.from(
      waterfall?.querySelectorAll<HTMLElement>(
        '[data-slot="product-list-item"]',
      ) ?? [],
    );
    const waterfallLoadMore = waterfall?.querySelector<HTMLElement>(
      '[data-slot="product-list-load-more"]',
    );
    if (waterfallHeading) {
      waterfallHeading.dataset.motionReveal = "waterfall-heading";
    }
    if (waterfallTabs) {
      waterfallTabs.dataset.motionReveal = "waterfall-tabs";
    }
    waterfallItems.forEach((item) => {
      item.dataset.motionReveal = "waterfall-row";
    });
    if (waterfallLoadMore) {
      waterfallLoadMore.dataset.motionReveal = "waterfall-row";
    }
    const lastWaterfallItem = waterfallItems[waterfallItems.length - 1];
    const revealTargets = [
      ...(initialReveal ? [initialReveal] : []),
      ...revealSections,
      ...(waterfallHeading ? [waterfallHeading] : []),
      ...(waterfallTabs ? [waterfallTabs] : []),
      ...waterfallItems,
    ];

    if (reducedMotion) {
      main.dataset.motionReady = "reduced";
      return;
    }

    main.dataset.motionReady = "true";

    if (!("IntersectionObserver" in window)) {
      [
        ...revealTargets,
        ...(waterfallLoadMore ? [waterfallLoadMore] : []),
      ].forEach((target) => {
        target.dataset.motionState = "visible";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        entries
          .filter((entry) => !entry.isIntersecting)
          .forEach((entry) => {
            const target = entry.target as HTMLElement;
            delete target.dataset.motionState;
            if (target === lastWaterfallItem && waterfallLoadMore) {
              delete waterfallLoadMore.dataset.motionState;
            }
          });
        const waterfallEntries = visibleEntries.filter(
          (entry) =>
            (entry.target as HTMLElement).dataset.motionReveal ===
              "waterfall-row" &&
            (entry.target as HTMLElement).dataset.slot === "product-list-item",
        );
        const visibleRowTops = Array.from(
          new Set(
            waterfallEntries.map((entry) =>
              Math.round(entry.boundingClientRect.top),
            ),
          ),
        ).sort((a, b) => a - b);

        waterfallEntries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const rowIndex = visibleRowTops.indexOf(
            Math.round(entry.boundingClientRect.top),
          );
          target.style.setProperty(
            "--topic-landing-row-reveal-delay",
            `${Math.max(rowIndex, 0) * 120}ms`,
          );
        });

        visibleEntries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          target.dataset.motionState = "visible";

          if (target === lastWaterfallItem && waterfallLoadMore) {
            const lastRowDelay = target.style.getPropertyValue(
              "--topic-landing-row-reveal-delay",
            );
            waterfallLoadMore.style.setProperty(
              "--topic-landing-row-reveal-delay",
              lastRowDelay,
            );
            waterfallLoadMore.dataset.motionState = "visible";
          }
        });
      },
      {
        rootMargin: SECTION_REVEAL_ROOT_MARGIN,
      },
    );

    revealTargets.forEach((target) => observer.observe(target));

    return () => observer.disconnect();
  }, []);

  return (
    <div
      {...rest}
      className={cx(styles.root, className)}
      data-slot="topic-landing-page"
    >
      <div className={styles.activityHeader} data-slot="topic-landing-activity-header">
        <ActivityPageHeader {...activityHeader} />
      </div>
      <div className={styles.globalHeader} data-slot="topic-landing-global-header">
        <Header {...header} />
      </div>

      <main
        ref={mainRef}
        className={styles.main}
        data-slot="topic-landing-main"
        data-content-max-width={contentMaxWidthValue}
        data-title-font-family={titleFontFamily}
        style={
          {
            "--topic-landing-content-max-width": contentMaxWidthValue,
          } as CSSProperties
        }
      >
        <div className={styles.initialReveal} data-motion-reveal="initial">
          <ThemeHero {...hero} />
          <div className={styles.primaryTabs} data-slot="topic-landing-tabs">
            <div
              className={styles.primaryTabsContainer}
              data-slot="topic-landing-tabs-container"
            >
              <Tabs defaultValue={primaryTabs.defaultValue}>
                <TabsList
                  aria-label={primaryTabs.ariaLabel}
                  variant="primary"
                  styleVariant="a"
                >
                  {primaryTabs.items.map((item) => (
                    <TabsTrigger key={item.value} value={item.value}>
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
          <div
            id="explore"
            className={styles.shortcutRail}
            data-slot="topic-landing-shortcut-rail"
          >
            <ShortcutRail {...shortcutRail} />
          </div>
          <ThemeProductList
            {...standardRail}
            id="shop"
            className={cx(styles.shop, standardRail.className)}
          />
        </div>
        <div
          className={styles.standardRail}
          data-motion-reveal="scroll"
          data-slot="topic-landing-standard-rail"
        >
          <ProductList {...productRail} />
        </div>
        <div
          className={styles.reviewList}
          data-motion-reveal="scroll"
          data-slot="topic-landing-review-list"
        >
          <ReviewList {...reviewList} />
        </div>
        <ProductList
          {...waterfall}
          className={styles.waterfall}
          data-page-slot="topic-landing-waterfall"
        />
      </main>

      <Footer {...footer} />
    </div>
  );
}
