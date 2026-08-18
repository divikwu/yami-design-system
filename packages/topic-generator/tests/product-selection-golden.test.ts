import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  evaluateProductSelectionGoldenCase,
  parseProductSelectionGoldenCases,
  type CatalogCandidateQualityReport,
  type CatalogCandidateSnapshot,
  type ProductSelectionRun,
} from "../src/index.js";

const goldenCases = parseProductSelectionGoldenCases(JSON.parse(readFileSync(
  fileURLToPath(new URL("../evals/product-selection-golden-cases.json", import.meta.url)),
  "utf8",
)));

const matchaCase = goldenCases.cases.find(({ id }) => id === "category-role-matcha")!;

function readyRun(): ProductSelectionRun {
  const roles = [
    "core", "core", "core", "core", "core",
    "pairing", "pairing", "pairing",
    "accessory", "accessory",
  ] as const;
  const moduleGroups = {
    "popular-picks": { groups: 5, productsPerGroup: 10 },
    "brand-spotlight": { groups: 6, productsPerGroup: 3 },
    "explore-more": { groups: 5, productsPerGroup: 1 },
  } as const;
  return {
    schemaVersion: "product-selection-run/v1",
    status: "ready",
    result: {
      schemaVersion: "product-selection-result/v1",
      strategyRef: "category-role/landing-page-agent@1",
      keyword: "Matcha",
      site: "us",
      selectedAt: "2026-08-18T00:00:00.000Z",
      pools: {
        primaryIds: Array.from({ length: 24 }, (_, index) => `selected-${index + 1}`),
        relatedIds: [],
      },
      products: [],
      selectedCategories: roles.map((role, index) => ({
        id: String(1000 + index),
        label: `Category ${index + 1}`,
        path: ["Catalog", `Category ${index + 1}`],
        role,
        reason: `Matcha role evidence ${index + 1}`,
      })),
      scenes: Array.from({ length: 4 }, (_, index) => ({
        id: `scene-${index + 1}`,
        name: `Scene ${index + 1}`,
        title: `Scene title ${index + 1}`,
        description: `Scene description ${index + 1}`,
        productGroups: Array.from({ length: 2 }, (_, groupIndex) => ({
          core: `scene-${index + 1}-core-${groupIndex + 1}`,
          pairing: null,
          accessory: null,
        })),
      })),
      modules: [
        {
          id: "start-here",
          productIds: Array.from({ length: 8 }, (_, index) => `start-${index + 1}`),
          groups: Array.from({ length: 4 }, (_, index) => ({
            id: `scene-${index + 1}`,
            label: `Scene ${index + 1}`,
            productIds: [`start-${index * 2 + 1}`, `start-${index * 2 + 2}`],
          })),
        },
        ...Object.entries(moduleGroups).map(([id, quota], moduleIndex) => ({
          id: id as keyof typeof moduleGroups,
          productIds: Array.from(
            { length: quota.groups * quota.productsPerGroup },
            (_, index) => `module-${moduleIndex + 1}-${index + 1}`,
          ),
          groups: Array.from({ length: quota.groups }, (_, index) => ({
            id: `${id}-${index + 1}`,
            label: `${id} ${index + 1}`,
            productIds: Array.from(
              { length: quota.productsPerGroup },
              (_, productIndex) =>
                `module-${moduleIndex + 1}-${index * quota.productsPerGroup + productIndex + 1}`,
            ),
          })),
        })),
      ],
    },
  };
}

function candidateSnapshot(): CatalogCandidateSnapshot {
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
        ...Array.from({ length: 10 }, (_, index) => ({
          requestId: `category:${1000 + index}`,
          status: "succeeded" as const,
        })),
        { requestId: "discovery", status: "succeeded" },
      ],
    },
    categories: [],
    discoveryProductIds: [],
    products: [],
  };
}

