import { AiProgrammingIcon, ArrowRight02Icon, ColorsIcon, PuzzleIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card } from "@yami/design-system";
import Link from "next/link";

import type { SiteCopy } from "../content/site";
import type { BlogDocument } from "../lib/content";
import { formatDate, sortBlogPostsByUpdatedAt } from "../lib/content";
import type { Locale } from "../lib/locales";
import { localizedPath } from "../lib/locales";
import { storybookUrl } from "../lib/site-config";
import { BlogCard, type BlogCardData } from "./BlogCard";
import { arrowRightIcon } from "./assets";
import styles from "./HomePage.module.css";

const aboutRoutes = ["browse-components#design-standards", "browse-components", "prepare-environment"] as const;
const aboutIcons = [ColorsIcon, PuzzleIcon, AiProgrammingIcon] as const;
const aboutCapabilityIndexes = [0, 1, 3] as const;

function toBlogCard(post: BlogDocument, locale: Locale, copy: SiteCopy): BlogCardData {
  return {
    slug: post.frontmatter.slug,
    href: localizedPath(locale, `/blog/${post.frontmatter.slug}`),
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    categoryLabel: copy.blog.categories[post.frontmatter.category],
    dateLabel: formatDate(post.frontmatter.date, locale),
    readingTimeLabel: copy.blog.readingTime(post.readingTimeMinutes),
    authorLabel: post.frontmatter.authors[0] ?? "YAMI Design System Team",
    cover: post.frontmatter.cover,
    coverAlt: post.frontmatter.coverAlt,
  };
}

function ArrowIcon() {
  return <HugeiconsIcon className={styles.arrowIcon} icon={ArrowRight02Icon} size={16} strokeWidth={1.5} aria-hidden="true" />;
}

