import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HomePage } from "../../components/HomePage";
import { getSiteCopy } from "../../content/site";
import { getAllBlogPosts } from "../../lib/content";
import { isLocale } from "../../lib/locales";
import { localizedAlternates } from "../../lib/metadata";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = getSiteCopy(locale);
  return {
    title: copy.metadata.title,
    description: copy.metadata.description,
    alternates: localizedAlternates(locale),
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <HomePage locale={locale} copy={getSiteCopy(locale)} posts={getAllBlogPosts(locale)} />;
}
