import { describe, expect, it } from "vitest";
import {
  parseSemanticProposal,
  resolveTopicIntent,
  SemanticProposalInputError,
  type SemanticProposal,
} from "../src/topic-intent.js";
import type { YamiSearchSnapshot } from "../src/types.js";

function catalogSnapshot(
  keyword: string,
  categories: Array<{ id: string; label: string }>,
): YamiSearchSnapshot {
  return {
    keyword,
    site: "us",
    sourceUrl: `https://example.com/catalog?q=${encodeURIComponent(keyword)}`,
    fetchedAt: "2026-08-17T00:00:00.000Z",
    provider: "yami-catalog-search",
    products: categories.map((category, index) => ({
      id: String(index + 1),
      title: `${category.label} product`,
      brand: "Yami selection",
      price: "$9.99",
      imageUrl: `https://example.com/${index + 1}.webp`,
      productUrl: `https://example.com/${index + 1}`,
      sourceRank: index + 1,
      categoryL1Id: 1,
      categoryL3Id: Number(category.id),
      categoryL1Name: "Catalog",
      categoryL3Name: category.label,
    })),
    evidence: {
      brands: [],
      categories: [
        { id: "1", label: "Catalog", aliases: ["Catalog"], path: ["Catalog"], resultCount: 2, productCount: 0 },
        ...categories.map((category) => ({
          ...category,
          aliases: [category.label],
          path: ["Catalog", category.label],
          resultCount: 1,
          productCount: 1,
        })),
      ],
      attributes: [],
    },
  };
}

