import { describe, expect, it, vi } from "vitest";

import {
  handleTopicGeneratorPost,
  type CatalogSnapshotAdapter,
  type TopicIntentAgent,
} from "../src/index.js";

function catalogFixture() {
  const categories = [
    { id: "101", label: "Cleansers", path: ["Beauty", "Cleansers"] },
    { id: "102", label: "Toners", path: ["Beauty", "Toners"] },
    { id: "103", label: "Serums", path: ["Beauty", "Serums"] },
  ];
  const products = categories.flatMap((category, categoryIndex) =>
    Array.from({ length: 4 }, (_, productIndex) => ({
      id: `${category.id}-${productIndex + 1}`,
      title: `ANUA ${category.label} ${productIndex + 1}`,
      brand: "ANUA",
      price: "$19.99",
      imageUrl: `https://example.com/${category.id}-${productIndex + 1}.webp`,
      productUrl: `https://example.com/${category.id}-${productIndex + 1}`,
      sourceRank: categoryIndex * 4 + productIndex + 1,
      categoryL3Id: Number(category.id),
      categoryL3Name: category.label,
    })),
  );
  const adapter: CatalogSnapshotAdapter = {
    id: "fixture-topic-intent-catalog",
    load: async () => ({
      keyword: "ANUA",
      site: "us",
      sourceUrl: "https://example.com/search?q=ANUA",
      fetchedAt: "2026-08-20T00:00:00.000Z",
      provider: "yami-catalog-search",
      products,
      evidence: {
        brands: [{ id: "anua", label: "ANUA", aliases: ["ANUA"], resultCount: 12 }],
        categories: categories.map((category) => ({
          ...category,
          aliases: [],
          resultCount: 4,
          productCount: 4,
        })),
        attributes: [],
      },
    }),
  };
  return { adapter };
}

function semanticProposal() {
  return {
    schemaVersion: "semantic-proposal/v2",
    themeType: "brand",
    entityType: "brand",
    canonicalEntity: { id: "anua", label: "ANUA" },
    shoppingIntent: "browse-brand",
    needs: [],
    mustInclude: ["ANUA"],
    mustExclude: [],
    searchTerms: ["ANUA"],
    categoryHypotheses: [
      {
        label: "基础清洁",
        role: "core",
        categoryIds: ["101"],
        reason: "Cleansers are verified in the current catalog snapshot.",
      },
      {
        label: "补水护理",
        role: "pairing",
        categoryIds: ["102", "103"],
        reason: "Toners and serums are verified in the current catalog snapshot.",
      },
    ],
    scenarioHypotheses: [
      {
        name: "日常基础护理",
        shoppingGoal: "Complete a cleanser and toner routine.",
        categoryIds: ["101", "102"],
        reason: "The scene uses two verified catalog categories.",
      },
      {
        name: "集中补水护理",
        shoppingGoal: "Combine toner and serum products.",
        categoryIds: ["102", "103"],
        reason: "The scene uses two verified catalog categories.",
      },
    ],
  };
}

describe("Topic Generator automatic TopicIntent Agent integration", () => {
  it("uses a reviewed semantic proposal for relevance module grouping", async () => {
    const { adapter } = catalogFixture();
    const proposeSemanticIntent = vi.fn<TopicIntentAgent["proposeSemanticIntent"]>(
      async () => semanticProposal(),
    );
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({
          keyword: "ANUA",
          mode: "selection",
          strategy: "relevance",
          language: "zh",
        }),
      }),
      {
        adapters: [adapter],
        topicIntentAgent: { id: "topic-intent-agent", proposeSemanticIntent },
      },
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(proposeSemanticIntent).toHaveBeenCalledWith(expect.objectContaining({
      schemaVersion: "topic-intent-agent-run/v1",
      status: "needs-semantic-proposal",
      context: expect.objectContaining({
        keyword: "ANUA",
        categories: expect.arrayContaining([
          expect.objectContaining({ id: "101", label: "Cleansers", productCount: 4 }),
        ]),
      }),
    }));
    expect(payload.runtime.topicIntent).toMatchObject({
      mode: "automatic",
      status: "ready",
      agent: { status: "ready", id: "topic-intent-agent" },
      proposalReview: { status: "accepted" },
      categoryHypothesisCount: 2,
      scenarioHypothesisCount: 2,
      issues: [],
    });
    const shortcutModule = payload.plans.zh.relevance.modules.find(
      (module: { id: string }) => module.id === "shortcuts",
    );
    const startHereModule = payload.plans.zh.relevance.modules.find(
      (module: { id: string }) => module.id === "start-here",
    );
    expect(shortcutModule.groups.map(({ label }: { label: string }) => label)).toEqual([
      "基础清洁",
      "补水护理",
    ]);
    expect(startHereModule.groups.map(({ label }: { label: string }) => label)).toEqual([
      "日常基础护理",
      "集中补水护理",
    ]);
  });

  it("falls back to verified catalog groups when the Agent proposal is invalid", async () => {
    const { adapter } = catalogFixture();
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "ANUA", mode: "selection", strategy: "relevance" }),
      }),
      {
        adapters: [adapter],
        topicIntentAgent: {
          id: "topic-intent-agent",
          proposeSemanticIntent: async () => ({ schemaVersion: "invented-proposal/v9" }),
        },
      },
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(payload.selectionRuns.relevance.status).toBe("ready");
    expect(payload.runtime.topicIntent).toMatchObject({
      mode: "catalog-fallback",
      status: "fallback",
      agent: { status: "ready", id: "topic-intent-agent" },
    });
    expect(payload.runtime.topicIntent.issues[0]).toContain("schemaVersion");
    const shortcutModule = payload.plans.zh.relevance.modules.find(
      (module: { id: string }) => module.id === "shortcuts",
    );
    expect(shortcutModule.groups.map(({ label }: { label: string }) => label)).toEqual([
      "洁面",
      "爽肤水",
      "Serums",
    ]);
  });

  it("keeps rejected Agent fields visible while falling back to catalog groups", async () => {
    const { adapter } = catalogFixture();
    const proposal = semanticProposal();
    proposal.categoryHypotheses = [{
      ...proposal.categoryHypotheses[0],
      categoryIds: ["999"],
    }];
    proposal.scenarioHypotheses = [{
      ...proposal.scenarioHypotheses[0],
      categoryIds: ["998", "999"],
    }];
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "ANUA", mode: "selection", strategy: "relevance" }),
      }),
      {
        adapters: [adapter],
        topicIntentAgent: {
          id: "topic-intent-agent",
          proposeSemanticIntent: async () => proposal,
        },
      },
    );

    const payload = await response.json();
    expect(response.status, JSON.stringify(payload)).toBe(200);
    expect(payload.runtime.topicIntent).toMatchObject({
      mode: "catalog-fallback",
      status: "fallback",
      proposalReview: {
        status: "partially-accepted",
        rejectedFields: ["categoryHypotheses[0]", "scenarioHypotheses[0]"],
      },
    });
    expect(payload.runtime.topicIntent.issues).toEqual([
      "TopicIntent Agent proposal produced no accepted category or scenario hypotheses.",
    ]);
  });
});
