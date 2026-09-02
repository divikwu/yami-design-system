import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlogArticle } from "../../../../components/BlogArticle";
import { getSiteCopy } from "../../../../content/site";
import { getAllBlogPosts, getAllDocs, getBlogPost } from "../../../../lib/content";
import { isLocale, locales } from "../../../../lib/locales";
import { localizedAlternates } from "../../../../lib/metadata";

export function generateStaticParams() {
  return locales.flatMap((locale) => getAllBlogPosts(locale).map((post) => ({ locale, slug: post.frontmatter.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const post = getBlogPost(locale, slug);
  if (!post) return {};
  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    alternates: localizedAlternates(locale, `/blog/${slug}`),
    openGraph: {
      type: "article",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      publishedTime: post.frontmatter.date,
      modifiedTime: post.frontmatter.updatedAt,
    },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const post = getBlogPost(locale, slug);
  if (!post) notFound();
  const docs = getAllDocs(locale);
  const relatedDocs = post.frontmatter.relatedDocs
    .map((relatedSlug) => docs.find((doc) => doc.frontmatter.slug === relatedSlug))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));
  return (
    <BlogArticle
      locale={locale}
      copy={getSiteCopy(locale)}
      post={post}
      posts={getAllBlogPosts(locale)}
      relatedDocs={relatedDocs}
    />
  );
}
