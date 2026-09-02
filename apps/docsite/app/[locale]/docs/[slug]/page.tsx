import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DocPage } from "../../../../components/DocPage";
import { getSiteCopy } from "../../../../content/site";
import { getAllDocs, getDoc } from "../../../../lib/content";
import { isLocale, locales } from "../../../../lib/locales";
import { localizedAlternates } from "../../../../lib/metadata";

export function generateStaticParams() {
  return locales.flatMap((locale) => getAllDocs(locale).map((doc) => ({ locale, slug: doc.frontmatter.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const document = getDoc(locale, slug);
  if (!document) return {};
  return {
    title: document.frontmatter.title,
    description: document.frontmatter.description,
    alternates: localizedAlternates(locale, `/docs/${slug}`),
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const document = getDoc(locale, slug);
  if (!document) notFound();
  return <DocPage locale={locale} copy={getSiteCopy(locale)} document={document} documents={getAllDocs(locale)} />;
}
