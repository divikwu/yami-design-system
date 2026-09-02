import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";
import { z } from "zod";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = path.resolve(appRoot, "../..");
const contentRoot = path.join(appRoot, "content");
const locales = ["zh", "en"];

const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const docSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  group: z.enum(["start", "ai", "collaboration", "maintenance", "resources"]),
  order: z.number().int().nonnegative(),
  keywords: z.array(z.string().min(1)).min(1),
  updatedAt: dateSchema,
  sourceRefs: z.array(z.string().min(1)).min(1),
  draft: z.boolean().optional().default(false),
});
const blogSchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  date: dateSchema,
  updatedAt: dateSchema.optional(),
  category: z.enum(["update", "design", "engineering"]),
  authors: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string().min(1)).max(4),
  relatedDocs: z.array(slugSchema).optional().default([]),
  coverAlt: z.string().min(1).optional(),
  draft: z.boolean().optional().default(false),
});

const errors = [];

function report(file, message) {
  errors.push(`${path.relative(repositoryRoot, file)}: ${message}`);
}

function slugifyHeading(value) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
}

function withoutCode(markdown) {
  return markdown.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
}

function readCollection(kind, locale, schema) {
  const directory = path.join(contentRoot, kind, locale);
  if (!fs.existsSync(directory)) {
    errors.push(`${path.relative(repositoryRoot, directory)}: directory is missing`);
    return [];
  }

  const files = fs.readdirSync(directory).filter((file) => file.endsWith(".md")).sort();
  const seenSlugs = new Set();
  const seenOrders = new Map();

  return files.flatMap((filename) => {
    const file = path.join(directory, filename);
    let parsed;
    try {
      parsed = matter(fs.readFileSync(file, "utf8"));
    } catch (error) {
      report(file, `cannot parse frontmatter: ${error.message}`);
      return [];
    }

    const result = schema.safeParse(parsed.data);
    if (!result.success) {
      for (const issue of result.error.issues) {
        report(file, `frontmatter.${issue.path.join(".") || "root"}: ${issue.message}`);
      }
      return [];
    }

    const frontmatter = result.data;
    if (path.basename(filename, ".md") !== frontmatter.slug) {
      report(file, `filename must match slug "${frontmatter.slug}"`);
    }
    if (seenSlugs.has(frontmatter.slug)) report(file, `duplicate slug "${frontmatter.slug}"`);
    seenSlugs.add(frontmatter.slug);

    if (kind === "docs") {
      const other = seenOrders.get(frontmatter.order);
      if (other) report(file, `order ${frontmatter.order} is also used by ${other}`);
      seenOrders.set(frontmatter.order, filename);
      for (const sourceRef of frontmatter.sourceRefs) {
        if (path.isAbsolute(sourceRef) || sourceRef.includes("..")) {
          report(file, `sourceRefs must be repository-relative: ${sourceRef}`);
        } else if (!fs.existsSync(path.join(repositoryRoot, sourceRef))) {
          report(file, `sourceRefs target does not exist: ${sourceRef}`);
        }
      }
    }

    validateMarkdown(file, parsed.content);
    return [{ file, frontmatter, content: parsed.content }];
  });
}

const tokenCss = fs.readFileSync(
  path.join(repositoryRoot, "packages/design-system/generated/tokens.css"),
  "utf8",
);
const tokenNames = new Set([...tokenCss.matchAll(/(--[a-z0-9-]+)\s*:/g)].map((match) => match[1]));

function filesBelow(directory, extensions) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return filesBelow(target, extensions);
    return extensions.some((extension) => entry.name.endsWith(extension)) ? [target] : [];
  });
}

