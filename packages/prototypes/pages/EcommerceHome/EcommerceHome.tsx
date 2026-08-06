"use client";

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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function EcommerceHomeTemplate({
  header,
  hero,
  shortcutRail,
  sections,
  footer,
  className,
  ...rest
}: EcommerceHomeProps) {
  return (
    <div
      {...rest}
      className={cx(styles.root, className)}
      data-slot="ecommerce-home"
    >
      <Header {...header} />

      <main className={styles.main} data-slot="ecommerce-home-main">
        <div className={styles.hero} data-slot="ecommerce-home-hero">
          <HeroBanner {...hero} />
        </div>

        <ShortcutRail {...shortcutRail} />

        <div className={styles.sections} data-slot="ecommerce-home-sections">
          {sections.map((section) => {
            if (section.kind === "social") {
              return (
                <div
                  key={section.id}
                  className={styles.section}
                  data-slot="ecommerce-home-section"
                  data-kind="social"
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