describe("TopicIntent Module", () => {
  it("returns a contract error when canonicalEntity is missing", () => {
    expect(() => parseSemanticProposal({
      schemaVersion: "semantic-proposal/v1",
      themeType: "activity",
      entityType: "scenario",
      shoppingIntent: "assemble-scenario",
      needs: [],
      mustInclude: [],
      mustExclude: [],
      searchTerms: [],
    })).toThrow(SemanticProposalInputError);
  });

  it("requires every v2 scenario hypothesis to reference at least two categories", () => {
    expect(() => parseSemanticProposal({
      schemaVersion: "semantic-proposal/v2",
      themeType: "activity",
      entityType: "scenario",
      canonicalEntity: { label: "movie night" },
      shoppingIntent: "assemble-scenario",
      needs: [],
      mustInclude: [],
      mustExclude: [],
      searchTerms: [],
      categoryHypotheses: [],
      scenarioHypotheses: [{
        name: "Share snacks",
        shoppingGoal: "Build a snack assortment.",
        categoryIds: ["101"],
        reason: "One category is not enough to support a scenario.",
      }],
    })).toThrow("must contain at least two category IDs");
  });

  it("accepts v2 category organization and scenarios without changing an exact brand", () => {
    const snapshot = catalogSnapshot("ANUA", [
      { id: "101", label: "Serums & Value Sets" },
      { id: "102", label: "Toners" },
      { id: "103", label: "Sheet Masks" },
    ]);
    snapshot.evidence!.brands = [{
      id: "100",
      label: "ANUA",
      aliases: ["ANUA"],
      resultCount: 12,
    }];
    const proposal = {
      schemaVersion: "semantic-proposal/v2",
      themeType: "brand",
      entityType: "brand",
      canonicalEntity: { id: "100", label: "ANUA" },
      shoppingIntent: "browse-brand",
      needs: [],
      mustInclude: ["ANUA"],
      mustExclude: [],
      searchTerms: ["ANUA"],
      categoryHypotheses: [
        {
          label: "Serums",
          role: "core",
          categoryIds: ["101"],
          reason: "A verified serum navigation category.",
        },
        {
          label: "Toners",
          role: "pairing",
          categoryIds: ["102"],
          reason: "A verified toner navigation category.",
        },
        {
          label: "Sheet masks",
          role: "accessory",
          categoryIds: ["103"],
          reason: "A verified sheet-mask navigation category.",
        },
      ],
      scenarioHypotheses: [{
        name: "Daily hydration routine",
        shoppingGoal: "Assemble a toner, serum, and mask routine.",
        categoryIds: ["101", "102", "103"],
        reason: "Three verified catalog categories support the routine.",
      }],
    } satisfies SemanticProposal;

    const result = resolveTopicIntent(snapshot, proposal);

    expect(result.intent).toMatchObject({
      themeType: "brand",
      entityType: "brand",
      canonicalEntity: { id: "100", label: "ANUA" },
      categoryHypotheses: [
        {
          label: "Serums",
          role: "core",
          categoryIds: ["101"],
          evidenceIds: ["catalog-category:101"],
        },
        {
          label: "Toners",
          role: "pairing",
          categoryIds: ["102"],
          evidenceIds: ["catalog-category:102"],
        },
        {
          label: "Sheet masks",
          role: "accessory",
          categoryIds: ["103"],
          evidenceIds: ["catalog-category:103"],
        },
      ],
      scenarioHypotheses: [{
        name: "Daily hydration routine",
        categoryIds: ["101", "102", "103"],
      }],
    });
    expect(result.intent.categories.slice(0, 3).map(({ id }) => id)).toEqual([
      "101",
      "102",
      "103",
    ]);
    expect(result.intent.conditions).toContain("Daily hydration routine");
    expect(result.proposalReview).toMatchObject({
      status: "accepted",
      rejectedFields: [],
      warnings: [],
    });
  });

  it("accepts a shopper-facing category that merges multiple verified catalog leaves", () => {
    const snapshot = catalogSnapshot("ANUA", [
      { id: "101", label: "Cleansers" },
      { id: "102", label: "Acne Care" },
    ]);
    snapshot.evidence!.brands = [{
      id: "100",
      label: "ANUA",
      aliases: ["ANUA"],
      resultCount: 8,
    }];
    const result = resolveTopicIntent(snapshot, {
      schemaVersion: "semantic-proposal/v2",
      themeType: "brand",
      entityType: "brand",
      canonicalEntity: { id: "100", label: "ANUA" },
      shoppingIntent: "browse-brand",
      needs: [],
      mustInclude: ["ANUA"],
      mustExclude: [],
      searchTerms: ["ANUA"],
      categoryHypotheses: [{
        label: "面膜",
        role: "core",
        categoryIds: ["101", "102"],
        reason: "片状面膜与睡眠面膜属于同一购物心智，可以集中浏览。",
      }],
      scenarioHypotheses: [],
    });

    expect(result.intent.categoryHypotheses).toEqual([{
      label: "面膜",
      role: "core",
      categoryIds: ["101", "102"],
      evidenceIds: ["catalog-category:101", "catalog-category:102"],
      reason: "片状面膜与睡眠面膜属于同一购物心智，可以集中浏览。",
    }]);
    expect(result.proposalReview).toMatchObject({
      status: "accepted",
      rejectedFields: [],
      warnings: [],
    });
  });

  it("accepts every catalog-backed category hypothesis without a fixed display cap", () => {
    const categories = Array.from({ length: 7 }, (_, index) => ({
      id: String(101 + index),
      label: `Category ${index + 1}`,
    }));
    const snapshot = catalogSnapshot("ANUA", categories);
    snapshot.evidence!.brands = [{
      id: "100",
      label: "ANUA",
      aliases: ["ANUA"],
      resultCount: 28,
    }];
    const proposal = {
      schemaVersion: "semantic-proposal/v2",
      themeType: "brand",
      entityType: "brand",
      canonicalEntity: { id: "100", label: "ANUA" },
      shoppingIntent: "browse-brand",
      needs: [],
      mustInclude: ["ANUA"],
      mustExclude: [],
      searchTerms: ["ANUA"],
      categoryHypotheses: categories.map((category, index) => ({
        label: `分类 ${index + 1}`,
        role: "core" as const,
        categoryIds: [category.id],
        reason: `目录分类 ${category.id} 的导航入口。`,
      })),
      scenarioHypotheses: [],
    } satisfies SemanticProposal;

    const result = resolveTopicIntent(snapshot, proposal);

    expect(result.intent.categoryHypotheses).toHaveLength(7);
    expect(result.proposalReview.rejectedFields).toEqual([]);
  });

  it("rejects v2 hypotheses that reuse or invent catalog category IDs", () => {
    const proposal = {
      schemaVersion: "semantic-proposal/v2",
      themeType: "activity",
      entityType: "scenario",
      canonicalEntity: { label: "movie night" },
      shoppingIntent: "assemble-scenario",
      needs: ["Popcorn", "Soft Drinks"],
      mustInclude: ["movie night"],
      mustExclude: [],
      searchTerms: ["movie night", "Popcorn", "Soft Drinks"],
      categoryHypotheses: [
        {
          label: "Snacks",
          role: "core",
          categoryIds: ["101"],
          reason: "Backed by the Popcorn category.",
        },
        {
          label: "Duplicate snacks",
          role: "pairing",
          categoryIds: ["101"],
          reason: "Reuses a category already owned by another display group.",
        },
        {
          label: "Invented",
          role: "accessory",
          categoryIds: ["999"],
          reason: "The category does not exist in catalog evidence.",
        },
      ],
      scenarioHypotheses: [{
        name: "Unsupported scene",
        shoppingGoal: "Use an invented catalog category.",
        categoryIds: ["101", "999"],
        reason: "One category is not catalog-backed.",
      }],
    } satisfies SemanticProposal;

    const result = resolveTopicIntent(
      catalogSnapshot("movie night", [
        { id: "101", label: "Popcorn" },
        { id: "102", label: "Soft Drinks" },
      ]),
      proposal,
    );

    expect(result.intent.categoryHypotheses).toHaveLength(1);
    expect(result.intent.scenarioHypotheses).toEqual([]);
    expect(result.proposalReview.status).toBe("partially-accepted");
    expect(result.proposalReview.rejectedFields).toEqual(expect.arrayContaining([
      "categoryHypotheses[1]",
      "categoryHypotheses[2]",
      "scenarioHypotheses[0]",
    ]));
  });

  it("accepts an Agent scenario proposal only when multiple catalog categories support it", () => {
    const proposal = {
      schemaVersion: "semantic-proposal/v1",
      themeType: "activity",
      entityType: "scenario",
      canonicalEntity: { label: "movie night" },
      shoppingIntent: "assemble-scenario",
      needs: ["Popcorn", "Soft Drinks"],
      mustInclude: ["movie night"],
      mustExclude: [],
      searchTerms: ["movie night", "Popcorn", "Soft Drinks"],
    } satisfies SemanticProposal;

    const result = resolveTopicIntent(
      catalogSnapshot("movie night", [
        { id: "101", label: "Popcorn" },
        { id: "102", label: "Soft Drinks" },
      ]),
      proposal,
    );

    expect(result.intent).toMatchObject({
      schemaVersion: "theme-intent/v2",
      themeType: "activity",
      entityType: "scenario",
      canonicalEntity: { id: "movie-night", label: "movie night" },
      shoppingIntent: "assemble-scenario",
      shopperAction: "bundle",
      needs: ["Popcorn", "Soft Drinks"],
      confidence: 0.78,
      decision: {
        status: "resolved",
        evidenceLevel: "medium",
        requiresAgentReview: false,
      },
    });
    expect(result.intent.constraints).toContainEqual(expect.objectContaining({
      value: "movie night",
      status: "unverified",
    }));
    expect(result.intent.reason).toContain("Semantic Proposal");
    expect(result.intent.reason).toContain("2 catalog categories");
    expect(result.proposalReview).toMatchObject({
      status: "accepted",
      rejectedFields: [],
    });
  });

  it("rejects an unsupported Agent entity and preserves exact catalog evidence", () => {
    const snapshot = catalogSnapshot("ANUA", [{ id: "500", label: "Toners" }]);
    snapshot.evidence!.brands = [{
      id: "100",
      label: "ANUA",
      aliases: ["ANUA", "艾诺碧"],
      resultCount: 12,
    }];

    const result = resolveTopicIntent(snapshot, {
      schemaVersion: "semantic-proposal/v1",
      themeType: "product",
      entityType: "category",
      canonicalEntity: { id: "nike", label: "Nike" },
      shoppingIntent: "find-product",
      needs: ["Shoes"],
      mustInclude: ["Nike"],
      mustExclude: [],
      searchTerms: ["Nike"],
    });

    expect(result.intent).toMatchObject({
      themeType: "brand",
      canonicalEntity: { id: "100", label: "ANUA" },
      confidence: 0.95,
    });
    expect(result.proposalReview.status).toBe("rejected");
    expect(result.proposalReview.rejectedFields).toEqual(expect.arrayContaining([
      "themeType",
      "entityType",
      "canonicalEntity",
      "mustInclude:Nike",
    ]));
  });
});
