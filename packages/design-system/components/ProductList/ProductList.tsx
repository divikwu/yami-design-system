"use client";

import {
  type CSSProperties,
  useId,
  useMemo,
} from "react";

import { Button } from "../Button";
import { RailNavigation } from "../Button/RailNavigation";
import {
  HorizontalScrollList,
  useHorizontalScrollList,
} from "../HorizontalScrollList";
import { ProductCard, type ProductCardPresentation, type ProductCardProps } from "../ProductCard";
import {
  handleProgressiveImageError,
  handleProgressiveImageLoad,
  prepareProgressiveImage,
} from "../progressiveImage";
import {
  buildImageSrcSet,
  getImageSourceUrl,
  ImageLoadingWindow,
  ResponsiveImage,
} from "../ResponsiveImage";
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
    mobileTitleSize,
    description,
    introContent,
    titleFontFamily = "sans",
    products,
    leadingContent,
    appearance = "standard",
    banner,
    backgroundColor,
    backgroundImage,
    backgroundImageMobile,
    backgroundImage2x,
    backgroundImageMobile2x,
    layout = "rail",
    imageLoadingStrategy,
    mobileSurface = "card",
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
  const isThemeProductList = rest["data-component"] === "theme-product-list";
  const railSurface =
    layout === "rail" &&
    appearance === "themed" &&
    mobileSurface === "card" &&
    !isThemeProductList
      ? "card"
      : "plain";
  const productCardSurface =
    appearance === "standard" || isThemeProductList ? "plain" : "card";
  const titleId = useId();
  const listId = `${titleId}-products`;
  const {
    listRef: railRef,
    state: railState,
    updateState: updateRailState,
    scrollByPage,
  } = useHorizontalScrollList({
    enabled: layout === "rail" && !loading,
    itemCount: products.length + (leadingContent ? 1 : 0),
    minimumPageDistance: 150,
  });
  const firstTabValue = useMemo(
    () => tabs?.find((tab) => !tab.disabled)?.value,
    [tabs],
  );
  const handleTabValueChange = (nextValue: string) => {
    if (layout === "rail" && railRef.current) {
      railRef.current.scrollLeft = 0;
      updateRailState();
    }
    onValueChange?.(nextValue);
  };

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
    ...(backgroundImage && backgroundImage2x
      ? {
          "--product-list-background-image-set": `image-set(url(${JSON.stringify(
            backgroundImage,
          )}) 1x, url(${JSON.stringify(backgroundImage2x)}) 2x)`,
        }
      : {}),
    ...(backgroundImageMobile && backgroundImageMobile2x
      ? {
          "--product-list-background-image-mobile-set": `image-set(url(${JSON.stringify(
            backgroundImageMobile,
          )}) 1x, url(${JSON.stringify(backgroundImageMobile2x)}) 2x)`,
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
      data-mobile-surface={mobileSurface}
      data-leading-content={leadingContent ? "true" : undefined}
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
                srcSet={
                  typeof banner.mobileSrc === "string"
                    ? banner.mobileSrc
                    : buildImageSrcSet(banner.mobileSrc) ||
                      getImageSourceUrl(banner.mobileSrc)
                }
                sizes={
                  typeof banner.mobileSrc === "string"
                    ? undefined
                    : banner.mobileSrc.sizes
                }
              />
            )}
            <ResponsiveImage
              ref={prepareProgressiveImage}
              source={banner.src}
              alt={banner.alt}
              decoding="async"
              revealOnLoad={false}
              onLoad={handleProgressiveImageLoad}
              onError={handleProgressiveImageError}
            />
          </picture>
        </div>
      )}

      <div className={styles.container} data-slot="product-list-container">
        <SectionHeading
          slot="product-list"
          id={titleId}
          title={title}
          mobileTitleSize={mobileTitleSize}
          description={description}
          titleFontFamily={titleFontFamily}
          className={styles.heading}
          titleClassName={styles.title}
          viewAllHref={viewAllHref}
          viewAllLabel={viewAllLabel}
          actions={
            layout === "rail" && !loading && railState.canScroll ? (
              <RailNavigation
                className={styles.railActions}
                buttonClassName={styles.railButton}
                previousLabel={previousLabel}
                nextLabel={nextLabel}
                previousDisabled={railState.atStart}
                nextDisabled={railState.atEnd}
                onPrevious={() => scrollByPage(-1)}
                onNext={() => scrollByPage(1)}
              />
            ) : null
          }
        />

        {tabs && tabs.length > 0 && (
          <Tabs
            value={value}
            defaultValue={defaultValue ?? firstTabValue}
            onValueChange={handleTabValueChange}
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

        {introContent ? (
          <div className={styles.introContent} data-slot="product-list-intro">
            {introContent}
          </div>
        ) : null}

        {leadingContent && (
          <div
            className={styles.mobileLeadingContent}
            data-slot="product-list-leading-content-mobile"
          >
            {leadingContent}
          </div>
        )}

        <ImageLoadingWindow
          strategy={layout === "rail" ? imageLoadingStrategy : undefined}
          rootRef={layout === "rail" ? railRef : undefined}
        >
          <HorizontalScrollList
            id={listId}
            ref={layout === "rail" ? railRef : undefined}
            className={styles.list}
            enabled={layout === "rail"}
            surface={railSurface}
            data-slot="product-list-items"
            role="list"
            tabIndex={layout === "rail" ? 0 : undefined}
            aria-label={layout === "rail" ? "Products" : undefined}
            onScroll={layout === "rail" ? updateRailState : undefined}
          >
          {leadingContent && (
            <div
              className={styles.leadingContent}
              data-slot="product-list-leading-content"
              role="listitem"
            >
              {leadingContent}
            </div>
          )}

          {loading ? (
            <ProductListSkeleton layout={layout} count={visibleCount} />
          ) : (
            products.map(({ id, ...product }) => (
              <div
                key={id}
                className={styles.item}
                data-slot="product-list-item"
                role="listitem"
                data-image-window-item={layout === "rail" ? "true" : undefined}
              >
                <ProductCard
                  {...(product as ProductCardProps)}
                  presentation={presentation}
                  surface={productCardSurface}
                  onAddToCart={onAddToCart ? () => onAddToCart(id) : undefined}
                />
              </div>
            ))
          )}
          </HorizontalScrollList>
        </ImageLoadingWindow>

        {loading && (
          <span className={styles.srOnly} role="status">
            {loadingLabel}
          </span>
        )}

        {!loading && layout === "waterfall" && hasMore && (
          <div className={styles.loadMore} data-slot="product-list-load-more">
            <Button
              form="full"
              size="md"
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
