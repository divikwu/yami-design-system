import { describe, expect, it } from "vitest";

import { applyMerchandisingVisualReview } from "../src/merchandising-visual-review.ts";

function run() {
  return {
    schemaVersion: "page-merchandising-run/v1",
    status: "needs-module-proposal",
    context: {
      products: [
        { id: "product-1", brand: "ANUA", soldCount: 120, sourceRank: 1 },
        { id: "product-6", brand: "ANUA", soldCount: 20, sourceRank: 6 },
      ],
      sourceScenes: [{
        id: "routine",
        productGroups: [{ core: "product-1" }, { core: "product-6" }],
      }],
    },
  };
}

function visualProposal(inspectedProductIds = ["product-6", "product-1"]) {
  return {
    schemaVersion: "module-merchandising-proposal/v1",
    visualReview: {
      schemaVersion: "module-merchandising-visual-review/v1",
      inspectedProductIds,
      duplicateGroups: [{
        productIds: ["product-1", "product-6"],
        reason: "Images and identity fields confirm one product and pack size.",
      }],
    },
    modules: [{
      id: "start-here",
      scenes: [{ id: "page-routine", sourceSceneId: "routine" }],
      assignments: [{ productId: "product-6", sceneId: "page-routine" }],
    }],
  };
}

describe("module merchandising visual review", () => {
  it("deterministically retains the higher-selling confirmed duplicate", () => {
    const proposal = applyMerchandisingVisualReview(
      run(),
      ["product-6", "product-1"],
      visualProposal(),
    );
    expect(proposal.modules).toEqual([expect.objectContaining({
      id: "start-here",
      assignments: [{
        productId: "product-1",
        sceneId: "page-routine",
        reuseReason: expect.stringContaining("stronger sales"),
      }],
    })]);
  });

  it("rejects a visual receipt that did not inspect the full shortlist", () => {
    expect(() => applyMerchandisingVisualReview(
      run(),
      ["product-6", "product-1"],
      visualProposal(["product-6"]),
    )).toThrow("confirm every shortlisted product image");
  });
});
