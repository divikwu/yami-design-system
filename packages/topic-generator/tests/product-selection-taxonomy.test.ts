import { describe, expect, it } from "vitest";
import {
  createCatalogTaxonomySnapshot,
  createLandingPageAgentTaxonomySnapshot,
  parseCatalogTaxonomySnapshot,
} from "../src/index.js";

describe("ProductSelection taxonomy artifacts", () => {
  it("creates a digest-bearing artifact and rejects changed category evidence", () => {
    const snapshot = createCatalogTaxonomySnapshot({
      site: "us",
      source: "imported-artifact",
      sourceRef: "catalog/categories.json",
      fetchedAt: "2026-08-18T00:00:00.000Z",
      categories: [{
        id: "1691",
        parentId: null,
        label: "Matcha",
        aliases: ["抹茶"],
        path: ["Tea & Beverages", "Tea", "Matcha"],
        level: 3,
        enabled: true,
      }],
    });

    expect(snapshot.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(parseCatalogTaxonomySnapshot(snapshot)).toEqual(snapshot);
    expect(() => parseCatalogTaxonomySnapshot({
      ...snapshot,
      categories: [{ ...snapshot.categories[0], label: "Changed" }],
    })).toThrow("digest");
  });

  it("imports the target repository TSV taxonomy without losing hierarchy", () => {
    const snapshot = createLandingPageAgentTaxonomySnapshot({
      site: "us",
      sourceRef: "catalog/categories.tsv",
      fetchedAt: "2026-08-18T00:00:00.000Z",
      tsv: [
        "category_id\tcategory_name\tcategory_ename\tparent_category_id\tlevel",
        "100\t饮品\tBeverages\t0\t1",
        "110\t茶\tTea\t100\t2",
        "111\t抹茶\tMatcha\t110\t3",
      ].join("\n"),
    });

    expect(snapshot).toMatchObject({
      source: "imported-artifact",
      sourceRef: "catalog/categories.tsv",
      categories: [
        {
          id: "100",
          parentId: null,
          label: "Beverages",
          aliases: ["饮品"],
          path: ["Beverages"],
          level: 1,
          enabled: true,
        },
        {
          id: "110",
          parentId: "100",
          label: "Tea",
          aliases: ["茶"],
          path: ["Beverages", "Tea"],
        },
        {
          id: "111",
          parentId: "110",
          label: "Matcha",
          aliases: ["抹茶"],
          path: ["Beverages", "Tea", "Matcha"],
        },
      ],
    });
    expect(parseCatalogTaxonomySnapshot(snapshot)).toEqual(snapshot);
  });

  it("promotes target repository TSV rows with missing parents to roots", () => {
    const snapshot = createLandingPageAgentTaxonomySnapshot({
      site: "us",
      sourceRef: "catalog/categories.tsv",
      fetchedAt: "2026-08-18T00:00:00.000Z",
      tsv: [
        "category_id\tcategory_name\tcategory_ename\tparent_category_id\tlevel",
        "111\t抹茶\tMatcha\t110\t3",
      ].join("\n"),
    });

    expect(snapshot.categories[0]).toMatchObject({
      id: "111",
      parentId: null,
      path: ["Matcha"],
    });
  });
});
