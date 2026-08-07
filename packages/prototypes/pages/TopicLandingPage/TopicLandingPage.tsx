"use client";

import {
  Footer,
  Header,
  ProductList,
  ThemeHero,
  ThemeProductList,
} from "@yami/design-system";

import styles from "./TopicLandingPage.module.css";
import type { TopicLandingPageProps } from "./TopicLandingPage.types";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function TopicLandingPage({
  header,
  hero,
  standardRail,
  productRail,
  waterfall,
  footer,
  className,
  ...rest
}: TopicLandingPageProps) {
  return (
    <div
      {...rest}
      className={cx(styles.root, className)}
      data-slot="topic-landing-page"
    >
      <Header {...header} />

      <main>
        <ThemeHero {...hero} />
        <ThemeProductList {...standardRail} />
        <div
          className={styles.standardRail}
          data-slot="topic-landing-standard-rail"
        >
          <ProductList {...productRail} />
        </div>
        <ProductList {...waterfall} className={styles.waterfall} />
      </main>

      <Footer {...footer} />
    </div>
  );
}
