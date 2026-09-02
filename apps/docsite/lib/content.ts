import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";

import { getSiteCopy } from "../content/site";
import {
  blogFrontmatterSchema,
  docFrontmatterSchema,
  type BlogFrontmatter,
  type DocFrontmatter,
} from "./content-schema";
import type { Locale } from "./locales";
import { localizedPath } from "./locales";
import type { SearchEntry } from "./search";

export interface ContentHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

export interface ContentDocument<T> {
  frontmatter: T;
  content: string;
  headings: ContentHeading[];
  readingTimeMinutes: number;
}

export type DocDocument = ContentDocument<DocFrontmatter>;
export type BlogDocument = ContentDocument<BlogFrontmatter>;

const contentRoot = path.join(process.cwd(), "content");

export function slugifyHeading(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function extractHeadings(markdown: string): ContentHeading[] {
  return markdown
    .split("\n")
    .map((line) => /^(#{2,3})\s+(.+?)\s*$/.exec(line))
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => ({
      id: slugifyHeading(match[2] ?? ""),
      text: (match[2] ?? "")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/[`*_~]/g, ""),
      level: match[1]?.length === 3 ? 3 : 2,
    }));
}

export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[>*_~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function estimateReadingTime(markdown: string): number {
  const plain = markdownToPlainText(markdown);
  const cjkCharacters = plain.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)?.length ?? 0;
  const latinWords = plain
    .replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil((cjkCharacters + latinWords) / 250));
}

function markdownFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter((file) => file.endsWith(".md")).sort();
}

function readMarkdown(file: string): { data: unknown; content: string } {
  const parsed = matter(fs.readFileSync(file, "utf8"));
  return { data: parsed.data, content: parsed.content.trim() };
}

function readDocs(locale: Locale): DocDocument[] {
  const directory = path.join(contentRoot, "docs", locale);
  return markdownFiles(directory)
    .map((file) => {
      const parsed = readMarkdown(path.join(directory, file));
      const frontmatter = docFrontmatterSchema.parse(parsed.data);
      return {
        frontmatter,
        content: parsed.content,
        headings: extractHeadings(parsed.content),
        readingTimeMinutes: estimateReadingTime(parsed.content),
      };
    })
    .sort((a, b) => a.frontmatter.order - b.frontmatter.order);
}

function useStableEnglishHeadingIds<T extends DocDocument | BlogDocument>(
  locale: Locale,
  documents: T[],
  englishDocuments: T[],
): T[] {
  if (locale === "en") return documents;
  const englishBySlug = new Map(
    englishDocuments.map((document) => [document.frontmatter.slug, document]),
  );
  return documents.map((document) => {
    const english = englishBySlug.get(document.frontmatter.slug);
    if (!english || english.headings.length !== document.headings.length) return document;
    return {
      ...document,
      headings: document.headings.map((heading, index) => ({
        ...heading,
        id: english.headings[index]?.id ?? heading.id,
      })),
    };
  });
}

export function getAllDocs(locale: Locale, includeDrafts = false): DocDocument[] {
  const documents = readDocs(locale);
  const stableDocuments = useStableEnglishHeadingIds(locale, documents, locale === "en" ? documents : readDocs("en"));
  return stableDocuments.filter((document) => includeDrafts || !document.frontmatter.draft);
}

export function getDoc(locale: Locale, slug: string): DocDocument | undefined {
  return getAllDocs(locale).find((document) => document.frontmatter.slug === slug);
}

const categoryOrder: Record<BlogFrontmatter["category"], number> = {
  update: 0,
  design: 1,
  engineering: 2,
};

function readBlogPosts(locale: Locale): BlogDocument[] {
  const directory = path.join(contentRoot, "blog", locale);
  return markdownFiles(directory)
    .map((file) => {
      const parsed = readMarkdown(path.join(directory, file));
      const frontmatter = blogFrontmatterSchema.parse(parsed.data);
      return {
        frontmatter,
        content: parsed.content,
        headings: extractHeadings(parsed.content),
        readingTimeMinutes: estimateReadingTime(parsed.content),
      };
    })
    .sort((a, b) => {
      const dateOrder = b.frontmatter.date.localeCompare(a.frontmatter.date);
      if (dateOrder !== 0) return dateOrder;
      return categoryOrder[a.frontmatter.category] - categoryOrder[b.frontmatter.category];
    });
}

export function getAllBlogPosts(locale: Locale, includeDrafts = false): BlogDocument[] {
  const posts = readBlogPosts(locale);
  const stablePosts = useStableEnglishHeadingIds(locale, posts, locale === "en" ? posts : readBlogPosts("en"));
  return stablePosts.filter((document) => includeDrafts || !document.frontmatter.draft);
}

export function getBlogPost(locale: Locale, slug: string): BlogDocument | undefined {
  return getAllBlogPosts(locale).find((document) => document.frontmatter.slug === slug);
}

export function getSearchEntries(locale: Locale): SearchEntry[] {
  const copy = getSiteCopy(locale);
  const home: SearchEntry = {
    id: "home",
    type: "page",
    title: copy.nav.home,
    description: copy.home.description,
    href: localizedPath(locale),
    keywords: [copy.home.title, ...copy.home.capabilities.map((item) => item.title)],
    headings: [
      { id: "capabilities", text: copy.home.capabilitiesTitle },
      { id: "foundations", text: copy.home.foundationsTitle },
      { id: "latest", text: copy.home.latestTitle },
    ],
    body: copy.home.capabilities.map((item) => `${item.title} ${item.description}`).join(" "),
  };

  const docs = getAllDocs(locale).map<SearchEntry>((document) => ({
    id: `doc:${document.frontmatter.slug}`,
    type: "doc",
    title: document.frontmatter.title,
    description: document.frontmatter.description,
    href: localizedPath(locale, `/docs/${document.frontmatter.slug}`),
    keywords: document.frontmatter.keywords,
    headings: document.headings.map(({ id, text }) => ({ id, text })),
    body: markdownToPlainText(document.content),
  }));

  const blog = getAllBlogPosts(locale).map<SearchEntry>((document) => ({
    id: `blog:${document.frontmatter.slug}`,
    type: "blog",
    title: document.frontmatter.title,
    description: document.frontmatter.description,
    href: localizedPath(locale, `/blog/${document.frontmatter.slug}`),
    keywords: [document.frontmatter.category, ...document.frontmatter.tags],
    headings: document.headings.map(({ id, text }) => ({ id, text })),
    body: markdownToPlainText(document.content),
  }));

  return [home, ...docs, ...blog];
}

export function formatDate(date: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: locale === "zh" ? "numeric" : "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
