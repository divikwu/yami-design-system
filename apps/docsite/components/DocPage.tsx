import Link from "next/link";

import type { SiteCopy } from "../content/site";
import type { DocDocument } from "../lib/content";
import { formatDate } from "../lib/content";
import { storybookResources } from "../lib/docs-navigation";
import type { Locale } from "../lib/locales";
import { localizedPath } from "../lib/locales";
import { githubUrl } from "../lib/site-config";
import { DocsMobileControls, type DocNavItem } from "./DocsMobileControls";
import { DocsSidebarNav } from "./DocsSidebarNav";
import { MarkdownContent } from "./MarkdownContent";
import { TableOfContents } from "./TableOfContents";
import styles from "./DocPage.module.css";

export function DocPage({
  locale,
  copy,
  document,
  documents,
}: {
  locale: Locale;
  copy: SiteCopy;
  document: DocDocument;
  documents: DocDocument[];
}) {
  const currentIndex = documents.findIndex((item) => item.frontmatter.slug === document.frontmatter.slug);
  const previous = currentIndex > 0 ? documents[currentIndex - 1] : undefined;
  const next = currentIndex < documents.length - 1 ? documents[currentIndex + 1] : undefined;
  const navItems: DocNavItem[] = documents.map((item) => ({
    slug: item.frontmatter.slug,
    title: item.frontmatter.title,
    href: localizedPath(locale, `/docs/${item.frontmatter.slug}`),
    group: item.frontmatter.group,
    current: item.frontmatter.slug === document.frontmatter.slug,
  }));
  for (const key of Object.keys(storybookResources) as Array<keyof typeof storybookResources>) {
    navItems.push({
      slug: `storybook-${key}`,
      title: copy.docs.resources[key],
      href: storybookResources[key],
      group: "resources",
      current: false,
      external: true,
    });
  }

  return (
    <main id="main-content" data-doc-page>
      <div className={styles.layout}>
        <aside className={styles.sidebar} aria-label={copy.docs.label}>
          <DocsSidebarNav label={copy.docs.label} groups={copy.docs.groups} items={navItems} />
        </aside>

        <div className={styles.contentShell}>
          <article className={styles.article}>
            <header className={styles.articleHeader}>
              <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
                <Link href={localizedPath(locale, "/docs/getting-started")}>{copy.nav.docs}</Link>
                <span aria-hidden="true">/</span>
                <span aria-current="page">{document.frontmatter.title}</span>
              </nav>
              <h1>{document.frontmatter.title}</h1>
              <p>{document.frontmatter.description}</p>
            </header>

            <DocsMobileControls
              headings={document.headings}
              copy={{ onThisPage: copy.docs.onThisPage }}
            />

            <MarkdownContent markdown={document.content} locale={locale} headings={document.headings} />

            <section className={styles.sources} aria-labelledby="source-references">
              <h2 id="source-references">{locale === "zh" ? "事实来源" : "Source References"}</h2>
              <ul>
                {document.frontmatter.sourceRefs.map((source) => (
                  <li key={source}>
                    <a href={`${githubUrl}/blob/main/${source}`} target="_blank" rel="noreferrer">{source}</a>
                  </li>
                ))}
              </ul>
            </section>

            <time className={styles.updatedAt} dateTime={document.frontmatter.updatedAt}>
              {copy.docs.updated} {formatDate(document.frontmatter.updatedAt, locale)}
            </time>

            <nav className={styles.pagination} aria-label={locale === "zh" ? "文档翻页" : "Documentation Pagination"}>
              {previous ? (
                <Link href={localizedPath(locale, `/docs/${previous.frontmatter.slug}`)} rel="prev">
                  <span>{copy.docs.previous}</span>
                  <strong>{previous.frontmatter.title}</strong>
                </Link>
              ) : null}
              {next ? (
                <Link href={localizedPath(locale, `/docs/${next.frontmatter.slug}`)} rel="next">
                  <span>{copy.docs.next}</span>
                  <strong>{next.frontmatter.title}</strong>
                </Link>
              ) : null}
            </nav>
          </article>

          <aside className={styles.toc} aria-label={copy.docs.onThisPage}>
            <TableOfContents headings={document.headings} label={copy.docs.onThisPage} />
          </aside>
        </div>
      </div>
    </main>
  );
}
