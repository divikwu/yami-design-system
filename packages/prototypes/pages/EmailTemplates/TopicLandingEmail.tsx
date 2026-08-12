import { useId } from "react";

import { EmailAppDownload } from "./EmailAppDownload";
import { EmailLegalFooter } from "./EmailLegalFooter";
import styles from "./TopicLandingEmail.module.css";

const logoEn = new URL(
  "../../../design-system/assets/logos/yami-ui-en-pc-fill.svg",
  import.meta.url,
).href;

export type TopicLandingEmailLocale = "zh" | "en";

export interface TopicLandingEmailProduct {
  id: string;
  image: string;
  imageAlt: string;
  brand: string;
  title: string;
  href?: string;
}

export interface TopicLandingEmailCategory {
  id: string;
  image: string;
  label: string;
  href: string;
}

export interface TopicLandingEmailTheme {
  id: string;
  image: string;
  imageAlt: string;
  title: string;
  href: string;
}

export interface TopicLandingEmailProps {
  locale?: TopicLandingEmailLocale;
  keyword: string;
  title: string;
  description: string;
  tags: readonly string[];
  hero: {
    src: string;
    alt: string;
  };
  categories: readonly TopicLandingEmailCategory[];
  themes: readonly TopicLandingEmailTheme[];
  products: readonly TopicLandingEmailProduct[];
  landingPageHref: string;
}

const copy = {
  zh: {
    eyebrow: "专题精选",
    cta: "探索",
    categoriesHeading: "精选分类",
    themesHeading: "按功效探索",
    productsHeading: "热门精选",
    viewMore: "查看更多",
  },
  en: {
    eyebrow: "Topic Feature",
    cta: "Explore",
    categoriesHeading: "Featured Categories",
    themesHeading: "Themes",
    productsHeading: "Popular Picks",
    viewMore: "View more",
  },
} as const;

function getLocale(locale: TopicLandingEmailLocale | undefined): TopicLandingEmailLocale {
  return locale === "en" ? "en" : "zh";
}

export function TopicLandingEmail({
  locale,
  keyword,
  title,
  description,
  tags,
  hero,
  categories,
  themes,
  products,
}: TopicLandingEmailProps) {
  const activeLocale = getLocale(locale);
  const localizedCopy = copy[activeLocale];
  const titleId = useId();
  const categoriesHeadingId = useId();
  const themesHeadingId = useId();
  const productsHeadingId = useId();

  return (
    <div
      className={styles.root}
      data-locale={activeLocale}
      data-slot="topic-landing-email"
    >
      <article
        aria-labelledby={titleId}
        className={styles.frame}
        data-slot="topic-landing-email-frame"
      >
        <header className={styles.header} data-slot="topic-landing-email-header">
          <span aria-label="YAMI" className={styles.logo}>
            <img
              alt="YAMI"
              className={styles.logoImage}
              data-slot="topic-landing-email-logo"
              src={logoEn}
            />
          </span>
        </header>

        <div className={styles.hero} data-slot="topic-landing-email-hero">
          <img alt={hero.alt} className={styles.heroImage} src={hero.src} />
        </div>

        <main className={styles.content} data-slot="topic-landing-email-content">
          <p
            className={styles.eyebrow}
            data-slot="topic-landing-email-eyebrow"
          >
            {localizedCopy.eyebrow}
          </p>
          <h1 className={styles.title} id={titleId}>
            {title}
          </h1>
          <p className={styles.lede} data-slot="topic-landing-email-lede">
            {description}
          </p>

          <ul
            aria-label={localizedCopy.eyebrow}
            className={styles.tags}
            data-slot="topic-landing-email-tags"
          >
            {tags.map((tag) => (
              <li className={styles.tag} key={tag}>
                {tag}
              </li>
            ))}
          </ul>

          <span className={styles.cta} data-email-cta="true">
            {localizedCopy.cta} {keyword}
          </span>
        </main>

        <section
          aria-labelledby={categoriesHeadingId}
          className={styles.categoriesSection}
          data-slot="topic-landing-email-categories"
        >
          <h2 className={styles.sectionHeading} id={categoriesHeadingId}>
            {localizedCopy.categoriesHeading}
          </h2>
          <ul
            className={styles.categoryGrid}
            data-slot="topic-landing-email-category-grid"
          >
            {categories.map((category) => (
              <li key={category.id}>
                <div className={styles.categoryLink}>
                  <span aria-hidden="true" className={styles.categoryMedia}>
                    <img
                      alt=""
                      className={styles.categoryImage}
                      src={category.image}
                    />
                  </span>
                  <span className={styles.categoryLabel}>{category.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby={themesHeadingId}
          className={styles.themesSection}
          data-slot="topic-landing-email-themes"
        >
          <h2 className={styles.sectionHeading} id={themesHeadingId}>
            {localizedCopy.themesHeading}
          </h2>
          <ul className={styles.themeGrid} role="list">
            {themes.slice(0, 4).map((theme) => (
              <li key={theme.id}>
                <div className={styles.themeCard}>
                  <span className={styles.themeMedia}>
                    <img
                      alt={theme.imageAlt}
                      className={styles.themeImage}
                      src={theme.image}
                    />
                  </span>
                  <span
                    className={styles.themeTitle}
                    data-slot="topic-landing-email-theme-title"
                  >
                    {theme.title}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby={productsHeadingId}
          className={styles.productsSection}
          data-slot="topic-landing-email-products"
        >
          <h2 className={styles.sectionHeading} id={productsHeadingId}>
            {localizedCopy.productsHeading}
          </h2>

          <ul className={styles.productGrid} role="list">
            {products.slice(0, 6).map((product) => (
              <li key={product.id}>
                <div className={styles.productCard}>
                  <span className={styles.productMedia}>
                    <img
                      alt={product.imageAlt}
                      className={styles.productImage}
                      src={product.image}
                    />
                  </span>
                  <span
                    className={styles.productBrand}
                    data-slot="topic-landing-email-product-brand"
                  >
                    {product.brand}
                  </span>
                  <span className={styles.productTitle}>{product.title}</span>
                </div>
              </li>
            ))}
          </ul>

          <span
            className={styles.secondaryCta}
            data-slot="topic-landing-email-products-cta"
          >
            {localizedCopy.viewMore}
          </span>
        </section>

        <EmailAppDownload locale={activeLocale} />
        <EmailLegalFooter locale={activeLocale} />
      </article>
    </div>
  );
}
