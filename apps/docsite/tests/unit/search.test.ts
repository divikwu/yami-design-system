import { describe, expect, it } from "vitest";

import { getSearchEntries } from "../../lib/content";
import { rankSearchEntries, type SearchEntry } from "../../lib/search";

function entry(overrides: Partial<SearchEntry> & Pick<SearchEntry, "id" | "title">): SearchEntry {
  return {
    type: "doc",
    description: "fallback description",
    href: `/zh/docs/${overrides.id}`,
    keywords: [],
    headings: [],
    body: "",
    ...overrides,
  };
}

describe("static search ranking", () => {
  it("uses the required priority order", () => {
    const entries = [
      entry({ id: "body", title: "Other", body: "Token appears in body" }),
      entry({ id: "heading", title: "Guide", headings: [{ id: "token", text: "Token foundations" }] }),
      entry({ id: "keyword", title: "System", keywords: ["Token"] }),
      entry({ id: "prefix", title: "Token workflow" }),
      entry({ id: "exact", title: "Token" }),
    ];

    expect(rankSearchEntries(entries, "token").map((result) => result.id)).toEqual([
      "exact",
      "prefix",
      "keyword",
      "heading",
      "body",
    ]);
  });

  it("matches Chinese text and returns a heading anchor match", () => {
    const results = rankSearchEntries(getSearchEntries("zh"), "设计规范");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((result) => result.id === "doc:browse-components")).toBe(true);
  });

  it("never mixes locale indexes", () => {
    const zhResults = rankSearchEntries(getSearchEntries("zh"), "Fork");
    const enResults = rankSearchEntries(getSearchEntries("en"), "Fork");
    expect(zhResults.length).toBeGreaterThan(0);
    expect(enResults.length).toBeGreaterThan(0);
    expect(zhResults.every((result) => result.href.startsWith("/zh/"))).toBe(true);
    expect(enResults.every((result) => result.href.startsWith("/en/"))).toBe(true);
  });

  it("returns no more than ten results by default", () => {
    const entries = Array.from({ length: 15 }, (_, index) =>
      entry({ id: String(index), title: `Guide ${index}`, keywords: ["shared"] }),
    );
    expect(rankSearchEntries(entries, "shared")).toHaveLength(10);
  });
});
