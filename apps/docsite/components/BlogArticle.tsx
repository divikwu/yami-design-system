import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Divider, Tag } from "@yami/design-system";
import Link from "next/link";

import type { SiteCopy } from "../content/site";
import type { BlogDocument, DocDocument } from "../lib/content";
import { formatDate } from "../lib/content";
import type { Locale } from "../lib/locales";
import { localizedPath } from "../lib/locales";
import { MarkdownContent } from "./MarkdownContent";
import { BlogCover } from "./BlogCover";
import styles from "./BlogArticle.module.css";

export function BlogArticle({
  locale,
  copy,
  post,
  relatedDocs,
}: {
  locale: Locale;
  copy: SiteCopy;
  post: BlogDocument;
  relatedDocs: DocDocument[];
}) {
  const category = copy.blog.categories[post.frontmatter.category];

  return (
    <main id="main-content" className={styles.main}>
      <article>
        <header className={styles.header}>
          <nav className={styles.breadcrumbs} aria-label={locale === "zh" ? "面包屑导航" : "Breadcrumb"}>
            <Link href={localizedPath(locale, "/blog")}>{copy.blog.title}</Link>
            <span aria-hidden="true">/</span>
            <span className={styles.currentCategory} aria-current="page">{category}</span>
          </nav>
          <h1>{post.frontmatter.title}</h1>
          <p className={styles.description}>{post.frontmatter.description}</p>
          <div className={styles.byline}>
            <time dateTime={post.frontmatter.date}>{formatDate(post.frontmatter.date, locale)}</time>
            <span>{copy.blog.readingTime(post.readingTimeMinutes)}</span>
          </div>
          <Divider className={styles.headerDivider} />
        </header>

        <BlogCover
          cover={post.frontmatter.cover}
          alt={post.frontmatter.coverAlt}
          className={styles.cover}
        />

        <div className={styles.body}>
          <MarkdownContent markdown={post.content} locale={locale} headings={post.headings} />
        </div>

        <div className={styles.tags} aria-label={locale === "zh" ? "标签" : "Tags"}>
          {post.frontmatter.tags.map((tag) => (
            <Tag key={tag} tone="dark">
              {tag}
            </Tag>
          ))}
        </div>

        {relatedDocs.length > 0 ? (
          <section className={styles.related} aria-labelledby="related-docs">
            <h2 id="related-docs">{copy.blog.related}</h2>
            <div>
              {relatedDocs.map((doc) => (
                <Link key={doc.frontmatter.slug} href={localizedPath(locale, `/docs/${doc.frontmatter.slug}`)}>
                  <strong>{doc.frontmatter.title}</strong>
                  <HugeiconsIcon className={styles.relatedIcon} icon={ArrowRight01Icon} size={16} strokeWidth={1.5} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </main>
  );
}
