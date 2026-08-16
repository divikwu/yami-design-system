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
      themeType: "activity",
      entityType: "scenario",
      canonicalEntity: { id: "movie-night", label: "movie night" },
      shoppingIntent: "assemble-scenario",
      needs: ["Popcorn", "Soft Drinks"],
      confidence: 0.78,
    });
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
