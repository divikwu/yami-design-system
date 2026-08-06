"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "../Button";
import { RailNavigation } from "../Button/RailNavigation";
import { ProductCard, type ProductCardPresentation, type ProductCardProps } from "../ProductCard";
import { SectionHeading } from "../SectionHeading";
import { Tabs, TabsList, TabsTrigger } from "../Tabs";

import styles from "./ProductList.module.css";
import type { ProductListLayout, ProductListProps } from "./ProductList.types";

const DEFAULT_SKELETON_COUNTS: Record<ProductListLayout, number> = {
  rail: 8,
  waterfall: 8,
};

const PRESENTATION_BY_LAYOUT: Record<
  ProductListLayout,
  ProductCardPresentation
> = {
  rail: "rich",
  waterfall: "rich",
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getRailPageDistance(rail: HTMLDivElement) {
  const [firstItem, secondItem] = Array.from(rail.children) as HTMLElement[];
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

function ProductListSkeleton({
  layout,
  count,
}: {
  layout: ProductListLayout;
  count: number;
}) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: loading placeholders have no stable data identity.
          key={index}
          className={styles.skeletonItem}
          data-slot="product-list-skeleton-item"
          data-layout={layout}
          role="listitem"
          aria-hidden="true"
        >
          <span className={styles.skeletonMedia} />
          <span className={styles.skeletonContent}>
            <span className={styles.skeletonLineShort} />
            <span className={styles.skeletonLine} />
            <span className={styles.skeletonLineMedium} />
            <span className={styles.skeletonPrice} />
          </span>
        </div>
      ))}
    </>
  );
}

export function ProductList(props: ProductListProps) {
  const {
    title,
    products,
    appearance = "standard",
    banner,
    backgroundColor,
    backgroundImage,
    backgroundImageMobile,
    layout = "rail",
    presentation: presentationOverride,
    tabs,
    value,
    defaultValue,
    onValueChange,
    viewAllHref,
    viewAllLabel = "See all",
    previousLabel = "Previous products",
    nextLabel = "Next products",
    hasMore = false,
    onLoadMore,
    loadMoreLabel = "View more",
    onAddToCart,
    loading = false,
    loadingLabel = "Loading products",
    skeletonCount = DEFAULT_SKELETON_COUNTS[layout],
    dividerPosition = "top",
    dividerVariant = "gray",
    className,
    style,
    ...rest
  } = props;
  const titleId = useId();
  const railRef = useRef<HTMLDivElement>(null);
  const [railState, setRailState] = useState({
    atStart: true,
    atEnd: false,
  });
  const firstTabValue = useMemo(
    () => tabs?.find((tab) => !tab.disabled)?.value,
    [tabs],
  );

  const updateRailState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
    setRailState({
      atStart: rail.scrollLeft <= 1,
      atEnd: rail.scrollLeft >= maxScrollLeft - 1,
    });
  }, []);

  useEffect(() => {
    if (layout !== "rail" || loading) return;
    updateRailState();
    const rail = railRef.current;
    if (!rail || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateRailState);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [layout, loading, products.length, updateRailState]);

  function scrollRail(direction: -1 | 1) {
    const rail = railRef.current;
    if (!rail) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const left = direction * Math.max(getRailPageDistance(rail), 150);
    if (typeof rail.scrollBy === "function") {
      rail.scrollBy({
        left,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    } else {
      rail.scrollLeft += left;
      updateRailState();
    }
  }

  const mergedStyle = {
    ...style,
    ...(appearance === "themed" && banner?.backgroundColor
      ? {
          "--product-list-theme-color": banner.backgroundColor,
        }
      : {}),
    ...(appearance === "themed" && banner?.mobileBackgroundColor
      ? {
          "--product-list-theme-color-mobile": banner.mobileBackgroundColor,
        }
      : {}),
    ...(appearance === "atmospheric" && backgroundColor
      ? {
          "--product-list-background-color": backgroundColor,
        }
      : {}),
    ...(backgroundImage
      ? {
          "--product-list-background-image": `url(${JSON.stringify(
            backgroundImage,
          )})`,
        }
      : {}),
    ...(backgroundImageMobile
      ? {
          "--product-list-background-image-mobile": `url(${JSON.stringify(
            backgroundImageMobile,
          )})`,
        }
      : {}),
  } as CSSProperties;
  const presentation =
    presentationOverride ?? PRESENTATION_BY_LAYOUT[layout];
  const visibleCount = Math.max(1, Math.floor(skeletonCount));

  return (
    <section
      {...rest}
      className={cx(styles.root, className)}
      style={mergedStyle}
      data-slot="product-list"
      data-appearance={appearance}
      data-layout={layout}
      data-divider-position={dividerPosition}
      data-divider-variant={dividerVariant}
      aria-labelledby={titleId}
      aria-busy={loading || undefined}
    >
      {banner && (
        <div className={styles.banner} data-slot="product-list-banner">
          <picture>
            {banner.mobileSrc && (
              <source
                media="(max-width: 1023px)"
                srcSet={banner.mobileSrc}
              />
            )}
            <img src={banner.src} alt={banner.alt} />
          </picture>
        </div>
      )}

      <div className={styles.container} data-slot="product-list-container">
        <SectionHeading
          slot="product-list"
          id={titleId}
          title={title}
          className={styles.heading}
          titleClassName={styles.title}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
          actions={
            layout === "rail" && !loading ? (
              <RailNavigation
                className={styles.railActions}
                buttonClassName={styles.railButton}
                previousLabel={previousLabel}
                nextLabel={nextLabel}
                previousDisabled={railState.atStart}
                nextDisabled={railState.atEnd}
                onPrevious={() => scrollRail(-1)}
                onNext={() => scrollRail(1)}
              />
            ) : null
          }
        />

        {tabs && tabs.length > 0 && (
          <Tabs
            value={value}
            defaultValue={defaultValue ?? firstTabValue}
            onValueChange={onValueChange}
          >
            <TabsList className={styles.tabsList} variant="tertiary">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  disabled={tab.disabled}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        <div
          ref={layout === "rail" ? railRef : undefined}
          className={styles.list}
          data-slot="product-list-items"
          role="list"
          tabIndex={layout === "rail" ? 0 : undefined}
          aria-label={layout === "rail" ? "Products" : undefined}
          onScroll={layout === "rail" ? updateRailState : undefined}
        >
          {loading ? (
            <ProductListSkeleton layout={layout} count={visibleCount} />
          ) : (
            products.map(({ id, ...product }) => (
              <div
                key={id}
                className={styles.item}
                data-slot="product-list-item"
                role="listitem"
              >
                <ProductCard
                  {...(product as ProductCardProps)}
                  presentation={presentation}
                  onAddToCart={onAddToCart ? () => onAddToCart(id) : undefined}
                />
              </div>
            ))
          )}
        </div>

        {loading && (
          <span className={styles.srOnly} role="status">
            {loadingLabel}
          </span>
        )}

        {!loading && layout === "waterfall" && hasMore && (
          <div className={styles.loadMore}>
            <Button
              form="full"
              size="lg"
              variant="secondary"
              onClick={onLoadMore}
            >
              {loadMoreLabel}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
