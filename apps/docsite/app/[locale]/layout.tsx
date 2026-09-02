import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import Script from "next/script";
import type { ReactNode } from "react";

import "@yami/design-system/styles/base.css";
import "@yami/design-system/styles/fonts.css";
import "@yami/design-system/tokens.css";
import "../globals.css";

import { SiteFooter } from "../../components/SiteFooter";
import { SiteHeader } from "../../components/SiteHeader";
import { getSiteCopy } from "../../content/site";
import { getAllDocs, getSearchEntries } from "../../lib/content";
import { storybookResources } from "../../lib/docs-navigation";
import { htmlLanguage, isLocale, locales } from "../../lib/locales";
import { siteUrl } from "../../lib/site-config";

const yamiFont = localFont({
  src: [
    {
      path: "../../../../packages/design-system/assets/fonts/GT-Walsheim-Regular.woff2",
      weight: "400",
    },
    {
      path: "../../../../packages/design-system/assets/fonts/GT-Walsheim-Medium.woff2",
      weight: "500",
    },
    {
      path: "../../../../packages/design-system/assets/fonts/GT-Walsheim-Medium.woff2",
      weight: "600",
    },
  ],
  variable: "--font-yami",
  display: "swap",
});

const themeScript = `(function(){try{var k="yami-docsite-theme";var s=localStorage.getItem(k);var d=s==="dark"||(s!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.dataset.theme=d?"dark":"light";r.style.colorScheme=d?"dark":"light"}catch(e){}})()`;

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = getSiteCopy(locale);
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: copy.metadata.title,
      template: `%s · ${copy.metadata.title}`,
    },
    description: copy.metadata.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale = rawLocale;
  const copy = getSiteCopy(locale);
  const searchEntries = getSearchEntries(locale);
  const docNavigation = [
    ...getAllDocs(locale).map(({ frontmatter }) => ({
      slug: frontmatter.slug,
      title: frontmatter.title,
      href: `/${locale}/docs/${frontmatter.slug}`,
      group: frontmatter.group,
      current: false,
    })),
    ...(Object.keys(storybookResources) as Array<keyof typeof storybookResources>).map((key) => ({
      slug: `storybook-${key}`,
      title: copy.docs.resources[key],
      href: storybookResources[key],
      group: "resources" as const,
      current: false,
      external: true,
    })),
  ];

  return (
    <html
      lang={htmlLanguage[locale]}
      className={yamiFont.variable}
      suppressHydrationWarning
    >
      <body>
        <Script id="yami-theme" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
        <SiteHeader
          locale={locale}
          copy={{ nav: copy.nav, utilities: copy.utilities, docs: copy.docs }}
          searchEntries={searchEntries}
          docNavigation={docNavigation}
        />
        {children}
        <SiteFooter locale={locale} copy={copy} />
      </body>
    </html>
  );
}
