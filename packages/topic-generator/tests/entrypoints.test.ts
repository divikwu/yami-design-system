import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import {
  buildTopicIntentReport,
  parseTopicGeneratorCliArgs,
  resolveTopicGeneratorPath,
} from "../src/cli.js";
import type { TopicIntentAnalysis } from "../src/analyze.js";
import { handleTopicGeneratorPost } from "../src/server.js";
import type { CatalogSnapshotAdapter } from "../src/catalog-snapshot.js";

describe("TOPIC GENERATOR portable entry points", () => {
  it("shares one ProductSelection Skill with the restricted Kiro Agent", async () => {
    const integrationRoot = new URL("../integrations/", import.meta.url);
    const skill = await readFile(
      new URL("codex/product-selection/SKILL.md", integrationRoot),
      "utf8",
    );
    const kiroAgent = JSON.parse(await readFile(
      new URL("kiro/topic-generator.json", integrationRoot),
      "utf8",
    )) as {
      tools: string[];
      allowedTools: string[];
      resources: string[];
      permissions: { rules: Array<Record<string, unknown>> };
    };

    expect(skill).toContain(
      "description: This skill should be used when the user asks to",
    );
    expect(kiroAgent.resources).toContain(
      "skill://.kiro/skills/product-selection/SKILL.md",
    );
    expect(kiroAgent.tools).toEqual(["read", "write", "shell"]);
    expect(kiroAgent.allowedTools).toEqual(["read"]);
    expect(kiroAgent.permissions.rules).toContainEqual({
      capability: "shell",
      match: ["pnpm topic-generator:analyze *"],
      effect: "allow",
    });
  });

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
      selectionStrategy: "",
      taxonomyPath: "",
      taxonomyTsvPath: "",
      categoryProposalPath: "",
      candidateSnapshotPath: "",
      sceneProposalPath: "",
    });
    expect(parseTopicGeneratorCliArgs(["home", "storage"]).keyword).toBe("home storage");
    expect(parseTopicGeneratorCliArgs(["--", "--help"]).help).toBe(true);
  });

  it("accepts versioned ProductSelection inputs without changing the default CLI", () => {
    expect(parseTopicGeneratorCliArgs([
      "Matcha",
      "--selection-strategy", "category-role/landing-page-agent@1",
      "--taxonomy-tsv", "taxonomy.tsv",
      "--category-proposal", "categories.json",
      "--candidate-snapshot", "candidates.json",
      "--scene-proposal", "scenes.json",
    ])).toMatchObject({
      keyword: "Matcha",
      selectionStrategy: "category-role/landing-page-agent@1",
      taxonomyTsvPath: "taxonomy.tsv",
      categoryProposalPath: "categories.json",
      candidateSnapshotPath: "candidates.json",
      sceneProposalPath: "scenes.json",
    });
  });

  it("does not accept both canonical JSON and source TSV taxonomy inputs", () => {
    expect(() => parseTopicGeneratorCliArgs([
      "Matcha",
      "--taxonomy", "taxonomy.json",
      "--taxonomy-tsv", "taxonomy.tsv",
    ])).toThrow("Choose either --taxonomy or --taxonomy-tsv");
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
        schemaVersion: "theme-intent/v2",
        source: "catalog-evidence",
        themeType: "brand",
        catalogDomain: "beauty",
        attributeSchemaVersion: "catalog-v1",
        entityType: "brand",
        canonicalEntity: { id: "1", label: "ANUA" },
        shoppingIntent: "browse-brand",
        shopperAction: "browse",
        shoppingGoal: "Browse ANUA products",
        needs: [],
        conditions: [],
        mustInclude: ["ANUA"],
        mustExclude: [],
        searchTerms: ["ANUA"],
        categories: [],
        constraints: [{
          id: "core-entity:anua",
          kind: "core-entity",
          value: "ANUA",
          status: "verified",
          evidenceIds: ["catalog-brand:1"],
        }],
        evidenceRefs: [{
          id: "catalog-brand:1",
          source: "catalog-brand",
          label: "ANUA",
        }],
        candidates: [{
          id: "brand:brand:1:browse-brand:browse",
          themeType: "brand",
          entityType: "brand",
          canonicalEntity: { id: "1", label: "ANUA" },
          shoppingIntent: "browse-brand",
          shopperAction: "browse",
          score: 0.96,
          evidenceLevel: "high",
          reason: "Exact catalog brand match.",
          supportingEvidenceIds: ["catalog-brand:1"],
          competingCandidateIds: [],
        }],
        decision: {
          status: "resolved",
          selectedCandidateId: "brand:brand:1:browse-brand:browse",
          evidenceLevel: "high",
          selectedCandidateMargin: null,
          requiresAgentReview: false,
        },
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
      schemaVersion: "theme-intent/v2",
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

  it("honors the selection-only HTTP mode", async () => {
    const adapters: CatalogSnapshotAdapter[] = [{
      id: "fixture",
      load: async () => ({
        keyword: "ANUA",
        site: "us",
        sourceUrl: "https://example.com/search?q=ANUA",
        fetchedAt: "2026-08-17T00:00:00.000Z",
        provider: "yami-catalog-search",
        products: ["1", "2", "3"].map((id, index) => ({
          id,
          title: `ANUA product ${id}`,
          brand: "ANUA",
          price: "$19.99",
          imageUrl: `https://example.com/${id}.webp`,
          productUrl: `https://example.com/${id}`,
          sourceRank: index + 1,
        })),
        evidence: {
          brands: [{ id: "anua", label: "ANUA", aliases: ["ANUA"], resultCount: 3 }],
          categories: [],
          attributes: [],
        },
      }),
    }];
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "ANUA", mode: "selection" }),
      }),
      { adapters },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      plans: {
        en: {
          relevance: {
            generationMode: "selection",
            modules: [],
            content: { copyMode: "not-generated" },
            assetStrategy: { mode: "not-generated" },
          },
        },
      },
    });
  });

  it("reports category-role as blocked instead of inferring categories from search results", async () => {
    const adapters: CatalogSnapshotAdapter[] = [{
      id: "fixture",
      load: async () => ({
        keyword: "Matcha",
        site: "us",
        sourceUrl: "https://example.com/search?q=Matcha",
        fetchedAt: "2026-08-18T00:00:00.000Z",
        provider: "yami-catalog-search",
        products: ["1", "2", "3"].map((id, index) => ({
          id,
          title: `Matcha product ${id}`,
          brand: "Matcha",
          price: "$1.00",
          imageUrl: `https://example.com/${id}.webp`,
          productUrl: `https://example.com/${id}`,
          sourceRank: index + 1,
        })),
        evidence: {
          brands: [{ id: "matcha", label: "Matcha", aliases: ["Matcha"], resultCount: 3 }],
          categories: [],
          attributes: [],
        },
      }),
    }];
    const response = await handleTopicGeneratorPost(
      new Request("http://localhost/api/topic-generator", {
        method: "POST",
        body: JSON.stringify({ keyword: "Matcha", strategy: "category-role" }),
      }),
      { adapters },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      selectionRuns: {
        "category-role": {
          status: "blocked",
          strategyRef: "category-role/landing-page-agent@1",
          issues: ["CategoryRole selection requires a CatalogTaxonomySnapshot."],
        },
      },
      plans: {
        en: { relevance: { selectionStrategy: { id: "relevance" } } },
      },
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
