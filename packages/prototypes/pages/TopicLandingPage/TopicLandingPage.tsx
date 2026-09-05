"use client";

import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";

import {
  ActivityPageHeader,
  BrandProductRail,
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
const SCROLLABLE_OVERFLOW = /^(auto|scroll|overlay)$/;
const EXPLORE_MORE_PAGE_SIZE = 60;

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function resolveTopicLandingScrollRoot(
  element: HTMLElement,
): Window | HTMLElement {
  let ancestor = element.parentElement;
  while (ancestor) {
    if (SCROLLABLE_OVERFLOW.test(window.getComputedStyle(ancestor).overflowY)) {
      return ancestor;
    }
    ancestor = ancestor.parentElement;
  }
  return window;
}

export function getTopicLandingActivationLine(
  scrollRoot: Window | HTMLElement,
  tabsHeight: number,
) {
  if (scrollRoot === window) return tabsHeight + 1;
  const element = scrollRoot as HTMLElement;
  return element.getBoundingClientRect().top + element.clientTop + tabsHeight + 1;
}

export function TopicLandingPage({
  contentMaxWidth = 1440,
  titleFontFamily = "serif",
  showChrome = true,
  activityHeader,
  header,
  hero,
  primaryTabs,
  shortcutRail,
  standardRail,
  reviewList,
  productRail,
  brandRail,
  waterfall,
  footer,
  hiddenModules = [],
  className,
  ...rest
}: TopicLandingPageProps) {
  const mainRef = useRef<HTMLElement>(null);
  const globalHeaderRef = useRef<HTMLDivElement>(null);
  const [globalHeaderHeight, setGlobalHeaderHeight] = useState(0);
  const primaryTabsRef = useRef<HTMLDivElement>(null);
  const pendingPrimaryTabValueRef = useRef<string | null>(null);
  const [primaryTabValue, setPrimaryTabValue] = useState(
    primaryTabs.defaultValue,
  );
  const contentMaxWidthValue =
    typeof contentMaxWidth === "number"
      ? `${contentMaxWidth}px`
      : contentMaxWidth;
  const [waterfallTabValue, setWaterfallTabValue] = useState(
    () =>
      waterfall.value ??
      waterfall.defaultValue ??
      waterfall.tabs?.find((tab) => !tab.disabled)?.value ??
      "",
  );
  const [waterfallVisibleCounts, setWaterfallVisibleCounts] = useState<Record<string, number>>({});
  const [productRailTabValue, setProductRailTabValue] = useState(
    () =>
      productRail.value ??
      productRail.defaultValue ??
      productRail.tabs?.find((tab) => !tab.disabled)?.value ??
      "",
  );
  const {
    products: productRailFallbackProducts,
    productsByTab: productRailProductsByTab,
    ...productRailProps
  } = productRail;
  const activeProductRailTab = productRail.value ?? productRailTabValue;
  const visibleProductRailProducts =
    productRailProductsByTab?.[activeProductRailTab] ?? productRailFallbackProducts;
  const selectProductRailTab = (value: string) => {
    if (productRail.value === undefined) setProductRailTabValue(value);
    productRail.onValueChange?.(value);
  };
  const {
    products: waterfallFallbackProducts,
    productsByTab: waterfallProductsByTab,
    ...waterfallProps
  } = waterfall;
  const activeWaterfallTab = waterfall.value ?? waterfallTabValue;
  const waterfallProducts =
    waterfallProductsByTab?.[activeWaterfallTab] ?? waterfallFallbackProducts;
  const waterfallVisibleCount = waterfallVisibleCounts[activeWaterfallTab] ?? EXPLORE_MORE_PAGE_SIZE;
  const visibleWaterfallProducts = useMemo(
    () => waterfallProducts.slice(0, waterfallVisibleCount),
    [waterfallProducts, waterfallVisibleCount],
  );
  const loadMoreWaterfallProducts = () => {
    setWaterfallVisibleCounts((counts) => ({
      ...counts,
      [activeWaterfallTab]: (counts[activeWaterfallTab] ?? EXPLORE_MORE_PAGE_SIZE) + EXPLORE_MORE_PAGE_SIZE,
    }));
  };
  const selectWaterfallTab = (value: string) => {
    if (waterfall.value === undefined) {
      setWaterfallTabValue(value);
    }
    waterfall.onValueChange?.(value);
  };
  const selectPrimaryTab = (value: string) => {
    const item = primaryTabs.items.find((tab) => tab.value === value);
    if (!item) return;

    pendingPrimaryTabValueRef.current = value;
    setPrimaryTabValue(value);
    window.history.pushState(null, "", `#${item.targetId}`);
    window.requestAnimationFrame(() => {
      const target = document.getElementById(item.targetId);
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      target?.scrollIntoView({
        block: "start",
        behavior: reducedMotion ? "auto" : "smooth",
      });
    });
  };
  const linkedShortcutItems = shortcutRail.items.map((item) => ({
    ...item,
    onClick: (event: MouseEvent<HTMLAnchorElement>) => {
      item.onClick?.(event);
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const targetValue = item.href.startsWith("#explore-more-")
        ? item.href.slice("#explore-more-".length)
        : undefined;
      if (!targetValue || !waterfallProductsByTab?.[targetValue]) return;

      event.preventDefault();
      selectWaterfallTab(targetValue);
      window.history.pushState(null, "", item.href);
      window.requestAnimationFrame(() => {
        const target = mainRef.current?.querySelector<HTMLElement>(
          '[data-page-slot="topic-landing-waterfall"]',
        );
        const reducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;
        target?.scrollIntoView({
          block: "start",
          behavior: reducedMotion ? "auto" : "smooth",
        });
        target
          ?.querySelector<HTMLButtonElement>(
            '[role="tab"][data-state="active"]',
          )
          ?.focus({ preventScroll: true });
      });
    },
  }));

  useLayoutEffect(() => {
    const element = globalHeaderRef.current;
    const updateHeight = () => setGlobalHeaderHeight(element?.getBoundingClientRect().height ?? 0);
    updateHeight();
    if (!element) return;
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => observer.disconnect();
  }, [showChrome]);

  useLayoutEffect(() => {
    const targetId = window.location.hash.slice(1);
    const matchingTab = primaryTabs.items.find(
      (item) => item.targetId === targetId,
    );
    if (matchingTab) setPrimaryTabValue(matchingTab.value);
  }, [primaryTabs.items]);

  useLayoutEffect(() => {
    const primaryTabsElement = primaryTabsRef.current;
    if (!primaryTabsElement) return;
    const scrollRoot = resolveTopicLandingScrollRoot(primaryTabsElement);
    const scrollTarget: EventTarget = scrollRoot;

    let animationFrame = 0;
    const updateActiveTab = () => {
      animationFrame = 0;
      const activationLine = getTopicLandingActivationLine(
        scrollRoot,
        globalHeaderHeight + primaryTabsElement.getBoundingClientRect().height,
      );
      const pendingValue = pendingPrimaryTabValueRef.current;
      if (pendingValue) {
        const pendingItem = primaryTabs.items.find(
          (item) => item.value === pendingValue,
        );
        const pendingSection = pendingItem
          ? document.getElementById(pendingItem.targetId)
          : null;
        const pendingSectionTop =
          pendingSection?.getBoundingClientRect().top ??
          Number.POSITIVE_INFINITY;
        const reachedPendingSection =
          pendingSectionTop <= activationLine &&
          pendingSectionTop >= activationLine - 2;

        if (!reachedPendingSection) return;
        pendingPrimaryTabValueRef.current = null;
      }

      let nextValue = primaryTabs.items[0]?.value ?? primaryTabs.defaultValue;

      for (const item of primaryTabs.items) {
        const section = document.getElementById(item.targetId);
        if (!section || section.getBoundingClientRect().top > activationLine) {
          break;
        }
        nextValue = item.value;
      }

      setPrimaryTabValue((currentValue) =>
        currentValue === nextValue ? currentValue : nextValue,
      );
    };
    const scheduleUpdate = () => {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateActiveTab);
    };
    const finishProgrammaticNavigation = () => {
      const pendingValue = pendingPrimaryTabValueRef.current;
      if (!pendingValue) return;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        animationFrame = window.requestAnimationFrame(() => {
          animationFrame = 0;
          updateActiveTab();
          if (pendingPrimaryTabValueRef.current !== pendingValue) return;
          pendingPrimaryTabValueRef.current = null;
          updateActiveTab();
        });
      });
    };

    updateActiveTab();
    scrollTarget.addEventListener("scroll", scheduleUpdate, { passive: true });
    scrollTarget.addEventListener("scrollend", finishProgrammaticNavigation);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      scrollTarget.removeEventListener("scroll", scheduleUpdate);
      scrollTarget.removeEventListener("scrollend", finishProgrammaticNavigation);
      window.removeEventListener("resize", scheduleUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [globalHeaderHeight, primaryTabs.defaultValue, primaryTabs.items]);

  useLayoutEffect(() => {
    if (waterfall.value !== undefined) return;
    const hashPrefix = "#explore-more-";
    if (!window.location.hash.startsWith(hashPrefix)) return;

    const targetValue = window.location.hash.slice(hashPrefix.length);
    if (waterfallProductsByTab?.[targetValue]) {
      setWaterfallTabValue(targetValue);
    }
  }, [waterfall.value, waterfallProductsByTab]);

  useLayoutEffect(() => {
    const main = mainRef.current;
    if (!main) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const revealSections = Array.from(
      main.querySelectorAll<HTMLElement>('[data-motion-reveal="scroll"]'),
    );
    const waterfallRowItems = window.matchMedia("(min-width: 1024px)").matches
      ? Array.from(
          main.querySelectorAll<HTMLElement>(
            '[data-slot="topic-landing-waterfall-section"] [data-slot="product-list-item"]',
          ),
        )
      : [];
    waterfallRowItems.forEach((target) => {
      target.dataset.motionReveal = "scroll-row";
    });
    const waterfallRows = waterfallRowItems.reduce<HTMLElement[][]>(
      (rows, target) => {
        const previousRow = rows.at(-1);
        const previousTop = previousRow?.[0]?.offsetTop;
        if (
          previousTop === undefined ||
          Math.abs(target.offsetTop - previousTop) > 1
        ) {
          rows.push([target]);
        } else {
          previousRow?.push(target);
        }
        return rows;
      },
      [],
    );
    const waterfallRowByTrigger = new Map(
      waterfallRows.map((row) => [row[0], row]),
    );
    const revealTargets = [
      ...revealSections,
      ...waterfallRows.map((row) => row[0]),
    ];
    const initialReveal = main.querySelector<HTMLElement>(
      '[data-motion-reveal="initial"]',
    );
    initialReveal?.setAttribute("data-motion-observed", "true");
    revealTargets.forEach((target) => {
      target.dataset.motionObserved = "true";
    });
    waterfallRowItems.forEach((target) => {
      target.dataset.motionObserved = "true";
    });

    if (reducedMotion) {
      main.dataset.motionReady = "reduced";
      return;
    }

    if (!("IntersectionObserver" in window)) {
      initialReveal?.setAttribute("data-motion-state", "visible");
      revealTargets.forEach((target) => {
        target.dataset.motionState = "visible";
      });
      return;
    }

    const initialObserver = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry) => {
            const target = entry.target as HTMLElement;
            target.dataset.motionState = "visible";
            initialObserver.unobserve(target);
          });
      },
      { rootMargin: SECTION_REVEAL_ROOT_MARGIN },
    );
    let previousScrollY = window.scrollY;
    let scrollDirection: "down" | "up" = "down";
    let isInitialObservation = true;
    const updateScrollDirection = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY !== previousScrollY) {
        scrollDirection = currentScrollY > previousScrollY ? "down" : "up";
        previousScrollY = currentScrollY;
        if (scrollDirection === "up") {
          revealSections.forEach((target) => {
            if (target.dataset.motionState === "visible") {
              target.dataset.motionDirection = "up";
            }
          });
          waterfallRowItems.forEach((target) => {
            if (target.dataset.motionState === "visible") {
              target.dataset.motionDirection = "up";
            }
          });
        }
      }
    };
    window.addEventListener("scroll", updateScrollDirection, { passive: true });
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        entries
          .filter((entry) => !entry.isIntersecting)
          .forEach((entry) => {
            const target = entry.target as HTMLElement;
            const targets = waterfallRowByTrigger.get(target) ?? [target];
            targets.forEach((controlledTarget) => {
              delete controlledTarget.dataset.motionState;
              delete controlledTarget.dataset.motionDirection;
            });
          });
        visibleEntries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const targets = waterfallRowByTrigger.get(target) ?? [target];
          targets.forEach((controlledTarget) => {
            controlledTarget.dataset.motionDirection = isInitialObservation
              ? "down"
              : scrollDirection;
            controlledTarget.dataset.motionState = "visible";
          });
        });
        isInitialObservation = false;
      },
      {
        rootMargin: SECTION_REVEAL_ROOT_MARGIN,
      },
    );

    if (initialReveal) initialObserver.observe(initialReveal);
    revealTargets.forEach((target) => observer.observe(target));

    return () => {
      initialObserver.disconnect();
      observer.disconnect();
      window.removeEventListener("scroll", updateScrollDirection);
      waterfallRowItems.forEach((target) => {
        delete target.dataset.motionReveal;
        delete target.dataset.motionObserved;
        delete target.dataset.motionState;
        delete target.dataset.motionDirection;
      });
    };
  }, [activeWaterfallTab, visibleWaterfallProducts]);

  return (
    <div
      {...rest}
      className={cx(styles.root, className)}
      data-slot="topic-landing-page"
      style={{ ...rest.style, "--topic-landing-header-height": `${globalHeaderHeight}px` } as CSSProperties}
    >
      {showChrome && (
        <>
          <div className={styles.activityHeader} data-slot="topic-landing-activity-header">
            <ActivityPageHeader {...activityHeader} />
          </div>
          <div ref={globalHeaderRef} className={styles.globalHeader} data-slot="topic-landing-global-header">
            <Header {...header} />
          </div>
        </>
      )}

      <main
        ref={mainRef}
        className={styles.main}
        data-slot="topic-landing-main"
        data-motion-ready="true"
        data-content-max-width={contentMaxWidthValue}
        data-title-font-family={titleFontFamily}
        style={
          {
            "--topic-landing-content-max-width": contentMaxWidthValue,
          } as CSSProperties
        }
      >
        {!hiddenModules.includes("hero") && (
          <ThemeHero
            {...hero}
            className={cx(styles.initialReveal, hero.className)}
            data-motion-reveal="initial"
          />
        )}
        {primaryTabs.items.length > 0 && (
          <div
            ref={primaryTabsRef}
            className={styles.primaryTabs}
            data-slot="topic-landing-tabs"
          >
            <div
              className={styles.primaryTabsContainer}
              data-slot="topic-landing-tabs-container"
            >
              <Tabs
                value={primaryTabValue}
                onValueChange={selectPrimaryTab}
              >
                <TabsList
                  centerActiveTab
                  aria-label={primaryTabs.ariaLabel}
                  variant="primary"
                  styleVariant="a"
                >
                  {primaryTabs.items.map((item) => (
                    <TabsTrigger
                      key={item.value}
                      value={item.value}
                      controls={item.targetId}
                    >
                      {item.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </div>
        )}
        {!hiddenModules.includes("shortcuts") && (
          <div
            id="explore"
            className={styles.shortcutRail}
            data-motion-reveal="scroll"
            data-slot="topic-landing-shortcut-rail"
          >
            <ShortcutRail
              {...shortcutRail}
              presentation="image-card"
              items={linkedShortcutItems}
            />
          </div>
        )}
        {standardRail && !hiddenModules.includes("start-here") && (
          <div
            id="shop"
            className={styles.shopReveal}
            data-motion-reveal="scroll"
            data-slot="topic-landing-theme-product-list"
          >
            <ThemeProductList
              {...standardRail}
              className={cx(styles.shop, standardRail.className)}
            />
          </div>
        )}
        {!hiddenModules.includes("popular-picks") && (
          <div
            id="popular-picks"
            className={styles.standardRail}
            data-motion-reveal="scroll"
            data-slot="topic-landing-standard-rail"
          >
            <ProductList
              {...productRailProps}
              products={visibleProductRailProducts}
              value={activeProductRailTab}
              onValueChange={selectProductRailTab}
            />
          </div>
        )}
        {brandRail && !hiddenModules.includes("brand-spotlight") && (
          <div
            id="brand-spotlight"
            className={styles.brandRail}
            data-motion-reveal="scroll"
            data-slot="topic-landing-brand-rail"
          >
            <BrandProductRail
              {...brandRail}
              titleFontFamily={titleFontFamily}
            />
          </div>
        )}
        {reviewList && !hiddenModules.includes("reviews") && (
          <div
            id="reviews"
            className={styles.reviewList}
            data-motion-reveal="scroll"
            data-slot="topic-landing-review-list"
          >
            <ReviewList {...reviewList} />
          </div>
        )}
        {!hiddenModules.includes("explore-more") && (
          <div
            id="product-list"
            className={styles.waterfallAnchor}
            data-motion-reveal="scroll"
            data-slot="topic-landing-waterfall-section"
          >
            <ProductList
              {...waterfallProps}
              id={`explore-more-${activeWaterfallTab}`}
              products={visibleWaterfallProducts}
              value={activeWaterfallTab}
              onValueChange={selectWaterfallTab}
              hasMore={visibleWaterfallProducts.length < waterfallProducts.length}
              onLoadMore={loadMoreWaterfallProducts}
              className={styles.waterfall}
              data-page-slot="topic-landing-waterfall"
            />
          </div>
        )}
      </main>

      {showChrome && <Footer {...footer} />}
    </div>
  );
}
