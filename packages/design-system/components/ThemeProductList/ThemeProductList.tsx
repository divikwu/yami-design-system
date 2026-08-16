"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

import { AdaptiveImageScrim } from "../AdaptiveImageScrim";
import { heroBannerPalette } from "../HeroBanner/imageColor";
import { useImageBottomColor } from "../HeroBanner/useImageBottomColor";
import { ProductList } from "../ProductList";
import {
  handleProgressiveImageError,
  handleProgressiveImageLoad,
  prepareProgressiveImage,
} from "../progressiveImage";

import styles from "./ThemeProductList.module.css";
import type {
  ThemeProductListContent,
  ThemeProductListProps,
} from "./ThemeProductList.types";

function ThemeProductListContentPanel({
  image,
  backgroundColor,
  title,
  description,
  href,
}: ThemeProductListContent) {
  const imageColor = useImageBottomColor(
    image.src,
    backgroundColor ?? "#000000",
  );
  const palette = heroBannerPalette(imageColor);
  const style = palette.surfaceColor
    ? ({
        "--adaptive-image-scrim-surface-color": palette.surfaceColor,
      } as CSSProperties)
    : undefined;
  const panel = (
    <div
      className={styles.content}
      style={style}
      data-slot="theme-product-list-content"
      data-foreground={palette.foreground}
    >
      <img
        ref={prepareProgressiveImage}
        className={styles.image}
        src={image.src}
        alt={image.alt}
        loading="lazy"
        decoding="async"
        onLoad={handleProgressiveImageLoad}
        onError={handleProgressiveImageError}
      />
      <div className={styles.overlay} data-slot="theme-product-list-overlay">
        <AdaptiveImageScrim data-slot="theme-product-list-scrim" />
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );

  return href ? (
    <a className={styles.link} href={href}>
      {panel}
    </a>
  ) : (
    panel
  );
}

export function ThemeProductList({
  content,
  className,
  themes,
  products,
  tabs,
  value,
  defaultValue,
  onValueChange,
  ...props
}: ThemeProductListProps) {
  const availableThemes = themes?.length ? themes : undefined;
  const firstTheme =
    availableThemes?.find((theme) => !theme.disabled) ?? availableThemes?.[0];
  const [internalValue, setInternalValue] = useState(
    defaultValue ?? firstTheme?.value,
  );
  const activeTheme =
    availableThemes?.find(
      (theme) => theme.value === (value ?? internalValue),
    ) ?? firstTheme;
  const activeContent = activeTheme?.content ?? content;
  const activeProducts = activeTheme?.products ?? products;
  const activeTabs = availableThemes
    ? availableThemes.map(({ value: themeValue, label, disabled }) => ({
        value: themeValue,
        label,
        disabled,
      }))
    : tabs;

  const handleValueChange = availableThemes
    ? (nextValue: string) => {
        if (value === undefined) setInternalValue(nextValue);
        onValueChange?.(nextValue);
      }
    : onValueChange;

  return (
    <div className={className} data-slot="theme-product-list">
      <ProductList
        {...props}
        products={activeProducts}
        tabs={activeTabs}
        value={availableThemes ? activeTheme?.value : value}
        defaultValue={availableThemes ? undefined : defaultValue}
        onValueChange={handleValueChange}
        layout="rail"
        leadingContent={<ThemeProductListContentPanel {...activeContent} />}
        data-component="theme-product-list"
      />
    </div>
  );
}
