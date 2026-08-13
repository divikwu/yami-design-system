"use client";

import { useLayoutEffect, useRef, type CSSProperties } from "react";

import {
  Billboard,
  BrandProductRail,
  Footer,
  Header,
  HeroBanner,
  ProductList,
  ShortcutRail,
  SocialMediaGallery,
  TrendingSearches,
} from "@yami/design-system";

import styles from "./EcommerceHome.module.css";
import type { EcommerceHomeProps } from "./EcommerceHome.types";

const SECTION_REVEAL_ROOT_MARGIN = "0px 0px -40px 0px";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function EcommerceHomeTemplate({
  contentMaxWidth = 1920,
  header,
  hero,
  shortcutRail,
  sections,
  footer,
  className,
  ...rest
}: EcommerceHomeProps) {
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
      '[data-slot="ecommerce-home-section"][data-kind="products"] > [data-slot="product-list"][data-layout="waterfall"]',
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

    let previousScrollY = window.scrollY;
    let scrollDirection: "down" | "up" = "down";
    let isInitialObservation = true;
    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY === previousScrollY) return;

      scrollDirection = currentScrollY > previousScrollY ? "down" : "up";
      previousScrollY = currentScrollY;

      if (scrollDirection === "up") {
        [...revealTargets, ...(waterfallLoadMore ? [waterfallLoadMore] : [])]
          .filter((target) => target.dataset.motionState === "visible")
          .forEach((target) => {
            target.dataset.motionDirection = "up";
          });
      }
    };

    window.addEventListener("scroll", updateScrollDirection, {
      passive: true,
    });

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        entries
          .filter((entry) => !entry.isIntersecting)
          .forEach((entry) => {
            const target = entry.target as HTMLElement;
            delete target.dataset.motionState;
            delete target.dataset.motionDirection;
            if (target === lastWaterfallItem && waterfallLoadMore) {
              delete waterfallLoadMore.dataset.motionState;
              delete waterfallLoadMore.dataset.motionDirection;
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
            "--ecommerce-home-row-reveal-delay",
            `${Math.max(rowIndex, 0) * 120}ms`,
          );
        });

        visibleEntries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const revealDirection = isInitialObservation
            ? "down"
            : scrollDirection;
          target.dataset.motionDirection = revealDirection;
          target.dataset.motionState = "visible";

          if (target === lastWaterfallItem && waterfallLoadMore) {
            const lastRowDelay = target.style.getPropertyValue(
              "--ecommerce-home-row-reveal-delay",
            );
            waterfallLoadMore.style.setProperty(
              "--ecommerce-home-row-reveal-delay",
              lastRowDelay,
            );
            waterfallLoadMore.dataset.motionDirection = revealDirection;
            waterfallLoadMore.dataset.motionState = "visible";
          }
        });
        isInitialObservation = false;
      },
      {
        rootMargin: SECTION_REVEAL_ROOT_MARGIN,
      },
    );

    revealTargets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateScrollDirection);
    };
  }, []);

  return (
    <div
      {...rest}
      className={cx(styles.root, className)}
      data-slot="ecommerce-home"
    >
      <Header {...header} />

      <main
        ref={mainRef}
        className={styles.main}
        data-slot="ecommerce-home-main"
        data-content-max-width={contentMaxWidthValue}
        style={
          {
            "--ecommerce-home-content-max-width": contentMaxWidthValue,
          } as CSSProperties
        }
      >
        <div className={styles.initialReveal} data-motion-reveal="initial">
          <div className={styles.hero} data-slot="ecommerce-home-hero">
            <HeroBanner {...hero} />
          </div>

          <ShortcutRail {...shortcutRail} />
        </div>

        <div className={styles.sections} data-slot="ecommerce-home-sections">
          {sections.map((section) => {
            const motionReveal =
              section.kind === "products" &&
              section.props.layout === "waterfall"
                ? undefined
                : "scroll";

            if (section.kind === "social") {
              return (
                <div
                  key={section.id}
                  className={styles.section}
                  data-slot="ecommerce-home-section"
                  data-kind="social"
                  data-motion-reveal={motionReveal}
                >
                  <SocialMediaGallery {...section.props} />
                </div>
              );
            }

            if (section.kind === "billboard") {
              return (
                <div
                  key={section.id}
                  className={styles.section}
                  data-slot="ecommerce-home-section"
                  data-kind="billboard"
                  data-motion-reveal={motionReveal}
                >
                  <Billboard {...section.props} />
                </div>
              );
            }

            if (section.kind === "searches") {
              return (
                <div
                  key={section.id}
                  className={styles.section}
                  data-slot="ecommerce-home-section"
                  data-kind="searches"
                  data-motion-reveal={motionReveal}
                >
                  <TrendingSearches {...section.props} />
                </div>
              );
            }

            if (section.kind === "brands") {
              return (
                <div
                  key={section.id}
                  className={styles.section}
                  data-slot="ecommerce-home-section"
                  data-kind="brands"
                  data-motion-reveal={motionReveal}
                >
                  <BrandProductRail {...section.props} />
                </div>
              );
            }

            const appearance = section.props.appearance ?? "standard";
            return (
              <div
                key={section.id}
                className={styles.section}
                data-slot="ecommerce-home-section"
                data-kind="products"
                data-appearance={appearance}
                data-divider-position={section.props.dividerPosition ?? "top"}
                data-divider-variant={section.props.dividerVariant ?? "gray"}
                data-motion-reveal={motionReveal}
              >
                <ProductList {...section.props} />
              </div>
            );
          })}
        </div>
      </main>

      <Footer {...footer} />
    </div>
  );
}