const qualityReport: CatalogCandidateQualityReport = {
  schemaVersion: "catalog-candidate-quality-report/v1",
  snapshotDigest: "sha256:candidate",
  strategyRef: "category-role/landing-page-agent@1",
  status: "warning",
  summary: {
    attempts: { total: 11, succeeded: 11, failed: 0, expected: 11 },
    categories: { total: 10, empty: 0, lowCoverage: 1 },
    products: {
      total: 30,
      assigned: 30,
      discovery: 20,
      unassigned: 0,
      crossCategoryDuplicates: 0,
    },
  },
  categories: [],
  issues: [{
    code: "low-category-coverage",
    severity: "medium",
    message: "Category 1009 has fewer than 3 products.",
    categoryId: "1009",
    actual: 2,
    expectedMinimum: 3,
  }],
};

describe("ProductSelection Matcha golden case", () => {
  it("covers brand, category, and scenario strategy boundaries", () => {
    expect(goldenCases.cases.map((goldenCase) => ({
      keyword: goldenCase.keyword,
      themeKind: (goldenCase as typeof goldenCase & { themeKind?: string }).themeKind,
    }))).toEqual([
      { keyword: "ANUA", themeKind: "brand" },
      { keyword: "COSRX", themeKind: "brand" },
      { keyword: "Matcha", themeKind: "category" },
      { keyword: "Ramen", themeKind: "category" },
      { keyword: "Sunscreen", themeKind: "category" },
      { keyword: "Hot Pot", themeKind: "scenario" },
      { keyword: "Home Storage", themeKind: "scenario" },
      { keyword: "Laundry Day", themeKind: "scenario" },
    ]);
    expect(goldenCases.cases.every((goldenCase) =>
      !JSON.stringify(goldenCase).includes("productIds")
    )).toBe(true);
  });

  it("checks stable strategy invariants without pinning product IDs", () => {
    expect(matchaCase).toMatchObject({
      id: "category-role-matcha",
      keyword: "Matcha",
      strategyRef: "category-role/landing-page-agent@1",
      expected: {
        moduleGroups: {
          "popular-picks": { productsPerGroup: { minimum: 1, maximum: 10 } },
          "brand-spotlight": { productsPerGroup: { minimum: 3, maximum: 3 } },
          "explore-more": { productsPerGroup: { minimum: 1, maximum: 18 } },
        },
      },
    });
    expect(JSON.stringify(matchaCase)).not.toContain("productIds");

    const evaluation = evaluateProductSelectionGoldenCase(matchaCase, {
      run: readyRun(),
      candidateSnapshot: candidateSnapshot(),
      candidateQualityReport: qualityReport,
    });

    expect(evaluation).toMatchObject({
      schemaVersion: "product-selection-golden-evaluation/v1",
      caseId: "category-role-matcha",
      status: "passed",
      mismatches: [],
    });
  });

  it("fails when a stable invariant regresses", () => {
    const run = readyRun();
    if (run.status !== "ready") throw new Error("Fixture must be ready.");
    run.result.modules[1]!.groups.pop();

    const evaluation = evaluateProductSelectionGoldenCase(matchaCase, {
      run,
      candidateSnapshot: candidateSnapshot(),
      candidateQualityReport: qualityReport,
    });

    expect(evaluation.status).toBe("failed");
    expect(evaluation.mismatches).toContain(
      "popular-picks group count expected 5-5 but received 4.",
    );
  });

  it("fails when a module group exceeds its configured product quota", () => {
    const run = readyRun();
    if (run.status !== "ready") throw new Error("Fixture must be ready.");
    const popular = run.result.modules.find(({ id }) => id === "popular-picks")!;
    popular.groups[0]!.productIds.push("popular-over-quota");
    popular.productIds.push("popular-over-quota");

    const evaluation = evaluateProductSelectionGoldenCase(matchaCase, {
      run,
      candidateSnapshot: candidateSnapshot(),
      candidateQualityReport: qualityReport,
    });

    expect(evaluation.status).toBe("failed");
    expect(evaluation.mismatches).toContain(
      "popular-picks group popular-picks-1 product count expected 1-10 but received 11.",
    );
  });
});
