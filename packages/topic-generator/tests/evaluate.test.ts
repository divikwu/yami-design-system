import { describe, expect, it } from "vitest";
import type { TopicIntentAnalysis } from "../src/analyze.js";
import {
  evaluateTopicIntentCases,
  parseTopicIntentEvalCases,
  TopicIntentEvalInputError,
} from "../src/evaluate.js";
import { parseYamiCatalogResponse } from "../src/yami-catalog.js";

function brandAnalysis(): TopicIntentAnalysis {
  const result = parseYamiCatalogResponse("ANUA", {
    messageId: "10000",
    body: {
      brandAgg: [{ brand_id: 100, brand_ename: "ANUA", result_count: 1 }],
      categoryAgg: [{
        category_id: 5,
        category_ename: "Beauty",
        children: [{
          category_id: 500,
          category_ename: "Toners",
          result_count: 1,
          children: [],
        }],
      }],
      items: [{
        item_number: "1001",
        goods_ename: "ANUA Toner",
        brand_id: 100,
        brand_ename: "ANUA",
        category_l1_id: 5,
        category_l3_id: 500,
        image_url: "/item/anua.webp",
        slug: "anua-toner",
        status: "A",
        goods_number: 1,
      }],
    },
  });
  return {
    intent: result.intent,
    snapshot: result.snapshot,
    fallbackUsed: false,
    attempts: [{ adapterId: "fixture", status: "succeeded" }],
    proposalReview: {
      status: "not-provided",
      acceptedFields: [],
      rejectedFields: [],
      warnings: [],
    },
  };
}

describe("TopicIntent semantic-contract evaluation", () => {
  it("validates the evaluation case contract", () => {
    expect(() => parseTopicIntentEvalCases([{ id: "missing-expectation" }])).toThrow(
      TopicIntentEvalInputError,
    );
  });

  it("reports semantic mismatches separately from live catalog failures", async () => {
    const cases = parseTopicIntentEvalCases([
      {
        id: "brand-anua",
        keyword: "ANUA",
        description: "Exact brand",
        expected: {
          themeType: "brand",
          entityType: "brand",
          shopperAction: "browse",
          canonicalLabel: "ANUA",
        },
      },
      {
        id: "wrong-expectation",
        keyword: "ANUA",
        description: "Intentional mismatch",
        expected: {
          themeType: "product",
          entityType: "category",
          shopperAction: "find",
        },
      },
    ]);
    const report = await evaluateTopicIntentCases(cases, async () => brandAnalysis());

    expect(report.summary).toEqual({
      total: 2,
      passed: 1,
      failed: 1,
      errors: 0,
      passRate: 0.5,
    });
    expect(report.results[1]).toMatchObject({
      status: "failed",
      mismatches: expect.arrayContaining([
        "themeType: expected product, received brand",
        "entityType: expected category, received brand",
      ]),
    });
  });
});
