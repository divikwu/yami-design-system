import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  estimateReadingTime,
  extractHeadings,
  getAllBlogPosts,
  getAllDocs,
  getDoc,
  getSearchEntries,
  slugifyHeading,
  sortBlogPostsByUpdatedAt,
} from "../../lib/content";
import { docGroups, storybookResources } from "../../lib/docs-navigation";
import legacyDocRedirects from "../../lib/legacy-doc-redirects.json";
import nextConfig from "../../next.config";

describe("repository content", () => {
  it("keeps all documents paired with stable structural metadata", () => {
    const zh = getAllDocs("zh");
    const en = getAllDocs("en");
    expect(zh).toHaveLength(13);
    expect(en).toHaveLength(13);
    expect(en.map((item) => item.frontmatter.slug)).toEqual(
      zh.map((item) => item.frontmatter.slug),
    );
    expect(en.map((item) => item.frontmatter.order)).toEqual(
      zh.map((item) => item.frontmatter.order),
    );
    expect(zh.every((item) => item.frontmatter.draft === false)).toBe(true);
    expect([...new Set(zh.map((item) => item.frontmatter.group))]).toEqual(docGroups);
    expect(zh[0]?.frontmatter.title).toBe("快速开始");
    for (const [index, document] of zh.entries()) {
      expect(document.headings.map(({ id, level }) => ({ id, level }))).toEqual(
        en[index]?.headings.map(({ id, level }) => ({ id, level })),
      );
    }
  });

  it("redirects archived routes in both locales without exposing them in search", async () => {
    const redirects = await nextConfig.redirects?.();
    for (const locale of ["zh", "en"] as const) {
      const searchIds = getSearchEntries(locale).map((item) => item.id);
      for (const [slug, destination] of Object.entries(legacyDocRedirects)) {
        expect(getDoc(locale, slug)).toBeUndefined();
        expect(searchIds).not.toContain(`doc:${slug}`);
        const href = destination.startsWith("https://") ? destination : `/${locale}${destination}`;
        expect(redirects).toContainEqual({ source: `/${locale}/docs/${slug}`, destination: href, permanent: true });
        if (destination.startsWith("/docs/")) {
          const [targetSlug, anchor] = destination.slice("/docs/".length).split("#");
          const target = getDoc(locale, targetSlug ?? "");
          expect(target).toBeDefined();
          if (anchor) expect(target?.headings.map(({ id }) => id)).toContain(anchor);
        } else {
          expect(new URL(destination).hostname).toBe("yds-storybook.vercel.app");
        }
      }
    }
  });

  it("provides localized Skill source for copying without exposing its headings as page anchors", () => {
    for (const locale of ["zh", "en"] as const) {
      const filename = locale === "zh" ? "SKILL.zh-CN.md" : "SKILL.md";
      const source = fs.readFileSync(path.join(process.cwd(), "../../packages/design-system", filename), "utf8");
      const document = getDoc(locale, "using-yami-with-ai")!;
      expect(document.sourceMarkdown).toBe(source);
      expect(document.content).toContain(`/${locale}/yami-skill.md`);
      expect(document.headings).toEqual([{ id: "full-skill", text: locale === "zh" ? "完整 Skill" : "Full Skill", level: 2 }]);
      expect(getSearchEntries(locale).find(({ id }) => id === "doc:using-yami-with-ai")?.body).toContain(locale === "zh" ? "AI Skill 规范" : "AI Skill Manifest");
    }
  });

  it("places component and page creation routes inside the AI workflow", () => {
    for (const locale of ["zh", "en"] as const) {
      const documents = getAllDocs(locale);
      expect(documents.filter(({ frontmatter }) => frontmatter.group === "start").map(({ frontmatter }) => frontmatter.slug)).toEqual([
        "fork-project",
        "getting-started",
        "browse-components",
      ]);
      expect(documents.slice(0, 8).map(({ frontmatter }) => frontmatter.slug)).toEqual([
        "fork-project",
        "getting-started",
        "browse-components",
        "using-yami-with-ai",
        "prepare-environment",
        "create-components",
        "choose-starting-point",
        "review-checklist",
      ]);
      const title = locale === "zh" ? "创建页面" : "Create a page";
      expect(getDoc(locale, "choose-starting-point")?.frontmatter).toMatchObject({ title, group: "ai" });
      expect(getDoc(locale, "create-components")?.frontmatter).toMatchObject({
        title: locale === "zh" ? "创建组件" : "Create a component",
        group: "ai",
      });
      expect(getSearchEntries(locale).find(({ id }) => id === "doc:choose-starting-point")).toMatchObject({
        title,
        href: `/${locale}/docs/choose-starting-point`,
      });
    }
  });

  it("provides concrete Storybook destinations for all three resource entries", () => {
    expect(Object.keys(storybookResources)).toEqual(["components", "foundations", "pages"]);
    for (const href of Object.values(storybookResources)) {
      expect(new URL(href).searchParams.get("path")).toMatch(/^\/story\/yami-/);
    }
  });

  it("excludes draft Blog posts from the public collection", () => {
    const posts = getAllBlogPosts("en");
    expect(posts.map((item) => item.frontmatter.slug)).toEqual([
      "build-test-document-components-with-storybook",
      "motion-for-react-in-yami-canvas",
      "yami-prototype-architecture-and-motion",
    ]);
    expect(posts.every((item) => item.frontmatter.category === "engineering")).toBe(true);
    expect(posts.every((item) => item.frontmatter.draft === false)).toBe(true);
  });

  it("sorts Blog posts by update date without mutating the source collection", () => {
    const posts = getAllBlogPosts("en");
    const sourceOrder = posts.map((item) => item.frontmatter.slug);
    const datedPosts = posts.map((item, index) => ({
      ...item,
      frontmatter: {
        ...item.frontmatter,
        date: `2026-08-${29 + index}`,
        updatedAt: index === 0 ? "2026-09-01" : undefined,
      },
    }));

    expect(sortBlogPostsByUpdatedAt(datedPosts).map((item) => item.frontmatter.slug)).toEqual([
      datedPosts[0]?.frontmatter.slug,
      datedPosts[2]?.frontmatter.slug,
      datedPosts[1]?.frontmatter.slug,
    ]);
    expect(posts.map((item) => item.frontmatter.slug)).toEqual(sourceOrder);
  });

  it("creates stable multilingual heading anchors", () => {
    expect(slugifyHeading("Light & Dark Mode")).toBe("light-dark-mode");
    expect(slugifyHeading("亮暗模式")).toBe("亮暗模式");
    expect(extractHeadings("## First\nText\n### Second")).toEqual([
      { id: "first", text: "First", level: 2 },
      { id: "second", text: "Second", level: 3 },
    ]);
  });

  it("estimates at least one minute for short and mixed-language content", () => {
    expect(estimateReadingTime("Short text.")).toBe(1);
    expect(estimateReadingTime("中文内容 mixed with English words.")).toBe(1);
  });
});
