import { describe, expect, it, vi } from "vitest";
import {
  createCatalogTaxonomySnapshot,
  runProductSelectionAgentWorkflow,
  type CatalogCandidateAdapter,
  type CatalogCandidateQuery,
  type ProductRole,
  type ProductSelectionAgent,
  type YamiSearchSnapshot,
} from "../src/index.js";

const roles: ProductRole[] = [
  "core", "core", "core", "core", "core",
  "pairing", "pairing", "pairing",
  "accessory", "accessory",
];

function fixture() {
  const snapshot: YamiSearchSnapshot = {
    keyword: "Matcha",
    site: "us",
    sourceUrl: "https://example.com/search?q=Matcha",
    fetchedAt: "2026-08-18T00:00:00.000Z",
    products: [],
  };
  const taxonomySnapshot = createCatalogTaxonomySnapshot({
    site: "us",
    source: "imported-artifact",
    sourceRef: "fixtures/yami-us-taxonomy.tsv",
    fetchedAt: "2026-08-18T00:00:00.000Z",
    categories: [
      {
        id: "root",
        parentId: null,
        label: "Catalog",
        aliases: [],
        path: ["Catalog"],
        level: 1,
        enabled: true,
      },
      ...roles.map((_, index) => ({
        id: String(1000 + index),
        parentId: "root",
        label: `Matcha category ${index + 1}`,
        aliases: [],
        path: ["Catalog", `Matcha category ${index + 1}`],
        level: 2,
        enabled: true,
      })),
    ],
  });
  return { snapshot, taxonomySnapshot };
}

describe("ProductSelection Agent workflow", () => {
  it("runs the Matcha CategoryRole flow through two bounded Agent proposals", async () => {
    const { snapshot, taxonomySnapshot } = fixture();
    const queries: CatalogCandidateQuery[] = [];
    const candidateAdapter: CatalogCandidateAdapter = {
      id: "fixture-catalog",
      search: vi.fn(async (query) => {
        queries.push(query);
        const categoryId = query.categoryId;
        if (!categoryId) {
          return [{
            id: "discovery-product",
            title: "Discovery matcha product",
            brand: "Discovery brand",
            brandId: 99,
            price: "$9.99",
            imageUrl: "https://example.com/discovery.webp",
            productUrl: "https://example.com/discovery",
            sourceRank: 1,
            soldCount: 999,
          }];
        }
        return Array.from({ length: 4 }, (_, productIndex) => ({
          id: `product-${categoryId}-${productIndex}`,
          title: `Matcha product ${categoryId}-${productIndex}`,
          brand: `Brand ${categoryId}`,
          brandId: Number(categoryId),
          price: "$1.00",
          imageUrl: `https://example.com/${categoryId}-${productIndex}.webp`,
          productUrl: `https://example.com/${categoryId}-${productIndex}`,
          sourceRank: (Number(categoryId) - 1000) * 4 + productIndex + 1,
          categoryL3Id: Number(categoryId),
          soldCount: 1000 - Number(categoryId) - productIndex,
        }));
      }),
    };
    const proposeCategoryRoles = vi.fn<ProductSelectionAgent["proposeCategoryRoles"]>(
      async (run) => ({
        schemaVersion: "category-role-proposal/v1",
        keyword: run.context.keyword,
        strategyRef: run.strategyRef,
        taxonomyDigest: run.context.taxonomyDigest,
        categories: roles.map((role, index) => ({
          categoryId: String(1000 + index),
          role,
          reason: `Matcha role evidence ${index + 1}`,
        })),
      }),
    );
    const proposeScenes = vi.fn<ProductSelectionAgent["proposeScenes"]>(
      async (run) => ({
        schemaVersion: "scene-proposal/v1",
        keyword: run.context.keyword,
        strategyRef: run.strategyRef,
        candidateSnapshotDigest: run.candidateSnapshotDigest,
        scenes: Array.from({ length: 4 }, (_, sceneIndex) => ({
          id: `matcha-scene-${sceneIndex + 1}`,
          name: `Matcha scene ${sceneIndex + 1}`,
          title: `Matcha scene title ${sceneIndex + 1}`,
          description: `Matcha scene description ${sceneIndex + 1}`,
          productGroups: Array.from({ length: 2 }, (_, groupIndex) => {
            const slot = sceneIndex * 2 + groupIndex;
            return {
              core: `product-${1000 + slot % 5}-${Math.floor(slot / 5)}`,
              pairing: `product-${1005 + slot % 3}-${Math.floor(slot / 3)}`,
              accessory: `product-${1008 + slot % 2}-${Math.floor(slot / 2)}`,
            };
          }),
        })),
      }),
    );
    const agent: ProductSelectionAgent = {
      id: "fixture-agent",
      proposeCategoryRoles,
      proposeScenes,
    };

    const result = await runProductSelectionAgentWorkflow({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      candidateAdapter,
      agent,
      now: () => new Date("2026-08-18T00:01:00.000Z"),
    });

    expect(result.run).toMatchObject({
      status: "ready",
      result: {
        keyword: "Matcha",
        strategyRef: "category-role/landing-page-agent@1",
        selectedCategories: expect.arrayContaining([
          expect.objectContaining({ id: "1000", role: "core" }),
          expect.objectContaining({ id: "1009", role: "accessory" }),
        ]),
        scenes: { length: 4 },
      },
    });
    expect(proposeCategoryRoles).toHaveBeenCalledOnce();
    expect(proposeCategoryRoles.mock.calls[0]?.[0].context.categories).toHaveLength(11);
    expect(proposeScenes).toHaveBeenCalledOnce();
    expect(queries).toHaveLength(11);
    expect(queries.at(-1)).toMatchObject({ sort: "sold", limit: 200 });
    expect(result.artifacts).toMatchObject({
      agentId: "fixture-agent",
      categoryRoleProposal: { schemaVersion: "category-role-proposal/v1" },
      candidateSnapshot: {
        fetchedAt: "2026-08-18T00:01:00.000Z",
        source: { adapterId: "fixture-catalog" },
      },
      candidateQualityReport: {
        schemaVersion: "catalog-candidate-quality-report/v1",
        status: "ok",
        summary: { categories: { lowCoverage: 0 } },
      },
      sceneProposal: { schemaVersion: "scene-proposal/v1" },
    });
  });

  it("stops before catalog retrieval when an Agent category proposal is rejected", async () => {
    const { snapshot, taxonomySnapshot } = fixture();
    const search = vi.fn<CatalogCandidateAdapter["search"]>();
    const proposeScenes = vi.fn<ProductSelectionAgent["proposeScenes"]>();
    const result = await runProductSelectionAgentWorkflow({
      snapshot,
      strategyRef: "category-role/landing-page-agent@1",
      taxonomySnapshot,
      candidateAdapter: { id: "unused", search },
      agent: {
        id: "invalid-fixture-agent",
        proposeCategoryRoles: async (run) => ({
          schemaVersion: "category-role-proposal/v1",
          keyword: run.context.keyword,
          strategyRef: run.strategyRef,
          taxonomyDigest: run.context.taxonomyDigest,
          categories: [],
        }),
        proposeScenes,
      },
    });

    expect(result.run).toMatchObject({
      status: "blocked",
      issues: expect.arrayContaining(["Proposal must select exactly 10 categories."]),
    });
    expect(search).not.toHaveBeenCalled();
    expect(proposeScenes).not.toHaveBeenCalled();
    expect(result.artifacts.candidateSnapshot).toBeUndefined();
  });
});
