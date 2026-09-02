import type { MetadataRoute } from "next";

import { getAllBlogPosts, getAllDocs } from "../lib/content";
import { locales, localizedPath } from "../lib/locales";
import { siteUrl } from "../lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return locales.flatMap((locale) => {
    const paths = [
      localizedPath(locale),
      localizedPath(locale, "/blog"),
      ...getAllDocs(locale).map((doc) => localizedPath(locale, `/docs/${doc.frontmatter.slug}`)),
      ...getAllBlogPosts(locale).map((post) => localizedPath(locale, `/blog/${post.frontmatter.slug}`)),
    ];
    return paths.map((pathname) => ({ url: `${siteUrl}${pathname}` }));
  });
}
