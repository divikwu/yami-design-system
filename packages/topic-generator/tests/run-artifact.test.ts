import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { TopicIntentAnalysis } from "../src/analyze.js";
import { buildTopicPagePlanMatrix } from "../src/planner.js";
import type { ThemeIntent } from "../src/types.js";
import {
  buildTopicGeneratorRunArtifacts,
  writeTopicGeneratorRunArtifacts,
} from "../src/run-artifact.js";

function analysis(): TopicIntentAnalysis {
  const intent: ThemeIntent = {
    schemaVersion: "theme-intent/v2",
    source: "catalog-evidence",
    themeType: "brand",
    catalogDomain: "Beauty",
    attributeSchemaVersion: "catalog-v1",
    entityType: "brand",
    canonicalEntity: { id: "100", label: "ANUA" },
    shoppingIntent: "browse-brand",
    shopperAction: "browse",
    shoppingGoal: "Browse ANUA products.",
    needs: ["Toners"],
    conditions: [],
    mustInclude: ["ANUA"],
    mustExclude: [],
    searchTerms: ["ANUA"],
    categories: [{
      id: "500",
      label: "Toners",
      path: ["Beauty", "Toners"],
      evidenceCount: 1,
    }],
    constraints: [{
      id: "core-entity:anua",
      kind: "core-entity",
      value: "ANUA",
      status: "verified",
      evidenceIds: ["catalog-brand:100"],
    }],
    evidenceRefs: [{
      id: "catalog-brand:100",
      source: "catalog-brand",
      label: "ANUA",
    }],
    candidates: [{
      id: "brand:brand:100:browse-brand:browse",
      themeType: "brand",
      entityType: "brand",
      canonicalEntity: { id: "100", label: "ANUA" },
      shoppingIntent: "browse-brand",
      shopperAction: "browse",
      score: 0.95,
      evidenceLevel: "high",
      reason: "Exact catalog brand evidence.",
      supportingEvidenceIds: ["catalog-brand:100"],
      competingCandidateIds: [],
    }],
    decision: {
      status: "resolved",
      selectedCandidateId: "brand:brand:100:browse-brand:browse",
      evidenceLevel: "high",
      selectedCandidateMargin: null,
      requiresAgentReview: false,
    },
    reason: "Exact catalog brand evidence.",
    confidence: 0.95,
  };
  return {
    intent,
    fallbackUsed: false,
    attempts: [{ adapterId: "yami-catalog-search", status: "succeeded" }],
    proposalReview: {
      status: "not-provided",
      acceptedFields: [],
      rejectedFields: [],
      warnings: [],
    },
    snapshot: {
      keyword: "ANUA",
      site: "us",
      sourceUrl: "https://example.com/catalog?q=ANUA",
      fetchedAt: "2026-08-17T00:00:00.000Z",
      provider: "yami-catalog-search",
      intent,
      products: [{
        id: "1001",
        title: "ANUA Heartleaf Toner",
        brand: "ANUA",
        price: "$19.99",
        imageUrl: "https://example.com/1001.webp",
        productUrl: "https://example.com/1001",
        sourceRank: 1,
        categoryL1Name: "Beauty",
        categoryL3Name: "Toners",
      }],
      evidence: {
        brands: [{ id: "100", label: "ANUA", aliases: ["ANUA"], resultCount: 1 }],
        categories: [{
          id: "500",
          label: "Toners",
          aliases: ["Toners"],
          path: ["Beauty", "Toners"],
          resultCount: 1,
          productCount: 1,
        }],
        attributes: [],
      },
    },
  };
}

describe("RunArtifact Module", () => {
  it("builds hashed artifacts and writes them only to an explicit output directory", async () => {
    const result = analysis();
    const artifacts = buildTopicGeneratorRunArtifacts(
      result,
      buildTopicPagePlanMatrix(result.snapshot),
    );
    const directory = await mkdtemp(join(tmpdir(), "topic-generator-run-"));

    try {
      const runDirectory = await writeTopicGeneratorRunArtifacts(directory, artifacts);
      expect(runDirectory).toBe(join(directory, artifacts.manifest.runId));
      expect(artifacts.manifest).toMatchObject({
        schemaVersion: "topic-generator-run/v1",
        keyword: "ANUA",
        artifacts: [
          { name: "theme-intent", file: "theme-intent.json", schemaVersion: "theme-intent/v2" },
          { name: "catalog-snapshot", file: "catalog-snapshot.json", schemaVersion: "catalog-snapshot/v1" },
          { name: "page-plans", file: "page-plans.json", schemaVersion: "page-plans/v1" },
        ],
      });

      for (const artifact of artifacts.manifest.artifacts) {
        const contents = await readFile(join(runDirectory, artifact.file), "utf8");
        expect(createHash("sha256").update(contents).digest("hex")).toBe(artifact.sha256);
      }
      await expect(readFile(join(runDirectory, "run.json"), "utf8")).resolves.toContain(
        '"schemaVersion": "topic-generator-run/v1"',
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
