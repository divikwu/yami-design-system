import { getAllBlogPosts } from "../../../lib/content";
import { isLocale, locales, localizedPath } from "../../../lib/locales";
import { siteName, siteUrl } from "../../../lib/site-config";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) return new Response("Not found", { status: 404 });
  const locale = rawLocale;
  const posts = getAllBlogPosts(locale);
  const items = posts.map((post) => {
    const url = `${siteUrl}${localizedPath(locale, `/blog/${post.frontmatter.slug}`)}`;
    return `<item><title>${escapeXml(post.frontmatter.title)}</title><link>${url}</link><guid>${url}</guid><description>${escapeXml(post.frontmatter.description)}</description><pubDate>${new Date(`${post.frontmatter.date}T00:00:00Z`).toUTCString()}</pubDate></item>`;
  }).join("");
  const feedUrl = `${siteUrl}${localizedPath(locale, "/rss.xml")}`;
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${siteName} Blog</title><link>${siteUrl}${localizedPath(locale, "/blog")}</link><description>${siteName} Blog</description><language>${locale === "zh" ? "zh-CN" : "en-US"}</language><atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${feedUrl}" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
