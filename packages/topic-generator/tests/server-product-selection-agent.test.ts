import { describe, expect, it, vi } from "vitest";
import {
  createCatalogTaxonomySnapshot,
  handleTopicGeneratorPost,
  type CatalogCandidateAdapter,
  type CatalogSnapshotAdapter,
  type ProductRole,
  type ProductSelectionAgent,
} from "../src/index.js";

const roles: ProductRole[] = [
  "core", "core", "core", "core", "core",
  "pairing", "pairing", "pairing",
  "accessory", "accessory",
];

function runtimeFixture() {
  const taxonomySnapshot = createCatalogTaxonomySnapshot({
    site: "us",
    source: "imported-artifact",
    sourceRef: "fixtures/categories.tsv",
    fetchedAt: "2026-08-18T00:00:00.000Z",
    categories: roles.map((_, index) => ({
      id: String(1000 + index),
      parentId: null,
      label: `Matcha category ${index + 1}`,
      aliases: [],
      path: [`Matcha category ${index + 1}`],
      level: 3,
      enabled: true,
    })),
  });
  const adapters: CatalogSnapshotAdapter[] = [{
    id: "fixture-topic-catalog",
    load: async () => ({
      keyword: "Matcha",
      site: "us",
      sourceUrl: "https://example.com/search?q=Matcha",
      fetchedAt: "2026-08-18T00:00:00.000Z",
      provider: "yami-catalog-search",
      products: [{
        id: "topic-product",
        title: "Matcha powder",
        brand: "Matcha Brand",
        price: "$10.00",
        imageUrl: "https://example.com/topic.webp",
        productUrl: "https://example.com/topic-product",
        sourceRank: 1,
        categoryL3Id: 1000,
        categoryL3Name: "Matcha category 1",
      }],
      evidence: {
        brands: [{
          id: "matcha-brand",
          label: "Matcha Brand",
          aliases: ["Matcha Brand"],
          resultCount: 1,
        }],
        categories: [{
          id: "1000",
          label: "Matcha category 1",
          aliases: [],
          path: ["Matcha category 1"],
          resultCount: 1,
          productCount: 1,
        }],
        attributes: [],
      },
    }),
  }];
  const search = vi.fn<CatalogCandidateAdapter["search"]>(async (query) => {
    const categoryId = query.categoryId;
    if (!categoryId) {
      return [{
        id: "discovery-product",
        title: "Discovery product",
        brand: "Discovery Brand",
        brandId: 99,
        price: "$1.00",
        imageUrl: "https://example.com/discovery.webp",
        productUrl: "https://example.com/discovery",
        sourceRank: 1,
        soldCount: 999,
      }];
    }
    return Array.from({ length: 4 }, (_, productIndex) => ({
      id: `product-${categoryId}-${productIndex}`,
      title: `Matcha category ${Number(categoryId) - 999} product ${productIndex + 1}`,
      brand: `Brand ${categoryId}`,
      brandId: Number(categoryId),
      price: "$1.00",
      imageUrl: `https://example.com/${categoryId}-${productIndex}.webp`,
      productUrl: `https://example.com/${categoryId}-${productIndex}`,
      sourceRank: (Number(categoryId) - 1000) * 4 + productIndex + 1,
      categoryL3Id: Number(categoryId),
      soldCount: 10 - productIndex,
    }));
  });
  const agent: ProductSelectionAgent = {
    id: "fixture-agent",
    proposeCategoryRoles: async (run) => ({
      schemaVersion: "category-role-proposal/v1",
      keyword: run.context.keyword,
      strategyRef: run.strategyRef,
      taxonomyDigest: run.context.taxonomyDigest,
      categories: roles.map((role, index) => ({
        categoryId: String(1000 + index),
        role,
        reason: `Reviewable reason ${index + 1}`,
      })),
    }),
    proposeScenes: async (run) => ({
      schemaVersion: "scene-proposal/v1",
      keyword: run.context.keyword,
      strategyRef: run.strategyRef,
      candidateSnapshotDigest: run.candidateSnapshotDigest,
      scenes: Array.from({ length: 4 }, (_, sceneIndex) => ({
        id: `scene-${sceneIndex + 1}`,
        name: `Scene ${sceneIndex + 1}`,
        title: `Scene title ${sceneIndex + 1}`,
        description: `Scene description ${sceneIndex + 1}`,
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
  };
  return {
    taxonomySnapshot,
    adapters,
    candidateAdapter: { id: "fixture-candidates", search } satisfies CatalogCandidateAdapter,
    agent,
    search,
  };
}

describe("Topic Generator automatic category-role Host integration", () => {
  it("reports an explicit downstream automation blocker instead of a fake page preview", async () => {
    const fixture = runtimeFixture();
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({
          keyword: "Matcha",
          strategy: "relevance",
          mode: "page",
          language: "zh",
        }),
      }),
      {
        adapters: fixture.adapters,
        requireAutomaticPage: true,
        pageAutomationConfigurationIssues: [
          "TOPIC_GENERATOR_PAGE_AGENT_ENDPOINT is not configured.",
          "TOPIC_GENERATOR_ASSET_ROOT is not configured.",
        ],
      },
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(payload).toMatchObject({
      selectionRuns: { relevance: { status: "ready" } },
      automation: {
        schemaVersion: "topic-page-automation-run/v1",
        status: "blocked",
        stage: "workflow-planning",
        issues: [
          "TOPIC_GENERATOR_PAGE_AGENT_ENDPOINT is not configured.",
          "TOPIC_GENERATOR_ASSET_ROOT is not configured.",
        ],
      },
    });
  });

  it("keeps explicit Codex/Kiro handoff resumable without invoking the HTTP Agent", async () => {
    const fixture = runtimeFixture();
    const proposeCategoryRoles = vi.spyOn(fixture.agent, "proposeCategoryRoles");
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({
          keyword: "Matcha",
          strategy: "category-role",
          agentMode: "interactive",
        }),
      }),
      {
        adapters: fixture.adapters,
        taxonomySnapshot: fixture.taxonomySnapshot,
        productSelectionAgent: fixture.agent,
        candidateAdapter: fixture.candidateAdapter,
        requireAutomaticCategoryRole: true,
      },
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(payload).toMatchObject({
      selectionRuns: {
        "category-role": {
          status: "needs-category-proposal",
          context: { keyword: "Matcha", categories: { length: 10 } },
        },
      },
      runtime: {
        categoryRole: {
          mode: "resumable",
          agent: { status: "missing" },
        },
      },
    });
    expect(proposeCategoryRoles).not.toHaveBeenCalled();
    expect(fixture.search).not.toHaveBeenCalled();
  });

  it("runs taxonomy, Agent proposals, candidates, and PagePlan in one request", async () => {
    const fixture = runtimeFixture();
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({
          keyword: "Matcha",
          strategy: "category-role",
          taxonomySnapshot: "browser-supplied-taxonomy-must-be-ignored",
          categoryRoleProposal: "browser-supplied-proposal-must-be-ignored",
          candidateSnapshot: "browser-supplied-candidates-must-be-ignored",
          sceneProposal: "browser-supplied-scenes-must-be-ignored",
        }),
      }),
      {
        adapters: fixture.adapters,
        taxonomySnapshot: fixture.taxonomySnapshot,
        productSelectionAgent: fixture.agent,
        candidateAdapter: fixture.candidateAdapter,
        requireAutomaticCategoryRole: true,
      },
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(payload).toMatchObject({
      plans: {
        zh: {
          "category-role": {
            selectionStrategy: { id: "category-role" },
          },
        },
      },
      selectionRuns: { "category-role": { status: "ready" } },
      runtime: {
        categoryRole: {
          mode: "automatic",
          taxonomy: { status: "ready", categoryCount: 10 },
          agent: { status: "ready", id: "fixture-agent" },
          stages: [
            { id: "taxonomy", status: "completed" },
            { id: "category-proposal", status: "completed" },
            { id: "candidate-retrieval", status: "completed" },
            { id: "scene-proposal", status: "completed" },
            { id: "selection", status: "completed" },
          ],
          candidateAttempts: { succeeded: 11, total: 11 },
          candidateQuality: {
            status: "ok",
            issueCount: 0,
            emptyCategories: 0,
            lowCoverageCategories: 0,
          },
          categoryRoleDistribution: { core: 5, pairing: 3, accessory: 2 },
          sceneCount: 4,
        },
      },
      artifacts: {
        candidateQualityReport: {
          schemaVersion: "catalog-candidate-quality-report/v1",
          status: "ok",
        },
      },
    });
    expect(fixture.search).toHaveBeenCalledTimes(11);
  });

  it("returns actionable blockers when the automatic Host is not configured", async () => {
    const fixture = runtimeFixture();
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "Matcha", strategy: "category-role" }),
      }),
      {
        adapters: fixture.adapters,
        requireAutomaticCategoryRole: true,
        categoryRoleConfigurationIssues: [
          "TOPIC_GENERATOR_TAXONOMY_PATH is not configured.",
          "TOPIC_GENERATOR_AGENT_ENDPOINT is not configured.",
        ],
      },
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(payload).toMatchObject({
      selectionRuns: {
        "category-role": {
          status: "blocked",
          issues: [
            "TOPIC_GENERATOR_TAXONOMY_PATH is not configured.",
            "TOPIC_GENERATOR_AGENT_ENDPOINT is not configured.",
          ],
        },
      },
      runtime: {
        categoryRole: {
          mode: "automatic",
          taxonomy: { status: "missing" },
          agent: { status: "missing" },
        },
      },
    });
  });
});
