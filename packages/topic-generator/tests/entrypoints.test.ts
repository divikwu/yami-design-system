import { describe, expect, it } from "vitest";
import {
  buildTopicIntentReport,
  parseTopicGeneratorCliArgs,
  resolveTopicGeneratorPath,
} from "../src/cli.js";
import type { TopicIntentAnalysis } from "../src/analyze.js";
import { handleTopicGeneratorPost } from "../src/server.js";
import type { CatalogSnapshotAdapter } from "../src/catalog-snapshot.js";

describe("TOPIC GENERATOR portable entry points", () => {
  it("accepts either an explicit or positional keyword", () => {
    expect(parseTopicGeneratorCliArgs([
      "--keyword",
      "ANUA",
      "--pretty",
      "--proposal",
      "proposal.json",
      "--output",
      "runs",
    ])).toEqual({
      help: false,
      keyword: "ANUA",
      pretty: true,
      proposalPath: "proposal.json",
      outputDir: "runs",
    });
    expect(parseTopicGeneratorCliArgs(["home", "storage"]).keyword).toBe("home storage");
    expect(parseTopicGeneratorCliArgs(["--", "--help"]).help).toBe(true);
  });

  it("resolves proposal and output paths from the caller workspace", () => {
    expect(resolveTopicGeneratorPath("proposal.json", "/workspace")).toBe(
      "/workspace/proposal.json",
    );
    expect(resolveTopicGeneratorPath("/tmp/runs", "/workspace")).toBe("/tmp/runs");
  });

  it("returns a portable ThemeIntent report with evidence", () => {
    const analysis = {
      fallbackUsed: false,
      attempts: [{ adapterId: "yami-catalog-search", status: "succeeded" }],
      proposalReview: {
        status: "not-provided",
        acceptedFields: [],
        rejectedFields: [],
        warnings: [],
      },
      intent: {
        source: "catalog-evidence",
        themeType: "brand",
        catalogDomain: "beauty",
        attributeSchemaVersion: "catalog-v1",
        entityType: "brand",
        canonicalEntity: { id: "1", label: "ANUA" },
        shoppingIntent: "browse-brand",
        shoppingGoal: "Browse ANUA products",
        needs: [],
        mustInclude: ["ANUA"],
        mustExclude: [],
        searchTerms: ["ANUA"],
        categories: [],
        reason: "Exact catalog brand match.",
        confidence: 0.96,
      },
      snapshot: {
        keyword: "ANUA",
        site: "us",
        sourceUrl: "https://example.com/search?q=ANUA",
        fetchedAt: "2026-08-16T00:00:00.000Z",
        provider: "yami-catalog-search",
        products: [{
          id: "1001",
          title: "ANUA Toner",
          brand: "ANUA",
          price: "$19.99",
          imageUrl: "https://example.com/1001.webp",
          productUrl: "https://example.com/1001",
          sourceRank: 1,
          categoryL1Name: "Beauty",
        }],
      },
    } satisfies TopicIntentAnalysis;

    expect(buildTopicIntentReport(analysis)).toMatchObject({
      product: "TOPIC GENERATOR",
      schemaVersion: "theme-intent/v1",
      intent: { reason: "Exact catalog brand match." },
      evidence: {
        provider: "yami-catalog-search",
        fallbackUsed: false,
        productCount: 1,
        topProducts: [{ categoryPath: ["Beauty"] }],
      },
    });
  });

  it("keeps HTTP input validation inside the product package", async () => {
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "A" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "invalid_keyword" },
    });
  });

  it("returns CatalogSnapshot Adapter attempts when every source fails", async () => {
    const adapters: CatalogSnapshotAdapter[] = [
      {
        id: "structured",
        load: async () => {
          throw Object.assign(new Error("catalog down"), { code: "request_failed" });
        },
      },
      {
        id: "fallback",
        load: async () => {
          throw Object.assign(new Error("no cards"), { code: "no_products" });
        },
      },
    ];
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "ANUA" }),
      }),
      { adapters },
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: "catalog_unavailable",
        attempts: [
          { adapterId: "structured", errorCode: "request_failed" },
          { adapterId: "fallback", errorCode: "no_products" },
        ],
      },
    });
  });
});
