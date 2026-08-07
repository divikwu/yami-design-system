"use client";

import { ProductList } from "../ProductList";

import styles from "./ThemeProductList.module.css";
import type {
  ThemeProductListContent,
  ThemeProductListProps,
} from "./ThemeProductList.types";

function ThemeProductListContentPanel({
  image,
  title,
  description,
  href,
}: ThemeProductListContent) {
  const panel = (
    <div className={styles.content} data-slot="theme-product-list-content">
      <img
        className={styles.image}
        src={image.src}
        alt={image.alt}
        loading="lazy"
      />
      <div className={styles.overlay} data-slot="theme-product-list-overlay">
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
  ...props
}: ThemeProductListProps) {
  return (
    <div className={className} data-slot="theme-product-list">
      <ProductList
        {...props}
        layout="rail"
        leadingContent={<ThemeProductListContentPanel {...content} />}
        data-component="theme-product-list"
      />
    </div>
  );
}
