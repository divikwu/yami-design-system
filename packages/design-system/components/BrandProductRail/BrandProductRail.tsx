"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { RailNavigation } from "../Button/RailNavigation";
import { SectionHeading } from "../SectionHeading";
import { ProductList } from "../ProductList";
import { Tabs, TabsList, TabsTrigger } from "../Tabs";

import styles from "./BrandProductRail.module.css";
import type { BrandProductRailProps } from "./BrandProductRail.types";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getPageDistance(rail: HTMLUListElement) {
  const [firstItem, secondItem] = Array.from(
    rail.children,
  ) as HTMLElement[];
  const itemStep =
    firstItem && secondItem ? secondItem.offsetLeft - firstItem.offsetLeft : 0;

  if (!firstItem || itemStep <= 0) return rail.clientWidth;

  const gap = Math.max(0, itemStep - firstItem.offsetWidth);
  const visibleItems = Math.max(
    1,
    Math.floor((rail.clientWidth + gap) / itemStep),
  );
  return visibleItems * itemStep;
}

export function BrandProductRail({
  title,
  mobileTitle,
  titleFontFamily = "sans",
  campaigns,
  mobileSurface = "card",
  tabs,
  value,
  defaultValue,
  onValueChange,
  viewAllHref,
  viewAllLabel = "View all",
  previousLabel = "Previous brands",
  nextLabel = "Next brands",
  onAddToCart,
  dividerPosition = "top",
  dividerVariant = "gray",
  className,
  ...rest
}: BrandProductRailProps) {
  const titleId = useId();
  const listId = `${titleId}-campaigns`;
  const railRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });
  const firstTabValue = useMemo(
    () => tabs?.find((tab) => !tab.disabled)?.value,
    [tabs],
  );

  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
    setEdges({
      atStart: rail.scrollLeft <= 1,
      atEnd: rail.scrollLeft >= maxScrollLeft - 1,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    const rail = railRef.current;
    if (!rail || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [campaigns.length, updateEdges]);

  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const distance = direction * Math.max(getPageDistance(rail), 280);

    if (typeof rail.scrollBy === "function") {
      rail.scrollBy({
        left: distance,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    } else {
      rail.scrollLeft += distance;
      updateEdges();
    }
  }

  return (
    <section
      {...rest}
      className={cx(styles.root, className)}
      aria-labelledby={titleId}
      data-slot="brand-product-rail"
      data-mobile-surface={mobileSurface}
      data-divider-position={dividerPosition}
      data-divider-variant={dividerVariant}
    >
      <div className={styles.container} data-slot="brand-product-rail-container">
        <div className={styles.header}>
          <SectionHeading
            id={titleId}
            title={title}
            mobileTitle={mobileTitle ?? title}
            titleFontFamily={titleFontFamily}
            className={styles.heading}
            actionsClassName={styles.actions}
            viewAllHref={viewAllHref}
            viewAllLabel={viewAllLabel}
            actions={
              <RailNavigation
                className={styles.railActions}
                buttonClassName={styles.railButton}
                previousLabel={previousLabel}
                nextLabel={nextLabel}
                previousDisabled={edges.atStart}
                nextDisabled={edges.atEnd}
                onPrevious={() => scrollRail(-1)}
                onNext={() => scrollRail(1)}
              />
            }
          />

          {tabs && tabs.length > 0 && (
            <Tabs
              className={styles.tabs}
              value={value}
              defaultValue={defaultValue ?? firstTabValue}
              onValueChange={onValueChange}
            >
              <TabsList className={styles.tabsList} variant="tertiary">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    controls={listId}
                    disabled={tab.disabled}
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        <ul
          id={listId}
          ref={railRef}
          className={styles.list}
          data-slot="brand-product-rail-list"
          role="list"
          tabIndex={0}
          aria-label={typeof title === "string" ? title : undefined}
          onScroll={updateEdges}
        >
          {campaigns.map((campaign) => (
            <li
              key={campaign.id}
              className={styles.panel}
              data-slot="brand-product-rail-campaign"
              role="listitem"
            >
              <ProductList
                title={
                  campaign.href ? (
                    <a className={styles.brandTitle} href={campaign.href}>
                      {campaign.title}
                      <span aria-hidden="true">›</span>
                    </a>
                  ) : (
                    campaign.title
                  )
                }
                appearance="themed"
                banner={{
                  src: campaign.banner.src,
                  alt: campaign.banner.alt,
                  backgroundColor: "var(--surface-primary)",
                }}
                layout="waterfall"
                mobileSurface={mobileSurface}
                presentation="compact"
                products={campaign.products}
                onAddToCart={
                  onAddToCart
                    ? (productId) => onAddToCart(campaign.id, productId)
                    : undefined
                }
              />
              {campaign.href && (
                <a
                  className={styles.bannerLink}
                  href={campaign.href}
                  aria-label={String(campaign.banner.alt)}
                />
              )}
              {campaign.banner.badgeSrc && (
                <img
                  className={styles.badge}
                  src={campaign.banner.badgeSrc}
                  alt={campaign.banner.badgeAlt ?? ""}
                  aria-hidden={
                    campaign.banner.badgeAlt ? undefined : true
                  }
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
