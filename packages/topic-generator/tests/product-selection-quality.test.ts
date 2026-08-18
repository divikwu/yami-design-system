import { describe, expect, it } from "vitest";
import {
  analyzeCatalogCandidateQuality,
  type CatalogCandidateSnapshot,
} from "../src/index.js";

function product(id: string, categoryId: string) {
  return {
    id,
    title: `Product ${id}`,
    brand: "Fixture brand",
    price: "$1.00",
    imageUrl: `https://example.com/${id}.webp`,
    productUrl: `https://example.com/${id}`,
    sourceRank: 1,
    categoryL3Id: Number(categoryId),
  };
}

function fixture(): CatalogCandidateSnapshot {
  const categories = Array.from({ length: 10 }, (_, index) => {
    const id = String(1000 + index);
    return {
      id,
      label: `Category ${index + 1}`,
      role: index < 5 ? "core" as const : index < 8 ? "pairing" as const : "accessory" as const,
      productIds: [`${id}-a`, `${id}-b`, `${id}-c`],
    };
  });
  return {
    schemaVersion: "catalog-candidate-snapshot/v1",
    strategyRef: "category-role/landing-page-agent@1",
    keyword: "Matcha",
    site: "us",
    taxonomyDigest: "sha256:taxonomy",
    fetchedAt: "2026-08-18T00:00:00.000Z",
    digest: "sha256:candidate",
    source: {
      adapterId: "fixture",
      attempts: [
        ...categories.map(({ id }) => ({
          requestId: `category:${id}`,
          status: "succeeded" as const,
        })),
        { requestId: "discovery", status: "succeeded" },
      ],
    },
    categories,
    discoveryProductIds: [],
    products: categories.flatMap(({ id, productIds }) =>
      productIds.map((productId) => product(productId, id))
    ),
  };
}

describe("Catalog candidate quality report", () => {
  it("reports a healthy candidate snapshot without mutating it", () => {
    const snapshot = fixture();
    const before = structuredClone(snapshot);

    const report = analyzeCatalogCandidateQuality(snapshot);

    expect(report).toMatchObject({
      schemaVersion: "catalog-candidate-quality-report/v1",
      snapshotDigest: "sha256:candidate",
      status: "ok",
      summary: {
        attempts: { total: 11, succeeded: 11, failed: 0, expected: 11 },
        categories: { total: 10, empty: 0, lowCoverage: 0 },
        products: { total: 30, crossCategoryDuplicates: 0 },
      },
      issues: [],
    });
    expect(snapshot).toEqual(before);
  });

  it("surfaces request, coverage, membership, and duplicate risks", () => {
    const snapshot = fixture();
    snapshot.source.attempts = snapshot.source.attempts
      .filter(({ requestId }) => requestId !== "category:1001")
      .map((attempt) => attempt.requestId === "category:1000"
        ? { ...attempt, status: "failed" as const, errorCode: "timeout" }
        : attempt);
    snapshot.categories[0]!.productIds = [];
    snapshot.categories[1]!.productIds = ["1001-a", "1001-a"];
    snapshot.categories[2]!.productIds = ["1003-a"];

    const report = analyzeCatalogCandidateQuality(snapshot);

    expect(report.status).toBe("error");
    expect(report.issues.map(({ code }) => code)).toEqual(expect.arrayContaining([
      "request-failed",
      "missing-request",
      "empty-category",
      "low-category-coverage",
      "duplicate-product-in-category",
      "category-membership-mismatch",
      "cross-category-duplicate",
    ]));
    expect(report.summary.categories).toMatchObject({ empty: 1, lowCoverage: 3 });
  });

  it("warns when a low-coverage category label is absent from its product titles", () => {
    const snapshot = fixture();
    snapshot.categories[0] = {
      ...snapshot.categories[0]!,
      label: "Cooking Kettles",
      productIds: ["1000-a", "1000-b"],
    };
    snapshot.products = snapshot.products.map((candidate) =>
      candidate.id === "1000-a" || candidate.id === "1000-b"
        ? { ...candidate, title: `Matcha powder ${candidate.id}` }
        : candidate
    );

    const report = analyzeCatalogCandidateQuality(snapshot);

    expect(report.status).toBe("warning");
    expect(report.issues).toContainEqual(expect.objectContaining({
      code: "category-semantic-mismatch",
      severity: "medium",
      categoryId: "1000",
      message: "Category Cooking Kettles has low coverage and its label is not reflected in product titles.",
    }));
  });
});
