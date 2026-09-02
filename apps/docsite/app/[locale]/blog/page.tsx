import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogIndex, type BlogListPost } from "../../../components/BlogIndex";
import { getSiteCopy } from "../../../content/site";
import { formatDate, getAllBlogPosts } from "../../../lib/content";
import { isLocale, localizedPath } from "../../../lib/locales";
import { localizedAlternates } from "../../../lib/metadata";
import styles from "./page.module.css";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = getSiteCopy(locale);
  return {
    title: copy.blog.title,
    description: copy.blog.description,
    alternates: localizedAlternates(locale, "/blog"),
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = getSiteCopy(locale);
  const posts: BlogListPost[] = getAllBlogPosts(locale).map((post) => ({
    slug: post.frontmatter.slug,
    href: localizedPath(locale, `/blog/${post.frontmatter.slug}`),
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    category: post.frontmatter.category,
    categoryLabel: copy.blog.categories[post.frontmatter.category],
    dateLabel: formatDate(post.frontmatter.date, locale),
    readingTimeLabel: copy.blog.readingTime(post.readingTimeMinutes),
    authorLabel: post.frontmatter.authors[0] ?? "YAMI Design System Team",
    cover: post.frontmatter.cover,
    coverAlt: post.frontmatter.coverAlt,
  }));

  return (
    <main id="main-content" className={styles.main}>
      <header className={styles.header}>
        <h1>{copy.blog.title}</h1>
        <p>{copy.blog.description}</p>
      </header>
      <BlogIndex posts={posts} labels={{ all: copy.blog.all, categories: copy.blog.categories }} />
    </main>
  );
}