export function HomePage({
  locale,
  copy,
  posts,
}: {
  locale: Locale;
  copy: SiteCopy;
  posts: BlogDocument[];
}) {
  const cards = sortBlogPostsByUpdatedAt(posts).slice(0, 3).map((post) => toBlogCard(post, locale, copy));
  const aboutItems = aboutCapabilityIndexes.map((index, itemIndex) => ({
    ...copy.home.capabilities[index],
    href: localizedPath(locale, `/docs/${aboutRoutes[itemIndex]}`),
    icon: aboutIcons[itemIndex],
    action: copy.home.aboutActions[itemIndex],
  }));

  return (
    <main id="main-content" className={styles.main}>
      <section className={styles.heroScope} aria-labelledby="home-title">
        <div className={styles.heroFrame}>
          <div className={styles.heroBackdropGlow} aria-hidden="true" />

          <div className={styles.heroCenter}>
            <h1 id="home-title">{copy.home.title}</h1>
            <p className={styles.heroDescription}>{copy.home.description}</p>
            <div className={styles.heroActions}>
              <Link className={styles.emphasisAction} href={localizedPath(locale, "/docs/getting-started")}>
                {copy.home.primaryAction}
              </Link>
              <a className={styles.secondaryAction} href={storybookUrl} target="_blank" rel="noreferrer">
                {copy.home.secondaryAction}
              </a>
            </div>
            <p className={styles.heroStatus}>{copy.home.status}</p>
          </div>

          <div className={styles.heroDemos} aria-label={locale === "zh" ? "YAMI 组件首帧预览" : "YAMI component frame preview"}>
            <Card className={`${styles.heroCard} ${styles.heroCardLeft}`} padding="lg" surface="primary">
              <div className={styles.heroCardContent}>
                <h2>{locale === "zh" ? "Torriden 玻尿酸面膜" : "Torriden DIVE IN Mask"}</h2>
                <p>{locale === "zh" ? "低分子玻尿酸 · 27ml × 10片" : "Low-molecule hyaluronic acid · 27ml × 10 sheets"}</p>
                <div className={styles.heroProductImageFrame}>
                  <img
                    src="/images/hero-products/torriden-dive-in-mask-1127059081.webp"
                    alt={locale === "zh" ? "Torriden DIVE IN 面膜，10片装" : "Torriden DIVE IN mask, 10-sheet pack"}
                    width={300}
                    height={300}
                  />
                </div>
              </div>
            </Card>

            <div className={styles.heroPrompt}>
              <span className={styles.promptCopy}>{locale === "zh" ? "我可以帮你什么？" : "How can I help?"}</span>
              <span className={styles.promptAdd} aria-hidden="true">+</span>
              <span className={styles.promptAction} aria-hidden="true">
                <img src={arrowRightIcon} alt="" width={16} height={16} />
              </span>
            </div>

            <Card className={`${styles.heroCard} ${styles.heroCardRight}`} padding="none" surface="primary">
              <div className={styles.heroFeatureImageFrame}>
                <img
                  src="/images/hero-products/heytea-sea-salt-matcha-1158009161.webp"
                  alt={locale === "zh" ? "喜茶 海盐厚抹轻乳茶，350ml" : "HEYTEA Sea Salt Matcha Milk Tea, 350ml"}
                  width={300}
                  height={300}
                />
              </div>
              <div className={styles.heroRewardFooter}>
                <div className={styles.rewardLabelRow}>
                  <strong>{locale === "zh" ? "积分" : "Points"}</strong>
                  <span>7/8</span>
                </div>
                <div className={styles.progressPreview} role="progressbar" aria-label={locale === "zh" ? "积分" : "Points"} aria-valuemin={0} aria-valuemax={8} aria-valuenow={7}>
                  <span />
                </div>
                <div className={styles.rewardMember}>
                  <img src="/images/hero-neutral/ami-pena.webp" alt="" />
                  <span>Ami Pena</span>
                </div>
              </div>
            </Card>

            <div className={styles.heroMiniCard}>
              <div className={styles.heroMiniSummary}>
                <div className={styles.heroMiniImageFrame}>
                  <img src="/images/hero-products/heytea-sea-salt-matcha-1158009161.webp" alt="" width={300} height={300} />
                </div>
                <div>
                  <strong>{locale === "zh" ? "喜茶 海盐厚抹" : "HEYTEA Matcha"}</strong>
                  <span>{locale === "zh" ? "轻乳茶 · 350ml" : "Sea salt · 350ml"}</span>
                </div>
              </div>
              <span className={styles.heroMiniAction}>{locale === "zh" ? "加入购物车" : "Add to cart"}</span>
            </div>

          </div>
        </div>
        <div className={styles.heroSpacer} aria-hidden="true" />
      </section>

      <div className={styles.showcaseSurface} data-home-showcase>
        <section className={styles.about} aria-labelledby="about-title">
          <div className={styles.homeContainer}>
            <div className={styles.aboutGrid}>
              <div className={styles.aboutIntro}>
                <h2 id="about-title">{copy.home.aboutTitle}</h2>
                <p>{copy.home.aboutDescription}</p>
              </div>
              <div className={styles.aboutColumns}>
                {aboutItems.map((item) => (
                  <article className={styles.aboutItem} key={item.title}>
                      <HugeiconsIcon className={styles.aboutIcon} icon={item.icon} size={40} strokeWidth={1.5} aria-hidden="true" />
                    <div className={styles.aboutItemCopy}>
                      <div className={styles.aboutItemText}>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                      </div>
                      <Link className={styles.textLink} href={item.href}>
                        {item.action}<ArrowIcon />
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.latest} aria-labelledby="latest-title">
          <div className={styles.homeContainer}>
            <div className={styles.sectionHeader}>
              <h2 id="latest-title">{copy.home.latestTitle}</h2>
              <Link className={styles.textLink} href={localizedPath(locale, "/blog")}>
                {copy.home.latestAction}
              </Link>
            </div>
            {cards.length > 0 ? (
              <div className={styles.blogGrid}>
                {cards.map((post) => <BlogCard key={post.slug} post={post} landing="compact" />)}
              </div>
            ) : null}
          </div>
        </section>

        <section className={styles.discover} aria-labelledby="discover-title">
          <div className={styles.homeContainer}>
            <div className={styles.discoverCard}>
              <div className={styles.discoverContent}>
                <div className={styles.discoverHeader}>
                  <h2 id="discover-title">{copy.home.discoverTitle}</h2>
                  <p>{copy.home.discoverDescription}</p>
                </div>
                <div className={styles.heroActions}>
                  <Link className={styles.primaryAction} href={localizedPath(locale, "/docs/getting-started")}>
                    {copy.home.primaryAction}
                  </Link>
                  <a className={styles.secondaryAction} href={storybookUrl} target="_blank" rel="noreferrer">
                    {copy.home.secondaryAction}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