function validateApplicationStyles() {
  const files = [
    ...filesBelow(path.join(appRoot, "app"), [".css", ".tsx"]),
    ...filesBelow(path.join(appRoot, "components"), [".css", ".tsx"]),
  ];
  const sources = files.map((file) => ({ file, code: fs.readFileSync(file, "utf8") }));
  const localTokens = new Set(["--font-yami"]);

  for (const { code } of sources) {
    for (const match of code.matchAll(/(--[a-z0-9-]+)\s*:/g)) localTokens.add(match[1]);
  }

  for (const { file, code } of sources) {
    const relativeFile = path.relative(appRoot, file);
    // Base UI Select.Positioner supplies geometry at runtime, not design tokens.
    const positioningVariables = relativeFile === "components/DocsMobileControls.module.css"
      ? new Set(["--anchor-width", "--available-width", "--available-height"])
      : new Set();
    for (const match of code.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
      if (!tokenNames.has(match[1]) && !localTokens.has(match[1]) && !positioningVariables.has(match[1])) {
        report(file, `unknown design token ${match[1]}`);
      }
    }

    const allowedVisualException = relativeFile === "components/HomePage.module.css"
      ? "astryx-static-hero-frame"
      : relativeFile === "components/SiteHeader.module.css"
        ? "astryx-static-hero-nav"
        : relativeFile === "components/DocsMobileControls.module.css"
          ? "docsite-chapter-menu-shadow"
          : null;
    const visualRuleCode = allowedVisualException
      ? code.replace(
          new RegExp(
            `/\\*\\s*yami-visual-exception:start\\(${allowedVisualException}\\)\\s*\\*/[\\s\\S]*?/\\*\\s*yami-visual-exception:end\\(${allowedVisualException}\\)\\s*\\*/`,
            "g",
          ),
          "",
        )
      : code;

    const checks = [
      [/\b(?:linear|radial|conic)-gradient\s*\(/i, "gradients are not allowed"],
      [/\bbox-shadow\s*:/i, "box shadows are not allowed"],
      [/\bopacity\s*:/i, "component opacity states are not allowed"],
      [/#(?:[0-9a-f]{3,8})\b|\b(?:rgb|hsl)a?\s*\(/i, "literal colors are not allowed"],
    ];
    for (const [pattern, message] of checks) {
      if (pattern.test(visualRuleCode)) report(file, message);
    }

    for (const match of visualRuleCode.matchAll(/\b(font-size|border-radius)\s*:\s*([^;}]+)/gi)) {
      if (!match[2].trim().startsWith("var(")) {
        report(file, `${match[1]} must use a YAMI token`);
      }
    }

    if (/\p{Extended_Pictographic}/u.test(code)) report(file, "emoji are not allowed in product UI");
  }
}

function validateMarkdown(file, markdown) {
  const plainMarkdown = withoutCode(markdown);
  const headings = [...markdown.matchAll(/^(#{1,6})\s+(.+?)\s*$/gm)];
  const headingIds = new Set();

  for (const match of headings) {
    const level = match[1].length;
    if (level === 1 || level > 3) report(file, `content headings must use only h2 or h3: ${match[0]}`);
    const id = slugifyHeading(match[2]);
    if (!id) report(file, `heading cannot produce an anchor: ${match[0]}`);
    if (headingIds.has(id)) report(file, `duplicate heading anchor "#${id}"`);
    headingIds.add(id);
  }

  for (const match of plainMarkdown.matchAll(/^\s*<[A-Za-z][^>]*>/gm)) {
    report(file, `raw HTML or JSX is not allowed: ${match[0].trim()}`);
  }

  for (const match of markdown.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
    if (!match[1].trim()) report(file, `image alt text is required for ${match[2]}`);
  }

  for (const match of markdown.matchAll(/var\((--[a-z0-9-]+)\)/g)) {
    if (!tokenNames.has(match[1])) report(file, `unknown design token ${match[1]}`);
  }

}

function indexBySlug(items) {
  return new Map(items.map((item) => [item.frontmatter.slug, item]));
}

function comparePaired(kind, zhItems, enItems, fields) {
  const zh = indexBySlug(zhItems);
  const en = indexBySlug(enItems);
  const slugs = new Set([...zh.keys(), ...en.keys()]);

  for (const slug of slugs) {
    const zhItem = zh.get(slug);
    const enItem = en.get(slug);
    if (!zhItem) {
      report(enItem.file, `missing zh ${kind} pair for "${slug}"`);
      continue;
    }
    if (!enItem) {
      report(zhItem.file, `missing en ${kind} pair for "${slug}"`);
      continue;
    }
    for (const field of fields) {
      if (JSON.stringify(zhItem.frontmatter[field]) !== JSON.stringify(enItem.frontmatter[field])) {
        report(enItem.file, `${field} must match the zh pair for "${slug}"`);
      }
    }
    const zhHeadingLevels = [...zhItem.content.matchAll(/^(#{2,3})\s+/gm)].map((match) => match[1].length);
    const enHeadingLevels = [...enItem.content.matchAll(/^(#{2,3})\s+/gm)].map((match) => match[1].length);
    if (JSON.stringify(zhHeadingLevels) !== JSON.stringify(enHeadingLevels)) {
      report(enItem.file, `heading structure must match the zh pair for "${slug}"`);
    }
  }
}

const docs = Object.fromEntries(locales.map((locale) => [locale, readCollection("docs", locale, docSchema)]));
const blogs = Object.fromEntries(locales.map((locale) => [locale, readCollection("blog", locale, blogSchema)]));

comparePaired("document", docs.zh, docs.en, ["slug", "group", "order", "updatedAt", "sourceRefs", "draft"]);
comparePaired("Blog post", blogs.zh, blogs.en, ["slug", "date", "updatedAt", "category", "authors", "relatedDocs", "draft"]);

for (const locale of locales) {
  const docSlugs = new Set(docs[locale].map((item) => item.frontmatter.slug));
  for (const post of blogs[locale]) {
    for (const relatedDoc of post.frontmatter.relatedDocs) {
      if (!docSlugs.has(relatedDoc)) report(post.file, `related document does not exist: ${relatedDoc}`);
    }
  }
}

function markdownLinks(markdown) {
  return [...withoutCode(markdown).matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1].trim().split(/\s+/)[0])
    .filter(Boolean);
}

function stableAnchors(item, englishItem) {
  const localHeadings = [...item.content.matchAll(/^(#{2,3})\s+(.+?)\s*$/gm)];
  const englishHeadings = [...englishItem.content.matchAll(/^(#{2,3})\s+(.+?)\s*$/gm)];
  return new Set(
    localHeadings.map((heading, index) =>
      slugifyHeading((englishHeadings[index] ?? heading)[2]),
    ),
  );
}

function validateInternalLinks() {
  const routes = new Map();
  for (const locale of locales) {
    routes.set(`/${locale}`, new Set(["preview-title", "capabilities", "foundations", "latest"]));
    routes.set(`/${locale}/docs`, new Set());
    routes.set(`/${locale}/blog`, new Set());

    const englishDocs = indexBySlug(docs.en);
    const englishBlogs = indexBySlug(blogs.en);
    for (const item of docs[locale]) {
      routes.set(
        `/${locale}/docs/${item.frontmatter.slug}`,
        stableAnchors(item, englishDocs.get(item.frontmatter.slug) ?? item),
      );
    }
    for (const item of blogs[locale]) {
      routes.set(
        `/${locale}/blog/${item.frontmatter.slug}`,
        stableAnchors(item, englishBlogs.get(item.frontmatter.slug) ?? item),
      );
    }
  }

  for (const locale of locales) {
    for (const [kind, items] of [["docs", docs[locale]], ["blog", blogs[locale]]]) {
      for (const item of items) {
        const currentPath = `/${locale}/${kind}/${item.frontmatter.slug}`;
        for (const href of markdownLinks(item.content)) {
          if (/^(?:https?:|mailto:|tel:)/.test(href)) continue;
          const [rawPath, rawAnchor] = href.split("#", 2);
          const pathname = rawPath
            ? rawPath.startsWith("/")
              ? path.posix.normalize(rawPath)
              : path.posix.resolve(path.posix.dirname(currentPath), rawPath)
            : currentPath;
          const anchors = routes.get(pathname);
          if (!anchors) {
            report(item.file, `internal link target does not exist: ${href}`);
          } else if (rawAnchor && !anchors.has(rawAnchor)) {
            report(item.file, `internal link anchor does not exist: ${href}`);
          }
        }
      }
    }
  }
}

validateInternalLinks();

validateApplicationStyles();

if (errors.length > 0) {
  console.error(`Docsite content validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Docsite content valid: ${docs.zh.length} paired documents, ${blogs.zh.length} paired Blog posts, and ${tokenNames.size} generated tokens checked.`,
);
